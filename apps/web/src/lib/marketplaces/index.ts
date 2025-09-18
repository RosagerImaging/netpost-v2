/**
 * Marketplace Integration Library
 *
 * Central exports for all marketplace-related functionality
 */

// Base adapter and types
export { BaseMarketplaceAdapter, MarketplaceAdapterFactory } from './base-adapter';
export type {
  ApiResponse,
  ListingCreationResult,
  AuthFlow,
  RateLimit,
} from './base-adapter';

// Marketplace adapters
export { EBayAdapter } from './ebay-adapter';
export { PoshmarkAdapter } from './poshmark-adapter';
export { FacebookAdapter } from './facebook-adapter';

// Registry and utilities
export {
  initializeMarketplaceAdapters,
  getSupportedMarketplaces,
  createMarketplaceAdapter,
  isMarketplaceSupported,
  getMarketplaceConfig,
  getMarketplaceDisplayInfo,
  validateMarketplaceRequirements,
} from './adapter-registry';

// Error types
export {
  MarketplaceApiError,
  AuthenticationError,
  RateLimitError,
} from './base-adapter';

// Re-export types from shared-types for convenience
export type {
  MarketplaceType,
  ListingStatus,
  ListingFormat,
  CreateListingInput,
  UpdateListingInput,
  ListingRecord,
} from '@netpost/shared-types/database/listing';

export type {
  ConnectionStatus,
  AuthMethod,
  MarketplaceConnectionRecord,
  MarketplaceCredentials,
  OAuth1Credentials,
  OAuth2Credentials,
  ApiKeyCredentials,
  HealthCheckResult,
} from '@netpost/shared-types/database/marketplace-connection';