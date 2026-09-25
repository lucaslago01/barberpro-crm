'use client'

import { useEffect, useState } from 'react'
import { Cake } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Panel, PanelEmpty, PanelHeader, PanelRowsSkeleton, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'
import { WhatsappIconButton } from './whatsapp-button'
import { cn } from '@/lib/utils'

const WINDOW_DAYS = 60
const DAY_MS = 24 * 60 * 60 * 1000

interface BirthdayClient {
  id: string
  name: string
  phone: string | null
  date: string
  daysUntil: number
  turning: number | null
}

function formatBirthday(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

/** Dias até o próximo aniversário, contando a virada de ano */
function daysUntilNext(birth: Date, today: Date) {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let next = new Date(base.getFullYear(), birth.getMonth(), birth.getDate())
  if (next < base) next = new Date(base.getFullYear() + 1, birth.getMonth(), birth.getDate())
  return Math.round((next.getTime() - base.getTime()) / DAY_MS)
}

async function getUpcomingBirthdays(): Promise<BirthdayClient[]> {
  const { data, error } = await supabase
    .from('barberpro_clients')
    .select('id, name, phone, birth_date')
    .not('birth_date', 'is', null)

  if (error) throw new Error(error.message)

  const today = new Date()
  const result: BirthdayClient[] = []

  for (const c of (data || []) as any[]) {
    if (!c.birth_date) continue
    const birth = new Date(`${c.birth_date}T00:00:00`)
    if (Number.isNaN(birth.getTime())) continue

    const daysUntil = daysUntilNext(birth, today)
    if (daysUntil > WINDOW_DAYS) continue

    const nextYear =
      daysUntil === 0 ? today.getFullYear() : new Date(today.getTime() + daysUntil * DAY_MS).getFullYear()
    const turning = birth.getFullYear() > 1900 ? nextYear - birth.getFullYear() : null

    result.push({
      id: c.id,
      name: c.name,
      phone: c.phone || null,
      date: formatBirthday(birth),
      daysUntil,
      turning,
    })
  }

  result.sort((a, b) => a.daysUntil - b.daysUntil)
  return result
}

function whenLabel(days: number) {
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Amanhã'
  return `Em ${days} dias`
}

export function Birthdays() {
  const [clients, setClients] = useState<BirthdayClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getUpcomingBirthdays()
      .then((data) => {
        if (!cancelled) setClients(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = clients.slice(0, 3)

  return (
    <Panel>
      <PanelHeader
        icon={<Cake className="size-[18px]" />}
        title="Próximos aniversários"
        count={clients.length}
        action={
          <SeeAll
            onClick={() => {
              window.location.href = '/clientes'
            }}
          />
        }
      />

      {loading && <PanelRowsSkeleton />}

      {!loading && error && (
        <PanelEmpty icon={<Cake className="size-7" />}>{error}</PanelEmpty>
      )}

      {!loading && !error && clients.length === 0 && (
        <PanelEmpty icon={<Cake className="size-7" />}>
          Nenhum aniversário nos próximos {WINDOW_DAYS} dias.
        </PanelEmpty>
      )}

      {!loading && !error && clients.length > 0 && (
        <ul className="space-y-1 px-3 pb-3">
          {visible.map((b) => {
            const isToday = b.daysUntil === 0
            return (
              <li
                key={b.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-2 py-2 transition-colors',
                  isToday ? 'bg-gold/[0.07]' : 'hover:bg-white/[0.03]',
                )}
              >
                <UserAvatar name={b.name} size="md" ring={isToday} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.date}
                    {b.turning !== null && ` · faz ${b.turning}`}
                  </p>
                </div>

                <span
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    isToday
                      ? 'bg-gold/15 text-gold'
                      : 'text-muted-foreground',
                  )}
                >
                  {whenLabel(b.daysUntil)}
                </span>

                <WhatsappIconButton
                  label={`Parabenizar ${b.name} no WhatsApp`}
                  phone={b.phone}
                />
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
