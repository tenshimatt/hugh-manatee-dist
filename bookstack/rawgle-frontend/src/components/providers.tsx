'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { SessionProvider } from 'next-auth/react'  // Temporarily disabled
import { WalletProvider } from '@/components/wallet/wallet-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    // <SessionProvider>  {/* Temporarily disabled */}
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            {children}
          </WalletProvider>
        </ThemeProvider>
      </QueryClientProvider>
    // </SessionProvider>
  )
}