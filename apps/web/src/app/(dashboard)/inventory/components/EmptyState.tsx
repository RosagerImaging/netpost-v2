"use client";

import { Button } from "@netpost/ui";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  searchQuery?: string;
  filters?: Record<string, unknown>;
}

export function EmptyState({ searchQuery, filters }: EmptyStateProps) {
  const hasActiveFilters = searchQuery || Object.keys(filters || {}).length > 0;

  if (hasActiveFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-muted-foreground mb-4">
          <MagnifyingGlassIcon className="h-16 w-16" />
        </div>
        <h3 className="text-foreground mb-2 text-lg font-semibold">No items found</h3>
        <p className="text-muted-foreground mb-6 max-w-md text-center">
          No inventory items match your current search and filter criteria. Try adjusting your filters or search terms.
        </p>
        <Button variant="outline">Clear Filters</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-muted-foreground mb-4">
        <svg
          className="h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h3 className="text-foreground mb-2 text-lg font-semibold">Your inventory is empty</h3>
      <p className="text-muted-foreground mb-6 max-w-md text-center">
        Start building your inventory by adding items you've sourced. You can add items manually or use the mobile app to capture photos and details on the go.
      </p>
      <div className="flex space-x-3">
        <Button className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Your First Item</span>
        </Button>
        <Button variant="outline">Learn More</Button>
      </div>
    </div>
  );
}