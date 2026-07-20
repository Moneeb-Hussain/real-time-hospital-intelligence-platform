'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Github,
  CheckCircle2,
  Lock,
} from 'lucide-react'

const facts = [
  { text: '48-hour build' },
  { text: 'Real AI integration' },
  { text: 'Human-controlled' },
]

export function ContactSection() {
  return (
    <section
      id="contact"
      className="py-24 bg-brand relative overflow-hidden"
    >
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-ai opacity-20 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid-contact"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-contact)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
        >
          Ready to see MedOps
          <br />
          in action?
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg md:text-xl text-blue-100 mt-6 max-w-xl mx-auto leading-relaxed"
        >
          Open the live dashboard and experience the full AI Hospital
          Operations Command Center.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {/* Primary CTA */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href="/dashboard"
              className="bg-white text-brand px-8 py-4 rounded-2xl font-bold text-base md:text-lg
                         shadow-2xl hover:bg-blue-50 transition-colors
                         flex items-center gap-3"
            >
              <LayoutDashboard className="w-5 h-5" />
              Open Dashboard
            </Link>
          </motion.div>

          {/* Secondary CTA */}
          <a
            href="#"
            className="border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-semibold text-base md:text-lg
                       hover:border-white hover:bg-white/10 transition-all
                       flex items-center gap-3"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm
                     border border-white/20 rounded-full px-5 py-2.5"
        >
          <Lock className="w-4 h-4 text-blue-100" />
          <p className="text-blue-100 text-sm">
            Demo runs on fake patient data only • No real patient information
          </p>
        </motion.div>

        {/* Quick Facts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-wrap gap-6 md:gap-8 justify-center"
        >
          {facts.map((fact, index) => (
            <div
              key={index}
              className="text-blue-100 text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
              <span className="font-medium">{fact.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
