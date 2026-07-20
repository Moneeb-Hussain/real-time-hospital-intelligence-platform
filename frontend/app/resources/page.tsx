'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader, SkeletonTable, StatusDot, EmptyState } from '@/components/shared'
import { getSnapshot, getDoctors } from '@/lib/api'
import { cn, formatWait, scoreColor } from '@/lib/utils'
import { Bed, Stethoscope, Syringe, Search, RefreshCw } from 'lucide-react'

export default function ResourcesPage() {
  const [snapshot, setSnapshot] = useState<any>(null)
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'beds' | 'doctors' | 'equipment'>('beds')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    try {
      const [snap, docs] = await Promise.all([
        getSnapshot(),
        getDoctors()
      ])
      setSnapshot(snap)
      setDoctors(docs || [])
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

  // Parse Beds
  const bedsList: any[] = []
  if (snapshot?.beds) {
    Object.entries(snapshot.beds).forEach(([unit, data]: [string, any]) => {
      if (data.availableBeds) {
        data.availableBeds.forEach((b: any) => {
          bedsList.push({
            id: b.id,
            label: b.label || b.name || `${unit.toUpperCase()}-${b.id}`,
            unit: unit.toUpperCase(),
            status: 'available',
            patientId: null
          })
        })
      }
      const occupied = (data.total || 0) - (data.available || 0)
      for (let i = 0; i < occupied; i++) {
        bedsList.push({
          id: `occ-${unit}-${i}`,
          label: `${unit.toUpperCase()}-Occ-${i + 1}`,
          unit: unit.toUpperCase(),
          status: 'occupied',
          patientId: 'Active Patient'
        })
      }
    })
  }

  // Parse Equipment
  const equipmentList: any[] = []
  if (snapshot?.equipment) {
    Object.entries(snapshot.equipment).forEach(([key, val]: [string, any]) => {
      if (val.availableItems) {
        val.availableItems.forEach((item: any) => {
          equipmentList.push({
            id: item.id,
            label: item.label || item.name || `${key.toUpperCase()}-${item.id}`,
            type: key,
            status: 'available',
            patientId: null
          })
        })
      }
      const occupied = (val.total || 0) - (val.available || 0)
      for (let i = 0; i < occupied; i++) {
        equipmentList.push({
          id: `occupied-${key}-${i}`,
          label: `${key.toUpperCase()}-Occ-${i + 1}`,
          type: key,
          status: 'in_use',
          patientId: 'Active Patient'
        })
      }
    })
  }

  const freeBeds = bedsList.filter(b => b.status === 'available').length
  const freeDocs = doctors.filter(d => d.status === 'available' || d.status === 'active').length
  const freeEquip = equipmentList.filter(e => e.status === 'available').length

  return (
    <>
      <PageHeader
        title="Resources & Capacity"
        subtitle="Manage and verify the live status of all hospital beds, staffing, and devices."
        actions={
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Sync Systems
          </button>
        }
      />

      {/* Tabs */}
      <div className="border-b border-border flex justify-between items-center mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => { setActiveTab('beds'); setSearchTerm(''); }}
            className={cn(
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold flex items-center gap-2 transition-all duration-150',
              activeTab === 'beds'
                ? 'border-brand text-brand'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            )}
          >
            <Bed className="h-4 w-4" /> Beds ({freeBeds} free)
          </button>
          <button
            onClick={() => { setActiveTab('doctors'); setSearchTerm(''); }}
            className={cn(
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold flex items-center gap-2 transition-all duration-150',
              activeTab === 'doctors'
                ? 'border-brand text-brand'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            )}
          >
            <Stethoscope className="h-4 w-4" /> Doctors ({freeDocs} active)
          </button>
          <button
            onClick={() => { setActiveTab('equipment'); setSearchTerm(''); }}
            className={cn(
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold flex items-center gap-2 transition-all duration-150',
              activeTab === 'equipment'
                ? 'border-brand text-brand'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            )}
          >
            <Syringe className="h-4 w-4" /> Equipment ({freeEquip} free)
          </button>
        </nav>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="pl-9 h-9 w-60 rounded-button border border-border px-3 text-xs focus:outline-none focus:border-brand transition-colors bg-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6"><SkeletonTable rows={8} cols={4} /></div>
        ) : (
          <div className="overflow-x-auto w-full">
            {activeTab === 'beds' && (
              <table className="w-full text-left">
                <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Bed ID</th>
                    <th className="py-3 px-6 font-semibold">Department Unit</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold">Assigned Patient</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bedsList
                    .filter(b => b.label.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(bed => (
                      <tr key={bed.id} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-semibold text-text-primary">{bed.label}</td>
                        <td className="py-4 px-6 text-sm text-text-secondary uppercase">{bed.unit}</td>
                        <td className="py-4 px-6">
                          <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-chip text-xs font-semibold border capitalize',
                            bed.status === 'available' ? 'bg-accent-50 text-accent border-accent-100' : 'bg-critical-bg text-critical border-critical-border'
                          )}>
                            {bed.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-text-tertiary">{bed.patientId || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'doctors' && (
              <table className="w-full text-left">
                <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Doctor</th>
                    <th className="py-3 px-6 font-semibold">Specialty</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold">Load Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {doctors
                    .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((doc, idx) => (
                      <tr key={idx} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-semibold text-text-primary">{doc.name}</td>
                        <td className="py-4 px-6 text-sm text-text-secondary">{doc.specialty}</td>
                        <td className="py-4 px-6">
                          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded border capitalize',
                            doc.status === 'available' || doc.status === 'active' ? 'bg-accent-50 text-accent border-accent-100' :
                            doc.status === 'busy' ? 'bg-warning-bg text-warning border-warning-border' :
                            'bg-bg-page text-text-tertiary border-border'
                          )}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {doc.currentLoad !== undefined && doc.maxLoad ? (
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary text-xs font-medium tabular-nums w-8">{doc.currentLoad}/{doc.maxLoad}</span>
                              <div className="w-20 h-2 bg-border rounded-full overflow-hidden">
                                <div className="h-full bg-brand" style={{ width: `${(doc.currentLoad / doc.maxLoad) * 100}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-tertiary text-xs italic">Off Duty</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'equipment' && (
              <table className="w-full text-left">
                <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Asset Name</th>
                    <th className="py-3 px-6 font-semibold">Category</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold">Assigned Patient</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {equipmentList
                    .filter(e => e.label.toLowerCase().includes(searchTerm.toLowerCase()) || e.type.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(eq => (
                      <tr key={eq.id} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-semibold text-text-primary">{eq.label}</td>
                        <td className="py-4 px-6 text-sm text-text-secondary capitalize">{eq.type.replace(/([A-Z])/g, ' $1')}</td>
                        <td className="py-4 px-6">
                          <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-chip text-xs font-semibold border capitalize',
                            eq.status === 'available' ? 'bg-accent-50 text-accent border-accent-100' : 'bg-brand-50 text-brand border-brand-100'
                          )}>
                            {eq.status === 'in_use' ? 'in use' : eq.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-text-tertiary">{eq.patientId || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  )
}
