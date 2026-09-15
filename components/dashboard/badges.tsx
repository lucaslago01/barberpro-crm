import {
  Check,
  Clock,
  X,
  CircleCheck,
  CalendarClock,
  Scissors,
  UserX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  AppointmentStatus,
  ClientTag,
  ClientStatus,
  RecoverStatus,
  AgendaStatus,
} from '@/lib/data'

const statusConfig: Record<
  AppointmentStatus,
  { label: string; className: string; icon: typeof Check }
> = {
  atendido: {
    label: 'Atendido',
    className: 'text-success bg-success/12 border-success/25',
    icon: CircleCheck,
  },
  confirmado: {
    label: 'Confirmado',
    className: 'text-info bg-info/12 border-info/25',
    icon: Check,
  },
  pendente: {
    label: 'Pendente',
    className: 'text-warning bg-warning/12 border-warning/25',
    icon: Clock,
  },
  cancelado: {
    label: 'Cancelado',
    className: 'text-danger bg-danger/12 border-danger/25',
    icon: X,
  },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className, icon: Icon } = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        className,
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}

const tagConfig: Record<ClientTag, string> = {
  vip: 'text-gold bg-gold/12 border-gold/30',
  ativo: 'text-success bg-success/12 border-success/25',
  'em risco': 'text-warning bg-warning/12 border-warning/25',
}

export function ClientTagBadge({ tag }: { tag: ClientTag }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize',
        tagConfig[tag],
      )}
    >
      {tag === 'vip' && <span className="text-gold">★</span>}
      {tag === 'vip' ? 'VIP' : tag}
    </span>
  )
}

const clientStatusConfig: Record<
  ClientStatus,
  { label: string; className: string; dot: string }
> = {
  ativo: {
    label: 'Ativo',
    className: 'text-success bg-success/12 border-success/25',
    dot: 'bg-success',
  },
  vip: {
    label: 'VIP',
    className: 'text-gold bg-gold/12 border-gold/30',
    dot: 'bg-gold',
  },
  'em risco': {
    label: 'Em risco',
    className: 'text-danger bg-danger/12 border-danger/25',
    dot: 'bg-danger',
  },
  inativo: {
    label: 'Inativo',
    className: 'text-muted-foreground bg-white/5 border-border',
    dot: 'bg-muted-foreground/60',
  },
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, className, dot } = clientStatusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

const agendaStatusConfig: Record<
  AgendaStatus,
  { label: string; className: string; icon: typeof Check; pulse?: boolean }
> = {
  agendado: {
    label: 'Agendado',
    className: 'text-foreground/70 bg-white/5 border-border',
    icon: CalendarClock,
  },
  confirmado: {
    label: 'Confirmado',
    className: 'text-info bg-info/12 border-info/25',
    icon: Check,
  },
  atendimento: {
    label: 'Em atendimento',
    className: 'text-gold bg-gold/12 border-gold/30',
    icon: Scissors,
    pulse: true,
  },
  concluido: {
    label: 'Concluído',
    className: 'text-success bg-success/12 border-success/25',
    icon: CircleCheck,
  },
  cancelado: {
    label: 'Cancelado',
    className: 'text-danger bg-danger/12 border-danger/25',
    icon: X,
  },
  faltou: {
    label: 'Faltou',
    className: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    icon: UserX,
  },
}

export function AgendaStatusBadge({ status }: { status: AgendaStatus }) {
  const { label, className, icon: Icon, pulse } = agendaStatusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        className,
      )}
    >
      {pulse ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold/70" />
          <span className="relative inline-flex size-2 rounded-full bg-gold" />
        </span>
      ) : (
        <Icon className="size-3.5" />
      )}
      {label}
    </span>
  )
}

const recoverConfig: Record<RecoverStatus, string> = {
  perdido: 'text-danger bg-danger/12 border-danger/25',
  'em risco': 'text-warning bg-warning/12 border-warning/25',
}

export function RecoverBadge({ status }: { status: RecoverStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize',
        recoverConfig[status],
      )}
    >
      {status}
    </span>
  )
}
