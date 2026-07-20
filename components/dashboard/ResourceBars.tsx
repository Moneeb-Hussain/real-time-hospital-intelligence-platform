'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/shared'
import { occupancyColor, cn } from '@/lib/utils'
import type { HospitalSnapshot } from '@/types'

export function ResourceBars({ snapshot }: { snapshot: HospitalSnapshot | null }) {
  if (!snapshot) {
    return (
      <div className="card h-full p-5 space-y-4">
        <Skeleton className="h-6 w-1/3 mb-6" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    )
  }

  const onShiftCount = snapshot.doctors.all.filter(d => d.onShift).length
  const doctorsPct = onShiftCount > 0 ? Math.round(((onShiftCount - snapshot.doctors.available.length) / onShiftCount) * 100) : 0

  const rows = [
    { label: 'ICU Beds', avail: snapshot.beds.icu.available, total: snapshot.beds.icu.total, pct: snapshot.beds.icu.occupancyPct },
    { label: 'ER Beds', avail: snapshot.beds.er.available, total: snapshot.beds.er.total, pct: snapshot.beds.er.occupancyPct },
    { label: 'Ward Beds', avail: snapshot.beds.ward.available, total: snapshot.beds.ward.total, pct: snapshot.beds.ward.occupancyPct },
    { label: 'Doctors', avail: snapshot.doctors.available.length, total: onShiftCount, pct: doctorsPct },
    { label: 'Ventilators', avail: snapshot.equipment.ventilator.available, total: snapshot.equipment.ventilator.total, pct: snapshot.equipment.ventilator.occupancyPct },
    { label: 'Monitors', avail: snapshot.equipment.cardiacMonitor.available, total: snapshot.equipment.cardiacMonitor.total, pct: snapshot.equipment.cardiacMonitor.occupancyPct },
  ]

  return (
    <div className="card h-full flex flex-col p-5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-text-primary">Resource Overview</h3>
        <Link href="/resources" className="text-sm font-medium text-brand hover:underline">Manage &rarr;</Link>
      </div>

      <div className="flex-1 space-y-5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-text-primary">{r.label}</span>
              <span className="text-xs text-text-secondary font-medium tabular-nums">{r.avail} available <span className="text-text-tertiary font-normal">/ {r.total} total</span></span>
            </div>
            <div className="w-full bg-border h-2.5 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', occupancyColor(r.pct))}
                initial={{ width: '0%' }}
                animate={{ width: `${r.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
              />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary text-right tabular-nums">
              {r.pct}% occupied
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
