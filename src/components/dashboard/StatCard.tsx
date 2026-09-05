'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { ShoppingCart, Bell, DollarSign, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'bell': Bell,
  'dollar-sign': DollarSign,
  'package': Package,
}

interface StatCardProps {
  title: string
  value: string | number
  sub: string
  icon: keyof typeof ICON_MAP
}

function CountUp({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' })
    return controls.stop
  }, [value, count])

  return <motion.span>{rounded}</motion.span>
}

export function StatCard({ title, value, sub, icon }: StatCardProps) {
  const Icon = ICON_MAP[icon]

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white border border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)] hover:border-[#132B22] transition-colors duration-200 cursor-default">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-[#132B22]/60">{title}</CardTitle>
          <div className="w-8 h-8 rounded-lg bg-[#132B22]/10 flex items-center justify-center shrink-0">
            {Icon && <Icon className="h-4 w-4 text-[#132B22]" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#132B22]">
            {typeof value === 'number' ? <CountUp value={value} /> : value}
          </div>
          <p className="text-xs text-[#132B22]/45 mt-0.5">{sub}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28 bg-[#132B22]/10" />
        <Skeleton className="h-8 w-8 rounded-lg bg-[#132B22]/10" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 bg-[#132B22]/10" />
        <Skeleton className="h-3 w-36 mt-1.5 bg-[#132B22]/10" />
      </CardContent>
    </Card>
  )
}
