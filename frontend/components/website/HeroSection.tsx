'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Zap,
  Brain,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from 'lucide-react'

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-white"
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.4]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-brand opacity-[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-ai opacity-[0.06] rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-6">
          {/* Hackathon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-ai-50 text-ai border border-ai-100
                       rounded-full px-4 py-1.5 text-sm font-medium mb-6"
          >
            <Zap className="w-4 h-4" />
            OpenAI Hackathon 2025
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-slate-900"
          >
            AI-Powered Hospital{' '}
            <span className="text-brand">Operations</span>
            <br />
            <span className="text-brand">Command</span> Center
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg md:text-xl text-slate-500 mt-6 max-w-xl leading-relaxed"
          >
            Not an AI doctor. An AI operations assistant that helps hospitals
            prioritize patients and allocate resources intelligently.
          </motion.p>

          {/* Tagline Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl
                       font-mono text-sm text-slate-600 max-w-xl"
          >
            Rules score → AI plans → Software validates → Humans decide
          </motion.div>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand
                            rounded-full px-3 py-1.5 text-sm font-medium">
              <Zap className="w-4 h-4" />
              Real-Time Priority
            </div>
            <div className="inline-flex items-center gap-2 bg-ai-50 text-ai
                            rounded-full px-3 py-1.5 text-sm font-medium">
              <Brain className="w-4 h-4" />
              GPT-Powered Planning
            </div>
            <div className="inline-flex items-center gap-2 bg-[#F0FDF4] text-[#22C55E]
                            rounded-full px-3 py-1.5 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Human Approval
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap gap-4 mt-10"
          >
            <Link
              href="/dashboard"
              className="bg-brand text-white px-6 py-3.5 rounded-xl font-semibold
                         flex items-center gap-2 hover:bg-[#1D4ED8]
                         shadow-lg shadow-blue-500/25 transition-all
                         hover:shadow-xl hover:shadow-blue-500/30
                         hover:-translate-y-0.5"
            >
              View Live Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="border border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-semibold
                         hover:border-brand hover:text-brand transition-colors"
            >
              See How It Works
            </a>
          </motion.div>
        </div>

        {/* RIGHT COLUMN — Dashboard Mockup */}
        <div className="lg:col-span-6 relative">
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            className="relative"
          >
            {/* Main Mockup Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
              {/* Mock Browser Header */}
              <div className="h-10 bg-slate-900 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4 h-5 bg-slate-700 rounded flex items-center px-2">
                  <span className="text-slate-400 text-xs font-mono">
                    medops.vercel.app/dashboard
                  </span>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-4 bg-slate-50">
                {/* Top Row — KPI Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-[#EF4444]">3</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      CRITICAL
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-[#F59E0B]">1</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      ICU BED LEFT
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-brand">63</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      HEALTH SCORE
                    </div>
                  </div>
                </div>

                {/* Patient Queue */}
                <div className="bg-white rounded-lg p-3 border border-slate-200 mt-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Live Patient Queue
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span className="text-slate-700 font-medium flex-1">
                        PT-001 Hassan
                      </span>
                      <span className="bg-[#FEF2F2] text-[#B91C1C] px-1.5 py-0.5 rounded text-[10px] font-bold">
                        P1
                      </span>
                      <span className="text-slate-500 font-mono">92</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span className="text-slate-700 font-medium flex-1">
                        PT-002 Maria
                      </span>
                      <span className="bg-[#FEF2F2] text-[#B91C1C] px-1.5 py-0.5 rounded text-[10px] font-bold">
                        P1
                      </span>
                      <span className="text-slate-500 font-mono">88</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <span className="text-slate-700 font-medium flex-1">
                        PT-004 Li Wei
                      </span>
                      <span className="bg-[#FFFBEB] text-[#B45309] px-1.5 py-0.5 rounded text-[10px] font-bold">
                        P2
                      </span>
                      <span className="text-slate-500 font-mono">58</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-ai-50 border border-ai-100 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ai">
                    <Brain className="w-3.5 h-3.5" />
                    AI Recommendation
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5">
                    Move PT-001 → ER-16 | Dr. Ahmed Khan | 96% confidence
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stat Card 1 — Top Left */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -top-6 -left-8 bg-white shadow-xl border border-slate-200 rounded-xl p-3
                         flex items-center gap-2.5 hidden md:flex"
            >
              <div className="w-9 h-9 bg-[#FEF2F2] rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  ICU Alert
                </div>
                <div className="text-[10px] text-slate-500">
                  1 bed remaining
                </div>
              </div>
            </motion.div>

            {/* Floating Stat Card 2 — Top Right */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 4,
                delay: 1,
                ease: 'easeInOut',
              }}
              className="absolute -top-4 -right-6 bg-ai-50 shadow-xl border border-ai-100
                         rounded-xl p-3 flex items-center gap-2.5 hidden md:flex"
            >
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-ai" />
              </div>
              <div>
                <div className="text-xs font-semibold text-ai">
                  AI Confidence
                </div>
                <div className="text-lg font-bold text-ai leading-none">
                  96%
                </div>
              </div>
            </motion.div>

            {/* Floating Stat Card 3 — Bottom Right */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                delay: 0.5,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-6 -right-8 bg-white shadow-xl border border-slate-200
                         rounded-xl p-3 flex items-center gap-2.5 hidden md:flex"
            >
              <div className="w-9 h-9 bg-[#F0FDF4] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Approved
                </div>
                <div className="text-[10px] text-slate-500">
                  PT-007 assigned
                </div>
              </div>
            </motion.div>

            {/* Floating Stat Card 4 — Bottom Left */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3.8,
                delay: 1.5,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-4 -left-6 bg-white shadow-xl border border-slate-200
                         rounded-xl p-3 flex items-center gap-2.5 hidden md:flex"
            >
              <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-brand" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Live Update
                </div>
                <div className="text-[10px] text-slate-500">
                  Realtime active
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
