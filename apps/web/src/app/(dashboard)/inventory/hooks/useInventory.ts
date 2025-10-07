"use client";

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../../lib/auth/auth-hooks';
import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restoreInventoryItem,
  bulkUpdateInventoryItems,
  subscribeToInventoryChanges,
  type InventoryQueryParams,
} from '../../../../../lib/supabase-inventory';
import type {
  InventoryItemRecord,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from '@netpost/shared-types';
import { useEffect } from 'react';
type InventoryPage = { items: InventoryItemRecord[]; total: number; nextCursor?: string };


/**
 * Hook for fetching paginated inventory items with infinite scroll
 */
export function useInventory(params: InventoryQueryParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['inventory', user?.id, params],
    queryFn: ({ pageParam }) =>
      getInventoryItems({
        ...params,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Flatten the paginated data
  const items = data?.pages.flatMap((page) => page.items) || [];
  const total = data?.pages[0]?.total || 0;

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToInventoryChanges(
      user.id,
      // On insert
      (payload) => {
        queryClient.setQueryData(['inventory', user.id, params], (oldData: { pages: InventoryPage[]; pageParams: unknown[] } | undefined) => {
          if (!oldData) return oldData;

          // Add new item to the beginning of the first page
          const newPages = [...oldData.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              items: [payload.new, ...newPages[0].items],
              total: newPages[0].total + 1,
            };
          }
          return { ...oldData, pages: newPages };
        });

        // Show notification for new items added via mobile
        if (payload.new.source_type === 'mobile') {
          // TODO: Add toast notification
          console.log('New item added via mobile:', payload.new.title);
        }
      },
      // On update
      (payload) => {
        queryClient.setQueryData(['inventory', user.id, params], (oldData: { pages: InventoryPage[]; pageParams: unknown[] } | undefined) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page: InventoryPage) => ({
            ...page,
            items: page.items.map((item: InventoryItemRecord) =>
              item.id === payload.new.id ? payload.new : item
            ),
          }));
          return { ...oldData, pages: newPages };
        });

        // Invalidate specific item query
        queryClient.invalidateQueries({ queryKey: ['inventory-item', payload.new.id] });
      },
      // On delete (soft delete)
      (payload) => {
        if (payload.old.deleted_at) {
          queryClient.setQueryData(['inventory', user.id, params], (oldData: { pages: InventoryPage[]; pageParams: unknown[] } | undefined) => {
            if (!oldData) return oldData;

            const newPages = oldData.pages.map((page: InventoryPage) => ({
              ...page,
              items: page.items.filter((item: InventoryItemRecord) => item.id !== payload.old.id),
              total: page.total - 1,
            }));
            return { ...oldData, pages: newPages };
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, queryClient, params]);

  return {
    items,
    total,
    loading: status === 'pending',
    error: error as Error | null,
    hasMore: hasNextPage,
    loadingMore: isFetchingNextPage,
    refetching: isFetching && !isFetchingNextPage,
    loadMore: fetchNextPage,
    refetch,
  };
}

/**
 * Hook for fetching a single inventory item
 */
export function useInventoryItem(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => getInventoryItem(id),
    enabled: !!user && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for inventory item mutations (create, update, delete)
 */
export function useInventoryActions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: (input: CreateInventoryItemInput) => createInventoryItem(input),
    onSuccess: (newItem) => {
      // Invalidate inventory queries to refetch
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });

      // Optimistically add the item to cache
      queryClient.setQueryData(['inventory-item', newItem.id], newItem);
    },
    onError: (error) => {
      console.error('Error creating inventory item:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInventoryItemInput }) =>
      updateInventoryItem(id, input),
    onSuccess: (updatedItem) => {
      // Update the item in cache
      queryClient.setQueryData(['inventory-item', updatedItem.id], updatedItem);

      // Invalidate inventory queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating inventory item:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['inventory-item', deletedId] });

      // Invalidate inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
    },
    onError: (error) => {
      console.error('Error deleting inventory item:', error);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreInventoryItem(id),
    onSuccess: (restoredItem) => {
      // Update the item in cache
      queryClient.setQueryData(['inventory-item', restoredItem.id], restoredItem);

      // Invalidate inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
    },
    onError: (error) => {
      console.error('Error restoring inventory item:', error);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ itemIds, updates }: { itemIds: string[]; updates: Partial<UpdateInventoryItemInput> }) =>
      bulkUpdateInventoryItems(itemIds, updates),
    onSuccess: (updatedItems) => {
      // Update each item in cache
      updatedItems.forEach((item) => {
        queryClient.setQueryData(['inventory-item', item.id], item);
      });

      // Invalidate inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
    },
    onError: (error) => {
      console.error('Error bulk updating inventory items:', error);
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    restore: restoreMutation,
    bulkUpdate: bulkUpdateMutation,
  };
}