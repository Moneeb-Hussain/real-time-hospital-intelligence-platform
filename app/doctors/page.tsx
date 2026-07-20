'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader, StatusDot, SkeletonTable, EmptyState } from '@/components/shared'
import { getDoctors, getCharts } from '@/lib/api'
import { doctorStatusColor, cn } from '@/lib/utils'
import type { Doctor } from '@/types'
import { Stethoscope, Search, RefreshCw, Users, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [charts, setCharts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    try {
      const [docData, chartData] = await Promise.all([
        getDoctors(),
        getCharts()
      ])
      setDoctors(docData || [])
      setCharts(chartData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCount = doctors.filter(d => d.onShift || d.status !== 'off_shift').length
  const availableCount = doctors.filter(d => d.status === 'available').length
  const busyCount = doctors.filter(d => d.status === 'busy').length

  return (
    <>
      <PageHeader 
        title="Doctors & Staffing" 
        subtitle="Monitor current clinical capacity, shifts, and load distribution."
        actions={
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Roster
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="rounded-full bg-brand-50 p-3 text-brand">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">On Duty Today</span>
            <span className="text-2xl font-black text-text-primary mt-1 block">{activeCount}</span>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="rounded-full bg-accent-50 p-3 text-accent">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Available Now</span>
            <span className="text-2xl font-black text-accent mt-1 block">{availableCount}</span>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="rounded-full bg-red-50 p-3 text-critical">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Currently Busy</span>
            <span className="text-2xl font-black text-critical mt-1 block">{busyCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Doctors Table */}
        <div className="lg:col-span-8">
          <div className="card h-full flex flex-col">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-text-primary text-lg">Active Shift Roster</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  className="pl-9 h-9 w-64 rounded-button border border-border px-3 text-xs focus:outline-none focus:border-brand transition-colors"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="p-6"><SkeletonTable rows={5} cols={4} /></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center flex-1 flex items-center justify-center">
                <EmptyState title="No Doctors Found" description="Try clearing your search or updating the roster." />
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
                    {filtered.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand flex items-center justify-center font-bold text-xs border border-brand-100">
                              {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-semibold text-text-primary text-sm">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-text-secondary">{doc.specialty}</td>
                        <td className="py-4 px-6">
                          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded border capitalize',
                            doc.status === 'available' ? 'bg-accent-50 text-accent border-accent-100' :
                            doc.status === 'busy' ? 'bg-warning-bg text-warning border-warning-border' :
                            doc.status === 'break' ? 'bg-info-bg text-info border-info-border' :
                            'bg-bg-page text-text-tertiary border-border'
                          )}>
                            <span className={cn('w-1.5 h-1.5 rounded-full',
                              doc.status === 'available' ? 'bg-accent' :
                              doc.status === 'busy' ? 'bg-warning' :
                              doc.status === 'break' ? 'bg-info' :
                              'bg-text-tertiary'
                            )} />
                            {doc.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {doc.currentLoad !== undefined && doc.maxLoad ? (
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary font-medium text-xs tabular-nums w-8">{doc.currentLoad}/{doc.maxLoad}</span>
                              <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                                <div 
                                  className={cn('h-full rounded-full transition-all duration-500', 
                                    doc.currentLoad >= doc.maxLoad ? 'bg-critical' : 
                                    doc.currentLoad >= doc.maxLoad - 1 ? 'bg-warning' : 
                                    'bg-brand'
                                  )}
                                  style={{ width: `${(doc.currentLoad / doc.maxLoad) * 100}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-tertiary text-xs italic">Off Shift</span>
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

        {/* Load Distribution Chart */}
        <div className="lg:col-span-4">
          <div className="card p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-text-primary text-lg mb-2">Workload Analysis</h3>
              <p className="text-text-secondary text-xs mb-6">Patient allocation limits versus current active load.</p>
            </div>
            
            <div className="h-[250px] w-full flex-1">
              {loading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
              ) : charts?.doctorWorkload ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.doctorWorkload} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 9 }} width={90} />
                    <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" fill="#0D9488" radius={[0, 4, 4, 0]} name="Active Patients" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-tertiary text-sm">No load metrics available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Loader icon helper
function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
