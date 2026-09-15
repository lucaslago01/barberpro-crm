import { AppShell } from '@/components/dashboard/app-shell'
import { AtendimentosView } from '@/components/atendimentos/atendimentos-view'
import { CalendarRange, ChevronDown } from 'lucide-react'

export default function AtendimentosPage() {
  return (
    <AppShell
      title="Atendimentos"
      subtitle="Acompanhe o histórico de atendimentos e a performance da sua barbearia."
      headerAction={
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <CalendarRange className="size-4" />
          <span className="whitespace-nowrap">01/09/2025 - 15/09/2025</span>
          <ChevronDown className="size-4" />
        </button>
      }
    >
      <AtendimentosView />
    </AppShell>
  )
}
