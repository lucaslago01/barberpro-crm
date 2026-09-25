'use client'

import { useEffect, useState } from 'react'
import { TriangleAlert, X } from 'lucide-react'
import { getRecoverableClients, type RecoverableClient } from '@/lib/supabase-client-stats'
import { Panel, PanelEmpty, PanelHeader, PanelRowsSkeleton, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'
import { RecoverBadge } from './badges'
import { WhatsappIconButton } from './whatsapp-button'
import type { RecoverStatus } from '@/lib/data'
import { cn } from '@/lib/utils'

function toRecoverStatus(s: RecoverableClient['status']): RecoverStatus {
  if (s === 'inativo') return 'perdido'
  return 'em risco'
}

export function RecoverClients() {
  const [clients, setClients] = useState<RecoverableClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    getRecoverableClients()
      .then((data) => { if (!cancelled) setClients(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const visible = clients.slice(0, 3)

  function renderRow(c: RecoverableClient) {
    const lost = c.status === 'inativo'
    return (
      <li
        key={c.id}
        className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
      >
        <UserAvatar name={c.name} size="md" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{c.name}</p>
          <div className="mt-0.5">
            <RecoverBadge status={toRecoverStatus(c.status)} />
          </div>
        </div>

        {/* o tempo parado é o número que decide a ação */}
        <div className="shrink-0 text-right">
          <p
            className={cn(
              'text-sm font-bold leading-none tabular-nums',
              lost ? 'text-danger' : 'text-warning',
            )}
          >
            {c.daysSince}
          </p>
          <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">dias</p>
        </div>

        <WhatsappIconButton label={`Recuperar ${c.name} no WhatsApp`} phone={c.phone} />
      </li>
    )
  }

  return (
    <>
      <Panel>
        <PanelHeader
          icon={<TriangleAlert className="size-[18px]" />}
          title="Clientes para recuperar"
          count={clients.length}
          action={
            clients.length > 3
              ? <SeeAll onClick={() => setShowAll(true)} />
              : <SeeAll onClick={() => { window.location.href = '/clientes' }} />
          }
        />

        {loading && <PanelRowsSkeleton />}

        {!loading && error && (
          <PanelEmpty icon={<TriangleAlert className="size-7" />}>{error}</PanelEmpty>
        )}

        {!loading && !error && clients.length === 0 && (
          <PanelEmpty icon={<TriangleAlert className="size-7" />}>
            Ninguém para recuperar. Todos os clientes estão em dia.
          </PanelEmpty>
        )}

        {!loading && !error && clients.length > 0 && (
          <ul className="space-y-1 px-3 pb-3">{visible.map(renderRow)}</ul>
        )}
      </Panel>

      {showAll && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
          <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Clientes para recuperar</h3>
              <button
                onClick={() => setShowAll(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="max-h-96 space-y-0.5 overflow-y-auto">
              {clients.map(renderRow)}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
