'use client'

import { useEffect, useRef, useState } from 'react'
import { Repeat, Trash2, X } from 'lucide-react'
import { getClients } from '@/lib/supabase-data'
import { getServices, getBookedTimes, type ServiceOption } from '@/lib/supabase-appointments'
import {
  createRecurringAppointment,
  deleteRecurringAppointment,
  listRecurringAppointments,
  WEEKDAY_LABELS,
  type RecurringAppointment,
} from '@/lib/supabase-recurring'
import { getDaySlots } from '@/lib/business-hours'
import type { Client } from '@/lib/types'

// Formato "09:00:00" -> "09:00"
function shortTime(value: string) {
  return value.slice(0, 5)
}

// Uma data qualquer que caia no dia da semana pedido, só para reaproveitar
// getDaySlots (que olha o horário de funcionamento por dia da semana).
function anyDateForWeekday(weekday: number) {
  const d = new Date()
  const diff = (weekday - d.getDay() + 7) % 7
  d.setDate(d.getDate() + diff)
  return d
}

export function RecurringModal({
  onClose,
  onChanged,
}: {
  onClose: () => void
  onChanged: () => void
}) {
  const [list, setList] = useState<RecurringAppointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const [clientId, setClientId] = useState('')
  const [clientQuery, setClientQuery] = useState('')
  const [showClientList, setShowClientList] = useState(false)
  const clientBoxRef = useRef<HTMLDivElement>(null)
  const [serviceId, setServiceId] = useState('')
  const [weekday, setWeekday] = useState(4) // quinta como padrão, o exemplo mais comum
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const [r, c, s] = await Promise.all([
          listRecurringAppointments(),
          getClients(),
          getServices(),
        ])
        if (cancelled) return
        setList(r)
        setClients(c)
        setServices(s)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar horários fixos')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientBoxRef.current && !clientBoxRef.current.contains(e.target as Node)) {
        setShowClientList(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function clientLabel(c: Client) {
    return c.name + (c.phone ? ` · ${c.phone}` : '')
  }

  function selectClient(c: Client) {
    setClientId(c.id)
    setClientQuery(clientLabel(c))
    setShowClientList(false)
  }

  const selectedClient = clients.find((c) => c.id === clientId)
  const filteredClients = (() => {
    const q = clientQuery.trim().toLowerCase()
    if (!q || clientQuery === (selectedClient ? clientLabel(selectedClient) : '')) return clients
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q),
    )
  })()

  const daySlots = getDaySlots(anyDateForWeekday(weekday))

  useEffect(() => {
    // se o dia da semana mudar e o horário escolhido não existir mais nele, limpa
    if (time && !daySlots.includes(time)) setTime('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday])

  async function handleCreate() {
    if (savingRef.current) return
    setError(null)

    if (!clientId) return setError('Escolha o cliente.')
    if (!serviceId) return setError('Escolha o serviço.')
    if (!time) return setError('Escolha o horário.')

    savingRef.current = true
    setSaving(true)
    try {
      // A primeira ocorrência cai no próximo (ou neste) dia da semana escolhido.
      // Confere se já não tem alguém agendado nela antes de fixar.
      const nextDate = anyDateForWeekday(weekday)
      const alreadyBooked = await getBookedTimes(nextDate)
      if (alreadyBooked.includes(time)) {
        const dateLabel = nextDate.toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
        })
        setError(
          `Já tem um atendimento marcado em ${dateLabel} (${WEEKDAY_LABELS[weekday].toLowerCase()}) às ${time}. Cancele ou reagende esse atendimento antes de fixar esse horário.`,
        )
        return
      }

      await createRecurringAppointment({
        clientId,
        serviceId,
        weekday,
        time,
        notes,
        isClubVisit: Boolean(selectedClient?.club_plan),
      })
      setClientId('')
      setClientQuery('')
      setServiceId('')
      setTime('')
      setNotes('')
      setReloadKey((k) => k + 1)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar horário fixo')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    try {
      await deleteRecurringAppointment(id)
      setReloadKey((k) => k + 1)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover horário fixo')
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-gradient-to-b from-card to-[oklch(0.19_0.009_300)] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_oklch(0.62_0.19_305/10%)] animate-scale-in before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gold/50 before:to-transparent">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Repeat className="size-4 text-gold" />
            Horários fixos
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-white/5 hover:text-gold active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Clientes com um horário fixo toda semana. O dia e horário ficam riscados
          automaticamente no agendar.
        </p>

        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ativos
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum horário fixo cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.clientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {WEEKDAY_LABELS[r.weekday]} · {shortTime(r.time)} · {r.serviceName}
                      {r.addonServiceName ? ` + ${r.addonServiceName}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    aria-label="Remover horário fixo"
                    title="Remover horário fixo"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Novo horário fixo
          </p>

          <div ref={clientBoxRef} className="relative">
            <label className="mb-1 block text-xs text-muted-foreground">Cliente</label>
            <input
              type="text"
              value={clientQuery}
              onChange={(e) => {
                setClientQuery(e.target.value)
                setShowClientList(true)
                if (clientId) setClientId('')
              }}
              onFocus={() => setShowClientList(true)}
              placeholder="Buscar por nome ou telefone..."
              className={fieldClass}
              autoComplete="off"
            />
            {showClientList && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {filteredClients.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClient(c)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-white/5"
                    >
                      {c.name}
                      {c.phone ? ` · ${c.phone}` : ''}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Serviço</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Selecione o serviço</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Dia da semana</label>
              <select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
                className={fieldClass}
              >
                {WEEKDAY_LABELS.map((label, i) => (
                  <option key={i} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Horário</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={fieldClass}
                disabled={daySlots.length === 0}
              >
                <option value="">{daySlots.length === 0 ? 'Fechado' : 'Selecione'}</option>
                {daySlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Observações (opcional)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={fieldClass}
              placeholder="Ex.: sempre corta na tesoura"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Fechar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-lg btn-gold-glow px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Fixar horário'}
          </button>
        </div>
      </div>
    </div>
  )
}
