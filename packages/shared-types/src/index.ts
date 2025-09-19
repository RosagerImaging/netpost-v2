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
  getStatusDisplayName,
  calculateROI,
  calculateProfitMargin,
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
  DelistingError,
  DelistingErrorCode,
} from "./database/delisting";

// De-listing utility functions
export {
  DELISTING_ERROR_CODES,
  isRetryableError,
  getRetryDelay,
  calculateSuccessRate,
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
