import {
  CalendarCheck,
  CircleDollarSign,
  Users,
  Star,
  UserPlus,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import { kpis } from '@/lib/data'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  CalendarCheck,
  CircleDollarSign,
  Users,
  Star,
  UserPlus,
}

export function KpiCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon]
        const Trend = kpi.trendUp ? TrendingUp : TrendingDown
        return (
          <div
            key={kpi.label}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/30"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid size-10 place-items-center rounded-xl bg-gold/12 text-gold">
                <Icon className="size-5" />
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold',
                  kpi.trendUp ? 'text-success' : 'text-danger',
                )}
              >
                <Trend className="size-3.5" />
                {kpi.trend}%
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        )
      })}
    </div>
  )
}
