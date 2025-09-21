"use client";

import { useState } from "react";
import Image from "next/image";
import { ItemDetail } from "./ItemDetail";
import { DeleteConfirmDialog, UndoToast } from "./DeleteConfirmDialog";
import { useItemActions } from "../hooks/useItemActions";
import {
  getInventoryStatusDisplayName,
  getConditionDisplayName,
  getDaysInInventory,
  type InventoryItemRecord
} from "@netpost/shared-types";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CalendarDaysIcon,
  TagIcon
} from "@heroicons/react/24/outline";

interface InventoryItemProps {
  item: InventoryItemRecord;
  viewMode: 'grid' | 'list';
}

export function InventoryItem({ item, viewMode }: InventoryItemProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { deleteItem, restoreItem, isItemLoading } = useItemActions();

  const daysInInventory = getDaysInInventory(item.created_at);
  const statusColor = getStatusColor(item.status);
  const conditionColor = getConditionColor(item.condition);

  const handleItemClick = () => {
    setShowDetail(true);
  };

  const handleDelete = async () => {
    try {
      await deleteItem(item.id);
      setShowDeleteDialog(false);
      setShowUndoToast(true);

      // Auto-dismiss toast after 5 seconds
      setTimeout(() => {
        setShowUndoToast(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to delete item:', error);
      // TODO: Show error toast
    }
  };

  const handleUndo = async () => {
    try {
      await restoreItem(item.id);
      setShowUndoToast(false);
    } catch (error) {
      console.error('Failed to restore item:', error);
      // TODO: Show error toast
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality in Task 5
    console.log('Edit item:', item.id);
  };

  if (viewMode === 'list') {
    return (
      <>
        <div
          className="bg-card/50 hover:bg-card/70 border-border/40 group cursor-pointer rounded-lg border p-4 backdrop-blur-sm transition-all duration-200"
          onClick={handleItemClick}
        >
          <div className="flex items-center space-x-4">
            {/* Image */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              {item.primary_photo_url && !imageError ? (
                <Image
                  src={item.primary_photo_url}
                  alt={item.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <PhotoIcon className="text-muted-foreground h-6 w-6" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-foreground truncate font-medium">{item.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{item.brand}</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs">
                    <span className={`rounded-full px-2 py-1 ${statusColor}`}>
                      {getInventoryStatusDisplayName(item.status)}
                    </span>
                    <span className={`rounded-full px-2 py-1 ${conditionColor}`}>
                      {getConditionDisplayName(item.condition)}
                    </span>
                    <span className="text-muted-foreground flex items-center">
                      <CalendarDaysIcon className="mr-1 h-3 w-3" />
                      {daysInInventory} day{daysInInventory !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {item.target_price && (
                    <p className="text-foreground font-semibold">
                      ${item.target_price.toFixed(2)}
                    </p>
                  )}
                  {item.purchase_price && (
                    <p className="text-muted-foreground text-sm">
                      Cost: ${item.purchase_price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail(true);
                }}
                className="hover:bg-muted text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                title="View Details"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="hover:bg-muted text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                title="Edit Item"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
                title="Delete Item"
                disabled={isItemLoading(item.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {showDetail && (
          <ItemDetail
            item={item}
            isOpen={showDetail}
            onClose={() => setShowDetail(false)}
          />
        )}
      </>
    );
  }

  // Grid view
  return (
    <>
      <div
        className="bg-card/50 hover:bg-card/70 border-border/40 group cursor-pointer overflow-hidden rounded-lg border backdrop-blur-sm transition-all duration-200"
        onClick={handleItemClick}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          {item.primary_photo_url && !imageError ? (
            <Image
              src={item.primary_photo_url}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <PhotoIcon className="text-muted-foreground h-12 w-12" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute left-2 top-2">
            <span className={`text-xs rounded-full px-2 py-1 ${statusColor}`}>
              {getInventoryStatusDisplayName(item.status)}
            </span>
          </div>

          {/* Photo Count */}
          {item.photos.length > 1 && (
            <div className="bg-black/50 absolute bottom-2 right-2 rounded px-2 py-1 text-xs text-white">
              {item.photos.length} photos
            </div>
          )}

          {/* Actions Overlay */}
          <div className="absolute inset-0 flex items-center justify-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100 bg-black/20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail(true);
              }}
              className="bg-background/90 hover:bg-background text-foreground rounded-full p-2 transition-colors"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="bg-background/90 hover:bg-background text-foreground rounded-full p-2 transition-colors"
              title="Edit Item"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              className="bg-background/90 hover:bg-background text-destructive rounded-full p-2 transition-colors"
              title="Delete Item"
              disabled={isItemLoading(item.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-foreground mb-1 truncate font-medium">{item.title}</h3>
          {item.brand && (
            <p className="text-muted-foreground mb-2 text-sm">{item.brand}</p>
          )}

          <div className="mb-3 flex items-center justify-between">
            <span className={`text-xs rounded-full px-2 py-1 ${conditionColor}`}>
              {getConditionDisplayName(item.condition)}
            </span>
            {item.target_price && (
              <span className="text-foreground font-semibold">
                ${item.target_price.toFixed(2)}
              </span>
            )}
          </div>

          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="flex items-center">
              <CalendarDaysIcon className="mr-1 h-3 w-3" />
              {daysInInventory} day{daysInInventory !== 1 ? 's' : ''}
            </span>
            {item.tags && item.tags.length > 0 && (
              <span className="flex items-center">
                <TagIcon className="mr-1 h-3 w-3" />
                {item.tags.length} tag{item.tags.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {showDetail && (
        <ItemDetail
          item={item}
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          onEdit={handleEdit}
          onDelete={() => setShowDeleteDialog(true)}
        />
      )}

      <DeleteConfirmDialog
        item={item}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        isDeleting={isItemLoading(item.id)}
      />

      <UndoToast
        isVisible={showUndoToast}
        itemTitle={item.title}
        onUndo={handleUndo}
        onDismiss={() => setShowUndoToast(false)}
        isRestoring={isItemLoading(item.id)}
      />
    </>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    available: 'bg-green-100 text-green-800',
    listed: 'bg-blue-100 text-blue-800',
    sold: 'bg-purple-100 text-purple-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    returned: 'bg-orange-100 text-orange-800',
    damaged: 'bg-red-100 text-red-800',
    donated: 'bg-indigo-100 text-indigo-800',
    archived: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getConditionColor(condition: string): string {
  const colors: Record<string, string> = {
    new_with_tags: 'bg-emerald-100 text-emerald-800',
    new_without_tags: 'bg-green-100 text-green-800',
    like_new: 'bg-lime-100 text-lime-800',
    excellent: 'bg-blue-100 text-blue-800',
    good: 'bg-yellow-100 text-yellow-800',
    fair: 'bg-orange-100 text-orange-800',
    poor: 'bg-red-100 text-red-800',
    for_parts: 'bg-gray-100 text-gray-800',
  };
  return colors[condition] || 'bg-gray-100 text-gray-800';
}