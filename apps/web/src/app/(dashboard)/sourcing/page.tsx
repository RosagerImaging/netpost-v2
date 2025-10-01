"use client";

import React, { useState } from "react";
import { DashboardLayout } from "../../../components/layout/dashboard-layout";
import { useAuth } from "../../../lib/auth/auth-context";
import { PageHeader } from "../../../components/ui/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  FormSelect,
  Badge,
} from "@netpost/ui";
import { AddSourcingItemForm } from "../../../components/sourcing/add-sourcing-item-form";
import { Package, TrendingUp, DollarSign, ArrowRight, Lightbulb } from "lucide-react";

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
  const { user } = useAuth();
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [draftItems, setDraftItems] = useState<Partial<SourcingItem>[]>([]);
  const [sortBy, setSortBy] = useState("title");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Mock subscription data
  const subscriptionData = {
    tier: "Free",
    status: "active" as const,
    itemLimit: 10,
    currentItems: items.length,
  };

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
    <DashboardLayout
      user={user?.email ? {
        email: user.email,
        name: user.user_metadata?.name,
        subscription: subscriptionData
      } : undefined}
    >
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-12">
        <PageHeader
          eyebrow="Pipeline"
          title="Sourcing"
          subtitle="Capture opportunities, manage drafts, and move high-potential finds into your inventory."
          icon={<Lightbulb className="h-7 w-7 text-primary" />}
          actions={(
            <AddSourcingItemForm
              onItemSaved={handleItemSaved}
              onDraftSaved={handleDraftSaved}
            />
          )}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="glass-card border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{items.length}</div>
              <p className="text-xs text-muted-foreground">
                {draftItems.length} drafts
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Investment</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${totalInvestment.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                ${totalEstimatedValue.toFixed(2)} estimated value
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Potential Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                ${totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(1) : 0}% margin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="glass-card border border-white/10">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
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
            <Badge variant="secondary" className="glass-card border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em]">
              {filteredItems.length} Items
            </Badge>
          </CardContent>
        </Card>

        {/* Draft Items Section */}
        {draftItems.length > 0 && (
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Draft Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {draftItems.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="glass-card rounded-lg border border-white/10 bg-white/5 p-4"
                    data-testid="draft-item"
                  >
                    <h4 className="font-medium text-foreground">
                      {item.title || "Untitled Draft"}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.category && `Category: ${item.category}`}
                    </p>
                    {item.purchasePrice && (
                      <p className="text-sm text-muted-foreground">
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
        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-muted-foreground">
              <span>Sourcing Items</span>
              <Badge variant="secondary" className="glass-card border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                {filteredItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  No items yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start by adding your first sourcing item
                </p>
                <AddSourcingItemForm
                  onItemSaved={handleItemSaved}
                  onDraftSaved={handleDraftSaved}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="glass-card relative border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">{item.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="glass-card border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.25em] text-primary">
                          {item.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Purchase Price:</span>
                          <span className="font-medium text-foreground">
                            ${Number(item.purchasePrice).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Value:</span>
                          <span className="font-medium text-foreground">
                            ${Number(item.estimatedValue).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                          <span className="text-accent">Potential Profit:</span>
                          <span className="font-medium text-accent">
                            ${(Number(item.estimatedValue) - Number(item.purchasePrice)).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {item.conditionNotes && (
                        <div className="rounded border border-white/10 bg-white/5 p-2 text-xs text-muted-foreground">
                          <strong>Condition:</strong> {item.conditionNotes}
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="glass-button mt-4 w-full"
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
    </DashboardLayout>
  );
}