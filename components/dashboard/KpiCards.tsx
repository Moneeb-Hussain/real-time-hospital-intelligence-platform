'use client'

import React from 'react'
import CountUp from 'react-countup'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, BedDouble, Activity } from 'lucide-react'
import { SkeletonKpiCard } from '@/components/shared'
import { formatWait, cn } from '@/lib/utils'
import type { KpiData } from '@/types'

export function KpiCards({ data, healthScore }: { data: KpiData | null, healthScore?: number | null }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonKpiCard key={i} />)}
      </div>
    )
  }

  const cards = [
    {
      title: 'Critical Patients',
      value: data.criticalPatients,
      trend: data.criticalTrend,
      trendBad: 'up',
      icon: <AlertTriangle className="w-6 h-6 text-critical" />,
      bgIcon: 'bg-critical-bg'
    },
    {
      title: 'Avg Wait Time',
      valueStr: formatWait(data.avgWaitMinutes),
      trend: data.avgWaitTrend,
      trendBad: 'up',
      icon: <Clock className="w-6 h-6 text-brand" />,
      bgIcon: 'bg-brand-50'
    },
    {
      title: 'ICU Beds Available',
      value: data.icuBedsAvailable,
      subtitle: `of ${data.icuBedsTotal} total`,
      icon: <BedDouble className="w-6 h-6 text-success" />,
      bgIcon: 'bg-success-bg'
    },
    {
      title: 'System Health',
      valueStr: healthScore ? `${healthScore}%` : '---',
      icon: <Activity className="w-6 h-6 text-ai" />,
      bgIcon: 'bg-ai-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => {
        let trendNode = null
        if (card.trend !== undefined) {
          const isBad = (card.trendBad === 'up' && card.trend > 0) || (card.trendBad === 'down' && card.trend < 0)
          trendNode = (
            <div className="flex items-center gap-1 mt-1">
              <span className={cn('text-sm font-bold', isBad ? 'text-critical' : 'text-success')}>
                {isBad ? '+' : '-'}{Math.abs(card.trend)}%
              </span>
              <span className="text-xs text-text-tertiary">since yesterday</span>
            </div>
          )
        }

        return (
          <motion.div
            key={i}
            className="card p-5 flex items-center gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <div className={cn('w-[56px] h-[56px] flex items-center justify-center rounded-full flex-shrink-0', card.bgIcon)}>
              {card.icon}
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-text-secondary">{card.title}</span>
              <span className="text-2xl font-bold text-text-primary tabular-nums mt-0.5">
                {card.valueStr !== undefined ? card.valueStr : <CountUp end={card.value as number} duration={1.5} />}
              </span>
              {trendNode}
              {card.subtitle && !trendNode && <span className="text-xs text-text-tertiary mt-1">{card.subtitle}</span>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
