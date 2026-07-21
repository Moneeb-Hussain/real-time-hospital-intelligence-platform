'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Brand mark + wordmark for AegisOps AI */
export function BrandLogo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean
  className?: string
}) {
  return (
    <Link
      href="/dashboard"
      className={cn('flex items-center gap-3 min-w-0', className)}
      aria-label="AegisOps AI — Dashboard"
    >
      <span className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-brand shadow-sm flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 40 40"
          className="w-7 h-7 text-white"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          {/* Pulse / ECG line */}
          <path
            d="M4 22 H12 L15 12 L19 28 L23 16 L26 22 H36"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Soft cross accent */}
          <path
            d="M30 8 V14 M27 11 H33"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </span>

      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block text-[15px] font-extrabold tracking-tight text-slate-900 truncate">
            AegisOps
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-brand truncate">
            AI · Hospital Ops
          </span>
        </span>
      )}
    </Link>
  )
}
