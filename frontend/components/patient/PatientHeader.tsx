'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAccessibility } from '@/components/providers/AccessibilityProvider';

export function PatientHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const { fontSize, setFontSize, toggleHighContrast, highContrast } = useAccessibility();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm" role="banner">
      <div className="medical-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <Link 
              href="/patient" 
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md p-1"
              aria-label="Clinical Trial Platform - Go to dashboard"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Clinical Trial</span>
            </Link>
          </div>

          {/* Navigation and user menu */}
          <div className="flex items-center space-x-4">
            {/* Accessibility controls */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Font size control */}
              <div className="flex items-center space-x-1">
                <label htmlFor="font-size" className="sr-only">
                  Adjust font size
                </label>
                <select
                  id="font-size"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Font size"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

              {/* High contrast toggle */}
              <button
                onClick={toggleHighContrast}
                className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
                aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
                aria-pressed={highContrast}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM10 4a6 6 0 110 12V4z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* User menu */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 hidden sm:block">
                  Welcome, {user.firstName}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/patient/onboarding"
                className="text-sm text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}