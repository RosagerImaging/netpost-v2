/**
 * Delisting Stats Component
 * Displays key metrics and statistics for delisting activities
 */
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Target
} from 'lucide-react';

interface DelistingStatsData {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  pending_jobs: number;
  partially_failed_jobs: number;
  success_rate: number;
  avg_completion_time: number;
  total_items_delisted: number;
  most_active_marketplace: string;
  recent_trend: 'up' | 'down' | 'stable';
}

interface DelistingStatsProps {
  stats: DelistingStatsData | null;
  loading: boolean;
}

export function DelistingStats({ stats, loading }: DelistingStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.total_jobs,
      icon: Activity,
      description: 'All delisting jobs',
      change: stats.recent_trend,
    },
    {
      title: 'Success Rate',
      value: `${stats.success_rate.toFixed(1)}%`,
      icon: Target,
      description: 'Successful delistings',
      color: stats.success_rate >= 90 ? 'text-green-600' : stats.success_rate >= 70 ? 'text-yellow-600' : 'text-red-600',
    },
    {
      title: 'Completed',
      value: stats.completed_jobs,
      icon: CheckCircle,
      description: 'Successfully completed',
      color: 'text-green-600',
    },
    {
      title: 'Pending',
      value: stats.pending_jobs,
      icon: Clock,
      description: 'Awaiting processing',
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <Icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${stat.color || ''}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                {stat.change && (
                  <div className="flex items-center pt-1">
                    {stat.change === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : stat.change === 'down' ? (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    ) : null}
                    <span className={`text-xs ${
                      stat.change === 'up' ? 'text-green-600' :
                      stat.change === 'down' ? 'text-red-600' :
                      'text-muted-foreground'
                    }`}>
                      {stat.change === 'up' ? 'Increasing' :
                       stat.change === 'down' ? 'Decreasing' :
                       'Stable'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Job Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Completed</span>
              </div>
              <Badge variant="outline" className="text-green-600">
                {stats.completed_jobs}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Partially Failed</span>
              </div>
              <Badge variant="outline" className="text-yellow-600">
                {stats.partially_failed_jobs}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Failed</span>
              </div>
              <Badge variant="outline" className="text-red-600">
                {stats.failed_jobs}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Pending</span>
              </div>
              <Badge variant="outline" className="text-blue-600">
                {stats.pending_jobs}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Completion Time</span>
                <span className="text-sm font-medium">
                  {stats.avg_completion_time ? `${stats.avg_completion_time.toFixed(1)}s` : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((stats.avg_completion_time / 60) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">Items Delisted</span>
                <span className="text-sm font-medium">
                  {stats.total_items_delisted}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">Most Active</span>
                <span className="text-sm font-medium">
                  {stats.most_active_marketplace || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Health Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">System Health</span>
                <Badge
                  variant={stats.success_rate >= 90 ? 'default' : stats.success_rate >= 70 ? 'secondary' : 'destructive'}
                >
                  {stats.success_rate >= 90 ? 'Excellent' :
                   stats.success_rate >= 70 ? 'Good' :
                   'Needs Attention'}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Success Rate</span>
                  <span>{stats.success_rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      stats.success_rate >= 90 ? 'bg-green-600' :
                      stats.success_rate >= 70 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${stats.success_rate}%` }}
                  />
                </div>
              </div>

              {stats.success_rate < 90 && (
                <div className="text-xs text-muted-foreground">
                  {stats.failed_jobs > 0 && (
                    <p>• {stats.failed_jobs} jobs need attention</p>
                  )}
                  {stats.pending_jobs > 5 && (
                    <p>• {stats.pending_jobs} jobs pending</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}