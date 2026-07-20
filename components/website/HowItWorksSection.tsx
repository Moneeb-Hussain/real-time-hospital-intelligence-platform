'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  Zap,
  Building2,
  Brain,
  ShieldCheck,
  UserCheck,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type StepColor = 'brand' | 'warning' | 'ai' | 'success'

interface Step {
  number: string
  icon: typeof UserPlus
  color: StepColor
  title: string
  description: string
  tag: string
  highlight?: string
}

const steps: Step[] = [
  {
    number: '01',
    icon: UserPlus,
    color: 'brand',
    title: 'Patient Arrives',
    description:
      'Staff enters basic patient information: age, symptoms, vital signs, and consciousness level.',
    tag: 'Triage Nurse',
  },
  {
    number: '02',
    icon: Zap,
    color: 'warning',
    title: 'Priority Engine Runs',
    description:
      'Deterministic TypeScript rules calculate urgency score from 0 to 100. No GPT involved — pure logic.',
    tag: 'Rule Engine',
    highlight: 'P1 Critical — Score 92/100',
  },
  {
    number: '03',
    icon: Building2,
    color: 'brand',
    title: 'Resources Checked',
    description:
      'System reads live Supabase data: available beds, doctors on shift, and equipment status in real-time.',
    tag: 'Resource Engine',
  },
  {
    number: '04',
    icon: Brain,
    color: 'ai',
    title: 'AI Generates Plan',
    description:
      'GPT receives patient data plus available resources and returns a complete operational recommendation.',
    tag: 'GPT-4o',
    highlight: 'ER-16 + Dr. Khan + Monitor #1 (96% confidence)',
  },
  {
    number: '05',
    icon: ShieldCheck,
    color: 'success',
    title: 'Software Validates',
    description:
      'Every AI output is verified against live hospital state. Phantom resources or unavailable staff are rejected instantly.',
    tag: 'Validation Layer',
    highlight: '✓ Bed available  ✓ Doctor ready  ✓ Equipment free',
  },
  {
    number: '06',
    icon: UserCheck,
    color: 'success',
    title: 'Human Approves',
    description:
      'A doctor or hospital operator reviews the plan and can approve, reject, override, or recalculate.',
    tag: 'Hospital Operator',
  },
  {
    number: '07',
    icon: LayoutDashboard,
    color: 'brand',
    title: 'Dashboard Updates',
    description:
      'Bed assigned, doctor load updated, equipment reserved. Real-time synchronization across all connected screens.',
    tag: 'Supabase Realtime',
  },
]

const colorMap: Record<
  StepColor,
  {
    bg: string
    text: string
    border: string
    badgeBg: string
    tagBg: string
    tagText: string
  }
> = {
  brand: {
    bg: 'bg-brand-50',
    text: 'text-brand',
    border: 'border-brand',
    badgeBg: 'bg-brand',
    tagBg: 'bg-brand-50',
    tagText: 'text-brand',
  },
  warning: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]',
    badgeBg: 'bg-[#F59E0B]',
    tagBg: 'bg-[#FFFBEB]',
    tagText: 'text-[#B45309]',
  },
  ai: {
    bg: 'bg-ai-50',
    text: 'text-ai',
    border: 'border-ai',
    badgeBg: 'bg-ai',
    tagBg: 'bg-ai-50',
    tagText: 'text-ai',
  },
  success: {
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#22C55E]',
    border: 'border-[#22C55E]',
    badgeBg: 'bg-[#22C55E]',
    tagBg: 'bg-[#F0FDF4]',
    tagText: 'text-[#15803D]',
  },
}

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handleStepClick = (index: number) => {
    setActiveStep(index)
    setIsAutoPlaying(false)
  }

  const handlePrev = () => {
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length)
    setIsAutoPlaying(false)
  }

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % steps.length)
    setIsAutoPlaying(false)
  }

  const step = steps[activeStep]
  const colors = colorMap[step.color]
  const StepIcon = step.icon

  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold tracking-widest text-brand uppercase">
              How It Works
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mt-3"
          >
            From Patient Arrival to Bed Assignment
            <br />
            <span className="text-brand">in Minutes</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 mt-4"
          >
            A complete operational workflow — AI-assisted, human-approved.
          </motion.p>
        </div>

        {/* Two-column layout */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT — Steps list */}
          <div className="lg:col-span-5">
            <div className="space-y-2">
              {steps.map((s, index) => {
                const c = colorMap[s.color]
                const isActive = activeStep === index

                return (
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={`w-full text-left flex items-start gap-4 p-4 rounded-xl transition-all
                                ${
                                  isActive
                                    ? `bg-white shadow-md border-l-4 ${c.border}`
                                    : 'hover:bg-white/60 border-l-4 border-transparent'
                                }`}
                  >
                    {/* Number Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center
                                  text-sm font-bold flex-shrink-0 transition-colors
                                  ${
                                    isActive
                                      ? `${c.badgeBg} text-white`
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                    >
                      {s.number}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-semibold text-sm md:text-base
                                    ${isActive ? 'text-slate-900' : 'text-slate-600'}`}
                      >
                        {s.title}
                      </div>
                      <div
                        className={`inline-block ${c.tagBg} ${c.tagText}
                                    text-[10px] font-semibold rounded-full px-2 py-0.5 mt-1.5`}
                      >
                        {s.tag}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RIGHT — Active step detail */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md h-full flex flex-col"
              >
                {/* Big Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center`}
                >
                  <StepIcon className={`w-8 h-8 ${colors.text}`} />
                </div>

                {/* Step number */}
                <div className="text-xs text-slate-400 font-medium mt-6">
                  Step {activeStep + 1} of {steps.length}
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-slate-500 mt-4 text-base md:text-lg leading-relaxed">
                  {step.description}
                </p>

                {/* Tag */}
                <div className="mt-6">
                  <span
                    className={`inline-block ${colors.tagBg} ${colors.tagText}
                                text-xs font-semibold rounded-full px-3 py-1.5`}
                  >
                    {step.tag}
                  </span>
                </div>

                {/* Highlight */}
                {step.highlight && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-mono text-sm text-slate-700">
                      {step.highlight}
                    </div>
                  </div>
                )}

                {/* Nav Arrows */}
                <div className="flex items-center justify-between mt-auto pt-8">
                  <button
                    onClick={handlePrev}
                    className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center
                               text-slate-600 hover:border-brand hover:text-brand transition-colors"
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Progress dots */}
                  <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleStepClick(i)}
                        className={`h-1.5 rounded-full transition-all
                                    ${
                                      i === activeStep
                                        ? 'w-8 bg-brand'
                                        : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                                    }`}
                        aria-label={`Go to step ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center
                               text-slate-600 hover:border-brand hover:text-brand transition-colors"
                    aria-label="Next step"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
