'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader, SkeletonCard, EmptyState, ConfidenceBar } from '@/components/shared'
import { getRecommendations, approveRecommendation, rejectRecommendation } from '@/lib/api'
import { Brain, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react'
import type { Recommendation } from '@/types'
import toast from 'react-hot-toast'

export default function AIRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecommendations = async () => {
    try {
      const data = await getRecommendations('pending')
      setRecommendations(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await approveRecommendation(id, { approvedBy: 'Hospital Operator' })
      toast.success('Recommendation approved')
      fetchRecommendations()
    } catch (e) {
      toast.error('Failed to approve')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectRecommendation(id, { rejectedBy: 'Hospital Operator', reason: 'Rejected from list' })
      toast.success('Recommendation rejected')
      fetchRecommendations()
    } catch (e) {
      toast.error('Failed to reject')
    }
  }

  return (
    <>
      <PageHeader 
        title="AI Recommendations Feed" 
        subtitle="Review, approve, or override AI resource routing proposals for incoming patients."
        actions={
          <button 
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Sync Feed
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="card p-12 text-center">
          <EmptyState 
            icon={<Brain className="w-12 h-12 text-ai" />}
            title="All Recommendations Reviewed" 
            description="There are no pending triage routing plans to approve at this time." 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map(rec => (
            <div key={rec.id} className="card p-6 border-l-4 border-ai flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Patient Routing</span>
                    <h3 className="font-bold text-text-primary text-base mt-0.5">Patient ID: {rec.patientId}</h3>
                  </div>
                  <span className="text-xs bg-ai-50 text-ai-700 px-2 py-0.5 rounded font-bold border border-ai-100">
                    Triage AI
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-bg-page/50 rounded-lg border border-border">
                  <div>
                    <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Recommended Unit</span>
                    <span className="text-sm font-black text-brand uppercase">{rec.payload.recommendedUnit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Bed Assignment</span>
                    <span className="text-sm font-black text-text-primary uppercase">{rec.payload.recommendedBed || 'TBD'}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Confidence Score</span>
                  <ConfidenceBar value={rec.payload.confidence || 75} />
                </div>

                <div className="space-y-2 mt-4">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">AI Reasoning</span>
                  {rec.payload.reasons.map((reason, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-text-secondary">
                      <span className="text-ai font-bold">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-border pt-4 mt-6">
                <button
                  onClick={() => handleApprove(rec.id)}
                  className="flex-1 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-button text-xs font-bold transition-colors flex justify-center items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => handleReject(rec.id)}
                  className="px-4 py-2 bg-white border border-border text-text-secondary hover:text-text-primary rounded-button text-xs font-bold transition-colors flex justify-center items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5 text-critical" /> Reject
                </button>
                <Link
                  href={`/recommendation/${rec.patientId}`}
                  className="px-4 py-2 bg-ai-50 hover:bg-ai-100 text-ai-700 border border-ai-100 rounded-button text-xs font-bold transition-colors flex justify-center items-center gap-1"
                >
                  Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
