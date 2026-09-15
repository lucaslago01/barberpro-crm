import { Users } from 'lucide-react'
import { featuredClients } from '@/lib/data'
import { Panel, PanelHeader, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'
import { ClientTagBadge } from './badges'
import { WhatsappButton } from './whatsapp-button'

export function FeaturedClients() {
  return (
    <Panel>
      <PanelHeader
        icon={<Users className="size-[18px]" />}
        title="Clientes em destaque"
        action={<SeeAll />}
      />
      <ul className="space-y-1 px-3 pb-3">
        {featuredClients.map((c, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={c.name} size="lg" ring={c.tag === 'vip'} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <ClientTagBadge tag={c.tag} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Último corte: {c.lastCut}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Frequência: {c.frequency}
              </p>
            </div>
            <WhatsappButton />
          </li>
        ))}
      </ul>
    </Panel>
  )
}
