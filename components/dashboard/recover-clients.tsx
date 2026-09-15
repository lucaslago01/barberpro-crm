import { Users } from 'lucide-react'
import { recoverClients } from '@/lib/data'
import { Panel, PanelHeader, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'
import { RecoverBadge } from './badges'
import { WhatsappIconButton } from './whatsapp-button'

export function RecoverClients() {
  return (
    <Panel>
      <PanelHeader
        icon={<Users className="size-[18px]" />}
        title="Clientes para recuperar"
        action={<SeeAll />}
      />
      <ul className="grid grid-cols-1 gap-x-4 px-3 pb-3 sm:grid-cols-2">
        {recoverClients.map((c, i) => (
          <li
            key={i}
            className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={c.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.days}</p>
            </div>
            <RecoverBadge status={c.status} />
            <WhatsappIconButton label={`Recuperar ${c.name} no WhatsApp`} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}
