/**
 * Restock Readiness Assessment — shared content + scoring module.
 *
 * SOURCE OF TRUTH: this content (question bank, copy, scoring bands) is
 * ported verbatim from the finalized assessment artifact
 * (claude.ai/code/artifact/af55a85c-9d66-4932-a09f-290235e74532). Only the
 * visual design was left behind there — this module carries the actual
 * questions, copy, and logic, translated to TypeScript so both the modal
 * and any future surface (email, a standalone results page, etc.) can stay
 * in sync with one source.
 *
 * Do NOT add back the open-text field or extra questions that were cut from
 * the artifact during Kay's own iteration — 10 questions total (6 best
 * practice + 4 qualifying) is deliberate, not a placeholder.
 */

export type BestPracticeId =
  | 'know_low'
  | 'reorder_before'
  | 'has_system'
  | 'safety_stock'
  | 'scheduled_review'
  | 'rare_stockout'

export interface BestPracticeQuestion {
  id: BestPracticeId
  text: string
}

// 6 yes/no best-practice questions.
export const BEST_PRACTICES: BestPracticeQuestion[] = [
  { id: 'know_low', text: "I know exactly what's running low without having to go check." },
  { id: 'reorder_before', text: 'I reorder or restock before something fully runs out, not after.' },
  { id: 'has_system', text: 'I use a list, app, or spreadsheet for this — not just memory.' },
  { id: 'safety_stock', text: "I keep a small buffer of critical items so I'm never fully at zero." },
  { id: 'scheduled_review', text: "I check what's low on a regular schedule, not only when I notice a gap." },
  { id: 'rare_stockout', text: 'I rarely run completely out of something I actually needed that day.' },
]

export const INSIGHT_COPY: Record<BestPracticeId, { h: string; p: string }> = {
  know_low: {
    h: "You're finding gaps too late.",
    p: 'Without a running picture of what’s low, the first signal you get is usually the empty shelf itself — which is the most expensive time to find out.',
  },
  reorder_before: {
    h: "You're reordering reactively.",
    p: 'Restocking after the fact means every gap becomes a small emergency. A reorder point flips that to "before," not "after."',
  },
  has_system: {
    h: "You're relying on memory instead of a system.",
    p: 'Memory is the least reliable inventory system there is. A lightweight list or app removes the guesswork entirely.',
  },
  safety_stock: {
    h: "There's no buffer for the unexpected.",
    p: 'A small safety-stock cushion is what protects you when usage spikes or a delivery runs late — right now that cushion doesn’t exist.',
  },
  scheduled_review: {
    h: "Reviews only happen when something's already wrong.",
    p: 'A quick weekly look at what’s low catches gaps while they’re still easy to fix, instead of after they’ve already become a problem.',
  },
  rare_stockout: {
    h: 'Stockouts are happening more than they should.',
    p: 'Frequent stockouts are the clearest sign that the current system — or lack of one — isn’t catching gaps in time.',
  },
}

export type QualifyingId = 'segment' | 'outcome' | 'obstacle' | 'solution'

export interface QualifyingOption {
  v: string
  label: string
  sub?: string
}

export interface QualifyingQuestion {
  id: QualifyingId
  kicker: string
  text: string
  options: QualifyingOption[]
}

// 4 qualifying / segmentation questions.
export const QUALIFYING: QualifyingQuestion[] = [
  {
    id: 'segment',
    kicker: 'Quick context',
    text: 'Which best describes your current situation?',
    options: [
      { v: 'household', label: 'Household or family', sub: 'Managing groceries and everyday supplies at home' },
      { v: 'solo', label: 'Solo entrepreneur / small business owner', sub: 'It’s mostly just you handling inventory' },
      { v: 'growing', label: 'Manager at a growing business', sub: 'A small team, more moving parts' },
      { v: 'procurement', label: 'Procurement or operations lead', sub: 'At a more established company' },
      { v: 'curious', label: 'Just exploring', sub: 'Not managing inventory for anyone yet' },
    ],
  },
  {
    id: 'outcome',
    kicker: 'Looking ahead',
    text: "What's the #1 outcome you'd want in the next 90 days?",
    options: [
      { v: 'never_run_out', label: 'Never run out of the essentials' },
      { v: 'less_waste', label: 'Cut down on waste and duplicate purchases' },
      { v: 'save_time', label: 'Spend less time managing this altogether' },
      { v: 'fewer_stockouts', label: 'Fewer stockouts that cost me money or sales' },
      { v: 'get_ahead', label: 'Get ahead of reordering instead of reacting' },
    ],
  },
  {
    id: 'obstacle',
    kicker: 'Be honest',
    text: "What's the biggest obstacle stopping you right now?",
    options: [
      { v: 'no_time', label: "I don't have time to track it" },
      { v: 'no_system', label: "I don't have a system — just memory and guesswork" },
      { v: 'tried_too_much_work', label: "I've tried apps or spreadsheets, but they're too much upkeep" },
      { v: 'dont_know_start', label: "I don't know where to start" },
    ],
  },
  {
    id: 'solution',
    kicker: 'Last one',
    text: 'Which kind of solution appeals to you most?',
    options: [
      { v: 'auto_app', label: 'A simple app that tracks it for me automatically' },
      { v: 'ai_reminders', label: 'AI that reminds me before I run out' },
      { v: 'dashboard', label: 'A dashboard I check on my own schedule' },
      { v: 'handled_for_me', label: 'Something that handles reordering for me entirely' },
    ],
  },
]

// 1 contact step + 6 best-practice + 4 qualifying = 11 steps, 10 real questions.
export const TOTAL_STEPS = 1 + BEST_PRACTICES.length + QUALIFYING.length

export type Segment = 'household' | 'solo' | 'growing' | 'procurement' | 'curious'

export interface SegmentCopy {
  tag: string
  h: string
  p: string
  cta: string
}

// All segment copy confirms WAITLIST enrollment only — no "start now" / live
// product language, since restock.chat's app isn't open to end users yet.
export const SEGMENT_COPY: Record<Segment, SegmentCopy> = {
  household: {
    tag: 'For your household',
    h: "You're on the waitlist.",
    p: "We'll email you the moment Restock is ready for your kitchen — pantry and fridge tracking, and reminders before you're actually out, not after.",
    cta: "See what's coming",
  },
  solo: {
    tag: 'For your business',
    h: "You're on the waitlist.",
    p: "We'll reach out first when Restock opens up for small businesses — real reorder points from your own usage and lead times, not guesswork.",
    cta: "See what's coming",
  },
  growing: {
    tag: 'For your team',
    h: "You're on the waitlist.",
    p: "We'll let you know as soon as team accounts are ready — one shared view of stock and reorder points for everyone, not just you.",
    cta: "See what's coming",
  },
  procurement: {
    tag: 'For procurement & ops',
    h: "You're on the waitlist.",
    p: "We'll be in touch as Restock opens up for operations teams — safety stock, lead time, and supplier tracking, without the enterprise overhead.",
    cta: "See what's coming",
  },
  curious: {
    tag: 'No pressure',
    h: "You're on the waitlist.",
    p: "We'll let you know the moment Restock is ready to try — no pressure until then.",
    cta: "See what's coming",
  },
}

export interface ContactInfo {
  name: string
  email: string
  phone: string
}

export type BestPracticeAnswers = Partial<Record<BestPracticeId, boolean>>
export type QualifyingAnswers = Partial<Record<QualifyingId, string>>

export type BandName = 'Reactive' | 'Getting There' | 'Dialed In'

export interface ScoreBand {
  name: BandName
  // Brand-native colors (forest/gold/cream palette) standing in for the
  // artifact's original navy/teal band colors — a warm bronze -> gold ->
  // forest progression rather than a red/yellow/green traffic-light scheme.
  color: string
}

export function computeScore(bp: BestPracticeAnswers): number {
  const yes = BEST_PRACTICES.reduce((count, q) => (bp[q.id] ? count + 1 : count), 0)
  return Math.round((yes / BEST_PRACTICES.length) * 100)
}

export function bandFor(score: number): ScoreBand {
  if (score <= 40) return { name: 'Reactive', color: '#A67C52' }
  if (score <= 75) return { name: 'Getting There', color: '#C9A15A' }
  return { name: 'Dialed In', color: '#132B22' }
}

export function scoreBlurb(bandName: BandName): string {
  return {
    Reactive: "Restocking mostly happens after something's already gone.",
    'Getting There': "You've got real habits in place — a few gaps are still costing you.",
    'Dialed In': "You're ahead of most people we assess — mostly fine-tuning from here.",
  }[bandName]
}

const OBSTACLE_INSIGHT_COPY: Partial<Record<string, { h: string; p: string }>> = {
  no_time: {
    h: 'Time is the real constraint.',
    p: "That's exactly what a lightweight, automatic system is for — it should take less time than the guesswork you're doing now, not more.",
  },
  no_system: {
    h: "There's no system yet — and that's fine.",
    p: 'Nothing here is a personal failing. It just means the next step is picking a simple system and letting it run in the background.',
  },
  tried_too_much_work: {
    h: 'Past tools asked too much of you.',
    p: "A system only works if it's lighter than the problem it solves — that's the bar worth holding any new tool to.",
  },
  dont_know_start: {
    h: 'Not knowing where to start is the most common answer here.',
    p: "Start with the handful of items that matter most — you don't need to inventory everything on day one.",
  },
}

const FALLBACK_INSIGHT = {
  h: 'Your fundamentals are solid.',
  p: "You're already doing more of this well than most — the remaining gains are about tightening timing, not building habits from scratch.",
}

export function buildInsights(bp: BestPracticeAnswers, qual: QualifyingAnswers): { h: string; p: string }[] {
  const gapIds = BEST_PRACTICES.filter((q) => bp[q.id] === false).map((q) => q.id)
  const insights = gapIds.slice(0, 3).map((id) => INSIGHT_COPY[id])

  if (insights.length < 3) {
    const obstacleInsight = qual.obstacle ? OBSTACLE_INSIGHT_COPY[qual.obstacle] : undefined
    if (obstacleInsight && !insights.includes(obstacleInsight)) {
      insights.push(obstacleInsight)
    }
  }

  while (insights.length < 3) {
    insights.push(FALLBACK_INSIGHT)
  }

  return insights.slice(0, 3)
}

export function segmentFor(qual: QualifyingAnswers): Segment {
  const seg = qual.segment
  if (seg === 'household' || seg === 'solo' || seg === 'growing' || seg === 'procurement' || seg === 'curious') {
    return seg
  }
  return 'curious'
}
