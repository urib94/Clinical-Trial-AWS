'use client';

import React from 'react';
import Link from 'next/link';

export function PatientFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto" role="contentinfo">
      <div className="medical-container py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Platform info */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600">
              Clinical Trial Platform - Secure Patient Portal
            </p>
            <p className="text-xs text-gray-500 mt-1">
              HIPAA Compliant • SSL Secured • Doctor Approved
            </p>
          </div>

          {/* Right side - Links */}
          <div className="flex flex-wrap justify-center md:justify-end items-center space-x-6 text-sm">
            <Link 
              href="/patient/help" 
              className="text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              Help
            </Link>
            <Link 
              href="/patient/support" 
              className="text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              Support
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              Terms
            </Link>
          </div>
        </div>

        {/* Bottom row - Copyright and version */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} Clinical Trial Platform. All rights reserved.
          </p>
          <p className="mt-1">
            Version 1.0.0 • Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </footer>
  );
}