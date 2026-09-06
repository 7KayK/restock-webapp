'use client'

import * as React from 'react'
import { AssessmentFlow } from '@/components/shared/AssessmentFlow'
import { trackAssessmentEvent } from '@/lib/assessment/analytics'

const emptySubscribe = () => () => {}

// AssessmentFlow reads sessionStorage synchronously (via a useState lazy
// initializer) to resume an in-progress attempt — on a page that's
// server-rendered, doing that on the very first render would mismatch the
// server's HTML. useSyncExternalStore is the React-recommended way to gate
// client-only rendering like this: it returns the server snapshot during SSR
// and the first hydration pass, then the real client snapshot right after,
// with no manual setState-in-an-effect involved.
function useHasMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function AssessmentPageClient() {
  const hasMounted = useHasMounted()

  React.useEffect(() => {
    if (!hasMounted) return
    trackAssessmentEvent('assessment_modal_shown', { trigger: 'direct_link' })
  }, [hasMounted])

  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-[#F7F2E7] shadow-sm ring-1 ring-[#132B22]/10">
      {hasMounted ? (
        <AssessmentFlow />
      ) : (
        <div className="px-6 py-24 text-center text-sm text-[#5b6a5d]">Loading the assessment…</div>
      )}
    </div>
  )
}
