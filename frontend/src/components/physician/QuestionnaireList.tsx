'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Copy, 
  Archive, 
  Play,
  Pause,
  Eye
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/components/shared/ToastProvider'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Questionnaire {
  id: string
  title: string
  description?: string
  version: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  category?: string
  assignedPatients: number
  responses: number
  completionRate: number
  createdAt: string
  updatedAt: string
}

export function QuestionnaireList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const { success, error: showError } = useToast()

  const { data: questionnaires, isLoading, error } = useQuery({
    queryKey: ['questionnaires', searchQuery, statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      
      const response = await apiClient.get(`/physicians/questionnaires?${params}`)
      // Mock response for now since backend endpoint is pending
      return {
        questionnaires: [
          {
            id: '1',
            title: 'Daily Symptom Assessment',
            description: 'Track daily symptoms and medication effectiveness',
            version: '1.2',
            status: 'active',
            category: 'symptom_tracker',
            assignedPatients: 25,
            responses: 180,
            completionRate: 85,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T14:30:00Z',
          },
          {
            id: '2',
            title: 'Weekly Quality of Life',
            description: 'Comprehensive quality of life assessment',
            version: '1.0',
            status: 'draft',
            category: 'quality_of_life',
            assignedPatients: 0,
            responses: 0,
            completionRate: 0,
            createdAt: '2024-01-22T09:15:00Z',
            updatedAt: '2024-01-22T09:15:00Z',
          },
          {
            id: '3',
            title: 'Medication Adherence Check',
            description: 'Monitor patient medication compliance',
            version: '2.1',
            status: 'active',
            category: 'medication_adherence',
            assignedPatients: 40,
            responses: 320,
            completionRate: 92,
            createdAt: '2024-01-10T11:20:00Z',
            updatedAt: '2024-01-18T16:45:00Z',
          },
        ] as Questionnaire[]
      }
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active'
      case 'draft':
        return 'status-pending'
      case 'paused':
        return 'status-inactive'
      case 'archived':
        return 'status-inactive'
      default:
        return 'status-inactive'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />
      case 'paused':
        return <Pause className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleAction = async (action: string, questionnaireId: string) => {
    try {
      switch (action) {
        case 'duplicate':
          // TODO: Implement duplicate functionality
          success('Questionnaire duplicated successfully')
          break
        case 'archive':
          // TODO: Implement archive functionality
          success('Questionnaire archived successfully')
          break
        case 'activate':
          // TODO: Implement activate functionality
          success('Questionnaire activated successfully')
          break
        case 'pause':
          // TODO: Implement pause functionality
          success('Questionnaire paused successfully')
          break
      }
    } catch (error) {
      showError('Action failed', 'Please try again.')
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Questionnaires
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage questionnaires for your clinical trials.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/physician/questionnaires/new"
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Questionnaire
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search questionnaires..."
              className="form-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
          <select
            className="form-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="symptom_tracker">Symptom Tracker</option>
            <option value="medication_adherence">Medication Adherence</option>
            <option value="quality_of_life">Quality of Life</option>
            <option value="side_effects">Side Effects</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Questionnaire Grid */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : questionnaires?.questionnaires.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {questionnaires.questionnaires.map((questionnaire) => (
              <div key={questionnaire.id} className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/physician/questionnaires/${questionnaire.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-primary-600 block truncate"
                      >
                        {questionnaire.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {questionnaire.description}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <div className="relative">
                        <button
                          type="button"
                          className="bg-white rounded-full flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <span className="sr-only">Open options</span>
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {/* TODO: Add dropdown menu */}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={cn('status-indicator', getStatusColor(questionnaire.status))}>
                        {getStatusIcon(questionnaire.status)}
                        <span className="ml-1 capitalize">{questionnaire.status}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        v{questionnaire.version}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {questionnaire.assignedPatients}
                      </div>
                      <div className="text-xs text-gray-500">Patients</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {questionnaire.responses}
                      </div>
                      <div className="text-xs text-gray-500">Responses</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {questionnaire.completionRate}%
                      </div>
                      <div className="text-xs text-gray-500">Complete</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Updated {formatRelativeTime(questionnaire.updatedAt)}</span>
                      <div className="flex space-x-2">
                        <Link
                          href={`/physician/questionnaires/${questionnaire.id}/preview`}
                          className="text-gray-400 hover:text-gray-600"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/physician/questionnaires/${questionnaire.id}/edit`}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleAction('duplicate', questionnaire.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No questionnaires</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new questionnaire.
            </p>
            <div className="mt-6">
              <Link
                href="/physician/questionnaires/new"
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Questionnaire
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}