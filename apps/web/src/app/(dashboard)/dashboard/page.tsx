"use client";

import { useAuth } from "../../../lib/auth/auth-context";
import { DashboardLayout } from "../../../components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
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
import { PageHeader } from "../../../components/ui/page-header";
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
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-12" data-testid="dashboard-welcome">
        <PageHeader
          eyebrow="Overview"
          title={`Welcome back${userName ? `, ${userName}` : ""}!`}
          subtitle="Here's what's happening across your resale business today."
          icon={<BarChart3 className="h-7 w-7 text-primary" />}
          actions={(
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="glass-card border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                {subscriptionData.tier} Plan
              </Badge>
              <Button variant="accent" onClick={() => router.push('/listings/create')}>
                Add Listing
              </Button>
            </div>
          )}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                {subscriptionData.itemLimit - mockStats.totalItems} remaining in {subscriptionData.tier} plan
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${mockStats.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Estimated inventory value</p>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Potential Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                ${mockStats.potentialProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">From current inventory</p>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.activeListing}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="glass-card border border-white/10 transition-colors hover:bg-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Start Sourcing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">Find new items to add to your inventory</p>
              <Button className="w-full" onClick={() => router.push('/sourcing')}>
                Add New Items
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10 transition-colors hover:bg-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Manage Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">View and organize your current items</p>
              <Button className="w-full" onClick={() => router.push('/inventory')} variant="outline">
                View Inventory
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10 transition-colors hover:bg-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                View Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">Track your performance and profits</p>
              <Button className="w-full" onClick={() => router.push('/analytics')} variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status Banner */}
        {subscriptionData.tier === "Free" && (
          <Card className="glass-card border border-primary/30 bg-primary/10">
            <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">You're on the Free Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock unlimited items and advanced features
                </p>
              </div>
              <Button variant="accent" onClick={() => router.push('/pricing')} className="w-full md:w-auto">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Placeholder */}
        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <BarChart3 className="h-12 w-12 text-primary" />
              <AnimatedHeadline text="No activity yet" className="text-2xl font-semibold text-gradient-primary" />
              <p className="text-sm text-muted-foreground">
                Start sourcing items to see your activity here
              </p>
              <Button onClick={() => router.push('/sourcing')} data-testid="get-started-button">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
