'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const COUNTRIES = [
  'Canada',
  'Nigeria',
  'Kenya',
  'India',
  'Brazil',
  'United States',
  'United Kingdom',
  'Other',
]

type State = 'idle' | 'loading' | 'success' | 'duplicate' | 'error'

interface WaitlistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [state, setState] = useState<State>('idle')
  const [position, setPosition] = useState<number | null>(null)
  const [fieldError, setFieldError] = useState('')

  function reset() {
    setName('')
    setEmail('')
    setCountry('')
    setState('idle')
    setPosition(null)
    setFieldError('')
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError('')

    if (!name.trim()) { setFieldError('Please enter your name.'); return }
    if (!email.trim()) { setFieldError('Please enter your email.'); return }
    if (!country) { setFieldError('Please select your country.'); return }

    setState('loading')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, country }),
      })

      const data: unknown = await res.json()
      const json = data as Record<string, unknown>

      if (res.status === 409) {
        setState('duplicate')
        return
      }
      if (!res.ok) {
        setFieldError(typeof json.error === 'string' ? json.error : 'Something went wrong.')
        setState('idle')
        return
      }

      setPosition(typeof json.position === 'number' ? json.position : null)
      setState('success')
    } catch {
      setFieldError('Network error — please try again.')
      setState('idle')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <AnimatePresence mode="wait">
          {state === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-5 py-6 text-center"
            >
              {/* Checkmark animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-[#132B22] flex items-center justify-center"
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <motion.path
                    d="M8 16l6 6 10-12"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, delay: 0.25 }}
                  />
                </svg>
              </motion.div>

              <div>
                <p className="text-[#132B22] font-semibold text-lg">
                  {position !== null ? `You're #${position} on the list!` : "You're on the list!"}
                </p>
                <p className="text-[#4A5568] text-sm mt-1">
                  We&apos;ll notify you when your spot is ready.
                </p>
              </div>

              <Button
                onClick={() => handleOpenChange(false)}
                className="bg-[#132B22] hover:bg-[#0A6459] text-white rounded-full px-8"
              >
                Done
              </Button>
            </motion.div>
          ) : state === 'duplicate' ? (
            <motion.div
              key="duplicate"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-5 py-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#F0FBF9] border border-[#132B22]/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 5v9M14 19v1" stroke="#132B22" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="14" cy="14" r="12" stroke="#132B22" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <p className="text-[#132B22] font-semibold text-lg">Already on the list</p>
                <p className="text-[#4A5568] text-sm mt-1">
                  You&apos;re already registered — we&apos;ll reach out soon!
                </p>
              </div>
              <Button
                onClick={() => handleOpenChange(false)}
                className="bg-[#132B22] hover:bg-[#0A6459] text-white rounded-full px-8"
              >
                Got it
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="mb-5">
                <DialogTitle className="text-[#132B22] text-xl font-semibold">
                  Join the early access list
                </DialogTitle>
                <DialogDescription className="text-[#4A5568] text-sm leading-relaxed">
                  Be among the first to try Restock — we&apos;ll notify you when your spot is ready.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wl-name" className="text-[#132B22] text-sm font-medium">
                    Name
                  </Label>
                  <Input
                    id="wl-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={state === 'loading'}
                    className="border-gray-200 focus-visible:ring-[#132B22]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wl-email" className="text-[#132B22] text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="wl-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={state === 'loading'}
                    className="border-gray-200 focus-visible:ring-[#132B22]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wl-country" className="text-[#132B22] text-sm font-medium">
                    Country
                  </Label>
                  <Select value={country} onValueChange={(v) => setCountry(v ?? '')} disabled={state === 'loading'}>
                    <SelectTrigger
                      id="wl-country"
                      className="border-gray-200 focus:ring-[#132B22]"
                    >
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {fieldError && (
                  <p className="text-[#EF4444] text-xs">{fieldError}</p>
                )}

                <Button
                  type="submit"
                  disabled={state === 'loading'}
                  className="w-full bg-[#132B22] hover:bg-[#0A6459] text-white font-semibold rounded-full py-5 mt-1 transition-colors"
                >
                  {state === 'loading' ? 'Joining…' : 'Join the waitlist'}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
