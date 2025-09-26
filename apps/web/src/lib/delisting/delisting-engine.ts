/**
 * Automated De-Listing Engine
 * Core orchestration service for cross-marketplace delisting
 * Author: BMad Development Agent (James) - Story 1.7
 * Date: 2025-09-18
 */

import { createClient } from '@/lib/supabase/server';
import { createAdapter } from '@/lib/marketplaces';
import {
  DelistingJob,
  DelistingJobStatus,
  MarketplaceType,
  DelistingError,
  DELISTING_ERROR_CODES,
  DelistingErrorCode,
  getRetryDelay,
  isRetryableError,
} from '@netpost/shared-types';

interface DelistingResult {
  marketplace: MarketplaceType;
  success: boolean;
  error?: DelistingError;
  delisted_at?: string;
  external_response?: any;
  duration_ms?: number;
}

interface DelistingJobResult {
  success: boolean;
  job_id: string;
  total_targeted: number;
  total_completed: number;
  total_failed: number;
  results: DelistingResult[];
  error?: string;
}

class DelistingEngine {
  private get supabase() {
    return createClient();
  }

  /**
   * Execute a delisting job
   */
  async executeDelistingJob(jobId: string): Promise<DelistingJobResult> {
    console.log(`Executing delisting job: ${jobId}`);

    try {
      // Get the delisting job
      const { data: job, error: jobError } = await this.supabase
        .from('delisting_jobs')
        .select(`
          *,
          user_delisting_preferences:user_delisting_preferences(*)
        `)
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        throw new Error(`Delisting job not found: ${jobId}`);
      }

      // Check if job is ready to process
      if (job.status !== 'pending') {
        throw new Error(`Job ${jobId} is not in pending status: ${job.status}`);
      }

      // Check if job requires user confirmation
      if (job.requires_user_confirmation && !job.user_confirmed_at) {
        throw new Error(`Job ${jobId} requires user confirmation`);
      }

      // Check if job is scheduled for future
      if (new Date(job.scheduled_for) > new Date()) {
        throw new Error(`Job ${jobId} is scheduled for future: ${job.scheduled_for}`);
      }

      // Mark job as processing
      await this.updateJobStatus(jobId, 'processing', new Date().toISOString());

      // Get active listings for the inventory item on targeted marketplaces
      const { data: listings } = await this.supabase
        .from('listings')
        .select('*')
        .eq('inventory_item_id', job.inventory_item_id)
        .in('marketplace_type', job.marketplaces_targeted)
        .in('status', ['active', 'pending'])
        .is('deleted_at', null);

      if (!listings || listings.length === 0) {
        console.log(`No active listings found for job ${jobId}`);
        await this.updateJobStatus(jobId, 'completed');
        return {
          success: true,
          job_id: jobId,
          total_targeted: 0,
          total_completed: 0,
          total_failed: 0,
          results: [],
        };
      }

      console.log(`Found ${listings.length} listings to delist for job ${jobId}`);

      // Execute delisting for each marketplace in parallel
      const delistingPromises = listings.map(listing =>
        this.delistFromMarketplace(listing, job)
      );

      const results = await Promise.allSettled(delistingPromises);

      // Process results
      const delistingResults: DelistingResult[] = [];
      let totalCompleted = 0;
      let totalFailed = 0;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const listing = listings[i];

        if (result.status === 'fulfilled' && result.value.success) {
          delistingResults.push(result.value);
          totalCompleted++;
        } else {
          const error = result.status === 'rejected'
            ? result.reason
            : result.value.error;

          delistingResults.push({
            marketplace: listing.marketplace_type as any,
            success: false,
            error: {
              name: 'DelistingError',
              code: DELISTING_ERROR_CODES.INTERNAL_ERROR,
              message: error?.message || 'Unknown error',
              marketplace: listing.marketplace_type as any,
              listing_id: listing.id,
              external_id: listing.external_listing_id,
            },
          });
          totalFailed++;
        }
      }

      // Update job with results
      await this.updateJobResults(jobId, delistingResults, totalCompleted, totalFailed);

      // Determine final job status
      let finalStatus: DelistingJobStatus;
      if (totalFailed === 0) {
        finalStatus = 'completed';
      } else if (totalCompleted > 0) {
        finalStatus = 'partially_failed';
      } else {
        finalStatus = 'failed';
      }

      await this.updateJobStatus(jobId, finalStatus, undefined, new Date().toISOString());

      // Log completion
      await this.logAuditEvent(job.user_id, jobId, 'job_completed', undefined, true, {
        total_targeted: job.marketplaces_targeted.length,
        total_completed: totalCompleted,
        total_failed: totalFailed,
        final_status: finalStatus,
      });

      console.log(`Delisting job ${jobId} completed: ${totalCompleted}/${listings.length} successful`);

      return {
        success: true,
        job_id: jobId,
        total_targeted: listings.length,
        total_completed: totalCompleted,
        total_failed: totalFailed,
        results: delistingResults,
      };

    } catch (error) {
      console.error(`Error executing delisting job ${jobId}:`, error);

      // Mark job as failed
      try {
        await this.updateJobStatus(jobId, 'failed');
        await this.supabase
          .from('delisting_jobs')
          .update({
            error_log: {
              execution_error: {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
              },
            },
          })
          .eq('id', jobId);
      } catch (updateError) {
        console.error(`Error updating failed job status:`, updateError);
      }

      return {
        success: false,
        job_id: jobId,
        total_targeted: 0,
        total_completed: 0,
        total_failed: 0,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delist from a specific marketplace
   */
  private async delistFromMarketplace(
    listing: any,
    job: DelistingJob
  ): Promise<DelistingResult> {
    const startTime = Date.now();
    const marketplace = listing.marketplace_type as MarketplaceType;

    try {
      console.log(`Delisting from ${marketplace}: ${listing.external_listing_id}`);

      // Get marketplace connection
      const { data: connection } = await this.supabase
        .from('marketplace_connections_safe')
        .select('*')
        .eq('user_id', job.user_id)
        .eq('marketplace_type', marketplace)
        .eq('status', 'active')
        .single();

      if (!connection) {
        throw new DelistingError({
          code: DELISTING_ERROR_CODES.INVALID_TOKEN,
          message: `No active connection for ${marketplace}`,
          marketplace: marketplace as any,
          listing_id: listing.id,
          external_id: listing.external_listing_id,
        });
      }

      // Create marketplace adapter
      const adapter = await createAdapter(connection, marketplace as any);
      if (!adapter) {
        throw new DelistingError({
          code: DELISTING_ERROR_CODES.INTERNAL_ERROR,
          message: `Failed to create adapter for ${marketplace}`,
          marketplace: marketplace as any,
          listing_id: listing.id,
          external_id: listing.external_listing_id,
        });
      }

      // Attempt to delist/end the listing
      let response;
      try {
        response = await adapter.endListing(listing.external_listing_id, {
          reason: 'Item sold on another marketplace',
          sold_to_buyer: job.sale_external_id ? 'NetPost_CrossListing' : undefined,
        });
      } catch (adapterError) {
        // Map adapter errors to delisting errors
        const delistingError = this.mapAdapterErrorToDelistingError(
          adapterError,
          marketplace,
          listing
        );
        throw delistingError;
      }

      // Update our listing status
      await this.supabase
        .from('listings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', listing.id);

      const duration = Date.now() - startTime;

      // Log successful delisting
      await this.logAuditEvent(
        job.user_id,
        job.id,
        'listing_delisted',
        marketplace,
        true,
        {
          listing_id: listing.id,
          external_listing_id: listing.external_listing_id,
          duration_ms: duration,
        }
      );

      return {
        marketplace,
        success: true,
        delisted_at: new Date().toISOString(),
        external_response: response,
        duration_ms: duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`Error delisting from ${marketplace}:`, error);

      // Log failed delisting
      await this.logAuditEvent(
        job.user_id,
        job.id,
        'listing_delist_failed',
        marketplace,
        false,
        {
          listing_id: listing.id,
          external_listing_id: listing.external_listing_id,
          error_code: (error as any)?.code || DELISTING_ERROR_CODES.UNKNOWN_ERROR,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: duration,
        },
        error instanceof Error ? error.message : 'Unknown error',
        (error as any)?.code
      );

      return {
        marketplace,
        success: false,
        error: error instanceof DelistingError ? error : {
          name: 'DelistingError',
          code: DELISTING_ERROR_CODES.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
          marketplace: marketplace as any,
          listing_id: listing.id,
          external_id: listing.external_listing_id,
        },
        duration_ms: duration,
      };
    }
  }

  /**
   * Map marketplace adapter errors to delisting errors
   */
  private mapAdapterErrorToDelistingError(
    error: any,
    marketplace: MarketplaceType,
    listing: any
  ): DelistingError {
    let code: DelistingErrorCode = DELISTING_ERROR_CODES.UNKNOWN_ERROR;
    let message = error.message || 'Unknown error';
    let permanent = false;
    let retryAfter: number | undefined;

    // Check for common error patterns
    if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
      code = DELISTING_ERROR_CODES.INVALID_TOKEN;
      permanent = true;
    } else if (error.message?.includes('not found') || error.message?.includes('invalid listing')) {
      code = DELISTING_ERROR_CODES.LISTING_NOT_FOUND;
      permanent = true;
    } else if (error.message?.includes('already ended') || error.message?.includes('already sold')) {
      code = DELISTING_ERROR_CODES.LISTING_ALREADY_ENDED;
      permanent = true;
    } else if (error.message?.includes('cannot be ended') || error.message?.includes('not allowed')) {
      code = DELISTING_ERROR_CODES.LISTING_CANNOT_BE_ENDED;
      permanent = true;
    } else if (error.message?.includes('rate limit') || error.status === 429) {
      code = DELISTING_ERROR_CODES.RATE_LIMITED;
      retryAfter = 60; // 1 minute default
    } else if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
      code = DELISTING_ERROR_CODES.TIMEOUT;
    } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      code = DELISTING_ERROR_CODES.NETWORK_ERROR;
    } else if (error.status >= 500) {
      code = DELISTING_ERROR_CODES.API_UNAVAILABLE;
    }

    return {
      name: 'DelistingError',
      code,
      message,
      marketplace: marketplace as any,
      listing_id: listing.id,
      external_id: listing.external_listing_id,
      retry_after: retryAfter,
      permanent,
    };
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: DelistingJobStatus,
    startedAt?: string,
    completedAt?: string
  ): Promise<void> {
    const updates: any = { status };

    if (startedAt) {
      updates.started_at = startedAt;
    }
    if (completedAt) {
      updates.completed_at = completedAt;
    }

    await this.supabase
      .from('delisting_jobs')
      .update(updates)
      .eq('id', jobId);
  }

  /**
   * Update job results
   */
  private async updateJobResults(
    jobId: string,
    results: DelistingResult[],
    totalCompleted: number,
    totalFailed: number
  ): Promise<void> {
    const successLog: Record<string, any> = {};
    const errorLog: Record<string, any> = {};
    const completedMarketplaces: string[] = [];
    const failedMarketplaces: string[] = [];

    for (const result of results) {
      if (result.success) {
        successLog[result.marketplace] = {
          delisted_at: result.delisted_at,
          external_response: result.external_response,
          duration_ms: result.duration_ms,
        };
        completedMarketplaces.push(result.marketplace);
      } else {
        errorLog[result.marketplace] = {
          error: result.error?.message || 'Unknown error',
          code: result.error?.code || DELISTING_ERROR_CODES.UNKNOWN_ERROR,
          timestamp: new Date().toISOString(),
          retry_count: 0, // Will be updated by retry logic
        };
        failedMarketplaces.push(result.marketplace);
      }
    }

    await this.supabase
      .from('delisting_jobs')
      .update({
        success_log: successLog,
        error_log: errorLog,
        marketplaces_completed: completedMarketplaces,
        marketplaces_failed: failedMarketplaces,
        total_delisted: totalCompleted,
        total_failed: totalFailed,
      })
      .eq('id', jobId);
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    userId: string,
    jobId: string,
    action: string,
    marketplace?: MarketplaceType,
    success: boolean = true,
    contextData: any = {},
    errorMessage?: string,
    errorCode?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('delisting_audit_log')
        .insert({
          user_id: userId,
          delisting_job_id: jobId,
          action,
          marketplace_type: marketplace,
          success,
          error_message: errorMessage,
          error_code: errorCode,
          context_data: contextData,
        });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  /**
   * Retry failed delisting jobs
   */
  async retryFailedDelistings(maxJobs: number = 10): Promise<{
    success: boolean;
    jobs_retried: number;
    errors: string[];
  }> {
    try {
      // Get failed jobs that can be retried
      const { data: failedJobs } = await this.supabase
        .from('delisting_jobs')
        .select('*')
        .in('status', ['failed', 'partially_failed'])
        .lt('retry_count', 'max_retries')
        .order('created_at', { ascending: true })
        .limit(maxJobs);

      if (!failedJobs || failedJobs.length === 0) {
        return {
          success: true,
          jobs_retried: 0,
          errors: [],
        };
      }

      console.log(`Retrying ${failedJobs.length} failed delisting jobs`);

      const errors: string[] = [];
      let jobsRetried = 0;

      for (const job of failedJobs) {
        try {
          // Calculate retry delay
          const delay = getRetryDelay(job.retry_count, DELISTING_ERROR_CODES.INTERNAL_ERROR);

          // Check if enough time has passed since last attempt
          const lastAttempt = new Date(job.updated_at);
          const now = new Date();
          const timeSinceLastAttempt = now.getTime() - lastAttempt.getTime();

          if (timeSinceLastAttempt < delay) {
            console.log(`Job ${job.id} not ready for retry (waiting ${delay - timeSinceLastAttempt}ms)`);
            continue;
          }

          // Increment retry count and reset status
          await this.supabase
            .from('delisting_jobs')
            .update({
              status: 'pending',
              retry_count: job.retry_count + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          // Execute the job
          await this.executeDelistingJob(job.id);
          jobsRetried++;

        } catch (error) {
          console.error(`Error retrying job ${job.id}:`, error);
          errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        jobs_retried: jobsRetried,
        errors,
      };

    } catch (error) {
      console.error('Error in retryFailedDelistings:', error);
      return {
        success: false,
        jobs_retried: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get pending delisting jobs ready for processing
   */
  async getPendingJobs(limit: number = 50): Promise<DelistingJob[]> {
    const { data: jobs, error } = await this.supabase
      .from('pending_delisting_jobs')
      .select('*')
      .eq('processing_status', 'ready_to_process')
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching pending jobs:', error);
      return [];
    }

    return jobs || [];
  }

  /**
   * Process all pending delisting jobs
   */
  async processPendingJobs(): Promise<{
    success: boolean;
    jobs_processed: number;
    jobs_failed: number;
    errors: string[];
  }> {
    console.log('Processing pending delisting jobs');

    try {
      const pendingJobs = await this.getPendingJobs();

      if (pendingJobs.length === 0) {
        console.log('No pending delisting jobs found');
        return {
          success: true,
          jobs_processed: 0,
          jobs_failed: 0,
          errors: [],
        };
      }

      console.log(`Found ${pendingJobs.length} pending delisting jobs`);

      let jobsProcessed = 0;
      let jobsFailed = 0;
      const errors: string[] = [];

      // Process jobs in parallel but limit concurrency
      const concurrencyLimit = 5;
      for (let i = 0; i < pendingJobs.length; i += concurrencyLimit) {
        const batch = pendingJobs.slice(i, i + concurrencyLimit);

        const batchPromises = batch.map(async (job) => {
          try {
            const result = await this.executeDelistingJob(job.id);
            if (result.success) {
              jobsProcessed++;
            } else {
              jobsFailed++;
              errors.push(`Job ${job.id}: ${result.error}`);
            }
          } catch (error) {
            jobsFailed++;
            errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        await Promise.allSettled(batchPromises);

        // Small delay between batches
        if (i + concurrencyLimit < pendingJobs.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Pending jobs processing complete: ${jobsProcessed} processed, ${jobsFailed} failed`);

      return {
        success: true,
        jobs_processed: jobsProcessed,
        jobs_failed: jobsFailed,
        errors,
      };

    } catch (error) {
      console.error('Error processing pending jobs:', error);
      return {
        success: false,
        jobs_processed: 0,
        jobs_failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

// Create a singleton instance
export const delistingEngine = new DelistingEngine();

// Export the class for testing
export { DelistingEngine };