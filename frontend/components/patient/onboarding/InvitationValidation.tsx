'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAccessibility } from '@/components/providers/AccessibilityProvider';

interface InvitationData {
  physicianName: string;
  studyTitle: string;
  studyDescription: string;
  expiresAt: string;
  patientEmail?: string;
}

interface InvitationValidationProps {
  invitationToken?: string;
  onComplete: (data: { invitationToken: string; invitationData: InvitationData }) => void;
  onBack?: () => void;
  isLoading: boolean;
  errors: Record<string, string>;
  data: any;
}

export function InvitationValidation({
  invitationToken: initialToken,
  onComplete,
  isLoading,
  errors
}: InvitationValidationProps) {
  const { announce } = useAccessibility();
  const [token, setToken] = useState(initialToken || '');
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Validate invitation token
  const validateToken = useCallback(async (tokenToValidate: string) => {
    if (!tokenToValidate.trim()) {
      setLocalErrors({ token: 'Please enter your invitation code' });
      return;
    }

    setValidationState('validating');
    setLocalErrors({});

    try {
      // Simulate API call to validate invitation
      const response = await fetch(`/api/invitations/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToValidate }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invalid invitation code. Please check and try again.');
        } else if (response.status === 410) {
          throw new Error('This invitation has expired. Please contact your physician for a new invitation.');
        } else {
          throw new Error('Unable to validate invitation. Please try again.');
        }
      }

      const data = await response.json();
      
      setInvitationData(data);
      setValidationState('valid');
      
      // Announce success to screen readers
      announce(`Invitation validated successfully. Study: ${data.studyTitle}, Physician: ${data.physicianName}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setLocalErrors({ token: errorMessage });
      setValidationState('invalid');
      announce(`Invitation validation failed: ${errorMessage}`);
    }
  }, [announce]);

  // Auto-validate if token provided in URL
  useEffect(() => {
    if (initialToken && validationState === 'idle') {
      validateToken(initialToken);
    }
  }, [initialToken, validationState, validateToken]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationState === 'valid' && invitationData) {
      onComplete({
        invitationToken: token,
        invitationData,
      });
    } else {
      await validateToken(token);
    }
  };

  // Handle token input change
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value.trim().toUpperCase();
    setToken(newToken);
    
    // Reset validation state when token changes
    if (validationState !== 'idle') {
      setValidationState('idle');
      setInvitationData(null);
      setLocalErrors({});
    }
  };

  const currentError = localErrors.token || errors.token;
  const isValidating = validationState === 'validating' || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Instructions */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Enter Your Invitation Code
        </h3>
        <p className="text-sm text-gray-600">
          Your physician provided you with a unique invitation code to join this clinical trial.
        </p>
      </div>

      {/* Token input */}
      <div>
        <label htmlFor="invitation-token" className="form-label">
          Invitation Code
        </label>
        <div className="mt-1">
          <input
            id="invitation-token"
            name="invitationToken"
            type="text"
            value={token}
            onChange={handleTokenChange}
            placeholder="Enter your invitation code"
            className={`form-input ${currentError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            disabled={isValidating}
            aria-describedby={currentError ? 'token-error' : 'token-help'}
            aria-invalid={!!currentError}
            maxLength={50}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </div>
        
        {/* Help text */}
        {!currentError && (
          <p id="token-help" className="form-help">
            This code was provided by your physician and is required to access the study.
          </p>
        )}
        
        {/* Error message */}
        {currentError && (
          <p id="token-error" className="form-error" role="alert">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {currentError}
          </p>
        )}
      </div>

      {/* Validation success display */}
      {validationState === 'valid' && invitationData && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                Invitation Validated Successfully
              </h4>
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <p><strong>Study:</strong> {invitationData.studyTitle}</p>
                <p><strong>Physician:</strong> {invitationData.physicianName}</p>
                <p><strong>Description:</strong> {invitationData.studyDescription}</p>
                {invitationData.patientEmail && (
                  <p><strong>Email:</strong> {invitationData.patientEmail}</p>
                )}
                <p className="text-xs">
                  <strong>Expires:</strong> {new Date(invitationData.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isValidating || (!token.trim() && validationState !== 'valid')}
          className="btn btn-primary min-w-[120px]"
        >
          {isValidating ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              Validating...
            </>
          ) : validationState === 'valid' ? (
            'Continue'
          ) : (
            'Validate Code'
          )}
        </button>
      </div>

      {/* Additional help */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">
          Don't have an invitation code?
        </p>
        <p className="text-xs text-gray-600">
          Contact your physician or research coordinator to receive your invitation code.
        </p>
      </div>
    </form>
  );
}