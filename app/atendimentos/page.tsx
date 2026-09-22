import { AppShell } from '@/components/dashboard/app-shell'
import { AtendimentosMes } from '@/components/atendimentos/atendimentos-mes'

export default function AtendimentosPage() {
  return (
    <AppShell
      title="Atendimentos"
      subtitle="Acompanhe o histórico de atendimentos da sua barbearia."
    >
      <AtendimentosMes />
    </AppShell>
  )
}