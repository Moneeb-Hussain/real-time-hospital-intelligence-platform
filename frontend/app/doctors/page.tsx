'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PageHeader, SkeletonTable, EmptyState } from '@/components/shared'
import { getResourcesInventory } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Doctor } from '@/types'
import { Stethoscope, Search, RefreshCw, Users, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = useCallback(async (notify = false) => {
    try {
      const inv = await getResourcesInventory()
      setDoctors(inv.doctors || [])
      if (notify) toast.success('Roster updated')
    } catch (e) {
      console.error(e)
      toast.error('Could not load doctors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(), 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const filtered = doctors.filter(
    (d) =>
      !searchTerm.trim() ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.specialty || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCount = doctors.filter((d) => d.onShift || d.status !== 'off_shift').length
  const availableCount = doctors.filter((d) => d.status === 'available').length
  const busyCount = doctors.filter((d) => d.status === 'busy').length

  const workloadChart = useMemo(
    () =>
      doctors
        .filter((d) => d.onShift || d.status !== 'off_shift')
        .map((d) => ({
          label: d.name.replace(/^Dr\.?\s*/i, '').split(' ')[0] || d.name,
          value: d.currentLoad || 0,
          max: d.maxLoad || 6,
        })),
    [doctors]
  )

  return (
    <>
      <PageHeader
        title="Doctors & Staffing"
        subtitle="Live clinical capacity, shifts, and patient load from the roster."
        actions={
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchData(true)
            }}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Roster
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="rounded-full bg-brand-50 p-3 text-brand">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              On Duty Today
            </span>
            <span className="text-2xl font-black text-text-primary mt-1 block">
              {loading ? '—' : activeCount}
            </span>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="rounded-full bg-accent-50 p-3 text-accent">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Available Now
            </span>
            <span className="text-2xl font-black text-accent mt-1 block">
              {loading ? '—' : availableCount}
            </span>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="rounded-full bg-red-50 p-3 text-critical">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Currently Busy
            </span>
            <span className="text-2xl font-black text-critical mt-1 block">
              {loading ? '—' : busyCount}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="card h-full flex flex-col">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-text-primary text-lg">Active Shift Roster</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  className="pl-9 h-9 w-full sm:w-64 rounded-button border border-border px-3 text-xs focus:outline-none focus:border-brand transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="p-6">
                <SkeletonTable rows={5} cols={4} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center flex-1 flex items-center justify-center">
                <EmptyState
                  title="No doctors found"
                  description="Try clearing your search or refreshing the roster."
                />
              </div>
            ) : (
              <div className="overflow-x-auto w-full flex-1">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                    <tr>
                      <th className="py-3 px-6 font-semibold">Doctor</th>
                      <th className="py-3 px-6 font-semibold">Specialty</th>
                      <th className="py-3 px-6 font-semibold">Status</th>
                      <th className="py-3 px-6 font-semibold">Workload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((doc) => (
                      <tr key={doc.id} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand flex items-center justify-center font-bold text-xs border border-brand-100">
                              {doc.avatarInitials ||
                                doc.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)}
                            </div>
                            <span className="font-semibold text-text-primary text-sm">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-text-secondary">
                          {doc.specialty}
                          {doc.department ? (
                            <span className="text-text-tertiary"> · {doc.department}</span>
                          ) : null}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded border capitalize',
                              doc.status === 'available'
                                ? 'bg-accent-50 text-accent border-accent-100'
                                : doc.status === 'busy'
                                  ? 'bg-warning-bg text-warning border-warning-border'
                                  : doc.status === 'break'
                                    ? 'bg-info-bg text-info border-info-border'
                                    : 'bg-bg-page text-text-tertiary border-border'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                doc.status === 'available'
                                  ? 'bg-accent'
                                  : doc.status === 'busy'
                                    ? 'bg-warning'
                                    : doc.status === 'break'
                                      ? 'bg-info'
                                      : 'bg-text-tertiary'
                              )}
                            />
                            {statusLabel(doc.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {doc.maxLoad ? (
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary font-medium text-xs tabular-nums w-8">
                                {doc.currentLoad}/{doc.maxLoad}
                              </span>
                              <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    doc.currentLoad >= doc.maxLoad
                                      ? 'bg-critical'
                                      : doc.currentLoad >= doc.maxLoad - 1
                                        ? 'bg-warning'
                                        : 'bg-brand'
                                  )}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (doc.currentLoad / doc.maxLoad) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-tertiary text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="card p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-text-primary text-lg mb-2">Workload Analysis</h3>
              <p className="text-text-secondary text-xs mb-6">
                Current patient load per doctor on the active shift.
              </p>
            </div>

            <div className="h-[250px] w-full flex-1">
              {loading ? (
                <div className="h-full flex items-center justify-center text-text-tertiary text-sm">
                  Loading…
                </div>
              ) : workloadChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadChart}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 9 }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#0D9488"
                      radius={[0, 4, 4, 0]}
                      name="Active Patients"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-tertiary text-sm">
                  No load metrics available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
