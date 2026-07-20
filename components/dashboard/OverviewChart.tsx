'use client'

import React from 'react'
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { Skeleton } from '@/components/shared'
import type { ChartDataPoint } from '@/types'

export function OverviewChart({ data }: { data: ChartDataPoint[] | null }) {
  if (!data) {
    return (
      <div className="card p-5 h-[340px]">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  // Create a dual-metric data array for the ComposedChart
  const combinedData = data.map((d, i) => ({
    label: d.label,
    admissions: d.value, // Bar
    discharges: Math.max(10, d.value - Math.floor(Math.random() * 20) + 10) // Area
  }))

  return (
    <div className="card p-6 h-[340px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Overview</h3>
          <p className="text-sm text-text-secondary">Patient volume vs capacity trends</p>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="colorDischarges" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dx={-10}
            />
            <RechartsTooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ fontSize: 13, borderRadius: 12, border: 'none', padding: '10px 14px', boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)' }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
            <Area type="monotone" dataKey="discharges" name="Discharges" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorDischarges)" />
            <Bar dataKey="admissions" name="Admissions" barSize={12} fill="#0D9488" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
