'use client';

import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  'aria-label'?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className,
  'aria-label': ariaLabel = 'Loading'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600',
  };

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={clsx(
        'inline-block animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      <svg 
        fill="none" 
        viewBox="0 0 24 24"
        className="w-full h-full"
      >
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
          className="opacity-25"
        />
        <path 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          className="opacity-75"
        />
      </svg>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}