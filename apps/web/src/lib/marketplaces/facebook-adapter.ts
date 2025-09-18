/**
 * Facebook Marketplace Adapter
 *
 * Implements Facebook Graph API integration for local marketplace listings
 * Uses OAuth 2.0 for authentication with Facebook Login
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

// Facebook specific types
interface FacebookCategory {
  id: string;
  name: string;
  parent_category?: string;
}

interface FacebookLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
}

interface FacebookListingResponse {
  id: string;
  marketplace_listing_id?: string;
  permalink_url?: string;
  status: string;
  created_time: string;
  updated_time: string;
}

interface FacebookError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

interface FacebookPhoto {
  id: string;
  source: string;
  width: number;
  height: number;
}

/**
 * Facebook Marketplace API Adapter
 * Specialized for local marketplace listings with location-based features
 */
export class FacebookAdapter extends BaseMarketplaceAdapter {
  private readonly FACEBOOK_API_BASE = 'https://graph.facebook.com';
  private readonly FACEBOOK_OAUTH_BASE = 'https://www.facebook.com';

  getMarketplaceType(): MarketplaceType {
    return 'facebook_marketplace';
  }

  getRateLimit(): RateLimit {
    return {
      requests_per_hour: 600, // Facebook has complex rate limiting
      requests_per_minute: 60,
      requests_per_day: 10000,
      burst_limit: 10,
    };
  }

  protected getDefaultApiBaseUrl(): string {
    return this.FACEBOOK_API_BASE;
  }

  protected getDefaultApiVersion(): string {
    return 'v18.0'; // Facebook API version
  }

  /**
   * Initiate OAuth 2.0 flow for Facebook authentication
   */
  async initiateOAuthFlow(callbackUrl: string): Promise<AuthFlow> {
    const clientId = this.getClientId();
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'marketplace_management',
    ].join(',');

    const state = this.generateState();
    const authUrl = new URL(`${this.FACEBOOK_OAUTH_BASE}/v18.0/dialog/oauth`);

    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');
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

    const tokenUrl = new URL(`${this.FACEBOOK_API_BASE}/v18.0/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', this.connection.callback_url || '');
    tokenUrl.searchParams.set('code', code);

    const response = await fetch(tokenUrl.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new AuthenticationError(
        'facebook_marketplace',
        `OAuth flow failed: ${error.error?.message || 'Unknown error'}`
      );
    }

    const tokenData = await response.json();

    // Exchange short-lived token for long-lived token
    const longLivedToken = await this.exchangeForLongLivedToken(tokenData.access_token);

    return {
      access_token: longLivedToken.access_token,
      token_type: 'Bearer',
      expires_in: longLivedToken.expires_in,
      scope: tokenData.scope,
    };
  }

  /**
   * Refresh OAuth token (Facebook uses long-lived tokens)
   */
  async refreshToken(refreshToken: string): Promise<OAuth2Credentials> {
    // Facebook doesn't use refresh tokens in the traditional sense
    // Long-lived tokens can be extended before they expire
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    const extendUrl = new URL(`${this.FACEBOOK_API_BASE}/v18.0/oauth/access_token`);
    extendUrl.searchParams.set('grant_type', 'fb_exchange_token');
    extendUrl.searchParams.set('client_id', clientId);
    extendUrl.searchParams.set('client_secret', clientSecret);
    extendUrl.searchParams.set('fb_exchange_token', refreshToken);

    const response = await fetch(extendUrl.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new AuthenticationError(
        'facebook_marketplace',
        `Token refresh failed: ${error.error?.message || 'Unknown error'}`
      );
    }

    const tokenData = await response.json();

    return {
      access_token: tokenData.access_token,
      token_type: 'Bearer',
      expires_in: tokenData.expires_in,
      scope: '',
    };
  }

  /**
   * Validate credentials
   */
  async validateCredentials(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      await this.checkRateLimit();

      const response = await this.makeApiRequest('me?fields=id,name');
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
   * Create a new listing on Facebook Marketplace
   */
  async createListing(listing: CreateListingInput): Promise<ListingCreationResult> {
    await this.checkRateLimit();

    this.validateRequiredFields(listing, [
      'title',
      'description',
      'listing_price',
      'marketplace_category',
    ]);

    // Facebook Marketplace requires location
    this.validateLocationRequirements(listing);

    const listingData = await this.buildFacebookListingData(listing);

    try {
      // First, get the Page ID for marketplace posting
      const pageId = await this.getMarketplacePage();

      const response = await this.makeApiRequest(
        `${pageId}/marketplace_listings`,
        'POST',
        listingData
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `Facebook Marketplace listing creation failed: ${response.error}`,
          'facebook_marketplace',
          response.status
        );
      }

      const facebookResponse = response.data as FacebookListingResponse;

      return {
        external_listing_id: facebookResponse.id,
        external_url: facebookResponse.permalink_url || '',
        status: this.mapFacebookStatusToListingStatus(facebookResponse.status),
        marketplace_data: {
          marketplace_listing_id: facebookResponse.marketplace_listing_id,
          created_time: facebookResponse.created_time,
          updated_time: facebookResponse.updated_time,
        },
        fees: {
          listing_fee: 0, // Facebook Marketplace is free for individual sellers
          final_value_fee: 0,
          total_fees: 0,
        },
      };
    } catch (error) {
      this.log('error', 'Facebook Marketplace listing creation failed', { error: error.message, listing });
      throw error;
    }
  }

  /**
   * Update an existing Facebook Marketplace listing
   */
  async updateListing(externalId: string, updates: UpdateListingInput): Promise<ListingCreationResult> {
    await this.checkRateLimit();

    const updateData = this.buildFacebookUpdateData(updates);

    try {
      const response = await this.makeApiRequest(
        `${externalId}`,
        'POST', // Facebook uses POST for updates
        updateData
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `Facebook Marketplace listing update failed: ${response.error}`,
          'facebook_marketplace',
          response.status
        );
      }

      // Get updated listing details
      const listingResponse = await this.makeApiRequest(
        `${externalId}?fields=id,permalink_url,marketplace_listing_id,status,created_time,updated_time`
      );

      const facebookData = listingResponse.data;

      return {
        external_listing_id: externalId,
        external_url: facebookData.permalink_url || '',
        status: this.mapFacebookStatusToListingStatus(facebookData.status),
        marketplace_data: facebookData,
      };
    } catch (error) {
      this.log('error', 'Facebook Marketplace listing update failed', { error: error.message, externalId, updates });
      throw error;
    }
  }

  /**
   * Delete/end a Facebook Marketplace listing
   */
  async deleteListing(externalId: string): Promise<boolean> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(
        `${externalId}`,
        'DELETE'
      );

      if (response.success) {
        this.log('info', 'Facebook Marketplace listing deleted successfully', { externalId });
        return true;
      } else {
        this.log('warn', 'Facebook Marketplace listing deletion failed', { externalId, error: response.error });
        return false;
      }
    } catch (error) {
      this.log('error', 'Facebook Marketplace listing deletion error', { error: error.message, externalId });
      throw error;
    }
  }

  /**
   * Get listing details from Facebook Marketplace
   */
  async getListing(externalId: string): Promise<ListingRecord | null> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(
        `${externalId}?fields=id,name,description,price,currency,location,category,photos,permalink_url,marketplace_listing_id,status,created_time,updated_time`
      );

      if (!response.success) {
        if (response.status === 404) {
          return null;
        }
        throw new MarketplaceApiError(
          `Failed to fetch Facebook Marketplace listing: ${response.error}`,
          'facebook_marketplace',
          response.status
        );
      }

      return this.mapFacebookDataToListingRecord(response.data);
    } catch (error) {
      this.log('error', 'Error fetching Facebook Marketplace listing', { error: error.message, externalId });
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
   * Get Facebook Marketplace categories
   */
  async getCategories(): Promise<Array<{ id: string; name: string; parent_id?: string }>> {
    // Facebook Marketplace categories are predefined
    return this.getFacebookMarketplaceCategories();
  }

  /**
   * Suggest category (Facebook has limited category suggestions)
   */
  async suggestCategory(title: string, description: string): Promise<string | null> {
    // Basic category suggestion based on keywords
    const keywords = (title + ' ' + description).toLowerCase();

    if (keywords.includes('car') || keywords.includes('vehicle') || keywords.includes('auto')) {
      return 'VEHICLES';
    }
    if (keywords.includes('house') || keywords.includes('apartment') || keywords.includes('rent')) {
      return 'PROPERTY_RENTALS';
    }
    if (keywords.includes('clothing') || keywords.includes('shirt') || keywords.includes('dress')) {
      return 'APPAREL';
    }
    if (keywords.includes('phone') || keywords.includes('computer') || keywords.includes('electronics')) {
      return 'ELECTRONICS';
    }

    return 'OTHER';
  }

  /**
   * Get shipping policies (Facebook Marketplace focuses on local pickup)
   */
  async getShippingPolicies(): Promise<Array<{ id: string; name: string; cost: number }>> {
    return [
      {
        id: 'local_pickup',
        name: 'Local Pickup Only',
        cost: 0,
      },
      {
        id: 'shipping_available',
        name: 'Shipping Available',
        cost: 0, // Varies by seller
      },
    ];
  }

  /**
   * Get return policies
   */
  async getReturnPolicies(): Promise<Array<{ id: string; name: string; days: number }>> {
    return [
      {
        id: 'no_returns',
        name: 'No Returns',
        days: 0,
      },
      {
        id: 'negotiable',
        name: 'Negotiable with Seller',
        days: 0,
      },
    ];
  }

  /**
   * Upload photo to Facebook
   */
  async uploadPhoto(photoUrl: string, listingId?: string): Promise<string> {
    await this.checkRateLimit();

    try {
      const { blob, filename } = await this.downloadAndProcessPhoto(photoUrl);

      const formData = new FormData();
      formData.append('source', blob, filename);

      const pageId = await this.getMarketplacePage();

      const response = await fetch(
        `${this.buildApiUrl(`${pageId}/photos`)}`,
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
          'facebook_marketplace',
          response.status
        );
      }

      const data = await response.json();
      return data.id; // Facebook returns photo ID
    } catch (error) {
      this.log('error', 'Facebook photo upload failed', { error: error.message, photoUrl });
      throw error;
    }
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string): Promise<boolean> {
    await this.checkRateLimit();

    try {
      const response = await this.makeApiRequest(`${photoId}`, 'DELETE');
      return response.success;
    } catch (error) {
      this.log('error', 'Photo deletion failed', { error: error.message, photoId });
      return false;
    }
  }

  /**
   * Reorder photos (Facebook handles this in listing updates)
   */
  async reorderPhotos(photoIds: string[]): Promise<boolean> {
    this.log('info', 'Photo reordering requested', { photoIds });
    return true;
  }

  /**
   * Search listings (limited on Facebook Marketplace)
   */
  async searchListings(query: string, limit = 20): Promise<ListingRecord[]> {
    await this.checkRateLimit();

    try {
      const pageId = await this.getMarketplacePage();
      const response = await this.makeApiRequest(
        `${pageId}/marketplace_listings?fields=id,name,description,price,permalink_url&limit=${limit}`
      );

      if (!response.success) {
        throw new MarketplaceApiError(
          `Search failed: ${response.error}`,
          'facebook_marketplace',
          response.status
        );
      }

      return response.data.data?.map((item: any) =>
        this.mapFacebookDataToListingRecord(item)
      ) || [];
    } catch (error) {
      this.log('error', 'Facebook Marketplace search failed', { error: error.message, query });
      throw error;
    }
  }

  /**
   * Get listing analytics (limited on Facebook Marketplace)
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
        `${externalId}/insights?metric=post_impressions,post_engagements`
      );

      if (response.success && response.data.data) {
        const insights = response.data.data;
        const impressions = insights.find((i: any) => i.name === 'post_impressions')?.values[0]?.value || 0;
        const engagements = insights.find((i: any) => i.name === 'post_engagements')?.values[0]?.value || 0;

        return {
          views: impressions,
          watchers: 0, // Not available
          questions: engagements,
          offers: 0, // Not available through API
        };
      }

      return { views: 0, watchers: 0, questions: 0 };
    } catch (error) {
      this.log('error', 'Error fetching analytics', { error: error.message, externalId });
      return { views: 0, watchers: 0, questions: 0 };
    }
  }

  // Delisting operations
  async endListing(externalId: string, options?: EndListingOptions): Promise<EndListingResult> {
    try {
      console.log(`Ending Facebook Marketplace listing: ${externalId}`);
      
      // Facebook Graph API to delete the marketplace listing
      const response = await this.makeApiRequest(
        externalId,
        'DELETE'
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to end Facebook Marketplace listing',
        };
      }

      return {
        success: true,
        ended_at: new Date().toISOString(),
        external_response: response.data,
      };

    } catch (error) {
      console.error(`Error ending Facebook Marketplace listing ${externalId}:`, error);
      
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        throw new MarketplaceApiError(
          'Listing not found on Facebook Marketplace',
          'facebook_marketplace',
          404,
          'LISTING_NOT_FOUND'
        );
      }

      if (error.message?.includes('cannot delete')) {
        throw new MarketplaceApiError(
          'Listing cannot be deleted from Facebook Marketplace',
          'facebook_marketplace',
          400,
          'LISTING_CANNOT_BE_ENDED'
        );
      }

      return {
        success: false,
        error: `Facebook API error: ${error.message}`,
      };
    }
  }

  async getListingById(externalId: string): Promise<ListingRecord> {
    try {
      console.log(`Getting Facebook Marketplace listing: ${externalId}`);

      const response = await this.makeApiRequest(
        `${externalId}?fields=id,name,description,price,currency,location,category,photos,permalink_url,marketplace_listing_id,status,created_time,updated_time`,
        'GET'
      );

      if (!response.success || !response.data) {
        throw new MarketplaceApiError(
          `Facebook Marketplace listing not found: ${externalId}`,
          'facebook_marketplace',
          404,
          'LISTING_NOT_FOUND'
        );
      }

      return this.mapFacebookDataToListingRecord(response.data);

    } catch (error) {
      console.error(`Error getting Facebook Marketplace listing ${externalId}:`, error);
      throw error;
    }
  }

  // Private helper methods
  private getClientId(): string {
    const credentials = this.credentials as OAuth2Credentials;
    return credentials.client_id || process.env.FACEBOOK_APP_ID || '';
  }

  private getClientSecret(): string {
    const credentials = this.credentials as OAuth2Credentials;
    return credentials.client_secret || process.env.FACEBOOK_APP_SECRET || '';
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private async exchangeForLongLivedToken(shortLivedToken: string): Promise<OAuth2Credentials> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    const tokenUrl = new URL(`${this.FACEBOOK_API_BASE}/v18.0/oauth/access_token`);
    tokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const response = await fetch(tokenUrl.toString());
    const tokenData = await response.json();

    return {
      access_token: tokenData.access_token,
      token_type: 'Bearer',
      expires_in: tokenData.expires_in || 5184000, // 60 days default
      scope: '',
    };
  }

  private async getMarketplacePage(): Promise<string> {
    // Get the Page ID for marketplace posting
    // This could be cached or stored in connection metadata
    const response = await this.makeApiRequest('me/pages?fields=id,name,category');

    if (!response.success || !response.data.data) {
      throw new MarketplaceApiError(
        'No Facebook Page found for marketplace posting',
        'facebook_marketplace',
        404
      );
    }

    // Return the first page or a marketplace-specific page
    return response.data.data[0].id;
  }

  private validateLocationRequirements(listing: CreateListingInput): void {
    const location = listing.marketplace_attributes?.location as FacebookLocation;

    if (!location || !location.latitude || !location.longitude) {
      throw new MarketplaceApiError(
        'Location (latitude/longitude) is required for Facebook Marketplace',
        'facebook_marketplace',
        400,
        'VALIDATION_ERROR'
      );
    }
  }

  private async buildFacebookListingData(listing: CreateListingInput): Promise<any> {
    const location = listing.marketplace_attributes?.location as FacebookLocation;

    const listingData = {
      name: listing.title,
      description: listing.description,
      price: {
        amount: Math.round(listing.listing_price * 100), // Facebook expects cents
        currency: listing.currency || 'USD',
      },
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      marketplace_listing_type: 'SELLING',
      category: listing.marketplace_category || 'OTHER',
    };

    // Add photos if available
    if (listing.photo_urls && listing.photo_urls.length > 0) {
      // Upload photos first and get their IDs
      const photoIds = await Promise.all(
        listing.photo_urls.map(url => this.uploadPhoto(url))
      );
      (listingData as any).photos = photoIds;
    }

    return listingData;
  }

  private buildFacebookUpdateData(updates: UpdateListingInput): any {
    const updateData: any = {};

    if (updates.title) updateData.name = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.listing_price) {
      updateData.price = {
        amount: Math.round(updates.listing_price * 100),
        currency: updates.currency || 'USD',
      };
    }

    return updateData;
  }

  private mapFacebookStatusToListingStatus(facebookStatus: string): ListingStatus {
    const statusMap: Record<string, ListingStatus> = {
      'ACTIVE': 'active',
      'SOLD': 'sold',
      'PENDING': 'pending',
      'HIDDEN': 'paused',
      'DELETED': 'deleted',
    };

    return statusMap[facebookStatus] || 'active';
  }

  private mapFacebookDataToListingRecord(facebookData: any): ListingRecord {
    return {
      id: '', // Internal ID
      user_id: this.connection.user_id,
      inventory_item_id: '', // Mapped from our system
      marketplace_type: 'facebook_marketplace',
      external_listing_id: facebookData.id,
      external_url: facebookData.permalink_url || '',
      title: facebookData.name || '',
      description: facebookData.description || '',
      listing_format: 'fixed_price',
      listing_price: facebookData.price ? (facebookData.price.amount / 100) : 0,
      currency: facebookData.price?.currency || 'USD',
      status: this.mapFacebookStatusToListingStatus(facebookData.status),
      photo_urls: facebookData.photos?.map((photo: FacebookPhoto) => photo.source) || [],
      marketplace_attributes: {
        location: facebookData.location,
        category: facebookData.category,
      },
      created_at: facebookData.created_time || new Date().toISOString(),
      updated_at: facebookData.updated_time || new Date().toISOString(),
      // ... map other fields as needed
    } as ListingRecord;
  }

  private getFacebookMarketplaceCategories(): Array<{ id: string; name: string; parent_id?: string }> {
    return [
      { id: 'VEHICLES', name: 'Vehicles' },
      { id: 'PROPERTY_RENTALS', name: 'Property Rentals' },
      { id: 'APPAREL', name: 'Apparel' },
      { id: 'ELECTRONICS', name: 'Electronics' },
      { id: 'HOME_GOODS', name: 'Home & Garden' },
      { id: 'SPORTS', name: 'Sports & Outdoors' },
      { id: 'BOOKS_MOVIES_MUSIC', name: 'Books, Movies & Music' },
      { id: 'TOYS_GAMES', name: 'Toys & Games' },
      { id: 'MUSICAL_INSTRUMENTS', name: 'Musical Instruments' },
      { id: 'OFFICE_SUPPLIES', name: 'Office Supplies' },
      { id: 'PET_SUPPLIES', name: 'Pet Supplies' },
      { id: 'HEALTH_BEAUTY', name: 'Health & Beauty' },
      { id: 'BABY_KIDS', name: 'Baby & Kids' },
      { id: 'TOOLS', name: 'Tools' },
      { id: 'OTHER', name: 'Other' },
    ];
  }
}