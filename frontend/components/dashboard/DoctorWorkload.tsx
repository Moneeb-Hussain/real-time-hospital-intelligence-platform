'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/shared'

export function DoctorWorkload({ data }: { data: Array<{ label: string; value: number; max: number }> | null }) {
  if (!data) {
    return (
      <div className="card h-full p-5 space-y-4 min-h-[280px]">
        <Skeleton className="h-6 w-1/2 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .replace('Dr. ', '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div className="card h-full flex flex-col p-5">
      <h3 className="font-semibold text-text-primary mb-5">Doctor Workload</h3>
      
      <div className="flex-1 flex flex-col justify-center gap-5">
        {data.map((doc, i) => {
          const ratio = doc.value / doc.max
          let barColor = 'bg-success'
          if (ratio >= 0.85) barColor = 'bg-critical'
          else if (ratio >= 0.60) barColor = 'bg-warning'

          return (
            <div key={doc.label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-ai text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {getInitials(doc.label)}
              </div>
              
              <div className="w-24 text-sm text-text-primary truncate" title={doc.label}>
                {doc.label}
              </div>

              <div className="flex-1 relative">
                <div className="w-full bg-border h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                {ratio >= 0.85 && (
                  <span className="absolute -top-4 right-0 text-[9px] font-bold uppercase tracking-wider text-critical">
                    High Load
                  </span>
                )}
              </div>

              <div className="w-10 text-right text-xs font-semibold tabular-nums text-text-secondary">
                {doc.value}/{doc.max}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
