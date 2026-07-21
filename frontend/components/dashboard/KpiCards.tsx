'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, BedDouble, Activity } from 'lucide-react'
import { SkeletonKpiCard } from '@/components/shared'
import { cn } from '@/lib/utils'
import type { KpiData } from '@/types'

type StatusTone = 'good' | 'watch' | 'critical'

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide',
        tone === 'good' && 'bg-emerald-50 text-emerald-700',
        tone === 'watch' && 'bg-amber-50 text-amber-700',
        tone === 'critical' && 'bg-rose-50 text-rose-700'
      )}
    >
      {label}
    </span>
  )
}

function IconBubble({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | StatusTone
}) {
  return (
    <div
      className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
        tone === 'neutral' && 'bg-slate-50 text-slate-600',
        tone === 'good' && 'bg-emerald-50 text-emerald-600',
        tone === 'watch' && 'bg-amber-50 text-amber-600',
        tone === 'critical' && 'bg-rose-50 text-rose-600'
      )}
    >
      {children}
    </div>
  )
}

function OccupancyBar({ pct, tone }: { pct: number; tone: StatusTone }) {
  const width = Math.min(100, Math.max(0, pct))
  return (
    <div className="mt-2.5 w-full max-w-[140px]">
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            tone === 'good' && 'bg-emerald-500',
            tone === 'watch' && 'bg-amber-500',
            tone === 'critical' && 'bg-orange-500'
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function waitTone(minutes: number): StatusTone {
  if (minutes >= 60) return 'critical'
  if (minutes >= 30) return 'watch'
  return 'good'
}

function waitLabel(minutes: number): string {
  if (minutes >= 60) return 'High'
  if (minutes >= 30) return 'Elevated'
  return 'On track'
}

function occupancyTone(pct: number): StatusTone {
  if (pct >= 85) return 'critical'
  if (pct >= 70) return 'watch'
  return 'good'
}

function opsStatus(icuOccupancy: number, avgWait: number, bedOccupancy: number): {
  label: string
  tone: StatusTone
  detail: string
} {
  if (icuOccupancy >= 90) {
    return { label: 'Critical', tone: 'critical', detail: `ICU nearly full (${icuOccupancy}%)` }
  }
  if (avgWait >= 60) {
    return { label: 'Under pressure', tone: 'critical', detail: `Long waits · avg ${avgWait} min` }
  }
  if (icuOccupancy >= 75 || bedOccupancy >= 80 || avgWait >= 30) {
    return {
      label: 'Watch',
      tone: 'watch',
      detail:
        icuOccupancy >= 75
          ? `ICU busy (${icuOccupancy}%)`
          : bedOccupancy >= 80
            ? `Beds ${bedOccupancy}% occupied`
            : `Wait rising · ${avgWait} min`,
    }
  }
  return { label: 'Stable', tone: 'good', detail: 'Capacity within normal range' }
}

export function KpiCards({ data }: { data: KpiData | null; healthScore?: number | null }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </div>
    )
  }

  const activePatients = data.activePatients ?? data.waitingPatients + data.criticalPatients
  const waiting = data.waitingPatients ?? 0
  const critical = data.criticalPatients ?? 0

  const bedOccupancyPct =
    data.bedOccupancyPct ??
    (data.bedsTotal && data.bedsOccupied != null
      ? Math.min(100, Math.round((data.bedsOccupied / data.bedsTotal) * 100))
      : 0)

  const bedsOccupied = data.bedsOccupied ?? 0
  const bedsTotal = data.bedsTotal ?? 0
  const avgWait = data.avgWaitMinutes || 0

  const icuTotal = data.icuBedsTotal || 0
  const icuAvailable = data.icuBedsAvailable ?? 0
  const icuOccupancy = icuTotal
    ? Math.round(((icuTotal - icuAvailable) / icuTotal) * 100)
    : 0

  const waitStatus = waitTone(avgWait)
  const bedTone = occupancyTone(bedOccupancyPct)
  const ops = opsStatus(icuOccupancy, avgWait, bedOccupancyPct)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Active patients — plain count, no fake % */}
      <motion.div
        className="panel p-5 bg-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-start gap-3.5">
          <IconBubble>
            <Users className="w-5 h-5" />
          </IconBubble>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Patients
            </p>
            <p className="text-2xl font-bold text-slate-800 tabular-nums leading-none mt-1">
              {activePatients}
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {waiting} waiting
              {critical > 0 && (
                <span className="text-rose-600 font-semibold"> · {critical} critical</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Avg wait — minutes + status badge, no 100% ring */}
      <motion.div
        className="panel p-5 bg-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
      >
        <div className="flex items-start gap-3.5">
          <IconBubble tone={waitStatus}>
            <Clock className="w-5 h-5" />
          </IconBubble>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Avg Wait
              </p>
              <StatusPill label={waitLabel(avgWait)} tone={waitStatus} />
            </div>
            <p className="text-2xl font-bold text-slate-800 tabular-nums leading-none mt-1">
              {avgWait}
              <span className="text-sm font-semibold text-slate-400 ml-1">min</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">Target under 30 min</p>
          </div>
        </div>
      </motion.div>

      {/* Bed occupancy — only real % that users understand */}
      <motion.div
        className="panel p-5 bg-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <div className="flex items-start gap-3.5">
          <IconBubble tone={bedTone}>
            <BedDouble className="w-5 h-5" />
          </IconBubble>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Bed Occupancy
              </p>
              <StatusPill
                label={bedTone === 'good' ? 'Normal' : bedTone === 'watch' ? 'Busy' : 'High'}
                tone={bedTone}
              />
            </div>
            <p className="text-2xl font-bold text-slate-800 tabular-nums leading-none mt-1">
              {bedOccupancyPct}
              <span className="text-sm font-semibold text-slate-400 ml-0.5">%</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {bedsOccupied} of {bedsTotal} beds in use
            </p>
            <OccupancyBar pct={bedOccupancyPct} tone={bedTone} />
          </div>
        </div>
      </motion.div>

      {/* Ops status — plain language instead of opaque "90" score */}
      <motion.div
        className="panel p-5 bg-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <div className="flex items-start gap-3.5">
          <IconBubble tone={ops.tone}>
            <Activity className="w-5 h-5" />
          </IconBubble>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Hospital Status
            </p>
            <p
              className={cn(
                'text-xl font-bold leading-tight mt-1',
                ops.tone === 'good' && 'text-emerald-700',
                ops.tone === 'watch' && 'text-amber-700',
                ops.tone === 'critical' && 'text-rose-700'
              )}
            >
              {ops.label}
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{ops.detail}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
