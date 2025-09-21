/**
 * Delisting Jobs Table Component
 * Displays a comprehensive table of delisting jobs with filtering, sorting, and actions
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Play,
  X,
  RotateCcw,
  ExternalLink,
  Download,
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
    const variants: Record<string, 'default' | 'outline' | 'destructive' | 'secondary'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      partially_failed: 'outline',
      pending: 'outline',
      cancelled: 'secondary',
    }

    const icons = {
      completed: CheckCircle,
      processing: Loader2,
      failed: XCircle,
      partially_failed: AlertTriangle,
      pending: Clock,
      cancelled: X,
    }

    const Icon = icons[status as keyof typeof icons] || Clock
    const variant = variants[status] || 'outline'

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
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

  if (loading && jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading delisting jobs...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Delisting Jobs</CardTitle>
              <CardDescription>
                Monitor and manage all delisting operations ({filteredJobs.length} of {jobs.length} jobs)
              </CardDescription>
            </div>
            <Button onClick={onRefresh} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
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
            <div>
              <Label>Marketplace</Label>
              <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All marketplaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marketplaces</SelectItem>
                  {getAvailableMarketplaces().map(marketplace => (
                    <SelectItem key={marketplace} value={marketplace}>
                      {formatMarketplaceName(marketplace)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trigger Type</Label>
              <Select value={triggerTypeFilter} onValueChange={setTriggerTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No delisting jobs found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Item</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Sold On</th>
                    <th className="p-4 font-medium">Targets</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Scheduled</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-sm">{job.item_title}</p>
                          <p className="text-xs text-muted-foreground">ID: {job.id.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(job.status)}
                        {job.requires_user_confirmation && job.status === 'pending' && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Needs Confirmation
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {formatMarketplaceName(job.sold_on_marketplace)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {job.marketplaces_targeted.map((marketplace) => (
                            <Badge key={marketplace} variant="secondary" className="text-xs">
                              {formatMarketplaceName(marketplace)}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          {job.trigger_type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>{formatDate(job.scheduled_for)}</p>
                          {job.started_at && (
                            <p className="text-xs text-muted-foreground">
                              Started: {formatDate(job.started_at)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {job.status === 'pending' && job.requires_user_confirmation && (
                            <Button
                              size="sm"
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
                              size="sm"
                              variant="outline"
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
                              size="sm"
                              variant="outline"
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
                            size="sm"
                            variant="ghost"
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

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>
                Detailed information for delisting job {selectedJob.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Item</Label>
                  <p className="text-sm">{selectedJob.item_title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedJob.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sold On</Label>
                  <p className="text-sm">{formatMarketplaceName(selectedJob.sold_on_marketplace)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trigger Type</Label>
                  <p className="text-sm capitalize">{selectedJob.trigger_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Scheduled For</Label>
                  <p className="text-sm">{formatDate(selectedJob.scheduled_for)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{formatDate(selectedJob.created_at)}</p>
                </div>
              </div>

              {selectedJob.results && selectedJob.results.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Results</Label>
                  <div className="mt-2 space-y-2">
                    {selectedJob.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{formatMarketplaceName(result.marketplace)}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.status === 'success' ? 'default' : result.status === 'failed' ? 'destructive' : 'secondary'}>
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
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}