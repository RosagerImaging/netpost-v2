import { supabase } from "./supabase";
import type {
  InventoryItemRecord,
  InventoryItemFilters,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from "@netpost/shared-types";

export interface PaginatedInventoryResponse {
  items: InventoryItemRecord[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface InventoryQueryParams {
  searchQuery?: string;
  filters?: InventoryItemFilters;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

/**
 * Fetch inventory items with filtering, sorting, and pagination
 */
export async function getInventoryItems(
  params: InventoryQueryParams = {}
): Promise<PaginatedInventoryResponse> {
  const {
    searchQuery,
    filters = {},
    sortBy = 'created_at',
    sortDirection = 'desc',
    limit = 20,
    cursor,
  } = params;

  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Build the base query
    let query = supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null); // Only non-deleted items

    // Apply search query
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.condition && filters.condition.length > 0) {
      query = query.in('condition', filters.condition);
    }

    if (filters.category && filters.category.length > 0) {
      query = query.in('category', filters.category);
    }

    if (filters.brand && filters.brand.length > 0) {
      query = query.in('brand', filters.brand);
    }

    if (filters.min_price !== undefined) {
      query = query.gte('target_price', filters.min_price);
    }

    if (filters.max_price !== undefined) {
      query = query.lte('target_price', filters.max_price);
    }

    if (filters.needs_photography !== undefined) {
      query = query.eq('needs_photography', filters.needs_photography);
    }

    if (filters.needs_research !== undefined) {
      query = query.eq('needs_research', filters.needs_research);
    }

    if (filters.is_bundle !== undefined) {
      query = query.eq('is_bundle', filters.is_bundle);
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortDirection === 'asc' });

    // Apply pagination
    if (cursor) {
      // For cursor-based pagination, we need to filter based on the sort field
      if (sortDirection === 'asc') {
        query = query.gt(sortBy, cursor);
      } else {
        query = query.lt(sortBy, cursor);
      }
    }

    // Limit results
    query = query.limit(limit + 1); // Get one extra to check if there are more

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const items = data || [];
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore && resultItems.length > 0
      ? resultItems[resultItems.length - 1][sortBy as keyof InventoryItemRecord] as string
      : undefined;

    return {
      items: resultItems,
      total: count || 0,
      hasMore,
      nextCursor,
    };
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }
}

/**
 * Get a single inventory item by ID
 */
export async function getInventoryItem(id: string): Promise<InventoryItemRecord | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Item not found
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    throw error;
  }
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(
  input: CreateInventoryItemInput
): Promise<InventoryItemRecord> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const itemData = {
      ...input,
      user_id: user.id,
      status: 'draft' as const,
      quantity: input.quantity || 1,
      times_listed: 0,
      views_count: 0,
      favorites_count: 0,
      inquiries_count: 0,
      needs_photography: input.needs_photography || false,
      needs_research: input.needs_research || false,
      is_bundle: input.is_bundle || false,
      photos: input.photos || [],
      videos: input.videos || [],
      documents: input.documents || [],
      tags: input.tags || [],
      ai_extracted_keywords: [],
      bundle_items: input.bundle_items || [],
    };

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
}

/**
 * Update an existing inventory item
 */
export async function updateInventoryItem(
  id: string,
  input: UpdateInventoryItemInput
): Promise<InventoryItemRecord> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
}

/**
 * Soft delete an inventory item
 */
export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('inventory_items')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
}

/**
 * Permanently delete an inventory item
 */
export async function permanentlyDeleteInventoryItem(id: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error permanently deleting inventory item:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted inventory item
 */
export async function restoreInventoryItem(id: string): Promise<InventoryItemRecord> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error restoring inventory item:', error);
    throw error;
  }
}

/**
 * Bulk update multiple inventory items
 */
export async function bulkUpdateInventoryItems(
  itemIds: string[],
  updates: Partial<UpdateInventoryItemInput>
): Promise<InventoryItemRecord[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', itemIds)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select();

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error bulk updating inventory items:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time inventory changes
 * Returns a subscription object with an unsubscribe method
 */
export function subscribeToInventoryChanges(
  userId: string,
  onInsert?: (payload: { new: InventoryItemRecord }) => void,
  onUpdate?: (payload: { old: InventoryItemRecord; new: InventoryItemRecord }) => void,
  onDelete?: (payload: { old: InventoryItemRecord }) => void
) {
  const channel = supabase
    .channel(`inventory_changes_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'inventory_items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onInsert && payload.new) {
          // Type assertion is safe here because Supabase guarantees the shape
          // matches the table schema for insert events
          onInsert({ new: payload.new as InventoryItemRecord });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'inventory_items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onUpdate && payload.old && payload.new) {
          // Type assertion is safe here because Supabase guarantees the shape
          // matches the table schema for update events
          onUpdate({
            old: payload.old as InventoryItemRecord,
            new: payload.new as InventoryItemRecord
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'inventory_items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onDelete && payload.old) {
          // Type assertion is safe here because Supabase guarantees the shape
          // matches the table schema for delete events
          onDelete({ old: payload.old as InventoryItemRecord });
        }
      }
    )
    .subscribe();

  // Return subscription with proper cleanup
  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}