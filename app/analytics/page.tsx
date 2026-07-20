'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader, SkeletonTable } from '@/components/shared'
import { getCharts, getKpis } from '@/lib/api'
import { RefreshCw, TrendingUp, Clock, Users, Activity, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const COLORS = ['#EF4444', '#F59E0B', '#2563EB', '#22C55E']

export default function AnalyticsPage() {
  const [charts, setCharts] = useState<any>(null)
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [chartsData, kpisData] = await Promise.all([
        getCharts(),
        getKpis()
      ])
      setCharts(chartsData)
      setKpis(kpisData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <>
        <PageHeader title="Analytics & Insights" />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <span className="ml-3 text-sm text-text-secondary font-semibold">Generating insights...</span>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader 
        title="Analytics & Insights" 
        subtitle="Real-time trends, efficiency analysis, and load metrics."
        actions={
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Recalculate
          </button>
        }
      />

      {/* KPIs Grid */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-red-50 p-2 text-critical">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Critical P1</span>
            </div>
            <p className="text-3xl font-black text-text-primary tabular-nums">{kpis.criticalPatients}</p>
            <span className="text-xs text-critical font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />+{kpis.criticalTrend}% since last shift
            </span>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-amber-50 p-2 text-warning">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Queue Waiting</span>
            </div>
            <p className="text-3xl font-black text-text-primary tabular-nums">{kpis.waitingPatients}</p>
            <span className="text-xs text-accent font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />{kpis.waitingTrend}% change
            </span>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Avg Wait Time</span>
            </div>
            <p className="text-3xl font-black text-text-primary tabular-nums">
              {kpis.avgWaitMinutes}
              <span className="text-sm font-normal text-text-secondary ml-1">mins</span>
            </p>
            <span className="text-xs text-warning font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />+{kpis.avgWaitTrend}% from benchmark
            </span>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-brand-50 p-2 text-brand">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Health Index</span>
            </div>
            <p className="text-3xl font-black text-brand tabular-nums">{kpis.hospitalHealthScore}%</p>
            <div className="w-full bg-border h-1.5 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-brand" style={{ width: `${kpis.hospitalHealthScore}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Recharts Dashboard Grid */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Mix */}
          <div className="card p-6">
            <h3 className="font-bold text-text-primary text-base mb-4">Patient Priority Mix</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.priorityMix}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {charts.priorityMix.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: '12px' }} formatter={(v, name) => [v, `Priority ${name}`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Admissions */}
          <div className="card p-6">
            <h3 className="font-bold text-text-primary text-base mb-4">Daily Admissions (Last 7 Days)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.admissions7d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                  <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} name="Admissions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Wait Time Trend */}
          <div className="card p-6">
            <h3 className="font-bold text-text-primary text-base mb-4">Wait Time Trend (Today)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.waitTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: '12px' }} formatter={(v) => [`${v} min`, 'Avg Wait']} />
                  <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clinician Active Workloads */}
          <div className="card p-6">
            <h3 className="font-bold text-text-primary text-base mb-4">Active Staff Workload</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.doctorWorkload} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={{ border: '1px solid #E2E8F0', borderRadius: '12px' }} />
                  <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} name="Assigned Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
