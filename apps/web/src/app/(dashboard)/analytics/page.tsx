"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Zap,
  AlertCircle,
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
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
} from "@netpost/ui";
import { cn } from "@netpost/ui";
import { useAuth } from "../../../lib/auth/auth-context";
import { DashboardLayout } from "../../../components/layout/dashboard-layout";
import { PageHeader } from "../../../components/ui/page-header";
import {
  fetchAnalyticsSnapshot,
  type AnalyticsSnapshotResult,
  type AnalyticsMetricSummary,
  type PlatformPerformanceSummary,
  type RevenueTrendEntry,
  type CategorySummary,
} from "../../../lib/services/analytics-service";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";

type ToastVariant = "success" | "warning" | "destructive";

interface ToastMessage {
  variant: ToastVariant;
  title: string;
  description?: string;
}

type LoadReason = "init" | "range" | "refresh";

interface LoadOptions {
  reason?: LoadReason;
  silent?: boolean;
}

interface SnapshotViewModel {
  metrics: AnalyticsMetricSummary;
  platformPerformance: PlatformPerformanceSummary[];
  revenueTrend: RevenueTrendEntry[];
  topCategories: CategorySummary[];
  isFallback: boolean;
}

function mapSnapshot(snapshot: AnalyticsSnapshotResult): SnapshotViewModel {
  return {
    metrics: snapshot.metrics,
    platformPerformance: snapshot.platformPerformance,
    revenueTrend: snapshot.revenueTrend,
    topCategories: snapshot.topCategories,
    isFallback: Boolean(snapshot.isFallback),
  };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [snapshot, setSnapshot] = useState<SnapshotViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const isInitialLoadRef = useRef(true);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = useCallback((message: ToastMessage) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      return;
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [toast]);

  const loadSnapshot = useCallback(
    async (range: string, options?: LoadOptions) => {
      const reason = options?.reason ?? "init";
      const silent = options?.silent ?? false;

      if (reason === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const rawSnapshot = await fetchAnalyticsSnapshot(range);
        setSnapshot(mapSnapshot(rawSnapshot));
        setError(null);

        if (!silent) {
          if (rawSnapshot.isFallback) {
            triggerToast({
              variant: "warning",
              title: "Showing cached analytics",
              description:
                "Live analytics are temporarily unavailable. We're displaying the latest cached snapshot.",
            });
          } else if (reason !== "init") {
            triggerToast({
              variant: "success",
              title: "Analytics updated",
              description: "Metrics have been refreshed with the latest data.",
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load analytics at this time.";
        setError(message);
        if (!silent) {
          triggerToast({
            variant: "destructive",
            title: "Analytics unavailable",
            description: message,
          });
        }
      } finally {
        if (reason === "refresh") {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [triggerToast]
  );

  useEffect(() => {
    const reason = isInitialLoadRef.current ? "init" : "range";
    loadSnapshot(timeRange, { reason, silent: isInitialLoadRef.current });
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }
  }, [timeRange, loadSnapshot]);

  const handleRefresh = () => {
    loadSnapshot(timeRange, { reason: "refresh" });
  };

  const handleExport = () => {
    triggerToast({
      variant: "success",
      title: "Export requested",
      description: "We'll email you a CSV export of your analytics within a few minutes.",
    });
  };

  const subscriptionData = {
    tier: "Professional",
    status: "active",
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatPercentage = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

  const changeMaps = useMemo(
    () => ({
      positive: {
        icon: <ArrowUpRight className="h-4 w-4 text-green-300" />,
        textClass: "text-green-300",
        pillClass: "bg-green-500/15 text-green-200 border border-green-500/30",
      },
      negative: {
        icon: <ArrowDownRight className="h-4 w-4 text-red-300" />,
        textClass: "text-red-300",
        pillClass: "bg-red-500/15 text-red-200 border border-red-500/30",
      },
    }),
    []
  );

  const getChangeIcon = (change: number) => (change > 0 ? changeMaps.positive.icon : changeMaps.negative.icon);
  const getChangeColor = (change: number) =>
    change > 0 ? changeMaps.positive.textClass : changeMaps.negative.textClass;

  const metrics = snapshot?.metrics;
  const platformPerformance = snapshot?.platformPerformance ?? [];
  const revenueTrend = snapshot?.revenueTrend ?? [];
  const topCategories = snapshot?.topCategories ?? [];
  const revenueMax = revenueTrend.reduce((max, entry) => Math.max(max, entry.revenue), 0);
  const platformRevenueMax = platformPerformance.reduce((max, entry) => Math.max(max, entry.revenue), 0);
  const showLoadingState = isLoading && !snapshot;

  return (
    <DashboardLayout
      user={
        user?.email
          ? {
              email: user.email,
              name: user.user_metadata?.name,
              subscription: subscriptionData,
            }
          : undefined
      }
    >
      <ToastProvider>
        <div className="mx-auto max-w-7xl space-y-10 px-4 pb-10">
          <PageHeader
            eyebrow="Insights"
            title="Analytics"
            subtitle="Track performance, benchmark your growth, and understand exactly where to focus next."
            icon={<BarChart3 className="h-7 w-7 text-primary" />}
            actions={
              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="glass-input w-32" aria-label="Select analytics time range">
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                {snapshot?.isFallback && (
                  <Badge variant="secondary" className="uppercase tracking-[0.3em] text-[10px]">
                    Offline data
                  </Badge>
                )}
                <Button variant="outline" size="sm" className="glass-button" onClick={handleExport} disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  aria-live="polite"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Refreshing" : "Refresh"}
                </Button>
              </div>
            }
          />

          {error && (
            <Alert variant="destructive" className="glass-card border border-red-500/30">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Unable to reach live analytics</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showLoadingState && (
            <Card className="glass">
              <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
                <Loader />
                Loading analytics snapshot...
              </CardContent>
            </Card>
          )}

          {!showLoadingState && metrics && (
            <>
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
                      <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-primary/20">
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
                      <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-secondary/20">
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
                      <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-accent/20">
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
                      <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-amber-500/20">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                      <div className="space-y-3">
                        {revenueTrend.map((entry) => (
                          <div key={entry.month} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{entry.month}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm">{formatCurrency(entry.revenue)}</span>
                                <span className="text-sm text-muted-foreground">{entry.sales} sales</span>
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/10">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-primary to-ring"
                                style={{ width: revenueMax ? `${(entry.revenue / revenueMax) * 100}%` : "0%" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Top Categories
                    </CardTitle>
                    <CardDescription>Revenue breakdown by category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topCategories.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm">{formatCurrency(category.revenue)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={category.percentage} className="flex-1" />
                          <span className="text-xs text-muted-foreground">{category.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Platform Performance
                  </CardTitle>
                  <CardDescription>Detailed breakdown of sales performance across platforms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {platformPerformance.map((platform) => (
                      <div key={platform.name} className="glass-card space-y-4 border border-white/5 bg-white/5/40 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{platform.icon}</span>
                            <div>
                              <h4 className="font-medium">{platform.name}</h4>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs border",
                                  platform.change > 0 ? changeMaps.positive.pillClass : changeMaps.negative.pillClass
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
                              width: platformRevenueMax ? `${(platform.revenue / platformRevenueMax) * 100}%` : "0%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                      <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-secondary/20">
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
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Goal Progress</p>
                          <p className="text-2xl font-semibold">82%</p>
                        </div>
                        <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-ring/20">
                          <Target className="h-6 w-6" />
                        </div>
                      </div>
                      <Progress value={82} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>AI-powered insights to help optimize your business</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-300" />
                        <span className="text-sm font-medium text-green-200">Strong Performance</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        eBay listings are performing 25% above average. Consider increasing inventory for electronics.
                      </p>
                    </div>
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-300" />
                        <span className="text-sm font-medium text-yellow-200">Opportunity</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mercari conversion rate could improve with better product photos and descriptions.
                      </p>
                    </div>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-300" />
                        <span className="text-sm font-medium text-blue-200">Customer Insight</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fashion items sell best on weekends. Schedule listings for Friday evenings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {toast && (
          <Toast variant={toast.variant} data-testid={`analytics-toast-${toast.variant}`}>
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </DashboardLayout>
  );
}

function Loader() {
  return (
    <span className="flex h-4 w-4 items-center justify-center">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </span>
  );
}
