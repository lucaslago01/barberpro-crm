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
        'rounded-2xl border border-border bg-card shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_16px_40px_-24px_rgba(0,0,0,0.7)]',
        className,
      )}
    >
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
        <h2 className="truncate text-[15px] font-semibold tracking-tight">{title}</h2>
        {count !== undefined && count > 0 && <PanelCount value={count} />}
      </div>
      {action}
    </div>
  )
}

/** Contagem ao lado do título do painel */
export function PanelCount({ value }: { value: number }) {
  return (
    <span className="grid min-w-5 place-items-center rounded-full bg-white/[0.07] px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
      {value}
    </span>
  )
}

/** Estado vazio com ícone, no lugar de uma linha de texto solta */
export function PanelEmpty({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid place-items-center gap-2 px-4 py-8 text-center">
      {icon && <span className="text-muted-foreground/40">{icon}</span>}
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  )
}

/** Esqueleto de carregamento no formato das linhas reais */
export function PanelRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-1 px-3 pb-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <span className="size-9 shrink-0 animate-pulse rounded-full bg-white/5" />
          <div className="flex-1 space-y-1.5">
            <span className="block h-3 w-2/5 animate-pulse rounded bg-white/5" />
            <span className="block h-2.5 w-1/4 animate-pulse rounded bg-white/5" />
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
      className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-gold"
    >
      {children}
      <ChevronRight className="size-3.5" />
    </button>
  )
}
