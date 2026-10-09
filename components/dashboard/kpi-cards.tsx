'use client'

import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  CircleDollarSign,
  Users,
  Star,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { getDashboardKpis } from '@/lib/supabase-data'
import { getClientKpis, RISK_DAYS } from '@/lib/supabase-kpis'
import { onDataChanged } from '@/lib/refresh-bus'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  CalendarCheck,
  CircleDollarSign,
  Users,
  Star,
  UserPlus,
}

const toneMap: Record<string, string> = {
  gold: 'chip-gold',
  success: 'chip-success',
  info: 'chip-info',
  muted: 'chip-muted',
  danger: 'chip-danger',
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type Kpi = {
  label: string
  value: string
  icon: string
  tone: 'gold' | 'success' | 'info' | 'muted' | 'danger'
}

export function KpiCards() {
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [main, clientKpis] = await Promise.allSettled([
        getDashboardKpis(),
        getClientKpis(),
      ])

      if (main.status === 'rejected') {
        console.error('Erro ao carregar KPIs:', main.reason)
      }
      if (clientKpis.status === 'rejected') {
        console.error('Erro ao carregar KPIs de clientes:', clientKpis.reason)
      }

      const data = main.status === 'fulfilled' ? main.value : null
      const clients = clientKpis.status === 'fulfilled' ? clientKpis.value : null

      setKpis([
        {
          label: 'Agendamentos no mês',
          value: data ? String(data.totalAppointments) : '-',
          icon: 'CalendarCheck',
          tone: 'gold',
        },
        {
          label: 'Faturamento do mês (concluídos)',
          value: data ? currency.format(data.revenue) : '-',
          icon: 'CircleDollarSign',
          tone: 'success',
        },
        {
          label: 'Clientes totais',
          value: data ? String(data.totalClients) : '-',
          icon: 'Users',
          tone: 'info',
        },
        {
          label: `Clientes em risco (+${RISK_DAYS} dias)`,
          value: clients ? String(clients.atRisk) : '-',
          icon: 'Star',
          tone: 'danger',
        },
        {
          label: 'Novos clientes no mês',
          value: clients ? String(clients.newClients) : '-',
          icon: 'UserPlus',
          tone: 'gold',
        },
      ])
      setLoading(false)
    }
    load()
    const unsubscribe = onDataChanged(load)
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="relative h-[108px] w-[160px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card sm:w-auto"
          >
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 stagger-children scrollbar-thin sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon]
        return (
          <div
            key={kpi.label}
            className={cn(
              'group relative shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-[oklch(0.195_0.009_300)] p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-20px_oklch(0.62_0.19_305/40%)]',
              'w-[160px] sm:w-auto',
            )}
          >
            {/* Brilho de hover no canto */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-gold/0 blur-2xl transition-colors duration-500 group-hover:bg-gold/20"
            />

            <span
              className={cn(
                'relative grid size-10 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
                toneMap[kpi.tone] ?? toneMap.gold,
              )}
            >
              <Icon className="size-[18px]" strokeWidth={2.2} />
            </span>
            <p className="relative mt-3 break-words text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
              {kpi.value}
            </p>
            <p className="relative mt-0.5 text-xs leading-snug text-muted-foreground">
              {kpi.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
