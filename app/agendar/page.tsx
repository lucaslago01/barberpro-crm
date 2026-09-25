import type { Metadata } from "next"
import { SiteHeader } from "@/components/agendar/site-header"
import { AgendarFlow } from "@/components/agendar/agendar-flow"
import { SiteFooter } from "@/components/agendar/site-footer"

export const metadata: Metadata = {
  title: "Agendar horário | FRAMES STUDIO",
  description: "Escolha o serviço e reserve seu horário na FRAMES STUDIO de forma rápida e prática.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "FRAMES STUDIO",
    title: "Agendar horário | FRAMES STUDIO",
    description: "Escolha o serviço e reserve seu horário na FRAMES STUDIO de forma rápida e prática.",
    images: [
      {
        url: "/og-frames-studio.jpg",
        width: 1200,
        height: 630,
        alt: "FRAMES STUDIO — agende seu horário online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agendar horário | FRAMES STUDIO",
    description: "Escolha o serviço e reserve seu horário na FRAMES STUDIO de forma rápida e prática.",
    images: ["/og-frames-studio.jpg"],
  },
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
