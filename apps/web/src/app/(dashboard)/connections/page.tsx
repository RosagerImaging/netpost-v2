/**
 * Marketplace Connections Page
 *
 * Main page for managing marketplace connections
 */

'use client';

import { useState } from 'react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../lib/auth/auth-context';
import { AnimatedHeadline } from '../../../components/ui/animated-headline';
import { PlusIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ConnectionSetup } from './components/ConnectionSetup';
import { ConnectionCard } from './components/ConnectionCard';
import { ConnectionStats } from './components/ConnectionStats';
import { useMarketplaceConnections, useConnectionStatistics } from '@/lib/hooks/useMarketplaceConnections';
import type { MarketplaceType, ConnectionStatus } from '@netpost/shared-types';

const statusFilters: { value: ConnectionStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Connections', color: 'gray' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'expired', label: 'Expired', color: 'yellow' },
  { value: 'error', label: 'Error', color: 'red' },
  { value: 'connecting', label: 'Connecting', color: 'blue' },
  { value: 'disconnected', label: 'Disconnected', color: 'gray' },
];

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ConnectionStatus | 'all'>('all');
  const [preselectedMarketplace, setPreselectedMarketplace] = useState<MarketplaceType | undefined>();

  // Mock subscription data
  const subscriptionData = {
    tier: "Free",
    status: "active" as const,
    itemLimit: 10,
    currentItems: 0,
  };

  // Get connections with current filter
  const connectionsFilter = selectedStatus === 'all' ? {} : { connection_status: [selectedStatus] };
  const { data: connectionsData, isLoading, error, refetch } = useMarketplaceConnections(connectionsFilter);
  const { total, active, expired, errors, byMarketplace } = useConnectionStatistics();

  const connections = connectionsData?.success ? connectionsData.data?.connections || [] : [];

  const handleAddConnection = (marketplace?: MarketplaceType) => {
    setPreselectedMarketplace(marketplace);
    setShowSetup(true);
  };

  const handleConnectionSuccess = () => {
    setShowSetup(false);
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

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
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <AnimatedHeadline
              text="Marketplace Connections"
              className="from-primary-600 to-accent-600 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent"
            />
            <p className="mt-2 text-secondary-text">
              Connect your marketplace accounts to start cross-listing your inventory
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => handleAddConnection()}
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Connect Marketplace
            </button>
          </div>
        </div>

      {/* Stats */}
      <ConnectionStats
        total={total}
        active={active}
        expired={expired}
        errors={errors}
        byMarketplace={byMarketplace}
        onAddConnection={handleAddConnection}
      />

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedStatus === filter.value
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              {filter.value !== 'all' && (
                <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-current opacity-75" />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

        {/* Error State */}
        {error && (
          <div className="glass rounded-md bg-red-50/10 border border-red-200/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">
                  Error loading connections
                </h3>
                <div className="mt-2 text-sm text-red-200">
                  <p>{error.message}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="rounded-md bg-red-500/20 px-2 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/30"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="glass rounded-lg border border-white/10 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="h-3 bg-white/10 rounded" />
                    <div className="h-3 bg-white/10 rounded w-5/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connections Grid */}
        {!isLoading && !error && (
          <>
            {connections.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {connections.map((connection) => (
                  <ConnectionCard key={connection.id} connection={connection} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-secondary-text">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-primary-text">
                  {selectedStatus === 'all' ? 'No connections yet' : `No ${selectedStatus} connections`}
                </h3>
                <p className="mt-2 text-sm text-secondary-text">
                  {selectedStatus === 'all'
                    ? 'Get started by connecting your first marketplace account'
                    : `You don't have any ${selectedStatus} connections at the moment`}
                </p>
                {selectedStatus === 'all' && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => handleAddConnection()}
                      className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Connect Your First Marketplace
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        {connections.length > 0 && (
          <div className="glass rounded-lg p-6">
            <h3 className="text-lg font-medium text-primary-text mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleAddConnection()}
                className="flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-primary-text shadow-sm hover:bg-white/10"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Another Marketplace
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard/inventory'}
                className="flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-primary-text shadow-sm hover:bg-white/10"
              >
                Start Cross-Listing
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard/listings'}
                className="flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-primary-text shadow-sm hover:bg-white/10"
              >
                View All Listings
              </button>
            </div>
          </div>
        )}

        {/* Connection Setup Modal */}
        <ConnectionSetup
          isOpen={showSetup}
          onClose={() => setShowSetup(false)}
          onSuccess={handleConnectionSuccess}
          preselectedMarketplace={preselectedMarketplace}
        />
      </div>
    </DashboardLayout>
  );
}