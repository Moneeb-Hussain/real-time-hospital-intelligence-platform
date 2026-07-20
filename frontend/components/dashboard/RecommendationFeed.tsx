'use client'

import React from 'react'
import Link from 'next/link'
import { Brain, CheckCircle2 } from 'lucide-react'
import { ConfidenceBar, SkeletonCard, EmptyState } from '@/components/shared'
import type { Recommendation } from '@/types'

export function RecommendationFeed({ recommendations, onApprove, onReject, loading }: { recommendations: Recommendation[]; onApprove: (id: string) => void; onReject: (id: string) => void; loading?: boolean }) {
  if (loading) {
    return (
      <div className="card h-full flex flex-col">
        <div className="p-4 border-b border-border"><SkeletonCard /></div>
        <div className="p-4 space-y-4"><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  const pending = recommendations.filter(r => r.decision === 'pending')

  return (
    <div className="card h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-text-primary">AI Recommendations</h3>
          <Brain className="w-5 h-5 text-ai" />
        </div>
        {pending.length > 0 && (
          <span className="text-xs rounded-chip bg-ai-100 text-ai px-2 py-0.5 font-bold tabular-nums border border-ai-200">
            {pending.length} Pending
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {recommendations.length === 0 ? (
          <div className="h-full flex items-center justify-center min-h-[200px]">
            <EmptyState icon={<CheckCircle2 className="w-12 h-12 text-text-tertiary" />} title="No pending recommendations" description="All patients assessed." />
          </div>
        ) : (
          recommendations.map(rec => {
            const { payload } = rec
            let badgeNode = null
            if (rec.validationStatus === 'valid') badgeNode = <span className="text-[10px] bg-success-bg text-success px-2 py-0.5 rounded border border-success/30 font-semibold">✓ Validated</span>
            else if (rec.validationStatus === 'partial') badgeNode = <span className="text-[10px] bg-warning-bg text-warning px-2 py-0.5 rounded border border-warning/30 font-semibold">⚠ Partial</span>
            else if (rec.validationStatus === 'fallback') badgeNode = <span className="text-[10px] bg-warning-bg text-warning px-2 py-0.5 rounded border border-warning/30 font-semibold">⚠ Fallback Plan</span>
            else if (rec.validationStatus === 'invalid') badgeNode = <span className="text-[10px] bg-critical-bg text-critical px-2 py-0.5 rounded border border-critical/30 font-semibold">✗ Invalid</span>

            return (
              <div key={rec.id} className="ai-content p-4 mb-3 border border-ai-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-sm text-text-primary">{rec.patientId}</div>
                    <div className="text-xs text-text-secondary font-medium mt-0.5">{payload.recommendedUnit}</div>
                  </div>
                  {badgeNode}
                </div>

                <div className="mb-4">
                  <ConfidenceBar value={payload.confidence} />
                </div>

                <ul className="space-y-1 mb-4">
                  {payload.reasons.slice(0, 2).map((reason: string, i: number) => (
                    <li key={i} className="text-xs text-text-secondary flex gap-2 items-start leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary mt-1.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>

                {rec.validationStatus === 'fallback' && payload.alternativePlan && (
                  <div className="bg-warning-bg border border-warning/30 p-2 rounded text-xs text-warning-800 mb-4 font-medium line-clamp-2 leading-relaxed">
                    ⚠ {payload.alternativePlan}
                  </div>
                )}

                {rec.decision === 'pending' ? (
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <button onClick={() => onApprove(rec.id)} className="bg-accent hover:bg-[#84cc16] text-white text-xs font-semibold rounded-button px-3 py-1.5 transition-colors shadow-sm">
                      ✓ Approve
                    </button>
                    <button onClick={() => onReject(rec.id)} className="bg-white border border-border text-text-primary hover:bg-bg-page text-xs font-semibold rounded-button px-3 py-1.5 transition-colors shadow-sm">
                      ✗ Reject
                    </button>
                    <div className="flex-1" />
                    <Link href={`/recommendation/${rec.patientId}`} className="text-ai text-xs font-semibold hover:underline">
                      Workspace &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    {rec.decision === 'approved' && <span className="text-xs font-bold text-success flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>}
                    {rec.decision === 'rejected' && <span className="text-xs font-bold text-critical flex items-center gap-1"><span className="text-[10px]">✗</span> Rejected</span>}
                    {rec.decision === 'overridden' && <span className="text-xs font-bold text-warning flex items-center gap-1"><span className="text-[10px]">⚠</span> Overridden</span>}
                    <Link href={`/recommendation/${rec.patientId}`} className="text-text-tertiary hover:text-text-primary text-xs font-medium transition-colors">
                      View details
                    </Link>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
