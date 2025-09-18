/**
 * Marketplace Connections Hooks
 *
 * React hooks for managing marketplace connections
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketplaceConnectionService } from '../services/marketplace-connection-service';
import type {
  MarketplaceConnectionSafe,
  ConnectionFilters,
  MarketplaceType,
  ApiKeyCredentials,
} from '@netpost/shared-types/database/marketplace-connection';

// Query keys
export const marketplaceConnectionKeys = {
  all: ['marketplace-connections'] as const,
  lists: () => [...marketplaceConnectionKeys.all, 'list'] as const,
  list: (filters: ConnectionFilters) => [...marketplaceConnectionKeys.lists(), filters] as const,
  details: () => [...marketplaceConnectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...marketplaceConnectionKeys.details(), id] as const,
  health: (id: string) => [...marketplaceConnectionKeys.detail(id), 'health'] as const,
};

/**
 * Hook to fetch marketplace connections
 */
export function useMarketplaceConnections(
  filters: ConnectionFilters = {},
  limit = 20,
  cursor?: string
) {
  return useQuery({
    queryKey: marketplaceConnectionKeys.list(filters),
    queryFn: () => MarketplaceConnectionService.getConnections(filters, limit, cursor),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch a single marketplace connection
 */
export function useMarketplaceConnection(connectionId: string | null) {
  return useQuery({
    queryKey: marketplaceConnectionKeys.detail(connectionId || ''),
    queryFn: () => {
      if (!connectionId) return Promise.resolve({ success: false, error: 'No connection ID' });
      return MarketplaceConnectionService.getConnection(connectionId);
    },
    enabled: !!connectionId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to initiate OAuth flow
 */
export function useInitiateOAuth() {
  return useMutation({
    mutationFn: ({
      marketplace,
      callbackUrl,
    }: {
      marketplace: MarketplaceType;
      callbackUrl: string;
    }) => MarketplaceConnectionService.initiateOAuth(marketplace, callbackUrl),
    onError: (error) => {
      console.error('OAuth initiation failed:', error);
    },
  });
}

/**
 * Hook to complete OAuth flow
 */
export function useCompleteOAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      connectionId,
      code,
      state,
    }: {
      connectionId: string;
      code: string;
      state: string;
    }) => MarketplaceConnectionService.completeOAuth(connectionId, code, state),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate and refetch connections
        queryClient.invalidateQueries({ queryKey: marketplaceConnectionKeys.all });
      }
    },
    onError: (error) => {
      console.error('OAuth completion failed:', error);
    },
  });
}

/**
 * Hook to store API key credentials
 */
export function useStoreApiKeyCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      marketplace,
      credentials,
      metadata,
    }: {
      marketplace: MarketplaceType;
      credentials: ApiKeyCredentials;
      metadata?: any;
    }) => MarketplaceConnectionService.storeApiKeyCredentials(marketplace, credentials, metadata),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate and refetch connections
        queryClient.invalidateQueries({ queryKey: marketplaceConnectionKeys.all });
      }
    },
    onError: (error) => {
      console.error('API key storage failed:', error);
    },
  });
}

/**
 * Hook to perform health check
 */
export function usePerformHealthCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      MarketplaceConnectionService.performHealthCheck(connectionId),
    onSuccess: (data, connectionId) => {
      if (data.success) {
        // Invalidate specific connection and list queries
        queryClient.invalidateQueries({
          queryKey: marketplaceConnectionKeys.detail(connectionId),
        });
        queryClient.invalidateQueries({
          queryKey: marketplaceConnectionKeys.lists(),
        });
      }
    },
    onError: (error) => {
      console.error('Health check failed:', error);
    },
  });
}

/**
 * Hook to refresh OAuth token
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      MarketplaceConnectionService.refreshToken(connectionId),
    onSuccess: (data, connectionId) => {
      if (data.success) {
        // Invalidate specific connection and list queries
        queryClient.invalidateQueries({
          queryKey: marketplaceConnectionKeys.detail(connectionId),
        });
        queryClient.invalidateQueries({
          queryKey: marketplaceConnectionKeys.lists(),
        });
      }
    },
    onError: (error) => {
      console.error('Token refresh failed:', error);
    },
  });
}

/**
 * Hook to delete marketplace connection
 */
export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      MarketplaceConnectionService.deleteConnection(connectionId),
    onSuccess: (data, connectionId) => {
      if (data.success) {
        // Remove from cache and invalidate lists
        queryClient.removeQueries({
          queryKey: marketplaceConnectionKeys.detail(connectionId),
        });
        queryClient.invalidateQueries({
          queryKey: marketplaceConnectionKeys.lists(),
        });
      }
    },
    onError: (error) => {
      console.error('Connection deletion failed:', error);
    },
  });
}

/**
 * Hook to get active connections for a specific marketplace
 */
export function useActiveMarketplaceConnections(marketplace?: MarketplaceType) {
  const filters: ConnectionFilters = {
    connection_status: ['active'],
    ...(marketplace && { marketplace_type: [marketplace] }),
  };

  return useMarketplaceConnections(filters);
}

/**
 * Hook to get connections that need attention (expired, errors, etc.)
 */
export function useConnectionsNeedingAttention() {
  const expiringSoonFilters: ConnectionFilters = {
    token_expires_within_hours: 24,
  };

  const errorFilters: ConnectionFilters = {
    has_errors: true,
  };

  const expiringSoon = useMarketplaceConnections(expiringSoonFilters);
  const withErrors = useMarketplaceConnections(errorFilters);

  return {
    expiringSoon,
    withErrors,
    isLoading: expiringSoon.isLoading || withErrors.isLoading,
    error: expiringSoon.error || withErrors.error,
  };
}

/**
 * Hook to get connection statistics
 */
export function useConnectionStatistics() {
  const allConnections = useMarketplaceConnections();

  const stats = {
    total: 0,
    active: 0,
    expired: 0,
    errors: 0,
    byMarketplace: {} as Record<MarketplaceType, number>,
  };

  if (allConnections.data?.success && allConnections.data.data?.connections) {
    const connections = allConnections.data.data.connections;

    stats.total = connections.length;
    stats.active = connections.filter(c => c.connection_status === 'active').length;
    stats.expired = connections.filter(c => c.connection_status === 'expired').length;
    stats.errors = connections.filter(c => c.consecutive_errors > 0).length;

    // Group by marketplace
    connections.forEach(connection => {
      stats.byMarketplace[connection.marketplace_type] =
        (stats.byMarketplace[connection.marketplace_type] || 0) + 1;
    });
  }

  return {
    ...stats,
    isLoading: allConnections.isLoading,
    error: allConnections.error,
  };
}

/**
 * Custom hook for real-time connection health monitoring
 */
export function useConnectionHealthMonitoring() {
  const queryClient = useQueryClient();

  // Perform health checks every 5 minutes for active connections
  const performHealthChecks = useMutation({
    mutationFn: async () => {
      const connectionsResult = await MarketplaceConnectionService.getConnections({
        connection_status: ['active'],
      });

      if (!connectionsResult.success || !connectionsResult.data?.connections) {
        return;
      }

      const healthCheckPromises = connectionsResult.data.connections.map(connection =>
        MarketplaceConnectionService.performHealthCheck(connection.id)
      );

      await Promise.allSettled(healthCheckPromises);
    },
    onSuccess: () => {
      // Invalidate all connection queries after health checks
      queryClient.invalidateQueries({ queryKey: marketplaceConnectionKeys.all });
    },
  });

  return {
    performHealthChecks: performHealthChecks.mutate,
    isRunning: performHealthChecks.isPending,
    error: performHealthChecks.error,
  };
}