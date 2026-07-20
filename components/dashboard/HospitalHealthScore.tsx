'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/shared'

export function HospitalHealthScore({ score, snapshotTime }: { score: number | null; snapshotTime?: string }) {
  if (score === null) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center min-h-[220px]">
        <Skeleton className="w-32 h-32 rounded-full" />
      </div>
    )
  }

  const RADIUS = 52
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const offset = CIRCUMFERENCE * (1 - (score / 100))

  let strokeColor = '#EF4444' // critical
  let statusLabel = 'Critical'
  let labelColor = 'text-critical'

  if (score > 80) {
    strokeColor = '#22C55E'
    statusLabel = 'Stable'
    labelColor = 'text-success'
  } else if (score > 60) {
    strokeColor = '#2563EB'
    statusLabel = 'Watch'
    labelColor = 'text-brand'
  } else if (score > 40) {
    strokeColor = '#F59E0B'
    statusLabel = 'Strained'
    labelColor = 'text-warning'
  }

  return (
    <div className="card p-6 h-full flex flex-col items-center justify-center relative">
      <div className="absolute top-4 left-4">
        <h3 className="text-sm font-semibold text-text-secondary">Hospital Health Score</h3>
      </div>
      
      <div className="relative w-full max-w-[160px] mx-auto mt-6">
        <svg viewBox="0 0 120 120" className="w-full drop-shadow-sm">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke={strokeColor}
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums text-text-primary">{score}</span>
          <span className="text-[10px] text-text-tertiary uppercase tracking-widest mt-1">/100</span>
        </div>
      </div>

      <div className="mt-4 text-center w-full">
        <span className={`text-sm font-bold uppercase tracking-wider ${labelColor}`}>{statusLabel}</span>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {['ICU', 'ER', 'Doctors', 'Wait'].map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-chip bg-bg-page border border-border text-text-secondary uppercase tracking-wider">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
