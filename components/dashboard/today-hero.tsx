'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Clock, Scissors, Sparkles } from 'lucide-react'
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

  const booked = (slots ?? []).filter(
    (s) => !s.available && s.status !== 'cancelado',
  )
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
    <section className="aurora relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-[oklch(0.17_0.011_300)] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_56px_-28px_rgba(0,0,0,0.8)] animate-fade-in-up">
      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_22rem] lg:items-center lg:gap-8">
        {/* Número do dia */}
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold ring-1 ring-gold/20">
            <CalendarDays className="size-3" />
            Previsto para hoje
          </p>

          <p className="mt-3 text-[44px] font-bold leading-none tracking-tight tabular-nums sm:text-5xl">
            {loading ? (
              <span className="relative inline-block h-11 w-40 overflow-hidden rounded-lg bg-white/5 align-middle">
                <span className="absolute inset-0 animate-shimmer" />
              </span>
            ) : (
              <span className="gradient-text-gold">
                {currency.format(expected)}
              </span>
            )}
          </p>

          <p className="mt-3 text-sm text-muted-foreground">
            {loading
              ? 'Carregando o dia...'
              : booked.length === 0
                ? 'Nenhum agendamento para hoje.'
                : `${done.length} de ${booked.length} ${
                    booked.length === 1
                      ? 'atendimento concluído'
                      : 'atendimentos concluídos'
                  }`}
          </p>

          {!loading && booked.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="relative h-2 flex-1 max-w-sm overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.03]">
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-[oklch(0.56_0.21_302)] via-gold to-[oklch(0.75_0.18_310)] transition-[width] duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <span className="absolute inset-0 animate-shimmer rounded-full opacity-50" />
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-gold">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>

        {/* Próximo atendimento */}
        <div className="lg:border-l lg:border-border lg:pl-8">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3 text-gold" />
            Próximo atendimento
          </p>

          {loading ? (
            <div className="relative h-[72px] overflow-hidden rounded-xl border border-border bg-background/40">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          ) : next ? (
            <a
              href="/agenda"
              className="group flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3.5 py-3 transition-all duration-300 hover:border-gold/40 hover:bg-background/60 hover:shadow-[0_12px_28px_-16px_oklch(0.62_0.19_305/50%)]"
            >
              <span className="relative grid w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-gold/25 to-gold/5 py-2 ring-1 ring-gold/25">
                <span className="absolute inset-0 rounded-lg animate-pulse-glow" />
                <span className="relative text-sm font-bold tabular-nums text-gold">
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
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-gold" />
            </a>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border px-3.5 py-4 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" />
              {booked.length > 0
                ? 'Todos os horários já passaram.'
                : 'Agenda livre hoje.'}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
