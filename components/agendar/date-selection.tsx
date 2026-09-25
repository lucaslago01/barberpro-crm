"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Scissors,
  Wallet,
} from "lucide-react"
import type { AgendarService } from "@/lib/agendar/services"
import { formatPreco } from "@/lib/agendar/services"
import { formatFullDate, isSameDay, startOfToday } from "@/lib/agendar/date-utils"
import { isOpenDay } from "@/lib/business-hours"
import { getBlockedRanges, isDayFullyBlocked, toDayString } from "@/lib/supabase-blocks"
import { buildWhatsappUrl } from "@/components/dashboard/whatsapp-button"
import { getCachedSettings, getSettings } from "@/lib/supabase-settings"
import { InfoStrip } from "@/components/agendar/info-strip"

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

interface DateSelectionProps {
  service: AgendarService
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  onBack: () => void
  onContinue: () => void
}

export function DateSelection({
  service,
  selectedDate,
  onSelectDate,
  onBack,
  onContinue,
}: DateSelectionProps) {
  const today = startOfToday()

  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)

  useEffect(() => {
    const cached = getCachedSettings()
    if (cached?.phone) {
      setWhatsappUrl(buildWhatsappUrl(cached.phone))
    }

    getSettings()
      .then((s) => {
        if (s.phone) {
          setWhatsappUrl(buildWhatsappUrl(s.phone))
        }
      })
      .catch(() => {})
  }, [])

  const [viewDate, setViewDate] = useState(() => {
    const base = selectedDate ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthLabelRaw = viewDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1)

  // Layout Seg-Dom: getDay() devolve 0 = domingo, então deslocamos
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month

  // Dias do mês visível que estão bloqueados por inteiro (férias, feriado...)
  const [blockedByDay, setBlockedByDay] = useState<
    Map<string, { start_time: string; end_time: string }[]>
  >(new Map())

  useEffect(() => {
    let cancelled = false
    getBlockedRanges(new Date(year, month, 1), new Date(year, month + 1, 0)).then((map) => {
      if (!cancelled) setBlockedByDay(map)
    })
    return () => {
      cancelled = true
    }
  }, [year, month])

  function changeMonth(amount: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Calendário */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">Calendário</h2>
                <p className="text-sm text-zinc-400">Datas disponíveis para agendamento.</p>
              </div>
            </div>

            {/* Navegação de mês */}
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                aria-label="Mês anterior"
                disabled={isCurrentMonth}
                onClick={() => changeMonth(-1)}
                className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-zinc-400"
              >
                <ChevronLeft className="size-4.5" />
              </button>
              <p className="text-sm font-semibold text-white sm:text-base">{monthLabel}</p>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() => changeMonth(1)}
                className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <ChevronRight className="size-4.5" />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="mt-5 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grade de dias */}
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((day, index) => {
                if (day === null) {
                  return <div key={`blank-${index}`} aria-hidden="true" />
                }

                const dayDate = new Date(year, month, day)
                const isPastDay = dayDate.getTime() < today.getTime()
                const isClosed =
                  !isOpenDay(dayDate) ||
                  isDayFullyBlocked(dayDate, blockedByDay.get(toDayString(dayDate)) ?? [])
                const isUnavailable = isPastDay || isClosed
                const isSelected = selectedDate !== null && isSameDay(dayDate, selectedDate)
                const isToday = isSameDay(dayDate, today)

                if (isSelected && !isUnavailable) {
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed="true"
                      onClick={() => onSelectDate(dayDate)}
                      className="relative flex h-11 items-center justify-center rounded-xl ag-btn-gold text-sm font-bold shadow-[0_0_0_1px_rgba(212,175,55,0.25)] transition-all sm:h-12"
                    >
                      {day}
                    </button>
                  )
                }

                if (isUnavailable) {
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="flex h-11 cursor-not-allowed items-center justify-center rounded-xl text-sm font-medium text-zinc-700 sm:h-12"
                    >
                      {day}
                    </button>
                  )
                }

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onSelectDate(dayDate)}
                    className={
                      isToday
                        ? "relative flex h-11 items-center justify-center rounded-xl border border-gold/50 text-sm font-semibold text-white transition-colors hover:bg-white/5 sm:h-12"
                        : "relative flex h-11 items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/5 sm:h-12"
                    }
                  >
                    {day}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1.5 size-1 rounded-full bg-gold"
                    />
                  </button>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-gold" />
                <span className="text-xs text-zinc-400">Data selecionada</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full border border-white/40 bg-white/10" />
                <span className="text-xs text-zinc-400">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-zinc-700" />
                <span className="text-xs text-zinc-400">Indisponível</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full border border-gold/70" />
                <span className="text-xs text-zinc-400">Hoje</span>
              </div>
            </div>

            {/* Ajuda / WhatsApp */}
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Não encontrou sua data?</p>
                <p className="text-[13px] text-zinc-400">
                  Entre em contato pelo WhatsApp e vamos te ajudar!
                </p>
              </div>
              <a
                href={whatsappUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/15"
              >
                <MessageCircle className="size-4" />
                Falar no WhatsApp
              </a>
            </div>
          </div>

          {/* Serviço selecionado + resumo */}
          <aside className="border-t border-white/10 bg-white/[0.015] p-5 sm:p-6 lg:border-l lg:border-t-0">
            <h2 className="text-base font-bold text-white">Serviço selecionado</h2>

            <div className="mt-4 flex items-start gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
                <Image
                  src={service.imagem || "/placeholder.svg"}
                  alt={service.nome}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-white">{service.nome}</h3>
                <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">{service.descricao}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="size-4 text-gold" />
                <span className="text-sm">{service.duracaoMin} min</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Wallet className="size-4 text-gold" />
                <span className="text-sm font-semibold text-white">
                  {formatPreco(service.precoCentavos)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-gold/30 px-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
            >
              <ArrowLeft className="size-4" />
              Alterar serviço
            </button>

            <div className="my-6 h-px bg-white/10" aria-hidden="true" />

            <h3 className="text-base font-bold text-white">Resumo do agendamento</h3>
            <dl className="mt-4 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Scissors className="mt-0.5 size-4 shrink-0 text-gold" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Serviço</dt>
                  <dd className="text-sm font-medium text-white">{service.nome}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 size-4 shrink-0 text-gold" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Data</dt>
                  <dd className="text-sm font-medium text-white">{formatFullDate(selectedDate)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Horário</dt>
                  <dd className="text-sm font-medium text-zinc-400">Ainda não selecionado</dd>
                </div>
              </div>
            </dl>
          </aside>
        </div>
      </div>

      {/* Barra de próximo passo */}
      <div
        className={
          selectedDate !== null
            ? "mt-4 flex flex-col gap-4 rounded-2xl border border-gold/30 bg-gold/10 p-4 transition-all sm:flex-row sm:items-center sm:justify-between"
            : "mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={
              selectedDate !== null
                ? "flex size-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold"
                : "flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-500"
            }
          >
            <Calendar className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">
              {selectedDate !== null ? "Data selecionada" : "Selecione uma data"}
            </p>
            <p className="text-sm font-semibold text-white">
              {selectedDate !== null ? formatFullDate(selectedDate) : "Escolha um dia no calendário"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={selectedDate === null}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full ag-btn-gold px-6 text-sm font-semibold transition-all hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
        >
          Próximo passo
          <ArrowRight className="size-4" />
        </button>
      </div>

      {/* Informações da barbearia */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70">
        <InfoStrip bordered={false} />
      </div>
    </section>
  )
}