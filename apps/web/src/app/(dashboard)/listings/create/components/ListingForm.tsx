/**
 * Listing Form Component
 *
 * Form for creating cross-platform listing with marketplace-specific customizations
 */

'use client';

import { useState } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { getMarketplaceDisplayInfo, getMarketplaceConfig } from '@/lib/marketplaces';
import type { CrossListingFormData, CrossListingValidation } from '@/lib/services/cross-listing-service';
import type { InventoryItemRecord } from '@netpost/shared-types/database/inventory-item';
import type { CreateListingInput, MarketplaceType } from '@netpost/shared-types/database/listing';

interface ListingFormProps {
  formData: CrossListingFormData;
  selectedItem: InventoryItemRecord | null;
  onUpdateBaseListing: (updates: Partial<CrossListingFormData['base_listing']>) => void;
  onUpdateMarketplaceCustomization: (marketplace: MarketplaceType, updates: Partial<CreateListingInput>) => void;
  onUpdateFormData: (updates: Partial<CrossListingFormData>) => void;
  validation: CrossListingValidation;
  onComplete: () => void;
}

export function ListingForm({
  formData,
  selectedItem,
  onUpdateBaseListing,
  onUpdateMarketplaceCustomization,
  onUpdateFormData,
  validation,
  onComplete,
}: ListingFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'marketplace_specific'>('basic');

  const formatPrice = (price: number | null) => {
    if (!price) return '';
    return price.toString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation.isValid) {
      onComplete();
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', description: 'Title, description, photos' },
    { id: 'pricing', name: 'Pricing', description: 'Price strategy across marketplaces' },
    { id: 'marketplace_specific', name: 'Marketplace Settings', description: 'Custom settings per platform' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Create Your Cross-Listing
        </h2>
        <p className="text-sm text-gray-500">
          Configure your listing details. The same base information will be used across all selected marketplaces.
        </p>
      </div>

      {/* Validation Errors */}
      {!validation.isValid && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {Object.entries(validation.marketplaceErrors).map(([marketplace, errors]) => (
                    errors.map((error, index) => (
                      <li key={`${marketplace}-${index}`}>
                        {getMarketplaceDisplayInfo(marketplace as MarketplaceType).name}: {error}
                      </li>
                    ))
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <div>
                <div>{tab.name}</div>
                <div className="text-xs text-gray-400">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Listing Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.base_listing.title}
                onChange={(e) => onUpdateBaseListing({ title: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Enter a compelling title for your listing"
              />
              <p className="mt-1 text-sm text-gray-500">
                A good title includes brand, condition, and key features
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                value={formData.base_listing.description}
                onChange={(e) => onUpdateBaseListing({ description: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Describe your item in detail..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Include condition details, measurements, and any flaws
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={formData.base_listing.quantity_available}
                  onChange={(e) => onUpdateBaseListing({ quantity_available: parseInt(e.target.value) || 1 })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              <div>
                <label htmlFor="condition_description" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition Notes
                </label>
                <input
                  type="text"
                  id="condition_description"
                  value={formData.base_listing.condition_description || ''}
                  onChange={(e) => onUpdateBaseListing({ condition_description: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Any specific condition details"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {formData.base_listing.photo_urls.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPhotos = formData.base_listing.photo_urls.filter((_, i) => i !== index);
                        onUpdateBaseListing({ photo_urls: newPhotos });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {formData.base_listing.photo_urls.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500">
                    No photos selected. Photos from your inventory item will be used.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Pricing Strategy
              </label>
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="pricing_strategy"
                    value="fixed"
                    checked={formData.pricing_strategy === 'fixed'}
                    onChange={(e) => onUpdateFormData({ pricing_strategy: e.target.value as any })}
                    className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Fixed Price</div>
                    <div className="text-sm text-gray-500">Use the same price across all marketplaces</div>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="radio"
                    name="pricing_strategy"
                    value="percentage_markup"
                    checked={formData.pricing_strategy === 'percentage_markup'}
                    onChange={(e) => onUpdateFormData({ pricing_strategy: e.target.value as any })}
                    className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Percentage Markup</div>
                    <div className="text-sm text-gray-500">Apply a percentage increase to base price</div>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="radio"
                    name="pricing_strategy"
                    value="marketplace_specific"
                    checked={formData.pricing_strategy === 'marketplace_specific'}
                    onChange={(e) => onUpdateFormData({ pricing_strategy: e.target.value as any })}
                    className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Marketplace Specific</div>
                    <div className="text-sm text-gray-500">Set different prices for each marketplace</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="listing_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="listing_price"
                    step="0.01"
                    min="0"
                    value={formatPrice(formData.base_listing.listing_price)}
                    onChange={(e) => onUpdateBaseListing({ listing_price: parseFloat(e.target.value) || 0 })}
                    className="block w-full rounded-md border-0 py-1.5 pl-7 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formData.pricing_strategy === 'percentage_markup' && (
                <div>
                  <label htmlFor="markup_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                    Markup Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="markup_percentage"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.markup_percentage || ''}
                      onChange={(e) => onUpdateFormData({ markup_percentage: parseFloat(e.target.value) || 0 })}
                      className="block w-full rounded-md border-0 py-1.5 pr-7 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="0"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Marketplace-specific pricing preview */}
            {formData.marketplaces.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Pricing Preview by Marketplace
                </h4>
                <div className="space-y-2">
                  {formData.marketplaces.map((marketplace) => {
                    const info = getMarketplaceDisplayInfo(marketplace);
                    const price = formData.pricing_strategy === 'percentage_markup' && formData.markup_percentage
                      ? formData.base_listing.listing_price * (1 + formData.markup_percentage / 100)
                      : formData.base_listing.listing_price;

                    return (
                      <div key={marketplace} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-900">{info.name}</span>
                        <span className="text-gray-600">${price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marketplace Specific Tab */}
        {activeTab === 'marketplace_specific' && (
          <div className="space-y-6">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Marketplace Customizations
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Each marketplace has unique requirements and features. Customize your listing
                      for optimal performance on each platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {formData.marketplaces.map((marketplace) => {
              const info = getMarketplaceDisplayInfo(marketplace);
              const config = getMarketplaceConfig(marketplace);

              return (
                <div key={marketplace} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: info.color }}
                    >
                      {info.name.slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{info.name}</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Marketplace-specific fields would go here */}
                    <div className="text-sm text-gray-500">
                      <p>Marketplace-specific customizations coming soon...</p>
                      <p className="mt-1">
                        Max photos: {config?.max_photos} |
                        Required fields: {config?.required_fields?.join(', ') || 'Basic info'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">
              {validation.warnings.length > 0 && (
                <div>
                  <p className="font-medium text-yellow-600">Warnings:</p>
                  <ul className="list-disc list-inside">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Reset Form
              </button>

              <button
                type="submit"
                disabled={!validation.isValid}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Listings
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}