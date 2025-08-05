'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOffline } from '@/components/providers/OfflineProvider';

export function PatientDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { isOnline, pendingActions } = useOffline();

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Clinical Trial Platform
        </h1>
        <p className="text-gray-600 mb-8">
          Please complete your registration to access your personalized dashboard.
        </p>
        <Link
          href="/patient/onboarding"
          className="btn btn-primary"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Your secure portal for clinical trial participation
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Questionnaires */}
        <Link
          href="/patient/questionnaires"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">
              Questionnaires
            </h3>
          </div>
          <p className="text-gray-600">
            Complete your assigned questionnaires and track your progress
          </p>
        </Link>

        {/* Profile */}
        <Link
          href="/patient/profile"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">
              My Profile
            </h3>
          </div>
          <p className="text-gray-600">
            Manage your personal information and security settings
          </p>
        </Link>

        {/* Support */}
        <Link
          href="/patient/support"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">
              Help & Support
            </h3>
          </div>
          <p className="text-gray-600">
            Get help with the platform or contact your research team
          </p>
        </Link>
      </div>

      {/* Status indicators */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Platform Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Connection status */}
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>

          {/* Pending actions */}
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${pendingActions.length > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span className="text-sm text-gray-600">
              {pendingActions.length > 0 
                ? `${pendingActions.length} pending sync${pendingActions.length === 1 ? '' : 's'}`
                : 'All data synced'
              }
            </span>
          </div>

          {/* Security status */}
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <span className="text-sm text-gray-600">
              Secure connection
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}