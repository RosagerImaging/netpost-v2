/**
 * Delisting Stats Component
 * Displays key metrics and statistics for delisting activities
 */
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  cn,
} from '@netpost/ui';
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card border border-white/10">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="h-8 w-1/2 rounded bg-white/10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="glass-card border border-white/10">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No statistics available
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
      accent: 'linear-gradient(90deg, rgba(255,255,255,0.25), transparent)',
    },
    {
      title: 'Success Rate',
      value: `${stats.success_rate.toFixed(1)}%`,
      icon: Target,
      description: 'Successful delistings',
      accent: stats.success_rate >= 90
        ? 'linear-gradient(90deg, rgba(16,185,129,0.45), transparent)'
        : stats.success_rate >= 70
        ? 'linear-gradient(90deg, rgba(245,158,11,0.45), transparent)'
        : 'linear-gradient(90deg, rgba(239,68,68,0.45), transparent)',
      color: stats.success_rate >= 90 ? 'text-emerald-200' : stats.success_rate >= 70 ? 'text-amber-200' : 'text-red-200',
    },
    {
      title: 'Completed',
      value: stats.completed_jobs,
      icon: CheckCircle,
      description: 'Successfully completed',
      accent: 'linear-gradient(90deg, rgba(16,185,129,0.45), transparent)',
      color: 'text-emerald-200',
    },
    {
      title: 'Pending',
      value: stats.pending_jobs,
      icon: Clock,
      description: 'Awaiting processing',
      accent: 'linear-gradient(90deg, rgba(56,189,248,0.45), transparent)',
      color: 'text-sky-200',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="glass-card border border-white/10">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {stat.title}
                  </p>
                  <Icon className={cn('h-4 w-4 text-muted-foreground', stat.color)} />
                </div>
                <div className="space-y-1">
                  <p className={cn('text-3xl font-semibold text-foreground', stat.color)}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div
                  className="h-1 w-full rounded-full bg-white/10"
                  style={{ backgroundImage: stat.accent }}
                />
                {stat.change && (
                  <div className="flex items-center pt-1">
                    {stat.change === 'up' ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-emerald-300" />
                    ) : stat.change === 'down' ? (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-300" />
                    ) : null}
                    <span className={`text-xs ${
                      stat.change === 'up' ? 'text-emerald-200' :
                      stat.change === 'down' ? 'text-red-300' :
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="glass-card border border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Job Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-300" />
                <span className="text-sm">Completed</span>
              </div>
              <Badge variant="secondary" className="glass-card border border-white/10 px-2 py-0.5 text-xs uppercase tracking-[0.2em] text-emerald-200">
                {stats.completed_jobs}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <span className="text-sm">Partially Failed</span>
              </div>
              <Badge variant="secondary" className="glass-card border border-white/10 px-2 py-0.5 text-xs uppercase tracking-[0.2em] text-amber-200">
                {stats.partially_failed_jobs}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-300" />
                <span className="text-sm">Failed</span>
              </div>
              <Badge variant="secondary" className="glass-card border border-white/10 px-2 py-0.5 text-xs uppercase tracking-[0.2em] text-red-300">
                {stats.failed_jobs}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-300" />
                <span className="text-sm">Pending</span>
              </div>
              <Badge variant="secondary" className="glass-card border border-white/10 px-2 py-0.5 text-xs uppercase tracking-[0.2em] text-sky-200">
                {stats.pending_jobs}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-white/10">
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
              <Progress value={Math.min((stats.avg_completion_time / 60) * 100, 100)} />
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

        <Card className="glass-card border border-white/10">
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
                  variant="secondary"
                  className={cn(
                    'glass-card border border-white/10 px-2 py-0.5 text-xs uppercase tracking-[0.2em]',
                    stats.success_rate >= 90 ? 'text-emerald-200' :
                      stats.success_rate >= 70 ? 'text-amber-200' :
                      'text-red-300'
                  )}
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
                <Progress
                  value={stats.success_rate}
                  className={cn(
                    stats.success_rate >= 90 ? 'text-emerald-200' :
                    stats.success_rate >= 70 ? 'text-amber-200' : 'text-red-300'
                  )}
                />
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