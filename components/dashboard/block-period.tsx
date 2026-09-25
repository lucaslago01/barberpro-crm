'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Ban, Trash2 } from 'lucide-react'
import {
  createBlockRange,
  deleteBlocks,
  getUpcomingBlockedPeriods,
  parseDayString,
  toDayString,
  type BlockedPeriod,
} from '@/lib/supabase-blocks'

const fieldClass =
  'w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40'

function formatDay(day: string, withYear = false) {
  return parseDayString(day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

function periodLabel(p: BlockedPeriod) {
  if (p.from === p.to) return formatDay(p.from, true)
  return `${formatDay(p.from)} a ${formatDay(p.to, true)}`
}

// Formulário "Bloquear vários dias" + lista dos períodos já bloqueados.
// Usado no modal da agenda (Dashboard) e em Configurações > Horário.
export function BlockPeriod({
  initialDate,
  onChanged,
}: {
  initialDate?: Date
  onChanged?: () => void
}) {
  const todayStr = toDayString(new Date())
  const [from, setFrom] = useState(() => toDayString(initialDate ?? new Date()))
  const [to, setTo] = useState(() => toDayString(initialDate ?? new Date()))
  const [reason, setReason] = useState('')
  const [periods, setPeriods] = useState<BlockedPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null)
  const savingRef = useRef(false)

  const load = useCallback(async () => {
    try {
      setPeriods(await getUpcomingBlockedPeriods())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar bloqueios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleFromChange(value: string) {
    setFrom(value)
    setSuccess(null)
    // A data final nunca fica antes da inicial
    if (value && (!to || to < value)) setTo(value)
  }

  async function handleCreate() {
    if (savingRef.current) return
    setError(null)
    setSuccess(null)

    if (!from || !to) return setError('Escolha a data inicial e a final.')
    if (from < todayStr) return setError('A data inicial não pode ser no passado.')
    if (to < from) return setError('A data final precisa ser igual ou depois da inicial.')

    savingRef.current = true
    setSaving(true)
    try {
      const count = await createBlockRange({
        from: parseDayString(from),
        to: parseDayString(to),
        reason,
      })
      setReason('')
      setSuccess(
        count === 1 ? '1 dia bloqueado.' : `${count} dias bloqueados.`,
      )
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao bloquear o período')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function handleDelete(p: BlockedPeriod) {
    setError(null)
    setSuccess(null)
    try {
      await deleteBlocks(p.ids)
      setConfirmingKey(null)
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover bloqueio')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">De</label>
            <input
              type="date"
              value={from}
              min={todayStr}
              onChange={(e) => handleFromChange(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Até</label>
            <input
              type="date"
              value={to}
              min={from || todayStr}
              onChange={(e) => {
                setTo(e.target.value)
                setSuccess(null)
              }}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Motivo (opcional)
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={fieldClass}
            placeholder="Ex.: férias, feriado, viagem"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Bloqueia o dia inteiro na agenda do CRM e no /agendar. Dias em que a barbearia já
          fecha são ignorados.
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Ban className="size-4" />
          {saving ? 'Bloqueando...' : 'Bloquear período'}
        </button>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Dias bloqueados
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dia inteiro bloqueado.</p>
        ) : (
          <ul className="space-y-2">
            {periods.map((p) => (
              <li
                key={p.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{periodLabel(p)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.days === 1 ? '1 dia' : `${p.days} dias`}
                    {p.reason ? ` · ${p.reason}` : ''}
                  </p>
                </div>
                {confirmingKey === p.key ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmingKey(null)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Manter
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingKey(p.key)}
                    aria-label="Remover bloqueio"
                    title="Remover bloqueio"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
