'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/spend': 'Spend Analysis',
  '/dashboard/history': 'History',
  '/dashboard/reminders': 'Reminders',
  '/dashboard/deals': 'Deals',
  '/dashboard/stores': 'Nearest Store',
  '/dashboard/assistant': 'AI Assistant',
  '/dashboard/settings': 'Settings',
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Dashboard'

  return (
    <header className="h-16 border-b border-gray-100 bg-white flex items-center px-4 shrink-0 md:hidden">
      <button
        onClick={onMenuClick}
        aria-label="Open sidebar"
        className="mr-4 rounded-md p-1.5 text-[#1B3A5C]/50 hover:text-[#1B3A5C] hover:bg-gray-100 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-[#1B3A5C] font-semibold">{title}</span>
    </header>
  )
}
