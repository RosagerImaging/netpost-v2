/**
 * useInventory Hook
 * Manages inventory items data with React Query for caching and state management
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InventoryItem {
  id: string
  title: string
  brand?: string
  category?: string
  photos: string[]
  status: string
  listings: {
    id: string
    marketplace_type: string
    external_listing_id: string
    status: string
    external_url?: string
  }[]
}

interface UseInventoryResult {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useInventory(): UseInventoryResult {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventoryItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch inventory items with their listings
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select(`
          id,
          title,
          brand,
          category,
          photos,
          status,
          listings:marketplace_listings (
            id,
            marketplace_type,
            external_listing_id,
            status,
            external_url
          )
        `)
        .order('created_at', { ascending: false })

      if (inventoryError) {
        throw new Error(inventoryError.message)
      }

      setItems(inventoryData || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory items'
      setError(errorMessage)
      console.error('Error fetching inventory items:', err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await fetchInventoryItems()
  }

  useEffect(() => {
    fetchInventoryItems()
  }, [])

  return {
    items,
    loading,
    error,
    refresh,
  }
}

export default useInventory