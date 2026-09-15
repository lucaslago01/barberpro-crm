'use client'

import {
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  BarChart3,
  Scissors,
  ShoppingBag,
  Home,
  Wifi,
  Zap,
  Eye,
  Brush,
  MoreHorizontal,
  Lightbulb,
  Wallet,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import {
  financeStats,
  financeDaily,
  financeCategories,
  financeTransactions,
  financeQuickActions,
  financeGoals,
  type FinanceTransaction,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const statIconMap: Record<string, LucideIcon> = {
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  CalendarCheck,
}

const statToneMap: Record<string, string> = {
  success: 'bg-success/12 text-success',
  danger: 'bg-danger/12 text-danger',
  gold: 'bg-gold/12 text-gold',
  info: 'bg-info/12 text-info',
}

const categoryIconMap: Record<string, LucideIcon> = {
  Scissors,
  ShoppingBag,
  Home,
  Wifi,
  Zap,
  Eye,
  Brush,
}

const quickIconMap: Record<string, LucideIcon> = {
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  BarChart3,
}

const goalIconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Scissors,
}

/* ---------- KPI cards ---------- */

function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {financeStats.map((stat) => {
        const Icon = statIconMap[stat.icon]
        const Trend = stat.trendTone === 'success' ? TrendingUp : TrendingDown
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
                stat.trendTone === 'success' ? 'text-success' : 'text-danger',
              )}
            >
              <Trend className="size-3.5" />
              {stat.trend}%
              <span className="text-muted-foreground">em relação ao mês anterior</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Revenue vs expense bar chart ---------- */

const W = 760
const H = 260
const PAD_L = 42
const PAD_R = 10
const PAD_T = 16
const PAD_B = 26
const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B
const MAX = 1000
const gridLines = [0, 200, 400, 600, 800, 1000]

function y(v: number) {
  return PAD_T + innerH - (v / MAX) * innerH
}

function RevenueExpenseChart() {
  const n = financeDaily.length
  const step = innerW / n
  const barW = Math.min(step * 0.32, 9)
  const gap = 2

  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-[18px] text-gold" />
          <h2 className="text-[15px] font-semibold tracking-tight">
            Receitas e despesas
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-gold" />
            Receitas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-muted-foreground/50" />
            Despesas
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[230px] w-full sm:h-[260px]"
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico comparando receitas e despesas ao longo do mês"
      >
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(g)}
              y2={y(g)}
              stroke="currentColor"
              className="text-white/5"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={y(g) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {g === 0 ? '0' : g.toLocaleString('pt-BR')}
            </text>
          </g>
        ))}

        {financeDaily.map((d, i) => {
          const center = PAD_L + i * step + step / 2
          return (
            <g key={d.day}>
              <rect
                x={center - barW - gap / 2}
                y={y(d.revenue)}
                width={barW}
                height={PAD_T + innerH - y(d.revenue)}
                rx={2}
                className="fill-gold"
              />
              <rect
                x={center + gap / 2}
                y={y(d.expense)}
                width={barW}
                height={PAD_T + innerH - y(d.expense)}
                rx={2}
                className="fill-muted-foreground/40"
              />
            </g>
          )
        })}

        {financeDaily.map((d, i) =>
          i === 0 || (i + 1) % 5 === 0 || i === n - 1 ? (
            <text
              key={`x-${d.day}`}
              x={PAD_L + i * step + step / 2}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {d.day}/08
            </text>
          ) : null,
        )}
      </svg>
    </Panel>
  )
}

/* ---------- Category donut ---------- */

function CategoryDonut() {
  const size = 156
  const stroke = 20
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gap = 6 // px gap between segments

  let offset = 0
  const segments = financeCategories.map((cat) => {
    const len = (cat.percent / 100) * c
    const seg = {
      ...cat,
      dash: Math.max(len - gap, 0),
      dashOffset: -offset,
    }
    offset += len
    return seg
  })

  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Wallet className="size-[18px]" />}
        title="Resumo por categoria"
      />
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
            role="img"
            aria-label="Distribuição da receita por categoria"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              className="text-white/5"
              strokeWidth={stroke}
            />
            {segments.map((s) => (
              <circle
                key={s.name}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${c - s.dash}`}
                strokeDashoffset={s.dashOffset}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tracking-tight">R$ 3.240,00</span>
            <span className="text-[11px] text-muted-foreground">Receita total</span>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {financeCategories.map((cat) => (
            <li key={cat.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {cat.name}
              </span>
              <span className="w-9 shrink-0 text-right font-semibold tabular-nums">
                {cat.percent}%
              </span>
              <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {currency.format(cat.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

/* ---------- Transactions table ---------- */

function TypePill({ type }: { type: FinanceTransaction['type'] }) {
  const isIn = type === 'entrada'
  return (
    <span
      className={cn(
        'text-sm font-medium',
        isIn ? 'text-success' : 'text-danger',
      )}
    >
      {isIn ? 'Entrada' : 'Saída'}
    </span>
  )
}

function TransactionRow({ tx }: { tx: FinanceTransaction }) {
  const isIn = tx.type === 'entrada'
  const CatIcon = categoryIconMap[tx.categoryIcon] ?? Scissors
  const Arrow = isIn ? ArrowUpRight : ArrowDownRight
  return (
    <tr className="group border-t border-border transition-colors hover:bg-white/[0.02]">
      <td className="py-3 pl-4 pr-3">
        <span
          className={cn(
            'grid size-8 place-items-center rounded-full',
            isIn ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger',
          )}
        >
          <Arrow className="size-4" />
        </span>
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground tabular-nums">
        {tx.date}
      </td>
      <td className="py-3 pr-4 text-sm font-medium">{tx.description}</td>
      <td className="hidden py-3 pr-4 sm:table-cell">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <CatIcon className="size-3.5 text-gold/70" />
          {tx.category}
        </span>
      </td>
      <td className="hidden py-3 pr-4 md:table-cell">
        <TypePill type={tx.type} />
      </td>
      <td
        className={cn(
          'py-3 pr-4 text-right text-sm font-semibold tabular-nums',
          isIn ? 'text-success' : 'text-danger',
        )}
      >
        {isIn ? '' : '- '}
        {currency.format(tx.value)}
      </td>
      <td className="py-3 pl-2 pr-4">
        <button
          aria-label="Mais opções"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </td>
    </tr>
  )
}

function TransactionsTable() {
  return (
    <Panel>
      <PanelHeader
        title="Transações recentes"
        action={
          <button className="text-xs font-medium text-gold underline-offset-4 transition-colors hover:underline">
            Ver todas
          </button>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5 pl-4 pr-3 font-medium" />
              <th className="py-2.5 pr-4 font-medium">Data</th>
              <th className="py-2.5 pr-4 font-medium">Descrição</th>
              <th className="hidden py-2.5 pr-4 font-medium sm:table-cell">
                Categoria
              </th>
              <th className="hidden py-2.5 pr-4 font-medium md:table-cell">Tipo</th>
              <th className="py-2.5 pr-4 text-right font-medium">Valor</th>
              <th className="py-2.5 pl-2 pr-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {financeTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* ---------- Quick actions ---------- */

const quickToneMap: Record<string, string> = {
  success: 'bg-success/12 text-success',
  danger: 'bg-danger/12 text-danger',
  muted: 'bg-white/5 text-muted-foreground',
}

function QuickActions() {
  return (
    <Panel className="p-5">
      <PanelHeader className="px-0 pt-0" title="Ações rápidas" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
        {financeQuickActions.map((action) => {
          const Icon = quickIconMap[action.icon]
          return (
            <button
              key={action.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-4 text-center transition-colors hover:border-gold/30 hover:bg-white/[0.03]"
            >
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-lg',
                  quickToneMap[action.tone],
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-xs font-medium leading-tight">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

/* ---------- Monthly goals ---------- */

function MonthlyGoals() {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Target className="size-[18px]" />}
        title="Metas do mês"
        action={
          <button className="text-xs font-medium text-gold underline-offset-4 transition-colors hover:underline">
            Editar meta
          </button>
        }
      />
      <ul className="space-y-5">
        {financeGoals.map((goal) => {
          const Icon = goalIconMap[goal.icon]
          return (
            <li key={goal.label} className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-gold/12 text-gold">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{goal.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {goal.current} / {goal.target}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${goal.percent}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-gold">
                  {goal.percent}%
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/* ---------- Tip of the day ---------- */

function TipOfDay() {
  return (
    <div className="relative flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold/[0.07] p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold">
        <Lightbulb className="size-5" />
      </span>
      <div className="min-w-0 flex-1 pr-5">
        <p className="text-sm font-semibold text-gold">Dica do dia</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Você está a 19% da sua meta de receita. Continue assim!
        </p>
      </div>
      <button
        aria-label="Dispensar dica"
        className="absolute right-3 top-3 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

/* ---------- Page ---------- */

export function FinanceiroView() {
  return (
    <div className="space-y-5">
      <StatCards />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <RevenueExpenseChart />
        <CategoryDonut />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <TransactionsTable />
        <aside className="space-y-5">
          <QuickActions />
          <MonthlyGoals />
          <TipOfDay />
        </aside>
      </div>
    </div>
  )
}
