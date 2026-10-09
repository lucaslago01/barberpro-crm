import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-[oklch(0.195_0.009_300)] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_16px_40px_-24px_rgba(0,0,0,0.7)] transition-shadow duration-300 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_24px_56px_-24px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      {/* Linha de luz sutil no topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      {children}
    </section>
  )
}

export function PanelHeader({
  icon,
  title,
  action,
  count,
  className,
}: {
  icon?: ReactNode
  title: string
  action?: ReactNode
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-5 pt-4 pb-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && <span className="shrink-0 text-gold">{icon}</span>}
        <h2 className="truncate text-[15px] font-semibold tracking-tight">
          {title}
        </h2>
        {count !== undefined && count > 0 && <PanelCount value={count} />}
      </div>
      {action}
    </div>
  )
}

/** Chip com ícone tingido */
export function PanelIcon({
  icon,
  className,
}: {
  icon: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold/25 to-gold/5 text-gold ring-1 ring-gold/20',
        className,
      )}
    >
      {icon}
    </span>
  )
}

/** Contagem ao lado do título do painel */
export function PanelCount({ value }: { value: number }) {
  return (
    <span className="grid min-w-5 place-items-center rounded-full bg-gold/15 px-1.5 text-[11px] font-semibold tabular-nums text-gold ring-1 ring-gold/20">
      {value}
    </span>
  )
}

/** Estado vazio com ícone */
export function PanelEmpty({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid place-items-center gap-2 px-4 py-10 text-center">
      {icon && (
        <span className="grid size-12 place-items-center rounded-full bg-white/[0.03] text-muted-foreground/40 animate-float">
          {icon}
        </span>
      )}
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  )
}

/** Esqueleto de carregamento */
export function PanelRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-1 px-3 pb-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white/5">
            <span className="absolute inset-0 animate-shimmer" />
          </span>
          <div className="flex-1 space-y-1.5">
            <span className="relative block h-3 w-2/5 overflow-hidden rounded bg-white/5">
              <span className="absolute inset-0 animate-shimmer" />
            </span>
            <span className="relative block h-2.5 w-1/4 overflow-hidden rounded bg-white/5">
              <span className="absolute inset-0 animate-shimmer" />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SeeAll({
  children = 'Ver todos',
  onClick,
}: {
  children?: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-gold"
    >
      {children}
      <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}
