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
  Store,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: ShoppingCart },
  { href: '/dashboard/spend', label: 'Spend', icon: BarChart3 },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
  { href: '/dashboard/deals', label: 'Deals', icon: Tag },
  { href: '/dashboard/stores', label: 'Stores', icon: Store },
  { href: '/dashboard/assistant', label: 'Assistant', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Restock
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
