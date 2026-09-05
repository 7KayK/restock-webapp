'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
    <div className="bg-white border border-[rgba(19,43,34,0.10)] rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="text-[#132B22]/60 text-xs mb-0.5">{label}</p>
      <p className="text-[#132B22] font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

interface SpendBarChartProps {
  data: MonthlySpendPoint[]
}

export function SpendBarChart({ data }: SpendBarChartProps) {
  const hasData = data.some((d) => d.amount > 0)

  if (!hasData) {
    return (
      <div className="h-[280px] flex items-center justify-center text-[#132B22]/35 text-sm">
        No spend data yet — log your first purchase
      </div>
    )
  }

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3d9c4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#132B22', opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 11, fill: '#132B22', opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1ecdd' }} />
          <Bar
            dataKey="amount"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill="#132B22"
                fillOpacity={entry.isCurrentMonth ? 1 : 0.45}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
