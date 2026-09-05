'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/spend': 'Spend Analysis',
  '/dashboard/history': 'History',
  '/dashboard/reminders': 'Reminders',
  '/dashboard/shopping': 'Shopping Trip',
  '/dashboard/deals': 'Deals',
  '/dashboard/teams': 'Teams',
  '/dashboard/stores': 'Nearest Store',
  '/dashboard/assistant': 'AI Assistant',
  '/dashboard/settings': 'Settings',
}

export function Header() {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Dashboard'

  return (
    <header className="h-14 border-b border-[rgba(19,43,34,0.10)] bg-white flex items-center px-4 shrink-0 md:hidden">
      <Image
        src="/logo.png"
        alt="Restock"
        width={30}
        height={30}
        className="object-contain mr-3 shrink-0"
      />
      <span className="text-[#132B22] font-medium text-[15px]" style={{ fontFamily: 'var(--font-playfair), "Fraunces", serif' }}>{title}</span>
    </header>
  )
}
