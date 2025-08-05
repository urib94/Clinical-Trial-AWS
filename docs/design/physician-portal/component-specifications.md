# Component Design Specifications

## Overview
This document defines the component library specifications for the physician admin portal, including design tokens, component patterns, and implementation guidelines optimized for non-technical medical professionals.

## Design Tokens

### Color System
```css
:root {
  /* Primary Colors - Medical Professional Theme */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6; /* Primary blue */
  --color-primary-600: #2563eb; /* Main brand color */
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Secondary Colors - Healthcare Calm */
  --color-secondary-50: #f0fdfa;
  --color-secondary-100: #ccfbf1;
  --color-secondary-200: #99f6e4;
  --color-secondary-300: #5eead4;
  --color-secondary-400: #2dd4bf;
  --color-secondary-500: #14b8a6; /* Secondary teal */
  --color-secondary-600: #0d9488; /* Main secondary */
  --color-secondary-700: #0f766e;
  --color-secondary-800: #115e59;
  --color-secondary-900: #134e4a;

  /* Status Colors */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a; /* Success green */
  --color-success-700: #15803d;

  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706; /* Warning amber */
  --color-warning-700: #b45309;

  --color-error-50: #fef2f2;
  --color-error-100: #fee2e2;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626; /* Error red */
  --color-error-700: #b91c1c;

  /* Neutral Colors */
  --color-neutral-50: #f8fafc; /* Surface gray */
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b; /* Neutral gray */
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* Semantic Color Assignments */
  --color-background: #ffffff;
  --color-surface: var(--color-neutral-50);
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-600);
  --color-text-muted: var(--color-neutral-500);
  --color-border: var(--color-neutral-200);
  --color-border-focus: var(--color-primary-600);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: var(--color-neutral-900);
    --color-surface: var(--color-neutral-800);
    --color-text-primary: var(--color-neutral-100);
    --color-text-secondary: var(--color-neutral-300);
    --color-text-muted: var(--color-neutral-400);
    --color-border: var(--color-neutral-700);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-primary-600: #0000ff;
    --color-text-primary: #000000;
    --color-background: #ffffff;
    --color-border: #000000;
  }
}
```

### Typography System
```css
:root {
  /* Font Families */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;

  /* Font Sizes - Responsive with clamp() */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 1rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1.125rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.5rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.875rem);
  --font-size-2xl: clamp(1.5rem, 1.3rem + 1vw, 2.25rem);
  --font-size-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 3rem);

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Letter Spacing */
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
}

/* Typography Classes */
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }
.text-3xl { font-size: var(--font-size-3xl); }

.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }
```

### Spacing System
```css
:root {
  /* Spacing Scale - Responsive */
  --space-0: 0;
  --space-1: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --space-2: clamp(0.5rem, 0.4rem + 0.5vw, 1rem);
  --space-3: clamp(0.75rem, 0.6rem + 0.75vw, 1.5rem);
  --space-4: clamp(1rem, 0.8rem + 1vw, 2rem);
  --space-5: clamp(1.25rem, 1rem + 1.25vw, 2.5rem);
  --space-6: clamp(1.5rem, 1.2rem + 1.5vw, 3rem);
  --space-8: clamp(2rem, 1.6rem + 2vw, 4rem);
  --space-10: clamp(2.5rem, 2rem + 2.5vw, 5rem);
  --space-12: clamp(3rem, 2.4rem + 3vw, 6rem);
  --space-16: clamp(4rem, 3.2rem + 4vw, 8rem);
  --space-20: clamp(5rem, 4rem + 5vw, 10rem);
  --space-24: clamp(6rem, 4.8rem + 6vw, 12rem);

  /* Component-specific spacing */
  --space-component-xs: var(--space-2);
  --space-component-sm: var(--space-3);
  --space-component-md: var(--space-4);
  --space-component-lg: var(--space-6);
  --space-component-xl: var(--space-8);
}
```

### Border Radius
```css
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;
  --radius-base: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
}
```

### Shadows
```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
```

## Core Components

### Button Component
```css
/* Base Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-medium);
  text-align: center;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  user-select: none;
  min-height: 44px; /* Accessibility requirement */
  
  /* Ensure focus is visible */
  &:focus-visible {
    outline: 2px solid var(--color-primary-600);
    outline-offset: 2px;
  }
  
  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  min-height: 36px;
}

.btn-md {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-base);
  min-height: 44px;
}

.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-lg);
  min-height: 52px;
}

/* Button Variants */
.btn-primary {
  background-color: var(--color-primary-600);
  color: white;
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-700);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }
}

.btn-secondary {
  background-color: white;
  color: var(--color-primary-600);
  border-color: var(--color-primary-600);
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-50);
    border-color: var(--color-primary-700);
  }
}

.btn-success {
  background-color: var(--color-success-600);
  color: white;
  
  &:hover:not(:disabled) {
    background-color: var(--color-success-700);
  }
}

.btn-warning {
  background-color: var(--color-warning-600);
  color: white;
  
  &:hover:not(:disabled) {
    background-color: var(--color-warning-700);
  }
}

.btn-error {
  background-color: var(--color-error-600);
  color: white;
  
  &:hover:not(:disabled) {
    background-color: var(--color-error-700);
  }
}

/* Icon Buttons */
.btn-icon {
  width: 44px;
  height: 44px;
  padding: 0;
  
  svg {
    width: 20px;
    height: 20px;
  }
}
```

### Card Component
```css
.card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  
  /* Hover state for interactive cards */
  &.card-interactive {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    
    &:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--color-primary-300);
    }
  }
}

.card-header {
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 0;
}

.card-body {
  padding: var(--space-4);
}

.card-footer {
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
}
```

### Form Components
```css
/* Form Group */
.form-group {
  margin-bottom: var(--space-4);
}

/* Form Label */
.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  
  &.required::after {
    content: ' *';
    color: var(--color-error-600);
  }
}

/* Form Input */
.form-input {
  width: 100%;
  padding: var(--space-3);
  font-size: var(--font-size-base);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease-in-out;
  min-height: 44px; /* Accessibility requirement */
  
  &:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  &:invalid {
    border-color: var(--color-error-600);
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }
  }
  
  &:disabled {
    background-color: var(--color-neutral-100);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: var(--color-text-muted);
  }
}

/* Form Textarea */
.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* Form Select */
.form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: var(--space-8);
  appearance: none;
}

/* Form Error Message */
.form-error {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-error-600);
  margin-top: var(--space-1);
}

/* Form Help Text */
.form-help {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

/* Checkbox and Radio */
.form-checkbox,
.form-radio {
  width: 18px;
  height: 18px;
  margin-right: var(--space-2);
  accent-color: var(--color-primary-600);
}

.form-check-label {
  display: flex;
  align-items: center;
  font-size: var(--font-size-base);
  cursor: pointer;
  min-height: 44px; /* Accessibility requirement */
}
```

### Status Badge Component
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.badge-primary {
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
}

.badge-success {
  background-color: var(--color-success-100);
  color: var(--color-success-800);
}

.badge-warning {
  background-color: var(--color-warning-100);
  color: var(--color-warning-800);
}

.badge-error {
  background-color: var(--color-error-100);
  color: var(--color-error-800);
}

.badge-neutral {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-800);
}

/* Status-specific badges for patient management */
.badge-active {
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
}

.badge-pending {
  background-color: var(--color-warning-100);
  color: var(--color-warning-800);
}

.badge-completed {
  background-color: var(--color-success-100);
  color: var(--color-success-800);
}

.badge-overdue {
  background-color: var(--color-error-100);
  color: var(--color-error-800);
}
```

### Progress Bar Component
```css
.progress {
  width: 100%;
  height: 8px;
  background-color: var(--color-neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--color-primary-600);
  border-radius: var(--radius-full);
  transition: width 0.3s ease-in-out;
  
  /* Variants */
  &.progress-success {
    background-color: var(--color-success-600);
  }
  
  &.progress-warning {
    background-color: var(--color-warning-600);
  }
  
  &.progress-error {
    background-color: var(--color-error-600);
  }
}

/* Progress with label */
.progress-labeled {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  min-width: 40px;
  text-align: right;
}

/* Larger progress bars for dashboard */
.progress-lg {
  height: 12px;
}

.progress-xl {
  height: 16px;
}
```

### Table Component
```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.table-header {
  background-color: var(--color-surface);
  border-bottom: 2px solid var(--color-border);
}

.table-header-cell {
  padding: var(--space-3) var(--space-3);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
}

.table-cell {
  padding: var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  vertical-align: top;
}

.table-row {
  transition: background-color 0.2s ease-in-out;
  
  &:hover {
    background-color: var(--color-surface);
  }
  
  &.table-row-selected {
    background-color: var(--color-primary-50);
  }
}

/* Responsive table behavior */
@media (max-width: 767px) {
  .table-responsive {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .table-mobile-stack {
    display: none;
  }
  
  .table-mobile-cards {
    display: block;
  }
}

@media (min-width: 768px) {
  .table-mobile-stack {
    display: table;
  }
  
  .table-mobile-cards {
    display: none;
  }
}
```

### Modal Component
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal {
  background-color: var(--color-background);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  /* Focus management for accessibility */
  &:focus {
    outline: none;
  }
}

.modal-header {
  padding: var(--space-6) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  padding: var(--space-2);
  cursor: pointer;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  
  &:hover {
    background-color: var(--color-neutral-100);
    color: var(--color-text-primary);
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-primary-600);
    outline-offset: 2px;
  }
}

.modal-body {
  padding: var(--space-4) var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--space-4) var(--space-6) var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* Modal sizes */
.modal-sm {
  width: 400px;
}

.modal-md {
  width: 600px;
}

.modal-lg {
  width: 800px;
}

.modal-xl {
  width: 1200px;
}
```

### Toast Notification Component
```css
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 400px;
}

.toast {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  animation: toast-slide-in 0.3s ease-out;
}

.toast-success {
  border-left: 4px solid var(--color-success-600);
}

.toast-warning {
  border-left: 4px solid var(--color-warning-600);
}

.toast-error {
  border-left: 4px solid var(--color-error-600);
}

.toast-info {
  border-left: 4px solid var(--color-primary-600);
}

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}

.toast-message {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.toast-close {
  background: none;
  border: none;
  padding: var(--space-1);
  cursor: pointer;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  
  &:hover {
    background-color: var(--color-neutral-100);
  }
}

@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Layout Components

### Grid System
```css
.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
}

/* Grid columns */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-12 { grid-template-columns: repeat(12, 1fr); }

/* Column spans */
.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }
.col-span-6 { grid-column: span 6; }
.col-span-12 { grid-column: span 12; }

/* Responsive grid behavior */
@media (max-width: 767px) {
  .grid-cols-2-md { grid-template-columns: 1fr; }
  .grid-cols-3-md { grid-template-columns: 1fr; }
  .grid-cols-4-md { grid-template-columns: 1fr; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .grid-cols-3-lg { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-4-lg { grid-template-columns: repeat(2, 1fr); }
}
```

### Navigation Component
```css
.nav {
  display: flex;
  align-items: center;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-4);
  height: 64px;
}

.nav-brand {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-600);
  text-decoration: none;
  margin-right: var(--space-8);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  flex: 1;
}

.nav-item {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all 0.2s ease-in-out;
  
  &:hover {
    color: var(--color-text-primary);
    background-color: var(--color-surface);
  }
  
  &.nav-item-active {
    color: var(--color-primary-600);
    background-color: var(--color-primary-50);
  }
}

.nav-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-left: auto;
}

/* Mobile navigation */
@media (max-width: 767px) {
  .nav-menu {
    display: none;
  }
  
  .nav-mobile-toggle {
    display: block;
    background: none;
    border: none;
    padding: var(--space-2);
    cursor: pointer;
  }
  
  .nav-mobile-menu {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    background-color: var(--color-background);
    border-bottom: 1px solid var(--color-border);
    transform: translateY(-100%);
    transition: transform 0.3s ease-in-out;
    
    &.nav-mobile-menu-open {
      transform: translateY(0);
    }
  }
  
  .nav-mobile-item {
    display: block;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }
}
```

## Accessibility Utilities

### Focus Management
```css
.focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}

.focus-trap {
  /* Used for modal focus management */
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary-600);
  color: white;
  padding: 8px;
  border-radius: 4px;
  text-decoration: none;
  z-index: 1000;
  
  &:focus {
    top: 6px;
  }
}
```

### Animation and Motion
```css
/* Respect user preferences for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Standard transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out;
}

.transition-transform {
  transition: transform 0.2s ease-in-out;
}

/* Hover effects */
.hover-lift {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}
```

## Component Usage Guidelines

### Implementation Principles

1. **Accessibility First**
   - All interactive elements have minimum 44px touch targets
   - Focus indicators are clearly visible
   - Screen reader compatible markup
   - Keyboard navigation support

2. **Medical Professional UX**
   - Conservative color palette suitable for medical settings
   - Clear visual hierarchy for critical information
   - Consistent iconography and terminology
   - Error prevention and clear feedback

3. **Mobile-First Responsive**
   - Components work at 360px minimum width
   - Touch-friendly interactions
   - Scalable typography supporting Dynamic Type
   - Progressive enhancement for larger screens

4. **Performance Optimized**
   - CSS custom properties for theming
   - Efficient animations with GPU acceleration
   - Minimal bundle size impact
   - Lazy loading for non-critical components

### Testing Requirements

- [ ] Keyboard navigation testing
- [ ] Screen reader compatibility (NVDA, VoiceOver)
- [ ] Mobile device testing (iOS/Android)
- [ ] High contrast mode testing
- [ ] Dynamic Type scaling verification
- [ ] Performance testing on low-end devices

This component library ensures consistent, accessible, and user-friendly interfaces specifically designed for medical professionals managing clinical trial data.