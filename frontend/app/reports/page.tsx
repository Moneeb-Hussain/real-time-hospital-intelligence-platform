'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared'
import { generateBriefing, generateShiftReport } from '@/lib/api'
import { FileText, RefreshCw, Clock, Printer, Loader2, ListChecks, CheckCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function ReportsPage() {
  const [briefing, setBriefing] = useState<any>(null)
  const [isBriefingLoading, setIsBriefingLoading] = useState(false)
  const [shiftReport, setShiftReport] = useState<any>(null)
  const [isShiftLoading, setIsShiftLoading] = useState(false)
  const [reportTime, setReportTime] = useState<string | null>(null)

  const loadBriefing = async () => {
    setIsBriefingLoading(true)
    try {
      const data = await generateBriefing('Operator')
      setBriefing(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsBriefingLoading(false)
    }
  }

  const triggerShiftReport = async () => {
    setIsShiftLoading(true)
    try {
      const now = new Date()
      const end = now.toISOString()
      const start = new Date(now.getTime() - 8 * 3600000).toISOString() // 8 hours ago
      const data = await generateShiftReport(start, end)
      setShiftReport(data)
      setReportTime(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
    } finally {
      setIsShiftLoading(false)
    }
  }

  useEffect(() => {
    loadBriefing()
  }, [])

  return (
    <>
      <PageHeader 
        title="AI Operational Reports" 
        subtitle="Automated shift summaries, capacity audits, and briefings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Triage Briefing */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                <h2 className="text-lg font-bold text-text-primary">Live Operations Briefing</h2>
              </div>
              <button
                onClick={loadBriefing}
                disabled={isBriefingLoading}
                className="text-xs font-semibold text-brand hover:text-brand-700 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isBriefingLoading && 'animate-spin')} />
                Re-generate
              </button>
            </div>
            
            {isBriefingLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs text-text-secondary">AI briefing generating...</span>
              </div>
            ) : briefing ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-bg-page border border-border text-sm leading-relaxed text-text-primary whitespace-pre-wrap font-sans">
                  {briefing.briefing}
                </div>
                {briefing.highlights && briefing.highlights.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Key Focus Areas</h4>
                    <div className="space-y-2">
                      {briefing.highlights.map((h: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
                          <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-text-tertiary">Failed to generate briefing. Please retry.</div>
            )}
          </div>
        </div>

        {/* Shift Handover Audit */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-text-primary" />
                <h2 className="text-lg font-bold text-text-primary">Shift Handover Summary</h2>
              </div>
              {reportTime && (
                <span className="text-xs text-text-tertiary tabular-nums">Generated {reportTime}</span>
              )}
            </div>

            {!shiftReport && !isShiftLoading ? (
              <div className="py-16 text-center">
                <Clock className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <h3 className="font-bold text-text-primary mb-1">Generate Shift Summary</h3>
                <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">Create a comprehensive handover report for the incoming shift lead.</p>
                <button
                  onClick={triggerShiftReport}
                  className="px-6 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-button font-bold text-sm transition-colors shadow-sm"
                >
                  Generate Shift Report
                </button>
              </div>
            ) : isShiftLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs text-text-secondary">Scanning databases and generating shift audit...</span>
              </div>
            ) : shiftReport ? (
              <div className="space-y-5">
                <div className="p-4 rounded-lg bg-bg-page border border-border text-sm leading-relaxed text-text-primary whitespace-pre-wrap font-sans">
                  {shiftReport.report}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shiftReport.pendingItems && shiftReport.pendingItems.length > 0 && (
                    <div className="p-4 rounded-lg bg-warning-bg border border-warning-border/40">
                      <h4 className="text-xs font-bold text-warning uppercase tracking-wider mb-2">Pending Items</h4>
                      <ul className="space-y-1.5 text-xs text-warning-800 font-medium">
                        {shiftReport.pendingItems.map((item: string, i: number) => (
                          <li key={i} className="flex gap-1.5 items-start">
                            <span className="text-warning font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {shiftReport.immediateActions && shiftReport.immediateActions.length > 0 && (
                    <div className="p-4 rounded-lg bg-critical-bg border border-critical-border/40">
                      <h4 className="text-xs font-bold text-critical uppercase tracking-wider mb-2">Immediate Actions</h4>
                      <ul className="space-y-1.5 text-xs text-critical-800 font-medium">
                        {shiftReport.immediateActions.map((action: string, i: number) => (
                          <li key={i} className="flex gap-1.5 items-start">
                            <span className="text-critical font-bold">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={triggerShiftReport}
                    className="px-4 py-2 border border-border text-text-primary text-xs font-bold rounded-button hover:bg-bg-page transition-colors"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-border text-text-primary text-xs font-bold rounded-button hover:bg-bg-page transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Report
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
