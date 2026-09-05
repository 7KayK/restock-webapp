import { MarketingNav } from '@/components/shared/MarketingNav'
import { MarketingFooter } from '@/components/shared/MarketingFooter'

const PLAYFAIR: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
}

const STEPS = [
  {
    num: '1',
    title: 'Log a purchase',
    desc: 'Send a message, snap a receipt, or type it in. Natural language. No commands needed. Restock reads photos, screenshots, and handwritten notes automatically.',
  },
  {
    num: '2',
    title: 'Restock learns your patterns',
    desc: 'Every purchase teaches Restock how fast you go through things. Over time it builds a model of your household consumption — unique to you.',
  },
  {
    num: '3',
    title: 'Never run out',
    desc: 'Reminders arrive before you run out. Matched deals and your nearest store are surfaced automatically so restocking is always one step away.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F2E7' }}>
      <MarketingNav />

      <main className="flex-1 px-6 py-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <h1
              className="text-[#132B22] leading-tight mb-4"
              style={{ ...PLAYFAIR, fontSize: 'clamp(32px, 4vw, 48px)' }}
            >
              How it works
            </h1>
            <p className="text-[17px] text-[#4A5568] leading-relaxed max-w-lg mx-auto">
              Three steps. No friction. Works wherever you already message.
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-16">
            {STEPS.map(({ num, title, desc }, i) => (
              <div
                key={num}
                className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-start"
              >
                {/* Number */}
                <div className="w-12 h-12 rounded-full bg-[#132B22] flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-lg">{num}</span>
                </div>

                {/* Content */}
                <div className="pt-1.5">
                  <h2
                    className="text-[#132B22] font-semibold mb-3"
                    style={{ fontSize: '20px' }}
                  >
                    {title}
                  </h2>
                  <p className="text-[#4A5568] leading-relaxed">{desc}</p>

                  {/* Connector line — not shown on last step */}
                  {i < STEPS.length - 1 && (
                    <div className="mt-10 h-px bg-[#E5E7EB] md:hidden" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div
            className="mt-20 rounded-2xl px-8 py-10 text-center"
            style={{ background: '#F0FBF9', border: '1px solid rgba(15,123,108,0.12)' }}
          >
            <h3
              className="text-[#132B22] mb-2"
              style={{ ...PLAYFAIR, fontSize: '24px' }}
            >
              Ready to try it?
            </h3>
            <p className="text-[#4A5568] text-sm mb-6">
              Sign in and Restock learns your patterns from your first purchase.
            </p>
            <a
              href="/"
              className="inline-block bg-[#132B22] hover:bg-[#0A6459] text-white font-semibold text-sm px-8 py-3 rounded-full transition-colors"
            >
              Get started
            </a>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
