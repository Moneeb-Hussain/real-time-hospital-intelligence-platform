'use client'

import { motion } from 'framer-motion'
import {
  Code2,
  Palette,
  Database,
  Brain,
  Globe,
  Zap,
  BarChart3,
  ShieldCheck,
  Layers,
} from 'lucide-react'

interface Tech {
  icon: typeof Code2
  iconColor: string
  iconBg: string
  name: string
  role: string
  isAi?: boolean
}

const techStack: Tech[] = [
  {
    icon: Layers,
    iconColor: 'text-slate-900',
    iconBg: 'bg-slate-100',
    name: 'Next.js 14',
    role: 'App Router + API',
  },
  {
    icon: Code2,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    name: 'TypeScript',
    role: 'Type Safety',
  },
  {
    icon: Palette,
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-50',
    name: 'Tailwind CSS',
    role: 'Design System',
  },
  {
    icon: Database,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    name: 'Supabase',
    role: 'PostgreSQL + Realtime',
  },
  {
    icon: Brain,
    iconColor: 'text-ai',
    iconBg: 'bg-ai-50',
    name: 'GPT-4o',
    role: 'AI Recommendations',
    isAi: true,
  },
  {
    icon: Globe,
    iconColor: 'text-slate-900',
    iconBg: 'bg-slate-100',
    name: 'Vercel',
    role: 'Deployment',
  },
  {
    icon: Zap,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    name: 'Framer Motion',
    role: 'Animations',
  },
  {
    icon: BarChart3,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-50',
    name: 'Recharts',
    role: 'Data Visualization',
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-[#22C55E]',
    iconBg: 'bg-[#F0FDF4]',
    name: 'Zod',
    role: 'Schema Validation',
  },
]

const architectureSteps = [
  { label: 'Patient Intake', variant: 'default' },
  { label: 'Priority Engine', variant: 'brand' },
  { label: 'Resource Check', variant: 'default' },
  { label: 'GPT Planning', variant: 'ai' },
  { label: 'Validation', variant: 'success' },
  { label: 'Human Approval', variant: 'default' },
  { label: 'Dashboard Update', variant: 'dark' },
]

const variantStyles: Record<string, string> = {
  default: 'bg-white border border-slate-200 text-slate-700',
  brand: 'bg-brand-50 border border-brand-100 text-brand',
  ai: 'bg-ai-50 border border-ai-100 text-ai',
  success: 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#22C55E]',
  dark: 'bg-slate-900 text-white border border-slate-900',
}

export function TechStackSection() {
  return (
    <section id="tech-stack" className="py-24 bg-white">
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
              Tech Stack
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mt-3"
          >
            Built With{' '}
            <span className="text-brand">Production-Grade</span> Tools.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 mt-4"
          >
            No shortcuts. Every technology chosen for reliability, speed, and
            developer experience.
          </motion.p>
        </div>

        {/* Tech Cards Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {techStack.map((tech, index) => {
            const Icon = tech.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -3 }}
                className={`bg-white rounded-xl p-5 flex items-center gap-4 transition-all shadow-sm hover:shadow-md
                            ${
                              tech.isAi
                                ? 'border-2 border-ai-100'
                                : 'border border-slate-200'
                            }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${tech.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${tech.iconColor}`} />
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {tech.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {tech.role}
                  </div>
                </div>

                {tech.isAi && (
                  <div className="ml-auto">
                    <span className="bg-ai-50 text-ai text-[10px] font-bold px-2 py-0.5 rounded-full">
                      AI
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Architecture Flow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 p-8 md:p-10 bg-slate-50 rounded-3xl border border-slate-200"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-slate-900">
              System Architecture
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              End-to-end request flow — from patient intake to dashboard update
            </p>
          </div>

          {/* Flow */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {architectureSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap
                              ${variantStyles[step.variant]}`}
                >
                  {step.label}
                </motion.div>

                {index < architectureSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.05 }}
                    className="text-slate-400 text-lg font-bold"
                  >
                    →
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-brand-50 border border-brand-100" />
              <span className="text-slate-500">Rule Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-ai-50 border border-ai-100" />
              <span className="text-slate-500">AI Layer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#F0FDF4] border border-[#BBF7D0]" />
              <span className="text-slate-500">Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-900" />
              <span className="text-slate-500">Realtime Sync</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
