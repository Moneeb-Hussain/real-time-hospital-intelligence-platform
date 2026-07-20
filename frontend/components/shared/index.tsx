'use client';

import React from 'react'
import { motion } from 'framer-motion'
import { Inbox, Clock, AlertTriangle } from 'lucide-react'
import { cn, priorityClasses } from '@/lib/utils'
import type { Priority } from '@/types'

// ── PRIORITY BADGE ────────────────────────────────────────────────────────
export function PriorityBadge({ priority, size = 'md' }: { priority: Priority; size?: 'sm' | 'md' }) {
  const { bg, text, border, dot } = priorityClasses(priority)
  return (
    <span className={cn('priority-badge border', bg, text, border, size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1')}>
      <span className={cn('w-2 h-2 rounded-full', dot, priority === 'P1' && 'animate-pulse')} />
      {priority}
    </span>
  )
}

// ── VITAL CHIP ────────────────────────────────────────────────────────────
export function VitalChip({ label, value, unit, status = 'normal' }: { label: string; value: string | number; unit?: string; status?: 'normal' | 'warning' | 'critical' }) {
  const bg = status === 'normal' ? 'bg-bg-page' : status === 'warning' ? 'bg-warning-bg' : 'bg-critical-bg'
  const text = status === 'normal' ? 'text-text-primary' : status === 'warning' ? 'text-warning' : 'text-critical'
  
  return (
    <div className={cn('vital-chip', bg)}>
      <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">{label}</span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={cn('vitals text-lg font-bold', text)}>{value}</span>
        {unit && <span className="text-xs text-text-tertiary">{unit}</span>}
      </div>
    </div>
  )
}

// ── CONFIDENCE BAR ────────────────────────────────────────────────────────
export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-success' : value >= 60 ? 'bg-ai' : 'bg-critical'
  const labelText = value >= 85 ? 'High Confidence' : value >= 60 ? 'Moderate' : 'Low'
  const labelColor = value >= 85 ? 'text-success' : value >= 60 ? 'text-warning' : 'text-critical'

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-xs font-medium">
        <span>{value}%</span>
        <span className={labelColor}>{labelText}</span>
      </div>
      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn('h-full', color)}
        />
      </div>
    </div>
  )
}

// ── STATUS DOT ────────────────────────────────────────────────────────────
export function StatusDot({ status, label }: { status: 'available' | 'busy' | 'critical' | 'warning' | 'normal' | 'off_shift' | 'maintenance'; label?: boolean }) {
  let bg = 'bg-success'
  if (status === 'busy' || status === 'warning' || status === 'maintenance') bg = 'bg-warning'
  if (status === 'critical') bg = 'bg-critical'
  if (status === 'off_shift') bg = 'bg-text-tertiary'

  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-2.5 h-2.5 rounded-full', bg)} />
      {label && <span className="text-sm capitalize">{status.replace('_', ' ')}</span>}
    </div>
  )
}

// ── LOADING SPINNER ───────────────────────────────────────────────────────
export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-10 h-10'
  return (
    <div className={cn('animate-spin border-4 border-border border-t-brand rounded-full', dims, className)} />
  )
}

// ── SKELETON ──────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-[#E2E8F0] animate-pulse rounded', className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card p-4 space-y-4", className)}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonKpiCard() {
  return (
    <div className="card p-4">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────
export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="text-text-tertiary mb-4">{icon || <Inbox className="w-12 h-12" />}</div>
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      <p className="text-text-secondary text-sm mt-1">{description}</p>
    </div>
  )
}

// ── COMING SOON ───────────────────────────────────────────────────────────
export function ComingSoon({ feature, description }: { feature: string; description?: string }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-16">
      <Clock className="w-16 h-16 text-ai mb-4" />
      <div className="text-ai font-semibold uppercase tracking-wider text-sm mb-2">Coming Soon</div>
      <h2 className="text-2xl font-bold mb-2">{feature}</h2>
      <p className="text-text-secondary mb-4">{description || 'This feature is currently in development.'}</p>
      <span className="text-xs text-text-tertiary">Planned for the next release.</span>
    </div>
  )
}

// ── PAGE HEADER ───────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start pb-6 border-b border-border mb-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}

// ── ERROR BOUNDARY ────────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="card border-critical-border bg-critical-bg p-6 flex flex-col items-center text-center">
          <AlertTriangle className="w-10 h-10 text-critical mb-4" />
          <h3 className="text-lg font-bold text-critical mb-2">Something went wrong in this widget.</h3>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <p className="text-xs text-text-secondary bg-bg-page p-2 rounded mb-4 max-w-md overflow-auto text-left">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-bg-card border border-border rounded-button text-sm font-medium hover:bg-bg-page"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
