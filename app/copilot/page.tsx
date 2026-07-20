'use client'

import React from 'react'
import { PageHeader } from '@/components/shared'
import { CopilotPanel } from '@/components/ai/CopilotPanel'

export default function CopilotPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex-shrink-0">
        <PageHeader
          title="AI Copilot Workspace"
          subtitle="Real-time AI-powered hospital intelligence assistant to query occupancy, bottlenecks, and staff roster."
        />
      </div>
      <div className="flex-1 min-h-0 mt-6 pb-6">
        <CopilotPanel />
      </div>
    </div>
  )
}
