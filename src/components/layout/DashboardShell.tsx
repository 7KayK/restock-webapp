'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar, BottomNav } from './Sidebar'
import { Header } from './Header'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
