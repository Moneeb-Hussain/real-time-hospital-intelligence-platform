'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, X, Loader2 } from 'lucide-react'
import { runSimulation } from '@/lib/api'
import { cn } from '@/lib/utils'

export function SimulationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    incomingCritical: 3,
    incomingUrgent: 2,
    likelyNeedsICU: 2,
    likelyNeedsVentilator: 1,
    likelyNeedsMonitor: 2,
    arrivalWindowMinutes: 30
  })
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await runSimulation(form)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'incomingCritical', label: 'Incoming Critical (P1)', min: 0, max: 20 },
    { key: 'incomingUrgent', label: 'Incoming Urgent (P2)', min: 0, max: 20 },
    { key: 'likelyNeedsICU', label: 'Likely needs ICU', min: 0, max: 20 },
    { key: 'likelyNeedsVentilator', label: 'Likely needs Ventilator', min: 0, max: 20 },
    { key: 'likelyNeedsMonitor', label: 'Likely needs Monitor', min: 0, max: 20 },
    { key: 'arrivalWindowMinutes', label: 'Arrival window (mins)', min: 10, max: 120, step: 10 },
  ]

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
                  <h2 className="text-xl font-bold text-text-primary">What-If Simulation</h2>
                </div>
                <button onClick={onClose} className="p-1 text-text-tertiary hover:bg-bg-page rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {fields.map(f => (
                    <div key={f.key} className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-text-secondary">{f.label}</label>
                      <input
                        type="number"
                        min={f.min}
                        max={f.max}
                        step={f.step || 1}
                        value={(form as any)[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })}
                        className="border border-border rounded-button px-3 py-2 text-sm focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mb-6">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-ai text-white rounded-button font-semibold flex items-center gap-2 hover:bg-ai/90 transition-colors disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Run Simulation
                  </button>
                </div>

                {error && <div className="text-critical text-sm bg-critical-bg p-3 rounded mb-4 border border-critical-border">{error}</div>}

                {result && (
                  <div className="border-t border-border pt-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 prose prose-sm text-text-secondary">
                        <p>{result.summary}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold mb-1">Risk Level</span>
                        <span className={cn('px-3 py-1 rounded font-bold text-sm border', 
                          result.riskLevel === 'CRITICAL' ? 'bg-critical-bg text-critical border-critical-border' : 
                          result.riskLevel === 'HIGH' ? 'bg-warning-bg text-warning border-warning/30' : 
                          'bg-success-bg text-success border-success/30')}>
                          {result.riskLevel}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Projected Impact</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {Object.entries(result.projectedImpact).map(([key, val]) => (
                          <div key={key} className="bg-bg-page border border-border p-3 rounded-button flex flex-col items-center">
                            <span className="text-[10px] uppercase text-text-secondary font-semibold text-center mb-1 leading-tight h-6">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-lg font-bold text-text-primary tabular-nums">{val as number}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3 text-critical">Bottlenecks</h4>
                        <ul className="space-y-2">
                          {result.bottlenecks.map((b: string, i: number) => (
                            <li key={i} className="text-sm text-text-secondary flex gap-2 items-start">
                              <span className="w-1.5 h-1.5 rounded-full bg-critical mt-1.5 flex-shrink-0" />
                              <span className="leading-tight">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3 text-success">Recommended Actions</h4>
                        <ol className="space-y-2 list-decimal list-inside">
                          {result.recommendedActions.map((a: string, i: number) => (
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
