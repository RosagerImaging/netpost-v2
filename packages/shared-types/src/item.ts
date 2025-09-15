export interface Item {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: ItemCategory;
  condition: ItemCondition;
  brand?: string;
  model?: string;
  size?: string;
  color?: string;
  material?: string;
  images: ItemImage[];
  purchasePrice?: number;
  purchaseDate?: string;
  purchaseLocation?: string;
  estimatedValue: number;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ItemImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  metadata?: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
  };
}

export type ItemCategory =
  | "clothing"
  | "shoes"
  | "accessories"
  | "bags"
  | "jewelry"
  | "electronics"
  | "home"
  | "books"
  | "toys"
  | "sports"
  | "beauty"
  | "art"
  | "collectibles"
  | "other";

export type ItemCondition =
  | "new_with_tags"
  | "new_without_tags"
  | "excellent"
  | "very_good"
  | "good"
  | "fair"
  | "poor";

export interface ItemAnalysis {
  id: string;
  itemId: string;
  aiDescription: string;
  suggestedCategory: ItemCategory;
  suggestedCondition: ItemCondition;
  estimatedValue: {
    low: number;
    high: number;
    confidence: number;
  };
  marketTrends: {
    platform: string;
    averagePrice: number;
    recentSales: number;
    trend: "up" | "down" | "stable";
  }[];
  recommendations: string[];
  analyzedAt: string;
}

export interface ItemFilter {
  category?: ItemCategory[];
  condition?: ItemCondition[];
  priceRange?: {
    min: number;
    max: number;
  };
  brands?: string[];
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  search?: string;
}
