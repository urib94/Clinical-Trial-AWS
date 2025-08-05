import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { SkipLink } from '@/components/accessibility/SkipLink';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Clinical Trial Platform',
    default: 'Clinical Trial Platform - Secure Patient Data Collection',
  },
  description: 'Secure, HIPAA-compliant platform for clinical trial patient data collection with comprehensive accessibility features and offline support.',
  
  // PWA Metadata
  manifest: '/manifest.json',
  
  // Theme and appearance
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#3b82f6' },
  ],
  
  // Apple PWA support
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Clinical Trial',
    startupImage: [
      {
        url: '/icons/apple-launch-640x1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-launch-750x1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/apple-launch-1242x2208.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/apple-launch-1125x2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  
  // SEO and social
  keywords: ['clinical trial', 'patient data', 'healthcare', 'medical research', 'HIPAA', 'accessibility'],
  authors: [{ name: 'Clinical Trial Platform Team' }],
  creator: 'Clinical Trial Platform',
  publisher: 'Clinical Trial Platform',
  
  // Security
  robots: {
    index: false, // Medical data should not be indexed
    follow: false,
    nocache: true,
    nosnippet: true,
    noarchive: true,
  },
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://clinical-trial.com',
    siteName: 'Clinical Trial Platform',
    title: 'Clinical Trial Platform - Secure Patient Data Collection',
    description: 'Secure, HIPAA-compliant platform for clinical trial patient data collection.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Clinical Trial Platform',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Clinical Trial Platform',
    description: 'Secure, HIPAA-compliant patient data collection.',
    images: ['/twitter-image.png'],
  },
  
  // Additional metadata
  category: 'healthcare',
  classification: 'Medical Research Platform',
  
  // Verification and analytics (production only)
  ...(process.env.NODE_ENV === 'production' && {
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#3b82f6' },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* PWA Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Security Headers (additional client-side) */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Accessibility */}
        <meta name="color-scheme" content="light dark" />
        
        {/* Preconnect to external domains */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <link rel="preconnect" href="https://api.clinical-trial.com" />
            <link rel="dns-prefetch" href="https://api.clinical-trial.com" />
          </>
        )}
      </head>
      
      <body 
        className={`
          ${inter.className}
          min-h-screen 
          bg-background 
          font-sans 
          antialiased
          selection:bg-primary/20
          selection:text-foreground
        `}
      >
        {/* Skip to main content link for keyboard navigation */}
        <SkipLink />
        
        {/* Global providers for state management */}
        <Providers>
          {/* Announcement for screen readers */}
          <div 
            id="announcements" 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            className="sr-only"
          />
          
          {/* Main application content */}
          <div id="app-root" className="min-h-screen">
            {children}
          </div>
          
          {/* Overlay containers for modals, toasts, etc. */}
          <div id="modal-root" />
          <div id="toast-root" />
          <div id="tooltip-root" />
        </Providers>
        
        {/* Service Worker Registration */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
        )}
        
        {/* Accessibility: Announce page changes to screen readers */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Announce route changes for single-page app accessibility
              (function() {
                let lastPathname = location.pathname;
                const announcements = document.getElementById('announcements');
                
                function announcePageChange() {
                  if (location.pathname !== lastPathname) {
                    lastPathname = location.pathname;
                    
                    // Get page title or create descriptive text
                    const title = document.title.split(' | ')[0] || 'Page';
                    announcements.textContent = \`Navigated to \${title}\`;
                    
                    // Focus management for accessibility
                    const main = document.querySelector('main');
                    if (main) {
                      main.focus();
                    }
                  }
                }
                
                // Monitor for route changes
                let observer = new MutationObserver(announcePageChange);
                observer.observe(document.querySelector('title'), {
                  childList: true,
                  subtree: true
                });
                
                // Also check on popstate for browser navigation
                window.addEventListener('popstate', announcePageChange);
              })();
            `,
          }}
        />
        
        {/* Detect zoom level for accessibility */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function updateZoomLevel() {
                  const zoomLevel = Math.round(window.devicePixelRatio * 100);
                  document.documentElement.style.setProperty('--zoom-level', zoomLevel);
                  
                  // Adjust font scale for high zoom levels
                  if (zoomLevel >= 200) {
                    document.documentElement.style.setProperty('--font-scale', '1.2');
                  } else if (zoomLevel >= 150) {
                    document.documentElement.style.setProperty('--font-scale', '1.1');
                  } else {
                    document.documentElement.style.setProperty('--font-scale', '1');
                  }
                }
                
                // Update on resize (zoom changes)
                window.addEventListener('resize', updateZoomLevel);
                updateZoomLevel();
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}