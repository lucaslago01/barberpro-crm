'use client'

import { useEffect, useRef, useState } from 'react'
import { Ban, Trash2, X } from 'lucide-react'
import {
  createBlock,
  deleteBlock,
  getBlocksByDay,
  type Block,
} from '@/lib/supabase-blocks'
import { getDaySlots, isOpenDay, SLOT_MINUTES } from '@/lib/business-hours'

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

// O banco devolve "12:00:00"; a tela mostra "12:00"
function shortTime(value: string) {
  return value.slice(0, 5)
}

export function BlocksModal({
  date,
  onClose,
  onChanged,
}: {
  date: Date
  onClose: () => void
  onChanged: () => void
}) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const savingRef = useRef(false)

  const daySlots = getDaySlots(date)
  const open = isOpenDay(date)

  // Inícios possíveis: todos os horários do dia (sem o último, que é o fechamento).
  // Finais possíveis: cada horário + 30 min.
  const startOptions = daySlots.slice(0, -1)
  const endOptions = daySlots.slice(1)

  const dateLabel = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // O dia inteiro já está bloqueado se existe um bloqueio cobrindo do abre ao fecha
  const wholeDayBlocked =
    open &&
    daySlots.length > 0 &&
    blocks.some(
      (b) => shortTime(b.start_time) === daySlots[0] && shortTime(b.end_time) === daySlots[daySlots.length - 1],
    )

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const data = await getBlocksByDay(date)
        if (!cancelled) setBlocks(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar bloqueios')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date.getTime(), reloadKey])

  async function handleCreate() {
    if (savingRef.current) return
    setError(null)

    if (!start) return setError('Escolha o horário inicial.')
    if (!end) return setError('Escolha o horário final.')
    if (end <= start) return setError('O horário final precisa ser depois do inicial.')

    savingRef.current = true
    setSaving(true)
    try {
      await createBlock({ date, start, end, reason })
      setStart('')
      setEnd('')
      setReason('')
      setReloadKey((k) => k + 1)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar bloqueio')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function handleBlockWholeDay() {
    if (savingRef.current || daySlots.length === 0) return
    setError(null)

    savingRef.current = true
    setSaving(true)
    try {
      await createBlock({
        date,
        start: daySlots[0],
        end: daySlots[daySlots.length - 1],
        reason: reason.trim() || 'Fechado o dia todo',
      })
      setReason('')
      setReloadKey((k) => k + 1)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao bloquear o dia')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    try {
      await deleteBlock(id)
      setReloadKey((k) => k + 1)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao apagar bloqueio')
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-semibold">Bloquear horário</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mb-4 text-xs capitalize text-muted-foreground">{dateLabel}</p>

        {/* Bloqueios do dia */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Bloqueios deste dia
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum bloqueio neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {blocks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium tabular-nums">
                      {shortTime(b.start_time)} às {shortTime(b.end_time)}
                    </p>
                    {b.reason && (
                      <p className="truncate text-xs text-muted-foreground">{b.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    aria-label="Remover bloqueio"
                    title="Remover bloqueio"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!open ? (
          <p className="text-sm text-muted-foreground">A barbearia não abre neste dia.</p>
        ) : (
          <div className="space-y-4 border-t border-border pt-4">
            {/* Bloquear o dia inteiro */}
            <button
              onClick={handleBlockWholeDay}
              disabled={saving || wholeDayBlocked}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Ban className="size-4" />
              {wholeDayBlocked ? 'Dia inteiro já bloqueado' : 'Bloquear o dia inteiro'}
            </button>

            {/* Novo bloqueio por horário */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Ou bloqueie só um horário
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Das</label>
                  <select
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Início</option>
                    {startOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Até</label>
                  <select
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Fim</option>
                    {endOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
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
                  placeholder="Ex.: almoço, feriado"
                />
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Fechar
          </button>
          {open && (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Bloquear'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}