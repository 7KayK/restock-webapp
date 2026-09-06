'use client'

import * as React from 'react'
import Link from 'next/link'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BEST_PRACTICES,
  QUALIFYING,
  TOTAL_STEPS,
  SEGMENT_COPY,
  computeScore,
  bandFor,
  buildInsights,
  scoreBlurb,
  segmentFor,
  type ContactInfo,
  type BestPracticeAnswers,
  type QualifyingAnswers,
  type BestPracticeId,
  type QualifyingId,
  type ScoreBand,
} from '@/lib/assessment/data'
import { trackAssessmentEvent } from '@/lib/assessment/analytics'

const FRAUNCES: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Fraunces", Georgia, serif',
}

const PROGRESS_KEY = 'restock_assessment_progress_v1'
const EMAIL_RE = /^\S+@\S+\.\S+$/

type Stage = 'intro' | 'quiz' | 'results'

interface StoredProgress {
  sessionId: string
  started: boolean
  step: number
  contact: ContactInfo
  bp: BestPracticeAnswers
  qual: QualifyingAnswers
}

interface AssessmentResult {
  score: number
  band: ScoreBand
  insights: { h: string; p: string }[]
  segment: ReturnType<typeof segmentFor>
}

function newSessionId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`
  }
}

function loadProgress(): StoredProgress | null {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY)
    return raw ? (JSON.parse(raw) as StoredProgress) : null
  } catch {
    return null
  }
}

function saveProgress(progress: StoredProgress): void {
  try {
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // sessionStorage unavailable — progress just won't survive a close/reopen.
  }
}

function clearProgress(): void {
  try {
    sessionStorage.removeItem(PROGRESS_KEY)
  } catch {
    // no-op
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function AssessmentModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const reducedMotion = usePrefersReducedMotion()

  const [stage, setStage] = React.useState<Stage>('intro')
  const [sessionId, setSessionId] = React.useState<string>('')
  const [step, setStep] = React.useState(0)
  const [contact, setContact] = React.useState<ContactInfo>({ name: '', email: '', phone: '' })
  const [bp, setBp] = React.useState<BestPracticeAnswers>({})
  const [qual, setQual] = React.useState<QualifyingAnswers>({})
  const [result, setResult] = React.useState<AssessmentResult | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  // Reset (or resume) whenever the modal transitions from closed to open.
  // This adjusts state during render in response to a prop change (the
  // pattern React recommends over an effect for this) rather than doing the
  // sessionStorage read + setState calls inside a useEffect body.
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      const existing = loadProgress()
      if (existing?.started) {
        setSessionId(existing.sessionId)
        setStep(existing.step)
        setContact(existing.contact)
        setBp(existing.bp)
        setQual(existing.qual)
        setStage('quiz')
      } else {
        setSessionId(existing?.sessionId ?? newSessionId())
        setStep(0)
        setContact({ name: '', email: '', phone: '' })
        setBp({})
        setQual({})
        setStage('intro')
      }
      setResult(null)
      setSubmitError(null)
    }
  }

  const persist = React.useCallback(
    (nextStep: number, nextContact: ContactInfo, nextBp: BestPracticeAnswers, nextQual: QualifyingAnswers) => {
      if (!sessionId) return
      saveProgress({ sessionId, started: true, step: nextStep, contact: nextContact, bp: nextBp, qual: nextQual })
    },
    [sessionId]
  )

  const handleStart = React.useCallback(() => {
    setStage('quiz')
    trackAssessmentEvent('assessment_quiz_started', {})
    persist(0, contact, bp, qual)
  }, [persist, contact, bp, qual])

  const finish = React.useCallback(
    async (finalBp: BestPracticeAnswers, finalQual: QualifyingAnswers, finalContact: ContactInfo) => {
      const score = computeScore(finalBp)
      const band = bandFor(score)
      const insights = buildInsights(finalBp, finalQual)
      const segment = segmentFor(finalQual)

      setResult({ score, band, insights, segment })
      setStage('results')
      clearProgress()
      trackAssessmentEvent('assessment_quiz_completed', { score, segment })

      setSubmitting(true)
      setSubmitError(null)
      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: finalContact.name,
            email: finalContact.email,
            phone: finalContact.phone || undefined,
            segment,
            score,
            answers: { bestPractices: finalBp, qualifying: finalQual },
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}) as Record<string, unknown>)
          throw new Error(typeof data.error === 'string' ? data.error : 'Something went wrong saving your response.')
        }
      } catch (err) {
        console.error('[assessment] waitlist submission failed', err)
        setSubmitError(
          "Your score above is still valid — we hit a snag saving your spot. Reach us at hello@restock.chat and we'll add you by hand."
        )
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  const advance = React.useCallback(
    (nextBp: BestPracticeAnswers, nextQual: QualifyingAnswers) => {
      const nextStep = step + 1
      if (nextStep >= TOTAL_STEPS) {
        void finish(nextBp, nextQual, contact)
        return
      }
      setStep(nextStep)
      persist(nextStep, contact, nextBp, nextQual)
    },
    [step, contact, persist, finish]
  )

  const handleContactContinue = React.useCallback(
    (nextContact: ContactInfo) => {
      setContact(nextContact)
      trackAssessmentEvent('assessment_question_answered', { step, questionId: 'contact' })
      const nextStep = step + 1
      setStep(nextStep)
      persist(nextStep, nextContact, bp, qual)
    },
    [step, bp, qual, persist]
  )

  const handleBestPracticeAnswer = React.useCallback(
    (id: BestPracticeId, value: boolean) => {
      const nextBp = { ...bp, [id]: value }
      setBp(nextBp)
      trackAssessmentEvent('assessment_question_answered', { step, questionId: id })
      advance(nextBp, qual)
    },
    [bp, qual, step, advance]
  )

  const handleQualifyingAnswer = React.useCallback(
    (id: QualifyingId, value: string) => {
      const nextQual = { ...qual, [id]: value }
      setQual(nextQual)
      trackAssessmentEvent('assessment_question_answered', { step, questionId: id })
      advance(bp, nextQual)
    },
    [qual, bp, step, advance]
  )

  const handleBack = React.useCallback(() => {
    if (step === 0) return
    const prevStep = step - 1
    setStep(prevStep)
    persist(prevStep, contact, bp, qual)
  }, [step, contact, bp, qual, persist])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next && stage !== 'results') {
        trackAssessmentEvent('assessment_abandoned', { lastStep: step, stage })
      }
      onOpenChange(next)
    },
    [stage, step, onOpenChange]
  )

  const progressPct = Math.round((step / TOTAL_STEPS) * 100)
  const progressLabel = `${Math.min(step + 1, TOTAL_STEPS)} / ${TOTAL_STEPS}`

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            'fixed inset-0 z-50 bg-[#132B22]/45',
            !reducedMotion && 'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0'
          )}
        />
        <DialogPrimitive.Popup
          role="dialog"
          aria-modal="true"
          aria-label="Restock Readiness Assessment"
          className={cn(
            'fixed inset-0 z-50 flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-[#F7F2E7] text-[#132B22] outline-none',
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[88vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-[#132B22]/10',
            !reducedMotion &&
              'duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
          )}
        >
          {/* Header: progress (quiz only) + close */}
          <div className="flex shrink-0 items-center gap-4 border-b border-[#132B22]/10 px-5 py-4">
            {stage === 'quiz' ? (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="shrink-0 text-sm font-medium text-[#3a473e] transition-colors hover:text-[#132B22] disabled:pointer-events-none disabled:opacity-0"
                >
                  ← Back
                </button>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#132B22]/10">
                  <div
                    className="h-full rounded-full bg-[#C9A15A] transition-[width] duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-[#5b6a5d]">{progressLabel}</span>
              </>
            ) : (
              <span className="text-xs font-semibold tracking-wide text-[#C9A15A] uppercase">
                Restock Readiness Assessment
              </span>
            )}
            <DialogPrimitive.Close
              aria-label="Close"
              className="ml-auto shrink-0 rounded-full p-1.5 text-[#3a473e] transition-colors hover:bg-[#132B22]/10 hover:text-[#132B22]"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            {stage === 'intro' && <IntroScreen onStart={handleStart} />}
            {stage === 'quiz' && (
              <QuizScreen
                step={step}
                contact={contact}
                bp={bp}
                qual={qual}
                onContactContinue={handleContactContinue}
                onBestPracticeAnswer={handleBestPracticeAnswer}
                onQualifyingAnswer={handleQualifyingAnswer}
              />
            )}
            {stage === 'results' && result && (
              <ResultsScreen result={result} contact={contact} submitting={submitting} submitError={submitError} />
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ---------------------------------------------------------------------------
// Intro screen
// ---------------------------------------------------------------------------

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <div>
        <h2
          className="text-[#132B22] leading-tight"
          style={{ ...FRAUNCES, fontSize: 'clamp(24px, 4vw, 30px)' }}
        >
          Ready to never run out of what matters?
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#3a473e]">
          Answer 10 quick questions about how you track, reorder, and restock — for your kitchen or your business —
          get a personal Restock Score, and claim your spot for early access.
        </p>
        <p className="mt-2 text-[13px] text-[#5b6a5d]">2 minutes · free · instant score + early access</p>
      </div>

      <div className="flex flex-col gap-3">
        {[
          {
            i: 'i.',
            h: 'Inventory visibility',
            p: "Do you actually know what's running low right now — or do you find out when it's already gone?",
          },
          {
            i: 'ii.',
            h: 'Reorder timing',
            p: 'Are you ordering before the gap — or after, when it’s already an emergency?',
          },
          {
            i: 'iii.',
            h: 'Restocking habits',
            p: 'Is there a system doing this for you, or is it all held in memory?',
          },
        ].map((panel) => (
          <div key={panel.h} className="rounded-xl border border-[#132B22]/10 bg-white/50 px-4 py-3.5">
            <span className="text-sm font-semibold text-[#C9A15A]" style={FRAUNCES}>
              {panel.i}
            </span>
            <h3 className="mt-1 text-[15px] font-semibold text-[#132B22]">{panel.h}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#5b6a5d]">{panel.p}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-[#132B22] px-5 py-4 text-[#F7F2E7]">
        <p className="text-[13.5px] leading-relaxed text-[#F7F2E7]/90">
          Restock&rsquo;s reorder logic — safety stock plus average usage times lead time — is the same method used
          in enterprise inventory systems, brought down to the size of a kitchen cupboard or a small shop&rsquo;s
          back room. It&rsquo;s built by a product developer with graduate training in economics, supply chain
          management, and international development.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#132B22]/10 px-4 py-3">
          <span className="block font-semibold text-[#132B22]" style={{ ...FRAUNCES, fontSize: '20px' }}>
            $1,600/yr
          </span>
          <p className="mt-1 text-[12.5px] leading-snug text-[#5b6a5d]">
            the average American family of four throws out in produce alone.{' '}
            <span className="text-[#8a9a8c]">— Feeding America, via RTS Food Waste in America</span>
          </p>
        </div>
        <div className="rounded-xl border border-[#132B22]/10 px-4 py-3">
          <span className="block font-semibold text-[#132B22]" style={{ ...FRAUNCES, fontSize: '20px' }}>
            $21,000/yr
          </span>
          <p className="mt-1 text-[12.5px] leading-snug text-[#5b6a5d]">
            lost by a typical brand to stretches when its top products were simply unavailable to sell.{' '}
            <span className="text-[#8a9a8c]">— Katana, study of 375 brands</span>
          </p>
        </div>
      </div>

      <Button
        type="button"
        onClick={onStart}
        className="h-12 w-full rounded-full bg-[#132B22] text-[15px] font-semibold text-[#F7F2E7] hover:bg-[#0d1f17]"
      >
        Start the assessment
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quiz screen (contact step, then best-practice steps, then qualifying steps)
// ---------------------------------------------------------------------------

function QuizScreen({
  step,
  contact,
  bp,
  qual,
  onContactContinue,
  onBestPracticeAnswer,
  onQualifyingAnswer,
}: {
  step: number
  contact: ContactInfo
  bp: BestPracticeAnswers
  qual: QualifyingAnswers
  onContactContinue: (contact: ContactInfo) => void
  onBestPracticeAnswer: (id: BestPracticeId, value: boolean) => void
  onQualifyingAnswer: (id: QualifyingId, value: string) => void
}) {
  if (step === 0) {
    return <ContactStep contact={contact} onContinue={onContactContinue} />
  }
  if (step <= BEST_PRACTICES.length) {
    const q = BEST_PRACTICES[step - 1]
    return (
      <div key={q.id} className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#C9A15A] uppercase">
            Habits · {step} of {BEST_PRACTICES.length}
          </p>
          <p className="mt-3 leading-snug text-[#132B22]" style={{ ...FRAUNCES, fontSize: 'clamp(20px, 4vw, 24px)' }}>
            {q.text}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['Yes', 'No'] as const).map((label) => {
            const value = label === 'Yes'
            const selected = bp[q.id] === value
            return (
              <button
                key={label}
                type="button"
                onClick={() => onBestPracticeAnswer(q.id, value)}
                className={cn(
                  'rounded-xl border-[1.5px] px-4 py-4 text-center text-[15px] font-semibold transition-colors',
                  selected
                    ? 'border-[#C9A15A] bg-[#C9A15A]/15 text-[#132B22]'
                    : 'border-[#132B22]/12 bg-white/60 text-[#132B22] hover:border-[#C9A15A]'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const q = QUALIFYING[step - BEST_PRACTICES.length - 1]
  return (
    <div key={q.id} className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[#C9A15A] uppercase">{q.kicker}</p>
        <p className="mt-3 leading-snug text-[#132B22]" style={{ ...FRAUNCES, fontSize: 'clamp(20px, 4vw, 24px)' }}>
          {q.text}
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        {q.options.map((opt) => {
          const selected = qual[q.id] === opt.v
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => onQualifyingAnswer(q.id, opt.v)}
              className={cn(
                'rounded-xl border-[1.5px] px-4 py-3.5 text-left transition-colors',
                selected
                  ? 'border-[#C9A15A] bg-[#C9A15A]/15'
                  : 'border-[#132B22]/12 bg-white/60 hover:border-[#C9A15A]'
              )}
            >
              <span className="block text-[14.5px] font-semibold text-[#132B22]">{opt.label}</span>
              {opt.sub && <span className="mt-0.5 block text-[13px] text-[#5b6a5d]">{opt.sub}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ContactStep({ contact, onContinue }: { contact: ContactInfo; onContinue: (contact: ContactInfo) => void }) {
  const [name, setName] = React.useState(contact.name)
  const [email, setEmail] = React.useState(contact.email)
  const [phone, setPhone] = React.useState(contact.phone)

  const canContinue = name.trim().length > 0 && EMAIL_RE.test(email.trim())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[#C9A15A] uppercase">Before we start</p>
        <p className="mt-3 leading-snug text-[#132B22]" style={{ ...FRAUNCES, fontSize: 'clamp(20px, 4vw, 24px)' }}>
          Who should we send your Restock Score and early-access invite to?
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assessment-name">Name</Label>
          <Input
            id="assessment-name"
            autoFocus
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-lg border-[#132B22]/15 bg-white text-[15px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assessment-email">Email</Label>
          <Input
            id="assessment-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-lg border-[#132B22]/15 bg-white text-[15px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assessment-phone">
            Phone <span className="font-normal text-[#5b6a5d]">(optional)</span>
          </Label>
          <Input
            id="assessment-phone"
            type="tel"
            placeholder="Optional"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 rounded-lg border-[#132B22]/15 bg-white text-[15px]"
          />
        </div>
      </div>

      <Button
        type="button"
        disabled={!canContinue}
        onClick={() => onContinue({ name: name.trim(), email: email.trim(), phone: phone.trim() })}
        className="h-12 w-full rounded-full bg-[#132B22] text-[15px] font-semibold text-[#F7F2E7] hover:bg-[#0d1f17]"
      >
        Continue
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results screen
// ---------------------------------------------------------------------------

function ResultsScreen({
  result,
  contact,
  submitting,
  submitError,
}: {
  result: AssessmentResult
  contact: ContactInfo
  submitting: boolean
  submitError: string | null
}) {
  const { score, band, insights, segment } = result
  const seg = SEGMENT_COPY[segment]
  const firstName = contact.name.split(' ')[0]

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-wide text-[#C9A15A] uppercase">
          {firstName ? `${firstName}’s Restock Score` : 'Your Restock Score'}
        </p>

        <div className="mx-auto mt-4 flex flex-col items-center">
          <ScoreGauge score={score} color={band.color} />
          <span className="mt-1 text-xs font-bold tracking-wider uppercase" style={{ color: band.color }}>
            {band.name}
          </span>
          <p className="mt-2 text-[14.5px] text-[#3a473e]">{scoreBlurb(band.name)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((ins, i) => (
          <div key={i} className="rounded-xl border border-[#132B22]/10 bg-white/60 px-4 py-3.5">
            <span className="font-semibold text-[#C9A15A]" style={FRAUNCES}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <h4 className="mt-1.5 text-[14.5px] font-semibold text-[#132B22]">{ins.h}</h4>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#5b6a5d]">{ins.p}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[#132B22] px-6 py-7 text-center text-[#F7F2E7]">
        <span className="text-xs font-bold tracking-wider text-[#C9A15A] uppercase">{seg.tag}</span>
        <h3 className="mt-2 leading-snug" style={{ ...FRAUNCES, fontSize: 'clamp(19px, 4vw, 23px)', color: '#F7F2E7' }}>
          {seg.h}
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-[#F7F2E7]/80">{seg.p}</p>
        <Link
          href="/how-it-works"
          className="mt-5 inline-block rounded-full bg-[#E4C07D] px-6 py-2.5 text-sm font-semibold text-[#132B22] transition-colors hover:bg-[#C9A15A]"
        >
          {seg.cta}
        </Link>
        {submitting && <p className="mt-3 text-[12px] text-[#F7F2E7]/60">Saving your spot…</p>}
        {submitError && <p className="mt-3 text-[12px] text-[#E4C07D]">{submitError}</p>}
      </div>

      <p className="text-center text-[13px] text-[#5b6a5d]">
        Questions? Reach us at{' '}
        <a href="mailto:hello@restock.chat" className="font-semibold text-[#132B22] underline">
          hello@restock.chat
        </a>
      </p>
    </div>
  )
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const size = 176
  const stroke = 14
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const start = Math.PI
  const end = 2 * Math.PI
  const progressAngle = start + (end - start) * (score / 100)

  function arcPath(startAngle: number, endAngle: number): string {
    const sx = cx + r * Math.cos(startAngle)
    const sy = cy + r * Math.sin(startAngle)
    const ex = cx + r * Math.cos(endAngle)
    const ey = cy + r * Math.sin(endAngle)
    const large = endAngle - startAngle > Math.PI ? 1 : 0
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`
  }

  return (
    <svg width={size} height={size * 0.62 + 30} viewBox={`0 0 ${size} ${size * 0.62 + 30}`}>
      <path d={arcPath(start, end)} fill="none" stroke="rgba(19,43,34,0.1)" strokeWidth={stroke} strokeLinecap="round" />
      <path d={arcPath(start, progressAngle)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="var(--font-playfair), Georgia, serif" fontWeight={700} fontSize={38} fill="#132B22">
        {score}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontFamily="var(--font-geist-sans), sans-serif" fontSize={11} fill="#5b6a5d">
        out of 100
      </text>
    </svg>
  )
}
