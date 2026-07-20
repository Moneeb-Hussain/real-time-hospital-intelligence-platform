'use client'

import { motion } from 'framer-motion'
import {
  ListOrdered,
  Brain,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  Bell,
} from 'lucide-react'

interface Feature {
  icon: typeof Brain
  iconBg: string
  iconColor: string
  title: string
  description: string
  tag: string
  tagBg: string
  tagText: string
  isAi?: boolean
}

const features: Feature[] = [
  {
    icon: ListOrdered,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand',
    title: 'Real-Time Priority Queue',
    description:
      'Patients automatically sorted by urgency score. P1 Critical always appears first. Updated in real-time across all screens.',
    tag: 'Supabase Realtime',
    tagBg: 'bg-slate-100',
    tagText: 'text-slate-600',
  },
  {
    icon: Brain,
    iconBg: 'bg-ai-50',
    iconColor: 'text-ai',
    title: 'AI Resource Recommendations',
    description:
      'GPT-4o generates operational plans using only resources that actually exist in the current hospital snapshot.',
    tag: 'GPT-4o',
    tagBg: 'bg-ai-50',
    tagText: 'text-ai',
    isAi: true,
  },
  {
    icon: ShieldCheck,
    iconBg: 'bg-[#F0FDF4]',
    iconColor: 'text-[#22C55E]',
    title: 'Automatic Validation',
    description:
      'Every AI output is verified against live Supabase state. No phantom beds. No unavailable doctors. Ever.',
    tag: 'Zero Hallucination',
    tagBg: 'bg-[#F0FDF4]',
    tagText: 'text-[#15803D]',
  },
  {
    icon: UserCheck,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand',
    title: 'Human-in-the-Loop',
    description:
      'Approve, reject, override, or recalculate every AI recommendation. Humans always make the final call.',
    tag: 'Decision Support',
    tagBg: 'bg-slate-100',
    tagText: 'text-slate-600',
  },
  {
    icon: MessageSquare,
    iconBg: 'bg-ai-50',
    iconColor: 'text-ai',
    title: 'AI Operations Copilot',
    description:
      'Ask natural language questions about current hospital status. Answers grounded in live snapshot data with streaming responses.',
    tag: 'Streaming AI',
    tagBg: 'bg-ai-50',
    tagText: 'text-ai',
    isAi: true,
  },
  {
    icon: Bell,
    iconBg: 'bg-[#FEF2F2]',
    iconColor: 'text-[#EF4444]',
    title: 'Smart Alert System',
    description:
      'Auto-fires when ICU is full, doctors are overloaded, or critical patients wait too long. Auto-resolves when conditions clear.',
    tag: 'Real-Time Alerts',
    tagBg: 'bg-[#FEF2F2]',
    tagText: 'text-[#B91C1C]',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
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
              Features
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mt-3"
          >
            Everything a hospital
            <br />
            operator needs.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 mt-4"
          >
            Built for real emergency departments. Designed for speed and
            clarity under pressure.
          </motion.p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className={`bg-white border rounded-2xl p-6 transition-all
                            hover:shadow-lg cursor-default
                            ${
                              feature.isAi
                                ? 'border-l-4 border-l-ai border-t border-r border-b border-slate-200 bg-gradient-to-br from-white to-[#FAFAFF]'
                                : 'border-slate-200'
                            }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-slate-900 mt-5">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  {feature.description}
                </p>

                {/* Tag */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <span
                    className={`inline-flex items-center gap-1.5 ${feature.tagBg} ${feature.tagText}
                                text-xs font-semibold rounded-full px-3 py-1`}
                  >
                    {feature.isAi && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    {feature.tag}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom Highlight Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 p-8 bg-slate-900 rounded-3xl text-center relative overflow-hidden"
        >
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-ai rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <p className="text-xl md:text-2xl text-white font-semibold max-w-3xl mx-auto leading-relaxed">
              The only hospital operations platform where AI plans, software
              validates, and humans always decide.
            </p>
            <p className="text-slate-400 text-sm mt-3">
              Built with responsible AI principles from day one.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
