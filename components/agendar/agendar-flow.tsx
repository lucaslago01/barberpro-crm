"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { services } from "@/lib/agendar/services"
import { StepIndicator } from "@/components/agendar/step-indicator"
import { ServiceSelection } from "@/components/agendar/service-selection"
import { DateSelection } from "@/components/agendar/date-selection"

export function AgendarFlow() {
  const [step, setStep] = useState(1)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<number | null>(18)

  const selectedService = services.find((s) => s.id === selectedServiceId) ?? services[0]

  return (
    <>
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[url('/agendar/hero-bg.png')] bg-cover bg-center opacity-25"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/40 via-black to-black" />

        <div className="relative flex flex-col gap-8 px-4 pt-8 pb-10 sm:gap-10 sm:px-6 sm:pt-10 sm:pb-12">
          <StepIndicator currentStep={step} />

          {step === 1 ? (
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Agende seu <span className="text-amber-400">horário</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Escolha o serviço que deseja e reserve seu horário de forma rápida e prática.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <CalendarDays className="size-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Escolha a <span className="text-amber-400">data</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Selecione o dia que preferir. Mostraremos os horários disponíveis para o serviço escolhido.
              </p>
            </div>
          )}
        </div>
      </div>

      {step === 1 ? (
        <ServiceSelection
          selectedId={selectedServiceId}
          onSelect={setSelectedServiceId}
          onContinue={() => setStep(2)}
        />
      ) : (
        <DateSelection
          service={selectedService}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onBack={() => setStep(1)}
          onContinue={() => {
            /* Passo 3 (Horário) será implementado na próxima etapa. */
          }}
        />
      )}
    </>
  )
}
