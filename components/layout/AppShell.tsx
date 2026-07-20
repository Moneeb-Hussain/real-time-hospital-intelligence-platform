'use client'

import React, { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { getAlerts, getRecommendations } from '@/lib/api'
import { supabase } from '@/lib/supabase-browser'
import { USE_FIXTURES } from '@/lib/fixtures'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [alertCount, setAlertCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [alerts, recs] = await Promise.all([
          getAlerts(),
          getRecommendations('pending')
        ])
        setAlertCount(alerts.filter(a => a.active).length)
        setPendingCount(recs.length)
      } catch {
        // ignore
      }
    }
    fetchCounts()

    if (!USE_FIXTURES && supabase != null) {
      const channelAlerts = supabase.channel('shell-alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, fetchCounts)
        .subscribe()

      const channelRecs = supabase.channel('shell-recs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recommendations' }, fetchCounts)
        .subscribe()

      return () => {
        if (supabase != null) {
          supabase.removeChannel(channelAlerts)
          supabase.removeChannel(channelRecs)
        }
      }
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-bg-page transition-all duration-200 md:pl-[var(--sidebar-width,264px)] pl-0">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header activeAlerts={alertCount} />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
