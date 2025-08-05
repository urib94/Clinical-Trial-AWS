# Dynamic Type and Font Scaling Testing Guide

## Overview
This guide provides comprehensive testing procedures for ensuring the patient portal maintains functionality and accessibility when users increase browser font sizes or enable dynamic type features. This is critical for users with visual impairments and those who need larger text for medical reasons.

## Testing Requirements

### Browser Zoom Levels
Test at the following zoom levels across all major browsers:
- **100%** - Baseline (16px default)
- **125%** - 20px effective font size
- **150%** - 24px effective font size
- **175%** - 28px effective font size
- **200%** - 32px effective font size (WCAG AA requirement)

### Dynamic Type Integration
```css
/* CSS Implementation for Dynamic Type Support */
:root {
  /* Base font size that respects user preferences */
  --font-size-base: clamp(14px, 1rem, 22px);
  --font-scale-factor: 1;
  
  /* Responsive scaling factors */
  --scale-xs: calc(0.75 * var(--font-scale-factor));
  --scale-sm: calc(0.875 * var(--font-scale-factor));
  --scale-base: calc(1 * var(--font-scale-factor));
  --scale-lg: calc(1.125 * var(--font-scale-factor));
  --scale-xl: calc(1.25 * var(--font-scale-factor));
  --scale-2xl: calc(1.5 * var(--font-scale-factor));
  --scale-3xl: calc(1.875 * var(--font-scale-factor));
}

/* Detect user font size preference */
@media (min-resolution: 2dppx) {
  :root {
    --font-scale-factor: 1.1;
  }
}

/* Typography scale that adapts to user preferences */
.text-xs { font-size: calc(var(--font-size-base) * var(--scale-xs)); }
.text-sm { font-size: calc(var(--font-size-base) * var(--scale-sm)); }
.text-base { font-size: calc(var(--font-size-base) * var(--scale-base)); }
.text-lg { font-size: calc(var(--font-size-base) * var(--scale-lg)); }
.text-xl { font-size: calc(var(--font-size-base) * var(--scale-xl)); }
.text-2xl { font-size: calc(var(--font-size-base) * var(--scale-2xl)); }
.text-3xl { font-size: calc(var(--font-size-base) * var(--scale-3xl)); }

/* Line height that scales appropriately */
.text-body {
  line-height: calc(1.5 + (var(--font-scale-factor) - 1) * 0.2);
  letter-spacing: 0.02em;
}

.text-heading {
  line-height: calc(1.3 + (var(--font-scale-factor) - 1) * 0.1);
  font-weight: 600;
}
```

## Mobile Dynamic Type Support

### iOS Dynamic Type
```css
/* iOS Dynamic Type Categories */
@supports (font: -apple-system-body) {
  .text-body {
    font: -apple-system-body;
    line-height: 1.4;
  }
  
  .text-heading {
    font: -apple-system-headline;
    line-height: 1.2;
  }
  
  .text-large {
    font: -apple-system-title1;
    line-height: 1.3;
  }
}

/* iOS Accessibility Sizes Support */
@media (prefers-contrast: high) and (min-width: 0px) {
  :root {
    --font-scale-factor: 1.3;
  }
}
```

### Android Accessibility
```css
/* Android font scale detection */
@media (min-device-pixel-ratio: 1) and (max-device-pixel-ratio: 1) {
  /* Standard density */
  :root {
    --font-scale-factor: 1;
  }
}

@media (min-device-pixel-ratio: 1.5) {
  /* High density displays */
  :root {
    --font-scale-factor: 1.1;
  }
}

/* Large text accessibility setting */
@media (prefers-reduced-motion: no-preference) {
  .text-scalable {
    font-size: max(16px, 1rem);
    line-height: max(1.5, calc(1.4 + 0.2vw));
  }
}
```

## Layout Adaptation Strategies

### Flexible Container System
```css
/* Container that adapts to content size */
.adaptive-container {
  width: 100%;
  max-width: 100%;
  padding: clamp(1rem, 4vw, 2.5rem);
  margin: 0 auto;
  box-sizing: border-box;
}

/* Prevent horizontal overflow at any font size */
* {
  max-width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Flexible grid that adapts to content */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(0.75rem, 2vw + 0.5rem, 2rem);
  width: 100%;
}

/* Stack columns on smaller viewports or larger text */
@media (max-width: 768px) or (min-resolution: 120dpi) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-resolution: 119dpi) {
  .form-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
```

### Button and Touch Target Scaling
```css
/* Buttons that scale with font size */
.button-base {
  /* Minimum touch target: 44px */
  min-height: max(44px, calc(2.5em + 0.5rem));
  min-width: max(44px, calc(6em + 1rem));
  padding: clamp(0.5rem, 1em, 1.5rem) clamp(1rem, 2em, 3rem);
  
  font-size: inherit;
  font-weight: 600;
  line-height: 1.2;
  
  /* Ensure text doesn't overflow */
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* Primary action buttons */
.button-primary {
  font-size: max(16px, 1rem);
  background: var(--primary-accessible);
  color: white;
  border: 2px solid var(--primary-accessible);
}

/* Secondary buttons with adequate contrast */
.button-secondary {
  font-size: max(16px, 1rem);
  background: transparent;
  color: var(--primary-accessible);
  border: 2px solid var(--primary-accessible);
}

/* Button focus states that scale */
.button-base:focus {
  outline: max(2px, 0.125em) solid var(--focus-ring);
  outline-offset: max(2px, 0.125em);
}
```

## Form Input Adaptation

### Scalable Form Elements
```css
/* Form inputs that respect font scaling */
.form-input {
  min-height: max(44px, calc(2.5em + 0.25rem));
  padding: clamp(0.5rem, 1em, 1.25rem);
  font-size: max(16px, 1rem); /* Prevents iOS zoom */
  line-height: 1.4;
  
  border: 2px solid var(--border-color);
  border-radius: max(4px, 0.25em);
  
  /* Ensure text doesn't overflow */
  width: 100%;
  box-sizing: border-box;
}

/* Label positioning that adapts */
.form-group {
  display: flex;
  flex-direction: column;
  gap: clamp(0.25rem, 0.5em, 0.75rem);
  margin-bottom: clamp(1rem, 1.5em, 2rem);
}

.form-label {
  font-size: max(14px, 0.875rem);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  
  /* Required indicator scaling */
  .required {
    color: var(--error-accessible);
    font-size: max(16px, 1em);
    margin-left: 0.25em;
  }
}

/* Help text that scales appropriately */
.form-help {
  font-size: max(14px, 0.875rem);
  line-height: 1.5;
  color: var(--text-secondary);
  margin-top: clamp(0.25rem, 0.5em, 0.5rem);
}
```

### Range and Slider Controls
```css
/* Accessible range inputs */
.range-input {
  width: 100%;
  height: max(44px, 3em);
  
  /* Track styling */
  -webkit-appearance: none;
  background: transparent;
}

.range-input::-webkit-slider-track {
  height: max(8px, 0.5em);
  background: var(--background-tertiary);
  border-radius: max(4px, 0.25em);
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: max(24px, 1.5em);
  width: max(24px, 1.5em);
  background: var(--primary-accessible);
  border-radius: 50%;
  cursor: pointer;
}

/* Focus states for range inputs */
.range-input:focus {
  outline: max(2px, 0.125em) solid var(--focus-ring);
  outline-offset: max(2px, 0.125em);
}
```

## Testing Procedures

### Automated Testing Script
```javascript
// Dynamic Type Testing Automation
const dynamicTypeTests = {
  // Test at different zoom levels
  testZoomLevels: async (page) => {
    const zoomLevels = [1.0, 1.25, 1.5, 1.75, 2.0];
    
    for (const zoom of zoomLevels) {
      await page.setViewport({
        width: Math.floor(1200 / zoom),
        height: Math.floor(800 / zoom),
        deviceScaleFactor: zoom
      });
      
      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (hasHorizontalScroll) {
        console.warn(`Horizontal scroll detected at ${zoom * 100}% zoom`);
      }
      
      // Check button accessibility
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          console.warn(`Button too small at ${zoom * 100}% zoom:`, box);
        }
      }
      
      // Check text readability
      const textElements = await page.$$('p, span, div');
      for (const element of textElements) {
        const fontSize = await page.evaluate(el => {
          return window.getComputedStyle(el).fontSize;
        }, element);
        
        const fontSizePx = parseFloat(fontSize);
        if (fontSizePx < 14) {
          console.warn(`Text too small at ${zoom * 100}% zoom: ${fontSizePx}px`);
        }
      }
    }
  },

  // Test font preference detection
  testFontPreferences: async (page) => {
    // Simulate different system font sizes
    const fontScales = [
      { name: 'small', scale: 0.875 },
      { name: 'medium', scale: 1.0 },
      { name: 'large', scale: 1.125 },
      { name: 'extra-large', scale: 1.25 },
      { name: 'accessibility', scale: 1.5 }
    ];

    for (const { name, scale } of fontScales) {
      await page.evaluateOnNewDocument((scaleValue) => {
        document.documentElement.style.setProperty('--font-scale-factor', scaleValue);
      }, scale);
      
      await page.reload();
      
      // Test critical user journeys at this scale
      await testQuestionnaireFilling(page);
      await testNavigation(page);
      await testFormSubmission(page);
    }
  },

  // Test mobile dynamic type
  testMobileDynamicType: async (page) => {
    // iOS Dynamic Type sizes
    const iOSSizes = [
      'xSmall', 'Small', 'Medium', 'Large', 'xLarge', 'xxLarge', 'xxxLarge',
      'AX1', 'AX2', 'AX3', 'AX4', 'AX5' // Accessibility sizes
    ];

    for (const size of iOSSizes) {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'light' },
        { name: 'prefers-reduced-motion', value: 'no-preference' }
      ]);
      
      // Simulate iOS dynamic type
      await page.addStyleTag({
        content: `
          :root { 
            --font-scale-factor: ${getDynamicTypeScale(size)};
          }
        `
      });
      
      await testMobileUserJourney(page);
    }
  }
};

// Helper function to get scale factor for iOS Dynamic Type
function getDynamicTypeScale(size) {
  const scales = {
    'xSmall': 0.82,
    'Small': 0.88,
    'Medium': 0.95,
    'Large': 1.0,    // Default
    'xLarge': 1.12,
    'xxLarge': 1.23,
    'xxxLarge': 1.35,
    'AX1': 1.4,      // Accessibility sizes
    'AX2': 1.5,
    'AX3': 1.6,
    'AX4': 1.75,
    'AX5': 1.9
  };
  return scales[size] || 1.0;
}
```

### Manual Testing Checklist

#### Desktop Browser Testing
- [ ] **Chrome**: Test 100%, 125%, 150%, 175%, 200% zoom
- [ ] **Firefox**: Test browser zoom and font size preferences
- [ ] **Safari**: Test zoom and text size settings
- [ ] **Edge**: Test zoom and accessibility features

#### Mobile Device Testing
- [ ] **iOS Safari**: Test with Dynamic Type at various sizes
- [ ] **iOS Chrome**: Test with system font scaling
- [ ] **Android Chrome**: Test with font size settings
- [ ] **Samsung Internet**: Test accessibility font sizes

#### User Journey Testing at Each Scale
1. **Registration Flow**
   - [ ] Navigate to registration page
   - [ ] Complete form fields
   - [ ] Submit registration
   - [ ] Verify confirmation

2. **Questionnaire Completion**
   - [ ] Login successfully
   - [ ] Navigate questionnaire
   - [ ] Answer all question types
   - [ ] Submit responses

3. **Profile Management**
   - [ ] Access profile settings
   - [ ] Update information
   - [ ] Change password
   - [ ] Save changes

### Critical Success Criteria

#### Layout Integrity
- [ ] **No horizontal scrolling** at any zoom level up to 200%
- [ ] **All content visible** without clipping or overlap
- [ ] **Buttons remain clickable** with minimum 44px touch targets
- [ ] **Text remains readable** with adequate contrast

#### Functionality Preservation
- [ ] **All interactive elements accessible** at every zoom level
- [ ] **Form validation works** correctly at all scales
- [ ] **Navigation remains functional** across zoom levels
- [ ] **Auto-save functionality** unaffected by scaling

#### Performance Considerations
- [ ] **Page load times** remain acceptable with larger fonts
- [ ] **Smooth scrolling** maintained at all zoom levels
- [ ] **Memory usage** doesn't spike with font scaling
- [ ] **Battery impact** minimal on mobile devices

## Common Issues and Solutions

### Text Overflow
```css
/* Problem: Text cuts off in fixed-width containers */
.problematic {
  width: 200px; /* Fixed width causes issues */
}

/* Solution: Use flexible widths */
.solution {
  max-width: 200px;
  width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
```

### Button Size Issues
```css
/* Problem: Buttons become too small or too large */
.problematic-button {
  height: 40px; /* Fixed height causes issues */
  font-size: 14px; /* Fixed font size doesn't scale */
}

/* Solution: Responsive button sizing */
.solution-button {
  min-height: max(44px, calc(2.5em + 0.5rem));
  padding: clamp(0.5rem, 1em, 1.5rem);
  font-size: max(16px, 1rem);
}
```

### Layout Breaking
```css
/* Problem: Grid layouts break at large font sizes */
.problematic-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Fixed columns */
}

/* Solution: Responsive grid */
.solution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
}
```

## Accessibility Statement Integration

Include the following in the accessibility statement:

> **Font Size and Zoom Support**: This application supports browser zoom up to 200% and respects user font size preferences. On mobile devices, the application adapts to iOS Dynamic Type and Android font size settings. Users can adjust text size through their browser or device settings without losing functionality.

## Testing Schedule

- **Pre-deployment**: Complete dynamic type testing across all browsers
- **Weekly**: Automated zoom testing as part of CI/CD
- **Monthly**: Manual testing with accessibility tools
- **Quarterly**: Full user testing with vision-impaired users

This comprehensive testing approach ensures the patient portal remains fully functional and accessible regardless of user font size preferences or zoom settings.