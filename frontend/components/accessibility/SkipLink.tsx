'use client';

import React from 'react';

/**
 * SkipLink Component
 * 
 * Provides a "Skip to main content" link for keyboard users and screen readers.
 * This improves accessibility by allowing users to bypass navigation and go directly
 * to the main content area.
 * 
 * Features:
 * - Hidden by default, becomes visible when focused
 * - Positioned at the very top of the page
 * - High contrast colors for visibility
 * - Semantic HTML with proper ARIA attributes
 */
export function SkipLink() {
  const handleSkipToMain = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    
    // Find the main content element
    const mainContent = document.querySelector('#main-content') || 
                       document.querySelector('main') ||
                       document.querySelector('[role="main"]');
    
    if (mainContent) {
      // Set focus to main content
      (mainContent as HTMLElement).focus();
      
      // Scroll to main content
      mainContent.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkipToMain}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: '#2563eb',
        color: '#ffffff',
        padding: '8px 16px',
        textDecoration: 'none',
        borderRadius: '4px',
        zIndex: 9999,
        fontWeight: 600,
        fontSize: '14px',
        border: '2px solid transparent',
        transition: 'top 0.2s ease-in-out',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '6px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
      aria-label="Skip to main content area"
    >
      Skip to main content
    </a>
  );
}