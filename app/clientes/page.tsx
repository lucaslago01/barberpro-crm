import { AppShell } from '@/components/dashboard/app-shell'
import { ClientsView } from '@/components/clientes/clients-view'
import { Plus } from 'lucide-react'

export default function ClientesPage() {
  return (
    <AppShell
      title="Clientes"
      subtitle="Gerencie seus clientes e acompanhe o histórico de atendimentos."
      headerAction={
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105">
          <Plus className="size-4" />
          Novo cliente
        </button>
      }
    >
      <ClientsView />
    </AppShell>
  )
}
