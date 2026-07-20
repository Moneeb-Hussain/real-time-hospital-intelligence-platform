'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { ChevronRight, Bell, Menu } from 'lucide-react'

export function Header({ activeAlerts = 0 }: { activeAlerts?: number }) {
  const [currentTime, setCurrentTime] = useState('')
  const pathname = usePathname() || ''

  useEffect(() => {
    const tick = () => setCurrentTime(format(new Date(), 'HH:mm:ss'))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  let breadcrumbs = [{ label: 'Command Center' }]
  if (pathname.startsWith('/dashboard')) breadcrumbs = [{ label: 'Dashboard' }]
  else if (pathname.startsWith('/intake')) breadcrumbs.push({ label: 'Patient Intake' })
  else if (pathname.startsWith('/recommendation')) breadcrumbs.push({ label: 'AI Recommendation' })
  else if (pathname.startsWith('/resources')) breadcrumbs.push({ label: 'Resources' })

  return (
    <header className="h-14 sticky top-0 z-40 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center text-sm">
        <button 
          className="md:hidden mr-3 p-1 -ml-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-card"
          onClick={() => document.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        >
          <Menu className="w-5 h-5" />
        </button>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-4 h-4 mx-2 text-text-tertiary" />}
            <span className={idx === breadcrumbs.length - 1 ? 'font-semibold text-text-primary' : 'text-text-secondary'}>
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-6">
        <span className="font-mono text-sm text-text-secondary">{currentTime}</span>
        
        <div className="relative cursor-pointer text-text-secondary hover:text-text-primary">
          <Bell className="w-5 h-5" />
          {activeAlerts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-critical"></span>
            </span>
          )}
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-ai flex items-center justify-center text-white text-sm font-bold shadow-sm">
            OP
          </div>
          <span className="text-sm font-medium text-text-secondary">Operator</span>
        </div>
      </div>
    </header>
  )
}
