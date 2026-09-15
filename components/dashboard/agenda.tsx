'use client'

import { useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  CalendarClock,
  MoreVertical,
  Clock,
} from 'lucide-react'
import { appointments } from '@/lib/data'
import { Panel } from './panel'
import { UserAvatar } from './user-avatar'
import { StatusBadge } from './badges'
import { cn } from '@/lib/utils'

const tabs = [
  { key: 'todos', label: 'Todos', count: 8 },
  { key: 'agendados', label: 'Agendados', count: 2 },
  { key: 'confirmados', label: 'Confirmados', count: 4 },
  { key: 'atendimento', label: 'Em atendimento', count: 1 },
  { key: 'concluidos', label: 'Concluídos', count: 1 },
]

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function Agenda() {
  const [active, setActive] = useState('todos')

  return (
    <Panel className="flex flex-col">
      <div className="flex flex-col gap-3 px-5 pt-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="size-5 text-gold" />
          <h2 className="text-lg font-semibold tracking-tight">Agenda de hoje</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background/40 px-1 py-1 text-sm">
            <button
              aria-label="Dia anterior"
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="whitespace-nowrap px-1 text-xs font-medium text-muted-foreground">
              15 de Setembro de 2025
            </span>
            <button
              aria-label="Próximo dia"
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo agendamento</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-3 scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              active === tab.key
                ? 'border-gold/40 bg-gold/12 text-gold'
                : 'border-border bg-background/30 text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-semibold',
                active === tab.key
                  ? 'bg-gold/25 text-gold'
                  : 'bg-white/8 text-muted-foreground',
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-2.5 font-medium">Horário</th>
              <th className="py-2.5 pr-6 font-medium">Cliente</th>
              <th className="py-2.5 pr-6 font-medium">Serviço</th>
              <th className="py-2.5 pr-6 font-medium">Duração</th>
              <th className="py-2.5 pr-6 font-medium">Valor</th>
              <th className="py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => {
              if (a.available) {
                return (
                  <tr
                    key={a.id}
                    className="border-b border-border/60 border-dashed"
                  >
                    <td className="px-5 py-3 font-medium tabular-nums text-muted-foreground">
                      {a.time}
                    </td>
                    <td colSpan={5} className="py-3">
                      <span className="inline-flex items-center gap-2 text-sm italic text-muted-foreground">
                        <Clock className="size-4" />
                        Horário disponível
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="inline-flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/20">
                        <Plus className="size-3.5" />
                        Agendar
                      </button>
                    </td>
                  </tr>
                )
              }
              return (
                <tr
                  key={a.id}
                  className="border-b border-border/60 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium tabular-nums">{a.time}</td>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={a.client} size="sm" />
                      <span className="whitespace-nowrap font-medium">
                        {a.client}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-6 text-muted-foreground">
                    {a.service}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-6 text-muted-foreground">
                    {a.duration}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-6 font-medium tabular-nums">
                    {currency.format(a.price)}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5 text-muted-foreground">
                      <button
                        aria-label="Editar agendamento"
                        className="grid size-7 place-items-center rounded-md hover:bg-white/5 hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        aria-label="Reagendar"
                        className="grid size-7 place-items-center rounded-md hover:bg-white/5 hover:text-foreground"
                      >
                        <CalendarClock className="size-4" />
                      </button>
                      <button
                        aria-label="Mais ações"
                        className="grid size-7 place-items-center rounded-md hover:bg-white/5 hover:text-foreground"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
