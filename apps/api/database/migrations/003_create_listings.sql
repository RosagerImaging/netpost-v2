-- Migration: Create Listings Table
-- Purpose: Cross-platform listing management with marketplace-specific data
-- Date: 2025-09-17
-- Author: BMad Development Agent (James)

-- Create enum types for listing fields
CREATE TYPE public.listing_status AS ENUM (
  'draft',           -- Listing being prepared
  'pending',         -- Submitted to marketplace, awaiting approval
  'active',          -- Live and active on marketplace
  'paused',          -- Temporarily paused by user
  'ended',           -- Listing ended (time/quantity expired)
  'sold',            -- Item sold through this listing
  'cancelled',       -- Listing cancelled by user
  'rejected',        -- Rejected by marketplace
  'under_review',    -- Under marketplace review
  'relisted',        -- Item was relisted (creates new listing)
  'deleted'          -- Listing deleted from marketplace
);

CREATE TYPE public.marketplace_type AS ENUM (
  'ebay',
  'poshmark',
  'mercari',
  'facebook_marketplace',
  'depop',
  'vinted',
  'grailed',
  'the_realreal',
  'vestiaire_collective',
  'tradesy',
  'etsy',
  'amazon',
  'shopify',
  'custom'           -- For custom/other marketplaces
);

CREATE TYPE public.listing_format AS ENUM (
  'auction',         -- Auction-style listing
  'fixed_price',     -- Fixed price/Buy It Now
  'best_offer',      -- Accept best offers
  'classified'       -- Local pickup/classified ad
);

CREATE TYPE public.shipping_method AS ENUM (
  'calculated',      -- Calculated based on location
  'flat_rate',       -- Flat shipping rate
  'free',            -- Free shipping
  'local_pickup',    -- Local pickup only
  'freight'          -- Freight shipping
);

-- Create the listings table
CREATE TABLE IF NOT EXISTS public.listings (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,

  -- Marketplace Information
  marketplace_type public.marketplace_type NOT NULL,
  external_listing_id VARCHAR(255), -- The listing ID on the external platform
  external_url TEXT, -- Direct URL to the listing on marketplace

  -- Listing Content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  listing_format public.listing_format DEFAULT 'fixed_price',

  -- Pricing
  listing_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- Original retail price (for reference)
  minimum_offer_price DECIMAL(10,2), -- Minimum acceptable offer
  currency VARCHAR(3) DEFAULT 'USD',

  -- Auction-specific fields
  starting_bid DECIMAL(10,2), -- Starting bid for auctions
  reserve_price DECIMAL(10,2), -- Reserve price for auctions
  buy_it_now_price DECIMAL(10,2), -- Buy It Now price for auctions

  -- Quantity and Availability
  quantity_available INTEGER DEFAULT 1,
  quantity_sold INTEGER DEFAULT 0,

  -- Timing
  listing_duration INTEGER, -- Duration in days
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  auto_relist BOOLEAN DEFAULT FALSE,
  relist_count INTEGER DEFAULT 0,

  -- Status and Performance
  status public.listing_status DEFAULT 'draft',
  status_reason TEXT, -- Reason for current status (rejection reason, etc.)
  last_status_change TIMESTAMPTZ DEFAULT NOW(),

  -- Performance Metrics
  view_count INTEGER DEFAULT 0,
  watcher_count INTEGER DEFAULT 0, -- People watching the listing
  question_count INTEGER DEFAULT 0, -- Number of questions asked
  offer_count INTEGER DEFAULT 0, -- Number of offers received
  best_offer_amount DECIMAL(10,2), -- Highest offer received

  -- Shipping Information
  shipping_method public.shipping_method DEFAULT 'calculated',
  shipping_cost DECIMAL(10,2),
  free_shipping BOOLEAN DEFAULT FALSE,
  expedited_shipping BOOLEAN DEFAULT FALSE,
  international_shipping BOOLEAN DEFAULT FALSE,
  handling_time INTEGER DEFAULT 1, -- Days to ship

  -- Location and Item Details
  item_location VARCHAR(255), -- Where item ships from
  condition_description TEXT, -- Marketplace-specific condition description

  -- Photos and Media (marketplace-specific)
  photo_urls TEXT[], -- Array of photo URLs used for this listing
  primary_photo_url TEXT,
  photo_order INTEGER[], -- Order of photos for this listing

  -- Marketplace-Specific Data
  marketplace_category VARCHAR(255), -- Platform-specific category
  marketplace_subcategory VARCHAR(255),
  marketplace_attributes JSONB DEFAULT '{}', -- Platform-specific attributes
  marketplace_fees JSONB DEFAULT '{}', -- Fee breakdown from platform

  -- SEO and Discovery
  tags TEXT[], -- Platform-specific tags/keywords
  promoted BOOLEAN DEFAULT FALSE, -- Is this a promoted/featured listing
  promotion_cost DECIMAL(10,2), -- Cost of promotion

  -- Sales Data
  sale_price DECIMAL(10,2), -- Final sale price
  sale_date TIMESTAMPTZ, -- When item sold
  buyer_user_id VARCHAR(255), -- Buyer's platform user ID
  buyer_feedback_score INTEGER, -- Buyer's feedback score on platform
  payment_method VARCHAR(100), -- How buyer paid
  tracking_number VARCHAR(100), -- Shipping tracking number

  -- Fees and Profit
  marketplace_fee DECIMAL(10,2), -- Fee charged by marketplace
  payment_processing_fee DECIMAL(10,2), -- Payment processing fee
  shipping_fee_charged DECIMAL(10,2), -- Shipping fee charged to buyer
  actual_shipping_cost DECIMAL(10,2), -- Actual cost to ship
  promotional_fee DECIMAL(10,2), -- Cost of ads/promotion
  total_fees DECIMAL(10,2), -- Total fees paid
  net_profit DECIMAL(10,2), -- Final profit after all fees

  -- Returns and Issues
  return_requested BOOLEAN DEFAULT FALSE,
  return_reason TEXT,
  return_approved BOOLEAN,
  case_opened BOOLEAN DEFAULT FALSE, -- Dispute/case opened
  case_reason TEXT,
  case_resolution TEXT,

  -- Listing Management
  template_used UUID, -- Reference to listing template (future feature)
  notes TEXT, -- Private notes about this listing
  optimization_suggestions TEXT[], -- AI suggestions for improvement

  -- Cross-posting
  cross_posted_from UUID, -- If this was cross-posted from another listing
  cross_post_group_id UUID, -- Group ID for related cross-posted listings

  -- System Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ, -- Last sync with marketplace
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  CONSTRAINT positive_pricing CHECK (
    listing_price > 0 AND
    (starting_bid IS NULL OR starting_bid >= 0) AND
    (reserve_price IS NULL OR reserve_price >= 0) AND
    (buy_it_now_price IS NULL OR buy_it_now_price >= 0) AND
    (minimum_offer_price IS NULL OR minimum_offer_price >= 0)
  ),
  CONSTRAINT valid_quantity CHECK (
    quantity_available >= 0 AND
    quantity_sold >= 0 AND
    quantity_sold <= quantity_available
  ),
  CONSTRAINT valid_duration CHECK (listing_duration IS NULL OR listing_duration > 0),
  CONSTRAINT valid_handling_time CHECK (handling_time >= 1),
  CONSTRAINT valid_auction_fields CHECK (
    (listing_format = 'auction' AND starting_bid IS NOT NULL) OR
    (listing_format != 'auction')
  ),
  CONSTRAINT valid_sale_data CHECK (
    (status = 'sold' AND sale_price IS NOT NULL AND sale_date IS NOT NULL) OR
    (status != 'sold')
  ),
  CONSTRAINT valid_currency CHECK (length(currency) = 3),
  CONSTRAINT unique_external_listing CHECK (
    external_listing_id IS NULL OR
    (external_listing_id IS NOT NULL AND marketplace_type IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_inventory_item_id ON public.listings(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_type ON public.listings(marketplace_type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_external_id ON public.listings(external_listing_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_end_time ON public.listings(end_time) WHERE end_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_sale_date ON public.listings(sale_date) WHERE sale_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_deleted_at ON public.listings(deleted_at) WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_user_status ON public.listings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_user_marketplace ON public.listings(user_id, marketplace_type);
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_status ON public.listings(marketplace_type, status);
CREATE INDEX IF NOT EXISTS idx_listings_item_marketplace ON public.listings(inventory_item_id, marketplace_type);

-- Unique constraint for external listing IDs per marketplace
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_external_unique
ON public.listings(marketplace_type, external_listing_id)
WHERE external_listing_id IS NOT NULL AND deleted_at IS NULL;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_listings_title_search ON public.listings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_search ON public.listings USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_listings_tags_search ON public.listings USING gin(tags);

-- Create trigger for updated_at
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate net profit
CREATE OR REPLACE FUNCTION calculate_listing_profit()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total fees
  NEW.total_fees = COALESCE(NEW.marketplace_fee, 0) +
                   COALESCE(NEW.payment_processing_fee, 0) +
                   COALESCE(NEW.promotional_fee, 0) +
                   COALESCE(NEW.actual_shipping_cost, 0);

  -- Calculate net profit if sold
  IF NEW.status = 'sold' AND NEW.sale_price IS NOT NULL THEN
    NEW.net_profit = NEW.sale_price - NEW.total_fees;
  END IF;

  -- Update status change timestamp if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.last_status_change = NOW();
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-calculate profit
CREATE TRIGGER calculate_listing_metrics
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_listing_profit();

-- Create function to handle listing status changes
CREATE OR REPLACE FUNCTION handle_listing_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inventory item status when listing status changes
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE public.inventory_items
    SET status = 'listed', updated_at = NOW()
    WHERE id = NEW.inventory_item_id;
  END IF;

  -- Update inventory item when listing is sold
  IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
    UPDATE public.inventory_items
    SET
      status = 'sold',
      sale_price = NEW.sale_price,
      sale_date = NEW.sale_date::date,
      sale_platform = NEW.marketplace_type::text,
      updated_at = NOW()
    WHERE id = NEW.inventory_item_id;
  END IF;

  -- Update inventory item back to available if listing cancelled/ended
  IF (NEW.status IN ('cancelled', 'ended', 'deleted') AND
      OLD.status IN ('active', 'pending')) THEN
    UPDATE public.inventory_items
    SET status = 'available', updated_at = NOW()
    WHERE id = NEW.inventory_item_id
    AND NOT EXISTS (
      SELECT 1 FROM public.listings
      WHERE inventory_item_id = NEW.inventory_item_id
      AND status IN ('active', 'pending', 'sold')
      AND id != NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for status changes
CREATE TRIGGER handle_listing_status_changes
  AFTER UPDATE OF status ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION handle_listing_status_change();

-- Row Level Security (RLS) Policies
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own listings
CREATE POLICY "Users can view own listings" ON public.listings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own listings
CREATE POLICY "Users can insert own listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own listings
CREATE POLICY "Users can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Service role can manage all listings
CREATE POLICY "Service role can manage all listings" ON public.listings
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Grant permissions
GRANT ALL ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

-- Create a view for active listings with performance metrics
CREATE OR REPLACE VIEW public.active_listings AS
SELECT
  l.*,
  i.title as item_title,
  i.brand as item_brand,
  i.category as item_category,
  i.condition as item_condition,
  i.purchase_price as item_cost,

  -- Performance calculations
  CASE
    WHEN l.status = 'sold' AND l.sale_price IS NOT NULL AND i.purchase_price IS NOT NULL
    THEN l.sale_price - i.purchase_price - COALESCE(l.total_fees, 0)
    ELSE NULL
  END as gross_profit,

  CASE
    WHEN l.status = 'sold' AND l.sale_price IS NOT NULL AND i.purchase_price IS NOT NULL AND i.purchase_price > 0
    THEN ((l.sale_price - i.purchase_price - COALESCE(l.total_fees, 0)) / i.purchase_price * 100)
    ELSE NULL
  END as roi_percentage,

  EXTRACT(DAY FROM NOW() - l.start_time)::INTEGER as days_listed,

  CASE
    WHEN l.end_time IS NOT NULL
    THEN EXTRACT(DAY FROM l.end_time - NOW())::INTEGER
    ELSE NULL
  END as days_remaining

FROM public.listings l
JOIN public.inventory_items i ON l.inventory_item_id = i.id
WHERE l.deleted_at IS NULL
  AND l.status IN ('active', 'pending', 'sold');

-- RLS for active listings view
ALTER VIEW public.active_listings OWNER TO supabase_admin;
GRANT SELECT ON public.active_listings TO authenticated;

-- Create function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_listing(listing_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.listings
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = listing_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ language 'plpgsql' SECURITY DEFINER;