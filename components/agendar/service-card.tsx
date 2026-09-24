"use client"

import Image from "next/image"
import { ArrowRight, Check, Clock, Crown } from "lucide-react"
import type { AgendarService } from "@/lib/agendar/services"
import { formatPreco } from "@/lib/agendar/services"

interface ServiceCardProps {
  service: AgendarService
  selected: boolean
  onSelect: (id: string) => void
  freeLabel?: boolean
}

export function ServiceCard({ service, selected, onSelect, freeLabel }: ServiceCardProps) {
  return (
    <li>
      <div
        className={
          selected
            ? "flex flex-col gap-4 rounded-2xl border border-amber-400/60 bg-amber-400/[0.06] p-3 shadow-[0_0_0_1px_rgba(251,191,36,0.15)] transition-colors sm:flex-row sm:items-center sm:gap-5 sm:p-4"
            : freeLabel
              ? "flex flex-col gap-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/[0.05] p-3 transition-colors hover:border-emerald-400/60 sm:flex-row sm:items-center sm:gap-5 sm:p-4"
              : "flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:gap-5 sm:p-4"
        }
      >
        <div className="flex items-center gap-4 sm:flex-1">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:size-14">
            <Image
              src={service.imagem || "/placeholder.svg"}
              alt={service.nome}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[15px] font-semibold text-white">{service.nome}</h3>
              {freeLabel && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <Crown className="size-3" />
                  Clube
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">{service.descricao}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="size-3.5 text-amber-400" />
            <span className="text-[13px] font-medium whitespace-nowrap">{service.duracaoMin} min</span>
          </div>

          <div className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden="true" />

          {freeLabel ? (
            <p className="text-[15px] font-bold whitespace-nowrap text-emerald-400">Grátis</p>
          ) : (
            <div className="text-right">
              {service.priceFrom && (
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">A partir de</p>
              )}
              <p className="text-[15px] font-bold whitespace-nowrap text-white">
                {formatPreco(service.precoCentavos)}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelect(service.id)}
            aria-pressed={selected}
            className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-4 text-sm font-semibold text-black shadow-sm transition-all hover:brightness-110 hover:shadow-md active:translate-y-px sm:h-9"
          >
            {selected ? (
              <>
                Selecionado
                <Check className="size-4" />
              </>
            ) : (
              <>
                Selecionar
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </li>
  )
}