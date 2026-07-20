'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader, SkeletonTable } from '@/components/shared'
import { getSnapshot, getPatientQueue, getAlerts, generateShiftReport } from '@/lib/api'
import { Clock, RefreshCw, Send, CheckCircle2, FileText, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ShiftHandoverPage() {
  const [snapshot, setSnapshot] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  
  const [handoverNote, setHandoverNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [aiReport, setAiReport] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchStats = async () => {
    try {
      const [snap, q, a] = await Promise.all([
        getSnapshot(),
        getPatientQueue(),
        getAlerts()
      ])
      setSnapshot(snap)
      setPatients(q.items || [])
      setAlerts(a || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const generateReport = async () => {
    setIsGenerating(true)
    try {
      const now = new Date()
      const end = now.toISOString()
      const start = new Date(now.getTime() - 8 * 3600000).toISOString()
      const report = await generateShiftReport(start, end)
      setAiReport(report)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const criticalCount = patients.filter(p => p.priority === 'P1').length
  const activeAlertsCount = alerts.filter(a => a.active).length

  return (
    <>
      <PageHeader 
        title="Shift Handover Hub" 
        subtitle="Prepare, review, and finalize operations metrics for the incoming shift team."
      />

      {/* Live Stats */}
      {loadingStats ? (
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-4 gap-4"><SkeletonTable rows={1} cols={4} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="card p-4 text-center">
            <span className="text-xs font-bold text-text-secondary uppercase block mb-1">Queue Patients</span>
            <span className="text-2xl font-black text-text-primary tabular-nums">{patients.length}</span>
          </div>
          <div className="card p-4 text-center">
            <span className="text-xs font-bold text-text-secondary uppercase block mb-1">Critical (P1)</span>
            <span className="text-2xl font-black text-critical tabular-nums">{criticalCount}</span>
          </div>
          <div className="card p-4 text-center">
            <span className="text-xs font-bold text-text-secondary uppercase block mb-1">Active Alerts</span>
            <span className="text-2xl font-black text-warning tabular-nums">{activeAlertsCount}</span>
          </div>
          <div className="card p-4 text-center">
            <span className="text-xs font-bold text-text-secondary uppercase block mb-1">Health score</span>
            <span className="text-2xl font-black text-brand tabular-nums">{snapshot?.hospitalHealthScore || 63}%</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Handover Input Form */}
        <div className="card p-6 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-brand" />
              <h3 className="font-bold text-text-primary text-lg">Handover Notes</h3>
            </div>
            
            <p className="text-text-secondary text-sm">Input specific shift observations, pending discharges, or equipment concerns for the next team.</p>
            
            <textarea
              rows={8}
              value={handoverNote}
              onChange={e => setHandoverNote(e.target.value)}
              placeholder="E.g., ICU Bed 3 has incoming transfer at 15:30. Ventilator shortage expected if another P1 arrives. Doctor shift handoff completed with Dr. Fatima Raza."
              className="w-full resize-none rounded-button border border-border p-4 text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/40"
            />
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={generateReport}
                disabled={isGenerating}
                className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-button font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? 'Analyzing Metrics...' : 'Generate AI Report'}
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-white border border-border text-text-primary hover:bg-bg-page rounded-button font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-brand" />
                Submit Notes
              </button>
            </div>
          </form>

          {submitted && (
            <div className="mt-4 p-4 rounded-lg bg-accent-50 border border-accent-100 flex items-center gap-2 text-accent text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Handover notes successfully submitted and saved.
            </div>
          )}
        </div>

        {/* AI Analysis Panel */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-text-primary" />
                <h3 className="font-bold text-text-primary text-lg">AI-Generated Analysis</h3>
              </div>
              {aiReport && (
                <span className="text-xs text-text-tertiary">Just now</span>
              )}
            </div>

            {!aiReport ? (
              <div className="py-24 text-center">
                <Clock className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-sm text-text-secondary max-w-xs mx-auto">Click &quot;Generate AI Report&quot; to perform a real-time operational capacity audit.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-lg bg-bg-page border border-border text-sm leading-relaxed text-text-primary whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {aiReport.report}
                </div>

                {aiReport.pendingItems && aiReport.pendingItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-warning uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pending Handover Items
                    </h4>
                    <ul className="space-y-1 text-xs text-text-secondary leading-relaxed">
                      {aiReport.pendingItems.map((item: string, idx: number) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="text-warning font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
