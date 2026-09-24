"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Scissors,
  Wallet,
} from "lucide-react"
import type { AgendarService } from "@/lib/agendar/services"
import { formatPreco } from "@/lib/agendar/services"
import { formatFullDate } from "@/lib/agendar/date-utils"
import { getBookedTimes } from "@/lib/supabase-appointments"
import { getDaySlots } from "@/lib/business-hours"
import { InfoStrip } from "@/components/agendar/info-strip"

interface TimeSelectionProps {
  service: AgendarService
  addonService?: AgendarService | null
  selectedDate: Date | null
  selectedTime: string | null
  onSelectTime: (time: string) => void
  onBack: () => void
  onChangeService: () => void
  onContinue: () => void
}

function formatWeekdayDate(date: Date | null) {
  if (!date) return "Selecione uma data"
  const label = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function TimeSelection({
  service,
  addonService,
  selectedDate,
  selectedTime,
  onSelectTime,
  onBack,
  onChangeService,
  onContinue,
}: TimeSelectionProps) {
  const [booked, setBooked] = useState<string[]>([])
  const dateKey = selectedDate ? selectedDate.getTime() : null

  // Horários do dia escolhido (vazio se a barbearia estiver fechada)
  const daySlots = selectedDate ? getDaySlots(selectedDate) : []

  // Busca no banco os horários já ocupados do dia escolhido
  useEffect(() => {
    if (dateKey === null) {
      setBooked([])
      return
    }
    let cancelled = false
    getBookedTimes(new Date(dateKey))
      .then((times) => {
        if (!cancelled) setBooked(times)
      })
      .catch((err) => {
        console.error("Erro ao buscar horários ocupados:", err)
      })
    return () => {
      cancelled = true
    }
  }, [dateKey])

  function isPast(time: string) {
    if (!selectedDate) return false
    const [h, m] = time.split(":").map(Number)
    return (
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        h,
        m,
      ).getTime() < Date.now()
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Seleção de horários */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <Clock className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">Horários disponíveis</h2>
                <p className="text-sm text-zinc-400">{formatWeekdayDate(selectedDate)}</p>
              </div>
            </div>

            {/* Grade de horários */}
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-2.5">
              {daySlots.map((time) => {
                const isUnavailable = booked.includes(time) || isPast(time)
                const isSelected = time === selectedTime && !isUnavailable

                if (isSelected) {
                  return (
                    <button
                      key={time}
                      type="button"
                      aria-pressed="true"
                      onClick={() => onSelectTime(time)}
                      className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-sm font-bold text-black shadow-[0_0_0_1px_rgba(251,191,36,0.25)] transition-all"
                    >
                      {time}
                    </button>
                  )
                }

                if (isUnavailable) {
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="flex h-12 cursor-not-allowed items-center justify-center rounded-xl border border-white/5 text-sm font-medium text-zinc-700 line-through"
                    >
                      {time}
                    </button>
                  )
                }

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => onSelectTime(time)}
                    className="flex h-12 items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/5"
                  >
                    {time}
                  </button>
                )
              })}
            </div>

            {daySlots.length === 0 && (
              <p className="mt-6 text-sm text-zinc-400">
                A barbearia não abre neste dia. Volte e escolha outra data.
              </p>
            )}

            {/* Legenda */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full border border-white/40 bg-white/10" />
                <span className="text-xs text-zinc-400">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-gradient-to-b from-amber-300 to-amber-500" />
                <span className="text-xs text-zinc-400">Selecionado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-zinc-700" />
                <span className="text-xs text-zinc-400">Indisponível</span>
              </div>
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
              onClick={onChangeService}
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
                <Clock
                  className={
                    selectedTime !== null
                      ? "mt-0.5 size-4 shrink-0 text-amber-400"
                      : "mt-0.5 size-4 shrink-0 text-zinc-500"
                  }
                />
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Horário</dt>
                  <dd
                    className={
                      selectedTime !== null
                        ? "text-sm font-medium text-white"
                        : "text-sm font-medium text-zinc-400"
                    }
                  >
                    {selectedTime ?? "Ainda não selecionado"}
                  </dd>
                </div>
              </div>
            </dl>
          </aside>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/10"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </button>

          <button
            type="button"
            onClick={onContinue}
            disabled={selectedTime === null}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 text-sm font-semibold text-black transition-all hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
          >
            Próximo passo
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Informações da barbearia */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70">
        <InfoStrip bordered={false} />
      </div>
    </section>
  )
}