# Routing Strategy - Clinical Trial Platform

## Overview

This document defines the comprehensive routing strategy for the dual-portal Clinical Trial platform using Next.js 14 App Router, ensuring secure navigation, optimal SEO, and seamless user experiences across both physician admin and patient portals.

## Routing Architecture

### Next.js 14 App Router Structure

```
frontend/app/
├── (auth)/                      # Authentication Layout Group
│   ├── layout.tsx              # Auth-specific layout
│   ├── login/
│   │   └── page.tsx           # Login page
│   ├── register/
│   │   └── page.tsx           # Patient registration
│   ├── forgot-password/
│   │   └── page.tsx           # Password reset
│   ├── verify-email/
│   │   └── page.tsx           # Email verification
│   └── setup-mfa/
│       └── page.tsx           # MFA setup
├── admin/                      # Physician Admin Portal
│   ├── layout.tsx             # Admin layout with navigation
│   ├── loading.tsx            # Admin loading UI
│   ├── error.tsx              # Admin error boundary
│   ├── not-found.tsx          # Admin 404 page
│   ├── page.tsx               # Admin dashboard
│   ├── dashboard/
│   │   ├── page.tsx           # Dashboard overview
│   │   ├── analytics/
│   │   │   └── page.tsx       # Detailed analytics
│   │   └── reports/
│   │       └── page.tsx       # Custom reports
│   ├── questionnaires/
│   │   ├── page.tsx           # Questionnaire list
│   │   ├── new/
│   │   │   └── page.tsx       # Create questionnaire
│   │   ├── [id]/
│   │   │   ├── page.tsx       # View questionnaire
│   │   │   ├── edit/
│   │   │   │   └── page.tsx   # Edit questionnaire
│   │   │   ├── responses/
│   │   │   │   ├── page.tsx   # Response list
│   │   │   │   └── [responseId]/
│   │   │   │       └── page.tsx # Individual response
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx   # Questionnaire analytics
│   │   │   └── settings/
│   │   │       └── page.tsx   # Questionnaire settings
│   │   └── templates/
│   │       ├── page.tsx       # Template library
│   │       └── [templateId]/
│   │           └── page.tsx   # Template details
│   ├── patients/
│   │   ├── page.tsx           # Patient roster
│   │   ├── invite/
│   │   │   └── page.tsx       # Invite patients
│   │   ├── [id]/
│   │   │   ├── page.tsx       # Patient profile
│   │   │   ├── questionnaires/
│   │   │   │   └── page.tsx   # Patient's questionnaires
│   │   │   ├── media/
│   │   │   │   └── page.tsx   # Patient's media
│   │   │   ├── history/
│   │   │   │   └── page.tsx   # Activity history
│   │   │   └── notes/
│   │   │       └── page.tsx   # Clinical notes
│   │   └── groups/
│   │       ├── page.tsx       # Patient groups
│   │       └── [groupId]/
│   │           └── page.tsx   # Group details
│   ├── media/
│   │   ├── page.tsx           # Media gallery
│   │   ├── upload/
│   │   │   └── page.tsx       # Bulk upload
│   │   └── [mediaId]/
│   │       └── page.tsx       # Media details
│   ├── analytics/
│   │   ├── page.tsx           # Analytics overview
│   │   ├── engagement/
│   │   │   └── page.tsx       # Engagement metrics
│   │   ├── completion/
│   │   │   └── page.tsx       # Completion rates
│   │   └── export/
│   │       └── page.tsx       # Data export
│   ├── settings/
│   │   ├── page.tsx           # General settings
│   │   ├── profile/
│   │   │   └── page.tsx       # Admin profile
│   │   ├── notifications/
│   │   │   └── page.tsx       # Notification settings
│   │   ├── security/
│   │   │   └── page.tsx       # Security settings
│   │   └── integration/
│   │       └── page.tsx       # API integrations
│   └── help/
│       ├── page.tsx           # Help center
│       ├── tutorials/
│       │   └── page.tsx       # Tutorial videos
│       └── support/
│           └── page.tsx       # Contact support
├── patient/                    # Patient Portal
│   ├── layout.tsx             # Patient layout
│   ├── loading.tsx            # Patient loading UI
│   ├── error.tsx              # Patient error boundary
│   ├── not-found.tsx          # Patient 404 page
│   ├── page.tsx               # Patient dashboard
│   ├── onboarding/
│   │   ├── page.tsx           # Onboarding start
│   │   ├── welcome/
│   │   │   └── page.tsx       # Welcome screen
│   │   ├── consent/
│   │   │   └── page.tsx       # Consent form
│   │   ├── profile/
│   │   │   └── page.tsx       # Profile setup
│   │   ├── security/
│   │   │   └── page.tsx       # 2FA setup
│   │   └── complete/
│   │       └── page.tsx       # Onboarding complete
│   ├── questionnaires/
│   │   ├── page.tsx           # Available questionnaires
│   │   ├── [id]/
│   │   │   ├── page.tsx       # Questionnaire intro
│   │   │   ├── questions/
│   │   │   │   ├── [step]/
│   │   │   │   │   └── page.tsx # Question steps
│   │   │   │   └── page.tsx   # Questions overview
│   │   │   ├── review/
│   │   │   │   └── page.tsx   # Review answers
│   │   │   ├── submit/
│   │   │   │   └── page.tsx   # Submit confirmation
│   │   │   └── complete/
│   │   │       └── page.tsx   # Completion confirmation
│   │   └── history/
│   │       ├── page.tsx       # Completed questionnaires
│   │       └── [id]/
│   │           └── page.tsx   # View submitted response
│   ├── media/
│   │   ├── page.tsx           # Media library
│   │   ├── upload/
│   │   │   └── page.tsx       # Upload files
│   │   └── [mediaId]/
│   │       └── page.tsx       # Media viewer
│   ├── profile/
│   │   ├── page.tsx           # Profile overview
│   │   ├── edit/
│   │   │   └── page.tsx       # Edit profile
│   │   ├── security/
│   │   │   ├── page.tsx       # Security settings
│   │   │   ├── password/
│   │   │   │   └── page.tsx   # Change password
│   │   │   └── mfa/
│   │   │       └── page.tsx   # MFA settings
│   │   └── preferences/
│   │       └── page.tsx       # Notification preferences
│   ├── progress/
│   │   ├── page.tsx           # Progress overview
│   │   └── timeline/
│   │       └── page.tsx       # Activity timeline
│   └── help/
│       ├── page.tsx           # Help center
│       ├── faq/
│       │   └── page.tsx       # FAQ
│       └── contact/
│           └── page.tsx       # Contact support
├── api/                       # API Routes
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts       # Login endpoint
│   │   ├── logout/
│   │   │   └── route.ts       # Logout endpoint
│   │   └── refresh/
│   │       └── route.ts       # Token refresh
│   ├── admin/
│   │   ├── questionnaires/
│   │   │   ├── route.ts       # CRUD operations
│   │   │   └── [id]/
│   │   │       └── route.ts   # Individual questionnaire
│   │   ├── patients/
│   │   │   ├── route.ts       # Patient management
│   │   │   └── [id]/
│   │   │       └── route.ts   # Individual patient
│   │   └── analytics/
│   │       └── route.ts       # Analytics data
│   ├── patient/
│   │   ├── questionnaires/
│   │   │   ├── route.ts       # Patient questionnaires
│   │   │   └── [id]/
│   │   │       ├── route.ts   # Questionnaire data
│   │   │       └── responses/
│   │   │           └── route.ts # Submit responses
│   │   ├── media/
│   │   │   ├── route.ts       # Media operations
│   │   │   └── upload/
│   │   │       └── route.ts   # File upload
│   │   └── profile/
│   │       └── route.ts       # Profile management
│   └── webhooks/
│       ├── cognito/
│       │   └── route.ts       # Cognito webhooks
│       └── notifications/
│           └── route.ts       # Push notifications
├── (public)/                  # Public pages
│   ├── layout.tsx            # Public layout
│   ├── page.tsx              # Landing page
│   ├── about/
│   │   └── page.tsx          # About page
│   ├── privacy/
│   │   └── page.tsx          # Privacy policy
│   ├── terms/
│   │   └── page.tsx          # Terms of service
│   └── contact/
│       └── page.tsx          # Contact page
├── globals.css               # Global styles
├── layout.tsx                # Root layout
├── loading.tsx               # Root loading UI
├── error.tsx                 # Root error boundary
├── not-found.tsx             # Root 404 page
└── manifest.ts               # PWA manifest
```

## Authentication and Authorization

### Route Protection Strategy

```typescript
// lib/auth/routeProtection.ts
export interface RouteProtection {
  requireAuth: boolean;
  allowedRoles: UserRole[];
  redirectTo?: string;
  requireMFA?: boolean;
  requireOnboarding?: boolean;
}

export const routeConfig: Record<string, RouteProtection> = {
  // Public routes
  '/': { requireAuth: false, allowedRoles: [] },
  '/about': { requireAuth: false, allowedRoles: [] },
  '/privacy': { requireAuth: false, allowedRoles: [] },
  '/terms': { requireAuth: false, allowedRoles: [] },
  
  // Auth routes
  '/login': { requireAuth: false, allowedRoles: [] },
  '/register': { requireAuth: false, allowedRoles: [] },
  '/forgot-password': { requireAuth: false, allowedRoles: [] },
  
  // Admin routes
  '/admin': { 
    requireAuth: true, 
    allowedRoles: ['physician', 'admin'], 
    redirectTo: '/login',
    requireMFA: true 
  },
  '/admin/*': { 
    requireAuth: true, 
    allowedRoles: ['physician', 'admin'], 
    redirectTo: '/login',
    requireMFA: true 
  },
  
  // Patient routes
  '/patient': { 
    requireAuth: true, 
    allowedRoles: ['patient'], 
    redirectTo: '/login',
    requireOnboarding: true 
  },
  '/patient/*': { 
    requireAuth: true, 
    allowedRoles: ['patient'], 
    redirectTo: '/login',
    requireOnboarding: true 
  },
  
  // Onboarding exception
  '/patient/onboarding/*': { 
    requireAuth: true, 
    allowedRoles: ['patient'], 
    redirectTo: '/login',
    requireOnboarding: false 
  },
};
```

### Middleware Implementation

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routeConfig } from '@/lib/auth/routeProtection';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get route configuration
  const exactMatch = routeConfig[pathname];
  const wildcardMatch = Object.keys(routeConfig).find(route => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2);
      return pathname.startsWith(basePath);
    }
    return false;
  });
  
  const config = exactMatch || (wildcardMatch ? routeConfig[wildcardMatch] : null);
  
  if (!config) {
    return NextResponse.next();
  }
  
  // Check authentication
  if (config.requireAuth) {
    const token = await getToken({ req: request });
    
    if (!token) {
      const redirectUrl = new URL(config.redirectTo || '/login', request.url);
      redirectUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check user role
    if (config.allowedRoles.length > 0 && !config.allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // Check MFA requirement
    if (config.requireMFA && !token.mfaVerified) {
      return NextResponse.redirect(new URL('/setup-mfa', request.url));
    }
    
    // Check onboarding requirement for patients
    if (config.requireOnboarding && token.role === 'patient' && !token.onboardingComplete) {
      return NextResponse.redirect(new URL('/patient/onboarding', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## URL Structure and SEO

### URL Patterns

#### Physician Admin Portal
```
/admin                          # Dashboard
/admin/dashboard               # Detailed dashboard
/admin/questionnaires          # Questionnaire list
/admin/questionnaires/new      # Create questionnaire
/admin/questionnaires/123      # View questionnaire
/admin/questionnaires/123/edit # Edit questionnaire
/admin/patients               # Patient roster
/admin/patients/456           # Patient profile
/admin/analytics              # Analytics overview
/admin/settings               # Settings
```

#### Patient Portal
```
/patient                      # Patient dashboard
/patient/questionnaires       # Available questionnaires
/patient/questionnaires/123   # Questionnaire intro
/patient/questionnaires/123/questions/1  # Question step 1
/patient/questionnaires/123/review       # Review answers
/patient/profile              # Profile management
/patient/media                # Media library
```

### SEO Configuration

```typescript
// lib/seo/metadata.ts
export const generateMetadata = (
  title: string,
  description: string,
  path: string,
  isPrivate: boolean = true
): Metadata => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clinicaltrial.example.com';
  
  return {
    title: `${title} | Clinical Trial Platform`,
    description,
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
    robots: isPrivate ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      title: `${title} | Clinical Trial Platform`,
      description,
      url: `${baseUrl}${path}`,
      siteName: 'Clinical Trial Platform',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${title} | Clinical Trial Platform`,
      description,
    },
  };
};

// Usage in pages
export const metadata = generateMetadata(
  'Dashboard',
  'Physician dashboard for managing clinical trial questionnaires and patients',
  '/admin/dashboard',
  true // Private page
);
```

## Deep Linking Strategy

### Questionnaire Deep Links

```typescript
// lib/routing/deepLinks.ts
export interface QuestionnaireDeepLink {
  questionnaireId: string;
  step?: number;
  section?: string;
  autoStart?: boolean;
}

export const generateQuestionnaireLink = ({
  questionnaireId,
  step,
  section,
  autoStart = false
}: QuestionnaireDeepLink): string => {
  const baseUrl = `/patient/questionnaires/${questionnaireId}`;
  const params = new URLSearchParams();
  
  if (step) params.set('step', step.toString());
  if (section) params.set('section', section);
  if (autoStart) params.set('autoStart', 'true');
  
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
};

export const parseQuestionnaireLink = (url: string) => {
  const urlObj = new URL(url, 'http://localhost');
  const pathParts = urlObj.pathname.split('/');
  const questionnaireId = pathParts[pathParts.length - 1];
  
  return {
    questionnaireId,
    step: urlObj.searchParams.get('step') ? parseInt(urlObj.searchParams.get('step')!) : undefined,
    section: urlObj.searchParams.get('section') || undefined,
    autoStart: urlObj.searchParams.get('autoStart') === 'true',
  };
};
```

### Patient Invitation Links

```typescript
// lib/routing/invitationLinks.ts
export interface InvitationLink {
  token: string;
  patientId: string;
  questionnaireId?: string;
  expiresAt: Date;
}

export const generateInvitationLink = (invitation: InvitationLink): string => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    token: invitation.token,
    patient: invitation.patientId,
  });
  
  if (invitation.questionnaireId) {
    params.set('questionnaire', invitation.questionnaireId);
  }
  
  return `${baseUrl}/register?${params.toString()}`;
};

export const validateInvitationLink = async (
  token: string,
  patientId: string
): Promise<InvitationLink | null> => {
  try {
    const response = await fetch('/api/auth/validate-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, patientId }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Failed to validate invitation link:', error);
    return null;
  }
};
```

## Navigation Components

### Admin Navigation

```typescript
// components/admin/navigation/AdminNavigation.tsx
export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number;
  children?: NavigationItem[];
  permission?: string;
}

export const adminNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: HomeIcon,
  },
  {
    label: 'Questionnaires',
    href: '/admin/questionnaires',
    icon: DocumentTextIcon,
    children: [
      { label: 'All Questionnaires', href: '/admin/questionnaires', icon: ListBulletIcon },
      { label: 'Create New', href: '/admin/questionnaires/new', icon: PlusIcon },
      { label: 'Templates', href: '/admin/questionnaires/templates', icon: BookmarkIcon },
    ],
  },
  {
    label: 'Patients',
    href: '/admin/patients',
    icon: UsersIcon,
    children: [
      { label: 'Patient Roster', href: '/admin/patients', icon: ListBulletIcon },
      { label: 'Invite Patients', href: '/admin/patients/invite', icon: UserPlusIcon },
      { label: 'Patient Groups', href: '/admin/patients/groups', icon: UserGroupIcon },
    ],
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    children: [
      { label: 'Overview', href: '/admin/analytics', icon: ChartBarIcon },
      { label: 'Engagement', href: '/admin/analytics/engagement', icon: HeartIcon },
      { label: 'Completion', href: '/admin/analytics/completion', icon: CheckCircleIcon },
      { label: 'Export Data', href: '/admin/analytics/export', icon: ArrowDownTrayIcon },
    ],
  },
  {
    label: 'Media',
    href: '/admin/media',
    icon: PhotoIcon,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    children: [
      { label: 'General', href: '/admin/settings', icon: CogIcon },
      { label: 'Profile', href: '/admin/settings/profile', icon: UserIcon },
      { label: 'Security', href: '/admin/settings/security', icon: ShieldCheckIcon },
      { label: 'Notifications', href: '/admin/settings/notifications', icon: BellIcon },
    ],
  },
];
```

### Patient Navigation

```typescript
// components/patient/navigation/PatientNavigation.tsx
export const patientNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/patient',
    icon: HomeIcon,
  },
  {
    label: 'Questionnaires',
    href: '/patient/questionnaires',
    icon: DocumentTextIcon,
    badge: 3, // Number of pending questionnaires
    children: [
      { label: 'Available', href: '/patient/questionnaires', icon: InboxIcon },
      { label: 'Completed', href: '/patient/questionnaires/history', icon: CheckCircleIcon },
    ],
  },
  {
    label: 'Media',
    href: '/patient/media',
    icon: PhotoIcon,
  },
  {
    label: 'Progress',
    href: '/patient/progress',
    icon: ChartBarIcon,
  },
  {
    label: 'Profile',
    href: '/patient/profile',
    icon: UserIcon,
    children: [
      { label: 'Overview', href: '/patient/profile', icon: UserIcon },
      { label: 'Security', href: '/patient/profile/security', icon: ShieldCheckIcon },
      { label: 'Preferences', href: '/patient/profile/preferences', icon: CogIcon },
    ],
  },
];
```

## Progressive Navigation

### Breadcrumb Implementation

```typescript
// components/shared/navigation/Breadcrumb.tsx
export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export const generateBreadcrumbs = (pathname: string, params: Record<string, string> = {}): BreadcrumbItem[] => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Build breadcrumbs based on path segments
  let currentPath = '';
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Handle dynamic routes
    const displaySegment = params[segment] || segment;
    
    breadcrumbs.push({
      label: formatBreadcrumbLabel(displaySegment),
      href: isLast ? undefined : currentPath,
      current: isLast,
    });
  });
  
  return breadcrumbs;
};

const formatBreadcrumbLabel = (segment: string): string => {
  // Convert URL segments to readable labels
  const labelMap: Record<string, string> = {
    'admin': 'Admin',
    'patient': 'Dashboard',
    'questionnaires': 'Questionnaires',
    'patients': 'Patients',
    'analytics': 'Analytics',
    'media': 'Media',
    'settings': 'Settings',
    'profile': 'Profile',
    'onboarding': 'Getting Started',
    'new': 'Create New',
    'edit': 'Edit',
    'responses': 'Responses',
    'history': 'History',
  };
  
  return labelMap[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
```

### Tab Navigation

```typescript
// components/shared/navigation/TabNavigation.tsx
export interface Tab {
  id: string;
  label: string;
  href: string;
  count?: number;
  icon?: React.ComponentType;
}

export const QuestionnaireDetailTabs: Tab[] = [
  { id: 'overview', label: 'Overview', href: '/admin/questionnaires/[id]' },
  { id: 'questions', label: 'Questions', href: '/admin/questionnaires/[id]/edit' },
  { id: 'responses', label: 'Responses', href: '/admin/questionnaires/[id]/responses', count: 42 },
  { id: 'analytics', label: 'Analytics', href: '/admin/questionnaires/[id]/analytics' },
  { id: 'settings', label: 'Settings', href: '/admin/questionnaires/[id]/settings' },
];

export const PatientProfileTabs: Tab[] = [
  { id: 'overview', label: 'Overview', href: '/admin/patients/[id]' },
  { id: 'questionnaires', label: 'Questionnaires', href: '/admin/patients/[id]/questionnaires' },
  { id: 'media', label: 'Media', href: '/admin/patients/[id]/media' },
  { id: 'history', label: 'Activity', href: '/admin/patients/[id]/history' },
  { id: 'notes', label: 'Notes', href: '/admin/patients/[id]/notes' },
];
```

## Error Handling and Fallbacks

### Custom Error Pages

```typescript
// app/admin/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/shared/ui/Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to monitoring service
    console.error('Admin portal error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-gray-600">
          We're sorry, but something went wrong while loading the admin portal.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            Try again
          </Button>
          <Button 
            href="/admin" 
            variant="secondary"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Not Found Pages

```typescript
// app/admin/not-found.tsx
import { Button } from '@/components/shared/ui/Button';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-gray-600">
          The page you're looking for doesn't exist in the admin portal.
        </p>
        <div className="mt-6">
          <Button href="/admin" variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Performance Optimization

### Route Prefetching

```typescript
// components/shared/navigation/PrefetchLink.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
  priority?: boolean;
}

export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  href,
  children,
  prefetch = true,
  priority = false,
}) => {
  const router = useRouter();
  
  useEffect(() => {
    if (prefetch && priority) {
      // Prefetch high-priority routes immediately
      router.prefetch(href);
    }
  }, [href, prefetch, priority, router]);
  
  return (
    <Link 
      href={href} 
      prefetch={prefetch}
      onMouseEnter={() => {
        if (prefetch && !priority) {
          // Prefetch on hover for non-priority routes
          router.prefetch(href);
        }
      }}
    >
      {children}
    </Link>
  );
};
```

### Code Splitting Strategy

```typescript
// lib/routing/codeSplitting.ts
import dynamic from 'next/dynamic';

// Lazy load heavy components
export const QuestionnaireBuilder = dynamic(
  () => import('@/components/admin/questionnaire-builder/QuestionnaireBuilder'),
  { 
    loading: () => <QuestionnaireBuilderSkeleton />,
    ssr: false // Client-side only for complex drag-and-drop
  }
);

export const ChartComponent = dynamic(
  () => import('@/components/admin/analytics/ChartComponent'),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false // Charts are client-side only
  }
);

export const MediaUploader = dynamic(
  () => import('@/components/patient/media/MediaUploader'),
  { 
    loading: () => <MediaUploaderSkeleton />
  }
);
```

## Mobile Navigation

### Responsive Navigation Pattern

```typescript
// components/shared/navigation/ResponsiveNavigation.tsx
'use client';

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export const ResponsiveNavigation: React.FC<{
  navigation: NavigationItem[];
  currentPath: string;
}> = ({ navigation, currentPath }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <button
          type="button"
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open main menu</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      
      {/* Desktop navigation */}
      <nav className="hidden md:block">
        <NavigationMenu items={navigation} currentPath={currentPath} />
      </nav>
      
      {/* Mobile navigation */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navigation={navigation}
        currentPath={currentPath}
      />
    </>
  );
};
```

## PWA Navigation Features

### App Shell Navigation

```typescript
// components/shared/layout/AppShell.tsx
export const AppShell: React.FC<{ 
  children: React.ReactNode;
  userType: 'admin' | 'patient';
}> = ({ children, userType }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <AppHeader userType={userType} />
      
      {/* Main content area */}
      <main className="pb-16 md:pb-0">
        {children}
      </main>
      
      {/* Bottom navigation for mobile */}
      <BottomNavigation userType={userType} />
    </div>
  );
};
```

### Bottom Navigation for Mobile

```typescript
// components/shared/navigation/BottomNavigation.tsx
export const BottomNavigation: React.FC<{
  userType: 'admin' | 'patient';
}> = ({ userType }) => {
  const navigation = userType === 'admin' ? adminBottomNav : patientBottomNav;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {navigation.map((item) => (
          <BottomNavItem key={item.href} item={item} />
        ))}
      </div>
    </nav>
  );
};

const adminBottomNav = [
  { label: 'Dashboard', href: '/admin', icon: HomeIcon },
  { label: 'Questionnaires', href: '/admin/questionnaires', icon: DocumentTextIcon },
  { label: 'Patients', href: '/admin/patients', icon: UsersIcon },
  { label: 'Settings', href: '/admin/settings', icon: CogIcon },
];

const patientBottomNav = [
  { label: 'Home', href: '/patient', icon: HomeIcon },
  { label: 'Questionnaires', href: '/patient/questionnaires', icon: DocumentTextIcon },
  { label: 'Media', href: '/patient/media', icon: PhotoIcon },
  { label: 'Profile', href: '/patient/profile', icon: UserIcon },
];
```

This comprehensive routing strategy provides a solid foundation for the dual-portal clinical trial platform, ensuring secure navigation, optimal performance, and excellent user experience across both physician admin and patient portals.