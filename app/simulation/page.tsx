'use client'

import React, { useState } from 'react'
import { PageHeader, EmptyState } from '@/components/shared'
import { runSimulation, getKpis, getSnapshot } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Activity, RefreshCw, AlertTriangle, TrendingUp, CheckCircle2, Zap } from 'lucide-react'

const SCENARIOS = [
  { id: 'surge', label: 'Mass Casualty Event', description: '+20 patients in 2 hours', severity: 'high' },
  { id: 'staff', label: 'Staff Shortage', description: '50% doctor capacity for 4 hours', severity: 'medium' },
  { id: 'equipment', label: 'Equipment Failure', description: 'ICU ventilators reduced by 50%', severity: 'high' },
  { id: 'normal', label: 'Normal Load', description: 'Standard weekday operations', severity: 'low' },
]

export default function SimulationPage() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  const handleRun = async () => {
    if (!selectedScenario) return
    setIsRunning(true)
    setResult(null)
    try {
      const data = await runSimulation({ scenario: selectedScenario })
      setResult(data)
    } catch (e) {
      console.error('Simulation error:', e)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Simulation Engine"
        subtitle="Run AI-powered hospital scenario simulations to prepare for critical events."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Selection */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-ai" />
            <h3 className="text-lg font-bold text-text-primary">Select Scenario</h3>
          </div>
          <p className="text-sm text-text-secondary mb-6">Choose a scenario to simulate and analyze projected impact.</p>

          <div className="space-y-3 mb-6">
            {SCENARIOS.map(scenario => (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={cn(
                  'p-4 rounded-card border-2 cursor-pointer transition-all',
                  selectedScenario === scenario.id
                    ? 'border-brand bg-brand-50'
                    : 'border-border hover:border-border-strong'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-text-primary text-sm">{scenario.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{scenario.description}</p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-chip text-xs font-semibold border',
                    scenario.severity === 'high' ? 'bg-critical-bg text-critical border-critical-border' :
                    scenario.severity === 'medium' ? 'bg-warning-bg text-warning border-warning-border' :
                    'bg-accent-50 text-accent border-accent-100'
                  )}>
                    {scenario.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleRun}
            disabled={!selectedScenario || isRunning}
            className="w-full px-4 py-3 bg-brand text-white rounded-button font-bold text-sm hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            {isRunning ? 'Running Simulation...' : 'Run Simulation'}
          </button>
        </div>

        {/* Results */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-text-primary" />
            <h3 className="text-lg font-bold text-text-primary">Simulation Results</h3>
          </div>
          <p className="text-sm text-text-secondary mb-6">AI-projected impact and recommendations.</p>

          {!result && !isRunning && (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <Activity className="h-12 w-12 mb-3" />
              <p className="text-sm">Select a scenario and run the simulation.</p>
            </div>
          )}

          {isRunning && (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-brand mb-3" />
              <p className="text-sm text-text-secondary animate-pulse">Running AI simulation...</p>
            </div>
          )}

          {result && !isRunning && (
            <div className="space-y-5">
              <div className={cn(
                'p-4 rounded-card border-2',
                result.riskLevel === 'High' ? 'border-critical-border bg-critical-bg' : 'border-warning-border bg-warning-bg'
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={cn('h-5 w-5', result.riskLevel === 'High' ? 'text-critical' : 'text-warning')} />
                  <span className="font-bold text-sm text-text-primary">Risk Level: {result.riskLevel}</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{result.summary}</p>
              </div>

              {result.projectedImpact && (
                <div>
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Projected Impact</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'ER Wait', value: `${result.projectedImpact.erWaitTime} min`, color: 'text-warning' },
                      { label: 'ICU %', value: `${result.projectedImpact.icuOccupancy}%`, color: 'text-critical' },
                      { label: 'Staff Stress', value: `${result.projectedImpact.staffStressIndex}%`, color: 'text-brand' },
                    ].map(item => (
                      <div key={item.label} className="text-center p-3 bg-bg-page rounded-card border border-border">
                        <p className={cn('text-xl font-black tabular-nums', item.color)}>{item.value}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.bottlenecks && result.bottlenecks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-critical uppercase tracking-wider mb-2">Bottlenecks Detected</h4>
                  <ul className="space-y-1.5">
                    {result.bottlenecks.map((b: string, i: number) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-critical mt-0.5 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendedActions && result.recommendedActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Recommended Actions</h4>
                  <ul className="space-y-1.5">
                    {result.recommendedActions.map((a: string, i: number) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
