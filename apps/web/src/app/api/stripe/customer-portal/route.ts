import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';
import StripeService from '@/lib/subscription/stripe-service';
import { SubscriptionService } from '@/lib/subscription/subscription-service';

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's subscription to get stripeCustomerId
    const sub = await SubscriptionService.getUserSubscription(user.id);
    if (!sub || !sub.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer associated with user' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const portal = await StripeService.createBillingPortalSession({
      customerId: sub.stripeCustomerId,
      returnUrl: `${appUrl}/account`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error('Error creating billing portal session:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

