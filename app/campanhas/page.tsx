import { AppShell } from '@/components/dashboard/app-shell'
import { CampanhasView } from '@/components/campanhas/campanhas-view'

export default function CampanhasPage() {
  return (
    <AppShell
      title="Campanhas"
      subtitle="Crie campanhas para atrair, reativar e fidelizar seus clientes."
    >
      <CampanhasView />
    </AppShell>
  )
}
