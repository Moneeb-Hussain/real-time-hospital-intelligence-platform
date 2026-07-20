import type { ChartDataPoint, DepartmentStatus } from '@/types'

export const fixturePriorityMix: ChartDataPoint[] = [
  { label: 'P1', value: 3 },
  { label: 'P2', value: 2 },
  { label: 'P3', value: 1 },
  { label: 'P4', value: 1 }
]

export const fixtureAdmissions7d: ChartDataPoint[] = [
  { label: 'Mon', value: 18 },
  { label: 'Tue', value: 22 },
  { label: 'Wed', value: 26 },
  { label: 'Thu', value: 19 },
  { label: 'Fri', value: 31 },
  { label: 'Sat', value: 28 },
  { label: 'Sun', value: 24 }
]

export const fixtureWaitTrend: ChartDataPoint[] = [
  { label: '08:00', value: 11 },
  { label: '09:00', value: 15 },
  { label: '10:00', value: 18 },
  { label: '11:00', value: 22 },
  { label: '12:00', value: 19 }
]

export const fixtureDoctorWorkload = [
  { label: 'Dr. Ahmed Khan', value: 3, max: 6 },
  { label: 'Dr. Sarah Malik', value: 4, max: 5 },
  { label: 'Dr. Fatima Raza', value: 2, max: 6 },
  { label: 'Dr. Leila Hassan', value: 5, max: 6 },
  { label: 'Dr. Aisha Patel', value: 3, max: 7 }
]

export const fixtureDepartments: DepartmentStatus[] = [
  { unitCode: 'ICU', unitName: 'Intensive Care Unit', totalBeds: 10, occupiedBeds: 9, occupancyPct: 90, criticalPatients: 3, status: 'critical' },
  { unitCode: 'ER', unitName: 'Emergency Room', totalBeds: 20, occupiedBeds: 15, occupancyPct: 75, criticalPatients: 2, status: 'busy' },
  { unitCode: 'CCU', unitName: 'Cardiac Care Unit', totalBeds: 8, occupiedBeds: 6, occupancyPct: 75, criticalPatients: 1, status: 'busy' },
  { unitCode: 'WARD', unitName: 'General Ward', totalBeds: 40, occupiedBeds: 22, occupancyPct: 55, criticalPatients: 0, status: 'normal' }
]
