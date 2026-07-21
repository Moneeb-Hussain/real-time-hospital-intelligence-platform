'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/shared'
import { cn } from '@/lib/utils'
import type { HospitalSnapshot } from '@/types'

function barColor(occupancyPct: number): string {
  if (occupancyPct >= 90) return 'bg-orange-500'
  if (occupancyPct >= 75) return 'bg-[#F472B6]'
  return 'bg-emerald-500'
}

export function ResourceBars({ snapshot }: { snapshot: HospitalSnapshot | null }) {
  if (!snapshot) {
    return (
      <div className="panel h-full p-5 space-y-4 min-h-[340px]">
        <Skeleton className="h-5 w-1/3 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-full" />
          </div>
        ))}
      </div>
    )
  }

  const doctorsTotal = snapshot.doctors?.all?.length ?? 0
  const doctorsAvailable = snapshot.doctors?.available?.length ?? 0
  const doctorsOccupied = Math.max(0, doctorsTotal - doctorsAvailable)
  const doctorsPct = doctorsTotal ? Math.round((doctorsOccupied / doctorsTotal) * 100) : 0

  const vents = snapshot.equipment?.ventilator
  const monitors = snapshot.equipment?.cardiacMonitor

  const rows = [
    {
      label: 'ICU Beds',
      available: snapshot.beds.icu.available,
      total: snapshot.beds.icu.total,
      pct: snapshot.beds.icu.occupancyPct,
    },
    {
      label: 'ER Beds',
      available: snapshot.beds.er.available,
      total: snapshot.beds.er.total,
      pct: snapshot.beds.er.occupancyPct,
    },
    {
      label: 'Ward Beds',
      available: snapshot.beds.ward.available,
      total: snapshot.beds.ward.total,
      pct: snapshot.beds.ward.occupancyPct,
    },
    {
      label: 'Doctors',
      available: doctorsAvailable,
      total: doctorsTotal,
      pct: doctorsPct,
    },
    {
      label: 'Ventilators',
      available: vents?.available ?? 0,
      total: vents?.total ?? 0,
      pct: vents?.occupancyPct ?? 0,
    },
    {
      label: 'Monitors',
      available: monitors?.available ?? 0,
      total: monitors?.total ?? 0,
      pct: monitors?.occupancyPct ?? 0,
    },
  ]

  return (
    <div className="panel h-full min-h-[340px] flex flex-col p-5 bg-white">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">Resource Overview</h3>
        <Link href="/resources" className="text-xs font-semibold text-brand hover:underline">
          Manage →
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-3.5">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="flex justify-between items-baseline text-xs mb-1.5">
              <span className="font-medium text-slate-600">{r.label}</span>
              <span className="tabular-nums text-slate-500">
                <span className="font-bold text-slate-800">{r.available}</span>
                <span className="text-slate-400">/{r.total}</span>
                <span className="text-slate-400 ml-1.5">({r.pct}%)</span>
              </span>
            </div>
            <div className="w-full bg-slate-100/90 h-2.5 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', barColor(r.pct))}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(100, Math.max(0, r.pct))}%` }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: i * 0.04 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
