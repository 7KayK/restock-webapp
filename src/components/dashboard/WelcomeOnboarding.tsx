'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImageIntelligence } from '@/components/shared/ImageIntelligence'
import type { Purchase } from '@/types'

const STORAGE_KEY = 'restock_onboarded'

const PLAYFAIR: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
}

function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i + 1 === current ? 20 : 6,
            backgroundColor: i + 1 === current ? '#132B22' : '#c9bfa8',
          }}
          transition={{ duration: 0.25 }}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  )
}

export function WelcomeOnboarding() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [imageOpen, setImageOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }
  }, [])

  function complete() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    setOpen(false)
  }

  function handleReceiptAction() {
    complete()
    // small delay so the onboarding dialog closes before ImageIntelligence opens
    setTimeout(() => setImageOpen(true), 200)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) complete() }}>
        <DialogContent
          className="p-0 overflow-hidden border-0 shadow-2xl"
          style={{ maxWidth: 480, borderRadius: 16 }}
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step key="step-1">
                <StepBody>
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-[#132B22] flex items-center justify-center mx-auto">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10 10-4.477 10-10S19.523 4 14 4z" fill="white" fillOpacity="0.2" />
                      <path d="M10 14l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-[#132B22] text-2xl" style={PLAYFAIR}>
                      Welcome to Restock!
                    </h2>
                    <p className="text-[#3a473e] text-[15px] leading-relaxed">
                      You&apos;re in. Here&apos;s how to get the most out of Restock in 60 seconds.
                    </p>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    className="w-full bg-[#132B22] hover:bg-[#0d1f17] text-white font-semibold py-5 rounded-full text-[15px]"
                  >
                    Let&apos;s go →
                  </Button>
                </StepBody>

                <StepFooter>
                  <ProgressDots total={3} current={1} />
                </StepFooter>
              </Step>
            )}

            {step === 2 && (
              <Step key="step-2">
                <StepBody>
                  <div className="text-center space-y-1">
                    <h2 className="text-[#132B22] text-2xl" style={PLAYFAIR}>
                      Connect where you already are
                    </h2>
                  </div>

                  {/* Channel cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Telegram */}
                    <a
                      href="https://t.me/restockchatbot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#132B22]/20 bg-[#EFE7D6] hover:bg-[#EFE7D6] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#229ED9] flex items-center justify-center text-white">
                        <TelegramIcon size={20} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#132B22]">Telegram</p>
                        <p className="text-[11px] text-[#132B22] mt-0.5">@restockchatbot →</p>
                      </div>
                    </a>

                    {/* WhatsApp — coming soon */}
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[rgba(19,43,34,0.10)] bg-[#F7F2E7] opacity-50 cursor-not-allowed select-none">
                      <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                        <WhatsAppIcon size={20} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#132B22]">WhatsApp</p>
                        <p className="text-[11px] text-[#5b6a5d] mt-0.5">Coming soon</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[13px] text-[#3a473e] leading-relaxed">
                    Log purchases by sending a message or snapping a receipt — no forms, no friction.
                  </p>

                  <Button
                    onClick={() => setStep(3)}
                    className="w-full bg-[#132B22] hover:bg-[#0d1f17] text-white font-semibold py-5 rounded-full text-[15px]"
                  >
                    Next →
                  </Button>

                  <button
                    onClick={() => setStep(3)}
                    className="text-sm text-[#5b6a5d] hover:text-[#132B22] transition-colors text-center w-full"
                  >
                    I&apos;ll do this later
                  </button>
                </StepBody>

                <StepFooter>
                  <ProgressDots total={3} current={2} />
                </StepFooter>
              </Step>
            )}

            {step === 3 && (
              <Step key="step-3">
                <StepBody>
                  <div className="text-center space-y-1">
                    <h2 className="text-[#132B22] text-2xl" style={PLAYFAIR}>
                      Try it now
                    </h2>
                  </div>

                  {/* Action cards */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={handleReceiptAction}
                      className="flex items-center gap-4 p-4 rounded-xl border border-[rgba(19,43,34,0.10)] bg-white hover:border-[#132B22]/30 hover:bg-[#EFE7D6] transition-colors text-left group"
                    >
                      <span className="text-2xl">📷</span>
                      <div>
                        <p className="text-sm font-semibold text-[#132B22]">Snap a receipt</p>
                        <p className="text-[12px] text-[#5b6a5d]">Photo, screenshot or handwritten note</p>
                      </div>
                    </button>

                    <Link
                      href="/dashboard/history"
                      onClick={complete}
                      className="flex items-center gap-4 p-4 rounded-xl border border-[rgba(19,43,34,0.10)] bg-white hover:border-[#132B22]/30 hover:bg-[#EFE7D6] transition-colors text-left group"
                    >
                      <span className="text-2xl">⌨️</span>
                      <div>
                        <p className="text-sm font-semibold text-[#132B22]">Type your first purchase</p>
                        <p className="text-[12px] text-[#5b6a5d]">Log manually in your purchase history</p>
                      </div>
                    </Link>

                    <Link
                      href="/dashboard/shopping"
                      onClick={complete}
                      className="flex items-center gap-4 p-4 rounded-xl border border-[rgba(19,43,34,0.10)] bg-white hover:border-[#132B22]/30 hover:bg-[#EFE7D6] transition-colors text-left group"
                    >
                      <span className="text-2xl">🛒</span>
                      <div>
                        <p className="text-sm font-semibold text-[#132B22]">Start a shopping trip</p>
                        <p className="text-[12px] text-[#5b6a5d]">Build a smart list from your history</p>
                      </div>
                    </Link>
                  </div>

                  <Button
                    onClick={complete}
                    className="w-full bg-[#132B22] hover:bg-[#0d1f17] text-white font-semibold py-5 rounded-full text-[15px]"
                  >
                    Go to Dashboard
                  </Button>
                </StepBody>

                <StepFooter>
                  <ProgressDots total={3} current={3} />
                </StepFooter>
              </Step>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <ImageIntelligence
        open={imageOpen}
        onOpenChange={setImageOpen}
        onImport={(_purchases: Purchase[]) => {
          window.location.href = '/dashboard/history'
        }}
      />
    </>
  )
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col"
    >
      {children}
    </motion.div>
  )
}

function StepBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 px-7 pt-8 pb-4">
      {children}
    </div>
  )
}

function StepFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-7 pb-7 pt-2">
      {children}
    </div>
  )
}
