/**
 * Email Templates for Subscription System
 * Comprehensive templates for all subscription-related emails
 */

import { EmailTemplate } from './email-service';

export interface SubscriptionEmailContext {
  userName?: string;
  userEmail?: string;
  subscriptionTier?: string;
  usageMetric?: string;
  usageValue?: number;
  usageLimit?: number;
  usagePercentage?: number;
  billingAmount?: number;
  nextBillingDate?: string;
  accountUrl?: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
  // Beta-specific
  betaCode?: string;
  betaExpiryDate?: string;
  // Additional context
  companyName?: string;
  customMessage?: string;
}

/**
 * Beta Welcome Email
 * Sent when a user is invited to the beta program
 */
export function createBetaWelcomeTemplate(context: SubscriptionEmailContext): EmailTemplate {
  const userName = context.userName || 'there';
  const betaCode = context.betaCode || '';
  const accountUrl = context.accountUrl || '#';

  return {
    subject: '🎉 Welcome to NetPost Beta - Your AI Reselling Assistant',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NetPost Beta</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
          .beta-code { background: #f8f9fa; border: 2px dashed #667eea; padding: 16px; text-align: center; margin: 16px 0; border-radius: 6px; }
          .feature-list { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 16px 0; }
          .feature-item { margin: 8px 0; }
          .highlight { color: #667eea; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to NetPost Beta!</h1>
          <p>Your AI-Powered Reselling Assistant</p>
        </div>

        <div class="content">
          <h2>Hi ${userName}!</h2>

          <p>Congratulations! You've been accepted into the <strong>NetPost Beta program</strong>. We're excited to have you as one of our early users helping shape the future of AI-assisted reselling.</p>

          ${betaCode ? `
          <div class="beta-code">
            <h3>Your Beta Access Code</h3>
            <h2 style="color: #667eea; font-family: monospace; letter-spacing: 2px;">${betaCode}</h2>
            <p>Save this code - you'll need it to access your account</p>
          </div>
          ` : ''}

          <h3>🚀 What You Get With Beta Access</h3>
          <div class="feature-list">
            <div class="feature-item">✅ <span class="highlight">Unlimited inventory management</span> - Add as many items as you want</div>
            <div class="feature-item">✅ <span class="highlight">Cross-listing to all marketplaces</span> - eBay, Poshmark, Mercari, Facebook Marketplace, Depop</div>
            <div class="feature-item">✅ <span class="highlight">AI-powered descriptions and pricing</span> - Let AI write your listings</div>
            <div class="feature-item">✅ <span class="highlight">Automated de-listing</span> - When items sell, we remove them everywhere else</div>
            <div class="feature-item">✅ <span class="highlight">Advanced analytics</span> - Track your sales and optimize your strategy</div>
            <div class="feature-item">✅ <span class="highlight">Priority support</span> - Direct access to our team</div>
          </div>

          <h3>🎯 Getting Started</h3>
          <p>Ready to revolutionize your reselling business? Here's what to do next:</p>
          <ol>
            <li>Log into your account using the button below</li>
            <li>Connect your first marketplace account</li>
            <li>Add your first inventory items</li>
            <li>Let our AI create optimized listings</li>
            <li>Watch your sales grow!</li>
          </ol>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${accountUrl}" class="btn">Access Your Beta Account</a>
          </div>

          <h3>💬 We Want Your Feedback</h3>
          <p>As a beta user, your feedback is invaluable. Please don't hesitate to reach out with:</p>
          <ul>
            <li>Feature requests and suggestions</li>
            <li>Bug reports or issues</li>
            <li>Ideas for improvements</li>
            <li>Success stories and wins!</li>
          </ul>

          <p>Simply reply to this email or contact us through the in-app support chat.</p>

          <p>Thank you for being part of the NetPost beta journey. Let's build something amazing together!</p>

          <p>Best regards,<br>The NetPost Team</p>
        </div>

        <div class="footer">
          <p>This email was sent to ${context.userEmail}. You're receiving this because you joined the NetPost Beta program.</p>
          <p>NetPost - AI-Powered Reselling Assistant | <a href="${context.supportUrl}">Support</a> | <a href="${context.unsubscribeUrl}">Unsubscribe</a></p>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to NetPost Beta!

      Hi ${userName}!

      Congratulations! You've been accepted into the NetPost Beta program.

      ${betaCode ? `Your Beta Access Code: ${betaCode}` : ''}

      What You Get With Beta Access:
      ✅ Unlimited inventory management
      ✅ Cross-listing to all marketplaces
      ✅ AI-powered descriptions and pricing
      ✅ Automated de-listing
      ✅ Advanced analytics
      ✅ Priority support

      Getting Started:
      1. Log into your account: ${accountUrl}
      2. Connect your first marketplace account
      3. Add your first inventory items
      4. Let our AI create optimized listings
      5. Watch your sales grow!

      We want your feedback as a beta user. Reply to this email with any suggestions, bug reports, or ideas.

      Thank you for being part of the NetPost beta journey!

      Best regards,
      The NetPost Team
    `
  };
}

/**
 * Usage Warning Email
 * Sent when users are approaching their subscription limits
 */
export function createUsageWarningTemplate(context: SubscriptionEmailContext): EmailTemplate {
  const userName = context.userName || 'there';
  const usageMetric = context.usageMetric || 'usage';
  const usageValue = context.usageValue || 0;
  const usageLimit = context.usageLimit || 100;
  const usagePercentage = context.usagePercentage || Math.round((usageValue / usageLimit) * 100);
  const subscriptionTier = context.subscriptionTier || 'current plan';
  const accountUrl = context.accountUrl || '#';

  const isHighUsage = usagePercentage >= 90;
  const warningIcon = isHighUsage ? '🚨' : '⚠️';
  const urgency = isHighUsage ? 'urgent' : 'important';

  return {
    subject: `${warningIcon} ${usagePercentage}% ${usageMetric} limit reached - ${urgency} action needed`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Usage Limit Warning</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isHighUsage ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' : 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 8px; }
          .btn-primary { background: #28a745; }
          .btn-secondary { background: #6c757d; }
          .usage-bar { background: #e9ecef; border-radius: 10px; height: 20px; margin: 16px 0; overflow: hidden; }
          .usage-fill { background: ${isHighUsage ? '#dc3545' : '#ffc107'}; height: 100%; transition: width 0.3s ease; width: ${usagePercentage}%; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
          .stat-card { background: #f8f9fa; padding: 16px; border-radius: 6px; text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
          .upgrade-benefits { background: #e8f5e8; border: 1px solid #28a745; border-radius: 6px; padding: 20px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${warningIcon} Usage Limit Warning</h1>
          <p>You're ${isHighUsage ? 'very close to' : 'approaching'} your ${usageMetric} limit</p>
        </div>

        <div class="content">
          <h2>Hi ${userName},</h2>

          <p>${isHighUsage ?
            `<strong>Urgent:</strong> You've used ${usagePercentage}% of your ${usageMetric} limit on your ${subscriptionTier}.` :
            `You're approaching your ${usageMetric} limit on your ${subscriptionTier}.`
          }</p>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${usageValue}</div>
              <div>Used</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${usageLimit}</div>
              <div>Limit</div>
            </div>
          </div>

          <div class="usage-bar">
            <div class="usage-fill"></div>
          </div>
          <p style="text-align: center; margin-top: 8px;"><strong>${usagePercentage}% of your ${usageMetric} limit used</strong></p>

          <h3>🚀 Upgrade to Continue Growing</h3>
          <p>Don't let limits slow down your reselling success! Upgrade to unlock:</p>

          <div class="upgrade-benefits">
            <h4>✨ Pro Plan Benefits</h4>
            <ul>
              <li><strong>Unlimited ${usageMetric}</strong> - No more worrying about limits</li>
              <li><strong>Advanced AI features</strong> - Better pricing and descriptions</li>
              <li><strong>Priority support</strong> - Get help when you need it</li>
              <li><strong>Advanced analytics</strong> - Deeper insights into your business</li>
              <li><strong>Custom integrations</strong> - Connect to more platforms</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${accountUrl}?action=upgrade" class="btn btn-primary">Upgrade Now</a>
            <a href="${accountUrl}" class="btn btn-secondary">View Account</a>
          </div>

          <h3>💡 Tips to Optimize Your Current Plan</h3>
          <ul>
            <li>Remove unused or old inventory items</li>
            <li>Archive sold items to free up space</li>
            <li>Use bulk editing to manage items more efficiently</li>
            <li>Consider which marketplaces give you the best ROI</li>
          </ul>

          <p>${isHighUsage ?
            'Your account will be restricted once you reach 100% of your limit. Upgrade now to avoid any interruption to your business.' :
            'We recommend upgrading before you reach your limit to ensure uninterrupted service.'
          }</p>

          <p>Questions? Reply to this email or contact our support team.</p>

          <p>Best regards,<br>The NetPost Team</p>
        </div>

        <div class="footer">
          <p>This email was sent to ${context.userEmail}. You're receiving this because you're a NetPost user.</p>
          <p>NetPost - AI-Powered Reselling Assistant | <a href="${context.supportUrl}">Support</a> | <a href="${context.unsubscribeUrl}">Unsubscribe</a></p>
        </div>
      </body>
      </html>
    `,
    text: `
      Usage Limit Warning

      Hi ${userName},

      ${isHighUsage ?
        `URGENT: You've used ${usagePercentage}% of your ${usageMetric} limit on your ${subscriptionTier}.` :
        `You're approaching your ${usageMetric} limit on your ${subscriptionTier}.`
      }

      Current Usage: ${usageValue} / ${usageLimit} (${usagePercentage}%)

      Upgrade to Pro Plan Benefits:
      ✅ Unlimited ${usageMetric}
      ✅ Advanced AI features
      ✅ Priority support
      ✅ Advanced analytics
      ✅ Custom integrations

      Upgrade now: ${accountUrl}?action=upgrade

      Tips to optimize your current plan:
      - Remove unused inventory items
      - Archive sold items
      - Use bulk editing features
      - Focus on high-ROI marketplaces

      ${isHighUsage ?
        'Your account will be restricted at 100% usage. Upgrade now to avoid interruption.' :
        'We recommend upgrading before reaching your limit.'
      }

      Questions? Reply to this email.

      Best regards,
      The NetPost Team
    `
  };
}

/**
 * Payment Failed Email
 * Sent when a subscription payment fails
 */
export function createPaymentFailedTemplate(context: SubscriptionEmailContext): EmailTemplate {
  const userName = context.userName || 'there';
  const billingAmount = context.billingAmount || 0;
  const subscriptionTier = context.subscriptionTier || 'subscription';
  const accountUrl = context.accountUrl || '#';

  return {
    subject: '🚨 Payment Failed - Update Your Payment Method',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
          .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 16px; border-radius: 6px; margin: 16px 0; }
          .steps { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 16px 0; }
          .step { margin: 12px 0; padding-left: 24px; position: relative; }
          .step::before { content: attr(data-step); position: absolute; left: 0; top: 0; background: #667eea; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 Payment Failed</h1>
          <p>Action Required to Continue Your Service</p>
        </div>

        <div class="content">
          <h2>Hi ${userName},</h2>

          <div class="alert-box">
            <strong>Payment Failed:</strong> We were unable to process your payment of $${(billingAmount / 100).toFixed(2)} for your ${subscriptionTier}.
          </div>

          <p>Your subscription is now <strong>past due</strong>, but don't worry - we'll keep your account active for a few days while you update your payment information.</p>

          <h3>🔧 How to Fix This</h3>
          <div class="steps">
            <div class="step" data-step="1">
              <strong>Update Your Payment Method</strong><br>
              Add a new credit card or update your existing payment information.
            </div>
            <div class="step" data-step="2">
              <strong>Verify Your Information</strong><br>
              Make sure your billing address and card details are correct.
            </div>
            <div class="step" data-step="3">
              <strong>Retry Payment</strong><br>
              We'll automatically retry the payment with your updated information.
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${accountUrl}?action=update-payment" class="btn">Update Payment Method</a>
          </div>

          <h3>❓ Common Reasons for Payment Failures</h3>
          <ul>
            <li><strong>Expired card:</strong> Your credit card may have expired</li>
            <li><strong>Insufficient funds:</strong> Your account may not have enough balance</li>
            <li><strong>Bank security:</strong> Your bank may have blocked the transaction</li>
            <li><strong>Changed details:</strong> Your billing address or card info may have changed</li>
          </ul>

          <h3>⏰ What Happens Next?</h3>
          <p>If you don't update your payment method within <strong>7 days</strong>:</p>
          <ul>
            <li>Your account will be temporarily suspended</li>
            <li>You won't be able to create new listings</li>
            <li>Existing listings will remain active</li>
            <li>Your data will be safely stored for 30 days</li>
          </ul>

          <p>Need help? Our support team is here to assist you with any billing questions.</p>

          <p>Best regards,<br>The NetPost Team</p>
        </div>

        <div class="footer">
          <p>This email was sent to ${context.userEmail}. You're receiving this because you're a NetPost subscriber.</p>
          <p>NetPost - AI-Powered Reselling Assistant | <a href="${context.supportUrl}">Support</a> | <a href="${context.unsubscribeUrl}">Unsubscribe</a></p>
        </div>
      </body>
      </html>
    `,
    text: `
      Payment Failed - Action Required

      Hi ${userName},

      We were unable to process your payment of $${(billingAmount / 100).toFixed(2)} for your ${subscriptionTier}.

      Your subscription is now past due, but we'll keep your account active for a few days while you update your payment information.

      How to Fix This:
      1. Update Your Payment Method - Add a new card or update existing info
      2. Verify Your Information - Check billing address and card details
      3. Retry Payment - We'll automatically retry with updated info

      Update payment: ${accountUrl}?action=update-payment

      Common reasons for payment failures:
      - Expired credit card
      - Insufficient funds
      - Bank security blocks
      - Changed billing details

      What happens next:
      If you don't update within 7 days:
      - Account temporarily suspended
      - Can't create new listings
      - Existing listings remain active
      - Data stored safely for 30 days

      Need help? Contact our support team.

      Best regards,
      The NetPost Team
    `
  };
}

/**
 * Subscription Change Confirmation Email
 * Sent when users upgrade, downgrade, or cancel their subscription
 */
export function createSubscriptionChangeTemplate(
  context: SubscriptionEmailContext & {
    changeType: 'upgrade' | 'downgrade' | 'cancel';
    oldTier?: string;
    newTier?: string;
    effectiveDate?: string;
  }
): EmailTemplate {
  const userName = context.userName || 'there';
  const { changeType, oldTier, newTier, effectiveDate } = context;
  const accountUrl = context.accountUrl || '#';

  const getSubjectAndContent = () => {
    switch (changeType) {
      case 'upgrade':
        return {
          subject: '🚀 Subscription Upgraded Successfully',
          emoji: '🚀',
          title: 'Subscription Upgraded!',
          message: `You've successfully upgraded from ${oldTier} to ${newTier}. Welcome to your enhanced NetPost experience!`,
          benefits: [
            'Increased limits and features',
            'Priority customer support',
            'Advanced AI capabilities',
            'Enhanced analytics dashboard'
          ]
        };
      case 'downgrade':
        return {
          subject: '📋 Subscription Changed Successfully',
          emoji: '📋',
          title: 'Subscription Updated',
          message: `You've changed your subscription from ${oldTier} to ${newTier}. The changes will take effect ${effectiveDate || 'at your next billing cycle'}.`,
          benefits: [
            'Continue using current features until change takes effect',
            'Manage your subscription anytime',
            'Upgrade again whenever you need more features'
          ]
        };
      case 'cancel':
        return {
          subject: '😢 Subscription Cancelled - We\'ll Miss You',
          emoji: '😢',
          title: 'Subscription Cancelled',
          message: `We're sorry to see you go! Your subscription has been cancelled and will remain active until ${effectiveDate || 'the end of your current billing period'}.`,
          benefits: [
            'Your account remains active until the end of your billing period',
            'All your data will be safely stored',
            'You can reactivate anytime',
            'No additional charges will be made'
          ]
        };
      default:
        return {
          subject: 'Subscription Updated',
          emoji: '📋',
          title: 'Subscription Changed',
          message: 'Your subscription has been updated.',
          benefits: []
        };
    }
  };

  const content = getSubjectAndContent();

  return {
    subject: content.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Change Confirmation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
          .info-box { background: #e8f4fd; border: 1px solid #b8daff; padding: 16px; border-radius: 6px; margin: 16px 0; }
          .benefits-list { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${content.emoji} ${content.title}</h1>
          <p>Your subscription change is confirmed</p>
        </div>

        <div class="content">
          <h2>Hi ${userName},</h2>

          <p>${content.message}</p>

          ${oldTier && newTier ? `
          <div class="info-box">
            <h3>Change Details</h3>
            <p><strong>Previous Plan:</strong> ${oldTier}</p>
            <p><strong>New Plan:</strong> ${newTier}</p>
            ${effectiveDate ? `<p><strong>Effective Date:</strong> ${effectiveDate}</p>` : ''}
          </div>
          ` : ''}

          ${content.benefits.length > 0 ? `
          <div class="benefits-list">
            <h3>What This Means</h3>
            <ul>
              ${content.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${accountUrl}" class="btn">Manage Your Account</a>
          </div>

          ${changeType === 'cancel' ? `
          <h3>🔄 Changed Your Mind?</h3>
          <p>You can reactivate your subscription anytime before your current period ends. All your data and settings will be preserved.</p>
          ` : ''}

          <p>If you have any questions about this change, please don't hesitate to contact our support team.</p>

          <p>Thank you for being a NetPost customer!</p>

          <p>Best regards,<br>The NetPost Team</p>
        </div>

        <div class="footer">
          <p>This email was sent to ${context.userEmail}. You're receiving this as a subscription confirmation.</p>
          <p>NetPost - AI-Powered Reselling Assistant | <a href="${context.supportUrl}">Support</a></p>
        </div>
      </body>
      </html>
    `,
    text: `
      ${content.title}

      Hi ${userName},

      ${content.message}

      ${oldTier && newTier ? `
      Change Details:
      Previous Plan: ${oldTier}
      New Plan: ${newTier}
      ${effectiveDate ? `Effective Date: ${effectiveDate}` : ''}
      ` : ''}

      ${content.benefits.length > 0 ? `
      What This Means:
      ${content.benefits.map(benefit => `- ${benefit}`).join('\n')}
      ` : ''}

      Manage your account: ${accountUrl}

      ${changeType === 'cancel' ? `
      Changed Your Mind?
      You can reactivate your subscription anytime before your current period ends.
      ` : ''}

      Questions? Contact our support team.

      Thank you for being a NetPost customer!

      Best regards,
      The NetPost Team
    `
  };
}

/**
 * Beta Feedback Request Email
 * Sent periodically to beta users requesting feedback
 */
export function createBetaFeedbackTemplate(context: SubscriptionEmailContext): EmailTemplate {
  const userName = context.userName || 'there';
  const accountUrl = context.accountUrl || '#';

  return {
    subject: '💭 How is your NetPost Beta experience? Share your feedback',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Beta Feedback Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 8px; }
          .feedback-section { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 16px 0; }
          .question { margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💭 Your Feedback Matters</h1>
          <p>Help us improve NetPost</p>
        </div>

        <div class="content">
          <h2>Hi ${userName},</h2>

          <p>You've been using NetPost Beta for a while now, and your experience is incredibly valuable to us! As one of our beta users, your feedback directly shapes the future of our platform.</p>

          <div class="feedback-section">
            <h3>🤔 We'd Love to Know</h3>
            <div class="question">
              <strong>What's working great?</strong><br>
              Which features are you loving? What's making your reselling easier?
            </div>
            <div class="question">
              <strong>What's frustrating?</strong><br>
              Any bugs, confusing interfaces, or missing features?
            </div>
            <div class="question">
              <strong>What would you add?</strong><br>
              If you could wave a magic wand, what new features would appear?
            </div>
            <div class="question">
              <strong>How's your business growing?</strong><br>
              Are you seeing increased sales or better efficiency?
            </div>
          </div>

          <h3>🎁 Feedback Incentive</h3>
          <p>As a thank you for your detailed feedback, we're offering:</p>
          <ul>
            <li><strong>Extended beta access</strong> when we launch publicly</li>
            <li><strong>50% discount</strong> on your first year of paid subscription</li>
            <li><strong>Beta contributor badge</strong> in your profile</li>
            <li><strong>Early access</strong> to new features</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:beta@netpost.com?subject=NetPost Beta Feedback from ${userName}" class="btn">Email Your Feedback</a>
            <a href="${accountUrl}?feedback=true" class="btn">Submit via Dashboard</a>
          </div>

          <h3>📅 Optional: Quick Chat?</h3>
          <p>Want to hop on a 15-minute call to share your thoughts? We'd love to hear your voice and dive deeper into your experience. Just reply to this email with a few times that work for you!</p>

          <p>Your insights are what make NetPost better for everyone. Thank you for being an amazing beta partner!</p>

          <p>Best regards,<br>The NetPost Team</p>
        </div>

        <div class="footer">
          <p>This email was sent to ${context.userEmail}. You're receiving this as a NetPost Beta user.</p>
          <p>NetPost - AI-Powered Reselling Assistant | <a href="${context.supportUrl}">Support</a> | <a href="${context.unsubscribeUrl}">Unsubscribe</a></p>
        </div>
      </body>
      </html>
    `,
    text: `
      Your Feedback Matters

      Hi ${userName},

      You've been using NetPost Beta for a while now, and your experience is incredibly valuable to us!

      We'd Love to Know:

      What's working great?
      - Which features are you loving?
      - What's making your reselling easier?

      What's frustrating?
      - Any bugs or confusing interfaces?
      - Missing features?

      What would you add?
      - If you could wave a magic wand, what new features would appear?

      How's your business growing?
      - Are you seeing increased sales or better efficiency?

      Feedback Incentive:
      ✅ Extended beta access when we launch publicly
      ✅ 50% discount on your first year of paid subscription
      ✅ Beta contributor badge in your profile
      ✅ Early access to new features

      Email your feedback: beta@netpost.com
      Submit via dashboard: ${accountUrl}?feedback=true

      Optional: Want to hop on a 15-minute call? Reply with times that work for you!

      Thank you for being an amazing beta partner!

      Best regards,
      The NetPost Team
    `
  };
}

// Export all template creators
export const subscriptionEmailTemplates = {
  betaWelcome: createBetaWelcomeTemplate,
  usageWarning: createUsageWarningTemplate,
  paymentFailed: createPaymentFailedTemplate,
  subscriptionChange: createSubscriptionChangeTemplate,
  betaFeedback: createBetaFeedbackTemplate,
};