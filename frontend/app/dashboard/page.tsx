'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import { PageHeader, ErrorBoundary } from '@/components/shared'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { PatientQueue } from '@/components/dashboard/PatientQueue'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { ResourceBars } from '@/components/dashboard/ResourceBars'
import { DepartmentOccupancy } from '@/components/dashboard/DepartmentOccupancy'
import { RecommendationFeed } from '@/components/dashboard/RecommendationFeed'
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline'
import { PatientSlideOver } from '@/components/dashboard/PatientSlideOver'
import { BriefingModal } from '@/components/ai/BriefingModal'
import { SimulationModal } from '@/components/ai/SimulationModal'

import {
  getKpis, getPatientQueue, getAlerts, getSnapshot,
  getRecommendations, getActivityLog, getDepartmentStatus, getDoctors,
  approveRecommendation, rejectRecommendation, acknowledgeAlert, generateRecommendation
} from '@/lib/api'
import { supabase } from '@/lib/supabase-browser'
import { USE_FIXTURES } from '@/lib/fixtures'
import type { KpiData, Patient, Alert, HospitalSnapshot, Recommendation, ActivityLog, DepartmentStatus, Doctor } from '@/types'

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [queue, setQueue] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [snapshot, setSnapshot] = useState<HospitalSnapshot | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [departments, setDepartments] = useState<DepartmentStatus[] | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [updatedPatientIds, setUpdatedPatientIds] = useState<Set<string>>(new Set())
  const [showBriefing, setShowBriefing] = useState(false)
  const [showSimulation, setShowSimulation] = useState(false)

  const fetchKpis = async () => { try { setKpis(await getKpis()) } catch (e) { console.error(e) } }
  const fetchQueue = async () => { try { const d = await getPatientQueue(); setQueue(d.items) } catch (e) { console.error(e) } }
  const fetchAlerts = async () => { try { setAlerts(await getAlerts()) } catch (e) { console.error(e) } }
  const fetchSnapshot = async () => { try { setSnapshot(await getSnapshot()) } catch (e) { console.error(e) } }
  const fetchRecommendations = async () => { try { setRecommendations(await getRecommendations('pending')) } catch (e) { console.error(e) } }
  const fetchActivity = async () => { try { setActivityLog(await getActivityLog(12)) } catch (e) { console.error(e) } }

  const fetchAll = async (isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      await Promise.all([
        fetchKpis(),
        fetchQueue(),
        fetchAlerts(),
        fetchSnapshot(),
        fetchRecommendations(),
        fetchActivity(),
        getDepartmentStatus().then(setDepartments).catch(() => setDepartments([])),
        getDoctors().then(setDoctors).catch(() => {}),
      ])
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll(true)

    const poll = setInterval(() => {
      fetchQueue()
      fetchKpis()
      fetchAlerts()
      fetchRecommendations()
      fetchActivity()
    }, 20000)

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
          fetchSnapshot()
          fetchKpis()
          getDepartmentStatus().then(setDepartments).catch(() => {})
        })
        .subscribe()

      const ch3 = supabase.channel('dash-alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => { fetchAlerts() })
        .subscribe()

      const ch4 = supabase.channel('dash-recs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recommendations' }, () => { fetchRecommendations() })
        .subscribe()

      const ch5 = supabase.channel('dash-activity')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => { fetchActivity() })
        .subscribe()

      return () => {
        clearInterval(poll)
        if (supabase != null) {
          supabase.removeChannel(ch1)
          supabase.removeChannel(ch2)
          supabase.removeChannel(ch3)
          supabase.removeChannel(ch4)
          supabase.removeChannel(ch5)
        }
      }
    }

    return () => clearInterval(poll)
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
      fetchActivity()
      fetchKpis()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectRecommendation(id, { rejectedBy: 'Hospital Operator', reason: 'Manually rejected from dashboard' })
      toast.success('Recommendation rejected')
      fetchRecommendations()
      fetchActivity()
      fetchQueue()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject')
    }
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, 'Hospital Operator')
      fetchAlerts()
    } catch (e) {
      toast.error('Failed to acknowledge alert')
    }
  }

  const handleGenerateRecommendation = async (patientId: string) => {
    try {
      toast.loading('Generating AI recommendation...', { id: 'gen' })
      await generateRecommendation(patientId)
      toast.success('Recommendation ready', { id: 'gen' })
      fetchRecommendations()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate', { id: 'gen' })
    }
  }

  return (
    <>
      <PageHeader
        title="AegisOps Command Center"
        actions={
          <div className="flex gap-3">
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
          </div>
        }
      />

      <motion.div
        className="grid grid-cols-12 gap-5 pb-12 items-stretch"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
        }}
      >
        <motion.div className="col-span-12" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><KpiCards data={loading ? null : kpis} /></ErrorBoundary>
        </motion.div>

        <motion.div className="col-span-12 xl:col-span-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary><ResourceBars snapshot={loading ? null : snapshot} /></ErrorBoundary>
        </motion.div>
        <motion.div className="col-span-12 xl:col-span-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary>
            <AlertsPanel alerts={alerts} onAcknowledge={handleAcknowledge} loading={loading} />
          </ErrorBoundary>
        </motion.div>
        <motion.div className="col-span-12 xl:col-span-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary>
            <DepartmentOccupancy departments={loading ? null : departments} />
          </ErrorBoundary>
        </motion.div>

        <motion.div className="col-span-12" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary>
            <PatientQueue
              patients={queue}
              doctors={doctors}
              onPatientClick={p => setSelectedPatientId(p.id)}
              updatedPatientIds={updatedPatientIds}
              loading={loading}
            />
          </ErrorBoundary>
        </motion.div>

        <motion.div className="col-span-12 xl:col-span-8" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary>
            <RecommendationFeed
              recommendations={recommendations}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={loading}
            />
          </ErrorBoundary>
        </motion.div>
        <motion.div className="col-span-12 xl:col-span-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <ErrorBoundary>
            <ActivityTimeline activities={activityLog} loading={loading} />
          </ErrorBoundary>
        </motion.div>
      </motion.div>

      <PatientSlideOver
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        onGenerateRecommendation={handleGenerateRecommendation}
      />

      <BriefingModal open={showBriefing} onClose={() => setShowBriefing(false)} />
      <SimulationModal open={showSimulation} onClose={() => setShowSimulation(false)} />
    </>
  )
}
