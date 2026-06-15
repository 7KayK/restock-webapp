'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { TelegramIcon } from '@/components/shared/ChannelIcons'

export function MarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100"
      style={{ isolation: 'isolate' }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.jpg"
            alt="Restock"
            width={36}
            height={36}
            className="object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-7">
          <Link
            href="/how-it-works"
            className="text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors"
          >
            How it works
          </Link>
          <a
            href="https://t.me/restockchatbot"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center text-white hover:bg-[#006faa] transition-colors shrink-0"
          >
            <TelegramIcon size={16} />
          </a>
          <Link
            href="/blog"
            className="text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors"
          >
            Blog
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden p-2 -mr-2 text-[#1B3A5C]/55 hover:text-[#1B3A5C] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-64 bg-white shadow-xl md:hidden flex flex-col p-6 gap-6">
            <div className="flex items-center justify-between">
              <Image
                src="/logo.jpg"
                alt="Restock"
                width={30}
                height={30}
                className="object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1 text-[#1B3A5C]/35 hover:text-[#1B3A5C] transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-5">
              <Link
                href="/how-it-works"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-[#1B3A5C] hover:text-[#0F7B6C] transition-colors"
              >
                How it works
              </Link>
              <a
                href="https://t.me/restockchatbot"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-medium text-[#1B3A5C] hover:text-[#0088cc] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#0088cc] flex items-center justify-center text-white shrink-0">
                  <TelegramIcon size={14} />
                </div>
                Telegram
              </a>
              <Link
                href="/blog"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-[#1B3A5C] hover:text-[#0F7B6C] transition-colors"
              >
                Blog
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
