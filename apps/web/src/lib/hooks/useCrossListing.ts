/**
 * Cross-Listing Hooks
 *
 * React hooks for managing cross-listing operations
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CrossListingService } from '../services/cross-listing-service';
import type { CrossListingFormData } from '../services/cross-listing-service';
import type { CreateListingInput, MarketplaceType } from '@netpost/shared-types';
import type { InventoryItemRecord } from '@netpost/shared-types';

// Query keys
export const crossListingKeys = {
  all: ['cross-listing'] as const,
  inventoryItems: () => [...crossListingKeys.all, 'inventory-items'] as const,
  inventoryItemsList: (searchQuery?: string) => [...crossListingKeys.inventoryItems(), searchQuery] as const,
  connections: () => [...crossListingKeys.all, 'connections'] as const,
  preview: (formData: CrossListingFormData) => [...crossListingKeys.all, 'preview', formData] as const,
};

/**
 * Hook to fetch inventory items available for cross-listing
 */
export function useAvailableInventoryItems(
  searchQuery?: string,
  limit = 20,
  cursor?: string
) {
  return useQuery({
    queryKey: crossListingKeys.inventoryItemsList(searchQuery),
    queryFn: () => CrossListingService.getAvailableInventoryItems(searchQuery, limit, cursor),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch active marketplace connections
 */
export function useActiveMarketplaceConnections() {
  return useQuery({
    queryKey: crossListingKeys.connections(),
    queryFn: () => CrossListingService.getActiveMarketplaceConnections(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to generate cross-listing preview
 */
export function useCrossListingPreview(formData: CrossListingFormData | null) {
  return useQuery({
    queryKey: crossListingKeys.preview(formData || ({} as CrossListingFormData)),
    queryFn: () => {
      if (!formData || formData.marketplaces.length === 0) {
        return Promise.resolve({ success: false, error: 'No marketplaces selected' });
      }
      return CrossListingService.generateCrossListingPreview(formData);
    },
    enabled: !!formData && formData.marketplaces.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to submit cross-listing
 */
export function useSubmitCrossListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: CrossListingFormData) =>
      CrossListingService.submitCrossListing(formData),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: crossListingKeys.inventoryItems() });
        queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] });
        queryClient.invalidateQueries({ queryKey: ['listings'] });
      }
    },
    onError: (error) => {
      console.error('Cross-listing submission failed:', error);
    },
  });
}

/**
 * Hook for cross-listing form state management
 */
export function useCrossListingForm(initialData?: Partial<CrossListingFormData>) {
  const [formData, setFormData] = useState<CrossListingFormData>({
    inventory_item_id: '',
    marketplaces: [],
    base_listing: {
      title: '',
      description: '',
      listing_price: 0,
      currency: 'USD',
      quantity_available: 1,
      photo_urls: [],
      tags: [],
    },
    marketplace_customizations: {} as any,
    pricing_strategy: 'fixed',
    auto_relist: false,
    ...initialData,
  });

  const updateFormData = (updates: Partial<CrossListingFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const updateBaseListing = (updates: Partial<CrossListingFormData['base_listing']>) => {
    setFormData(prev => ({
      ...prev,
      base_listing: {
        ...prev.base_listing,
        ...updates,
      },
    }));
  };

  const updateMarketplaceCustomization = (
    marketplace: MarketplaceType,
    updates: Partial<CreateListingInput>
  ) => {
    setFormData(prev => ({
      ...prev,
      marketplace_customizations: {
        ...prev.marketplace_customizations,
        [marketplace]: {
          ...prev.marketplace_customizations[marketplace],
          ...updates,
        },
      },
    }));
  };

  const addMarketplace = (marketplace: MarketplaceType) => {
    setFormData(prev => ({
      ...prev,
      marketplaces: [...prev.marketplaces, marketplace],
    }));
  };

  const removeMarketplace = (marketplace: MarketplaceType) => {
    setFormData(prev => ({
      ...prev,
      marketplaces: prev.marketplaces.filter(mp => mp !== marketplace),
      marketplace_customizations: Object.fromEntries(
        Object.entries(prev.marketplace_customizations).filter(([key]) => key !== marketplace)
      ) as any,
    } as any));
  };

  const resetForm = () => {
    setFormData({
      inventory_item_id: '',
      marketplaces: [],
      base_listing: {
        title: '',
        description: '',
        listing_price: 0,
        currency: 'USD',
        quantity_available: 1,
        photo_urls: [],
        tags: [],
      },
      marketplace_customizations: {} as any,
      pricing_strategy: 'fixed',
      auto_relist: false,
    });
  };

  const validation = CrossListingService.validateCrossListingForm(formData);

  return {
    formData,
    setFormData,
    updateFormData,
    updateBaseListing,
    updateMarketplaceCustomization,
    addMarketplace,
    removeMarketplace,
    resetForm,
    validation,
    isValid: validation.isValid,
  };
}

/**
 * Hook for pricing strategy calculations
 */
export function usePricingStrategy(
  basePrice: number,
  strategy: 'fixed' | 'percentage_markup' | 'marketplace_specific',
  markupPercentage?: number,
  marketplaceSpecificPrices?: Record<MarketplaceType, number>
) {
  return useMemo(() => {
    return CrossListingService.applyPricingStrategy(
      basePrice,
      strategy,
      markupPercentage,
      marketplaceSpecificPrices
    );
  }, [basePrice, strategy, markupPercentage, marketplaceSpecificPrices]);
}

/**
 * Hook for batch cross-listing operations
 */
export function useBatchCrossListing() {
  const queryClient = useQueryClient();

  const submitBatch = useMutation({
    mutationFn: async (batchData: Array<{ itemId: string; formData: CrossListingFormData }>) => {
      const results = await Promise.allSettled(
        batchData.map(({ formData }) => CrossListingService.submitCrossListing(formData))
      );

      return results.map((result, index) => ({
        itemId: batchData[index].itemId,
        result: result.status === 'fulfilled' ? result.value : { success: false, error: 'Submission failed' },
      }));
    },
    onSuccess: () => {
      // Invalidate relevant queries after batch operation
      queryClient.invalidateQueries({ queryKey: crossListingKeys.inventoryItems() });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  return {
    submitBatch: submitBatch.mutate,
    isSubmitting: submitBatch.isPending,
    error: submitBatch.error,
  };
}

/**
 * Hook for marketplace-specific form suggestions
 */
export function useMarketplaceSuggestions(
  inventoryItem: InventoryItemRecord | null,
  availableMarketplaces: MarketplaceType[]
) {
  return useMemo(() => {
    if (!inventoryItem) return [];

    const suggestions: Array<{
      marketplace: MarketplaceType;
      reason: string;
      confidence: 'high' | 'medium' | 'low';
    }> = [];

    // Fashion items -> Poshmark
    if (inventoryItem.category?.toLowerCase().includes('clothing') ||
        inventoryItem.category?.toLowerCase().includes('fashion') ||
        inventoryItem.brand) {
      if (availableMarketplaces.includes('poshmark')) {
        suggestions.push({
          marketplace: 'poshmark',
          reason: 'Great for fashion and branded items',
          confidence: 'high',
        });
      }
    }

    // Electronics -> eBay
    if (inventoryItem.category?.toLowerCase().includes('electronics') ||
        inventoryItem.category?.toLowerCase().includes('tech')) {
      if (availableMarketplaces.includes('ebay')) {
        suggestions.push({
          marketplace: 'ebay',
          reason: 'Large audience for electronics',
          confidence: 'high',
        });
      }
    }

    // Local items -> Facebook Marketplace
    if (inventoryItem.category?.toLowerCase().includes('furniture') ||
        inventoryItem.category?.toLowerCase().includes('home') ||
        inventoryItem.target_price && inventoryItem.target_price < 50) {
      if (availableMarketplaces.includes('facebook_marketplace')) {
        suggestions.push({
          marketplace: 'facebook_marketplace',
          reason: 'Good for local sales and lower-priced items',
          confidence: 'medium',
        });
      }
    }

    // Always suggest eBay for general items
    if (availableMarketplaces.includes('ebay') &&
        !suggestions.find(s => s.marketplace === 'ebay')) {
      suggestions.push({
        marketplace: 'ebay',
        reason: 'Largest marketplace with global reach',
        confidence: 'medium',
      });
    }

    return suggestions;
  }, [inventoryItem, availableMarketplaces]);
}