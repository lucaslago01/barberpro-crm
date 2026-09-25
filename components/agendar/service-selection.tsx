"use client"

import { ArrowRight, Crown, ShieldCheck } from "lucide-react"
import { type AgendarService, formatPreco } from "@/lib/agendar/services"
import { ServiceCard } from "@/components/agendar/service-card"
import { InfoStrip } from "@/components/agendar/info-strip"

interface ServiceSelectionProps {
  services: AgendarService[]
  clubServices: AgendarService[]
  selectedId: string | null
  onSelect: (id: string) => void
  onContinue: () => void
}

function GroupTitle({
  children,
  hint,
  icon,
}: {
  children: React.ReactNode
  hint?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {icon}
        {children}
      </h2>
      {hint && <span className="pb-1 text-xs text-zinc-500">{hint}</span>}
    </div>
  )
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
  const isClub = Boolean(selectedService?.isClube)

  return (
    <section
      className={`mx-auto w-full max-w-5xl px-4 transition-[padding] sm:px-6 ${
        selectedService ? "pb-32" : "pb-10"
      }`}
    >
      <div role="radiogroup" aria-label="Serviços" className="space-y-9">
        <div>
          <GroupTitle hint={`${services.length} opções`}>Serviços</GroupTitle>
          <ul className="grid gap-2.5 md:grid-cols-2">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                selected={service.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </div>

        {clubServices.length > 0 && (
          <div>
            <GroupTitle icon={<Crown className="size-5 text-emerald-400" />}>
              Assinantes do clube
            </GroupTitle>
            <p className="-mt-1 mb-3 px-1 text-[13px] text-zinc-500">
              Já é do clube? Escolha a versão incluída no seu plano.
            </p>
            <ul className="grid gap-2.5 md:grid-cols-2">
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
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
        <ShieldCheck className="size-4 shrink-0 text-gold/80" />
        Confirmação pelo WhatsApp · Cancele até 2h antes do horário
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
        <InfoStrip bordered={false} />
      </div>

      {/* Barra fixa: a única chamada de ação da etapa, sempre ao alcance do polegar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out ${
          selectedService ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!selectedService}
      >
        <div className="border-t border-gold/20 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 pb-[max(env(safe-area-inset-bottom),0.875rem)] pt-3.5 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Selecionado</p>
              <p className="truncate text-sm font-semibold text-white">{selectedService?.nome}</p>
              <p className="text-xs text-zinc-400">
                {selectedService?.duracaoMin} min ·{" "}
                {isClub ? (
                  <span className="text-emerald-400">incluso no plano</span>
                ) : (
                  <span className="text-gold">
                    {selectedService?.priceFrom && "a partir de "}
                    {selectedService ? formatPreco(selectedService.precoCentavos) : ""}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onContinue}
              tabIndex={selectedService ? 0 : -1}
              className="ag-btn-gold inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-all active:translate-y-px"
            >
              Continuar
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
