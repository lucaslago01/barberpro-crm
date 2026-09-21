'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  Receipt,
  UserX,
  Ban,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  Users,
  Wallet,
  Crown,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import {
  getClientsByType,
  getClientsGrowth,
  getGoal,
  getPeriodStats,
  getPreset,
  getPreviousPeriod,
  monthKey,
  saveGoal,
  type ClientTypeCount,
  type Goal,
  type GrowthPoint,
  type Period,
  type PeriodPreset,
  type PeriodStats,
} from '@/lib/supabase-reports'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'mes', label: 'Este mês' },
  { key: 'mes-passado', label: 'Mês passado' },
  { key: '7dias', label: 'Últimos 7 dias' },
  { key: '30dias', label: 'Últimos 30 dias' },
  { key: 'custom', label: 'Datas' },
]

const TYPE_COLORS: Record<string, string> = {
  VIP: '#d4af37',
  Ativos: '#22c55e',
  'Em risco': '#f59e0b',
  Inativos: '#ef4444',
  'Sem atendimento': '#6b7280',
}

const fieldClass =
  'w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40'

function parseInputDate(value: string) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function parseNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : NaN
}

// Teto "redondo" para o eixo dos gráficos
function niceMax(value: number, min: number) {
  if (value <= min) return min
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const n = value / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

/* ---------- Comparação com o período anterior ---------- */

function Delta({
  current,
  previous,
  inverse = false,
}: {
  current: number
  previous: number
  inverse?: boolean
}) {
  if (previous <= 0) {
    return <span className="text-xs text-muted-foreground">sem base de comparação</span>
  }
  if (current === previous) {
    return <span className="text-xs text-muted-foreground">igual ao período anterior</span>
  }
  const pct = ((current - previous) / previous) * 100
  const up = pct > 0
  const good = inverse ? !up : up
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        good ? 'text-success' : 'text-danger',
      )}
    >
      <Icon className="size-3.5" />
      {up ? '+' : ''}
      {pct.toFixed(1).replace('.', ',')}%
      <span className="font-normal text-muted-foreground">vs período anterior</span>
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  current,
  previous,
  inverse,
  detail,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: string
  current: number
  previous: number
  inverse?: boolean
  detail?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_16px_40px_-24px_rgba(0,0,0,0.7)] transition-colors hover:border-gold/30">
      <div className="flex items-center gap-3">
        <span className={cn('grid size-11 place-items-center rounded-xl', tone)}>
          <Icon className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight sm:text-[1.7rem]">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      <div className="mt-1.5">
        <Delta current={current} previous={previous} inverse={inverse} />
      </div>
    </div>
  )
}

/* ---------- Janela: definir meta ---------- */

function GoalModal({
  month,
  goal,
  onClose,
  onSaved,
}: {
  month: string
  goal: Goal
  onClose: () => void
  onSaved: () => void
}) {
  const [revenue, setRevenue] = useState(goal.revenue_goal != null ? String(goal.revenue_goal) : '')
  const [appts, setAppts] = useState(
    goal.appointments_goal != null ? String(goal.appointments_goal) : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  async function handleSave() {
    if (savingRef.current) return
    setError(null)

    const r = parseNumber(revenue)
    const a = parseNumber(appts)
    if (Number.isNaN(r) || Number.isNaN(a)) {
      return setError('Use só números maiores que zero, ou deixe em branco.')
    }

    savingRef.current = true
    setSaving(true)
    try {
      await saveGoal(month, {
        revenue_goal: r,
        appointments_goal: a != null ? Math.round(a) : null,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar meta')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Metas do mês</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Meta de faturamento (R$)
            </label>
            <input
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
              placeholder="Ex.: 15000"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Meta de atendimentos
            </label>
            <input
              value={appts}
              onChange={(e) => setAppts(e.target.value)}
              inputMode="numeric"
              className={fieldClass}
              placeholder="Ex.: 200"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

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

/* ---------- Barra de progresso da meta ---------- */

function GoalBar({
  label,
  current,
  goal,
  format,
}: {
  label: string
  current: number
  goal: number | null
  format: (n: number) => string
}) {
  if (goal == null) {
    return (
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">Meta não definida.</p>
      </div>
    )
  }
  const pct = Math.min(100, (current / goal) * 100)
  const left = Math.max(0, goal - current)
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {format(current)} de {format(goal)}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn('h-full rounded-full', pct >= 100 ? 'bg-success' : 'bg-gold')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {pct >= 100 ? 'Meta batida!' : `${pct.toFixed(0)}% · faltam ${format(left)}`}
      </p>
    </div>
  )
}

/* ---------- Receita e atendimentos (barras + linha) ---------- */

const W = 720
const H = 260
const PAD_L = 46
const PAD_R = 34
const PAD_T = 18
const PAD_B = 26
const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B

function RevenueSessionsChart({ daily }: { daily: PeriodStats['daily'] }) {
  const revMax = niceMax(Math.max(0, ...daily.map((d) => d.revenue)), 100)
  const sessMax = niceMax(Math.max(0, ...daily.map((d) => d.sessions)), 4)
  const fractions = [0, 0.25, 0.5, 0.75, 1]

  const revY = (v: number) => PAD_T + innerH - (v / revMax) * innerH
  const sessY = (v: number) => PAD_T + innerH - (v / sessMax) * innerH

  const n = daily.length
  const step = innerW / Math.max(n, 1)
  const barW = Math.min(step * 0.5, 14)
  const labelEvery = Math.max(1, Math.ceil(n / 8))

  const linePoints = daily
    .map((d, i) => `${PAD_L + i * step + step / 2},${sessY(d.sessions)}`)
    .join(' ')

  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-[18px] text-gold" />
          <h2 className="text-[15px] font-semibold tracking-tight">Receita e atendimentos</h2>
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
        {fractions.map((f) => (
          <g key={f}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={revY(f * revMax)}
              y2={revY(f * revMax)}
              stroke="currentColor"
              className="text-white/5"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={revY(f * revMax) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {f === 0 ? '0' : Math.round(f * revMax).toLocaleString('pt-BR')}
            </text>
            <text
              x={W - PAD_R + 8}
              y={sessY(f * sessMax) + 3}
              textAnchor="start"
              className="fill-muted-foreground text-[9px]"
            >
              {Math.round(f * sessMax)}
            </text>
          </g>
        ))}

        {daily.map((d, i) => {
          const center = PAD_L + i * step + step / 2
          return (
            <g key={`${d.label}-${i}`}>
              <title>{`${d.label}: ${currency.format(d.revenue)} · ${d.sessions} atendimento(s)`}</title>
              <rect
                x={center - barW / 2}
                y={revY(d.revenue)}
                width={barW}
                height={PAD_T + innerH - revY(d.revenue)}
                rx={2}
                className="fill-gold/55"
              />
            </g>
          )
        })}

        {n > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            className="text-foreground/80"
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {daily.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text
              key={`x-${d.label}-${i}`}
              x={PAD_L + i * step + step / 2}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
    </Panel>
  )
}

/* ---------- Serviços mais realizados ---------- */

function TopServices({ services, completed }: { services: PeriodStats['byService']; completed: number }) {
  return (
    <Panel>
      <PanelHeader icon={<BarChart3 className="size-[18px]" />} title="Serviços mais realizados" />
      <div className="px-5 pb-5">
        {services.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum atendimento concluído neste período.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-x-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>#</span>
              <span>Serviço</span>
              <span className="text-right">Qtd</span>
              <span className="w-24 text-right">% do total</span>
            </div>
            <ul className="space-y-3 pt-1">
              {services.slice(0, 6).map((s, i) => {
                const percent = completed > 0 ? Math.round((s.count / completed) * 100) : 0
                return (
                  <li
                    key={s.name}
                    className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-x-3"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-white/5 text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium">{s.name}</span>
                    <span className="text-right text-sm font-semibold tabular-nums">{s.count}</span>
                    <div className="flex w-24 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                        {percent}%
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Panel>
  )
}

/* ---------- Rosca ---------- */

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
  const segments = data
    .filter((d) => d.percent > 0)
    .map((d) => {
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

/* ---------- Clientes por tipo ---------- */

function ClientsByType({ total, types }: { total: number; types: ClientTypeCount[] }) {
  const data = types.map((t) => ({
    name: t.name,
    count: t.count,
    percent: total > 0 ? Math.round((t.count / total) * 100) : 0,
    color: TYPE_COLORS[t.name] ?? '#6b7280',
  }))

  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<PieChart className="size-[18px]" />}
        title="Clientes por tipo"
      />
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Donut data={data} centerTop={String(total)} centerBottom="clientes" />
        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {data.map((cat) => (
            <li key={cat.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{cat.name}</span>
              <span className="shrink-0 text-right font-semibold tabular-nums">{cat.count}</span>
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

/* ---------- Origem da receita (avulso x clube) ---------- */

function RevenueOrigin({ walkIn, club }: { walkIn: number; club: number }) {
  const total = walkIn + club
  const data = [
    {
      name: 'Avulso',
      value: walkIn,
      percent: total > 0 ? Math.round((walkIn / total) * 100) : 0,
      color: '#d4af37',
    },
    {
      name: 'Clube',
      value: club,
      percent: total > 0 ? 100 - Math.round((walkIn / total) * 100) : 0,
      color: '#3b82f6',
    },
  ]

  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Wallet className="size-[18px]" />}
        title="Origem da receita"
      />
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Donut
          data={data}
          centerTop={total >= 1000 ? `R$ ${(total / 1000).toFixed(1).replace('.', ',')}k` : currency.format(total)}
          centerBottom="total"
        />
        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {data.map((m) => (
            <li key={m.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{m.name}</span>
              <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {currency.format(m.value)}
              </span>
              <span className="w-10 shrink-0 text-right font-semibold tabular-nums">
                {m.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

/* ---------- Evolução de clientes ---------- */

const GW = 420
const GH = 210
const GPAD_L = 34
const GPAD_R = 12
const GPAD_T = 16
const GPAD_B = 26
const gInnerW = GW - GPAD_L - GPAD_R
const gInnerH = GH - GPAD_T - GPAD_B

function ClientsGrowth({ points }: { points: GrowthPoint[] }) {
  const n = points.length
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)), 10)
  const grid = [0, 1 / 3, 2 / 3, 1].map((f) => Math.round(f * max))

  const gx = (i: number) => GPAD_L + (n > 1 ? (i / (n - 1)) * gInnerW : gInnerW / 2)
  const gy = (v: number) => GPAD_T + gInnerH - (v / max) * gInnerH

  const line = points.map((d, i) => `${gx(i)},${gy(d.value)}`).join(' ')
  const area = `${gx(0)},${gy(0)} ${line} ${gx(n - 1)},${gy(0)}`
  const last = points[n - 1]

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

          {grid.map((g) => (
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
          {points.map((d, i) => (
            <circle key={`${d.month}-${d.year}`} cx={gx(i)} cy={gy(d.value)} r={2.5} className="fill-gold" />
          ))}

          {points.map((d, i) => (
            <text
              key={`gx-${d.month}-${d.year}`}
              x={gx(i)}
              y={GH - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {d.month}
            </text>
          ))}
        </svg>
        {last && (
          <div className="pointer-events-none absolute right-3 top-1 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
            {last.month}/{last.year} · {last.value} clientes
          </div>
        )}
      </div>
    </Panel>
  )
}

/* ---------- Top clientes por receita ---------- */

function TopClients({ clients }: { clients: PeriodStats['topClients'] }) {
  return (
    <Panel>
      <PanelHeader icon={<Crown className="size-[18px]" />} title="Top clientes por receita" />
      {clients.length === 0 ? (
        <p className="px-5 pb-6 text-center text-sm text-muted-foreground">
          Nenhum atendimento concluído neste período.
        </p>
      ) : (
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
              {clients.map((c, i) => (
                <tr
                  key={`${c.name}-${i}`}
                  className="border-t border-border transition-colors hover:bg-white/[0.02]"
                >
                  <td className="py-3 pl-5 pr-3">
                    <span className="grid size-6 place-items-center rounded-full bg-white/5 text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm font-medium">{c.name}</td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums text-muted-foreground">
                    {c.count}
                  </td>
                  <td className="py-3 pr-5 text-right text-sm font-semibold tabular-nums text-gold">
                    {currency.format(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

/* ---------- Desempenho por dia da semana ---------- */

function WeekdayPerformance({ values }: { values: number[] }) {
  const max = Math.max(0, ...values)
  return (
    <Panel className="flex flex-col p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<CalendarDays className="size-[18px]" />}
        title="Desempenho por dia da semana"
      />
      <div className="flex h-[210px] items-end gap-3">
        {WEEKDAYS.map((name, i) => {
          const value = values[i]
          const isPeak = value === max && value > 0
          return (
            <div
              key={name}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {value}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    'w-full rounded-t-md transition-colors',
                    isPeak ? 'bg-gold' : 'bg-gold/40 group-hover:bg-gold/70',
                  )}
                  style={{ height: `${max ? (value / max) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{name}</span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

/* ---------- Tela ---------- */

export function RelatoriosMes() {
  const [preset, setPreset] = useState<PeriodPreset>('mes')
  const [period, setPeriod] = useState<Period>(() => getPreset('mes'))
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [stats, setStats] = useState<PeriodStats | null>(null)
  const [prevStats, setPrevStats] = useState<PeriodStats | null>(null)
  const [goal, setGoal] = useState<Goal>({ revenue_goal: null, appointments_goal: null })
  const [types, setTypes] = useState<{ total: number; types: ClientTypeCount[] } | null>(null)
  const [growth, setGrowth] = useState<GrowthPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const fromKey = period.from.getTime()
  const toKey = period.to.getTime()
  const goalMonth = monthKey(period.from)
  const showGoals = preset === 'mes' || preset === 'mes-passado'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const current: Period = { from: new Date(fromKey), to: new Date(toKey) }
        const previous = getPreviousPeriod(current, preset)
        const [s, p, g, t, gr] = await Promise.all([
          getPeriodStats(current),
          getPeriodStats(previous),
          showGoals
            ? getGoal(goalMonth)
            : Promise.resolve({ revenue_goal: null, appointments_goal: null } as Goal),
          getClientsByType(),
          getClientsGrowth(),
        ])
        if (cancelled) return
        setStats(s)
        setPrevStats(p)
        setGoal(g)
        setTypes(t)
        setGrowth(gr)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar relatório')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromKey, toKey, preset, reloadKey])

  function choosePreset(key: PeriodPreset) {
    setPreset(key)
    if (key !== 'custom') {
      setPeriod(getPreset(key))
    }
  }

  function applyCustom(fromStr: string, toStr: string) {
    const from = parseInputDate(fromStr)
    const to = parseInputDate(toStr)
    if (from && to && to.getTime() >= from.getTime()) {
      setPeriod({ from, to })
    }
  }

  const periodLabel = `${period.from.toLocaleDateString('pt-BR')} a ${period.to.toLocaleDateString('pt-BR')}`
  const customInvalid =
    preset === 'custom' && customFrom !== '' && customTo !== '' && customTo < customFrom

  return (
    <div className="space-y-5">
      {goalOpen && (
        <GoalModal
          month={goalMonth}
          goal={goal}
          onClose={() => setGoalOpen(false)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}

      {/* Período */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => choosePreset(p.key)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                preset === p.key
                  ? 'border-gold/40 bg-gold/12 text-gold'
                  : 'border-border bg-background/30 text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">De</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value)
                  applyCustom(e.target.value, customTo)
                }}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Até</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value)
                  applyCustom(customFrom, e.target.value)
                }}
                className={fieldClass}
              />
            </div>
            {customInvalid && (
              <p className="text-sm text-red-500">A data final precisa ser depois da inicial.</p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">Período: {periodLabel}</p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          Erro: {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        stats &&
        prevStats && (
          <>
            {/* Cartões */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Atendimentos concluídos"
                value={String(stats.completed)}
                icon={CalendarCheck}
                tone="bg-info/12 text-info"
                current={stats.completed}
                previous={prevStats.completed}
              />
              <StatCard
                label="Faturamento"
                value={currency.format(stats.revenue)}
                detail={`Avulso ${currency.format(stats.walkIn)} · Clube ${currency.format(stats.club)}`}
                icon={CircleDollarSign}
                tone="bg-gold/12 text-gold"
                current={stats.revenue}
                previous={prevStats.revenue}
              />
              <StatCard
                label="Ticket médio"
                value={currency.format(stats.avgTicket)}
                icon={Receipt}
                tone="bg-success/12 text-success"
                current={stats.avgTicket}
                previous={prevStats.avgTicket}
              />
              <StatCard
                label="Faltas"
                value={String(stats.noShows)}
                detail={`Taxa de faltas ${stats.noShowRate.toFixed(1).replace('.', ',')}%`}
                icon={UserX}
                tone="bg-danger/12 text-danger"
                current={stats.noShows}
                previous={prevStats.noShows}
                inverse
              />
              <StatCard
                label="Cancelamentos"
                value={String(stats.cancelled)}
                icon={Ban}
                tone="bg-danger/12 text-danger"
                current={stats.cancelled}
                previous={prevStats.cancelled}
                inverse
              />
              <StatCard
                label="Clientes novos"
                value={String(stats.newClients)}
                icon={UserPlus}
                tone="bg-info/12 text-info"
                current={stats.newClients}
                previous={prevStats.newClients}
              />
            </div>

            {/* Metas */}
            <Panel className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Target className="size-[18px] text-gold" />
                  <h2 className="text-[15px] font-semibold tracking-tight">Metas do mês</h2>
                </div>
                {showGoals && (
                  <button
                    onClick={() => setGoalOpen(true)}
                    className="rounded-lg border border-border bg-background/40 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {goal.revenue_goal == null && goal.appointments_goal == null
                      ? 'Definir meta'
                      : 'Editar meta'}
                  </button>
                )}
              </div>
              {showGoals ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <GoalBar
                    label="Faturamento"
                    current={stats.revenue}
                    goal={goal.revenue_goal}
                    format={(n) => currency.format(n)}
                  />
                  <GoalBar
                    label="Atendimentos concluídos"
                    current={stats.completed}
                    goal={goal.appointments_goal}
                    format={(n) => String(Math.round(n))}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Escolha &quot;Este mês&quot; ou &quot;Mês passado&quot; para ver e definir as metas.
                </p>
              )}
            </Panel>

            {/* Gráficos */}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <RevenueSessionsChart daily={stats.daily} />
              <TopServices services={stats.byService} completed={stats.completed} />
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              {types && <ClientsByType total={types.total} types={types.types} />}
              {growth.length > 0 && <ClientsGrowth points={growth} />}
              <RevenueOrigin walkIn={stats.walkIn} club={stats.club} />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <TopClients clients={stats.topClients} />
              <WeekdayPerformance values={stats.byWeekday} />
            </div>
          </>
        )
      )}
    </div>
  )
}