'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
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

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F7B6C] flex items-center justify-center shrink-0">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <span className="text-[#1B3A5C] font-bold text-lg leading-none">Restock</span>
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#0F7B6C] text-white shadow-sm'
                  : 'text-[#1B3A5C]/65 hover:bg-[#0F7B6C]/10 hover:text-[#1B3A5C]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <UserButton />
      </div>
    </aside>
  )
}
