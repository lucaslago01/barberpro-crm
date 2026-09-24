'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { getClients } from '@/lib/supabase-data'
import {
  getServices,
  getBookedTimes,
  createAppointment,
  type ServiceOption,
} from '@/lib/supabase-appointments'
import type { Client } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getDaySlots, isOpenDay } from '@/lib/business-hours'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function toInputValue(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "20:15" válido; "20:5", "abc", "25:00" não
function isValidTimeFormat(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function NewAppointmentModal({
  initialDate,
  onClose,
  onCreated,
}: {
  initialDate: Date
  onClose: () => void
  onCreated: () => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [clientId, setClientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [dateStr, setDateStr] = useState(() => toInputValue(initialDate))
  const [time, setTime] = useState<string | null>(null)
  const [customTime, setCustomTime] = useState('')
  const [notes, setNotes] = useState('')
  const [isClubVisit, setIsClubVisit] = useState(false)
  const [addonServiceId, setAddonServiceId] = useState('')
  const [clubTouched, setClubTouched] = useState(false)

  const [booked, setBooked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Trava contra clique duplo: vale na hora, sem esperar a tela atualizar
  const savingRef = useRef(false)

  // Carrega clientes e serviços uma vez
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [c, s] = await Promise.all([getClients(), getServices()])
        if (cancelled) return
        setClients(c)
        setServices(s)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
        }
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Busca horários ocupados sempre que a data muda
  useEffect(() => {
    if (!dateStr) return
    let cancelled = false
    const [y, m, d] = dateStr.split('-').map(Number)

    async function load() {
      try {
        const times = await getBookedTimes(new Date(y, m - 1, d))
        if (cancelled) return
        setBooked(times)
        setTime((current) => (current && times.includes(current) ? null : current))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao buscar horários')
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [dateStr])

  const selectedService = services.find((s) => s.id === serviceId)
  const selectedClient = clients.find((c) => c.id === clientId)
  const addonOptions = services.filter((s) => s.name.toLowerCase().includes('sobrancelha'))
  const selectedAddon = addonOptions.find((s) => s.id === addonServiceId)

  useEffect(() => {
    if (!clubTouched) {
      setIsClubVisit(Boolean(selectedClient?.club_plan))
    }
  }, [clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Horários do dia escolhido (vazio se a barbearia estiver fechada)
  const daySlots = (() => {
    if (!dateStr) return []
    const [y, m, d] = dateStr.split('-').map(Number)
    return getDaySlots(new Date(y, m - 1, d))
  })()

  const dayIsOpen = (() => {
    if (!dateStr) return false
    const [y, m, d] = dateStr.split('-').map(Number)
    return isOpenDay(new Date(y, m - 1, d))
  })()

  function isPast(slot: string) {
    if (!dateStr) return false
    const [y, m, d] = dateStr.split('-').map(Number)
    const [h, min] = slot.split(':').map(Number)
    return new Date(y, m - 1, d, h, min).getTime() < Date.now()
  }

  function chooseSlot(slot: string) {
    setTime(slot)
    setCustomTime('')
  }

  function handleCustomTimeChange(value: string) {
    setCustomTime(value)
    setTime(null)
  }

  const effectiveTime = customTime || time

  async function handleSave() {
    if (savingRef.current) return

    setError(null)
    if (!clientId) return setError('Escolha o cliente.')
    if (!serviceId) return setError('Escolha o serviço.')
    if (!dateStr) return setError('Escolha a data.')
    if (!effectiveTime) return setError('Escolha ou digite o horário.')

    if (customTime) {
      if (!isValidTimeFormat(customTime)) {
        return setError('Digite o horário no formato hh:mm, ex.: 20:15.')
      }
    } else if (!daySlots.includes(effectiveTime)) {
      return setError('Escolha um horário disponível.')
    }

    savingRef.current = true
    setSaving(true)

    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      const [h, min] = effectiveTime.split(':').map(Number)

      // Confere de novo, logo antes de gravar, se o horário ainda está livre
      const freshBooked = await getBookedTimes(new Date(y, m - 1, d))
      if (freshBooked.includes(effectiveTime)) {
        setBooked(freshBooked)
        setTime(null)
        setCustomTime('')
        setError('Esse horário acabou de ser ocupado. Escolha outro.')
        return
      }

      const dateTime = new Date(y, m - 1, d, h, min).toISOString()
      await createAppointment({ clientId, serviceId, dateTime, notes })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Novo agendamento</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {loadingOptions ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Cliente</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={fieldClass}
              >
                <option value="">Selecione o cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` · ${c.phone}` : ''}
                  </option>
                ))}
              </select>
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
                    {s.name} · {s.duration} min · {currency.format(s.price)}
                  </option>
                ))}
              </select>
              {selectedService && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedService.duration} min ·{' '}
                  {isClubVisit ? (
                    <>
                      <span className="line-through">{currency.format(selectedService.price)}</span>{' '}
                      <span className="font-medium text-gold">Grátis (clube)</span>
                    </>
                  ) : (
                    currency.format(selectedService.price)
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5">
              <div>
                <label htmlFor="club-visit-checkbox" className="text-sm font-medium">
                  Atendimento do clube
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Não cobra o serviço base (já incluso na mensalidade), só os extras.
                  {selectedClient?.club_plan ? ' Cliente é assinante do clube.' : ''}
                </p>
              </div>
              <input
                id="club-visit-checkbox"
                type="checkbox"
                checked={isClubVisit}
                onChange={(e) => {
                  setClubTouched(true)
                  setIsClubVisit(e.target.checked)
                }}
                className="size-4 shrink-0 accent-gold"
              />
            </div>

            {addonOptions.length > 0 && (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Serviço extra (opcional)
                </label>
                <select
                  value={addonServiceId}
                  onChange={(e) => setAddonServiceId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Nenhum</option>
                  {addonOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {currency.format(s.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className={fieldClass}
              />
            </div>

            {!dayIsOpen ? (
              <p className="text-sm text-muted-foreground">
                A barbearia não abre neste dia.
              </p>
            ) : (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Horário</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {daySlots.map((slot) => {
                    const unavailable = booked.includes(slot) || isPast(slot)
                    const selected = slot === time && !customTime
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={unavailable}
                        onClick={() => chooseSlot(slot)}
                        className={cn(
                          'h-9 rounded-lg border text-xs font-medium transition-colors',
                          selected
                            ? 'border-gold bg-gold text-primary-foreground'
                            : unavailable
                              ? 'cursor-not-allowed border-border/40 text-muted-foreground/40 line-through'
                              : 'border-border hover:bg-white/5',
                        )}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Riscados: já agendados ou horários que já passaram.
                </p>

                <div className="mt-3">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Ou digite outro horário (encaixe)
                  </label>
                  <input
                    value={customTime}
                    onChange={(e) => handleCustomTimeChange(e.target.value)}
                    placeholder="Ex.: 20:15"
                    className={cn(fieldClass, customTime && 'border-gold/40')}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Use para encaixar fora dos horários fixos, dentro do expediente do dia.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Observações (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={fieldClass}
                placeholder="Observações sobre o agendamento..."
              />
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loadingOptions}
            className="rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}