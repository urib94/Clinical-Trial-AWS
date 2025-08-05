import { Metadata } from 'next';
import { Suspense } from 'react';
import { OnboardingFlow } from '@/components/patient/OnboardingFlow';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Patient Registration',
  description: 'Complete your secure registration for the clinical trial.',
};

interface OnboardingPageProps {
  searchParams: {
    token?: string;
    step?: string;
  };
}

export default function OnboardingPage({ searchParams }: OnboardingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header with trust indicators */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg 
              className="h-6 w-6 text-blue-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Secure Registration
          </h1>
          
          <p className="text-sm text-gray-600 mb-4">
            Join the clinical trial with your physician's approval
          </p>
          
          {/* Trust indicators */}
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>HIPAA Secure</span>
            </div>
            
            <div className="flex items-center">
              <svg className="h-4 w-4 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified Platform</span>
            </div>
            
            <div className="flex items-center">
              <svg className="h-4 w-4 text-purple-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Doctor Approved</span>
            </div>
          </div>
        </div>

        {/* Main onboarding flow */}
        <div className="bg-white shadow-lg rounded-lg px-6 py-8">
          <Suspense 
            fallback={
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading registration...</span>
              </div>
            }
          >
            <OnboardingFlow 
              invitationToken={searchParams.token}
              initialStep={searchParams.step}
            />
          </Suspense>
        </div>

        {/* Help and support */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a 
              href="/patient/support" 
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}