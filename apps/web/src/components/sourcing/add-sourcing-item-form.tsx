"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  FormField,
  FormSelect,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  Toast,
  ToastProvider,
  ToastViewport,
} from "@netpost/ui";
import { Plus, Save, X } from "lucide-react";

interface SourcingItem {
  id?: string;
  title: string;
  description?: string;
  category: string;
  purchasePrice: string;
  estimatedValue: string;
  conditionNotes?: string;
}

interface AddSourcingItemFormProps {
  onItemSaved?: (item: SourcingItem) => void;
  onDraftSaved?: (item: Partial<SourcingItem>) => void;
}

const categoryOptions = [
  { value: "Electronics", label: "Electronics" },
  { value: "Fashion", label: "Fashion" },
  { value: "Jewelry", label: "Jewelry" },
  { value: "Collectibles", label: "Collectibles" },
  { value: "Home & Garden", label: "Home & Garden" },
  { value: "Sports", label: "Sports" },
  { value: "Books", label: "Books" },
  { value: "Other", label: "Other" },
];

export function AddSourcingItemForm({ onItemSaved, onDraftSaved }: AddSourcingItemFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const [formData, setFormData] = useState<Partial<SourcingItem>>({
    title: "",
    description: "",
    category: "",
    purchasePrice: "",
    estimatedValue: "",
    conditionNotes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Item title is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.purchasePrice?.trim()) {
      newErrors.purchasePrice = "Purchase price is required";
    } else if (isNaN(Number(formData.purchasePrice)) || Number(formData.purchasePrice) < 0) {
      newErrors.purchasePrice = "Please enter a valid price";
    }

    if (!formData.estimatedValue?.trim()) {
      newErrors.estimatedValue = "Estimated value is required";
    } else if (isNaN(Number(formData.estimatedValue)) || Number(formData.estimatedValue) < 0) {
      newErrors.estimatedValue = "Please enter a valid estimated value";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setToastMessage("Please fix the validation errors");
      setToastType("error");
      setShowToast(true);
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newItem: SourcingItem = {
        id: `item-${Date.now()}`,
        title: formData.title!,
        description: formData.description || "",
        category: formData.category!,
        purchasePrice: formData.purchasePrice!,
        estimatedValue: formData.estimatedValue!,
        conditionNotes: formData.conditionNotes || "",
      };

      onItemSaved?.(newItem);

      setToastMessage("Item saved successfully!");
      setToastType("success");
      setShowToast(true);

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        purchasePrice: "",
        estimatedValue: "",
        conditionNotes: "",
      });
      setErrors({});
      setIsOpen(false);
    } catch (error) {
      setToastMessage("Failed to save item");
      setToastType("error");
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      onDraftSaved?.(formData);

      setToastMessage("Draft saved successfully!");
      setToastType("success");
      setShowToast(true);
      setIsOpen(false);
    } catch (error) {
      setToastMessage("Failed to save draft");
      setToastType("error");
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const calculateProfit = () => {
    const purchase = Number(formData.purchasePrice) || 0;
    const estimated = Number(formData.estimatedValue) || 0;
    return estimated - purchase;
  };

  const calculateProfitMargin = () => {
    const purchase = Number(formData.purchasePrice) || 0;
    const estimated = Number(formData.estimatedValue) || 0;
    if (purchase === 0) return 0;
    return ((estimated - purchase) / purchase) * 100;
  };

  return (
    <ToastProvider>
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalTrigger asChild>
          <Button data-testid="add-sourcing-item" className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Sourcing Item
          </Button>
        </ModalTrigger>

        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>Add New Sourcing Item</ModalTitle>
          </ModalHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Item Title"
                type="text"
                data-testid="item-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter item title"
                error={errors.title}
                required
              />

              <FormSelect
                label="Category"
                testId="item-category"
                options={categoryOptions}
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                placeholder="Select category"
                error={errors.category}
                required
              />
            </div>

            <FormField
              label="Description"
              type="text"
              data-testid="item-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the item"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Purchase Price"
                type="number"
                data-testid="purchase-price"
                value={formData.purchasePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                placeholder="0.00"
                error={errors.purchasePrice}
                required
              />

              <FormField
                label="Estimated Value"
                type="number"
                data-testid="estimated-value"
                value={formData.estimatedValue}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                placeholder="0.00"
                error={errors.estimatedValue}
                required
              />
            </div>

            {/* Profit Calculation Display */}
            {formData.purchasePrice && formData.estimatedValue && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400">Estimated Profit:</span>
                    <span className="font-semibold text-green-400" data-testid="estimated-profit">
                      ${calculateProfit().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-green-400">Profit Margin:</span>
                    <span className="font-semibold text-green-400" data-testid="profit-margin">
                      {calculateProfitMargin().toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              label="Condition Notes"
              type="text"
              data-testid="condition-notes"
              value={formData.conditionNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, conditionNotes: e.target.value }))}
              placeholder="Notes about item condition, defects, etc."
            />

            {/* Validation Error Display */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                <p className="text-red-400 text-sm" data-testid="validation-error">
                  Please fix the errors above to continue
                </p>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isLoading}
                data-testid="save-as-draft"
              >
                Save as Draft
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  data-testid="save-sourcing-item"
                  className="inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Item"}
                </Button>
              </div>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Toast Notifications */}
      {showToast && (
        <Toast
          variant={toastType === "error" ? "destructive" : "success"}
          data-testid={toastType === "error" ? "save-error-toast" : "item-saved-toast"}
        >
          <div className="grid gap-1">
            <div className="text-sm font-semibold">{toastMessage}</div>
          </div>
        </Toast>
      )}

      <ToastViewport />
    </ToastProvider>
  );
}