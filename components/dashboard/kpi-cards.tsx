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
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
  muted: 'bg-white/[0.06] text-muted-foreground',
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type Kpi = {
  label: string
  value: string
  icon: string
  tone: 'gold' | 'success' | 'info' | 'muted'
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
          tone: 'muted',
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
        return (
          <div
            key={kpi.label}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/25',
              // com 5 cards em 2 colunas, o último ocupa a linha inteira no celular
              index === kpis.length - 1 && kpis.length % 2 === 1 && 'col-span-2 sm:col-span-1',
            )}
          >
            <span
              className={cn(
                'grid size-9 place-items-center rounded-xl',
                toneMap[kpi.tone] ?? toneMap.gold,
              )}
            >
              <Icon className="size-[18px]" />
            </span>
            <p className="mt-3 break-words text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
              {kpi.value}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{kpi.label}</p>
          </div>
        )
      })}
    </div>
  )
}