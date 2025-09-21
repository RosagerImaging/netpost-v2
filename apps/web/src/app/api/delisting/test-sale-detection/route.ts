/**
 * Test endpoint for sale detection system
 * Development tool for testing webhooks and polling
 * Author: BMad Development Agent (James) - Story 1.7
 * Date: 2025-09-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { testWebhook } from '@/lib/webhooks/webhook-handler';
import { testPolling } from '@/lib/polling/sale-poller';
import { processSaleEventQueue, getQueueStats } from '@/lib/queues/sale-event-queue';
import { createClient } from '@/lib/supabase/server';
import { MarketplaceType } from '@netpost/shared-types';

/**
 * Test sale detection system
 * POST /api/delisting/test-sale-detection
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Test endpoint only available in development' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, marketplace, payload, userId } = body;

    switch (type) {
      case 'webhook':
        const webhookResult = await testWebhook(marketplace as MarketplaceType, payload);
        return NextResponse.json({
          success: true,
          type: 'webhook_test',
          result: webhookResult,
        });

      case 'polling':
        if (!userId) {
          return NextResponse.json({ error: 'userId required for polling test' }, { status: 400 });
        }
        const pollingResult = await testPolling(userId, marketplace as MarketplaceType);
        return NextResponse.json({
          success: true,
          type: 'polling_test',
          result: pollingResult,
        });

      case 'queue':
        const queueResult = await processSaleEventQueue();
        return NextResponse.json({
          success: true,
          type: 'queue_processing',
          result: queueResult,
        });

      case 'stats':
        const stats = await getQueueStats();
        return NextResponse.json({
          success: true,
          type: 'queue_stats',
          result: stats,
        });

      case 'create_test_event':
        const testEventResult = await createTestSaleEvent(body);
        return NextResponse.json({
          success: true,
          type: 'test_event_created',
          result: testEventResult,
        });

      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Test sale detection error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

/**
 * Get sale detection system status
 * GET /api/delisting/test-sale-detection
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Test endpoint only available in development' }, { status: 403 });
  }

  try {
    const supabase = createClient();

    // Get recent sale events
    const { data: recentEvents } = await supabase
      .from('sale_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent delisting jobs
    const { data: recentJobs } = await supabase
      .from('delisting_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get queue stats
    const queueStats = await getQueueStats();

    return NextResponse.json({
      success: true,
      system_status: {
        recent_events: recentEvents || [],
        recent_jobs: recentJobs || [],
        queue_stats: queueStats,
        webhook_endpoints: [
          '/api/webhooks/ebay',
          '/api/webhooks/poshmark',
          '/api/webhooks/facebook-marketplace',
        ],
      },
    });

  } catch (error) {
    console.error('Error getting sale detection status:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

/**
 * Create a test sale event for development
 */
async function createTestSaleEvent(params: any) {
  const supabase = createClient();

  try {
    const {
      userId = 'test-user-id',
      marketplace = 'ebay',
      externalListingId = 'test-listing-123',
      salePrice = 25.99,
      inventoryItemId,
    } = params;

    // Create a test sale event
    const { data: saleEvent, error } = await supabase
      .from('sale_events')
      .insert({
        user_id: userId,
        inventory_item_id: inventoryItemId,
        marketplace_type: marketplace,
        event_type: 'test_sale',
        external_event_id: `test_${Date.now()}`,
        external_listing_id: externalListingId,
        external_transaction_id: `txn_${Date.now()}`,
        sale_price: salePrice,
        sale_currency: 'USD',
        sale_date: new Date().toISOString(),
        buyer_id: 'test_buyer',
        payment_status: 'completed',
        raw_webhook_data: {
          test: true,
          created_at: new Date().toISOString(),
        },
        verified: true,
        processed: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      sale_event: saleEvent,
      message: 'Test sale event created successfully',
    };

  } catch (error) {
    throw new Error(`Failed to create test sale event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}