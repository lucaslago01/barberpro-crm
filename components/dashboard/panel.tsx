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
  className,
}: {
  icon?: ReactNode
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-5 pt-4 pb-3',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-gold">{icon}</span>}
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
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
