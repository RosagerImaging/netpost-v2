/**
 * Notification Service for De-listing Activities
 * Handles email, in-app, and SMS notifications for delisting events
 */
import { createClient } from '@/lib/supabase/client';
import { DelistingJob, DelistingJobStatus, MarketplaceType } from '@netpost/shared-types';

export interface NotificationPreferences {
  notification_email: boolean;
  notification_app: boolean;
  notification_sms: boolean;
  notification_webhook_url?: string;
}

export interface NotificationTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  pushContent?: string;
  smsContent?: string;
}

export interface NotificationContext {
  jobId: string;
  userId: string;
  itemTitle: string;
  itemBrand?: string;
  salePrice?: number;
  saleMarketplace: string;
  targetedMarketplaces: string[];
  completedMarketplaces: string[];
  failedMarketplaces: string[];
  totalCompleted: number;
  totalFailed: number;
  errorDetails?: string;
  jobStatus: DelistingJobStatus;
}

export class NotificationService {
  private supabase = createClient();

  /**
   * Send delisting notification based on user preferences
   */
  async sendDelistingNotification(
    notificationType: 'success' | 'partial_failure' | 'complete_failure' | 'confirmation_required',
    context: NotificationContext
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Get user preferences
      const { data: preferences } = await this.supabase
        .from('user_delisting_preferences')
        .select('notification_email, notification_app, notification_sms, notification_webhook_url')
        .eq('user_id', context.userId)
        .single();

      if (!preferences) {
        console.warn(`No notification preferences found for user ${context.userId}`);
        return { success: true, errors: [] };
      }

      // Get notification template
      const template = this.getNotificationTemplate(notificationType, context);

      // Send notifications based on preferences
      const promises: Promise<any>[] = [];

      if (preferences.notification_email) {
        promises.push(this.sendEmailNotification(context.userId, template, context));
      }

      if (preferences.notification_app) {
        promises.push(this.sendInAppNotification(context.userId, template, context));
      }

      if (preferences.notification_sms) {
        promises.push(this.sendSMSNotification(context.userId, template, context));
      }

      if (preferences.notification_webhook_url) {
        promises.push(this.sendWebhookNotification(preferences.notification_webhook_url, context));
      }

      // Execute all notifications
      const results = await Promise.allSettled(promises);

      // Collect errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const type = ['email', 'in-app', 'sms', 'webhook'][index];
          errors.push(`${type}: ${result.reason.message}`);
        }
      });

      // Log notification attempt
      await this.logNotificationAttempt(context, notificationType, errors.length === 0, errors);

      return {
        success: errors.length === 0,
        errors,
      };

    } catch (error) {
      console.error('Error sending delisting notification:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Get notification template based on type and context
   */
  private getNotificationTemplate(
    type: 'success' | 'partial_failure' | 'complete_failure' | 'confirmation_required',
    context: NotificationContext
  ): NotificationTemplate {
    const baseContext = {
      itemTitle: context.itemTitle,
      itemBrand: context.itemBrand || '',
      salePrice: context.salePrice ? `$${context.salePrice.toFixed(2)}` : 'Unknown',
      saleMarketplace: this.formatMarketplaceName(context.saleMarketplace),
      totalCompleted: context.totalCompleted,
      totalFailed: context.totalFailed,
      completedMarketplaces: context.completedMarketplaces.map(m => this.formatMarketplaceName(m)).join(', '),
      failedMarketplaces: context.failedMarketplaces.map(m => this.formatMarketplaceName(m)).join(', '),
    };

    switch (type) {
      case 'success':
        return {
          subject: `✅ Item successfully delisted from ${context.totalCompleted} marketplace${context.totalCompleted > 1 ? 's' : ''}`,
          htmlContent: `
            <h2>🎉 Great news! Your item has been automatically delisted</h2>
            <p><strong>${baseContext.itemTitle}${baseContext.itemBrand ? ` by ${baseContext.itemBrand}` : ''}</strong> sold on ${baseContext.saleMarketplace} for ${baseContext.salePrice}!</p>
            <p>We've successfully removed it from <strong>${baseContext.completedMarketplaces}</strong>.</p>
            <p>No further action required from you.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from NetPost. You can manage your notification preferences in your account settings.</p>
          `,
          textContent: `Great news! ${baseContext.itemTitle} sold on ${baseContext.saleMarketplace} for ${baseContext.salePrice} and has been automatically removed from ${baseContext.completedMarketplaces}. No action required.`,
          pushContent: `Item sold! Automatically delisted from ${context.totalCompleted} marketplace${context.totalCompleted > 1 ? 's' : ''}`,
          smsContent: `NetPost: ${baseContext.itemTitle} sold on ${baseContext.saleMarketplace}! Auto-delisted from ${context.totalCompleted} other marketplace${context.totalCompleted > 1 ? 's' : ''}.`,
        };

      case 'partial_failure':
        return {
          subject: `⚠️ Item partially delisted - ${context.totalFailed} marketplace${context.totalFailed > 1 ? 's' : ''} failed`,
          htmlContent: `
            <h2>⚠️ Partial delisting completed</h2>
            <p><strong>${baseContext.itemTitle}${baseContext.itemBrand ? ` by ${baseContext.itemBrand}` : ''}</strong> sold on ${baseContext.saleMarketplace} for ${baseContext.salePrice}.</p>
            <p>✅ <strong>Successfully delisted from:</strong> ${baseContext.completedMarketplaces}</p>
            <p>❌ <strong>Failed to delist from:</strong> ${baseContext.failedMarketplaces}</p>
            <p>We'll automatically retry the failed delistings. You may want to manually check these marketplaces.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/delisting" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Delisting Dashboard</a>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from NetPost.</p>
          `,
          textContent: `${baseContext.itemTitle} sold on ${baseContext.saleMarketplace}. Delisted from: ${baseContext.completedMarketplaces}. Failed: ${baseContext.failedMarketplaces}. Check dashboard for details.`,
          pushContent: `Delisting partially completed - ${context.totalFailed} marketplace${context.totalFailed > 1 ? 's' : ''} failed`,
          smsContent: `NetPost: ${baseContext.itemTitle} sold! ${context.totalCompleted} delisted, ${context.totalFailed} failed. Check app for details.`,
        };

      case 'complete_failure':
        return {
          subject: `🚨 Delisting failed for all marketplaces - Manual action required`,
          htmlContent: `
            <h2>🚨 Delisting Failed - Action Required</h2>
            <p><strong>${baseContext.itemTitle}${baseContext.itemBrand ? ` by ${baseContext.itemBrand}` : ''}</strong> sold on ${baseContext.saleMarketplace} for ${baseContext.salePrice}.</p>
            <p>❌ <strong>Failed to delist from all targeted marketplaces:</strong> ${baseContext.failedMarketplaces}</p>
            <p><strong>You need to manually remove these listings to avoid overselling.</strong></p>
            ${context.errorDetails ? `<p><strong>Error details:</strong> ${context.errorDetails}</p>` : ''}
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/delisting" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Fix Now</a>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from NetPost.</p>
          `,
          textContent: `URGENT: ${baseContext.itemTitle} sold on ${baseContext.saleMarketplace} but failed to delist from ${baseContext.failedMarketplaces}. Manual action required to avoid overselling.`,
          pushContent: `🚨 Delisting failed - Manual action required`,
          smsContent: `URGENT NetPost: ${baseContext.itemTitle} sold but failed to delist from all marketplaces. Check app immediately.`,
        };

      case 'confirmation_required':
        return {
          subject: `🔔 Confirm delisting for sold item`,
          htmlContent: `
            <h2>🔔 Delisting Confirmation Required</h2>
            <p><strong>${baseContext.itemTitle}${baseContext.itemBrand ? ` by ${baseContext.itemBrand}` : ''}</strong> sold on ${baseContext.saleMarketplace} for ${baseContext.salePrice}.</p>
            <p>Your preferences require manual confirmation before delisting from other marketplaces.</p>
            <p><strong>Marketplaces to delist from:</strong> ${context.targetedMarketplaces.map(m => this.formatMarketplaceName(m)).join(', ')}</p>
            <p>Please confirm whether you want to proceed with delisting.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/delisting?confirm=${context.jobId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Confirm Delisting</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/delisting?cancel=${context.jobId}" style="background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Cancel</a>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from NetPost.</p>
          `,
          textContent: `${baseContext.itemTitle} sold on ${baseContext.saleMarketplace}. Confirmation required to delist from other marketplaces. Check app to confirm.`,
          pushContent: `Confirm delisting for sold item`,
          smsContent: `NetPost: ${baseContext.itemTitle} sold. Confirmation needed to delist from other marketplaces. Check app.`,
        };

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    userId: string,
    template: NotificationTemplate,
    context: NotificationContext
  ): Promise<void> {
    try {
      // Get user email from profile
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profile?.email) {
        throw new Error('User email not found');
      }

      // For now, we'll use a simple email service
      // In production, integrate with SendGrid, Resend, or similar
      const emailData = {
        to: profile.email,
        subject: template.subject,
        html: template.htmlContent,
        text: template.textContent,
      };

      // Mock email sending for now
      console.log('Email would be sent:', emailData);

      // TODO: Integrate with actual email service
      // await emailService.send(emailData);

    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(
    userId: string,
    template: NotificationTemplate,
    context: NotificationContext
  ): Promise<void> {
    try {
      await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'delisting',
          title: template.subject,
          message: template.textContent,
          action_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/delisting`,
          metadata: {
            job_id: context.jobId,
            marketplace: context.saleMarketplace,
            status: context.jobStatus,
          },
        });

    } catch (error) {
      console.error('Error sending in-app notification:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification (optional)
   */
  private async sendSMSNotification(
    userId: string,
    template: NotificationTemplate,
    context: NotificationContext
  ): Promise<void> {
    try {
      // Get user phone number from profile
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('phone_number')
        .eq('id', userId)
        .single();

      if (!profile?.phone_number) {
        throw new Error('User phone number not found');
      }

      // For now, mock SMS sending
      // In production, integrate with Twilio or similar
      const smsData = {
        to: profile.phone_number,
        body: template.smsContent,
      };

      console.log('SMS would be sent:', smsData);

      // TODO: Integrate with actual SMS service
      // await smsService.send(smsData);

    } catch (error) {
      console.error('Error sending SMS notification:', error);
      throw error;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    webhookUrl: string,
    context: NotificationContext
  ): Promise<void> {
    try {
      const payload = {
        event: 'delisting_completed',
        timestamp: new Date().toISOString(),
        data: {
          jobId: context.jobId,
          itemTitle: context.itemTitle,
          saleMarketplace: context.saleMarketplace,
          targetedMarketplaces: context.targetedMarketplaces,
          completedMarketplaces: context.completedMarketplaces,
          failedMarketplaces: context.failedMarketplaces,
          status: context.jobStatus,
        },
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NetPost-Delisting/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

    } catch (error) {
      console.error('Error sending webhook notification:', error);
      throw error;
    }
  }

  /**
   * Log notification attempt for audit purposes
   */
  private async logNotificationAttempt(
    context: NotificationContext,
    type: string,
    success: boolean,
    errors: string[]
  ): Promise<void> {
    try {
      await this.supabase
        .from('delisting_audit_log')
        .insert({
          user_id: context.userId,
          delisting_job_id: context.jobId,
          action: 'notification_sent',
          success,
          error_message: errors.length > 0 ? errors.join('; ') : null,
          context_data: {
            notification_type: type,
            errors,
          },
        });
    } catch (error) {
      console.error('Error logging notification attempt:', error);
      // Don't throw - logging shouldn't break notification flow
    }
  }

  /**
   * Format marketplace name for display
   */
  private formatMarketplaceName(marketplace: string): string {
    const names: Record<string, string> = {
      'ebay': 'eBay',
      'poshmark': 'Poshmark',
      'facebook_marketplace': 'Facebook Marketplace',
      'mercari': 'Mercari',
      'depop': 'Depop',
    };

    return names[marketplace] || marketplace;
  }

  /**
   * Send notification for specific delisting job
   */
  async sendJobCompletionNotification(jobId: string): Promise<{ success: boolean; errors: string[] }> {
    try {
      // Get job details with related data
      const { data: job, error } = await this.supabase
        .from('delisting_jobs')
        .select(`
          *,
          inventory_items!inner(title, brand),
          user_profiles!inner(id)
        `)
        .eq('id', jobId)
        .single();

      if (error || !job) {
        throw new Error(`Delisting job not found: ${jobId}`);
      }

      // Determine notification type based on job status
      let notificationType: 'success' | 'partial_failure' | 'complete_failure';
      if (job.status === 'completed' && job.total_failed === 0) {
        notificationType = 'success';
      } else if (job.status === 'partially_failed' || (job.total_completed > 0 && job.total_failed > 0)) {
        notificationType = 'partial_failure';
      } else {
        notificationType = 'complete_failure';
      }

      // Build notification context
      const context: NotificationContext = {
        jobId: job.id,
        userId: job.user_id,
        itemTitle: job.inventory_items.title,
        itemBrand: job.inventory_items.brand,
        salePrice: job.sale_price,
        saleMarketplace: job.sold_on_marketplace || 'Unknown',
        targetedMarketplaces: job.marketplaces_targeted,
        completedMarketplaces: job.marketplaces_completed || [],
        failedMarketplaces: job.marketplaces_failed || [],
        totalCompleted: job.total_delisted || 0,
        totalFailed: job.total_failed || 0,
        jobStatus: job.status,
      };

      return await this.sendDelistingNotification(notificationType, context);

    } catch (error) {
      console.error('Error sending job completion notification:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Send confirmation required notification
   */
  async sendConfirmationRequiredNotification(jobId: string): Promise<{ success: boolean; errors: string[] }> {
    try {
      // Get job details
      const { data: job, error } = await this.supabase
        .from('delisting_jobs')
        .select(`
          *,
          inventory_items!inner(title, brand),
          user_profiles!inner(id)
        `)
        .eq('id', jobId)
        .single();

      if (error || !job) {
        throw new Error(`Delisting job not found: ${jobId}`);
      }

      const context: NotificationContext = {
        jobId: job.id,
        userId: job.user_id,
        itemTitle: job.inventory_items.title,
        itemBrand: job.inventory_items.brand,
        salePrice: job.sale_price,
        saleMarketplace: job.sold_on_marketplace || 'Unknown',
        targetedMarketplaces: job.marketplaces_targeted,
        completedMarketplaces: [],
        failedMarketplaces: [],
        totalCompleted: 0,
        totalFailed: 0,
        jobStatus: job.status,
      };

      return await this.sendDelistingNotification('confirmation_required', context);

    } catch (error) {
      console.error('Error sending confirmation notification:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();