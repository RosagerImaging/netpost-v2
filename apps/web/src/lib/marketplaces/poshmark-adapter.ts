/**
 * Poshmark Marketplace Adapter
 *
 * Implements Poshmark API integration for fashion-focused listings
 * Uses API key authentication with fashion-specific features
 */

import {
  BaseMarketplaceAdapter,
  type AuthFlow,
  type ListingCreationResult,
  type RateLimit,
  type EndListingOptions,
  type EndListingResult,
  MarketplaceApiError,
  AuthenticationError,
} from './base-adapter';
import type {
  CreateListingInput,
  UpdateListingInput,
  ListingRecord,
  MarketplaceType,
  ListingStatus,
} from '@netpost/shared-types/database/listing';
import type {
  OAuth2Credentials,
  ApiKeyCredentials,
  HealthCheckResult,
} from '@netpost/shared-types/database/marketplace-connection';

// Poshmark specific types
interface PoshmarkBrand {
  id: string;
  name: string;
  verified: boolean;
}

interface PoshmarkCategory {
  id: string;
  name: string;
  parent_id?: string;
  size_chart?: string;
  subcategories?: PoshmarkCategory[];
}

interface PoshmarkSize {
  id: string;
  name: string;
  category_id: string;
}

interface PoshmarkListingResponse {
  listing_id: string;
  listing_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  listing_fee?: number;
  commission_rate?: number;
}

interface PoshmarkError {
  error_code: string;
  error_message: string;
  details?: Record<string, any>;
}

/**
 * Poshmark API Adapter
 * Specialized for fashion marketplace with brand and size focus
 */
export class PoshmarkAdapter extends BaseMarketplaceAdapter {
  private readonly POSHMARK_API_BASE = 'https://api.poshmark.com';
  private readonly POSHMARK_OAUTH_BASE = 'https://api.poshmark.com/oauth2';

  getMarketplaceType(): MarketplaceType {
    return 'poshmark';
  }

  getRateLimit(): RateLimit {
    return {
      requests_per_hour: 1000,
      requests_per_minute: 60,
      requests_per_day: 10000,
      burst_limit: 10,
    };
  }

  protected getDefaultApiBaseUrl(): string {
    return this.POSHMARK_API_BASE;
  }

  protected getDefaultApiVersion(): string {
    return 'v1';
  }

  /**
   * Initiate OAuth 2.0 flow for Poshmark authentication
   */
  async initiateOAuthFlow(callbackUrl: string): Promise<AuthFlow> {
    const clientId = this.getClientId();
    const scopes = [
      'closet:read',
      'closet:write',
      'listings:read',
      'listings:write',
      'profile:read',
    ].join(' ');

    const state = this.generateState();
    const authUrl = new URL(`${this.POSHMARK_OAUTH_BASE}/authorize`);

    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    return {
      authorization_url: authUrl.toString(),
      state,
      callback_url: callbackUrl,
    };
  }

  /**
   * Complete OAuth flow
   */
  async completeOAuthFlow(code: string, state: string): Promise<OAuth2Credentials> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    const response = await fetch(`${this.POSHMARK_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: this.connection.callback_url || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AuthenticationError(
        'poshmark',
        `OAuth flow failed: ${error.error_description || error.error}`
      );
    }

    const tokenData = await response.json();

    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    };
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(refreshToken: string): Promise<OAuth2Credentials> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    const response = await fetch(`${this.POSHMARK_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AuthenticationError(
        'poshmark',
        `Token refresh failed: ${error.error_description || error.error}`
      );
    }

    const tokenData = await response.json();

    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      refresh_token: tokenData.refresh_token || refreshToken,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    };
  }

  /**
   * Validate credentials
   */
  async validateCredentials(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      await this.checkRateLimit();

      const response = await this.makeApiRequest('user/profile');
      const responseTime = Date.now() - startTime;

      if (response.success) {
        return {
          success: true,
          status: 'active',
          response_time_ms: responseTime,
        };
      } else {
        return {
          success: false,
          status: 'error',
          response_time_ms: responseTime,
          error_message: response.error || 'Unknown error',
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof AuthenticationError) {
        return {
          success: false,
          status: 'expired',
          response_time_ms: responseTime,
          error_message: error.message,
        };
      }

      return {
        success: false,
        status: 'error',
        response_time_ms: responseTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a new listing on Poshmark
   */
  async createListing(listing: CreateListingInput): Promise<ListingCreationResult> {
    await this.checkRateLimit();

    this.validateRequiredFields(listing, [
      'title',
      'description',
      'listing_price',
      'marketplace_category',
    ]);

    // Validate fashion-specific requirements
    this.validateFashionRequirements(listing);

    const listingData = await this.buildPoshmarkListingData(listing);

    try {
      const response = await this.makeApiRequest(
        'listings',
        'POST',
        listingData
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `Poshmark listing creation failed: ${response.error}`,
          'poshmark',
          response.status
        );
      }

      const poshmarkResponse = response.data as PoshmarkListingResponse;

      return {
        external_listing_id: poshmarkResponse.listing_id,
        external_url: poshmarkResponse.listing_url,
        status: this.mapPoshmarkStatusToListingStatus(poshmarkResponse.status),
        marketplace_data: {
          created_at: poshmarkResponse.created_at,
          updated_at: poshmarkResponse.updated_at,
        },
        fees: {
          listing_fee: poshmarkResponse.listing_fee || 0,
          final_value_fee: (listing.listing_price * (poshmarkResponse.commission_rate || 0.2)),
          total_fees: (poshmarkResponse.listing_fee || 0) +
                     (listing.listing_price * (poshmarkResponse.commission_rate || 0.2)),
        },
      };
    } catch (error) {
      this.log('error', 'Poshmark listing creation failed', { error: error instanceof Error ? error.message : 'Unknown error', listing });
      throw error;
    }
  }

  /**
   * Update an existing Poshmark listing
   */
  async updateListing(externalId: string, updates: UpdateListingInput): Promise<ListingCreationResult> {
    await this.checkRateLimit();

    const updateData = this.buildPoshmarkUpdateData(updates);

    try {
      const response = await this.makeApiRequest(
        `listings/${externalId}`,
        'PUT',
        updateData
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `Poshmark listing update failed: ${response.error}`,
          'poshmark',
          response.status
        );
      }

      const poshmarkResponse = response.data as PoshmarkListingResponse;

      return {
        external_listing_id: externalId,
        external_url: poshmarkResponse.listing_url,
        status: this.mapPoshmarkStatusToListingStatus(poshmarkResponse.status),
        marketplace_data: poshmarkResponse,
      };
    } catch (error) {
      this.log('error', 'Poshmark listing update failed', { error: error instanceof Error ? error.message : 'Unknown error', externalId, updates });
      throw error;
    }
  }

  /**
   * Delete/end a Poshmark listing
   */
  async deleteListing(externalId: string): Promise<boolean> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(
        `listings/${externalId}`,
        'DELETE'
      );

      if (response.success) {
        this.log('info', 'Poshmark listing deleted successfully', { externalId });
        return true;
      } else {
        this.log('warn', 'Poshmark listing deletion failed', { externalId, error: response.error });
        return false;
      }
    } catch (error) {
      this.log('error', 'Poshmark listing deletion error', { error: error instanceof Error ? error.message : 'Unknown error', externalId });
      throw error;
    }
  }

  /**
   * Get listing details from Poshmark
   */
  async getListing(externalId: string): Promise<ListingRecord | null> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(`listings/${externalId}`);

      if (!response.success) {
        if (response.status === 404) {
          return null;
        }
        throw new MarketplaceApiError(
          `Failed to fetch Poshmark listing: ${response.error}`,
          'poshmark',
          response.status
        );
      }

      return this.mapPoshmarkDataToListingRecord(response.data);
    } catch (error) {
      this.log('error', 'Error fetching Poshmark listing', { error: error instanceof Error ? error.message : 'Unknown error', externalId });
      throw error;
    }
  }

  /**
   * Get listing status
   */
  async getListingStatus(externalId: string): Promise<ListingStatus> {
    const listing = await this.getListing(externalId);
    return listing?.status || 'ended';
  }

  /**
   * Get Poshmark categories (fashion-focused)
   */
  async getCategories(): Promise<Array<{ id: string; name: string; parent_id?: string }>> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest('categories');

      if (!response.success) {
        throw new MarketplaceApiError(
          `Failed to fetch Poshmark categories: ${response.error}`,
          'poshmark',
          response.status
        );
      }

      return this.mapPoshmarkCategories(response.data.categories);
    } catch (error) {
      this.log('error', 'Error fetching Poshmark categories', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Suggest category for fashion items
   */
  async suggestCategory(title: string, description: string): Promise<string | null> {
    // Poshmark has AI-powered category suggestions for fashion items
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest('categories/suggest', 'POST', {
        title,
        description,
      });

      if (response.success && response.data.suggested_category) {
        return response.data.suggested_category.id;
      }

      return null;
    } catch (error) {
      this.log('warn', 'Category suggestion failed', { error: error instanceof Error ? error.message : 'Unknown error', title });
      return null;
    }
  }

  /**
   * Get shipping policies (Poshmark uses standard shipping)
   */
  async getShippingPolicies(): Promise<Array<{ id: string; name: string; cost: number }>> {
    // Poshmark has standardized shipping options
    return [
      {
        id: 'standard',
        name: 'Poshmark Standard Shipping',
        cost: 7.45, // Standard Poshmark shipping cost
      },
      {
        id: 'expedited',
        name: 'Expedited Shipping',
        cost: 12.99,
      },
    ];
  }

  /**
   * Get return policies
   */
  async getReturnPolicies(): Promise<Array<{ id: string; name: string; days: number }>> {
    // Poshmark has standard return policies
    return [
      {
        id: 'standard',
        name: 'Poshmark Protection',
        days: 3, // 3 days to accept or return
      },
    ];
  }

  /**
   * Upload photo to Poshmark
   */
  async uploadPhoto(photoUrl: string, listingId?: string): Promise<string> {
    await this.checkRateLimit();

    try {
      const { blob, filename } = await this.downloadAndProcessPhoto(photoUrl);

      // Poshmark has specific photo requirements
      const processedBlob = await this.processPoshmarkPhoto(blob);

      const formData = new FormData();
      formData.append('photo', processedBlob, filename);
      if (listingId) {
        formData.append('listing_id', listingId);
      }

      const response = await fetch(
        `${this.buildApiUrl('photos')}`,
        {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: formData,
        }
      );

      if (!response.ok) {
        throw new MarketplaceApiError(
          `Photo upload failed: ${response.statusText}`,
          'poshmark',
          response.status
        );
      }

      const data = await response.json();
      return data.photo_url;
    } catch (error) {
      this.log('error', 'Poshmark photo upload failed', { error: error instanceof Error ? error.message : 'Unknown error', photoUrl });
      throw error;
    }
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string): Promise<boolean> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(`photos/${photoId}`, 'DELETE');
      return response.success;
    } catch (error) {
      this.log('error', 'Photo deletion failed', { error: error instanceof Error ? error.message : 'Unknown error', photoId });
      return false;
    }
  }

  /**
   * Reorder photos
   */
  async reorderPhotos(photoIds: string[]): Promise<boolean> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest('photos/reorder', 'PUT', {
        photo_order: photoIds,
      });
      return response.success;
    } catch (error) {
      this.log('error', 'Photo reordering failed', { error: error instanceof Error ? error.message : 'Unknown error', photoIds });
      return false;
    }
  }

  /**
   * Search listings
   */
  async searchListings(query: string, limit = 20): Promise<ListingRecord[]> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(
        `search/listings?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `Search failed: ${response.error}`,
          'poshmark',
          response.status
        );
      }

      return response.data.listings?.map((item: any) =>
        this.mapPoshmarkDataToListingRecord(item)
      ) || [];
    } catch (error) {
      this.log('error', 'Poshmark search failed', { error: error instanceof Error ? error.message : 'Unknown error', query });
      throw error;
    }
  }

  /**
   * Get listing analytics
   */
  async getListingAnalytics(externalId: string): Promise<{
    views: number;
    watchers: number;
    questions: number;
    offers?: number;
  }> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(`listings/${externalId}/analytics`);

      if (response.success) {
        const analytics = response.data;
        return {
          views: analytics.views || 0,
          watchers: analytics.likes || 0, // Poshmark uses "likes" instead of watchers
          questions: analytics.comments || 0,
          offers: analytics.offers || 0,
        };
      }

      return { views: 0, watchers: 0, questions: 0, offers: 0 };
    } catch (error) {
      this.log('error', 'Error fetching analytics', { error: error instanceof Error ? error.message : 'Unknown error', externalId });
      return { views: 0, watchers: 0, questions: 0, offers: 0 };
    }
  }

  // Delisting operations
  async endListing(externalId: string, options?: EndListingOptions): Promise<EndListingResult> {
    try {
      console.log(`Ending Poshmark listing: ${externalId}`);
      
      // Poshmark API doesn't have a direct "end listing" endpoint
      // Instead, we mark it as "not for sale" or delete it
      const response = await this.makeApiRequest(
        `closets/listings/${externalId}`,
        'DELETE'
      );

      if (!response.success) {
        // Try alternative approach - mark as unavailable
        const updateResponse = await this.makeApiRequest(
          `closets/listings/${externalId}`,
          'PUT',
          {
            status: 'unavailable',
            ...(options?.reason && { notes: options.reason })
          }
        );

        if (!updateResponse.success) {
          return {
            success: false,
            error: response.error || 'Failed to end Poshmark listing',
          };
        }

        return {
          success: true,
          ended_at: new Date().toISOString(),
          external_response: updateResponse.data,
        };
      }

      return {
        success: true,
        ended_at: new Date().toISOString(),
        external_response: response.data,
      };

    } catch (error) {
      console.error(`Error ending Poshmark listing ${externalId}:`, error);
      
      if (error instanceof Error && error.message?.includes('not found')) {
        throw new MarketplaceApiError(
          'Listing not found on Poshmark',
          'poshmark',
          404,
          'LISTING_NOT_FOUND'
        );
      }

      return {
        success: false,
        error: `Poshmark API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getListingById(externalId: string): Promise<ListingRecord> {
    try {
      console.log(`Getting Poshmark listing: ${externalId}`);

      const response = await this.makeApiRequest(
        `closets/listings/${externalId}`,
        'GET'
      );

      if (!response.success || !response.data) {
        throw new MarketplaceApiError(
          `Poshmark listing not found: ${externalId}`,
          'poshmark',
          404,
          'LISTING_NOT_FOUND'
        );
      }

      return this.mapPoshmarkDataToListingRecord(response.data);

    } catch (error) {
      console.error(`Error getting Poshmark listing ${externalId}:`, error);
      throw error;
    }
  }

  // Private helper methods
  private getClientId(): string {
    const credentials = this.credentials as OAuth2Credentials;
    return credentials.client_id || process.env.POSHMARK_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    const credentials = this.credentials as OAuth2Credentials;
    return credentials.client_secret || process.env.POSHMARK_CLIENT_SECRET || '';
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private validateFashionRequirements(listing: CreateListingInput): void {
    const errors: string[] = [];

    // Poshmark requires brand for most categories
    if (!listing.marketplace_attributes?.brand) {
      errors.push('Brand is required for Poshmark listings');
    }

    // Size is often required for clothing
    if (!listing.marketplace_attributes?.size && this.isSizeRequiredCategory(listing.marketplace_category)) {
      errors.push('Size is required for this category');
    }

    // Photo requirements
    if (!listing.photo_urls || listing.photo_urls.length < 1) {
      errors.push('At least 1 photo is required');
    }

    if (listing.photo_urls && listing.photo_urls.length > 16) {
      errors.push('Maximum 16 photos allowed');
    }

    if (errors.length > 0) {
      throw new MarketplaceApiError(
        `Validation failed: ${errors.join(', ')}`,
        'poshmark',
        400,
        'VALIDATION_ERROR'
      );
    }
  }

  private isSizeRequiredCategory(category?: string): boolean {
    const sizeRequiredCategories = [
      'women-clothing',
      'men-clothing',
      'kids-clothing',
      'shoes',
    ];

    return category ? sizeRequiredCategories.some(cat => category.includes(cat)) : false;
  }

  private async buildPoshmarkListingData(listing: CreateListingInput): Promise<any> {
    return {
      title: listing.title,
      description: listing.description,
      price: listing.listing_price,
      original_price: listing.original_price,
      category_id: listing.marketplace_category,
      brand: listing.marketplace_attributes?.brand || '',
      size: listing.marketplace_attributes?.size || '',
      color: listing.marketplace_attributes?.color || '',
      condition: this.mapConditionToPoshmark(listing.marketplace_attributes?.condition),
      photos: listing.photo_urls || [],
      tags: listing.tags || [],
      shipping_cost: listing.shipping_cost || 7.45, // Default Poshmark shipping
    };
  }

  private buildPoshmarkUpdateData(updates: UpdateListingInput): any {
    const updateData: any = {};

    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.listing_price) updateData.price = updates.listing_price;
    if (updates.photo_urls) updateData.photos = updates.photo_urls;
    if (updates.tags) updateData.tags = updates.tags;

    return updateData;
  }

  private mapConditionToPoshmark(condition?: string): string {
    const conditionMap: Record<string, string> = {
      'new': 'NWT', // New with tags
      'like_new': 'NWOT', // New without tags
      'excellent': 'EUC', // Excellent used condition
      'good': 'GUC', // Good used condition
      'fair': 'Fair',
      'poor': 'Poor',
    };

    return conditionMap[condition || 'good'] || 'GUC';
  }

  private async processPoshmarkPhoto(blob: Blob): Promise<Blob> {
    // Poshmark photo requirements:
    // - JPG or PNG format
    // - Maximum 2MB
    // - Minimum 512x512 pixels
    // - Square format preferred

    if (blob.size > 2 * 1024 * 1024) {
      throw new MarketplaceApiError(
        'Photo size must be under 2MB',
        'poshmark',
        400,
        'PHOTO_TOO_LARGE'
      );
    }

    // In a real implementation, you would use a library like sharp or canvas
    // to resize and optimize the image
    return blob;
  }

  private mapPoshmarkStatusToListingStatus(poshmarkStatus: string): ListingStatus {
    const statusMap: Record<string, ListingStatus> = {
      'active': 'active',
      'sold': 'sold',
      'not_for_sale': 'paused',
      'draft': 'draft',
      'deleted': 'deleted',
    };

    return statusMap[poshmarkStatus] || 'active';
  }

  private mapPoshmarkDataToListingRecord(poshmarkData: any): ListingRecord {
    return {
      id: '', // Internal ID
      user_id: this.connection.user_id,
      inventory_item_id: '', // Mapped from our system
      marketplace_type: 'poshmark',
      external_listing_id: poshmarkData.id || poshmarkData.listing_id,
      external_url: poshmarkData.url || poshmarkData.listing_url,
      title: poshmarkData.title,
      description: poshmarkData.description,
      listing_format: 'fixed_price',
      listing_price: parseFloat(poshmarkData.price || '0'),
      currency: 'USD',
      status: this.mapPoshmarkStatusToListingStatus(poshmarkData.status),
      photo_urls: poshmarkData.photos || [],
      tags: poshmarkData.tags || [],
      marketplace_attributes: {
        brand: poshmarkData.brand,
        size: poshmarkData.size,
        color: poshmarkData.color,
        condition: poshmarkData.condition,
      },
      created_at: poshmarkData.created_at || new Date().toISOString(),
      updated_at: poshmarkData.updated_at || new Date().toISOString(),
      // ... map other fields as needed
    } as unknown as ListingRecord;
  }

  private mapPoshmarkCategories(categories: PoshmarkCategory[]): Array<{ id: string; name: string; parent_id?: string }> {
    const result: Array<{ id: string; name: string; parent_id?: string }> = [];

    function traverse(cats: PoshmarkCategory[], parentId?: string) {
      cats.forEach(cat => {
        result.push({
          id: cat.id,
          name: cat.name,
          parent_id: parentId,
        });

        if (cat.subcategories) {
          traverse(cat.subcategories, cat.id);
        }
      });
    }

    traverse(categories);
    return result;
  }
}