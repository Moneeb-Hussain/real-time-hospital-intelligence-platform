'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PageHeader, PriorityBadge } from '@/components/shared'
import { registerPatient, evaluatePatient, previewTriage, generateRecommendation } from '@/lib/api'
import { User, ShieldAlert, Activity as VitalIcon } from 'lucide-react'
import type { Priority } from '@/types'
import { PRIORITY_LABELS } from '@/types'

const PRIORITY_HELP: Record<Priority, string> = {
  P1: 'Needs care immediately — life-threatening signs',
  P2: 'Needs care soon — serious but not immediate life threat',
  P3: 'Can wait a bit — concerning but stable for now',
  P4: 'Lowest urgency — stable, routine assessment',
}

const emptyForm = {
  name: '',
  age: '',
  gender: 'male',
  arrivalType: 'WALK_IN',
  heartRate: '',
  bpSystolic: '',
  bpDiastolic: '',
  spo2: '',
  temperature: '',
  consciousness: 'ALERT',
  complaint: '',
  symptoms: '',
}

export default function PatientIntakePage() {
  const router = useRouter()
  const [formData, setFormData] = useState(emptyForm)
  const [urgencyScore, setUrgencyScore] = useState(0)
  const [priority, setPriority] = useState<Priority>('P4')
  const [reasons, setReasons] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parseSymptoms = (raw: string) =>
    raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)

  // Live preview via backend priority engine (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const hasSignal =
        formData.name.trim() ||
        formData.complaint.trim() ||
        formData.symptoms.trim() ||
        formData.heartRate ||
        formData.spo2 ||
        formData.bpSystolic ||
        formData.consciousness !== 'ALERT'

      if (!hasSignal) {
        setUrgencyScore(0)
        setPriority('P4')
        setReasons([])
        return
      }

      setPreviewLoading(true)
      try {
        const res = await previewTriage({
          age: parseInt(formData.age, 10) || 30,
          complaint: formData.complaint.trim(),
          symptoms: parseSymptoms(formData.symptoms),
          consciousness: formData.consciousness,
          vitals: {
            heartRate: parseInt(formData.heartRate, 10) || 80,
            oxygenSaturation: parseInt(formData.spo2, 10) || 98,
            systolicBP: parseInt(formData.bpSystolic, 10) || 120,
            diastolicBP: parseInt(formData.bpDiastolic, 10) || 80,
            temperature: parseFloat(formData.temperature) || 36.8,
          },
        })
        setUrgencyScore(res.score)
        setPriority((res.level as Priority) || 'P4')
        setReasons(res.reasons || [])
      } catch {
        // Keep last preview on transient errors
      } finally {
        setPreviewLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [formData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Patient name is required')
      return
    }
    if (!formData.complaint.trim()) {
      toast.error('Chief complaint is required')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Registering patient…')

    try {
      const payload = {
        name: formData.name.trim(),
        age: parseInt(formData.age, 10) || 30,
        gender: formData.gender.toLowerCase(),
        arrivalType: formData.arrivalType,
        complaint: formData.complaint.trim(),
        symptoms: parseSymptoms(formData.symptoms),
        consciousness: formData.consciousness,
        vitals: {
          heartRate: parseInt(formData.heartRate, 10) || 80,
          oxygenSaturation: parseInt(formData.spo2, 10) || 98,
          systolicBP: parseInt(formData.bpSystolic, 10) || 120,
          diastolicBP: parseInt(formData.bpDiastolic, 10) || 80,
          temperature: parseFloat(formData.temperature) || 36.8,
        },
      }

      const created = await registerPatient(payload)
      const patientId = created.patientId
      const evaluated = await evaluatePatient(patientId)

      setUrgencyScore(evaluated.urgencyScore)
      setPriority((evaluated.priority as Priority) || 'P4')
      setReasons(evaluated.triggeredRules || [])

      // Fire-and-forget AI recommendation for the ops queue
      generateRecommendation(patientId).catch(() => {})

      toast.success(
        `${patientId} registered as ${evaluated.priority} (score ${evaluated.urgencyScore})`,
        { id: toastId }
      )
      setFormData(emptyForm)
      router.push('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed', { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Patient Intake & Triage"
        subtitle="Register incoming patients and compute their clinical priority score in real-time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
        <div className="lg:col-span-8">
          <div className="panel p-6 bg-white">
            <h3 className="font-bold text-text-primary text-lg mb-6 flex items-center gap-2 border-b border-border pb-4">
              <User className="w-5 h-5 text-brand" /> Demographics & Triage Record
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-text-secondary uppercase block mb-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Patient’s full name"
                    className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase block mb-1">
                    Age
                  </label>
                  <input
                    required
                    type="number"
                    name="age"
                    min={0}
                    max={120}
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Age in years"
                    className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase block mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary uppercase block mb-1">
                  Arrival Type
                </label>
                <select
                  name="arrivalType"
                  value={formData.arrivalType}
                  onChange={handleChange}
                  className="w-full max-w-xs h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-white"
                >
                  <option value="WALK_IN">Walk-in</option>
                  <option value="AMBULANCE">Ambulance</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              <div>
                <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                  <VitalIcon className="w-4 h-4 text-brand" /> Vital Signs Snapshot
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(
                    [
                      ['heartRate', 'Heart Rate (bpm)', 'Beats per minute, e.g. 80'],
                      ['bpSystolic', 'BP Systolic', 'Top number, e.g. 120'],
                      ['bpDiastolic', 'BP Diastolic', 'Bottom number, e.g. 80'],
                      ['spo2', 'SpO2 (%)', 'Oxygen in blood, e.g. 98'],
                    ] as const
                  ).map(([name, label, placeholder]) => (
                    <div key={name}>
                      <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                      Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="Body temperature, e.g. 36.8"
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                      Consciousness
                    </label>
                    <select
                      name="consciousness"
                      value={formData.consciousness}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-white"
                    >
                      <option value="ALERT">Alert (fully conscious)</option>
                      <option value="CONFUSED">Confused</option>
                      <option value="UNCONSCIOUS">Unconscious</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Schema: complaint TEXT + symptoms TEXT[] */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase block mb-1">
                    Main problem (chief complaint)
                  </label>
                  <input
                    required
                    type="text"
                    name="complaint"
                    value={formData.complaint}
                    onChange={handleChange}
                    placeholder="What is the main reason for visit? e.g. Chest pain"
                    className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase block mb-1">
                    Other symptoms
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    rows={3}
                    placeholder="List other symptoms, separated by commas — e.g. shortness of breath, sweating, dizziness"
                    className="w-full rounded-button border border-border p-3 text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20 resize-none"
                  />
                  <p className="text-[10px] text-text-tertiary mt-1">
                    Tip: write each symptom separated by a comma.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-5 py-2.5 bg-white border border-border text-text-secondary hover:text-text-primary rounded-button text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-button text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering…' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <div className="panel p-6 bg-bg-page border-brand-100 flex flex-col min-h-[340px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5 text-brand" />
                  <h3 className="font-bold text-text-primary text-base">How urgent is this?</h3>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">
                  As you fill the form, we estimate how quickly this patient should be seen
                  {previewLoading ? ' (updating…)…' : '.'}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-white border border-border rounded-card my-4">
                <span className="text-[10px] font-bold text-text-tertiary uppercase mb-1">
                  Urgency score (0–100)
                </span>
                <span className="text-5xl font-black text-text-primary tabular-nums leading-none mb-1">
                  {urgencyScore}
                </span>
                <span className="text-[11px] text-slate-400 mb-3">
                  {urgencyScore === 0
                    ? 'Enter vitals or symptoms to see a score'
                    : 'Higher number = more urgent'}
                </span>
                <PriorityBadge priority={priority} size="md" />
                <p className="text-sm font-semibold text-slate-700 mt-2">
                  {PRIORITY_LABELS[priority]}
                </p>
                <p className="text-[11px] text-slate-500 text-center mt-1 leading-snug px-2">
                  {PRIORITY_HELP[priority]}
                </p>
              </div>

              {reasons.length > 0 ? (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Why this score
                  </p>
                  <ul className="space-y-1.5">
                    {reasons.slice(0, 5).map((r) => (
                      <li key={r} className="text-[11px] text-slate-600 flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center mb-4 px-2 leading-relaxed">
                  Start with the main problem and vitals. The score updates automatically — nothing is saved until you tap Register.
                </p>
              )}

              <div className="text-[10px] text-text-tertiary text-center leading-normal border-t border-border pt-3 mt-auto">
                On register, the patient is added to the live waiting queue for staff review.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
