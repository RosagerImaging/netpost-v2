"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  FormSelect,
} from "@netpost/ui";
import { AddSourcingItemForm } from "../../../components/sourcing/add-sourcing-item-form";
import { Package, TrendingUp, DollarSign, ArrowRight } from "lucide-react";

interface SourcingItem {
  id?: string;
  title: string;
  description?: string;
  category: string;
  purchasePrice: string;
  estimatedValue: string;
  conditionNotes?: string;
  status?: "draft" | "active";
}

export default function SourcingPage() {
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [draftItems, setDraftItems] = useState<Partial<SourcingItem>[]>([]);
  const [sortBy, setSortBy] = useState("title");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const handleItemSaved = (item: SourcingItem) => {
    setItems(prev => [...prev, { ...item, status: "active" }]);
  };

  const handleDraftSaved = (item: Partial<SourcingItem>) => {
    setDraftItems(prev => [...prev, { ...item, id: `draft-${Date.now()}`, status: "draft" }]);
  };

  const handleMoveToInventory = (itemId: string) => {
    // This would normally move the item to inventory
    setItems(prev => prev.filter(item => item.id !== itemId));
    // Show success toast
  };

  const filteredItems = items
    .filter(item => categoryFilter === "All" || item.category === categoryFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "value":
          return Number(b.estimatedValue) - Number(a.estimatedValue);
        case "profit":
          const profitA = Number(a.estimatedValue) - Number(a.purchasePrice);
          const profitB = Number(b.estimatedValue) - Number(b.purchasePrice);
          return profitB - profitA;
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const totalInvestment = items.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);
  const totalEstimatedValue = items.reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0);
  const totalProfit = totalEstimatedValue - totalInvestment;

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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-text" data-testid="sourcing-header">
              Sourcing
            </h1>
            <p className="text-secondary-text mt-2">
              Track and manage potential inventory items
            </p>
          </div>
          <AddSourcingItemForm
            onItemSaved={handleItemSaved}
            onDraftSaved={handleDraftSaved}
          />
        </div>

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
                {draftItems.length} drafts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <DollarSign className="h-4 w-4 text-primary-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-text">
                ${totalInvestment.toFixed(2)}
              </div>
              <p className="text-xs text-secondary-text">
                ${totalEstimatedValue.toFixed(2)} estimated value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                ${totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-secondary-text">
                {totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(1) : 0}% margin
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

        {/* Draft Items Section */}
        {draftItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Draft Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftItems.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-4 border border-white/10 rounded-lg bg-white/5"
                    data-testid="draft-item"
                  >
                    <h4 className="font-medium text-primary-text">
                      {item.title || "Untitled Draft"}
                    </h4>
                    <p className="text-sm text-secondary-text mt-1">
                      {item.category && `Category: ${item.category}`}
                    </p>
                    {item.purchasePrice && (
                      <p className="text-sm text-secondary-text">
                        Purchase Price: ${item.purchasePrice}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Sourcing Items ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-secondary-text mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary-text mb-2">
                  No items yet
                </h3>
                <p className="text-secondary-text mb-4">
                  Start by adding your first sourcing item
                </p>
                <AddSourcingItemForm
                  onItemSaved={handleItemSaved}
                  onDraftSaved={handleDraftSaved}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="relative">
                    <CardHeader>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-primary-500/20 text-primary-500 rounded-full">
                          {item.category}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {item.description && (
                        <p className="text-sm text-secondary-text">
                          {item.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-text">Purchase Price:</span>
                          <span className="text-primary-text font-medium">
                            ${Number(item.purchasePrice).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary-text">Estimated Value:</span>
                          <span className="text-primary-text font-medium">
                            ${Number(item.estimatedValue).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                          <span className="text-green-400">Potential Profit:</span>
                          <span className="text-green-400 font-medium">
                            ${(Number(item.estimatedValue) - Number(item.purchasePrice)).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {item.conditionNotes && (
                        <div className="text-xs text-secondary-text bg-white/5 p-2 rounded">
                          <strong>Condition:</strong> {item.conditionNotes}
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => handleMoveToInventory(item.id!)}
                        data-testid="move-to-inventory"
                      >
                        Move to Inventory
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}