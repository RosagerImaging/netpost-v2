/**
 * Stripe Webhooks Handler
 *
 * Processes Stripe webhook events for subscription management
 * Handles subscription lifecycle events and updates local database
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { StripeService } from '@/lib/subscription/stripe-service';
import { SubscriptionService } from '@/lib/subscription/subscription-service';

// Webhook event handlers
const webhookHandlers = {
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.paid': handlePaymentSucceeded,
  'invoice.payment_failed': handlePaymentFailed,
  'customer.created': handleCustomerCreated,
  'customer.updated': handleCustomerUpdated,
  'customer.deleted': handleCustomerDeleted,
} as const;

type WebhookEventType = keyof typeof webhookHandlers;

export async function POST(request: NextRequest) {
  try {
    // Get the raw body and signature
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = StripeService.verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('❌ Invalid webhook signature:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`📥 Received Stripe webhook: ${event.type} (${event.id})`);

    // Handle the event
    const eventType = event.type as WebhookEventType;
    const handler = webhookHandlers[eventType];

    if (handler) {
      try {
        await handler(event);
        console.log(`✅ Successfully processed webhook: ${event.type}`);
      } catch (error) {
        console.error(`❌ Failed to process webhook ${event.type}:`, error);
        return NextResponse.json(
          { error: 'Webhook processing failed' },
          { status: 500 }
        );
      }
    } else {
      console.log(`ℹ️  Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  try {
    // Get customer to find user ID
    const customer = await StripeService.getCustomer(subscription.customer as string);
    if (!customer || !customer.metadata?.userId) {
      throw new Error('Customer not found or missing user ID');
    }

    const userId = customer.metadata.userId;
    const priceId = subscription.items.data[0]?.price?.id;

    if (!priceId) {
      throw new Error('No price ID found in subscription');
    }

    // Determine subscription tier from price ID
    const tier = StripeService.getSubscriptionTierFromPriceId(priceId);
    if (!tier) {
      throw new Error(`Unknown subscription tier for price ID: ${priceId}`);
    }

    // Create subscription in our database
    await SubscriptionService.createSubscription({
      userId,
      tier,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: subscription.status as import('@/lib/subscription/subscription-service').SubscriptionStatus,
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    });

    console.log(`✅ Created subscription for user ${userId} with tier ${tier}`);
  } catch (error) {
    console.error('❌ Failed to handle subscription created:', error);
    throw error;
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  try {
    const priceId = subscription.items.data[0]?.price?.id;
    const tier = priceId ? StripeService.getSubscriptionTierFromPriceId(priceId) : null;

    await SubscriptionService.updateSubscriptionFromStripe({
      stripeSubscriptionId: subscription.id,
      status: subscription.status as import('@/lib/subscription/subscription-service').SubscriptionStatus,
      tier: tier || undefined,
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    });

    console.log(`✅ Updated subscription ${subscription.id}`);
  } catch (error) {
    console.error('❌ Failed to handle subscription updated:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  try {
    await SubscriptionService.updateSubscriptionFromStripe({
      stripeSubscriptionId: subscription.id,
      status: 'canceled',
      canceledAt: new Date(),
    });

    console.log(`✅ Canceled subscription ${subscription.id}`);
  } catch (error) {
    console.error('❌ Failed to handle subscription deleted:', error);
    throw error;
  }
}

/**
 * Handle successful payment event
 */
async function handlePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  try {
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (subId) {
      // Record successful payment
      await SubscriptionService.recordPayment({
        stripeSubscriptionId: subId,
        stripeInvoiceId: invoice.id || '',
        amount: invoice.amount_paid,
        currency: invoice.currency,
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : new Date(),
        success: true,
      });

      // Update subscription status if needed
      if (invoice.billing_reason === 'subscription_cycle') {
        await SubscriptionService.updateSubscriptionFromStripe({
          stripeSubscriptionId: subId,
          status: 'active',
          lastPaymentDate: new Date(invoice.status_transitions.paid_at! * 1000),
        });
      }

      console.log(`✅ Recorded successful payment for subscription ${subId}`);
    }
  } catch (error) {
    console.error('❌ Failed to handle payment succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed payment event
 */
async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  try {
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (subId) {
      // Record failed payment
      await SubscriptionService.recordPayment({
        stripeSubscriptionId: subId,
        stripeInvoiceId: invoice.id || '',
        amount: invoice.amount_due,
        currency: invoice.currency,
        paidAt: new Date(),
        success: false,
        failureReason: 'Payment failed',
      });

      // Update subscription status
      await SubscriptionService.updateSubscriptionFromStripe({
        stripeSubscriptionId: subId,
        status: 'past_due',
      });

      // Send notification about failed payment
      await SubscriptionService.notifyPaymentFailed(subId);

      console.log(`✅ Recorded failed payment for subscription ${subId}`);
    }
  } catch (error) {
    console.error('❌ Failed to handle payment failed:', error);
    throw error;
  }
}

/**
 * Handle customer created event
 */
async function handleCustomerCreated(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;

  try {
    console.log(`✅ Stripe customer created: ${customer.id}`);
    // Customer creation is already handled in our application flow
    // This is mainly for logging and potential future use
  } catch (error) {
    console.error('❌ Failed to handle customer created:', error);
    throw error;
  }
}

/**
 * Handle customer updated event
 */
async function handleCustomerUpdated(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;

  try {
    console.log(`✅ Stripe customer updated: ${customer.id}`);
    // Handle customer updates if needed (email changes, etc.)
  } catch (error) {
    console.error('❌ Failed to handle customer updated:', error);
    throw error;
  }
}

/**
 * Handle customer deleted event
 */
async function handleCustomerDeleted(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;

  try {
    console.log(`✅ Stripe customer deleted: ${customer.id}`);
    // Handle customer deletion if needed
  } catch (error) {
    console.error('❌ Failed to handle customer deleted:', error);
    throw error;
  }
}