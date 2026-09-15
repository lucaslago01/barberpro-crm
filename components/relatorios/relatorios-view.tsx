'use client'

import {
  CircleDollarSign,
  Scissors,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Wallet,
  Crown,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import {
  reportStats,
  reportRevenueSessions,
  reportTopServices,
  reportClientsByType,
  reportClientsTotal,
  reportClientsGrowth,
  reportPaymentMethods,
  reportPaymentTotal,
  reportTopClients,
  reportWeekdayPerformance,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const statIconMap: Record<string, LucideIcon> = {
  CircleDollarSign,
  Scissors,
  Users,
  Star,
}

const statToneMap: Record<string, string> = {
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
  muted: 'bg-white/5 text-muted-foreground',
}

/* ---------- KPI cards ---------- */

function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {reportStats.map((stat) => {
        const Icon = statIconMap[stat.icon] ?? CircleDollarSign
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

/* ---------- Revenue + sessions combo chart ---------- */

const W = 720
const H = 260
const PAD_L = 42
const PAD_R = 34
const PAD_T = 18
const PAD_B = 26
const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B

const REV_MAX = 2000
const SESS_MAX = 40
const revGrid = [0, 500, 1000, 1500, 2000]
const sessGrid = [0, 10, 20, 30, 40]

function revY(v: number) {
  return PAD_T + innerH - (v / REV_MAX) * innerH
}
function sessY(v: number) {
  return PAD_T + innerH - (v / SESS_MAX) * innerH
}

function RevenueSessionsChart() {
  const n = reportRevenueSessions.length
  const step = innerW / n
  const barW = Math.min(step * 0.5, 14)

  const linePoints = reportRevenueSessions
    .map((d, i) => `${PAD_L + i * step + step / 2},${sessY(d.sessions)}`)
    .join(' ')

  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-[18px] text-gold" />
          <h2 className="text-[15px] font-semibold tracking-tight">
            Receita e atendimentos
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-gold" />
            Receita (R$)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border-2 border-foreground/70" />
            Atendimentos
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[230px] w-full sm:h-[260px]"
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico de receita e atendimentos ao longo do período"
      >
        {revGrid.map((g, idx) => (
          <g key={g}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={revY(g)}
              y2={revY(g)}
              stroke="currentColor"
              className="text-white/5"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={revY(g) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {g === 0 ? '0' : g.toLocaleString('pt-BR')}
            </text>
            <text
              x={W - PAD_R + 8}
              y={sessY(sessGrid[idx]) + 3}
              textAnchor="start"
              className="fill-muted-foreground text-[9px]"
            >
              {sessGrid[idx]}
            </text>
          </g>
        ))}

        {reportRevenueSessions.map((d, i) => {
          const center = PAD_L + i * step + step / 2
          return (
            <rect
              key={d.day}
              x={center - barW / 2}
              y={revY(d.revenue)}
              width={barW}
              height={PAD_T + innerH - revY(d.revenue)}
              rx={2}
              className="fill-gold/55"
            />
          )
        })}

        <polyline
          points={linePoints}
          fill="none"
          stroke="currentColor"
          className="text-foreground/80"
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {reportRevenueSessions.map((d, i) =>
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

/* ---------- Top services ---------- */

function TopServices() {
  return (
    <Panel>
      <PanelHeader
        icon={<BarChart3 className="size-[18px]" />}
        title="Serviços mais realizados"
        action={
          <button className="text-xs font-medium text-gold underline-offset-4 transition-colors hover:underline">
            Ver todos
          </button>
        }
      />
      <div className="px-5 pb-5">
        <div className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-x-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>#</span>
          <span>Serviço</span>
          <span className="text-right">Qtd</span>
          <span className="w-24 text-right">% do total</span>
        </div>
        <ul className="space-y-3 pt-1">
          {reportTopServices.map((s, i) => (
            <li
              key={s.name}
              className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-x-3"
            >
              <span className="grid size-6 place-items-center rounded-full bg-white/5 text-xs font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="truncate text-sm font-medium">{s.name}</span>
              <span className="text-right text-sm font-semibold tabular-nums">
                {s.count}
              </span>
              <div className="flex w-24 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                  {s.percent}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

/* ---------- Donut chart (shared) ---------- */

function Donut({
  data,
  centerTop,
  centerBottom,
}: {
  data: { name: string; percent: number; color: string }[]
  centerTop: string
  centerBottom: string
}) {
  const size = 156
  const stroke = 20
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gap = 6

  let offset = 0
  const segments = data.map((d) => {
    const len = (d.percent / 100) * c
    const seg = { ...d, dash: Math.max(len - gap, 0), dashOffset: -offset }
    offset += len
    return seg
  })

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label="Gráfico de distribuição em rosca"
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
        <span className="text-lg font-bold tracking-tight">{centerTop}</span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {centerBottom}
        </span>
      </div>
    </div>
  )
}

/* ---------- Clients by type ---------- */

function ClientsByType() {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<PieChart className="size-[18px]" />}
        title="Clientes por tipo"
      />
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Donut
          data={reportClientsByType}
          centerTop={String(reportClientsTotal)}
          centerBottom="clientes"
        />
        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {reportClientsByType.map((cat) => (
            <li key={cat.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {cat.name}
              </span>
              <span className="shrink-0 text-right font-semibold tabular-nums">
                {cat.count}
              </span>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                ({cat.percent}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

/* ---------- Payment methods ---------- */

function PaymentMethods() {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Wallet className="size-[18px]" />}
        title="Formas de pagamento"
      />
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Donut
          data={reportPaymentMethods}
          centerTop={reportPaymentTotal}
          centerBottom="total"
        />
        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {reportPaymentMethods.map((m) => (
            <li key={m.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {m.name}
              </span>
              <span className="shrink-0 text-right font-semibold tabular-nums">
                {m.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

/* ---------- Clients growth line ---------- */

const GW = 420
const GH = 210
const GPAD_L = 34
const GPAD_R = 12
const GPAD_T = 16
const GPAD_B = 26
const gInnerW = GW - GPAD_L - GPAD_R
const gInnerH = GH - GPAD_T - GPAD_B
const G_MAX = 150
const gGrid = [0, 50, 100, 150]

function ClientsGrowth() {
  const n = reportClientsGrowth.length
  const gx = (i: number) => GPAD_L + (i / (n - 1)) * gInnerW
  const gy = (v: number) => GPAD_T + gInnerH - (v / G_MAX) * gInnerH

  const line = reportClientsGrowth.map((d, i) => `${gx(i)},${gy(d.value)}`).join(' ')
  const area = `${GPAD_L},${gy(0)} ${line} ${gx(n - 1)},${gy(0)}`
  const last = reportClientsGrowth[n - 1]

  return (
    <Panel className="flex flex-col p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Users className="size-[18px]" />}
        title="Evolução de clientes"
      />
      <div className="relative">
        <svg
          viewBox={`0 0 ${GW} ${GH}`}
          className="h-[200px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Evolução mensal da base de clientes"
        >
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
            </linearGradient>
          </defs>

          {gGrid.map((g) => (
            <g key={g}>
              <line
                x1={GPAD_L}
                x2={GW - GPAD_R}
                y1={gy(g)}
                y2={gy(g)}
                stroke="currentColor"
                className="text-white/5"
                strokeWidth={1}
              />
              <text
                x={GPAD_L - 8}
                y={gy(g) + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                {g}
              </text>
            </g>
          ))}

          <polygon points={area} fill="url(#growthFill)" />
          <polyline
            points={line}
            fill="none"
            stroke="#d4af37"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {reportClientsGrowth.map((d, i) => (
            <circle
              key={d.month}
              cx={gx(i)}
              cy={gy(d.value)}
              r={2.5}
              className="fill-gold"
            />
          ))}

          {reportClientsGrowth.map((d, i) => (
            <text
              key={`gx-${d.month}`}
              x={gx(i)}
              y={GH - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {d.month}
            </text>
          ))}
        </svg>
        <div className="pointer-events-none absolute right-3 top-1 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
          {last.month}/2026 · {last.value} clientes
        </div>
      </div>
    </Panel>
  )
}

/* ---------- Top clients table ---------- */

function TopClients() {
  return (
    <Panel>
      <PanelHeader
        icon={<Crown className="size-[18px]" />}
        title="Top clientes por receita"
        action={
          <button className="text-xs font-medium text-gold underline-offset-4 transition-colors hover:underline">
            Ver todos
          </button>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5 pl-5 pr-3 font-medium">#</th>
              <th className="py-2.5 pr-4 font-medium">Cliente</th>
              <th className="py-2.5 pr-4 text-right font-medium">Atendimentos</th>
              <th className="py-2.5 pr-5 text-right font-medium">Valor gasto</th>
            </tr>
          </thead>
          <tbody>
            {reportTopClients.map((c, i) => (
              <tr
                key={c.name}
                className="border-t border-border transition-colors hover:bg-white/[0.02]"
              >
                <td className="py-3 pl-5 pr-3">
                  <span className="grid size-6 place-items-center rounded-full bg-white/5 text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                </td>
                <td className="py-3 pr-4 text-sm font-medium">{c.name}</td>
                <td className="py-3 pr-4 text-right text-sm tabular-nums text-muted-foreground">
                  {c.sessions}
                </td>
                <td className="py-3 pr-5 text-right text-sm font-semibold tabular-nums text-gold">
                  {currency.format(c.spent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* ---------- Weekday performance ---------- */

function WeekdayPerformance() {
  const max = Math.max(...reportWeekdayPerformance.map((d) => d.value))
  const peak = max
  return (
    <Panel className="flex flex-col p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<CalendarDays className="size-[18px]" />}
        title="Desempenho por dia da semana"
      />
      <div className="flex h-[210px] items-end gap-3">
        {reportWeekdayPerformance.map((d) => {
          const isPeak = d.value === peak && d.value > 0
          return (
            <div
              key={d.day}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {d.value}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    'w-full rounded-t-md transition-colors',
                    isPeak ? 'bg-gold' : 'bg-gold/40 group-hover:bg-gold/70',
                  )}
                  style={{ height: `${max ? (d.value / max) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {d.day.slice(0, 3)}
              </span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

/* ---------- Page ---------- */

export function RelatoriosView() {
  return (
    <div className="space-y-5">
      <StatCards />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <RevenueSessionsChart />
        <TopServices />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ClientsByType />
        <ClientsGrowth />
        <PaymentMethods />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TopClients />
        <WeekdayPerformance />
      </div>
    </div>
  )
}
