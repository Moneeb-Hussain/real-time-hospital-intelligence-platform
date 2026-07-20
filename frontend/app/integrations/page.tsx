'use client'

import React from 'react'
import { PageHeader, EmptyState } from '@/components/shared'
import { Plug } from 'lucide-react'

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Integrations Hub"
        subtitle="Manage connections to external Electronic Health Record (EHR) systems, lab networks, and pagers."
      />
      <div className="card mt-6 p-12 flex items-center justify-center">
        <EmptyState
          icon={<Plug className="w-16 h-16 text-brand/40 animate-pulse" />}
          title="Integrations coming soon"
          description="EHR integrations (Epic, Cerner) and standard HL7/FHIR APIs are currently being integrated and will be available in the next release."
        />
      </div>
    </>
  )
}
