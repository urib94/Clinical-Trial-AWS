'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAccessibility } from '@/components/providers/AccessibilityProvider';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { InvitationValidation } from './onboarding/InvitationValidation';
import { PersonalInformation } from './onboarding/PersonalInformation';
import { SecuritySetup } from './onboarding/SecuritySetup';
import { MFASetup } from './onboarding/MFASetup';
import { ConsentReview } from './onboarding/ConsentReview';
import { RegistrationComplete } from './onboarding/RegistrationComplete';
import { ProgressIndicator } from '@/components/shared/ProgressIndicator';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export type OnboardingStep = 
  | 'invitation' 
  | 'personal-info' 
  | 'security' 
  | 'mfa' 
  | 'consent' 
  | 'complete';

interface OnboardingData {
  invitationToken?: string;
  invitationData?: {
    physicianName: string;
    studyTitle: string;
    studyDescription: string;
    expiresAt: string;
  };
  personalInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
  };
  securityInfo?: {
    password: string;
    confirmPassword: string;
    securityQuestions: Array<{
      question: string;
      answer: string;
    }>;
  };
  mfaPreference?: {
    method: 'sms' | 'email' | 'authenticator';
    phoneNumber?: string;
    qrCode?: string;
    backupCodes?: string[];
  };
  consentAccepted?: boolean;
  consentTimestamp?: string;
}

interface OnboardingFlowProps {
  invitationToken?: string;
  initialStep?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  'invitation',
  'personal-info', 
  'security',
  'mfa',
  'consent',
  'complete'
];

export function OnboardingFlow({ invitationToken, initialStep }: OnboardingFlowProps) {
  const router = useRouter();
  const { register } = useAuth();
  const { announce } = useAccessibility();
  const { addNotification } = useNotifications();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    (initialStep as OnboardingStep) || 'invitation'
  );
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    invitationToken,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get current step index for progress calculation
  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);
  const progressPercentage = Math.round(((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100);

  // Update onboarding data
  const updateOnboardingData = useCallback((stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({
      ...prev,
      ...stepData,
    }));
    setErrors({});
  }, []);

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[nextIndex];
      setCurrentStep(nextStep);
      
      // Update URL without page reload
      const params = new URLSearchParams();
      if (invitationToken) params.set('token', invitationToken);
      params.set('step', nextStep);
      router.replace(`/patient/onboarding?${params.toString()}`);
      
      // Announce step change to screen readers
      announce(`Moved to step ${nextIndex + 1}: ${getStepTitle(nextStep)}`);
    }
  }, [currentStepIndex, invitationToken, router, announce]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = ONBOARDING_STEPS[prevIndex];
      setCurrentStep(prevStep);
      
      // Update URL
      const params = new URLSearchParams();
      if (invitationToken) params.set('token', invitationToken);
      params.set('step', prevStep);
      router.replace(`/patient/onboarding?${params.toString()}`);
      
      // Announce step change
      announce(`Moved back to step ${prevIndex + 1}: ${getStepTitle(prevStep)}`);
    }
  }, [currentStepIndex, invitationToken, router, announce]);

  // Complete registration
  const completeRegistration = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Validate all required data
      if (!onboardingData.personalInfo || !onboardingData.securityInfo || !onboardingData.consentAccepted) {
        throw new Error('Missing required registration information');
      }

      // Prepare registration data
      const registrationData = {
        invitationToken: onboardingData.invitationToken,
        firstName: onboardingData.personalInfo.firstName,
        lastName: onboardingData.personalInfo.lastName,
        email: onboardingData.personalInfo.email,
        phoneNumber: onboardingData.personalInfo.phoneNumber,
        dateOfBirth: onboardingData.personalInfo.dateOfBirth,
        password: onboardingData.securityInfo.password,
        securityQuestions: onboardingData.securityInfo.securityQuestions,
        mfaPreference: onboardingData.mfaPreference,
        consentAccepted: onboardingData.consentAccepted,
        consentTimestamp: onboardingData.consentTimestamp,
      };

      // Register with the backend
      await register(registrationData);

      // Move to completion step
      goToNextStep();
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Registration Complete',
        message: 'Welcome to the clinical trial platform! You can now access your personalized dashboard.',
        duration: 5000,
      });

      // Announce success
      announce('Registration completed successfully. Welcome to the clinical trial platform!');

    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Registration failed. Please try again.';
      
      setErrors({ general: errorMessage });
      
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: errorMessage,
        duration: 8000,
      });

      announce(`Registration failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [onboardingData, register, goToNextStep, addNotification, announce]);

  // Get step title for accessibility
  const getStepTitle = (step: OnboardingStep): string => {
    const titles = {
      'invitation': 'Invitation Validation',
      'personal-info': 'Personal Information',
      'security': 'Security Setup',
      'mfa': 'Two-Factor Authentication',
      'consent': 'Consent Review',
      'complete': 'Registration Complete',
    };
    return titles[step];
  };

  // Handle step validation and navigation
  const handleStepComplete = useCallback((stepData: Partial<OnboardingData>) => {
    updateOnboardingData(stepData);
    
    // Auto-advance to next step for most steps
    if (currentStep !== 'consent') {
      goToNextStep();
    } else {
      // For consent step, trigger registration
      updateOnboardingData(stepData);
      setTimeout(() => completeRegistration(), 100);
    }
  }, [currentStep, updateOnboardingData, goToNextStep, completeRegistration]);

  // Render current step component
  const renderCurrentStep = () => {
    const commonProps = {
      onComplete: handleStepComplete,
      onBack: currentStepIndex > 0 ? goToPreviousStep : undefined,
      isLoading,
      errors,
      data: onboardingData,
    };

    switch (currentStep) {
      case 'invitation':
        return (
          <InvitationValidation
            {...commonProps}
            invitationToken={invitationToken}
          />
        );
        
      case 'personal-info':
        return (
          <PersonalInformation
            {...commonProps}
            invitationData={onboardingData.invitationData}
          />
        );
        
      case 'security':
        return (
          <SecuritySetup
            {...commonProps}
          />
        );
        
      case 'mfa':
        return (
          <MFASetup
            {...commonProps}
            phoneNumber={onboardingData.personalInfo?.phoneNumber}
            email={onboardingData.personalInfo?.email}
          />
        );
        
      case 'consent':
        return (
          <ConsentReview
            {...commonProps}
            studyInfo={onboardingData.invitationData}
            personalInfo={onboardingData.personalInfo}
          />
        );
        
      case 'complete':
        return (
          <RegistrationComplete
            personalInfo={onboardingData.personalInfo}
            mfaSetup={onboardingData.mfaPreference}
          />
        );
        
      default:
        return (
          <div className="text-center py-8">
            <p className="text-red-600">Invalid step: {currentStep}</p>
            <button 
              onClick={() => setCurrentStep('invitation')}
              className="mt-4 btn btn-primary"
            >
              Start Over
            </button>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold text-red-600 mb-4">
            Registration Error
          </h2>
          <p className="text-gray-600 mb-4">
            Something went wrong during registration. Please try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Restart Registration
          </button>
        </div>
      }
    >
      <div className="w-full max-w-md mx-auto">
        {/* Progress indicator - hidden on complete step */}
        {currentStep !== 'complete' && (
          <div className="mb-8">
            <ProgressIndicator
              currentStep={currentStepIndex + 1}
              totalSteps={ONBOARDING_STEPS.length - 1} // Exclude complete step from count
              stepLabels={ONBOARDING_STEPS.slice(0, -1).map(getStepTitle)}
              showLabels={false} // Keep it simple on mobile
            />
            
            {/* Current step title */}
            <div className="text-center mt-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {getStepTitle(currentStep)}
              </h2>
              <p className="text-sm text-gray-600">
                Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length - 1}
              </p>
            </div>
          </div>
        )}

        {/* Current step content */}
        <div className="min-h-[400px]">
          {renderCurrentStep()}
        </div>

        {/* General error display */}
        {errors.general && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg 
                className="h-5 w-5 text-red-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Registration Error
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {errors.general}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}