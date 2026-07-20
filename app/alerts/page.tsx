'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader, EmptyState } from '@/components/shared'
import { getAlerts, acknowledgeAlert } from '@/lib/api'
import { cn, formatAlertType, alertSeverityClasses, timeAgo } from '@/lib/utils'
import { AlertTriangle, Bell, BellOff, RefreshCw, CheckCircle2, Search } from 'lucide-react'
import type { Alert } from '@/types'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all' | 'acknowledged'>('active')

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts()
      setAlerts(res || [])
    } catch (e) {
      console.error('Failed to fetch alerts:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id, 'Hospital Operator')
      setAlerts(prev =>
        prev.map(a => a.id === id ? { ...a, active: false, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'Operator' } : a)
      )
    } catch (e) {
      console.error('Failed to acknowledge alert:', e)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [filter])

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'active') return a.active
    if (filter === 'acknowledged') return !a.active
    return true
  })

  const activeCount = alerts.filter(a => a.active).length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.active).length

  return (
    <>
      <PageHeader
        title="System Alerts"
        subtitle="Real-time hospital system alerts and notifications."
        actions={
          <button
            onClick={fetchAlerts}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="rounded-full bg-critical-bg p-3 text-critical">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase block">Critical</span>
            <span className="text-2xl font-black text-critical tabular-nums">{criticalCount}</span>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="rounded-full bg-warning-bg p-3 text-warning">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase block">Active Alerts</span>
            <span className="text-2xl font-black text-warning tabular-nums">{activeCount}</span>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="rounded-full bg-accent-50 p-3 text-accent">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase block">Total</span>
            <span className="text-2xl font-black text-text-primary tabular-nums">{alerts.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['active', 'all', 'acknowledged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'capitalize whitespace-nowrap border-b-2 py-3 px-1 text-sm font-bold transition-all duration-150',
                filter === f
                  ? 'border-brand text-brand'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              )}
            >
              {f}
            </button>
          ))}
        </nav>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-brand" />
            <span className="ml-3 text-sm text-text-secondary font-semibold">Loading alerts...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<BellOff className="w-12 h-12 text-text-tertiary" />}
              title="No Alerts Found"
              description="There are no alerts matching your current filter."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAlerts.map(alert => {
              const sev = alertSeverityClasses(alert.severity)
              return (
                <div key={alert.id} className={cn('p-5 flex items-start gap-4 transition-colors hover:bg-bg-page/50', !alert.active && 'opacity-60')}>
                  <div className={cn('mt-0.5 rounded-full p-2 shrink-0', sev.bg)}>
                    <AlertTriangle className={cn('h-4 w-4', sev.icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-text-primary">{formatAlertType(alert.type)}</span>
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-chip text-xs font-semibold border capitalize', sev.bg, sev.text, sev.border)}>
                        {alert.severity}
                      </span>
                      {!alert.active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-chip text-xs font-semibold bg-accent-50 text-accent border border-accent-100">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{alert.message}</p>
                    <p className="text-xs text-text-tertiary mt-1">{timeAgo(alert.createdAt)}</p>
                    {alert.acknowledgedBy && (
                      <p className="text-xs text-accent font-semibold mt-1">Acknowledged by {alert.acknowledgedBy}</p>
                    )}
                  </div>
                  {alert.active && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="shrink-0 text-xs px-4 py-2 rounded-button border border-border bg-white text-text-secondary hover:bg-bg-page hover:text-text-primary transition-colors font-bold"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
