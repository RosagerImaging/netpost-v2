/**
 * Marketplace Adapter Registry
 *
 * Central registry for all marketplace adapters
 * Handles adapter registration, creation, and management
 */

import { MarketplaceAdapterFactory } from './base-adapter';
import { EBayAdapter } from './ebay-adapter';
import { PoshmarkAdapter } from './poshmark-adapter';
import { FacebookAdapter } from './facebook-adapter';
import type { MarketplaceType } from '@netpost/shared-types/database/listing';
import type {
  MarketplaceConnectionRecord,
  MarketplaceCredentials,
} from '@netpost/shared-types/database/marketplace-connection';

/**
 * Initialize and register all marketplace adapters
 */
export function initializeMarketplaceAdapters(): void {
  // Register eBay adapter
  MarketplaceAdapterFactory.register('ebay', EBayAdapter);

  // Register Poshmark adapter
  MarketplaceAdapterFactory.register('poshmark', PoshmarkAdapter);

  // Register Facebook Marketplace adapter
  MarketplaceAdapterFactory.register('facebook_marketplace', FacebookAdapter);
}

/**
 * Get supported marketplace types
 */
export function getSupportedMarketplaces(): MarketplaceType[] {
  return MarketplaceAdapterFactory.getSupportedMarketplaces();
}

/**
 * Create a marketplace adapter instance
 */
export function createMarketplaceAdapter(
  connection: MarketplaceConnectionRecord,
  credentials: MarketplaceCredentials
) {
  return MarketplaceAdapterFactory.create(connection, credentials);
}

/**
 * Check if a marketplace is supported
 */
export function isMarketplaceSupported(marketplace: MarketplaceType): boolean {
  return getSupportedMarketplaces().includes(marketplace);
}

/**
 * Get marketplace-specific configuration
 */
export function getMarketplaceConfig(marketplace: MarketplaceType) {
  const configs: Record<MarketplaceType, any> = {
    ebay: {
      name: 'eBay',
      auth_method: 'oauth2',
      supports_auction: true,
      supports_variations: true,
      max_photos: 24,
      photo_requirements: {
        min_size: '500x500',
        max_size: '1600x1600',
        formats: ['jpg', 'png', 'gif'],
        max_file_size: '7MB',
      },
      rate_limits: {
        requests_per_hour: 5000,
        requests_per_minute: 10,
      },
      required_fields: ['title', 'description', 'price', 'category'],
      optional_fields: ['brand', 'condition', 'item_specifics'],
    },
    poshmark: {
      name: 'Poshmark',
      auth_method: 'oauth2',
      supports_auction: false,
      supports_variations: false,
      max_photos: 16,
      photo_requirements: {
        min_size: '512x512',
        max_size: '2048x2048',
        formats: ['jpg', 'png'],
        max_file_size: '2MB',
        aspect_ratio: 'square_preferred',
      },
      rate_limits: {
        requests_per_hour: 1000,
        requests_per_minute: 60,
      },
      required_fields: ['title', 'description', 'price', 'brand', 'size'],
      optional_fields: ['color', 'condition', 'tags'],
      fashion_focused: true,
    },
    facebook_marketplace: {
      name: 'Facebook Marketplace',
      auth_method: 'oauth2',
      supports_auction: false,
      supports_variations: false,
      max_photos: 10,
      photo_requirements: {
        min_size: '400x400',
        max_size: '2048x2048',
        formats: ['jpg', 'png'],
        max_file_size: '4MB',
      },
      rate_limits: {
        requests_per_hour: 600,
        requests_per_minute: 60,
      },
      required_fields: ['title', 'description', 'price', 'location'],
      optional_fields: ['category', 'condition'],
      local_focused: true,
    },
    mercari: {
      name: 'Mercari',
      auth_method: 'api_key',
      supports_auction: false,
      supports_variations: false,
      max_photos: 20,
    },
    depop: {
      name: 'Depop',
      auth_method: 'oauth2',
      supports_auction: false,
      supports_variations: false,
      max_photos: 4,
    },
    vinted: {
      name: 'Vinted',
      auth_method: 'oauth2',
      supports_auction: false,
      supports_variations: false,
      max_photos: 20,
    },
    grailed: {
      name: 'Grailed',
      auth_method: 'api_key',
      supports_auction: false,
      supports_variations: false,
      max_photos: 8,
    },
    the_realreal: {
      name: 'The RealReal',
      auth_method: 'api_key',
      supports_auction: false,
      supports_variations: false,
      max_photos: 10,
    },
    vestiaire_collective: {
      name: 'Vestiaire Collective',
      auth_method: 'oauth2',
      supports_auction: false,
      supports_variations: false,
      max_photos: 15,
    },
    tradesy: {
      name: 'Tradesy',
      auth_method: 'api_key',
      supports_auction: false,
      supports_variations: false,
      max_photos: 8,
    },
    etsy: {
      name: 'Etsy',
      auth_method: 'oauth2',
      supports_auction: false,
      supports_variations: true,
      max_photos: 13,
    },
    amazon: {
      name: 'Amazon',
      auth_method: 'api_key',
      supports_auction: false,
      supports_variations: true,
      max_photos: 9,
    },
    shopify: {
      name: 'Shopify',
      auth_method: 'oauth2',
      supports_auction: false,
      supports_variations: true,
      max_photos: 250,
    },
    custom: {
      name: 'Custom Platform',
      auth_method: 'api_key',
      supports_auction: false,
      supports_variations: false,
      max_photos: 10,
    },
  };

  return configs[marketplace];
}

/**
 * Get marketplace display information
 */
export function getMarketplaceDisplayInfo(marketplace: MarketplaceType) {
  const config = getMarketplaceConfig(marketplace);

  return {
    name: config?.name || marketplace,
    logo: `/images/marketplaces/${marketplace}-logo.png`,
    color: getMarketplaceColor(marketplace),
    description: getMarketplaceDescription(marketplace),
    features: getMarketplaceFeatures(marketplace),
  };
}

/**
 * Get marketplace brand colors
 */
function getMarketplaceColor(marketplace: MarketplaceType): string {
  const colors: Record<MarketplaceType, string> = {
    ebay: '#E53238',
    poshmark: '#731A83',
    facebook_marketplace: '#1877F2',
    mercari: '#FF6600',
    depop: '#000000',
    vinted: '#09B1BA',
    grailed: '#000000',
    the_realreal: '#000000',
    vestiaire_collective: '#000000',
    tradesy: '#EE4B2B',
    etsy: '#F56400',
    amazon: '#FF9900',
    shopify: '#7AB55C',
    custom: '#6B7280',
  };

  return colors[marketplace] || '#6B7280';
}

/**
 * Get marketplace descriptions
 */
function getMarketplaceDescription(marketplace: MarketplaceType): string {
  const descriptions: Record<MarketplaceType, string> = {
    ebay: 'Global online marketplace with auction and fixed-price formats',
    poshmark: 'Fashion-focused social marketplace for clothing and accessories',
    facebook_marketplace: 'Local marketplace integrated with Facebook for community selling',
    mercari: 'Mobile marketplace for buying and selling everyday items',
    depop: 'Creative community marketplace for unique fashion finds',
    vinted: 'Community marketplace for pre-loved fashion',
    grailed: 'Marketplace for men\'s streetwear, designer, and vintage clothing',
    the_realreal: 'Luxury consignment marketplace for authenticated goods',
    vestiaire_collective: 'Global marketplace for pre-owned designer fashion',
    tradesy: 'Marketplace for women\'s luxury fashion',
    etsy: 'Global marketplace for creative and vintage items',
    amazon: 'World\'s largest online marketplace',
    shopify: 'E-commerce platform for building online stores',
    custom: 'Custom marketplace integration',
  };

  return descriptions[marketplace] || 'Marketplace integration';
}

/**
 * Get marketplace features
 */
function getMarketplaceFeatures(marketplace: MarketplaceType): string[] {
  const features: Record<MarketplaceType, string[]> = {
    ebay: ['Auction listings', 'Global reach', 'Best offer', 'Promoted listings'],
    poshmark: ['Social selling', 'Fashion focus', 'Brand authentication', 'Community features'],
    facebook_marketplace: ['Local selling', 'Social integration', 'Free listings', 'Messenger chat'],
    mercari: ['Mobile-first', 'Instant selling', 'Shipping labels', 'Buyer protection'],
    depop: ['Creative community', 'Young audience', 'Fashion discovery', 'Social features'],
    vinted: ['No selling fees', 'Fashion focus', 'Integrated shipping', 'Community'],
    grailed: ['Streetwear focus', 'Authentication', 'Price tracking', 'Curated feed'],
    the_realreal: ['Luxury focus', 'Authentication', 'White glove service', 'Expert curation'],
    vestiaire_collective: ['Designer fashion', 'Authentication', 'Global shipping', 'Sustainability'],
    tradesy: ['Women\'s luxury', 'Authentication', 'Closet management', 'Trade-in program'],
    etsy: ['Creative items', 'Vintage goods', 'Handmade focus', 'Global reach'],
    amazon: ['Massive reach', 'FBA program', 'Prime shipping', 'Brand registry'],
    shopify: ['Own store', 'Full control', 'App ecosystem', 'Multi-channel'],
    custom: ['Flexible integration', 'Custom API', 'Tailored features'],
  };

  return features[marketplace] || [];
}

/**
 * Validate marketplace-specific requirements
 */
export function validateMarketplaceRequirements(
  marketplace: MarketplaceType,
  listingData: any
): { valid: boolean; errors: string[] } {
  const config = getMarketplaceConfig(marketplace);
  const errors: string[] = [];

  if (!config) {
    return { valid: false, errors: ['Marketplace not supported'] };
  }

  // Check required fields
  config.required_fields?.forEach((field: string) => {
    if (!listingData[field]) {
      errors.push(`${field} is required for ${config.name}`);
    }
  });

  // Check photo requirements
  if (config.photo_requirements && listingData.photos) {
    if (listingData.photos.length > config.max_photos) {
      errors.push(`Maximum ${config.max_photos} photos allowed for ${config.name}`);
    }
  }

  // Marketplace-specific validations
  if (marketplace === 'poshmark') {
    if (!listingData.brand) {
      errors.push('Brand is required for Poshmark listings');
    }
    if (!listingData.size) {
      errors.push('Size is required for Poshmark clothing listings');
    }
  }

  if (marketplace === 'facebook_marketplace') {
    if (!listingData.location || !listingData.location.latitude) {
      errors.push('Location is required for Facebook Marketplace');
    }
  }

  if (marketplace === 'ebay') {
    if (!listingData.category) {
      errors.push('Category is required for eBay listings');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Initialize adapters when module is imported
initializeMarketplaceAdapters();