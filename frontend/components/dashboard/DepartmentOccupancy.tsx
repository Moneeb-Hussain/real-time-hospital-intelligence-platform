'use client'

import React from 'react'

export function DepartmentOccupancy({ departments }: { departments: any }) {
  // Region stats matching screenshot visual style
  const regions = [
    { name: 'Northeast (NY)', count: 142, pct: 62, color: 'bg-teal-500' },
    { name: 'West Coast (CA)', count: 95, pct: 48, color: 'bg-blue-500' },
    { name: 'Southern Hub (TX)', count: 104, pct: 54, color: 'bg-indigo-500' }
  ]

  return (
    <div className="card h-[380px] flex flex-col p-6 bg-white justify-between">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-bold text-slate-800">Revenue by Location</h3>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1 items-center">
        {/* Left: Stylized Map Graphic (Col 7) */}
        <div className="col-span-7 relative flex items-center justify-center h-full max-h-[190px]">
          <svg
            viewBox="0 0 500 330"
            className="w-full h-full text-slate-200"
            fill="currentColor"
          >
            {/* Highly detailed US geographical regions and clinical zones */}
            <g id="regions" opacity="0.85">
              {/* West */}
              <path
                d="M30,70 L100,50 L120,130 L160,220 L90,260 L40,200 Z"
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="2"
              />
              {/* Midwest / Central */}
              <path
                d="M100,50 L260,60 L280,180 L200,240 L160,220 L120,130 Z"
                fill="#F1F5F9"
                stroke="#CBD5E1"
                strokeWidth="2"
              />
              {/* South / Texas */}
              <path
                d="M160,220 L200,240 L280,180 L320,240 L250,290 L180,290 Z"
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth="2"
              />
              {/* Northeast & East Coast */}
              <path
                d="M260,60 L380,50 L420,100 L440,180 L350,200 L280,180 Z"
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="2"
              />
              {/* Florida / Southeast */}
              <path
                d="M350,200 L440,180 L420,230 L380,270 L340,250 Z"
                fill="#F1F5F9"
                stroke="#E2E8F0"
                strokeWidth="2"
              />
            </g>

            {/* Glowing Referral Hub nodes */}
            <g id="hubs">
              {/* CA Hub */}
              <circle cx="80" cy="140" r="7" fill="#3B82F6" />
              <circle cx="80" cy="140" r="16" stroke="#3B82F6" strokeWidth="1.5" fill="none" className="animate-ping" opacity="0.3" />

              {/* TX Hub */}
              <circle cx="220" cy="240" r="6" fill="#6366F1" />

              {/* NY Hub */}
              <circle cx="360" cy="100" r="7" fill="#0D9488" />
              <circle cx="360" cy="100" r="18" stroke="#0D9488" strokeWidth="1.5" fill="none" className="animate-ping" opacity="0.3" />

              {/* FL Hub */}
              <circle cx="390" cy="230" r="5" fill="#3B82F6" />
            </g>

            {/* Referral flow indicators */}
            <path d="M80,140 Q220,190 360,100" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
          </svg>
        </div>

        {/* Right: Region Stats Lists (Col 5) */}
        <div className="col-span-5 flex flex-col gap-3 justify-center">
          {regions.map((reg) => (
            <div key={reg.name} className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span className="truncate">{reg.name}</span>
                <span className="tabular-nums">{reg.pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${reg.color}`} style={{ width: `${reg.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centered green action button */}
      <div className="flex justify-center border-t border-slate-100 pt-3 mt-1">
        <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-6 py-2 rounded-md transition-colors shadow-sm">
          View More
        </button>
      </div>
    </div>
  )
}
