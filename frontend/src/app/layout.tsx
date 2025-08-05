import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Clinical Trial Platform',
    template: '%s | Clinical Trial Platform'
  },
  description: 'Secure HIPAA-compliant platform for clinical trial data collection and management',
  keywords: ['clinical trial', 'healthcare', 'medical research', 'data collection', 'HIPAA'],
  authors: [{ name: 'Clinical Trial Platform Team' }],
  creator: 'Clinical Trial Platform',
  publisher: 'Clinical Trial Platform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'Clinical Trial Platform',
    description: 'Secure HIPAA-compliant platform for clinical trial data collection and management',
    siteName: 'Clinical Trial Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clinical Trial Platform',
    description: 'Secure HIPAA-compliant platform for clinical trial data collection and management',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Clinical Trial Platform" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <div className="min-h-full">
          {/* Skip to main content link for accessibility */}
          <a 
            href="#main-content" 
            className="skip-link bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Skip to main content
          </a>
          
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
}