import type { Metadata } from "next"
import { SiteHeader } from "@/components/agendar/site-header"
import { StepIndicator } from "@/components/agendar/step-indicator"
import { ServiceSelection } from "@/components/agendar/service-selection"
import { SiteFooter } from "@/components/agendar/site-footer"

export const metadata: Metadata = {
  title: "Agendar horário | BarberPro",
  description: "Escolha o serviço e reserve seu horário na BarberPro de forma rápida e prática.",
}

export default function AgendarPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />

      <main>
        <div className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[url('/agendar/hero-bg.png')] bg-cover bg-center opacity-25"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-black/40 via-black to-black"
          />

          <div className="relative flex flex-col gap-8 px-4 pt-8 pb-10 sm:gap-10 sm:px-6 sm:pt-10 sm:pb-12">
            <StepIndicator currentStep={1} />

            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Agende seu <span className="text-amber-400">horário</span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Escolha o serviço que deseja e reserve seu horário de forma rápida e prática.
              </p>
            </div>
          </div>
        </div>

        <ServiceSelection />
      </main>

      <SiteFooter />
    </div>
  )
}
