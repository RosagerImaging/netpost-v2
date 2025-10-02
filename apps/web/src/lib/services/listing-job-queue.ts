/**
 * Listing Job Queue System
 * Handles async processing of cross-platform listing creation with retry logic
 */

import { supabase } from '@/lib/supabase/client';
import { BaseMarketplaceAdapter } from '../marketplaces/base-adapter';
import type {
  ListingCreationResult
} from '../marketplaces/base-adapter';
import type { MarketplaceType } from '@netpost/shared-types';

// Define CreateListingInput locally since it's not exported from shared-types
export interface CreateListingInput {
  inventory_item_id: string;
  marketplace_type: MarketplaceType;
  title: string;
  description: string;
  listing_price: number;
  original_price?: number;
  currency?: string;
  quantity_available?: number;
  condition_description?: string;
  photo_urls?: string[];
  tags?: string[];
}

export interface ListingJob {
  id: string;
  user_id: string;
  inventory_item_id: string;
  marketplace_type: MarketplaceType;
  listing_data: CreateListingInput;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  scheduled_for?: string;
  completed_at?: string;
  result?: ListingCreationResult;
}

export interface JobQueueConfig {
  max_concurrent_jobs: number;
  retry_delay_base: number; // Base delay in milliseconds
  max_retry_delay: number; // Maximum delay in milliseconds
  retry_backoff_multiplier: number;
  job_timeout: number; // Job timeout in milliseconds
}

export interface JobStats {
  total_jobs: number;
  pending_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  retry_jobs: number;
}

export class ListingJobQueue {
  private static instance: ListingJobQueue;
  private processingJobs = new Map<string, Promise<void>>();
  private processorInterval?: NodeJS.Timeout;
  private config: JobQueueConfig = {
    max_concurrent_jobs: 5,
    retry_delay_base: 1000,
    max_retry_delay: 300000, // 5 minutes
    retry_backoff_multiplier: 2,
    job_timeout: 120000, // 2 minutes
  };

  private constructor() {
    // Start the job processor
    this.startJobProcessor();
  }

  static getInstance(): ListingJobQueue {
    if (!ListingJobQueue.instance) {
      ListingJobQueue.instance = new ListingJobQueue();
    }
    return ListingJobQueue.instance;
  }

  /**
   * Update queue configuration
   */
  updateConfig(config: Partial<JobQueueConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add a listing job to the queue
   */
  async enqueueJob(
    user_id: string,
    inventory_item_id: string,
    marketplace_type: MarketplaceType,
    listing_data: CreateListingInput,
    priority = 5
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ListingJob = {
      id: jobId,
      user_id,
      inventory_item_id,
      marketplace_type,
      listing_data,
      status: 'pending',
      priority,
      attempts: 0,
      max_attempts: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store job in database (we'll need to create this table)
    try {
      // For now, we'll store in localStorage for demo purposes
      // In production, this would be a proper database table
      const existingJobs = this.getStoredJobs();
      existingJobs.push(job);
      localStorage.setItem('listing_jobs', JSON.stringify(existingJobs));

      console.log(`Enqueued listing job ${jobId} for ${marketplace_type}`);
      return jobId;
    } catch (error) {
      throw new Error(`Failed to enqueue job: ${error}`);
    }
  }

  /**
   * Process pending jobs
   */
  private async startJobProcessor(): Promise<void> {
    // Process jobs every 5 seconds
    this.processorInterval = setInterval(() => {
      this.processNextJobs();
    }, 5000);
  }

  /**
   * Stop the job processor
   */
  stopJobProcessor(): void {
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
      this.processorInterval = undefined;
    }
  }

  private async processNextJobs(): Promise<void> {
    if (this.processingJobs.size >= this.config.max_concurrent_jobs) {
      return; // Already at max capacity
    }

    const slotsAvailable = this.config.max_concurrent_jobs - this.processingJobs.size;

    // Get pending jobs ordered by priority and creation time
    const jobs = this.getStoredJobs()
      .filter(job =>
        (job.status === 'pending' || job.status === 'retrying') &&
        (!job.scheduled_for || new Date(job.scheduled_for) <= new Date())
      )
      .sort((a, b) => {
        // Sort by priority (desc) then by creation time (asc)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, slotsAvailable);

    if (jobs.length === 0) {
      return;
    }

    // Process each job
    for (const job of jobs) {
      const jobPromise = this.processJob(job);
      this.processingJobs.set(job.id, jobPromise);

      jobPromise.finally(() => {
        this.processingJobs.delete(job.id);
      });
    }
  }

  private async processJob(job: ListingJob): Promise<void> {
    try {
      // Mark job as processing
      await this.updateJobStatus(job.id, 'processing');

      console.log(`Processing job ${job.id} for ${job.marketplace_type}`);

      // Get marketplace adapter
      const adapter = await this.getMarketplaceAdapter(job.user_id, job.marketplace_type);
      if (!adapter) {
        throw new Error(`No active connection for ${job.marketplace_type}`);
      }

      // Create listing with timeout
      const result = await Promise.race([
        adapter.createListing(job.listing_data),
        this.createTimeoutPromise(this.config.job_timeout),
      ]);

      // Update listing record in database with result
      await this.updateListingWithResult(job, result as ListingCreationResult);

      // Mark job as completed
      await this.updateJobStatus(job.id, 'completed', undefined, result as ListingCreationResult);

      console.log(`Completed job ${job.id} - listing created: ${(result as ListingCreationResult).external_listing_id}`);

      // Log successful listing creation
      await this.logActivity('listing_created', {
        job_id: job.id,
        marketplace_type: job.marketplace_type,
        external_listing_id: (result as ListingCreationResult).external_listing_id,
        user_id: job.user_id,
        inventory_item_id: job.inventory_item_id,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Job ${job.id} failed:`, errorMessage);

      await this.handleJobFailure(job, errorMessage);

      // Log failed listing creation
      await this.logActivity('listing_failed', {
        job_id: job.id,
        marketplace_type: job.marketplace_type,
        error_message: errorMessage,
        user_id: job.user_id,
        inventory_item_id: job.inventory_item_id,
        attempt: job.attempts + 1,
      });
    }
  }

  private async updateListingWithResult(job: ListingJob, result: ListingCreationResult): Promise<void> {
    const updates: any = {
      external_listing_id: result.external_listing_id,
      external_url: result.external_url,
      status: result.status,
      marketplace_specific_data: result.marketplace_data || {},
      updated_at: new Date().toISOString(),
    };

    if (result.fees) {
      updates.listing_fee = result.fees.listing_fee;
      updates.final_value_fee = result.fees.final_value_fee;
      updates.total_fees = result.fees.total_fees;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .update(updates)
        .eq('inventory_item_id', job.inventory_item_id)
        .eq('marketplace_type', job.marketplace_type)
        .eq('user_id', job.user_id);

      if (error) {
        console.error('Failed to update listing with result:', error);
      }
    } catch (error) {
      console.error('Error updating listing with result:', error);
    }
  }

  private async handleJobFailure(job: ListingJob, errorMessage: string): Promise<void> {
    const newAttempts = job.attempts + 1;

    if (newAttempts >= job.max_attempts) {
      // Mark job as permanently failed
      await this.updateJobStatus(job.id, 'failed', errorMessage);

      // Update listing status
      try {
        await supabase
          .from('listings')
          .update({
            status: 'rejected',
            status_reason: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('inventory_item_id', job.inventory_item_id)
          .eq('marketplace_type', job.marketplace_type)
          .eq('user_id', job.user_id);
      } catch (error) {
        console.error('Error updating listing status:', error);
      }

    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(
        this.config.retry_delay_base * Math.pow(this.config.retry_backoff_multiplier, newAttempts - 1),
        this.config.max_retry_delay
      );

      const scheduledFor = new Date(Date.now() + retryDelay).toISOString();

      await this.updateJobInStorage(job.id, {
        status: 'retrying',
        attempts: newAttempts,
        error_message: errorMessage,
        scheduled_for: scheduledFor,
        updated_at: new Date().toISOString(),
      });

      console.log(`Scheduled retry for job ${job.id} in ${retryDelay}ms (attempt ${newAttempts})`);
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: ListingJob['status'],
    errorMessage?: string,
    result?: ListingCreationResult
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (result) {
      updates.result = result;
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    await this.updateJobInStorage(jobId, updates);
  }

  private updateJobInStorage(jobId: string, updates: Partial<ListingJob>): void {
    const jobs = this.getStoredJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);

    if (jobIndex >= 0) {
      jobs[jobIndex] = { ...jobs[jobIndex], ...updates };
      localStorage.setItem('listing_jobs', JSON.stringify(jobs));
    }
  }

  private getStoredJobs(): ListingJob[] {
    try {
      const stored = localStorage.getItem('listing_jobs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private async getMarketplaceAdapter(userId: string, marketplaceType: MarketplaceType): Promise<BaseMarketplaceAdapter | null> {
    try {
      // Get marketplace connection
      const { data: connection, error } = await supabase
        .from('marketplace_connections_safe')
        .select('*')
        .eq('user_id', userId)
        .eq('marketplace_type', marketplaceType)
        .eq('connection_status', 'active')
        .single();

      if (error || !connection) {
        console.warn(`No active connection found for ${marketplaceType}:`, error);
        return null;
      }

      // Create adapter instance
      const { createAdapter } = await import('../marketplaces');
      return createAdapter(connection, connection.credentials);
    } catch (error) {
      console.error('Error getting marketplace adapter:', error);
      return null;
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  private async logActivity(action: string, data: any): Promise<void> {
    // Activity logging for audit trail
    try {
      const activityLog = {
        action,
        data,
        timestamp: new Date().toISOString(),
        source: 'listing_job_queue',
      };

      // Store in localStorage for demo (would be database in production)
      const activities = JSON.parse(localStorage.getItem('activity_logs') || '[]');
      activities.push(activityLog);

      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }

      localStorage.setItem('activity_logs', JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ListingJob | null> {
    const jobs = this.getStoredJobs();
    return jobs.find(job => job.id === jobId) || null;
  }

  /**
   * Get jobs for a user
   */
  async getUserJobs(userId: string, limit = 50): Promise<ListingJob[]> {
    const jobs = this.getStoredJobs()
      .filter(job => job.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return jobs;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<JobStats> {
    const jobs = this.getStoredJobs();

    return {
      total_jobs: jobs.length,
      pending_jobs: jobs.filter(j => j.status === 'pending').length,
      processing_jobs: jobs.filter(j => j.status === 'processing').length,
      completed_jobs: jobs.filter(j => j.status === 'completed').length,
      failed_jobs: jobs.filter(j => j.status === 'failed').length,
      retry_jobs: jobs.filter(j => j.status === 'retrying').length,
    };
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      await this.updateJobInStorage(jobId, {
        status: 'failed',
        error_message: 'Cancelled by user',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await this.logActivity('job_cancelled', {
        job_id: jobId,
        cancelled_at: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error cancelling job:', error);
      return false;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      await this.updateJobInStorage(jobId, {
        status: 'pending',
        attempts: 0,
        error_message: undefined,
        scheduled_for: undefined,
        updated_at: new Date().toISOString(),
      });

      await this.logActivity('job_retried', {
        job_id: jobId,
        retried_at: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error retrying job:', error);
      return false;
    }
  }

  /**
   * Clear completed jobs older than specified days
   */
  async cleanupOldJobs(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const jobs = this.getStoredJobs();
    const initialCount = jobs.length;

    const filteredJobs = jobs.filter(job => {
      const jobDate = new Date(job.created_at);
      const isOld = jobDate < cutoffDate;
      const isCompleted = job.status === 'completed' || job.status === 'failed';

      return !(isOld && isCompleted);
    });

    localStorage.setItem('listing_jobs', JSON.stringify(filteredJobs));

    const cleanedCount = initialCount - filteredJobs.length;
    console.log(`Cleaned up ${cleanedCount} old jobs`);

    return cleanedCount;
  }
}

// Export singleton instance
export const listingJobQueue = ListingJobQueue.getInstance();

// Auto-cleanup old jobs daily (only in browser environment)
// Store interval ID for potential cleanup
let cleanupIntervalId: NodeJS.Timeout | null = null;

if (typeof window !== 'undefined') {
  cleanupIntervalId = setInterval(() => {
    listingJobQueue.cleanupOldJobs();
  }, 24 * 60 * 60 * 1000); // 24 hours
}

// Export cleanup function for graceful shutdown
export function stopAutoCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}