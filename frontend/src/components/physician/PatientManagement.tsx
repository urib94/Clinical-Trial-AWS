'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  FileText, 
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Download
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/components/shared/ToastProvider'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Patient {
  id: string
  email: string
  patientId: string
  status: 'invited' | 'registered' | 'active' | 'inactive' | 'completed' | 'withdrawn'
  enrollmentDate?: string
  relationshipType: string
  relationshipStarted: string
  totalResponses: number
  completedResponses: number
  lastActivity?: string
}

const STATUS_CONFIG = {
  invited: {
    label: 'Invited',
    color: 'status-pending',
    icon: Mail,
    description: 'Invitation sent, awaiting response'
  },
  registered: {
    label: 'Registered',
    color: 'status-pending',
    icon: Clock,
    description: 'Account created, not yet active'
  },
  active: {
    label: 'Active',
    color: 'status-active',
    icon: CheckCircle,
    description: 'Actively participating'
  },
  inactive: {
    label: 'Inactive',
    color: 'status-inactive',
    icon: Clock,
    description: 'No recent activity'
  },
  completed: {
    label: 'Completed',
    color: 'status-active',
    icon: CheckCircle,
    description: 'Study completed'
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'status-error',
    icon: AlertCircle,
    description: 'Withdrawn from study'
  }
}

export function PatientManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const { success, error: showError } = useToast()

  const { data: patientsData, isLoading, error } = useQuery({
    queryKey: ['patients', searchQuery, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('page', page.toString())
      params.append('limit', '20')
      
      const response = await apiClient.get(`/physicians/patients?${params}`)
      
      // Mock response for now since backend endpoint needs implementation
      return {
        patients: [
          {
            id: '1',
            email: 'patient1@example.com',
            patientId: 'PAT-001',
            status: 'active',
            enrollmentDate: '2024-01-15T10:00:00Z',
            relationshipType: 'primary',
            relationshipStarted: '2024-01-15T10:00:00Z',
            totalResponses: 45,
            completedResponses: 42,
            lastActivity: '2024-01-25T14:30:00Z',
          },
          {
            id: '2',
            email: 'patient2@example.com',
            patientId: 'PAT-002',
            status: 'invited',
            relationshipType: 'primary',
            relationshipStarted: '2024-01-20T09:15:00Z',
            totalResponses: 0,
            completedResponses: 0,
          },
          {
            id: '3',
            email: 'patient3@example.com',
            patientId: 'PAT-003',
            status: 'completed',
            enrollmentDate: '2024-01-10T11:20:00Z',
            relationshipType: 'primary',
            relationshipStarted: '2024-01-10T11:20:00Z',
            totalResponses: 60,
            completedResponses: 60,
            lastActivity: '2024-01-24T16:45:00Z',
          },
          {
            id: '4',
            email: 'patient4@example.com',
            patientId: 'PAT-004',
            status: 'inactive',
            enrollmentDate: '2024-01-05T14:00:00Z',
            relationshipType: 'primary',
            relationshipStarted: '2024-01-05T14:00:00Z',
            totalResponses: 20,
            completedResponses: 15,
            lastActivity: '2024-01-18T10:20:00Z',
          },
        ] as Patient[],
        pagination: {
          page: 1,
          limit: 20,
          total: 4,
          pages: 1
        }
      }
    },
  })

  const getCompletionRate = (patient: Patient) => {
    if (patient.totalResponses === 0) return 0
    return Math.round((patient.completedResponses / patient.totalResponses) * 100)
  }

  const handleInvitePatient = () => {
    setShowInviteModal(true)
  }

  const handleExportData = () => {
    // TODO: Implement export functionality
    success('Export started', 'You will receive an email when the export is ready.')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Patients
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your clinical trial participants and track their progress.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-3">
          <button
            onClick={handleExportData}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={handleInvitePatient}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite Patient
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
                    {patientsData?.patients.length || 0}
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
                <Activity className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Patients
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {patientsData?.patients.filter(p => p.status === 'active').length || 0}
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
                    Completed
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {patientsData?.patients.filter(p => p.status === 'completed').length || 0}
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
                    Pending
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {patientsData?.patients.filter(p => ['invited', 'registered'].includes(p.status)).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
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
              placeholder="Search patients by ID or email..."
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
            <option value="invited">Invited</option>
            <option value="registered">Registered</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="mt-8 card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                    <div className="h-10 bg-gray-200 rounded w-48"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : patientsData?.patients.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Responses</th>
                  <th>Completion Rate</th>
                  <th>Last Activity</th>
                  <th>Enrolled</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patientsData.patients.map((patient) => {
                  const statusConfig = STATUS_CONFIG[patient.status]
                  const completionRate = getCompletionRate(patient)
                  const StatusIcon = statusConfig.icon

                  return (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="font-medium text-primary-600">
                        <Link 
                          href={`/physician/patients/${patient.id}`}
                          className="hover:text-primary-700"
                        >
                          {patient.patientId}
                        </Link>
                      </td>
                      <td className="text-gray-900">{patient.email}</td>
                      <td>
                        <span className={cn('status-indicator', statusConfig.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {patient.completedResponses}/{patient.totalResponses}
                          </div>
                          <div className="text-gray-500">responses</div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">{completionRate}%</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={cn(
                                  'h-2 rounded-full',
                                  completionRate >= 80 ? 'bg-success-500' :
                                  completionRate >= 60 ? 'bg-warning-500' : 'bg-error-500'
                                )}
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-500">
                        {patient.lastActivity ? formatRelativeTime(patient.lastActivity) : 'No activity'}
                      </td>
                      <td className="text-sm text-gray-500">
                        {patient.enrollmentDate ? formatDate(patient.enrollmentDate, 'MMM d, yyyy') : '-'}
                      </td>
                      <td>
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by inviting your first patient.'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={handleInvitePatient}
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Patient
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {patientsData?.pagination && patientsData.pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= patientsData.pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(page - 1) * patientsData.pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(page * patientsData.pagination.limit, patientsData.pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{patientsData.pagination.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(patientsData.pagination.pages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                        page === i + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= patientsData.pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Patient Modal */}
      {showInviteModal && (
        <PatientInviteModal 
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            success('Patient invited successfully')
          }}
        />
      )}
    </div>
  )
}

// Patient Invite Modal Component
interface PatientInviteModalProps {
  onClose: () => void
  onSuccess: () => void
}

function PatientInviteModal({ onClose, onSuccess }: PatientInviteModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [emails, setEmails] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      
      const emailList = emails.split('\n').filter(email => email.trim())
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess()
    } catch (error) {
      console.error('Invite error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Invite Patients
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="form-label">
                        Patient Email Addresses *
                      </label>
                      <textarea
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        className="form-input"
                        rows={4}
                        placeholder="Enter email addresses (one per line)&#10;patient1@example.com&#10;patient2@example.com"
                        required
                      />
                      <p className="form-help">
                        Enter one email address per line. Each patient will receive a secure invitation link.
                      </p>
                    </div>

                    <div>
                      <label className="form-label">
                        Custom Message (Optional)
                      </label>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="form-input"
                        rows={3}
                        placeholder="Add a personal message to the invitation email..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading || !emails.trim()}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Invitations'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}