'use client'

import React from 'react'
import { Bell } from 'lucide-react'
import { timeAgo, formatAlertType } from '@/lib/utils'
import { SkeletonCard } from '@/components/shared'
import type { Alert } from '@/types'

// Mock doctors/staff names matching the screenshot initials for authenticity
const MOCK_SENDERS = [
  { name: 'Dr. Scott Elliott', color: 'bg-indigo-100 text-indigo-700' },
  { name: 'ER Team A', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Dr. Frank Martin', color: 'bg-blue-100 text-blue-700' },
  { name: 'Facility Admin', color: 'bg-amber-100 text-amber-700' }
]

export function AlertsPanel({ alerts, loading }: { alerts: Alert[]; onAcknowledge?: (id: string) => void; loading?: boolean }) {
  if (loading) {
    return (
      <div className="card h-[380px] p-5 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const activeAlerts = alerts.filter(a => a.active)

  return (
    <div className="card h-[380px] flex flex-col p-6 bg-white justify-between">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-slate-800">Notifications</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {activeAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Bell className="w-8 h-8 opacity-40" />
            <span className="text-xs font-semibold">No active notifications</span>
          </div>
        ) : (
          activeAlerts.slice(0, 4).map((alert, idx) => {
            const sender = MOCK_SENDERS[idx % MOCK_SENDERS.length]
            const initials = sender.name.split(' ').map(n => n.charAt(0)).filter(c => c !== 'D' && c !== 'r' && c !== '.').join('').slice(0, 2) || 'OP'

            return (
              <div key={alert.id} className="flex items-start justify-between gap-3">
                {/* Left: Initial Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${sender.color} flex-shrink-0`}>
                  {initials}
                </div>

                {/* Center: Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {sender.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate leading-snug">
                    {alert.message}
                  </div>
                </div>

                {/* Right: Timestamp */}
                <div className="text-[10px] text-slate-400 font-semibold whitespace-nowrap flex-shrink-0 pt-0.5">
                  {timeAgo(alert.createdAt)}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
