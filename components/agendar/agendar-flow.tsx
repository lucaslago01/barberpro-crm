"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CalendarDays, Clock, User, CheckCircle2, Scissors } from "lucide-react"
import { services, clubServices, getServicesFromDB, formatPreco, type AgendarService } from "@/lib/agendar/services"
import { StepIndicator } from "@/components/agendar/step-indicator"
import { ServiceSelection } from "@/components/agendar/service-selection"
import { DateSelection } from "@/components/agendar/date-selection"
import { TimeSelection } from "@/components/agendar/time-selection"
import { DataForm, type AgendarFormData } from "@/components/agendar/data-form"
import { Confirmation } from "@/components/agendar/confirmation"
import { BrandHero } from "@/components/agendar/brand-hero"


function AddonSelection({
  dbServices,
  selectedService,
  addonService,
  onSelect,
  onBack,
  onContinue,
}: {
  dbServices: AgendarService[]
  selectedService: AgendarService
  addonService: AgendarService | null
  onSelect: (s: AgendarService | null) => void
  onBack: () => void
  onContinue: () => void
}) {
  const sobrancelhaOptions = dbServices.filter((s) =>
    s.nome.toLowerCase().includes('sobrancelha')
  )

  if (sobrancelhaOptions.length === 0) {
    onContinue()
    return null
  }

  const isClub = Boolean(selectedService.isClube)

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40">
        <div className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white sm:text-xl">Deseja adicionar sobrancelha?</h2>
          <p className="text-sm text-zinc-400">Aproveite seu atendimento e cuide também das sobrancelhas.</p>

          <div className="mt-4 space-y-3">
            {sobrancelhaOptions.map((s) => {
              const selected = addonService?.id === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(selected ? null : s)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-gold/60 bg-gold/[0.06]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{s.nome}</p>
                    <p className="text-xs text-zinc-400">{s.duracaoMin} min</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gold">
                      {isClub ? formatPreco(s.precoCentavos) : formatPreco(s.precoCentavos)}
                    </p>
                    <p className="text-[10px] text-zinc-500">sempre avulso</p>
                  </div>
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => { onSelect(null); onContinue() }}
              className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Não, obrigado
            </button>
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/10 p-4 sm:p-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5"
          >
            Voltar
          </button>
          {addonService && (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full ag-btn-gold px-4 text-sm font-semibold transition-all hover:brightness-110"
            >
              Continuar
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export function AgendarFlow() {
  const [dbServices, setDbServices] = useState<AgendarService[]>(services)
  const [dbClubServices] = useState<AgendarService[]>(clubServices)
  const [step, setStep] = useState(1)

  useEffect(() => {
    getServicesFromDB().then(({ services: s }) => {
      if (s.length > 0) setDbServices(s)
    }).catch(() => {})
  }, [])

  const allServices = [...dbServices, ...dbClubServices]
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [addonService, setAddonService] = useState<AgendarService | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [formData, setFormData] = useState<AgendarFormData>({
    nome: "",
    whatsapp: "",
    email: "",
    observacoes: "",
    lembrete: true,
    birthDate: "",
  })

  // Ao trocar de etapa, volta para o topo da página
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const selectedService = allServices.find((s) => s.id === selectedServiceId) ?? allServices[0]

  function handleSelectDate(date: Date) {
    if (!selectedDate || selectedDate.getTime() !== date.getTime()) {
      setSelectedTime(null)
    }
    setSelectedDate(date)
  }

  return (
    <>
      {/* Primeira etapa abre pela marca; as seguintes vão direto ao passo */}
      {step === 1 && <BrandHero />}

      <div className="relative overflow-hidden">
        {step !== 1 && (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/agendar/hero-bg.webp')] bg-cover bg-center opacity-20"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/40 via-black to-black" />
          </>
        )}

        <div
          className={`relative flex flex-col gap-8 px-4 sm:gap-10 sm:px-6 ${
            step === 1 ? "pt-2 pb-8" : "pt-8 pb-10 sm:pt-10 sm:pb-12"
          }`}
        >
          <StepIndicator currentStep={step} />

          {step === 1 && (
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-serif text-[30px] font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                Escolha o <span className="ag-gold-text italic">serviço</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-400">Toque no serviço e depois em continuar.</p>
            </div>
          )}

          {step === 2 && (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-gold shadow-[0_0_30px_-8px_rgba(212,175,55,0.45)]">
                <Scissors className="size-6" />
              </div>
              <h1 className="font-serif text-[34px] font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Deseja adicionar <span className="ag-gold-text italic">sobrancelha</span>?
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Aproveite e adicione a sobrancelha ao seu atendimento.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-gold shadow-[0_0_30px_-8px_rgba(212,175,55,0.45)]">
                <CalendarDays className="size-6" />
              </div>
              <h1 className="font-serif text-[34px] font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Escolha a <span className="ag-gold-text italic">data</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Selecione o dia que preferir. Mostraremos os horários disponíveis para o serviço escolhido.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-gold shadow-[0_0_30px_-8px_rgba(212,175,55,0.45)]">
                <Clock className="size-6" />
              </div>
              <h1 className="font-serif text-[34px] font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Escolha o <span className="ag-gold-text italic">horário</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Selecione um horário disponível para o seu atendimento.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-gold shadow-[0_0_30px_-8px_rgba(212,175,55,0.45)]">
                <User className="size-6" />
              </div>
              <h1 className="font-serif text-[34px] font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Seus <span className="ag-gold-text italic">dados</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Preencha suas informações para finalizar o agendamento.
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-gold shadow-[0_0_30px_-8px_rgba(212,175,55,0.45)]">
                <CheckCircle2 className="size-6" />
              </div>
              <h1 className="font-serif text-[34px] font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Confirme seu <span className="ag-gold-text italic">agendamento</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Revise os dados e confirme para finalizar.
              </p>
            </div>
          )}
        </div>
      </div>

      {step === 1 && (
        <ServiceSelection
          services={dbServices}
          clubServices={dbClubServices}
          selectedId={selectedServiceId}
          onSelect={setSelectedServiceId}
          onContinue={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <AddonSelection
          dbServices={dbServices}
          selectedService={selectedService}
          addonService={addonService}
          onSelect={setAddonService}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <DateSelection
          service={selectedService}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onBack={() => setStep(2)}
          onContinue={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <TimeSelection
          service={selectedService}
          addonService={addonService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelectTime={setSelectedTime}
          onBack={() => setStep(3)}
          onChangeService={() => setStep(1)}
          onContinue={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <DataForm
          service={selectedService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          data={formData}
          onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          onBack={() => setStep(4)}
          onChangeService={() => setStep(1)}
          onContinue={() => setStep(6)}
        />
      )}

      {step === 6 && (
        <Confirmation
          service={selectedService}
          addonService={addonService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          data={formData}
          onBack={() => setStep(5)}
        />
      )}
    </>
  )
}