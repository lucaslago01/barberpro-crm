import { Cake, MessageCircle } from 'lucide-react'
import { birthdays } from '@/lib/data'
import { Panel, PanelHeader, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'
import { WhatsappIconButton } from './whatsapp-button'

export function Birthdays() {
  return (
    <Panel>
      <PanelHeader
        icon={<MessageCircle className="size-[18px]" />}
        title="Próximos aniversários"
        action={<SeeAll />}
      />
      <ul className="space-y-1 px-3 pb-3">
        {birthdays.map((b) => (
          <li
            key={b.name}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={b.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{b.name}</p>
              <p className="truncate text-xs text-muted-foreground">{b.date}</p>
            </div>
            <Cake className="size-4 text-gold" />
            <WhatsappIconButton label={`Parabenizar ${b.name} no WhatsApp`} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}
