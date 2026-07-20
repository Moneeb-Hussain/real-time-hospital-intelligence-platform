// ── PRIORITY ──────────────────────────────────────────────────────────────
export type Priority = 'P1' | 'P2' | 'P3' | 'P4'

export const PRIORITY_LABELS: Record<Priority, string> = {
  P1: 'Critical', P2: 'Urgent', P3: 'Moderate', P4: 'Stable'
}

export const PRIORITY_THRESHOLDS = {
  P1: 75, P2: 50, P3: 25, P4: 0
} as const

// ── PATIENT ───────────────────────────────────────────────────────────────
export type PatientStatus =
  | 'waiting' | 'assigned' | 'in_treatment' | 'transferred' | 'discharged'

export interface PatientVitals {
  heartRate: number      // bpm
  bpSystolic: number     // mmHg
  bpDiastolic: number    // mmHg
  spo2: number           // percent
  temperature: number    // Celsius
  conscious: boolean
}

export interface Patient {
  id: string
  displayId: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  chiefComplaint: string
  symptoms: string[]
  vitals: PatientVitals
  urgencyScore: number
  priority: Priority
  status: PatientStatus
  assignedBedId: string | null
  assignedDoctorId: string | null
  arrivedAt: string
  notes?: string
}

export interface PatientInput {
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  chiefComplaint: string
  symptoms: string[]
  vitals: PatientVitals
}

// ── BEDS ──────────────────────────────────────────────────────────────────
export type BedStatus = 'available' | 'occupied' | 'maintenance'
export type UnitCode = 'ICU' | 'ER' | 'WARD' | 'OT' | 'CCU' | 'PEDS'

export interface Bed {
  id: string
  unitId: string
  unitCode: UnitCode
  label: string
  status: BedStatus
  patientId: string | null
  occupiedSince: string | null
}

// ── DOCTORS ───────────────────────────────────────────────────────────────
export type DoctorStatus = 'available' | 'busy' | 'off_shift' | 'break'

export interface Doctor {
  id: string
  name: string
  specialty: string
  department: string
  onShift: boolean
  maxLoad: number
  currentLoad: number
  status: DoctorStatus
  avatarInitials: string
}

// ── EQUIPMENT ─────────────────────────────────────────────────────────────
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance'
export type EquipmentType =
  | 'cardiac_monitor' | 'ventilator' | 'ecg_machine'
  | 'defibrillator' | 'oxygen_concentrator'
  | 'portable_ultrasound' | 'infusion_pump'

export interface Equipment {
  id: string
  label: string
  type: EquipmentType
  status: EquipmentStatus
  assignedPatientId: string | null
  department: string
}

// ── HOSPITAL SNAPSHOT ─────────────────────────────────────────────────────
export interface ResourceCount {
  available: number
  total: number
  occupancyPct: number
}

export interface HospitalSnapshot {
  timestamp: string
  beds: {
    icu:  ResourceCount & { availableBeds: Bed[] }
    er:   ResourceCount & { availableBeds: Bed[] }
    ward: ResourceCount
    ccu:  ResourceCount
  }
  doctors: { available: Doctor[]; all: Doctor[] }
  equipment: {
    cardiacMonitor: ResourceCount & { availableItems: Equipment[] }
    ventilator:     ResourceCount & { availableItems: Equipment[] }
    ecgMachine:     ResourceCount & { availableItems: Equipment[] }
    defibrillator:  ResourceCount & { availableItems: Equipment[] }
    oxygenConc:     ResourceCount & { availableItems: Equipment[] }
  }
  queue: {
    p1Count: number
    p2Count: number
    p3Count: number
    p4Count: number
    avgWaitMinutes: number
    longestWaitMinutes: number
  }
  hospitalHealthScore: number
}

// ── RECOMMENDATIONS ───────────────────────────────────────────────────────
export type RecommendationDecision = 'pending' | 'approved' | 'rejected' | 'overridden'
export type ValidationStatus = 'valid' | 'invalid' | 'partial' | 'fallback'

export interface ValidationDetail {
  bedAvailable: boolean
  bedExists: boolean
  doctorAvailable: boolean
  doctorExists: boolean
  equipmentAvailable: boolean
  unitValid: boolean
  issues: string[]
}

export interface GPTRecommendationPayload {
  recommendedUnit: string
  recommendedBed: string
  doctor: string
  equipment: string[]
  reasons: string[]
  confidence: number
  basedOn: string[]
  alternativePlan: string
  options: Array<{ label: string; risk: 'low' | 'medium' | 'high' }>
}

export interface Recommendation {
  id: string
  patientId: string
  payload: GPTRecommendationPayload
  validationStatus: ValidationStatus
  validationDetails: ValidationDetail
  decision: RecommendationDecision
  decidedBy: string | null
  overrideData: {
    bed?: string
    doctor?: string
    equipment?: string[]
    reason?: string
  } | null
  createdAt: string
  decidedAt: string | null
}

// ── ALERTS ────────────────────────────────────────────────────────────────
export type AlertType =
  | 'ICU_FULL' | 'ER_NEAR_CAPACITY' | 'DOCTOR_OVERLOADED'
  | 'EQUIPMENT_LOW' | 'HIGH_RISK_WAITING' | 'DEPARTMENT_CRITICAL'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  active: boolean
  createdAt: string
  acknowledgedAt: string | null
  acknowledgedBy: string | null
}

// ── ACTIVITY LOG ──────────────────────────────────────────────────────────
export type ActivityEventType =
  | 'patient_arrived' | 'priority_calculated'
  | 'recommendation_generated' | 'recommendation_approved'
  | 'recommendation_rejected' | 'recommendation_overridden'
  | 'bed_assigned' | 'doctor_assigned' | 'equipment_assigned'
  | 'alert_fired' | 'alert_acknowledged' | 'resource_status_changed'

export interface ActivityLog {
  id: string
  patientId: string | null
  event: ActivityEventType
  detail: Record<string, unknown>
  createdAt: string
}

// ── KPI / ANALYTICS ───────────────────────────────────────────────────────
export interface KpiData {
  criticalPatients: number
  criticalTrend: number
  waitingPatients: number
  waitingTrend: number
  icuBedsAvailable: number
  icuBedsTotal: number
  doctorsAvailable: number
  doctorsTotal: number
  avgWaitMinutes: number
  avgWaitTrend: number
  pendingRecommendations: number
  hospitalHealthScore: number
}

export interface SparklinePoint { time: string; value: number }
export interface ChartDataPoint {
  label: string
  value: number
  [key: string]: string | number
}

export interface DepartmentStatus {
  unitCode: UnitCode
  unitName: string
  totalBeds: number
  occupiedBeds: number
  occupancyPct: number
  criticalPatients: number
  status: 'normal' | 'busy' | 'critical' | 'full'
}

export interface ScoreBreakdown {
  factor: string
  condition: string
  points: number
}

// ── API WRAPPERS ──────────────────────────────────────────────────────────
export interface ApiSuccess<T> { success: true; data: T; timestamp: string }
export interface ApiError { success: false; error: string; code?: string; timestamp: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function apiOk<T>(data: T): ApiSuccess<T> {
  return { success: true, data, timestamp: new Date().toISOString() }
}
export function apiErr(error: string, code?: string): ApiError {
  return { success: false, error, code, timestamp: new Date().toISOString() }
}
