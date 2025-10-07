'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface EmbeddedCheckout {
  mount: (selector: string | HTMLElement) => Promise<void>;
}

interface StripeApi {
  initEmbeddedCheckout: (options: { clientSecret: string }) => Promise<EmbeddedCheckout>;
}

type StripeConstructor = (publishableKey: string) => StripeApi;

interface StripeWindow extends Window {
  Stripe?: StripeConstructor;
}

export default function EmbeddedCheckoutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const params = useSearchParams();

  useEffect(() => {
    const tier = (params?.get('tier') as 'hobbyist' | 'pro' | null) ?? 'hobbyist';
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;

    async function loadStripeJs(): Promise<StripeConstructor> {
      const stripeGlobal = (window as StripeWindow).Stripe;
      if (stripeGlobal) return stripeGlobal;
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://js.stripe.com/v3/';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Stripe.js'));
        document.body.appendChild(s);
      });
      const loadedStripe = (window as StripeWindow).Stripe;
      if (!loadedStripe) {
        throw new Error('Stripe.js failed to initialize');
      }
      return loadedStripe;
    }

    async function init() {
      try {
        const res = await fetch('/api/stripe/create-embedded-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier }),
        });
        if (!res.ok) throw new Error('Failed to create session');
        const { client_secret }: { client_secret: string } = await res.json();
        const StripeCtor = await loadStripeJs();
        const stripe = StripeCtor(publishableKey);
        const checkout = await stripe.initEmbeddedCheckout({ clientSecret: client_secret });
        await checkout.mount('#embedded-checkout');
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : 'Something went wrong';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [params]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Subscribe</h1>
      <p className="mb-6 text-muted-foreground">Secure embedded checkout</p>
      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      )}
      {loading && <div className="mb-4 text-sm text-muted-foreground">Loading checkout…</div>}
      <div id="embedded-checkout" ref={containerRef} />
    </div>
  );
}

