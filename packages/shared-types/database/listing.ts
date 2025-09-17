/**
 * Listing Database Types
 *
 * TypeScript definitions for listing data models
 * Generated from database schema with additional business logic types
 */

// Enum types from database
export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'paused'
  | 'ended'
  | 'sold'
  | 'cancelled'
  | 'rejected'
  | 'under_review'
  | 'relisted'
  | 'deleted';

export type MarketplaceType =
  | 'ebay'
  | 'poshmark'
  | 'mercari'
  | 'facebook_marketplace'
  | 'depop'
  | 'vinted'
  | 'grailed'
  | 'the_realreal'
  | 'vestiaire_collective'
  | 'tradesy'
  | 'etsy'
  | 'amazon'
  | 'shopify'
  | 'custom';

export type ListingFormat =
  | 'auction'
  | 'fixed_price'
  | 'best_offer'
  | 'classified';

export type ShippingMethod =
  | 'calculated'
  | 'flat_rate'
  | 'free'
  | 'local_pickup'
  | 'freight';

// Marketplace-specific data structures
export interface MarketplaceFees {
  insertion_fee?: number;
  final_value_fee?: number;
  payment_processing_fee?: number;
  listing_upgrade_fees?: number;
  shipping_fee?: number;
  international_fee?: number;
  currency?: string;
}

export interface MarketplaceAttributes {
  // eBay specific
  item_specifics?: Record<string, string>;
  store_category_id?: string;
  best_offer_auto_accept?: number;
  best_offer_auto_decline?: number;

  // Poshmark specific
  size_chart?: string;
  brand_id?: string;
  style_tags?: string[];

  // Mercari specific
  brand_id?: string;
  condition_id?: string;
  shipping_payer?: string;

  // Facebook Marketplace specific
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  delivery_method?: string[];

  // Generic attributes
  [key: string]: any;
}

// Main listing record
export interface ListingRecord {
  // Primary Key
  id: string; // UUID

  // Relationships
  user_id: string; // UUID
  inventory_item_id: string; // UUID

  // Marketplace Information
  marketplace_type: MarketplaceType;
  external_listing_id: string | null;
  external_url: string | null;

  // Listing Content
  title: string;
  description: string;
  listing_format: ListingFormat;

  // Pricing
  listing_price: number;
  original_price: number | null;
  minimum_offer_price: number | null;
  currency: string;

  // Auction-specific fields
  starting_bid: number | null;
  reserve_price: number | null;
  buy_it_now_price: number | null;

  // Quantity and Availability
  quantity_available: number;
  quantity_sold: number;

  // Timing
  listing_duration: number | null;
  start_time: string; // ISO timestamp
  end_time: string | null; // ISO timestamp
  auto_relist: boolean;
  relist_count: number;

  // Status and Performance
  status: ListingStatus;
  status_reason: string | null;
  last_status_change: string; // ISO timestamp

  // Performance Metrics
  view_count: number;
  watcher_count: number;
  question_count: number;
  offer_count: number;
  best_offer_amount: number | null;

  // Shipping Information
  shipping_method: ShippingMethod;
  shipping_cost: number | null;
  free_shipping: boolean;
  expedited_shipping: boolean;
  international_shipping: boolean;
  handling_time: number;

  // Location and Item Details
  item_location: string | null;
  condition_description: string | null;

  // Photos and Media
  photo_urls: string[];
  primary_photo_url: string | null;
  photo_order: number[];

  // Marketplace-Specific Data
  marketplace_category: string | null;
  marketplace_subcategory: string | null;
  marketplace_attributes: MarketplaceAttributes;
  marketplace_fees: MarketplaceFees;

  // SEO and Discovery
  tags: string[];
  promoted: boolean;
  promotion_cost: number | null;

  // Sales Data
  sale_price: number | null;
  sale_date: string | null; // ISO timestamp
  buyer_user_id: string | null;
  buyer_feedback_score: number | null;
  payment_method: string | null;
  tracking_number: string | null;

  // Fees and Profit
  marketplace_fee: number | null;
  payment_processing_fee: number | null;
  shipping_fee_charged: number | null;
  actual_shipping_cost: number | null;
  promotional_fee: number | null;
  total_fees: number | null;
  net_profit: number | null;

  // Returns and Issues
  return_requested: boolean;
  return_reason: string | null;
  return_approved: boolean | null;
  case_opened: boolean;
  case_reason: string | null;
  case_resolution: string | null;

  // Listing Management
  template_used: string | null; // UUID
  notes: string | null;
  optimization_suggestions: string[];

  // Cross-posting
  cross_posted_from: string | null; // UUID
  cross_post_group_id: string | null; // UUID

  // System Fields
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  synced_at: string | null; // ISO timestamp
  deleted_at: string | null; // ISO timestamp
}

// Active listings view with enhanced data
export interface ActiveListingView extends ListingRecord {
  // From joined inventory item
  item_title: string;
  item_brand: string | null;
  item_category: string | null;
  item_condition: string;
  item_cost: number | null;

  // Calculated fields
  gross_profit: number | null;
  roi_percentage: number | null;
  days_listed: number;
  days_remaining: number | null;
}

// Input types for creating/updating listings
export interface CreateListingInput {
  inventory_item_id: string;
  marketplace_type: MarketplaceType;
  title: string;
  description: string;
  listing_format?: ListingFormat;
  listing_price: number;
  original_price?: number;
  minimum_offer_price?: number;
  currency?: string;
  starting_bid?: number;
  reserve_price?: number;
  buy_it_now_price?: number;
  quantity_available?: number;
  listing_duration?: number;
  start_time?: string;
  end_time?: string;
  auto_relist?: boolean;
  shipping_method?: ShippingMethod;
  shipping_cost?: number;
  free_shipping?: boolean;
  expedited_shipping?: boolean;
  international_shipping?: boolean;
  handling_time?: number;
  item_location?: string;
  condition_description?: string;
  photo_urls?: string[];
  primary_photo_url?: string;
  photo_order?: number[];
  marketplace_category?: string;
  marketplace_subcategory?: string;
  marketplace_attributes?: MarketplaceAttributes;
  tags?: string[];
  promoted?: boolean;
  promotion_cost?: number;
  template_used?: string;
  notes?: string;
  cross_post_group_id?: string;
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  status?: ListingStatus;
  status_reason?: string;
  external_listing_id?: string;
  external_url?: string;
  view_count?: number;
  watcher_count?: number;
  question_count?: number;
  offer_count?: number;
  best_offer_amount?: number;
  sale_price?: number;
  sale_date?: string;
  buyer_user_id?: string;
  buyer_feedback_score?: number;
  payment_method?: string;
  tracking_number?: string;
  marketplace_fee?: number;
  payment_processing_fee?: number;
  shipping_fee_charged?: number;
  actual_shipping_cost?: number;
  promotional_fee?: number;
  return_requested?: boolean;
  return_reason?: string;
  return_approved?: boolean;
  case_opened?: boolean;
  case_reason?: string;
  case_resolution?: string;
  optimization_suggestions?: string[];
  relist_count?: number;
  synced_at?: string;
}

// Search and filter types
export interface ListingFilters {
  status?: ListingStatus[];
  marketplace_type?: MarketplaceType[];
  listing_format?: ListingFormat[];
  min_price?: number;
  max_price?: number;
  min_days_listed?: number;
  max_days_listed?: number;
  promoted?: boolean;
  auto_relist?: boolean;
  free_shipping?: boolean;
  international_shipping?: boolean;
  has_offers?: boolean;
  has_watchers?: boolean;
  created_after?: string; // ISO date
  created_before?: string; // ISO date
  ending_soon?: boolean; // Ending within 24 hours
  tags?: string[];
  search_query?: string; // Full-text search
  category?: string[];
  brand?: string[];
}

export interface ListingSortOptions {
  field: keyof ListingRecord;
  direction: 'asc' | 'desc';
}

// Bulk operations
export interface BulkUpdateListingsInput {
  listing_ids: string[];
  updates: Partial<UpdateListingInput>;
}

export interface BulkRelistInput {
  listing_ids: string[];
  duration?: number;
  price_adjustment?: number; // Percentage adjustment (+10 = 10% increase)
  auto_relist?: boolean;
}

// Cross-posting types
export interface CrossPostingPlan {
  inventory_item_id: string;
  marketplaces: MarketplaceType[];
  base_listing: CreateListingInput;
  marketplace_customizations?: Partial<Record<MarketplaceType, Partial<CreateListingInput>>>;
}

// Analytics and reporting
export interface ListingPerformanceMetrics {
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  total_views: number;
  total_watchers: number;
  total_offers: number;
  average_sale_time: number; // Days
  conversion_rate: number; // Percentage
  average_sale_price: number;
  total_revenue: number;
  total_fees: number;
  net_profit: number;
  roi: number;
  performance_by_marketplace: Record<MarketplaceType, {
    listings: number;
    sales: number;
    revenue: number;
    average_days_to_sell: number;
    conversion_rate: number;
  }>;
}

// Marketplace-specific helpers
export function getMarketplaceDisplayName(marketplace: MarketplaceType): string {
  const displayNames: Record<MarketplaceType, string> = {
    ebay: 'eBay',
    poshmark: 'Poshmark',
    mercari: 'Mercari',
    facebook_marketplace: 'Facebook Marketplace',
    depop: 'Depop',
    vinted: 'Vinted',
    grailed: 'Grailed',
    the_realreal: 'The RealReal',
    vestiaire_collective: 'Vestiaire Collective',
    tradesy: 'Tradesy',
    etsy: 'Etsy',
    amazon: 'Amazon',
    shopify: 'Shopify',
    custom: 'Custom Platform',
  };
  return displayNames[marketplace];
}

export function getStatusDisplayName(status: ListingStatus): string {
  const displayNames: Record<ListingStatus, string> = {
    draft: 'Draft',
    pending: 'Pending',
    active: 'Active',
    paused: 'Paused',
    ended: 'Ended',
    sold: 'Sold',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    under_review: 'Under Review',
    relisted: 'Relisted',
    deleted: 'Deleted',
  };
  return displayNames[status];
}

export function getListingFormatDisplayName(format: ListingFormat): string {
  const displayNames: Record<ListingFormat, string> = {
    auction: 'Auction',
    fixed_price: 'Fixed Price',
    best_offer: 'Best Offer',
    classified: 'Classified',
  };
  return displayNames[format];
}

export function getShippingMethodDisplayName(method: ShippingMethod): string {
  const displayNames: Record<ShippingMethod, string> = {
    calculated: 'Calculated',
    flat_rate: 'Flat Rate',
    free: 'Free Shipping',
    local_pickup: 'Local Pickup',
    freight: 'Freight',
  };
  return displayNames[method];
}

// Business logic helpers
export function isAuctionListing(listing: ListingRecord): boolean {
  return listing.listing_format === 'auction';
}

export function isEndingSoon(listing: ListingRecord, hoursThreshold: number = 24): boolean {
  if (!listing.end_time) return false;
  const endTime = new Date(listing.end_time);
  const now = new Date();
  const hoursRemaining = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursRemaining <= hoursThreshold && hoursRemaining > 0;
}

export function getDaysListed(listing: ListingRecord): number {
  const startTime = new Date(listing.start_time);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startTime.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysRemaining(listing: ListingRecord): number | null {
  if (!listing.end_time) return null;
  const endTime = new Date(listing.end_time);
  const now = new Date();
  const diffTime = endTime.getTime() - now.getTime();
  return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
}

export function calculateListingROI(listing: ListingRecord, itemCost: number): number | null {
  if (!listing.sale_price || itemCost <= 0) return null;
  const totalCosts = itemCost + (listing.total_fees || 0);
  return ((listing.sale_price - totalCosts) / totalCosts) * 100;
}

export function calculateProfitMargin(listing: ListingRecord): number | null {
  if (!listing.sale_price || !listing.net_profit) return null;
  return (listing.net_profit / listing.sale_price) * 100;
}

// Validation helpers
export function validateListingPrice(listing: CreateListingInput | UpdateListingInput): string[] {
  const errors: string[] = [];

  if (listing.listing_price !== undefined && listing.listing_price <= 0) {
    errors.push('Listing price must be greater than 0');
  }

  if (listing.minimum_offer_price !== undefined &&
      listing.listing_price !== undefined &&
      listing.minimum_offer_price >= listing.listing_price) {
    errors.push('Minimum offer price must be less than listing price');
  }

  if (listing.starting_bid !== undefined &&
      listing.reserve_price !== undefined &&
      listing.starting_bid >= listing.reserve_price) {
    errors.push('Starting bid must be less than reserve price');
  }

  return errors;
}

// Error types
export class ListingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ListingError';
  }
}

export class ListingNotFoundError extends ListingError {
  constructor(listingId: string) {
    super(`Listing not found: ${listingId}`, 'LISTING_NOT_FOUND');
  }
}

export class ListingValidationError extends ListingError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class MarketplaceApiError extends ListingError {
  constructor(marketplace: MarketplaceType, message: string) {
    super(`${getMarketplaceDisplayName(marketplace)} API error: ${message}`, 'MARKETPLACE_API_ERROR');
  }
}