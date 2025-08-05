'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  showLabels?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels = [],
  showLabels = true,
  showPercentage = false,
  size = 'md',
  className
}: ProgressIndicatorProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={clsx('w-full', className)}>
      {/* Progress bar */}
      <div className="relative">
        <div 
          className={clsx(
            'w-full bg-gray-200 rounded-full overflow-hidden',
            sizeClasses[size]
          )}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-label={`Progress: Step ${currentStep} of ${totalSteps}`}
        >
          <div
            className={clsx(
              'bg-primary-600 transition-all duration-500 ease-out rounded-full',
              sizeClasses[size]
            )}
            style={{
              width: `${percentage}%`,
              '--progress-width': `${percentage}%`
            } as React.CSSProperties}
          />
        </div>
        
        {/* Step indicators */}
        {showLabels && stepLabels.length > 0 && (
          <div className="flex justify-between mt-2">
            {Array.from({ length: totalSteps }, (_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isUpcoming = stepNumber > currentStep;
              
              return (
                <div
                  key={stepNumber}
                  className={clsx(
                    'flex flex-col items-center',
                    'text-xs',
                    stepLabels.length > 4 ? 'min-w-0' : 'flex-1'
                  )}
                >
                  {/* Step circle */}
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 mb-1',
                      {
                        'bg-primary-600 border-primary-600 text-white': isCompleted,
                        'bg-primary-100 border-primary-600 text-primary-600': isCurrent,
                        'bg-gray-100 border-gray-300 text-gray-400': isUpcoming,
                      }
                    )}
                    aria-label={`Step ${stepNumber}${isCompleted ? ' completed' : isCurrent ? ' current' : ' upcoming'}`}
                  >
                    {isCompleted ? (
                      <svg 
                        className="w-3 h-3" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  
                  {/* Step label */}
                  {stepLabels[index] && (
                    <span
                      className={clsx(
                        'text-center leading-tight',
                        {
                          'text-primary-600 font-medium': isCurrent,
                          'text-gray-600': isCompleted,
                          'text-gray-400': isUpcoming,
                        },
                        stepLabels.length > 4 ? 'text-xs' : 'text-sm'
                      )}
                      style={stepLabels.length > 4 ? { fontSize: '10px' } : undefined}
                    >
                      {stepLabels[index]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Percentage display */}
      {showPercentage && (
        <div className="text-center mt-2">
          <span className="text-sm font-medium text-gray-600">
            {percentage}% Complete
          </span>
        </div>
      )}
      
      {/* Screen reader updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Progress: {percentage}% complete. Step {currentStep} of {totalSteps}.
        {stepLabels[currentStep - 1] && ` Current step: ${stepLabels[currentStep - 1]}.`}
      </div>
    </div>
  );
}