'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { PageHeader } from '../../../components/ui/page-header';
import { useAuth } from '../../../lib/auth/auth-context';
import {
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Image,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { listingJobQueue, type ListingJob, type JobStats } from '@/lib/services/listing-job-queue';
import type { Listing, ListingStatus } from '@netpost/shared-types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  FormSelect,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  cn
} from '@netpost/ui';

interface ListingWithJob extends Listing {
  job?: ListingJob;
}

const statusIcons = {
  active: <CheckCircle className="h-4 w-4 text-emerald-300" />,
  pending: <Clock className="h-4 w-4 text-amber-300" />,
  draft: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  paused: <Pause className="h-4 w-4 text-cyan-300" />,
  sold: <CheckCircle className="h-4 w-4 text-accent" />,
  ended: <XCircle className="h-4 w-4 text-muted-foreground" />,
  cancelled: <XCircle className="h-4 w-4 text-red-300" />,
  rejected: <XCircle className="h-4 w-4 text-red-300" />,
  under_review: <AlertCircle className="h-4 w-4 text-orange-300" />,
  relisted: <RefreshCw className="h-4 w-4 text-secondary" />,
  deleted: <XCircle className="h-4 w-4 text-muted-foreground" />,
};

const listingStatusStyles: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200' },
  pending: { label: 'Pending', className: 'border-amber-500/30 bg-amber-500/15 text-amber-200' },
  draft: { label: 'Draft', className: 'border-white/10 bg-white/10 text-muted-foreground' },
  paused: { label: 'Paused', className: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-200' },
  sold: { label: 'Sold', className: 'border-teal-500/30 bg-teal-500/15 text-teal-200' },
  ended: { label: 'Ended', className: 'border-white/10 bg-white/10 text-muted-foreground' },
  cancelled: { label: 'Cancelled', className: 'border-red-500/30 bg-red-500/15 text-red-200' },
  rejected: { label: 'Rejected', className: 'border-red-500/30 bg-red-500/15 text-red-200' },
  under_review: { label: 'Under Review', className: 'border-orange-500/30 bg-orange-500/15 text-orange-200' },
  relisted: { label: 'Relisted', className: 'border-sky-500/30 bg-sky-500/15 text-sky-200' },
  deleted: { label: 'Deleted', className: 'border-white/10 bg-white/10 text-muted-foreground' },
};

const marketplaceLogos = {
  ebay: '🛍️',
  poshmark: '👗',
  facebook_marketplace: '📘',
  mercari: '🛒',
  depop: '👕',
  vinted: '👚',
  grailed: '👔',
  the_realreal: '💎',
  vestiaire_collective: '👜',
  tradesy: '💍',
  etsy: '🎨',
  amazon: '📦',
  shopify: '🏪',
  custom: '🏬',
};

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'draft', label: 'Draft' },
  { value: 'sold', label: 'Sold' },
  { value: 'ended', label: 'Ended' },
  { value: 'failed', label: 'Failed' },
];

const marketplaceOptions = [
  { value: 'all', label: 'All marketplaces' },
  { value: 'ebay', label: 'eBay' },
  { value: 'poshmark', label: 'Poshmark' },
  { value: 'facebook_marketplace', label: 'Facebook Marketplace' },
  { value: 'mercari', label: 'Mercari' },
  { value: 'depop', label: 'Depop' },
  { value: 'etsy', label: 'Etsy' },
];

export default function ListingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithJob[]>([]);
  const [jobs, setJobs] = useState<ListingJob[]>([]);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('listings');

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('User not authenticated');
        return;
      }

      // Load listings from database
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          *,
          inventory_items!inner(title, photos)
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (listingsError) {
        throw listingsError;
      }

      // Load jobs from queue
      const userJobs = await listingJobQueue.getUserJobs(user.id);
      const stats = await listingJobQueue.getQueueStats();

      // Merge listings with their corresponding jobs
      const listingsWithJobs: ListingWithJob[] = (listingsData || []).map(listing => {
        const job = userJobs.find(j =>
          j.inventory_item_id === listing.inventory_item_id &&
          j.marketplace_type === listing.marketplace_type
        );

        return {
          ...listing,
          job,
        };
      });

      setListings(listingsWithJobs);
      setJobs(userJobs);
      setJobStats(stats);

    } catch (err) {
      console.error('Error loading listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const success = await listingJobQueue.retryJob(jobId);
      if (success) {
        await loadData(); // Refresh data
      } else {
        setError('Failed to retry job');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry job');
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const success = await listingJobQueue.cancelJob(jobId);
      if (success) {
        await loadData(); // Refresh data
      } else {
        setError('Failed to cancel job');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
    }
  };

  const filteredListings = listings.filter(listing => {
    if (searchQuery && !listing.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && listing.status !== statusFilter) {
      return false;
    }
    if (marketplaceFilter !== 'all' && listing.platform !== marketplaceFilter) {
      return false;
    }
    return true;
  });

  const filteredJobs = jobs.filter(job => {
    if (searchQuery && !job.listing_data.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }
    if (marketplaceFilter !== 'all' && job.marketplace_type !== marketplaceFilter) {
      return false;
    }
    return true;
  });

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getListingStatusBadge = (status: ListingStatus | string) => {
    const fallback = { label: status, className: 'border-white/10 bg-white/10 text-muted-foreground' };
    const statusInfo = listingStatusStyles[status] ?? fallback;

    return (
      <Badge
        variant="secondary"
        className={cn(
          'glass-card border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-white/90',
          statusInfo.className
        )}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  const getJobStatusBadge = (job: ListingJob) => {
    const statusMap = {
      pending: { label: 'Queued', className: 'border-sky-500/30 bg-sky-500/15 text-sky-200' },
      processing: { label: 'Processing', className: 'border-amber-500/30 bg-amber-500/15 text-amber-200' },
      completed: { label: 'Success', className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200' },
      failed: { label: 'Failed', className: 'border-red-500/30 bg-red-500/15 text-red-200' },
      retrying: { label: 'Retrying', className: 'border-orange-500/30 bg-orange-500/15 text-orange-200' },
    } as const;

    const status = statusMap[job.status] || { label: job.status, className: 'border-white/10 bg-white/10 text-muted-foreground' };

    return (
      <Badge
        variant="secondary"
        className={cn(
          'glass-card border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-white/90',
          status.className
        )}
      >
        {status.label}
        {job.attempts > 0 && ` (${job.attempts}/${job.max_attempts})`}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user?.email ? {
        email: user.email,
        name: user.user_metadata?.name,
      } : undefined}
    >
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-12">
        <PageHeader
          eyebrow="Operations"
          title="Listings"
          subtitle="Manage your cross-platform listings, stay ahead of job queues, and keep marketplaces in sync."
          icon={<Image className="h-7 w-7 text-primary" />}
          actions={(
            <div className="flex items-center gap-3">
              <Button
                variant="accent"
                className="inline-flex items-center gap-2"
                onClick={() => router.push('/listings/create')}
              >
                <Plus className="h-4 w-4" />
                Create Listing
              </Button>
              <Button variant="outline" size="sm" className="glass-button" onClick={loadData} aria-label="Refresh listings">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        />

        {error && (
          <div className="glass-card flex items-center gap-3 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {jobStats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="glass-card border border-white/10">
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-secondary/20">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-semibold text-foreground">{jobStats.pending_jobs}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border border-white/10">
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-amber-500/20">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-2xl font-semibold text-foreground">{jobStats.processing_jobs}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border border-white/10">
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-emerald-500/20">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-semibold text-foreground">{jobStats.completed_jobs}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border border-white/10">
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-red-500/20">
                  <XCircle className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-semibold text-foreground">{jobStats.failed_jobs}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border border-white/10">
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <div className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-ring/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-semibold text-foreground">{jobStats.total_jobs}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="glass-card border border-white/10">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search listings"
                  className="glass-input w-full pl-10"
                />
              </div>
              <FormSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={statusOptions}
                placeholder="Filter by status"
                className="w-full md:w-48"
              />
              <FormSelect
                value={marketplaceFilter}
                onValueChange={setMarketplaceFilter}
                options={marketplaceOptions}
                placeholder="Filter by marketplace"
                className="w-full md:w-56"
              />
            </div>
            <div className="flex w-full gap-3 md:w-auto md:justify-end">
              <Button
                variant="outline"
                className="glass-button inline-flex items-center gap-2"
                onClick={loadData}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-2 border border-white/10 bg-white/5/40">
            <TabsTrigger value="listings" className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active Listings
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Job Queue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6">
            <Card className="glass-card border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base font-medium text-muted-foreground">
                  <span>Active Listings</span>
                  <Badge variant="secondary" className="glass-card border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                    {filteredListings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredListings.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">No listings found</h3>
                    <p className="text-sm text-muted-foreground">
                      Start by creating your first cross-platform listing.
                    </p>
                    <Button variant="accent" onClick={() => router.push('/listings/create')} className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create your first listing
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-sm">
                      <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4 text-left">Item</th>
                          <th className="px-6 py-4 text-left">Marketplace</th>
                          <th className="px-6 py-4 text-left">Price</th>
                          <th className="px-6 py-4 text-left">Status</th>
                          <th className="px-6 py-4 text-left">Views</th>
                          <th className="px-6 py-4 text-left">Created</th>
                          <th className="px-6 py-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredListings.map((listing) => (
                          <tr key={`${listing.id}-${listing.platform}`} className="transition-colors hover:bg-white/5">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="glass-card flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5">
                                  <Image className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{listing.title}</p>
                                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{listing.platform}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {marketplaceLogos[listing.platform as keyof typeof marketplaceLogos] || '🏪'}
                                </span>
                                <span className="capitalize text-foreground">
                                  {listing.platform.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              {formatCurrency(listing.price, listing.currency)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {statusIcons[listing.status as keyof typeof statusIcons] || <Clock className="h-4 w-4 text-muted-foreground" />}
                                {getListingStatusBadge(listing.status)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-foreground">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span>{listing.views || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {formatDate(listing.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {listing.job && listing.job.status === 'failed' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="glass-button h-8 w-8"
                                    onClick={() => handleRetryJob(listing.job!.id)}
                                    aria-label="Retry job"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <Card className="glass-card border border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">Job Queue</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredJobs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">No jobs yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Jobs will appear here when you create new listings.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-sm">
                      <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4 text-left">Job ID</th>
                          <th className="px-6 py-4 text-left">Item</th>
                          <th className="px-6 py-4 text-left">Marketplace</th>
                          <th className="px-6 py-4 text-left">Status</th>
                          <th className="px-6 py-4 text-left">Created</th>
                          <th className="px-6 py-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredJobs.map((job) => (
                          <tr key={job.id} className="transition-colors hover:bg-white/5">
                            <td className="px-6 py-4">
                              <code className="glass-card rounded bg-white/5 px-2 py-1 text-xs text-foreground">
                                {job.id.slice(-8)}
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-foreground">{job.listing_data.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(job.listing_data.listing_price || 0)}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {marketplaceLogos[job.marketplace_type as keyof typeof marketplaceLogos] || '🏪'}
                                </span>
                                <span className="capitalize text-foreground">
                                  {job.marketplace_type.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-2">
                                {getJobStatusBadge(job)}
                                {job.error_message && (
                                  <p className="text-xs text-destructive">{job.error_message}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {formatDate(job.created_at)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {job.status === 'failed' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="glass-button h-8 w-8"
                                    onClick={() => handleRetryJob(job.id)}
                                    aria-label="Retry job"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                                {(job.status === 'pending' || job.status === 'retrying') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="glass-button h-8 w-8"
                                    onClick={() => handleCancelJob(job.id)}
                                    aria-label="Cancel job"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {job.result?.external_url && (
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="icon"
                                    className="glass-button h-8 w-8"
                                  >
                                    <a
                                      href={job.result.external_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label="View listing"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}