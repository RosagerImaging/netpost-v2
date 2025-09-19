/**
 * Email Integration Tests
 * Tests for the complete email notification system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../notification-service';
import { emailService } from '../../services/email-service';

// Mock the email service
vi.mock('../../services/email-service', () => ({
  emailService: {
    sendEmail: vi.fn(),
  },
}));

describe('Email Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up test environment variables
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.netpost.com';
    process.env.RESEND_FROM_EMAIL = 'test@netpost.com';
    process.env.RESEND_FROM_NAME = 'NetPost Test';
  });

  describe('Welcome Email', () => {
    it('should send welcome email with beta code', async () => {
      const mockResult = {
        success: true,
        messageId: 'test-message-id',
        provider: 'resend' as const,
        timestamp: new Date(),
      };

      vi.mocked(emailService.sendEmail).mockResolvedValue(mockResult);

      const result = await NotificationService.sendWelcomeEmail(
        'test@example.com',
        'John Doe',
        'beta',
        'BETA2024'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Welcome to NetPost Beta'),
          html: expect.stringContaining('BETA2024'),
          text: expect.stringContaining('BETA2024'),
        })
      );
    });

    it('should handle email sending failure gracefully', async () => {
      vi.mocked(emailService.sendEmail).mockRejectedValue(
        new Error('Email service unavailable')
      );

      const result = await NotificationService.sendWelcomeEmail(
        'test@example.com',
        'John Doe',
        'beta'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service unavailable');
    });
  });

  describe('Usage Warning Email', () => {
    it('should send usage warning with correct percentage', async () => {
      const mockResult = {
        success: true,
        messageId: 'warning-message-id',
        provider: 'resend' as const,
        timestamp: new Date(),
      };

      vi.mocked(emailService.sendEmail).mockResolvedValue(mockResult);

      const result = await NotificationService.sendUsageWarning(
        'user@example.com',
        'Jane Smith',
        'inventory_items',
        85,
        100,
        'hobbyist'
      );

      expect(result.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('85% inventory_items limit reached'),
          html: expect.stringContaining('85%'),
          text: expect.stringContaining('85%'),
        })
      );
    });

    it('should calculate usage percentage correctly', async () => {
      const mockResult = {
        success: true,
        messageId: 'test-id',
        provider: 'resend' as const,
        timestamp: new Date(),
      };

      vi.mocked(emailService.sendEmail).mockResolvedValue(mockResult);

      await NotificationService.sendUsageWarning(
        'user@example.com',
        'Test User',
        'api_calls',
        750,
        1000,
        'trial'
      );

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('75%'),
        })
      );
    });
  });

  describe('Payment Failed Email', () => {
    it('should send payment failed notification with amount', async () => {
      const mockResult = {
        success: true,
        messageId: 'payment-failed-id',
        provider: 'resend' as const,
        timestamp: new Date(),
      };

      vi.mocked(emailService.sendEmail).mockResolvedValue(mockResult);

      const result = await NotificationService.sendPaymentFailed(
        'customer@example.com',
        'John Customer',
        2999, // $29.99 in cents
        'pro'
      );

      expect(result.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: expect.stringContaining('Payment Failed'),
          html: expect.stringContaining('$29.99'),
          text: expect.stringContaining('$29.99'),
        })
      );
    });
  });

  describe('Subscription Change Emails', () => {
    it('should send upgrade confirmation', async () => {
      const mockResult = {
        success: true,
        messageId: 'upgrade-id',
        provider: 'resend' as const,
        timestamp: new Date(),
      };

      vi.mocked(emailService.sendEmail).mockResolvedValue(mockResult);

      const result = await NotificationService.sendSubscriptionUpgrade(
        'user@example.com',
        'Upgrading User',
        'hobbyist',
        'pro',
        '2024-10-01'
      );

      expect(result.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Subscription Upgraded'),
          html: expect.stringMatching(/hobbyist.*pro/i),
        })
      );
    });

    it('should send cancellation confirmation', async () => {
      const mockResult = {
        success: true,
        messageId: 'cancel-id',
        provider: 'resend' as const,
        timestamp: new Date(),
      };

      vi.mocked(emailService.sendEmail).mockResolvedValue(mockResult);

      const result = await NotificationService.sendSubscriptionCanceled(
        'user@example.com',
        'Canceling User',
        'pro',
        '2024-10-15'
      );

      expect(result.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Cancelled'),
          html: expect.stringContaining('2024-10-15'),
        })
      );
    });
  });

  describe('Beta Feedback Email', () => {
    it('should send beta feedback request', async () => {
      const mockResult = {
        success: true,
        messageId: 'feedback-id',
        provider: 'resend' as const,
        timestamp: new Date(),
      };

      vi.mocked(emailService.sendEmail).mockResolvedValue(mockResult);

      const result = await NotificationService.sendBetaFeedbackRequest(
        'beta@example.com',
        'Beta Tester'
      );

      expect(result.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'beta@example.com',
          subject: expect.stringContaining('feedback'),
          html: expect.stringMatching(/feedback.*matters/i),
        })
      );
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use environment variables in email context', async () => {
      const mockResult = {
        success: true,
        messageId: 'env-test-id',
        provider: 'resend' as const,
        timestamp: new Date(),
      };

      vi.mocked(emailService.sendEmail).mockResolvedValue(mockResult);

      await NotificationService.sendWelcomeEmail(
        'test@example.com',
        'Test User',
        'beta'
      );

      const emailCall = vi.mocked(emailService.sendEmail).mock.calls[0][0];

      expect(emailCall.html).toContain('https://test.netpost.com/subscription');
      expect(emailCall.html).toContain('https://test.netpost.com/support');
      expect(emailCall.html).toContain('https://test.netpost.com/unsubscribe');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(emailService.sendEmail).mockRejectedValue(
        new Error('Network timeout')
      );

      const result = await NotificationService.sendWelcomeEmail(
        'test@example.com',
        'Test User',
        'beta'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });

    it('should handle email service configuration errors', async () => {
      vi.mocked(emailService.sendEmail).mockRejectedValue(
        new Error('Invalid API key')
      );

      const result = await NotificationService.sendPaymentFailed(
        'test@example.com',
        'Test User',
        1999,
        'hobbyist'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });
});