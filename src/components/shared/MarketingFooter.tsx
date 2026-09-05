import Image from 'next/image'
import Link from 'next/link'
import { TelegramIcon, WhatsAppIcon } from '@/components/shared/ChannelIcons'

export function MarketingFooter() {
  return (
    <footer className="bg-[#132B22] text-white/65 px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-9">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Restock"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-white font-semibold text-base" style={{ fontFamily: 'var(--font-playfair), "Fraunces", serif' }}>
                Restock
              </span>
            </div>
            <p className="text-xs text-white/55 leading-relaxed max-w-[220px]">
              AI-powered restocking for households and the small businesses that supply them.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/restockchatbot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center text-white hover:bg-[#006faa] transition-colors shrink-0"
              >
                <TelegramIcon size={15} />
              </a>
              <div className="flex items-center gap-2" title="WhatsApp coming soon">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/30 shrink-0">
                  <WhatsAppIcon size={15} />
                </div>
                <span className="text-[10px] text-white/35">coming soon</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wide">Product</h4>
            <Link href="/dashboard" className="text-white/60 text-sm hover:text-white transition-colors">Dashboard</Link>
            <Link href="/dashboard/spend" className="text-white/60 text-sm hover:text-white transition-colors">Spend analysis</Link>
            <Link href="/dashboard/reminders" className="text-white/60 text-sm hover:text-white transition-colors">Reminders</Link>
            <Link href="/dashboard/assistant" className="text-white/60 text-sm hover:text-white transition-colors">AI assistant</Link>
          </div>

          {/* For */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wide">For</h4>
            <span className="text-white/60 text-sm">Households</span>
            <Link href="/dashboard/teams" className="text-white/60 text-sm hover:text-white transition-colors">Small business / Teams</Link>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wide">Company</h4>
            {[
              { label: 'About', href: '/about' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Blog', href: '/blog' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-white/60 text-sm hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/15 pt-5 flex justify-between items-center flex-wrap gap-3">
          <p className="text-xs text-white/45">&copy; 2026 Restock Solutions</p>
          <Link
            href="/sign-up"
            className="text-[13.5px] font-semibold px-4 py-2 rounded-full bg-[#E4C07D] text-[#132B22] hover:bg-[#C9A15A] transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </footer>
  )
}
