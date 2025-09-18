"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon, TrashIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@netpost/ui";
import type { InventoryItemRecord } from "@netpost/shared-types";

interface DeleteConfirmDialogProps {
  item: InventoryItemRecord;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmDialog({
  item,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmDialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-background border-border w-full max-w-md transform overflow-hidden rounded-2xl border text-left align-middle shadow-xl transition-all">
                <div className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 flex h-12 w-12 items-center justify-center rounded-full">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Dialog.Title
                        as="h3"
                        className="text-foreground text-lg font-medium leading-6"
                      >
                        Delete Item
                      </Dialog.Title>
                      <p className="text-muted-foreground mt-1 text-sm">
                        This action will move the item to trash. You can restore it later if needed.
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 mt-4 rounded-lg p-3">
                    <p className="text-foreground font-medium">{item.title}</p>
                    {item.brand && (
                      <p className="text-muted-foreground text-sm">{item.brand}</p>
                    )}
                    {item.target_price && (
                      <p className="text-muted-foreground text-sm">
                        Target Price: ${item.target_price.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={onConfirm}
                      disabled={isDeleting}
                      className="flex items-center space-x-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>{isDeleting ? 'Deleting...' : 'Delete Item'}</span>
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

interface UndoToastProps {
  isVisible: boolean;
  itemTitle: string;
  onUndo: () => void;
  onDismiss: () => void;
  isRestoring: boolean;
}

export function UndoToast({
  isVisible,
  itemTitle,
  onUndo,
  onDismiss,
  isRestoring,
}: UndoToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <Transition
        appear
        show={isVisible}
        enter="transition-all duration-300"
        enterFrom="opacity-0 translate-y-4"
        enterTo="opacity-100 translate-y-0"
        leave="transition-all duration-200"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-4"
      >
        <div className="bg-background border-border shadow-lg flex items-center space-x-4 rounded-lg border p-4">
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-medium">
              "{itemTitle}" was deleted
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={isRestoring}
              className="flex items-center space-x-1"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              <span>{isRestoring ? 'Restoring...' : 'Undo'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              disabled={isRestoring}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Transition>
    </div>
  );
}