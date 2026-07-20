'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/shared'
import type { ChartDataPoint } from '@/types'

const PRIORITY_CONFIG: Record<string, { color: string; gradient: string; label: string }> = {
  P1: { color: '#FF6B6B', gradient: '#FF8787', label: 'Critical' },
  P2: { color: '#FFB347', gradient: '#FFCC80', label: 'Urgent' },
  P3: { color: '#6C5CE7', gradient: '#A29BFE', label: 'Moderate' },
  P4: { color: '#00D2D3', gradient: '#55EFC4', label: 'Stable' }
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value, fill } = payload[0].payload
  const config = PRIORITY_CONFIG[name]
  return (
    <div className="bg-bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
        <span className="text-sm font-bold text-text-primary">{name}</span>
        <span className="text-xs text-text-secondary">({config?.label})</span>
      </div>
      <div className="text-lg font-bold text-text-primary">{value} patients</div>
    </div>
  )
}

export function PriorityMixChart({ data }: { data: ChartDataPoint[] | null }) {
  if (!data) {
    return (
      <div className="card h-full p-6 flex flex-col items-center justify-center min-h-[340px]">
        <Skeleton className="w-36 h-36 rounded-full mb-4" />
        <Skeleton className="w-32 h-4" />
      </div>
    )
  }

  const chartData = data.map(d => ({
    name: d.label,
    value: d.value,
    fill: PRIORITY_CONFIG[d.label]?.color || '#94A3B8'
  }))

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="card h-[340px] flex flex-col p-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Traffic Source</h3>
          <p className="text-xs text-text-secondary mt-0.5">Patient priority distribution</p>
        </div>
      </div>
      
      <div className="relative flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={4}
              dataKey="value"
              cornerRadius={6}
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.span 
            className="text-3xl font-extrabold text-text-primary tabular-nums"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            {total}
          </motion.span>
          <span className="text-xs text-text-secondary font-medium mt-0.5">Total Patients</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
        {data.map((d, i) => {
          const config = PRIORITY_CONFIG[d.label]
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
          return (
            <motion.div 
              key={d.label} 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: config?.color }} 
              />
              <span className="text-xs text-text-secondary flex-1 truncate">
                {d.label} <span className="text-text-tertiary">·</span> {config?.label}
              </span>
              <span className="text-xs font-bold text-text-primary tabular-nums">{pct}%</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
