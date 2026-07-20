import type { ActivityLog } from '@/types'

const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString()

export const fixtureActivityLog: ActivityLog[] = [
  { id: 'al-1', patientId: 'PT-007', event: 'recommendation_approved', detail: { decidedBy: 'Dr. Aisha Patel', patient: 'PT-007' }, createdAt: ago(2) },
  { id: 'al-2', patientId: 'PT-007', event: 'bed_assigned', detail: { bed: 'PEDS-3', patient: 'PT-007' }, createdAt: ago(3) },
  { id: 'al-3', patientId: 'PT-007', event: 'recommendation_generated', detail: { patient: 'PT-007', confidence: 89 }, createdAt: ago(4) },
  { id: 'al-4', patientId: 'PT-007', event: 'patient_arrived', detail: { displayId: 'PT-007', priority: 'P1' }, createdAt: ago(5) },
  { id: 'al-5', patientId: 'PT-001', event: 'patient_arrived', detail: { displayId: 'PT-001', priority: 'P1' }, createdAt: ago(8) },
  { id: 'al-6', patientId: 'PT-002', event: 'patient_arrived', detail: { displayId: 'PT-002', priority: 'P1' }, createdAt: ago(12) },
  { id: 'al-7', patientId: null, event: 'alert_fired', detail: { type: 'ICU_FULL', severity: 'critical' }, createdAt: ago(15) },
  { id: 'al-8', patientId: 'PT-008', event: 'patient_arrived', detail: { displayId: 'PT-008', priority: 'P2' }, createdAt: ago(22) }
]
