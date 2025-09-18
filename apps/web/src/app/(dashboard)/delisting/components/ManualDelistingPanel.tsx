/**
 * Manual De-listing Panel Component
 * Provides interface for users to manually delist items on-demand
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Package,
  ExternalLink
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useInventory } from '@/lib/hooks/useInventory';

interface InventoryItem {
  id: string;
  title: string;
  brand?: string;
  category?: string;
  photos: string[];
  status: string;
  listings: {
    id: string;
    marketplace_type: string;
    external_listing_id: string;
    status: string;
    external_url?: string;
  }[];
}

interface ManualDelistingPanelProps {
  onJobCreated?: () => void;
}

export function ManualDelistingPanel({ onJobCreated }: ManualDelistingPanelProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [delistingInProgress, setDelistingInProgress] = useState(false);

  const {
    items: allItems,
    loading: itemsLoading,
    error: itemsError,
    refresh: refreshItems,
  } = useInventory();

  // Filter items with active listings
  const itemsWithActiveListings = allItems.filter(item =>
    item.listings && item.listings.some(listing =>
      listing.status === 'active' || listing.status === 'pending'
    )
  );

  // Apply filters
  const filteredItems = itemsWithActiveListings.filter(item => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !item.title.toLowerCase().includes(query) &&
        !item.brand?.toLowerCase().includes(query) &&
        !item.category?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    // Marketplace filter
    if (marketplaceFilter !== 'all') {
      const hasMarketplace = item.listings.some(listing =>
        listing.marketplace_type === marketplaceFilter &&
        (listing.status === 'active' || listing.status === 'pending')
      );
      if (!hasMarketplace) {
        return false;
      }
    }

    return true;
  });

  // Get available marketplaces from selected items
  const availableMarketplaces = Array.from(
    new Set(
      filteredItems
        .filter(item => selectedItems.has(item.id))
        .flatMap(item =>
          item.listings
            .filter(listing => listing.status === 'active' || listing.status === 'pending')
            .map(listing => listing.marketplace_type)
        )
    )
  );

  const handleItemSelection = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);

    // Reset marketplace selection when items change
    setSelectedMarketplaces(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
    setSelectedMarketplaces(new Set());
  };

  const handleMarketplaceSelection = (marketplace: string, checked: boolean) => {
    const newSelected = new Set(selectedMarketplaces);
    if (checked) {
      newSelected.add(marketplace);
    } else {
      newSelected.delete(marketplace);
    }
    setSelectedMarketplaces(newSelected);
  };

  const handleConfirmDelisting = () => {
    if (selectedItems.size === 0 || selectedMarketplaces.size === 0) {
      setError('Please select items and marketplaces to delist from');
      return;
    }
    setShowConfirmDialog(true);
  };

  const executeManualDelisting = async () => {
    setDelistingInProgress(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create manual delisting jobs for each selected item
      const jobPromises = Array.from(selectedItems).map(async (itemId) => {
        const { data, error } = await supabase
          .from('delisting_jobs')
          .insert({
            inventory_item_id: itemId,
            trigger_type: 'manual',
            marketplaces_targeted: Array.from(selectedMarketplaces),
            scheduled_for: new Date().toISOString(),
            requires_user_confirmation: false,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      const jobs = await Promise.all(jobPromises);

      // Trigger immediate processing of jobs
      const processPromises = jobs.map(job =>
        fetch('/api/delisting/process-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id }),
        })
      );

      await Promise.all(processPromises);

      // Reset state
      setSelectedItems(new Set());
      setSelectedMarketplaces(new Set());
      setShowConfirmDialog(false);

      // Refresh data
      await refreshItems();
      onJobCreated?.();

    } catch (error) {
      console.error('Error executing manual delisting:', error);
      setError(error.message || 'Failed to create delisting jobs');
    } finally {
      setDelistingInProgress(false);
    }
  };

  const formatMarketplaceName = (marketplace: string) => {
    const names: Record<string, string> = {
      'ebay': 'eBay',
      'poshmark': 'Poshmark',
      'facebook_marketplace': 'Facebook Marketplace',
      'mercari': 'Mercari',
      'depop': 'Depop',
    };
    return names[marketplace] || marketplace;
  };

  const getActiveListingsForItem = (item: InventoryItem) => {
    return item.listings.filter(listing =>
      listing.status === 'active' || listing.status === 'pending'
    );
  };

  if (itemsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load inventory items: {itemsError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Manual De-listing
          </CardTitle>
          <CardDescription>
            Select items and marketplaces to delist manually. This will immediately remove listings from the selected marketplaces.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, brand, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sourced">Sourced</SelectItem>
                  <SelectItem value="listed">Listed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label htmlFor="marketplace-filter">Marketplace</Label>
              <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All marketplaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marketplaces</SelectItem>
                  <SelectItem value="ebay">eBay</SelectItem>
                  <SelectItem value="poshmark">Poshmark</SelectItem>
                  <SelectItem value="facebook_marketplace">Facebook Marketplace</SelectItem>
                  <SelectItem value="mercari">Mercari</SelectItem>
                  <SelectItem value="depop">Depop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Select Items ({selectedItems.size} selected)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all">Select All</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items found with active listings</p>
              <p className="text-sm">Try adjusting your search filters or create some listings first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const activeListings = getActiveListingsForItem(item);
                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedItems.has(item.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleItemSelection(item.id, !selectedItems.has(item.id))}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onChange={() => {}} // Handled by parent click
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        {item.photos[0] && (
                          <img
                            src={item.photos[0]}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded mb-2"
                          />
                        )}
                        <h4 className="font-medium text-sm truncate">{item.title}</h4>
                        {item.brand && (
                          <p className="text-xs text-muted-foreground">{item.brand}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {activeListings.map((listing) => (
                            <Badge key={listing.id} variant="outline" className="text-xs">
                              {formatMarketplaceName(listing.marketplace_type)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marketplace Selection */}
      {selectedItems.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Select Marketplaces to Delist From ({selectedMarketplaces.size} selected)
            </CardTitle>
            <CardDescription>
              Choose which marketplaces to remove the selected items from
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableMarketplaces.length === 0 ? (
              <p className="text-muted-foreground">No active listings found for selected items</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableMarketplaces.map((marketplace) => (
                  <div
                    key={marketplace}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedMarketplaces.has(marketplace)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() =>
                      handleMarketplaceSelection(marketplace, !selectedMarketplaces.has(marketplace))
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedMarketplaces.has(marketplace)}
                        onChange={() => {}} // Handled by parent click
                      />
                      <span className="font-medium">{formatMarketplaceName(marketplace)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedItems.size > 0 && selectedMarketplaces.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Ready to delist {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} from{' '}
                  {selectedMarketplaces.size} marketplace{selectedMarketplaces.size > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  This action will immediately remove the listings and cannot be undone
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedItems(new Set());
                    setSelectedMarketplaces(new Set());
                  }}
                >
                  Clear Selection
                </Button>
                <Button onClick={handleConfirmDelisting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delist Items
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Manual De-listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delist {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} from{' '}
              {selectedMarketplaces.size} marketplace{selectedMarketplaces.size > 1 ? 's' : ''}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="font-medium">Marketplaces:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedMarketplaces).map((marketplace) => (
                  <Badge key={marketplace} variant="outline">
                    {formatMarketplaceName(marketplace)}
                  </Badge>
                ))}
              </div>
            </div>
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will immediately remove the listings from the selected marketplaces and cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={delistingInProgress}>
              Cancel
            </Button>
            <Button onClick={executeManualDelisting} disabled={delistingInProgress}>
              {delistingInProgress && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Delisting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}