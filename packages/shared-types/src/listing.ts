export interface Listing {
  id: string;
  itemId: string;
  userId: string;
  platform: Platform;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  status: ListingStatus;
  visibility: ListingVisibility;
  publishedAt?: string;
  expiresAt?: string;
  shippingOptions: ShippingOption[];
  paymentMethods: PaymentMethod[];
  returnPolicy?: ReturnPolicy;
  platformSpecificData: Record<string, any>;
  views: number;
  likes: number;
  watchers: number;
  messages: number;
  createdAt: string;
  updatedAt: string;
}

export type Platform =
  | "poshmark"
  | "mercari"
  | "depop"
  | "vinted"
  | "thredup"
  | "vestiaire"
  | "ebay"
  | "facebook"
  | "instagram"
  | "custom";

export type ListingStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "sold"
  | "expired"
  | "deleted"
  | "suspended";

export type ListingVisibility = "public" | "private" | "followers_only";

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: {
    min: number;
    max: number;
  };
  trackingIncluded: boolean;
  insuranceIncluded: boolean;
}

export type PaymentMethod =
  | "paypal"
  | "stripe"
  | "venmo"
  | "cash_app"
  | "zelle"
  | "platform_wallet"
  | "cash"
  | "check";

export interface ReturnPolicy {
  acceptsReturns: boolean;
  returnWindow: number; // days
  returnShippingPaidBy: "buyer" | "seller";
  conditions: string[];
}

export interface ListingTemplate {
  id: string;
  userId: string;
  name: string;
  title: string;
  description: string;
  tags: string[];
  shippingOptions: ShippingOption[];
  paymentMethods: PaymentMethod[];
  returnPolicy?: ReturnPolicy;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingAnalytics {
  listingId: string;
  period: "day" | "week" | "month" | "year";
  views: number;
  likes: number;
  shares: number;
  messages: number;
  offers: number;
  priceViews: number;
  profileViews: number;
  date: string;
}

export interface CrossPostingJob {
  id: string;
  userId: string;
  itemId: string;
  platforms: Platform[];
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  scheduledFor?: string;
  results: CrossPostingResult[];
  createdAt: string;
  updatedAt: string;
}

export interface CrossPostingResult {
  platform: Platform;
  status: "success" | "failed" | "skipped";
  listingId?: string;
  externalId?: string;
  url?: string;
  error?: string;
  completedAt?: string;
}
