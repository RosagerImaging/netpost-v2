import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';
import SubscriptionService from '@/lib/subscription/subscription-service';
import StripeService from '@/lib/subscription/stripe-service';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await SubscriptionService.getUserSubscription(user.id);
    let customerId = sub?.stripeCustomerId;
    if (!customerId) {
      // Fallback: attempt to find/create by email
      const cust = await StripeService.getOrCreateCustomer({
        email: user.email as string,
        name: (typeof user.user_metadata === 'object' && user.user_metadata && 'name' in user.user_metadata)
          ? String((user.user_metadata as Record<string, unknown>).name)
          : undefined,
        metadata: { userId: user.id },
      });
      customerId = cust.id;
    }

    const invoicesList = await StripeService.listInvoicesForCustomer(customerId!, 6);

    const invoices = invoicesList.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      hosted_invoice_url: inv.hosted_invoice_url,
      created: inv.created,
      period_start: inv.period_start,
      period_end: inv.period_end,
    }));

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error('Error listing invoices:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

