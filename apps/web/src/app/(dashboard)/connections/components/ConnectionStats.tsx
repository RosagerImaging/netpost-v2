/**
 * Connection Stats Component
 *
 * Displays overview statistics for marketplace connections
 */

'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import { getMarketplaceDisplayInfo } from '@/lib/marketplaces';
import type { MarketplaceType } from '@netpost/shared-types';

interface ConnectionStatsProps {
  total: number;
  active: number;
  expired: number;
  errors: number;
  byMarketplace: Record<MarketplaceType, number>;
  onAddConnection: (marketplace?: MarketplaceType) => void;
}

export function ConnectionStats({
  total,
  active,
  expired,
  errors,
  byMarketplace,
  onAddConnection,
}: ConnectionStatsProps) {
  const stats = [
    {
      name: 'Total Connections',
      value: total,
      color: 'text-gray-900',
      bgColor: 'bg-white',
      change: null,
    },
    {
      name: 'Active',
      value: active,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      change: null,
    },
    {
      name: 'Need Attention',
      value: expired + errors,
      color: expired + errors > 0 ? 'text-yellow-700' : 'text-gray-700',
      bgColor: expired + errors > 0 ? 'bg-yellow-50' : 'bg-gray-50',
      change: null,
    },
  ];

  // Get top marketplaces by connection count
  const topMarketplaces = Object.entries(byMarketplace)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`overflow-hidden rounded-lg ${stat.bgColor} px-4 py-5 shadow sm:p-6`}
          >
            <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
            <dd className={`mt-1 text-3xl font-semibold tracking-tight ${stat.color}`}>
              {stat.value}
            </dd>
          </div>
        ))}
      </div>

      {/* Marketplace Breakdown */}
      {total > 0 && (
        <div className="rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Connected Marketplaces
              </h3>
              <button
                type="button"
                onClick={() => onAddConnection()}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add More
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {topMarketplaces.map(([marketplace, count]) => {
                const info = getMarketplaceDisplayInfo(marketplace as MarketplaceType);
                return (
                  <div
                    key={marketplace}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                    onClick={() => onAddConnection(marketplace as MarketplaceType)}
                  >
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: info.color }}
                    >
                      {info.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {info.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {count} connection{count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Add more button if we have less than 4 marketplace types */}
              {topMarketplaces.length < 4 && (
                <div
                  className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-colors"
                  onClick={() => onAddConnection()}
                >
                  <div className="text-center">
                    <PlusIcon className="h-6 w-6 mx-auto text-gray-400" />
                    <p className="mt-1 text-xs text-gray-500">Add marketplace</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State for New Users */}
      {total === 0 && (
        <div className="rounded-lg bg-blue-50 p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <PlusIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-blue-900">
                Start Cross-Listing Today
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Connect your marketplace accounts to begin cross-listing your inventory across
                multiple platforms. Start with the most popular marketplaces for your niche.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => onAddConnection()}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popular Marketplaces Suggestion */}
      {total > 0 && total < 3 && (
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            📈 Maximize Your Reach
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Consider connecting to these popular marketplaces to increase your sales potential:
          </p>
          <div className="flex flex-wrap gap-2">
            {['ebay', 'poshmark', 'facebook_marketplace'].filter(
              marketplace => !byMarketplace[marketplace as MarketplaceType]
            ).map((marketplace) => {
              const info = getMarketplaceDisplayInfo(marketplace as MarketplaceType);
              return (
                <button
                  key={marketplace}
                  type="button"
                  onClick={() => onAddConnection(marketplace as MarketplaceType)}
                  className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <div
                    className="h-4 w-4 rounded-full mr-2"
                    style={{ backgroundColor: info.color }}
                  />
                  {info.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}