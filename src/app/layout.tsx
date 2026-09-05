import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Fraunces } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const playfairDisplay = Fraunces({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Restock — Smart Purchase Tracking',
  description:
    'Track purchases, predict when you run out, and find the best deals near you.',
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
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
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#F7F2E7] text-foreground">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
