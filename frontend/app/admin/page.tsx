'use client'

import React from 'react'
import { PageHeader } from '@/components/shared'
import { ShieldCheck, Users, Database, Key } from 'lucide-react'

export default function AdminPanelPage() {
  const adminCards = [
    { title: 'User Management', desc: 'Manage doctors, nurses, and staff access', icon: Users, color: 'text-brand', bg: 'bg-brand-50' },
    { title: 'Role Access Control', desc: 'Configure permissions and roles', icon: ShieldCheck, color: 'text-ai', bg: 'bg-ai-50' },
    { title: 'System Logs', desc: 'Audit trails and event history', icon: Database, color: 'text-warning', bg: 'bg-warning-bg' },
    { title: 'API Keys', desc: 'Manage integration credentials', icon: Key, color: 'text-success', bg: 'bg-success-bg' },
  ]

  return (
    <>
      <PageHeader title="Admin Panel" />
      
      <div className="mt-6 mb-8">
        <h2 className="text-xl font-bold text-text-primary mb-2">System Administration</h2>
        <p className="text-sm text-text-secondary">Manage hospital users, access control, and backend configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-12">
        {adminCards.map((card, i) => (
          <div key={i} className="card p-6 flex flex-col items-start hover:shadow-card-hover transition-shadow cursor-pointer group">
            <div className={`p-3 rounded-lg ${card.bg} ${card.color} mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">{card.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
      
      <div className="card p-6 pb-12">
        <h3 className="text-lg font-bold text-text-primary mb-4">Recent Audit Activity</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg bg-bg-page">
          <Database className="w-10 h-10 text-text-tertiary mb-3" />
          <h4 className="text-sm font-bold text-text-primary mb-1">No recent activity</h4>
          <p className="text-xs text-text-secondary">System audit logs will appear here once the backend is connected.</p>
        </div>
      </div>
    </>
  )
}
