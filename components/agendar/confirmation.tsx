"use client"

import { useState } from "react"
import { ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, Scissors, User, Wallet } from "lucide-react"
import type { AgendarService } from "@/lib/agendar/services"
import { formatPreco } from "@/lib/agendar/services"
import type { AgendarFormData } from "@/components/agendar/data-form"
import { createPublicAppointment } from "@/lib/supabase-data"

interface ConfirmationProps {
  service: AgendarService
  selectedDate: number | null
  selectedTime: string | null
  data: AgendarFormData
  onBack: () => void
}

function formatFullDate(day: number | null) {
  if (day === null) return "Data não selecionada"
  return `${day} de Setembro de 2026`
}

export function Confirmation({ service, selectedDate, selectedTime, data, onBack }: ConfirmationProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) {
      setError("Data ou horário inválidos")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const [hours, minutes] = selectedTime.split(":").map(Number)
      const dateTime = new Date(2026, 8, selectedDate, hours, minutes)

      await createPublicAppointment({
        clientName: data.nome,
        clientPhone: data.whatsapp,
        clientEmail: data.email || undefined,
        serviceName: service.nome.replace(" Masculino", ""),
        dateTime: dateTime.toISOString(),
        notes: data.observacoes || undefined,
      })

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar agendamento")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <section className="mx-auto w-full max-w-xl px-4 pb-16 text-center">
        <div className="rounded-3xl border border-amber-400/30 bg-zinc-950/70 p-8 shadow-2xl shadow-black/40">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
            <CheckCircle2 className="size-9" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-white">Agendamento confirmado!</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Seu horário para <span className="text-amber-400">{service.nome}</span> foi reservado com sucesso.
            Entraremos em contato pelo WhatsApp se precisar de algo.
          </p>
          <div className="mt-6 space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left">
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500">Data:</span> {formatFullDate(selectedDate)}
            </p>
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500">Horário:</span> {selectedTime}
            </p>
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500">Nome:</span> {data.nome}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40">
        <div className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white sm:text-xl">Resumo do agendamento</h2>
          <p className="text-sm text-zinc-400">Confira os detalhes antes de confirmar.</p>

          <dl className="mt-6 space-y-4">
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
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Horário</dt>
                <dd className="text-sm font-medium text-white">{selectedTime ?? "Não selecionado"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Cliente</dt>
                <dd className="text-sm font-medium text-white">{data.nome}</dd>
                <dd className="text-sm text-zinc-400">{data.whatsapp}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Valor</dt>
                <dd className="text-sm font-semibold text-white">{formatPreco(service.precoCentavos)}</dd>
              </div>
            </div>
          </dl>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-4 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                "Confirmar agendamento"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}