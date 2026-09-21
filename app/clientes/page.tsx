import { AppShell } from '@/components/dashboard/app-shell'
import { ClientsView } from '@/components/clientes/clients-view'

export default function ClientesPage() {
  return (
    <AppShell
      title="Clientes"
      subtitle="Gerencie seus clientes e acompanhe o histórico de atendimentos."
    >
      <ClientsView />
    </AppShell>
  )
}