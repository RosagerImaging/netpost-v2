/**
 * Central webhook handler for marketplace sale notifications
 * Processes incoming webhooks and creates sale events for de-listing
 * Author: BMad Development Agent (James) - Story 1.7
 * Date: 2025-09-18
 *
 * SECURITY: All webhook payloads are validated and typed
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import {
  ProcessSaleEventRequest,
  ProcessSaleEventResponse,
  EBayWebhookPayload,
  PoshmarkWebhookPayload,
  FacebookWebhookPayload,
  MarketplaceType,
} from '@netpost/shared-types';

// ============================================================================
// Webhook Payload Type Definitions
// ============================================================================

/**
 * Generic marketplace webhook payload
 * Union type of all supported marketplace payloads from shared-types
 */
type MarketplaceWebhookPayload =
  | EBayWebhookPayload
  | PoshmarkWebhookPayload
  | FacebookWebhookPayload
  | Record<string, unknown>;

/**
 * Webhook signature verification
 */
interface WebhookConfig {
  secret: string;
  signatureHeader: string;
  signaturePrefix?: string;
}

/**
 * Get webhook secret with validation
 * Throws descriptive error if secret is missing
 */
function getWebhookSecret(marketplace: MarketplaceType, envVarName: string): string {
  const secret = process.env[envVarName];

  if (!secret) {
    throw new Error(
      `Missing webhook secret for ${marketplace}. ` +
      `Please set ${envVarName} environment variable. ` +
      `Webhooks for ${marketplace} will not work without this configuration.`
    );
  }

  return secret;
}

/**
 * Initialize webhook configs with runtime validation
 * This function is called lazily to provide better error messages
 */
function getWebhookConfig(marketplace: MarketplaceType): WebhookConfig {
  const configs: Record<MarketplaceType, () => WebhookConfig> = {
    ebay: () => ({
      secret: getWebhookSecret('ebay', 'EBAY_WEBHOOK_SECRET'),
      signatureHeader: 'x-ebay-signature',
      signaturePrefix: 'sha256=',
    }),
    poshmark: () => ({
      secret: getWebhookSecret('poshmark', 'POSHMARK_WEBHOOK_SECRET'),
      signatureHeader: 'x-poshmark-signature',
      signaturePrefix: 'sha256=',
    }),
    facebook_marketplace: () => ({
      secret: getWebhookSecret('facebook_marketplace', 'FACEBOOK_WEBHOOK_SECRET'),
      signatureHeader: 'x-hub-signature-256',
      signaturePrefix: 'sha256=',
    }),
    mercari: () => ({
      secret: getWebhookSecret('mercari', 'MERCARI_WEBHOOK_SECRET'),
      signatureHeader: 'x-mercari-signature',
    }),
    depop: () => ({
      secret: getWebhookSecret('depop', 'DEPOP_WEBHOOK_SECRET'),
      signatureHeader: 'x-depop-signature',
    }),
    vinted: () => ({
      secret: getWebhookSecret('vinted', 'VINTED_WEBHOOK_SECRET'),
      signatureHeader: 'x-vinted-signature',
    }),
    grailed: () => ({
      secret: getWebhookSecret('grailed', 'GRAILED_WEBHOOK_SECRET'),
      signatureHeader: 'x-grailed-signature',
    }),
    the_realreal: () => ({
      secret: getWebhookSecret('the_realreal', 'THE_REALREAL_WEBHOOK_SECRET'),
      signatureHeader: 'x-realreal-signature',
    }),
    vestiaire_collective: () => ({
      secret: getWebhookSecret('vestiaire_collective', 'VESTIAIRE_WEBHOOK_SECRET'),
      signatureHeader: 'x-vestiaire-signature',
    }),
    tradesy: () => ({
      secret: getWebhookSecret('tradesy', 'TRADESY_WEBHOOK_SECRET'),
      signatureHeader: 'x-tradesy-signature',
    }),
    etsy: () => ({
      secret: getWebhookSecret('etsy', 'ETSY_WEBHOOK_SECRET'),
      signatureHeader: 'x-etsy-signature',
    }),
    amazon: () => ({
      secret: getWebhookSecret('amazon', 'AMAZON_WEBHOOK_SECRET'),
      signatureHeader: 'x-amzn-signature',
    }),
    shopify: () => ({
      secret: getWebhookSecret('shopify', 'SHOPIFY_WEBHOOK_SECRET'),
      signatureHeader: 'x-shopify-hmac-sha256',
    }),
    custom: () => ({
      secret: getWebhookSecret('custom', 'CUSTOM_WEBHOOK_SECRET'),
      signatureHeader: 'x-signature',
    }),
  };

  const configFactory = configs[marketplace];
  if (!configFactory) {
    throw new Error(`Unsupported marketplace: ${marketplace}`);
  }

  return configFactory();
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  prefix?: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    const providedSignature = prefix
      ? signature.replace(prefix, '')
      : signature;

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Extract user ID from external listing ID
 * This requires looking up the listing in our database
 */
async function getUserIdFromExternalListingId(
  marketplace: MarketplaceType,
  externalListingId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from('listings')
    .select('user_id')
    .eq('marketplace_type', marketplace)
    .eq('external_listing_id', externalListingId)
    .single();

  if (error) {
    console.error('Error finding listing:', error);
    return null;
  }

  return listing?.user_id || null;
}

/**
 * Generate event hash for deduplication
 */
function generateEventHash(
  marketplace: MarketplaceType,
  externalEventId: string,
  externalListingId: string,
  salePrice?: number,
  saleDate?: string
): string {
  const hashInput = [
    marketplace,
    externalEventId,
    externalListingId,
    salePrice?.toString() || '',
    saleDate || '',
  ].join('|');

  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Process eBay webhook payload
 */
async function processEBayWebhook(payload: EBayWebhookPayload): Promise<ProcessSaleEventRequest> {
  return {
    marketplace_type: 'ebay',
    event_type: payload.eBayEventType,
    external_event_id: payload.notificationId,
    external_listing_id: payload.itemId,
    external_transaction_id: payload.transactionId,
    sale_price: payload.currentPrice.amount,
    sale_currency: payload.currentPrice.currency,
    sale_date: payload.saleDate,
    buyer_id: payload.buyerId,
    payment_status: payload.paymentStatus,
    raw_data: payload,
  };
}

/**
 * Process Poshmark webhook payload
 */
async function processPoshmarkWebhook(payload: PoshmarkWebhookPayload): Promise<ProcessSaleEventRequest> {
  return {
    marketplace_type: 'poshmark',
    event_type: payload.event_type,
    external_event_id: payload.event_id,
    external_listing_id: payload.data.listing_id,
    external_transaction_id: payload.data.transaction_id,
    sale_price: payload.data.price,
    sale_currency: payload.data.currency,
    sale_date: payload.data.sold_at,
    buyer_id: payload.data.buyer_username,
    payment_status: payload.data.payment_status,
    raw_data: payload,
  };
}

/**
 * Process Facebook Marketplace webhook payload
 */
async function processFacebookWebhook(payload: FacebookWebhookPayload): Promise<ProcessSaleEventRequest | null> {
  // Facebook sends multiple changes in an entry
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field === 'marketplace_listing' && change.value.status === 'sold') {
        return {
          marketplace_type: 'facebook_marketplace',
          event_type: 'listing_status_changed',
          external_event_id: `${entry.id}_${entry.time}`,
          external_listing_id: change.value.marketplace_listing_id,
          external_transaction_id: change.value.transaction_id,
          sale_price: change.value.sale_price,
          sale_currency: change.value.currency || 'USD',
          sale_date: change.value.sold_at,
          buyer_id: change.value.buyer_id,
          payment_status: 'completed', // Facebook typically sends this after payment
          raw_data: payload,
        };
      }
    }
  }
  return null;
}

/**
 * Save sale event to database
 */
async function saveSaleEvent(
  request: ProcessSaleEventRequest,
  userId: string
): Promise<ProcessSaleEventResponse> {
  const supabase = await createClient();

  try {
    // Generate event hash for deduplication
    const eventHash = generateEventHash(
      request.marketplace_type,
      request.external_event_id || '',
      request.external_listing_id || '',
      request.sale_price,
      request.sale_date
    );

    // Check for duplicates
    const { data: existingEvent } = await supabase
      .from('sale_events')
      .select('id')
      .eq('event_hash', eventHash)
      .single();

    if (existingEvent) {
      return {
        success: true,
        event_id: existingEvent.id,
        duplicate: true,
      };
    }

    // Get inventory item and listing info
    const { data: listing } = await supabase
      .from('listings')
      .select('id, inventory_item_id')
      .eq('marketplace_type', request.marketplace_type)
      .eq('external_listing_id', request.external_listing_id)
      .single();

    // Create sale event
    const { data: saleEvent, error } = await supabase
      .from('sale_events')
      .insert({
        user_id: userId,
        inventory_item_id: listing?.inventory_item_id,
        listing_id: listing?.id,
        marketplace_type: request.marketplace_type,
        event_type: request.event_type,
        external_event_id: request.external_event_id,
        external_listing_id: request.external_listing_id,
        external_transaction_id: request.external_transaction_id,
        sale_price: request.sale_price,
        sale_currency: request.sale_currency,
        sale_date: request.sale_date,
        buyer_id: request.buyer_id,
        payment_status: request.payment_status,
        raw_webhook_data: request.raw_data,
        event_hash: eventHash,
        verified: true, // Webhook events are considered verified
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving sale event:', error);
      return {
        success: false,
        error: 'Failed to save sale event',
      };
    }

    // Process the sale event to create delisting job if applicable
    if (listing?.inventory_item_id) {
      const { data: jobId, error: processError } = await supabase
        .rpc('process_sale_event', { sale_event_id: saleEvent.id });

      if (processError) {
        console.error('Error processing sale event:', processError);
        // Don't fail the webhook, just log the error
      }

      return {
        success: true,
        event_id: saleEvent.id,
        job_id: jobId,
        duplicate: false,
      };
    }

    return {
      success: true,
      event_id: saleEvent.id,
      duplicate: false,
      requires_verification: !listing, // Needs verification if listing not found
    };

  } catch (error) {
    console.error('Error in saveSaleEvent:', error);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Main webhook handler
 */
export async function handleWebhook(
  marketplace: MarketplaceType,
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Get webhook config with validation
    let config: WebhookConfig;
    try {
      config = getWebhookConfig(marketplace);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Webhook configuration error for ${marketplace}:`, errorMessage);
      return NextResponse.json(
        { error: 'Webhook not configured', details: errorMessage },
        { status: 501 }
      );
    }

    // Get request body and signature
    const payload = await request.text();
    const signature = request.headers.get(config.signatureHeader);

    if (!signature) {
      console.error(`Missing signature header: ${config.signatureHeader}`);
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify signature
    const isValidSignature = verifyWebhookSignature(
      payload,
      signature,
      config.secret,
      config.signaturePrefix
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse payload with type safety
    let parsedPayload: MarketplaceWebhookPayload;
    try {
      parsedPayload = JSON.parse(payload) as MarketplaceWebhookPayload;
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Process marketplace-specific payload
    let saleEventRequest: ProcessSaleEventRequest | null = null;

    switch (marketplace) {
      case 'ebay':
        saleEventRequest = await processEBayWebhook(parsedPayload as EBayWebhookPayload);
        break;
      case 'poshmark':
        saleEventRequest = await processPoshmarkWebhook(parsedPayload as PoshmarkWebhookPayload);
        break;
      case 'facebook_marketplace':
        saleEventRequest = await processFacebookWebhook(parsedPayload as FacebookWebhookPayload);
        break;
      default:
        console.error(`Unsupported marketplace webhook: ${marketplace}`);
        return NextResponse.json({ error: 'Unsupported marketplace' }, { status: 501 });
    }

    if (!saleEventRequest) {
      // Not a sale event, acknowledge but don't process
      return NextResponse.json({ success: true, message: 'Event acknowledged but not processed' });
    }

    // Get user ID from the external listing ID
    const userId = await getUserIdFromExternalListingId(
      marketplace,
      saleEventRequest.external_listing_id!
    );

    if (!userId) {
      console.error(`User not found for listing: ${saleEventRequest.external_listing_id}`);
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Save sale event and create delisting job
    const result = await saveSaleEvent(saleEventRequest, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log success
    console.log(`Webhook processed successfully:`, {
      marketplace,
      eventId: result.event_id,
      jobId: result.job_id,
      duplicate: result.duplicate,
    });

    return NextResponse.json({
      success: true,
      event_id: result.event_id,
      job_id: result.job_id,
      duplicate: result.duplicate,
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Webhook validation endpoint (for marketplace webhook setup)
 */
export async function validateWebhook(
  marketplace: MarketplaceType,
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Handle Facebook webhook verification
    if (marketplace === 'facebook_marketplace') {
      const mode = searchParams.get('hub.mode');
      const token = searchParams.get('hub.verify_token');
      const challenge = searchParams.get('hub.challenge');

      const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
      if (!verifyToken) {
        console.error('FACEBOOK_WEBHOOK_VERIFY_TOKEN not configured');
        return NextResponse.json(
          { error: 'Webhook verification not configured' },
          { status: 501 }
        );
      }

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Facebook webhook validated');
        return new NextResponse(challenge);
      }

      return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
    }

    // Handle other marketplace validations as needed
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}

/**
 * Test webhook endpoint (for development and testing only)
 * This is a separate endpoint that should ONLY be accessible via the test API route
 * NEVER use this in production webhook handlers
 */
export async function testWebhook(
  marketplace: MarketplaceType,
  testPayload: MarketplaceWebhookPayload
): Promise<ProcessSaleEventResponse> {
  // Strict environment check - only allow in development or test environments
  if (process.env.NODE_ENV === 'production') {
    console.error('Attempted to use testWebhook in production environment');
    return {
      success: false,
      error: 'Test webhooks are not available in production',
    };
  }

  console.log(`Testing webhook for ${marketplace}:`, testPayload);

  // Process the test payload directly (no signature verification for tests)
  let saleEventRequest: ProcessSaleEventRequest | null = null;

  switch (marketplace) {
    case 'ebay':
      saleEventRequest = await processEBayWebhook(testPayload as EBayWebhookPayload);
      break;
    case 'poshmark':
      saleEventRequest = await processPoshmarkWebhook(testPayload as PoshmarkWebhookPayload);
      break;
    case 'facebook_marketplace':
      saleEventRequest = await processFacebookWebhook(testPayload as FacebookWebhookPayload);
      break;
    default:
      return {
        success: false,
        error: `Test webhook not implemented for ${marketplace}`,
      };
  }

  if (saleEventRequest) {
    // For testing, use a mock user ID
    const mockUserId = (testPayload as Record<string, unknown>).mockUserId as string || 'test-user-id';
    return await saveSaleEvent(saleEventRequest, mockUserId);
  }

  return {
    success: false,
    error: 'Test webhook not available in production',
  };
}