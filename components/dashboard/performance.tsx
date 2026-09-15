'use client'

import { BarChart3, ChevronDown, TrendingUp } from 'lucide-react'
import { monthlyChart, performanceStats } from '@/lib/data'
import { Panel } from './panel'

const MAX = 10 // 10k ceiling
const W = 640
const H = 220
const PAD_L = 34
const PAD_R = 8
const PAD_T = 28
const PAD_B = 22

const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B
const n = monthlyChart.length
const step = innerW / n
const barW = step * 0.5

function y(v: number) {
  return PAD_T + innerH - (v / MAX) * innerH
}
function x(i: number) {
  return PAD_L + i * step + step / 2
}

const gridLines = [0, 2, 4, 6, 8, 10]
const peakIndex = 24 // day 25, the highlighted point

export function Performance() {
  const linePoints = monthlyChart
    .map((d, i) => `${x(i)},${y(d.sessions)}`)
    .join(' ')

  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-5 text-gold" />
          <h2 className="text-[15px] font-semibold tracking-tight">
            Desempenho do mês
          </h2>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          Setembro 2025
          <ChevronDown className="size-3.5" />
        </button>
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
                {g === 0 ? '0' : `${g}k`}
              </text>
            </g>
          ))}

          {/* bars */}
          {monthlyChart.map((d, i) => {
            const isPeak = i === peakIndex
            return (
              <rect
                key={d.day}
                x={x(i) - barW / 2}
                y={y(d.revenue)}
                width={barW}
                height={PAD_T + innerH - y(d.revenue)}
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
          <circle
            cx={x(peakIndex)}
            cy={y(monthlyChart[peakIndex].sessions)}
            r={4}
            className="fill-background stroke-gold"
            strokeWidth={2}
          />

          {/* x labels (every 5th) */}
          {monthlyChart.map((d, i) =>
            i % 5 === 0 || i === n - 1 ? (
              <text
                key={`x-${d.day}`}
                x={x(i)}
                y={H - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {d.day}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {/* Peak tooltip pill */}
      <div className="-mt-2 flex justify-center">
        <span className="rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
          R$ 8.450,00
        </span>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        {performanceStats.map((s) => (
          <div key={s.label}>
            <p className="text-lg font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-success">
              <TrendingUp className="size-3" />
              {s.trend}%
            </p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
