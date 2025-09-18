-- Migration: Create Notifications Table for In-App Notifications
-- Purpose: Support in-app notification system for delisting and other events
-- Date: 2025-09-18
-- Author: BMad Development Agent (James) - Story 1.7

-- Create enum for notification types
CREATE TYPE public.notification_type AS ENUM (
  'delisting',
  'listing',
  'inventory',
  'marketplace',
  'system',
  'billing'
);

-- Create enum for notification priority
CREATE TYPE public.notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Notification content
  type public.notification_type NOT NULL,
  priority public.notification_priority DEFAULT 'normal',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Optional action
  action_url TEXT, -- URL to navigate to when notification is clicked
  action_label VARCHAR(100), -- Text for action button

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional data for the notification

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,

  -- Expiration (optional)
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_read_status CHECK (
    (read = FALSE AND read_at IS NULL) OR
    (read = TRUE AND read_at IS NOT NULL)
  ),
  CONSTRAINT valid_archived_status CHECK (
    (archived = FALSE AND archived_at IS NULL) OR
    (archived = TRUE AND archived_at IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users cannot insert notifications directly" ON public.notifications
  FOR INSERT WITH CHECK (FALSE);

CREATE POLICY "Users cannot delete notifications directly" ON public.notifications
  FOR DELETE USING (FALSE);

-- Service role policies (for system operations)
CREATE POLICY "Service role can manage all notifications" ON public.notifications
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Grant permissions
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET
    read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND read = FALSE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  target_user_id UUID;
  updated_count INTEGER;
BEGIN
  -- Use provided user ID or current auth user
  target_user_id := COALESCE(p_user_id, auth.uid());

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user ID provided';
  END IF;

  UPDATE public.notifications
  SET
    read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE user_id = target_user_id
    AND read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive notification
CREATE OR REPLACE FUNCTION archive_notification(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET
    archived = TRUE,
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid()
    AND archived = FALSE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification stats for a user
CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_count BIGINT,
  unread_count BIGINT,
  high_priority_unread BIGINT,
  urgent_priority_unread BIGINT
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(p_user_id, auth.uid());

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user ID provided';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE NOT read AND (expires_at IS NULL OR expires_at > NOW()))::BIGINT as unread_count,
    COUNT(*) FILTER (WHERE NOT read AND priority = 'high' AND (expires_at IS NULL OR expires_at > NOW()))::BIGINT as high_priority_unread,
    COUNT(*) FILTER (WHERE NOT read AND priority = 'urgent' AND (expires_at IS NULL OR expires_at > NOW()))::BIGINT as urgent_priority_unread
  FROM public.notifications
  WHERE user_id = target_user_id
    AND NOT archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for active notifications (not expired, not archived)
CREATE OR REPLACE VIEW public.active_notifications AS
SELECT
  n.*,
  CASE
    WHEN NOT n.read AND n.priority = 'urgent' THEN 4
    WHEN NOT n.read AND n.priority = 'high' THEN 3
    WHEN NOT n.read AND n.priority = 'normal' THEN 2
    WHEN NOT n.read AND n.priority = 'low' THEN 1
    ELSE 0
  END as sort_priority
FROM public.notifications n
WHERE NOT n.archived
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY sort_priority DESC, n.created_at DESC;

-- Grant permissions on functions and views
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications() TO service_role;

GRANT SELECT ON public.active_notifications TO authenticated;
GRANT SELECT ON public.active_notifications TO service_role;