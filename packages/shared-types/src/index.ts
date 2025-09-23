// User types
export type {
  User,
  UserSubscription,
  UserPreferences,
  UserProfile,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "./user";

// Item types
export type {
  Item,
  ItemImage,
  ItemCategory,
  ItemCondition,
  ItemAnalysis,
  ItemFilter,
} from "./item";

// Listing types
export type {
  Listing,
  Platform,
  ListingStatus,
  ListingVisibility,
  ShippingOption,
  PaymentMethod,
  ReturnPolicy,
  ListingTemplate,
  ListingAnalytics,
  CrossPostingJob,
  CrossPostingResult,
} from "./listing";

// Database types - import from database folder
export type {
  MarketplaceType,
  ListingRecord,
  CreateListingInput,
  UpdateListingInput,
  ListingFormat,
  ShippingMethod,
  ListingStatus as DatabaseListingStatus,
  CrossPostingPlan
} from "../database/listing";
export type {
  ConnectionStatus,
  MarketplaceConnectionRecord,
  MarketplaceConnectionSafe,
  CreateMarketplaceConnectionInput,
  UpdateMarketplaceConnectionInput,
  ApiKeyCredentials,
  OAuth2Credentials,
  OAuth1Credentials,
  UsernamePasswordCredentials,
  AuthMethod,
  MarketplaceCredentials,
  ConnectionFilters,
  HealthCheckResult,
  ConnectionHealth,
  ConnectionAnalytics,
  CredentialValidationResult,
  NotificationPreferences,
  RateLimitUsage
} from "../database/marketplace-connection";

// Database types
export type {
  InventoryItemRecord,
  InventoryItemEnhanced,
  InventoryItemStatus,
  InventoryItemCondition,
  SizeType,
  PhotoMetadata,
  VideoMetadata,
  DocumentMetadata,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  InventoryItemFilters,
  InventoryItemSortOptions,
  BulkUpdateInventoryItemsInput,
  BulkDeleteInventoryItemsInput,
  InventoryAnalytics,
} from "../database/inventory-item";

// Database utility functions
export {
  getConditionDisplayName,
  getInventoryStatusDisplayName,
  calculateROI,
  calculateInventoryProfitMargin,
  isReadyForListing,
  getDaysInInventory,
  InventoryItemError,
  InventoryItemNotFoundError,
  InventoryItemValidationError,
  InsufficientInventoryError,
} from "../database/inventory-item";

// De-listing types
export type {
  DelistingJobStatus,
  DelistingTriggerType,
  DelistingPreference,
  UserDelistingPreferences,
  DelistingJob,
  SaleEvent,
  DelistingAuditLog,
  PendingDelistingJob,
  CreateDelistingJobRequest,
  CreateDelistingJobResponse,
  UpdateDelistingPreferencesRequest,
  UpdateDelistingPreferencesResponse,
  ProcessSaleEventRequest,
  ProcessSaleEventResponse,
  ConfirmDelistingJobRequest,
  ConfirmDelistingJobResponse,
  BulkDelistingRequest,
  BulkDelistingResponse,
  DelistingStats,
  EBayWebhookPayload,
  PoshmarkWebhookPayload,
  FacebookWebhookPayload,
  PollingResult,
  IDelistingError,
  DelistingErrorCode,
} from "./database/delisting";

// De-listing utility functions and classes
export {
  DELISTING_ERROR_CODES,
  isRetryableError,
  getRetryDelay,
  calculateSuccessRate,
  DelistingError,
} from "./database/delisting";

// API types
export type {
  ApiResponse,
  ApiError,
  ApiMeta,
  PaginationMeta,
  PaginationParams,
  SearchParams,
  FileUpload,
  UploadResponse,
  WebhookEvent,
  RealtimeEvent,
  AnalyticsEvent,
  NotificationPayload,
  NotificationAction,
  HealthCheck,
  ServiceHealth,
} from "./api";

// Beta invitation types
export type {
  BetaInvitationRecord,
  BetaInvitationEnhanced,
  BetaInvitationPublic,
  CreateBetaInvitationInput,
  UpdateBetaInvitationInput,
  BetaInvitationStatus,
  BetaInvitationUsage,
  CreateBetaInvitationUsageInput,
  BetaInvitationValidationResult,
  BetaInvitationStats,
  BetaInvitationQueryOptions,
} from "../database/beta-invitation";

// Database schema type
export type { Database } from "../database/index";
