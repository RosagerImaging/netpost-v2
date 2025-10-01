/**
 * Connection Stats Component
 *
 * Displays overview statistics for marketplace connections
 */

'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  cn,
} from '@netpost/ui';
import { Plus } from 'lucide-react';
import { getMarketplaceDisplayInfo } from '@/lib/marketplaces';
import type { MarketplaceType } from '@netpost/shared-types';

interface ConnectionStatsProps {
  total: number;
  active: number;
  expired: number;
  errors: number;
  byMarketplace: Record<MarketplaceType, number>;
  onAddConnection: (marketplace?: MarketplaceType) => void;
}

export function ConnectionStats({
  total,
  active,
  expired,
  errors,
  byMarketplace,
  onAddConnection,
}: ConnectionStatsProps) {
  const stats = [
    {
      name: 'Total Connections',
      value: total,
      accent: 'from-primary/40 via-primary/10 to-transparent',
      change: null,
    },
    {
      name: 'Active',
      value: active,
      accent: 'from-emerald-500/40 via-emerald-500/10 to-transparent',
      change: null,
    },
    {
      name: 'Needs Attention',
      value: expired + errors,
      accent: expired + errors > 0
        ? 'from-amber-500/40 via-amber-500/10 to-transparent'
        : 'from-muted/40 via-muted/10 to-transparent',
      change: null,
    },
  ];

  // Get top marketplaces by connection count
  const topMarketplaces = Object.entries(byMarketplace)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name} className="glass-card border border-white/10">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {stat.name}
                </span>
                <span className="text-3xl font-semibold text-foreground">
                  {stat.value}
                </span>
              </div>
              <div
                className="h-1.5 w-full rounded-full bg-white/10"
                style={{
                  backgroundImage: `linear-gradient(90deg, var(--glass-start, rgba(255,255,255,0.05)), rgba(255,255,255,0))`,
                  boxShadow: '0 0 12px rgba(255,255,255,0.12)',
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {total > 0 && (
        <Card className="glass-card border border-white/10">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Connected Marketplaces
            </CardTitle>
            <Button variant="accent" size="sm" className="inline-flex items-center gap-2" onClick={() => onAddConnection()}>
              <Plus className="h-4 w-4" />
              Add Marketplace
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topMarketplaces.map(([marketplace, count]) => {
                const info = getMarketplaceDisplayInfo(marketplace as MarketplaceType);
                return (
                  <button
                    key={marketplace}
                    onClick={() => onAddConnection(marketplace as MarketplaceType)}
                    className="glass-card flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold text-white"
                      style={{ backgroundColor: info.color }}
                    >
                      {info.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {info.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {count} connection{count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Separator orientation="vertical" className="h-6 bg-white/10" />
                    <Badge variant="secondary" className="glass-card border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
                      View
                    </Badge>
                  </button>
                );
              })}

              {topMarketplaces.length < 4 && (
                <button
                  className="glass-card flex items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-muted-foreground transition hover:border-white/40 hover:text-foreground"
                  onClick={() => onAddConnection()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="text-xs uppercase tracking-[0.3em]">Add marketplace</span>
                  </div>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {total === 0 && (
        <Card className="glass-card border border-primary/30 bg-primary/10">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Start cross-listing today</h3>
              <p className="text-sm text-muted-foreground">
                Connect your marketplace accounts to begin syncing inventory everywhere you sell.
              </p>
            </div>
            <Button variant="accent" className="inline-flex items-center gap-2" onClick={() => onAddConnection()}>
              <Plus className="h-4 w-4" />
              Connect marketplace
            </Button>
          </CardContent>
        </Card>
      )}

      {total > 0 && total < 3 && (
        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maximize your reach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Consider connecting these popular marketplaces to expand your presence.
            </p>
            <div className="flex flex-wrap gap-2">
              {['ebay', 'poshmark', 'facebook_marketplace'].filter(
                marketplace => !byMarketplace[marketplace as MarketplaceType]
              ).map((marketplace) => {
                const info = getMarketplaceDisplayInfo(marketplace as MarketplaceType);
                return (
                  <Button
                    key={marketplace}
                    variant="outline"
                    size="sm"
                    className="glass-button inline-flex items-center gap-2"
                    onClick={() => onAddConnection(marketplace as MarketplaceType)}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    {info.name}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}