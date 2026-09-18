import type { Metadata } from "next"
import { SiteHeader } from "@/components/agendar/site-header"
import { AgendarFlow } from "@/components/agendar/agendar-flow"
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
        <AgendarFlow />
      </main>

      <SiteFooter />
    </div>
  )
}
