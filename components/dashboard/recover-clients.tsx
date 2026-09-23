'use client'

import { useEffect, useState } from 'react'
import { TriangleAlert, X } from 'lucide-react'
import { getRecoverableClients, type RecoverableClient } from '@/lib/supabase-client-stats'
import { Panel, PanelHeader, SeeAll } from './panel'
import { UserAvatar } from './user-avatar'
import { RecoverBadge } from './badges'
import { WhatsappIconButton } from './whatsapp-button'
import type { RecoverStatus } from '@/lib/data'

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
    return (
      <li
        key={c.id}
        className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
      >
        <UserAvatar name={c.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{c.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {c.daysSince} dias sem corte
          </p>
        </div>
        <RecoverBadge status={toRecoverStatus(c.status)} />
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
          action={
            clients.length > 3
              ? <SeeAll onClick={() => setShowAll(true)} />
              : <SeeAll onClick={() => window.location.href = '/clientes'} />
          }
        />
        <ul className="grid grid-cols-1 gap-x-4 px-3 pb-3 sm:grid-cols-2">
          {loading && (
            <li className="px-2 py-3 text-xs text-muted-foreground">Carregando...</li>
          )}
          {error && (
            <li className="px-2 py-3 text-xs text-danger">{error}</li>
          )}
          {!loading && !error && clients.length === 0 && (
            <li className="px-2 py-3 text-xs text-muted-foreground">Nenhum cliente para recuperar.</li>
          )}
          {!loading && visible.map(renderRow)}
        </ul>
      </Panel>

      {showAll && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
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
