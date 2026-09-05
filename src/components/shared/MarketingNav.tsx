'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { TelegramIcon } from '@/components/shared/ChannelIcons'

export function MarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#132B22]" style={{ isolation: 'isolate' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="Restock"
            width={32}
            height={32}
            className="object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
          <span className="text-white font-semibold text-lg hidden sm:inline" style={{ fontFamily: 'var(--font-playfair), "Fraunces", serif' }}>
            restock
          </span>
        </Link>

        {/* Right: Nav links + actions */}
        <nav className="hidden md:flex items-center gap-7">
          <Link href="/how-it-works" className="text-sm text-white/80 hover:text-white transition-colors">
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
          <Link href="/blog" className="text-sm text-white/80 hover:text-white transition-colors">
            Blog
          </Link>
          <Link href="/sign-in" className="text-sm text-white/80 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-[13.5px] font-semibold px-4 py-2 rounded-full bg-[#E4C07D] text-[#132B22] hover:bg-[#C9A15A] transition-colors"
          >
            Get started
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden p-2 -mr-2 text-white/70 hover:text-white transition-colors"
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
          <div className="fixed top-0 right-0 bottom-0 z-50 w-64 bg-[#132B22] shadow-xl md:hidden flex flex-col p-6 gap-6">
            <div className="flex items-center justify-between">
              <Image
                src="/logo.jpg"
                alt="Restock"
                width={30}
                height={30}
                className="object-contain"
                style={{ mixBlendMode: 'screen' }}
              />
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1 text-white/50 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-5">
              <Link
                href="/how-it-works"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-white hover:text-[#E4C07D] transition-colors"
              >
                How it works
              </Link>
              <Link
                href="/blog"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-white hover:text-[#E4C07D] transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-white hover:text-[#E4C07D] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold px-4 py-2 rounded-full bg-[#E4C07D] text-[#132B22] text-center"
              >
                Get started
              </Link>
              <a
                href="https://t.me/restockchatbot"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-medium text-white hover:text-[#0088cc] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#0088cc] flex items-center justify-center text-white shrink-0">
                  <TelegramIcon size={14} />
                </div>
                Try on Telegram
              </a>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
