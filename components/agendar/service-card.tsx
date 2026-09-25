"use client"

import Image from "next/image"
import { Check, Clock, Crown } from "lucide-react"
import type { AgendarService } from "@/lib/agendar/services"
import { formatPreco } from "@/lib/agendar/services"

interface ServiceCardProps {
  service: AgendarService
  selected: boolean
  onSelect: (id: string) => void
  freeLabel?: boolean
}

// O card inteiro é a área de toque: um botão de escolha por serviço deixava a lista
// com nove chamadas iguais competindo. A ação principal fica na barra de baixo.
export function ServiceCard({ service, selected, onSelect, freeLabel }: ServiceCardProps) {
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => onSelect(service.id)}
        className={`group relative flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-all duration-200 sm:gap-5 sm:p-3.5 ${
          selected
            ? "border-gold/70 bg-gradient-to-r from-gold/[0.12] to-gold/[0.03] shadow-[0_0_0_1px_rgba(212,175,55,0.25),0_18px_40px_-24px_rgba(212,175,55,0.55)]"
            : "border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"
        }`}
      >
        <div className="relative size-[72px] shrink-0 overflow-hidden rounded-xl sm:size-20">
          <Image
            src={service.imagem || "/placeholder.svg"}
            alt=""
            fill
            sizes="80px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div aria-hidden="true" className="absolute inset-0 ring-1 ring-inset ring-white/10" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[15px] font-semibold leading-tight text-white sm:text-base">
              {service.nome}
            </h3>
            {freeLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <Crown className="size-3" />
                Clube
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-zinc-400">
            {service.descricao}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[13px]">
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <Clock className="size-3.5 text-gold/80" />
              {service.duracaoMin} min
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            {freeLabel ? (
              <span className="font-semibold text-emerald-400">Incluso no plano</span>
            ) : (
              <span className="font-semibold text-white">
                {service.priceFrom && (
                  <span className="mr-1 text-[11px] font-normal text-zinc-500">a partir de</span>
                )}
                {formatPreco(service.precoCentavos)}
              </span>
            )}
          </div>
        </div>

        {/* Indicador de escolha, no lugar do botão "Selecionar" */}
        <span
          aria-hidden="true"
          className={`grid size-6 shrink-0 place-items-center rounded-full border transition-all duration-200 ${
            selected
              ? "ag-btn-gold border-transparent"
              : "border-white/20 bg-transparent group-hover:border-white/40"
          }`}
        >
          <Check
            className={`size-3.5 transition-opacity ${selected ? "opacity-100" : "opacity-0"}`}
            strokeWidth={3}
          />
        </span>
      </button>
    </li>
  )
}
