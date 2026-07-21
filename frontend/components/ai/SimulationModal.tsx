'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, X, Loader2 } from 'lucide-react'
import { runSimulation, getSnapshot, getPatientQueue } from '@/lib/api'
import { cn } from '@/lib/utils'

type SimForm = {
  incomingCritical: number
  incomingUrgent: number
  likelyNeedsICU: number
  likelyNeedsVentilator: number
  likelyNeedsMonitor: number
  arrivalWindowMinutes: number
}

type SimResult = {
  summary: string
  riskLevel: string
  baseline?: Record<string, number>
  projectedImpact: Record<string, number>
  bottlenecks: string[]
  recommendedActions: string[]
}

const IMPACT_META: Record<string, { label: string; suffix: string }> = {
  waitTimeChangeMinutes: { label: 'Wait +min', suffix: 'm' },
  projectedAvgWaitMinutes: { label: 'Proj. avg wait', suffix: 'm' },
  doctorLoadChangePercentage: { label: 'Doctor load', suffix: '%' },
  icuOccupancyPercentage: { label: 'ICU occupancy', suffix: '%' },
  emergencyOccupancyPercentage: { label: 'ER occupancy', suffix: '%' },
  additionalIcuBedsRequired: { label: 'Extra ICU beds', suffix: '' },
}

export function SimulationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [loadingBaseline, setLoadingBaseline] = useState(false)
  const [form, setForm] = useState<SimForm>({
    incomingCritical: 3,
    incomingUrgent: 2,
    likelyNeedsICU: 2,
    likelyNeedsVentilator: 1,
    likelyNeedsMonitor: 2,
    arrivalWindowMinutes: 30,
  })
  const [baseline, setBaseline] = useState<Record<string, number> | null>(null)
  const [result, setResult] = useState<SimResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setResult(null)
    setError(null)
    setLoadingBaseline(true)
    Promise.all([getSnapshot(), getPatientQueue()])
      .then(([snap, queue]) => {
        const waiting = queue.items || []
        const p1 = waiting.filter((p) => p.priority === 'P1').length
        setBaseline({
          icuAvailable: snap.beds?.icu?.available ?? 0,
          erAvailable: snap.beds?.er?.available ?? 0,
          doctorsAvailable: snap.doctors?.available?.length ?? 0,
          ventilatorsAvailable: snap.equipment?.ventilator?.available ?? 0,
          monitorsAvailable: snap.equipment?.cardiacMonitor?.available ?? 0,
          waitingNow: waiting.length,
          p1Waiting: p1,
          icuOccupancyPct: snap.beds?.icu?.occupancyPct ?? 0,
          erOccupancyPct: snap.beds?.er?.occupancyPct ?? 0,
        })
      })
      .catch(() => setBaseline(null))
      .finally(() => setLoadingBaseline(false))
  }, [open])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = (await runSimulation(form)) as SimResult
      setResult(res)
      if (res.baseline) setBaseline(res.baseline)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const fields: Array<{ key: keyof SimForm; label: string; min: number; max: number; step?: number }> = [
    { key: 'incomingCritical', label: 'Incoming Critical (P1)', min: 0, max: 20 },
    { key: 'incomingUrgent', label: 'Incoming Urgent (P2)', min: 0, max: 20 },
    { key: 'likelyNeedsICU', label: 'Likely needs ICU', min: 0, max: 20 },
    { key: 'likelyNeedsVentilator', label: 'Likely needs Ventilator', min: 0, max: 20 },
    { key: 'likelyNeedsMonitor', label: 'Likely needs Monitor', min: 0, max: 20 },
    { key: 'arrivalWindowMinutes', label: 'Arrival window (mins)', min: 10, max: 120, step: 10 },
  ]

  const riskClass = (level: string) => {
    if (level === 'CRITICAL') return 'bg-critical-bg text-critical border-critical-border'
    if (level === 'HIGH') return 'bg-warning-bg text-warning border-warning/30'
    if (level === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-success-bg text-success border-success/30'
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="pointer-events-auto max-w-3xl w-full bg-white rounded-card shadow-slide-over flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-ai" />
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">What-If Simulation</h2>
                    <p className="text-[11px] text-text-tertiary font-medium">
                      Uses live beds, doctors &amp; equipment — does not change the hospital
                    </p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="p-1 text-text-tertiary hover:bg-bg-page rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto">
                {/* Live baseline */}
                <div className="mb-5 rounded-xl border border-border bg-slate-50/80 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Live capacity now
                  </div>
                  {loadingBaseline && !baseline ? (
                    <div className="text-xs text-slate-400 animate-pulse">Loading live resources…</div>
                  ) : baseline ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        ['ICU free', baseline.icuAvailable],
                        ['ER free', baseline.erAvailable],
                        ['Doctors', baseline.doctorsAvailable],
                        ['Vents', baseline.ventilatorsAvailable],
                        ['Waiting', baseline.waitingNow],
                      ].map(([label, val]) => (
                        <div key={String(label)} className="bg-white border border-slate-100 rounded-lg px-2.5 py-2 text-center">
                          <div className="text-[10px] text-slate-400 font-semibold">{label}</div>
                          <div className="text-sm font-bold text-slate-800 tabular-nums">{val}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600">Could not load live capacity — simulation will still attempt a run.</div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {fields.map((f) => (
                    <div key={f.key} className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-text-secondary">{f.label}</label>
                      <input
                        type="number"
                        min={f.min}
                        max={f.max}
                        step={f.step || 1}
                        value={form[f.key]}
                        onChange={(e) =>
                          setForm({ ...form, [f.key]: Number(e.target.value) })
                        }
                        className="border border-border rounded-button px-3 py-2 text-sm focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mb-6">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-ai text-white rounded-button font-semibold flex items-center gap-2 hover:bg-ai/90 transition-colors disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Run Simulation
                  </button>
                </div>

                {error && (
                  <div className="text-critical text-sm bg-critical-bg p-3 rounded mb-4 border border-critical-border">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="border-t border-border pt-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 text-sm text-text-secondary leading-relaxed">
                        <p>{result.summary}</p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold mb-1">
                          Risk Level
                        </span>
                        <span
                          className={cn(
                            'px-3 py-1 rounded font-bold text-sm border',
                            riskClass(result.riskLevel)
                          )}
                        >
                          {result.riskLevel}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">
                        Projected Impact
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(result.projectedImpact || {}).map(([key, val]) => {
                          const meta = IMPACT_META[key] || {
                            label: key.replace(/([A-Z])/g, ' $1').trim(),
                            suffix: '',
                          }
                          return (
                            <div
                              key={key}
                              className="bg-bg-page border border-border p-3 rounded-button flex flex-col items-center"
                            >
                              <span className="text-[10px] uppercase text-text-secondary font-semibold text-center mb-1 leading-tight min-h-[1.5rem]">
                                {meta.label}
                              </span>
                              <span className="text-lg font-bold text-text-primary tabular-nums">
                                {val}
                                {meta.suffix}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3 text-critical">
                          Bottlenecks
                        </h4>
                        <ul className="space-y-2">
                          {(result.bottlenecks || []).map((b, i) => (
                            <li key={i} className="text-sm text-text-secondary flex gap-2 items-start">
                              <span className="w-1.5 h-1.5 rounded-full bg-critical mt-1.5 flex-shrink-0" />
                              <span className="leading-tight">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3 text-success">
                          Recommended Actions
                        </h4>
                        <ol className="space-y-2 list-decimal list-inside">
                          {(result.recommendedActions || []).map((a, i) => (
                            <li key={i} className="text-sm text-text-secondary leading-tight">
                              {a}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
