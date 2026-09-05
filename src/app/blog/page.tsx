import { MarketingNav } from '@/components/shared/MarketingNav'
import { MarketingFooter } from '@/components/shared/MarketingFooter'

const PLAYFAIR: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
}

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F2E7' }}>
      <MarketingNav />

      <main className="flex-1 px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1
            className="text-[#132B22] leading-tight mb-4"
            style={{ ...PLAYFAIR, fontSize: 'clamp(32px, 4vw, 48px)' }}
          >
            Blog
          </h1>
          <p className="text-[17px] text-[#3a473e] leading-relaxed mb-12 max-w-lg mx-auto">
            Case studies, scenarios, and insights on how people bring order to their everyday
            purchases.
          </p>

          {/* Empty state */}
          <div
            className="rounded-2xl px-8 py-12 flex flex-col items-center gap-4"
            style={{ background: '#EFE7D6', border: '1px solid rgba(19,43,34,0.12)' }}
          >
            <div className="w-12 h-12 rounded-full bg-[#132B22]/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="16" height="2" rx="1" fill="#132B22" fillOpacity="0.6" />
                <rect x="3" y="10" width="12" height="2" rx="1" fill="#132B22" fillOpacity="0.4" />
                <rect x="3" y="15" width="9" height="2" rx="1" fill="#132B22" fillOpacity="0.25" />
              </svg>
            </div>
            <p className="text-[#3a473e] text-sm">
              Coming soon — we&apos;re writing our first posts.
            </p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
