/**
 * De-listing Dashboard - Main page for monitoring and managing delisting activities
 * Provides overview of delisting jobs, manual delisting controls, and monitoring
 */
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../lib/auth/auth-context';
import { AnimatedHeadline } from '../../../components/ui/animated-headline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Search,
  Download
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
    const variants: Record<string, 'default' | 'outline' | 'destructive' | 'secondary'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      partially_failed: 'outline',
      pending: 'outline',
      cancelled: 'secondary',
    };

    const icons = {
      completed: CheckCircle,
      processing: Loader2,
      failed: XCircle,
      partially_failed: AlertTriangle,
      pending: Clock,
      cancelled: XCircle,
    };

    const Icon = icons[status as keyof typeof icons] || Clock;
    const variant = variants[status] || 'outline';

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
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
        <div className="p-6">
          <Alert variant="destructive">
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <AnimatedHeadline
              text="De-listing Dashboard"
              className="from-primary-600 to-accent-600 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent"
            />
            <p className="text-secondary-text mt-2">
              Monitor and manage your automated and manual de-listing activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={jobsLoading || statsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(jobsLoading || statsLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
          </div>
        </div>

      {/* Quick Stats */}
      <DelistingStats stats={stats} loading={statsLoading} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Delisting Jobs</TabsTrigger>
          <TabsTrigger value="manual">Manual Delisting</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Jobs Summary */}
            <Card className="glass">
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
                  <p className="text-muted-foreground text-center py-8">
                    No delisting jobs found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{job.item_title}</p>
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

            {/* Quick Actions */}
            <Card className="glass">
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
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('manual')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Manual De-listing
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowPreferences(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Preferences
                </Button>
                <Button
                  className="w-full justify-start"
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