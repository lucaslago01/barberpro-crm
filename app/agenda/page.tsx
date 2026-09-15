import { AppShell } from '@/components/dashboard/app-shell'
import { AgendaView } from '@/components/agenda/agenda-view'

export default function AgendaPage() {
  return (
    <AppShell
      title="Agenda"
      subtitle="Gerencie os atendimentos e horários da barbearia."
    >
      <AgendaView />
    </AppShell>
  )
}
