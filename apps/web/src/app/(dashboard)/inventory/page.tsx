"use client";

import React, { useState } from "react";
import { DashboardLayout } from "../../../components/layout/dashboard-layout";
import { useAuth } from "../../../../lib/auth/auth-hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  FormSelect,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
} from "@netpost/ui";
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Grid3X3,
  List,
} from "lucide-react";

interface InventoryItem {
  id: string;
  title: string;
  category: string;
  purchasePrice: number;
  estimatedValue: number;
  condition: string;
  status: "active" | "listed" | "sold";
  dateAdded: Date;
  images?: string[];
}

type ViewMode = 'grid' | 'list';

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("title");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Mock subscription data
  const subscriptionData = {
    tier: "Free",
    itemLimit: 10,
    currentItems: items.length,
  };

  const categoryOptions = [
    { value: "All", label: "All Categories" },
    { value: "Electronics", label: "Electronics" },
    { value: "Fashion", label: "Fashion" },
    { value: "Jewelry", label: "Jewelry" },
    { value: "Collectibles", label: "Collectibles" },
    { value: "Home & Garden", label: "Home & Garden" },
    { value: "Sports", label: "Sports" },
    { value: "Books", label: "Books" },
    { value: "Other", label: "Other" },
  ];

  const sortOptions = [
    { value: "title", label: "Title" },
    { value: "value", label: "Estimated Value" },
    { value: "profit", label: "Potential Profit" },
    { value: "date", label: "Date Added" },
  ];

  const filteredItems = items
    .filter(item => categoryFilter === "All" || item.category === categoryFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "value":
          return b.estimatedValue - a.estimatedValue;
        case "profit":
          const profitA = a.estimatedValue - a.purchasePrice;
          const profitB = b.estimatedValue - b.purchasePrice;
          return profitB - profitA;
        case "date":
          return b.dateAdded.getTime() - a.dateAdded.getTime();
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
  const totalInvestment = items.reduce((sum, item) => sum + item.purchasePrice, 0);
  const potentialProfit = totalValue - totalInvestment;

  return (
    <DashboardLayout
      user={user ? {
        ...user,
        subscription: subscriptionData
      } : undefined}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-text">
              Inventory
            </h1>
            <p className="text-secondary-text mt-2">
              Manage your sourced items and track their status
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="bg-white/5 rounded-lg p-1 border border-white/10">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button data-testid="add-item-button" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Inventory Limit Display */}
        <Card className="border-primary-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-text">Inventory Usage</p>
                <p className="text-lg font-semibold text-primary-text" data-testid="inventory-limit-display">
                  {subscriptionData.currentItems} / {subscriptionData.itemLimit} items
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-secondary-text">Plan</p>
                <p className="text-lg font-semibold text-primary-text">
                  {subscriptionData.tier}
                </p>
              </div>
            </div>
            <div className="mt-3 bg-white/10 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(subscriptionData.currentItems / subscriptionData.itemLimit) * 100}%`
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-primary-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-text">{items.length}</div>
              <p className="text-xs text-secondary-text">
                {subscriptionData.itemLimit - items.length} slots available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <Package className="h-4 w-4 text-primary-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-text">
                ${totalInvestment.toFixed(2)}
              </div>
              <p className="text-xs text-secondary-text">
                ${totalValue.toFixed(2)} estimated value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
              <Package className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400" data-testid="potential-profit">
                ${potentialProfit.toFixed(2)}
              </div>
              <p className="text-xs text-secondary-text">
                {totalInvestment > 0 ? ((potentialProfit / totalInvestment) * 100).toFixed(1) : 0}% margin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <FormSelect
            placeholder="Filter by category"
            testId="category-filter"
            options={categoryOptions}
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            className="w-full sm:w-48"
          />

          <FormSelect
            placeholder="Sort by"
            testId="sort-by-value"
            options={sortOptions}
            value={sortBy}
            onValueChange={setSortBy}
            className="w-full sm:w-48"
          />
        </div>

        {/* Items Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Items ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-secondary-text mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary-text mb-2">
                  No items in inventory
                </h3>
                <p className="text-secondary-text mb-4">
                  Start by adding items from your sourcing workflow
                </p>
                <Button data-testid="add-item-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="relative cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleItemClick(item)}
                    data-testid="inventory-item"
                  >
                    {viewMode === 'grid' ? (
                      // Grid View
                      <>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg" data-testid="item-title-display">
                                {item.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 text-xs bg-primary-500/20 text-primary-500 rounded-full">
                                  {item.category}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  item.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                  item.status === 'listed' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-secondary-text">Purchase Price:</span>
                              <span className="text-primary-text font-medium" data-testid="purchase-price-display">
                                ${item.purchasePrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-secondary-text">Estimated Value:</span>
                              <span className="text-primary-text font-medium" data-testid="estimated-value-display">
                                ${item.estimatedValue.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                              <span className="text-green-400">Potential Profit:</span>
                              <span className="text-green-400 font-medium">
                                ${(item.estimatedValue - item.purchasePrice).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-secondary-text">
                            <strong>Condition:</strong> {item.condition}
                          </div>

                          <div className="text-xs text-secondary-text">
                            Added: {item.dateAdded.toLocaleDateString()}
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      // List View
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-primary-text" data-testid="item-title-display">
                              {item.title}
                            </h3>
                            <p className="text-sm text-secondary-text">{item.category}</p>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="text-secondary-text">Purchase</p>
                              <p className="font-medium" data-testid="purchase-price-display">
                                ${item.purchasePrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-secondary-text">Estimated</p>
                              <p className="font-medium" data-testid="estimated-value-display">
                                ${item.estimatedValue.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-secondary-text">Profit</p>
                              <p className="font-medium text-green-400">
                                ${(item.estimatedValue - item.purchasePrice).toFixed(2)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Item Detail Modal */}
      <Modal open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <ModalContent className="max-w-2xl" data-testid="item-detail-modal">
          <ModalHeader>
            <ModalTitle data-testid="item-title-display">
              {selectedItem?.title}
            </ModalTitle>
            <ModalClose data-testid="close-item-modal" />
          </ModalHeader>

          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-secondary-text">Category</label>
                  <p className="text-primary-text">{selectedItem.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-text">Status</label>
                  <p className="text-primary-text capitalize">{selectedItem.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-secondary-text">Purchase Price</label>
                  <p className="text-primary-text font-semibold" data-testid="purchase-price-display">
                    ${selectedItem.purchasePrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-text">Estimated Value</label>
                  <p className="text-primary-text font-semibold" data-testid="estimated-value-display">
                    ${selectedItem.estimatedValue.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-text">Potential Profit</label>
                <p className="text-green-400 font-semibold text-lg">
                  ${(selectedItem.estimatedValue - selectedItem.purchasePrice).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-text">Condition</label>
                <p className="text-primary-text">{selectedItem.condition}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-text">Date Added</label>
                <p className="text-primary-text">{selectedItem.dateAdded.toLocaleDateString()}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}