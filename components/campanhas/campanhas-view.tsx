'use client'

import { useMemo, useState } from 'react'
import {
  Send,
  MessageCircle,
  Users,
  Crown,
  Scissors,
  Cake,
  Clock,
  Sparkles,
  CalendarClock,
  Gift,
  CircleCheck,
  Eye,
  CalendarCheck,
  Search,
  ChevronDown,
  Pencil,
  Copy,
  MoreHorizontal,
  Lightbulb,
  ChevronRight,
  BarChart3,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import { CampaignStatusBadge } from '@/components/dashboard/badges'
import {
  campaignStats,
  campaignFilters,
  campaigns,
  suggestedCampaigns,
  campaignPerformance,
  campaignDailyResponses,
  type Campaign,
  type CampaignStatus,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  Send,
  MessageCircle,
  Users,
  Crown,
  Scissors,
  Cake,
  Clock,
  Sparkles,
  CalendarClock,
  Gift,
  CircleCheck,
  Eye,
  CalendarCheck,
}

const statToneMap: Record<string, string> = {
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
  muted: 'bg-white/5 text-muted-foreground',
}

/* ---------- Summary cards ---------- */

function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {campaignStats.map((stat) => {
        const Icon = iconMap[stat.icon]
        const Trend = stat.trendUp ? TrendingUp : TrendingDown
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_16px_40px_-24px_rgba(0,0,0,0.7)] transition-colors hover:border-gold/30"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'grid size-11 place-items-center rounded-xl',
                  statToneMap[stat.tone],
                )}
              >
                <Icon className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight sm:text-[1.7rem]">
              {stat.value}
            </p>
            <p
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
                stat.trendUp ? 'text-success' : 'text-danger',
              )}
            >
              <Trend className="size-3.5" />+{stat.trend}%
              <span className="text-muted-foreground">
                em relação ao mês anterior
              </span>
            </p>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Row actions ---------- */

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

/* ---------- Campaign row ---------- */

function CampaignRow({
  campaign,
  selected,
  onSelect,
}: {
  campaign: Campaign
  selected: boolean
  onSelect: () => void
}) {
  const Icon = iconMap[campaign.icon] ?? Scissors
  return (
    <tr
      onClick={onSelect}
      className={cn(
        'group cursor-pointer border-t border-border transition-colors hover:bg-white/[0.02]',
        selected && 'bg-gold/[0.04]',
      )}
    >
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/12 text-gold">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{campaign.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {campaign.description}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden py-3 pr-4 text-sm text-muted-foreground md:table-cell">
        {campaign.audience}
      </td>
      <td className="hidden py-3 pr-4 text-sm text-muted-foreground tabular-nums lg:table-cell">
        <div>{campaign.sendDate}</div>
        <div className="text-xs text-muted-foreground/70">{campaign.sendTime}</div>
      </td>
      <td className="hidden py-3 pr-4 text-sm font-medium tabular-nums sm:table-cell">
        {campaign.sent.toLocaleString('pt-BR')}
      </td>
      <td className="py-3 pr-4 text-sm tabular-nums">
        <div className="font-semibold">{campaign.responses}</div>
        <div className="text-xs font-medium text-success">
          ({campaign.responseRate}%)
        </div>
      </td>
      <td className="py-3 pr-4">
        <CampaignStatusBadge status={campaign.status} />
      </td>
      <td className="py-3 pl-2 pr-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-0.5">
          <RowAction label="Visualizar" icon={Eye} />
          <RowAction label="Editar" icon={Pencil} />
          <RowAction label="Duplicar" icon={Copy} />
          <RowAction label="Mais opções" icon={MoreHorizontal} />
        </div>
      </td>
    </tr>
  )
}

/* ---------- Campaigns table ---------- */

function FakeSelect({ label }: { label: string }) {
  return (
    <button className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-background/40 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="size-4" />
    </button>
  )
}

function CampaignsTable({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (c: Campaign) => void
}) {
  const [filter, setFilter] = useState<CampaignStatus | 'todas'>('todas')

  const filtered = useMemo(
    () =>
      filter === 'todas'
        ? campaigns
        : campaigns.filter((c) => c.status === filter),
    [filter],
  )

  return (
    <Panel>
      <div className="flex flex-col gap-3 px-4 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {campaignFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f.key
                  ? 'bg-gold text-primary-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'text-xs',
                  filter === f.key
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground/70',
                )}
              >
                ({f.count})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar campanhas..."
              className="h-10 w-44 rounded-lg border border-border bg-background/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/40"
            />
          </div>
          <FakeSelect label="Mais recentes" />
        </div>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5 pl-4 pr-3 font-medium">Nome da campanha</th>
              <th className="hidden py-2.5 pr-4 font-medium md:table-cell">
                Público
              </th>
              <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">
                Data de envio
              </th>
              <th className="hidden py-2.5 pr-4 font-medium sm:table-cell">
                Enviadas
              </th>
              <th className="py-2.5 pr-4 font-medium">Respostas</th>
              <th className="py-2.5 pr-4 font-medium">Status</th>
              <th className="py-2.5 pl-2 pr-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <CampaignRow
                key={c.id}
                campaign={c}
                selected={c.id === selectedId}
                onSelect={() => onSelect(c)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* ---------- Suggested campaigns ---------- */

const suggestToneMap: Record<string, string> = {
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
  danger: 'bg-danger/12 text-danger',
}

function SuggestedCampaigns() {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Lightbulb className="size-[18px]" />}
        title="Campanhas sugeridas"
        action={
          <button className="text-xs font-medium text-gold underline-offset-4 transition-colors hover:underline">
            Ver todas
          </button>
        }
      />
      <ul className="space-y-2">
        {suggestedCampaigns.map((s) => {
          const Icon = iconMap[s.icon] ?? Users
          return (
            <li key={s.id}>
              <button className="group flex w-full items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-3 text-left transition-colors hover:border-gold/30 hover:bg-white/[0.03]">
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-lg',
                    suggestToneMap[s.tone],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
                  {s.title}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-gold" />
              </button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/* ---------- Inactive clients CTA ---------- */

function InactiveCta() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gold/[0.07] p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold">
        <Users className="size-5" />
      </span>
      <h3 className="mt-4 font-serif text-2xl font-bold leading-tight">
        Clientes inativos?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Recupere até 40% dos clientes que não voltam há mais de 30 dias.
      </p>
      <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-12px_rgba(212,175,55,0.6)] transition-colors hover:bg-gold/90">
        Criar campanha
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

/* ---------- Performance section ---------- */

const perfToneMap: Record<string, string> = {
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
}

function ResponsesChart() {
  const max = Math.max(...campaignDailyResponses.map((d) => d.value))
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-end gap-[3px]">
        {campaignDailyResponses.map((d, i) => {
          const isPeak = d.value === max
          return (
            <div
              key={d.day}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: '100%' }}
            >
              {isPeak && (
                <span className="mb-1 whitespace-nowrap rounded-md bg-card px-2 py-0.5 text-[10px] font-medium text-foreground shadow">
                  {d.value} respostas
                </span>
              )}
              <div
                className={cn(
                  'w-full rounded-t-sm transition-colors',
                  isPeak ? 'bg-gold' : 'bg-gold/40 group-hover:bg-gold/70',
                )}
                style={{ height: `${(d.value / max) * 100}%` }}
              />
              {(i === 0 || (i + 1) % 7 === 0) && (
                <span className="absolute -bottom-5 text-[9px] text-muted-foreground">
                  {d.day}/09
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="h-5" />
    </div>
  )
}

function Performance({ campaign }: { campaign: Campaign }) {
  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-[18px] text-gold" />
          <h2 className="text-[15px] font-semibold tracking-tight">
            Desempenho da campanha
          </h2>
          <button className="ml-1 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background/40 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <span className="whitespace-nowrap">{campaign.name}</span>
            <ChevronDown className="size-4" />
          </button>
        </div>
        <button className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-border bg-background/40 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:self-auto">
          <CalendarDays className="size-4 text-gold" />
          <span className="whitespace-nowrap">01/09/2026 - 30/09/2026</span>
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {campaignPerformance.map((p) => {
            const Icon = iconMap[p.icon] ?? Send
            return (
              <div
                key={p.label}
                className="rounded-xl border border-border bg-background/40 p-3"
              >
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-lg',
                    perfToneMap[p.tone],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">
                  {p.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.label}</p>
                {p.percent && (
                  <p className="mt-1 text-xs font-medium text-gold">
                    {p.percent}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="h-[220px] rounded-xl border border-border bg-background/40 p-4">
          <ResponsesChart />
        </div>
      </div>
    </Panel>
  )
}

/* ---------- Page ---------- */

export function CampanhasView() {
  const [selected, setSelected] = useState<Campaign>(campaigns[0])

  return (
    <div className="space-y-5">
      <StatCards />

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <CampaignsTable
          selectedId={selected.id}
          onSelect={setSelected}
        />
        <aside className="space-y-5">
          <SuggestedCampaigns />
          <InactiveCta />
        </aside>
      </div>

      <Performance campaign={selected} />
    </div>
  )
}
