'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/shared'
import { cn } from '@/lib/utils'
import type { DepartmentStatus } from '@/types'

function statusStyles(status: DepartmentStatus['status']) {
  switch (status) {
    case 'critical':
    case 'full':
      return { badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500', label: 'CRITICAL' }
    case 'busy':
      return { badge: 'bg-rose-100 text-rose-600', bar: 'bg-[#F472B6]', label: 'BUSY' }
    default:
      return { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', label: 'NORMAL' }
  }
}

export function DepartmentOccupancy({ departments }: { departments: DepartmentStatus[] | null }) {
  if (!departments) {
    return (
      <div className="panel h-full min-h-[340px] p-5 space-y-4">
        <Skeleton className="h-5 w-1/2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  const rows = departments.length ? departments : []

  return (
    <div className="panel h-full min-h-[340px] flex flex-col p-5 bg-white">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">Department Occupancy</h3>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-5">
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold py-8 text-center">No department data</p>
        ) : (
          rows.map((d, i) => {
            const styles = statusStyles(d.status)
            return (
              <div key={d.unitCode}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800">{d.unitCode}</div>
                    <div className="text-[10px] text-slate-400 truncate">{d.unitName}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] tabular-nums text-slate-600 font-semibold">
                      {d.occupiedBeds}/{d.totalBeds}
                      <span className="text-slate-400 font-medium ml-1">({d.occupancyPct}%)</span>
                    </span>
                    <span
                      className={cn(
                        'text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wide',
                        styles.badge
                      )}
                    >
                      {styles.label}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100/90 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', styles.bar)}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, Math.max(0, d.occupancyPct))}%` }}
                    transition={{ duration: 0.65, delay: i * 0.05 }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
