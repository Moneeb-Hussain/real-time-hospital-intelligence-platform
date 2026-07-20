'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  Brain,
  UserCheck,
  AlertTriangle,
} from 'lucide-react'

const pillars = [
  {
    borderColor: 'border-t-brand',
    icon: Zap,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand',
    title: 'Priority Engine',
    subtitle: 'Deterministic. Not AI.',
    subtitleColor: 'text-brand',
    description:
      'Every patient gets a score from 0-100 based on vital signs, symptoms, and age. Pure TypeScript rules. No GPT. No guessing. Fast and reliable.',
    demoLines: [
      'SpO2 82% → +40 pts',
      'Chest Pain → +15 pts',
      'Unconscious → +35 pts',
    ],
    totalLine: 'Total: 90/100 → P1 Critical',
    totalColor: 'text-[#EF4444]',
  },
  {
    borderColor: 'border-t-ai',
    icon: Brain,
    iconBg: 'bg-ai-50',
    iconColor: 'text-ai',
    title: 'AI Recommendation',
    subtitle: 'GPT. Resource-Aware.',
    subtitleColor: 'text-ai',
    description:
      'GPT receives patient data and live hospital resources. It returns an operational plan: which bed, which doctor, which equipment — using only what is actually available.',
    demoLines: [
      '→ Emergency Room Bed ER-16',
      '→ Dr. Ahmed Khan (load 3/6)',
      '→ Cardiac Monitor #1',
    ],
    totalLine: 'Confidence: 96%',
    totalColor: 'text-ai',
    demoBg: 'bg-ai-50',
    demoBorder: 'border border-ai-100',
    demoText: 'text-ai',
  },
  {
    borderColor: 'border-t-[#22C55E]',
    icon: UserCheck,
    iconBg: 'bg-[#F0FDF4]',
    iconColor: 'text-[#22C55E]',
    title: 'Human Approval',
    subtitle: 'Always. No Exceptions.',
    subtitleColor: 'text-[#22C55E]',
    description:
      'No AI recommendation executes automatically. The hospital operator reviews every plan and can approve, reject, override, or request a new calculation.',
    isActions: true,
  },
]

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold tracking-widest text-brand uppercase">
              The Solution
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mt-3"
          >
            One Command Center.{' '}
            <span className="text-brand">Complete Control.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 mt-4"
          >
            MedOps gives hospital operators a real-time AI-powered command
            center to prioritize patients and allocate resources intelligently
            — with humans always in control.
          </motion.p>
        </div>

        {/* NOT AI DOCTOR Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 p-5 bg-slate-900 rounded-2xl max-w-2xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-2 text-white font-semibold">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            This is NOT an AI doctor.
          </div>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            MedOps does not diagnose. It does not prescribe. It helps hospital
            operators make faster, better-informed operational decisions.
          </p>
        </motion.div>

        {/* Three Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -4 }}
                className={`bg-white border border-slate-200 border-t-4 ${pillar.borderColor}
                            rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow`}
              >
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl ${pillar.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-7 h-7 ${pillar.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="font-bold text-xl text-slate-900 mt-5">
                  {pillar.title}
                </h3>

                {/* Subtitle */}
                <div
                  className={`text-xs font-semibold uppercase tracking-wide ${pillar.subtitleColor} mt-1.5`}
                >
                  {pillar.subtitle}
                </div>

                {/* Description */}
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  {pillar.description}
                </p>

                {/* Demo Box */}
                {pillar.isActions ? (
                  // Human Approval — action buttons
                  <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled
                        className="bg-[#22C55E] text-white text-xs font-semibold rounded-lg px-3 py-1.5 cursor-default"
                      >
                        ✓ Approve
                      </button>
                      <button
                        disabled
                        className="bg-[#EF4444] text-white text-xs font-semibold rounded-lg px-3 py-1.5 cursor-default"
                      >
                        ✗ Reject
                      </button>
                      <button
                        disabled
                        className="bg-[#F59E0B] text-white text-xs font-semibold rounded-lg px-3 py-1.5 cursor-default"
                      >
                        Override
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Every AI plan needs human sign-off before execution.
                    </p>
                  </div>
                ) : (
                  // Priority + AI — code-style demo
                  <div
                    className={`mt-5 p-4 rounded-xl ${
                      pillar.demoBg ?? 'bg-slate-50'
                    } ${pillar.demoBorder ?? 'border border-slate-200'}`}
                  >
                    <div className="space-y-1.5">
                      {pillar.demoLines?.map((line, i) => (
                        <div
                          key={i}
                          className={`text-xs font-mono ${
                            pillar.demoText ?? 'text-slate-600'
                          }`}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                    {pillar.totalLine && (
                      <>
                        <div className="h-px bg-slate-200 my-3" />
                        <div
                          className={`text-sm font-bold ${pillar.totalColor}`}
                        >
                          {pillar.totalLine}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
