/**
 * Email Service for NetPost
 * Handles email delivery using Resend with fallback options
 */

import { Resend } from 'resend';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: EmailTemplate;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'resend' | 'sendgrid' | 'fallback';
  timestamp: Date;
}

/**
 * Core Email Service
 * Provides unified email delivery with multiple provider support
 */
export class EmailService {
  private resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor() {
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@netpost.com';
    this.fromName = process.env.RESEND_FROM_NAME || 'NetPost';
    this.retryAttempts = parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3', 10);
    this.retryDelay = parseInt(process.env.EMAIL_RETRY_DELAY || '1000', 10);

    // Initialize Resend if API key is available
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  /**
   * Send email with automatic retry and fallback
   */
  async sendEmail(options: EmailOptions): Promise<EmailDeliveryResult> {
    const startTime = new Date();

    // Try primary provider (Resend) first
    if (this.resend) {
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          const result = await this.sendWithResend(options);
          return {
            success: true,
            messageId: result.id,
            provider: 'resend',
            timestamp: startTime,
          };
        } catch (error) {
          console.warn(`Resend attempt ${attempt}/${this.retryAttempts} failed:`, error);

          if (attempt < this.retryAttempts) {
            await this.delay(this.retryDelay * attempt);
          }
        }
      }
    }

    // Fallback to console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent (development mode):', {
        to: options.to,
        subject: options.subject,
        html: options.html?.substring(0, 200) + '...',
        text: options.text?.substring(0, 200) + '...',
      });

      return {
        success: true,
        messageId: `dev_${Date.now()}`,
        provider: 'fallback',
        timestamp: startTime,
      };
    }

    // All providers failed
    return {
      success: false,
      error: 'All email providers failed',
      provider: 'resend',
      timestamp: startTime,
    };
  }

  /**
   * Send email using Resend
   */
  private async sendWithResend(options: EmailOptions) {
    if (!this.resend) {
      throw new Error('Resend not initialized');
    }

    type ResendEmailData = {
      from: string;
      to: string[];
      subject: string;
      html?: string;
      text?: string;
      reply_to?: string;
      attachments?: unknown[];
    };

    const emailData: ResendEmailData = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html || options.template?.html,
      text: options.text || options.template?.text,
    };

    if (options.replyTo) {
      emailData.reply_to = options.replyTo;
    }

    if (options.attachments && options.attachments.length > 0) {
      emailData.attachments = options.attachments;
    }

    const result = await this.resend.emails.send(emailData);

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return result.data!;
  }

  /**
   * Send bulk emails (for notifications to multiple users)
   */
  async sendBulkEmails(
    recipients: Array<{ email: string; variables?: Record<string, unknown> }>,
    template: EmailTemplate
  ): Promise<EmailDeliveryResult[]> {
    const results: EmailDeliveryResult[] = [];

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchPromises = batch.map(async (recipient) => {
        const personalizedTemplate = this.personalizeTemplate(template, recipient.variables || {});

        return this.sendEmail({
          to: recipient.email,
          subject: personalizedTemplate.subject,
          html: personalizedTemplate.html,
          text: personalizedTemplate.text,
        });
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason.message,
            provider: 'resend',
            timestamp: new Date(),
          });
        }
      });

      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Validate email address format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email delivery statistics
   */
  async getDeliveryStats(
    _startDate: Date,
    _endDate: Date
  ): Promise<{
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
  }> {
    // This would integrate with your logging/analytics system
    // For now, return mock data
    return {
      sent: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
    };
  }

  /**
   * Personalize email template with variables
   */
  private personalizeTemplate(
    template: EmailTemplate,
    variables: Record<string, unknown>
  ): EmailTemplate {
    let personalizedSubject = template.subject;
    let personalizedHtml = template.html;
    let personalizedText = template.text;

    // Replace variables in format {{variable_name}}
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const stringValue = String(value);

      personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), stringValue);
      personalizedHtml = personalizedHtml.replace(new RegExp(placeholder, 'g'), stringValue);
      personalizedText = personalizedText.replace(new RegExp(placeholder, 'g'), stringValue);
    });

    return {
      subject: personalizedSubject,
      html: personalizedHtml,
      text: personalizedText,
    };
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const emailService = new EmailService();