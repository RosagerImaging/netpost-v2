/**
 * API Route for Processing Delisting Jobs
 * Handles manual triggering of delisting job processing
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DelistingEngine } from '@/lib/delisting/delisting-engine';

/**
 * POST /api/delisting/process-job - Process a specific delisting job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id } = body;

    if (!job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    // Get current user for authorization
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('delisting_jobs')
      .select('user_id, status')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if job is in a processable state
    if (!['pending', 'failed', 'partially_failed'].includes(job.status)) {
      return NextResponse.json({
        error: `Job cannot be processed in ${job.status} status`
      }, { status: 400 });
    }

    // Process the job
    const delistingEngine = new DelistingEngine();
    const result = await delistingEngine.executeDelistingJob(job_id);

    return NextResponse.json({
      success: true,
      job_id,
      result,
    });

  } catch (error) {
    console.error('Error processing delisting job:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/delisting/process-job - Get pending jobs for processing
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // This endpoint is for system/admin use to process pending jobs
    // In production, this would be called by a background job processor

    const delistingEngine = new DelistingEngine();
    const result = await delistingEngine.processPendingJobs();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing pending jobs:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}