/**
 * Inventory Repository
 *
 * Manages inventory item data and operations
 * Extends BaseRepository with inventory-specific functionality
 */

import { BaseRepository } from './base-repository';
import {
  InventoryItemRecord,
  InventoryItemEnhanced,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  InventoryItemFilters,
  InventoryItemStatus,
  InventoryItemCondition,
  ValidationResult,
  SingleResult,
  QueryResult,
  isReadyForListing,
  getDaysInInventory,
  calculateROI,
} from '@netpost/shared-types/database';

export class InventoryRepository extends BaseRepository<
  InventoryItemRecord,
  CreateInventoryItemInput,
  UpdateInventoryItemInput
> {
  constructor() {
    super('inventory_items');
  }

  /**
   * Find inventory items with enhanced data (computed fields)
   */
  async findEnhanced(options: {
    filters?: InventoryItemFilters;
    pagination?: any;
    sort?: any;
    userId: string;
  }): Promise<QueryResult<InventoryItemEnhanced>> {
    try {
      const { filters = {}, pagination = {}, sort, userId } = options;
      const { page = 1, limit = 25 } = pagination;
      const offset = (page - 1) * limit;

      let query = this.client
        .from('inventory_items_enhanced')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply inventory-specific filters
      this.applyInventoryFilters(query, filters);

      // Apply sorting
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending ?? true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data as InventoryItemEnhanced[]) || [],
        total,
        page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      throw new Error(`Failed to find enhanced inventory items: ${error}`);
    }
  }

  /**
   * Search inventory items by text
   */
  async search(
    query: string,
    userId: string,
    options: {
      limit?: number;
      includeDescription?: boolean;
      includeTags?: boolean;
      status?: InventoryItemStatus[];
    } = {}
  ): Promise<InventoryItemRecord[]> {
    try {
      const { limit = 50, includeDescription = true, includeTags = true, status } = options;

      let dbQuery = this.client
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Apply status filter
      if (status && status.length > 0) {
        dbQuery = dbQuery.in('status', status);
      }

      // Build full-text search
      const searchTerms = query.split(' ').filter(term => term.length > 0);

      if (searchTerms.length > 0) {
        // Search in title (always included)
        dbQuery = dbQuery.or(
          searchTerms.map(term => `title.ilike.%${term}%`).join(',')
        );

        // Search in description if enabled
        if (includeDescription) {
          dbQuery = dbQuery.or(
            searchTerms.map(term => `description.ilike.%${term}%`).join(',')
          );
        }

        // Search in tags if enabled
        if (includeTags) {
          dbQuery = dbQuery.or(
            searchTerms.map(term => `tags.cs.{${term}}`).join(',')
          );
        }

        // Also search in brand and category
        dbQuery = dbQuery.or(
          searchTerms.map(term => `brand.ilike.%${term}%`).join(',')
        );
        dbQuery = dbQuery.or(
          searchTerms.map(term => `category.ilike.%${term}%`).join(',')
        );
      }

      dbQuery = dbQuery.limit(limit);

      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }

      return (data as InventoryItemRecord[]) || [];
    } catch (error) {
      throw new Error(`Failed to search inventory items: ${error}`);
    }
  }

  /**
   * Get items by status
   */
  async getByStatus(
    status: InventoryItemStatus,
    userId: string,
    limit: number = 100
  ): Promise<InventoryItemRecord[]> {
    try {
      const { data, error } = await this.client
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data as InventoryItemRecord[]) || [];
    } catch (error) {
      throw new Error(`Failed to get items by status: ${error}`);
    }
  }

  /**
   * Get items ready for listing
   */
  async getReadyForListing(userId: string): Promise<InventoryItemRecord[]> {
    try {
      const { data, error } = await this.client
        .from('inventory_items_enhanced')
        .select('*')
        .eq('user_id', userId)
        .eq('ready_for_listing', true)
        .eq('status', 'available')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data as InventoryItemRecord[]) || [];
    } catch (error) {
      throw new Error(`Failed to get items ready for listing: ${error}`);
    }
  }

  /**
   * Get items needing attention (photography, research, etc.)
   */
  async getItemsNeedingAttention(userId: string): Promise<{
    needsPhotography: InventoryItemRecord[];
    needsResearch: InventoryItemRecord[];
    needsPricing: InventoryItemRecord[];
    lowStock: InventoryItemRecord[];
  }> {
    try {
      const [needsPhotography, needsResearch, needsPricing, lowStock] = await Promise.all([
        this.client
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .eq('needs_photography', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),

        this.client
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .eq('needs_research', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),

        this.client
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .is('target_price', null)
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),

        this.client
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .eq('quantity', 1)
          .eq('status', 'listed')
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),
      ]);

      return {
        needsPhotography: (needsPhotography.data as InventoryItemRecord[]) || [],
        needsResearch: (needsResearch.data as InventoryItemRecord[]) || [],
        needsPricing: (needsPricing.data as InventoryItemRecord[]) || [],
        lowStock: (lowStock.data as InventoryItemRecord[]) || [],
      };
    } catch (error) {
      throw new Error(`Failed to get items needing attention: ${error}`);
    }
  }

  /**
   * Get inventory analytics
   */
  async getInventoryAnalytics(userId: string): Promise<{
    totalItems: number;
    itemsByStatus: Record<InventoryItemStatus, number>;
    itemsByCondition: Record<InventoryItemCondition, number>;
    totalInvestment: number;
    estimatedValue: number;
    averageDaysInInventory: number;
    topCategories: Array<{ category: string; count: number; value: number }>;
    topBrands: Array<{ brand: string; count: number; value: number }>;
    performanceMetrics: {
      readyForListing: number;
      needsAttention: number;
      profitableItems: number;
      totalProfit: number;
    };
  }> {
    try {
      const { data: items, error } = await this.client
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) {
        throw error;
      }

      const inventoryItems = items as InventoryItemRecord[];

      // Calculate status distribution
      const itemsByStatus = inventoryItems.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<InventoryItemStatus, number>);

      // Calculate condition distribution
      const itemsByCondition = inventoryItems.reduce((acc, item) => {
        acc[item.condition] = (acc[item.condition] || 0) + 1;
        return acc;
      }, {} as Record<InventoryItemCondition, number>);

      // Calculate financial metrics
      const totalInvestment = inventoryItems.reduce(
        (sum, item) => sum + (item.purchase_price || 0),
        0
      );

      const estimatedValue = inventoryItems.reduce(
        (sum, item) => sum + (item.estimated_value || item.target_price || 0),
        0
      );

      // Calculate average days in inventory
      const averageDaysInInventory = inventoryItems.length > 0
        ? inventoryItems.reduce(
            (sum, item) => sum + getDaysInInventory(item.created_at),
            0
          ) / inventoryItems.length
        : 0;

      // Top categories
      const categoryStats = inventoryItems.reduce((acc, item) => {
        if (item.category) {
          if (!acc[item.category]) {
            acc[item.category] = { count: 0, value: 0 };
          }
          acc[item.category].count++;
          acc[item.category].value += item.estimated_value || item.target_price || 0;
        }
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top brands
      const brandStats = inventoryItems.reduce((acc, item) => {
        if (item.brand) {
          if (!acc[item.brand]) {
            acc[item.brand] = { count: 0, value: 0 };
          }
          acc[item.brand].count++;
          acc[item.brand].value += item.estimated_value || item.target_price || 0;
        }
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const topBrands = Object.entries(brandStats)
        .map(([brand, stats]) => ({ brand, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Performance metrics
      const readyForListing = inventoryItems.filter(item => isReadyForListing(item)).length;
      const needsAttention = inventoryItems.filter(
        item => item.needs_photography || item.needs_research || !item.target_price
      ).length;

      const soldItems = inventoryItems.filter(item => item.status === 'sold');
      const profitableItems = soldItems.filter(
        item => item.sale_price && item.purchase_price && item.sale_price > item.purchase_price
      ).length;

      const totalProfit = soldItems.reduce((sum, item) => {
        if (item.sale_price && item.purchase_price) {
          return sum + (item.sale_price - item.purchase_price);
        }
        return sum;
      }, 0);

      return {
        totalItems: inventoryItems.length,
        itemsByStatus,
        itemsByCondition,
        totalInvestment,
        estimatedValue,
        averageDaysInInventory,
        topCategories,
        topBrands,
        performanceMetrics: {
          readyForListing,
          needsAttention,
          profitableItems,
          totalProfit,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get inventory analytics: ${error}`);
    }
  }

  /**
   * Update item status
   */
  async updateStatus(
    itemId: string,
    status: InventoryItemStatus,
    userId: string,
    additionalData?: Partial<UpdateInventoryItemInput>
  ): Promise<SingleResult<InventoryItemRecord>> {
    try {
      const updateData = {
        status,
        ...additionalData,
      };

      // Add sale-specific fields if marking as sold
      if (status === 'sold' && !updateData.sale_date) {
        updateData.sale_date = new Date().toISOString().split('T')[0];
      }

      return await this.update(itemId, updateData, userId);
    } catch (error) {
      throw new Error(`Failed to update item status: ${error}`);
    }
  }

  /**
   * Bulk update items
   */
  async bulkUpdateItems(
    itemIds: string[],
    updates: Partial<UpdateInventoryItemInput>,
    userId: string
  ): Promise<{ updated: number; errors: string[] }> {
    let updated = 0;
    const errors: string[] = [];

    for (const itemId of itemIds) {
      try {
        const result = await this.update(itemId, updates, userId);
        if (result.found) {
          updated++;
        }
      } catch (error) {
        errors.push(
          `Failed to update ${itemId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return { updated, errors };
  }

  /**
   * Apply inventory-specific filters
   */
  private applyInventoryFilters(query: any, filters: InventoryItemFilters): void {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      switch (key) {
        case 'status':
          if (Array.isArray(value)) {
            query = query.in('status', value);
          } else {
            query = query.eq('status', value);
          }
          break;
        case 'condition':
          if (Array.isArray(value)) {
            query = query.in('condition', value);
          } else {
            query = query.eq('condition', value);
          }
          break;
        case 'category':
          if (Array.isArray(value)) {
            query = query.in('category', value);
          } else {
            query = query.eq('category', value);
          }
          break;
        case 'brand':
          if (Array.isArray(value)) {
            query = query.in('brand', value);
          } else {
            query = query.eq('brand', value);
          }
          break;
        case 'min_price':
          query = query.gte('target_price', value);
          break;
        case 'max_price':
          query = query.lte('target_price', value);
          break;
        case 'min_days_inventory':
          query = query.gte('days_in_inventory', value);
          break;
        case 'max_days_inventory':
          query = query.lte('days_in_inventory', value);
          break;
        case 'needs_photography':
          query = query.eq('needs_photography', value);
          break;
        case 'needs_research':
          query = query.eq('needs_research', value);
          break;
        case 'is_bundle':
          query = query.eq('is_bundle', value);
          break;
        case 'tags':
          if (Array.isArray(value)) {
            query = query.overlaps('tags', value);
          }
          break;
        case 'search_query':
          if (typeof value === 'string' && value.trim()) {
            query = query.or(
              `title.ilike.%${value}%,description.ilike.%${value}%,brand.ilike.%${value}%,category.ilike.%${value}%`
            );
          }
          break;
        default:
          // Handle other filters with the base method
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
          break;
      }
    });
  }

  /**
   * Validate inventory item data
   */
  protected async validateRecord(
    data: CreateInventoryItemInput | UpdateInventoryItemInput
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields for creation
    if ('title' in data && data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push('Title is required');
      } else if (data.title.length > 255) {
        errors.push('Title must be 255 characters or less');
      }
    }

    // Validate prices
    if (data.purchase_price !== undefined && data.purchase_price < 0) {
      errors.push('Purchase price cannot be negative');
    }

    if (data.target_price !== undefined && data.target_price <= 0) {
      errors.push('Target price must be greater than 0');
    }

    if (data.minimum_price !== undefined && data.target_price !== undefined) {
      if (data.minimum_price >= data.target_price) {
        errors.push('Minimum price must be less than target price');
      }
    }

    // Validate quantity
    if (data.quantity !== undefined && data.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    // Validate dimensions
    if (data.weight_oz !== undefined && data.weight_oz < 0) {
      errors.push('Weight cannot be negative');
    }

    if (data.length_in !== undefined && data.length_in < 0) {
      errors.push('Length cannot be negative');
    }

    if (data.width_in !== undefined && data.width_in < 0) {
      errors.push('Width cannot be negative');
    }

    if (data.height_in !== undefined && data.height_in < 0) {
      errors.push('Height cannot be negative');
    }

    // Business logic validations
    if (data.status === 'sold') {
      if (!data.sale_price) {
        errors.push('Sale price is required for sold items');
      }
      if (!data.sale_date) {
        errors.push('Sale date is required for sold items');
      }
    }

    // Warnings for optimization
    if (data.title && data.title.length < 10) {
      warnings.push('Consider adding more descriptive title for better searchability');
    }

    if (!data.brand) {
      warnings.push('Adding brand information helps with categorization');
    }

    if (!data.category) {
      warnings.push('Adding category helps with organization and discovery');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}