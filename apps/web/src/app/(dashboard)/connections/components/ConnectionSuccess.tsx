/**
 * Connection Success Component
 *
 * Displays successful connection details and next steps
 */

'use client';

import { CheckCircleIcon, ArrowRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { getMarketplaceDisplayInfo } from '@/lib/marketplaces';
import type { MarketplaceConnectionSafe } from '@netpost/shared-types/database/marketplace-connection';

interface ConnectionSuccessProps {
  connection: MarketplaceConnectionSafe;
  onStartOver: () => void;
  onClose: () => void;
}

export function ConnectionSuccess({ connection, onStartOver, onClose }: ConnectionSuccessProps) {
  const marketplaceInfo = getMarketplaceDisplayInfo(connection.marketplace_type);

  const formatConnectionTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'expired':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Successfully Connected!
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Your {marketplaceInfo.name} account is now connected to NetPost
        </p>
      </div>

      {/* Connection Details Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: marketplaceInfo.color }}
          >
            {marketplaceInfo.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-medium text-gray-900">{marketplaceInfo.name}</h4>
            <p className="text-sm text-gray-500">
              {connection.marketplace_username || 'Connected Account'}
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                connection.connection_status
              )}`}
            >
              {connection.connection_status.charAt(0).toUpperCase() + connection.connection_status.slice(1)}
            </span>
          </div>
        </div>

        {/* Connection Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Connected</dt>
            <dd className="mt-1 text-gray-900">
              {formatConnectionTime(connection.connected_at || connection.created_at)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Authentication</dt>
            <dd className="mt-1 text-gray-900">
              {connection.auth_method === 'oauth2' ? 'OAuth 2.0' : 'API Key'}
            </dd>
          </div>
          {connection.access_token_expires_at && (
            <div className="col-span-2">
              <dt className="font-medium text-gray-500">Token Expires</dt>
              <dd className="mt-1 text-gray-900">
                {formatConnectionTime(connection.access_token_expires_at)}
                {connection.hours_until_expiry && connection.hours_until_expiry > 0 && (
                  <span className="ml-2 text-gray-500">
                    ({Math.floor(connection.hours_until_expiry)} hours remaining)
                  </span>
                )}
              </dd>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-3">
          🎉 What's Next?
        </h4>
        <div className="space-y-3 text-sm text-blue-700">
          <div className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
              1
            </span>
            <div>
              <p className="font-medium">Start Cross-Listing</p>
              <p className="text-blue-600">
                Go to your inventory and select items to list on {marketplaceInfo.name}
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
              2
            </span>
            <div>
              <p className="font-medium">Configure Settings</p>
              <p className="text-blue-600">
                Set up default shipping policies, return policies, and listing preferences
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
              3
            </span>
            <div>
              <p className="font-medium">Monitor Performance</p>
              <p className="text-blue-600">
                Track your listings' performance and sales across all connected marketplaces
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Available */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Available Features for {marketplaceInfo.name}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {marketplaceInfo.features.map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between space-x-4">
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Connect Another Marketplace
        </button>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Connection Settings
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              // Navigate to inventory or cross-listing page
              window.location.href = '/dashboard/inventory';
            }}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Start Cross-Listing
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              💡 Pro Tips
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="space-y-1">
                <li>• Test your connection with a few items before bulk listing</li>
                <li>• Set up your shipping and return policies before listing</li>
                <li>• Monitor your connection health in the dashboard</li>
                <li>• Use marketplace-specific features to optimize performance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}