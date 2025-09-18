"use client";

import { useState } from "react";
import { InventoryGrid } from "./components/InventoryGrid";
import { SearchFilters } from "./components/SearchFilters";
import { Button } from "@netpost/ui";
import { PlusIcon, Squares2X2Icon as GridIcon, ListBulletIcon as ListIcon } from "@heroicons/react/24/outline";

type ViewMode = 'grid' | 'list';

export default function InventoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  return (
    <div className="from-background via-background/95 to-background/90 min-h-screen bg-gradient-to-br">
      {/* Header */}
      <header className="border-border/40 bg-background/80 border-b backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-primary text-2xl font-bold">Inventory</h1>
            <p className="text-muted-foreground text-sm">
              Manage your sourced items and track their status
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="bg-muted/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <GridIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Add New Item Button */}
            <Button className="flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
          />
        </div>

        {/* Inventory Grid/List */}
        <InventoryGrid
          viewMode={viewMode}
          searchQuery={searchQuery}
          filters={filters}
          sortBy={sortBy}
          sortDirection={sortDirection}
        />
      </main>
    </div>
  );
}