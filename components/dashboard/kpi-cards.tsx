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
      try {
        const data = await getDashboardKpis()
        setKpis([
          {
            label: 'Total de agendamentos',
            value: String(data.totalAppointments),
            icon: 'CalendarCheck',
            trend: 0,
            trendUp: true,
          },
          {
            label: 'Faturamento (concluídos)',
            value: currency.format(data.revenue),
            icon: 'CircleDollarSign',
            trend: 0,
            trendUp: true,
          },
          {
            label: 'Clientes totais',
            value: String(data.totalClients),
            icon: 'Users',
            trend: 0,
            trendUp: true,
          },
          {
            label: 'Clientes em risco',
            value: '12',
            icon: 'Star',
            trend: 5,
            trendUp: false,
          },
          {
            label: 'Novos clientes',
            value: '18',
            icon: 'UserPlus',
            trend: 28,
            trendUp: true,
          },
        ])
      } catch (err) {
        console.error('Erro ao carregar KPIs:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
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
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon]
        const Trend = kpi.trendUp ? TrendingUp : TrendingDown
        return (
          <div
            key={kpi.label}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/30"
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
            <p className="mt-3 text-2xl font-bold tracking-tight">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        )
      })}
    </div>
  )
}