/**
 * Base Marketplace Adapter
 *
 * Provides a unified interface for marketplace integrations
 * Each marketplace implements this base class with specific API implementations
 */

import type {
  CreateListingInput,
  UpdateListingInput,
  ListingRecord,
  MarketplaceType,
  DatabaseListingStatus as ListingStatus,
} from '@netpost/shared-types';
import type {
  MarketplaceConnectionRecord,
  MarketplaceCredentials,
  OAuth2Credentials,
  ApiKeyCredentials,
  HealthCheckResult,
} from '@netpost/shared-types';

// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  rate_limit?: {
    remaining: number;
    reset_time: string;
  };
}

// Listing creation result
export interface ListingCreationResult {
  external_listing_id: string;
  external_url: string;
  status: ListingStatus;
  marketplace_data?: Record<string, any>;
  fees?: {
    listing_fee?: number;
    final_value_fee?: number;
    total_fees?: number;
  };
}

// Delisting operation types
export interface EndListingOptions {
  reason?: string;
  sold_to_buyer?: string;
  cancel_reason?: 'not_available' | 'wrong_category' | 'description_issue' | 'pricing_error' | 'sold_elsewhere';
}

export interface EndListingResult {
  success: boolean;
  ended_at?: string;
  external_response?: any;
  error?: string;
}

// Authentication flow types
export interface AuthFlow {
  authorization_url: string;
  state: string;
  callback_url: string;
}

// Rate limiting interface
export interface RateLimit {
  requests_per_hour: number;
  requests_per_minute?: number;
  requests_per_day?: number;
  burst_limit?: number;
}

// Error types
export class MarketplaceApiError extends Error {
  constructor(
    message: string,
    public marketplace: MarketplaceType,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'MarketplaceApiError';
  }
}

export class AuthenticationError extends MarketplaceApiError {
  constructor(marketplace: MarketplaceType, message: string) {
    super(message, marketplace, 401, 'AUTHENTICATION_ERROR');
  }
}

export class RateLimitError extends MarketplaceApiError {
  constructor(marketplace: MarketplaceType, resetTime?: string) {
    const message = resetTime
      ? `Rate limit exceeded. Resets at ${resetTime}`
      : 'Rate limit exceeded';
    super(message, marketplace, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Abstract base class for marketplace adapters
 * All marketplace integrations must implement this interface
 */
export abstract class BaseMarketplaceAdapter {
  protected connection: MarketplaceConnectionRecord;
  protected credentials: MarketplaceCredentials;

  constructor(
    connection: MarketplaceConnectionRecord,
    credentials: MarketplaceCredentials
  ) {
    this.connection = connection;
    this.credentials = credentials;
  }

  // Abstract methods that must be implemented by each marketplace
  abstract getMarketplaceType(): MarketplaceType;
  abstract getRateLimit(): RateLimit;

  // Authentication methods
  abstract initiateOAuthFlow(callbackUrl: string): Promise<AuthFlow>;
  abstract completeOAuthFlow(code: string, state: string): Promise<OAuth2Credentials>;
  abstract refreshToken(refreshToken: string): Promise<OAuth2Credentials>;
  abstract validateCredentials(): Promise<HealthCheckResult>;

  // Core listing operations
  abstract createListing(listing: CreateListingInput): Promise<ListingCreationResult>;
  abstract updateListing(externalId: string, updates: UpdateListingInput): Promise<ListingCreationResult>;
  abstract deleteListing(externalId: string): Promise<boolean>;
  abstract getListing(externalId: string): Promise<ListingRecord | null>;
  abstract getListingStatus(externalId: string): Promise<ListingStatus>;

  // Delisting operations
  abstract endListing(externalId: string, options?: EndListingOptions): Promise<EndListingResult>;
  abstract getListingById(externalId: string): Promise<ListingRecord>;

  // Category and metadata operations
  abstract getCategories(): Promise<Array<{ id: string; name: string; parent_id?: string }>>;
  abstract suggestCategory(title: string, description: string): Promise<string | null>;
  abstract getShippingPolicies(): Promise<Array<{ id: string; name: string; cost: number }>>;
  abstract getReturnPolicies(): Promise<Array<{ id: string; name: string; days: number }>>;

  // Photo operations
  abstract uploadPhoto(photoUrl: string, listingId?: string): Promise<string>;
  abstract deletePhoto(photoId: string): Promise<boolean>;
  abstract reorderPhotos(photoIds: string[]): Promise<boolean>;

  // Search and analytics
  abstract searchListings(query: string, limit?: number): Promise<ListingRecord[]>;
  abstract getListingAnalytics(externalId: string): Promise<{
    views: number;
    watchers: number;
    questions: number;
    offers?: number;
  }>;

  // Utility methods (implemented in base class)
  protected getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `NetPost/1.0 (${this.getMarketplaceType()})`,
    };

    // Add authentication headers based on credential type
    if (this.isOAuth2Credentials(this.credentials)) {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.isApiKeyCredentials(this.credentials)) {
      headers['X-API-Key'] = this.credentials.api_key;
      if (this.credentials.api_secret) {
        headers['X-API-Secret'] = this.credentials.api_secret;
      }
    }

    return headers;
  }

  protected async makeApiRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<ApiResponse<T>> {
    const url = this.buildApiUrl(endpoint);
    const headers = this.getApiHeaders();

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();

      // Check for rate limiting
      if (response.status === 429) {
        const resetTime = response.headers.get('X-RateLimit-Reset') ||
                         response.headers.get('Retry-After');
        throw new RateLimitError(this.getMarketplaceType(), resetTime || undefined);
      }

      // Check for authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(
          this.getMarketplaceType(),
          responseData.message || 'Authentication failed'
        );
      }

      // Extract rate limit info
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      return {
        success: response.ok,
        data: responseData,
        status: response.status,
        error: response.ok ? undefined : responseData.message || 'API request failed',
        rate_limit: rateLimitRemaining ? {
          remaining: parseInt(rateLimitRemaining),
          reset_time: rateLimitReset || '',
        } : undefined,
      };
    } catch (error) {
      if (error instanceof MarketplaceApiError) {
        throw error;
      }

      throw new MarketplaceApiError(
        `API request failed: ${error}`,
        this.getMarketplaceType(),
        0,
        'NETWORK_ERROR'
      );
    }
  }

  protected buildApiUrl(endpoint: string): string {
    const baseUrl = this.connection.api_endpoint_base || this.getDefaultApiBaseUrl();
    const version = this.connection.api_version || this.getDefaultApiVersion();

    return `${baseUrl}/${version}/${endpoint}`.replace(/\/+/g, '/').replace(':/', '://');
  }

  protected abstract getDefaultApiBaseUrl(): string;
  protected abstract getDefaultApiVersion(): string;

  // Type guards for credential types
  protected isOAuth2Credentials(creds: MarketplaceCredentials): creds is OAuth2Credentials {
    return 'access_token' in creds && 'token_type' in creds;
  }

  protected isApiKeyCredentials(creds: MarketplaceCredentials): creds is ApiKeyCredentials {
    return 'api_key' in creds;
  }

  // Rate limiting utilities
  protected async checkRateLimit(): Promise<void> {
    const rateLimit = this.getRateLimit();
    const usage = this.connection.current_rate_limit_usage;

    // Simple rate limit check - in production, this would be more sophisticated
    if (usage?.current_hour && usage.current_hour.requests >= rateLimit.requests_per_hour) {
      const resetTime = new Date(usage.current_hour.reset_time);
      if (resetTime > new Date()) {
        throw new RateLimitError(this.getMarketplaceType(), resetTime.toISOString());
      }
    }
  }

  // Validation utilities
  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new MarketplaceApiError(
        `Missing required fields: ${missingFields.join(', ')}`,
        this.getMarketplaceType(),
        400,
        'VALIDATION_ERROR'
      );
    }
  }

  // Photo utilities
  protected async downloadAndProcessPhoto(photoUrl: string): Promise<{
    blob: Blob;
    filename: string;
    type: string;
  }> {
    try {
      const response = await fetch(photoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download photo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = new URL(photoUrl);
      const filename = url.pathname.split('/').pop() || 'photo.jpg';

      return {
        blob,
        filename,
        type: blob.type || 'image/jpeg',
      };
    } catch (error) {
      throw new MarketplaceApiError(
        `Photo download failed: ${error}`,
        this.getMarketplaceType(),
        0,
        'PHOTO_DOWNLOAD_ERROR'
      );
    }
  }

  // Logging and monitoring
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      marketplace: this.getMarketplaceType(),
      connection_id: this.connection.id,
      level,
      message,
      data,
    };

    // In production, this would go to a proper logging service
    console.log(JSON.stringify(logEntry));
  }

  protected logApiCall(endpoint: string, method: string, duration: number, success: boolean): void {
    this.log('info', 'API call completed', {
      endpoint,
      method,
      duration_ms: duration,
      success,
    });
  }
}

/**
 * Factory function to create marketplace adapters
 */
export type MarketplaceAdapterConstructor = new (
  connection: MarketplaceConnectionRecord,
  credentials: MarketplaceCredentials
) => BaseMarketplaceAdapter;

export class MarketplaceAdapterFactory {
  private static adapters = new Map<MarketplaceType, MarketplaceAdapterConstructor>();

  static register(marketplace: MarketplaceType, adapter: MarketplaceAdapterConstructor): void {
    this.adapters.set(marketplace, adapter);
  }

  static create(
    connection: MarketplaceConnectionRecord,
    credentials: MarketplaceCredentials
  ): BaseMarketplaceAdapter {
    const AdapterClass = this.adapters.get(connection.marketplace_type);
    if (!AdapterClass) {
      throw new Error(`No adapter registered for marketplace: ${connection.marketplace_type}`);
    }

    return new AdapterClass(connection, credentials);
  }

  static getSupportedMarketplaces(): MarketplaceType[] {
    return Array.from(this.adapters.keys());
  }
}