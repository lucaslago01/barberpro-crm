'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import {
  getPeriodStats,
  getPreset,
  getPreviousPeriod,
  type PeriodStats,
} from '@/lib/supabase-reports'
import { Panel } from './panel'
import { cn } from '@/lib/utils'

const H = 200
const PAD_L = 42
const PAD_R = 10
const PAD_T = 14
const PAD_B = 24

const innerH = H - PAD_T - PAD_B

// Uma medida por vez: dois eixos Y no mesmo gráfico inventam uma correlação que não existe
type Measure = 'revenue' | 'sessions'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const compact = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function monthLabel(date: Date) {
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.replace(/^./, (c) => c.toUpperCase())
}

function pctTrend(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// Arredonda o topo do eixo para um número redondo (1, 2, 2.5 ou 5 × 10^n)
function niceMax(value: number) {
  if (value <= 0) return 1
  const exp = Math.floor(Math.log10(value))
  const base = 10 ** exp
  const n = value / base
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * base
}

export function Performance() {
  const [current, setCurrent] = useState<PeriodStats | null>(null)
  const [previous, setPrevious] = useState<PeriodStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [measure, setMeasure] = useState<Measure>('revenue')
  const [hover, setHover] = useState<number | null>(null)
  const [width, setWidth] = useState(640)
  const roRef = useRef<ResizeObserver | null>(null)

  // Desenha na largura real: assim os rótulos do eixo não encolhem no celular.
  // Callback ref porque a área do gráfico só existe depois que os dados chegam.
  const wrapRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    if (!el) return
    setWidth(Math.round(el.getBoundingClientRect().width) || 640)
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setWidth(Math.round(w))
    })
    ro.observe(el)
    roRef.current = ro
  }, [])

  useEffect(() => () => roRef.current?.disconnect(), [])

  useEffect(() => {
    let cancelled = false
    const period = getPreset('mes')
    const prevPeriod = getPreviousPeriod(period, 'mes')

    Promise.all([getPeriodStats(period), getPeriodStats(prevPeriod)])
      .then(([c, p]) => {
        if (!cancelled) {
          setCurrent(c)
          setPrevious(p)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar desempenho')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const daily = current?.daily ?? []

  const chart = useMemo(() => {
    const W = width
    const innerW = Math.max(40, W - PAD_L - PAD_R)
    const values = daily.map((d) => (measure === 'revenue' ? d.revenue : d.sessions))
    const max = niceMax(Math.max(1, ...values))
    const n = Math.max(1, values.length)
    const step = innerW / n
    // Barra fina: no máximo 24px de largura na escala do desenho
    const barW = Math.min(24, step * 0.56)

    let peak = 0
    values.forEach((v, i) => {
      if (v > values[peak]) peak = i
    })

    // Rótulos do eixo x com folga garantida: evita "29/09" colidindo com "30/09"
    const minGap = 38
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
      innerW,
      labelIndexes,
      values,
      max,
      step,
      barW,
      peak,
      y: (v: number) => PAD_T + innerH - (v / max) * innerH,
      x: (i: number) => PAD_L + i * step + step / 2,
      ticks: Array.from({ length: 5 }, (_, i) => (max / 4) * i),
    }
  }, [daily, measure, width])

  if (error) {
    return (
      <Panel className="flex flex-col p-5">
        <p className="text-sm text-danger">Erro: {error}</p>
      </Panel>
    )
  }

  if (!current || !previous) {
    return (
      <Panel className="flex flex-col p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-[200px] animate-pulse rounded-xl bg-white/5" />
      </Panel>
    )
  }

  const totalAtendimentos = current.completed + current.clubVisits
  const prevTotalAtendimentos = previous.completed + previous.clubVisits

  const stats = [
    {
      label: 'Faturamento',
      value: currency.format(current.revenue),
      trend: pctTrend(current.revenue, previous.revenue),
    },
    {
      label: 'Atendimentos',
      value: String(totalAtendimentos),
      trend: pctTrend(totalAtendimentos, prevTotalAtendimentos),
    },
    {
      label: 'Ticket médio',
      value: currency.format(current.avgTicket),
      trend: pctTrend(current.avgTicket, previous.avgTicket),
    },
    {
      label: 'Novos clientes',
      value: String(current.newClients),
      trend: pctTrend(current.newClients, previous.newClients),
    },
  ]

  const active = hover ?? chart.peak
  const activeDay = daily[active]
  const activeValue = chart.values[active] ?? 0
  const hasData = chart.values.some((v) => v > 0)

  function formatValue(v: number) {
    return measure === 'revenue' ? currency.format(v) : String(v)
  }

  function formatTick(v: number) {
    if (measure === 'sessions') return String(Math.round(v))
    return v === 0 ? '0' : compact.format(v)
  }

  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-5 text-gold" />
          <h2 className="text-[15px] font-semibold tracking-tight">Desempenho do mês</h2>
        </div>
        <span className="rounded-lg border border-border bg-background/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
          {monthLabel(getPreset('mes').from)}
        </span>
      </div>

      {/* Uma medida por vez, cada uma com o seu próprio eixo */}
      <div className="mb-3 inline-flex self-start rounded-lg border border-border bg-background/40 p-0.5">
        {(
          [
            { key: 'revenue', label: 'Faturamento' },
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

      {/* Valor do dia em foco: substitui rótulos em cima de cada barra */}
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight tabular-nums">
          {formatValue(activeValue)}
        </span>
        {activeDay && hasData && (
          <span className="text-xs text-muted-foreground">
            dia {activeDay.label}
            {hover === null && ' · melhor do mês'}
          </span>
        )}
      </div>

      <div ref={wrapRef} className="w-full" onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${chart.W} ${H}`}
          width={chart.W}
          height={H}
          className="h-[200px] w-full"
          role="img"
          aria-label={
            measure === 'revenue'
              ? 'Faturamento por dia do mês'
              : 'Atendimentos por dia do mês'
          }
        >
          {/* grade */}
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

          {/* barras: a do dia em foco fica cheia, as outras recuam */}
          {chart.values.map((v, i) => {
            const h = PAD_T + innerH - chart.y(v)
            return (
              <g key={i}>
                {/* área de toque maior que a barra */}
                <rect
                  x={chart.x(i) - chart.step / 2}
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
                    height={Math.max(2, h)}
                    rx={3}
                    className={cn(
                      'pointer-events-none transition-[fill]',
                      i === active ? 'fill-gold' : 'fill-gold/35',
                    )}
                  />
                )}
              </g>
            )
          })}

          {/* marca do dia em foco */}
          {hasData && (
            <line
              x1={chart.x(active)}
              x2={chart.x(active)}
              y1={PAD_T}
              y2={PAD_T + innerH}
              stroke="currentColor"
              className="pointer-events-none text-gold/25"
              strokeWidth={1}
            />
          )}

          {/* rótulos do eixo x */}
          {chart.labelIndexes.map((i) => {
            const d = daily[i]
            if (!d) return null
            const isLast = i === daily.length - 1
            return (
              <text
                key={`x-${d.label}`}
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

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-lg font-bold tracking-tight tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p
              className={cn(
                'mt-1 inline-flex flex-wrap items-center gap-x-1 text-xs font-semibold',
                s.trend === 0
                  ? 'text-muted-foreground'
                  : s.trend > 0
                    ? 'text-success'
                    : 'text-danger',
              )}
            >
              {s.trend !== 0 &&
                (s.trend > 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                ))}
              {s.trend === 0 ? 'estável' : `${Math.abs(s.trend)}%`}
              <span className="font-normal text-muted-foreground">vs. mês anterior</span>
            </p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
