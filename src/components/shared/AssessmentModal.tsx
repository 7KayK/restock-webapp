'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'
import { AssessmentFlow, type Stage } from '@/components/shared/AssessmentFlow'
import { trackAssessmentEvent } from '@/lib/assessment/analytics'

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

  // AssessmentFlow reports its own stage/step here purely so a close (ESC,
  // backdrop click, or its close button — all of which route through
  // handleOpenChange below) can fire an accurate "abandoned" event without
  // this wrapper needing to know anything about the quiz's internal state.
  const latestState = React.useRef<{ stage: Stage; step: number }>({ stage: 'intro', step: 0 })

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next && latestState.current.stage !== 'results') {
        trackAssessmentEvent('assessment_abandoned', {
          lastStep: latestState.current.step,
          stage: latestState.current.stage,
        })
      }
      onOpenChange(next)
    },
    [onOpenChange]
  )

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
          {open && (
            <AssessmentFlow
              onClose={() => handleOpenChange(false)}
              onStateChange={(s) => {
                latestState.current = s
              }}
            />
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
