'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  CalendarClock,
  Clock,
  Ban,
  Trash2,
} from 'lucide-react'
import {
  getAgendaSlotsByDate,
  updateAppointmentNotes,
  updateAppointmentStatus,
} from '@/lib/supabase-data'
import type { AgendaSlot, AppointmentStatus } from '@/lib/types'
import type { AgendaStatus } from '@/lib/data'
import { Panel } from './panel'
import { UserAvatar } from './user-avatar'
import { AgendaStatusBadge } from './badges'
import { EditAppointmentModal } from './edit-appointment-modal'
import { NewAppointmentModal } from './new-appointment-modal'
import { RescheduleModal } from './reschedule-modal'
import { BlocksModal } from './blocks-modal'
import { deleteBlock, getBlocksByDay, type Block } from '@/lib/supabase-blocks'
import { RowActionsMenu } from './row-actions-menu'
import { cn } from '@/lib/utils'

const tabDefs = [
  { key: 'todos', label: 'Todos', status: null },
  { key: 'agendados', label: 'Agendados', status: 'agendado' },
  { key: 'confirmados', label: 'Confirmados', status: 'confirmado' },
  { key: 'atendimento', label: 'Em atendimento', status: 'atendimento' },
  { key: 'concluidos', label: 'Concluídos', status: 'concluido' },
]

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type AgendaProps = {
  date?: Date
  onDateChange?: (date: Date) => void
}

export function Agenda({ date: dateProp, onDateChange }: AgendaProps) {
  const [active, setActive] = useState('todos')
  const [internalDate, setInternalDate] = useState(() => new Date())
  const [slots, setSlots] = useState<AgendaSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<AgendaSlot | null>(null)
  const [reschedulingSlot, setReschedulingSlot] = useState<AgendaSlot | null>(null)
  const [creating, setCreating] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [blocks, setBlocks] = useState<Block[]>([])

  const date = dateProp ?? internalDate
  const dateKey = date.getTime()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [data, dayBlocks] = await Promise.all([
          getAgendaSlotsByDate(new Date(dateKey)),
          getBlocksByDay(new Date(dateKey)).catch(() => [] as Block[]),
        ])
        if (!cancelled) {
          setSlots(data)
          setBlocks(dayBlocks)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Erro ao carregar agendamentos',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [dateKey, reloadKey])

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-agenda-appointments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barberpro_appointments' },
        () => {
          setReloadKey((k) => k + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function changeDay(amount: number) {
    const next = new Date(date)
    next.setDate(next.getDate() + amount)
    if (onDateChange) {
      onDateChange(next)
    } else {
      setInternalDate(next)
    }
  }

  async function handleSaveNotes(notes: string) {
    if (!editingSlot) return
    try {
      await updateAppointmentNotes(editingSlot.id, notes)
      setReloadKey((k) => k + 1)
    } catch (err) {
      console.error('Erro ao salvar observações:', err)
      alert('Não foi possível salvar as observações. Tente de novo.')
      throw err
    }
  }

  async function handleChangeStatus(id: string, status: AppointmentStatus) {
    // Atualização otimista: muda a tela na hora, sincroniza com o banco em seguida
    const previousSlots = slots
    setSlots((current) =>
      current.map((s) => (s.id === id ? { ...s, status } : s))
    )
    try {
      await updateAppointmentStatus(id, status)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setSlots(previousSlots)
      alert('Não foi possível atualizar o status. Tente de novo.')
    }
  }

  async function handleDeleteBlock(id: string) {
    try {
      await deleteBlock(id)
      setReloadKey((k) => k + 1)
    } catch (err) {
      console.error('Erro ao remover bloqueio:', err)
      alert('Não foi possível remover o bloqueio. Tente de novo.')
    }
  }

  const dateLabel = date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const tabs = tabDefs.map((tab) => ({
    ...tab,
    count: tab.status
      ? slots.filter((s) => s.status === tab.status).length
      : slots.length,
  }))

  const activeTab = tabDefs.find((t) => t.key === active)
  const visibleSlots = activeTab?.status
    ? slots.filter((s) => s.status === activeTab.status)
    : slots

  type Row =
    | { kind: 'slot'; time: string; slot: AgendaSlot }
    | { kind: 'block'; time: string; block: Block }

  const rows: Row[] = [
    ...visibleSlots.map((s) => ({ kind: 'slot' as const, time: s.time, slot: s })),
    ...(activeTab?.status
      ? []
      : blocks.map((b) => ({
          kind: 'block' as const,
          time: b.start_time.slice(0, 5),
          block: b,
        }))),
  ].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <Panel className="flex flex-col">
      {editingSlot && (
        <EditAppointmentModal
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onSave={handleSaveNotes}
        />
      )}

      {creating && (
        <NewAppointmentModal
          initialDate={date}
          onClose={() => setCreating(false)}
          onCreated={() => setReloadKey((k) => k + 1)}
        />
      )}

      {reschedulingSlot && (
        <RescheduleModal
          slot={reschedulingSlot}
          currentDate={date}
          onClose={() => setReschedulingSlot(null)}
          onDone={() => setReloadKey((k) => k + 1)}
        />
      )}

      {blocking && (
        <BlocksModal
          date={date}
          onClose={() => setBlocking(false)}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}

      <div className="flex flex-col gap-3 px-5 pt-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="size-5 text-gold" />
          <h2 className="text-lg font-semibold tracking-tight">Agenda de hoje</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background/40 px-1 py-1 text-sm">
            <button
              aria-label="Dia anterior"
              onClick={() => changeDay(-1)}
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="whitespace-nowrap px-1 text-xs font-medium text-muted-foreground">
              {dateLabel}
            </span>
            <button
              aria-label="Próximo dia"
              onClick={() => changeDay(1)}
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button
            onClick={() => setBlocking(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Ban className="size-4" />
            <span className="hidden sm:inline">Bloquear horário</span>
            <span className="sm:hidden">Bloquear</span>
          </button>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo agendamento</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-3 scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              active === tab.key
                ? 'border-gold/40 bg-gold/12 text-gold'
                : 'border-border bg-background/30 text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-semibold',
                active === tab.key
                  ? 'bg-gold/25 text-gold'
                  : 'bg-white/8 text-muted-foreground',
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-2.5 font-medium">Horário</th>
              <th className="py-2.5 pr-6 font-medium">Cliente</th>
              <th className="py-2.5 pr-6 font-medium">Serviço</th>
              <th className="py-2.5 pr-6 font-medium">Duração</th>
              <th className="py-2.5 pr-6 font-medium">Valor</th>
              <th className="py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  Carregando agendamentos...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-red-500">
                  Erro: {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center">
                  <span className="inline-flex items-center gap-2 text-sm italic text-muted-foreground">
                    <Clock className="size-4" />
                    Nenhum agendamento neste dia
                  </span>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                if (row.kind === 'block') {
                  const b = row.block
                  return (
                    <tr
                      key={`block-${b.id}`}
                      className="border-b border-border/60 bg-white/[0.02]"
                    >
                      <td className="px-5 py-3 font-medium tabular-nums">
                        {b.start_time.slice(0, 5)}
                      </td>
                      <td colSpan={5} className="py-3 pr-6">
                        <div className="flex flex-wrap items-center gap-2.5 text-muted-foreground">
                          <span className="grid size-7 place-items-center rounded-full bg-white/5">
                            <Ban className="size-4" />
                          </span>
                          <span className="font-medium">Horário bloqueado</span>
                          <span className="tabular-nums">
                            {b.start_time.slice(0, 5)} às {b.end_time.slice(0, 5)}
                          </span>
                          {b.reason && <span className="italic">· {b.reason}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end text-muted-foreground">
                          <button
                            aria-label="Remover bloqueio"
                            title="Remover bloqueio"
                            onClick={() => handleDeleteBlock(b.id)}
                            className="grid size-7 place-items-center rounded-md hover:bg-white/5 hover:text-danger"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }
                const a = row.slot
                const canReschedule = a.status === 'agendado' || a.status === 'confirmado'
                return (
                  <tr
                    key={a.id}
                    className="border-b border-border/60 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 font-medium tabular-nums">{a.time}</td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={a.client} size="sm" />
                        <span className="whitespace-nowrap font-medium">
                          {a.client}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 text-muted-foreground">
                      {a.service}
                      {a.addonService && (
                        <span className="text-gold"> + {a.addonService}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 text-muted-foreground">
                      {a.duration}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 font-medium tabular-nums">
                      {currency.format(a.price)}
                    </td>
                    <td className="py-3">
                      <AgendaStatusBadge status={a.status as AgendaStatus} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5 text-muted-foreground">
                        <button
                          aria-label="Editar agendamento"
                          onClick={() => setEditingSlot(a)}
                          className="grid size-7 place-items-center rounded-md hover:bg-white/5 hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          aria-label="Reagendar"
                          title={
                            canReschedule
                              ? 'Reagendar'
                              : 'Só é possível reagendar agendamentos Agendados ou Confirmados'
                          }
                          disabled={!canReschedule}
                          onClick={() => setReschedulingSlot(a)}
                          className={cn(
                            'grid size-7 place-items-center rounded-md hover:bg-white/5 hover:text-foreground',
                            !canReschedule &&
                              'cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted-foreground',
                          )}
                        >
                          <CalendarClock className="size-4" />
                        </button>
                        <RowActionsMenu slot={a} onChangeStatus={handleChangeStatus} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}