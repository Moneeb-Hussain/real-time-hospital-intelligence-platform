'use client'

import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import React from 'react'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  if (pathname === '/') {
    return <>{children}</>
  }
  
  return <AppShell>{children}</AppShell>
}
