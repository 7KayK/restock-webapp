import Link from 'next/link'
import { MarketingNav } from '@/components/shared/MarketingNav'
import { MarketingFooter } from '@/components/shared/MarketingFooter'

const PLAYFAIR: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F2E7' }}>
      <MarketingNav />

      <main className="flex-1 px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <h1
              className="text-[#132B22] leading-tight mb-4"
              style={{ ...PLAYFAIR, fontSize: 'clamp(32px, 4vw, 48px)' }}
            >
              About Restock
            </h1>
            <p className="text-[17px] text-[#3a473e] leading-relaxed max-w-lg mx-auto">
              Household restocking, treated like the supply chain problem it actually is.
            </p>
          </div>

          <div className="flex flex-col gap-8 text-[#3a473e] leading-relaxed text-[15.5px]">
            <p>
              Most households run out of things at the worst possible moment — not because anyone
              forgot to plan, but because nobody is tracking consumption the way a business would.
              Restock started from a simple observation: the same demand-forecasting and
              replenishment thinking that keeps a warehouse stocked works just as well for a
              kitchen cupboard or a small shop&rsquo;s shelf. It just needed to be effortless enough
              that people would actually use it.
            </p>
            <p>
              So Restock meets you where you already are. Log a purchase over Telegram or WhatsApp,
              snap a photo of a receipt, or add it manually — no new habit to build. From there,
              Restock learns how fast your household or business actually goes through things, and
              turns that into reminders that arrive before you notice you&rsquo;re out, spending
              insights you can actually use, and deals matched to what you buy.
            </p>
            <p>
              Restock is built by Kay Olusanya, a product developer whose background sits at the
              intersection of economics, supply chain management, and international development —
              applying real inventory and replenishment thinking to an everyday household problem,
              rather than treating it as a to-do list app with reminders bolted on.
            </p>
            <p>
              Restock is under active development. The Telegram and WhatsApp bots handle live
              purchase logging and reminders today; this web dashboard is the intelligence layer on
              top — spend analysis, restocking predictions, deal matching, a store finder, and an AI
              assistant you can ask directly about your own household data.
            </p>
          </div>

          <div
            className="mt-16 rounded-2xl px-8 py-10 text-center"
            style={{ background: '#EFE7D6', border: '1px solid rgba(19,43,34,0.12)' }}
          >
            <h3
              className="text-[#132B22] mb-2"
              style={{ ...PLAYFAIR, fontSize: '24px' }}
            >
              Ready to try it?
            </h3>
            <p className="text-[#3a473e] text-sm mb-6">
              Sign in and Restock learns your patterns from your first purchase.
            </p>
            <Link
              href="/sign-up"
              className="inline-block bg-[#132B22] hover:bg-[#0d1f17] text-white font-semibold text-sm px-8 py-3 rounded-full transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
