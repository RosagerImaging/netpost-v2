/**
 * Hook for managing delisting jobs data and operations
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface DelistingJob {
  id: string;
  user_id: string;
  inventory_item_id: string;
  trigger_type: 'sale_detected' | 'manual' | 'scheduled' | 'expired';
  status: 'pending' | 'processing' | 'completed' | 'partially_failed' | 'failed' | 'cancelled';
  sold_on_marketplace?: string;
  sale_price?: number;
  sale_date?: string;
  marketplaces_targeted: string[];
  marketplaces_completed: string[];
  marketplaces_failed: string[];
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  max_retries: number;
  total_delisted: number;
  total_failed: number;
  requires_user_confirmation: boolean;
  user_confirmed_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  item_title?: string;
  item_brand?: string;
  item_category?: string;
}

interface UseDelistingJobsReturn {
  jobs: DelistingJob[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  confirmJob: (jobId: string) => Promise<void>;
  getJobById: (jobId: string) => DelistingJob | undefined;
  stats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    partially_failed: number;
  };
}

export function useDelistingJobs(): UseDelistingJobsReturn {
  const [jobs, setJobs] = useState<DelistingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch delisting jobs with related inventory item data
      const { data: jobsData, error: jobsError } = await supabase
        .from('delisting_jobs')
        .select(`
          *,
          inventory_items!inner(
            title,
            brand,
            category
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (jobsError) {
        throw jobsError;
      }

      // Transform data to include item details
      const transformedJobs: DelistingJob[] = (jobsData || []).map(job => ({
        ...job,
        item_title: job.inventory_items?.title,
        item_brand: job.inventory_items?.brand,
        item_category: job.inventory_items?.category,
      }));

      setJobs(transformedJobs);

    } catch (err) {
      console.error('Error fetching delisting jobs:', err);
      setError(err.message || 'Failed to fetch delisting jobs');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const retryJob = useCallback(async (jobId: string) => {
    try {
      setError(null);

      // Reset job status and increment retry count
      const { error: updateError } = await supabase
        .from('delisting_jobs')
        .update({
          status: 'pending',
          retry_count: supabase.rpc('increment_retry_count', { job_id: jobId }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        throw updateError;
      }

      // Trigger job processing
      const response = await fetch('/api/delisting/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry job');
      }

      // Refresh jobs list
      await fetchJobs();

    } catch (err) {
      console.error('Error retrying job:', err);
      setError(err.message || 'Failed to retry job');
    }
  }, [supabase, fetchJobs]);

  const cancelJob = useCallback(async (jobId: string) => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('delisting_jobs')
        .update({
          status: 'cancelled',
          user_cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelled by user',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        throw updateError;
      }

      // Log the cancellation
      await supabase
        .from('delisting_audit_log')
        .insert({
          delisting_job_id: jobId,
          action: 'job_cancelled',
          success: true,
          context_data: {
            cancelled_by: 'user',
            reason: 'Manual cancellation from dashboard',
          },
        });

      // Refresh jobs list
      await fetchJobs();

    } catch (err) {
      console.error('Error cancelling job:', err);
      setError(err.message || 'Failed to cancel job');
    }
  }, [supabase, fetchJobs]);

  const confirmJob = useCallback(async (jobId: string) => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('delisting_jobs')
        .update({
          user_confirmed_at: new Date().toISOString(),
          scheduled_for: new Date().toISOString(), // Execute immediately
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        throw updateError;
      }

      // Trigger job processing
      const response = await fetch('/api/delisting/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process confirmed job');
      }

      // Refresh jobs list
      await fetchJobs();

    } catch (err) {
      console.error('Error confirming job:', err);
      setError(err.message || 'Failed to confirm job');
    }
  }, [supabase, fetchJobs]);

  const getJobById = useCallback((jobId: string) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  // Calculate stats
  const stats = {
    total: jobs.length,
    pending: jobs.filter(job => job.status === 'pending').length,
    processing: jobs.filter(job => job.status === 'processing').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    failed: jobs.filter(job => job.status === 'failed').length,
    partially_failed: jobs.filter(job => job.status === 'partially_failed').length,
  };

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Set up real-time subscription for job updates
  useEffect(() => {
    const channel = supabase
      .channel('delisting-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delisting_jobs',
        },
        (payload) => {
          console.log('Delisting job change received:', payload);
          // Refresh jobs when changes occur
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refresh: fetchJobs,
    retryJob,
    cancelJob,
    confirmJob,
    getJobById,
    stats,
  };
}