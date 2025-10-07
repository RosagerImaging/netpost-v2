/**
 * Cross-Listing Service
 *
 * Handles cross-listing operations, form generation, and marketplace validation
 */

import { supabase } from '../supabase/client';
import { getMarketplaceConfig, validateMarketplaceRequirements } from '../marketplaces';
import type {
  CreateListingInput,
  MarketplaceType,
} from '@netpost/shared-types';
import type { InventoryItemRecord } from '@netpost/shared-types';
import type { MarketplaceConnectionSafe } from '@netpost/shared-types';

// Cross-listing specific types
export interface CrossListingFormData {
  inventory_item_id: string;
  marketplaces: MarketplaceType[];
  base_listing: {
    title: string;
    description: string;
    listing_price: number;
    original_price?: number;
    currency: string;
    quantity_available: number;
    condition_description?: string;
    photo_urls: string[];
    tags: string[];
  };
  marketplace_customizations: Record<MarketplaceType, Partial<CreateListingInput>>;
  pricing_strategy: 'fixed' | 'percentage_markup' | 'marketplace_specific';
  markup_percentage?: number;
  auto_relist: boolean;
  listing_duration?: number;
}

export interface CrossListingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  marketplaceErrors: Record<MarketplaceType, string[]>;
}

export interface CrossListingPreview {
  marketplace: MarketplaceType;
  listing_data: CreateListingInput;
  estimated_fees: {
    listing_fee: number;
    final_value_fee: number;
    total_fees: number;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface CrossListingSubmissionResult {
  success: boolean;
  cross_post_group_id?: string;
  submitted_listings: Array<{
    marketplace: MarketplaceType;
    status: 'queued' | 'failed';
    listing_id?: string;
    error?: string;
  }>;
  error?: string;
}

/**
 * Cross-Listing Service
 * Manages cross-listing operations and form data
 */
export class CrossListingService {
  /**
   * Get inventory items available for cross-listing
   */
  static async getAvailableInventoryItems(
    searchQuery?: string,
    limit = 20,
    cursor?: string
  ): Promise<{
    success: boolean;
    data?: {
      items: InventoryItemRecord[];
      total: number;
      hasMore: boolean;
      nextCursor?: string;
    };
    error?: string;
  }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('inventory_items')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .in('status', ['ready', 'draft', 'active']); // Only items that can be listed

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
      }

      query = query.order('updated_at', { ascending: false });

      if (cursor) {
        query = query.lt('updated_at', cursor);
      }

      query = query.limit(limit + 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const items = data || [];
      const hasMore = items.length > limit;
      const resultItems = hasMore ? items.slice(0, -1) : items;
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].updated_at
        : undefined;

      return {
        success: true,
        data: {
          items: resultItems,
          total: count || 0,
          hasMore,
          nextCursor,
        },
      };
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get active marketplace connections for cross-listing
   */
  static async getActiveMarketplaceConnections(): Promise<{
    success: boolean;
    data?: MarketplaceConnectionSafe[];
    error?: string;
  }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('marketplace_connections_safe')
        .select('*')
        .eq('user_id', user.id)
        .eq('connection_status', 'active')
        .is('deleted_at', null)
        .order('marketplace_type');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching marketplace connections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate default cross-listing form data from inventory item
   */
  static generateDefaultFormData(
    inventoryItem: InventoryItemRecord,
    _availableMarketplaces: MarketplaceType[]
  ): CrossListingFormData {
    return {
      inventory_item_id: inventoryItem.id,
      marketplaces: [], // User will select
      base_listing: {
        title: inventoryItem.title,
        description: inventoryItem.description || '',
        listing_price: inventoryItem.target_price || 0,
        original_price: inventoryItem.purchase_price || inventoryItem.estimated_value || 0,
        currency: 'USD',
        quantity_available: inventoryItem.quantity,
        condition_description: inventoryItem.condition_notes || undefined,
        photo_urls: inventoryItem.photos?.map(photo => photo.url) || [],
        tags: inventoryItem.tags || [],
      },
      marketplace_customizations: {} as Record<MarketplaceType, Partial<CreateListingInput>>,
      pricing_strategy: 'fixed',
      auto_relist: false,
    };
  }

  /**
   * Apply pricing strategy to generate marketplace-specific prices
   */
  static applyPricingStrategy(
    basePrice: number,
    strategy: 'fixed' | 'percentage_markup' | 'marketplace_specific',
    markupPercentage?: number,
    marketplaceSpecificPrices?: Record<MarketplaceType, number>
  ): Record<MarketplaceType, number> {
    const prices: Record<MarketplaceType, number> = {} as Record<MarketplaceType, number>;

    if (strategy === 'fixed') {
      // Use same price for all marketplaces
      return Object.fromEntries(
        ['ebay', 'poshmark', 'facebook_marketplace'].map(mp => [mp, basePrice])
      ) as Record<MarketplaceType, number>;
    }

    if (strategy === 'percentage_markup' && markupPercentage) {
      const multiplier = 1 + (markupPercentage / 100);
      return Object.fromEntries(
        ['ebay', 'poshmark', 'facebook_marketplace'].map(mp => [mp, basePrice * multiplier])
      ) as Record<MarketplaceType, number>;
    }

    if (strategy === 'marketplace_specific' && marketplaceSpecificPrices) {
      return marketplaceSpecificPrices;
    }

    return prices;
  }

  /**
   * Validate cross-listing form data
   */
  static validateCrossListingForm(formData: CrossListingFormData): CrossListingValidation {
    const validation: CrossListingValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      marketplaceErrors: {} as Record<MarketplaceType, string[]>,
    };

    // Basic validation
    if (!formData.base_listing.title.trim()) {
      validation.errors.push('Title is required');
    }

    if (!formData.base_listing.description.trim()) {
      validation.errors.push('Description is required');
    }

    if (formData.base_listing.listing_price <= 0) {
      validation.errors.push('Price must be greater than 0');
    }

    if (formData.marketplaces.length === 0) {
      validation.errors.push('At least one marketplace must be selected');
    }

    if (formData.base_listing.photo_urls.length === 0) {
      validation.warnings.push('No photos selected - listings perform better with photos');
    }

    // Marketplace-specific validation
    formData.marketplaces.forEach(marketplace => {
      const config = getMarketplaceConfig(marketplace);
      if (!config) {
        validation.marketplaceErrors[marketplace] = ['Marketplace not supported'];
        return;
      }

      // Get listing data for this marketplace
      const listingData = this.generateMarketplaceListingData(formData, marketplace);
      const marketplaceValidation = validateMarketplaceRequirements(marketplace, listingData);

      if (!marketplaceValidation.valid) {
        validation.marketplaceErrors[marketplace] = marketplaceValidation.errors;
      }

      // Photo count validation
      if (formData.base_listing.photo_urls.length > config.max_photos) {
        if (!validation.marketplaceErrors[marketplace]) {
          validation.marketplaceErrors[marketplace] = [];
        }
        validation.marketplaceErrors[marketplace].push(
          `Maximum ${config.max_photos} photos allowed for ${config.name}`
        );
      }
    });

    // Check if any marketplace has errors
    const hasMarketplaceErrors = Object.keys(validation.marketplaceErrors).length > 0;
    validation.isValid = validation.errors.length === 0 && !hasMarketplaceErrors;

    return validation;
  }

  /**
   * Generate marketplace-specific listing data
   */
  static generateMarketplaceListingData(
    formData: CrossListingFormData,
    marketplace: MarketplaceType
  ): CreateListingInput {
    const baseData: CreateListingInput = {
      inventory_item_id: formData.inventory_item_id,
      marketplace_type: marketplace,
      title: formData.base_listing.title,
      description: formData.base_listing.description,
      listing_price: formData.base_listing.listing_price,
      original_price: formData.base_listing.original_price,
      currency: formData.base_listing.currency,
      quantity_available: formData.base_listing.quantity_available,
      condition_description: formData.base_listing.condition_description,
      photo_urls: formData.base_listing.photo_urls,
      tags: formData.base_listing.tags,
      auto_relist: formData.auto_relist,
      listing_duration: formData.listing_duration,
    };

    // Apply marketplace customizations
    const customizations = formData.marketplace_customizations[marketplace] || {};
    const mergedData = { ...baseData, ...customizations };

    // Apply marketplace-specific defaults
    const config = getMarketplaceConfig(marketplace);
    if (config) {
      // Set default listing format
      if (!mergedData.listing_format) {
        mergedData.listing_format = config.supports_auction ? 'auction' : 'fixed_price';
      }

      // Set default shipping method
      if (!mergedData.shipping_method) {
        mergedData.shipping_method = 'calculated';
      }

      // Set default handling time
      if (!mergedData.handling_time) {
        mergedData.handling_time = 1;
      }
    }

    return mergedData;
  }

  /**
   * Generate cross-listing preview for all selected marketplaces
   */
  static async generateCrossListingPreview(
    formData: CrossListingFormData
  ): Promise<{
    success: boolean;
    data?: CrossListingPreview[];
    error?: string;
  }> {
    try {
      const previews: CrossListingPreview[] = [];

      for (const marketplace of formData.marketplaces) {
        const listingData = this.generateMarketplaceListingData(formData, marketplace);
        const _config = getMarketplaceConfig(marketplace);

        // Estimate fees (simplified calculation)
        const estimatedFees = this.estimateMarketplaceFees(marketplace, listingData.listing_price);

        // Validate listing data
        const validation = validateMarketplaceRequirements(marketplace, listingData);

        previews.push({
          marketplace,
          listing_data: listingData,
          estimated_fees: estimatedFees,
          validation: {
            isValid: validation.valid,
            errors: validation.errors,
            warnings: [],
          },
        });
      }

      return { success: true, data: previews };
    } catch (error) {
      console.error('Error generating cross-listing preview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit cross-listing for processing
   */
  static async submitCrossListing(
    formData: CrossListingFormData
  ): Promise<CrossListingSubmissionResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', submitted_listings: [] };
      }

      // Validate form data
      const validation = this.validateCrossListingForm(formData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          submitted_listings: []
        };
      }

      // Import job queue (dynamic to avoid circular imports)
      const { listingJobQueue } = await import('./listing-job-queue');

      // Generate unique group ID for cross-posted listings
      const crossPostGroupId = `cross_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Process each marketplace
      const listingPromises = formData.marketplaces.map(async (marketplace) => {
        const listingData = this.generateMarketplaceListingData(formData, marketplace);
        listingData.cross_post_group_id = crossPostGroupId;

        try {
          // Create listing record in database first
          const { data, error } = await supabase
            .from('listings')
            .insert([{
              ...listingData,
              user_id: user.id,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

          if (error) {
            throw error;
          }

          // Enqueue job for async processing
          const jobId = await listingJobQueue.enqueueJob(
            user.id,
            formData.inventory_item_id,
            marketplace,
            listingData,
            5 // Default priority
          );

          return {
            marketplace,
            status: 'queued' as const,
            listing_id: data.id,
            job_id: jobId,
          };
        } catch (error) {
          console.error(`Error queuing listing for ${marketplace}:`, error);
          return {
            marketplace,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const submittedListings = await Promise.all(listingPromises);

      // Update inventory item status
      await supabase
        .from('inventory_items')
        .update({
          status: 'listed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.inventory_item_id);

      // Log cross-listing activity
      await this.logCrossListingActivity(user.id, {
        action: 'cross_listing_submitted',
        inventory_item_id: formData.inventory_item_id,
        cross_post_group_id: crossPostGroupId,
        marketplaces: formData.marketplaces,
        submitted_listings: submittedListings,
      });

      return {
        success: true,
        cross_post_group_id: crossPostGroupId,
        submitted_listings: submittedListings,
      };
    } catch (error) {
      console.error('Error submitting cross-listing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        submitted_listings: []
      };
    }
  }

  /**
   * Estimate marketplace fees (simplified calculation)
   */
  private static estimateMarketplaceFees(
    marketplace: MarketplaceType,
    price: number
  ): { listing_fee: number; final_value_fee: number; total_fees: number } {
    // Simplified fee calculations - in production, these would be more accurate
    const feeStructures: Record<MarketplaceType, { listing: number; finalValue: number }> = {
      ebay: { listing: 0.35, finalValue: 0.129 }, // 12.9% final value fee
      poshmark: { listing: 0, finalValue: 0.20 }, // 20% commission
      facebook_marketplace: { listing: 0, finalValue: 0.05 }, // 5% for shipped items
      mercari: { listing: 0, finalValue: 0.10 }, // 10% selling fee
      depop: { listing: 0, finalValue: 0.10 }, // 10% fee
      vinted: { listing: 0, finalValue: 0 }, // No seller fees
      grailed: { listing: 0, finalValue: 0.06 }, // 6% + payment processing
      the_realreal: { listing: 0, finalValue: 0.15 }, // Variable commission
      vestiaire_collective: { listing: 0, finalValue: 0.187 }, // 18.7% commission
      tradesy: { listing: 0, finalValue: 0.199 }, // 19.9% commission
      etsy: { listing: 0.20, finalValue: 0.065 }, // $0.20 listing + 6.5% transaction
      amazon: { listing: 0.99, finalValue: 0.15 }, // Variable by category
      shopify: { listing: 0, finalValue: 0.029 }, // 2.9% + 30¢ payment processing
      custom: { listing: 0, finalValue: 0 },
    };

    const fees = feeStructures[marketplace] || { listing: 0, finalValue: 0 };
    const listingFee = fees.listing;
    const finalValueFee = price * fees.finalValue;
    const totalFees = listingFee + finalValueFee;

    return {
      listing_fee: listingFee,
      final_value_fee: finalValueFee,
      total_fees: totalFees,
    };
  }

  /**
   * Log cross-listing activity for audit trail
   */
  private static async logCrossListingActivity(userId: string, activity: Record<string, unknown>): Promise<void> {
    try {
      const activityLog = {
        user_id: userId,
        timestamp: new Date().toISOString(),
        source: 'cross_listing_service',
        ...activity,
      };

      // Store in localStorage for demo (would be database in production)
      const activities = JSON.parse(localStorage.getItem('activity_logs') || '[]');
      activities.push(activityLog);

      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }

      localStorage.setItem('activity_logs', JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to log cross-listing activity:', error);
    }
  }
}