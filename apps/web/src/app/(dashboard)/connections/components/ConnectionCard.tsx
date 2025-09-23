/**
 * Connection Card Component
 *
 * Displays individual marketplace connection information and actions
 */

'use client';

import { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { getMarketplaceDisplayInfo } from '@/lib/marketplaces';
import {
  usePerformHealthCheck,
  useRefreshToken,
  useDeleteConnection,
} from '@/lib/hooks/useMarketplaceConnections';
import type { MarketplaceConnectionSafe } from '@netpost/shared-types';

interface ConnectionCardProps {
  connection: MarketplaceConnectionSafe;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const marketplaceInfo = getMarketplaceDisplayInfo(connection.marketplace_type);
  const performHealthCheck = usePerformHealthCheck();
  const refreshToken = useRefreshToken();
  const deleteConnection = useDeleteConnection();

  const getStatusIcon = () => {
    switch (connection.connection_status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'expired':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connection.connection_status) {
      case 'active':
        return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'expired':
        return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
      case 'error':
        return 'text-red-700 bg-red-50 ring-red-600/20';
      default:
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
    }
  };

  const formatLastUsed = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleHealthCheck = () => {
    performHealthCheck.mutate(connection.id);
  };

  const handleRefreshToken = () => {
    refreshToken.mutate(connection.id);
  };

  const handleDelete = () => {
    deleteConnection.mutate(connection.id, {
      onSuccess: () => {
        setShowConfirmDelete(false);
      },
    });
  };

  const needsAttention =
    connection.connection_status === 'expired' ||
    connection.connection_status === 'error' ||
    connection.consecutive_errors > 0 ||
    (connection.hours_until_expiry !== null && connection.hours_until_expiry <= 24);

  return (
    <div className={`rounded-lg border p-6 transition-all duration-200 ${
      needsAttention ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white hover:shadow-md'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: marketplaceInfo.color }}
          >
            {marketplaceInfo.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900">
              {marketplaceInfo.name}
            </h3>
            <p className="text-sm text-gray-500">
              {connection.marketplace_username || 'Connected Account'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor()}`}
        >
          {connection.connection_status.charAt(0).toUpperCase() + connection.connection_status.slice(1)}
        </span>
        {connection.status_message && (
          <p className="mt-1 text-xs text-gray-500">{connection.status_message}</p>
        )}
      </div>

      {/* Connection Details */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex justify-between">
          <span>Authentication:</span>
          <span className="font-medium">
            {connection.auth_method === 'oauth2' ? 'OAuth 2.0' : 'API Key'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last used:</span>
          <span className="font-medium">{formatLastUsed(connection.last_used_at)}</span>
        </div>
        {connection.hours_until_expiry !== null && (
          <div className="flex justify-between">
            <span>Token expires:</span>
            <span className={`font-medium ${
              connection.hours_until_expiry <= 24 ? 'text-yellow-600' : 'text-gray-900'
            }`}>
              {connection.hours_until_expiry > 0
                ? `${Math.floor(connection.hours_until_expiry)}h`
                : 'Expired'
              }
            </span>
          </div>
        )}
        {connection.consecutive_errors > 0 && (
          <div className="flex justify-between">
            <span>Recent errors:</span>
            <span className="font-medium text-red-600">{connection.consecutive_errors}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleHealthCheck}
            disabled={performHealthCheck.isPending}
            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-3 w-3 mr-1 ${performHealthCheck.isPending ? 'animate-spin' : ''}`} />
            Test
          </button>

          {connection.auth_method === 'oauth2' && (
            <button
              type="button"
              onClick={handleRefreshToken}
              disabled={refreshToken.isPending}
              className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-3 w-3 mr-1 ${refreshToken.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <Cog6ToothIcon className="h-3 w-3 mr-1" />
            Settings
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
          >
            <TrashIcon className="h-3 w-3 mr-1" />
            Remove
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Remove Connection
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to remove your {marketplaceInfo.name} connection? This will stop all
              automated listing activities for this marketplace.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConnection.isPending}
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
              >
                {deleteConnection.isPending ? 'Removing...' : 'Remove Connection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attention Banner */}
      {needsAttention && (
        <div className="mt-4 rounded-md bg-yellow-100 p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Needs Attention
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                {connection.connection_status === 'expired' && (
                  <p>Connection has expired. Please refresh your authentication.</p>
                )}
                {connection.connection_status === 'error' && (
                  <p>Connection error detected. Check your credentials and try again.</p>
                )}
                {connection.consecutive_errors > 0 && connection.connection_status === 'active' && (
                  <p>Recent API errors detected. Monitor for continued issues.</p>
                )}
                {connection.hours_until_expiry !== null && connection.hours_until_expiry <= 24 && connection.hours_until_expiry > 0 && (
                  <p>Authentication token expires soon. Consider refreshing now.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}