import { supabase } from './supabase';
import { SourcingItem, CreateSourcingItemRequest } from '@/types/sourcing';

export class SourcingService {
  /**
   * Create a new sourcing item
   */
  static async createItem(itemData: CreateSourcingItemRequest): Promise<SourcingItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const newItem = {
      title: itemData.title,
      description: itemData.description || null,
      location: itemData.location,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sourcing_items')
      .insert([newItem])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all sourcing items for the current user
   */
  static async getUserItems(): Promise<SourcingItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sourcing_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Upload item photo to Supabase storage
   */
  static async uploadPhoto(photoUri: string, itemId: string): Promise<string> {
    try {
      // Convert photo URI to blob
      const response = await fetch(photoUri);
      const blob = await response.blob();

      const filename = `${itemId}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('sourcing-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sourcing-photos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Update sourcing item with photo URL
   */
  static async updateItemWithPhoto(itemId: string, photoUrl: string): Promise<SourcingItem> {
    const { data, error } = await supabase
      .from('sourcing_items')
      .update({
        photo_url: photoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to real-time changes for sourcing items
   */
  static subscribeToUserItems(
    userId: string,
    onInsert?: (item: SourcingItem) => void,
    onUpdate?: (item: SourcingItem) => void,
    onDelete?: (item: SourcingItem) => void
  ) {
    return supabase
      .channel('sourcing_items_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sourcing_items',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (onInsert) onInsert(payload.new as SourcingItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sourcing_items',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (onUpdate) onUpdate(payload.new as SourcingItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sourcing_items',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (onDelete) onDelete(payload.old as SourcingItem);
        }
      )
      .subscribe();
  }
}