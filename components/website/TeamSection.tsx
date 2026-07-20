'use client'

import { motion } from 'framer-motion'
import { Zap, Github, Linkedin } from 'lucide-react'

interface TeamMember {
  initials: string
  avatarBg: string
  role: string
  roleBg: string
  roleText: string
  name: string
  skills: string[]
}

const team: TeamMember[] = [
  {
    initials: 'FE',
    avatarBg: 'bg-brand',
    role: 'Frontend Engineer',
    roleBg: 'bg-brand-50',
    roleText: 'text-brand',
    name: 'Team Member',
    skills: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion'],
  },
  {
    initials: 'BE',
    avatarBg: 'bg-[#22C55E]',
    role: 'Backend Engineer',
    roleBg: 'bg-[#F0FDF4]',
    roleText: 'text-[#15803D]',
    name: 'Team Member',
    skills: ['Supabase', 'PostgreSQL', 'API Routes', 'Zod'],
  },
  {
    initials: 'AE',
    avatarBg: 'bg-ai',
    role: 'AI Engineer',
    roleBg: 'bg-ai-50',
    roleText: 'text-ai',
    name: 'Team Member',
    skills: ['GPT-4o', 'Prompt Engineering', 'Validation Layer', 'Streaming'],
  },
]

const buildStats = [
  { number: '48', label: 'Hours to Build' },
  { number: '25', label: 'Prompts Written' },
  { number: '62+', label: 'Frontend Files' },
  { number: '100%', label: 'Human in Control' },
]

export function TeamSection() {
  return (
    <section id="team" className="py-24 bg-white">
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
              The Team
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mt-3"
          >
            Built in{' '}
            <span className="text-brand">48 Hours.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 mt-4"
          >
            A focused team. A clear problem. A working solution.
          </motion.p>

          {/* Hackathon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-5 py-2">
              <Zap className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-sm font-semibold">
                OpenAI Hackathon 2025 — 48 Hour Build
              </span>
            </div>
          </motion.div>
        </div>

        {/* Team Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -4 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm
                         hover:shadow-lg transition-shadow"
            >
              {/* Avatar */}
              <div
                className={`w-20 h-20 mx-auto ${member.avatarBg} text-white
                            text-2xl font-bold flex items-center justify-center
                            rounded-full shadow-lg`}
              >
                {member.initials}
              </div>

              {/* Role Chip */}
              <div className="mt-4">
                <span
                  className={`inline-block ${member.roleBg} ${member.roleText}
                              text-xs font-semibold rounded-full px-3 py-1`}
                >
                  {member.role}
                </span>
              </div>

              {/* Name */}
              <h3 className="font-bold text-lg text-slate-900 mt-3">
                {member.name}
              </h3>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                {member.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-1 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Social Icons (decorative) */}
              <div className="flex items-center justify-center gap-3 mt-5 pt-5 border-t border-slate-100">
                <button
                  disabled
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center
                             hover:bg-slate-200 transition-colors cursor-default"
                >
                  <Github className="w-4 h-4" />
                </button>
                <button
                  disabled
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center
                             hover:bg-slate-200 transition-colors cursor-default"
                >
                  <Linkedin className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-400 text-sm mt-8"
        >
          Team member names will be added before final submission.
        </motion.p>

        {/* Build Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {buildStats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200
                         hover:border-brand/30 transition-colors"
            >
              <div className="text-3xl md:text-4xl font-bold text-brand tabular-nums">
                {stat.number}
              </div>
              <div className="text-xs md:text-sm text-slate-500 mt-2 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
