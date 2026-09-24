"use client"

import { Scissors, ShieldCheck, ArrowRight } from "lucide-react"
import { type AgendarService } from "@/lib/agendar/services"
import { ServiceCard } from "@/components/agendar/service-card"
import { InfoStrip } from "@/components/agendar/info-strip"

interface ServiceSelectionProps {
  services: AgendarService[]
  clubServices: AgendarService[]
  selectedId: string | null
  onSelect: (id: string) => void
  onContinue: () => void
}

export function ServiceSelection({
  services,
  clubServices,
  selectedId,
  onSelect,
  onContinue,
}: ServiceSelectionProps) {
  const allServices = [...services, ...clubServices]
  const selectedService = allServices.find((s) => s.id === selectedId)

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
              <Scissors className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">Nossos serviços</h2>
              <p className="text-sm text-zinc-400">Qualidade, estilo e o melhor atendimento para você.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-2 sm:self-center">
            <ShieldCheck className="size-4 shrink-0 text-amber-400" />
            <div className="leading-tight">
              <p className="text-[11px] font-semibold tracking-wide text-amber-400">BARBEARIA DE CONFIANÇA</p>
              <p className="text-[11px] text-zinc-500">Mais de 500 clientes satisfeitos</p>
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-3 p-4 sm:gap-3 sm:p-5">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={service.id === selectedId}
              onSelect={onSelect}
            />
          ))}
          {clubServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={service.id === selectedId}
              onSelect={onSelect}
              freeLabel
            />
          ))}
        </ul>

        <InfoStrip />
      </div>

      <div
        className={
          selectedService
            ? "mt-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 opacity-100 transition-all"
            : "pointer-events-none mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 opacity-0 transition-all"
        }
        aria-hidden={!selectedService}
      >
        <p className="text-sm text-white">
          <span className="text-zinc-400">Serviço selecionado: </span>
          <span className="font-semibold text-amber-300">{selectedService?.nome}</span>
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 text-sm font-semibold text-black transition-all hover:brightness-110 active:translate-y-px"
        >
          Continuar
          <ArrowRight className="size-4" />
        </button>
      </div>
    </section>
  )
}