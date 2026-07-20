import type { Recommendation } from '@/types'

export const fixtureRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    patientId: 'PT-001',
    payload: {
      recommendedUnit: 'Emergency Room',
      recommendedBed: 'ER-16',
      doctor: 'Dr. Ahmed Khan',
      equipment: ['Cardiac Monitor', 'Oxygen Concentrator'],
      reasons: ['SpO2 82% — Severe Hypoxia', 'No ICU bed available', 'BP 85/50 — Hypotension'],
      confidence: 72,
      basedOn: ['oxygen', 'blood_pressure', 'resource_availability'],
      alternativePlan: 'Stabilize in ER. Monitor vitals. First in ICU transfer queue.',
      options: [
        { label: 'Emergency Room Stabilization', risk: 'medium' },
        { label: 'Wait for ICU bed', risk: 'high' }
      ]
    },
    validationStatus: 'fallback',
    validationDetails: { bedAvailable: true, bedExists: true, doctorAvailable: true, doctorExists: true, equipmentAvailable: true, unitValid: true, issues: ['ICU bed not available — fallback to ER'] },
    decision: 'pending',
    decidedBy: null,
    overrideData: null,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    decidedAt: null
  },
  {
    id: 'rec-2',
    patientId: 'PT-002',
    payload: {
      recommendedUnit: 'CCU',
      recommendedBed: 'CCU-7',
      doctor: 'Dr. Fatima Raza',
      equipment: ['ECG Machine', 'Cardiac Monitor'],
      reasons: ['Stroke symptoms', 'BP 185/105 Severe Hypertension', 'Neurological emergency'],
      confidence: 85,
      basedOn: ['symptoms', 'blood_pressure', 'oxygen'],
      alternativePlan: 'If CCU unavailable, move to ER with neurologist on call.',
      options: [
        { label: 'CCU Immediate', risk: 'low' },
        { label: 'ER Stabilization', risk: 'medium' }
      ]
    },
    validationStatus: 'valid',
    validationDetails: { bedAvailable: true, bedExists: true, doctorAvailable: true, doctorExists: true, equipmentAvailable: true, unitValid: true, issues: [] },
    decision: 'pending',
    decidedBy: null,
    overrideData: null,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    decidedAt: null
  },
  {
    id: 'rec-3',
    patientId: 'PT-007',
    payload: {
      recommendedUnit: 'Pediatrics',
      recommendedBed: 'PEDS-3',
      doctor: 'Dr. Aisha Patel',
      equipment: ['Oxygen Concentrator'],
      reasons: ['Febrile seizure', 'Temperature 40.2°C', 'Age 3 — elevated risk'],
      confidence: 89,
      basedOn: ['temperature', 'age', 'symptoms'],
      alternativePlan: 'If PEDS unavailable, pediatric emergency in ER.',
      options: [
        { label: 'Pediatrics Immediate', risk: 'low' }
      ]
    },
    validationStatus: 'valid',
    validationDetails: { bedAvailable: true, bedExists: true, doctorAvailable: true, doctorExists: true, equipmentAvailable: true, unitValid: true, issues: [] },
    decision: 'approved',
    decidedBy: 'Dr. Aisha Patel',
    overrideData: null,
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
    decidedAt: new Date(Date.now() - 3 * 60000).toISOString()
  }
]
