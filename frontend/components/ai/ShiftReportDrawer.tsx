'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, X, Loader2 } from 'lucide-react'
import { generateShiftReport } from '@/lib/api'

export function ShiftReportDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [shiftStart, setShiftStart] = useState('')
  const [shiftEnd, setShiftEnd] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!shiftStart || !shiftEnd) return
    setLoading(true)
    setError(null)
    try {
      const res = await generateShiftReport(new Date(shiftStart).toISOString(), new Date(shiftEnd).toISOString())
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
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
          <motion.div
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-white z-50 shadow-slide-over flex flex-col"
          >
            <div className="flex justify-between items-center p-5 border-b border-border bg-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-ai" />
                <h2 className="text-xl font-bold text-text-primary">Shift Handover Report</h2>
              </div>
              <button onClick={onClose} className="p-1 text-text-tertiary hover:bg-bg-page rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 border-b border-border bg-bg-page flex-shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Shift Start</label>
                <input
                  type="datetime-local"
                  value={shiftStart}
                  onChange={e => setShiftStart(e.target.value)}
                  className="border border-border rounded-button px-3 py-2 text-sm w-full"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Shift End</label>
                <input
                  type="datetime-local"
                  value={shiftEnd}
                  onChange={e => setShiftEnd(e.target.value)}
                  className="border border-border rounded-button px-3 py-2 text-sm w-full"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || !shiftStart || !shiftEnd}
                className="px-4 py-2 bg-ai text-white rounded-button font-semibold text-sm hover:bg-ai/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 h-[38px] w-full sm:w-auto mt-1 sm:mt-0"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {error && <div className="text-critical text-sm mb-4">{error}</div>}
              
              {result && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Shift Summary</h3>
                    <div className="prose prose-sm max-w-none text-text-primary whitespace-pre-wrap leading-relaxed bg-bg-page p-4 rounded-button border border-border">
                      {result.report}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Pending Items</h3>
                    <ul className="space-y-2">
                      {result.pendingItems.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-text-secondary flex gap-2 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-critical mb-3">Immediate Actions Required</h3>
                    <ol className="space-y-3">
                      {result.immediateActions.map((act: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm text-text-secondary items-start">
                          <span className="flex items-center justify-center w-5 h-5 rounded bg-critical-bg text-critical text-xs font-bold flex-shrink-0 border border-critical-border">
                            {i + 1}
                          </span>
                          <span className="leading-tight font-medium text-text-primary mt-0.5">{act}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {!result && !loading && !error && (
                <div className="h-full flex items-center justify-center text-text-tertiary text-sm text-center">
                  Select shift times and generate a report<br/>to view the handover summary.
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
