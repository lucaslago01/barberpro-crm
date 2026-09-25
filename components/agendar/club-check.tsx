"use client"

import { useState } from "react"
import { ArrowRight, Crown, MessageCircle, ShieldCheck } from "lucide-react"
import { lookupClubByPhone } from "@/lib/supabase-club"
import { InfoStrip } from "@/components/agendar/info-strip"

// Aplica a máscara (41) 99999-9999 conforme o usuário digita.
function maskWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function isWhatsappValid(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.length === 10 || digits.length === 11
}

interface ClubCheckProps {
  onResult: (result: { isClub: boolean; plan: string | null; phone: string }) => void
}

export function ClubCheck({ onResult }: ClubCheckProps) {
  const [asked, setAsked] = useState(false)
  const [phone, setPhone] = useState("")
  const [checking, setChecking] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function handleCheck() {
    if (!isWhatsappValid(phone)) return
    setChecking(true)
    setNotFound(false)
    try {
      const result = await lookupClubByPhone(phone)
      if (result.found && result.status === "em_dia") {
        onResult({ isClub: true, plan: result.plan, phone })
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setChecking(false)
    }
  }

  function continueAsWalkIn() {
    onResult({ isClub: false, plan: null, phone })
  }

  if (!asked) {
    return (
      <section className="mx-auto w-full max-w-xl px-4 pb-10 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
            <Crown className="size-7" />
          </div>
          <h2 className="text-center text-xl font-bold text-white sm:text-2xl">
            Você é assinante do clube?
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Assinantes agendam o corte do plano sem custo adicional.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setAsked(true)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full ag-btn-gold text-sm font-semibold transition-all hover:brightness-110 active:translate-y-px"
            >
              <Crown className="size-4" />
              Sim, sou assinante
            </button>
            <button
              type="button"
              onClick={continueAsWalkIn}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/10"
            >
              Não, quero avulso
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70">
          <InfoStrip bordered={false} />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4 pb-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
          <MessageCircle className="size-7" />
        </div>
        <h2 className="text-center text-xl font-bold text-white sm:text-2xl">
          Informe seu WhatsApp
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Vamos conferir sua assinatura pelo número cadastrado.
        </p>

        <div className="mt-6">
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(maskWhatsapp(e.target.value))
              setNotFound(false)
            }}
            placeholder="(41) 99999-9999"
            autoComplete="tel"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-center text-base text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-gold/50 focus:bg-white/[0.05]"
          />
        </div>

        {notFound && (
          <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-4 text-center">
            <p className="text-sm text-gold">
              Não encontramos uma assinatura ativa para esse número.
            </p>
            <button
              type="button"
              onClick={continueAsWalkIn}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              Continuar como avulso
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setAsked(false)}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/10"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleCheck}
            disabled={!isWhatsappValid(phone) || checking}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full ag-btn-gold text-sm font-semibold transition-all hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
          >
            {checking ? "Conferindo..." : "Conferir"}
            {!checking && <ShieldCheck className="size-4" />}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70">
        <InfoStrip bordered={false} />
      </div>
    </section>
  )
}