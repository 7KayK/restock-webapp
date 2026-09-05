'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MarketingNav } from '@/components/shared/MarketingNav'
import { MarketingFooter } from '@/components/shared/MarketingFooter'

const FRAUNCES: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Fraunces", Georgia, serif',
}
const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono), "JetBrains Mono", monospace',
}

const FAQS = [
  {
    q: 'Is my purchase data private?',
    a: "Yes — your purchase history is tied to your account and used only to power your own reminders and spending view. It's never sold or shared.",
  },
  {
    q: 'Does it work for a small shop, not just a household?',
    a: 'Yes. Restock for Teams extends the same tracking and reminders to a small business or shared household, with everyone’s purchases in one shared view.',
  },
  {
    q: 'Do I have to link my bank or card?',
    a: "No. Restock never connects to your bank or card — you log purchases by message, receipt photo, or manual entry, so there's nothing financial to link.",
  },
  {
    q: 'What if I want to ignore a reminder?',
    a: "Snooze it or dismiss it with one tap — Restock adjusts and won't ask again until the pattern says it's actually time.",
  },
]

function Receipt() {
  const items: [string, string][] = [
    ['2  Olive oil 500ml', '$14.98'],
    ['1  Coffee 340g', '$9.49'],
    ['1  Paper towels 6pk', '$17.97'],
    ['2  Rice 2kg', '$11.98'],
    ['1  Dish soap', '$3.49'],
    ['4  Canned tomatoes', '$6.36'],
    ['1  Pasta 500g', '$1.99'],
    ['2  Milk 1L', '$5.98'],
  ]
  return (
    <div
      className="mx-auto w-[290px] px-6 pt-7 pb-8 text-[#16211B]"
      style={{
        ...MONO,
        background: '#FBF7EE',
        transform: 'rotate(2deg)',
        boxShadow: '0 40px 80px rgba(0,0,0,.45)',
        clipPath:
          'polygon(0% 0%,100% 0%,100% 97%,96% 100%,92% 97%,88% 100%,84% 97%,80% 100%,76% 97%,72% 100%,68% 97%,64% 100%,60% 97%,56% 100%,52% 97%,48% 100%,44% 97%,40% 100%,36% 97%,32% 100%,28% 97%,24% 100%,20% 97%,16% 100%,12% 97%,8% 100%,4% 97%,0% 100%)',
      }}
    >
      <div className="text-center font-semibold tracking-[.08em] text-[15px] mb-1" style={FRAUNCES}>
        CORNER MARKET
      </div>
      <div className="text-center text-[10.5px] tracking-[.1em] text-[#6b776d] mb-4">
        104 MARKET ST &middot; WED, SEP 2
      </div>
      {items.map(([label, price]) => (
        <div
          key={label}
          className="flex justify-between text-[12.5px] py-1.5 border-b border-dashed border-[rgba(19,43,34,0.14)]"
        >
          <span>{label}</span>
          <span>{price}</span>
        </div>
      ))}
      <div className="flex justify-between text-[13px] pt-2.5">
        <span>Subtotal</span>
        <span>$72.24</span>
      </div>
      <div className="flex justify-between text-[13px] py-1.5">
        <span>Tax</span>
        <span>$5.06</span>
      </div>
      <div className="flex justify-between text-[13px] font-bold pt-3 mt-1.5 border-t border-[#16211B]">
        <span>Total</span>
        <span>$77.30</span>
      </div>
      <div className="mt-4 text-[10.5px] text-[#2E5744] text-center leading-relaxed">
        <span className="text-[#C9A15A] font-bold">RESTOCK READ —</span> olive oil &amp; coffee
        are moving fast; expect a reorder nudge in about 4 days.
      </div>
    </div>
  )
}

function PhoneMock() {
  const rows: [string, number][] = [
    ['Olive oil', 30],
    ['Coffee', 45],
    ['Paper towels', 15],
    ['Rice', 80],
  ]
  return (
    <div className="relative w-[210px] h-[420px] bg-[#132B22] rounded-[36px] p-2.5 shadow-[0_34px_70px_rgba(19,43,34,.35)]">
      <div className="absolute -top-3 -right-3.5 z-10 rotate-6 rounded-full bg-[#E4C07D] px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[.06em] text-[#132B22] shadow-lg">
        Coming soon
      </div>
      <div className="relative h-full w-full rounded-[28px] bg-[#F7F2E7] px-3.5 pt-6 pb-3.5 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-[#132B22]" />
        <div className="flex justify-between text-[9.5px] text-[#6b776d] mb-3.5" style={MONO}>
          <span>9:41</span>
          <span>&bull;&bull;&bull; 100%</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3.5 font-semibold text-[14px] text-[#132B22]" style={FRAUNCES}>
          <span className="w-1.5 h-1.5 rounded-[2px] bg-[#C9A15A] inline-block" /> Restock
        </div>
        <div className="flex justify-between items-center text-[10.5px] text-[#5b6a5d] mb-2.5">
          <span>This week&rsquo;s shelf</span>
          <span className="rounded-full bg-[#E4C07D] text-[#132B22] font-bold px-2 py-0.5 text-[9px]">3 low</span>
        </div>
        {rows.map(([label, pct]) => (
          <div key={label} className="mb-2.5">
            <span className="block text-[10.5px] text-[#16211B] mb-1">{label}</span>
            <div className="w-full h-1.5 rounded bg-[rgba(19,43,34,0.14)] overflow-hidden">
              <div className="h-full rounded bg-[#C9A15A]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
        <div className="absolute left-3.5 right-3.5 bottom-3.5 rounded-full bg-white border border-[rgba(19,43,34,0.14)] px-3.5 py-2 text-[10.5px] text-[#8a9389] shadow">
          Ask Restock&hellip;
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F2E7]">
      <MarketingNav />

      {/* HERO */}
      <div className="bg-[#132B22] px-6 md:px-[6vw] py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_0.85fr] gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <h1
              className="text-white leading-[1.06] mb-6"
              style={{ ...FRAUNCES, fontSize: 'clamp(36px, 4.6vw, 58px)', fontWeight: 500 }}
            >
              Never run out
              <br />
              of anything again.
            </h1>
            <p className="text-white/78 text-[17px] leading-relaxed max-w-[480px] mb-8">
              Restock learns your patterns — what runs low, how fast, and when — so nothing
              catches you empty-handed, wherever in the world you shop.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-3.5">
              <Link
                href="/sign-up"
                className="inline-block rounded-full bg-[#E4C07D] text-[#132B22] font-semibold text-[13.5px] px-5 py-2.5 hover:bg-[#C9A15A] transition-colors"
              >
                Get started free
              </Link>
              <a
                href="https://t.me/restockchatbot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full border border-white/40 text-white font-semibold text-[13.5px] px-5 py-2.5 hover:bg-white/10 transition-colors"
              >
                Chat with it on Telegram
              </a>
            </div>
            <div className="text-white/50 text-[12.5px]">Free to start. No card required.</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
          >
            <Receipt />
          </motion.div>
        </div>
      </div>

      {/* LEDE */}
      <div className="px-6 pt-16 pb-5 text-center">
        <p className="text-[19px] leading-relaxed max-w-[680px] mx-auto mb-2.5 text-[#2c372e]">
          And keeps thinking after you check out. It remembers every purchase and learns the
          pattern underneath.
        </p>
        <p className="text-[14.5px] text-[#5b6a5d]">
          Pick the day and time — Restock sends a short note on what&rsquo;s running low.
        </p>
      </div>

      {/* CHAT MOCKUP */}
      <section className="px-6 py-16">
        <div className="text-center text-[11.5px] font-bold tracking-[.16em] uppercase text-[#2E5744] mb-3.5">
          The conversation, restocked
        </div>
        <div className="max-w-[560px] mx-auto bg-white border border-[rgba(19,43,34,0.14)] rounded-[22px] px-6 pt-6 pb-7 shadow-[0_30px_70px_rgba(19,43,34,.10)]">
          <div className="flex items-center justify-between pb-4 mb-4.5 border-b border-[rgba(19,43,34,0.14)]">
            <div className="flex items-center gap-2.5 text-[13.5px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="#132B22" strokeWidth="1.6" className="w-5 h-5">
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
              This week&rsquo;s shelf
            </div>
            <span className="text-[11px] font-bold bg-[#E4C07D] text-[#132B22] px-2.5 py-1 rounded-full">
              3 running low
            </span>
          </div>
          <div className="max-w-[78%] px-4 py-3 rounded-2xl rounded-br-[4px] bg-[#EFE7D6] ml-auto mb-3 text-[14px] leading-relaxed">
            What&rsquo;s running low this week?
          </div>
          <div className="max-w-[78%] px-4 py-3 rounded-2xl rounded-bl-[4px] bg-[#132B22] text-white mb-3 text-[14px] leading-relaxed">
            Olive oil, coffee, and paper towels — all inside your usual reorder window. Coffee&rsquo;s
            moving faster than last month, though.
          </div>
          <div
            className="bg-[#EFE7D6] border-l-[3px] border-[#C9A15A] rounded-[10px] px-4.5 py-4 my-4 text-[16px] text-[#132B22] leading-relaxed italic"
            style={FRAUNCES}
          >
            &ldquo;You&rsquo;re using coffee about 20% faster than your six-week average.&rdquo;
            <span className="block mt-2 not-italic text-[11.5px] text-[#6b776d]" style={{ fontFamily: 'inherit' }}>
              <span className="font-sans">— based on your last 6 weeks of purchases</span>
            </span>
          </div>
          <div className="max-w-[78%] px-4 py-3 rounded-2xl rounded-br-[4px] bg-[#EFE7D6] ml-auto mb-3 text-[14px] leading-relaxed">
            Is that new, or just seasonal?
          </div>
          <div className="max-w-[78%] px-4 py-3 rounded-2xl rounded-bl-[4px] bg-[#132B22] text-white text-[14px] leading-relaxed">
            Looks new. Worth watching for a couple more weeks before we call it a real pattern.
          </div>
        </div>
      </section>

      {/* FEATURE 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-6 py-16 max-w-6xl mx-auto">
        <div>
          <div className="text-[11.5px] font-bold tracking-[.16em] uppercase text-[#2E5744] mb-3.5">
            In the moment
          </div>
          <h2 className="text-[#132B22] leading-tight mb-3.5" style={{ ...FRAUNCES, fontSize: 'clamp(26px,3vw,38px)' }}>
            Ask it from the aisle.
          </h2>
          <p className="text-[15.5px] text-[#3a473e] leading-relaxed max-w-[440px]">
            Standing in the store and not sure if you already have olive oil at home? Text it. It
            already knows.
          </p>
        </div>
        <div>
          <div className="bg-white border border-[rgba(19,43,34,0.14)] rounded-2xl p-5.5 max-w-[360px] shadow-[0_20px_44px_rgba(19,43,34,.08)]">
            <div className="text-[13px] text-[#5b6a5d] mb-2.5">You, from the store:</div>
            <div className="bg-[#132B22] text-white rounded-xl px-3.5 py-3 text-[13.5px] leading-relaxed">
              &ldquo;do we need olive oil?&rdquo; &rarr; &ldquo;You&rsquo;ve got about half a bottle
              left — good for two more weeks. Skip it.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE 2 (reversed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-6 py-16 max-w-6xl mx-auto">
        <div className="order-2 md:order-1">
          <div
            className="bg-[#EFE7D6] rounded-2xl p-6.5 max-w-[360px] text-[17px] text-[#132B22] leading-relaxed italic"
            style={FRAUNCES}
          >
            &ldquo;An item you haven&rsquo;t reordered in 41 days might just be gone for good —
            not forgotten.&rdquo;
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="text-[11.5px] font-bold tracking-[.16em] uppercase text-[#2E5744] mb-3.5">
            Memory
          </div>
          <h2 className="text-[#132B22] leading-tight mb-3.5" style={{ ...FRAUNCES, fontSize: 'clamp(26px,3vw,38px)' }}>
            Every purchase leaves a trace.
          </h2>
          <p className="text-[15.5px] text-[#3a473e] leading-relaxed max-w-[440px]">
            Restock quietly builds a pattern from what you buy — how fast it goes, and roughly
            when you&rsquo;ll want it again — so the next reminder is a fact, not a guess.
          </p>
        </div>
      </div>

      {/* CONNECT */}
      <div className="text-center px-6 pt-20 pb-16">
        <h2 className="max-w-[640px] mx-auto mb-4" style={{ ...FRAUNCES, fontSize: 'clamp(28px,3.6vw,42px)', color: '#132B22' }}>
          It connects spending you never thought to compare.
        </h2>
        <p className="text-[15.5px] text-[#3a473e] max-w-[520px] mx-auto leading-relaxed">
          Groceries here, cleaning supplies there — Restock ties it into one picture of what your
          household or shop actually spends on staying stocked.
        </p>
      </div>

      {/* COMING SOON: MOBILE APP */}
      <section className="px-6 py-16 bg-[#EFE7D6]">
        <div className="max-w-[980px] mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-16 items-center text-center md:text-left">
          <div>
            <div className="text-[11.5px] font-bold tracking-[.16em] uppercase text-[#2E5744] mb-3.5">
              Coming soon
            </div>
            <h2 className="text-[#132B22] leading-tight mb-3.5" style={{ ...FRAUNCES, fontSize: 'clamp(26px,3vw,38px)' }}>
              Restock, in your pocket.
            </h2>
            <p className="text-[15.5px] text-[#3a473e] leading-relaxed max-w-[460px] mx-auto md:mx-0">
              Right now, Restock lives on the web — open restock.chat on your phone or laptop and
              it works exactly the same, nothing to install. A native app for iOS and Android is
              on the way.
            </p>
            <Link
              href="/sign-up"
              className="inline-block mt-5.5 rounded-full bg-[#E4C07D] text-[#132B22] font-semibold text-[13.5px] px-5 py-2.5 hover:bg-[#C9A15A] transition-colors"
            >
              Start on the web
            </Link>
          </div>
          <div className="flex justify-center mt-5 md:mt-0">
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="text-center text-[11.5px] font-bold tracking-[.16em] uppercase text-[#2E5744] mb-3.5">
          Common questions, answered
        </div>
        <div className="max-w-[640px] mx-auto">
          {FAQS.map((item, i) => (
            <div key={item.q} className="border-t border-[rgba(19,43,34,0.14)] last:border-b">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center gap-4 py-5 text-left cursor-pointer"
              >
                <span className="text-[15.5px] font-medium text-[#132B22]">{item.q}</span>
                <span className="text-[20px] text-[#C9A15A] font-light shrink-0">
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <p className="pb-5 -mt-2 text-[14.5px] text-[#3a473e] leading-relaxed max-w-[560px]">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
