import type { KpiData } from '@/types'

export const fixtureKpis: KpiData = {
  criticalPatients: 3,
  criticalTrend: 0,
  waitingPatients: 6,
  waitingTrend: 0,
  activePatients: 6,
  activePatientsPct: 8,
  icuBedsAvailable: 1,
  icuBedsTotal: 10,
  bedsTotal: 78,
  bedsOccupied: 70,
  bedOccupancyPct: 90,
  doctorsAvailable: 4,
  doctorsTotal: 8,
  avgWaitMinutes: 19,
  avgWaitTrend: 0,
  pendingRecommendations: 2,
  hospitalHealthScore: 63
}
