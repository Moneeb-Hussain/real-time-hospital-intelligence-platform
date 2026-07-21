'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PageHeader, SkeletonTable, EmptyState } from '@/components/shared'
import { getResourcesInventory } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Syringe, Search, RefreshCw, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

type EquipRow = {
  id: string
  label: string
  type: string
  typeLabel?: string
  status: string
  assignedPatientId: string | null
  patientName?: string | null
}

function statusLabel(status: string) {
  if (status === 'in_use') return 'In use'
  return status.replace(/_/g, ' ')
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = useCallback(async (notify = false) => {
    try {
      const inv = await getResourcesInventory()
      setEquipment(inv.equipment || [])
      if (notify) toast.success('Equipment updated')
    } catch (e) {
      console.error(e)
      toast.error('Could not load equipment')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(), 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const filtered = equipment.filter((e) => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return true
    return (
      e.label.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      (e.typeLabel || e.type).toLowerCase().includes(q) ||
      (e.patientName || '').toLowerCase().includes(q)
    )
  })

  const total = equipment.length
  const available = equipment.filter((e) => e.status === 'available').length
  const inUse = equipment.filter((e) => e.status === 'in_use' || e.status === 'occupied').length
  const utilization = total > 0 ? Math.round((inUse / total) * 100) : 0

  const byType = useMemo(() => {
    const map: Record<string, { label: string; available: number; total: number }> = {}
    for (const eq of equipment) {
      const key = eq.type || 'other'
      if (!map[key]) {
        map[key] = {
          label: eq.typeLabel || key.replace(/_/g, ' '),
          available: 0,
          total: 0,
        }
      }
      map[key].total += 1
      if (eq.status === 'available') map[key].available += 1
    }
    return Object.entries(map).sort((a, b) => a[1].label.localeCompare(b[1].label))
  }, [equipment])

  return (
    <>
      <PageHeader
        title="Medical Equipment & Assets"
        subtitle="Live availability and assignment of critical medical devices."
        actions={
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchData(true)
            }}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card p-5 text-center">
          <span className="text-xs font-bold text-text-secondary uppercase block mb-1">
            Total Assets
          </span>
          <span className="text-3xl font-black text-text-primary tabular-nums">
            {loading ? '—' : total}
          </span>
        </div>
        <div className="card p-5 text-center">
          <span className="text-xs font-bold text-text-secondary uppercase block mb-1">
            Available Now
          </span>
          <span className="text-3xl font-black text-accent tabular-nums">
            {loading ? '—' : available}
          </span>
        </div>
        <div className="card p-5 text-center">
          <span className="text-xs font-bold text-text-secondary uppercase block mb-1">In Use</span>
          <span className="text-3xl font-black text-brand tabular-nums">
            {loading ? '—' : inUse}
          </span>
        </div>
        <div className="card p-5 text-center">
          <span className="text-xs font-bold text-text-secondary uppercase block mb-1">
            Utilization
          </span>
          <span className="text-3xl font-black text-blue-600 tabular-nums">
            {loading ? '—' : `${utilization}%`}
          </span>
        </div>
      </div>

      {byType.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {byType.map(([type, val]) => (
            <div key={type} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Syringe className="w-4 h-4 text-brand" />
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wide truncate capitalize">
                  {val.label}
                </span>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xl font-black text-text-primary tabular-nums">
                  {val.available} free
                </span>
                <span className="text-xs text-text-tertiary tabular-nums">of {val.total} total</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    val.available === 0
                      ? 'bg-critical'
                      : val.available <= 1
                        ? 'bg-warning'
                        : 'bg-accent'
                  )}
                  style={{
                    width: `${val.total ? (val.available / val.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card h-full flex flex-col">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-text-primary text-lg">Equipment Directory</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by label or category..."
              className="pl-9 h-9 w-full sm:w-64 rounded-button border border-border px-3 text-xs focus:outline-none focus:border-brand transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={6} cols={4} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title="No assets found"
              description="Try broadening your search or refreshing."
            />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[500px]">
              <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                <tr>
                  <th className="py-3 px-6 font-semibold">Asset</th>
                  <th className="py-3 px-6 font-semibold">Category</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Assigned Patient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((eq) => (
                  <tr key={eq.id} className="hover:bg-bg-page/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-sm font-semibold text-text-primary">{eq.label}</div>
                      <div className="text-[10px] text-text-tertiary font-mono">{eq.id}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-text-secondary capitalize">
                      {eq.typeLabel || eq.type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-chip text-xs font-semibold border capitalize',
                          eq.status === 'available'
                            ? 'bg-accent-50 text-accent border-accent-100'
                            : eq.status === 'in_use' || eq.status === 'occupied'
                              ? 'bg-brand-50 text-brand border-brand-100'
                              : 'bg-warning-bg text-warning border-warning-border'
                        )}
                      >
                        {statusLabel(eq.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-text-secondary">
                      {eq.patientName || eq.assignedPatientId || (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
