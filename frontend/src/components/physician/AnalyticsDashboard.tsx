'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText,
  Clock,
  CheckCircle,
  Filter
} from 'lucide-react'
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/components/shared/ToastProvider'
import { formatNumber, formatDate } from '@/lib/utils'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('30')
  const [selectedMetric, setSelectedMetric] = useState('responses')
  const { success, error: showError } = useToast()

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', timeframe],
    queryFn: async () => {
      // TODO: Replace with actual API call when backend is ready
      return {
        overview: {
          totalPatients: 125,
          totalResponses: 2840,
          completionRate: 87,
          avgResponseTime: 12,
        },
        timeSeriesData: {
          labels: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Jan 29'],
          responses: [145, 178, 203, 198, 221],
          completions: [125, 156, 177, 172, 193],
          newPatients: [8, 12, 15, 11, 9],
        },
        statusDistribution: {
          active: 45,
          completed: 38,
          inactive: 25,
          withdrawn: 17,
        },
        questionnairePerformance: [
          { name: 'Daily Symptoms', responses: 450, completionRate: 92, avgTime: 8 },
          { name: 'Weekly QoL', responses: 180, completionRate: 85, avgTime: 15 },
          { name: 'Medication Check', responses: 320, completionRate: 94, avgTime: 5 },
          { name: 'Side Effects', responses: 200, completionRate: 78, avgTime: 12 },
        ],
      }
    },
  })

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    try {
      // TODO: Implement actual export functionality
      success(`Export started`, `Your ${format.toUpperCase()} report will be ready shortly.`)
    } catch (error) {
      showError('Export failed', 'Please try again.')
    }
  }

  // Chart configurations
  const responsesTrendData = {
    labels: analyticsData?.timeSeriesData.labels || [],
    datasets: [
      {
        label: 'Total Responses',
        data: analyticsData?.timeSeriesData.responses || [],
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Completed Responses',
        data: analyticsData?.timeSeriesData.completions || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const statusDistributionData = {
    labels: ['Active', 'Completed', 'Inactive', 'Withdrawn'],
    datasets: [
      {
        data: analyticsData ? [
          analyticsData.statusDistribution.active,
          analyticsData.statusDistribution.completed,
          analyticsData.statusDistribution.inactive,
          analyticsData.statusDistribution.withdrawn,
        ] : [],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(37, 99, 235)', 
          'rgb(156, 163, 175)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 0,
      },
    ],
  }

  const questionnairePerformanceData = {
    labels: analyticsData?.questionnairePerformance.map(q => q.name) || [],
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: analyticsData?.questionnairePerformance.map(q => q.completionRate) || [],
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderColor: 'rgb(37, 99, 235)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights into your clinical trial data and patient engagement.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="form-input"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <div className="relative">
            <button className="btn btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            {/* TODO: Add export dropdown */}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Patients
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {formatNumber(analyticsData?.overview.totalPatients || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Responses
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {formatNumber(analyticsData?.overview.totalResponses || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completion Rate
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analyticsData?.overview.completionRate || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg. Response Time
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analyticsData?.overview.avgResponseTime || 0}m
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Response Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Response Trends
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Patient response activity over time
            </p>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="spinner spinner-lg" />
              </div>
            ) : (
              <div className="h-64">
                <Line data={responsesTrendData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>

        {/* Patient Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Patient Status Distribution
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Current patient status breakdown
            </p>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="spinner spinner-lg" />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="w-48 h-48">
                  <Doughnut data={statusDistributionData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Questionnaire Performance */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Questionnaire Performance
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Completion rates by questionnaire type
            </p>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="spinner spinner-lg" />
              </div>
            ) : (
              <div className="h-64">
                <Bar data={questionnairePerformanceData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="mt-8 card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Questionnaire Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-10 bg-gray-200 rounded w-48"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Questionnaire</th>
                  <th>Total Responses</th>
                  <th>Completion Rate</th>
                  <th>Avg. Time (min)</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analyticsData?.questionnairePerformance.map((questionnaire, index) => (
                  <tr key={index}>
                    <td className="font-medium text-gray-900">
                      {questionnaire.name}
                    </td>
                    <td className="text-gray-900">
                      {formatNumber(questionnaire.responses)}
                    </td>
                    <td>
                      <div className="flex items-center">
                        <span className="text-gray-900 mr-2">
                          {questionnaire.completionRate}%
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${questionnaire.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-900">
                      {questionnaire.avgTime}
                    </td>
                    <td>
                      <span className={`status-indicator ${
                        questionnaire.completionRate >= 90 ? 'status-active' :
                        questionnaire.completionRate >= 75 ? 'status-pending' :
                        'status-error'
                      }`}>
                        {questionnaire.completionRate >= 90 ? 'Excellent' :
                         questionnaire.completionRate >= 75 ? 'Good' :
                         'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="mt-8 card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Data Export
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Export your clinical trial data in various formats
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={() => handleExport('csv')}
              className="btn btn-secondary justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="btn btn-secondary justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as JSON
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="btn btn-secondary justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as PDF Report
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            All exported data is anonymized and HIPAA compliant. You will receive an email 
            when your export is ready for download.
          </p>
        </div>
      </div>
    </div>
  )
}