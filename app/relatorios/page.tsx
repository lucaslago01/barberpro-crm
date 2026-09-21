import { AppShell } from '@/components/dashboard/app-shell'
import { RelatoriosMes } from '@/components/relatorios/relatorios-mes'

export default function RelatoriosPage() {
  return (
    <AppShell
      title="Relatórios"
      subtitle="Acompanhe os resultados da sua barbearia e tome decisões com base em dados."
    >
      <RelatoriosMes />
    </AppShell>
  )
}