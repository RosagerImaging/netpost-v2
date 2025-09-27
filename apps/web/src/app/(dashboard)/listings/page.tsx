'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../lib/auth/auth-context';
import { AnimatedHeadline } from '../../../components/ui/animated-headline';
import {
  Plus,
  Search,
  Filter,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Image
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { listingJobQueue, type ListingJob, type JobStats } from '@/lib/services/listing-job-queue';
import type { Listing, ListingStatus, MarketplaceType } from '@netpost/shared-types';

interface ListingWithJob extends Listing {
  job?: ListingJob;
}

const statusIcons = {
  active: <CheckCircle className="h-4 w-4 text-green-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  draft: <AlertCircle className="h-4 w-4 text-gray-500" />,
  paused: <Pause className="h-4 w-4 text-blue-500" />,
  sold: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  ended: <XCircle className="h-4 w-4 text-gray-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
  under_review: <AlertCircle className="h-4 w-4 text-orange-500" />,
  relisted: <RefreshCw className="h-4 w-4 text-blue-500" />,
  deleted: <XCircle className="h-4 w-4 text-gray-400" />,
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-800',
  paused: 'bg-blue-100 text-blue-800',
  sold: 'bg-emerald-100 text-emerald-800',
  ended: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  under_review: 'bg-orange-100 text-orange-800',
  relisted: 'bg-blue-100 text-blue-800',
  deleted: 'bg-gray-100 text-gray-800',
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

  const getJobStatusBadge = (job: ListingJob) => {
    const statusMap = {
      pending: { label: 'Queued', color: 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs' },
      processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs' },
      completed: { label: 'Success', color: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs' },
      retrying: { label: 'Retrying', color: 'bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs' },
    };

    const { label, color } = statusMap[job.status] || { label: job.status, color: 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs' };

    return (
      <span className={color}>
        {label}
        {job.attempts > 0 && ` (${job.attempts}/${job.max_attempts})`}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user ? { email: user.email, name: user.user_metadata?.name } : undefined}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <AnimatedHeadline
              text="Listings"
              className="from-primary-600 to-accent-600 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent tracking-tight"
            />
            <p className="text-muted-foreground">
              Manage your cross-platform listings and monitor their status
            </p>
          </div>
        <button
          onClick={() => router.push('/listings/create')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Listing
        </button>
      </div>

        {error && (
          <div className="glass bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

      {/* Stats Cards */}
      {jobStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="glass p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{jobStats.pending_jobs}</p>
              </div>
            </div>
          </div>
          <div className="glass p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Processing</p>
                <p className="text-2xl font-bold">{jobStats.processing_jobs}</p>
              </div>
            </div>
          </div>
          <div className="glass p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{jobStats.completed_jobs}</p>
              </div>
            </div>
          </div>
          <div className="glass p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-bold">{jobStats.failed_jobs}</p>
              </div>
            </div>
          </div>
          <div className="glass p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold">{jobStats.total_jobs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
          <option value="sold">Sold</option>
          <option value="ended">Ended</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={marketplaceFilter}
          onChange={(e) => setMarketplaceFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Marketplaces</option>
          <option value="ebay">eBay</option>
          <option value="poshmark">Poshmark</option>
          <option value="facebook_marketplace">Facebook</option>
          <option value="mercari">Mercari</option>
        </select>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'listings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Listings
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Job Queue
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'listings' && (
            <div className="glass rounded-lg border shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Active Listings</h3>
                <p className="text-sm text-gray-500">Your listings across all connected marketplaces</p>
              </div>
              <div className="p-6">
                {filteredListings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <TrendingUp className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
                    <p className="text-gray-500 mb-4">
                      Start by creating your first cross-platform listing
                    </p>
                    <button
                      onClick={() => router.push('/listings/create')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Create Your First Listing
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marketplace
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Views
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredListings.map((listing) => (
                          <tr key={`${listing.id}-${listing.platform}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                  <Image className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium">{listing.title}</p>
                                  <p className="text-sm text-gray-500">
                                    {listing.platform}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {marketplaceLogos[listing.platform as keyof typeof marketplaceLogos] || '🏪'}
                                </span>
                                <span className="capitalize">
                                  {listing.platform.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatCurrency(listing.price, listing.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {statusIcons[listing.status as keyof typeof statusIcons] || <Clock className="h-4 w-4 text-gray-500" />}
                                <span className={`px-2 py-1 rounded-full text-xs ${statusColors[listing.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                                  {listing.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4 text-gray-400" />
                                <span>{listing.views || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(listing.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {listing.job && listing.job.status === 'failed' && (
                                  <button
                                    onClick={() => handleRetryJob(listing.job!.id)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="glass rounded-lg border shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Job Queue</h3>
                <p className="text-sm text-gray-500">Monitor the status of your listing creation jobs</p>
              </div>
              <div className="p-6">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <Clock className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-500">
                      Jobs will appear here when you create new listings
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Job ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marketplace
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {job.id.slice(-8)}
                              </code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="font-medium">{job.listing_data.title}</p>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(job.listing_data.listing_price || 0)}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {marketplaceLogos[job.marketplace_type as keyof typeof marketplaceLogos] || '🏪'}
                                </span>
                                <span className="capitalize">
                                  {job.marketplace_type.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getJobStatusBadge(job)}
                              {job.error_message && (
                                <p className="text-xs text-red-600 mt-1">{job.error_message}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(job.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {job.status === 'failed' && (
                                  <button
                                    onClick={() => handleRetryJob(job.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Retry"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                )}
                                {(job.status === 'pending' || job.status === 'retrying') && (
                                  <button
                                    onClick={() => handleCancelJob(job.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Cancel"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                )}
                                {job.result?.external_url && (
                                  <a
                                    href={job.result.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View listing"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}