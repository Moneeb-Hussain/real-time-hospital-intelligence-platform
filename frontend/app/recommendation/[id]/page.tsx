'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader, SkeletonCard } from '@/components/shared'
import { Brain, CheckCircle2, XCircle, ArrowLeft, Activity, ShieldAlert, Heart, Thermometer } from 'lucide-react'
import { getPatientById, approveRecommendation, rejectRecommendation } from '@/lib/api'
import type { Patient, Recommendation, ActivityLog } from '@/types'
import { cn, formatWait, scoreColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function RecommendationWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [activity, setActivity] = useState<ActivityLog[]>([])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [decision, setDecision] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    const loadData = async () => {
      if (!params?.id) return
      try {
        const data = await getPatientById(params.id as string)
        setPatient(data.patient)
        setRec(data.recommendation)
        setActivity(data.activity || [])
        
        if (data.patient.status === 'assigned') {
          setDecision('approved')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params?.id])

  const handleApprove = async () => {
    if (!rec) return
    setSubmitting(true)
    try {
      await approveRecommendation(rec.id, { approvedBy: 'Hospital Operator' })
      toast.success('Patient routing plan approved!')
      setDecision('approved')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (e) {
      toast.error('Failed to approve plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rec) return
    setSubmitting(true)
    try {
      await rejectRecommendation(rec.id, { rejectedBy: 'Hospital Operator', reason: 'Rejected from Workspace' })
      toast.success('Recommendation rejected')
      setDecision('rejected')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (e) {
      toast.error('Failed to reject plan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Loading Workspace..." />
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2"><SkeletonCard className="h-64" /></div>
          <div><SkeletonCard className="h-64" /></div>
        </div>
      </>
    )
  }

  if (!patient) {
    return (
      <>
        <PageHeader title="Workspace Not Found" />
        <div className="card p-12 mt-6 flex flex-col items-center justify-center text-center">
          <XCircle className="w-16 h-16 text-critical mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Patient Not Found</h2>
          <p className="text-sm text-text-secondary mb-6">The patient you are looking for does not exist or has been discharged.</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-brand text-white rounded-button font-semibold">
            Return to Dashboard
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-brand font-semibold flex items-center gap-1 hover:underline mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">AI Workspace: {patient.name}</h1>
          <p className="text-sm text-text-secondary mt-1">Deep analysis and deployment workspace for patient {patient.displayId}.</p>
        </div>
        
        {decision === 'pending' && rec && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 py-2 bg-accent hover:bg-accent-600 text-white rounded-button text-sm font-semibold transition-colors flex justify-center items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve Plan
            </button>
            <button 
              onClick={handleReject}
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 py-2 bg-white border border-border text-text-primary hover:bg-bg-page rounded-button text-sm font-semibold transition-colors flex justify-center items-center gap-2"
            >
              <XCircle className="w-4 h-4 text-critical" /> Reject
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-12">
        {/* Left Column: AI Analysis & Allocation */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-6 h-6 text-ai" />
              <h2 className="text-lg font-bold text-text-primary">AI Diagnostic & Triage Plan</h2>
            </div>
            
            {rec ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-bg-page border border-border text-center">
                    <span className="text-xs font-bold text-text-tertiary uppercase block mb-1">Recommended Unit</span>
                    <span className="text-lg font-black text-brand uppercase">{rec.payload.recommendedUnit || 'TBD'}</span>
                  </div>
                  <div className="p-4 rounded-lg bg-bg-page border border-border text-center">
                    <span className="text-xs font-bold text-text-tertiary uppercase block mb-1">Recommended Bed</span>
                    <span className="text-lg font-black text-text-primary uppercase">{rec.payload.recommendedBed || 'TBD'}</span>
                  </div>
                  <div className="p-4 rounded-lg bg-bg-page border border-border text-center">
                    <span className="text-xs font-bold text-text-tertiary uppercase block mb-1">Attending Clinician</span>
                    <span className="text-sm font-bold text-text-primary block mt-1">{rec.payload.doctor || 'TBD'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-bg-page border border-border mb-6">
                  <span className="text-xs font-bold text-text-tertiary uppercase block mb-1">AI Confidence</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-success tabular-nums">{rec.payload.confidence || 70}%</span>
                    <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${rec.payload.confidence || 70}%` }} />
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-text-primary mb-3">AI Clinical Reasoning</h3>
                <ul className="space-y-3 mb-6">
                  {rec.payload.reasons && rec.payload.reasons.length > 0 ? (
                    rec.payload.reasons.map((reason, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-text-secondary items-start p-3 bg-ai-50/50 border border-ai-100 rounded-lg">
                        <Brain className="w-4 h-4 text-ai mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{reason}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-text-secondary text-sm italic">Recommended allocation based on clinical triage severity.</li>
                  )}
                </ul>

                {rec.payload.alternativePlan && (
                  <>
                    <h3 className="text-sm font-bold text-text-primary mb-3 mt-6 text-warning">Alternative Fallback Plan</h3>
                    <div className="p-4 bg-warning-bg border border-warning-border/30 rounded-lg text-sm text-warning-850 leading-relaxed font-semibold">
                      {rec.payload.alternativePlan}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-text-tertiary">
                <Brain className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm">No recommendation generated for this patient yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Patient Context & Vitals */}
        <div className="xl:col-span-1 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Activity className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-text-primary">Triage Vitals</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-text-tertiary uppercase">Name</span>
                <p className="text-sm font-bold text-text-primary">{patient.name} ({patient.age} yrs • {patient.gender})</p>
              </div>

              <div>
                <span className="text-xs font-bold text-text-tertiary uppercase">Chief Complaint</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {patient.symptoms && patient.symptoms.length > 0 ? (
                    patient.symptoms.map((sym, i) => (
                      <span key={i} className="text-xs bg-bg-page border border-border px-2 py-0.5 rounded-chip text-text-secondary font-semibold">
                        {sym}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-tertiary italic">General Triage Assessment</span>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <span className="text-xs font-bold text-text-tertiary uppercase block mb-3">Vitals Record</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-bg-page border border-border rounded-lg text-center">
                    <span className="text-[10px] font-bold text-text-secondary uppercase block mb-0.5">SpO2</span>
                    <span className={cn('text-sm font-black font-mono', patient.vitals?.spo2 < 94 ? 'text-critical' : 'text-text-primary')}>
                      {patient.vitals?.spo2 ? `${patient.vitals.spo2}%` : '—'}
                    </span>
                  </div>
                  <div className="p-3 bg-bg-page border border-border rounded-lg text-center">
                    <span className="text-[10px] font-bold text-text-secondary uppercase block mb-0.5">Temp</span>
                    <span className={cn('text-sm font-black font-mono', patient.vitals?.temperature > 38 ? 'text-critical' : 'text-text-primary')}>
                      {patient.vitals?.temperature ? `${patient.vitals.temperature}°C` : '—'}
                    </span>
                  </div>
                  <div className="p-3 bg-bg-page border border-border rounded-lg text-center">
                    <span className="text-[10px] font-bold text-text-secondary uppercase block mb-0.5">Heart Rate</span>
                    <span className={cn('text-sm font-black font-mono', patient.vitals?.heartRate > 100 || patient.vitals?.heartRate < 50 ? 'text-critical' : 'text-text-primary')}>
                      {patient.vitals?.heartRate ? `${patient.vitals.heartRate} bpm` : '—'}
                    </span>
                  </div>
                  <div className="p-3 bg-bg-page border border-border rounded-lg text-center">
                    <span className="text-[10px] font-bold text-text-secondary uppercase block mb-0.5">Blood Pressure</span>
                    <span className="text-xs font-black font-mono text-text-primary">
                      {patient.vitals?.bpSystolic && patient.vitals?.bpDiastolic ? `${patient.vitals.bpSystolic}/${patient.vitals.bpDiastolic}` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={cn('card p-6 border text-white', decision === 'approved' ? 'bg-accent border-accent' : 'bg-brand border-brand')}>
            <h2 className="text-lg font-bold mb-2">{decision === 'approved' ? 'Plan Executed' : 'Execution Status'}</h2>
            <p className={cn('text-sm leading-relaxed mb-4', decision === 'approved' ? 'text-accent-50' : 'text-brand-50')}>
              {decision === 'approved' 
                ? 'The patient has been routed and assigned to their destination bed.' 
                : 'Ready for deployment. Confirming this action will reserve resources and alert attending doctors.'}
            </p>
            {decision === 'pending' && (
              <button 
                onClick={handleApprove}
                disabled={submitting}
                className="w-full py-2 bg-white text-brand rounded-button text-sm font-bold hover:bg-bg-page transition-colors shadow-sm"
              >
                Execute Allocation Now
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
