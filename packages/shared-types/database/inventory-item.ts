/**
 * Inventory Item Database Types
 *
 * TypeScript definitions for inventory item data models
 * Generated from database schema with additional business logic types
 */

// Enum types from database
export type InventoryItemStatus =
  | 'draft'
  | 'available'
  | 'listed'
  | 'sold'
  | 'reserved'
  | 'returned'
  | 'damaged'
  | 'donated'
  | 'archived';

export type InventoryItemCondition =
  | 'new_with_tags'
  | 'new_without_tags'
  | 'like_new'
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'for_parts';

export type SizeType =
  | 'numeric'
  | 'letter'
  | 'age'
  | 'shoe_us'
  | 'shoe_eu'
  | 'one_size'
  | 'custom';

// Media types
export interface PhotoMetadata {
  url: string;
  filename: string;
  size: number; // File size in bytes
  width: number; // Image width in pixels
  height: number; // Image height in pixels
  alt_text?: string;
  is_primary?: boolean;
  uploaded_at: string; // ISO timestamp
}

export interface VideoMetadata {
  url: string;
  filename: string;
  size: number;
  duration: number; // Duration in seconds
  thumbnail_url?: string;
  uploaded_at: string;
}

export interface DocumentMetadata {
  url: string;
  filename: string;
  size: number;
  type: string; // MIME type
  title?: string;
  uploaded_at: string;
}

// Main inventory item record
export interface InventoryItemRecord {
  // Primary Key
  id: string; // UUID

  // User Association
  user_id: string; // UUID, references user_profiles.id

  // Basic Item Information
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string[]; // Array of searchable tags

  // Item Condition & Details
  condition: InventoryItemCondition;
  condition_notes: string | null;
  size_type: SizeType | null;
  size_value: string | null;
  color: string | null;
  material: string | null;

  // Product Identifiers
  sku: string | null;
  upc: string | null;
  barcode: string | null;
  model_number: string | null;

  // Sourcing Information
  source_location: string | null;
  source_type: string | null;
  purchase_price: number | null;
  purchase_date: string | null; // ISO date
  receipt_photo_url: string | null;

  // Pricing & Valuation
  estimated_value: number | null;
  minimum_price: number | null;
  target_price: number | null;
  market_price: number | null;
  last_price_update: string | null; // ISO timestamp

  // Physical Attributes
  weight_oz: number | null;
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;

  // Media & Documentation
  photos: PhotoMetadata[];
  primary_photo_url: string | null;
  videos: VideoMetadata[];
  documents: DocumentMetadata[];

  // AI-Generated Metadata
  ai_generated_title: string | null;
  ai_generated_description: string | null;
  ai_extracted_keywords: string[];
  ai_suggested_category: string | null;
  ai_condition_assessment: InventoryItemCondition | null;
  ai_price_estimate: number | null;
  ai_analysis_confidence: number | null; // 0.00-1.00
  ai_last_analyzed: string | null; // ISO timestamp

  // Listing & Sales Tracking
  status: InventoryItemStatus;
  times_listed: number;
  views_count: number;
  favorites_count: number;
  inquiries_count: number;

  // Sales Information
  sale_price: number | null;
  sale_date: string | null; // ISO date
  sale_platform: string | null;
  buyer_feedback: string | null;
  profit_loss: number | null;

  // Inventory Management
  quantity: number;
  location_in_storage: string | null;
  storage_bin: string | null;
  needs_photography: boolean;
  needs_research: boolean;
  is_bundle: boolean;
  bundle_items: string[]; // Array of item UUIDs

  // Performance Metrics
  days_in_inventory: number | null;
  listing_performance_score: number | null; // 0.00-1.00

  // System Fields
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  deleted_at: string | null; // ISO timestamp
}

// Enhanced view with computed fields
export interface InventoryItemEnhanced extends InventoryItemRecord {
  calculated_profit_loss: number | null;
  calculated_days_in_inventory: number;
  roi_percentage: number | null;
  photo_count: number;
  ready_for_listing: boolean;
}

// Input types for creating/updating inventory items
export interface CreateInventoryItemInput {
  title: string;
  description?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  condition: InventoryItemCondition;
  condition_notes?: string;
  size_type?: SizeType;
  size_value?: string;
  color?: string;
  material?: string;
  sku?: string;
  upc?: string;
  barcode?: string;
  model_number?: string;
  source_location?: string;
  source_type?: string;
  purchase_price?: number;
  purchase_date?: string;
  receipt_photo_url?: string;
  estimated_value?: number;
  minimum_price?: number;
  target_price?: number;
  weight_oz?: number;
  length_in?: number;
  width_in?: number;
  height_in?: number;
  photos?: PhotoMetadata[];
  primary_photo_url?: string;
  videos?: VideoMetadata[];
  documents?: DocumentMetadata[];
  quantity?: number;
  location_in_storage?: string;
  storage_bin?: string;
  needs_photography?: boolean;
  needs_research?: boolean;
  is_bundle?: boolean;
  bundle_items?: string[];
}

export interface UpdateInventoryItemInput extends Partial<CreateInventoryItemInput> {
  status?: InventoryItemStatus;
  times_listed?: number;
  views_count?: number;
  favorites_count?: number;
  inquiries_count?: number;
  sale_price?: number;
  sale_date?: string;
  sale_platform?: string;
  buyer_feedback?: string;
  listing_performance_score?: number;
  ai_generated_title?: string;
  ai_generated_description?: string;
  ai_extracted_keywords?: string[];
  ai_suggested_category?: string;
  ai_condition_assessment?: InventoryItemCondition;
  ai_price_estimate?: number;
  ai_analysis_confidence?: number;
}

// Search and filter types
export interface InventoryItemFilters {
  status?: InventoryItemStatus[];
  condition?: InventoryItemCondition[];
  category?: string[];
  brand?: string[];
  size_type?: SizeType[];
  min_price?: number;
  max_price?: number;
  min_days_inventory?: number;
  max_days_inventory?: number;
  needs_photography?: boolean;
  needs_research?: boolean;
  is_bundle?: boolean;
  created_after?: string; // ISO date
  created_before?: string; // ISO date
  tags?: string[];
  search_query?: string; // Full-text search
}

export interface InventoryItemSortOptions {
  field: keyof InventoryItemRecord;
  direction: 'asc' | 'desc';
}

// Bulk operation types
export interface BulkUpdateInventoryItemsInput {
  item_ids: string[];
  updates: Partial<UpdateInventoryItemInput>;
}

export interface BulkDeleteInventoryItemsInput {
  item_ids: string[];
  permanent?: boolean; // If false, performs soft delete
}

// Analytics and reporting types
export interface InventoryAnalytics {
  total_items: number;
  items_by_status: Record<InventoryItemStatus, number>;
  items_by_condition: Record<InventoryItemCondition, number>;
  total_investment: number;
  total_sales: number;
  total_profit: number;
  average_roi: number;
  average_days_to_sell: number;
  top_categories: Array<{ category: string; count: number; revenue: number }>;
  top_brands: Array<{ brand: string; count: number; revenue: number }>;
  performance_metrics: {
    listing_success_rate: number;
    average_views_per_item: number;
    average_inquiries_per_item: number;
  };
}

// Validation helpers and business logic
export function getConditionDisplayName(condition: InventoryItemCondition): string {
  const displayNames: Record<InventoryItemCondition, string> = {
    new_with_tags: 'New with Tags',
    new_without_tags: 'New without Tags',
    like_new: 'Like New',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    for_parts: 'For Parts',
  };
  return displayNames[condition];
}

export function getStatusDisplayName(status: InventoryItemStatus): string {
  const displayNames: Record<InventoryItemStatus, string> = {
    draft: 'Draft',
    available: 'Available',
    listed: 'Listed',
    sold: 'Sold',
    reserved: 'Reserved',
    returned: 'Returned',
    damaged: 'Damaged',
    donated: 'Donated',
    archived: 'Archived',
  };
  return displayNames[status];
}

export function calculateROI(salePrice: number, purchasePrice: number): number {
  if (purchasePrice <= 0) return 0;
  return ((salePrice - purchasePrice) / purchasePrice) * 100;
}

export function calculateProfitMargin(salePrice: number, purchasePrice: number): number {
  if (salePrice <= 0) return 0;
  return ((salePrice - purchasePrice) / salePrice) * 100;
}

export function isReadyForListing(item: InventoryItemRecord): boolean {
  return !!(
    item.title &&
    item.description &&
    item.condition &&
    item.primary_photo_url &&
    item.target_price &&
    item.target_price > 0
  );
}

export function getDaysInInventory(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Error types for inventory operations
export class InventoryItemError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'InventoryItemError';
  }
}

export class InventoryItemNotFoundError extends InventoryItemError {
  constructor(itemId: string) {
    super(`Inventory item not found: ${itemId}`, 'ITEM_NOT_FOUND');
  }
}

export class InventoryItemValidationError extends InventoryItemError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class InsufficientInventoryError extends InventoryItemError {
  constructor(requested: number, available: number) {
    super(
      `Insufficient inventory: requested ${requested}, available ${available}`,
      'INSUFFICIENT_INVENTORY'
    );
  }
}