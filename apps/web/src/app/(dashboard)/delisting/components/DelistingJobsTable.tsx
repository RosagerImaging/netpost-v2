/**
 * Delisting Jobs Table Component
 * Displays a comprehensive table of delisting jobs with filtering, sorting, and actions
 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@netpost/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  X,
  RotateCcw,
  MoreHorizontal
} from 'lucide-react';

interface DelistingJob {
  id: string
  item_title: string
  item_id: string
  sold_on_marketplace: string
  marketplaces_targeted: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partially_failed' | 'cancelled'
  scheduled_for: string
  started_at?: string
  completed_at?: string
  trigger_type: 'automatic' | 'manual' | 'scheduled'
  requires_user_confirmation: boolean
  results?: {
    marketplace: string
    status: 'success' | 'failed' | 'skipped'
    message?: string
    delisted_at?: string
  }[]
  created_at: string
  updated_at: string
}

interface DelistingJobsTableProps {
  jobs: DelistingJob[]
  loading: boolean
  onRetry: (jobId: string) => Promise<void>
  onCancel: (jobId: string) => Promise<void>
  onConfirm: (jobId: string) => Promise<void>
  onRefresh: () => Promise<void>
}

export function DelistingJobsTable({
  jobs,
  loading,
  onRetry,
  onCancel,
  onConfirm,
  onRefresh
}: DelistingJobsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [marketplaceFilter, setMarketplaceFilter] = useState('all')
  const [triggerTypeFilter, setTriggerTypeFilter] = useState('all')
  const [selectedJob, setSelectedJob] = useState<DelistingJob | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !job.item_title.toLowerCase().includes(query) &&
          !job.id.toLowerCase().includes(query) &&
          !job.sold_on_marketplace.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all' && job.status !== statusFilter) {
        return false
      }

      // Marketplace filter
      if (marketplaceFilter !== 'all') {
        if (
          job.sold_on_marketplace !== marketplaceFilter &&
          !job.marketplaces_targeted.includes(marketplaceFilter)
        ) {
          return false
        }
      }

      // Trigger type filter
      if (triggerTypeFilter !== 'all' && job.trigger_type !== triggerTypeFilter) {
        return false
      }

      return true
    })
  }, [jobs, searchQuery, statusFilter, marketplaceFilter, triggerTypeFilter])

  const getStatusBadge = (status: string) => {
    const pills: Record<string, { tone: 'positive' | 'warning' | 'negative' | 'info' | 'neutral'; icon: React.ElementType }> = {
      completed: { tone: 'positive', icon: CheckCircle },
      processing: { tone: 'info', icon: Loader2 },
      failed: { tone: 'negative', icon: XCircle },
      partially_failed: { tone: 'warning', icon: AlertTriangle },
      pending: { tone: 'neutral', icon: Clock },
      cancelled: { tone: 'neutral', icon: X },
    }

    const pill = pills[status] || pills.pending
    const Icon = pill.icon

    const toneClasses: Record<typeof pill.tone, string> = {
      positive: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
      warning: 'border-amber-500/30 bg-amber-500/15 text-amber-100',
      negative: 'border-red-500/30 bg-red-500/15 text-red-200',
      info: 'border-sky-500/30 bg-sky-500/15 text-sky-200',
      neutral: 'border-white/15 bg-white/10 text-muted-foreground',
    }

    return (
      <Badge
        variant="secondary"
        className={cn(
          'glass-card flex items-center gap-1 border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.25em]',
          toneClasses[pill.tone]
        )}
      >
        <Icon className={cn('h-3 w-3', status === 'processing' && 'animate-spin')} />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const formatMarketplaceName = (marketplace: string) => {
    const names: Record<string, string> = {
      'ebay': 'eBay',
      'poshmark': 'Poshmark',
      'facebook_marketplace': 'Facebook Marketplace',
      'mercari': 'Mercari',
      'depop': 'Depop',
    }
    return names[marketplace] || marketplace
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAction = async (action: 'retry' | 'cancel' | 'confirm', jobId: string) => {
    setActionInProgress(jobId)
    try {
      switch (action) {
        case 'retry':
          await onRetry(jobId)
          break
        case 'cancel':
          await onCancel(jobId)
          break
        case 'confirm':
          await onConfirm(jobId)
          break
      }
    } catch (error) {
      console.error(`Error performing ${action} on job ${jobId}:`, error)
    } finally {
      setActionInProgress(null)
    }
  }

  const getAvailableMarketplaces = () => {
    const marketplaces = new Set<string>()
    jobs.forEach(job => {
      marketplaces.add(job.sold_on_marketplace)
      job.marketplaces_targeted.forEach(m => marketplaces.add(m))
    })
    return Array.from(marketplaces)
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card border border-white/10">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-muted-foreground">Delisting Jobs</CardTitle>
            <CardDescription>
              Monitor and manage all delisting operations · {filteredJobs.length} of {jobs.length} jobs visible
            </CardDescription>
          </div>
          <Button onClick={onRefresh} disabled={loading} size="sm" variant="accent" className="glass-button inline-flex items-center gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="glass-card border border-white/10">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="partially_failed">Partially Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Marketplace</Label>
              <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="All marketplaces" />
                </SelectTrigger>
                <SelectContent className="glass-card border border-white/10">
                  <SelectItem value="all">All Marketplaces</SelectItem>
                  {getAvailableMarketplaces().map(marketplace => (
                    <SelectItem key={marketplace} value={marketplace}>
                      {formatMarketplaceName(marketplace)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Trigger Type</Label>
              <Select value={triggerTypeFilter} onValueChange={setTriggerTypeFilter}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="glass-card border border-white/10">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="glass-card border border-white/10">
            <CardContent className="p-0">
              {loading && jobs.length === 0 ? (
                <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading delisting jobs...
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10" />
                  <p className="text-sm">No delisting jobs found</p>
                  <p className="text-xs">Try adjusting your search filters</p>
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        <th className="p-4">Item</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Sold On</th>
                        <th className="p-4">Targets</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Scheduled</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4 align-top">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">{job.item_title}</p>
                              <p className="text-xs text-muted-foreground">ID: {job.id.slice(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              {getStatusBadge(job.status)}
                              {job.requires_user_confirmation && job.status === 'pending' && (
                                <Badge variant="secondary" className="glass-card border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
                                  Needs confirmation
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <Badge variant="outline" className="glass-card border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em]">
                              {formatMarketplaceName(job.sold_on_marketplace)}
                            </Badge>
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex flex-wrap gap-1">
                              {job.marketplaces_targeted.map((marketplace) => (
                                <Badge key={marketplace} variant="secondary" className="glass-card border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
                                  {formatMarketplaceName(marketplace)}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <Badge variant="outline" className="glass-card border border-white/10 px-2 py-1 text-[11px] capitalize tracking-[0.2em]">
                              {job.trigger_type}
                            </Badge>
                          </td>
                          <td className="p-4 align-top">
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p className="text-foreground">{formatDate(job.scheduled_for)}</p>
                              {job.started_at && <p>Started: {formatDate(job.started_at)}</p>}
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              {job.status === 'pending' && job.requires_user_confirmation && (
                                <Button
                                  size="icon-sm"
                                  variant="accent"
                                  className="glass-button"
                                  onClick={() => handleAction('confirm', job.id)}
                                  disabled={actionInProgress === job.id}
                                >
                                  {actionInProgress === job.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              {(job.status === 'failed' || job.status === 'partially_failed') && (
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  className="glass-button"
                                  onClick={() => handleAction('retry', job.id)}
                                  disabled={actionInProgress === job.id}
                                >
                                  {actionInProgress === job.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              {(job.status === 'pending' || job.status === 'processing') && (
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  className="glass-button"
                                  onClick={() => handleAction('cancel', job.id)}
                                  disabled={actionInProgress === job.id}
                                >
                                  {actionInProgress === job.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="glass-button"
                                onClick={() => setSelectedJob(job)}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="glass-card max-w-2xl border border-white/10">
            <DialogHeader>
              <DialogTitle className="text-muted-foreground">Job Details</DialogTitle>
              <DialogDescription>
                Delisting job {selectedJob.id}: status {selectedJob.status.replace('_', ' ')} targeting {formatMarketplaceName(selectedJob.sold_on_marketplace)}. Scheduled for {formatDate(selectedJob.scheduled_for)}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Item</Label>
                  <p className="text-sm text-foreground">{selectedJob.item_title}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</Label>
                  <div className="mt-2">
                    {getStatusBadge(selectedJob.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sold On</Label>
                  <p className="text-sm text-foreground">{formatMarketplaceName(selectedJob.sold_on_marketplace)}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Trigger Type</Label>
                  <p className="text-sm capitalize text-foreground">{selectedJob.trigger_type}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Scheduled For</Label>
                  <p className="text-sm text-foreground">{formatDate(selectedJob.scheduled_for)}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Created</Label>
                  <p className="text-sm text-foreground">{formatDate(selectedJob.created_at)}</p>
                </div>
              </div>

              {selectedJob.results && selectedJob.results.length > 0 && (
                <div>
                  <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Results</Label>
                  <div className="mt-3 space-y-2">
                    {selectedJob.results.map((result, index) => (
                      <div key={index} className="glass-card flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-sm text-foreground">{formatMarketplaceName(result.marketplace)}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={result.status === 'success' ? 'secondary' : result.status === 'failed' ? 'destructive' : 'outline'}
                            className="glass-pill text-xs uppercase tracking-[0.2em]"
                          >
                            {result.status}
                          </Badge>
                          {result.message && (
                            <span className="text-xs text-muted-foreground">{result.message}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" className="glass-button" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}