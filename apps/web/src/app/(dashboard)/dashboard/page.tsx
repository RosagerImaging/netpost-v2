"use client";

import { useAuth } from "../../../lib/auth/auth-context";
import { DashboardLayout } from "../../../components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@netpost/ui";
import {
  Package,
  Search,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatedHeadline } from "../../../components/ui/animated-headline";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Mock subscription data - in real app, this would come from API
  const subscriptionData = {
    tier: "Free",
    status: "active",
    itemLimit: 10,
    currentItems: 0,
  };

  const userName = user?.email?.split('@')[0] || '';

  const mockStats = {
    totalItems: 0,
    totalValue: 0,
    potentialProfit: 0,
    activeListing: 0,
  };

  return (
    <DashboardLayout
      user={user?.email ? {
        email: user.email,
        name: user.user_metadata?.name,
        subscription: subscriptionData
      } : undefined}
    >
      <div className="p-6 space-y-6" data-testid="dashboard-welcome">
        {/* Welcome Header */}
        <div className="mb-8">
          <AnimatedHeadline
            text={`Welcome back${userName ? `, ${userName}` : ''}!`}
            className="text-gradient-primary mb-2 text-3xl font-bold"
          />
          <p style={{ color: 'oklch(0.7161 0.0091 56.2590)' }}>
            Here's what's happening with your reselling business today.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.9816 0.0017 247.8390)' }}>
                {mockStats.totalItems}
              </div>
              <p className="text-xs" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }}>
                {subscriptionData.itemLimit - mockStats.totalItems} remaining in {subscriptionData.tier} plan
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.9816 0.0017 247.8390)' }}>
                ${mockStats.totalValue.toFixed(2)}
              </div>
              <p className="text-xs" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }}>
                Estimated inventory value
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
              <TrendingUp className="h-4 w-4" style={{ color: 'oklch(0.3755 0.0700 176.3952)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.3755 0.0700 176.3952)' }}>
                ${mockStats.potentialProfit.toFixed(2)}
              </div>
              <p className="text-xs" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }}>
                From current inventory
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <BarChart3 className="h-4 w-4" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.9816 0.0017 247.8390)' }}>
                {mockStats.activeListing}
              </div>
              <p className="text-xs" style={{ color: 'oklch(0.7161 0.0091 56.2590)' }}>
                Across all platforms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass hover:bg-white/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary-500" />
                Start Sourcing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-text mb-4 text-sm">
                Find new items to add to your inventory
              </p>
              <Button
                className="w-full"
                onClick={() => router.push('/sourcing')}
              >
                Add New Items
              </Button>
            </CardContent>
          </Card>

          <Card className="glass hover:bg-white/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-500" />
                Manage Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-text mb-4 text-sm">
                View and organize your current items
              </p>
              <Button
                className="w-full"
                onClick={() => router.push('/inventory')}
                variant="outline"
              >
                View Inventory
              </Button>
            </CardContent>
          </Card>

          <Card className="glass hover:bg-white/5 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-500" />
                View Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-text mb-4 text-sm">
                Track your performance and profits
              </p>
              <Button
                className="w-full"
                onClick={() => router.push('/analytics')}
                variant="outline"
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status Banner */}
        {subscriptionData.tier === "Free" && (
          <Card className="glass border-primary-500/20 bg-primary-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary-text mb-1">
                    You're on the Free Plan
                  </h3>
                  <p className="text-secondary-text text-sm">
                    Upgrade to unlock unlimited items and advanced features
                  </p>
                </div>
                <Button
                  className="bg-primary-500 hover:bg-primary-600"
                  onClick={() => router.push('/pricing')}
                >
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Placeholder */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-secondary-text mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary-text mb-2">
                No activity yet
              </h3>
              <p className="text-secondary-text mb-4">
                Start sourcing items to see your activity here
              </p>
              <Button
                onClick={() => router.push('/sourcing')}
                data-testid="get-started-button"
              >
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
