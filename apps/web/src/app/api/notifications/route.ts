/**
 * API Routes for Notifications
 * Handles CRUD operations for in-app notifications
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications - Get user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === 'true';

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('active_notifications')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    // Apply pagination
    query = query
      .order('sort_priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get notification stats
    const { data: stats } = await supabase
      .rpc('get_notification_stats', { p_user_id: user.id });

    return NextResponse.json({
      notifications: notifications || [],
      stats: stats?.[0] || {
        total_count: 0,
        unread_count: 0,
        high_priority_unread: 0,
        urgent_priority_unread: 0,
      },
      pagination: {
        limit,
        offset,
        has_more: notifications && notifications.length === limit,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications - Mark notifications as read/archived
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, notification_ids } = body;

    if (!action || !['mark_read', 'mark_all_read', 'archive'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'mark_read':
        if (!notification_ids || !Array.isArray(notification_ids)) {
          return NextResponse.json({ error: 'notification_ids required for mark_read' }, { status: 400 });
        }

        // Mark specific notifications as read
        const markReadPromises = notification_ids.map(id =>
          supabase.rpc('mark_notification_read', { notification_id: id })
        );

        result = await Promise.all(markReadPromises);
        break;

      case 'mark_all_read':
        // Mark all notifications as read
        const { data: markAllResult } = await supabase
          .rpc('mark_all_notifications_read', { p_user_id: user.id });

        result = { updated_count: markAllResult };
        break;

      case 'archive':
        if (!notification_ids || !Array.isArray(notification_ids)) {
          return NextResponse.json({ error: 'notification_ids required for archive' }, { status: 400 });
        }

        // Archive specific notifications
        const archivePromises = notification_ids.map(id =>
          supabase.rpc('archive_notification', { notification_id: id })
        );

        result = await Promise.all(archivePromises);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
    });

  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}