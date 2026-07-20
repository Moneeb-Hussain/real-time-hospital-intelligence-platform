import Link from 'next/link'
import { Heart, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

const productLinks = [
  { label: 'Live Dashboard', href: '/dashboard' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Tech Stack', href: '#tech-stack' },
  { label: 'Future Vision', href: '#future' },
]

const techList = [
  'Next.js 14 + TypeScript',
  'Supabase + PostgreSQL',
  'OpenAI GPT-4o',
  'Vercel Deployment',
  'Framer Motion',
]

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* LEFT — Brand */}
          <div className="md:col-span-5">
            {/* Logo */}
            <div className="flex items-center">
              <div className="relative w-44 h-12">
                <Image src="/logo.png" alt="Opus Pulse AI Logo" fill className="object-contain" />
              </div>
            </div>

            {/* Tagline */}
            <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-sm">
              AI Hospital Operations Command Center. Real-time patient
              prioritization and intelligent resource allocation.
            </p>

            {/* Built For */}
            <p className="text-slate-500 text-xs mt-4">
              Built for OpenAI Hackathon 2025
            </p>

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-slate-800/50 border border-slate-800 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  This product uses fake demo data only. Not for clinical use.
                  Not a medical device.
                </p>
              </div>
            </div>
          </div>

          {/* CENTER — Product */}
          <div className="md:col-span-3">
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Product
            </h3>
            <ul className="flex flex-col gap-3">
              {productLinks.map((link, index) => (
                <li key={index}>
                  {link.href.startsWith('/') ? (
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — Built With */}
          <div className="md:col-span-4">
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Built With
            </h3>
            <ul className="flex flex-col gap-3">
              {techList.map((tech, index) => (
                <li key={index} className="text-sm text-slate-400">
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-slate-500 text-xs">
            © 2025 MedOps. Built with{' '}
            <span className="text-[#EF4444]">♥</span> for better healthcare
            operations.
          </p>
          <p className="text-slate-600 text-xs">
            Demo data only — Not for clinical use
          </p>
        </div>
      </div>
    </footer>
  )
}
