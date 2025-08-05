# Patient Portal Accessibility Specifications

## Overview
This document outlines comprehensive accessibility requirements for the clinical trial patient portal, ensuring WCAG 2.1 AA compliance and inclusive design for all users, including those with disabilities, limited technical proficiency, and varying medical conditions.

## Primary User Considerations

### Target Demographics
- **Age Range**: 18-85+ years old
- **Technical Proficiency**: Beginner to advanced
- **Accessibility Needs**: Visual, auditory, motor, cognitive impairments
- **Device Usage**: Primarily mobile (60%), tablet (25%), desktop (15%)
- **Network Conditions**: Variable connectivity, often limited data plans

### Medical Context Impact
- Users may experience treatment side effects affecting cognition
- Stress and anxiety related to medical conditions
- Medication effects on motor skills and concentration
- Time-sensitive data collection requirements
- Need for caregiver assistance in some cases

## WCAG 2.1 AA Compliance Framework

### Perceivable Guidelines

#### Color and Contrast
```css
/* Accessible Color Palette */
:root {
  /* Primary Colors - 4.5:1 minimum contrast ratio */
  --primary-accessible: #0066cc;      /* Links and primary actions */
  --primary-hover: #004499;           /* 7:1 contrast for emphasis */
  
  /* Status Colors - All meet 4.5:1 minimum */
  --success-accessible: #008800;      /* Completion, success states */
  --warning-accessible: #cc6600;      /* Caution, attention needed */
  --error-accessible: #cc0000;        /* Errors, critical issues */
  --info-accessible: #0066aa;         /* Information, help text */
  
  /* Text Colors */
  --text-primary: #000000;            /* Body text - maximum contrast */
  --text-secondary: #666666;          /* Supporting text - 4.5:1 */
  --text-disabled: #999999;           /* Disabled states - 3:1 minimum */
  
  /* Background Colors */
  --background-primary: #ffffff;      /* Main backgrounds */
  --background-secondary: #f8f9fa;    /* Card backgrounds */
  --background-tertiary: #e9ecef;     /* Input backgrounds */
  
  /* Focus and Selection */
  --focus-ring: #0066cc;              /* 2px minimum focus indicator */
  --selection-bg: #cce7ff;            /* Text selection background */
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  :root {
    --text-primary: #000000;
    --background-primary: #ffffff;
    --primary-accessible: #0000ff;
    --focus-ring: #ff0000;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --background-primary: #121212;
    --background-secondary: #1e1e1e;
    --primary-accessible: #66aaff;
  }
}
```

#### Typography and Dynamic Type
```css
/* Scalable Typography System */
:root {
  --font-scale-factor: 1;
  --base-font-size: 16px;
  --line-height-base: 1.5;
  --letter-spacing-base: 0.02em;
}

/* Support up to 200% browser zoom without horizontal scroll */
@media (max-width: 768px) {
  :root {
    --font-scale-factor: 1.1;
  }
}

/* Font Size Scale */
.text-xs { font-size: calc(0.75rem * var(--font-scale-factor)); }
.text-sm { font-size: calc(0.875rem * var(--font-scale-factor)); }
.text-base { font-size: calc(1rem * var(--font-scale-factor)); }
.text-lg { font-size: calc(1.125rem * var(--font-scale-factor)); }
.text-xl { font-size: calc(1.25rem * var(--font-scale-factor)); }
.text-2xl { font-size: calc(1.5rem * var(--font-scale-factor)); }
.text-3xl { font-size: calc(1.875rem * var(--font-scale-factor)); }

/* Enhanced Readability */
.text-body {
  font-size: calc(1rem * var(--font-scale-factor));
  line-height: calc(1.6 * var(--font-scale-factor));
  letter-spacing: var(--letter-spacing-base);
  font-weight: 400;
}

.text-heading {
  font-size: calc(1.5rem * var(--font-scale-factor));
  line-height: calc(1.4 * var(--font-scale-factor));
  font-weight: 600;
  margin-bottom: calc(0.5rem * var(--font-scale-factor));
}

/* Dynamic Type Testing Points */
/* Test at: 100%, 125%, 150%, 175%, 200% browser zoom */
/* Ensure no horizontal scroll at any zoom level */
```

#### Images and Media
```html
<!-- Comprehensive Alt Text Guidelines -->
<img 
  src="questionnaire-progress.svg" 
  alt="Progress indicator showing 3 of 20 questions completed, 15% done"
  role="img"
  aria-describedby="progress-description"
>
<div id="progress-description" class="sr-only">
  You have completed 3 out of 20 questions. This represents 15% of the questionnaire.
</div>

<!-- Decorative Images -->
<img src="medical-icon.svg" alt="" role="presentation">

<!-- Complex Graphics -->
<img 
  src="pain-scale-chart.png" 
  alt="Pain scale from 0 to 10, where 0 means no pain and 10 means worst possible pain"
  longdesc="pain-scale-description.html"
>
```

### Operable Guidelines

#### Keyboard Navigation
```css
/* Focus Management */
*:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-accessible);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 9999;
}

.skip-link:focus {
  top: 6px;
}

/* Focus Trap for Modals */
.modal-focus-trap {
  outline: none;
}
```

```javascript
// Keyboard Navigation Implementation
const keyboardNavigation = {
  // Tab order management
  manageFocusOrder: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element, index) => {
      element.tabIndex = index === 0 ? 0 : -1;
    });
  },

  // Arrow key navigation for form groups
  handleArrowKeys: (event, elementGroup) => {
    const currentIndex = Array.from(elementGroup).indexOf(event.target);
    
    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % elementGroup.length;
        elementGroup[nextIndex].focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + elementGroup.length) % elementGroup.length;
        elementGroup[prevIndex].focus();
        break;
    }
  },

  // Escape key handling
  handleEscape: (event) => {
    if (event.key === 'Escape') {
      // Close modals, cancel operations, return to safe state
      const modal = document.querySelector('[role="dialog"]:not([hidden])');
      if (modal) {
        modal.close();
        return;
      }
      
      // Return focus to main content
      document.querySelector('main').focus();
    }
  }
};
```

#### Touch and Motor Accessibility
```css
/* Touch Target Sizing - WCAG AAA Level */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
  margin: 8px;
  border-radius: 8px;
}

/* Enhanced touch targets for critical actions */
.primary-button {
  min-height: 48px;
  min-width: 120px;
  font-size: 18px;
  font-weight: 600;
}

/* Adequate spacing between interactive elements */
.form-group {
  margin-bottom: 24px;
}

.button-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Understandable Guidelines

#### Language and Reading Level
```javascript
// Content Simplification Guidelines
const contentGuidelines = {
  readingLevel: "5th grade maximum",
  sentenceLength: "20 words maximum",
  paragraphLength: "3 sentences maximum",
  
  // Medical term handling
  handleMedicalTerms: (text) => {
    const definitions = {
      'adverse event': 'side effect or unwanted reaction',
      'efficacy': 'how well the treatment works',
      'placebo': 'inactive treatment used for comparison'
    };
    
    return text.replace(/\b(adverse event|efficacy|placebo)\b/gi, 
      (match) => `${match} (${definitions[match.toLowerCase()]})`
    );
  },

  // Clear instruction format
  formatInstructions: {
    structure: [
      "What you need to do",
      "Why it's important", 
      "How to do it",
      "What happens next"
    ],
    
    example: {
      title: "Daily Symptom Check",
      what: "Record how you're feeling today",
      why: "This helps your doctor track your progress",
      how: "Select one option below and tap Next",
      next: "You'll see the next question"
    }
  }
};
```

#### Error Prevention and Recovery
```html
<!-- Comprehensive Error Handling -->
<form role="form" aria-labelledby="questionnaire-title" novalidate>
  <fieldset>
    <legend>Pain Level Assessment</legend>
    
    <div class="form-group" role="group" aria-describedby="pain-help error-pain">
      <label for="pain-level" class="required">
        Rate your pain level today
        <span aria-label="required">*</span>
      </label>
      
      <div id="pain-help" class="help-text">
        Select a number from 0 (no pain) to 10 (worst possible pain)
      </div>
      
      <input 
        type="range" 
        id="pain-level"
        name="painLevel"
        min="0" 
        max="10" 
        step="1"
        aria-describedby="pain-help pain-value error-pain"
        aria-invalid="false"
        required
      >
      
      <output id="pain-value" for="pain-level" aria-live="polite">
        Level: 5
      </output>
      
      <div id="error-pain" class="error-message" role="alert" aria-live="assertive">
        <!-- Error messages appear here -->
      </div>
    </div>
  </fieldset>
  
  <div class="form-actions">
    <button type="button" class="button-secondary">
      <span class="button-icon" aria-hidden="true">←</span>
      Previous Question
    </button>
    
    <button type="submit" class="button-primary">
      Next Question
      <span class="button-icon" aria-hidden="true">→</span>
    </button>
  </div>
</form>
```

### Robust Guidelines

#### Screen Reader Optimization
```html
<!-- Comprehensive ARIA Implementation -->
<main role="main" aria-labelledby="page-title">
  <div class="questionnaire-container">
    <header>
      <h1 id="page-title">Daily Health Assessment</h1>
      <div class="progress-container" role="region" aria-labelledby="progress-title">
        <h2 id="progress-title" class="sr-only">Progress Information</h2>
        <div 
          class="progress-bar" 
          role="progressbar" 
          aria-valuemin="0" 
          aria-valuemax="20" 
          aria-valuenow="3"
          aria-valuetext="3 of 20 questions completed"
          aria-describedby="progress-detail"
        >
          <div class="progress-fill" style="width: 15%"></div>
        </div>
        <div id="progress-detail" class="progress-text">
          Question 3 of 20 (15% complete)
        </div>
      </div>
    </header>
    
    <section aria-labelledby="question-title" role="region">
      <h2 id="question-title">Current Question</h2>
      <!-- Question content here -->
    </section>
    
    <aside role="complementary" aria-labelledby="help-title">
      <h2 id="help-title">Need Help?</h2>
      <button 
        type="button" 
        aria-expanded="false" 
        aria-controls="help-content"
        data-toggle="help"
      >
        Show Help Information
      </button>
      <div id="help-content" class="help-panel" hidden>
        <!-- Help content -->
      </div>
    </aside>
  </div>
</main>

<!-- Status announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-announcements">
  <!-- Dynamic status updates appear here -->
</div>

<div aria-live="assertive" aria-atomic="true" class="sr-only" id="urgent-announcements">
  <!-- Urgent notifications appear here -->
</div>
```

#### Assistive Technology Compatibility
```javascript
// Screen Reader Announcements
const announceToScreenReader = (message, priority = 'polite') => {
  const announcer = document.getElementById(
    priority === 'assertive' ? 'urgent-announcements' : 'status-announcements'
  );
  
  // Clear previous announcement
  announcer.textContent = '';
  
  // Add new announcement after brief delay
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
  
  // Clear announcement after it's been read
  setTimeout(() => {
    announcer.textContent = '';
  }, 5000);
};

// Usage examples
announceToScreenReader("Your answer has been saved automatically");
announceToScreenReader("Please correct the errors before continuing", 'assertive');
announceToScreenReader("Loading next question, please wait");
```

## Mobile and Responsive Accessibility

### Viewport and Scaling
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
```

```css
/* Responsive Layout System */
.container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: clamp(1rem, 4vw, 2rem);
  box-sizing: border-box;
}

/* Flexible Grid System */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(1rem, 3vw, 2rem);
  width: 100%;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Prevent horizontal scroll at any zoom level */
* {
  max-width: 100%;
  box-sizing: border-box;
}

img, video, iframe {
  max-width: 100%;
  height: auto;
}
```

### Touch Optimization
```css
/* Enhanced touch targets for mobile */
@media (max-width: 768px) {
  .touch-target {
    min-height: 48px;
    min-width: 48px;
    padding: 16px;
  }
  
  .form-input {
    min-height: 44px;
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 12px 16px;
  }
  
  .button-primary {
    width: 100%;
    min-height: 52px;
    font-size: 18px;
  }
}

/* Prevent accidental activation */
.touch-target {
  touch-action: manipulation;
}
```

## Cognitive Accessibility Features

### Memory and Attention Support
```javascript
// Auto-save implementation with user feedback
const autoSave = {
  interval: 30000, // 30 seconds
  
  saveData: async (formData) => {
    try {
      await saveToLocalStorage(formData);
      await syncWithServer(formData);
      
      announceToScreenReader("Your progress has been saved");
      showSaveIndicator("Saved automatically");
      
    } catch (error) {
      showSaveIndicator("Save failed - will retry", 'warning');
      scheduleRetry();
    }
  },
  
  showSaveIndicator: (message, type = 'success') => {
    const indicator = document.getElementById('save-indicator');
    indicator.textContent = message;
    indicator.className = `save-indicator ${type}`;
    indicator.setAttribute('aria-live', 'polite');
    
    setTimeout(() => {
      indicator.textContent = '';
    }, 3000);
  }
};
```

### Simplified Navigation
```html
<!-- Breadcrumb navigation with clear context -->
<nav aria-label="Progress through questionnaire" role="navigation">
  <ol class="breadcrumb">
    <li><a href="#welcome" aria-label="Welcome page, completed">Welcome</a></li>
    <li><a href="#personal-info" aria-label="Personal information, completed">Personal Info</a></li>
    <li aria-current="page" class="current">Daily Assessment</li>
    <li class="upcoming">Medication Review</li>
    <li class="upcoming">Summary</li>
  </ol>
</nav>
```

## Testing and Validation

### Automated Testing
```javascript
// Accessibility testing integration
const accessibilityTests = {
  // Color contrast validation
  validateContrast: () => {
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const styles = getComputedStyle(element);
      const contrast = calculateContrast(styles.color, styles.backgroundColor);
      
      if (contrast < 4.5) {
        console.warn(`Low contrast detected on element:`, element);
      }
    });
  },
  
  // Focus order validation
  validateFocusOrder: () => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Verify logical tab order
    focusableElements.forEach((element, index) => {
      if (element.tabIndex !== -1 && element.tabIndex !== index) {
        console.warn(`Focus order issue at index ${index}:`, element);
      }
    });
  },
  
  // ARIA validation
  validateAria: () => {
    // Check for required ARIA attributes
    const elementsWithAriaLabel = document.querySelectorAll('[aria-label]');
    const elementsWithAriaLabelledby = document.querySelectorAll('[aria-labelledby]');
    
    elementsWithAriaLabelledby.forEach(element => {
      const labelId = element.getAttribute('aria-labelledby');
      const labelElement = document.getElementById(labelId);
      
      if (!labelElement) {
        console.warn(`Missing label element for aria-labelledby="${labelId}":`, element);
      }
    });
  }
};
```

### Manual Testing Checklist
- [ ] Screen reader navigation (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] Voice control (Dragon, Voice Control)
- [ ] High contrast mode
- [ ] Dark mode
- [ ] 200% browser zoom
- [ ] Mobile screen reader (TalkBack, VoiceOver)
- [ ] Switch control navigation
- [ ] Reduced motion preferences

## Implementation Priority

### Phase 1: Core Accessibility (Critical)
1. Color contrast compliance
2. Keyboard navigation
3. Screen reader support
4. Dynamic type scaling
5. Touch target sizing

### Phase 2: Enhanced Features (Important)
1. Voice control compatibility
2. High contrast mode
3. Reduced motion support
4. Cognitive accessibility features
5. Advanced ARIA implementation

### Phase 3: Optimization (Nice to Have)
1. Switch control support
2. Eye-tracking compatibility
3. Multi-language accessibility
4. Advanced voice interface
5. AI-powered accessibility enhancements

This comprehensive accessibility specification ensures the patient portal meets and exceeds WCAG 2.1 AA requirements while providing an exceptional user experience for all patients, regardless of their abilities or technical proficiency.