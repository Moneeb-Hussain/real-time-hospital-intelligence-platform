'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'


import { PageHeader, ErrorBoundary } from '@/components/shared'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { HospitalHealthScore } from '@/components/dashboard/HospitalHealthScore'
import { PatientQueue } from '@/components/dashboard/PatientQueue'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { ResourceBars } from '@/components/dashboard/ResourceBars'
import { PriorityMixChart } from '@/components/dashboard/PriorityMixChart'
import { DepartmentOccupancy } from '@/components/dashboard/DepartmentOccupancy'
import { DoctorWorkload } from '@/components/dashboard/DoctorWorkload'
import { WaitTimeTrend } from '@/components/dashboard/WaitTimeTrend'
import { OverviewChart } from '@/components/dashboard/OverviewChart'
import { RecommendationFeed } from '@/components/dashboard/RecommendationFeed'
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline'
import { PatientSlideOver } from '@/components/dashboard/PatientSlideOver'
import { CopilotPanel } from '@/components/ai/CopilotPanel'
import { BriefingModal } from '@/components/ai/BriefingModal'
import { SimulationModal } from '@/components/ai/SimulationModal'
import { ShiftReportDrawer } from '@/components/ai/ShiftReportDrawer'

import { 
  getKpis, getHealthScore, getPatientQueue, getAlerts, getSnapshot, 
  getRecommendations, getActivityLog, getCharts, getDepartmentStatus, getDoctors,
  approveRecommendation, rejectRecommendation, acknowledgeAlert, generateRecommendation
} from '@/lib/api'
import { supabase } from '@/lib/supabase-browser'
import { USE_FIXTURES } from '@/lib/fixtures'
import type { KpiData, Patient, Alert, HospitalSnapshot, Recommendation, ActivityLog, DepartmentStatus, Doctor } from '@/types'

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [healthScore, setHealthScore] = useState<{ score: number; snapshotTime: string } | null>(null)
  const [queue, setQueue] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [snapshot, setSnapshot] = useState<HospitalSnapshot | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [charts, setCharts] = useState<any>(null)
  const [departments, setDepartments] = useState<DepartmentStatus[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [updatedPatientIds, setUpdatedPatientIds] = useState<Set<string>>(new Set())
  const [showBriefing, setShowBriefing] = useState(false)
  const [showSimulation, setShowSimulation] = useState(false)
  const [showShiftReport, setShowShiftReport] = useState(false)

  const fetchKpis = async () => { try { setKpis(await getKpis()) } catch(e) { console.error(e) } }
  const fetchQueue = async () => { try { const d = await getPatientQueue(); setQueue(d.items) } catch(e) { console.error(e) } }
  const fetchAlerts = async () => { try { setAlerts(await getAlerts()) } catch(e) { console.error(e) } }
  const fetchSnapshot = async () => { try { setSnapshot(await getSnapshot()) } catch(e) { console.error(e) } }
  const fetchRecommendations = async () => { try { setRecommendations(await getRecommendations('pending')) } catch(e) { console.error(e) } }
  const fetchActivity = async () => { try { setActivityLog(await getActivityLog(12)) } catch(e) { console.error(e) } }

  const fetchAll = async () => {
    await Promise.all([
      fetchKpis(),
      fetchQueue(),
      fetchAlerts(),
      fetchSnapshot(),
      fetchRecommendations(),
      fetchActivity(),
      getCharts().then(setCharts).catch(()=>{}),
      getDepartmentStatus().then(setDepartments).catch(()=>{}),
      getDoctors().then(setDoctors).catch(()=>{}),
      getHealthScore().then(setHealthScore).catch(()=>{})
    ])
  }

  useEffect(() => {
    fetchAll()

    if (!USE_FIXTURES && supabase != null) {
      const ch1 = supabase.channel('dash-patients')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload: any) => {
          fetchQueue()
          fetchKpis()
          if (payload.new && 'id' in payload.new) {
            const id = payload.new.id as string
            setUpdatedPatientIds(prev => new Set([...Array.from(prev), id]))
            setTimeout(() => {
              setUpdatedPatientIds(prev => {
                const s = new Set(prev)
                s.delete(id)
                return s
              })
            }, 1500)
          }
        }).subscribe()

      const ch2 = supabase.channel('dash-resources')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, () => { fetchSnapshot() })
        .subscribe()

      const ch3 = supabase.channel('dash-alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => { fetchAlerts() })
        .subscribe()

      const ch4 = supabase.channel('dash-recs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recommendations' }, () => { fetchRecommendations() })
        .subscribe()

      const ch5 = supabase.channel('dash-activity')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => { fetchActivity() })
        .subscribe()

      return () => {
        if (supabase != null) {
          supabase.removeChannel(ch1)
          supabase.removeChannel(ch2)
          supabase.removeChannel(ch3)
          supabase.removeChannel(ch4)
          supabase.removeChannel(ch5)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await approveRecommendation(id, { approvedBy: 'Hospital Operator' })
      toast.success('Patient successfully assigned')
      fetchQueue()
      fetchRecommendations()
      fetchSnapshot()
      fetchAlerts()
    } catch(e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectRecommendation(id, { rejectedBy: 'Hospital Operator', reason: 'Manually rejected from dashboard' })
      toast.success('Recommendation rejected')
      fetchRecommendations()
    } catch(e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject')
    }
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, 'Hospital Operator')
      fetchAlerts()
    } catch(e) {
      toast.error('Failed to acknowledge alert')
    }
  }

  const handleGenerateRecommendation = async (patientId: string) => {
    try {
      toast.loading('Generating AI recommendation...', { id: 'gen' })
      await generateRecommendation(patientId)
      toast.success('Recommendation ready', { id: 'gen' })
      fetchRecommendations()
    } catch(e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate', { id: 'gen' })
    }
  }

  return (
    <>
      <PageHeader
        title="Operations Command Center"
        actions={
          <div className="flex gap-3">
            <button 
              onClick={() => setShowShiftReport(true)}
              className="px-4 py-2 bg-white border border-border rounded-button text-sm font-semibold hover:bg-bg-page transition-colors text-text-secondary"
            >
              Shift Report
            </button>
            <button 
              onClick={() => setShowSimulation(true)}
              className="px-4 py-2 bg-white border border-border rounded-button text-sm font-semibold hover:bg-bg-page transition-colors text-text-secondary"
            >
              Simulation
            </button>
            <button 
              onClick={() => setShowBriefing(true)}
              className="px-4 py-2 bg-ai text-white rounded-button text-sm font-semibold hover:bg-ai/90 transition-colors shadow-sm"
            >
              Briefing
            </button>
            <button 
              onClick={fetchAll}
              className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="text-lg leading-none mt-[-2px]">↻</span> Refresh
            </button>
          </div>
        }
      />

      <motion.div 
        className="grid grid-cols-12 gap-6 pb-12"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
      >
        {/* Row 1: KPI Cards (4 cards) */}
        <motion.div className="col-span-12" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><KpiCards data={kpis} healthScore={healthScore?.score} /></ErrorBoundary>
        </motion.div>

        {/* Row 2: Charts */}
        <motion.div className="col-span-12 xl:col-span-8" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><OverviewChart data={charts?.admissions7d ?? null} /></ErrorBoundary>
        </motion.div>
        <motion.div className="col-span-12 xl:col-span-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><PriorityMixChart data={charts?.priorityMix ?? null} /></ErrorBoundary>
        </motion.div>

        {/* Row 3: Progress, List, Map replacement */}
        <motion.div className="col-span-12 xl:col-span-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><ResourceBars snapshot={snapshot} /></ErrorBoundary>
        </motion.div>
        <motion.div className="col-span-12 xl:col-span-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><AlertsPanel alerts={alerts} onAcknowledge={handleAcknowledge} /></ErrorBoundary>
        </motion.div>
        <motion.div className="col-span-12 xl:col-span-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><DepartmentOccupancy departments={departments} /></ErrorBoundary>
        </motion.div>

        {/* Row 4: Data Table */}
        <motion.div className="col-span-12" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary>
            <PatientQueue 
              patients={queue} 
              onPatientClick={p => setSelectedPatientId(p.id)} 
              updatedPatientIds={updatedPatientIds} 
            />
          </ErrorBoundary>
        </motion.div>

        {/* Row 5: AI & Timeline (Bottom section) */}
        <motion.div className="col-span-12 xl:col-span-6" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary>
            <RecommendationFeed 
              recommendations={recommendations} 
              onApprove={handleApprove} 
              onReject={handleReject} 
            />
          </ErrorBoundary>
        </motion.div>
        <motion.div className="col-span-12 xl:col-span-3" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><ActivityTimeline activities={activityLog} /></ErrorBoundary>
        </motion.div>
        <motion.div className="col-span-12 xl:col-span-3" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><CopilotPanel /></ErrorBoundary>
        </motion.div>
      </motion.div>

      <PatientSlideOver
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        onGenerateRecommendation={handleGenerateRecommendation}
      />

      <BriefingModal open={showBriefing} onClose={() => setShowBriefing(false)} />
      <SimulationModal open={showSimulation} onClose={() => setShowSimulation(false)} />
      <ShiftReportDrawer open={showShiftReport} onClose={() => setShowShiftReport(false)} />
    </>
  )
}
