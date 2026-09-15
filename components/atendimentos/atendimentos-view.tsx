'use client'

import { useMemo, useState } from 'react'
import {
  CalendarCheck,
  CircleDollarSign,
  Users,
  Star,
  Search,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Scissors,
  ListChecks,
  BarChart3,
  History,
  MessageSquareQuote,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader, SeeAll } from '@/components/dashboard/panel'
import { UserAvatar } from '@/components/dashboard/user-avatar'
import { ServiceStatusBadge } from '@/components/dashboard/badges'
import {
  serviceStats,
  servicesList,
  serviceStatusFilters,
  topServices,
  revenueByService,
  latestServices,
  recentReviews,
  type ServiceRecord,
  type ServiceStatus,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const statIconMap: Record<string, LucideIcon> = {
  CalendarCheck,
  CircleDollarSign,
  Users,
  Star,
}

const statToneMap: Record<string, string> = {
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
  muted: 'bg-white/5 text-muted-foreground',
}

function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {serviceStats.map((stat) => {
        const Icon = statIconMap[stat.icon]
        const Trend = stat.trendUp ? TrendingUp : TrendingDown
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/30"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-xl',
                  statToneMap[stat.tone],
                )}
              >
                <Icon className="size-5" />
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold',
                  stat.trendUp ? 'text-success' : 'text-danger',
                )}
              >
                <Trend className="size-3.5" />
                {stat.trend}%
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function FakeSelect({ label }: { label: string }) {
  return (
    <button className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-background/40 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="size-4" />
    </button>
  )
}

function RowAction({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <button
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
    >
      <Icon className="size-4" />
    </button>
  )
}

function RatingCell({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums">
      <Star className="size-3.5 fill-gold text-gold" />
      {rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
    </span>
  )
}

function ServiceRow({
  record,
  checked,
  onToggle,
}: {
  record: ServiceRecord
  checked: boolean
  onToggle: () => void
}) {
  return (
    <tr className="group border-t border-border transition-colors hover:bg-white/[0.02]">
      <td className="py-3 pl-4 pr-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Selecionar atendimento de ${record.client}`}
          className="size-4 rounded border-border bg-transparent accent-gold"
        />
      </td>
      <td className="py-3 pr-6">
        <div className="flex items-center gap-3">
          <UserAvatar name={record.client} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{record.client}</p>
            <p className="truncate text-xs text-muted-foreground">
              {record.whatsapp}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-6">
        <span className="inline-flex items-center gap-1.5 text-sm">
          <Scissors className="size-3.5 text-gold/70" />
          {record.service}
        </span>
      </td>
      <td className="hidden py-3 pr-6 md:table-cell">
        <p className="text-sm">{record.date}</p>
        <p className="text-xs text-muted-foreground">{record.time}</p>
      </td>
      <td className="hidden py-3 pr-6 text-sm text-muted-foreground lg:table-cell">
        {record.duration}
      </td>
      <td className="hidden py-3 pr-6 text-sm font-semibold tabular-nums sm:table-cell">
        {currency.format(record.price)}
      </td>
      <td className="py-3 pr-6">
        <ServiceStatusBadge status={record.status} />
      </td>
      <td className="hidden py-3 pr-6 lg:table-cell">
        <span className="inline-flex items-center gap-2 text-sm">
          <UserAvatar name={record.barber} size="sm" />
          {record.barber}
        </span>
      </td>
      <td className="hidden py-3 pr-6 xl:table-cell">
        <RatingCell rating={record.rating} />
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-0.5">
          <RowAction label="Visualizar atendimento" icon={Eye} />
          <RowAction label="Editar" icon={Pencil} />
          <RowAction label="Mais opções" icon={MoreHorizontal} />
        </div>
      </td>
    </tr>
  )
}

function ServicesTable() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ServiceStatus | 'todos'>('todos')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return servicesList.filter((s) => {
      const matchesStatus = status === 'todos' || s.status === status
      const matchesSearch =
        q === '' ||
        s.client.toLowerCase().includes(q) ||
        s.service.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [search, status])

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.id))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allChecked) {
        const next = new Set(prev)
        filtered.forEach((s) => next.delete(s.id))
        return next
      }
      const next = new Set(prev)
      filtered.forEach((s) => next.add(s.id))
      return next
    })
  }

  return (
    <Panel>
      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border p-3">
        {serviceStatusFilters.map((f) => {
          const active = status === f.key
          return (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-gold/12 text-gold'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold',
                  active
                    ? 'bg-gold/20 text-gold'
                    : 'bg-white/5 text-muted-foreground',
                )}
              >
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, serviço ou observação..."
            className="h-10 w-full rounded-lg border border-border bg-background/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/40"
          />
        </div>

        <FakeSelect label="Todos os serviços" />
        <FakeSelect label="Todos os períodos" />
        <FakeSelect label="Mais recentes" />

        <button
          aria-label="Mais filtros"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background/40 text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="size-4" />
        </button>

        <button className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105">
          <Plus className="size-4" />
          Novo atendimento
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5 pl-4 pr-2 font-medium">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Selecionar todos"
                  className="size-4 rounded border-border bg-transparent accent-gold"
                />
              </th>
              <th className="py-2.5 pr-6 font-medium">Cliente</th>
              <th className="py-2.5 pr-6 font-medium">Serviço</th>
              <th className="hidden py-2.5 pr-6 font-medium md:table-cell">
                Data e horário
              </th>
              <th className="hidden py-2.5 pr-6 font-medium lg:table-cell">
                Duração
              </th>
              <th className="hidden py-2.5 pr-6 font-medium sm:table-cell">Valor</th>
              <th className="py-2.5 pr-6 font-medium">Status</th>
              <th className="hidden py-2.5 pr-6 font-medium lg:table-cell">
                Barbeiro
              </th>
              <th className="hidden py-2.5 pr-6 font-medium xl:table-cell">
                Avaliação
              </th>
              <th className="py-2.5 pr-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => (
              <ServiceRow
                key={record.id}
                record={record}
                checked={selected.has(record.id)}
                onToggle={() => toggle(record.id)}
              />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="grid place-items-center gap-2 py-16 text-center">
            <Scissors className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Nenhum atendimento encontrado com esses filtros.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Mostrando 1 a {filtered.length} de 48 atendimentos
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              aria-label="Página anterior"
              className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                className={cn(
                  'grid size-8 place-items-center rounded-lg border text-sm font-medium transition-colors',
                  p === 1
                    ? 'border-gold/40 bg-gold/12 text-gold'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {p}
              </button>
            ))}
            <button
              aria-label="Próxima página"
              className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <FakeSelect label="10 por página" />
        </div>
      </div>
    </Panel>
  )
}

function TopServicesPanel() {
  return (
    <Panel>
      <PanelHeader
        icon={<ListChecks className="size-[18px]" />}
        title="Serviços mais realizados"
        action={<SeeAll />}
      />
      <ul className="space-y-3 px-4 pb-4">
        {topServices.map((s) => (
          <li key={s.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{s.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {s.count}
                <span className="ml-2 text-xs">{s.percent}%</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gold/70"
                style={{ width: `${s.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function RevenueByServicePanel() {
  return (
    <Panel>
      <PanelHeader
        icon={<BarChart3 className="size-[18px]" />}
        title="Faturamento por serviço"
        action={<SeeAll />}
      />
      <ul className="space-y-0.5 px-3 pb-3">
        {revenueByService.map((s) => (
          <li
            key={s.name}
            className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-white/[0.03]"
          >
            <span className="truncate text-muted-foreground">{s.name}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {currency.format(s.value)}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function LatestServicesPanel() {
  const dotMap: Record<ServiceStatus, string> = {
    concluido: 'bg-success',
    em_andamento: 'bg-gold',
    agendado: 'bg-info',
    cancelado: 'bg-danger',
    nao_compareceu: 'bg-muted-foreground/60',
  }
  return (
    <Panel>
      <PanelHeader
        icon={<History className="size-[18px]" />}
        title="Últimos atendimentos"
        action={<SeeAll />}
      />
      <ul className="space-y-0.5 px-3 pb-3">
        {latestServices.map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <div className="relative">
              <UserAvatar name={s.name} size="md" />
              <span
                className={cn(
                  'absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card',
                  dotMap[s.status],
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {s.service} · {currency.format(s.price)}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {s.time}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3',
            i < rating ? 'fill-gold text-gold' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </span>
  )
}

function RecentReviewsPanel() {
  return (
    <Panel>
      <PanelHeader
        icon={<MessageSquareQuote className="size-[18px]" />}
        title="Avaliações recentes"
        action={<SeeAll />}
      />
      <ul className="space-y-0.5 px-3 pb-3">
        {recentReviews.map((r, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={r.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <ReviewStars rating={r.rating} />
              </div>
              <p className="truncate text-xs text-muted-foreground">{r.comment}</p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {r.time}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function AtendimentosView() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
      {/* Main column */}
      <div className="space-y-5">
        <StatCards />
        <ServicesTable />
      </div>

      {/* Insights column */}
      <aside className="space-y-5">
        <TopServicesPanel />
        <RevenueByServicePanel />
        <LatestServicesPanel />
        <RecentReviewsPanel />
      </aside>
    </div>
  )
}
