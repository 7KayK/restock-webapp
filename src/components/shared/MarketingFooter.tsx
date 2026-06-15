import Image from 'next/image'
import Link from 'next/link'
import { TelegramIcon, WhatsAppIcon } from '@/components/shared/ChannelIcons'

export function MarketingFooter() {
  return (
    <footer className="py-16 px-6" style={{ background: '#FAFAF8' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Image
              src="/logo.jpg"
              alt="Restock"
              width={36}
              height={36}
              className="object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
            <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-[160px]">
              Smart household purchase tracking.
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
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#C8CACF] shrink-0">
                  <WhatsAppIcon size={15} />
                </div>
                <span className="text-[10px] text-[#C0C4CC]">coming soon</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#1B3A5C] font-semibold text-sm">Product</h4>
            {['Dashboard', 'Spend analysis', 'Reminders', 'AI assistant', 'Deals'].map((item) => (
              <Link
                key={item}
                href="/dashboard"
                className="text-[#6B7280] text-sm hover:text-[#1B3A5C] transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* For */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#1B3A5C] font-semibold text-sm">For</h4>
            <span className="text-[#6B7280] text-sm">Households</span>
            <span className="text-[#6B7280] text-sm">Individuals</span>
            <span className="text-[#9CA3AF] text-sm">Teams (coming soon)</span>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#1B3A5C] font-semibold text-sm">Company</h4>
            {[
              { label: 'About', href: '#' },
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
              { label: 'Blog', href: '/blog' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[#6B7280] text-sm hover:text-[#1B3A5C] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] pt-6">
          <p className="text-xs text-[#9CA3AF]">© 2026 Restock Hub Solutions</p>
        </div>
      </div>
    </footer>
  )
}
