'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Clock, Scissors } from 'lucide-react'
import { getAgendaSlotsByDate } from '@/lib/supabase-data'
import { onDataChanged } from '@/lib/refresh-bus'
import type { AgendaSlot } from '@/lib/types'
import { UserAvatar } from './user-avatar'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function TodayHero() {
  const [slots, setSlots] = useState<AgendaSlot[] | null>(null)
  const [now, setNow] = useState(() => new Date())

  const load = useCallback(() => {
    getAgendaSlotsByDate(new Date())
      .then(setSlots)
      .catch(() => setSlots([]))
  }, [])

  useEffect(() => {
    load()
    const off = onDataChanged(load)
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => {
      off()
      clearInterval(timer)
    }
  }, [load])

  const booked = (slots ?? []).filter((s) => !s.available && s.status !== 'cancelado')
  const done = booked.filter((s) => s.status === 'concluido')
  const expected = booked
    .filter((s) => s.status !== 'faltou')
    .reduce((sum, s) => sum + s.price, 0)

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const next = booked
    .filter((s) => s.status !== 'concluido' && s.status !== 'faltou')
    .filter((s) => toMinutes(s.time) >= nowMinutes)
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))[0]

  const progress = booked.length > 0 ? (done.length / booked.length) * 100 : 0
  const loading = slots === null

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* brilho dourado discreto no canto */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_20rem] lg:items-center lg:gap-8">
        {/* Número do dia */}
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="size-3.5 text-gold" />
            Previsto para hoje
          </p>

          <p className="mt-2 text-[44px] font-bold leading-none tracking-tight tabular-nums sm:text-5xl">
            {loading ? (
              <span className="inline-block h-11 w-40 animate-pulse rounded-lg bg-white/5 align-middle" />
            ) : (
              currency.format(expected)
            )}
          </p>

          <p className="mt-2.5 text-sm text-muted-foreground">
            {loading
              ? 'Carregando o dia...'
              : booked.length === 0
                ? 'Nenhum agendamento para hoje.'
                : `${done.length} de ${booked.length} ${booked.length === 1 ? 'atendimento concluído' : 'atendimentos concluídos'}`}
          </p>

          {!loading && booked.length > 0 && (
            <div className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Próximo atendimento */}
        <div className="lg:border-l lg:border-border lg:pl-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Próximo atendimento
          </p>

          {loading ? (
            <div className="h-[72px] animate-pulse rounded-xl border border-border bg-background/40" />
          ) : next ? (
            <a
              href="/agenda"
              className="group flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3.5 py-3 transition-colors hover:border-gold/30"
            >
              <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-gold/12 py-1.5">
                <span className="text-sm font-bold tabular-nums text-gold">
                  {next.time}
                </span>
              </span>
              <UserAvatar name={next.client} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{next.client}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <Scissors className="mr-1 inline size-3" />
                  {next.service}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
            </a>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border px-3.5 py-4 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" />
              {booked.length > 0 ? 'Todos os horários já passaram.' : 'Agenda livre hoje.'}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
