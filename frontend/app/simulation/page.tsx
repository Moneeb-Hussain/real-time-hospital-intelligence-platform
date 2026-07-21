'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/shared'
import { runSimulation } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Activity, RefreshCw, AlertTriangle, TrendingUp, CheckCircle2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const SCENARIOS = [
  {
    id: 'surge',
    label: 'Mass Casualty Event',
    description: '+20 patients in 2 hours (8 P1 / 12 P2)',
    severity: 'high',
    params: {
      incomingCritical: 8,
      incomingUrgent: 12,
      likelyNeedsICU: 6,
      likelyNeedsVentilator: 3,
      likelyNeedsMonitor: 5,
      arrivalWindowMinutes: 120,
    },
  },
  {
    id: 'staff',
    label: 'Staff Shortage',
    description: 'Moderate arrivals with strained doctor capacity',
    severity: 'medium',
    params: {
      incomingCritical: 3,
      incomingUrgent: 6,
      likelyNeedsICU: 2,
      likelyNeedsVentilator: 1,
      likelyNeedsMonitor: 3,
      arrivalWindowMinutes: 240,
    },
  },
  {
    id: 'equipment',
    label: 'Equipment Failure',
    description: 'ICU pressure with high vent / monitor demand',
    severity: 'high',
    params: {
      incomingCritical: 4,
      incomingUrgent: 4,
      likelyNeedsICU: 4,
      likelyNeedsVentilator: 4,
      likelyNeedsMonitor: 6,
      arrivalWindowMinutes: 90,
    },
  },
  {
    id: 'normal',
    label: 'Normal Load',
    description: 'Standard weekday arrivals against live capacity',
    severity: 'low',
    params: {
      incomingCritical: 1,
      incomingUrgent: 3,
      likelyNeedsICU: 1,
      likelyNeedsVentilator: 0,
      likelyNeedsMonitor: 1,
      arrivalWindowMinutes: 60,
    },
  },
] as const

function riskTone(level: string) {
  const l = (level || '').toUpperCase()
  if (l === 'CRITICAL' || l === 'HIGH') {
    return {
      box: 'border-critical-border bg-critical-bg',
      icon: 'text-critical',
    }
  }
  if (l === 'MEDIUM') {
    return {
      box: 'border-warning-border bg-warning-bg',
      icon: 'text-warning',
    }
  }
  return {
    box: 'border-accent-100 bg-accent-50',
    icon: 'text-accent',
  }
}

export default function SimulationPage() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  const handleRun = async () => {
    if (!selectedScenario) return
    const scenario = SCENARIOS.find((s) => s.id === selectedScenario)
    if (!scenario) return

    setIsRunning(true)
    setResult(null)
    try {
      const data = await runSimulation({
        scenario: scenario.id,
        ...scenario.params,
      })
      setResult(data)
    } catch (e) {
      console.error('Simulation error:', e)
      toast.error('Simulation failed — check the API is running')
    } finally {
      setIsRunning(false)
    }
  }

  const impact = result?.projectedImpact || {}
  const erWait =
    impact.projectedAvgWaitMinutes ?? impact.erWaitTime ?? impact.waitTimeChangeMinutes ?? 0
  const icuOcc = impact.icuOccupancyPercentage ?? impact.icuOccupancy ?? 0
  const staffStress =
    impact.doctorLoadChangePercentage ?? impact.staffStressIndex ?? 0

  return (
    <>
      <PageHeader
        title="Simulation Engine"
        subtitle="Run what-if scenarios against live hospital capacity."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-ai" />
            <h3 className="text-lg font-bold text-text-primary">Select Scenario</h3>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Choose a scenario — projections use current beds, doctors, and queue.
          </p>

          <div className="space-y-3 mb-6">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelectedScenario(scenario.id)}
                className={cn(
                  'w-full text-left p-4 rounded-card border-2 cursor-pointer transition-all',
                  selectedScenario === scenario.id
                    ? 'border-brand bg-brand-50'
                    : 'border-border hover:border-border-strong'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-text-primary text-sm">{scenario.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{scenario.description}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-chip text-xs font-semibold border shrink-0',
                      scenario.severity === 'high'
                        ? 'bg-critical-bg text-critical border-critical-border'
                        : scenario.severity === 'medium'
                          ? 'bg-warning-bg text-warning border-warning-border'
                          : 'bg-accent-50 text-accent border-accent-100'
                    )}
                  >
                    {scenario.severity}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={!selectedScenario || isRunning}
            className="w-full px-4 py-3 bg-brand text-white rounded-button font-bold text-sm hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            {isRunning ? 'Running Simulation...' : 'Run Simulation'}
          </button>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-text-primary" />
            <h3 className="text-lg font-bold text-text-primary">Simulation Results</h3>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Projected impact and actions based on live capacity.
          </p>

          {!result && !isRunning && (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <Activity className="h-12 w-12 mb-3" />
              <p className="text-sm">Select a scenario and run the simulation.</p>
            </div>
          )}

          {isRunning && (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-brand mb-3" />
              <p className="text-sm text-text-secondary animate-pulse">
                Running simulation against live capacity...
              </p>
            </div>
          )}

          {result && !isRunning && (
            <div className="space-y-5">
              <div className={cn('p-4 rounded-card border-2', riskTone(result.riskLevel).box)}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={cn('h-5 w-5', riskTone(result.riskLevel).icon)} />
                  <span className="font-bold text-sm text-text-primary">
                    Risk Level: {result.riskLevel}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{result.summary}</p>
              </div>

              {result.baseline && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'ICU free', value: result.baseline.icuAvailable },
                    { label: 'ER free', value: result.baseline.erAvailable },
                    { label: 'Doctors', value: result.baseline.doctorsAvailable },
                    { label: 'Waiting', value: result.baseline.waitingNow },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-2 rounded-lg bg-bg-page border border-border"
                    >
                      <p className="text-lg font-black tabular-nums text-text-primary">
                        {item.value ?? '—'}
                      </p>
                      <p className="text-[10px] text-text-tertiary uppercase font-semibold">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {result.projectedImpact && (
                <div>
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                    Projected Impact
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Avg Wait', value: `${erWait} min`, color: 'text-warning' },
                      { label: 'ICU %', value: `${icuOcc}%`, color: 'text-critical' },
                      { label: 'Doctor Load', value: `${staffStress}%`, color: 'text-brand' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="text-center p-3 bg-bg-page rounded-card border border-border"
                      >
                        <p className={cn('text-xl font-black tabular-nums', item.color)}>
                          {item.value}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.bottlenecks && result.bottlenecks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-critical uppercase tracking-wider mb-2">
                    Bottlenecks Detected
                  </h4>
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
                  <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-2">
                    Recommended Actions
                  </h4>
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
