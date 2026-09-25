'use client'

import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  CircleDollarSign,
  Users,
  Star,
  UserPlus,
  TrendingUp,
  TrendingDown,
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

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type Kpi = {
  label: string
  value: string
  icon: string
  trend: number
  trendUp: boolean
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
          trend: 0,
          trendUp: true,
        },
        {
          label: 'Faturamento do mês (concluídos)',
          value: data ? currency.format(data.revenue) : '-',
          icon: 'CircleDollarSign',
          trend: 0,
          trendUp: true,
        },
        {
          label: 'Clientes totais',
          value: data ? String(data.totalClients) : '-',
          icon: 'Users',
          trend: 0,
          trendUp: true,
        },
        {
          label: `Clientes em risco (+${RISK_DAYS} dias)`,
          value: clients ? String(clients.atRisk) : '-',
          icon: 'Star',
          trend: 0,
          trendUp: false,
        },
        {
          label: 'Novos clientes no mês',
          value: clients ? String(clients.newClients) : '-',
          icon: 'UserPlus',
          trend: 0,
          trendUp: true,
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi, index) => {
        const Icon = iconMap[kpi.icon]
        const Trend = kpi.trendUp ? TrendingUp : TrendingDown
        return (
          <div
            key={kpi.label}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/30',
              // com 5 cards em 2 colunas, o último ocupa a linha inteira no celular
              index === kpis.length - 1 && kpis.length % 2 === 1 && 'col-span-2 sm:col-span-1',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid size-10 place-items-center rounded-xl bg-gold/12 text-gold">
                <Icon className="size-5" />
              </span>
              {kpi.trend > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-semibold',
                    kpi.trendUp ? 'text-success' : 'text-danger',
                  )}
                >
                  <Trend className="size-3.5" />
                  {kpi.trend}%
                </span>
              )}
            </div>
            <p className="mt-3 break-words text-xl font-bold tracking-tight sm:text-2xl">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        )
      })}
    </div>
  )
}