'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { getBookedTimes, rescheduleAppointment } from '@/lib/supabase-appointments'
import { getDaySlots, isOpenDay } from '@/lib/business-hours'
import type { AgendaSlot } from '@/lib/types'
import { cn } from '@/lib/utils'

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

export function RescheduleModal({
  slot,
  currentDate,
  onClose,
  onDone,
}: {
  slot: AgendaSlot
  currentDate: Date
  onClose: () => void
  onDone: () => void
}) {
  const [dateStr, setDateStr] = useState(() => toInputValue(currentDate))
  const [time, setTime] = useState<string | null>(null)
  const [customTime, setCustomTime] = useState('')
  const [booked, setBooked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  const originalDateStr = toInputValue(currentDate)

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

  function isPast(slotTime: string) {
    if (!dateStr) return false
    const [y, m, d] = dateStr.split('-').map(Number)
    const [h, min] = slotTime.split(':').map(Number)
    return new Date(y, m - 1, d, h, min).getTime() < Date.now()
  }

  function isTaken(slotTime: string) {
    // O horário atual do próprio agendamento não conta como ocupado
    const isOwnSlot = dateStr === originalDateStr && slotTime === slot.time
    return booked.includes(slotTime) && !isOwnSlot
  }

  function chooseSlot(slotTime: string) {
    setTime(slotTime)
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
      const dateTime = new Date(y, m - 1, d, h, min).toISOString()

      await rescheduleAppointment(slot.id, dateTime)
      onDone()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reagendar')
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
          <h3 className="text-base font-semibold">Reagendar</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-background/40 px-3 py-2">
          <p className="text-sm font-medium">{slot.client}</p>
          <p className="text-xs text-muted-foreground">
            {slot.service} · atualmente às {slot.time}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nova data</label>
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
              <label className="mb-1 block text-xs text-muted-foreground">Novo horário</label>
              <div className="grid grid-cols-5 gap-1.5">
                {daySlots.map((t) => {
                  const unavailable = isTaken(t) || isPast(t)
                  const selected = t === time && !customTime
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={unavailable}
                      onClick={() => chooseSlot(t)}
                      className={cn(
                        'h-9 rounded-lg border text-xs font-medium transition-colors',
                        selected
                          ? 'border-gold bg-gold text-primary-foreground'
                          : unavailable
                            ? 'cursor-not-allowed border-border/40 text-muted-foreground/40 line-through'
                            : 'border-border hover:bg-white/5',
                      )}
                    >
                      {t}
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
        </div>

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
            disabled={saving}
            className="rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Reagendar'}
          </button>
        </div>
      </div>
    </div>
  )
}