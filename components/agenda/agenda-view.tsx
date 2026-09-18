'use client'
interface AgendaViewProps {
  slots?: AgendaSlot[]
  onUpdateStatus?: (id: string, status: AgendaStatus) => void
  onUpdateNotes?: (id: string, notes: string) => void
}

import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Pencil,
  CalendarClock,
  Check,
  X,
  UserX,
} from 'lucide-react'
import { Panel } from '@/components/dashboard/panel'
import { UserAvatar } from '@/components/dashboard/user-avatar'
import { AgendaStatusBadge } from '@/components/dashboard/badges'
import { DaySummary } from './day-summary'
import {
  agendaFilters,
  type AgendaSlot,
  type AgendaStatus,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const BASE_DATE = new Date(2025, 8, 15)

const cardAccent: Record<AgendaStatus, string> = {
  agendado: 'border-l-border',
  confirmado: 'border-l-info/60',
  atendimento: 'border-l-gold shadow-[0_0_0_1px_rgba(212,175,55,0.15),0_10px_30px_-18px_rgba(212,175,55,0.6)]',
  concluido: 'border-l-success/60',
  cancelado: 'border-l-danger/60',
  faltou: 'border-l-rose-500/60',
}

const dotColor: Record<AgendaStatus, string> = {
  agendado: 'bg-muted-foreground/50',
  confirmado: 'bg-info',
  atendimento: 'bg-gold',
  concluido: 'bg-success',
  cancelado: 'bg-danger',
  faltou: 'bg-rose-500',
}

function IconAction({
  label,
  icon: Icon,
  tone = 'default',
  disabled,
  onClick,
}: {
  label: string
  icon: typeof Pencil
  tone?: 'default' | 'success' | 'danger' | 'rose'
  disabled?: boolean
  onClick?: () => void
}) {
  const tones = {
    default: 'hover:bg-white/5 hover:text-foreground',
    success: 'hover:bg-success/15 hover:text-success',
    danger: 'hover:bg-danger/15 hover:text-danger',
    rose: 'hover:bg-rose-500/15 hover:text-rose-400',
  }
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors',
        tones[tone],
        disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted-foreground',
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

function EditAppointmentModal({
  slot,
  onClose,
  onSave,
}: {
  slot: AgendaSlot
  onClose: () => void
  onSave: (notes: string) => void
}) {
  const [notes, setNotes] = useState(slot.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(notes)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Editar agendamento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-3 rounded-lg border border-border bg-background/40 px-3 py-2">
          <p className="text-sm font-medium">{slot.client}</p>
          <p className="text-xs text-muted-foreground">
            {slot.service} · {slot.time}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40"
            placeholder="Observações sobre o agendamento..."
          />
        </div>

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
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TimelineRow({
  slot,
  last,
  onUpdateStatus,
  onEdit,
}: {
  slot: AgendaSlot
  last: boolean
  onUpdateStatus?: (id: string, status: AgendaStatus) => void
  onEdit?: (slot: AgendaSlot) => void
}) {
  const muted = slot.status === 'cancelado' || slot.status === 'faltou'

  return (
    <li className="flex gap-3 sm:gap-4">
      {/* Time column */}
      <div className="flex w-12 shrink-0 flex-col items-end pt-3 sm:w-14">
        <span className="text-sm font-semibold tabular-nums">{slot.time}</span>
        {!slot.available && (
          <span className="text-[10px] text-muted-foreground">
            {slot.duration}
          </span>
        )}
      </div>

      {/* Rail */}
      <div className="flex flex-col items-center pt-[18px]">
        <span
          className={cn(
            'size-2.5 shrink-0 rounded-full ring-4 ring-background',
            slot.available ? 'bg-border' : dotColor[slot.status],
          )}
        />
        {!last && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Card */}
      <div className="min-w-0 flex-1 pb-3">
        {slot.available ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/70 bg-transparent px-3.5 py-3">
            <span className="inline-flex items-center gap-2 text-sm italic text-muted-foreground">
              <Clock className="size-4" />
              Horário disponível
            </span>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/20">
              <Plus className="size-3.5" />
              Agendar
            </button>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-xl border border-l-[3px] border-border bg-card/70 px-3.5 py-3 transition-colors hover:bg-white/[0.02]',
              cardAccent[slot.status],
              muted && 'opacity-70',
            )}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <UserAvatar name={slot.client} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'font-medium',
                      muted && 'line-through decoration-muted-foreground/50',
                    )}
                  >
                    {slot.client}
                  </span>
                  <AgendaStatusBadge status={slot.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {slot.service} · {slot.duration}
                </p>
              </div>
              <span className="font-semibold tabular-nums">
                {currency.format(slot.price)}
              </span>
              <div className="flex items-center gap-0.5">
                <IconAction label="Editar" icon={Pencil} onClick={() => onEdit?.(slot)} />
                <IconAction label="Reagendar" icon={CalendarClock} />
                <IconAction
                  label="Marcar como concluído"
                  icon={Check}
                  tone="success"
                  disabled={slot.status === 'concluido'}
                  onClick={() => onUpdateStatus?.(slot.id, 'concluido')}
                />
                <IconAction
                  label="Marcar como faltou"
                  icon={UserX}
                  tone="rose"
                  disabled={slot.status === 'faltou'}
                  onClick={() => onUpdateStatus?.(slot.id, 'faltou')}
                />
                <IconAction
                  label="Cancelar"
                  icon={X}
                  tone="danger"
                  disabled={slot.status === 'cancelado'}
                  onClick={() => onUpdateStatus?.(slot.id, 'cancelado')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}

export function AgendaView({ slots = [], onUpdateStatus, onUpdateNotes }: AgendaViewProps) {
  const [filter, setFilter] = useState<AgendaStatus | 'todos'>('todos')
  const [dayOffset, setDayOffset] = useState(0)
  const [editingSlot, setEditingSlot] = useState<AgendaSlot | null>(null)

  const currentDate = useMemo(() => {
    const d = new Date(BASE_DATE)
    d.setDate(d.getDate() + dayOffset)
    return d
  }, [dayOffset])

  const counts = useMemo(() => {
    const scheduled = slots.filter((a) => !a.available)
    const map: Record<string, number> = { todos: scheduled.length }
    for (const f of agendaFilters) {
      if (f.key === 'todos') continue
      map[f.key] = scheduled.filter((a) => a.status === f.key).length
    }
    return map
  }, [slots])

  const rows = useMemo(() => {
    if (filter === 'todos') return slots
    return slots.filter(
      (a) => !a.available && a.status === filter,
    )
  }, [filter, slots])

  return (
    <div className="space-y-5">
      {editingSlot && (
        <EditAppointmentModal
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onSave={async (notes) => {
            await onUpdateNotes?.(editingSlot.id, notes)
          }}
        />
      )}

      {/* Controls */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background/40 px-1 py-1">
              <button
                aria-label="Dia anterior"
                onClick={() => setDayOffset((o) => o - 1)}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="whitespace-nowrap px-2 text-xs font-medium capitalize text-foreground">
                {dateFmt.format(currentDate)}
              </span>
              <button
                aria-label="Próximo dia"
                onClick={() => setDayOffset((o) => o + 1)}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <button
              onClick={() => setDayOffset(0)}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                dayOffset === 0
                  ? 'border-gold/40 bg-gold/12 text-gold'
                  : 'border-border bg-background/30 text-muted-foreground hover:text-foreground',
              )}
            >
              Hoje
            </button>
          </div>

          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105">
            <Plus className="size-4" />
            Novo agendamento
          </button>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto p-4 scrollbar-thin">
          {agendaFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f.key
                  ? 'border-gold/40 bg-gold/12 text-gold'
                  : 'border-border bg-background/30 text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-semibold',
                  filter === f.key
                    ? 'bg-gold/25 text-gold'
                    : 'bg-white/8 text-muted-foreground',
                )}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {/* Timeline + summary */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel className="p-4 sm:p-5">
          {rows.length === 0 ? (
            <div className="grid place-items-center gap-2 py-16 text-center">
              <Clock className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum agendamento neste filtro.
              </p>
            </div>
          ) : (
            <ol>
              {rows.map((slot, i) => (
                <TimelineRow
                  key={slot.id}
                  slot={slot}
                  last={i === rows.length - 1}
                  onUpdateStatus={onUpdateStatus}
                  onEdit={(s) => setEditingSlot(s)}
                />
              ))}
            </ol>
          )}
        </Panel>

        <DaySummary />
      </div>
    </div>
  )
}
