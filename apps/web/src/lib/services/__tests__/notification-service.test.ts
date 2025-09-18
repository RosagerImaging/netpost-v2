/**
 * Test Suite for Notification Service
 * Tests notification delivery across multiple channels
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService, NotificationContext } from '../notification-service';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

// Mock fetch for webhook notifications
global.fetch = vi.fn();

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockSupabase: any;
  let mockContext: NotificationContext;

  beforeEach(() => {
    notificationService = new NotificationService();
    mockSupabase = createClient();
    vi.clearAllMocks();

    mockContext = {
      jobId: 'job-123',
      userId: 'user-123',
      itemTitle: 'Vintage Designer Jacket',
      itemBrand: 'Gucci',
      salePrice: 250.00,
      saleMarketplace: 'ebay',
      targetedMarketplaces: ['poshmark', 'facebook_marketplace'],
      completedMarketplaces: ['poshmark'],
      failedMarketplaces: ['facebook_marketplace'],
      totalCompleted: 1,
      totalFailed: 1,
      jobStatus: 'partially_failed',
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('sendDelistingNotification', () => {
    test('should send success notification when all marketplaces complete', async () => {
      const successContext = {
        ...mockContext,
        completedMarketplaces: ['poshmark', 'facebook_marketplace'],
        failedMarketplaces: [],
        totalCompleted: 2,
        totalFailed: 0,
        jobStatus: 'completed' as const,
      };

      // Mock user preferences
      const mockPreferences = {
        notification_email: true,
        notification_app: true,
        notification_sms: false,
        notification_webhook_url: null,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
      });

      // Mock user profile for email
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_delisting_preferences') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { email: 'test@example.com' },
              error: null,
            }),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      });

      const result = await notificationService.sendDelistingNotification('success', successContext);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    test('should send partial failure notification', async () => {
      const mockPreferences = {
        notification_email: true,
        notification_app: false,
        notification_sms: false,
        notification_webhook_url: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_delisting_preferences') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { email: 'test@example.com' },
              error: null,
            }),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      });

      const result = await notificationService.sendDelistingNotification('partial_failure', mockContext);

      expect(result.success).toBe(true);
      // Should only send email notification since app notification is disabled
    });

    test('should send complete failure notification with urgent priority', async () => {
      const failureContext = {
        ...mockContext,
        completedMarketplaces: [],
        failedMarketplaces: ['poshmark', 'facebook_marketplace'],
        totalCompleted: 0,
        totalFailed: 2,
        jobStatus: 'failed' as const,
        errorDetails: 'Authentication failed for all marketplaces',
      };

      const mockPreferences = {
        notification_email: true,
        notification_app: true,
        notification_sms: true,
        notification_webhook_url: 'https://example.com/webhook',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_delisting_preferences') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { email: 'test@example.com', phone_number: '+1234567890' },
              error: null,
            }),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      });

      // Mock successful webhook call
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await notificationService.sendDelistingNotification('complete_failure', failureContext);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/webhook', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('delisting_completed'),
      }));
    });

    test('should send confirmation required notification', async () => {
      const confirmationContext = {
        ...mockContext,
        completedMarketplaces: [],
        failedMarketplaces: [],
        totalCompleted: 0,
        totalFailed: 0,
        jobStatus: 'pending' as const,
      };

      const mockPreferences = {
        notification_email: true,
        notification_app: true,
        notification_sms: false,
        notification_webhook_url: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_delisting_preferences') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { email: 'test@example.com' },
              error: null,
            }),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      });

      const result = await notificationService.sendDelistingNotification('confirmation_required', confirmationContext);

      expect(result.success).toBe(true);
    });

    test('should handle notification preferences not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await notificationService.sendDelistingNotification('success', mockContext);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle notification delivery failures gracefully', async () => {
      const mockPreferences = {
        notification_email: true,
        notification_app: true,
        notification_sms: false,
        notification_webhook_url: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_delisting_preferences') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null, // No email found
              error: null,
            }),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn().mockRejectedValue(new Error('Database error')),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      });

      const result = await notificationService.sendDelistingNotification('success', mockContext);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sendJobCompletionNotification', () => {
    test('should send notification for completed job', async () => {
      const mockJob = {
        id: 'job-123',
        user_id: 'user-123',
        status: 'completed',
        total_failed: 0,
        total_delisted: 2,
        sale_price: 250.00,
        sold_on_marketplace: 'ebay',
        marketplaces_targeted: ['poshmark', 'facebook_marketplace'],
        marketplaces_completed: ['poshmark', 'facebook_marketplace'],
        marketplaces_failed: [],
        inventory_items: {
          title: 'Vintage Designer Jacket',
          brand: 'Gucci',
        },
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'delisting_jobs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
          };
        }
        if (table === 'user_delisting_preferences') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { notification_email: true, notification_app: false },
              error: null,
            }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { email: 'test@example.com' },
              error: null,
            }),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      });

      const result = await notificationService.sendJobCompletionNotification('job-123');

      expect(result.success).toBe(true);
    });

    test('should handle job not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      });

      const result = await notificationService.sendJobCompletionNotification('nonexistent-job');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Delisting job not found');
    });
  });

  describe('Webhook Notifications', () => {
    test('should send webhook notification successfully', async () => {
      const mockPreferences = {
        notification_email: false,
        notification_app: false,
        notification_sms: false,
        notification_webhook_url: 'https://example.com/webhook',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_delisting_preferences') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await notificationService.sendDelistingNotification('success', mockContext);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'NetPost-Delisting/1.0',
          }),
          body: expect.stringContaining('delisting_completed'),
        })
      );
    });

    test('should handle webhook failures', async () => {
      const mockPreferences = {
        notification_email: false,
        notification_app: false,
        notification_sms: false,
        notification_webhook_url: 'https://example.com/webhook',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_delisting_preferences') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
          };
        }
        if (table === 'delisting_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await notificationService.sendDelistingNotification('success', mockContext);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('webhook');
    });
  });
});