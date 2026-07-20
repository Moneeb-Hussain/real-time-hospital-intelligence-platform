'use client'

import React from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/shared'
import type { ChartDataPoint } from '@/types'

const PRIORITY_CONFIG: Record<string, { color: string; label: string; bgClass: string }> = {
  P1: { color: '#0D9488', label: 'Critical', bgClass: 'bg-teal-500' }, // Teal
  P2: { color: '#3B82F6', label: 'Urgent', bgClass: 'bg-blue-500' },   // Blue
  P3: { color: '#6366F1', label: 'Moderate', bgClass: 'bg-indigo-500' } // Purple/Indigo
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

  // Get values for P1, P2, P3 (group P4 into P3 to keep 3 rings like the screenshot)
  const p1Val = data.find((d) => d.label === 'P1')?.value ?? 0
  const p2Val = data.find((d) => d.label === 'P2')?.value ?? 0
  const p3Val = (data.find((d) => d.label === 'P3')?.value ?? 0) + (data.find((d) => d.label === 'P4')?.value ?? 0)
  const total = p1Val + p2Val + p3Val

  // Recharts RadialBarChart expects data from inside out
  const chartData = [
    { name: 'Moderate', value: p3Val, fill: '#6366F1' },
    { name: 'Urgent', value: p2Val, fill: '#3B82F6' },
    { name: 'Critical', value: p1Val, fill: '#0D9488' }
  ]

  const legendItems = [
    { label: 'Critical', count: p1Val, color: 'bg-teal-500', name: 'Facebook' }, // Replaced labels with social-like indicators
    { label: 'Urgent', count: p2Val, color: 'bg-blue-500', name: 'Twitter' },
    { label: 'Moderate', count: p3Val, color: 'bg-indigo-500', name: 'Instagram' }
  ]

  return (
    <div className="card h-[430px] flex flex-col p-6 bg-white justify-between">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-800">Social Source</h3>
        </div>
      </div>
      
      <div className="relative flex-1 flex items-center justify-center h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="35%"
            outerRadius="85%"
            barSize={9}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              background={{ fill: '#F1F5F9' }}
              dataKey="value"
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
          <motion.span 
            className="text-2xl font-extrabold text-slate-800 tabular-nums mt-0.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            {total}
          </motion.span>
        </div>
      </div>

      {/* Legend Styled Exactly Like Screenshot */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
        {legendItems.map((item, i) => (
          <div key={i} className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
              <span className="font-semibold text-slate-600">{item.name}</span>
            </div>
            <span className="text-xs font-bold text-slate-400 mt-1 tabular-nums">
              {item.count} sales
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
