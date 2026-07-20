import type { HospitalSnapshot } from '@/types'

export const fixtureSnapshot: HospitalSnapshot = {
  timestamp: new Date().toISOString(),
  beds: {
    icu: {
      available: 1,
      total: 10,
      occupancyPct: 90,
      availableBeds: [{ id: 'bed-icu-10', unitId: 'unit-icu', unitCode: 'ICU', label: 'ICU-10', status: 'available', patientId: null, occupiedSince: null }]
    },
    er: {
      available: 5,
      total: 20,
      occupancyPct: 75,
      availableBeds: Array.from({ length: 5 }).map((_, i) => ({
        id: `bed-er-${16 + i}`, unitId: 'unit-er', unitCode: 'ER', label: `ER-${16 + i}`, status: 'available', patientId: null, occupiedSince: null
      }))
    },
    ward: { available: 18, total: 40, occupancyPct: 55 },
    ccu: { available: 2, total: 8, occupancyPct: 75 }
  },
  doctors: {
    available: [
      { id: 'doc-1', name: 'Dr. Ahmed Khan', specialty: 'Emergency Medicine', department: 'ER', onShift: true, maxLoad: 6, currentLoad: 3, status: 'available', avatarInitials: 'AK' },
      { id: 'doc-4', name: 'Dr. Fatima Raza', specialty: 'Neurology', department: 'WARD', onShift: true, maxLoad: 6, currentLoad: 2, status: 'available', avatarInitials: 'FR' },
      { id: 'doc-5', name: 'Dr. Carlos Mendez', specialty: 'Surgery', department: 'OT', onShift: true, maxLoad: 3, currentLoad: 1, status: 'available', avatarInitials: 'CM' },
      { id: 'doc-6', name: 'Dr. Aisha Patel', specialty: 'Pediatrics', department: 'PEDS', onShift: true, maxLoad: 7, currentLoad: 3, status: 'available', avatarInitials: 'AP' }
    ],
    all: [
      { id: 'doc-1', name: 'Dr. Ahmed Khan', specialty: 'Emergency Medicine', department: 'ER', onShift: true, maxLoad: 6, currentLoad: 3, status: 'available', avatarInitials: 'AK' },
      { id: 'doc-4', name: 'Dr. Fatima Raza', specialty: 'Neurology', department: 'WARD', onShift: true, maxLoad: 6, currentLoad: 2, status: 'available', avatarInitials: 'FR' },
      { id: 'doc-5', name: 'Dr. Carlos Mendez', specialty: 'Surgery', department: 'OT', onShift: true, maxLoad: 3, currentLoad: 1, status: 'available', avatarInitials: 'CM' },
      { id: 'doc-6', name: 'Dr. Aisha Patel', specialty: 'Pediatrics', department: 'PEDS', onShift: true, maxLoad: 7, currentLoad: 3, status: 'available', avatarInitials: 'AP' },
      { id: 'doc-2', name: 'Dr. Sarah Malik', specialty: 'Cardiology', department: 'CCU', onShift: true, maxLoad: 5, currentLoad: 4, status: 'busy', avatarInitials: 'SM' },
      { id: 'doc-3', name: 'Dr. James Okonkwo', specialty: 'Critical Care', department: 'ICU', onShift: true, maxLoad: 4, currentLoad: 4, status: 'busy', avatarInitials: 'JO' },
      { id: 'doc-7', name: 'Dr. Robert Chen', specialty: 'Internal Medicine', department: 'WARD', onShift: false, maxLoad: 5, currentLoad: 0, status: 'off_shift', avatarInitials: 'RC' },
      { id: 'doc-8', name: 'Dr. Leila Hassan', specialty: 'Emergency Medicine', department: 'ER', onShift: true, maxLoad: 6, currentLoad: 5, status: 'busy', avatarInitials: 'LH' }
    ]
  },
  equipment: {
    cardiacMonitor: {
      available: 2, total: 3, occupancyPct: 33,
      availableItems: [
        { id: 'eq-cm-1', label: 'Cardiac Monitor #1', type: 'cardiac_monitor', status: 'available', assignedPatientId: null, department: 'ER' },
        { id: 'eq-cm-3', label: 'Cardiac Monitor #3', type: 'cardiac_monitor', status: 'available', assignedPatientId: null, department: 'CCU' }
      ]
    },
    ventilator: {
      available: 1, total: 3, occupancyPct: 67,
      availableItems: [
        { id: 'eq-v-2', label: 'Ventilator #2', type: 'ventilator', status: 'available', assignedPatientId: null, department: 'ICU' }
      ]
    },
    ecgMachine: { available: 1, total: 2, occupancyPct: 50, availableItems: [] },
    defibrillator: { available: 2, total: 2, occupancyPct: 0, availableItems: [] },
    oxygenConc: { available: 1, total: 2, occupancyPct: 50, availableItems: [] }
  },
  queue: { p1Count: 3, p2Count: 2, p3Count: 1, p4Count: 1, avgWaitMinutes: 19, longestWaitMinutes: 50 },
  hospitalHealthScore: 63
}
