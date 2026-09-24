"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Cake,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Scissors,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react"
import type { AgendarService } from "@/lib/agendar/services"
import { formatPreco } from "@/lib/agendar/services"
import { formatFullDate } from "@/lib/agendar/date-utils"
import { InfoStrip } from "@/components/agendar/info-strip"
import { lookupClientByPhone } from "@/lib/supabase-data"

export interface AgendarFormData {
  nome: string
  whatsapp: string
  email: string
  observacoes: string
  lembrete: boolean
  birthDate: string
}

interface DataFormProps {
  service: AgendarService
  selectedDate: Date | null
  selectedTime: string | null
  data: AgendarFormData
  onChange: (patch: Partial<AgendarFormData>) => void
  onBack: () => void
  onChangeService: () => void
  onContinue: () => void
}

const MAX_OBS = 300

// Aplica a máscara (41) 99999-9999 conforme o usuário digita.
function maskWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// WhatsApp válido: DDD + 8 ou 9 dígitos (10 ou 11 no total).
function isWhatsappValid(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.length === 10 || digits.length === 11
}

function isEmailValid(value: string) {
  if (value.trim() === "") return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function DataForm({
  service,
  selectedDate,
  selectedTime,
  data,
  onChange,
  onBack,
  onChangeService,
  onContinue,
}: DataFormProps) {
  const [autoFilled, setAutoFilled] = useState(false)
  const lookedUpFor = useRef<string | null>(null)

  const nomeOk = data.nome.trim().length >= 2
  const whatsappOk = isWhatsappValid(data.whatsapp)
  const emailOk = isEmailValid(data.email)
  const birthDateOk = data.birthDate.trim() !== ""
  const canContinue = selectedDate !== null && nomeOk && whatsappOk && emailOk && birthDateOk

  const whatsappError = data.whatsapp.length > 0 && !whatsappOk
  const emailError = data.email.length > 0 && !emailOk

  // Assim que o WhatsApp ficar válido, busca se já é um cliente conhecido e preenche os dados.
  useEffect(() => {
    if (!whatsappOk) return
    if (lookedUpFor.current === data.whatsapp) return
    lookedUpFor.current = data.whatsapp

    lookupClientByPhone(data.whatsapp)
      .then((result) => {
        if (!result) return
        setAutoFilled(true)
        onChange({
          nome: result.name || data.nome,
          email: result.email || data.email,
          birthDate: result.birthDate || data.birthDate,
        })
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whatsappOk, data.whatsapp])

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Formulário do cliente */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <User className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">Informações pessoais</h2>
                <p className="text-sm text-zinc-400">Seus dados serão usados apenas para o agendamento.</p>
              </div>
            </div>

            {/* WhatsApp primeiro, para poder autopreencher o resto */}
            <div className="mt-6">
              <label htmlFor="whatsapp" className="text-sm font-medium text-white">
                WhatsApp <span className="text-amber-400">*</span>
              </label>
              <div className="relative mt-2">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="whatsapp"
                  type="tel"
                  inputMode="tel"
                  value={data.whatsapp}
                  onChange={(e) => {
                    setAutoFilled(false)
                    onChange({ whatsapp: maskWhatsapp(e.target.value) })
                  }}
                  placeholder="(41) 99999-9999"
                  autoComplete="tel"
                  aria-invalid={whatsappError}
                  className={`h-12 w-full rounded-xl border bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:bg-white/[0.05] ${
                    whatsappError
                      ? "border-red-500/60 focus:border-red-500/60"
                      : "border-white/10 focus:border-amber-400/50"
                  }`}
                />
              </div>
              {whatsappError && (
                <p className="mt-1.5 text-xs text-red-400">Informe um WhatsApp válido com DDD.</p>
              )}
              {autoFilled && (
                <p className="mt-1.5 text-xs text-emerald-400">
                  Encontramos seu cadastro e preenchemos seus dados automaticamente.
                </p>
              )}
            </div>

            {/* Nome completo */}
            <div className="mt-4">
              <label htmlFor="nome" className="text-sm font-medium text-white">
                Nome completo <span className="text-amber-400">*</span>
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="nome"
                  type="text"
                  value={data.nome}
                  onChange={(e) => onChange({ nome: e.target.value })}
                  placeholder="Digite seu nome completo"
                  autoComplete="name"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-amber-400/50 focus:bg-white/[0.05]"
                />
              </div>
            </div>

            {/* E-mail + Aniversário */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-white">
                  E-mail <span className="text-zinc-500">(opcional)</span>
                </label>
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    aria-invalid={emailError}
                    className={`h-12 w-full rounded-xl border bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:bg-white/[0.05] ${
                      emailError
                        ? "border-red-500/60 focus:border-red-500/60"
                        : "border-white/10 focus:border-amber-400/50"
                    }`}
                  />
                </div>
                {emailError && <p className="mt-1.5 text-xs text-red-400">Informe um e-mail válido.</p>}
              </div>

              <div>
                <label htmlFor="birthDate" className="text-sm font-medium text-white">
                  Aniversário <span className="text-amber-400">*</span>
                </label>
                <div className="relative mt-2">
                  <Cake className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="birthDate"
                    type="date"
                    value={data.birthDate}
                    onChange={(e) => onChange({ birthDate: e.target.value })}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-amber-400/50 focus:bg-white/[0.05]"
                  />
                </div>
              </div>
            </div>

            <div className="my-6 h-px bg-white/10" aria-hidden="true" />

            {/* Informações adicionais */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">Informações adicionais</h2>
                <p className="text-sm text-zinc-400">Conte pra gente se há algo importante para o seu atendimento.</p>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="observacoes" className="text-sm font-medium text-white">
                Observações <span className="text-zinc-500">(opcional)</span>
              </label>
              <textarea
                id="observacoes"
                value={data.observacoes}
                onChange={(e) => onChange({ observacoes: e.target.value.slice(0, MAX_OBS) })}
                placeholder="Ex.: tipo de corte, preferência, alergias, etc."
                rows={4}
                maxLength={MAX_OBS}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-amber-400/50 focus:bg-white/[0.05]"
              />
              <div className="mt-1 text-right text-xs text-zinc-500">
                {data.observacoes.length}/{MAX_OBS}
              </div>
            </div>

            {/* Lembrete */}
            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                  <Bell className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Lembrete do agendamento</h3>
                  <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">
                    Vamos te enviar um lembrete pelo WhatsApp no dia do seu atendimento.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={data.lembrete}
                aria-label="Ativar lembrete do agendamento"
                onClick={() => onChange({ lembrete: !data.lembrete })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  data.lembrete ? "bg-gradient-to-b from-amber-300 to-amber-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                    data.lembrete ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
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
                  {service.isClube ? "Grátis (Clube)" : formatPreco(service.precoCentavos)}
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
                <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Horário</dt>
                  <dd className="text-sm font-medium text-white">{selectedTime ?? "Ainda não selecionado"}</dd>
                </div>
              </div>
            </dl>

            <div className="my-6 h-px bg-white/10" aria-hidden="true" />

            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Ambiente seguro</h3>
                <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">
                  Seus dados estão protegidos e serão usados apenas para este agendamento.
                </p>
              </div>
            </div>
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
            disabled={!canContinue}
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