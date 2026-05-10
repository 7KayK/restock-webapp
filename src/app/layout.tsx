import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Restock — Smart Purchase Tracking',
  description:
    'Track purchases, predict when you run out, and find the best deals near you.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#F8FAFC] text-foreground">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
