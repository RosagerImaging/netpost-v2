/**
 * Submission Success Component
 * Displays success confirmation and next steps after successful listing creation
 */
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  ExternalLink,
  RotateCcw,
  Eye,
  Share2,
  Download,
  Bell,
  TrendingUp,
  Package,
  Clock,
  DollarSign
} from 'lucide-react';

interface SubmissionSuccessProps {
  result: any;
  selectedItem: any;
  onStartOver: () => void;
  onViewListings: () => void;
}

export function SubmissionSuccess({
  result,
  selectedItem,
  onStartOver,
  onViewListings
}: SubmissionSuccessProps) {
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

  const getMarketplaceIcon = (marketplace: string) => {
    // In a real implementation, you'd have actual marketplace icons
    return '🏪';
  };

  const marketplaces = result?.formData?.marketplaces || [];
  const baseListing = result?.formData?.baseListing || {};
  const estimatedReach = marketplaces.length * 1000; // Mock calculation
  const estimatedViews = marketplaces.length * 50; // Mock calculation

  return (
    <div className="p-6 space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-green-600">Listings Created Successfully!</h2>
          <p className="text-muted-foreground mt-2">
            Your item is now live on {marketplaces.length} marketplace{marketplaces.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{marketplaces.length}</p>
            <p className="text-xs text-muted-foreground">Marketplaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{formatPrice(baseListing.price || 0)}</p>
            <p className="text-xs text-muted-foreground">Base Price</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{estimatedReach.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Est. Reach</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{estimatedViews}</p>
            <p className="text-xs text-muted-foreground">Est. Daily Views</p>
          </CardContent>
        </Card>
      </div>

      {/* Item Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Listed Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {selectedItem?.photos?.[0] && (
              <img
                src={selectedItem.photos[0]}
                alt={selectedItem.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg">{baseListing.title || selectedItem?.title}</h3>
              <p className="text-muted-foreground">{selectedItem?.brand} • {selectedItem?.category}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Listed at {formatPrice(baseListing.price || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketplace Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Active Listings
          </CardTitle>
          <CardDescription>
            Your item is now live on these marketplaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketplaces.map((marketplace: string, index: number) => {
              const customization = result?.formData?.marketplaceCustomizations?.[marketplace] || {};
              const price = customization.price || baseListing.price || 0;
              const title = customization.title || baseListing.title || selectedItem?.title;

              return (
                <div key={marketplace} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMarketplaceIcon(marketplace)}</span>
                      <span className="font-medium">{formatMarketplaceName(marketplace)}</span>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Live
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-lg font-bold text-green-600">{formatPrice(price)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            What's Next?
          </CardTitle>
          <CardDescription>
            Here's what you can do now that your listings are live
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Monitor Performance</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Track views and engagement across platforms
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Receive notifications for messages and offers
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  Monitor pricing compared to similar items
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Optimize Your Listings</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  Add more photos to increase buyer interest
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  Update descriptions based on questions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  Adjust pricing if needed for better visibility
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Estimate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Expected Timeline</p>
              <p className="text-sm text-muted-foreground">
                Your listings should appear on all marketplaces within 15-30 minutes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button onClick={onViewListings} size="lg">
          <Eye className="h-4 w-4 mr-2" />
          View All Listings
        </Button>

        <Button variant="outline" onClick={onStartOver} size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Create Another Listing
        </Button>

        <Button variant="outline" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Support */}
      <div className="text-center pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          Need help managing your listings?{' '}
          <Button variant="link" className="p-0 h-auto">
            Contact Support
          </Button>
          {' '}or{' '}
          <Button variant="link" className="p-0 h-auto">
            View Help Center
          </Button>
        </p>
      </div>
    </div>
  );
}