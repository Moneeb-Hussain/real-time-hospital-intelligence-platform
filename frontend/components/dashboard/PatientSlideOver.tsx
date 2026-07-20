'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { X, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { getPatientById } from '@/lib/api'
import { PriorityBadge, VitalChip, ConfidenceBar, StatusDot, Skeleton, SkeletonCard, EmptyState } from '@/components/shared'
import { scoreColor, timeAgo, formatWait, minutesAgo, cn } from '@/lib/utils'
import { calculatePriority } from '@/lib/priority-engine'
import type { Patient, Recommendation, ActivityLog } from '@/types'

export function PatientSlideOver({ 
  patientId, 
  onClose, 
  onGenerateRecommendation 
}: { 
  patientId: string | null; 
  onClose: () => void; 
  onGenerateRecommendation: (id: string) => Promise<void> 
}) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  useEffect(() => {
    if (patientId) {
      setLoading(true)
      setError(null)
      getPatientById(patientId)
        .then(data => {
          setPatient(data.patient)
          setRecommendation(data.recommendation)
          setActivity(data.activity)
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    } else {
      setPatient(null)
      setRecommendation(null)
      setActivity([])
      setBreakdownOpen(false)
    }
  }, [patientId])

  return (
    <AnimatePresence>
      {patientId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          
          <motion.div
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-bg-page z-50 shadow-slide-over flex flex-col"
          >
            <div className="bg-white border-b border-border p-5 sticky top-0 z-10 flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs text-text-tertiary px-2 py-1 bg-bg-page rounded">{patient?.displayId || patientId}</span>
                <button onClick={onClose} className="p-1 text-text-tertiary hover:text-critical hover:bg-critical/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    {loading ? <Skeleton className="w-48 h-8 mb-1" /> : patient?.name || 'Unknown Patient'}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    {loading ? <Skeleton className="w-32 h-4" /> : patient ? `${patient.age}y ${patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'}` : ''}
                  </p>
                </div>
                {patient && <PriorityBadge priority={patient.priority} />}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-5 space-y-6">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : error ? (
                <div className="p-5">
                  <div className="bg-critical-bg border border-critical-border p-4 rounded-lg flex flex-col items-center text-center">
                    <span className="text-critical font-bold mb-2">Failed to load patient</span>
                    <span className="text-sm text-text-secondary mb-4">{error}</span>
                    <button onClick={() => setPatient(null)} className="px-4 py-2 bg-white rounded-button border text-sm font-medium hover:bg-bg-page">Retry</button>
                  </div>
                </div>
              ) : patient ? (
                <>
                  <div className="p-5 border-b border-border bg-white">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-4">Vital Signs</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {(() => {
                        const { heartRate, bpSystolic, bpDiastolic, spo2, temperature, conscious } = patient.vitals
                        const hrStatus = heartRate > 150 || heartRate < 40 ? 'critical' : heartRate > 100 ? 'warning' : 'normal'
                        
                        let bpStatus: 'normal'|'warning'|'critical' = 'normal'
                        const syst = bpSystolic
                        if (syst < 80) bpStatus = 'critical'
                        else if (syst < 90 || syst > 180) bpStatus = 'warning'

                        const spo2Status = spo2 < 85 ? 'critical' : spo2 < 93 ? 'warning' : 'normal'
                        const tempStatus = temperature > 40 || temperature < 35 ? 'critical' : temperature > 39 ? 'warning' : 'normal'
                        const concStatus = !conscious ? 'critical' : 'normal'
                        
                        const bloodPressure = `${bpSystolic}/${bpDiastolic}`

                        return (
                          <>
                            <VitalChip label="Heart Rate" value={heartRate} unit="bpm" status={hrStatus} />
                            <VitalChip label="Blood Pressure" value={bloodPressure || 'N/A'} unit="mmHg" status={bpStatus} />
                            <VitalChip label="SpO2" value={spo2} unit="%" status={spo2Status} />
                            <VitalChip label="Temperature" value={temperature} unit="°C" status={tempStatus} />
                            <VitalChip label="Conscious" value={conscious ? 'Yes' : 'NO'} status={concStatus} />
                            <VitalChip label="Wait Time" value={formatWait(minutesAgo(patient.arrivedAt))} />
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="p-5 border-b border-border bg-bg-page">
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className={cn('text-6xl font-bold tabular-nums tracking-tighter', scoreColor(patient.urgencyScore))}>
                          {patient.urgencyScore}
                        </span>
                        <span className="text-xl text-text-tertiary font-medium">/100</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">Urgency Score</span>
                        <div className="flex items-center gap-2">
                           <PriorityBadge priority={patient.priority} size="sm" />
                           <span className="text-xs text-text-tertiary">{patient.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-border overflow-hidden">
                      <button 
                        onClick={() => setBreakdownOpen(!breakdownOpen)}
                        className="w-full flex justify-between items-center p-3 text-sm font-semibold text-text-primary hover:bg-bg-page transition-colors"
                      >
                        <span>Score Breakdown</span>
                        {breakdownOpen ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
                      </button>
                      
                      <AnimatePresence>
                        {breakdownOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-border"
                          >
                            <div className="p-3 space-y-2 bg-bg-page/50">
                              {(() => {
                                const breakdown = calculatePriority(patient.vitals, patient.symptoms, patient.age).breakdown
                                return breakdown.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center">
                                    <span className="text-xs text-text-secondary">{item.factor}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border tabular-nums text-text-primary">
                                      +{item.points}
                                    </span>
                                  </div>
                                ))
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="p-5 border-b border-border bg-white">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-4">AI Recommendation</h3>
                    
                    {recommendation ? (
                      recommendation.decision === 'pending' ? (
                        <div className="ai-content p-4 border border-ai-200 rounded-lg shadow-sm">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold text-text-primary">{recommendation.payload.recommendedUnit}</span>
                            <span className="text-[10px] bg-warning-bg text-warning px-2 py-0.5 rounded font-bold uppercase tracking-wider">Pending</span>
                          </div>
                          <ConfidenceBar value={recommendation.payload.confidence} />
                          <Link href={`/recommendation/${patient.id}`} className="mt-4 block text-center text-sm font-bold text-ai hover:underline">
                            Open Full Workspace &rarr;
                          </Link>
                        </div>
                      ) : recommendation.decision === 'approved' ? (
                        <div className="bg-success-bg border border-success/30 p-4 rounded-lg">
                          <span className="text-success font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Assigned to {recommendation.payload.recommendedUnit}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-bg-page border p-4 rounded-lg">
                          <span className="text-text-secondary font-medium">Recommendation was {recommendation.decision}</span>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-4 bg-bg-page border border-dashed rounded-lg">
                        <button
                          disabled={generating}
                          onClick={async () => {
                            setGenerating(true)
                            await onGenerateRecommendation(patient.id)
                            setGenerating(false)
                          }}
                          className="px-4 py-2 bg-ai text-white rounded-button text-sm font-semibold hover:bg-ai/90 disabled:opacity-50 transition-colors w-full flex justify-center"
                        >
                          {generating ? 'Analyzing...' : 'Generate AI Recommendation'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-bg-page min-h-[200px]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {activity.slice(0, 3).map(act => (
                        <div key={act.id} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-border mt-1.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-text-primary">{act.event.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-text-tertiary">{timeAgo(act.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                      {activity.length === 0 && <span className="text-xs text-text-tertiary">No activity recorded.</span>}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
