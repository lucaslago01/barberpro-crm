import { CalendarDays, ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/dashboard/app-shell'
import { FinanceiroView } from '@/components/financeiro/financeiro-view'
import { financePeriod } from '@/lib/data'

export default function FinanceiroPage() {
  return (
    <AppShell
      title="Financeiro"
      subtitle="Acompanhe suas entradas, saídas e tenha total controle do seu negócio."
      headerAction={
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <CalendarDays className="size-4 text-gold" />
          <span className="whitespace-nowrap">{financePeriod}</span>
          <ChevronDown className="size-4" />
        </button>
      }
    >
      <FinanceiroView />
    </AppShell>
  )
}
