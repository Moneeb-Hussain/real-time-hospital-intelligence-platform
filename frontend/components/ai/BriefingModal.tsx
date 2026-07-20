'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, X, Loader2 } from 'lucide-react'
import { generateBriefing } from '@/lib/api'
import toast from 'react-hot-toast'

export function BriefingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [briefing, setBriefing] = useState('')
  const [highlights, setHighlights] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setLoading(true)
      generateBriefing('Hospital Operator')
        .then(res => {
          setBriefing(res.briefing)
          setHighlights(res.highlights)
        })
        .catch(() => {
          setBriefing('Briefing temporarily unavailable.')
          setHighlights([])
        })
        .finally(() => setLoading(false))
    }
  }, [open])

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
              className="pointer-events-auto max-w-2xl w-full bg-white rounded-card shadow-slide-over flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <Brain className="w-6 h-6 text-ai" />
                  <h2 className="text-xl font-bold text-text-primary">Executive Briefing</h2>
                </div>
                <button onClick={onClose} className="p-1 text-text-tertiary hover:bg-bg-page rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                    <Loader2 className="w-8 h-8 animate-spin text-ai mb-4" />
                    <span>Generating AI briefing...</span>
                  </div>
                ) : (
                  <>
                    {highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {highlights.map((h, i) => (
                          <span key={i} className="bg-ai-50 border border-ai-100 text-ai text-xs font-semibold rounded-chip px-2.5 py-1">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {briefing}
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 sm:p-6 border-t border-border bg-bg-page flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-b-card">
                <span className="text-xs text-text-secondary">AI-generated operational summary. For management use.</span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium hover:bg-black/5 rounded-button">Close</button>
                  <button
                    disabled={loading}
                    onClick={() => {
                      navigator.clipboard.writeText(briefing)
                      toast.success('Copied to clipboard!')
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-ai text-white rounded-button text-sm font-semibold hover:bg-ai/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Copy Briefing
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
