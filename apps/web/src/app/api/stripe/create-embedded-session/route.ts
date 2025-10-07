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
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const priceId = parsed.data.priceId || (parsed.data.tier ? STRIPE_PRICES[parsed.data.tier] : undefined);
    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId or tier' }, { status: 400 });
    }

    const customer = await StripeService.getOrCreateCustomer({
      email: user.email as string,
      name: (typeof user.user_metadata === 'object' && user.user_metadata && 'name' in user.user_metadata)
        ? String((user.user_metadata as Record<string, unknown>).name)
        : undefined,
      metadata: { userId: user.id },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await StripeService.createEmbeddedCheckoutSession({
      customerId: customer.id,
      priceId,
      returnUrl: `${appUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { userId: user.id },
    });

    // Return client_secret for embedded checkout
    return NextResponse.json({ client_secret: session.client_secret ?? null });
  } catch (err) {
    console.error('Error creating embedded checkout session:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

