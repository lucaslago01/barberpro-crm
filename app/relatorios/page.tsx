'use client'

import { CalendarDays, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { AppShell } from '@/components/dashboard/app-shell'
import { RelatoriosView } from '@/components/relatorios/relatorios-view'

export default function RelatoriosPage() {
  return (
    <AppShell
      title="Relatórios"
      subtitle="Acompanhe os resultados da sua barbearia e tome decisões com base em dados."
      headerAction={
        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background/40 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <CalendarDays className="size-4 text-gold" />
            <span className="whitespace-nowrap">01/08/2026 - 31/08/2026</span>
            <ChevronDown className="size-4" />
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background/40 px-3 text-sm font-medium text-foreground transition-colors hover:border-gold/30">
            <SlidersHorizontal className="size-4 text-gold" />
            <span className="whitespace-nowrap">Filtros</span>
          </button>
        </div>
      }
    >
      <RelatoriosView />
    </AppShell>
  )
}
