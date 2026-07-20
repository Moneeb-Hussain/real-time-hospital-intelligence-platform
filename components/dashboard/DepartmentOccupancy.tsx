'use client'

import React from 'react'

export function DepartmentOccupancy({ departments }: { departments: any }) {
  return (
    <div className="card h-[380px] flex flex-col p-6 bg-white justify-between">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-slate-800">Revenue by Location</h3>
      </div>

      {/* Styled US map referral outline SVG */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden py-2">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full max-h-[220px] text-slate-200"
          fill="currentColor"
        >
          {/* Stylized US simplified geographical path map */}
          <path
            d="M80,120 L130,90 L200,90 L270,110 L300,70 L350,70 L390,90 L450,110 L500,100 L560,70 L600,60 L680,60 L730,90 L760,150 L770,220 L730,280 L700,260 L650,290 L610,290 L590,320 L550,330 L520,380 L480,410 L410,430 L360,420 L300,430 L260,390 L240,390 L210,410 L160,410 L120,380 L80,360 L50,290 L40,240 L50,180 Z"
            fill="#F1F5F9"
            stroke="#CBD5E1"
            strokeWidth="3"
          />
          {/* Selected active clinics / referral zones in Teal & Blue */}
          <circle cx="210" cy="180" r="10" fill="#0D9488" className="animate-pulse" />
          <circle cx="210" cy="180" r="22" stroke="#0D9488" strokeWidth="2" fill="none" opacity="0.4" />
          
          <circle cx="480" cy="240" r="8" fill="#3B82F6" />
          <circle cx="620" cy="160" r="7" fill="#0D9488" />
          <circle cx="340" cy="300" r="6" fill="#94A3B8" />
          <circle cx="150" cy="280" r="9" fill="#0D9488" />
          <circle cx="680" cy="230" r="6" fill="#3B82F6" />

          {/* Connection referral lines */}
          <path d="M210,180 L480,240" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <path d="M620,160 L480,240" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <path d="M150,280 L210,180" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        </svg>
      </div>

      {/* Centered Green Action Button exactly like screenshot */}
      <div className="flex justify-center mt-2">
        <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2 rounded-md transition-colors shadow-sm">
          View More
        </button>
      </div>
    </div>
  )
}
