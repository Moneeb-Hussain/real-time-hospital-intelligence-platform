'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/shared'
import type { ChartDataPoint } from '@/types'

export function AdmissionsChart({ data }: { data: ChartDataPoint[] | null }) {
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
      <h3 className="font-semibold text-text-primary mb-4">7-Day Admissions</h3>

      <div className="h-[120px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: '#94A3B8' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94A3B8' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <RechartsTooltip 
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 12px' }}
              labelStyle={{ color: '#64748B', marginBottom: 4 }}
              itemStyle={{ color: '#0F172A', fontWeight: 600 }}
            />
            <Bar dataKey="value" name="Admissions" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === data.length - 1 ? '#2563EB' : '#BFDBFE'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
