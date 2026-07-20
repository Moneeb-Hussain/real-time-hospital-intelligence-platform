'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/shared'
import { Bell, Palette, Globe, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    theme: 'light',
    pushNotifications: true,
    emailAlerts: false,
    apiUrl: 'https://api.medops.hospital.local/v1'
  })

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Settings saved successfully!')
    }, 800)
  }

  return (
    <>
      <PageHeader title="System Settings" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pb-12">
        <div className="md:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-3 bg-white text-text-primary border-l-4 border-ai font-semibold rounded-r shadow-sm">
            General Configuration
          </button>
          <button className="w-full text-left px-4 py-3 text-text-secondary hover:bg-bg-page font-medium rounded transition-colors">
            Notifications
          </button>
          <button className="w-full text-left px-4 py-3 text-text-secondary hover:bg-bg-page font-medium rounded transition-colors">
            Integrations
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-ai" />
              <h2 className="text-lg font-bold text-text-primary">Appearance</h2>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-secondary">Theme</label>
              <select 
                value={form.theme}
                onChange={e => setForm({...form, theme: e.target.value})}
                className="border border-border rounded-button px-3 py-2 text-sm max-w-xs focus:outline-none focus:border-ai"
              >
                <option value="light">Light (Medical Default)</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Preference</option>
              </select>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-ai" />
              <h2 className="text-lg font-bold text-text-primary">Notifications</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.pushNotifications} 
                  onChange={e => setForm({...form, pushNotifications: e.target.checked})}
                  className="w-4 h-4 text-ai rounded border-border" 
                />
                <span className="text-sm font-medium text-text-primary">Enable Push Notifications for Critical Alerts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.emailAlerts} 
                  onChange={e => setForm({...form, emailAlerts: e.target.checked})}
                  className="w-4 h-4 text-ai rounded border-border" 
                />
                <span className="text-sm font-medium text-text-primary">Daily Email Digest</span>
              </label>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-ai" />
              <h2 className="text-lg font-bold text-text-primary">Backend Integration</h2>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm font-semibold text-text-secondary">API Base URL</label>
              <input 
                type="text" 
                value={form.apiUrl}
                onChange={e => setForm({...form, apiUrl: e.target.value})}
                className="border border-border rounded-button px-3 py-2 text-sm focus:outline-none focus:border-ai font-mono text-text-secondary w-full"
              />
              <p className="text-xs text-text-tertiary">Configure the endpoint for the real-world backend data stream.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-brand text-white rounded-button font-semibold flex items-center gap-2 hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
