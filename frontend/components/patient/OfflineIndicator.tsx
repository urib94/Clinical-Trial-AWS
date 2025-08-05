'use client';

import React from 'react';
import { useOffline } from '@/components/providers/OfflineProvider';
import { clsx } from 'clsx';

export function OfflineIndicator() {
  const { isOnline, pendingActions, isInstallable, promptInstall } = useOffline();

  // Don't show anything if online and no pending actions
  if (isOnline && pendingActions.length === 0 && !isInstallable) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="medical-container">
        {/* Offline status */}
        {!isOnline && (
          <div className="flex items-center justify-between py-2 px-4 bg-yellow-50 border border-yellow-200 rounded-md my-2">
            <div className="flex items-center">
              <svg 
                className="h-5 w-5 text-yellow-600 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You're currently offline
                </p>
                <p className="text-xs text-yellow-700">
                  Your responses will be saved and submitted when connection is restored
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending actions */}
        {pendingActions.length > 0 && (
          <div className="flex items-center justify-between py-2 px-4 bg-blue-50 border border-blue-200 rounded-md my-2">
            <div className="flex items-center">
              <div className="animate-pulse">
                <svg 
                  className="h-5 w-5 text-blue-600 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {pendingActions.length} response{pendingActions.length === 1 ? '' : 's'} pending sync
                </p>
                <p className="text-xs text-blue-700">
                  {isOnline ? 'Syncing now...' : 'Will sync when back online'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PWA install prompt */}
        {isInstallable && (
          <div className="flex items-center justify-between py-2 px-4 bg-green-50 border border-green-200 rounded-md my-2">
            <div className="flex items-center">
              <svg 
                className="h-5 w-5 text-green-600 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" 
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Install Clinical Trial App
                </p>
                <p className="text-xs text-green-700">
                  Install for faster access and offline support
                </p>
              </div>
            </div>
            <button
              onClick={promptInstall}
              className="ml-4 px-3 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Install
            </button>
          </div>
        )}
      </div>
    </div>
  );
}