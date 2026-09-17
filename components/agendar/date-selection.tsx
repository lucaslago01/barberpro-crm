"use client"

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
import { InfoStrip } from "@/components/agendar/info-strip"

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
const MONTH_LABEL = "Setembro 2026"
const DAYS_IN_MONTH = 30
// Setembro/2026 começa numa terça-feira -> 1 célula vazia no layout Seg-Dom.
const LEADING_BLANKS = 1
const TODAY = 15
// Dias passados (1-14) e domingos (20, 27) ficam indisponíveis.
const UNAVAILABLE_DAYS = new Set<number>([
  ...Array.from({ length: 14 }, (_, i) => i + 1),
  20,
  27,
])

interface DateSelectionProps {
  service: AgendarService
  selectedDate: number | null
  onSelectDate: (day: number) => void
  onBack: () => void
  onContinue: () => void
}

function formatFullDate(day: number | null) {
  if (day === null) return "Ainda não selecionada"
  return `${day} de Setembro de 2026`
}

export function DateSelection({
  service,
  selectedDate,
  onSelectDate,
  onBack,
  onContinue,
}: DateSelectionProps) {
  const cells: (number | null)[] = [
    ...Array.from({ length: LEADING_BLANKS }, () => null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ]

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Calendário */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
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
                className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <ChevronLeft className="size-4.5" />
              </button>
              <p className="text-sm font-semibold text-white sm:text-base">{MONTH_LABEL}</p>
              <button
                type="button"
                aria-label="Próximo mês"
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

                const isUnavailable = UNAVAILABLE_DAYS.has(day)
                const isSelected = day === selectedDate
                const isToday = day === TODAY

                if (isSelected) {
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed="true"
                      onClick={() => onSelectDate(day)}
                      className="relative flex h-11 items-center justify-center rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-sm font-bold text-black shadow-[0_0_0_1px_rgba(251,191,36,0.25)] transition-all sm:h-12"
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
                    onClick={() => onSelectDate(day)}
                    className={
                      isToday
                        ? "relative flex h-11 items-center justify-center rounded-xl border border-amber-400/50 text-sm font-semibold text-white transition-colors hover:bg-white/5 sm:h-12"
                        : "relative flex h-11 items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/5 sm:h-12"
                    }
                  >
                    {day}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1.5 size-1 rounded-full bg-amber-400"
                    />
                  </button>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-gradient-to-b from-amber-300 to-amber-500" />
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
                <span className="size-3 rounded-full border border-amber-400/70" />
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
              <button
                type="button"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-400/15"
              >
                <MessageCircle className="size-4" />
                Falar no WhatsApp
              </button>
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
                <Clock className="size-4 text-amber-400" />
                <span className="text-sm">{service.duracaoMin} min</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Wallet className="size-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">
                  {formatPreco(service.precoCentavos)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-amber-400/30 px-4 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-400/10"
            >
              <ArrowLeft className="size-4" />
              Alterar serviço
            </button>

            <div className="my-6 h-px bg-white/10" aria-hidden="true" />

            <h3 className="text-base font-bold text-white">Resumo do agendamento</h3>
            <dl className="mt-4 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Scissors className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Serviço</dt>
                  <dd className="text-sm font-medium text-white">{service.nome}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 size-4 shrink-0 text-amber-400" />
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
            ? "mt-4 flex flex-col gap-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 transition-all sm:flex-row sm:items-center sm:justify-between"
            : "mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={
              selectedDate !== null
                ? "flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400"
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
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 text-sm font-semibold text-black transition-all hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
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
