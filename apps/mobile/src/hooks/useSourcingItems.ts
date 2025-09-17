import { useState, useEffect } from 'react';
import { SourcingItem } from '@/types/sourcing';
import { SourcingService } from '@/services/sourcingService';
import { useAuth } from './useAuth';

export function useSourcingItems() {
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load initial items
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    loadItems();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = SourcingService.subscribeToUserItems(
      user.id,
      // On insert
      (newItem) => {
        setItems(prev => [newItem, ...prev]);
      },
      // On update
      (updatedItem) => {
        setItems(prev => prev.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        ));
      },
      // On delete
      (deletedItem) => {
        setItems(prev => prev.filter(item => item.id !== deletedItem.id));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const userItems = await SourcingService.getUserItems();
      setItems(userItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (itemData: {
    title: string;
    description?: string;
    location: string;
    photoUri?: string;
  }) => {
    try {
      const newItem = await SourcingService.createItem(itemData);

      // If there's a photo, upload it
      if (itemData.photoUri) {
        const photoUrl = await SourcingService.uploadPhoto(itemData.photoUri, newItem.id);
        // Update item with photo URL in database
        const updatedItem = await SourcingService.updateItemWithPhoto(newItem.id, photoUrl);
        return updatedItem;
      }

      // Item will be added to state via real-time subscription
      return newItem;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const refreshItems = () => {
    loadItems();
  };

  return {
    items,
    loading,
    error,
    addItem,
    refreshItems,
  };
}