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
  Tag,
  MapPin,
  MessageSquare,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WhatsAppIcon, TelegramIcon } from '@/components/shared/ChannelIcons'
import type { ChannelStatus } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: ShoppingCart, exact: true },
  { href: '/dashboard/spend', label: 'Spend Analysis', icon: BarChart3 },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
  { href: '/dashboard/deals', label: 'Deals', icon: Tag },
  { href: '/dashboard/stores', label: 'Nearest Store', icon: MapPin },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-white border-r border-gray-100 transition-transform duration-200 ease-in-out',
        'md:relative md:translate-x-0 md:flex',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 shrink-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Image
            src="/logo.jpg"
            width={36}
            height={36}
            alt="Restock"
            className="object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="md:hidden rounded-md p-1 text-[#1B3A5C]/40 hover:text-[#1B3A5C] hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'text-[#1B3A5C]/65 hover:bg-[#0F7B6C]/10 hover:text-[#1B3A5C]'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-[#0F7B6C] shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              {!active && (
                <span className="absolute left-0 inset-y-1.5 w-[3px] rounded-r-full bg-[#0F7B6C] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              )}
              <Icon className="relative h-4 w-4 shrink-0 z-10" />
              <span className="relative z-10">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Channel quick-access */}
      {channels !== null && (
        <div className="px-3 py-3 border-t border-gray-100 shrink-0">
          <p className="px-3 text-[10px] font-semibold text-[#1B3A5C]/35 uppercase tracking-wider mb-1.5">
            Quick Access
          </p>
          {hasAnyBot ? (
            <div className="space-y-0.5">
              {hasTelegram && (
                <a
                  href={`https://t.me/${TELEGRAM_BOT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#1B3A5C]/60 hover:bg-[#229ED9]/10 hover:text-[#229ED9] transition-colors"
                >
                  <TelegramIcon size={15} className="shrink-0" />
                  Open Telegram
                </a>
              )}
              {hasWhatsApp && (
                <a
                  href={`https://wa.me/${WHATSAPP_PHONE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#1B3A5C]/60 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors"
                >
                  <WhatsAppIcon size={15} className="shrink-0" />
                  Open WhatsApp
                </a>
              )}
            </div>
          ) : (
            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#1B3A5C]/45 hover:bg-gray-100 hover:text-[#1B3A5C] transition-colors"
            >
              Connect a bot
            </Link>
          )}
        </div>
      )}

      {/* User */}
      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <UserButton />
      </div>
    </aside>
  )
}
