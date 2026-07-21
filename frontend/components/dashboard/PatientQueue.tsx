'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatWait, minutesAgo, cn, priorityClasses } from '@/lib/utils'
import type { Doctor, Patient } from '@/types'

function queueStatus(p: Patient, waitMinutes: number): { label: string; tone: 'critical' | 'warn' | 'ok' } {
  const hasDoctor = Boolean(p.assignedDoctorId || p.notes)

  // Overdue = critical patient still waiting with no doctor
  if (p.priority === 'P1' && !hasDoctor && waitMinutes >= 8) {
    return { label: 'Overdue', tone: 'critical' }
  }
  if (hasDoctor) {
    return { label: 'Assigned', tone: 'ok' }
  }
  if (p.priority === 'P1' || p.priority === 'P2') {
    return { label: 'Urgent', tone: 'warn' }
  }
  if (p.status === 'waiting') {
    return { label: 'Waiting', tone: 'ok' }
  }
  return { label: p.status.replace(/_/g, ' '), tone: 'ok' }
}

function doctorLabel(p: Patient, doctorsById: Map<string, string>): string {
  if (p.notes) return p.notes // API-resolved assignedDoctorName
  if (p.assignedDoctorId) {
    return doctorsById.get(p.assignedDoctorId) || p.assignedDoctorId
  }
  return 'Unassigned'
}

export function PatientQueue({
  patients,
  doctors = [],
  onPatientClick,
  updatedPatientIds,
  loading,
}: {
  patients: Patient[]
  doctors?: Doctor[]
  onPatientClick: (p: Patient) => void
  updatedPatientIds?: Set<string>
  loading?: boolean
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  const doctorsById = new Map(doctors.map((d) => [d.id, d.name]))

  if (loading) {
    return (
      <div className="panel h-full p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  const sorted = [...patients].sort((a, b) => {
    const scoreDiff = b.urgencyScore - a.urgencyScore
    if (scoreDiff !== 0) return scoreDiff
    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime()
  })

  const top = sorted.slice(0, 8)

  return (
    <div className="panel h-full flex flex-col bg-white p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">Live Patient Queue</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {patients.length} waiting
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <Link href="/patients" className="text-xs font-semibold text-brand hover:underline">
          View All →
        </Link>
      </div>

      <div className="flex-1 w-full overflow-x-auto">
        <table className="w-full text-left min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Patient</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Score</th>
              <th className="py-2.5 px-3">Wait</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Doctor</th>
              <th className="py-2.5 px-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {top.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-slate-400 font-semibold">
                  No patients waiting
                </td>
              </tr>
            ) : (
              top.map((p) => {
                const pc = priorityClasses(p.priority)
                const wait = Math.max(
                  0,
                  Math.floor((now - new Date(p.arrivedAt).getTime()) / 60000)
                )
                const status = queueStatus(p, wait)
                const doctor = doctorLabel(p, doctorsById)
                return (
                  <tr
                    key={p.id}
                    onClick={() => onPatientClick(p)}
                    className={cn(
                      'cursor-pointer hover:bg-slate-50/80 transition-colors',
                      updatedPatientIds?.has(p.id) && 'bg-teal-50/60'
                    )}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {p.displayId || p.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 text-sm leading-tight">{p.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.age}
                        {p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : 'O'}
                        {p.chiefComplaint ? (
                          <span className="text-slate-500"> · {p.chiefComplaint}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          pc.bg,
                          pc.text
                        )}
                      >
                        {p.priority}
                      </span>
                    </td>
                    <td className={cn('py-3 px-3 font-bold tabular-nums text-sm', pc.text)}>
                      {p.urgencyScore}
                    </td>
                    <td className="py-3 px-3 text-xs font-semibold text-slate-600 tabular-nums">
                      {formatWait(wait)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 capitalize">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            status.tone === 'critical' && 'bg-rose-500',
                            status.tone === 'warn' && 'bg-amber-500',
                            status.tone === 'ok' && status.label === 'Assigned' && 'bg-emerald-500',
                            status.tone === 'ok' && status.label !== 'Assigned' && 'bg-slate-300'
                          )}
                        />
                        {status.label}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'py-3 px-3 text-xs',
                        doctor === 'Unassigned'
                          ? 'italic text-slate-400'
                          : 'font-medium text-slate-700'
                      )}
                    >
                      {doctor}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-brand hover:underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onPatientClick(p)
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
