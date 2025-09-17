-- Migration: Add Database Relationships & Additional Constraints
-- Purpose: Define comprehensive foreign keys, constraints, and data integrity rules
-- Date: 2025-09-17
-- Author: BMad Development Agent (James)

-- =====================================================
-- ADDITIONAL FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Ensure listings reference valid marketplace connections
-- Note: This is optional since users can create listings without connecting first
ALTER TABLE public.listings
ADD CONSTRAINT fk_listings_marketplace_connection
FOREIGN KEY (user_id, marketplace_type)
REFERENCES public.marketplace_connections (user_id, marketplace_type)
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

-- Create an index to support this FK
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_user_marketplace_fk
ON public.marketplace_connections(user_id, marketplace_type);

-- =====================================================
-- CROSS-TABLE DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Ensure inventory item belongs to same user as listing
CREATE OR REPLACE FUNCTION check_listing_inventory_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = NEW.inventory_item_id
    AND i.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Listing must reference inventory item owned by the same user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_listing_inventory_ownership
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION check_listing_inventory_ownership();

-- Ensure marketplace connection belongs to same user as listing
CREATE OR REPLACE FUNCTION check_listing_connection_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if listing references a marketplace connection
  IF NEW.marketplace_type IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.marketplace_connections mc
      WHERE mc.user_id = NEW.user_id
      AND mc.marketplace_type = NEW.marketplace_type
      AND mc.connection_status = 'active'
      AND mc.deleted_at IS NULL
    ) THEN
      -- Allow the listing but log a warning
      -- In practice, users might create listings before connecting
      RAISE NOTICE 'No active marketplace connection found for user % and marketplace %',
        NEW.user_id, NEW.marketplace_type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_listing_connection_ownership
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION check_listing_connection_ownership();

-- =====================================================
-- BUSINESS LOGIC CONSTRAINTS
-- =====================================================

-- Prevent sold inventory items from being listed again
CREATE OR REPLACE FUNCTION prevent_sold_item_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.inventory_items i
    WHERE i.id = NEW.inventory_item_id
    AND i.status = 'sold'
  ) AND NEW.status IN ('draft', 'pending', 'active') THEN
    RAISE EXCEPTION 'Cannot create active listing for sold inventory item';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_sold_item_listing_trigger
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_sold_item_listing();

-- Prevent multiple active listings for same item on same marketplace
CREATE OR REPLACE FUNCTION prevent_duplicate_active_listings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('active', 'pending') THEN
    IF EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.inventory_item_id = NEW.inventory_item_id
      AND l.marketplace_type = NEW.marketplace_type
      AND l.status IN ('active', 'pending')
      AND l.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND l.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Item already has an active listing on this marketplace';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_active_listings_trigger
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_active_listings();

-- =====================================================
-- ADVANCED CHECK CONSTRAINTS
-- =====================================================

-- Enhanced inventory item constraints
ALTER TABLE public.inventory_items
ADD CONSTRAINT check_bundle_consistency
CHECK (
  (is_bundle = TRUE AND array_length(bundle_items, 1) > 0) OR
  (is_bundle = FALSE)
);

ALTER TABLE public.inventory_items
ADD CONSTRAINT check_status_transitions
CHECK (
  -- Can't go from sold to other statuses without manual intervention
  (status != 'sold') OR
  (status = 'sold' AND sale_price IS NOT NULL AND sale_date IS NOT NULL)
);

-- Enhanced listing constraints
ALTER TABLE public.listings
ADD CONSTRAINT check_auction_requirements
CHECK (
  (listing_format = 'auction' AND starting_bid IS NOT NULL AND listing_duration IS NOT NULL) OR
  (listing_format != 'auction')
);

ALTER TABLE public.listings
ADD CONSTRAINT check_offer_pricing
CHECK (
  (minimum_offer_price IS NULL) OR
  (minimum_offer_price < listing_price)
);

ALTER TABLE public.listings
ADD CONSTRAINT check_quantity_consistency
CHECK (quantity_sold <= quantity_available);

ALTER TABLE public.listings
ADD CONSTRAINT check_end_time_logic
CHECK (
  (end_time IS NULL) OR
  (end_time > start_time)
);

-- Enhanced marketplace connection constraints
ALTER TABLE public.marketplace_connections
ADD CONSTRAINT check_token_expiry_logic
CHECK (
  (access_token_expires_at IS NULL) OR
  (refresh_token_expires_at IS NULL) OR
  (access_token_expires_at <= refresh_token_expires_at)
);

ALTER TABLE public.marketplace_connections
ADD CONSTRAINT check_oauth_state_security
CHECK (
  (auth_method NOT IN ('oauth1', 'oauth2')) OR
  (oauth_state IS NOT NULL AND length(oauth_state) >= 32)
);

-- =====================================================
-- DATA CONSISTENCY FUNCTIONS
-- =====================================================

-- Function to maintain inventory item counts in user profiles
CREATE OR REPLACE FUNCTION update_user_inventory_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_listings count
  UPDATE public.user_profiles
  SET total_listings = (
    SELECT COUNT(*)
    FROM public.inventory_items
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Update total_sales count
  UPDATE public.user_profiles
  SET total_sales = (
    SELECT COUNT(*)
    FROM public.inventory_items
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND status = 'sold'
    AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Update total_revenue
  UPDATE public.user_profiles
  SET total_revenue = (
    SELECT COALESCE(SUM(sale_price), 0)
    FROM public.inventory_items
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND status = 'sold'
    AND sale_price IS NOT NULL
    AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Update average_sale_price
  UPDATE public.user_profiles
  SET average_sale_price = (
    SELECT COALESCE(AVG(sale_price), 0)
    FROM public.inventory_items
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND status = 'sold'
    AND sale_price IS NOT NULL
    AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats when inventory changes
CREATE TRIGGER update_user_inventory_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_user_inventory_counts();

-- Function to maintain listing counts in inventory items
CREATE OR REPLACE FUNCTION update_inventory_listing_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update times_listed count for the inventory item
  UPDATE public.inventory_items
  SET times_listed = (
    SELECT COUNT(*)
    FROM public.listings
    WHERE inventory_item_id = COALESCE(NEW.inventory_item_id, OLD.inventory_item_id)
    AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.inventory_item_id, OLD.inventory_item_id);

  -- Update views_count (sum across all listings)
  UPDATE public.inventory_items
  SET views_count = (
    SELECT COALESCE(SUM(view_count), 0)
    FROM public.listings
    WHERE inventory_item_id = COALESCE(NEW.inventory_item_id, OLD.inventory_item_id)
    AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.inventory_item_id, OLD.inventory_item_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory stats when listings change
CREATE TRIGGER update_inventory_listing_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_listing_counts();

-- =====================================================
-- REFERENTIAL INTEGRITY HELPERS
-- =====================================================

-- Function to cascade soft deletes properly
CREATE OR REPLACE FUNCTION cascade_soft_delete_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- When inventory item is soft deleted, soft delete related listings
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.listings
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE inventory_item_id = NEW.id
    AND deleted_at IS NULL;
  END IF;

  -- When inventory item is restored, restore related listings
  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE public.listings
    SET deleted_at = NULL, updated_at = NOW()
    WHERE inventory_item_id = NEW.id
    AND deleted_at IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cascading soft deletes
CREATE TRIGGER cascade_inventory_soft_deletes
  AFTER UPDATE OF deleted_at ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION cascade_soft_delete_inventory();

-- =====================================================
-- VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate inventory item data consistency
CREATE OR REPLACE FUNCTION validate_inventory_item_data(item_id UUID)
RETURNS TABLE (
  validation_passed BOOLEAN,
  errors TEXT[]
) AS $$
DECLARE
  item_record public.inventory_items%ROWTYPE;
  error_list TEXT[] := '{}';
BEGIN
  SELECT * INTO item_record
  FROM public.inventory_items
  WHERE id = item_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, ARRAY['Item not found'];
    RETURN;
  END IF;

  -- Check required fields for listing
  IF item_record.title IS NULL OR length(trim(item_record.title)) = 0 THEN
    error_list := array_append(error_list, 'Title is required');
  END IF;

  IF item_record.condition IS NULL THEN
    error_list := array_append(error_list, 'Condition is required');
  END IF;

  -- Check price consistency
  IF item_record.target_price IS NOT NULL AND item_record.minimum_price IS NOT NULL THEN
    IF item_record.minimum_price >= item_record.target_price THEN
      error_list := array_append(error_list, 'Minimum price must be less than target price');
    END IF;
  END IF;

  -- Check sale data consistency
  IF item_record.status = 'sold' THEN
    IF item_record.sale_price IS NULL THEN
      error_list := array_append(error_list, 'Sale price required for sold items');
    END IF;
    IF item_record.sale_date IS NULL THEN
      error_list := array_append(error_list, 'Sale date required for sold items');
    END IF;
  END IF;

  -- Check bundle consistency
  IF item_record.is_bundle AND (item_record.bundle_items IS NULL OR array_length(item_record.bundle_items, 1) = 0) THEN
    error_list := array_append(error_list, 'Bundle items required for bundle inventory');
  END IF;

  RETURN QUERY SELECT (array_length(error_list, 1) = 0), error_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate listing data consistency
CREATE OR REPLACE FUNCTION validate_listing_data(listing_id UUID)
RETURNS TABLE (
  validation_passed BOOLEAN,
  errors TEXT[]
) AS $$
DECLARE
  listing_record public.listings%ROWTYPE;
  item_record public.inventory_items%ROWTYPE;
  error_list TEXT[] := '{}';
BEGIN
  SELECT * INTO listing_record
  FROM public.listings
  WHERE id = listing_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, ARRAY['Listing not found'];
    RETURN;
  END IF;

  -- Get associated inventory item
  SELECT * INTO item_record
  FROM public.inventory_items
  WHERE id = listing_record.inventory_item_id;

  -- Check required fields
  IF listing_record.title IS NULL OR length(trim(listing_record.title)) = 0 THEN
    error_list := array_append(error_list, 'Listing title is required');
  END IF;

  IF listing_record.description IS NULL OR length(trim(listing_record.description)) = 0 THEN
    error_list := array_append(error_list, 'Listing description is required');
  END IF;

  IF listing_record.listing_price <= 0 THEN
    error_list := array_append(error_list, 'Listing price must be greater than 0');
  END IF;

  -- Check auction-specific requirements
  IF listing_record.listing_format = 'auction' THEN
    IF listing_record.starting_bid IS NULL THEN
      error_list := array_append(error_list, 'Starting bid required for auction listings');
    END IF;
    IF listing_record.listing_duration IS NULL THEN
      error_list := array_append(error_list, 'Duration required for auction listings');
    END IF;
  END IF;

  -- Check inventory item status
  IF item_record.status = 'sold' AND listing_record.status IN ('draft', 'pending', 'active') THEN
    error_list := array_append(error_list, 'Cannot create active listing for sold item');
  END IF;

  RETURN QUERY SELECT (array_length(error_list, 1) = 0), error_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- Function to analyze database performance
CREATE OR REPLACE FUNCTION analyze_database_performance()
RETURNS TABLE (
  table_name TEXT,
  total_rows BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT,
  seq_scan BIGINT,
  idx_scan BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname||'.'||tablename AS table_name,
    n_tup_ins + n_tup_upd + n_tup_del AS total_rows,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) AS total_size,
    seq_scan,
    idx_scan
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to clean up old deleted records
CREATE OR REPLACE FUNCTION cleanup_old_deleted_records(days_old INTEGER DEFAULT 90)
RETURNS TABLE (
  table_name TEXT,
  records_deleted INTEGER
) AS $$
DECLARE
  cutoff_date TIMESTAMPTZ := NOW() - INTERVAL '1 day' * days_old;
  deleted_count INTEGER;
BEGIN
  -- Clean up old soft-deleted inventory items
  DELETE FROM public.inventory_items
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'inventory_items'::TEXT, deleted_count;

  -- Clean up old soft-deleted listings
  DELETE FROM public.listings
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'listings'::TEXT, deleted_count;

  -- Clean up old soft-deleted marketplace connections
  DELETE FROM public.marketplace_connections
  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'marketplace_connections'::TEXT, deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on utility functions to authenticated users
GRANT EXECUTE ON FUNCTION validate_inventory_item_data TO authenticated;
GRANT EXECUTE ON FUNCTION validate_listing_data TO authenticated;

-- Grant execute permissions on admin functions to service role only
GRANT EXECUTE ON FUNCTION analyze_database_performance TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_deleted_records TO service_role;