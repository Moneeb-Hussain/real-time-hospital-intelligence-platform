'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/shared'
import { occupancyColor, cn } from '@/lib/utils'
import type { DepartmentStatus } from '@/types'

export function DepartmentOccupancy({ departments }: { departments: DepartmentStatus[] | null }) {
  if (!departments) {
    return (
      <div className="card h-full p-5 space-y-4 min-h-[280px]">
        <Skeleton className="h-6 w-1/2 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  return (
    <div className="card h-full flex flex-col p-5">
      <h3 className="font-semibold text-text-primary mb-5">Department Occupancy</h3>
      
      <div className="flex-1 flex flex-col gap-4">
        {departments.map((dept, i) => {
          let badgeCls = 'bg-success-bg text-success border-success/30'
          if (dept.status === 'busy') badgeCls = 'bg-brand-50 text-brand border-brand/30'
          if (dept.status === 'critical') badgeCls = 'bg-warning-bg text-warning border-warning/30'
          if (dept.status === 'full') badgeCls = 'bg-critical-bg text-critical border-critical-border'

          return (
            <div key={dept.unitCode} className="flex items-center justify-between p-3 rounded-button border border-border bg-bg-page hover:bg-white transition-colors shadow-sm">
              <div className="w-[120px]">
                <div className="text-sm font-bold text-text-primary">{dept.unitCode}</div>
                <div className="text-[10px] text-text-tertiary truncate">{dept.unitName}</div>
              </div>
              
              <div className="flex-1 mx-4 max-w-[120px]">
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full', occupancyColor(dept.occupancyPct))}
                    initial={{ width: '0%' }}
                    animate={{ width: `${dept.occupancyPct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <div className="text-[10px] text-text-secondary mt-1 text-center font-medium tabular-nums">
                  {dept.occupiedBeds} / {dept.totalBeds} beds
                </div>
              </div>

              <div className="w-[70px] text-right flex flex-col items-end">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-chip font-bold border uppercase tracking-wider', badgeCls)}>
                  {dept.status}
                </span>
                <span className="text-xs font-bold text-text-primary mt-1 tabular-nums">{dept.occupancyPct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
