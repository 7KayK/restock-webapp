import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  sub: string
  icon: LucideIcon
}

export function StatCard({ title, value, sub, icon: Icon }: StatCardProps) {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[#1B3A5C]/60">{title}</CardTitle>
        <div className="w-8 h-8 rounded-lg bg-[#0F7B6C]/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-[#0F7B6C]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#1B3A5C]">{value}</div>
        <p className="text-xs text-[#1B3A5C]/45 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-36 mt-1.5" />
      </CardContent>
    </Card>
  )
}
