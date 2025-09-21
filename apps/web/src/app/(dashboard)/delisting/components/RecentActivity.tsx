/**
 * Recent Activity Component
 * Displays a timeline of recent delisting activities and system events
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Activity,
  User,
  Bot,
  Calendar,
  ExternalLink,
  Settings
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

interface ActivityEvent {
  id: string;
  type: 'delisting_job_created' | 'delisting_job_completed' | 'delisting_job_failed' | 'manual_delisting' | 'preference_updated' | 'system_event';
  title: string;
  description: string;
  metadata: {
    job_id?: string;
    item_title?: string;
    marketplace?: string;
    marketplaces?: string[];
    status?: string;
    user_initiated?: boolean;
    error_message?: string;
  };
  created_at: string;
  user_id?: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecentActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Fetch recent activity events
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setActivities(data || []);
    } catch (err) {
      console.error('Error loading activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'delisting_job_created':
        return Clock;
      case 'delisting_job_completed':
        return CheckCircle;
      case 'delisting_job_failed':
        return XCircle;
      case 'manual_delisting':
        return User;
      case 'preference_updated':
        return Settings;
      case 'system_event':
        return Bot;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    if (type === 'delisting_job_completed') return 'text-green-600';
    if (type === 'delisting_job_failed') return 'text-red-600';
    if (type === 'delisting_job_created') return 'text-blue-600';
    if (type === 'manual_delisting') return 'text-purple-600';
    if (type === 'preference_updated') return 'text-orange-600';
    return 'text-muted-foreground';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  useEffect(() => {
    loadRecentActivity();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading activity...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest delisting activities and system events
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRecentActivity}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground">
              Activity will appear here as you use the delisting features
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const color = getActivityColor(activity.type, activity.metadata.status);

              return (
                <div key={activity.id} className="flex gap-3">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full bg-background border-2 ${color.replace('text-', 'border-')}`}>
                      <Icon className={`h-3 w-3 ${color}`} />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-px h-6 bg-border mt-2" />
                    )}
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>

                        {/* Activity metadata */}
                        {activity.metadata && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {activity.metadata.item_title && (
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata.item_title}
                              </Badge>
                            )}
                            {activity.metadata.marketplace && (
                              <Badge variant="secondary" className="text-xs">
                                {formatMarketplaceName(activity.metadata.marketplace)}
                              </Badge>
                            )}
                            {activity.metadata.marketplaces && activity.metadata.marketplaces.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.metadata.marketplaces.length} marketplace{activity.metadata.marketplaces.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {activity.metadata.status && (
                              <Badge
                                variant={
                                  activity.metadata.status === 'completed' ? 'default' :
                                  activity.metadata.status === 'failed' ? 'destructive' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {activity.metadata.status}
                              </Badge>
                            )}
                            {activity.metadata.user_initiated && (
                              <Badge variant="outline" className="text-xs">
                                <User className="h-2 w-2 mr-1" />
                                Manual
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Error message for failed activities */}
                        {activity.metadata.error_message && (
                          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                            {activity.metadata.error_message}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(activity.created_at)}
                        </span>
                        {activity.metadata.job_id && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load more indicator */}
            {activities.length >= 50 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing recent 50 activities
                </p>
                <Button variant="ghost" size="sm" className="mt-2">
                  View all activity
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}