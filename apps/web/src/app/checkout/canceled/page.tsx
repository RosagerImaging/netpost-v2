import Link from 'next/link';

export default function CanceledPage() {
  return (
    <div className="mx-auto max-w-2xl p-8 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Checkout canceled</h1>
      <p className="mb-8 text-muted-foreground">You can resume checkout at any time from your subscription page.</p>
      <Link href="/dashboard/subscription" className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground">Back to Subscription</Link>
    </div>
  );
}

