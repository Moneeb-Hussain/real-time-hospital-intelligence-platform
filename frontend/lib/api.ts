import { USE_FIXTURES, fixtureKpis, fixturePatients, fixtureRecommendations, fixtureActivityLog, fixtureSnapshot, fixtureDepartments, fixturePriorityMix, fixtureAdmissions7d, fixtureWaitTrend, fixtureDoctorWorkload } from '@/lib/fixtures'
import type { KpiData, Patient, Alert, Recommendation, HospitalSnapshot, DepartmentStatus, Doctor, ChartDataPoint, ActivityLog } from '@/types'

// Empty in production so Vercel rewrites `/api/*` to the FastAPI service.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000')

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const res = await fetch(fullUrl, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  const json = await res.json()
  return (json.data !== undefined ? json.data : json) as T
}

export function getKpis(): Promise<KpiData> {
  return fetchApi<KpiData>('/api/dashboard/kpis')
}

export function getHealthScore(): Promise<{ score: number; snapshotTime: string }> {
  return fetchApi<{ score: number; snapshotTime: string }>('/api/hospital/health-score')
}

export function getPatientQueue(): Promise<{ items: Patient[]; total: number }> {
  return fetchApi<any>('/api/dashboard').then((res) => {
    if (res?.queuePreview && Array.isArray(res.queuePreview)) {
      const items = res.queuePreview.map((row: any) => {
        const v = row.vitals || {}
        const rawStatus = String(row.status || 'waiting').toLowerCase()
        const status = (
          rawStatus === 'awaiting_review' || rawStatus === 'registered'
            ? 'waiting'
            : rawStatus
        ) as Patient['status']
        return {
          id: row.patientId,
          displayId: row.patientId,
          name: row.name || row.patientId,
          age: row.age || 0,
          gender: (row.gender || 'other') as Patient['gender'],
          chiefComplaint: row.complaint || '',
          symptoms: row.symptoms || [],
          vitals: {
            heartRate: v.heartRate || 0,
            bpSystolic: v.systolicBP || 0,
            bpDiastolic: v.diastolicBP || 0,
            spo2: v.oxygenSaturation || 0,
            temperature: v.temperature || 0,
            conscious: String(row.consciousness || 'ALERT').toUpperCase() !== 'UNCONSCIOUS',
          },
          urgencyScore: row.urgencyScore || 0,
          priority: (row.priority || 'P4') as Patient['priority'],
          status,
          assignedBedId: row.assignedBedId || null,
          assignedDoctorId: row.assignedDoctorId || null,
          // Prefer resolved name from API when present
          notes: row.assignedDoctorName || undefined,
          arrivedAt: row.createdAt || new Date().toISOString(),
        }
      }) as Patient[]
      return { items, total: res.summary?.waitingPatients ?? items.length }
    }

    // Mock / demo shape: already Patient-like objects
    const waiting = Array.isArray(res?.waitingPatients) ? res.waitingPatients : []
    return { items: waiting as Patient[], total: res?.totalWaiting ?? waiting.length }
  })
}

/** Full patient directory (all statuses). */
export function getPatients(): Promise<Patient[]> {
  return fetchApi<Patient[]>('/api/patients')
}

export function getPatientById(id: string): Promise<{ patient: Patient; recommendation: Recommendation | null; activity: ActivityLog[] }> {
  return fetchApi<{ patient: Patient; recommendation: Recommendation | null; activity: ActivityLog[] }>(`/api/patients/${id}`)
}

export function getAlerts(): Promise<Alert[]> {
  return fetchApi<Alert[]>('/api/alerts?status=active')
}

export function acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert> {
  return fetchApi<Alert>(`/api/alerts/${id}/acknowledge`, { method: 'PATCH', body: JSON.stringify({ acknowledgedBy }) })
}

export function getRecommendations(status?: string): Promise<Recommendation[]> {
  const qs = status ? `?status=${status}` : ''
  return fetchApi<Recommendation[]>(`/api/recommendations${qs}`)
}

export function approveRecommendation(id: string, data: { approvedBy: string; notes?: string }): Promise<{ recommendation: Recommendation; patient: Patient }> {
  return fetchApi<{ recommendation: Recommendation; patient: Patient }>(`/api/recommendations/${id}/approve`, { method: 'POST', body: JSON.stringify(data) })
}

export function rejectRecommendation(id: string, data: { rejectedBy: string; reason: string }): Promise<Recommendation> {
  return fetchApi<Recommendation>(`/api/recommendations/${id}/reject`, { method: 'POST', body: JSON.stringify(data) })
}

export function overrideRecommendation(id: string, data: object): Promise<{ recommendation: Recommendation; patient: Patient }> {
  return fetchApi<{ recommendation: Recommendation; patient: Patient }>(`/api/recommendations/${id}/override`, { method: 'POST', body: JSON.stringify(data) })
}

export function recalculateRecommendation(id: string, requestedBy: string): Promise<Recommendation> {
  return fetchApi<Recommendation>(`/api/recommendations/${id}/recalculate`, { method: 'POST', body: JSON.stringify({ requestedBy }) })
}

export function getSnapshot(): Promise<HospitalSnapshot> {
  return fetchApi<HospitalSnapshot>('/api/resources/summary')
}

export function getResourcesInventory(): Promise<{
  beds: Array<{
    id: string
    label: string
    unitCode: string
    status: string
    patientId: string | null
    patientName?: string | null
  }>
  doctors: Doctor[]
  equipment: Array<{
    id: string
    label: string
    type: string
    typeLabel?: string
    status: string
    assignedPatientId: string | null
    patientName?: string | null
    department?: string
  }>
  counts: {
    bedsFree: number
    bedsTotal: number
    doctorsAvailable: number
    doctorsTotal: number
    equipmentFree: number
    equipmentTotal: number
  }
}> {
  return fetchApi('/api/resources/inventory')
}

export function getDepartmentStatus(): Promise<DepartmentStatus[]> {
  return fetchApi<DepartmentStatus[]>('/api/departments/status')
}

export function getDoctors(): Promise<Doctor[]> {
  return fetchApi<Doctor[]>('/api/doctors')
}

export function getCharts(): Promise<{ priorityMix: ChartDataPoint[]; admissions7d: ChartDataPoint[]; waitTrend: ChartDataPoint[]; doctorWorkload: Array<{ label: string; value: number; max: number }> }> {
  return fetchApi<any>('/api/analytics/charts')
}

export function getActivityLog(limit = 20): Promise<ActivityLog[]> {
  return fetchApi<ActivityLog[]>(`/api/activity-log?limit=${limit}`)
}

export function generateRecommendation(patientId: string): Promise<Recommendation> {
  return fetchApi<Recommendation>('/api/ai/recommendation', { method: 'POST', body: JSON.stringify({ patientId }) })
}

export function generateBriefing(requestedBy: string): Promise<{ briefing: string; highlights: string[] }> {
  return fetchApi<{ briefing: string; highlights: string[] }>('/api/ai/briefing', { method: 'POST', body: JSON.stringify({ requestedBy }) })
}

export function generateShiftReport(shiftStart: string, shiftEnd: string): Promise<{ report: string; pendingItems: string[]; immediateActions: string[] }> {
  return fetchApi<{ report: string; pendingItems: string[]; immediateActions: string[] }>('/api/ai/shift-report', { method: 'POST', body: JSON.stringify({ shiftStart, shiftEnd }) })
}

export function runSimulation(data: object): Promise<{
  summary: string
  riskLevel: string
  baseline?: Record<string, number>
  projectedImpact: Record<string, number>
  bottlenecks: string[]
  recommendedActions: string[]
}> {
  return fetchApi('/api/ai/simulate', { method: 'POST', body: JSON.stringify(data) })
}

export function registerPatient(patientData: {
  name: string
  age: number
  gender?: string
  arrivalType?: string
  complaint: string
  symptoms: string[]
  vitals: {
    heartRate: number
    oxygenSaturation: number
    systolicBP: number
    diastolicBP: number
    temperature: number
  }
  consciousness?: string
}): Promise<{ patientId: string; status: string; createdAt?: string }> {
  return fetchApi('/api/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  })
}

export function evaluatePatient(patientId: string): Promise<{
  patientId: string
  urgencyScore: number
  priority: string
  triggeredRules: string[]
  queuePosition: number
}> {
  return fetchApi(`/api/patients/${patientId}/evaluate`, { method: 'POST', body: JSON.stringify({}) })
}

/** Live triage preview — same rules as backend priority engine (no DB write). */
export function previewTriage(patientData: {
  age: number
  complaint: string
  symptoms: string[]
  consciousness: string
  vitals: {
    heartRate: number
    oxygenSaturation: number
    systolicBP: number
    diastolicBP: number
    temperature: number
  }
}): Promise<{ score: number; level: string; reasons: string[] }> {
  return fetchApi('/api/patients/preview-triage', {
    method: 'POST',
    body: JSON.stringify(patientData),
  })
}


