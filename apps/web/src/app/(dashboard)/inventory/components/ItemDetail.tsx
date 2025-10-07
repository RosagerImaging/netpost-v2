"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ScaleIcon,
  PhotoIcon,
  DocumentIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import {
  getInventoryStatusDisplayName,
  getConditionDisplayName,
  getDaysInInventory,
  isReadyForListing,
  type InventoryItemRecord,
} from "@netpost/shared-types";
import { Button } from "@netpost/ui";

interface ItemDetailProps {
  item: InventoryItemRecord;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ItemDetail({ item, isOpen, onClose, onEdit, onDelete }: ItemDetailProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const photos = item.photos || [];
  const hasPhotos = photos.length > 0;
  const daysInInventory = getDaysInInventory(item.created_at);
  const readyForListing = isReadyForListing(item);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-background border-border w-full max-w-6xl transform overflow-hidden rounded-2xl border text-left shadow-xl transition-all">
                {/* Header */}
                <div className="border-border flex items-center justify-between border-b p-6">
                  <div className="min-w-0 flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-foreground mb-2 text-xl font-semibold leading-7"
                    >
                      {item.title}
                    </Dialog.Title>
                    <div className="flex items-center space-x-4">
                      <span className={`rounded-full px-3 py-1 text-sm ${getStatusColor(item.status)}`}>
                        {getInventoryStatusDisplayName(item.status)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-sm ${getConditionColor(item.condition)}`}>
                        {getConditionDisplayName(item.condition)}
                      </span>
                      {readyForListing && (
                        <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm">
                          Ready for Listing
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onEdit();
                          onClose();
                        }}
                        className="flex items-center space-x-2"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit</span>
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onDelete();
                          onClose();
                        }}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center space-x-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Delete</span>
                      </Button>
                    )}
                    <button
                      type="button"
                      className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Photo Gallery */}
                    <div className="space-y-4">
                      <h4 className="text-foreground text-lg font-medium">Photos</h4>
                      {hasPhotos ? (
                        <div className="space-y-4">
                          {/* Main Photo */}
                          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                            {!imageError[currentPhotoIndex] ? (
                              <Image
                                src={photos[currentPhotoIndex].url}
                                alt={photos[currentPhotoIndex].alt_text || item.title}
                                fill
                                className="object-cover"
                                onError={() => setImageError(prev => ({ ...prev, [currentPhotoIndex]: true }))}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <PhotoIcon className="text-muted-foreground h-12 w-12" />
                              </div>
                            )}

                            {/* Navigation */}
                            {photos.length > 1 && (
                              <>
                                <button
                                  onClick={prevPhoto}
                                  className="bg-black/50 hover:bg-black/70 absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-colors"
                                >
                                  <ChevronLeftIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={nextPhoto}
                                  className="bg-black/50 hover:bg-black/70 absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-colors"
                                >
                                  <ChevronRightIcon className="h-5 w-5" />
                                </button>
                                <div className="bg-black/50 absolute bottom-2 left-1/2 -translate-x-1/2 rounded px-3 py-1 text-white text-sm">
                                  {currentPhotoIndex + 1} / {photos.length}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Thumbnail Gallery */}
                          {photos.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {photos.map((photo, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentPhotoIndex(index)}
                                  className={`relative aspect-square overflow-hidden rounded border-2 transition-colors ${
                                    index === currentPhotoIndex
                                      ? 'border-primary'
                                      : 'border-transparent hover:border-muted-foreground'
                                  }`}
                                >
                                  <Image
                                    src={photo.url}
                                    alt={photo.alt_text || `${item.title} ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-muted flex aspect-square items-center justify-center rounded-lg">
                          <div className="text-center">
                            <PhotoIcon className="text-muted-foreground mx-auto h-12 w-12" />
                            <p className="text-muted-foreground mt-2 text-sm">No photos available</p>
                          </div>
                        </div>
                      )}

                      {/* Media Summary */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <PhotoIcon className="mx-auto h-6 w-6 text-blue-500" />
                          <p className="text-foreground mt-1 font-medium">{photos.length}</p>
                          <p className="text-muted-foreground text-xs">Photos</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <VideoCameraIcon className="mx-auto h-6 w-6 text-red-500" />
                          <p className="text-foreground mt-1 font-medium">{item.videos?.length || 0}</p>
                          <p className="text-muted-foreground text-xs">Videos</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <DocumentIcon className="mx-auto h-6 w-6 text-green-500" />
                          <p className="text-foreground mt-1 font-medium">{item.documents?.length || 0}</p>
                          <p className="text-muted-foreground text-xs">Documents</p>
                        </div>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div>
                        <h4 className="text-foreground mb-3 text-lg font-medium">Basic Information</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Brand:</span>
                            <span className="text-foreground font-medium">{item.brand || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="text-foreground font-medium">{item.category || 'Not specified'}</span>
                          </div>
                          {item.subcategory && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subcategory:</span>
                              <span className="text-foreground font-medium">{item.subcategory}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="text-foreground font-medium">
                              {item.size_value || 'Not specified'}
                              {item.size_type && item.size_value && ` (${item.size_type})`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Color:</span>
                            <span className="text-foreground font-medium">{item.color || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Material:</span>
                            <span className="text-foreground font-medium">{item.material || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="text-foreground font-medium">{item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <div>
                          <h4 className="text-foreground mb-3 text-lg font-medium">Description</h4>
                          <p className="text-foreground text-sm leading-relaxed">{item.description}</p>
                        </div>
                      )}

                      {/* Pricing */}
                      <div>
                        <h4 className="text-foreground mb-3 text-lg font-medium flex items-center">
                          <CurrencyDollarIcon className="mr-2 h-5 w-5" />
                          Pricing
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Purchase Price:</span>
                            <span className="text-foreground font-medium">{formatCurrency(item.purchase_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Target Price:</span>
                            <span className="text-foreground font-medium">{formatCurrency(item.target_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Minimum Price:</span>
                            <span className="text-foreground font-medium">{formatCurrency(item.minimum_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimated Value:</span>
                            <span className="text-foreground font-medium">{formatCurrency(item.estimated_value)}</span>
                          </div>
                          {item.sale_price && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sale Price:</span>
                              <span className="text-green-600 font-semibold">{formatCurrency(item.sale_price)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sourcing Information */}
                      <div>
                        <h4 className="text-foreground mb-3 text-lg font-medium flex items-center">
                          <MapPinIcon className="mr-2 h-5 w-5" />
                          Sourcing
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Source Location:</span>
                            <span className="text-foreground font-medium">{item.source_location || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Source Type:</span>
                            <span className="text-foreground font-medium">{item.source_type || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Purchase Date:</span>
                            <span className="text-foreground font-medium">{formatDate(item.purchase_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Days in Inventory:</span>
                            <span className="text-foreground font-medium">
                              {daysInInventory} day{daysInInventory !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Physical Attributes */}
                      {(item.weight_oz || item.length_in || item.width_in || item.height_in) && (
                        <div>
                          <h4 className="text-foreground mb-3 text-lg font-medium flex items-center">
                            <ScaleIcon className="mr-2 h-5 w-5" />
                            Physical Attributes
                          </h4>
                          <div className="space-y-3">
                            {item.weight_oz && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Weight:</span>
                                <span className="text-foreground font-medium">{item.weight_oz} oz</span>
                              </div>
                            )}
                            {(item.length_in || item.width_in || item.height_in) && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Dimensions:</span>
                                <span className="text-foreground font-medium">
                                  {[item.length_in, item.width_in, item.height_in]
                                    .filter(Boolean)
                                    .join(' × ')} in
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div>
                          <h4 className="text-foreground mb-3 text-lg font-medium flex items-center">
                            <TagIcon className="mr-2 h-5 w-5" />
                            Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Performance Metrics */}
                      <div>
                        <h4 className="text-foreground mb-3 text-lg font-medium">Performance</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <p className="text-foreground text-lg font-semibold">{item.times_listed}</p>
                            <p className="text-muted-foreground text-xs">Times Listed</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <p className="text-foreground text-lg font-semibold">{item.views_count}</p>
                            <p className="text-muted-foreground text-xs">Views</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <p className="text-foreground text-lg font-semibold">{item.favorites_count}</p>
                            <p className="text-muted-foreground text-xs">Favorites</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <p className="text-foreground text-lg font-semibold">{item.inquiries_count}</p>
                            <p className="text-muted-foreground text-xs">Inquiries</p>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div>
                        <h4 className="text-foreground mb-3 text-lg font-medium flex items-center">
                          <CalendarDaysIcon className="mr-2 h-5 w-5" />
                          Timestamps
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span className="text-foreground font-medium">{formatDate(item.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Updated:</span>
                            <span className="text-foreground font-medium">{formatDate(item.updated_at)}</span>
                          </div>
                          {item.sale_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sale Date:</span>
                              <span className="text-foreground font-medium">{formatDate(item.sale_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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