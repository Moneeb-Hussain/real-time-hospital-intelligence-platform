'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { PriorityBadge, StatusDot, SkeletonTable, EmptyState } from '@/components/shared'
import { priorityToBand, scoreColor, formatWait, minutesAgo, cn } from '@/lib/utils'
import type { Patient } from '@/types'

export function PatientQueue({ patients, onPatientClick, updatedPatientIds, loading }: { patients: Patient[]; onPatientClick: (p: Patient) => void; updatedPatientIds?: Set<string>; loading?: boolean }) {
  const [waitTimes, setWaitTimes] = useState<Record<string, number>>({})

  useEffect(() => {
    const calc = () => {
      const w: Record<string, number> = {}
      patients.forEach(p => w[p.id] = minutesAgo(p.arrivedAt))
      setWaitTimes(w)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [patients])

  if (loading) {
    return (
      <div className="card h-full">
        <div className="p-4 border-b border-border"><SkeletonTable rows={1} cols={1} /></div>
        <div className="p-4"><SkeletonTable rows={5} cols={8} /></div>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center">
        <EmptyState title="Queue Empty" description="There are no patients waiting." />
      </div>
    )
  }

  const sorted = [...patients].sort((a, b) => {
    const bandDiff = priorityToBand(a.priority) - priorityToBand(b.priority)
    if (bandDiff !== 0) return bandDiff
    const scoreDiff = b.urgencyScore - a.urgencyScore
    if (scoreDiff !== 0) return scoreDiff
    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime()
  })

  const top = sorted.slice(0, 8)

  return (
    <div className="card h-full flex flex-col">
      <div className="flex justify-between items-center p-6 pb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-text-primary">Live Patient Queue</h3>
          <span className="text-xs rounded-chip bg-brand-100 text-brand px-2 py-0.5 font-bold tabular-nums">
            {patients.length} waiting
          </span>
        </div>
        <Link href="/patients" className="text-sm font-medium text-brand hover:text-brand-700 transition-colors">
          View All &rarr;
        </Link>
      </div>

      <div className="flex-1 w-full overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="text-xs text-text-secondary uppercase tracking-wider sticky top-0">
            <tr>
              <th className="py-3 px-4 font-semibold">ID</th>
              <th className="py-3 px-4 font-semibold">Patient</th>
              <th className="py-3 px-4 font-semibold">Priority</th>
              <th className="py-3 px-4 font-semibold">Score</th>
              <th className="py-3 px-4 font-semibold">Wait</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Doctor</th>
              <th className="py-3 px-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {top.map(p => {
              const wait = waitTimes[p.id] ?? 0
              let mappedStatus: 'warning' | 'normal' | 'available' | 'busy' = 'normal'
              if (p.status === 'waiting') mappedStatus = 'warning'
              else if (p.status === 'assigned') mappedStatus = 'available'
              else if (p.status === 'in_treatment') mappedStatus = 'busy'

              return (
                <tr
                  key={p.id}
                  onClick={() => onPatientClick(p)}
                  className={cn('cursor-pointer transition-colors hover:bg-bg-page/80', updatedPatientIds?.has(p.id) && 'realtime-update')}
                >
                  <td className="py-3 px-4 text-xs font-mono text-text-tertiary">{p.displayId}</td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-semibold text-text-primary">{p.name}</div>
                    <div className="text-xs text-text-secondary">{p.age} {p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : 'O'}</div>
                  </td>
                  <td className="py-3 px-4"><PriorityBadge priority={p.priority} size="sm" /></td>
                  <td className="py-3 px-4">
                    <span className={cn('font-bold tabular-nums text-sm bg-bg-page px-2 py-1 rounded', scoreColor(p.urgencyScore))}>
                      {p.urgencyScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium tabular-nums">{formatWait(wait)}</td>
                  <td className="py-3 px-4"><StatusDot status={mappedStatus} label={true} /></td>
                  <td className="py-3 px-4 text-sm">
                    {p.assignedDoctorId ? (
                      <span className="text-text-primary font-medium">Assigned</span>
                    ) : (
                      <span className="text-text-tertiary italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-brand text-xs font-semibold hover:underline">View &rarr;</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {patients.length > 8 && (
        <div className="p-3 border-t border-border text-center bg-bg-page/30">
          <Link href="/patients" className="text-xs font-medium text-text-secondary hover:text-brand transition-colors">
            and {patients.length - 8} more patients &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
