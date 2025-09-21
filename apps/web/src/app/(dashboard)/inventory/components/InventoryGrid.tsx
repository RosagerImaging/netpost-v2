"use client";

import React from "react";
import { InventoryItem } from "./InventoryItem";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { useInventory } from "../hooks/useInventory";
import type { InventoryItemRecord } from "@netpost/shared-types";

interface InventoryGridProps {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  filters: Record<string, unknown>;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export function InventoryGrid({
  viewMode,
  searchQuery,
  filters,
  sortBy,
  sortDirection,
}: InventoryGridProps) {
  const {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refetch
  } = useInventory({
    searchQuery,
    filters,
    sortBy,
    sortDirection,
  });

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border-destructive text-destructive rounded-lg border p-6">
        <h3 className="mb-2 font-semibold">Error loading inventory</h3>
        <p className="mb-4 text-sm">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded px-4 py-2 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState searchQuery={searchQuery} filters={filters} />;
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>
          {items.length} item{items.length !== 1 ? 's' : ''} found
        </span>
        {hasMore && (
          <span>Loading more items...</span>
        )}
      </div>

      {/* Grid/List View */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-4'
        }
      >
        {items.map((item) => (
          <InventoryItem
            key={item.id}
            item={item}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={() => loadMore()}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 rounded-lg px-6 py-2 text-sm transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}