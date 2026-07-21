'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PageHeader, SkeletonCard, EmptyState, ConfidenceBar, PriorityBadge } from '@/components/shared'
import { getRecommendations, approveRecommendation, rejectRecommendation } from '@/lib/api'
import { Brain, CheckCircle2, XCircle, ArrowRight, RefreshCw, BedDouble, Stethoscope, AlertTriangle } from 'lucide-react'
import type { Priority, Recommendation, ValidationStatus } from '@/types'
import { PRIORITY_LABELS } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

function statusBadge(status: ValidationStatus) {
  switch (status) {
    case 'valid':
      return { label: 'Ready to approve', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
    case 'fallback':
      return { label: 'Backup plan', className: 'bg-amber-50 text-amber-700 border-amber-100' }
    case 'partial':
      return { label: 'Needs review', className: 'bg-sky-50 text-sky-700 border-sky-100' }
    case 'invalid':
      return { label: 'Not available', className: 'bg-rose-50 text-rose-700 border-rose-100' }
    default:
      return { label: 'Pending review', className: 'bg-slate-50 text-slate-600 border-slate-100' }
  }
}

function unitLabel(unit: string) {
  if (!unit) return 'Not set'
  if (/emergency/i.test(unit) || unit.toUpperCase() === 'ER') return 'Emergency Room'
  return unit
}

export default function AIRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchRecommendations = useCallback(async (showToast = false) => {
    try {
      const data = await getRecommendations('pending')
      setRecommendations(Array.isArray(data) ? data : [])
      if (showToast) toast.success('Recommendations updated')
    } catch (e) {
      console.error(e)
      if (showToast) toast.error('Could not load recommendations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
    const poll = setInterval(() => fetchRecommendations(), 20000)
    return () => clearInterval(poll)
  }, [fetchRecommendations])

  const handleApprove = async (id: string) => {
    setBusyId(id)
    try {
      await approveRecommendation(id, { approvedBy: 'Hospital Operator' })
      toast.success('Plan approved — patient assigned')
      await fetchRecommendations()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: string) => {
    setBusyId(id)
    try {
      await rejectRecommendation(id, {
        rejectedBy: 'Hospital Operator',
        reason: 'Rejected from recommendations feed',
      })
      toast.success('Recommendation rejected')
      await fetchRecommendations()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="AI Recommendations"
        subtitle="Review suggested bed, doctor, and unit assignments before they go live."
        actions={
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchRecommendations(true)
            }}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="panel p-12 text-center bg-white">
          <EmptyState
            icon={<Brain className="w-12 h-12 text-ai" />}
            title="No plans waiting for approval"
            description="When intake or triage creates a routing suggestion, it will appear here for staff to approve or reject."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((rec) => {
            const badge = statusBadge(rec.validationStatus)
            const reasons = rec.payload?.reasons || []
            const doctor = rec.payload?.doctor || 'Not assigned'
            const bed = rec.payload?.recommendedBed || 'To be decided'
            const unit = unitLabel(rec.payload?.recommendedUnit || '')
            const busy = busyId === rec.id
            const patientPriority = (rec.patientPriority || 'P4') as Priority

            return (
              <div
                key={rec.id}
                className="panel p-6 border-l-4 border-ai flex flex-col justify-between bg-white"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                        Suggested care plan
                      </span>
                      <h3 className="font-bold text-text-primary text-base mt-0.5 truncate">
                        {rec.patientName || rec.patientId}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {rec.patientId}
                        {rec.complaint ? ` · ${rec.complaint}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {rec.patientPriority && (
                        <PriorityBadge priority={patientPriority} size="sm" />
                      )}
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded font-bold border',
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 p-3 bg-slate-50 rounded-xl border border-border">
                    <div>
                      <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                        Unit
                      </span>
                      <span className="text-sm font-bold text-brand">{unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1 flex items-center gap-1">
                        <BedDouble className="w-3 h-3" /> Bed
                      </span>
                      <span className="text-sm font-bold text-text-primary">{bed}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" /> Doctor
                      </span>
                      <span className="text-sm font-bold text-text-primary truncate block">
                        {doctor}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
                      How sure is the AI?
                    </span>
                    <ConfidenceBar value={rec.payload?.confidence ?? 0} />
                  </div>

                  <div className="space-y-2 mt-2">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                      Why this plan
                    </span>
                    {reasons.length === 0 ? (
                      <p className="text-xs text-slate-400">No detailed reasons provided.</p>
                    ) : (
                      reasons.slice(0, 4).map((reason, idx) => (
                        <div key={idx} className="flex gap-2 text-xs text-text-secondary">
                          <span className="text-ai font-bold">•</span>
                          <span>{reason}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {rec.validationStatus === 'fallback' && rec.payload?.alternativePlan && (
                    <div className="mt-4 flex gap-2 items-start bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-bold">Backup plan: </span>
                        {rec.payload.alternativePlan}
                      </span>
                    </div>
                  )}

                  {rec.patientPriority && (
                    <p className="text-[11px] text-slate-400 mt-3">
                      Triage band: {PRIORITY_LABELS[patientPriority]}
                      {typeof rec.urgencyScore === 'number' ? ` · score ${rec.urgencyScore}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-border pt-4 mt-6">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleApprove(rec.id)}
                    className="flex-1 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-button text-xs font-bold transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {busy ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReject(rec.id)}
                    className="px-4 py-2 bg-white border border-border text-text-secondary hover:text-text-primary rounded-button text-xs font-bold transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5 text-critical" /> Reject
                  </button>
                  <Link
                    href={`/recommendation/${rec.patientId}`}
                    className="px-4 py-2 bg-ai-50 hover:bg-ai-100 text-ai-700 border border-ai-100 rounded-button text-xs font-bold transition-colors flex justify-center items-center gap-1"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
