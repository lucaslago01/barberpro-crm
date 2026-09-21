import {
  CalendarCheck,
  Clock,
  CircleDollarSign,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import { AgendaStatusBadge } from '@/components/dashboard/badges'
import { agendaFilters, type AgendaStatus } from '@/lib/data'
import type { AgendaSlot } from '@/lib/types'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Horários que o cliente pode escolher no dia (grade das 09:00 às 18:30, sem almoço e sem 18:30)
const BOOKABLE_SLOTS = 15

export function DaySummary({ slots = [] }: { slots?: AgendaSlot[] }) {
  const expected = slots
    .filter((a) => a.status !== 'cancelado' && a.status !== 'faltou')
    .reduce((sum, a) => sum + a.price, 0)

  const realized = slots
    .filter((a) => a.status === 'concluido')
    .reduce((sum, a) => sum + a.price, 0)

  // Cancelado libera o horário; os demais status ocupam
  const occupied = slots.filter((a) => a.status !== 'cancelado').length
  const free = Math.max(0, BOOKABLE_SLOTS - occupied)

  const stats: {
    label: string
    value: string
    icon: LucideIcon
    className: string
  }[] = [
    {
      label: 'Total de agendamentos',
      value: String(slots.length),
      icon: CalendarCheck,
      className: 'text-gold bg-gold/12',
    },
    {
      label: 'Horários disponíveis',
      value: String(free),
      icon: Clock,
      className: 'text-info bg-info/12',
    },
    {
      label: 'Faturamento previsto',
      value: currency.format(expected),
      icon: CircleDollarSign,
      className: 'text-foreground bg-white/8',
    },
    {
      label: 'Faturamento realizado',
      value: currency.format(realized),
      icon: Wallet,
      className: 'text-success bg-success/12',
    },
  ]

  const breakdown = agendaFilters
    .filter((f) => f.key !== 'todos')
    .map((f) => ({
      status: f.key as AgendaStatus,
      count: slots.filter((a) => a.status === f.key).length,
    }))

  return (
    <Panel>
      <PanelHeader title="Resumo do dia" />
      <div className="grid grid-cols-2 gap-3 px-5 pb-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-background/40 p-3.5"
            >
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-lg',
                  s.className,
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">
                {s.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="border-t border-border px-5 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Por status
        </p>
        <ul className="space-y-2">
          {breakdown.map((b) => (
            <li
              key={b.status}
              className="flex items-center justify-between gap-3"
            >
              <AgendaStatusBadge status={b.status} />
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {b.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}