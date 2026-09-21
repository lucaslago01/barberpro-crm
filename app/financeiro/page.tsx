import { AppShell } from '@/components/dashboard/app-shell'
import { FinanceiroMes } from '@/components/financeiro/financeiro-mes'

export default function FinanceiroPage() {
  return (
    <AppShell
      title="Financeiro"
      subtitle="Acompanhe suas entradas, saídas e o lucro do mês."
    >
      <FinanceiroMes />
    </AppShell>
  )
}