'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react'
import { alertSeverityClasses, timeAgo, formatAlertType, cn } from '@/lib/utils'
import { SkeletonCard, EmptyState } from '@/components/shared'
import type { Alert } from '@/types'

export function AlertsPanel({ alerts, onAcknowledge, loading }: { alerts: Alert[]; onAcknowledge: (id: string) => void; loading?: boolean }) {
  if (loading) {
    return (
      <div className="card h-full flex flex-col">
        <div className="p-4 border-b border-border"><SkeletonCard /></div>
        <div className="p-4 space-y-3"><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  const activeAlerts = alerts.filter(a => a.active)
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length

  return (
    <div className="card h-full flex flex-col">
      <div className="flex justify-between items-center p-5 pb-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-text-primary">System Alerts</h3>
          {criticalCount > 0 && <AlertTriangle className="w-5 h-5 text-critical animate-pulse" />}
        </div>
        {criticalCount > 0 ? (
          <span className="text-xs rounded-chip bg-critical-bg text-critical px-2 py-0.5 font-bold tabular-nums border border-critical-border">
            {criticalCount} Critical
          </span>
        ) : activeAlerts.length === 0 ? (
          <span className="text-xs rounded-chip bg-success-bg text-success px-2 py-0.5 font-bold border border-success/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> All Clear
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeAlerts.length === 0 ? (
          <div className="h-full flex items-center justify-center min-h-[200px]">
             <EmptyState icon={<CheckCircle2 className="w-12 h-12 text-success" />} title="All systems normal" description="No active alerts at this time." />
          </div>
        ) : (
          activeAlerts.slice(0, 5).map(alert => {
            const cls = alertSeverityClasses(alert.severity)
            const Icon = alert.severity === 'info' ? Info : AlertTriangle

            return (
              <div key={alert.id} className={cn('relative flex gap-3 p-3 rounded-button border shadow-sm', cls.bg, cls.border)}>
                <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-button', alert.severity === 'critical' ? 'bg-critical' : alert.severity === 'warning' ? 'bg-warning' : 'bg-info')} />
                
                <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cls.icon)} />
                
                <div className="flex-1 pr-6">
                  <div className={cn('font-semibold text-sm', cls.text)}>{formatAlertType(alert.type)}</div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">{alert.message}</p>
                  <div className="text-[10px] text-text-tertiary mt-2 uppercase tracking-wider font-medium">{timeAgo(alert.createdAt)}</div>
                </div>

                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="absolute top-2 right-2 p-1 text-text-tertiary hover:text-critical transition-colors rounded-full hover:bg-black/5"
                  title="Acknowledge"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {activeAlerts.length > 5 && (
        <div className="p-3 border-t border-border text-center bg-bg-page/30">
          <button className="text-xs font-medium text-brand hover:underline transition-colors">
            View all {activeAlerts.length} alerts &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
