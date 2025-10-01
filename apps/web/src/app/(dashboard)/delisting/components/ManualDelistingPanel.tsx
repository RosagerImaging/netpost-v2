/**
 * Manual De-listing Panel Component
 * Provides interface for users to manually delist items on-demand
 */
'use client';

import React, { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@netpost/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Trash2, AlertTriangle, Loader2, Package } from 'lucide-react';

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
    setError(null);
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
    setError(null);
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
    setSelectedMarketplaces(new Set());
  };

  const handleMarketplaceSelection = (marketplace: string, checked: boolean) => {
    setError(null);
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
    setError(null);
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
      const processPromises = jobs.map(async (job) => {
        const response = await fetch('/api/delisting/process-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Failed to process delisting job');
        }
      });

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
      setError(error instanceof Error ? error.message : 'Failed to create delisting jobs');
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
      {error && (
        <Alert variant="destructive" className="glass-card border border-white/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Header */}
      <Card className="glass-card border border-white/10">
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.35em] text-muted-foreground">
            <Trash2 className="h-5 w-5 text-primary" />
            Manual Delisting
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Select items and marketplaces to remove listings instantly once confirmed.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="glass-card border border-white/10">
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Search Items
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by title, brand, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="glass-input">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="glass-card border border-white/10">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sourced">Sourced</SelectItem>
                <SelectItem value="listed">Listed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="marketplace-filter" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Marketplace
            </Label>
            <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
              <SelectTrigger id="marketplace-filter" className="glass-input">
                <SelectValue placeholder="All marketplaces" />
              </SelectTrigger>
              <SelectContent className="glass-card border border-white/10">
                <SelectItem value="all">All Marketplaces</SelectItem>
                <SelectItem value="ebay">eBay</SelectItem>
                <SelectItem value="poshmark">Poshmark</SelectItem>
                <SelectItem value="facebook_marketplace">Facebook Marketplace</SelectItem>
                <SelectItem value="mercari">Mercari</SelectItem>
                <SelectItem value="depop">Depop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Item Selection */}
      <Card className="glass-card border border-white/10">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
              Select Items · {selectedItems.size} selected
            </CardTitle>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => {
                const activeListings = getActiveListingsForItem(item);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'glass-card cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10',
                      selectedItems.has(item.id) && 'border-primary/40 bg-primary/10'
                    )}
                    onClick={() => handleItemSelection(item.id, !selectedItems.has(item.id))}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) =>
                          handleItemSelection(item.id, Boolean(checked))
                        }
                        onClick={(event) => event.stopPropagation()}
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
                            <Badge
                              key={listing.id}
                              variant="secondary"
                              className="glass-card border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em]"
                            >
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
        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
              Select Marketplaces · {selectedMarketplaces.size} selected
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Choose where to remove the selected listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableMarketplaces.length === 0 ? (
              <p className="text-muted-foreground">No active listings found for selected items</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {availableMarketplaces.map((marketplace) => (
                  <div
                    key={marketplace}
                    className={cn(
                      'glass-card cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10',
                      selectedMarketplaces.has(marketplace) && 'border-primary/40 bg-primary/10'
                    )}
                    onClick={() =>
                      handleMarketplaceSelection(marketplace, !selectedMarketplaces.has(marketplace))
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedMarketplaces.has(marketplace)}
                        onCheckedChange={(checked) =>
                          handleMarketplaceSelection(marketplace, Boolean(checked))
                        }
                        onClick={(event) => event.stopPropagation()}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {formatMarketplaceName(marketplace)}
                      </span>
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
        <Card className="glass-card border border-white/10">
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Ready to delist {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} from{' '}
                {selectedMarketplaces.size} marketplace{selectedMarketplaces.size > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                This action will immediately remove the listings and cannot be undone
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="glass-button"
                onClick={() => {
                  setSelectedItems(new Set());
                  setSelectedMarketplaces(new Set());
                }}
              >
                Clear Selection
              </Button>
              <Button
                variant="accent"
                className="glass-button inline-flex items-center gap-2"
                onClick={handleConfirmDelisting}
              >
                <Trash2 className="h-4 w-4" />
                Delist Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open);
          if (!open) {
            setError(null);
          }
        }}
      >
        <DialogContent className="glass-card border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-muted-foreground uppercase tracking-[0.3em]">
              Confirm Manual Delisting
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delist {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} from{' '}
              {selectedMarketplaces.size} marketplace{selectedMarketplaces.size > 1 ? 's' : ''}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Marketplaces</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedMarketplaces).map((marketplace) => (
                  <Badge
                    key={marketplace}
                    variant="secondary"
                    className="glass-card border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em]"
                  >
                    {formatMarketplaceName(marketplace)}
                  </Badge>
                ))}
              </div>
            </div>
            <Alert className="glass-card mt-4 border border-amber-400/40 bg-amber-500/10 text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will immediately remove the listings from the selected marketplaces and cannot be undone.
              </AlertDescription>
            </Alert>
            {error && (
              <Alert variant="destructive" className="glass-card mt-4 border border-white/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="glass-button"
              onClick={() => setShowConfirmDialog(false)}
              disabled={delistingInProgress}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              className="glass-button inline-flex items-center gap-2"
              onClick={executeManualDelisting}
              disabled={delistingInProgress}
            >
              {delistingInProgress && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Delisting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}