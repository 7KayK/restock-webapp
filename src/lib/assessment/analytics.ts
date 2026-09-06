/**
 * Assessment funnel analytics.
 *
 * NOTE FOR KAY: this repo has no analytics library wired in yet (checked
 * package.json — no PostHog/Segment/Mixpanel/Amplitude/Plausible/GA). These
 * events are stubbed as flagged console logs so the funnel data model exists
 * and is easy to find/replace, but nothing is actually being collected or
 * sent anywhere yet. Once an analytics provider is wired up, replace the
 * body of `trackAssessmentEvent` with the real call (e.g. `posthog.capture`,
 * `analytics.track`, etc.) — every call site in the assessment feature
 * already goes through this one function.
 */

export type AssessmentEventName =
  | 'assessment_modal_shown'
  | 'assessment_quiz_started'
  | 'assessment_question_answered'
  | 'assessment_quiz_completed'
  | 'assessment_abandoned'

export interface AssessmentEventPayload {
  step?: number
  questionId?: string
  trigger?: 'auto' | 'manual'
  score?: number
  segment?: string
  lastStep?: number
  stage?: string
  [key: string]: unknown
}

export function trackAssessmentEvent(name: AssessmentEventName, payload: AssessmentEventPayload = {}): void {
  if (typeof window === 'undefined') return

  // TODO(analytics): no analytics provider is wired into this app yet — this
  // is a stub. Swap this console call for a real analytics.track()/capture()
  // call once one is added, and remove this comment.
  console.info('[assessment-analytics:stub]', name, payload)
}
