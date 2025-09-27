"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Eye,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  Award,
  Zap
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@netpost/ui";
import { cn } from "@netpost/ui";
import { useAuth } from "../../../lib/auth/auth-context";
import { DashboardLayout } from "../../../components/layout/dashboard-layout";

// Mock data for demonstration
const metrics = {
  totalRevenue: 12847,
  revenueChange: 23.5,
  totalSales: 156,
  salesChange: 12.3,
  avgOrderValue: 82.35,
  avgOrderChange: -5.2,
  conversionRate: 3.8,
  conversionChange: 1.2,
  activeListings: 234,
  listingsChange: 8.9,
  totalViews: 15420,
  viewsChange: 18.7,
};

const platformData = [
  {
    name: "eBay",
    icon: "🛒",
    revenue: 5247,
    sales: 67,
    conversion: 4.2,
    avgOrder: 78.31,
    change: 15.2,
    color: "from-blue-500 to-blue-600"
  },
  {
    name: "Poshmark",
    icon: "👗",
    revenue: 3891,
    sales: 45,
    conversion: 3.1,
    avgOrder: 86.47,
    change: 8.7,
    color: "from-pink-500 to-pink-600"
  },
  {
    name: "Mercari",
    icon: "📦",
    revenue: 2134,
    sales: 28,
    conversion: 2.9,
    avgOrder: 76.21,
    change: 45.3,
    color: "from-orange-500 to-orange-600"
  },
  {
    name: "Depop",
    icon: "🎨",
    revenue: 1575,
    sales: 16,
    conversion: 4.1,
    avgOrder: 98.44,
    change: -12.1,
    color: "from-purple-500 to-purple-600"
  }
];

const revenueData = [
  { month: "Jan", revenue: 8420, sales: 102 },
  { month: "Feb", revenue: 9150, sales: 118 },
  { month: "Mar", revenue: 7890, sales: 95 },
  { month: "Apr", revenue: 10240, sales: 134 },
  { month: "May", revenue: 11680, sales: 147 },
  { month: "Jun", revenue: 12847, sales: 156 },
];

const topCategories = [
  { name: "Electronics", revenue: 4250, percentage: 33.1 },
  { name: "Fashion", revenue: 3120, percentage: 24.3 },
  { name: "Home & Garden", revenue: 2890, percentage: 22.5 },
  { name: "Sports", revenue: 1650, percentage: 12.8 },
  { name: "Other", revenue: 937, percentage: 7.3 },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  // Mock subscription data - in real app, this would come from API
  const subscriptionData = {
    tier: "Professional",
    status: "active",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-400" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-400" />
    );
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? "text-green-400" : "text-red-400";
  };

  return (
    <DashboardLayout
      user={user?.email ? {
        email: user.email,
        name: user.user_metadata?.name,
        subscription: subscriptionData
      } : undefined}
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-6">
        <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent text-white">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">
                Track your business performance and insights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="glass-input w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                    {getChangeIcon(metrics.revenueChange)}
                  </div>
                  <p className={cn("text-sm", getChangeColor(metrics.revenueChange))}>
                    {formatPercentage(metrics.revenueChange)} from last period
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{metrics.totalSales}</p>
                    {getChangeIcon(metrics.salesChange)}
                  </div>
                  <p className={cn("text-sm", getChangeColor(metrics.salesChange))}>
                    {formatPercentage(metrics.salesChange)} from last period
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{formatCurrency(metrics.avgOrderValue)}</p>
                    {getChangeIcon(metrics.avgOrderChange)}
                  </div>
                  <p className={cn("text-sm", getChangeColor(metrics.avgOrderChange))}>
                    {formatPercentage(metrics.avgOrderChange)} from last period
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                    {getChangeIcon(metrics.conversionChange)}
                  </div>
                  <p className={cn("text-sm", getChangeColor(metrics.conversionChange))}>
                    {formatPercentage(metrics.conversionChange)} from last period
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="glass lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Monthly revenue and sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="text-muted-foreground">Sales</span>
                </div>

                {/* Simple bar chart visualization */}
                <div className="space-y-3">
                  {revenueData.map((data, index) => (
                    <div key={data.month} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">{formatCurrency(data.revenue)}</span>
                          <span className="text-sm text-muted-foreground">{data.sales} sales</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                          style={{
                            width: `${(data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Categories
              </CardTitle>
              <CardDescription>Revenue breakdown by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm">{formatCurrency(category.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={category.percentage} className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Platform Performance */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Platform Performance
            </CardTitle>
            <CardDescription>
              Detailed breakdown of sales performance across platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {platformData.map((platform) => (
                <div
                  key={platform.name}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <h4 className="font-medium">{platform.name}</h4>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            platform.change > 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                          )}
                        >
                          {formatPercentage(platform.change)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="font-medium">{formatCurrency(platform.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sales</span>
                      <span className="font-medium">{platform.sales}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Conversion</span>
                      <span className="font-medium">{platform.conversion}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Order</span>
                      <span className="font-medium">{formatCurrency(platform.avgOrder)}</span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className={cn("h-2 rounded-full bg-gradient-to-r", platform.color)}
                      style={{
                        width: `${(platform.revenue / Math.max(...platformData.map(p => p.revenue))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{metrics.activeListings}</p>
                    {getChangeIcon(metrics.listingsChange)}
                  </div>
                  <p className={cn("text-sm", getChangeColor(metrics.listingsChange))}>
                    {formatPercentage(metrics.listingsChange)} from last period
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</p>
                    {getChangeIcon(metrics.viewsChange)}
                  </div>
                  <p className={cn("text-sm", getChangeColor(metrics.viewsChange))}>
                    {formatPercentage(metrics.viewsChange)} from last period
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                  <Eye className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">2.4h</p>
                  <p className="text-sm text-green-400">
                    -15% from last period
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>
              AI-powered insights to help optimize your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Strong Performance</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  eBay listings are performing 25% above average. Consider increasing inventory for electronics.
                </p>
              </div>

              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Opportunity</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mercari conversion rate could improve with better product photos and descriptions.
                </p>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Customer Insight</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fashion items sell best on weekends. Schedule listings for Friday evenings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}