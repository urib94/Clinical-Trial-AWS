'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Activity,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/components/shared/ToastProvider'
import { formatDate, formatRelativeTime, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalPatients: number
  activeStudies: number
  pendingResponses: number
  activePatients: number
  totalResponses: number
  completedResponses: number
  inProgressResponses: number
  avgCompletionTime: number
}

interface ActivityItem {
  id: string
  type: 'response' | 'patient' | 'questionnaire'
  title: string
  patientId?: string
  status: string
  timestamp: string
}

export function Dashboard() {
  const [timeframe, setTimeframe] = useState('30')
  const { error: showError } = useToast()

  // Fetch dashboard overview
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['physician', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/physicians/dashboard')
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch dashboard statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['physician', 'dashboard', 'stats', timeframe],
    queryFn: async () => {
      const response = await apiClient.get(`/physicians/dashboard/stats?timeframe=${timeframe}`)
      return response.data.stats
    },
    refetchInterval: 60000, // Refresh every minute
  })

  useEffect(() => {
    if (dashboardError) {
      showError('Failed to load dashboard', 'Please refresh the page to try again.')
    }
  }, [dashboardError, showError])

  const stats = statsData as DashboardStats
  const overview = dashboardData?.dashboard?.overview
  const recentActivity = dashboardData?.dashboard?.recentActivity || []

  const statCards = [
    {
      name: 'Total Patients',
      value: overview?.totalPatients || 0,
      change: stats?.activePatients ? '+' + (stats.activePatients - (overview?.totalPatients || 0)) : null,
      changeType: 'positive' as const,
      icon: Users,
      href: '/physician/patients',
      color: 'bg-primary-500',
    },
    {
      name: 'Active Studies',
      value: overview?.activeStudies || 0,
      change: null,
      changeType: 'neutral' as const,
      icon: FileText,
      href: '/physician/questionnaires',
      color: 'bg-secondary-500',
    },
    {
      name: 'Pending Responses',
      value: overview?.pendingResponses || 0,
      change: stats?.inProgressResponses ? `${stats.inProgressResponses} in progress` : null,
      changeType: 'neutral' as const,
      icon: Clock,
      href: '/physician/patients',
      color: 'bg-warning-500',
    },
    {
      name: 'Completion Rate',
      value: stats ? Math.round((stats.completedResponses / stats.totalResponses) * 100) || 0 : 0,
      change: null,
      changeType: 'positive' as const,
      icon: CheckCircle,
      href: '/physician/analytics',
      color: 'bg-success-500',
      suffix: '%',
    },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your clinical trials.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/physician/questionnaires/new"
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Questionnaire
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.name} className="card overflow-hidden">
            <Link href={card.href} className="block hover:bg-gray-50 transition-colors">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={cn('p-3 rounded-md', card.color)}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {formatNumber(card.value)}{card.suffix}
                        </div>
                        {card.change && (
                          <div className={cn(
                            'ml-2 flex items-baseline text-sm font-semibold',
                            card.changeType === 'positive' ? 'text-success-600' : 
                            card.changeType === 'negative' ? 'text-error-600' : 'text-gray-500'
                          )}>
                            {card.change}
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Activity
                </h3>
                <Link
                  href="/physician/patients"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="card-body">
              {dashboardLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {recentActivity.map((activity: ActivityItem, activityIdx: number) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== recentActivity.length - 1 ? (
                            <span
                              className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={cn(
                                'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                                activity.status === 'completed' ? 'bg-success-500' :
                                activity.status === 'in_progress' ? 'bg-warning-500' :
                                'bg-gray-400'
                              )}>
                                {activity.type === 'response' ? (
                                  <FileText className="h-4 w-4 text-white" />
                                ) : activity.type === 'patient' ? (
                                  <Users className="h-4 w-4 text-white" />
                                ) : (
                                  <Activity className="h-4 w-4 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {activity.title}
                                </p>
                                {activity.patientId && (
                                  <p className="text-sm text-gray-500">
                                    Patient ID: {activity.patientId}
                                  </p>
                                )}
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                {formatRelativeTime(activity.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Patient responses and questionnaire updates will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <Link
                  href="/physician/questionnaires/new"
                  className="w-full flex items-center px-3 py-2 border border-gray-300 shadow-sm rounded-md text-sm leading-4 font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FileText className="h-4 w-4 mr-3 text-gray-400" />
                  Create Questionnaire
                </Link>
                <Link
                  href="/physician/patients/invite"
                  className="w-full flex items-center px-3 py-2 border border-gray-300 shadow-sm rounded-md text-sm leading-4 font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Users className="h-4 w-4 mr-3 text-gray-400" />
                  Invite Patients
                </Link>
                <Link
                  href="/physician/analytics"
                  className="w-full flex items-center px-3 py-2 border border-gray-300 shadow-sm rounded-md text-sm leading-4 font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <BarChart3 className="h-4 w-4 mr-3 text-gray-400" />
                  View Analytics
                </Link>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Performance
                </h3>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              {statsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Responses</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats.totalResponses)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Completion Rate</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.totalResponses > 0 
                        ? Math.round((stats.completedResponses / stats.totalResponses) * 100)
                        : 0}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Avg. Time</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.avgCompletionTime} min
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Active Patients</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats.activePatients)}
                    </dd>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <BarChart3 className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    No data available for selected timeframe
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}