import { MessageCircle } from 'lucide-react'
import { whatsappInteractions } from '@/lib/data'
import { Panel, PanelHeader, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'

export function WhatsappInteractions() {
  return (
    <Panel>
      <PanelHeader
        icon={<MessageCircle className="size-[18px]" />}
        title="Últimas interações (WhatsApp)"
        action={<SeeAll>Ver todas</SeeAll>}
      />
      <ul className="space-y-0.5 px-3 pb-3">
        {whatsappInteractions.map((c, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={c.unknown ? '' : c.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.message}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {c.time}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
