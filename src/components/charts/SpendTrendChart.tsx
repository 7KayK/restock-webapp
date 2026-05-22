'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlySpendPoint } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="text-[#1B3A5C]/60 text-xs mb-0.5">{label}</p>
      <p className="text-[#1B3A5C] font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

interface SpendTrendChartProps {
  data: MonthlySpendPoint[]
}

export function SpendTrendChart({ data }: SpendTrendChartProps) {
  const hasData = data.some((d) => d.amount > 0)

  if (!hasData) {
    return (
      <div className="h-[220px] flex items-center justify-center text-[#1B3A5C]/35 text-sm">
        No spend data yet — log your first purchase
      </div>
    )
  }

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#1B3A5C', opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 11, fill: '#1B3A5C', opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#0F7B6C"
            strokeWidth={2.5}
            dot={{ fill: '#0F7B6C', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#0F7B6C' }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
