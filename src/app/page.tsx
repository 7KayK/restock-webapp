'use client'

import { motion } from 'framer-motion'
import { Camera, Brain, Bell } from 'lucide-react'
import { SignIn } from '@clerk/nextjs'
import { MarketingNav } from '@/components/shared/MarketingNav'
import { MarketingFooter } from '@/components/shared/MarketingFooter'
import { TelegramIcon, WhatsAppIcon } from '@/components/shared/ChannelIcons'

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

const FEATURES = [
  {
    icon: <Camera className="h-4 w-4 text-white" />,
    label: 'Snap a receipt',
    desc: 'Photo, screenshot, or handwritten note — Restock reads it and logs everything automatically.',
  },
  {
    icon: <Brain className="h-4 w-4 text-white" />,
    label: 'Predict depletion',
    desc: "Restock learns your consumption patterns and knows when you'll run out before you do.",
  },
  {
    icon: <Bell className="h-4 w-4 text-white" />,
    label: 'Never run out',
    desc: 'Reminders arrive before you need them. Deals and your nearest store always nearby.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF8' }}>
      <OrganicTexture />

      <div className="relative z-10 flex flex-col min-h-screen">
        <MarketingNav />

        <main className="flex-1 flex items-center">
          <div className="w-full max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* ── Left: Product Pitch ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col gap-5">
                <h1
                  className="text-[#1B3A5C] leading-[1.15] tracking-tight"
                  style={{ ...PLAYFAIR, fontSize: 'clamp(30px, 4vw, 46px)' }}
                >
                  Never run out of anything again
                </h1>
                <p className="text-[17px] text-[#4A5568] leading-relaxed max-w-md">
                  AI-powered restocking intelligence that tracks what you buy, learns how fast you
                  use it, and reminds you before you run out.
                </p>
              </div>

              {/* Feature rows */}
              <div className="flex flex-col gap-4">
                {FEATURES.map(({ icon, label, desc }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.18 + i * 0.09 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0F7B6C] flex items-center justify-center shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div>
                      <span className="font-semibold text-[#1B3A5C] text-sm">{label}</span>
                      <span className="text-[#4A5568] text-sm"> — {desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Channel line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex flex-wrap items-center gap-5 pt-1"
              >
                <a
                  href="https://t.me/restockchatbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-[#0088cc] hover:text-[#006faa] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0088cc] flex items-center justify-center text-white shrink-0">
                    <TelegramIcon size={13} />
                  </div>
                  Telegram
                </a>

                <div className="flex items-center gap-2 text-sm text-[#C8CACF] cursor-not-allowed select-none">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[#C8CACF] shrink-0">
                    <WhatsAppIcon size={13} />
                  </div>
                  WhatsApp (coming soon)
                </div>

                <span className="text-sm text-[#9CA3AF]">Web</span>
              </motion.div>
            </motion.div>

            {/* ── Right: Auth Card ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col gap-5">
                <div>
                  <h2 className="text-[#1B3A5C] text-xl font-semibold" style={PLAYFAIR}>
                    Start your restock journey
                  </h2>
                  <p className="text-sm text-[#4A5568] mt-1.5">Sign in to begin.</p>
                </div>

                <SignIn
                  routing="hash"
                  fallbackRedirectUrl="/dashboard"
                  appearance={{
                    variables: {
                      colorPrimary: '#0F7B6C',
                      borderRadius: '0.5rem',
                    },
                    elements: {
                      rootBox: 'w-full',
                      card: '!shadow-none !border-0 !p-0 !bg-transparent !w-full',
                      header: '!hidden',
                      formButtonPrimary: '!bg-[#0F7B6C] hover:!bg-[#0A6459] !text-white',
                    },
                  }}
                />
              </div>
            </motion.div>
          </div>
        </main>

        <MarketingFooter />
      </div>
    </div>
  )
}
