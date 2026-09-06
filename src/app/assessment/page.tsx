import type { Metadata } from 'next'
import { MarketingNav } from '@/components/shared/MarketingNav'
import { MarketingFooter } from '@/components/shared/MarketingFooter'
import { AssessmentPageClient } from '@/components/shared/AssessmentPageClient'

export const metadata: Metadata = {
  title: 'Restock Readiness Assessment — Join the Waitlist',
  description:
    'Answer 10 quick questions about how you track, reorder, and restock — get your personal Restock Score and a spot on the early-access waitlist.',
}

// A stable, always-on link to the assessment (independent of the site-wide
// popup's NEXT_PUBLIC_ASSESSMENT_ENABLED flag) — for sending directly to
// potential end users, sharing on socials, or dropping in an email/DM,
// rather than relying on someone stumbling onto the popup on their own.
export default function AssessmentPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#F7F2E7' }}>
      <MarketingNav />
      <main className="flex-1 px-6 py-16">
        <AssessmentPageClient />
      </main>
      <MarketingFooter />
    </div>
  )
}
