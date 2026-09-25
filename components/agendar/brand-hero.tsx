"use client"

import { useEffect, useState } from "react"
import { Clock, MapPin } from "lucide-react"
import { getCachedSettings, getSettings } from "@/lib/supabase-settings"
import { getOpenStatus, getScheduleLabel, type OpenStatus } from "@/lib/business-hours"

function formatHour(h: number) {
  return `${h}h`
}

function statusLabel(s: OpenStatus) {
  if (s.open) return `Aberto agora · até ${formatHour(s.closesAt)}`
  if (!s.opensDay) return "Fechado"
  if (s.today) return `Fechado · abre hoje às ${formatHour(s.opensAt)}`
  return `Fechado · abre ${s.opensDay} às ${formatHour(s.opensAt)}`
}

/** Abertura da página pública: a marca antes do formulário. */
export function BrandHero() {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<OpenStatus | null>(null)

  useEffect(() => {
    const cached = getCachedSettings()
    if (cached) {
      setName(cached.barbershopName)
      setAddress(cached.address || "")
      setDescription(cached.description || "")
      setReady(true)
    }
    getSettings()
      .then((s) => {
        setName(s.barbershopName)
        setAddress(s.address || "")
        setDescription(s.description || "")
      })
      .catch(() => setName((n) => n || "BarberPro"))
      .finally(() => setReady(true))

    // Calculado no navegador, para usar o relógio de quem está vendo
    const update = () => setStatus(getOpenStatus(new Date()))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative isolate overflow-hidden">
      {/* Foto do ambiente com vinheta: some nas bordas e embaixo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[url('/agendar/hero-bg.webp')] bg-cover bg-center opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/60 to-black"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(0,0,0,0.55)_70%)]"
      />
      {/* Brilho dourado discreto atrás do nome */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-24 -z-10 h-56 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />

      <div
        className={`mx-auto flex max-w-3xl flex-col items-center px-5 pb-12 pt-14 text-center transition-opacity duration-500 sm:pb-16 sm:pt-20 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        {status && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-md">
            <span className="relative flex size-2">
              {status.open && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex size-2 rounded-full ${
                  status.open ? "bg-emerald-400" : "bg-zinc-500"
                }`}
              />
            </span>
            {statusLabel(status)}
          </span>
        )}

        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.35em] text-gold/90">
          Barbearia · Curitiba
        </p>

        <h1 className="mt-3 font-serif text-[44px] font-semibold leading-[1.05] tracking-tight text-white sm:text-7xl">
          {name}
        </h1>

        {/* Filete dourado: separa a marca do texto sem pesar */}
        <div aria-hidden="true" className="mt-6 flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/70" />
          <span className="size-1 rotate-45 bg-gold" />
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/70" />
        </div>

        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-300 sm:text-base">
          {description.trim() ||
            "Mais que um corte, uma experiência. Escolha o serviço e garanta seu horário em poucos toques."}
        </p>

        <div className="mt-7 flex flex-col items-center gap-2.5 text-[13px] text-zinc-400 sm:flex-row sm:gap-6">
          {address && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-gold" />
              {address}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-gold" />
            {getScheduleLabel()}
          </span>
        </div>
      </div>
    </section>
  )
}
