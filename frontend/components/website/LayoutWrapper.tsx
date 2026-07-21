'use client'

import { AppShell } from '@/components/layout/AppShell'
import React from 'react'

/** All routes use the hospital command-center shell (marketing home removed). */
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
