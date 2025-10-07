export interface AnalyticsMetricSummary {
  totalRevenue: number;
  revenueChange: number;
  totalSales: number;
  salesChange: number;
  avgOrderValue: number;
  avgOrderChange: number;
  conversionRate: number;
  conversionChange: number;
  activeListings: number;
  listingsChange: number;
  totalViews: number;
  viewsChange: number;
}

export interface PlatformPerformanceSummary {
  name: string;
  icon: string;
  revenue: number;
  sales: number;
  conversion: number;
  avgOrder: number;
  change: number;
  color: string;
}

export interface RevenueTrendEntry {
  month: string;
  revenue: number;
  sales: number;
}

export interface CategorySummary {
  name: string;
  revenue: number;
  percentage: number;
}

export interface AnalyticsSnapshot {
  metrics: AnalyticsMetricSummary;
  platformPerformance: PlatformPerformanceSummary[];
  revenueTrend: RevenueTrendEntry[];
  topCategories: CategorySummary[];
  generatedAt: string;
}

export type AnalyticsSnapshotResult = AnalyticsSnapshot & {
  isFallback?: boolean;
};

const fallbackSnapshot: AnalyticsSnapshot = {
  metrics: {
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
  },
  revenueTrend: [
    { month: "Jan", revenue: 8420, sales: 102 },
    { month: "Feb", revenue: 9150, sales: 118 },
    { month: "Mar", revenue: 7890, sales: 95 },
    { month: "Apr", revenue: 10240, sales: 134 },
    { month: "May", revenue: 11680, sales: 147 },
    { month: "Jun", revenue: 12847, sales: 156 },
  ],
  topCategories: [
    { name: "Electronics", revenue: 4250, percentage: 33.1 },
    { name: "Fashion", revenue: 3120, percentage: 24.3 },
    { name: "Home & Garden", revenue: 2890, percentage: 22.5 },
    { name: "Sports", revenue: 1650, percentage: 12.8 },
    { name: "Other", revenue: 937, percentage: 7.3 },
  ],
  platformPerformance: [
    { name: "eBay", icon: "🛒", revenue: 5247, sales: 67, conversion: 4.2, avgOrder: 78.31, change: 15.2, color: "from-blue-500 to-blue-600" },
    { name: "Poshmark", icon: "👗", revenue: 3891, sales: 45, conversion: 3.1, avgOrder: 86.47, change: 8.7, color: "from-pink-500 to-pink-600" },
    { name: "Mercari", icon: "📦", revenue: 2134, sales: 28, conversion: 2.9, avgOrder: 76.21, change: 45.3, color: "from-orange-500 to-orange-600" },
    { name: "Depop", icon: "🎨", revenue: 1575, sales: 16, conversion: 4.1, avgOrder: 98.44, change: -12.1, color: "from-purple-500 to-purple-600" },
  ],
  generatedAt: new Date().toISOString(),
};

export async function fetchAnalyticsSnapshot(timeRange: string): Promise<AnalyticsSnapshotResult> {
  try {
    const response = await fetch(`/api/analytics?range=${encodeURIComponent(timeRange)}`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as AnalyticsSnapshot;

    return {
      ...payload,
      generatedAt: payload.generatedAt ?? new Date().toISOString(),
      isFallback: false,
    };
  } catch (error) {
    console.warn("Falling back to client-side analytics snapshot", error);
    return {
      ...fallbackSnapshot,
      generatedAt: new Date().toISOString(),
      isFallback: true,
    };
  }
}
