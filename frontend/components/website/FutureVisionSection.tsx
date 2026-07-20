'use client'

import { motion } from 'framer-motion'
import {
  FileText,
  Network,
  FlaskConical,
  ScanSearch,
  Truck,
  Wifi,
  Watch,
  Smartphone,
} from 'lucide-react'

interface Integration {
  icon: typeof FileText
  iconColor: string
  iconBg: string
  name: string
  description: string
  subtitle: string
}

const integrations: Integration[] = [
  {
    icon: FileText,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-50',
    name: 'EHR Integration',
    description: 'Electronic Health Records',
    subtitle: 'Epic, Cerner, AllScripts',
  },
  {
    icon: Network,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-50',
    name: 'HL7 / FHIR',
    description: 'Healthcare Data Standards',
    subtitle: 'Real-time patient sync',
  },
  {
    icon: FlaskConical,
    iconColor: 'text-[#F59E0B]',
    iconBg: 'bg-[#FFFBEB]',
    name: 'Lab Results',
    description: 'Real-time lab integration',
    subtitle: 'Auto-update priorities',
  },
  {
    icon: ScanSearch,
    iconColor: 'text-ai',
    iconBg: 'bg-ai-50',
    name: 'Radiology',
    description: 'DICOM integration',
    subtitle: 'Image result alerts',
  },
  {
    icon: Truck,
    iconColor: 'text-[#EF4444]',
    iconBg: 'bg-[#FEF2F2]',
    name: 'Ambulance Dispatch',
    description: 'Pre-arrival notifications',
    subtitle: 'Prepare bed before arrival',
  },
  {
    icon: Wifi,
    iconColor: 'text-[#22C55E]',
    iconBg: 'bg-[#F0FDF4]',
    name: 'IoT Monitoring',
    description: 'Bedside device integration',
    subtitle: 'Live vitals streaming',
  },
  {
    icon: Watch,
    iconColor: 'text-ai',
    iconBg: 'bg-ai-50',
    name: 'Wearables',
    description: 'Patient wearable data',
    subtitle: 'Continuous monitoring',
  },
  {
    icon: Smartphone,
    iconColor: 'text-slate-700',
    iconBg: 'bg-slate-100',
    name: 'Mobile App',
    description: 'Doctor mobile dashboard',
    subtitle: 'iOS + Android',
  },
]

export function FutureVisionSection() {
  return (
    <section id="future" className="py-24 bg-slate-50">
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
              Future Vision
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mt-3"
          >
            This is just the beginning.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 mt-4"
          >
            MedOps is designed to integrate with real hospital infrastructure.
            Here is what comes next.
          </motion.p>
        </div>

        {/* Integration Cards Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {integrations.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -3 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 relative
                           hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Coming Soon Badge */}
                <div className="absolute top-3 right-3">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-full px-2 py-0.5">
                    SOON
                  </span>
                </div>

                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="font-bold text-slate-900 mt-4 text-sm md:text-base">
                  {item.name}
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-slate-400 text-xs mt-2 font-medium">
                  {item.subtitle}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Vision Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 relative overflow-hidden bg-slate-900 rounded-3xl p-10 md:p-14 text-center"
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand opacity-10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-ai opacity-10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Hospital icon */}
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🏥</span>
            </div>

            {/* Vision quote */}
            <p className="text-white text-xl md:text-2xl font-semibold mt-6 max-w-3xl mx-auto leading-relaxed">
              The goal: A fully connected hospital where AI sees everything,
              humans decide everything, and no patient falls through the
              cracks.
            </p>

            {/* Attribution */}
            <p className="text-slate-400 text-sm mt-4 font-medium">
              — MedOps Vision
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
