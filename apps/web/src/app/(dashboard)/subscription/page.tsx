/**
 * User Subscription Dashboard
 * Shows current subscription status, usage metrics, and billing information
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../lib/auth/auth-context';
import { AnimatedHeadline } from '../../../components/ui/animated-headline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <DashboardLayout
      user={user?.email ? {
        email: user.email,
        name: user.user_metadata?.name,
        subscription: subscriptionData
      } : undefined}
    >
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <AnimatedHeadline
              text="Subscription"
              className="from-primary-600 to-accent-600 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent"
            />
            <p className="text-secondary-text mt-2">
              Manage your subscription and track usage
            </p>
          </div>
          <Button>Manage Billing</Button>
        </div>

        {/* Current Plan */}
        <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current Plan
            <Badge variant="secondary">{subscription.tier}</Badge>
          </CardTitle>
          <CardDescription>
            Your subscription is {subscription.status} and renews on{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button>Upgrade Plan</Button>
            <Button variant="outline">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

        {/* Usage Statistics */}
        <Card className="glass">
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>Track your usage across different features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inventory Items */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Inventory Items</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.inventoryItems.current, subscription.usage.inventoryItems.limit))}>
                {subscription.usage.inventoryItems.current} / {subscription.usage.inventoryItems.limit}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(subscription.usage.inventoryItems.current, subscription.usage.inventoryItems.limit)}
              className="h-2"
            />
          </div>

          {/* API Calls */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>API Calls</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.apiCalls.current, subscription.usage.apiCalls.limit))}>
                {subscription.usage.apiCalls.current.toLocaleString()} / {subscription.usage.apiCalls.limit.toLocaleString()}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(subscription.usage.apiCalls.current, subscription.usage.apiCalls.limit)}
              className="h-2"
            />
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.storage.current, subscription.usage.storage.limit))}>
                {subscription.usage.storage.current}MB / {subscription.usage.storage.limit}MB
              </span>
            </div>
            <Progress
              value={getUsagePercentage(subscription.usage.storage.current, subscription.usage.storage.limit)}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

        {/* Billing History */}
        <Card className="glass">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent payments and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>September 2025</span>
              <span>$9.99 - Paid</span>
            </div>
            <div className="flex justify-between">
              <span>August 2025</span>
              <span>$9.99 - Paid</span>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}