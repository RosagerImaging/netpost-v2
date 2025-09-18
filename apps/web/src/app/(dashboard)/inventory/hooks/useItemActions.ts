"use client";

import { useState } from 'react';
import { useInventoryActions } from './useInventory';
import type {
  InventoryItemRecord,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from '@netpost/shared-types';

/**
 * Hook for managing item actions with UI state
 */
export function useItemActions() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const actions = useInventoryActions();

  const setItemLoading = (itemId: string, isLoading: boolean) => {
    setLoading(prev => ({
      ...prev,
      [itemId]: isLoading,
    }));
  };

  const setItemError = (itemId: string, error?: string) => {
    setErrors(prev => ({
      ...prev,
      [itemId]: error || '',
    }));
  };

  const createItem = async (input: CreateInventoryItemInput): Promise<InventoryItemRecord | null> => {
    const tempId = 'temp-create';
    setItemLoading(tempId, true);
    setItemError(tempId);

    try {
      const result = await actions.create.mutateAsync(input);
      setItemLoading(tempId, false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
      setItemError(tempId, errorMessage);
      setItemLoading(tempId, false);
      throw error;
    }
  };

  const updateItem = async (
    id: string,
    input: UpdateInventoryItemInput
  ): Promise<InventoryItemRecord | null> => {
    setItemLoading(id, true);
    setItemError(id);

    try {
      const result = await actions.update.mutateAsync({ id, input });
      setItemLoading(id, false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      setItemError(id, errorMessage);
      setItemLoading(id, false);
      throw error;
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    setItemLoading(id, true);
    setItemError(id);

    try {
      await actions.delete.mutateAsync(id);
      setItemLoading(id, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      setItemError(id, errorMessage);
      setItemLoading(id, false);
      throw error;
    }
  };

  const restoreItem = async (id: string): Promise<InventoryItemRecord | null> => {
    setItemLoading(id, true);
    setItemError(id);

    try {
      const result = await actions.restore.mutateAsync(id);
      setItemLoading(id, false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore item';
      setItemError(id, errorMessage);
      setItemLoading(id, false);
      throw error;
    }
  };

  const bulkUpdateItems = async (
    itemIds: string[],
    updates: Partial<UpdateInventoryItemInput>
  ): Promise<InventoryItemRecord[]> => {
    const bulkId = 'bulk-update';
    setItemLoading(bulkId, true);
    setItemError(bulkId);

    try {
      const result = await actions.bulkUpdate.mutateAsync({ itemIds, updates });
      setItemLoading(bulkId, false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update items';
      setItemError(bulkId, errorMessage);
      setItemLoading(bulkId, false);
      throw error;
    }
  };

  const isItemLoading = (itemId: string): boolean => {
    return loading[itemId] || false;
  };

  const getItemError = (itemId: string): string | undefined => {
    return errors[itemId];
  };

  const clearItemError = (itemId: string): void => {
    setItemError(itemId);
  };

  return {
    createItem,
    updateItem,
    deleteItem,
    restoreItem,
    bulkUpdateItems,
    isItemLoading,
    getItemError,
    clearItemError,
    // Direct access to mutation states for more granular control
    isCreating: actions.create.isPending,
    isUpdating: actions.update.isPending,
    isDeleting: actions.delete.isPending,
    isRestoring: actions.restore.isPending,
    isBulkUpdating: actions.bulkUpdate.isPending,
  };
}