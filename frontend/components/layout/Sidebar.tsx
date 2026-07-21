'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, UserPlus, Brain, Building2, Users, Stethoscope, Activity, BarChart3, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLogo } from './BrandLogo'

export function Sidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname() || ''

  useEffect(() => {
    const handler = () => setMobileOpen(prev => !prev)
    document.addEventListener('toggle-mobile-sidebar', handler)
    return () => document.removeEventListener('toggle-mobile-sidebar', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
    } catch {
      // ignore
    }
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('sidebar-collapsed', String(next))
    } catch {
      // ignore
    }
  }

  const sections = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, badge: null, soon: false },
        { label: 'Patient Intake', href: '/intake', icon: UserPlus, badge: null, soon: false },
        { label: 'AI Recommendations', href: '/recommendation', icon: Brain, badge: pendingCount, soon: false },
        { label: 'Resources', href: '/resources', icon: Building2, badge: null, soon: false },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Patients', href: '/patients', icon: Users, badge: null, soon: false },
        { label: 'Doctors', href: '/doctors', icon: Stethoscope, badge: null, soon: false },
        { label: 'Equipment', href: '/equipment', icon: Activity, badge: null, soon: false },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'AI Copilot', href: '/copilot', icon: Brain, badge: null, soon: false },
        { label: 'Simulation Engine', href: '/simulation', icon: Activity, badge: null, soon: false },
        { label: 'Analytics', href: '/analytics', icon: BarChart3, badge: null, soon: false },
        { label: 'Reports', href: '/reports', icon: FileText, badge: null, soon: false },
      ]
    },
  ]

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      <motion.div
        animate={{ width: collapsed ? 72 : 264 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex flex-col h-screen bg-bg-sidebar fixed left-0 top-0 z-50 overflow-hidden border-r border-border transition-transform duration-300 md:translate-x-0",
          mobileOpen ? "translate-x-0 w-[264px] !w-[264px]" : "-translate-x-full md:!w-auto"
        )}
      >
      <div className="flex items-center h-16 border-b border-border px-3 flex-shrink-0 overflow-hidden">
        <BrandLogo collapsed={collapsed && !mobileOpen} className="w-full" />
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!collapsed && (
              <div className="text-xs uppercase text-text-tertiary px-4 py-2 font-semibold tracking-wider">
                {section.title}
              </div>
            )}
            <div className="px-2 space-y-1">
              {section.items.map((item, i) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard' || pathname === '/'
                    : pathname.startsWith(item.href)
                const inner = (
                  <div className={cn('nav-item relative', isActive && 'active', item.soon && 'opacity-60 cursor-not-allowed')}>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                    {(item.badge ?? 0) > 0 && (
                      <span className="absolute top-1 right-1 bg-brand text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    {item.soon && !collapsed && (
                      <span className="text-[10px] bg-border text-text-secondary px-1.5 py-0.5 rounded ml-auto">
                        Soon
                      </span>
                    )}
                  </div>
                )
                return item.soon ? <div key={i}>{inner}</div> : <Link key={i} href={item.href}>{inner}</Link>
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={toggle}
        className="flex items-center justify-center border-t border-border p-4 text-text-secondary hover:text-text-primary hover:bg-bg-sidebar-hover transition-colors flex-shrink-0"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </motion.div>
    </>
  )
}
