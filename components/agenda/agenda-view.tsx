'use client'

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
  TriangleAlert,
  ChevronDown,
} from 'lucide-react'
import { Panel } from '@/components/dashboard/panel'
import { UserAvatar } from '@/components/dashboard/user-avatar'
import { AgendaStatusBadge } from '@/components/dashboard/badges'
import { NewAppointmentModal } from '@/components/dashboard/new-appointment-modal'
import { RescheduleModal } from '@/components/dashboard/reschedule-modal'
import { DaySummary, DaySummaryCompact } from './day-summary'
import {
  agendaFilters,
  type AgendaStatus,
} from '@/lib/data'
import type { AgendaSlot } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AgendaViewProps {
  slots?: AgendaSlot[]
  date?: Date
  onDateChange?: (date: Date) => void
  onReload?: () => void
  onUpdateStatus?: (id: string, status: AgendaStatus) => void
  onUpdateNotes?: (id: string, notes: string) => void
}

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

const dateShortFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

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
        'grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors sm:size-8',
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
      <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
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
  onReschedule,
  onSchedule,
}: {
  slot: AgendaSlot
  last: boolean
  onUpdateStatus?: (id: string, status: AgendaStatus) => void
  onEdit?: (slot: AgendaSlot) => void
  onReschedule?: (slot: AgendaSlot) => void
  onSchedule?: (slot: AgendaSlot) => void
}) {
  const muted = slot.status === 'cancelado' || slot.status === 'faltou'
  const canReschedule = slot.status === 'agendado' || slot.status === 'confirmado'

  return (
    <li className="flex gap-3 sm:gap-4">
      {/* Time column */}
      <div className="flex w-12 shrink-0 flex-col items-end pt-3 sm:w-14">
        <span className="text-sm font-semibold tabular-nums">{slot.time}</span>
        {!slot.available && (
          <span className="whitespace-nowrap text-[10px] text-muted-foreground">
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
            <button
              onClick={() => onSchedule?.(slot)}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
            >
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
              <div className="min-w-0 flex-1 basis-32">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
              <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums">
                {currency.format(slot.price)}
              </span>
              <div className="flex basis-full items-center justify-between border-t border-border/60 pt-2 sm:basis-auto sm:justify-start sm:gap-0.5 sm:border-0 sm:pt-0">
                <IconAction label="Editar" icon={Pencil} onClick={() => onEdit?.(slot)} />
                <IconAction
                  label={
                    canReschedule
                      ? 'Reagendar'
                      : 'Só é possível reagendar agendamentos Agendados ou Confirmados'
                  }
                  icon={CalendarClock}
                  disabled={!canReschedule}
                  onClick={() => onReschedule?.(slot)}
                />
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

/* ---------- Confirmação de ação destrutiva ---------- */

type PendingAction = { slot: AgendaSlot; status: Extract<AgendaStatus, 'cancelado' | 'faltou'> }

function ConfirmStatusModal({
  action,
  onClose,
  onConfirm,
}: {
  action: PendingAction
  onClose: () => void
  onConfirm: () => void
}) {
  const isCancel = action.status === 'cancelado'
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-2 text-base font-semibold">
          {isCancel ? 'Cancelar agendamento' : 'Marcar como faltou'}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {isCancel
            ? 'O horário volta a ficar livre na agenda.'
            : 'O atendimento fica registrado como falta do cliente.'}
        </p>

        <div className="mb-5 rounded-lg border border-border bg-background/40 px-3 py-2">
          <p className="text-sm font-medium">{action.slot.client}</p>
          <p className="text-xs text-muted-foreground">
            {action.slot.service} · {action.slot.time}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-3.5 text-sm text-muted-foreground hover:text-foreground sm:h-auto sm:py-2"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'h-11 rounded-lg px-3.5 text-sm font-semibold text-white hover:brightness-105 sm:h-auto sm:py-2',
              isCancel ? 'bg-danger' : 'bg-rose-500',
            )}
          >
            {isCancel ? 'Cancelar agendamento' : 'Marcar como faltou'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Celular: card compacto ---------- */

const statusLabel: Record<AgendaStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  atendimento: 'Em atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function durationMinutes(duration: string) {
  const n = parseInt(duration, 10)
  return Number.isFinite(n) && n > 0 ? n : 30
}

function formatMinutes(total: number) {
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Para cada agendamento ativo, guarda o horário do outro com o qual ele se sobrepõe
function findConflicts(slots: AgendaSlot[]) {
  const active = slots.filter(
    (a) => !a.available && a.status !== 'cancelado' && a.status !== 'faltou',
  )
  const map = new Map<string, string>()
  for (const a of active) {
    const aStart = toMinutes(a.time)
    const aEnd = aStart + durationMinutes(a.duration)
    for (const b of active) {
      if (a.id === b.id) continue
      const bStart = toMinutes(b.time)
      const bEnd = bStart + durationMinutes(b.duration)
      if (aStart < bEnd && bStart < aEnd) {
        map.set(a.id, b.time)
        break
      }
    }
  }
  return map
}

type MobileItem =
  | { type: 'appointment'; slot: AgendaSlot }
  | { type: 'free'; slots: AgendaSlot[] }

// Junta horários livres seguidos numa linha só
function groupForMobile(rows: AgendaSlot[]): MobileItem[] {
  const items: MobileItem[] = []
  for (const slot of rows) {
    if (slot.available) {
      const last = items[items.length - 1]
      if (last && last.type === 'free') last.slots.push(slot)
      else items.push({ type: 'free', slots: [slot] })
    } else {
      items.push({ type: 'appointment', slot })
    }
  }
  return items
}

function ActionButton({
  label,
  icon: Icon,
  tone = 'default',
  disabled,
  onClick,
  className,
}: {
  label: string
  icon: typeof Pencil
  tone?: 'default' | 'success' | 'danger' | 'rose'
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  const tones = {
    default: 'border-border text-foreground hover:bg-white/5',
    success: 'border-success/40 bg-success/15 text-success hover:bg-success/25',
    danger: 'border-danger/30 text-danger hover:bg-danger/10',
    rose: 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
        tones[tone],
        disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
        className,
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

function MobileAppointmentCard({
  slot,
  conflictWith,
  expanded,
  onToggle,
  onUpdateStatus,
  onEdit,
  onReschedule,
}: {
  slot: AgendaSlot
  conflictWith?: string
  expanded: boolean
  onToggle: () => void
  onUpdateStatus?: (id: string, status: AgendaStatus) => void
  onEdit?: (slot: AgendaSlot) => void
  onReschedule?: (slot: AgendaSlot) => void
}) {
  const muted = slot.status === 'cancelado' || slot.status === 'faltou'
  const canReschedule = slot.status === 'agendado' || slot.status === 'confirmado'
  const end = formatMinutes(toMinutes(slot.time) + durationMinutes(slot.duration))

  return (
    <li
      className={cn(
        'rounded-xl border border-l-[3px] border-border bg-card/70',
        cardAccent[slot.status],
        muted && 'opacity-70',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <div className="w-11 shrink-0">
          <p className="text-sm font-semibold tabular-nums">{slot.time}</p>
          <p className="text-[10px] tabular-nums text-muted-foreground">até {end}</p>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm font-medium',
              muted && 'line-through decoration-muted-foreground/50',
            )}
          >
            {slot.client}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {slot.service}
            {slot.addonService ? ` + ${slot.addonService}` : ''}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">{currency.format(slot.price)}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={cn('size-1.5 rounded-full', dotColor[slot.status])} />
            {statusLabel[slot.status]}
          </p>
        </div>

        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {conflictWith && (
        <p className="flex items-center gap-1.5 px-3 pb-2.5 text-[11px] font-medium text-warning">
          <TriangleAlert className="size-3.5 shrink-0" />
          Sobrepõe o agendamento das {conflictWith}
        </p>
      )}

      {expanded && (
        <div className="border-t border-border/60 px-3 pb-3 pt-3">
          {slot.notes && (
            <p className="mb-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
              {slot.notes}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              label="Concluir atendimento"
              icon={Check}
              tone="success"
              className="col-span-2"
              disabled={slot.status === 'concluido'}
              onClick={() => onUpdateStatus?.(slot.id, 'concluido')}
            />
            <ActionButton
              label="Reagendar"
              icon={CalendarClock}
              disabled={!canReschedule}
              onClick={() => onReschedule?.(slot)}
            />
            <ActionButton label="Editar" icon={Pencil} onClick={() => onEdit?.(slot)} />
            <ActionButton
              label="Faltou"
              icon={UserX}
              tone="rose"
              disabled={slot.status === 'faltou'}
              onClick={() => onUpdateStatus?.(slot.id, 'faltou')}
            />
            <ActionButton
              label="Cancelar"
              icon={X}
              tone="danger"
              disabled={slot.status === 'cancelado'}
              onClick={() => onUpdateStatus?.(slot.id, 'cancelado')}
            />
          </div>
        </div>
      )}
    </li>
  )
}

const FREE_PREVIEW = 6

function MobileFreeGroup({
  slots,
  onSchedule,
}: {
  slots: AgendaSlot[]
  onSchedule: (slot: AgendaSlot) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? slots : slots.slice(0, FREE_PREVIEW)
  const hidden = slots.length - visible.length

  return (
    <li className="rounded-xl border border-dashed border-border/70 px-3 py-2.5">
      <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" />
        {slots.length === 1 ? '1 horário livre' : `${slots.length} horários livres`}
        <span className="text-muted-foreground/60">· toque para agendar</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((s) => (
          <button
            key={s.id}
            onClick={() => onSchedule(s)}
            className="h-9 min-w-14 rounded-lg border border-gold/30 bg-gold/10 px-2.5 text-xs font-semibold tabular-nums text-gold transition-colors hover:bg-gold/20"
          >
            {s.time}
          </button>
        ))}
        {hidden > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="h-9 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            +{hidden}
          </button>
        )}
      </div>
    </li>
  )
}

export function AgendaView({
  slots = [],
  date: dateProp,
  onDateChange,
  onReload,
  onUpdateStatus,
  onUpdateNotes,
}: AgendaViewProps) {
  const [filter, setFilter] = useState<AgendaStatus | 'todos'>('todos')
  const [internalDate, setInternalDate] = useState(() => new Date())
  const [editingSlot, setEditingSlot] = useState<AgendaSlot | null>(null)
  const [reschedulingSlot, setReschedulingSlot] = useState<AgendaSlot | null>(null)
  const [creating, setCreating] = useState(false)
  const [creatingTime, setCreatingTime] = useState<string | undefined>()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const currentDate = dateProp ?? internalDate
  const isToday = isSameDay(currentDate, new Date())

  function setDate(next: Date) {
    if (onDateChange) {
      onDateChange(next)
    } else {
      setInternalDate(next)
    }
  }

  function shiftDay(amount: number) {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + amount)
    setDate(next)
  }

  const counts = useMemo(() => {
    const scheduled = slots.filter((a) => !a.available)
    const map: Record<string, number> = { todos: scheduled.length }
    for (const f of agendaFilters) {
      if (f.key === 'todos') continue
      map[f.key] = scheduled.filter((a) => a.status === f.key).length
    }
    return map
  }, [slots])

  // Cancelar e faltou passam pela confirmação; os demais aplicam direto
  function requestStatus(slot: AgendaSlot, status: AgendaStatus) {
    if (status === 'cancelado' || status === 'faltou') {
      setPendingAction({ slot, status })
      return
    }
    setExpandedId(null)
    onUpdateStatus?.(slot.id, status)
  }

  const conflicts = useMemo(() => findConflicts(slots), [slots])

  const rows = useMemo(() => {
    if (filter === 'todos') return slots
    return slots.filter(
      (a) => !a.available && a.status === filter,
    )
  }, [filter, slots])

  const mobileItems = useMemo(() => groupForMobile(rows), [rows])

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

      {pendingAction && (
        <ConfirmStatusModal
          action={pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={() => {
            onUpdateStatus?.(pendingAction.slot.id, pendingAction.status)
            setPendingAction(null)
            setExpandedId(null)
          }}
        />
      )}

      {creating && (
        <NewAppointmentModal
          initialDate={currentDate}
          initialTime={creatingTime}
          onClose={() => {
            setCreating(false)
            setCreatingTime(undefined)
          }}
          onCreated={() => onReload?.()}
        />
      )}

      {reschedulingSlot && (
        <RescheduleModal
          slot={reschedulingSlot}
          currentDate={currentDate}
          onClose={() => setReschedulingSlot(null)}
          onDone={() => onReload?.()}
        />
      )}

      {/* Controls */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-lg border border-border bg-background/40 px-1 py-1 sm:flex-none">
              <button
                aria-label="Dia anterior"
                onClick={() => shiftDay(-1)}
                className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-0 truncate px-1 text-center text-xs font-medium capitalize text-foreground sm:px-2">
                <span className="hidden sm:inline">{dateFmt.format(currentDate)}</span>
                <span className="sm:hidden">{dateShortFmt.format(currentDate)}</span>
              </span>
              <button
                aria-label="Próximo dia"
                onClick={() => shiftDay(1)}
                className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <button
              onClick={() => setDate(new Date())}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                isToday
                  ? 'border-gold/40 bg-gold/12 text-gold'
                  : 'border-border bg-background/30 text-muted-foreground hover:text-foreground',
              )}
            >
              Hoje
            </button>
          </div>

          <button
            onClick={() => {
              setCreatingTime(undefined)
              setCreating(true)
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 sm:w-auto sm:py-2"
          >
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

      <DaySummaryCompact slots={slots} />

      {/* Timeline + summary */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel className="p-3 sm:p-5">
          {rows.length === 0 ? (
            <div className="grid place-items-center gap-2 py-16 text-center">
              <Clock className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum agendamento neste dia ou filtro.
              </p>
            </div>
          ) : (
            <>
            {/* Celular: cards compactos, horários livres agrupados */}
            <ul className="space-y-2 md:hidden">
              {mobileItems.map((item, i) =>
                item.type === 'free' ? (
                  <MobileFreeGroup
                    key={`free-${i}`}
                    slots={item.slots}
                    onSchedule={(s) => {
                      setCreatingTime(s.time)
                      setCreating(true)
                    }}
                  />
                ) : (
                  <MobileAppointmentCard
                    key={item.slot.id}
                    slot={item.slot}
                    conflictWith={conflicts.get(item.slot.id)}
                    expanded={expandedId === item.slot.id}
                    onToggle={() =>
                      setExpandedId((cur) => (cur === item.slot.id ? null : item.slot.id))
                    }
                    onUpdateStatus={(_id, status) => requestStatus(item.slot, status)}
                    onEdit={(s) => setEditingSlot(s)}
                    onReschedule={(s) => setReschedulingSlot(s)}
                  />
                ),
              )}
            </ul>

            <ol className="hidden md:block">
              {rows.map((slot, i) => (
                <TimelineRow
                  key={slot.id}
                  slot={slot}
                  last={i === rows.length - 1}
                  onUpdateStatus={(_id, status) => requestStatus(slot, status)}
                  onEdit={(s) => setEditingSlot(s)}
                  onReschedule={(s) => setReschedulingSlot(s)}
                  onSchedule={(s) => {
                    setCreatingTime(s.time)
                    setCreating(true)
                  }}
                />
              ))}
            </ol>
            </>
          )}
        </Panel>

        <div className="hidden md:block">
          <DaySummary slots={slots} />
        </div>
      </div>
    </div>
  )
}