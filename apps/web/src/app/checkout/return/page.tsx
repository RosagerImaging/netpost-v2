import Link from 'next/link';

export default async function ReturnPage({ searchParams }: { searchParams?: Promise<{ session_id?: string }> }) {
  const sp = await searchParams;
  const sessionId = sp?.session_id;
  let summary: { email?: string | null; status?: string | null; amount_total?: number | null } | null = null;
  if (sessionId) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/stripe/checkout-session?id=${sessionId}`, { cache: 'no-store' });
    if (res.ok) {
      const { session } = await res.json();
      summary = {
        email: session.customer_details?.email ?? session.customer_email ?? null,
        status: session.status ?? null,
        amount_total: session.amount_total ?? null,
      };
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Returned from Checkout</h1>
      {sessionId ? (
        <p className="mb-2 text-muted-foreground">Session: {sessionId}</p>
      ) : (
        <p className="mb-2 text-muted-foreground">We could not detect a session id.</p>
      )}
      {summary ? (
        <p className="mb-6 text-muted-foreground">{summary.email ? `Email: ${summary.email} \u2022 ` : ''}Status: {summary.status || '\u2014'}</p>
      ) : null}
      <form action="/api/stripe/customer-portal" method="post">
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Manage Billing</button>
      </form>
      <div className="mt-6">
        <Link href="/" className="text-sm text-muted-foreground underline">Return to dashboard</Link>
      </div>
    </div>
  );
}

