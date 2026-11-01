import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import { AssessmentProvider } from '@/components/providers/AssessmentProvider'
import './globals.css'

// Fonts are bundled with the app (src/app/fonts, SIL Open Font Licence) instead of
// downloaded from Google during the build: Google's font download failed
// intermittently on Vercel and broke deployments.
const geistSans = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
})

const playfairDisplay = localFont({
  src: './fonts/fraunces-latin-wght-normal.woff2',
  variable: '--font-playfair',
  weight: '100 900',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Restock — Smart Purchase Tracking',
  description:
    'Track purchases, predict when you run out, and find the best deals near you.',
  icons: {
    icon: '/logo.png',
    apple: '/icons/apple-touch-icon.png',
  },
  applicationName: 'Restock',
  appleWebApp: {
    capable: true,
    title: 'Restock',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

// viewportFit 'cover' lets the installed app draw under the phone's notch /
// gesture bar; the dashboard shell then pads with env(safe-area-inset-*).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#132B22',
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
        className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#F7F2E7] text-foreground">
          <AssessmentProvider>
            {children}
          </AssessmentProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
