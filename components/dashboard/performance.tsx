'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import {
  getPeriodStats,
  getPreset,
  getPreviousPeriod,
  type PeriodStats,
} from '@/lib/supabase-reports'
import { Panel } from './panel'

const W = 640
const H = 220
const PAD_L = 34
const PAD_R = 8
const PAD_T = 28
const PAD_B = 22

const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function monthLabel(date: Date) {
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.replace(/^./, (c) => c.toUpperCase())
}

function pctTrend(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function Performance() {
  const [current, setCurrent] = useState<PeriodStats | null>(null)
  const [previous, setPrevious] = useState<PeriodStats | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar desempenho')
      })

    return () => {
      cancelled = true
    }
  }, [])

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
        <p className="text-sm text-muted-foreground">Carregando desempenho...</p>
      </Panel>
    )
  }

  const daily = current.daily
  const n = daily.length
  const step = innerW / n
  const barW = step * 0.5

  const maxRevenue = Math.max(1, ...daily.map((d) => d.revenue))
  const maxSessions = Math.max(1, ...daily.map((d) => d.sessions))

  function yRev(v: number) {
    return PAD_T + innerH - (v / maxRevenue) * innerH
  }
  function ySess(v: number) {
    return PAD_T + innerH - (v / maxSessions) * innerH
  }
  function x(i: number) {
    return PAD_L + i * step + step / 2
  }

  const linePoints = daily.map((d, i) => `${x(i)},${ySess(d.sessions)}`).join(' ')

  let peakIndex = 0
  daily.forEach((d, i) => {
    if (d.revenue > daily[peakIndex].revenue) peakIndex = i
  })

  const gridSteps = 4
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => (maxRevenue / gridSteps) * i)

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

  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-5 text-gold" />
          <h2 className="text-[15px] font-semibold tracking-tight">
            Desempenho do mês
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
          {monthLabel(getPreset('mes').from)}
        </span>
      </div>

      {/* Legend */}
      <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-gold" />
          Faturamento
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-foreground/70" />
          Atendimentos
        </span>
      </div>

      {/* Chart */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[200px] w-full sm:h-[230px]"
          preserveAspectRatio="none"
          role="img"
          aria-label="Gráfico de faturamento e atendimentos ao longo do mês"
        >
          {/* grid */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={yRev(g)}
                y2={yRev(g)}
                stroke="currentColor"
                className="text-white/5"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 8}
                y={yRev(g) + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                {g === 0 ? '0' : `${Math.round(g)}`}
              </text>
            </g>
          ))}

          {/* bars */}
          {daily.map((d, i) => {
            const isPeak = i === peakIndex && d.revenue > 0
            return (
              <rect
                key={d.label}
                x={x(i) - barW / 2}
                y={yRev(d.revenue)}
                width={barW}
                height={PAD_T + innerH - yRev(d.revenue)}
                rx={2}
                className={isPeak ? 'fill-gold' : 'fill-gold/45'}
              />
            )
          })}

          {/* line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            className="text-foreground/80"
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* peak marker */}
          {daily[peakIndex].revenue > 0 && (
            <circle
              cx={x(peakIndex)}
              cy={ySess(daily[peakIndex].sessions)}
              r={4}
              className="fill-background stroke-gold"
              strokeWidth={2}
            />
          )}

          {/* x labels (every 5th) */}
          {daily.map((d, i) =>
            i % 5 === 0 || i === n - 1 ? (
              <text
                key={`x-${d.label}`}
                x={x(i)}
                y={H - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {d.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {/* Peak tooltip pill */}
      {daily[peakIndex].revenue > 0 && (
        <div className="-mt-2 flex justify-center">
          <span className="rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
            {currency.format(daily[peakIndex].revenue)}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-lg font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p
              className={`mt-1 inline-flex items-center gap-0.5 text-xs font-semibold ${
                s.trend >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {s.trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(s.trend)}%
            </p>
          </div>
        ))}
      </div>
    </Panel>
  )
}