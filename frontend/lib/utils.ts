import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import type { Priority, BedStatus, DoctorStatus, AlertSeverity } from '@/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatTime(iso: string): string {
  try { return format(new Date(iso), 'HH:mm') } catch { return '--:--' }
}

export function formatDateTime(iso: string): string {
  try { return format(new Date(iso), 'MMM d, HH:mm') } catch { return 'Invalid' }
}

export function timeAgo(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }) }
  catch { return 'Unknown' }
}

export function minutesAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
}

export function formatWait(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function priorityClasses(priority: Priority): { bg: string; text: string; border: string; dot: string } {
  switch (priority) {
    case 'P1': return { bg: 'bg-p1-bg', text: 'text-p1-text', border: 'border-p1', dot: 'bg-critical' }
    case 'P2': return { bg: 'bg-p2-bg', text: 'text-p2-text', border: 'border-p2', dot: 'bg-warning' }
    case 'P3': return { bg: 'bg-p3-bg', text: 'text-p3-text', border: 'border-p3', dot: 'bg-info' }
    case 'P4': return { bg: 'bg-p4-bg', text: 'text-p4-text', border: 'border-p4', dot: 'bg-success' }
    default: return { bg: 'bg-p4-bg', text: 'text-p4-text', border: 'border-p4', dot: 'bg-success' }
  }
}

export function priorityToBand(priority: Priority): number {
  switch (priority) {
    case 'P1': return 1
    case 'P2': return 2
    case 'P3': return 3
    case 'P4': return 4
  }
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-critical'
  if (score >= 50) return 'text-warning'
  if (score >= 25) return 'text-info'
  return 'text-success'
}

export function bedStatusColor(status: BedStatus): string {
  switch (status) {
    case 'available': return 'text-success'
    case 'occupied': return 'text-critical'
    case 'maintenance': return 'text-warning'
  }
}

export function doctorStatusColor(status: DoctorStatus): string {
  switch (status) {
    case 'available': return 'text-success'
    case 'busy': return 'text-warning'
    case 'off_shift': return 'text-text-tertiary'
    case 'break': return 'text-info'
  }
}

export function alertSeverityClasses(severity: AlertSeverity): { bg: string; border: string; text: string; icon: string } {
  switch (severity) {
    case 'critical': return { bg: 'bg-critical-bg', border: 'border-critical-border', text: 'text-critical', icon: 'text-critical' }
    case 'warning': return { bg: 'bg-warning-bg', border: 'border-warning-border', text: 'text-warning', icon: 'text-warning' }
    case 'info': return { bg: 'bg-info-bg', border: 'border-info-border', text: 'text-info', icon: 'text-info' }
  }
}

export function occupancyColor(pct: number): string {
  if (pct >= 100) return 'bg-critical'
  if (pct >= 85) return 'bg-warning'
  if (pct >= 70) return 'bg-brand'
  return 'bg-success'
}

export function occupancyStatus(pct: number): 'normal' | 'busy' | 'critical' | 'full' {
  if (pct >= 100) return 'full'
  if (pct >= 85) return 'critical'
  if (pct >= 70) return 'busy'
  return 'normal'
}

export function formatAlertType(type: string): string {
  return type.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
