import type { Patient } from '@/types'

const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString()

export const fixturePatients: Patient[] = [
  {
    id: 'PT-001',
    displayId: 'PT-001',
    name: 'Hassan Al-Rashid',
    age: 58,
    gender: 'male',
    chiefComplaint: 'Chest Pain',
    symptoms: ['chest pain', 'shortness of breath', 'diaphoresis'],
    vitals: { heartRate: 118, bpSystolic: 85, bpDiastolic: 50, spo2: 82, temperature: 37.2, conscious: true },
    urgencyScore: 92,
    priority: 'P1',
    status: 'waiting',
    assignedBedId: null,
    assignedDoctorId: null,
    arrivedAt: ago(8)
  },
  {
    id: 'PT-002',
    displayId: 'PT-002',
    name: 'Maria Rodriguez',
    age: 67,
    gender: 'female',
    chiefComplaint: 'Facial Droop',
    symptoms: ['facial droop', 'arm weakness', 'speech difficulty'],
    vitals: { heartRate: 95, bpSystolic: 185, bpDiastolic: 105, spo2: 94, temperature: 37.4, conscious: true },
    urgencyScore: 88,
    priority: 'P1',
    status: 'waiting',
    assignedBedId: null,
    assignedDoctorId: null,
    arrivedAt: ago(12)
  },
  {
    id: 'PT-004',
    displayId: 'PT-004',
    name: 'Li Wei',
    age: 34,
    gender: 'female',
    chiefComplaint: 'Breathing Difficulty',
    symptoms: ['difficulty breathing', 'wheezing'],
    vitals: { heartRate: 108, bpSystolic: 130, bpDiastolic: 82, spo2: 91, temperature: 37.6, conscious: true },
    urgencyScore: 58,
    priority: 'P2',
    status: 'waiting',
    assignedBedId: null,
    assignedDoctorId: null,
    arrivedAt: ago(18)
  },
  {
    id: 'PT-005',
    displayId: 'PT-005',
    name: 'Amina Diallo',
    age: 29,
    gender: 'female',
    chiefComplaint: 'Abdominal Pain',
    symptoms: ['abdominal pain', 'nausea', 'vomiting'],
    vitals: { heartRate: 88, bpSystolic: 118, bpDiastolic: 75, spo2: 98, temperature: 38.1, conscious: true },
    urgencyScore: 32,
    priority: 'P3',
    status: 'waiting',
    assignedBedId: null,
    assignedDoctorId: null,
    arrivedAt: ago(35)
  },
  {
    id: 'PT-006',
    displayId: 'PT-006',
    name: 'Robert Kim',
    age: 71,
    gender: 'male',
    chiefComplaint: 'Hip Pain',
    symptoms: ['hip pain', 'limited mobility'],
    vitals: { heartRate: 76, bpSystolic: 142, bpDiastolic: 88, spo2: 96, temperature: 36.8, conscious: true },
    urgencyScore: 22,
    priority: 'P4',
    status: 'waiting',
    assignedBedId: null,
    assignedDoctorId: null,
    arrivedAt: ago(50)
  }
]
