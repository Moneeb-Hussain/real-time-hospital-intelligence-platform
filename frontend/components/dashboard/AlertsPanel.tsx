'use client'

import React from 'react'
import { AlertTriangle, Bell } from 'lucide-react'
import { timeAgo, formatAlertType, cn } from '@/lib/utils'
import { SkeletonCard } from '@/components/shared'
import type { Alert } from '@/types'

export function AlertsPanel({
  alerts,
  onAcknowledge,
  loading,
}: {
  alerts: Alert[]
  onAcknowledge?: (id: string) => void
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="panel h-full min-h-[340px] p-5 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const activeAlerts = alerts.filter((a) => a.active)

  return (
    <div className="panel h-full min-h-[340px] flex flex-col p-5 bg-white">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">System Alerts</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {activeAlerts.length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 -mr-1 pr-1">
        {activeAlerts.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 gap-2">
            <Bell className="w-7 h-7 opacity-40" />
            <span className="text-xs font-semibold">No active alerts</span>
          </div>
        ) : (
          activeAlerts.slice(0, 6).map((alert) => {
            const critical = alert.severity === 'critical'
            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => onAcknowledge?.(alert.id)}
                className={cn(
                  'w-full text-left rounded-xl border border-slate-100 bg-white p-3 transition-colors',
                  'hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                  critical ? 'border-l-[3px] border-l-rose-400' : 'border-l-[3px] border-l-amber-400'
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      'mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                      critical ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                    )}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 leading-snug">
                        {formatAlertType(alert.type)}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 whitespace-nowrap uppercase tracking-wide pt-0.5">
                        {timeAgo(alert.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
