'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  UserPlus,
  Brain,
  RefreshCw,
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

export function DemoSection() {
  return (
    <section id="demo" className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-ai opacity-10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold tracking-widest text-[#60A5FA] uppercase">
              Live Demo
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mt-3"
          >
            See It In Action.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 mt-4"
          >
            Two critical patients. One ICU bed. Watch the system prioritize,
            plan, validate, and replan in real-time.
          </motion.p>
        </div>

        {/* Demo Scenario Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1 — Two Patients Arrive */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 relative"
          >
            {/* Step Badge */}
            <div className="w-9 h-9 bg-brand rounded-full flex items-center justify-center text-white text-sm font-bold">
              01
            </div>

            {/* Icon */}
            <div className="mt-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h3 className="text-white font-bold text-lg mt-3">
              Two P1 Patients Arrive
            </h3>

            {/* Patient A */}
            <div className="bg-slate-700/60 border border-slate-600 rounded-xl p-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-semibold">
                  PT-001 Hassan
                </span>
                <span className="bg-[#EF4444] text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                  92/100
                </span>
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Chest Pain • SpO2 82% • P1 Critical
              </div>
            </div>

            {/* Patient B */}
            <div className="bg-slate-700/60 border border-slate-600 rounded-xl p-3 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-semibold">
                  PT-002 Maria
                </span>
                <span className="bg-[#EF4444] text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                  88/100
                </span>
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Stroke Symptoms • BP 185/105 • P1 Critical
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <span>Both need ICU. Only 1 bed available.</span>
            </div>
          </motion.div>

          {/* CARD 2 — AI Recommends */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-slate-800 border-2 border-ai rounded-2xl p-6 relative
                       shadow-2xl shadow-ai/20"
          >
            {/* Step Badge */}
            <div className="w-9 h-9 bg-ai rounded-full flex items-center justify-center text-white text-sm font-bold">
              02
            </div>

            {/* Icon */}
            <div className="mt-4">
              <Brain className="w-8 h-8 text-[#6366F1]" />
            </div>

            {/* Title */}
            <h3 className="text-white font-bold text-lg mt-3">
              AI Recommends & Validates
            </h3>

            {/* AI Output */}
            <div className="bg-[#1E1B3A] border border-ai/40 rounded-xl p-3 mt-4">
              <div className="flex items-center gap-1.5 text-[#6366F1] text-xs font-semibold">
                <Brain className="w-3.5 h-3.5" />
                AI Recommendation
              </div>
              <div className="text-slate-300 text-xs mt-2 leading-relaxed">
                <div>PT-001 → ICU-10 (higher score)</div>
                <div className="mt-1">PT-002 → ER stabilization + queue #1</div>
              </div>

              {/* Confidence bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Confidence</span>
                  <span className="text-[#6366F1] font-semibold">96%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '96%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.4 }}
                    className="h-full bg-ai"
                  />
                </div>
              </div>
            </div>

            {/* Validation chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bg-[#052E16] text-[#4ADE80] text-[10px] font-semibold rounded-full px-2 py-0.5">
                ✓ Bed available
              </span>
              <span className="bg-[#052E16] text-[#4ADE80] text-[10px] font-semibold rounded-full px-2 py-0.5">
                ✓ Dr. Khan ready
              </span>
              <span className="bg-[#052E16] text-[#4ADE80] text-[10px] font-semibold rounded-full px-2 py-0.5">
                ✓ Monitor free
              </span>
            </div>
          </motion.div>

          {/* CARD 3 — ICU Full, System Replans */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-slate-800 border border-[#F59E0B] rounded-2xl p-6 relative"
          >
            {/* Step Badge */}
            <div className="w-9 h-9 bg-[#F59E0B] rounded-full flex items-center justify-center text-white text-sm font-bold">
              03
            </div>

            {/* Icon */}
            <div className="mt-4">
              <RefreshCw className="w-8 h-8 text-[#F59E0B]" />
            </div>

            {/* Title */}
            <h3 className="text-white font-bold text-lg mt-3">
              ICU Full — System Replans
            </h3>

            {/* Alert Box */}
            <div className="bg-[#450A0A] border border-[#EF4444]/50 rounded-xl p-3 mt-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F87171] flex-shrink-0" />
              <span className="text-[#FCA5A5] text-xs font-semibold">
                ICU FULL — All 10 beds occupied
              </span>
            </div>

            {/* New Plan */}
            <div className="bg-slate-700/60 border border-slate-600 rounded-xl p-3 mt-3">
              <div className="text-slate-400 text-xs mb-2">
                New Plan Generated:
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-white text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] mt-0.5 flex-shrink-0" />
                  <span>PT-001 → ER Resuscitation Bay</span>
                </div>
                <div className="flex items-start gap-2 text-white text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] mt-0.5 flex-shrink-0" />
                  <span>Cardiac Monitor reserved</span>
                </div>
                <div className="flex items-start gap-2 text-white text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] mt-0.5 flex-shrink-0" />
                  <span>ICU Queue Position #1</span>
                </div>
                <div className="flex items-start gap-2 text-white text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] mt-0.5 flex-shrink-0" />
                  <span>Staff notified</span>
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="mt-3 text-[#F59E0B] text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Replanned in &lt; 3 seconds
            </div>
          </motion.div>
        </div>

        {/* Big CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
          >
            <Link
              href="/dashboard"
              className="bg-brand text-white px-8 md:px-10 py-4 rounded-2xl text-base md:text-lg font-bold
                         shadow-2xl shadow-brand/40 hover:bg-[#1D4ED8]
                         flex items-center gap-3 inline-flex transition-colors"
            >
              <LayoutDashboard className="w-6 h-6" />
              Open Live Dashboard
            </Link>
          </motion.div>

          <p className="text-slate-500 text-sm mt-6">
            Demo runs on fake patient data only • No real patient information
            is used
          </p>
        </motion.div>
      </div>
    </section>
  )
}
