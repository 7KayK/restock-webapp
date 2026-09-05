'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CategorySpend } from '@/types'
import { formatCurrency } from '@/lib/utils'

const BRAND_COLORS = [
  '#132B22',
  '#132B22',
  '#C9A15A',
  '#22C55E',
  '#EAB308',
  '#EF4444',
  '#6366F1',
  '#EC4899',
]

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[rgba(19,43,34,0.10)] rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="text-[#132B22]/60 text-xs mb-0.5">{payload[0].name}</p>
      <p className="text-[#132B22] font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

interface CategoryChartProps {
  data: CategorySpend[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (!data.length) {
    return (
      <div className="h-[220px] flex items-center justify-center text-[#132B22]/35 text-sm">
        No category data yet
      </div>
    )
  }

  const chartData = data.map((d) => ({ name: d.category, value: d.total }))

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            paddingAngle={2}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: '#132B22', fontSize: 12, opacity: 0.7 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
