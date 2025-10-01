/**
 * Marketplace Connections Page
 *
 * Main page for managing marketplace connections
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../lib/auth/auth-context';
import { PageHeader } from '../../../components/ui/page-header';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  cn,
} from '@netpost/ui';
import { Plus, RefreshCw, Plug, AlertCircle, ExternalLink } from 'lucide-react';
import { ConnectionSetup } from './components/ConnectionSetup';
import { ConnectionCard } from './components/ConnectionCard';
import { ConnectionStats } from './components/ConnectionStats';
import { useMarketplaceConnections, useConnectionStatistics } from '@/lib/hooks/useMarketplaceConnections';
import type { MarketplaceType, ConnectionStatus } from '@netpost/shared-types';

const statusFilters: { value: ConnectionStatus | 'all'; label: string; description: string }[] = [
  { value: 'all', label: 'All', description: 'Every connection' },
  { value: 'active', label: 'Active', description: 'Healthy and synced' },
  { value: 'expired', label: 'Expired', description: 'Needs attention' },
  { value: 'error', label: 'Error', description: 'Failing sync jobs' },
  { value: 'connecting', label: 'Connecting', description: 'In progress' },
  { value: 'disconnected', label: 'Disconnected', description: 'Manually removed' },
];

export default function ConnectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
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
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-12">
        <PageHeader
          eyebrow="Integrations"
          title="Marketplace Connections"
          subtitle="Connect, monitor, and troubleshoot your marketplace integrations to keep listings in sync."
          icon={<Plug className="h-7 w-7 text-primary" />}
          actions={(
            <div className="flex items-center gap-3">
              <Button
                variant="accent"
                className="inline-flex items-center gap-2"
                onClick={() => handleAddConnection()}
              >
                <Plus className="h-4 w-4" />
                Connect Marketplace
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="glass-button"
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh connections"
              >
                <RefreshCw className={cn('h-4 w-4', { 'animate-spin': isLoading })} />
              </Button>
            </div>
          )}
        />

        {error && (
          <div className="glass-card flex items-center gap-3 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{error.message}</span>
          </div>
        )}

        <ConnectionStats
          total={total}
          active={active}
          expired={expired}
          errors={errors}
          byMarketplace={byMarketplace}
          onAddConnection={handleAddConnection}
        />

        <Card className="glass-card border border-white/10">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filter by status</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="glass-button inline-flex items-center gap-2"
              onClick={() => setSelectedStatus('all')}
              disabled={selectedStatus === 'all'}
            >
              <ExternalLink className="h-4 w-4" />
              View all connections
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={selectedStatus === filter.value ? 'accent' : 'ghost'}
                  className={cn(
                    'glass-button border border-transparent px-3 py-2 text-xs uppercase tracking-[0.25em]',
                    selectedStatus === filter.value
                      ? 'border-white/10 bg-white/10 text-foreground'
                      : 'text-muted-foreground hover:border-white/10 hover:bg-white/5'
                  )}
                  onClick={() => setSelectedStatus(filter.value)}
                >
                  <span className="flex flex-col items-start gap-0.5 text-left">
                    <span>{filter.label}</span>
                    <span className="text-[10px] font-normal tracking-[0.2em] text-muted-foreground">
                      {filter.description}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
            <Badge variant="secondary" className="glass-card border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em]">
              {connections.length} Results
            </Badge>
          </CardContent>
        </Card>

        {/* Error State */}
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="glass-card rounded-lg border border-white/10 p-6">
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
              <div className="glass-card border border-white/10 px-6 py-12 text-center">
                <Plug className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {selectedStatus === 'all' ? 'No connections yet' : `No ${selectedStatus} connections`}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedStatus === 'all'
                    ? 'Get started by connecting your first marketplace account.'
                    : `You don't have any ${selectedStatus} connections at the moment.`}
                </p>
                {selectedStatus === 'all' && (
                  <Button
                    variant="accent"
                    className="mt-6 inline-flex items-center gap-2"
                    onClick={() => handleAddConnection()}
                  >
                    <Plus className="h-4 w-4" />
                    Connect your first marketplace
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        {connections.length > 0 && (
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                className="glass-button inline-flex items-center justify-center gap-2"
                onClick={() => handleAddConnection()}
              >
                <Plus className="h-4 w-4" />
                Add Marketplace
              </Button>
              <Button
                variant="outline"
                className="glass-button inline-flex items-center justify-center gap-2"
                onClick={() => router.push('/inventory')}
              >
                Manage Inventory
              </Button>
              <Button
                variant="outline"
                className="glass-button inline-flex items-center justify-center gap-2"
                onClick={() => router.push('/listings')}
              >
                View Listings
              </Button>
            </CardContent>
          </Card>
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