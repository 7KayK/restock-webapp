'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  BarChart3,
  History,
  Bell,
  ShoppingBag,
  Tag,
  MapPin,
  Users,
  MessageSquare,
  Settings,
  MoreHorizontal,
  Warehouse,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WhatsAppIcon, TelegramIcon } from '@/components/shared/ChannelIcons'
import type { ChannelStatus } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: ShoppingCart, exact: true },
  { href: '/dashboard/pantry', label: 'Pantry', icon: Warehouse },
  { href: '/dashboard/spend', label: 'Spend Analysis', icon: BarChart3 },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
  { href: '/dashboard/shopping', label: 'Shopping Trip', icon: ShoppingBag },
  { href: '/dashboard/deals', label: 'Deals', icon: Tag },
  { href: '/dashboard/teams', label: 'Teams', icon: Users },
  { href: '/dashboard/stores', label: 'Nearest Store', icon: MapPin },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const BOTTOM_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: ShoppingCart, exact: true },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
  { href: '/dashboard/shopping', label: 'Shopping', icon: ShoppingBag },
  { href: '/dashboard/assistant', label: 'AI', icon: MessageSquare },
]

const MORE_ITEMS = [
  { href: '/dashboard/pantry', label: 'Pantry', icon: Warehouse },
  { href: '/dashboard/spend', label: 'Spend Analysis', icon: BarChart3 },
  { href: '/dashboard/deals', label: 'Deals', icon: Tag },
  { href: '/dashboard/teams', label: 'Teams', icon: Users },
  { href: '/dashboard/stores', label: 'Nearest Store', icon: MapPin },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER

export function Sidebar() {
  const pathname = usePathname()
  const [channels, setChannels] = useState<Pick<ChannelStatus, 'telegramId' | 'whatsappNumber'> | null>(null)

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setChannels({
            telegramId: json.data.telegramId,
            whatsappNumber: json.data.whatsappNumber,
          })
        }
      })
      .catch(() => {})
  }, [])

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  const hasTelegram = !!channels?.telegramId && !!TELEGRAM_BOT
  const hasWhatsApp = !!channels?.whatsappNumber && !!WHATSAPP_PHONE
  const hasAnyBot = hasTelegram || hasWhatsApp

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-[rgba(19,43,34,0.10)] shrink-0">
      {/* Logo */}
      <div className="flex items-center px-5 h-16 border-b border-[rgba(19,43,34,0.10)] shrink-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden bg-[#EFE7D6] border border-[rgba(19,43,34,0.10)]"
        >
          <Image
            src="/logo.png"
            width={36}
            height={36}
            alt="Restock"
            className="object-contain"
          />
        </div>
        <span className="ml-2.5 font-semibold text-[15px] text-[#132B22]" style={{ fontFamily: 'var(--font-playfair), "Fraunces", serif' }}>
          restock
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'text-[#132B22]/65 hover:bg-[#132B22]/10 hover:text-[#132B22]'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-[#132B22] shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              {!active && (
                <span className="absolute left-0 inset-y-1.5 w-[3px] rounded-r-full bg-[#132B22] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              )}
              <Icon className="relative h-4 w-4 shrink-0 z-10" />
              <span className="relative z-10">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Channel quick-access */}
      {channels !== null && (
        <div className="px-3 py-3 border-t border-[rgba(19,43,34,0.10)] shrink-0">
          <p className="px-3 text-[10px] font-semibold text-[#132B22]/35 uppercase tracking-wider mb-1.5">
            Quick Access
          </p>
          <div className="space-y-0.5">
              {hasTelegram ? (
                <a
                  href={`https://t.me/${TELEGRAM_BOT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#132B22]/60 hover:bg-[#229ED9]/10 hover:text-[#229ED9] transition-colors"
                >
                  <TelegramIcon size={15} className="shrink-0" />
                  Open Telegram
                </a>
              ) : (
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#132B22]/45 hover:bg-[#EFE7D6] hover:text-[#132B22] transition-colors"
                >
                  Connect Telegram
                </Link>
              )}
              {/* WhatsApp pending Meta verification */}
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#132B22]/25 cursor-not-allowed select-none">
                <WhatsAppIcon size={15} className="shrink-0" />
                <span>WhatsApp</span>
                <span className="text-[10px] font-normal text-[#132B22]/20">(coming soon)</span>
              </div>
            </div>
        </div>
      )}

      {/* User */}
      <div className="px-5 py-4 border-t border-[rgba(19,43,34,0.10)] shrink-0">
        <UserButton />
      </div>
    </aside>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href))

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* More drawer */}
      {moreOpen && (
        <div className="fixed bottom-16 inset-x-0 z-50 md:hidden bg-white border-t border-[rgba(19,43,34,0.10)] rounded-t-2xl shadow-xl">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[10px] font-semibold text-[#132B22]/35 uppercase tracking-wider mb-2">
              More
            </p>
            <div className="space-y-0.5">
              {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]',
                      active
                        ? 'bg-[#132B22] text-white'
                        : 'text-[#132B22]/65 hover:bg-[#132B22]/10 hover:text-[#132B22]'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden h-16 bg-white border-t border-[rgba(19,43,34,0.10)] flex items-stretch">
        {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors',
                active ? 'text-[#132B22]' : 'text-[#132B22]/45'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          aria-label="More navigation items"
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors',
            isMoreActive || moreOpen ? 'text-[#132B22]' : 'text-[#132B22]/45'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>
    </>
  )
}
