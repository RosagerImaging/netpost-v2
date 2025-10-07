/**
 * Polling service for marketplaces that don't support webhooks
 * Periodically checks for sales and creates sale events
 * Author: BMad Development Agent (James) - Story 1.7
 * Date: 2025-09-18
 */

import { createClient } from '@/lib/supabase/server';
import { createAdapter } from '@/lib/marketplaces';
import { retryWithBackoff } from '@/lib/utils/concurrency';
import {
  MarketplaceType,
  ProcessSaleEventRequest,
  ProcessSaleEventResponse,
} from '@netpost/shared-types';
import crypto from 'crypto';

// Circuit breaker state for each marketplace
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  resetTimeoutMs: 60000, // Try again after 1 minute
  halfOpenMaxAttempts: 3, // Allow 3 attempts in half-open state
};

interface PollingConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxItemsPerPoll: number;
  lookbackDays: number;
}

const POLLING_CONFIGS: Record<MarketplaceType, PollingConfig> = {
  // Webhooks supported - no polling needed
  ebay: { enabled: false, intervalMinutes: 0, maxItemsPerPoll: 0, lookbackDays: 0 },
  poshmark: { enabled: false, intervalMinutes: 0, maxItemsPerPoll: 0, lookbackDays: 0 },
  facebook_marketplace: { enabled: false, intervalMinutes: 0, maxItemsPerPoll: 0, lookbackDays: 0 },

  // Polling required
  mercari: { enabled: true, intervalMinutes: 15, maxItemsPerPoll: 100, lookbackDays: 1 },
  depop: { enabled: true, intervalMinutes: 30, maxItemsPerPoll: 50, lookbackDays: 2 },
  vinted: { enabled: true, intervalMinutes: 30, maxItemsPerPoll: 50, lookbackDays: 2 },
  grailed: { enabled: true, intervalMinutes: 60, maxItemsPerPoll: 25, lookbackDays: 3 },
  the_realreal: { enabled: true, intervalMinutes: 60, maxItemsPerPoll: 25, lookbackDays: 3 },
  vestiaire_collective: { enabled: true, intervalMinutes: 60, maxItemsPerPoll: 25, lookbackDays: 3 },
  tradesy: { enabled: true, intervalMinutes: 60, maxItemsPerPoll: 25, lookbackDays: 3 },
  etsy: { enabled: true, intervalMinutes: 30, maxItemsPerPoll: 50, lookbackDays: 2 },
  amazon: { enabled: true, intervalMinutes: 15, maxItemsPerPoll: 100, lookbackDays: 1 },
  shopify: { enabled: true, intervalMinutes: 15, maxItemsPerPoll: 100, lookbackDays: 1 },
  custom: { enabled: true, intervalMinutes: 60, maxItemsPerPoll: 25, lookbackDays: 3 },
};

/**
 * Get or initialize circuit breaker state
 */
function getCircuitBreakerState(key: string): CircuitBreakerState {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
    });
  }
  return circuitBreakers.get(key)!;
}

/**
 * Check if circuit breaker allows request
 */
function canExecute(key: string): boolean {
  const breaker = getCircuitBreakerState(key);
  const now = Date.now();

  if (breaker.state === 'closed') {
    return true;
  }

  if (breaker.state === 'open') {
    // Check if enough time has passed to try again
    if (now - breaker.lastFailureTime >= CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
      breaker.state = 'half-open';
      breaker.failures = 0;
      return true;
    }
    return false;
  }

  // half-open state - allow limited attempts
  return breaker.failures < CIRCUIT_BREAKER_CONFIG.halfOpenMaxAttempts;
}

/**
 * Record success for circuit breaker
 */
function recordSuccess(key: string): void {
  const breaker = getCircuitBreakerState(key);
  breaker.failures = 0;
  breaker.state = 'closed';
}

/**
 * Record failure for circuit breaker
 */
function recordFailure(key: string): void {
  const breaker = getCircuitBreakerState(key);
  breaker.failures++;
  breaker.lastFailureTime = Date.now();

  if (breaker.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    breaker.state = 'open';
    console.warn(`Circuit breaker opened for ${key} after ${breaker.failures} failures`);
  }
}

/**
 * Generate event hash for deduplication (consistent with webhook handler)
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
 * Save sale event from polling data
 */
async function saveSaleEventFromPolling(
  marketplace: MarketplaceType,
  listingData: Record<string, unknown>,
  userId: string,
  inventoryItemId?: string,
  listingId?: string
): Promise<ProcessSaleEventResponse> {
  const supabase = await createClient();

  try {
    // Skip processing for custom marketplaces as they don't have standardized polling
    if (marketplace === 'custom') {
      return {
        success: false,
        error: 'Custom marketplaces do not support automated sale detection via polling',
      };
    }

    // Skip processing for marketplaces not supported by delisting system
    const unsupportedMarketplaces = ['amazon', 'shopify', 'tradesy', 'the_realreal', 'vestiaire_collective'];
    if (unsupportedMarketplaces.includes(marketplace)) {
      return {
        success: false,
        error: `Marketplace '${marketplace}' does not currently support polling-based sale detection`,
      };
    }

    // Extract sale information from marketplace-specific data
    let saleEventRequest: ProcessSaleEventRequest;

    switch (marketplace) {
      case 'mercari':
        saleEventRequest = {
          marketplace_type: 'mercari',
          event_type: 'item_sold',
          external_event_id: `${listingData.id}_sold_${listingData.sold_date}`,
          external_listing_id: listingData.id,
          external_transaction_id: listingData.transaction_id,
          sale_price: listingData.sold_price,
          sale_currency: listingData.currency || 'USD',
          sale_date: listingData.sold_date,
          buyer_id: listingData.buyer_id,
          payment_status: listingData.payment_status || 'completed',
          raw_data: listingData,
        };
        break;

      case 'depop':
        saleEventRequest = {
          marketplace_type: 'depop',
          event_type: 'product_sold',
          external_event_id: `${listingData.id}_${listingData.dateUpdated}`,
          external_listing_id: listingData.id,
          external_transaction_id: listingData.receipt?.id,
          sale_price: listingData.price?.priceCents / 100,
          sale_currency: listingData.price?.currencyCode || 'USD',
          sale_date: listingData.receipt?.dateCreated,
          buyer_id: listingData.receipt?.buyerUser?.id,
          payment_status: 'completed',
          raw_data: listingData,
        };
        break;

      case 'etsy':
        saleEventRequest = {
          marketplace_type: 'etsy',
          event_type: 'listing_sold',
          external_event_id: `${listingData.listing_id}_${listingData.last_modified_tsz}`,
          external_listing_id: listingData.listing_id.toString(),
          external_transaction_id: listingData.receipt_id?.toString(),
          sale_price: listingData.price,
          sale_currency: listingData.currency_code || 'USD',
          sale_date: new Date(listingData.last_modified_tsz * 1000).toISOString(),
          buyer_id: listingData.buyer_user_id?.toString(),
          payment_status: 'completed',
          raw_data: listingData,
        };
        break;

      default:
        // Generic handling for other supported marketplaces (ebay, poshmark, facebook_marketplace, vinted, grailed)
        saleEventRequest = {
          marketplace_type: marketplace as 'ebay' | 'poshmark' | 'facebook_marketplace' | 'vinted' | 'grailed',
          event_type: 'item_sold',
          external_event_id: `${listingData.id || listingData.listing_id}_polling`,
          external_listing_id: (listingData.id || listingData.listing_id)?.toString(),
          external_transaction_id: listingData.transaction_id?.toString(),
          sale_price: listingData.price || listingData.sale_price,
          sale_currency: listingData.currency || 'USD',
          sale_date: listingData.sold_date || listingData.sale_date,
          buyer_id: listingData.buyer_id?.toString(),
          payment_status: listingData.payment_status || 'completed',
          raw_data: listingData,
        };
    }

    // Generate event hash for deduplication
    const eventHash = generateEventHash(
      marketplace,
      saleEventRequest.external_event_id || '',
      saleEventRequest.external_listing_id || '',
      saleEventRequest.sale_price,
      saleEventRequest.sale_date
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

    // Create sale event
    const { data: saleEvent, error } = await supabase
      .from('sale_events')
      .insert({
        user_id: userId,
        inventory_item_id: inventoryItemId,
        listing_id: listingId,
        marketplace_type: marketplace,
        event_type: saleEventRequest.event_type,
        external_event_id: saleEventRequest.external_event_id,
        external_listing_id: saleEventRequest.external_listing_id,
        external_transaction_id: saleEventRequest.external_transaction_id,
        sale_price: saleEventRequest.sale_price,
        sale_currency: saleEventRequest.sale_currency,
        sale_date: saleEventRequest.sale_date,
        buyer_id: saleEventRequest.buyer_id,
        payment_status: saleEventRequest.payment_status,
        raw_polling_data: saleEventRequest.raw_data,
        event_hash: eventHash,
        verified: true, // Polling data is considered verified
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving sale event from polling:', error);
      return {
        success: false,
        error: 'Failed to save sale event',
      };
    }

    // Process the sale event to create delisting job if applicable
    if (inventoryItemId) {
      const { data: jobId, error: processError } = await supabase
        .rpc('process_sale_event', { sale_event_id: saleEvent.id });

      if (processError) {
        console.error('Error processing sale event from polling:', processError);
        // Don't fail the polling, just log the error
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
    };

  } catch (error) {
    console.error('Error in saveSaleEventFromPolling:', error);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Poll a single user's listings for a specific marketplace
 */
async function pollUserListings(
  userId: string,
  marketplace: MarketplaceType
): Promise<{
  success: boolean;
  salesFound: number;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    console.log(`Polling ${marketplace} listings for user ${userId}`);

    // Get user's marketplace connection with credentials
    const { data: connection } = await supabase
      .from('marketplace_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('marketplace_type', marketplace)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();

    if (!connection) {
      return {
        success: false,
        salesFound: 0,
        error: 'No active marketplace connection found',
      };
    }

    // Get user's active listings on this marketplace
    const { data: listings } = await supabase
      .from('listings')
      .select('id, inventory_item_id, external_listing_id')
      .eq('user_id', userId)
      .eq('marketplace_type', marketplace)
      .in('status', ['active', 'pending'])
      .eq('deleted_at', null);

    if (!listings || listings.length === 0) {
      return {
        success: true,
        salesFound: 0,
        error: 'No active listings found',
      };
    }

    console.log(`Found ${listings.length} active listings to poll`);

    // Extract credentials from connection
    const credentials = {
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      api_key: connection.api_key,
      api_secret: connection.api_secret,
      client_id: connection.client_id,
      client_secret: connection.client_secret,
      token_type: connection.token_type || 'Bearer',
    };

    // Create marketplace adapter
    const adapter = await createAdapter(connection, credentials);
    if (!adapter) {
      return {
        success: false,
        salesFound: 0,
        error: 'Failed to create marketplace adapter',
      };
    }

    let salesFound = 0;
    const config = POLLING_CONFIGS[marketplace];

    // Poll listings in batches
    for (let i = 0; i < listings.length; i += config.maxItemsPerPoll) {
      const batch = listings.slice(i, i + config.maxItemsPerPoll);

      for (const listing of batch) {
        try {
          // Get current listing status from marketplace
          const marketplaceListing = await adapter.getListingById(listing.external_listing_id);

          // Check if listing is sold
          if (marketplaceListing.status === 'sold') {
            console.log(`Found sold listing: ${listing.external_listing_id}`);

            // Update our listing status first
            await supabase
              .from('listings')
              .update({
                status: 'sold',
                sale_price: marketplaceListing.sale_price,
                sale_date: marketplaceListing.sale_date,
                updated_at: new Date().toISOString(),
              })
              .eq('id', listing.id);

            // Create sale event
            const saleEventResult = await saveSaleEventFromPolling(
              marketplace,
              marketplaceListing,
              userId,
              listing.inventory_item_id,
              listing.id
            );

            if (saleEventResult.success && !saleEventResult.duplicate) {
              salesFound++;
            }
          }

        } catch (error) {
          console.error(`Error polling listing ${listing.external_listing_id}:`, error);
          // Continue with other listings
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + config.maxItemsPerPoll < listings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Polling complete for ${marketplace}: ${salesFound} sales found`);

    return {
      success: true,
      salesFound,
    };

  } catch (error) {
    console.error(`Error polling ${marketplace} for user ${userId}:`, error);
    return {
      success: false,
      salesFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Poll all users for a specific marketplace
 * Uses circuit breaker and exponential backoff for resilience
 */
async function pollMarketplace(marketplace: MarketplaceType): Promise<{
  success: boolean;
  usersPolled: number;
  totalSalesFound: number;
  error?: string;
}> {
  const config = POLLING_CONFIGS[marketplace];
  if (!config.enabled) {
    return {
      success: true,
      usersPolled: 0,
      totalSalesFound: 0,
      error: 'Polling disabled for this marketplace',
    };
  }

  // Check circuit breaker
  const circuitKey = `polling:${marketplace}`;
  if (!canExecute(circuitKey)) {
    const breaker = getCircuitBreakerState(circuitKey);
    console.warn(
      `Circuit breaker is ${breaker.state} for ${marketplace}. ` +
      `Skipping poll. Will retry after ${CIRCUIT_BREAKER_CONFIG.resetTimeoutMs}ms`
    );
    return {
      success: false,
      usersPolled: 0,
      totalSalesFound: 0,
      error: `Circuit breaker ${breaker.state}`,
    };
  }

  const supabase = await createClient();

  try {
    // Get all users with active connections to this marketplace
    const { data: connections } = await supabase
      .from('marketplace_connections')
      .select('user_id')
      .eq('marketplace_type', marketplace)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (!connections || connections.length === 0) {
      recordSuccess(circuitKey);
      return {
        success: true,
        usersPolled: 0,
        totalSalesFound: 0,
        error: 'No users with active connections',
      };
    }

    console.log(`Polling ${marketplace}: ${connections.length} users to check`);

    let totalSalesFound = 0;
    let usersPolled = 0;
    let consecutiveFailures = 0;

    // Poll each user with exponential backoff on failures
    for (const connection of connections) {
      try {
        // Use retry with exponential backoff for each user poll
        const result = await retryWithBackoff(
          () => pollUserListings(connection.user_id, marketplace),
          {
            maxRetries: 3,
            initialDelayMs: 1000,
            maxDelayMs: 10000,
            backoffMultiplier: 2,
            onRetry: (attempt, error) => {
              console.warn(
                `Retry ${attempt}/3 for user ${connection.user_id} on ${marketplace}: ${error.message}`
              );
            },
          }
        );

        if (result.success) {
          totalSalesFound += result.salesFound;
          consecutiveFailures = 0; // Reset on success
        } else {
          consecutiveFailures++;
        }
        usersPolled++;

        // Adaptive delay based on consecutive failures
        const delay = consecutiveFailures > 0
          ? Math.min(500 * Math.pow(2, consecutiveFailures), 5000)
          : 500;
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        console.error(`Error polling user ${connection.user_id}:`, error);
        // Continue with other users
      }
    }

    console.log(`Marketplace polling complete: ${marketplace}, ${usersPolled} users, ${totalSalesFound} sales`);

    // Record success in circuit breaker
    recordSuccess(circuitKey);

    return {
      success: true,
      usersPolled,
      totalSalesFound,
    };

  } catch (error) {
    console.error(`Error polling marketplace ${marketplace}:`, error);

    // Record failure in circuit breaker
    recordFailure(circuitKey);

    return {
      success: false,
      usersPolled: 0,
      totalSalesFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Main polling function - polls all enabled marketplaces
 */
export async function pollAllMarketplaces(): Promise<{
  success: boolean;
  results: Partial<Record<MarketplaceType, unknown>>;
  totalSalesFound: number;
}> {
  console.log('Starting marketplace polling cycle');

  const results: Partial<Record<MarketplaceType, unknown>> = {};
  let totalSalesFound = 0;

  // Poll each marketplace that has polling enabled
  for (const [marketplace, config] of Object.entries(POLLING_CONFIGS)) {
    if (config.enabled) {
      const result = await pollMarketplace(marketplace as MarketplaceType);
      results[marketplace as MarketplaceType] = result;
      totalSalesFound += result.totalSalesFound;

      // Delay between marketplaces
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`Polling cycle complete: ${totalSalesFound} total sales found`);

  return {
    success: true,
    results,
    totalSalesFound,
  };
}

/**
 * Get polling status and statistics
 */
export async function getPollingStatus(): Promise<{
  enabled_marketplaces: MarketplaceType[];
  last_poll_results: Partial<Record<MarketplaceType, unknown>>;
  next_poll_times: Partial<Record<MarketplaceType, string>>;
}> {
  const enabledMarketplaces = Object.entries(POLLING_CONFIGS)
    .filter(([_, config]) => config.enabled)
    .map(([marketplace]) => marketplace as MarketplaceType);

  // Calculate next poll times based on intervals
  const nextPollTimes: Partial<Record<MarketplaceType, string>> = {};
  const now = new Date();

  for (const marketplace of enabledMarketplaces) {
    const config = POLLING_CONFIGS[marketplace];
    const nextPoll = new Date(now.getTime() + config.intervalMinutes * 60 * 1000);
    nextPollTimes[marketplace] = nextPoll.toISOString();
  }

  // TODO: Get last poll results from a polling status table
  const lastPollResults: Partial<Record<MarketplaceType, unknown>> = {};

  return {
    enabled_marketplaces: enabledMarketplaces,
    last_poll_results: lastPollResults,
    next_poll_times: nextPollTimes,
  };
}

/**
 * Test polling for a specific user and marketplace (development only)
 */
export async function testPolling(
  userId: string,
  marketplace: MarketplaceType
): Promise<unknown> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Test polling only available in development');
  }

  console.log(`Testing polling for user ${userId} on ${marketplace}`);
  return await pollUserListings(userId, marketplace);
}