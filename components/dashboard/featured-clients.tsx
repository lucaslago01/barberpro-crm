'use client'

import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Panel, PanelEmpty, PanelHeader, PanelRowsSkeleton, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'
import { ClientTagBadge } from './badges'
import { WhatsappIconButton } from './whatsapp-button'
import { cn } from '@/lib/utils'

interface FeaturedClient {
  id: string
  name: string
  phone: string | null
  lastCut: string
  frequency: string
  tag: 'vip' | 'ativo' | 'em risco'
  visits: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const VIP_VISITS = 10
const RISK_DAYS = 30

async function getFeaturedClients(): Promise<FeaturedClient[]> {
  const { data: appointments, error } = await supabase
    .from('barberpro_appointments')
    .select('client_id, time, status')

  if (error) throw new Error(error.message)

  const { data: clients, error: cErr } = await supabase
    .from('barberpro_clients')
    .select('id, name, phone')

  if (cErr) throw new Error(cErr.message)

  const now = Date.now()
  const done = new Map<string, { time: number }[]>()

  for (const a of (appointments || []) as any[]) {
    if (a.status !== 'concluido') continue
    const t = new Date(a.time).getTime()
    const list = done.get(a.client_id) || []
    list.push({ time: t })
    done.set(a.client_id, list)
  }

  const result: FeaturedClient[] = []

  for (const c of (clients || []) as any[]) {
    const list = done.get(c.id)
    if (!list || list.length === 0) continue
    list.sort((a, b) => a.time - b.time)
    const visits = list.length
    const last = list[visits - 1].time
    const daysSince = Math.floor(((now - last) / DAY_MS))

    let frequency = '-'
    if (visits >= 2) {
      const span = list[visits - 1].time - list[0].time
      frequency = `${Math.max(1, Math.round(span / DAY_MS / (visits - 1)))} dias`
    }

    let tag: FeaturedClient['tag'] = 'ativo'
    if (visits >= VIP_VISITS) tag = 'vip'
    else if (daysSince > RISK_DAYS) tag = 'em risco'

    result.push({
      id: c.id,
      name: c.name,
      phone: c.phone || null,
      lastCut: new Date(last).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      frequency,
      tag,
      visits,
    })
  }

  result.sort((a, b) => {
    if (a.tag === 'vip' && b.tag !== 'vip') return -1
    if (b.tag === 'vip' && a.tag !== 'vip') return 1
    return b.visits - a.visits
  })

  return result.slice(0, 3)
}

export function FeaturedClients() {
  const [clients, setClients] = useState<FeaturedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getFeaturedClients()
      .then((data) => { if (!cancelled) setClients(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <Panel>
      <PanelHeader
        icon={<Crown className="size-[18px]" />}
        title="Clientes em destaque"
        action={<SeeAll onClick={() => { window.location.href = '/clientes' }} />}
      />

      {loading && <PanelRowsSkeleton />}

      {!loading && error && (
        <PanelEmpty icon={<Crown className="size-7" />}>{error}</PanelEmpty>
      )}

      {!loading && !error && clients.length === 0 && (
        <PanelEmpty icon={<Crown className="size-7" />}>
          Nenhum cliente com atendimento concluído ainda.
        </PanelEmpty>
      )}

      {!loading && !error && clients.length > 0 && (
        <ul className="space-y-1 px-3 pb-3">
          {clients.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              {/* posição no ranking: o painel é um top 3 */}
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums',
                  i === 0
                    ? 'bg-gold/15 text-gold'
                    : 'bg-white/[0.06] text-muted-foreground',
                )}
              >
                {i + 1}
              </span>

              <UserAvatar name={c.name} size="md" ring={c.tag === 'vip'} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold">{c.name}</p>
                  <span className="shrink-0 whitespace-nowrap">
                    <ClientTagBadge tag={c.tag} />
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {c.lastCut}
                  {c.frequency !== '-' && ` · a cada ${c.frequency}`}
                </p>
              </div>

              {/* total de visitas: era calculado mas nunca aparecia */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold leading-none tabular-nums">{c.visits}</p>
                <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                  {c.visits === 1 ? 'visita' : 'visitas'}
                </p>
              </div>

              <WhatsappIconButton
                label={`Enviar WhatsApp para ${c.name}`}
                phone={c.phone}
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
