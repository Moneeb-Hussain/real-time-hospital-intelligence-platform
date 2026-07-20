'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader, PriorityBadge } from '@/components/shared'
import { registerPatient } from '@/lib/api'
import { Activity, ShieldAlert, CheckCircle2, User, Thermometer, Heart, Activity as VitalIcon } from 'lucide-react'
import type { Priority } from '@/types'

export default function PatientIntakePage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    heartRate: '',
    bpSystolic: '',
    bpDiastolic: '',
    spo2: '',
    temperature: '',
    conscious: true,
    symptoms: ''
  })

  const [urgencyScore, setUrgencyScore] = useState(0)
  const [priority, setPriority] = useState<Priority>('P4')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determinsitic Priority Engine math client-side preview
  useEffect(() => {
    let score = 0
    
    const hr = parseInt(formData.heartRate) || 80
    const sys = parseInt(formData.bpSystolic) || 120
    const spo2 = parseInt(formData.spo2) || 98
    const temp = parseFloat(formData.temperature) || 36.8
    const age = parseInt(formData.age) || 30
    
    if (spo2 < 85) score += 40
    else if (spo2 <= 89) score += 25
    else if (spo2 <= 93) score += 10

    if (sys < 90) score += 30
    else if (sys > 180) score += 15

    if (!formData.conscious) score += 35

    if (hr > 130 || hr < 40) score += 20
    else if (hr > 110) score += 12

    if (temp > 39.5 || temp < 35) score += 15

    const symptomsList = formData.symptoms.toLowerCase()
    if (symptomsList.includes('chest pain')) score += 25
    if (symptomsList.includes('breathing')) score += 20
    if (symptomsList.includes('stroke')) score += 25

    if (age > 80) score += 10

    score = Math.min(score, 100)
    setUrgencyScore(score)

    if (score >= 75) setPriority('P1')
    else if (score >= 50) setPriority('P2')
    else if (score >= 25) setPriority('P3')
    else setPriority('P4')
  }, [formData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const submitData = {
        name: formData.name,
        age: parseInt(formData.age) || 30,
        gender: formData.gender,
        vitals: {
          heartRate: parseInt(formData.heartRate) || 80,
          bpSystolic: parseInt(formData.bpSystolic) || 120,
          bpDiastolic: parseInt(formData.bpDiastolic) || 80,
          spo2: parseInt(formData.spo2) || 98,
          temperature: parseFloat(formData.temperature) || 36.8,
          conscious: formData.conscious
        },
        symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(Boolean)
      }

      await registerPatient(submitData)
      setIsSubmitting(false)
      router.push('/patients')
    } catch (err) {
      console.error(err)
      setIsSubmitting(false)
    }
  }

  // Matches priority classes from utils
  const getBadgeVariant = (level: Priority) => {
    return level
  }

  return (
    <>
      <PageHeader 
        title="Patient Intake & Triage" 
        subtitle="Register incoming patients and compute their clinical priority score in real-time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl">
        {/* Registration Form */}
        <div className="lg:col-span-8">
          <div className="card p-6">
            <h3 className="font-bold text-text-primary text-lg mb-6 flex items-center gap-2 border-b border-border pb-4">
              <User className="w-5 h-5 text-brand" /> Demographics & Triage Record
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name and Age/Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase block mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="E.g., Jane Doe"
                    className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-secondary uppercase block mb-1">Age</label>
                    <input
                      required
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="E.g., 45"
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary uppercase block mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-white"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Vitals */}
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                  <VitalIcon className="w-4 h-4 text-brand" /> Vital Signs Snapshot
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      name="heartRate"
                      value={formData.heartRate}
                      onChange={handleChange}
                      placeholder="80"
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">BP Systolic</label>
                    <input
                      type="number"
                      name="bpSystolic"
                      value={formData.bpSystolic}
                      onChange={handleChange}
                      placeholder="120"
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">BP Diastolic</label>
                    <input
                      type="number"
                      name="bpDiastolic"
                      value={formData.bpDiastolic}
                      onChange={handleChange}
                      placeholder="80"
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      name="spo2"
                      value={formData.spo2}
                      onChange={handleChange}
                      placeholder="98"
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="36.8"
                      className="w-full h-10 px-3 rounded-button border border-border text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20"
                    />
                  </div>
                  
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      name="conscious"
                      checked={formData.conscious}
                      onChange={handleChange}
                      id="conscious"
                      className="h-4.5 w-4.5 rounded border-border text-brand focus:ring-brand focus:outline-none focus:border-brand"
                    />
                    <label htmlFor="conscious" className="ml-2 text-sm text-text-secondary font-medium">Patient is fully conscious</label>
                  </div>
                </div>
              </div>

              {/* Row 3: Chief Complaint / Symptoms */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase block mb-1">Chief Complaint & Symptoms</label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  rows={4}
                  placeholder="E.g., Chest pain radiating to left arm, shortness of breath..."
                  className="w-full rounded-button border border-border p-3 text-sm focus:outline-none focus:border-brand transition-colors bg-bg-page/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/patients')}
                  className="px-5 py-2.5 bg-white border border-border text-text-secondary hover:text-text-primary rounded-button text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-button text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Urgency Preview Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <div className="card p-6 bg-bg-page border-brand-100 flex flex-col justify-between h-[340px]">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-brand" />
                  <h3 className="font-bold text-text-primary text-base">Priority Preview</h3>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">Live deterministic scoring based on Clinical Triage regulations.</p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-white border border-border rounded-card my-4">
                <span className="text-[10px] font-bold text-text-tertiary uppercase mb-1">Urgency Score</span>
                <span className="text-5xl font-black text-text-primary font-mono tabular-nums leading-none mb-3">{urgencyScore}</span>
                <PriorityBadge priority={priority} size="md" />
              </div>

              <div className="text-[10px] text-text-tertiary text-center leading-normal border-t border-border pt-3">
                Calculated automatically by the Priority Triage Engine. Non-AI clinical rule execution.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
