import { AppShell } from '@/components/dashboard/app-shell'
import { WhatsappView } from '@/components/whatsapp/whatsapp-view'

export default function WhatsappPage() {
  return (
    <AppShell
      title="WhatsApp"
      subtitle="Converse com seus clientes, gerencie atendimentos e aumente suas vendas."
      headerAction={
        <div className="hidden items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2 sm:flex">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70" />
            <span className="relative inline-flex size-2.5 rounded-full bg-success" />
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-success">WhatsApp Conectado</p>
            <p className="text-[11px] text-muted-foreground">BarberPro Oficial</p>
          </div>
        </div>
      }
    >
      <WhatsappView />
    </AppShell>
  )
}
