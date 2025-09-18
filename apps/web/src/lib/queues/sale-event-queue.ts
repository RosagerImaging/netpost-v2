/**
 * Sale event processing queue with error handling and retry logic
 * Processes incoming sale events and triggers de-listing jobs
 * Author: BMad Development Agent (James) - Story 1.7
 * Date: 2025-09-18
 */

import { createClient } from '@/lib/supabase/server';
import {
  SaleEvent,
  DelistingJob,
  ProcessSaleEventResponse,
  DelistingAuditLog,
  DELISTING_ERROR_CODES,
  getRetryDelay,
} from '@netpost/shared-types';

interface QueueConfig {
  maxConcurrentJobs: number;
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
  processingIntervalMs: number;
}

const QUEUE_CONFIG: QueueConfig = {
  maxConcurrentJobs: 10,
  maxRetries: 3,
  retryDelayMs: 5000, // 5 seconds base delay
  batchSize: 50,
  processingIntervalMs: 10000, // Process every 10 seconds
};

interface ProcessingStats {
  processed: number;
  failed: number;
  retried: number;
  jobsCreated: number;
  errors: Array<{
    event_id: string;
    error: string;
    timestamp: string;
  }>;
}

/**
 * Process a single sale event
 */
async function processSaleEvent(saleEventId: string): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  retryable?: boolean;
}> {
  const supabase = createClient();

  try {
    console.log(`Processing sale event: ${saleEventId}`);

    // Get the sale event
    const { data: saleEvent, error: fetchError } = await supabase
      .from('sale_events')
      .select('*')
      .eq('id', saleEventId)
      .single();

    if (fetchError || !saleEvent) {
      return {
        success: false,
        error: `Sale event not found: ${saleEventId}`,
        retryable: false,
      };
    }

    // Skip if already processed
    if (saleEvent.processed) {
      console.log(`Sale event ${saleEventId} already processed`);
      return {
        success: true,
        jobId: saleEvent.delisting_job_id,
      };
    }

    // Skip if it's a duplicate
    if (saleEvent.is_duplicate) {
      console.log(`Sale event ${saleEventId} is a duplicate, marking as processed`);

      await supabase
        .from('sale_events')
        .update({ processed: true, updated_at: new Date().toISOString() })
        .eq('id', saleEventId);

      return {
        success: true,
      };
    }

    // Verify the sale event if not already verified
    if (!saleEvent.verified) {
      const verificationResult = await verifySaleEvent(saleEvent);
      if (!verificationResult.success) {
        // Update verification attempts
        await supabase
          .from('sale_events')
          .update({
            verification_attempts: saleEvent.verification_attempts + 1,
            verification_error: verificationResult.error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', saleEventId);

        return {
          success: false,
          error: `Sale verification failed: ${verificationResult.error}`,
          retryable: verificationResult.retryable,
        };
      }

      // Mark as verified
      await supabase
        .from('sale_events')
        .update({
          verified: true,
          verification_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saleEventId);
    }

    // Process the sale event to create delisting job
    const { data: jobId, error: processError } = await supabase
      .rpc('process_sale_event', { sale_event_id: saleEventId });

    if (processError) {
      console.error(`Error processing sale event ${saleEventId}:`, processError);

      // Update processing error
      await supabase
        .from('sale_events')
        .update({
          processing_error: processError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saleEventId);

      return {
        success: false,
        error: processError.message,
        retryable: true,
      };
    }

    console.log(`Sale event ${saleEventId} processed successfully, job created: ${jobId}`);

    // Log the successful processing
    if (jobId) {
      await supabase
        .from('delisting_audit_log')
        .insert({
          user_id: saleEvent.user_id,
          delisting_job_id: jobId,
          action: 'sale_event_processed',
          marketplace_type: saleEvent.marketplace_type,
          success: true,
          context_data: {
            sale_event_id: saleEventId,
            external_listing_id: saleEvent.external_listing_id,
            sale_price: saleEvent.sale_price,
          },
        });
    }

    return {
      success: true,
      jobId: jobId,
    };

  } catch (error) {
    console.error(`Error processing sale event ${saleEventId}:`, error);
    return {
      success: false,
      error: error.message,
      retryable: true,
    };
  }
}

/**
 * Verify a sale event by checking with the marketplace
 */
async function verifySaleEvent(saleEvent: SaleEvent): Promise<{
  success: boolean;
  error?: string;
  retryable?: boolean;
}> {
  // For webhook events, we trust the signature verification
  if (saleEvent.raw_webhook_data) {
    return { success: true };
  }

  // For polling events, we can do additional verification if needed
  if (saleEvent.raw_polling_data) {
    // The polling system already verified the data when it was collected
    return { success: true };
  }

  // If we have no source data, we need to verify with the marketplace
  try {
    // TODO: Implement marketplace-specific verification
    // This would involve calling the marketplace API to confirm the sale

    // For now, we'll mark unknown events as verified but log the concern
    console.warn(`Sale event ${saleEvent.id} has no source data, marking as verified`);
    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: `Verification failed: ${error.message}`,
      retryable: true,
    };
  }
}

/**
 * Get unprocessed sale events from the queue
 */
async function getUnprocessedSaleEvents(limit: number = QUEUE_CONFIG.batchSize): Promise<SaleEvent[]> {
  const supabase = createClient();

  const { data: events, error } = await supabase
    .from('sale_events')
    .select('*')
    .eq('processed', false)
    .lt('verification_attempts', QUEUE_CONFIG.maxRetries)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching unprocessed sale events:', error);
    return [];
  }

  return events || [];
}

/**
 * Process a batch of sale events
 */
async function processBatch(events: SaleEvent[]): Promise<ProcessingStats> {
  const stats: ProcessingStats = {
    processed: 0,
    failed: 0,
    retried: 0,
    jobsCreated: 0,
    errors: [],
  };

  console.log(`Processing batch of ${events.length} sale events`);

  // Process events concurrently but limit concurrency
  const chunks = [];
  for (let i = 0; i < events.length; i += QUEUE_CONFIG.maxConcurrentJobs) {
    chunks.push(events.slice(i, i + QUEUE_CONFIG.maxConcurrentJobs));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (event) => {
      const result = await processSaleEvent(event.id);

      if (result.success) {
        stats.processed++;
        if (result.jobId) {
          stats.jobsCreated++;
        }
      } else {
        if (result.retryable) {
          stats.retried++;
        } else {
          stats.failed++;
        }

        stats.errors.push({
          event_id: event.id,
          error: result.error || 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    });

    await Promise.allSettled(promises);
  }

  console.log(`Batch processing complete:`, stats);
  return stats;
}

/**
 * Main queue processing function
 */
export async function processSaleEventQueue(): Promise<ProcessingStats> {
  console.log('Starting sale event queue processing');

  try {
    const events = await getUnprocessedSaleEvents();

    if (events.length === 0) {
      console.log('No unprocessed sale events found');
      return {
        processed: 0,
        failed: 0,
        retried: 0,
        jobsCreated: 0,
        errors: [],
      };
    }

    const stats = await processBatch(events);

    console.log(`Sale event queue processing complete:`, stats);
    return stats;

  } catch (error) {
    console.error('Error processing sale event queue:', error);
    return {
      processed: 0,
      failed: 0,
      retried: 0,
      jobsCreated: 0,
      errors: [
        {
          event_id: 'queue_error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }
}

/**
 * Clean up old processed events
 */
export async function cleanupProcessedEvents(olderThanDays: number = 30): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase
      .from('sale_events')
      .delete()
      .eq('processed', true)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error.message,
      };
    }

    console.log(`Cleaned up ${data?.length || 0} old processed events`);

    return {
      success: true,
      deletedCount: data?.length || 0,
    };

  } catch (error) {
    return {
      success: false,
      deletedCount: 0,
      error: error.message,
    };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  unprocessed_events: number;
  processing_errors: number;
  verification_failures: number;
  recent_activity: Array<{
    hour: string;
    events_processed: number;
    jobs_created: number;
    errors: number;
  }>;
}> {
  const supabase = createClient();

  try {
    // Get unprocessed events count
    const { count: unprocessedCount } = await supabase
      .from('sale_events')
      .select('*', { count: 'exact', head: true })
      .eq('processed', false);

    // Get processing errors count
    const { count: errorCount } = await supabase
      .from('sale_events')
      .select('*', { count: 'exact', head: true })
      .not('processing_error', 'is', null);

    // Get verification failures count
    const { count: verificationFailureCount } = await supabase
      .from('sale_events')
      .select('*', { count: 'exact', head: true })
      .eq('verified', false)
      .gte('verification_attempts', QUEUE_CONFIG.maxRetries);

    // Get recent activity (last 24 hours, grouped by hour)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: recentActivity } = await supabase
      .from('sale_events')
      .select('created_at, processed, processing_error, delisting_job_id')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: true });

    // Group by hour
    const activityByHour: Record<string, any> = {};
    recentActivity?.forEach(event => {
      const hour = new Date(event.created_at).toISOString().slice(0, 13) + ':00:00';
      if (!activityByHour[hour]) {
        activityByHour[hour] = {
          hour,
          events_processed: 0,
          jobs_created: 0,
          errors: 0,
        };
      }

      if (event.processed) {
        activityByHour[hour].events_processed++;
      }
      if (event.delisting_job_id) {
        activityByHour[hour].jobs_created++;
      }
      if (event.processing_error) {
        activityByHour[hour].errors++;
      }
    });

    return {
      unprocessed_events: unprocessedCount || 0,
      processing_errors: errorCount || 0,
      verification_failures: verificationFailureCount || 0,
      recent_activity: Object.values(activityByHour),
    };

  } catch (error) {
    console.error('Error getting queue stats:', error);
    return {
      unprocessed_events: 0,
      processing_errors: 0,
      verification_failures: 0,
      recent_activity: [],
    };
  }
}

/**
 * Manual retry of failed sale events
 */
export async function retryFailedEvents(maxRetries: number = 10): Promise<ProcessingStats> {
  const supabase = createClient();

  try {
    // Get failed events that haven't exceeded max retry attempts
    const { data: failedEvents } = await supabase
      .from('sale_events')
      .select('*')
      .eq('processed', false)
      .not('processing_error', 'is', null)
      .lt('verification_attempts', QUEUE_CONFIG.maxRetries)
      .order('created_at', { ascending: true })
      .limit(maxRetries);

    if (!failedEvents || failedEvents.length === 0) {
      return {
        processed: 0,
        failed: 0,
        retried: 0,
        jobsCreated: 0,
        errors: [],
      };
    }

    console.log(`Retrying ${failedEvents.length} failed sale events`);

    // Clear processing errors to allow retry
    await supabase
      .from('sale_events')
      .update({ processing_error: null, updated_at: new Date().toISOString() })
      .in('id', failedEvents.map(e => e.id));

    // Process the batch
    return await processBatch(failedEvents);

  } catch (error) {
    console.error('Error retrying failed events:', error);
    return {
      processed: 0,
      failed: 0,
      retried: 0,
      jobsCreated: 0,
      errors: [
        {
          event_id: 'retry_error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }
}

/**
 * Start continuous queue processing (for background jobs)
 */
export function startQueueProcessor(): void {
  console.log('Starting continuous sale event queue processor');

  const processLoop = async () => {
    try {
      await processSaleEventQueue();
    } catch (error) {
      console.error('Error in queue processing loop:', error);
    }

    // Schedule next processing
    setTimeout(processLoop, QUEUE_CONFIG.processingIntervalMs);
  };

  // Start the processing loop
  processLoop();

  // Also start cleanup process (once daily)
  const cleanupLoop = async () => {
    try {
      await cleanupProcessedEvents();
    } catch (error) {
      console.error('Error in cleanup loop:', error);
    }

    // Schedule next cleanup (24 hours)
    setTimeout(cleanupLoop, 24 * 60 * 60 * 1000);
  };

  // Start cleanup after 1 hour
  setTimeout(cleanupLoop, 60 * 60 * 1000);
}