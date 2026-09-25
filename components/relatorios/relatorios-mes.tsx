'use client'

import { Download } from 'lucide-react'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
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
    <div className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/25 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', tone)}>
          <Icon className="size-[18px]" />
        </span>
        <p className="min-w-0 text-xs font-medium uppercase leading-tight tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 break-words text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs leading-snug text-muted-foreground">{detail}</p>}
      <div className="mt-1.5">
        <Delta current={current} previous={previous} inverse={inverse} />
      </div>
    </div>
  )
}


/* ---------- Faturamento em destaque ---------- */

function PeriodHero({
  stats,
  prevStats,
}: {
  stats: PeriodStats
  prevStats: PeriodStats
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 size-64 rounded-full bg-gold/10 blur-3xl"
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <CircleDollarSign className="size-3.5 text-gold" />
              Faturamento do período
            </p>
            <p className="mt-2 text-[40px] font-bold leading-none tracking-tight tabular-nums sm:text-5xl">
              {currency.format(stats.revenue)}
            </p>
            <div className="mt-2.5">
              <Delta current={stats.revenue} previous={prevStats.revenue} />
            </div>
            {stats.products > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Inclui {currency.format(stats.products)} em vendas de produtos
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Atendimentos</p>
            <p className="mt-1 text-2xl font-bold leading-none tabular-nums">{stats.completed}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ticket médio {currency.format(stats.avgTicket)}
            </p>
          </div>
        </div>

      </div>
    </section>
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
      <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
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

const H = 260
const PAD_L = 52
const PAD_R = 12
const PAD_T = 18
const PAD_B = 26
const innerH = H - PAD_T - PAD_B

// Uma medida por vez: receita e atendimentos em dois eixos Y no mesmo gráfico
// alinham escalas arbitrárias e sugerem uma correlação que não está nos dados.
type ChartMeasure = 'revenue' | 'sessions'

function RevenueSessionsChart({ daily }: { daily: PeriodStats['daily'] }) {
  const [measure, setMeasure] = useState<ChartMeasure>('revenue')
  const [hover, setHover] = useState<number | null>(null)
  const [width, setWidth] = useState(720)
  const roRef = useRef<ResizeObserver | null>(null)

  // Desenha na largura real: sem isso os rótulos encolhem junto com o SVG no celular
  const wrapRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    if (!el) return
    setWidth(Math.round(el.getBoundingClientRect().width) || 720)
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setWidth(Math.round(w))
    })
    ro.observe(el)
    roRef.current = ro
  }, [])

  useEffect(() => () => roRef.current?.disconnect(), [])

  const chart = useMemo(() => {
    const W = width
    const innerW = Math.max(40, W - PAD_L - PAD_R)
    const values = daily.map((d) => (measure === 'revenue' ? d.revenue : d.sessions))
    const max = niceMax(Math.max(0, ...values), measure === 'revenue' ? 100 : 4)
    const n = Math.max(1, values.length)
    const step = innerW / n
    const barW = Math.min(step * 0.56, 24)

    let peak = 0
    values.forEach((v, i) => {
      if (v > values[peak]) peak = i
    })

    // Rótulos do eixo x com folga garantida
    const minGap = 40
    const every = Math.max(1, Math.ceil(minGap / Math.max(1, step)))
    const labelIndexes: number[] = []
    for (let i = 0; i < n; i += every) labelIndexes.push(i)
    const last = n - 1
    if (labelIndexes.length > 0) {
      const prev = labelIndexes[labelIndexes.length - 1]
      if ((last - prev) * step >= minGap) labelIndexes.push(last)
      else labelIndexes[labelIndexes.length - 1] = last
    }

    return {
      W,
      values,
      max,
      step,
      barW,
      peak,
      labelIndexes,
      y: (v: number) => PAD_T + innerH - (v / max) * innerH,
      x: (i: number) => PAD_L + i * step + step / 2,
      ticks: [0, 0.25, 0.5, 0.75, 1].map((f) => f * max),
    }
  }, [daily, measure, width])

  const activeIndex = hover ?? chart.peak
  const activeDay = daily[activeIndex]
  const activeValue = chart.values[activeIndex] ?? 0
  const hasData = chart.values.some((v) => v > 0)

  const formatValue = (v: number) =>
    measure === 'revenue' ? currency.format(v) : String(Math.round(v))
  const formatTick = (v: number) =>
    measure === 'revenue'
      ? v === 0
        ? '0'
        : Math.round(v).toLocaleString('pt-BR')
      : String(Math.round(v))

  return (
    <Panel className="flex min-w-0 flex-col p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <BarChart3 className="size-[18px] text-gold" />
        <h2 className="text-[15px] font-semibold tracking-tight">Receita e atendimentos</h2>
      </div>

      {/* Uma medida por vez, cada uma com o seu próprio eixo */}
      <div className="mb-3 inline-flex self-start rounded-lg border border-border bg-background/40 p-0.5">
        {(
          [
            { key: 'revenue', label: 'Receita' },
            { key: 'sessions', label: 'Atendimentos' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              setMeasure(opt.key)
              setHover(null)
            }}
            className={cn(
              'rounded-[7px] px-3 py-1.5 text-xs font-medium transition-colors',
              measure === opt.key
                ? 'bg-gold text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Leitura do dia em foco, no lugar de um número sobre cada barra */}
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xl font-bold tracking-tight tabular-nums">
          {formatValue(activeValue)}
        </span>
        {activeDay && hasData && (
          <span className="text-xs text-muted-foreground">
            {activeDay.label}
            {hover === null && ' · melhor do período'}
          </span>
        )}
      </div>

      <div ref={wrapRef} className="w-full" onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${chart.W} ${H}`}
          width={chart.W}
          height={H}
          className="h-[240px] w-full"
          role="img"
          aria-label={
            measure === 'revenue'
              ? 'Receita por dia do período'
              : 'Atendimentos por dia do período'
          }
        >
          {chart.ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={chart.W - PAD_R}
                y1={chart.y(t)}
                y2={chart.y(t)}
                stroke="currentColor"
                className="text-white/[0.06]"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 8}
                y={chart.y(t) + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {formatTick(t)}
              </text>
            </g>
          ))}

          {chart.values.map((v, i) => {
            const isActive = i === activeIndex
            return (
              <g key={i}>
                <title>{`${daily[i]?.label}: ${formatValue(v)}`}</title>
                {/* área de toque maior que a barra */}
                <rect
                  x={PAD_L + i * chart.step}
                  y={PAD_T}
                  width={chart.step}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                />
                {v > 0 && (
                  <rect
                    x={chart.x(i) - chart.barW / 2}
                    y={chart.y(v)}
                    width={chart.barW}
                    height={Math.max(2, PAD_T + innerH - chart.y(v))}
                    rx={3}
                    className={cn('pointer-events-none', isActive ? 'fill-gold' : 'fill-gold/35')}
                  />
                )}
              </g>
            )
          })}

          {hasData && (
            <line
              x1={chart.x(activeIndex)}
              x2={chart.x(activeIndex)}
              y1={PAD_T}
              y2={PAD_T + innerH}
              stroke="currentColor"
              className="pointer-events-none text-gold/25"
              strokeWidth={1}
            />
          )}

          {chart.labelIndexes.map((i) => {
            const d = daily[i]
            if (!d) return null
            const isLast = i === daily.length - 1
            return (
              <text
                key={`x-${d.label}-${i}`}
                x={chart.x(i)}
                y={H - 6}
                textAnchor={isLast ? 'end' : i === 0 ? 'start' : 'middle'}
                className="fill-muted-foreground text-[10px]"
              >
                {d.label}
              </text>
            )
          })}
        </svg>
      </div>
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
const gInnerH = GH - GPAD_T - GPAD_B

function ClientsGrowth({ points }: { points: GrowthPoint[] }) {
  const [width, setWidth] = useState(GW)
  const roRef = useRef<ResizeObserver | null>(null)

  const wrapRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    if (!el) return
    setWidth(Math.round(el.getBoundingClientRect().width) || GW)
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setWidth(Math.round(w))
    })
    ro.observe(el)
    roRef.current = ro
  }, [])

  useEffect(() => () => roRef.current?.disconnect(), [])

  const chartW = width
  const gInner = Math.max(40, chartW - GPAD_L - GPAD_R)
  const n = points.length
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)), 10)
  const grid = [0, 1 / 3, 2 / 3, 1].map((f) => Math.round(f * max))

  const gx = (i: number) => GPAD_L + (n > 1 ? (i / (n - 1)) * gInner : gInner / 2)
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
      <div ref={wrapRef} className="relative">
        <svg
          viewBox={`0 0 ${chartW} ${GH}`}
          width={chartW}
          height={GH}
          className="h-[200px] w-full"
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
                x2={chartW - GPAD_R}
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
                className="fill-muted-foreground text-[10px]"
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
              className="fill-muted-foreground text-[10px]"
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
        <>
        <div className="hidden overflow-x-auto md:block">
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

        {/* Celular: lista */}
        <ul className="space-y-1 px-3 pb-3 md:hidden">
          {clients.map((c, i) => (
            <li
              key={`m-${c.name}-${i}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5"
            >
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums',
                  i === 0 ? 'bg-gold/15 text-gold' : 'bg-white/[0.06] text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.count} atendimento{c.count > 1 ? 's' : ''}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gold">
                {currency.format(c.total)}
              </span>
            </li>
          ))}
        </ul>
        </>
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

  function exportCsv() {
    if (!stats) return
    const sep = ';'
    const num = (n: number) => n.toFixed(2).replace('.', ',')
    const esc = (v: string | number) => {
      const s = String(v)
      return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const line = (...cells: (string | number)[]) => cells.map(esc).join(sep)
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const out: string[] = []
    out.push(line('Relatório', periodLabel))
    out.push('')

    out.push(line('RESUMO'))
    out.push(line('Atendimentos concluídos', stats.completed))
    out.push(line('Faturamento (R$)', num(stats.revenue)))
    out.push(line('Faturamento avulso (R$)', num(stats.walkIn)))
    out.push(line('Faturamento clube (R$)', num(stats.club)))
    out.push(line('Ticket médio (R$)', num(stats.avgTicket)))
    out.push(line('Faltas', stats.noShows))
    out.push(line('Taxa de faltas (%)', num(stats.noShowRate)))
    out.push(line('Cancelamentos', stats.cancelled))
    out.push(line('Clientes novos', stats.newClients))
    out.push('')

    if (showGoals && (goal.revenue_goal != null || goal.appointments_goal != null)) {
      out.push(line('METAS DO MÊS'))
      if (goal.revenue_goal != null) {
        out.push(line('Meta de faturamento (R$)', num(goal.revenue_goal)))
      }
      if (goal.appointments_goal != null) {
        out.push(line('Meta de atendimentos', goal.appointments_goal))
      }
      out.push('')
    }

    out.push(line('SERVIÇOS MAIS REALIZADOS'))
    out.push(line('Serviço', 'Quantidade'))
    stats.byService.forEach((s) => out.push(line(s.name, s.count)))
    out.push('')

    out.push(line('TOP CLIENTES POR RECEITA'))
    out.push(line('Cliente', 'Atendimentos', 'Valor gasto (R$)'))
    stats.topClients.forEach((cl) => out.push(line(cl.name, cl.count, num(cl.total))))
    out.push('')

    out.push(line('DIA A DIA'))
    out.push(line('Dia', 'Receita (R$)', 'Atendimentos'))
    stats.daily.forEach((d) => out.push(line(d.label, num(d.revenue), d.sessions)))
    out.push('')

    out.push(line('DESEMPENHO POR DIA DA SEMANA'))
    out.push(line('Dia', 'Atendimentos'))
    WEEKDAYS.forEach((name, i) => out.push(line(name, stats.byWeekday[i])))

    if (types) {
      out.push('')
      out.push(line('CLIENTES POR TIPO'))
      out.push(line('Tipo', 'Quantidade'))
      types.types.forEach((t) => out.push(line(t.name, t.count)))
      out.push(line('Total', types.total))
    }

    const blob = new Blob(['\uFEFF' + out.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${ymd(period.from)}_a_${ymd(period.to)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
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
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => choosePreset(p.key)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Período: {periodLabel}</p>
          <button
            onClick={exportCsv}
            disabled={!stats || loading}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background/40 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Download className="size-4" />
            Exportar CSV
          </button>
        </div>
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
            <PeriodHero stats={stats} prevStats={prevStats} />

            {/* Cartões */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {/* Faturamento, atendimentos e ticket médio já abrem a tela no destaque acima */}
              <StatCard
                label="Avulso"
                value={currency.format(stats.walkIn)}
                detail={`${stats.completed} atendimento(s) concluído(s)`}
                icon={Receipt}
                tone="bg-gold/12 text-gold"
                current={stats.walkIn}
                previous={prevStats.walkIn}
              />
              <StatCard
                label="Clube"
                value={currency.format(stats.club)}
                detail={`${stats.clubVisits} atendimento(s) do clube`}
                icon={CircleDollarSign}
                tone="bg-success/12 text-success"
                current={stats.club}
                previous={prevStats.club}
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