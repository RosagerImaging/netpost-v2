/**
 * Delisting Preferences Component
 * Modal dialog for configuring delisting automation preferences and settings
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Info
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

interface DelistingPreferences {
  auto_delist_enabled: boolean;
  require_confirmation: boolean;
  delay_minutes: number;
  marketplaces_enabled: string[];
  exclude_high_value_items: boolean;
  high_value_threshold: number;
  notification_preferences: {
    email_enabled: boolean;
    success_notifications: boolean;
    failure_notifications: boolean;
    summary_reports: boolean;
  };
  working_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
    timezone: string;
  };
}

interface DelistingPreferencesProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const defaultPreferences: DelistingPreferences = {
  auto_delist_enabled: true,
  require_confirmation: true,
  delay_minutes: 15,
  marketplaces_enabled: ['ebay', 'poshmark', 'facebook_marketplace', 'mercari', 'depop'],
  exclude_high_value_items: true,
  high_value_threshold: 500,
  notification_preferences: {
    email_enabled: true,
    success_notifications: false,
    failure_notifications: true,
    summary_reports: true,
  },
  working_hours: {
    enabled: false,
    start_time: '09:00',
    end_time: '17:00',
    timezone: 'America/New_York',
  },
};

const availableMarketplaces = [
  { value: 'ebay', label: 'eBay' },
  { value: 'poshmark', label: 'Poshmark' },
  { value: 'facebook_marketplace', label: 'Facebook Marketplace' },
  { value: 'mercari', label: 'Mercari' },
  { value: 'depop', label: 'Depop' },
];

export function DelistingPreferences({ open, onClose, onSaved }: DelistingPreferencesProps) {
  const [preferences, setPreferences] = useState<DelistingPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_preferences')
        .select('delisting_preferences')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.delisting_preferences) {
        setPreferences({ ...defaultPreferences, ...data.delisting_preferences });
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          delisting_preferences: preferences,
        });

      if (error) {
        throw error;
      }

      onSaved();
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
  };

  const handleMarketplaceToggle = (marketplace: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      marketplaces_enabled: enabled
        ? [...prev.marketplaces_enabled, marketplace]
        : prev.marketplaces_enabled.filter(m => m !== marketplace)
    }));
  };

  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Delisting Preferences
          </DialogTitle>
          <DialogDescription>
            Configure your automated delisting settings and preferences
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading preferences...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Settings</CardTitle>
                <CardDescription>
                  Core delisting automation preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-delist"
                    checked={preferences.auto_delist_enabled}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, auto_delist_enabled: !!checked }))
                    }
                  />
                  <Label htmlFor="auto-delist">Enable automatic delisting</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-confirmation"
                    checked={preferences.require_confirmation}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, require_confirmation: !!checked }))
                    }
                  />
                  <Label htmlFor="require-confirmation">Require manual confirmation for delisting</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delay">Delay before delisting (minutes)</Label>
                    <Input
                      id="delay"
                      type="number"
                      min="0"
                      max="1440"
                      value={preferences.delay_minutes}
                      onChange={(e) =>
                        setPreferences(prev => ({ ...prev, delay_minutes: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="threshold">High value threshold ($)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      value={preferences.high_value_threshold}
                      onChange={(e) =>
                        setPreferences(prev => ({ ...prev, high_value_threshold: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclude-high-value"
                    checked={preferences.exclude_high_value_items}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, exclude_high_value_items: !!checked }))
                    }
                  />
                  <Label htmlFor="exclude-high-value">Exclude high-value items from automatic delisting</Label>
                </div>
              </CardContent>
            </Card>

            {/* Marketplace Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Marketplace Settings</CardTitle>
                <CardDescription>
                  Choose which marketplaces to include in automatic delisting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableMarketplaces.map((marketplace) => (
                    <div key={marketplace.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`marketplace-${marketplace.value}`}
                        checked={preferences.marketplaces_enabled.includes(marketplace.value)}
                        onCheckedChange={(checked) =>
                          handleMarketplaceToggle(marketplace.value, !!checked)
                        }
                      />
                      <Label htmlFor={`marketplace-${marketplace.value}`}>
                        {marketplace.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                <CardDescription>
                  Configure when and how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-enabled"
                    checked={preferences.notification_preferences.email_enabled}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({
                        ...prev,
                        notification_preferences: {
                          ...prev.notification_preferences,
                          email_enabled: !!checked
                        }
                      }))
                    }
                  />
                  <Label htmlFor="email-enabled">Enable email notifications</Label>
                </div>

                {preferences.notification_preferences.email_enabled && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="success-notifications"
                        checked={preferences.notification_preferences.success_notifications}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              success_notifications: !!checked
                            }
                          }))
                        }
                      />
                      <Label htmlFor="success-notifications">Successful delisting notifications</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="failure-notifications"
                        checked={preferences.notification_preferences.failure_notifications}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              failure_notifications: !!checked
                            }
                          }))
                        }
                      />
                      <Label htmlFor="failure-notifications">Failed delisting notifications</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="summary-reports"
                        checked={preferences.notification_preferences.summary_reports}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              summary_reports: !!checked
                            }
                          }))
                        }
                      />
                      <Label htmlFor="summary-reports">Daily summary reports</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Working Hours</CardTitle>
                <CardDescription>
                  Restrict delisting operations to specific hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="working-hours-enabled"
                    checked={preferences.working_hours.enabled}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({
                        ...prev,
                        working_hours: {
                          ...prev.working_hours,
                          enabled: !!checked
                        }
                      }))
                    }
                  />
                  <Label htmlFor="working-hours-enabled">Enable working hours restrictions</Label>
                </div>

                {preferences.working_hours.enabled && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={preferences.working_hours.start_time}
                        onChange={(e) =>
                          setPreferences(prev => ({
                            ...prev,
                            working_hours: {
                              ...prev.working_hours,
                              start_time: e.target.value
                            }
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={preferences.working_hours.end_time}
                        onChange={(e) =>
                          setPreferences(prev => ({
                            ...prev,
                            working_hours: {
                              ...prev.working_hours,
                              end_time: e.target.value
                            }
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={preferences.working_hours.timezone}
                        onValueChange={(value) =>
                          setPreferences(prev => ({
                            ...prev,
                            working_hours: {
                              ...prev.working_hours,
                              timezone: value
                            }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={savePreferences} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}