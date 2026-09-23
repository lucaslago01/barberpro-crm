"use client"

import { useState } from "react"
import { CalendarDays, Clock, User, CheckCircle2 } from "lucide-react"
import { services, clubServices } from "@/lib/agendar/services"
import { StepIndicator } from "@/components/agendar/step-indicator"
import { ServiceSelection } from "@/components/agendar/service-selection"
import { DateSelection } from "@/components/agendar/date-selection"
import { TimeSelection } from "@/components/agendar/time-selection"
import { DataForm, type AgendarFormData } from "@/components/agendar/data-form"
import { Confirmation } from "@/components/agendar/confirmation"

const allServices = [...services, ...clubServices]

export function AgendarFlow() {
  const [step, setStep] = useState(1)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
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

  const selectedService = allServices.find((s) => s.id === selectedServiceId) ?? allServices[0]

  function handleSelectDate(date: Date) {
    if (!selectedDate || selectedDate.getTime() !== date.getTime()) {
      setSelectedTime(null)
    }
    setSelectedDate(date)
  }

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

          {step === 1 && (
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Escolha o <span className="text-amber-400">serviço</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Escolha o serviço que deseja e reserve seu horário de forma rápida e prática.
              </p>
            </div>
          )}

          {step === 2 && (
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

          {step === 3 && (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <Clock className="size-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Escolha o <span className="text-amber-400">horário</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Selecione um horário disponível para o seu atendimento.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <User className="size-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Seus <span className="text-amber-400">dados</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Preencha suas informações para finalizar o agendamento.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <CheckCircle2 className="size-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Confirme seu <span className="text-amber-400">agendamento</span>
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
          selectedId={selectedServiceId}
          onSelect={setSelectedServiceId}
          onContinue={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <DateSelection
          service={selectedService}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <TimeSelection
          service={selectedService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelectTime={setSelectedTime}
          onBack={() => setStep(2)}
          onChangeService={() => setStep(1)}
          onContinue={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <DataForm
          service={selectedService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          data={formData}
          onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          onBack={() => setStep(3)}
          onChangeService={() => setStep(1)}
          onContinue={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <Confirmation
          service={selectedService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          data={formData}
          onBack={() => setStep(4)}
        />
      )}
    </>
  )
}