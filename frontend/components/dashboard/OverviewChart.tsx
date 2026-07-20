'use client'

import React, { useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/shared'
import type { ChartDataPoint } from '@/types'

export function OverviewChart({ data }: { data: ChartDataPoint[] | null }) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | '1M' | '6M' | '1Y'>('ALL')

  if (!data) {
    return (
      <div className="card p-5 h-[420px]">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  // Combine admissions (Bar) and discharges (Line) for the ComposedChart
  const combinedData = data.map((d) => ({
    label: d.label,
    admissions: d.value,
    discharges: Math.max(8, d.value - Math.floor(Math.random() * 12) + 6)
  }))

  const filters: Array<'ALL' | '1M' | '6M' | '1Y'> = ['ALL', '1M', '6M', '1Y']

  return (
    <div className="card p-6 h-[430px] flex flex-col justify-between bg-white">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Overview</h3>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeFilter === filter
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 w-full relative h-[250px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dy={8}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dx={-8}
            />
            <RechartsTooltip 
              cursor={{ fill: 'rgba(226, 232, 240, 0.4)', radius: 4 }}
              contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', padding: '10px 14px', boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)' }}
            />
            <Bar dataKey="admissions" name="Admissions" barSize={14} fill="#0D9488" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="discharges" name="Discharges" stroke="#EC4899" strokeWidth={2} strokeDasharray="3 3" dot={{ fill: '#EC4899', r: 3 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom KPI row */}
      <div className="grid grid-cols-3 border-t border-slate-100 pt-4 text-center">
        <div className="border-r border-slate-100 flex flex-col justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Expenses</span>
          <span className="text-base font-bold text-slate-800 mt-0.5">$8,524</span>
          <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-center gap-0.5 mt-0.5">
            ▲ 1.2%
          </span>
        </div>
        <div className="border-r border-slate-100 flex flex-col justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Maintenance</span>
          <span className="text-base font-bold text-slate-800 mt-0.5">$8,524</span>
          <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-center gap-0.5 mt-0.5">
            ▲ 2.0%
          </span>
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Profit</span>
          <span className="text-base font-bold text-slate-800 mt-0.5">$8,524</span>
          <span className="text-[10px] font-bold text-rose-500 flex items-center justify-center gap-0.5 mt-0.5">
            ▼ 0.4%
          </span>
        </div>
      </div>
    </div>
  )
}
