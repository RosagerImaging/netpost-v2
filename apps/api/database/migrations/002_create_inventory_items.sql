-- Migration: Create Inventory Items Table
-- Purpose: Core inventory management with photos, descriptions, and sourcing information
-- Date: 2025-09-17
-- Author: BMad Development Agent (James)

-- Create enum types for inventory item fields
CREATE TYPE public.inventory_item_status AS ENUM (
  'draft',         -- Item added but not ready for listing
  'available',     -- Item ready for listing
  'listed',        -- Item currently listed on one or more platforms
  'sold',          -- Item sold
  'reserved',      -- Item reserved/on hold
  'returned',      -- Item returned from buyer
  'damaged',       -- Item damaged/unsellable
  'donated',       -- Item donated
  'archived'       -- Item archived/removed from active inventory
);

CREATE TYPE public.inventory_item_condition AS ENUM (
  'new_with_tags',      -- New with original tags
  'new_without_tags',   -- New without tags
  'like_new',           -- Excellent condition, barely used
  'excellent',          -- Very good condition, minor wear
  'good',               -- Good condition, normal wear
  'fair',               -- Fair condition, noticeable wear
  'poor',               -- Poor condition, significant wear
  'for_parts'           -- Item for parts/repair only
);

CREATE TYPE public.size_type AS ENUM (
  'numeric',      -- Numeric sizes (2, 4, 6, 8, etc.)
  'letter',       -- Letter sizes (XS, S, M, L, XL, etc.)
  'age',          -- Age-based sizing (2T, 3T, 4-5Y, etc.)
  'shoe_us',      -- US shoe sizes
  'shoe_eu',      -- European shoe sizes
  'one_size',     -- One size fits all
  'custom'        -- Custom sizing
);

-- Create the inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Association
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Basic Item Information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  tags TEXT[], -- Array of searchable tags

  -- Item Condition & Details
  condition public.inventory_item_condition NOT NULL DEFAULT 'good',
  condition_notes TEXT, -- Additional condition details
  size_type public.size_type,
  size_value VARCHAR(50), -- The actual size (e.g., "Medium", "10", "32W x 34L")
  color VARCHAR(100),
  material TEXT,

  -- Product Identifiers
  sku VARCHAR(100), -- User-defined SKU
  upc VARCHAR(20),  -- Universal Product Code
  barcode VARCHAR(50), -- Any barcode format
  model_number VARCHAR(100),

  -- Sourcing Information
  source_location VARCHAR(255), -- Where item was acquired
  source_type VARCHAR(100), -- 'thrift', 'garage_sale', 'estate_sale', 'wholesale', 'retail', 'gift', 'trade'
  purchase_price DECIMAL(10,2), -- What user paid for item
  purchase_date DATE,
  receipt_photo_url TEXT, -- Photo of receipt/proof of purchase

  -- Pricing & Valuation
  estimated_value DECIMAL(10,2), -- AI or user estimated value
  minimum_price DECIMAL(10,2), -- Minimum acceptable sale price
  target_price DECIMAL(10,2),   -- Ideal sale price
  market_price DECIMAL(10,2),   -- Current market price (from AI analysis)
  last_price_update TIMESTAMPTZ, -- When market price was last updated

  -- Physical Attributes
  weight_oz DECIMAL(8,2), -- Weight in ounces for shipping
  length_in DECIMAL(8,2), -- Length in inches
  width_in DECIMAL(8,2),  -- Width in inches
  height_in DECIMAL(8,2), -- Height in inches

  -- Media & Documentation
  photos JSONB DEFAULT '[]', -- Array of photo URLs and metadata
  primary_photo_url TEXT, -- Quick access to main photo
  videos JSONB DEFAULT '[]', -- Array of video URLs and metadata
  documents JSONB DEFAULT '[]', -- Array of document URLs (certificates, manuals, etc.)

  -- AI-Generated Metadata
  ai_generated_title TEXT, -- AI-suggested title
  ai_generated_description TEXT, -- AI-generated description
  ai_extracted_keywords TEXT[], -- AI-extracted keywords
  ai_suggested_category VARCHAR(100), -- AI-suggested category
  ai_condition_assessment public.inventory_item_condition, -- AI-assessed condition
  ai_price_estimate DECIMAL(10,2), -- AI price estimate
  ai_analysis_confidence DECIMAL(3,2), -- AI confidence score (0.00-1.00)
  ai_last_analyzed TIMESTAMPTZ, -- Last AI analysis date

  -- Listing & Sales Tracking
  status public.inventory_item_status DEFAULT 'draft',
  times_listed INTEGER DEFAULT 0, -- How many times item has been listed
  views_count INTEGER DEFAULT 0, -- Total views across platforms
  favorites_count INTEGER DEFAULT 0, -- Total favorites/saves
  inquiries_count INTEGER DEFAULT 0, -- Total buyer inquiries

  -- Sales Information
  sale_price DECIMAL(10,2), -- Final sale price (when sold)
  sale_date DATE, -- Date item was sold
  sale_platform VARCHAR(100), -- Platform where item sold
  buyer_feedback TEXT, -- Buyer feedback/review
  profit_loss DECIMAL(10,2), -- Calculated profit/loss

  -- Inventory Management
  quantity INTEGER DEFAULT 1, -- Number of identical items
  location_in_storage VARCHAR(255), -- Where item is stored
  storage_bin VARCHAR(100), -- Storage bin/container ID
  needs_photography BOOLEAN DEFAULT TRUE, -- Needs better photos
  needs_research BOOLEAN DEFAULT FALSE, -- Needs more research
  is_bundle BOOLEAN DEFAULT FALSE, -- Is this a bundle of items
  bundle_items UUID[], -- Array of item IDs if this is a bundle

  -- Performance Metrics
  days_in_inventory INTEGER, -- Computed: days since added
  listing_performance_score DECIMAL(3,2), -- Performance score across platforms

  -- System Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete timestamp

  -- Constraints
  CONSTRAINT valid_condition_confidence CHECK (ai_analysis_confidence >= 0.00 AND ai_analysis_confidence <= 1.00),
  CONSTRAINT valid_performance_score CHECK (listing_performance_score >= 0.00 AND listing_performance_score <= 1.00),
  CONSTRAINT positive_prices CHECK (
    (purchase_price IS NULL OR purchase_price >= 0) AND
    (estimated_value IS NULL OR estimated_value >= 0) AND
    (minimum_price IS NULL OR minimum_price >= 0) AND
    (target_price IS NULL OR target_price >= 0) AND
    (market_price IS NULL OR market_price >= 0) AND
    (sale_price IS NULL OR sale_price >= 0)
  ),
  CONSTRAINT positive_dimensions CHECK (
    (weight_oz IS NULL OR weight_oz >= 0) AND
    (length_in IS NULL OR length_in >= 0) AND
    (width_in IS NULL OR width_in >= 0) AND
    (height_in IS NULL OR height_in >= 0)
  ),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT valid_sale_data CHECK (
    (status = 'sold' AND sale_price IS NOT NULL AND sale_date IS NOT NULL) OR
    (status != 'sold')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_brand ON public.inventory_items(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_items_condition ON public.inventory_items(condition);
CREATE INDEX IF NOT EXISTS idx_inventory_items_created_at ON public.inventory_items(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sale_date ON public.inventory_items(sale_date) WHERE sale_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_deleted_at ON public.inventory_items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_upc ON public.inventory_items(upc) WHERE upc IS NOT NULL;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_title_search ON public.inventory_items USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_inventory_items_description_search ON public.inventory_items USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_inventory_items_tags_search ON public.inventory_items USING gin(tags);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_status ON public.inventory_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_category ON public.inventory_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_brand_condition ON public.inventory_items(brand, condition);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate days in inventory
CREATE OR REPLACE FUNCTION calculate_days_in_inventory()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days_in_inventory = EXTRACT(DAY FROM NOW() - NEW.created_at)::INTEGER;

  -- Calculate profit/loss if item is sold
  IF NEW.status = 'sold' AND NEW.sale_price IS NOT NULL AND NEW.purchase_price IS NOT NULL THEN
    NEW.profit_loss = NEW.sale_price - NEW.purchase_price;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-calculate days in inventory on update
CREATE TRIGGER calculate_inventory_metrics
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_days_in_inventory();

-- Row Level Security (RLS) Policies
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own inventory items
CREATE POLICY "Users can view own inventory" ON public.inventory_items
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own inventory items
CREATE POLICY "Users can insert own inventory" ON public.inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own inventory items
CREATE POLICY "Users can update own inventory" ON public.inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own inventory items (soft delete)
CREATE POLICY "Users can delete own inventory" ON public.inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Service role can manage all inventory items
CREATE POLICY "Service role can manage all inventory" ON public.inventory_items
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Grant permissions
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;

-- Create a view for inventory items with computed fields
CREATE OR REPLACE VIEW public.inventory_items_enhanced AS
SELECT
  i.*,
  -- Computed fields
  CASE
    WHEN i.status = 'sold' AND i.sale_price IS NOT NULL AND i.purchase_price IS NOT NULL
    THEN i.sale_price - i.purchase_price
    ELSE NULL
  END as calculated_profit_loss,

  EXTRACT(DAY FROM NOW() - i.created_at)::INTEGER as calculated_days_in_inventory,

  -- ROI calculation
  CASE
    WHEN i.status = 'sold' AND i.sale_price IS NOT NULL AND i.purchase_price IS NOT NULL AND i.purchase_price > 0
    THEN ((i.sale_price - i.purchase_price) / i.purchase_price * 100)
    ELSE NULL
  END as roi_percentage,

  -- Photo count
  COALESCE(jsonb_array_length(i.photos), 0) as photo_count,

  -- Has required data for listing
  CASE
    WHEN i.title IS NOT NULL
      AND i.description IS NOT NULL
      AND i.condition IS NOT NULL
      AND i.primary_photo_url IS NOT NULL
      AND i.target_price IS NOT NULL
    THEN TRUE
    ELSE FALSE
  END as ready_for_listing

FROM public.inventory_items i
WHERE i.deleted_at IS NULL;

-- RLS for enhanced view
ALTER VIEW public.inventory_items_enhanced OWNER TO supabase_admin;
GRANT SELECT ON public.inventory_items_enhanced TO authenticated;

-- Create function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_inventory_item(item_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.inventory_items
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = item_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ language 'plpgsql' SECURITY DEFINER;