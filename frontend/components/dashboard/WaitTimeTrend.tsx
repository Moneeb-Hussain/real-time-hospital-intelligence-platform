'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/shared'
import type { ChartDataPoint } from '@/types'

export function WaitTimeTrend({ data }: { data: ChartDataPoint[] | null }) {
  if (!data) {
    return (
      <div className="card p-5">
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-[120px] w-full" />
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex justify-between items-end mb-4">
        <h3 className="font-semibold text-text-primary">Wait Time Trend</h3>
        <span className="text-xs text-text-secondary">minutes</span>
      </div>

      <div className="h-[120px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: '#94A3B8' }} 
              axisLine={false} 
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94A3B8' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <RechartsTooltip 
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 12px' }}
              labelStyle={{ color: '#64748B', marginBottom: 4 }}
              itemStyle={{ color: '#0F172A', fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              name="Wait Time"
              stroke="#2563EB" 
              strokeWidth={2}
              fill="#2563EB" 
              fillOpacity={0.1} 
              activeDot={{ r: 4, strokeWidth: 0, fill: '#2563EB' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
