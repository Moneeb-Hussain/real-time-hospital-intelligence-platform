'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader, SkeletonTable, EmptyState } from '@/components/shared'
import { getSnapshot } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Syringe, Search, RefreshCw, Layers } from 'lucide-react'

interface EquipmentItem {
  id: string
  label: string
  type: string
  status: 'available' | 'in_use' | 'maintenance'
  assignedPatientId?: string | null
}

export default function EquipmentPage() {
  const [snapshot, setSnapshot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    try {
      const snap = await getSnapshot()
      setSnapshot(snap)
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

  // Flatten equipment categories from snapshot summary
  const equipmentList: EquipmentItem[] = []
  const counts: Record<string, { available: number; total: number }> = {}

  if (snapshot?.equipment) {
    Object.entries(snapshot.equipment).forEach(([key, val]: [string, any]) => {
      counts[key] = {
        available: val.available || 0,
        total: val.total || 0
      }

      // Add actual items if they exist
      if (val.availableItems) {
        val.availableItems.forEach((item: any) => {
          equipmentList.push({
            id: item.id,
            label: item.label || item.name || `${key.toUpperCase()}-${item.id}`,
            type: key,
            status: 'available',
            assignedPatientId: null
          })
        })
      }

      const inUseCount = (val.total || 0) - (val.available || 0)
      for (let i = 0; i < inUseCount; i++) {
        equipmentList.push({
          id: `occupied-${key}-${i}`,
          label: `${key.toUpperCase()}-Occ-${i + 1}`,
          type: key,
          status: 'in_use',
          assignedPatientId: 'Active Patient'
        })
      }
    })
  }

  const filtered = equipmentList.filter(e =>
    e.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const total = equipmentList.length
  const available = equipmentList.filter(e => e.status === 'available').length
  const inUse = equipmentList.filter(e => e.status === 'in_use').length
  const utilization = total > 0 ? Math.round((inUse / total) * 100) : 0

  return (
    <>
      <PageHeader
        title="Medical Equipment & Assets"
        subtitle="Track availability and deployment of critical medical devices."
        actions={
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card p-5 text-center">
          <span className="text-xs font-bold text-text-secondary uppercase block mb-1">Total Assets</span>
          <span className="text-3xl font-black text-text-primary tabular-nums">{total}</span>
        </div>
        <div className="card p-5 text-center">
          <span className="text-xs font-bold text-text-secondary uppercase block mb-1">Available Now</span>
          <span className="text-3xl font-black text-accent tabular-nums">{available}</span>
        </div>
        <div className="card p-5 text-center">
          <span className="text-xs font-bold text-text-secondary uppercase block mb-1">In Use</span>
          <span className="text-3xl font-black text-brand tabular-nums">{inUse}</span>
        </div>
        <div className="card p-5 text-center">
          <span className="text-xs font-bold text-text-secondary uppercase block mb-1">Utilization</span>
          <span className="text-3xl font-black text-blue-600 tabular-nums">{utilization}%</span>
        </div>
      </div>

      {/* Equipment Categories Breakdowns */}
      {Object.keys(counts).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {Object.entries(counts).map(([type, val]) => {
            const usagePct = val.total > 0 ? Math.round(((val.total - val.available) / val.total) * 100) : 0
            return (
              <div key={type} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Syringe className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wide truncate">{type.replace(/([A-Z])/g, ' $1')}</span>
                </div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xl font-black text-text-primary tabular-nums">{val.available} free</span>
                  <span className="text-xs text-text-tertiary tabular-nums">of {val.total} total</span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full rounded-full', 
                      val.available === 0 ? 'bg-critical' : 
                      val.available <= 1 ? 'bg-warning' : 
                      'bg-accent'
                    )}
                    style={{ width: `${(val.available / val.total) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Inventory Table */}
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
              className="pl-9 h-9 w-64 rounded-button border border-border px-3 text-xs focus:outline-none focus:border-brand transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6"><SkeletonTable rows={6} cols={4} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState title="No Assets Found" description="Try broadening your search or refreshing." />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[500px]">
              <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                <tr>
                  <th className="py-3 px-6 font-semibold">Label</th>
                  <th className="py-3 px-6 font-semibold">Category</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Assigned Patient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(eq => (
                  <tr key={eq.id} className="hover:bg-bg-page/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-semibold text-text-primary">{eq.label}</td>
                    <td className="py-4 px-6 text-sm text-text-secondary capitalize">{eq.type.replace(/([A-Z])/g, ' $1')}</td>
                    <td className="py-4 px-6">
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-chip text-xs font-semibold border capitalize',
                        eq.status === 'available' ? 'bg-accent-50 text-accent border-accent-100' :
                        eq.status === 'in_use' ? 'bg-brand-50 text-brand border-brand-100' :
                        'bg-warning-bg text-warning border-warning-border'
                      )}>
                        {eq.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-text-tertiary font-mono">{eq.assignedPatientId || '—'}</td>
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
