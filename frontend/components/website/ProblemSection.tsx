'use client'

import { motion } from 'framer-motion'
import {
  Users,
  AlertTriangle,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react'

const stats = [
  {
    number: '4.8 hrs',
    label: 'Average ER wait time in busy hospitals',
    color: 'text-[#EF4444]',
  },
  {
    number: '30%',
    label: 'Decisions made with incomplete resource info',
    color: 'text-[#F59E0B]',
  },
  {
    number: '1 in 10',
    label: 'Critical patients experience dangerous delays',
    color: 'text-[#EF4444]',
  },
]

const problems = [
  {
    icon: Users,
    iconBg: 'bg-[#FEF2F2]',
    iconColor: 'text-[#EF4444]',
    title: 'Patient Overload',
    description:
      'Emergency departments face more patients than their resources can handle. Triage becomes chaotic without a clear system.',
    tag: 'Resource Shortage',
    tagBg: 'bg-[#FEF2F2]',
    tagText: 'text-[#B91C1C]',
  },
  {
    icon: AlertTriangle,
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#F59E0B]',
    title: 'Stressful Manual Decisions',
    description:
      'Doctors must decide in real-time: which bed, which doctor, which equipment — often without a complete view of available resources.',
    tag: 'No AI Support',
    tagBg: 'bg-[#FFFBEB]',
    tagText: 'text-[#B45309]',
  },
  {
    icon: LayoutDashboard,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand',
    title: 'No Operational Intelligence',
    description:
      'No centralized command center. No predictive alerts. No fallback plan when resources run out. Everything is reactive, never proactive.',
    tag: 'Reactive System',
    tagBg: 'bg-brand-50',
    tagText: 'text-[#1D4ED8]',
  },
]

export function ProblemSection() {
  return (
    <section id="problem" className="py-24 bg-slate-50 relative">
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
              The Problem
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mt-3"
          >
            Emergency departments are overwhelmed.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 mt-4"
          >
            Every hour, hospital operators make life-critical resource decisions
            without a complete view or intelligent support.
          </motion.p>
        </div>

        {/* Big Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 max-w-5xl mx-auto"
        >
          {stats.map((stat, index) => (
            <div key={index} className="relative text-center px-6">
              <div className={`text-4xl md:text-5xl font-bold ${stat.color}`}>
                {stat.number}
              </div>
              <div className="text-sm text-slate-500 mt-3 max-w-[200px] mx-auto leading-relaxed">
                {stat.label}
              </div>

              {/* Divider (not on last) */}
              {index < stats.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-20 bg-slate-200" />
              )}
            </div>
          ))}
        </motion.div>

        {/* Problem Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem, index) => {
            const Icon = problem.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm
                           hover:shadow-lg transition-shadow"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${problem.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${problem.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="font-bold text-lg text-slate-900 mt-5">
                  {problem.title}
                </h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  {problem.description}
                </p>

                {/* Tag */}
                <div className="mt-5">
                  <span
                    className={`inline-block ${problem.tagBg} ${problem.tagText}
                                text-xs font-semibold rounded-full px-3 py-1`}
                  >
                    {problem.tag}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom Connector Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <p className="text-sm text-slate-400 font-medium">
            But there is a better way
          </p>
          <ChevronDown className="w-8 h-8 text-slate-300 animate-bounce" />
        </motion.div>
      </div>
    </section>
  )
}
