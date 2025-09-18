/**
 * Marketplace Selector Component
 *
 * Displays available marketplaces with their features and connection status
 */

'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  getSupportedMarketplaces,
  getMarketplaceDisplayInfo,
  getMarketplaceConfig
} from '@/lib/marketplaces';
import { useMarketplaceConnections } from '@/lib/hooks/useMarketplaceConnections';
import type { MarketplaceType } from '@netpost/shared-types/database/listing';

interface MarketplaceSelectorProps {
  onSelect: (marketplace: MarketplaceType) => void;
  preselected?: MarketplaceType;
}

export function MarketplaceSelector({ onSelect, preselected }: MarketplaceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fashion' | 'general' | 'local'>('all');

  // Get existing connections to show which marketplaces are already connected
  const { data: connectionsData } = useMarketplaceConnections({
    connection_status: ['active', 'expired', 'connecting'],
  });

  const existingConnections = connectionsData?.success
    ? connectionsData.data?.connections || []
    : [];

  const connectedMarketplaces = new Set(
    existingConnections.map(conn => conn.marketplace_type)
  );

  const supportedMarketplaces = getSupportedMarketplaces();

  // Categorize marketplaces
  const categorizedMarketplaces = useMemo(() => {
    const categories = {
      fashion: ['poshmark', 'depop', 'vinted', 'grailed', 'the_realreal', 'vestiaire_collective', 'tradesy'] as MarketplaceType[],
      local: ['facebook_marketplace', 'mercari'] as MarketplaceType[],
      general: ['ebay', 'etsy', 'amazon', 'shopify'] as MarketplaceType[],
    };

    return categories;
  }, []);

  const filteredMarketplaces = useMemo(() => {
    let filtered = supportedMarketplaces;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(marketplace =>
        categorizedMarketplaces[selectedCategory].includes(marketplace)
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(marketplace => {
        const info = getMarketplaceDisplayInfo(marketplace);
        return (
          info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          info.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          info.features.some(feature =>
            feature.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      });
    }

    return filtered;
  }, [supportedMarketplaces, selectedCategory, searchQuery, categorizedMarketplaces]);

  const categoryTabs = [
    { id: 'all', name: 'All Marketplaces', count: supportedMarketplaces.length },
    { id: 'fashion', name: 'Fashion', count: categorizedMarketplaces.fashion.length },
    { id: 'general', name: 'General', count: categorizedMarketplaces.general.length },
    { id: 'local', name: 'Local', count: categorizedMarketplaces.local.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Search marketplaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                  selectedCategory === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.name}
                <span
                  className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                    selectedCategory === tab.id
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMarketplaces.map((marketplace) => {
          const info = getMarketplaceDisplayInfo(marketplace);
          const config = getMarketplaceConfig(marketplace);
          const isConnected = connectedMarketplaces.has(marketplace);
          const isPreselected = preselected === marketplace;

          return (
            <div
              key={marketplace}
              className={`relative overflow-hidden rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                isPreselected
                  ? 'border-indigo-500 bg-indigo-50'
                  : isConnected
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => onSelect(marketplace)}
            >
              {/* Connection Status */}
              {isConnected && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
              )}

              {/* Logo and Name */}
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: info.color }}
                >
                  {info.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">{info.name}</h3>
                  <p className="text-sm text-gray-500">
                    {config?.auth_method === 'oauth2' ? 'OAuth 2.0' : 'API Key'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {info.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                  Key Features
                </h4>
                <div className="flex flex-wrap gap-1">
                  {info.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                    >
                      {feature}
                    </span>
                  ))}
                  {info.features.length > 3 && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                      +{info.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Connection Status */}
              {isConnected && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center text-sm text-green-700">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Already Connected
                  </div>
                </div>
              )}

              {/* Requirements */}
              {config && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Requirements: {config.required_fields?.join(', ') || 'Basic info'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredMarketplaces.length === 0 && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No marketplaces found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Need help choosing?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Start with eBay for general items, Poshmark for fashion, or Facebook Marketplace for local sales.
                You can connect multiple marketplaces to maximize your reach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}