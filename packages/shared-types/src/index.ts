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
