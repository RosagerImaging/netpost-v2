/**
 * User Subscription Dashboard
 * Shows current subscription status, usage metrics, and billing information
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../lib/auth/auth-context';
import { PageHeader } from '../../../components/ui/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
  cn,
} from '@netpost/ui';

async function openBillingPortal() {
  const res = await fetch('/api/stripe/customer-portal', { method: 'POST' });
  if (!res.ok) return alert('Unable to open billing portal');
  const data = await res.json();
  window.location.href = data.url;
}

async function startCheckout(tier: 'hobbyist' | 'pro') {
  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier })
  });
  if (!res.ok) return alert('Unable to start checkout');
  const data = await res.json();
  window.location.href = data.url;
}
import { CreditCard, Receipt } from 'lucide-react';

interface SubscriptionData {
  tier: string;
  status: string;
  currentPeriodEnd: string;
  usage: {
    inventoryItems: { current: number; limit: number };
    apiCalls: { current: number; limit: number };
    storage: { current: number; limit: number };
  };
}

interface InvoiceItem {
  id: string;
  number?: string | null;
  amount_paid: number;
  currency: string;
  status: string;
  hosted_invoice_url?: string | null;
  created: number;
}


export default function SubscriptionPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Mock subscription data for layout
  const subscriptionData = {
    tier: "Free",
    status: "active" as const,
    itemLimit: 10,
    currentItems: 0,
  };

  useEffect(() => {
    // Mock data - replace with actual API call
    setSubscription({
      tier: 'Hobbyist',
      status: 'active',
      currentPeriodEnd: '2025-10-18',
      usage: {
        inventoryItems: { current: 45, limit: 200 },
        apiCalls: { current: 1250, limit: 5000 },
        storage: { current: 340, limit: 1000 },
      },
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch('/api/stripe/invoices', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load invoices');
        const data = await res.json();
        setInvoices(data.invoices || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInvoices(false);
      }
    }
    loadInvoices();
  }, []);

  if (loading) {
    return (
      <DashboardLayout
        user={user?.email ? {
          email: user.email,
          name: user.user_metadata?.name,
          subscription: subscriptionData
        } : undefined}
      >
        <div className="p-6">Loading subscription details...</div>
      </DashboardLayout>
    );
  }

  if (!subscription) {
    return (
      <DashboardLayout
        user={user?.email ? {
          email: user.email,
          name: user.user_metadata?.name,
          subscription: subscriptionData
        } : undefined}
      >
        <div className="p-6">No subscription found</div>
      </DashboardLayout>
    );
  }

  const getUsagePercentage = (current: number, limit: number) => {
    return limit === -1 ? 0 : Math.round((current / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-300';
    if (percentage >= 75) return 'text-amber-300';
    return 'text-emerald-200';
  };

  return (
    <DashboardLayout
      user={user?.email ? {
        email: user.email,
        name: user.user_metadata?.name,
        subscription: subscriptionData
      } : undefined}
    >
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-12">
        <PageHeader
          eyebrow="Account"
          title="Subscription"

          subtitle="Monitor plan limits, usage, and billing history to keep your business running smoothly."
          icon={<CreditCard className="h-7 w-7 text-primary" />}
          actions={(
            <div className="flex items-center gap-3">
              <Button variant="accent" onClick={() => openBillingPortal()}>Manage Billing</Button>
            </div>
          )}
        />

        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-muted-foreground">
              <span>Current Plan</span>
              <Badge variant="secondary" className="glass-card border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                {subscription.tier}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your subscription is {subscription.status} • Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
            <Button variant="accent" onClick={() => startCheckout('hobbyist')}>Upgrade Plan</Button>
              <Button variant="secondary" className="md:ml-3" asChild>
                <a href="/checkout/embedded?tier=hobbyist">Try Embedded Checkout</a>
              </Button>
            <Button variant="outline" className="glass-button md:ml-3" onClick={() => openBillingPortal()}>Manage Billing</Button>
          </CardContent>
        </Card>

        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Choose your plan</CardTitle>
            <CardDescription>Upgrade anytime. Cancel anytime.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">Hobbyist</div>
                <div className="mb-4 text-3xl font-semibold text-foreground">$9.99<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <ul className="mb-4 list-disc pl-5 text-sm text-muted-foreground">
                  <li>Up to 200 inventory items</li>
                  <li>3 marketplace connections</li>
                  <li>5,000 API calls/month</li>
                  <li>1GB storage</li>
                  <li>Bulk operations</li>
                </ul>
                <div className="flex gap-2">
                  <Button variant="accent" onClick={() => startCheckout('hobbyist')}>Get Hobbyist</Button>
                  <Button variant="secondary" asChild>
                    <a href="/checkout/embedded?tier=hobbyist">Try Embedded</a>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 ring-1 ring-primary/20">
                <div className="mb-2 text-sm uppercase tracking-wider text-primary">Pro</div>
                <div className="mb-4 text-3xl font-semibold text-foreground">$29.99<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <ul className="mb-4 list-disc pl-5 text-sm text-muted-foreground">
                  <li>Unlimited inventory items</li>
                  <li>Unlimited marketplace connections</li>
                  <li>Unlimited API</li>
                  <li>Unlimited storage</li>
                  <li>AI assistant, analytics, priority support</li>
                </ul>
                <div className="flex gap-2">
                  <Button variant="accent" onClick={() => startCheckout('pro')}>Get Pro</Button>
                  <Button variant="secondary" asChild>
                    <a href="/checkout/embedded?tier=pro">Try Embedded</a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Usage This Month</CardTitle>
            <CardDescription>Track usage across different features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Inventory Items</span>
                <span className={cn('font-medium', getUsageColor(getUsagePercentage(subscription.usage.inventoryItems.current, subscription.usage.inventoryItems.limit)))}>
                  {subscription.usage.inventoryItems.current} / {subscription.usage.inventoryItems.limit}
                </span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.inventoryItems.current, subscription.usage.inventoryItems.limit)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>API Calls</span>
                <span className={cn('font-medium', getUsageColor(getUsagePercentage(subscription.usage.apiCalls.current, subscription.usage.apiCalls.limit)))}>
                  {subscription.usage.apiCalls.current.toLocaleString()} / {subscription.usage.apiCalls.limit.toLocaleString()}
                </span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.apiCalls.current, subscription.usage.apiCalls.limit)} className="h-2" />

            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Storage</span>
                <span className={cn('font-medium', getUsageColor(getUsagePercentage(subscription.usage.storage.current, subscription.usage.storage.limit)))}>
                  {subscription.usage.storage.current}MB / {subscription.usage.storage.limit}MB
                </span>
              </div>
              <Progress value={getUsagePercentage(subscription.usage.storage.current, subscription.usage.storage.limit)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Receipt className="h-5 w-5 text-primary" />
              Billing History
            </CardTitle>
            <CardDescription>Your recent payments and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {!loadingInvoices && invoices.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                No invoices yet.
              </div>
            )}
            <div className="space-y-3">
              {invoices.map(inv => (
                <a key={inv.id} href={inv.hosted_invoice_url || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground hover:bg-white/10">
                  <span>{new Date(inv.created * 1000).toLocaleDateString()} {inv.number ? `• #${inv.number}` : ''}</span>
                  <span className="font-medium text-foreground">{(inv.amount_paid / 100).toFixed(2)} {inv.currency.toUpperCase()} • {inv.status?.toUpperCase()}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}