# Mobile-Responsive Design Specifications

## Overview
The physician admin portal is designed with a mobile-first approach, ensuring full functionality across all device sizes from 360px smartphones to large desktop displays. This document outlines the responsive behavior, breakpoints, and device-specific optimizations.

## Breakpoint System

### Primary Breakpoints
```css
/* Mobile First Approach */
$mobile-xs: 360px;   /* Minimum supported width */
$mobile-sm: 480px;   /* Small mobile devices */
$tablet-sm: 768px;   /* Small tablets, large phones landscape */
$tablet-md: 1024px;  /* Standard tablets, small laptops */
$desktop-sm: 1280px; /* Desktop displays */
$desktop-md: 1440px; /* Large desktop displays */
$desktop-lg: 1920px; /* Extra large displays */
```

### Responsive Grid System
```css
/* CSS Grid Layout for all viewport sizes */
.container {
  display: grid;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 16px;
  gap: 16px;
}

/* Mobile (360px - 767px) */
@media (max-width: 767px) {
  .container {
    grid-template-columns: 1fr;
    padding: 0 12px;
    gap: 12px;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
    padding: 0 20px;
    gap: 20px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    grid-template-columns: repeat(12, 1fr);
    padding: 0 32px;
    gap: 24px;
  }
}
```

## Typography Scaling

### Dynamic Type Support
```css
/* Scalable typography using clamp() for accessibility */
:root {
  /* Base font sizes that scale with viewport and user preferences */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 1rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1.125rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.5rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.875rem);
  --font-size-2xl: clamp(1.5rem, 1.3rem + 1vw, 2.25rem);
  --font-size-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 3rem);
  
  /* Line heights that work across all sizes */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Responsive spacing */
  --spacing-xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --spacing-sm: clamp(0.5rem, 0.4rem + 0.5vw, 1rem);
  --spacing-md: clamp(0.75rem, 0.6rem + 0.75vw, 1.5rem);
  --spacing-lg: clamp(1rem, 0.8rem + 1vw, 2rem);
  --spacing-xl: clamp(1.5rem, 1.2rem + 1.5vw, 3rem);
  --spacing-2xl: clamp(2rem, 1.6rem + 2vw, 4rem);
}

/* Typography classes */
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }
.text-3xl { font-size: var(--font-size-3xl); }

/* Support for user font size preferences */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Component Responsive Behavior

### Navigation Header
```css
/* Mobile navigation (360px - 767px) */
@media (max-width: 767px) {
  .header {
    height: 60px;
    padding: 0 12px;
  }
  
  .nav-main {
    display: none; /* Hidden by default */
  }
  
  .nav-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .hamburger-menu {
    display: block;
    width: 24px;
    height: 24px;
    cursor: pointer;
  }
  
  .nav-overlay {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }
  
  .nav-menu {
    position: fixed;
    top: 60px;
    left: -100%;
    width: 280px;
    height: calc(100vh - 60px);
    background: white;
    transition: left 0.3s ease;
    z-index: 1001;
  }
  
  .nav-menu.open {
    left: 0;
  }
}

/* Tablet navigation (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .header {
    height: 64px;
    padding: 0 20px;
  }
  
  .nav-main {
    display: flex;
    gap: 16px;
  }
  
  .nav-item {
    font-size: var(--font-size-sm);
    padding: 8px 12px;
  }
  
  .hamburger-menu {
    display: none;
  }
}

/* Desktop navigation (1024px+) */
@media (min-width: 1024px) {
  .header {
    height: 72px;
    padding: 0 32px;
  }
  
  .nav-main {
    display: flex;
    gap: 24px;
  }
  
  .nav-item {
    font-size: var(--font-size-base);
    padding: 12px 16px;
  }
}
```

### Dashboard Cards
```css
/* Mobile dashboard layout */
@media (max-width: 767px) {
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .dashboard-card {
    padding: 16px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .dashboard-card-title {
    font-size: var(--font-size-lg);
    margin-bottom: 12px;
  }
  
  .dashboard-card-content {
    font-size: var(--font-size-base);
  }
  
  /* Stack statistics vertically on mobile */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .stat-item {
    text-align: center;
    padding: 12px;
    border-radius: 6px;
    background: var(--surface-gray);
  }
  
  .stat-number {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--primary-blue);
  }
  
  .stat-label {
    font-size: var(--font-size-sm);
    color: var(--neutral-gray);
    margin-top: 4px;
  }
}

/* Tablet dashboard layout */
@media (min-width: 768px) and (max-width: 1023px) {
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .dashboard-card {
    padding: 20px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

/* Desktop dashboard layout */
@media (min-width: 1024px) {
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  
  .dashboard-card {
    padding: 24px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}
```

### Data Tables
```css
/* Mobile table behavior - Card layout */
@media (max-width: 767px) {
  .data-table {
    display: none; /* Hide traditional table */
  }
  
  .table-card-view {
    display: block;
  }
  
  .table-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .table-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .table-card-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  .table-card-status {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: var(--font-size-xs);
    font-weight: 500;
  }
  
  .table-card-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .table-card-field {
    display: flex;
    flex-direction: column;
  }
  
  .table-card-label {
    font-size: var(--font-size-xs);
    color: var(--neutral-gray);
    margin-bottom: 2px;
  }
  
  .table-card-value {
    font-size: var(--font-size-sm);
    font-weight: 500;
  }
  
  .table-card-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  .table-card-action {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: var(--font-size-xs);
    text-decoration: none;
    background: var(--primary-blue);
    color: white;
  }
}

/* Tablet table behavior - Simplified columns */
@media (min-width: 768px) and (max-width: 1023px) {
  .data-table {
    display: table;
    width: 100%;
    border-collapse: collapse;
  }
  
  .table-card-view {
    display: none;
  }
  
  /* Hide less important columns on tablet */
  .table-col-hide-tablet {
    display: none;
  }
  
  .table-header {
    background: var(--surface-gray);
    font-weight: 600;
    font-size: var(--font-size-sm);
    padding: 12px;
    text-align: left;
  }
  
  .table-cell {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    font-size: var(--font-size-sm);
  }
}

/* Desktop table behavior - Full functionality */
@media (min-width: 1024px) {
  .data-table {
    display: table;
    width: 100%;
  }
  
  .table-col-hide-tablet {
    display: table-cell;
  }
  
  .table-header {
    font-size: var(--font-size-base);
    padding: 16px;
  }
  
  .table-cell {
    padding: 16px;
    font-size: var(--font-size-base);
  }
}
```

### Form Elements
```css
/* Mobile form styling */
@media (max-width: 767px) {
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--neutral-gray);
  }
  
  .form-input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
  }
  
  .form-input:focus {
    outline: none;
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  .form-button {
    width: 100%;
    padding: 14px;
    font-size: var(--font-size-base);
    font-weight: 600;
    border: none;
    border-radius: 6px;
    background: var(--primary-blue);
    color: white;
    cursor: pointer;
    margin-top: 8px;
  }
  
  .form-button:hover {
    background: #1d4ed8;
  }
  
  .form-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  /* Stack form buttons on mobile */
  .form-button-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

/* Tablet form styling */
@media (min-width: 768px) and (max-width: 1023px) {
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-input {
    padding: 14px;
  }
  
  .form-button {
    width: auto;
    min-width: 120px;
    padding: 12px 24px;
  }
  
  .form-button-group {
    display: flex;
    flex-direction: row;
    gap: 12px;
    justify-content: flex-end;
  }
}

/* Desktop form styling */
@media (min-width: 1024px) {
  .form-group {
    margin-bottom: 24px;
  }
  
  .form-input {
    padding: 16px;
  }
  
  .form-button {
    padding: 14px 28px;
  }
  
  .form-button-group {
    gap: 16px;
  }
}
```

## Touch Target Specifications

### Minimum Touch Target Sizes
```css
/* Ensure all interactive elements meet accessibility standards */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Mobile-specific touch optimizations */
@media (max-width: 767px) {
  .btn-small {
    min-width: 44px;
    min-height: 44px;
    padding: 8px 12px;
  }
  
  .btn-medium {
    min-width: 48px;
    min-height: 48px;
    padding: 12px 16px;
  }
  
  .btn-large {
    min-width: 52px;
    min-height: 52px;
    padding: 14px 20px;
  }
  
  /* Increase spacing between touch targets */
  .touch-group > * + * {
    margin-left: 8px;
  }
  
  /* Larger tap targets for primary actions */
  .btn-primary {
    min-height: 52px;
    font-size: var(--font-size-lg);
  }
}
```

## Responsive Images and Media

### Image Scaling
```css
/* Responsive image behavior */
.responsive-image {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Mobile image containers */
@media (max-width: 767px) {
  .image-container {
    width: 100%;
    margin: 16px 0;
  }
  
  .image-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* Tablet image containers */
@media (min-width: 768px) and (max-width: 1023px) {
  .image-container {
    max-width: 80%;
    margin: 20px auto;
  }
  
  .image-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

/* Desktop image containers */
@media (min-width: 1024px) {
  .image-container {
    max-width: 60%;
    margin: 24px auto;
  }
  
  .image-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}
```

## Performance Optimizations

### Mobile-First Loading
```css
/* Critical CSS for above-the-fold content */
.critical {
  /* Inline critical styles for mobile viewport */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
  line-height: 1.5;
}

/* Lazy load non-critical styles */
.non-critical {
  /* Load after initial render */
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}

/* Optimize animations for mobile */
@media (max-width: 767px) {
  .animation {
    animation-duration: 0.2s;
    will-change: transform;
  }
}

@media (min-width: 768px) {
  .animation {
    animation-duration: 0.3s;
  }
}
```

### Touch Gesture Support
```css
/* Touch-friendly scrolling */
.scroll-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

/* Swipe indicators on mobile */
@media (max-width: 767px) {
  .swipe-container {
    position: relative;
  }
  
  .swipe-container::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 20px;
    background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1));
    pointer-events: none;
  }
}
```

## Accessibility Considerations

### Focus Management
```css
/* Enhanced focus indicators for touch devices */
@media (max-width: 767px) {
  .focus-visible {
    outline: 3px solid var(--primary-blue);
    outline-offset: 2px;
  }
  
  /* Larger focus targets on mobile */
  .focus-target {
    padding: 4px;
    margin: -4px;
  }
}

/* Keyboard navigation on larger screens */
@media (min-width: 768px) {
  .focus-visible {
    outline: 2px solid var(--primary-blue);
    outline-offset: 1px;
  }
}
```

### High Contrast Support
```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --primary-blue: #0000ff;
    --text-color: #000000;
    --background-color: #ffffff;
    --border-color: #000000;
  }
  
  .card {
    border: 2px solid var(--border-color);
  }
  
  .button {
    border: 2px solid var(--border-color);
  }
}
```

## Device-Specific Optimizations

### iOS Safari Optimizations
```css
/* Handle iOS Safari viewport behavior */
@supports (-webkit-touch-callout: none) {
  .full-height {
    height: -webkit-fill-available;
  }
}

/* Fix iOS zoom on input focus */
@media (max-width: 767px) {
  .form-input {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
```

### Android Chrome Optimizations
```css
/* Android-specific touch optimizations */
@media (max-width: 767px) {
  .android-touch {
    -webkit-tap-highlight-color: rgba(37, 99, 235, 0.1);
    touch-action: manipulation;
    user-select: none;
  }
}
```

## Testing Matrix

### Device Testing Requirements
```
Mobile Devices (360px - 767px):
✓ iPhone SE (375x667)
✓ iPhone 12/13/14 (390x844)
✓ iPhone 14 Plus (428x926)
✓ Samsung Galaxy S21 (360x800)
✓ Samsung Galaxy S21+ (384x854)
✓ Google Pixel 5 (393x851)

Tablet Devices (768px - 1023px):
✓ iPad (768x1024)
✓ iPad Air (820x1180)
✓ iPad Pro 11" (834x1194)
✓ Samsung Galaxy Tab S7 (753x1037)
✓ Surface Pro 7 (912x1368)

Desktop Displays (1024px+):
✓ MacBook Air 13" (1280x800)
✓ MacBook Pro 16" (1728x1117)
✓ Dell XPS 13 (1920x1080)
✓ iMac 24" (1920x1080)
✓ External 4K (3840x2160)
```

## Implementation Checklist

### Mobile-First Development
- [ ] Design components for 360px first
- [ ] Progressive enhancement for larger screens
- [ ] Touch-friendly interaction targets (≥44px)
- [ ] Readable text without zoom (≥16px on mobile)
- [ ] Efficient navigation on small screens

### Responsive Testing
- [ ] Test on actual devices, not just browser tools
- [ ] Verify touch interactions work correctly
- [ ] Check text readability at all sizes
- [ ] Ensure all features accessible on mobile
- [ ] Validate performance on slower devices

### Accessibility Compliance
- [ ] WCAG 2.1 AA compliance across all breakpoints
- [ ] Screen reader testing on mobile and desktop
- [ ] Keyboard navigation without mouse
- [ ] High contrast mode support
- [ ] Dynamic Type scaling support (100% - 200%)