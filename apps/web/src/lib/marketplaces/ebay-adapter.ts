/**
 * eBay Marketplace Adapter
 *
 * Implements eBay Trading API integration for listing management
 * Uses OAuth 2.0 for authentication and supports both sandbox and production environments
 */

import {
  BaseMarketplaceAdapter,
  type AuthFlow,
  type ListingCreationResult,
  type RateLimit,
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
  HealthCheckResult,
} from '@netpost/shared-types/database/marketplace-connection';

// eBay specific types
interface EBayCategory {
  CategoryID: string;
  CategoryName: string;
  CategoryParentID?: string;
  CategoryLevel: number;
  LeafCategory: boolean;
}

interface EBayShippingPolicy {
  ShippingPolicyID: string;
  ShippingPolicyName: string;
  ShippingCost: {
    Value: number;
    Currency: string;
  };
}

interface EBayItemSpecific {
  Name: string;
  Value: string[];
}

interface EBayListingResponse {
  ItemID: string;
  ListingDetails: {
    ViewItemURL: string;
    StartTime: string;
    EndTime: string;
  };
  ListingFees?: {
    Fee: Array<{
      Name: string;
      Value: number;
      Currency: string;
    }>;
  };
}

interface EBayError {
  ErrorCode: string;
  ShortMessage: string;
  LongMessage: string;
  SeverityCode: 'Error' | 'Warning';
}

/**
 * eBay Trading API Adapter
 * Implements the BaseMarketplaceAdapter for eBay integration
 */
export class EBayAdapter extends BaseMarketplaceAdapter {
  private readonly EBAY_OAUTH_BASE = 'https://auth.ebay.com/oauth2';
  private readonly EBAY_API_BASE = 'https://api.ebay.com';
  private readonly EBAY_SANDBOX_API_BASE = 'https://api.sandbox.ebay.com';

  getMarketplaceType(): MarketplaceType {
    return 'ebay';
  }

  getRateLimit(): RateLimit {
    return {
      requests_per_hour: 5000,
      requests_per_minute: 10,
      requests_per_day: 100000,
      burst_limit: 20,
    };
  }

  protected getDefaultApiBaseUrl(): string {
    const isProduction = this.connection.marketplace_metadata?.environment === 'production';
    return isProduction ? this.EBAY_API_BASE : this.EBAY_SANDBOX_API_BASE;
  }

  protected getDefaultApiVersion(): string {
    return 'v1';
  }

  /**
   * Initiate OAuth 2.0 flow for eBay authentication
   */
  async initiateOAuthFlow(callbackUrl: string): Promise<AuthFlow> {
    const clientId = this.getClientId();
    const scopes = [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.marketing',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    ].join(' ');

    const state = this.generateState();
    const authUrl = new URL(`${this.EBAY_OAUTH_BASE}/authorize`);

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
   * Complete OAuth flow by exchanging authorization code for access token
   */
  async completeOAuthFlow(code: string, state: string): Promise<OAuth2Credentials> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    const tokenUrl = `${this.EBAY_OAUTH_BASE}/token`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.connection.callback_url || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AuthenticationError(
        'ebay',
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
   * Refresh OAuth 2.0 access token
   */
  async refreshToken(refreshToken: string): Promise<OAuth2Credentials> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    const tokenUrl = `${this.EBAY_OAUTH_BASE}/token`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AuthenticationError(
        'ebay',
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
   * Validate current credentials and connection health
   */
  async validateCredentials(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      await this.checkRateLimit();

      const response = await this.makeApiRequest('sell/account/v1/privilege');
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
   * Create a new listing on eBay
   */
  async createListing(listing: CreateListingInput): Promise<ListingCreationResult> {
    await this.checkRateLimit();

    this.validateRequiredFields(listing, [
      'title',
      'description',
      'listing_price',
      'marketplace_category',
    ]);

    const listingData = this.buildEBayListingData(listing);

    try {
      const response = await this.makeApiRequest(
        'sell/inventory/v1/inventory_item',
        'POST',
        listingData
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `eBay listing creation failed: ${response.error}`,
          'ebay',
          response.status
        );
      }

      const ebayResponse = response.data as EBayListingResponse;

      // Calculate fees
      const fees = this.calculateFees(ebayResponse.ListingFees);

      return {
        external_listing_id: ebayResponse.ItemID,
        external_url: ebayResponse.ListingDetails.ViewItemURL,
        status: 'active',
        marketplace_data: {
          start_time: ebayResponse.ListingDetails.StartTime,
          end_time: ebayResponse.ListingDetails.EndTime,
        },
        fees,
      };
    } catch (error) {
      this.log('error', 'eBay listing creation failed', { error: error.message, listing });
      throw error;
    }
  }

  /**
   * Update an existing eBay listing
   */
  async updateListing(externalId: string, updates: UpdateListingInput): Promise<ListingCreationResult> {
    await this.checkRateLimit();

    const updateData = this.buildEBayUpdateData(updates);

    try {
      const response = await this.makeApiRequest(
        `sell/inventory/v1/inventory_item/${externalId}`,
        'PUT',
        updateData
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `eBay listing update failed: ${response.error}`,
          'ebay',
          response.status
        );
      }

      // Get updated listing details
      const listingResponse = await this.makeApiRequest(
        `sell/inventory/v1/inventory_item/${externalId}`
      );

      const ebayData = listingResponse.data;

      return {
        external_listing_id: externalId,
        external_url: ebayData.listing?.ViewItemURL || '',
        status: this.mapEBayStatusToListingStatus(ebayData.listing?.ListingStatus),
        marketplace_data: ebayData,
      };
    } catch (error) {
      this.log('error', 'eBay listing update failed', { error: error.message, externalId, updates });
      throw error;
    }
  }

  /**
   * Delete/end an eBay listing
   */
  async deleteListing(externalId: string): Promise<boolean> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(
        `sell/inventory/v1/inventory_item/${externalId}`,
        'DELETE'
      );

      if (response.success) {
        this.log('info', 'eBay listing deleted successfully', { externalId });
        return true;
      } else {
        this.log('warn', 'eBay listing deletion failed', { externalId, error: response.error });
        return false;
      }
    } catch (error) {
      this.log('error', 'eBay listing deletion error', { error: error.message, externalId });
      throw error;
    }
  }

  /**
   * Get listing details from eBay
   */
  async getListing(externalId: string): Promise<ListingRecord | null> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(
        `sell/inventory/v1/inventory_item/${externalId}`
      );

      if (!response.success) {
        if (response.status === 404) {
          return null;
        }
        throw new MarketplaceApiError(
          `Failed to fetch eBay listing: ${response.error}`,
          'ebay',
          response.status
        );
      }

      return this.mapEBayDataToListingRecord(response.data);
    } catch (error) {
      this.log('error', 'Error fetching eBay listing', { error: error.message, externalId });
      throw error;
    }
  }

  /**
   * Get listing status from eBay
   */
  async getListingStatus(externalId: string): Promise<ListingStatus> {
    const listing = await this.getListing(externalId);
    return listing?.status || 'ended';
  }

  /**
   * Get eBay categories
   */
  async getCategories(): Promise<Array<{ id: string; name: string; parent_id?: string }>> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest('commerce/taxonomy/v1/category_tree/0');

      if (!response.success) {
        throw new MarketplaceApiError(
          `Failed to fetch eBay categories: ${response.error}`,
          'ebay',
          response.status
        );
      }

      return this.mapEBayCategories(response.data.rootCategoryNode);
    } catch (error) {
      this.log('error', 'Error fetching eBay categories', { error: error.message });
      throw error;
    }
  }

  /**
   * Suggest category based on title and description
   */
  async suggestCategory(title: string, description: string): Promise<string | null> {
    // eBay doesn't have a direct category suggestion API
    // This would need to be implemented using ML/AI or category mapping logic
    this.log('info', 'Category suggestion requested', { title, description });
    return null;
  }

  /**
   * Get shipping policies
   */
  async getShippingPolicies(): Promise<Array<{ id: string; name: string; cost: number }>> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest('sell/account/v1/fulfillment_policy');

      if (!response.success) {
        throw new MarketplaceApiError(
          `Failed to fetch shipping policies: ${response.error}`,
          'ebay',
          response.status
        );
      }

      return response.data.fulfillmentPolicies?.map((policy: any) => ({
        id: policy.fulfillmentPolicyId,
        name: policy.name,
        cost: policy.shippingOptions?.[0]?.shippingCost?.value || 0,
      })) || [];
    } catch (error) {
      this.log('error', 'Error fetching shipping policies', { error: error.message });
      throw error;
    }
  }

  /**
   * Get return policies
   */
  async getReturnPolicies(): Promise<Array<{ id: string; name: string; days: number }>> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest('sell/account/v1/return_policy');

      if (!response.success) {
        throw new MarketplaceApiError(
          `Failed to fetch return policies: ${response.error}`,
          'ebay',
          response.status
        );
      }

      return response.data.returnPolicies?.map((policy: any) => ({
        id: policy.returnPolicyId,
        name: policy.name,
        days: policy.returnPeriod?.value || 30,
      })) || [];
    } catch (error) {
      this.log('error', 'Error fetching return policies', { error: error.message });
      throw error;
    }
  }

  /**
   * Upload photo to eBay
   */
  async uploadPhoto(photoUrl: string, listingId?: string): Promise<string> {
    await this.checkRateLimit();

    try {
      const { blob, filename } = await this.downloadAndProcessPhoto(photoUrl);

      const formData = new FormData();
      formData.append('image', blob, filename);

      const response = await fetch(
        `${this.buildApiUrl('sell/inventory/v1/picture')}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(this.credentials as OAuth2Credentials).access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new MarketplaceApiError(
          `Photo upload failed: ${response.statusText}`,
          'ebay',
          response.status
        );
      }

      const data = await response.json();
      return data.pictureUrl || data.imageUrl;
    } catch (error) {
      this.log('error', 'eBay photo upload failed', { error: error.message, photoUrl });
      throw error;
    }
  }

  /**
   * Delete photo from eBay
   */
  async deletePhoto(photoId: string): Promise<boolean> {
    // eBay doesn't have a direct photo deletion API
    // Photos are managed as part of listings
    this.log('info', 'Photo deletion requested', { photoId });
    return true;
  }

  /**
   * Reorder photos for a listing
   */
  async reorderPhotos(photoIds: string[]): Promise<boolean> {
    // Photo reordering is handled during listing updates
    this.log('info', 'Photo reordering requested', { photoIds });
    return true;
  }

  /**
   * Search listings
   */
  async searchListings(query: string, limit = 20): Promise<ListingRecord[]> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(
        `sell/inventory/v1/inventory_item?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `Search failed: ${response.error}`,
          'ebay',
          response.status
        );
      }

      return response.data.inventoryItems?.map((item: any) =>
        this.mapEBayDataToListingRecord(item)
      ) || [];
    } catch (error) {
      this.log('error', 'eBay search failed', { error: error.message, query });
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
      const response = await this.makeApiRequest(
        `sell/analytics/v1/seller_standards_profile`
      );

      // eBay's analytics API is complex and may require additional endpoints
      // This is a simplified implementation
      return {
        views: 0,
        watchers: 0,
        questions: 0,
        offers: 0,
      };
    } catch (error) {
      this.log('error', 'Error fetching analytics', { error: error.message, externalId });
      return {
        views: 0,
        watchers: 0,
        questions: 0,
        offers: 0,
      };
    }
  }

  // Delisting operations
  async endListing(externalId: string, options?: EndListingOptions): Promise<EndListingResult> {
    try {
      console.log(`Ending eBay listing: ${externalId}`);
      
      // eBay Trading API EndFixedPriceItem call
      const requestData = {
        ItemID: externalId,
        EndingReason: this.mapEndingReason(options?.cancel_reason || 'not_available'),
        ...(options?.reason && { SellerInventoryNote: options.reason })
      };

      const response = await this.makeApiRequest(
        'trading/EndFixedPriceItem',
        'POST',
        requestData
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to end eBay listing',
        };
      }

      return {
        success: true,
        ended_at: new Date().toISOString(),
        external_response: response.data,
      };

    } catch (error) {
      console.error(`Error ending eBay listing ${externalId}:`, error);
      
      // Handle specific eBay errors
      if (error.message?.includes('ItemNotFound')) {
        throw new MarketplaceApiError(
          'Listing not found on eBay',
          'ebay',
          404,
          'LISTING_NOT_FOUND'
        );
      }
      
      if (error.message?.includes('ItemAlreadyEnded')) {
        throw new MarketplaceApiError(
          'Listing already ended on eBay',
          'ebay',
          400,
          'LISTING_ALREADY_ENDED'
        );
      }

      return {
        success: false,
        error: `eBay API error: ${error.message}`,
      };
    }
  }

  async getListingById(externalId: string): Promise<ListingRecord> {
    try {
      console.log(`Getting eBay listing: ${externalId}`);

      // Use eBay Trading API GetItem call
      const response = await this.makeApiRequest(
        `trading/GetItem`,
        'POST',
        {
          ItemID: externalId,
          DetailLevel: 'ReturnAll',
          IncludeItemSpecifics: true
        }
      );

      if (!response.success || !response.data?.Item) {
        throw new MarketplaceApiError(
          `eBay listing not found: ${externalId}`,
          'ebay',
          404,
          'LISTING_NOT_FOUND'
        );
      }

      const ebayItem = response.data.Item;
      
      return this.mapEBayDataToListingRecord({
        ...ebayItem,
        // Add sale information if sold
        sale_price: ebayItem.SellingStatus?.CurrentPrice?.Value,
        sale_date: ebayItem.SellingStatus?.EndTime,
        marketplace_data: ebayItem
      });

    } catch (error) {
      console.error(`Error getting eBay listing ${externalId}:`, error);
      throw error;
    }
  }

  private mapEndingReason(cancelReason: string): string {
    const reasonMap: Record<string, string> = {
      'not_available': 'NotAvailable',
      'wrong_category': 'Incorrect',
      'description_issue': 'Incorrect', 
      'pricing_error': 'PricingError',
      'sold_elsewhere': 'NotAvailable'
    };

    return reasonMap[cancelReason] || 'NotAvailable';
  }

  // Private helper methods
  private getClientId(): string {
    const credentials = this.credentials as OAuth2Credentials;
    return credentials.client_id || process.env.EBAY_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    const credentials = this.credentials as OAuth2Credentials;
    return credentials.client_secret || process.env.EBAY_CLIENT_SECRET || '';
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private buildEBayListingData(listing: CreateListingInput): any {
    return {
      availability: {
        shipToLocationAvailability: {
          quantity: listing.quantity_available || 1,
        },
      },
      condition: 'USED_GOOD', // Map from listing condition
      conditionDescription: listing.condition_description,
      packageWeightAndSize: {
        // Add weight and dimensions if available
      },
      product: {
        title: listing.title,
        description: listing.description,
        aspects: this.buildItemSpecifics(listing),
        imageUrls: listing.photo_urls || [],
        brand: listing.marketplace_attributes?.brand || '',
      },
    };
  }

  private buildEBayUpdateData(updates: UpdateListingInput): any {
    const updateData: any = {};

    if (updates.title) {
      updateData.product = { ...updateData.product, title: updates.title };
    }

    if (updates.description) {
      updateData.product = { ...updateData.product, description: updates.description };
    }

    if (updates.listing_price) {
      updateData.pricingSummary = {
        price: {
          value: updates.listing_price.toString(),
          currency: updates.currency || 'USD',
        },
      };
    }

    if (updates.quantity_available) {
      updateData.availability = {
        shipToLocationAvailability: {
          quantity: updates.quantity_available,
        },
      };
    }

    return updateData;
  }

  private buildItemSpecifics(listing: CreateListingInput): Record<string, string[]> {
    const specifics: Record<string, string[]> = {};

    if (listing.marketplace_attributes) {
      Object.entries(listing.marketplace_attributes).forEach(([key, value]) => {
        if (typeof value === 'string') {
          specifics[key] = [value];
        } else if (Array.isArray(value)) {
          specifics[key] = value.map(String);
        }
      });
    }

    return specifics;
  }

  private calculateFees(listingFees?: any): {
    listing_fee?: number;
    final_value_fee?: number;
    total_fees?: number;
  } {
    if (!listingFees?.Fee) {
      return {};
    }

    let listingFee = 0;
    let finalValueFee = 0;

    listingFees.Fee.forEach((fee: any) => {
      if (fee.Name === 'ListingFee') {
        listingFee = fee.Value;
      } else if (fee.Name === 'FinalValueFee') {
        finalValueFee = fee.Value;
      }
    });

    return {
      listing_fee: listingFee,
      final_value_fee: finalValueFee,
      total_fees: listingFee + finalValueFee,
    };
  }

  private mapEBayStatusToListingStatus(ebayStatus: string): ListingStatus {
    const statusMap: Record<string, ListingStatus> = {
      'Active': 'active',
      'Ended': 'ended',
      'Sold': 'sold',
      'Cancelled': 'cancelled',
      'Suspended': 'paused',
    };

    return statusMap[ebayStatus] || 'active';
  }

  private mapEBayDataToListingRecord(ebayData: any): ListingRecord {
    // This would map eBay API response to our ListingRecord format
    // Implementation depends on the specific eBay API response structure
    return {
      // Map fields from eBay data to our ListingRecord interface
      id: '', // This would be our internal ID
      user_id: this.connection.user_id,
      inventory_item_id: '', // This would be mapped from our system
      marketplace_type: 'ebay',
      external_listing_id: ebayData.sku || ebayData.itemId,
      external_url: ebayData.listingDetails?.viewItemURL || '',
      title: ebayData.product?.title || '',
      description: ebayData.product?.description || '',
      listing_format: 'fixed_price',
      listing_price: parseFloat(ebayData.pricingSummary?.price?.value || '0'),
      currency: ebayData.pricingSummary?.price?.currency || 'USD',
      status: this.mapEBayStatusToListingStatus(ebayData.status),
      // ... map other fields as needed
    } as ListingRecord;
  }

  private mapEBayCategories(categoryNode: any): Array<{ id: string; name: string; parent_id?: string }> {
    const categories: Array<{ id: string; name: string; parent_id?: string }> = [];

    function traverse(node: any, parentId?: string) {
      if (node.category) {
        categories.push({
          id: node.category.categoryId,
          name: node.category.categoryName,
          parent_id: parentId,
        });

        if (node.childCategoryTreeNodes) {
          node.childCategoryTreeNodes.forEach((child: any) => {
            traverse(child, node.category.categoryId);
          });
        }
      }
    }

    traverse(categoryNode);
    return categories;
  }
}