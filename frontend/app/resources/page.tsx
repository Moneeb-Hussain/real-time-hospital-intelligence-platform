'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader, SkeletonTable, EmptyState } from '@/components/shared'
import { getResourcesInventory } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Bed, Stethoscope, Syringe, Search, RefreshCw } from 'lucide-react'
import type { Doctor } from '@/types'
import toast from 'react-hot-toast'

type BedRow = {
  id: string
  label: string
  unitCode: string
  status: string
  patientId: string | null
  patientName?: string | null
}

type EquipRow = {
  id: string
  label: string
  type: string
  typeLabel?: string
  status: string
  assignedPatientId: string | null
  patientName?: string | null
}

function statusPill(status: string) {
  const s = status.toLowerCase()
  if (s === 'available') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }
  if (s === 'busy') {
    return 'bg-amber-50 text-amber-700 border-amber-100'
  }
  if (s === 'in_use' || s === 'occupied') {
    return 'bg-rose-50 text-rose-700 border-rose-100'
  }
  return 'bg-slate-50 text-slate-600 border-slate-100'
}

function statusLabel(status: string) {
  const s = status.toLowerCase()
  if (s === 'in_use') return 'In use'
  if (s === 'off_shift') return 'Off shift'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function ResourcesPage() {
  const [beds, setBeds] = useState<BedRow[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [equipment, setEquipment] = useState<EquipRow[]>([])
  const [counts, setCounts] = useState({
    bedsFree: 0,
    bedsTotal: 0,
    doctorsAvailable: 0,
    doctorsTotal: 0,
    equipmentFree: 0,
    equipmentTotal: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'beds' | 'doctors' | 'equipment'>('beds')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = useCallback(async (notify = false) => {
    try {
      const inv = await getResourcesInventory()
      setBeds(inv.beds || [])
      setDoctors(inv.doctors || [])
      setEquipment(inv.equipment || [])
      setCounts(
        inv.counts || {
          bedsFree: 0,
          bedsTotal: 0,
          doctorsAvailable: 0,
          doctorsTotal: 0,
          equipmentFree: 0,
          equipmentTotal: 0,
        }
      )
      if (notify) toast.success('Resources updated')
    } catch (e) {
      console.error(e)
      toast.error('Could not load resources — is the API running the latest code?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(), 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const q = searchTerm.trim().toLowerCase()
  const filteredBeds = beds.filter(
    (b) =>
      !q ||
      b.id.toLowerCase().includes(q) ||
      b.label.toLowerCase().includes(q) ||
      b.unitCode.toLowerCase().includes(q) ||
      (b.patientName || '').toLowerCase().includes(q) ||
      (b.patientId || '').toLowerCase().includes(q)
  )
  const filteredDocs = doctors.filter(
    (d) =>
      !q ||
      d.name.toLowerCase().includes(q) ||
      (d.specialty || '').toLowerCase().includes(q) ||
      (d.department || '').toLowerCase().includes(q)
  )
  const filteredEquip = equipment.filter(
    (e) =>
      !q ||
      e.id.toLowerCase().includes(q) ||
      e.label.toLowerCase().includes(q) ||
      (e.typeLabel || e.type).toLowerCase().includes(q) ||
      (e.patientName || '').toLowerCase().includes(q)
  )

  return (
    <>
      <PageHeader
        title="Resources & Capacity"
        subtitle="Live beds, doctors, and equipment from the hospital inventory."
        actions={
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchData(true)
            }}
            className="px-4 py-2 bg-brand text-white rounded-button text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      <div className="border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {(
            [
              {
                key: 'beds' as const,
                icon: Bed,
                label: `Beds (${counts.bedsFree} free of ${counts.bedsTotal})`,
              },
              {
                key: 'doctors' as const,
                icon: Stethoscope,
                label: `Doctors (${counts.doctorsAvailable} available)`,
              },
              {
                key: 'equipment' as const,
                icon: Syringe,
                label: `Equipment (${counts.equipmentFree} free)`,
              },
            ]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key)
                setSearchTerm('')
              }}
              className={cn(
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold flex items-center gap-2 transition-all duration-150',
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="relative pb-3 sm:pb-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder={
              activeTab === 'beds'
                ? 'Search by bed, unit, or patient…'
                : activeTab === 'doctors'
                  ? 'Search by doctor or specialty…'
                  : 'Search equipment…'
            }
            className="pl-9 h-9 w-full sm:w-64 rounded-button border border-border px-3 text-xs focus:outline-none focus:border-brand transition-colors bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="panel overflow-hidden bg-white">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={8} cols={4} />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            {activeTab === 'beds' && (
              filteredBeds.length === 0 ? (
                <div className="p-10">
                  <EmptyState
                    title="No beds found"
                    description="Try another search, or confirm resources are seeded in the database."
                  />
                </div>
              ) : (
                <table className="w-full text-left min-w-[640px]">
                  <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                    <tr>
                      <th className="py-3 px-6 font-semibold">Bed</th>
                      <th className="py-3 px-6 font-semibold">Unit</th>
                      <th className="py-3 px-6 font-semibold">Status</th>
                      <th className="py-3 px-6 font-semibold">Assigned patient</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBeds.map((bed) => (
                      <tr key={bed.id} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-3.5 px-6 text-sm font-semibold text-text-primary font-mono">
                          {bed.label || bed.id}
                        </td>
                        <td className="py-3.5 px-6 text-sm text-text-secondary">{bed.unitCode}</td>
                        <td className="py-3.5 px-6">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border',
                              statusPill(bed.status)
                            )}
                          >
                            {statusLabel(bed.status)}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-sm text-text-secondary">
                          {bed.patientName || bed.patientId || (
                            <span className="text-text-tertiary">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'doctors' && (
              filteredDocs.length === 0 ? (
                <div className="p-10">
                  <EmptyState title="No doctors found" description="Try another search." />
                </div>
              ) : (
                <table className="w-full text-left min-w-[640px]">
                  <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                    <tr>
                      <th className="py-3 px-6 font-semibold">Doctor</th>
                      <th className="py-3 px-6 font-semibold">Specialty</th>
                      <th className="py-3 px-6 font-semibold">Status</th>
                      <th className="py-3 px-6 font-semibold">Patient load</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-3.5 px-6 text-sm font-semibold text-text-primary">
                          {doc.name}
                        </td>
                        <td className="py-3.5 px-6 text-sm text-text-secondary">
                          {doc.specialty}
                          {doc.department ? (
                            <span className="text-text-tertiary"> · {doc.department}</span>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border',
                              statusPill(doc.status)
                            )}
                          >
                            {statusLabel(doc.status)}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          {doc.maxLoad ? (
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary text-xs font-medium tabular-nums w-10">
                                {doc.currentLoad}/{doc.maxLoad}
                              </span>
                              <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand rounded-full"
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
              )
            )}

            {activeTab === 'equipment' && (
              filteredEquip.length === 0 ? (
                <div className="p-10">
                  <EmptyState title="No equipment found" description="Try another search." />
                </div>
              ) : (
                <table className="w-full text-left min-w-[640px]">
                  <thead className="text-xs text-text-secondary uppercase tracking-wider bg-bg-page border-b border-border">
                    <tr>
                      <th className="py-3 px-6 font-semibold">Asset</th>
                      <th className="py-3 px-6 font-semibold">Type</th>
                      <th className="py-3 px-6 font-semibold">Status</th>
                      <th className="py-3 px-6 font-semibold">Assigned patient</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEquip.map((eq) => (
                      <tr key={eq.id} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-3.5 px-6 text-sm font-semibold text-text-primary">
                          {eq.label}
                          <div className="text-[10px] text-text-tertiary font-mono">{eq.id}</div>
                        </td>
                        <td className="py-3.5 px-6 text-sm text-text-secondary">
                          {eq.typeLabel || eq.type.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border',
                              statusPill(eq.status)
                            )}
                          >
                            {statusLabel(eq.status)}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-sm text-text-secondary">
                          {eq.patientName || eq.assignedPatientId || (
                            <span className="text-text-tertiary">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        )}
      </div>
    </>
  )
}
