import type { PatientVitals, Priority, ScoreBreakdown } from '@/types'
import { PRIORITY_THRESHOLDS } from '@/types'

export interface PriorityResult {
  urgencyScore: number
  priority: Priority
  breakdown: ScoreBreakdown[]
}

export function calculatePriority(
  vitals: PatientVitals,
  symptoms: string[],
  age: number
): PriorityResult {
  let score = 0
  const breakdown: ScoreBreakdown[] = []

  const addScore = (points: number, factor: string, condition: string) => {
    score += points
    breakdown.push({ factor, condition, points })
  }

  // SpO2
  const spo2 = vitals.spo2 || 0
  if (spo2 > 0) {
    if (spo2 < 85) addScore(40, 'SpO2', `${spo2}% — Severe Hypoxia`)
    else if (spo2 <= 89) addScore(25, 'SpO2', `${spo2}% — Moderate Hypoxia`)
    else if (spo2 <= 93) addScore(10, 'SpO2', `${spo2}% — Mild Hypoxia`)
  }

  // Blood Pressure
  const sys = vitals.bpSystolic || 0
  const dia = vitals.bpDiastolic || 0
  if (sys > 0 || dia > 0) {
    if (sys < 80 || (dia > 0 && dia < 50)) addScore(30, 'Blood Pressure', 'Critical Hypotension')
    else if (sys < 90) addScore(20, 'Blood Pressure', 'Hypotension')
    else if (sys > 180) addScore(15, 'Blood Pressure', 'Severe Hypertension')
    else if (sys > 160) addScore(8, 'Blood Pressure', 'Stage 2 Hypertension')
  }

  // Consciousness
  if (vitals.conscious === false) {
    addScore(35, 'Consciousness', 'Unconscious — Immediate priority')
  }

  // Heart Rate
  const hr = vitals.heartRate || 0
  if (hr > 0) {
    if (hr > 150 || hr < 40) addScore(20, 'Heart Rate', 'Critical Arrhythmia Risk')
    else if (hr > 120 || hr < 50) addScore(12, 'Heart Rate', 'Tachycardia / Bradycardia')
    else if (hr > 100) addScore(5, 'Heart Rate', 'Mild Tachycardia')
  }

  // Temperature
  const temp = vitals.temperature || 0
  if (temp > 0) {
    if (temp > 40.0 || temp < 35.0) addScore(15, 'Temperature', 'Extreme Temperature')
    else if (temp > 39.0) addScore(8, 'Temperature', 'High Fever')
    else if (temp < 36.0) addScore(8, 'Temperature', 'Hypothermia Risk')
  }

  // Symptoms
  const lowerSymptoms = symptoms.map(s => s.toLowerCase())
  const hasSymptom = (checks: string[]) => lowerSymptoms.some(s => checks.some(c => s.includes(c)))

  if (hasSymptom(['chest pain', 'chest pressure', 'chest tightness'])) addScore(15, 'Symptoms', 'Chest Pain')
  if (hasSymptom(['difficulty breathing', 'shortness of breath', 'dyspnea'])) addScore(15, 'Symptoms', 'Breathing Difficulty')
  if (hasSymptom(['stroke', 'facial droop', 'arm weakness', 'speech difficulty'])) addScore(25, 'Symptoms', 'Stroke Suspected')
  if (hasSymptom(['severe bleeding', 'hemorrhage'])) addScore(20, 'Symptoms', 'Severe Bleeding')
  if (hasSymptom(['seizure', 'convulsion'])) addScore(15, 'Symptoms', 'Seizures')
  if (hasSymptom(['anaphylaxis', 'throat swelling'])) addScore(25, 'Symptoms', 'Anaphylaxis')
  if (hasSymptom(['head injury', 'traumatic brain'])) addScore(15, 'Symptoms', 'Head Injury')

  // Age
  if (age < 2) addScore(10, 'Age', 'Infant')
  else if (age < 5) addScore(8, 'Age', 'Young child')
  else if (age > 80) addScore(10, 'Age', 'Elderly')
  else if (age > 70) addScore(5, 'Age', 'Senior')

  const urgencyScore = Math.min(100, score)

  let priority: Priority = 'P4'
  if (urgencyScore >= PRIORITY_THRESHOLDS.P1) priority = 'P1'
  else if (urgencyScore >= PRIORITY_THRESHOLDS.P2) priority = 'P2'
  else if (urgencyScore >= PRIORITY_THRESHOLDS.P3) priority = 'P3'

  return { urgencyScore, priority, breakdown }
}
