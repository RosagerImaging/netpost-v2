"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@netpost/ui";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  type InventoryItemStatus,
  type InventoryItemCondition,
  getInventoryStatusDisplayName,
  getConditionDisplayName,
} from "@netpost/shared-types";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
}

export function SearchFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
}: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedQuery, onSearchChange]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''
    ).length;
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setDebouncedQuery('');
  };

  const sortOptions = [
    { value: 'created_at', label: 'Date Added' },
    { value: 'updated_at', label: 'Last Modified' },
    { value: 'title', label: 'Title' },
    { value: 'brand', label: 'Brand' },
    { value: 'target_price', label: 'Target Price' },
    { value: 'purchase_price', label: 'Purchase Price' },
    { value: 'days_in_inventory', label: 'Days in Inventory' },
    { value: 'status', label: 'Status' },
    { value: 'condition', label: 'Condition' },
  ];

  const statusOptions: InventoryItemStatus[] = [
    'draft',
    'available',
    'listed',
    'sold',
    'reserved',
    'returned',
    'damaged',
    'donated',
    'archived',
  ];

  const conditionOptions: InventoryItemCondition[] = [
    'new_with_tags',
    'new_without_tags',
    'like_new',
    'excellent',
    'good',
    'fair',
    'poor',
    'for_parts',
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar and Controls */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="text-muted-foreground h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search items by title, description, brand, or tags..."
            value={debouncedQuery}
            onChange={(e) => setDebouncedQuery(e.target.value)}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded-lg border py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2"
          />
        </div>

        {/* Sort Control */}
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="border-input bg-background text-foreground focus:border-ring focus:ring-ring rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="px-3"
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2"
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
              {activeFilterCount}
            </span>
          )}
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>

        {/* Clear Filters */}
        {(activeFilterCount > 0 || debouncedQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center space-x-1"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-card/50 border-border/40 space-y-4 rounded-lg border p-4 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Status Filter */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Status
              </label>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status) || false}
                      onChange={(e) => {
                        const currentStatus = filters.status || [];
                        if (e.target.checked) {
                          handleFilterChange('status', [...currentStatus, status]);
                        } else {
                          handleFilterChange('status', currentStatus.filter((s: string) => s !== status));
                        }
                      }}
                      className="text-primary focus:ring-primary rounded border-gray-300"
                    />
                    <span className="text-sm">{getInventoryStatusDisplayName(status)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Condition
              </label>
              <div className="space-y-2">
                {conditionOptions.map((condition) => (
                  <label key={condition} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.condition?.includes(condition) || false}
                      onChange={(e) => {
                        const currentCondition = filters.condition || [];
                        if (e.target.checked) {
                          handleFilterChange('condition', [...currentCondition, condition]);
                        } else {
                          handleFilterChange('condition', currentCondition.filter((c: string) => c !== condition));
                        }
                      }}
                      className="text-primary focus:ring-primary rounded border-gray-300"
                    />
                    <span className="text-sm">{getConditionDisplayName(condition)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Price Range
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min price"
                  value={filters.min_price || ''}
                  onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                />
                <input
                  type="number"
                  placeholder="Max price"
                  value={filters.max_price || ''}
                  onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Category
              </label>
              <input
                type="text"
                placeholder="Enter category"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Brand
              </label>
              <input
                type="text"
                placeholder="Enter brand"
                value={filters.brand || ''}
                onChange={(e) => handleFilterChange('brand', e.target.value || undefined)}
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              />
            </div>

            {/* Special Flags */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Special Flags
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.needs_photography || false}
                    onChange={(e) => handleFilterChange('needs_photography', e.target.checked || undefined)}
                    className="text-primary focus:ring-primary rounded border-gray-300"
                  />
                  <span className="text-sm">Needs Photography</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.needs_research || false}
                    onChange={(e) => handleFilterChange('needs_research', e.target.checked || undefined)}
                    className="text-primary focus:ring-primary rounded border-gray-300"
                  />
                  <span className="text-sm">Needs Research</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.is_bundle || false}
                    onChange={(e) => handleFilterChange('is_bundle', e.target.checked || undefined)}
                    className="text-primary focus:ring-primary rounded border-gray-300"
                  />
                  <span className="text-sm">Bundle Items</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}