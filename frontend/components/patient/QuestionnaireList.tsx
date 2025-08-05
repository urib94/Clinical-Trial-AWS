'use client';

import React from 'react';
import Link from 'next/link';
import { useOffline } from '@/components/providers/OfflineProvider';

// Mock data for demonstration
const mockQuestionnaires = [
  {
    id: '1',
    title: 'Initial Health Assessment',
    description: 'Basic health information and medical history questionnaire',
    status: 'assigned' as const,
    dueDate: '2024-01-15',
    estimatedDuration: 15,
    completedAt: null,
    progress: 0,
  },
  {
    id: '2',
    title: 'Weekly Symptom Check',
    description: 'Track your symptoms and overall well-being this week',
    status: 'in_progress' as const,
    dueDate: '2024-01-12',
    estimatedDuration: 10,
    completedAt: null,
    progress: 60,
  },
  {
    id: '3',
    title: 'Medication Adherence Survey',
    description: 'Questions about your medication routine and any side effects',
    status: 'completed' as const,
    dueDate: '2024-01-10',
    estimatedDuration: 8,
    completedAt: '2024-01-09',
    progress: 100,
  },
];

export function QuestionnaireList() {
  const { isOnline, pendingActions } = useOffline();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'completed' && new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                You're currently offline
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You can still complete questionnaires offline. Your responses will be saved and submitted when you're back online.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending sync indicator */}
      {pendingActions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400 animate-spin" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                {pendingActions.length} response{pendingActions.length === 1 ? '' : 's'} waiting to sync
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Your responses will be submitted automatically when connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire cards */}
      <div className="grid grid-cols-1 gap-4">
        {mockQuestionnaires.map((questionnaire) => {
          const overdue = isOverdue(questionnaire.dueDate, questionnaire.status);
          const currentStatus = overdue ? 'overdue' : questionnaire.status;
          
          return (
            <div key={questionnaire.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {questionnaire.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentStatus)}`}>
                      {getStatusText(currentStatus)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {questionnaire.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>~{questionnaire.estimatedDuration} minutes</span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m4 0v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h4m4 0V5H8v2" />
                      </svg>
                      <span>
                        Due: {new Date(questionnaire.dueDate).toLocaleDateString()}
                        {overdue && <span className="text-red-600 font-medium"> (Overdue)</span>}
                      </span>
                    </div>
                    
                    {questionnaire.completedAt && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          Completed: {new Date(questionnaire.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar for in-progress questionnaires */}
                  {questionnaire.status === 'in_progress' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{questionnaire.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${questionnaire.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action button */}
                <div className="flex-shrink-0 ml-4">
                  {questionnaire.status === 'completed' ? (
                    <Link
                      href={`/patient/questionnaires/${questionnaire.id}/review`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                  ) : (
                    <Link
                      href={`/patient/questionnaires/${questionnaire.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {questionnaire.status === 'assigned' ? 'Start' : 'Continue'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {mockQuestionnaires.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questionnaires assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any questionnaires assigned at this time. Check back later or contact your research team.
          </p>
        </div>
      )}
    </div>
  );
}