'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Brain, Bell } from 'lucide-react'
import { WaitlistModal } from '@/components/shared/WaitlistModal'

// Playfair Display via CSS variable set in layout.tsx
const PLAYFAIR: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
}

// ─── Icon components ──────────────────────────────────────────────────────────

function WhatsAppIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function TelegramIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

// ─── Organic background texture ───────────────────────────────────────────────

function OrganicTexture() {
  const s = 'rgba(15,123,108,0.12)'
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
      <path d="M-150,320 C200,420 500,180 800,350 C1050,480 1350,280 1700,420" fill="none" stroke={s} strokeWidth="4" />
      <path d="M800,-100 C950,200 1150,50 1300,350 C1400,550 1250,750 1100,550 C950,350 1050,150 800,-100" fill="none" stroke={s} strokeWidth="3" />
      <path d="M-100,600 C150,720 400,580 700,700 C950,800 1200,620 1500,750" fill="none" stroke={s} strokeWidth="2" />
      <path d="M400,100 C550,300 800,100 1000,350 C1150,520 1300,300 1500,450" fill="none" stroke={s} strokeWidth="2" />
      <path d="M100,50 C300,200 500,0 700,180 C850,310 1000,80 1200,200 C1400,310 1550,100 1700,250" fill="none" stroke={s} strokeWidth="5" />
    </svg>
  )
}

// ─── Scroll fade-up wrapper ───────────────────────────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then((r) => r.json())
      .then((data: unknown) => {
        const json = data as Record<string, unknown>
        if (typeof json.count === 'number') setWaitlistCount(json.count)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200" style={{ isolation: 'isolate' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.jpg"
              alt="Restock"
              width={36}
              height={36}
              className="object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors"
            >
              How it works
            </a>
            <Link
              href="/sign-in"
              className="text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors"
            >
              Sign In
            </Link>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="text-[#6B7280] hover:text-[#25D366] transition-colors"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon size={18} />
              </a>
              <a
                href="#"
                className="text-[#6B7280] hover:text-[#229ED9] transition-colors"
                aria-label="Telegram"
              >
                <TelegramIcon size={18} />
              </a>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#0F7B6C] hover:bg-[#0A6459] text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              Get Started
            </button>
          </nav>

          {/* Mobile CTA only */}
          <div className="md:hidden flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-[#0F7B6C] hover:text-[#0A6459] transition-colors"
            >
              Sign In
            </Link>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#0F7B6C] hover:bg-[#0A6459] text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main style={{ background: '#FAFAF8' }}>

        {/* ── Hero ── */}
        <section className="pt-24 pb-20 px-6 text-center">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">

            {/* Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="w-12 h-12 rounded-xl bg-[#0F7B6C] flex items-center justify-center overflow-hidden"
            >
              <Image
                src="/logo.jpg"
                alt="Restock"
                width={36}
                height={36}
                className="object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-[#1B3A5C] leading-[1.2] tracking-tight"
              style={{ ...PLAYFAIR, fontSize: 'clamp(36px, 5vw, 52px)' }}
            >
              Never run out of anything again
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="text-[18px] text-[#4A5568] leading-relaxed max-w-[560px]"
            >
              Restock tracks what you buy, predicts when you&apos;ll run out, and reminds you before it
              happens.
            </motion.p>

            {/* Live waitlist counter */}
            {waitlistCount !== null && waitlistCount > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-sm text-[#0F7B6C] font-medium"
              >
                {waitlistCount.toLocaleString()} {waitlistCount === 1 ? 'person' : 'people'} on the waitlist
              </motion.p>
            )}

            {/* Feature bullets */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="flex flex-col gap-5 w-full max-w-md text-left"
            >
              {[
                {
                  icon: (
                    <Image
                      src="/logo.jpg"
                      alt="Restock"
                      width={36}
                      height={36}
                      className="object-contain"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  ),
                  label: 'Track purchases',
                  desc: 'Log by message, photo, or voice. No forms, no apps, no friction.',
                },
                {
                  icon: <Brain className="h-4 w-4 text-white" />,
                  label: 'Predict depletion',
                  desc: 'Restock learns your consumption patterns and knows before you do.',
                },
                {
                  icon: <Bell className="h-4 w-4 text-white" />,
                  label: 'Never run out',
                  desc: 'Reminders arrive before you need them. Deals and stores always nearby.',
                },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0F7B6C] flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                    {icon}
                  </div>
                  <div>
                    <span className="font-semibold text-[#1B3A5C] text-sm">{label}</span>
                    <span className="text-[#4A5568] text-sm"> — {desc}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Social proof */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.34 }}
              className="text-[15px] text-[#6B7280] italic"
            >
              Tracks purchases across Telegram, WhatsApp, and web — wherever you already are.
            </motion.p>

            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center gap-4 w-full max-w-[400px]"
            >
              <button
                onClick={() => setModalOpen(true)}
                className="w-full bg-[#0F7B6C] hover:bg-[#0A6459] text-white font-semibold text-[17px] py-4 rounded-full text-center transition-colors"
              >
                Start for free
              </button>

              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-px bg-[#E5E7EB]" />
                <span className="text-xs text-[#9CA3AF]">or</span>
                <div className="flex-1 h-px bg-[#E5E7EB]" />
              </div>

              <div className="flex items-center justify-center gap-8">
                <a
                  href="#"
                  className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#25D366] transition-colors"
                >
                  <WhatsAppIcon size={17} />
                  Start on WhatsApp
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#229ED9] transition-colors"
                >
                  <TelegramIcon size={17} />
                  Start on Telegram
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="pt-20 pb-24 px-6">
          <div className="max-w-4xl mx-auto">
            <FadeUp className="text-center mb-16">
              <h2 className="text-[#1B3A5C] leading-tight" style={{ ...PLAYFAIR, fontSize: '36px' }}>
                How it works
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  num: '1',
                  title: 'Log a purchase',
                  desc: 'Send a message, snap a receipt, or type it in. Natural language. No commands needed.',
                },
                {
                  num: '2',
                  title: 'Restock learns your patterns',
                  desc: 'Every purchase teaches Restock how fast you go through things.',
                },
                {
                  num: '3',
                  title: 'Never run out',
                  desc: 'Reminders before you run out. Matched deals and nearest store automatically.',
                },
              ].map(({ num, title, desc }, i) => (
                <FadeUp key={num} delay={i * 0.12}>
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#0F7B6C] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{num}</span>
                    </div>
                    <h3 className="font-semibold text-[#1B3A5C]">{title}</h3>
                    <p className="text-[#4A5568] text-sm leading-relaxed">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Image Intelligence ── */}
        <section className="py-24 px-6" style={{ background: '#F5F3EF' }}>
          <div className="max-w-3xl mx-auto text-center">
            <FadeUp>
              <h2
                className="text-[#1B3A5C] leading-tight mb-4"
                style={{ ...PLAYFAIR, fontSize: '36px' }}
              >
                Just send a photo
              </h2>
              <p className="text-[#4A5568] text-[17px] mb-14 max-w-xl mx-auto">
                Receipt, shopping list, handwritten note — Restock reads it and logs everything
                automatically.
              </p>
            </FadeUp>

            <FadeUp delay={0.1}>
              <svg
                viewBox="0 0 380 180"
                className="mx-auto w-full max-w-sm"
                aria-hidden="true"
              >
                {/* Phone body */}
                <rect x="28" y="18" width="92" height="148" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
                {/* Screen: photo area */}
                <rect x="40" y="40" width="68" height="58" rx="6" fill="#F0FBF9" stroke="#0F7B6C" strokeWidth="0.8" strokeOpacity="0.3" />
                {/* Lens */}
                <circle cx="74" cy="69" r="15" fill="#0F7B6C" fillOpacity="0.10" />
                <circle cx="74" cy="69" r="8" fill="#0F7B6C" fillOpacity="0.22" />
                {/* Faux mountain landscape */}
                <path d="M42,94 L57,73 L70,86 L82,74 L108,94Z" fill="#0F7B6C" fillOpacity="0.10" />
                {/* Home indicator */}
                <rect x="60" y="152" width="28" height="4" rx="2" fill="#E5E7EB" />

                {/* Arrow */}
                <path d="M138,95 L200,95" stroke="#0F7B6C" strokeWidth="1.5" strokeDasharray="4 3" />
                <path d="M193,88 L202,95 L193,102" fill="none" stroke="#0F7B6C" strokeWidth="1.5" strokeLinejoin="round" />

                {/* Receipt card */}
                <rect x="210" y="44" width="148" height="106" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
                <text x="226" y="63" fontSize="8" fill="#9CA3AF" fontFamily="sans-serif" fontWeight="500">LOGGED ITEMS</text>
                {[
                  { y: 78, label: 'Washing powder ×1' },
                  { y: 93, label: 'Cooking oil 3L ×2' },
                  { y: 108, label: 'Rice 5kg ×1' },
                  { y: 123, label: 'Orange juice ×3' },
                  { y: 138, label: 'Bread loaf ×1' },
                ].map(({ y, label }) => (
                  <g key={label}>
                    <circle cx="224" cy={y - 2} r="2.5" fill="#0F7B6C" fillOpacity="0.6" />
                    <text x="232" y={y + 2} fontSize="8.5" fill="#4A5568" fontFamily="sans-serif">
                      {label}
                    </text>
                  </g>
                ))}
              </svg>
            </FadeUp>
          </div>
        </section>

        {/* ── AI Assistant ── */}
        <section className="py-24 px-6">
          <div className="max-w-xl mx-auto">
            <FadeUp className="text-center mb-12">
              <h2
                className="text-[#1B3A5C] leading-tight"
                style={{ ...PLAYFAIR, fontSize: '36px' }}
              >
                Ask anything about your purchases
              </h2>
            </FadeUp>

            <FadeUp delay={0.1} className="flex flex-col gap-4">
              {/* User bubble */}
              <div className="flex justify-end">
                <div
                  className="max-w-[72%] px-5 py-3.5 rounded-2xl rounded-br-sm text-sm text-white text-left leading-relaxed"
                  style={{ background: '#1B3A5C' }}
                >
                  When did I last buy washing powder?
                </div>
              </div>

              {/* Restock bubble */}
              <div className="flex justify-start items-end gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#0F7B6C] flex items-center justify-center shrink-0 overflow-hidden">
                  <Image
                    src="/logo.jpg"
                    alt="Restock"
                    width={36}
                    height={36}
                    className="object-contain"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </div>
                <div
                  className="max-w-[72%] px-5 py-3.5 rounded-2xl rounded-bl-sm text-sm text-[#1B3A5C] text-left leading-relaxed"
                  style={{
                    background: '#F0FBF9',
                    border: '1px solid rgba(15,123,108,0.14)',
                  }}
                >
                  May 8th — you&apos;ll need more in about 12 days.
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── Global Reach ── */}
        <section className="py-20 px-6" style={{ background: '#F5F3EF' }}>
          <div className="max-w-2xl mx-auto text-center">
            <FadeUp>
              <h2 className="font-semibold text-[#1B3A5C] text-xl mb-3">Works everywhere</h2>
              <p className="text-[#6B7280] text-[15px]">
                Canada, Nigeria, Kenya, India, Brazil, and every country Google Maps covers.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section
          className="relative py-28 px-6 overflow-hidden"
          style={{ background: '#0F7B6C' }}
        >
          {/* Teal-on-teal organic texture */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1440 400"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <path
              d="M-100,100 C300,0 700,200 1100,80 C1300,20 1500,160 1700,80"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="2"
            />
            <path
              d="M-50,200 C200,290 500,150 800,260 C1050,340 1300,200 1600,300"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1.5"
            />
            <path
              d="M200,310 C450,240 700,360 1000,270 C1200,210 1400,330 1700,250"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          </svg>

          <div className="relative max-w-xl mx-auto text-center flex flex-col items-center gap-8">
            <FadeUp>
              <h2
                className="text-white leading-tight"
                style={{ ...PLAYFAIR, fontSize: 'clamp(30px, 4vw, 40px)' }}
              >
                Ready to never run out again?
              </h2>
            </FadeUp>

            <FadeUp delay={0.12}>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-block bg-white text-[#0F7B6C] hover:text-[#1B3A5C] font-semibold text-[17px] px-12 py-4 rounded-full transition-colors"
              >
                Start for free
              </button>
            </FadeUp>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="py-16 px-6" style={{ background: '#FAFAF8' }}>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <Image
                      src="/logo.jpg"
                      alt="Restock"
                      width={36}
                      height={36}
                      className="object-contain"
                      style={{ mixBlendMode: 'screen' }}
                    />
                  </div>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-[160px]">
                  Smart household purchase tracking.
                </p>
              </div>

              {/* Product */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[#1B3A5C] font-semibold text-sm">Product</h4>
                {['Dashboard', 'Spend analysis', 'Reminders', 'AI assistant', 'Deals'].map(
                  (item) => (
                    <Link
                      key={item}
                      href="/sign-in"
                      className="text-[#6B7280] text-sm hover:text-[#1B3A5C] transition-colors"
                    >
                      {item}
                    </Link>
                  )
                )}
              </div>

              {/* For */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[#1B3A5C] font-semibold text-sm">For</h4>
                {['Households', 'Individuals', 'Teams (coming soon)'].map((item) => (
                  <span key={item} className="text-[#6B7280] text-sm">
                    {item}
                  </span>
                ))}
              </div>

              {/* Company */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[#1B3A5C] font-semibold text-sm">Company</h4>
                {['About', 'Privacy', 'Terms'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-[#6B7280] text-sm hover:text-[#1B3A5C] transition-colors"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#9CA3AF]">© 2026 Restock Hub Solutions</p>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-[#9CA3AF] hover:text-[#25D366] transition-colors"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon size={16} />
                </a>
                <a
                  href="#"
                  className="text-[#9CA3AF] hover:text-[#229ED9] transition-colors"
                  aria-label="Telegram"
                >
                  <TelegramIcon size={16} />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Texture rendered after main so it sits above main (z:2 > z:1) but below header (z:50) */}
      <OrganicTexture />

      {/* Waitlist modal */}
      <WaitlistModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
