'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MarketingNav } from '@/components/shared/MarketingNav'
import { MarketingFooter } from '@/components/shared/MarketingFooter'

const PLAYFAIR: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
}

function OrganicTexture() {
  const s = 'rgba(15,123,108,0.10)'
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M-200,200 C100,0 400,500 700,200 C900,0 1200,350 1600,100" fill="none" stroke={s} strokeWidth="4" />
      <path d="M-100,450 C300,250 600,650 1000,380 C1200,220 1450,550 1700,350" fill="none" stroke={s} strokeWidth="3" />
      <path d="M0,720 C250,580 550,820 850,680 C1100,560 1350,780 1650,640" fill="none" stroke={s} strokeWidth="3" />
      <path d="M300,-80 C500,180 750,20 950,280 C1100,470 1250,100 1500,300" fill="none" stroke={s} strokeWidth="2" />
      <path d="M100,50 C300,200 500,0 700,180 C850,310 1000,80 1200,200 C1400,310 1550,100 1700,250" fill="none" stroke={s} strokeWidth="5" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF8' }}>
      <OrganicTexture />

      <div className="relative z-10 flex flex-col min-h-screen">
        <MarketingNav />

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <motion.div
            className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            {/* Headline */}
            <h1
              className="text-[#1B3A5C] leading-[1.15] tracking-tight"
              style={{ ...PLAYFAIR, fontSize: 'clamp(34px, 5vw, 56px)' }}
            >
              Never run out of anything again
            </h1>

            {/* Subtitle */}
            <p className="text-[17px] text-[#4A5568] leading-relaxed max-w-lg">
              AI-powered restocking intelligence that tracks what you buy, learns how fast
              you use it, and reminds you before you run out.
            </p>

            {/* Auth buttons */}
            <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-xs">
              <Link
                href="/sign-in"
                className="flex items-center justify-center gap-2.5 w-full px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-[#1B3A5C] hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <GoogleIcon />
                Continue with Google
              </Link>

              <span className="text-sm text-[#9CA3AF]">or</span>

              <Link
                href="/sign-up"
                className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[#1B3A5C] text-white rounded-full text-sm font-medium hover:bg-[#0F7B6C] transition-colors"
              >
                Sign up with email
              </Link>
            </div>

          </motion.div>
        </main>

        <MarketingFooter />
      </div>
    </div>
  )
}
