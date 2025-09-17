/**
 * Base Repository Class
 *
 * Provides common CRUD operations and database utilities
 * All specific repositories extend this base class
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin, handleDatabaseError } from '../supabase';
import {
  Database,
  DatabaseResponse,
  PaginationOptions,
  SortOptions,
  FilterOptions,
  QueryResult,
  SingleResult,
  ValidationResult,
  DatabaseError,
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT,
} from '@/packages/shared-types/database';

/**
 * Base repository class with common database operations
 */
export abstract class BaseRepository<
  TRecord,
  TInsert = Partial<TRecord>,
  TUpdate = Partial<TRecord>
> {
  protected client: SupabaseClient<Database>;
  protected adminClient: SupabaseClient<Database>;
  protected tableName: string;

  constructor(tableName: string, useAdminClient: boolean = false) {
    this.tableName = tableName;
    this.client = useAdminClient ? supabaseAdmin : supabase;
    this.adminClient = supabaseAdmin;
  }

  /**
   * Find a record by ID
   */
  async findById(id: string, userId?: string): Promise<SingleResult<TRecord>> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        data: data as TRecord | null,
        found: data !== null,
      };
    } catch (error) {
      handleDatabaseError(error, `findById in ${this.tableName}`);
    }
  }

  /**
   * Find multiple records with filtering and pagination
   */
  async findMany(options: {
    filters?: FilterOptions<TRecord>;
    pagination?: PaginationOptions;
    sort?: SortOptions<TRecord>;
    userId?: string;
  } = {}): Promise<QueryResult<TRecord>> {
    try {
      const { filters = {}, pagination = {}, sort, userId } = options;
      const { page = 1, limit = DEFAULT_PAGINATION_LIMIT } = pagination;
      const actualLimit = Math.min(limit, MAX_PAGINATION_LIMIT);
      const offset = (page - 1) * actualLimit;

      let query = this.client.from(this.tableName).select('*', { count: 'exact' });

      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Apply filters
      this.applyFilters(query, filters);

      // Apply sorting
      if (sort) {
        query = query.order(sort.column as string, { ascending: sort.ascending ?? true });
      } else {
        // Default sort by created_at descending
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + actualLimit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / actualLimit);

      return {
        data: (data as TRecord[]) || [],
        total,
        page,
        limit: actualLimit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      handleDatabaseError(error, `findMany in ${this.tableName}`);
    }
  }

  /**
   * Create a new record
   */
  async create(data: TInsert, userId?: string): Promise<SingleResult<TRecord>> {
    try {
      let insertData = { ...data } as any;

      // Add user_id if provided
      if (userId) {
        insertData.user_id = userId;
      }

      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data: result as TRecord,
        found: true,
      };
    } catch (error) {
      handleDatabaseError(error, `create in ${this.tableName}`);
    }
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string,
    data: TUpdate,
    userId?: string
  ): Promise<SingleResult<TRecord>> {
    try {
      let query = this.client
        .from(this.tableName)
        .update(data as any)
        .eq('id', id);

      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: result, error } = await query.select().single();

      if (error) {
        throw error;
      }

      return {
        data: result as TRecord,
        found: true,
      };
    } catch (error) {
      handleDatabaseError(error, `update in ${this.tableName}`);
    }
  }

  /**
   * Delete a record by ID (hard delete)
   */
  async delete(id: string, userId?: string): Promise<boolean> {
    try {
      let query = this.client.from(this.tableName).delete().eq('id', id);

      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      handleDatabaseError(error, `delete in ${this.tableName}`);
    }
  }

  /**
   * Soft delete a record by ID (sets deleted_at timestamp)
   */
  async softDelete(id: string, userId?: string): Promise<boolean> {
    try {
      let query = this.client
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', id);

      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      handleDatabaseError(error, `softDelete in ${this.tableName}`);
    }
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(id: string, userId?: string): Promise<boolean> {
    try {
      let query = this.client
        .from(this.tableName)
        .update({ deleted_at: null } as any)
        .eq('id', id);

      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      handleDatabaseError(error, `restore in ${this.tableName}`);
    }
  }

  /**
   * Count records with optional filters
   */
  async count(filters?: FilterOptions<TRecord>, userId?: string): Promise<number> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Apply filters
      if (filters) {
        this.applyFilters(query, filters);
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      handleDatabaseError(error, `count in ${this.tableName}`);
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: string, userId?: string): Promise<boolean> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('id', { head: true })
        .eq('id', id);

      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected
        throw error;
      }

      return data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Bulk insert records
   */
  async bulkInsert(
    records: TInsert[],
    userId?: string
  ): Promise<{ data: TRecord[]; errors: string[] }> {
    try {
      let insertData = records.map(record => ({ ...record } as any));

      // Add user_id if provided
      if (userId) {
        insertData = insertData.map(record => ({ ...record, user_id: userId }));
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(insertData)
        .select();

      if (error) {
        throw error;
      }

      return {
        data: (data as TRecord[]) || [],
        errors: [],
      };
    } catch (error) {
      return {
        data: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Bulk update records
   */
  async bulkUpdate(
    updates: Array<{ id: string; data: TUpdate }>,
    userId?: string
  ): Promise<{ updated: number; errors: string[] }> {
    let updated = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        const result = await this.update(update.id, update.data, userId);
        if (result.found) {
          updated++;
        }
      } catch (error) {
        errors.push(
          `Failed to update ${update.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return { updated, errors };
  }

  /**
   * Bulk delete records
   */
  async bulkDelete(ids: string[], userId?: string, soft: boolean = true): Promise<{
    deleted: number;
    errors: string[];
  }> {
    let deleted = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const success = soft
          ? await this.softDelete(id, userId)
          : await this.delete(id, userId);

        if (success) {
          deleted++;
        }
      } catch (error) {
        errors.push(
          `Failed to delete ${id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return { deleted, errors };
  }

  /**
   * Execute a raw SQL query (admin only)
   */
  protected async executeRawQuery<T = any>(
    sql: string,
    params?: any[]
  ): Promise<T[]> {
    try {
      const { data, error } = await this.adminClient.rpc('exec_sql', {
        sql,
        params,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      handleDatabaseError(error, `executeRawQuery in ${this.tableName}`);
    }
  }

  /**
   * Apply filters to a query
   */
  protected applyFilters(query: any, filters: FilterOptions<TRecord>): void {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      switch (key) {
        case 'created_after':
          query = query.gte('created_at', value);
          break;
        case 'created_before':
          query = query.lte('created_at', value);
          break;
        case 'updated_after':
          query = query.gte('updated_at', value);
          break;
        case 'updated_before':
          query = query.lte('updated_at', value);
          break;
        default:
          // Handle array filters
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
   * Get the current user ID from the auth context
   */
  protected getCurrentUserId(): string | null {
    // This would be implemented based on your auth setup
    // For now, return null and require explicit userId parameters
    return null;
  }

  /**
   * Validate record data before operations
   */
  protected async validateRecord(data: TInsert | TUpdate): Promise<ValidationResult> {
    // Base validation - override in specific repositories
    return {
      valid: true,
      errors: [],
    };
  }

  /**
   * Execute within a transaction (when supported by Supabase)
   */
  protected async withTransaction<T>(
    callback: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    // Note: Supabase doesn't support manual transactions yet
    // This is a placeholder for when they add support
    return await callback(this.client);
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges(
    callback: (payload: any) => void,
    filters?: Record<string, any>
  ) {
    let subscription = this.client
      .channel(`${this.tableName}_changes`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
          filter: filters ? Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join(',') : undefined
        },
        callback
      )
      .subscribe();

    return subscription;
  }

  /**
   * Health check for the repository
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    error?: string;
  }> {
    const start = Date.now();

    try {
      const { error } = await this.client
        .from(this.tableName)
        .select('id', { head: true })
        .limit(1);

      const latency = Date.now() - start;

      if (error) {
        return {
          healthy: false,
          latency,
          error: error.message,
        };
      }

      return {
        healthy: true,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}