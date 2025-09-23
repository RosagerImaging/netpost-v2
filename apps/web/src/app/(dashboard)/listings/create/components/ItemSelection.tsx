/**
 * Item Selection Component
 *
 * Allows users to select inventory items for cross-listing
 */

'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAvailableInventoryItems } from '@/lib/hooks/useCrossListing';
import type { InventoryItemRecord } from '@netpost/shared-types';

interface ItemSelectionProps {
  onItemSelect: (item: InventoryItemRecord) => void;
  selectedItem: InventoryItemRecord | null;
}

export function ItemSelection({ onItemSelect, selectedItem }: ItemSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: inventoryData, isLoading, error } = useAvailableInventoryItems(searchQuery, 20);

  const items = inventoryData?.success ? inventoryData.data?.items || [] : [];

  const formatPrice = (price: number | null) => {
    if (!price) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
        return 'text-green-600';
      case 'like new':
        return 'text-blue-600';
      case 'excellent':
        return 'text-purple-600';
      case 'good':
        return 'text-yellow-600';
      case 'fair':
        return 'text-orange-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Error loading inventory items: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Select Item to Cross-List
        </h2>
        <p className="text-sm text-gray-500">
          Choose an inventory item to list across multiple marketplaces
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search your inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
              <div className="flex space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items Grid */}
      {!isLoading && (
        <>
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemSelect(item)}
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                    selectedItem?.id === item.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Selection Indicator */}
                  {selectedItem?.id === item.id && (
                    <div className="absolute top-2 right-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                        <CheckIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    {/* Item Photo */}
                    <div className="flex-shrink-0">
                      {item.photos && item.photos.length > 0 ? (
                        <img
                          src={item.photos[0].url}
                          alt={item.title}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No photo</span>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          {item.brand && (
                            <p className="text-sm text-gray-500">{item.brand}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 text-right flex-shrink-0">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(item.target_price)}
                          </div>
                          {item.purchase_price && item.purchase_price !== item.target_price && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatPrice(item.purchase_price)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Item Metadata */}
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>

                        <span className={`font-medium ${getConditionColor(item.condition)}`}>
                          {item.condition}
                        </span>

                        {item.category && (
                          <span>{item.category}</span>
                        )}

                        <span>Qty: {item.quantity}</span>

                        {item.photos && (
                          <span>{item.photos.length} photo{item.photos.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                              +{item.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Listing History */}
                      {item.times_listed > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Listed {item.times_listed} time{item.times_listed !== 1 ? 's' : ''} before
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchQuery ? 'No items found' : 'No inventory items available'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Add items to your inventory to start cross-listing'
                }
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/dashboard/inventory'}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Add Inventory Items
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Selection Summary */}
      {selectedItem && (
        <div className="mt-6 rounded-lg bg-indigo-50 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CheckIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-indigo-800">
                Item Selected: {selectedItem.title}
              </h4>
              <p className="text-sm text-indigo-600">
                Ready to choose marketplaces for cross-listing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}