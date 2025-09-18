/**
 * Marketplace Selection Component
 *
 * Allows users to select target marketplaces for cross-listing
 */

'use client';

import { useState } from 'react';
import { CheckIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { useActiveMarketplaceConnections, useMarketplaceSuggestions } from '@/lib/hooks/useCrossListing';
import { getMarketplaceDisplayInfo, getMarketplaceConfig } from '@/lib/marketplaces';
import type { MarketplaceType } from '@netpost/shared-types/database/listing';
import type { InventoryItemRecord } from '@netpost/shared-types/database/inventory-item';

interface MarketplaceSelectionProps {
  selectedMarketplaces: MarketplaceType[];
  onMarketplaceSelect: (marketplaces: MarketplaceType[]) => void;
  selectedItem: InventoryItemRecord | null;
}

export function MarketplaceSelection({
  selectedMarketplaces,
  onMarketplaceSelect,
  selectedItem,
}: MarketplaceSelectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: connectionsData, isLoading } = useActiveMarketplaceConnections();
  const connections = connectionsData?.success ? connectionsData.data || [] : [];

  const availableMarketplaces = connections.map(conn => conn.marketplace_type);
  const suggestions = useMarketplaceSuggestions(selectedItem, availableMarketplaces);

  const toggleMarketplace = (marketplace: MarketplaceType) => {
    const newSelection = selectedMarketplaces.includes(marketplace)
      ? selectedMarketplaces.filter(mp => mp !== marketplace)
      : [...selectedMarketplaces, marketplace];

    onMarketplaceSelect(newSelection);
  };

  const selectAllSuggested = () => {
    const suggestedMarketplaces = suggestions.map(s => s.marketplace);
    onMarketplaceSelect(suggestedMarketplaces);
  };

  const selectAll = () => {
    onMarketplaceSelect(availableMarketplaces);
  };

  const clearAll = () => {
    onMarketplaceSelect([]);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No Marketplace Connections
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            You need to connect at least one marketplace before you can create cross-listings.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard/connections'}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Connect Marketplaces
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Choose Target Marketplaces
        </h2>
        <p className="text-sm text-gray-500">
          Select where you want to list your item. You can customize settings for each marketplace later.
        </p>
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6 rounded-lg bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <LightBulbIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Smart Suggestions for "{selectedItem?.title}"
              </h3>
              <div className="mt-2 space-y-2">
                {suggestions.map((suggestion) => {
                  const info = getMarketplaceDisplayInfo(suggestion.marketplace);
                  const isSelected = selectedMarketplaces.includes(suggestion.marketplace);

                  return (
                    <div
                      key={suggestion.marketplace}
                      className={`flex items-center justify-between p-2 rounded border ${
                        isSelected ? 'border-blue-200 bg-blue-100' : 'border-blue-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: info.color }}
                        >
                          {info.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-blue-900">
                            {info.name}
                          </div>
                          <div className="text-xs text-blue-700">
                            {suggestion.reason}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.confidence === 'high'
                              ? 'bg-green-100 text-green-800'
                              : suggestion.confidence === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {suggestion.confidence} match
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleMarketplace(suggestion.marketplace)}
                          className={`text-xs px-3 py-1 rounded ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-blue-600 border border-blue-600'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {suggestions.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={selectAllSuggested}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Select all suggested marketplaces
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-gray-600 hover:text-gray-500 font-medium"
          >
            Clear All
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {selectedMarketplaces.length} of {availableMarketplaces.length} selected
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {connections.map((connection) => {
          const info = getMarketplaceDisplayInfo(connection.marketplace_type);
          const config = getMarketplaceConfig(connection.marketplace_type);
          const isSelected = selectedMarketplaces.includes(connection.marketplace_type);

          return (
            <div
              key={connection.id}
              onClick={() => toggleMarketplace(connection.marketplace_type)}
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                    <CheckIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {/* Marketplace Info */}
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: info.color }}
                >
                  {info.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{info.name}</h3>
                  <p className="text-xs text-gray-500">
                    {connection.marketplace_username || 'Connected'}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                {info.features.slice(0, 2).map((feature, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                    {feature}
                  </div>
                ))}
              </div>

              {/* Requirements */}
              {config && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Max photos: {config.max_photos}
                  </div>
                  {config.required_fields && (
                    <div className="text-xs text-gray-500">
                      Required: {config.required_fields.slice(0, 2).join(', ')}
                      {config.required_fields.length > 2 && '...'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Advanced Options Toggle */}
      <div className="border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Multi-Marketplace Strategy
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-2">Stagger listing times to avoid flooding</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-2">Use different pricing strategies per marketplace</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-2">Automatically adjust for marketplace fees</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedMarketplaces.length > 0 && (
        <div className="mt-6 rounded-lg bg-green-50 p-4">
          <div className="flex items-center space-x-3">
            <CheckIcon className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                {selectedMarketplaces.length} marketplace{selectedMarketplaces.length !== 1 ? 's' : ''} selected
              </h4>
              <p className="text-sm text-green-600">
                Ready to create your cross-listing forms
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedMarketplaces.map((marketplace) => {
              const info = getMarketplaceDisplayInfo(marketplace);
              return (
                <span
                  key={marketplace}
                  className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                >
                  {info.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}