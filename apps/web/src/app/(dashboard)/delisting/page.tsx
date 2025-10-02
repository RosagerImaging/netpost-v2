/**
 * De-listing Dashboard - Main page for monitoring and managing delisting activities
 * Provides overview of delisting jobs, manual delisting controls, and monitoring
 */
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../lib/auth/auth-context';
import { PageHeader } from '../../../components/ui/page-header';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@netpost/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Settings,
  Play,
  RefreshCw,
} from 'lucide-react';

import { DelistingJobsTable } from './components/DelistingJobsTable';
import { ManualDelistingPanel } from './components/ManualDelistingPanel';
import { DelistingPreferences } from './components/DelistingPreferences';
import { DelistingStats } from './components/DelistingStats';
import { RecentActivity } from './components/RecentActivity';
import { useDelistingJobs } from './hooks/useDelistingJobs';
import { useDelistingStats } from './hooks/useDelistingStats';

export default function DelistingDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showPreferences, setShowPreferences] = useState(false);

  // Mock subscription data
  const subscriptionData = {
    tier: "Free",
    status: "active" as const,
    itemLimit: 10,
    currentItems: 0,
  };

  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    refresh: refreshJobs,
    retryJob,
    cancelJob,
    confirmJob,
  } = useDelistingJobs();

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useDelistingStats();

  // Handle URL parameters for direct actions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmJobId = params.get('confirm');
    const cancelJobId = params.get('cancel');

    if (confirmJobId) {
      confirmJob(confirmJobId);
      // Remove parameter from URL
      window.history.replaceState({}, '', '/dashboard/delisting');
    }

    if (cancelJobId) {
      cancelJob(cancelJobId);
      // Remove parameter from URL
      window.history.replaceState({}, '', '/dashboard/delisting');
    }
  }, [confirmJob, cancelJob]);

  const handleRefreshAll = async () => {
    await Promise.all([refreshJobs(), refreshStats()]);
  };

  const getStatusBadge = (status: string) => {
    const icons = {
      completed: CheckCircle,
      processing: Loader2,
      failed: XCircle,
      partially_failed: AlertTriangle,
      pending: Clock,
      cancelled: XCircle,
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    const badgeClasses: Record<string, string> = {
      completed: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
      processing: 'border-amber-500/30 bg-amber-500/15 text-amber-200',
      failed: 'border-red-500/30 bg-red-500/15 text-red-200',
      partially_failed: 'border-orange-500/30 bg-orange-500/15 text-orange-200',
      pending: 'border-white/10 bg-white/10 text-muted-foreground',
      cancelled: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-200',
    };

    return (
      <Badge
        variant="secondary"
        className={cn(
          'glass-card flex items-center gap-1 border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-white/90',
          badgeClasses[status] ?? 'border-white/10 bg-white/10 text-muted-foreground'
        )}
      >
        <Icon className={cn('h-3 w-3', { 'animate-spin': status === 'processing' })} />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (jobsError || statsError) {
    return (
      <DashboardLayout
        user={user?.email ? {
          email: user.email,
          name: user.user_metadata?.name,
          subscription: subscriptionData
        } : undefined}
      >
        <div className="mx-auto max-w-3xl space-y-6 px-4 pb-12">
          <Alert variant="destructive" className="glass-card border border-destructive/40 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load delisting dashboard. {jobsError || statsError}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

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
          eyebrow="Automation"
          title="Delisting"
          subtitle="Monitor job queues, resolve failures, and fine-tune automation for every marketplace."
          icon={<AlertTriangle className="h-7 w-7 text-primary" />}
          actions={(
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="glass-button inline-flex items-center gap-2"
                onClick={handleRefreshAll}
                disabled={jobsLoading || statsLoading}
              >
                <RefreshCw className={cn('h-4 w-4', { 'animate-spin': jobsLoading || statsLoading })} />
                Refresh
              </Button>
              <Button
                variant="accent"
                size="sm"
                className="inline-flex items-center gap-2"
                onClick={() => setShowPreferences(true)}
              >
                <Settings className="h-4 w-4" />
                Preferences
              </Button>
            </div>
          )}
        />

        <DelistingStats stats={stats} loading={statsLoading} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-4 border border-white/10 bg-white/5/40">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Delisting Jobs</TabsTrigger>
            <TabsTrigger value="manual">Manual Delisting</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="glass-card border border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Jobs
                  </CardTitle>
                  <CardDescription>
                    Latest delisting jobs and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : jobs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No delisting jobs yet. Processed listings will appear here.
                    </p>
                  </div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{job.item_title}</p>
                          <p className="text-xs text-muted-foreground">
                            Sold on {job.sold_on_marketplace} • {job.marketplaces_targeted.length} targets
                          </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(job.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common delisting operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="glass-button w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab('manual')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Manual De-listing
                  </Button>
                  <Button
                    className="glass-button w-full justify-start"
                    variant="outline"
                    onClick={() => setShowPreferences(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Preferences
                  </Button>
                  <Button
                    className="glass-button w-full justify-start"
                    variant="outline"
                    onClick={handleRefreshAll}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <DelistingJobsTable
              jobs={jobs}
              loading={jobsLoading}
              onRetry={retryJob}
              onCancel={cancelJob}
              onConfirm={confirmJob}
              onRefresh={refreshJobs}
            />
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <ManualDelistingPanel onJobCreated={refreshJobs} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <RecentActivity />
          </TabsContent>
        </Tabs>
      {/* Preferences Modal */}
      {showPreferences && (
        <DelistingPreferences
          open={showPreferences}
          onClose={() => setShowPreferences(false)}
          onSaved={() => {
            setShowPreferences(false);
            refreshStats();
          }}
        />
      )}
    </div>
  </DashboardLayout>
);
}