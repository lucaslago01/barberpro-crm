'use client'

import { useEffect, useRef, useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { getClients, createClient } from '@/lib/supabase-data'
import {
  getServices,
  getBookedTimes,
  createAppointment,
  type ServiceOption,
} from '@/lib/supabase-appointments'
import { createRecurringAppointment, WEEKDAY_LABELS } from '@/lib/supabase-recurring'
import type { Client } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getDaySlots, isOpenDay } from '@/lib/business-hours'
import { supabase } from '@/lib/supabase'

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
  initialTime,
  onClose,
  onCreated,
}: {
  initialDate: Date
  initialTime?: string
  onClose: () => void
  onCreated: () => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [clientId, setClientId] = useState('')
  const [clientQuery, setClientQuery] = useState('')
  const [showClientList, setShowClientList] = useState(false)
  const clientBoxRef = useRef<HTMLDivElement>(null)

  // Mini-form de cadastro de novo cliente
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [savingNewClient, setSavingNewClient] = useState(false)
  const [newClientError, setNewClientError] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState('')
  const [dateStr, setDateStr] = useState(() => toInputValue(initialDate))
  const [time, setTime] = useState<string | null>(initialTime ?? null)
  const [customTime, setCustomTime] = useState('')
  const [notes, setNotes] = useState('')
  const [isClubVisit, setIsClubVisit] = useState(false)
  const [addonServiceId, setAddonServiceId] = useState('')
  const [clubTouched, setClubTouched] = useState(false)
  const [fixedWeekly, setFixedWeekly] = useState(false)

  const [booked, setBooked] = useState<string[]>([])
  const [bookedReloadKey, setBookedReloadKey] = useState(0)
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

  // Busca horários ocupados sempre que a data muda ou algo é atualizado em tempo real
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
  }, [dateStr, bookedReloadKey])

  // Realtime: qualquer agendamento ou bloqueio novo recarrega os horários ocupados
  useEffect(() => {
    const channel = supabase
      .channel('new-appointment-modal-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barberpro_appointments' },
        () => setBookedReloadKey((k) => k + 1)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barberpro_blocks' },
        () => setBookedReloadKey((k) => k + 1)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const selectedService = services.find((s) => s.id === serviceId)
  const selectedClient = clients.find((c) => c.id === clientId)
  const addonOptions = services.filter((s) => s.name.toLowerCase().includes('sobrancelha') && s.id !== serviceId)
  const selectedAddon = addonOptions.find((s) => s.id === addonServiceId)

  const isAddonOnlyService = Boolean(selectedService?.name.toLowerCase().includes('sobrancelha'))

  useEffect(() => {
    if (!clubTouched) {
      setIsClubVisit(Boolean(selectedClient?.club_plan) && !isAddonOnlyService)
    }
  }, [clientId, serviceId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAddonOnlyService && isClubVisit) {
      setIsClubVisit(false)
    }
  }, [isAddonOnlyService]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fecha a lista de clientes ao clicar fora do campo de busca
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

  const filteredClients = (() => {
    const q = clientQuery.trim().toLowerCase()
    if (!q || clientQuery === (selectedClient ? clientLabel(selectedClient) : '')) return clients
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q),
    )
  })()

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

  const selectedWeekday = (() => {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).getDay()
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

  function openNewClientForm() {
    // Pré-preenche o nome com o que o usuário já digitou
    setNewClientName(clientQuery.trim())
    setNewClientPhone('')
    setNewClientEmail('')
    setNewClientError(null)
    setShowClientList(false)
    setShowNewClientForm(true)
  }

  function cancelNewClientForm() {
    setShowNewClientForm(false)
    setNewClientName('')
    setNewClientPhone('')
    setNewClientEmail('')
    setNewClientError(null)
  }

  async function handleCreateNewClient() {
    if (!newClientName.trim()) {
      setNewClientError('Nome é obrigatório.')
      return
    }
    setSavingNewClient(true)
    setNewClientError(null)
    try {
      const created = await createClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || undefined,
        email: newClientEmail.trim() || undefined,
      })
      // Adiciona o novo cliente à lista local e seleciona
      setClients((prev) => [created, ...prev])
      selectClient(created)
      setShowNewClientForm(false)
      setNewClientName('')
      setNewClientPhone('')
      setNewClientEmail('')
    } catch (err) {
      setNewClientError(err instanceof Error ? err.message : 'Erro ao cadastrar cliente.')
    } finally {
      setSavingNewClient(false)
    }
  }

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

      if (fixedWeekly) {
        await createRecurringAppointment({
          clientId,
          serviceId,
          weekday: new Date(y, m - 1, d).getDay(),
          time: effectiveTime,
          notes,
          isClubVisit,
          addonServiceId: addonServiceId || null,
          addonPrice: selectedAddon?.price || 0,
        })
      } else {
        const dateTime = new Date(y, m - 1, d, h, min).toISOString()
        await createAppointment({
          clientId,
          serviceId,
          dateTime,
          notes,
          isClubVisit,
          addonServiceId: addonServiceId || null,
          addonPrice: selectedAddon?.price || 0,
        })
      }
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
    <div data-modal-overlay className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-gradient-to-b from-card to-[oklch(0.19_0.009_300)] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_oklch(0.62_0.19_305/10%)] animate-scale-in before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gold/50 before:to-transparent">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Novo agendamento</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-white/5 hover:text-gold active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>

        {loadingOptions ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="space-y-4">
            <div ref={clientBoxRef} className="relative">
              <label className="mb-1 block text-xs text-muted-foreground">Cliente</label>
              <input
                type="text"
                value={clientQuery}
                onChange={(e) => {
                  setClientQuery(e.target.value)
                  setShowClientList(true)
                  if (clientId) setClientId('')
                  if (showNewClientForm) setShowNewClientForm(false)
                }}
                onFocus={() => { setShowClientList(true); setShowNewClientForm(false) }}
                placeholder="Buscar por nome ou telefone..."
                className={fieldClass}
                autoComplete="off"
              />
              {showClientList && !showNewClientForm && (
                <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {/* Botão de cadastro — sempre visível no topo do dropdown */}
                  <button
                    type="button"
                    onClick={openNewClientForm}
                    className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm font-medium text-purple-400 hover:bg-white/5"
                  >
                    <UserPlus className="size-3.5" />
                    Cadastrar novo cliente
                  </button>
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClient(c)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-white/5"
                    >
                      {c.name}
                      {c.phone ? ` · ${c.phone}` : ''}
                    </button>
                  ))}
                </div>
              )}

              {/* Mini-formulário de cadastro inline */}
              {showNewClientForm && (
                <div className="mt-2 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 space-y-2">
                  <p className="text-xs font-medium text-purple-400">Novo cliente</p>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nome *"
                    className={fieldClass}
                    autoFocus
                  />
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Telefone (opcional)"
                    className={fieldClass}
                  />
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="E-mail (opcional)"
                    className={fieldClass}
                  />
                  {newClientError && (
                    <p className="text-xs text-red-500">{newClientError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelNewClientForm}
                      className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewClient}
                      disabled={savingNewClient}
                      className="flex-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                    >
                      {savingNewClient ? 'Salvando...' : 'Salvar cliente'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Serviço</label>
              <select
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value)
                  if (e.target.value === addonServiceId) setAddonServiceId('')
                }}
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
                  {isAddonOnlyService
                    ? 'Sobrancelha é sempre cobrada avulsa, mesmo para clientes do clube.'
                    : 'Não cobra o serviço base (já incluso na mensalidade), só os extras.'}
                  {selectedClient?.club_plan && !isAddonOnlyService ? ' Cliente é assinante do clube.' : ''}
                </p>
              </div>
              <input
                id="club-visit-checkbox"
                type="checkbox"
                checked={isClubVisit}
                disabled={isAddonOnlyService}
                onChange={(e) => {
                  setClubTouched(true)
                  setIsClubVisit(e.target.checked)
                }}
                className="size-4 shrink-0 accent-gold disabled:cursor-not-allowed disabled:opacity-40"
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

            <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5">
              <div>
                <label htmlFor="fixed-weekly-checkbox" className="text-sm font-medium">
                  Horário fixo
                </label>
                <p className="text-[11px] text-muted-foreground">
                  {selectedWeekday !== null
                    ? `Repete toda ${WEEKDAY_LABELS[selectedWeekday].toLowerCase()} nesse horário, a partir de agora. Risca sozinho no agendar.`
                    : 'Escolha a data para ver em qual dia da semana vai repetir.'}
                </p>
              </div>
              <input
                id="fixed-weekly-checkbox"
                type="checkbox"
                checked={fixedWeekly}
                onChange={(e) => setFixedWeekly(e.target.checked)}
                className="size-4 shrink-0 accent-gold"
              />
            </div>

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
            className="rounded-lg btn-gold-glow px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Salvando...' : fixedWeekly ? 'Fixar horário' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}