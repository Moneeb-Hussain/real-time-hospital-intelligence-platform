'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/head'
import { minutesAgo, cn } from '@/lib/utils'
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
      <div className="card h-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
        </div>
      </div>
    )
  }

  const sorted = [...patients].sort((a, b) => {
    const scoreDiff = b.urgencyScore - a.urgencyScore
    if (scoreDiff !== 0) return scoreDiff
    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime()
  })

  const top = sorted.slice(0, 6)

  return (
    <div className="card h-full flex flex-col bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-slate-800">Latest Transaction</h3>
      </div>

      <div className="flex-1 w-full overflow-x-auto">
        <table className="w-full text-left min-w-[800px] align-middle">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 w-12 text-center">
                <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" readOnly />
              </th>
              <th className="py-3 px-4">ID & Name</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4 text-center">Quantity</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {top.map((p, idx) => {
              // Format dates to look like screenshot e.g., "02 Nov, 2019"
              const dateStr = '02 Nov, 2019'
              
              // Map dynamic billing / hospital price stats
              const priceVal = p.priority === 'P1' ? '$1,850' : p.priority === 'P2' ? '$1,234' : '$620'
              const amountVal = p.priority === 'P1' ? '$1,850' : p.priority === 'P2' ? '$1,234' : '$620'
              
              // Status values matching screenshot Confirm/Cancel/Pending
              const isConfirm = p.status !== 'waiting'
              const statusLabel = isConfirm ? 'Confirm' : 'Pending'
              const statusDotClass = isConfirm ? 'bg-emerald-500' : 'bg-amber-500'
              const statusBgClass = isConfirm ? 'bg-emerald-50/50 text-emerald-600' : 'bg-amber-50/50 text-amber-600'

              const initials = p.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)
              const bgColors = ['bg-rose-100 text-rose-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700']
              const avatarColor = bgColors[idx % bgColors.length]

              return (
                <tr
                  key={p.id}
                  onClick={() => onPatientClick(p)}
                  className={cn('cursor-pointer hover:bg-slate-50/80 transition-colors', updatedPatientIds?.has(p.id) && 'bg-teal-50/50 animate-pulse')}
                >
                  {/* Checkbox column */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" readOnly />
                  </td>

                  {/* Avatar, ID & Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor} flex-shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-slate-400">#{p.displayId || p.id.slice(0, 6)}</span>
                        <span className="text-sm font-semibold text-slate-800 leading-tight">{p.name}</span>
                      </div>
                    </div>
                  </td>

                  {/* Arrived Date */}
                  <td className="py-3.5 px-4 text-slate-500 text-xs font-semibold">{dateStr}</td>

                  {/* Price */}
                  <td className="py-3.5 px-4 text-slate-700 font-semibold tabular-nums">{priceVal}</td>

                  {/* Quantity */}
                  <td className="py-3.5 px-4 text-center text-slate-500 font-semibold tabular-nums">1</td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-slate-700 font-semibold tabular-nums">{amountVal}</td>

                  {/* Status badge exactly like screenshot */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusBgClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                      {statusLabel}
                    </span>
                  </td>

                  {/* Outline Actions */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onPatientClick(p)}
                        className="border border-slate-200 hover:border-teal-600 hover:text-teal-600 text-slate-500 text-xs font-bold px-2.5 py-1 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button className="border border-rose-100 hover:bg-rose-50 text-rose-500 text-xs font-bold px-2.5 py-1 rounded transition-colors">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
