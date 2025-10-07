import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import StripeService, { STRIPE_PRICES } from '@/lib/subscription/stripe-service';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

const BodySchema = z.object({
  priceId: z.string().optional(),
  tier: z.enum(['beta', 'trial', 'hobbyist', 'pro']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Resolve priceId
    const priceId = parsed.data.priceId || (parsed.data.tier ? STRIPE_PRICES[parsed.data.tier] : undefined);
    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId or tier' }, { status: 400 });
    }

    // Create or find Stripe customer for this user with metadata.userId for webhook linkage
    const customer = await StripeService.getOrCreateCustomer({
      email: user.email as string,
      name: (typeof user.user_metadata === 'object' && user.user_metadata && 'name' in user.user_metadata)
        ? String((user.user_metadata as Record<string, unknown>).name)
        : undefined,
      metadata: { userId: user.id },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await StripeService.createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/checkout/canceled`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url ?? null });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

