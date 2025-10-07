/**
 * Subscription Notification Service
 * Handles email notifications for subscription events using EmailService and templates
 */

import { emailService } from '../services/email-service';
import {
  subscriptionEmailTemplates,
  SubscriptionEmailContext
} from '../services/email-templates';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NotificationService {
  /**
   * Send welcome email to new beta users
   */
  static async sendWelcomeEmail(
    userEmail: string, 
    userName: string, 
    tier: string,
    betaCode?: string
  ): Promise<NotificationResult> {
    try {
      console.log(`📧 Sending welcome email for ${tier} subscription to ${userName} (${userEmail})`);

      const context: SubscriptionEmailContext = {
        userName,
        userEmail,
        subscriptionTier: tier,
        betaCode,
        accountUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`,
        companyName: 'NetPost'
      };

      const template = subscriptionEmailTemplates.betaWelcome(context);
      
      const result = await emailService.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send usage warning email when approaching limits
   */
  static async sendUsageWarning(
    userEmail: string,
    userName: string,
    metricType: string, 
    usage: number, 
    limit: number,
    subscriptionTier: string
  ): Promise<NotificationResult> {
    try {
      console.log(`📧 Sending usage warning for ${metricType}: ${usage}/${limit} to ${userName} (${userEmail})`);

      const usagePercentage = Math.round((usage / limit) * 100);
      
      const context: SubscriptionEmailContext = {
        userName,
        userEmail,
        subscriptionTier,
        usageMetric: metricType,
        usageValue: usage,
        usageLimit: limit,
        usagePercentage,
        accountUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`
      };

      const template = subscriptionEmailTemplates.usageWarning(context);
      
      const result = await emailService.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to send usage warning email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send payment failed notification
   */
  static async sendPaymentFailed(
    userEmail: string,
    userName: string,
    amount: number,
    subscriptionTier: string
  ): Promise<NotificationResult> {
    try {
      console.log(`📧 Sending payment failed notification for $${amount/100} to ${userName} (${userEmail})`);

      const context: SubscriptionEmailContext = {
        userName,
        userEmail,
        subscriptionTier,
        billingAmount: amount,
        accountUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`
      };

      const template = subscriptionEmailTemplates.paymentFailed(context);
      
      const result = await emailService.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to send payment failed email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send subscription cancellation confirmation
   */
  static async sendSubscriptionCanceled(
    userEmail: string,
    userName: string,
    subscriptionTier: string,
    effectiveDate?: string
  ): Promise<NotificationResult> {
    try {
      console.log(`📧 Sending subscription canceled notification to ${userName} (${userEmail})`);

      const context: SubscriptionEmailContext = {
        userName,
        userEmail,
        subscriptionTier,
        accountUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`
      };

      const template = subscriptionEmailTemplates.subscriptionChange({
        ...context,
        changeType: 'cancel',
        oldTier: subscriptionTier,
        effectiveDate
      });
      
      const result = await emailService.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send subscription upgrade confirmation
   */
  static async sendSubscriptionUpgrade(
    userEmail: string,
    userName: string,
    oldTier: string,
    newTier: string,
    effectiveDate?: string
  ): Promise<NotificationResult> {
    try {
      console.log(`📧 Sending subscription upgrade notification to ${userName} (${userEmail})`);

      const context: SubscriptionEmailContext = {
        userName,
        userEmail,
        accountUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`
      };

      const template = subscriptionEmailTemplates.subscriptionChange({
        ...context,
        changeType: 'upgrade',
        oldTier,
        newTier,
        effectiveDate
      });
      
      const result = await emailService.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to send upgrade email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send subscription downgrade confirmation
   */
  static async sendSubscriptionDowngrade(
    userEmail: string,
    userName: string,
    oldTier: string,
    newTier: string,
    effectiveDate?: string
  ): Promise<NotificationResult> {
    try {
      console.log(`📧 Sending subscription downgrade notification to ${userName} (${userEmail})`);

      const context: SubscriptionEmailContext = {
        userName,
        userEmail,
        accountUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`
      };

      const template = subscriptionEmailTemplates.subscriptionChange({
        ...context,
        changeType: 'downgrade',
        oldTier,
        newTier,
        effectiveDate
      });
      
      const result = await emailService.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to send downgrade email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send beta feedback request email
   */
  static async sendBetaFeedbackRequest(
    userEmail: string,
    userName: string
  ): Promise<NotificationResult> {
    try {
      console.log(`📧 Sending beta feedback request to ${userName} (${userEmail})`);

      const context: SubscriptionEmailContext = {
        userName,
        userEmail,
        accountUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`
      };

      const template = subscriptionEmailTemplates.betaFeedback(context);
      
      const result = await emailService.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Failed to send beta feedback email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotifications(
    notifications: Array<{
      userEmail: string;
      userName: string;
      type: 'welcome' | 'usage_warning' | 'payment_failed' | 'cancellation' | 'beta_feedback';
      context: Record<string, unknown>;
    }>
  ): Promise<NotificationResult[]> {
    try {
      console.log(`📧 Sending ${notifications.length} bulk notifications`);

      const recipients = notifications.map(notification => ({
        email: notification.userEmail,
        variables: {
          userName: notification.userName,
          ...notification.context
        }
      }));

      // For bulk notifications, we'll use a generic template
      // In a real implementation, you might want to batch by notification type
      const template = {
        subject: 'NetPost Notification',
        html: '<p>You have a new notification from NetPost.</p>',
        text: 'You have a new notification from NetPost.'
      };

      const results = await emailService.sendBulkEmails(recipients, template);
      
      return results.map(result => ({
        success: result.success,
        messageId: result.messageId,
        error: result.error
      }));
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      return notifications.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}