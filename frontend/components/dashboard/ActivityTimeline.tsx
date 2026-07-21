'use client'

import React from 'react'
import { Clock, User, Zap, Brain, CheckCircle2, XCircle, Edit2, BedDouble, UserCheck, AlertTriangle, BellOff, Settings } from 'lucide-react'
import { timeAgo, cn } from '@/lib/utils'
import { SkeletonCard, EmptyState } from '@/components/shared'
import type { ActivityLog } from '@/types'

export function ActivityTimeline({ activities, loading }: { activities: ActivityLog[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="card h-full flex flex-col">
        <div className="p-4 border-b border-border"><SkeletonCard /></div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3"><SkeletonCard /></div>
          ))}
        </div>
      </div>
    )
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'patient_arrived': return { Icon: User, bg: 'bg-info-bg', text: 'text-info' }
      case 'priority_calculated': return { Icon: Zap, bg: 'bg-warning-bg', text: 'text-warning' }
      case 'recommendation_generated': return { Icon: Brain, bg: 'bg-ai-50', text: 'text-ai' }
      case 'recommendation_approved': return { Icon: CheckCircle2, bg: 'bg-success-bg', text: 'text-success' }
      case 'recommendation_rejected': return { Icon: XCircle, bg: 'bg-critical-bg', text: 'text-critical' }
      case 'recommendation_overridden': return { Icon: Edit2, bg: 'bg-warning-bg', text: 'text-warning' }
      case 'bed_assigned': return { Icon: BedDouble, bg: 'bg-info-bg', text: 'text-info' }
      case 'doctor_assigned': return { Icon: UserCheck, bg: 'bg-info-bg', text: 'text-info' }
      case 'alert_fired': return { Icon: AlertTriangle, bg: 'bg-critical-bg', text: 'text-critical' }
      case 'alert_acknowledged': return { Icon: BellOff, bg: 'bg-bg-page', text: 'text-text-tertiary' }
      case 'resource_status_changed': return { Icon: Settings, bg: 'bg-bg-page', text: 'text-text-tertiary' }
      default: return { Icon: Clock, bg: 'bg-bg-page', text: 'text-text-secondary' }
    }
  }

  const formatEventLabel = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const getDetailSnippet = (act: ActivityLog) => {
    const detail = act.detail as Record<string, unknown> | null
    if (!detail) return act.patientId ? `Patient ${act.patientId}` : ''
    if (typeof detail.description === 'string' && detail.description) return detail.description
    if (detail.priority) return `Assigned Priority ${detail.priority}`
    if (detail.alertType) return `Alert: ${detail.alertType}`
    if (detail.type) return `Alert: ${detail.type}`
    if (detail.unit) return `Recommended ${detail.unit}`
    if (act.patientId) return `Patient ${act.patientId}`
    const first = Object.values(detail).find((v) => typeof v === 'string' && v)
    return (first as string) || ''
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <h3 className="text-lg font-bold text-text-primary">Activity Timeline</h3>
        <Clock className="w-4 h-4 text-text-tertiary" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activities.length === 0 ? (
          <div className="h-full flex items-center justify-center min-h-[200px]">
            <EmptyState icon={<Clock className="w-12 h-12 text-text-tertiary" />} title="No recent activity" description="Timeline will populate as events occur." />
          </div>
        ) : (
          <div className="relative">
            {activities.map((act, index) => {
              const { Icon, bg, text } = getEventIcon(act.event)
              const isLast = index === activities.length - 1

              return (
                <div key={act.id} className="flex gap-4 relative pb-4">
                  {!isLast && (
                    <div className="absolute left-[15px] top-[32px] bottom-0 w-px bg-border z-0" />
                  )}
                  
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 border border-white', bg, text)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 pt-1 pb-2">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="text-sm font-semibold text-text-primary">{formatEventLabel(act.event)}</div>
                      <div className="text-[10px] uppercase tracking-wider font-medium text-text-tertiary">{timeAgo(act.createdAt)}</div>
                    </div>
                    <div className="text-xs text-text-secondary truncate pr-4">
                      {getDetailSnippet(act)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
