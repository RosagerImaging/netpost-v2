/**
 * Listing Preview Component
 * Shows a preview of how listings will appear on different marketplaces before submission
 */
'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Edit3,
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  DollarSign,
  Package,
  Camera,
  Tag
} from 'lucide-react';

interface ListingPreviewProps {
  formData: any;
  selectedItem: any;
  onSubmit: (data: any) => Promise<void>;
  onEdit: () => void;
}

export function ListingPreview({ formData, selectedItem, onSubmit, onEdit }: ListingPreviewProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatMarketplaceName = (marketplace: string) => {
    const names: Record<string, string> = {
      'ebay': 'eBay',
      'poshmark': 'Poshmark',
      'facebook_marketplace': 'Facebook Marketplace',
      'mercari': 'Mercari',
      'depop': 'Depop',
    };
    return names[marketplace] || marketplace;
  };

  const getMarketplaceTheme = (marketplace: string) => {
    const themes: Record<string, { bg: string; text: string; accent: string }> = {
      'ebay': { bg: 'bg-blue-50', text: 'text-blue-900', accent: 'border-blue-200' },
      'poshmark': { bg: 'bg-pink-50', text: 'text-pink-900', accent: 'border-pink-200' },
      'facebook_marketplace': { bg: 'bg-blue-50', text: 'text-blue-900', accent: 'border-blue-200' },
      'mercari': { bg: 'bg-orange-50', text: 'text-orange-900', accent: 'border-orange-200' },
      'depop': { bg: 'bg-purple-50', text: 'text-purple-900', accent: 'border-purple-200' },
    };
    return themes[marketplace] || { bg: 'bg-gray-50', text: 'text-gray-900', accent: 'border-gray-200' };
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Prepare submission data
      const submissionData = {
        item: selectedItem,
        formData,
        submittedAt: new Date().toISOString(),
      };

      await onSubmit(submissionData);
    } catch (err) {
      console.error('Error submitting listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit listings');
    } finally {
      setSubmitting(false);
    }
  };

  if (!formData || !selectedItem) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Missing form data or selected item. Please go back and complete the previous steps.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Your Listings</h2>
          <p className="text-muted-foreground mt-1">
            Preview how your item will appear on each marketplace before publishing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Listing
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {submitting ? 'Publishing...' : 'Publish Listings'}
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Listing Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Item Preview */}
            <div className="space-y-3">
              <h4 className="font-medium">Item</h4>
              <div className="flex gap-3">
                {selectedItem.photos?.[0] && (
                  <img
                    src={selectedItem.photos[0]}
                    alt={selectedItem.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{formData.baseListing?.title || selectedItem.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedItem.brand}</p>
                  <p className="text-xs text-muted-foreground">{selectedItem.category}</p>
                </div>
              </div>
            </div>

            {/* Marketplaces */}
            <div className="space-y-3">
              <h4 className="font-medium">Marketplaces ({formData.marketplaces?.length || 0})</h4>
              <div className="flex flex-wrap gap-2">
                {formData.marketplaces?.map((marketplace: string) => (
                  <Badge key={marketplace} variant="secondary">
                    {formatMarketplaceName(marketplace)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <h4 className="font-medium">Pricing</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  Base: <span className="font-medium">{formatPrice(formData.baseListing?.price || 0)}</span>
                </p>
                {formData.marketplaceCustomizations && Object.entries(formData.marketplaceCustomizations).some(([_, config]: [string, any]) => config.price) && (
                  <p className="text-xs text-muted-foreground">Custom pricing applied</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketplace Previews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Marketplace Previews
          </CardTitle>
          <CardDescription>
            See how your listing will appear on each marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={formData.marketplaces?.[0]} className="space-y-4">
            <TabsList className="grid w-full grid-cols-auto">
              {formData.marketplaces?.map((marketplace: string) => (
                <TabsTrigger key={marketplace} value={marketplace}>
                  {formatMarketplaceName(marketplace)}
                </TabsTrigger>
              ))}
            </TabsList>

            {formData.marketplaces?.map((marketplace: string) => {
              const customization = formData.marketplaceCustomizations?.[marketplace] || {};
              const theme = getMarketplaceTheme(marketplace);
              const finalPrice = customization.price || formData.baseListing?.price || 0;
              const finalTitle = customization.title || formData.baseListing?.title || selectedItem.title;
              const finalDescription = customization.description || formData.baseListing?.description || '';

              return (
                <TabsContent key={marketplace} value={marketplace}>
                  <div className={`border rounded-lg ${theme.accent} ${theme.bg} p-6`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Mock Marketplace UI */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`w-3 h-3 rounded-full bg-current ${theme.text}`} />
                          <span className={`font-medium ${theme.text}`}>
                            {formatMarketplaceName(marketplace)}
                          </span>
                        </div>

                        {/* Image Gallery */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-2">
                            {selectedItem.photos?.slice(0, 4).map((photo: string, index: number) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`${selectedItem.title} ${index + 1}`}
                                className="w-full h-16 object-cover rounded"
                              />
                            ))}
                          </div>
                        </div>

                        {/* Title and Price */}
                        <div className="space-y-2">
                          <h3 className={`font-bold text-lg ${theme.text}`}>
                            {finalTitle}
                          </h3>
                          <p className={`text-2xl font-bold ${theme.text}`}>
                            {formatPrice(finalPrice)}
                          </p>
                        </div>

                        {/* Description Preview */}
                        <div className="space-y-2">
                          <h4 className={`font-medium ${theme.text}`}>Description</h4>
                          <p className={`text-sm ${theme.text} opacity-80`}>
                            {finalDescription.substring(0, 200)}
                            {finalDescription.length > 200 && '...'}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-current opacity-20">
                          <div>
                            <p className={`text-xs ${theme.text} opacity-60`}>Brand</p>
                            <p className={`text-sm font-medium ${theme.text}`}>{selectedItem.brand}</p>
                          </div>
                          <div>
                            <p className={`text-xs ${theme.text} opacity-60`}>Condition</p>
                            <p className={`text-sm font-medium ${theme.text}`}>
                              {formData.baseListing?.condition || 'Good'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Customization Summary */}
                      <div className="space-y-4">
                        <h4 className={`font-medium ${theme.text}`}>Marketplace Customizations</h4>

                        <div className="space-y-3">
                          {customization.title && (
                            <div className="flex items-start gap-2">
                              <Tag className={`h-4 w-4 ${theme.text} mt-0.5`} />
                              <div>
                                <p className={`text-xs ${theme.text} opacity-60`}>Custom Title</p>
                                <p className={`text-sm ${theme.text}`}>{customization.title}</p>
                              </div>
                            </div>
                          )}

                          {customization.price && (
                            <div className="flex items-start gap-2">
                              <DollarSign className={`h-4 w-4 ${theme.text} mt-0.5`} />
                              <div>
                                <p className={`text-xs ${theme.text} opacity-60`}>Custom Price</p>
                                <p className={`text-sm ${theme.text}`}>{formatPrice(customization.price)}</p>
                              </div>
                            </div>
                          )}

                          {customization.description && (
                            <div className="flex items-start gap-2">
                              <Edit3 className={`h-4 w-4 ${theme.text} mt-0.5`} />
                              <div>
                                <p className={`text-xs ${theme.text} opacity-60`}>Custom Description</p>
                                <p className={`text-sm ${theme.text}`}>Modified for this marketplace</p>
                              </div>
                            </div>
                          )}

                          {!customization.title && !customization.price && !customization.description && (
                            <p className={`text-sm ${theme.text} opacity-60 italic`}>
                              Using default listing settings
                            </p>
                          )}
                        </div>

                        {/* Marketplace-specific features */}
                        {marketplace === 'poshmark' && (
                          <div className="pt-3 border-t border-current opacity-20">
                            <p className={`text-xs ${theme.text} opacity-60 mb-2`}>Poshmark Features</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CheckCircle className={`h-3 w-3 ${theme.text}`} />
                                <span className={`text-xs ${theme.text}`}>Posh Protect eligible</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className={`h-3 w-3 ${theme.text}`} />
                                <span className={`text-xs ${theme.text}`}>Bundle discount available</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Validation Warnings */}
      {formData.marketplaces?.some((marketplace: string) => {
        const customization = formData.marketplaceCustomizations?.[marketplace] || {};
        const price = customization.price || formData.baseListing?.price || 0;
        return price < 5; // Warning for very low prices
      }) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some listings have very low prices. Consider reviewing your pricing strategy for better visibility.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Final Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Ready to publish?</h4>
              <p className="text-sm text-muted-foreground">
                Your listings will be created on {formData.marketplaces?.length || 0} marketplace
                {(formData.marketplaces?.length || 0) > 1 ? 's' : ''} and become visible to buyers.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Make Changes
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} size="lg">
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {submitting ? 'Publishing Listings...' : 'Publish All Listings'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}