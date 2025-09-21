/**
 * useDelistingStats Hook
 * Manages delisting statistics and metrics data
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DelistingStatsData {
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  pending_jobs: number
  partially_failed_jobs: number
  success_rate: number
  avg_completion_time: number
  total_items_delisted: number
  most_active_marketplace: string
  recent_trend: 'up' | 'down' | 'stable'
}

interface UseDelistingStatsResult {
  stats: DelistingStatsData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDelistingStats(): UseDelistingStatsResult {
  const [stats, setStats] = useState<DelistingStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch job statistics
      const { data: jobStats, error: jobStatsError } = await supabase
        .from('delisting_jobs')
        .select('status, started_at, completed_at, marketplaces_targeted')

      if (jobStatsError) {
        throw new Error(jobStatsError.message)
      }

      if (!jobStats) {
        setStats(null)
        return
      }

      // Calculate basic stats
      const totalJobs = jobStats.length
      const completedJobs = jobStats.filter(job => job.status === 'completed').length
      const failedJobs = jobStats.filter(job => job.status === 'failed').length
      const pendingJobs = jobStats.filter(job => job.status === 'pending').length
      const partiallyFailedJobs = jobStats.filter(job => job.status === 'partially_failed').length

      // Calculate success rate
      const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

      // Calculate average completion time (in seconds)
      const completedJobsWithTimes = jobStats.filter(job =>
        job.status === 'completed' && job.started_at && job.completed_at
      )

      let avgCompletionTime = 0
      if (completedJobsWithTimes.length > 0) {
        const totalTime = completedJobsWithTimes.reduce((sum, job) => {
          const started = new Date(job.started_at!).getTime()
          const completed = new Date(job.completed_at!).getTime()
          return sum + (completed - started)
        }, 0)
        avgCompletionTime = totalTime / completedJobsWithTimes.length / 1000 // Convert to seconds
      }

      // Count total items delisted
      const totalItemsDelisted = jobStats.reduce((sum, job) => {
        if (job.status === 'completed') {
          return sum + (job.marketplaces_targeted?.length || 0)
        }
        return sum
      }, 0)

      // Find most active marketplace
      const marketplaceCounts: Record<string, number> = {}
      jobStats.forEach(job => {
        job.marketplaces_targeted?.forEach((marketplace: string) => {
          marketplaceCounts[marketplace] = (marketplaceCounts[marketplace] || 0) + 1
        })
      })

      const mostActiveMarketplace = Object.entries(marketplaceCounts).reduce(
        (max, [marketplace, count]) => count > max.count ? { marketplace, count } : max,
        { marketplace: '', count: 0 }
      ).marketplace

      // Calculate recent trend (simple implementation - compare last 7 days vs previous 7 days)
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      const recentJobs = jobStats.filter(job =>
        new Date(job.started_at || job.completed_at || '') >= sevenDaysAgo
      ).length

      const previousJobs = jobStats.filter(job => {
        const jobDate = new Date(job.started_at || job.completed_at || '')
        return jobDate >= fourteenDaysAgo && jobDate < sevenDaysAgo
      }).length

      let recentTrend: 'up' | 'down' | 'stable' = 'stable'
      if (recentJobs > previousJobs * 1.1) {
        recentTrend = 'up'
      } else if (recentJobs < previousJobs * 0.9) {
        recentTrend = 'down'
      }

      const statsData: DelistingStatsData = {
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        failed_jobs: failedJobs,
        pending_jobs: pendingJobs,
        partially_failed_jobs: partiallyFailedJobs,
        success_rate: successRate,
        avg_completion_time: avgCompletionTime,
        total_items_delisted: totalItemsDelisted,
        most_active_marketplace: mostActiveMarketplace,
        recent_trend: recentTrend,
      }

      setStats(statsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch delisting statistics'
      setError(errorMessage)
      console.error('Error fetching delisting stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await fetchStats()
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refresh,
  }
}

export default useDelistingStats