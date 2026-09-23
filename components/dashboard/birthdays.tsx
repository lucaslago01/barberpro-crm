'use client'

import { useEffect, useState } from 'react'
import { Cake } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Panel, PanelHeader, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'
import { WhatsappIconButton } from './whatsapp-button'

interface BirthdayClient {
  id: string
  name: string
  phone: string | null
  date: string
}

function formatBirthday(birthDate: string): string {
  const d = new Date(`${birthDate}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

async function getUpcomingBirthdays(): Promise<BirthdayClient[]> {
  const { data, error } = await supabase
    .from('barberpro_clients')
    .select('id, name, phone, birth_date')
    .not('birth_date', 'is', null)

  if (error) throw new Error(error.message)

  const today = new Date()
  const todayMD = today.getMonth() * 100 + today.getDate()

  const result: { client: BirthdayClient; diff: number }[] = []

  for (const c of (data || []) as any[]) {
    if (!c.birth_date) continue
    const d = new Date(`${c.birth_date}T00:00:00`)
    const md = d.getMonth() * 100 + d.getDate()
    const diff = md >= todayMD ? md - todayMD : 1200 - todayMD + md
    if (diff > 60) continue
    result.push({
      client: {
        id: c.id,
        name: c.name,
        phone: c.phone || null,
        date: formatBirthday(c.birth_date),
      },
      diff,
    })
  }

  result.sort((a, b) => a.diff - b.diff)
  return result.slice(0, 3).map((r) => r.client)
}

export function Birthdays() {
  const [clients, setClients] = useState<BirthdayClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getUpcomingBirthdays()
      .then((data) => { if (!cancelled) setClients(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <Panel>
      <PanelHeader
        icon={<Cake className="size-[18px]" />}
        title="Próximos aniversários"
        action={<SeeAll onClick={() => window.location.href = '/clientes'} />}
      />
      <ul className="space-y-1 px-3 pb-3">
        {loading && (
          <li className="px-2 py-3 text-xs text-muted-foreground">Carregando...</li>
        )}
        {error && (
          <li className="px-2 py-3 text-xs text-danger">{error}</li>
        )}
        {!loading && !error && clients.length === 0 && (
          <li className="px-2 py-3 text-xs text-muted-foreground">Nenhum aniversário nos próximos 60 dias.</li>
        )}
        {!loading && clients.map((b) => (
          <li
            key={b.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={b.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{b.name}</p>
              <p className="truncate text-xs text-muted-foreground">{b.date}</p>
            </div>
            <Cake className="size-4 text-gold" />
            <WhatsappIconButton label={`Parabenizar ${b.name} no WhatsApp`} phone={b.phone} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}
