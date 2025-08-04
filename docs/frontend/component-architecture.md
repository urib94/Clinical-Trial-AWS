# Frontend Component Architecture - Clinical Trial Platform

## Overview

This document outlines the React/Next.js component architecture for the dual-portal Clinical Trial Data Collection Platform, designed to serve both physicians (admin portal) and patients (patient portal) with shared components and portal-specific functionality.

## Architecture Principles

### 1. Dual Portal Design
- **Shared Component Library**: Reusable components across both portals
- **Portal-Specific Components**: Tailored UX for physician vs patient workflows
- **Code Splitting**: Separate bundles for optimal performance
- **Progressive Enhancement**: Mobile-first PWA with offline capabilities

### 2. Accessibility First
- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Dynamic Type Support**: Large font accessibility
- **Screen Reader Optimization**: Comprehensive ARIA implementation
- **Keyboard Navigation**: Full keyboard accessibility

### 3. Performance Optimization
- **Lighthouse Score ≥90**: Mobile performance targets
- **Code Splitting**: Portal-based and route-based splitting
- **Lazy Loading**: Progressive component loading
- **Offline Support**: PWA with service worker caching

## Component Hierarchy

### High-Level Architecture

```
Clinical Trial Platform
├── Shared Infrastructure
│   ├── Authentication System
│   ├── Core UI Components
│   ├── Form System
│   └── Layout Components
├── Physician Admin Portal
│   ├── Dashboard & Analytics
│   ├── Questionnaire Builder
│   ├── Patient Management
│   └── Data Export
└── Patient Portal
    ├── Registration & Onboarding
    ├── Questionnaire Response
    ├── Media Upload
    └── Profile Management
```

### Detailed Component Tree

```
frontend/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── admin/                    # Physician Admin Portal
│   │   ├── dashboard/
│   │   ├── questionnaires/
│   │   │   ├── builder/
│   │   │   └── [id]/
│   │   ├── patients/
│   │   │   ├── roster/
│   │   │   └── [id]/
│   │   ├── analytics/
│   │   └── settings/
│   ├── patient/                  # Patient Portal
│   │   ├── onboarding/
│   │   ├── questionnaires/
│   │   │   └── [id]/
│   │   ├── media/
│   │   ├── profile/
│   │   └── history/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── shared/                   # Shared Component Library
│   │   ├── forms/               # Form Components
│   │   │   ├── FormField.tsx
│   │   │   ├── FormInput.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   ├── FormTextarea.tsx
│   │   │   ├── FormCheckbox.tsx
│   │   │   ├── FormRadioGroup.tsx
│   │   │   ├── FormFileUpload.tsx
│   │   │   └── FormValidation.tsx
│   │   ├── ui/                  # UI Components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Tooltip.tsx
│   │   ├── layout/              # Layout Components
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Container.tsx
│   │   │   └── Grid.tsx
│   │   ├── accessibility/       # Accessibility Helpers
│   │   │   ├── SkipLink.tsx
│   │   │   ├── ScreenReaderOnly.tsx
│   │   │   ├── FocusTrap.tsx
│   │   │   └── AnnounceLive.tsx
│   │   └── providers/           # Context Providers
│   │       ├── AuthProvider.tsx
│   │       ├── ThemeProvider.tsx
│   │       ├── NotificationProvider.tsx
│   │       └── OfflineProvider.tsx
│   ├── admin/                   # Physician Portal Components
│   │   ├── dashboard/
│   │   │   ├── StatisticsCard.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── PatientSummary.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── questionnaire-builder/
│   │   │   ├── QuestionnaireBuilder.tsx
│   │   │   ├── QuestionTypes/
│   │   │   │   ├── TextQuestion.tsx
│   │   │   │   ├── MultipleChoice.tsx
│   │   │   │   ├── ScaleQuestion.tsx
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   └── ConditionalLogic.tsx
│   │   │   ├── DragDropInterface/
│   │   │   │   ├── DraggableQuestion.tsx
│   │   │   │   ├── DropZone.tsx
│   │   │   │   └── QuestionPalette.tsx
│   │   │   ├── Preview/
│   │   │   │   ├── QuestionnairePreview.tsx
│   │   │   │   └── MobilePreview.tsx
│   │   │   └── Settings/
│   │   │       ├── GeneralSettings.tsx
│   │   │       ├── DistributionSettings.tsx
│   │   │       └── NotificationSettings.tsx
│   │   ├── patient-management/
│   │   │   ├── PatientRoster.tsx
│   │   │   ├── PatientCard.tsx
│   │   │   ├── InvitationModal.tsx
│   │   │   ├── BulkActions.tsx
│   │   │   └── PatientDetails.tsx
│   │   ├── analytics/
│   │   │   ├── ResponseCharts.tsx
│   │   │   ├── CompletionStats.tsx
│   │   │   ├── ExportTools.tsx
│   │   │   └── FilterPanel.tsx
│   │   └── media/
│   │       ├── MediaGallery.tsx
│   │       ├── MediaViewer.tsx
│   │       └── MediaTags.tsx
│   └── patient/                 # Patient Portal Components
│       ├── onboarding/
│       │   ├── WelcomeScreen.tsx
│       │   ├── RegistrationForm.tsx
│       │   ├── TwoFactorSetup.tsx
│       │   ├── ConsentForm.tsx
│       │   └── ProfileSetup.tsx
│       ├── questionnaire/
│       │   ├── QuestionnaireFlow.tsx
│       │   ├── QuestionRenderer/
│       │   │   ├── TextResponse.tsx
│       │   │   ├── MultipleChoiceResponse.tsx
│       │   │   ├── ScaleResponse.tsx
│       │   │   └── MediaUploadResponse.tsx
│       │   ├── Progress/
│       │   │   ├── ProgressTracker.tsx
│       │   │   ├── StepNavigation.tsx
│       │   │   └── SaveIndicator.tsx
│       │   ├── Review/
│       │   │   ├── ResponseReview.tsx
│       │   │   ├── SubmissionSummary.tsx
│       │   │   └── ConfirmationScreen.tsx
│       │   └── AutoSave/
│       │       ├── AutoSaveProvider.tsx
│       │       └── OfflineQueue.tsx
│       ├── media/
│       │   ├── MediaUploadFlow.tsx
│       │   ├── FilePreview.tsx
│       │   ├── UploadProgress.tsx
│       │   └── MediaLibrary.tsx
│       └── profile/
│           ├── ProfileOverview.tsx
│           ├── SecuritySettings.tsx
│           ├── NotificationPreferences.tsx
│           └── ResponseHistory.tsx
├── hooks/                       # Custom React Hooks
│   ├── auth/
│   │   ├── useAuth.ts
│   │   ├── useSignIn.ts
│   │   ├── useSignOut.ts
│   │   └── useTwoFactor.ts
│   ├── questionnaires/
│   │   ├── useQuestionnaireBuilder.ts
│   │   ├── useQuestionnaireResponse.ts
│   │   ├── useAutoSave.ts
│   │   └── useConditionalLogic.ts
│   ├── data/
│   │   ├── usePatients.ts
│   │   ├── useAnalytics.ts
│   │   ├── useMedia.ts
│   │   └── useExport.ts
│   ├── ui/
│   │   ├── useModal.ts
│   │   ├── useToast.ts
│   │   ├── useTheme.ts
│   │   └── useResponsive.ts
│   └── pwa/
│       ├── useOffline.ts
│       ├── useServiceWorker.ts
│       ├── useInstallPrompt.ts
│       └── usePushNotifications.ts
├── lib/                         # Utility Libraries
│   ├── auth/
│   │   ├── cognito.ts
│   │   └── session.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   └── types.ts
│   ├── validation/
│   │   ├── schemas.ts
│   │   └── rules.ts
│   ├── utils/
│   │   ├── accessibility.ts
│   │   ├── responsive.ts
│   │   ├── storage.ts
│   │   └── crypto.ts
│   └── constants/
│       ├── routes.ts
│       ├── breakpoints.ts
│       └── colors.ts
└── types/                       # TypeScript Definitions
    ├── auth.ts
    ├── questionnaire.ts
    ├── patient.ts
    ├── media.ts
    ├── api.ts
    └── ui.ts
```

## State Management Boundaries

### Global State (React Context + TanStack Query)

1. **Authentication State**
   - User session and tokens
   - Role-based permissions
   - Two-factor authentication status

2. **Theme and Accessibility**
   - Dark/light mode preferences
   - Font size and contrast settings
   - Language preferences

3. **Offline and PWA**
   - Network connectivity status
   - Cached data management
   - Push notification settings

### Portal-Specific State

#### Physician Admin Portal
- **Questionnaire Builder State**: Drag-and-drop interface state, question configurations
- **Patient Management State**: Selected patients, bulk action states
- **Analytics State**: Filter selections, chart configurations

#### Patient Portal  
- **Response State**: Current questionnaire responses, validation states
- **Auto-save State**: Pending saves, offline queue
- **Upload State**: File upload progress, media library

## Component Design Patterns

### 1. Compound Components
```typescript
// Example: FormField compound component
<FormField>
  <FormField.Label>Email Address</FormField.Label>
  <FormField.Input type="email" />
  <FormField.Error />
  <FormField.Help>We'll never share your email</FormField.Help>
</FormField>
```

### 2. Render Props for Complex State
```typescript
// Example: AutoSave render prop
<AutoSave onSave={handleSave}>
  {({ saving, lastSaved, error }) => (
    <QuestionnaireForm 
      saving={saving}
      lastSaved={lastSaved}
      error={error}
    />
  )}
</AutoSave>
```

### 3. Accessibility-First Design
```typescript
// Example: Modal with comprehensive accessibility
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Patient Invitation"
  description="Send invitation to new patient"
  initialFocus="email-input"
>
  <ModalContent />
</Modal>
```

## Performance Optimization Strategies

### 1. Code Splitting
- **Portal-based splitting**: Separate bundles for admin and patient portals
- **Route-based splitting**: Lazy load pages within each portal
- **Component-based splitting**: Lazy load heavy components (questionnaire builder)

### 2. Bundle Optimization
- **Tree shaking**: Remove unused exports
- **Dynamic imports**: Load components on demand
- **Service worker caching**: Cache critical assets for offline use

### 3. Rendering Optimization
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Optimize expensive computations
- **Virtualization**: Handle large lists efficiently

## Accessibility Implementation

### 1. ARIA Labels and Roles
- Comprehensive labeling for screen readers
- Role definitions for custom components
- Live regions for dynamic content updates

### 2. Keyboard Navigation
- Tab order management
- Skip links for main content
- Keyboard shortcuts for power users

### 3. Visual Accessibility
- High contrast mode support
- Dynamic Type/Large Font scaling
- Focus indicators and visual hierarchy

## Mobile-First PWA Features

### 1. Responsive Design
- Viewport ≥360px support
- Touch-friendly interactive elements
- Optimized for one-handed use

### 2. Offline Functionality
- Service worker for caching
- Offline questionnaire completion
- Background sync for submissions

### 3. Native App Features
- Push notifications
- Install prompts
- Fullscreen support

## Testing Strategy

### 1. Component Testing
- Unit tests with Jest and React Testing Library
- Accessibility tests with jest-axe
- Visual regression tests with Chromatic

### 2. Integration Testing
- E2E tests with Playwright
- Cross-browser compatibility
- Mobile device testing

### 3. Performance Testing
- Lighthouse CI integration
- Bundle size monitoring
- Runtime performance profiling

## Next Steps

1. **Phase 2**: Implement shared component library
2. **Phase 3**: Build portal-specific components  
3. **Phase 4**: Integrate authentication and data flow
4. **Phase 5**: PWA optimization and testing
5. **Phase 6**: Accessibility audit and compliance verification

This architecture provides a solid foundation for building a scalable, accessible, and performant dual-portal clinical trial platform that serves both physician and patient needs effectively.