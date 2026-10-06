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
  MapPin,
  Users,
  MessageSquare,
  Settings,
  MoreHorizontal,
  ChevronDown,
  Warehouse,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WhatsAppIcon, TelegramIcon } from '@/components/shared/ChannelIcons'
import { isSpendAnalysisVisible, onNavPrefsChanged } from '@/lib/sidebarPrefs'
import type { ChannelStatus } from '@/types'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  // Marks an item that Settings can hide — see src/lib/sidebarPrefs.ts.
  // Only Spend Analysis has one today; undefined means "always shown."
  togglable?: 'spendAnalysis'
}

// Primary — kept deliberately small, and matching the mobile bottom nav's
// own primary set exactly, so desktop and mobile agree on what counts as
// a "main" feature rather than drifting into two different hierarchies.
const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: ShoppingCart, exact: true },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
  { href: '/dashboard/shopping', label: 'Shopping Trip', icon: ShoppingBag },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: MessageSquare },
]

// Secondary — shared by the desktop sidebar's collapsible "More" section
// and the mobile "More" drawer below, so the two stay in lockstep instead
// of silently drifting apart. Teams lives here rather than in Settings on
// purpose: it's a collaboration mode someone needs to discover, not a
// view preference — see the conversation that led to this change. Spend
// Analysis additionally respects the Settings visibility toggle.
const MORE_ITEMS: NavItem[] = [
  { href: '/dashboard/pantry', label: 'Pantry', icon: Warehouse },
  { href: '/dashboard/spend', label: 'Spend Analysis', icon: BarChart3, togglable: 'spendAnalysis' },
  { href: '/dashboard/teams', label: 'Teams', icon: Users },
  { href: '/dashboard/stores', label: 'Nearest Store', icon: MapPin },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: ShoppingCart, exact: true },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
  { href: '/dashboard/shopping', label: 'Shopping', icon: ShoppingBag },
  { href: '/dashboard/assistant', label: 'AI', icon: MessageSquare },
]

const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

// Reads the Spend Analysis visibility preference and keeps it in sync —
// used by both Sidebar and BottomNav so a toggle flipped on the Settings
// page is reflected immediately in whichever nav is on screen, without a
// reload. See src/lib/sidebarPrefs.ts for why a custom event is needed on
// top of the native 'storage' event.
function useVisibleMoreItems(): NavItem[] {
  // Lazy initializer, not an effect — reads the real value on first
  // render, same pattern Settings already uses for autoCalendar.
  const [spendVisible, setSpendVisible] = useState(() => isSpendAnalysisVisible())

  useEffect(() => {
    // Subscription only: setState happens inside the callback when
    // something actually changes, never synchronously in the effect body.
    return onNavPrefsChanged(() => setSpendVisible(isSpendAnalysisVisible()))
  }, [])

  return MORE_ITEMS.filter((item) => item.togglable !== 'spendAnalysis' || spendVisible)
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
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
      <span className="relative z-10">{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [channels, setChannels] = useState<Pick<ChannelStatus, 'telegramId' | 'whatsappNumber'> | null>(null)
  // Collapsed by default — that's the actual point of this section: a
  // short primary list up top, with Pantry/Spend Analysis/Teams/Nearest
  // Store/Settings tucked away until asked for.
  // Open state is derived rather than synced via an effect: either the
  // user's explicit toggle, or forced open because they're already on one
  // of its pages (e.g. a bookmark straight to Teams), so the active item
  // is never hidden inside a collapsed section.
  const [moreOpenToggle, setMoreOpenToggle] = useState(false)
  const moreItems = useVisibleMoreItems()

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

  const moreContainsActive = moreItems.some((item) => isActive(item.href, item.exact))
  const moreOpen = moreOpenToggle || moreContainsActive

  const hasTelegram = !!channels?.telegramId && !!TELEGRAM_BOT

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
          Restock
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(item.href, item.exact)} />
        ))}

        <button
          onClick={() => setMoreOpenToggle(!moreOpen)}
          className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#132B22]/50 hover:bg-[#132B22]/5 hover:text-[#132B22]/70 transition-colors mt-1"
          aria-expanded={moreOpen}
        >
          <span className="flex items-center gap-3">
            <MoreHorizontal className="h-4 w-4 shrink-0" />
            More
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', moreOpen && 'rotate-180')} />
        </button>

        {moreOpen && (
          <div className="space-y-0.5 pl-0">
            {moreItems.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(item.href, item.exact)} />
            ))}
          </div>
        )}
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
  const moreItems = useVisibleMoreItems()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href))

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
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-50 md:hidden bg-white border-t border-[rgba(19,43,34,0.10)] rounded-t-2xl shadow-xl">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[10px] font-semibold text-[#132B22]/35 uppercase tracking-wider mb-2">
              More
            </p>
            <div className="space-y-0.5">
              {moreItems.map(({ href, label, icon: Icon }) => {
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
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white border-t border-[rgba(19,43,34,0.10)] flex items-stretch">
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
