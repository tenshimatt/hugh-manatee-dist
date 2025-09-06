import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { ChatWidget } from '@/components/chat/chat-widget'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Navigation } from '@/components/layout/navigation'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'RAWGLE - Raw Pet Food Community',
  description: 'The ultimate platform for raw pet food enthusiasts. Track feeding, find suppliers, connect with community.',
  keywords: 'raw dog food, pet nutrition, raw feeding, BARF diet, pet health, dog supplements',
  authors: [{ name: 'RAWGLE Team' }],
  creator: 'RAWGLE',
  publisher: 'RAWGLE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rawgle.com'),
  openGraph: {
    title: 'RAWGLE - Raw Pet Food Community',
    description: 'The ultimate platform for raw pet food enthusiasts',
    url: 'https://rawgle.com',
    siteName: 'RAWGLE',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAWGLE - Raw Pet Food Community',
    description: 'The ultimate platform for raw pet food enthusiasts',
    images: ['/twitter-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Temporarily disable Clerk until valid keys are configured
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isClerkEnabled = clerkPublishableKey && !clerkPublishableKey.includes('placeholder') && !clerkPublishableKey.includes('your_actual')

  const AppContent = () => (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navigation />
            {children}
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                },
              }}
            />
            <ChatWidget />
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body 
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          margin: 0,
          padding: 0
        }}
      >
        {isClerkEnabled ? (
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            signInUrl="/auth/sign-in"
            signUpUrl="/auth/sign-up"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          >
            <AppContent />
          </ClerkProvider>
        ) : (
          <AppContent />
        )}
      </body>
    </html>
  )
}
