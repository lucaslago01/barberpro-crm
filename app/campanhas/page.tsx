import { Plus } from 'lucide-react'
import { AppShell } from '@/components/dashboard/app-shell'
import { CampanhasView } from '@/components/campanhas/campanhas-view'

export default function CampanhasPage() {
  return (
    <AppShell
      title="Campanhas"
      subtitle="Crie campanhas para atrair, reativar e fidelizar seus clientes."
      headerAction={
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-12px_rgba(212,175,55,0.6)] transition-colors hover:bg-gold/90">
          <Plus className="size-4" />
          <span className="whitespace-nowrap">Nova campanha</span>
        </button>
      }
    >
      <CampanhasView />
    </AppShell>
  )
}
