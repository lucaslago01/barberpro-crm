import { AppShell } from '@/components/dashboard/app-shell'
import { AgendaWithSupabase } from '@/components/agenda/agenda-with-supabase'

export default function AgendaPage() {
  return (
    <AppShell
      title="Agenda"
      subtitle="Gerencie os atendimentos e horários da barbearia."
    >
      <AgendaWithSupabase />
    </AppShell>
  )
}
