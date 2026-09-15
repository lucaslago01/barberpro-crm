import { AppShell } from '@/components/dashboard/app-shell'
import { ConfiguracoesView } from '@/components/configuracoes/configuracoes-view'

export default function ConfiguracoesPage() {
  return (
    <AppShell
      title="Configurações"
      subtitle="Gerencie as informações da sua barbearia e personalize o sistema."
    >
      <ConfiguracoesView />
    </AppShell>
  )
}
