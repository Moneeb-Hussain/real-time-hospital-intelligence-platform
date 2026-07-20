'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader, PriorityBadge, StatusDot, SkeletonTable, EmptyState } from '@/components/shared'
import { getPatientQueue } from '@/lib/api'
import { priorityToBand, scoreColor, formatWait, minutesAgo, cn } from '@/lib/utils'
import type { Patient } from '@/types'
import { Search, Filter, UserPlus, ArrowRight } from 'lucide-react'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [waitTimes, setWaitTimes] = useState<Record<string, number>>({})

  const fetchPatients = async () => {
    try {
      const res = await getPatientQueue()
      setPatients(res.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
    const interval = setInterval(fetchPatients, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const calc = () => {
      const w: Record<string, number> = {}
      patients.forEach(p => w[p.id] = minutesAgo(p.arrivedAt))
      setWaitTimes(w)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [patients])

  const filteredPatients = patients
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.displayId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesPriority && matchesStatus
    })
    .sort((a, b) => {
      const bandDiff = priorityToBand(a.priority) - priorityToBand(b.priority)
      if (bandDiff !== 0) return bandDiff
      return b.urgencyScore - a.urgencyScore
    })

  return (
    <>
      <PageHeader 
        title="Patient Directory" 
        subtitle="Manage and track patients across all stages of triage and treatment."
        actions={
          <Link 
            href="/intake" 
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Patient Intake
          </Link>
        }
      />

      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name or patient ID..."
              className="pl-9 h-10 w-full rounded-button border border-border px-3 text-sm focus:outline-none focus:border-brand transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase">Priority:</span>
              <select
                className="h-10 rounded-button border border-border px-3 text-sm bg-white focus:outline-none focus:border-brand"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - Urgent</option>
                <option value="P3">P3 - Moderate</option>
                <option value="P4">P4 - Stable</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase">Status:</span>
              <select
                className="h-10 rounded-button border border-border px-3 text-sm bg-white focus:outline-none focus:border-brand"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="assigned">Assigned</option>
                <option value="in_treatment">In Treatment</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-6">
          <SkeletonTable rows={8} cols={7} />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="card p-12 text-center">
          <EmptyState 
            title="No Patients Found" 
            description="Adjust your filters or add a new patient to the queue." 
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[800px]">
              <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                <tr>
                  <th className="py-3 px-6 font-semibold">ID</th>
                  <th className="py-3 px-6 font-semibold">Patient</th>
                  <th className="py-3 px-6 font-semibold">Priority</th>
                  <th className="py-3 px-6 font-semibold">Urgency Score</th>
                  <th className="py-3 px-6 font-semibold">Wait Time</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPatients.map(p => {
                  const wait = waitTimes[p.id] ?? 0
                  let mappedStatus: 'warning' | 'normal' | 'available' | 'busy' = 'normal'
                  if (p.status === 'waiting') mappedStatus = 'warning'
                  else if (p.status === 'assigned') mappedStatus = 'available'
                  else if (p.status === 'in_treatment') mappedStatus = 'busy'

                  return (
                    <tr key={p.id} className="hover:bg-bg-page/50 transition-colors">
                      <td className="py-4 px-6 text-xs font-mono text-text-tertiary">{p.displayId}</td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-text-primary">{p.name}</div>
                        <div className="text-xs text-text-secondary">
                          {p.age} yrs • {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <PriorityBadge priority={p.priority} size="sm" />
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn('font-bold tabular-nums text-sm bg-bg-page px-2.5 py-1 rounded border border-border/50', scoreColor(p.urgencyScore))}>
                          {p.urgencyScore}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium tabular-nums">{formatWait(wait)}</td>
                      <td className="py-4 px-6">
                        <StatusDot status={mappedStatus} label={true} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link 
                          href={`/recommendation/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-700 transition-colors hover:underline"
                        >
                          AI Workspace <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
