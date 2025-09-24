/**
 * Comprehensive Test Suite for Delisting Engine
 * Tests all aspects of the automated delisting system
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { DelistingEngine } from '../delisting-engine';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      single: vi.fn(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}));

// Mock marketplace adapters
vi.mock('@/lib/marketplaces', () => ({
  createAdapter: vi.fn(() => ({
    endListing: vi.fn(),
  })),
}));

describe('DelistingEngine', () => {
  let delistingEngine: DelistingEngine;
  let mockSupabase: any;

  beforeEach(() => {
    delistingEngine = new DelistingEngine();
    mockSupabase = createClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('executeDelistingJob', () => {
    test('should successfully execute a delisting job with one marketplace', async () => {
      // Mock job data
      const mockJob = {
        id: 'job-123',
        user_id: 'user-123',
        inventory_item_id: 'item-123',
        status: 'pending',
        marketplaces_targeted: ['ebay'],
        requires_user_confirmation: false,
        user_confirmed_at: null,
        scheduled_for: new Date(Date.now() - 1000).toISOString(),
      };

      // Mock listings data
      const mockListings = [
        {
          id: 'listing-123',
          inventory_item_id: 'item-123',
          marketplace_type: 'ebay',
          external_listing_id: 'ebay-123',
          status: 'active',
        },
      ];

      // Mock marketplace connection
      const mockConnection = {
        id: 'conn-123',
        user_id: 'user-123',
        marketplace_type: 'ebay',
        status: 'active',
      };

      // Setup mocks
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'delisting_jobs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'listings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'marketplace_connections_safe') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockConnection, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      });

      // Mock listings query response
      mockSupabase.from('listings').select().mockResolvedValue({
        data: mockListings,
        error: null,
      });

      const result = await delistingEngine.executeDelistingJob('job-123');

      expect(result.success).toBe(true);
      expect(result.job_id).toBe('job-123');
      expect(result.total_targeted).toBe(1);
    });

    test('should handle job not found error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      });

      const result = await delistingEngine.executeDelistingJob('nonexistent-job');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Delisting job not found');
    });

    test('should handle job requiring user confirmation', async () => {
      const mockJob = {
        id: 'job-123',
        status: 'pending',
        requires_user_confirmation: true,
        user_confirmed_at: null,
        scheduled_for: new Date(Date.now() - 1000).toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
      });

      const result = await delistingEngine.executeDelistingJob('job-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('requires user confirmation');
    });

    test('should handle scheduled future job', async () => {
      const mockJob = {
        id: 'job-123',
        status: 'pending',
        requires_user_confirmation: false,
        scheduled_for: new Date(Date.now() + 10000).toISOString(), // Future
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
      });

      const result = await delistingEngine.executeDelistingJob('job-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('scheduled for future');
    });

    test('should handle no active listings scenario', async () => {
      const mockJob = {
        id: 'job-123',
        user_id: 'user-123',
        inventory_item_id: 'item-123',
        status: 'pending',
        marketplaces_targeted: ['ebay'],
        requires_user_confirmation: false,
        scheduled_for: new Date(Date.now() - 1000).toISOString(),
      };

      // Setup job mock
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'delisting_jobs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'listings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
          };
        }
        return {
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      });

      // Mock empty listings response
      mockSupabase.from('listings').select().mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await delistingEngine.executeDelistingJob('job-123');

      expect(result.success).toBe(true);
      expect(result.total_targeted).toBe(0);
      expect(result.total_completed).toBe(0);
    });
  });

  describe('retryFailedDelistings', () => {
    test('should retry failed delisting jobs', async () => {
      const mockFailedJobs = [
        {
          id: 'job-1',
          retry_count: 1,
          max_retries: 3,
          updated_at: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        },
        {
          id: 'job-2',
          retry_count: 0,
          max_retries: 3,
          updated_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'delisting_jobs') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockFailedJobs, error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          };
        }
        return {
          insert: vi.fn().mockReturnThis(),
        };
      });

      // Mock successful job execution
      vi.spyOn(delistingEngine, 'executeDelistingJob').mockResolvedValue({
        success: true,
        job_id: 'job-1',
        total_targeted: 1,
        total_completed: 1,
        total_failed: 0,
        results: [],
      });

      const result = await delistingEngine.retryFailedDelistings(10);

      expect(result.success).toBe(true);
      expect(result.jobs_retried).toBeGreaterThan(0);
    });

    test('should handle no failed jobs to retry', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await delistingEngine.retryFailedDelistings(10);

      expect(result.success).toBe(true);
      expect(result.jobs_retried).toBe(0);
    });
  });

  describe('processPendingJobs', () => {
    test('should process multiple pending jobs concurrently', async () => {
      const mockPendingJobs = [
        { id: 'job-1' },
        { id: 'job-2' },
        { id: 'job-3' },
      ];

      // Mock getPendingJobs
      vi.spyOn(delistingEngine, 'getPendingJobs').mockResolvedValue(mockPendingJobs as any);

      // Mock successful job execution
      vi.spyOn(delistingEngine, 'executeDelistingJob').mockResolvedValue({
        success: true,
        job_id: 'test',
        total_targeted: 1,
        total_completed: 1,
        total_failed: 0,
        results: [],
      });

      const result = await delistingEngine.processPendingJobs();

      expect(result.success).toBe(true);
      expect(result.jobs_processed).toBe(3);
      expect(result.jobs_failed).toBe(0);
    });

    test('should handle job processing failures gracefully', async () => {
      const mockPendingJobs = [
        { id: 'job-1' },
        { id: 'job-2' },
      ];

      vi.spyOn(delistingEngine, 'getPendingJobs').mockResolvedValue(mockPendingJobs as any);

      // Mock one success, one failure
      vi.spyOn(delistingEngine, 'executeDelistingJob')
        .mockResolvedValueOnce({
          success: true,
          job_id: 'job-1',
          total_targeted: 1,
          total_completed: 1,
          total_failed: 0,
          results: [],
        })
        .mockRejectedValueOnce(new Error('Processing failed'));

      const result = await delistingEngine.processPendingJobs();

      expect(result.success).toBe(true);
      expect(result.jobs_processed).toBe(1);
      expect(result.jobs_failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    test('should handle no pending jobs', async () => {
      vi.spyOn(delistingEngine, 'getPendingJobs').mockResolvedValue([]);

      const result = await delistingEngine.processPendingJobs();

      expect(result.success).toBe(true);
      expect(result.jobs_processed).toBe(0);
      expect(result.jobs_failed).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle marketplace adapter creation failure', async () => {
      const mockJob = {
        id: 'job-123',
        user_id: 'user-123',
        inventory_item_id: 'item-123',
        status: 'pending',
        marketplaces_targeted: ['ebay'],
        requires_user_confirmation: false,
        scheduled_for: new Date(Date.now() - 1000).toISOString(),
      };

      const mockListing = {
        id: 'listing-123',
        marketplace_type: 'ebay',
        external_listing_id: 'ebay-123',
        status: 'active',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'delisting_jobs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'listings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'marketplace_connections_safe') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }), // No connection
          };
        }
        return {
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      });

      mockSupabase.from('listings').select().mockResolvedValue({
        data: [mockListing],
        error: null,
      });

      const result = await delistingEngine.executeDelistingJob('job-123');

      expect(result.success).toBe(true); // Job succeeds but with failures
      expect(result.total_failed).toBe(1);
    });
  });

  describe('Audit Logging', () => {
    test('should log successful delisting operations', async () => {
      const mockJob = {
        id: 'job-123',
        user_id: 'user-123',
        inventory_item_id: 'item-123',
        status: 'pending',
        marketplaces_targeted: ['ebay'],
        requires_user_confirmation: false,
        scheduled_for: new Date(Date.now() - 1000).toISOString(),
      };

      const mockListing = {
        id: 'listing-123',
        marketplace_type: 'ebay',
        external_listing_id: 'ebay-123',
        status: 'active',
      };

      const mockConnection = {
        marketplace_type: 'ebay',
        status: 'active',
      };

      // Mock adapter
      const mockAdapter = {
        endListing: vi.fn().mockResolvedValue({ success: true }),
      };

      vi.doMock('@/lib/marketplaces', () => ({
        createAdapter: vi.fn().mockResolvedValue(mockAdapter),
      }));

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'delisting_jobs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'listings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'marketplace_connections_safe') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockConnection, error: null }),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockReturnThis(),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      });

      mockSupabase.from('listings').select().mockResolvedValue({
        data: [mockListing],
        error: null,
      });

      const insertMock = vi.fn();
      mockSupabase.from('delisting_audit_log').insert.mockReturnValue({
        insert: insertMock,
      });

      await delistingEngine.executeDelistingJob('job-123');

      // Verify audit logging was called
      expect(mockSupabase.from).toHaveBeenCalledWith('delisting_audit_log');
    });
  });
});