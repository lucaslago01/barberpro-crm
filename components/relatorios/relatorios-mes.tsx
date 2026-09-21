'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CalendarCheck,
  CircleDollarSign,
  Receipt,
  UserX,
  Ban,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Panel } from '@/components/dashboard/panel'
import {
  getGoal,
  getPeriodStats,
  getPreset,
  getPreviousPeriod,
  monthKey,
  saveGoal,
  dayString,
  type Goal,
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
    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-gold/30">
      <div className="flex items-center gap-3">
        <span className={cn('grid size-11 place-items-center rounded-xl', tone)}>
          <Icon className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
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
        {pct >= 100
          ? 'Meta batida!'
          : `${pct.toFixed(0)}% · faltam ${format(left)}`}
      </p>
    </div>
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
        const [s, p, g] = await Promise.all([
          getPeriodStats(current),
          getPeriodStats(previous),
          showGoals
            ? getGoal(goalMonth)
            : Promise.resolve({ revenue_goal: null, appointments_goal: null } as Goal),
        ])
        if (cancelled) return
        setStats(s)
        setPrevStats(p)
        setGoal(g)
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
    preset === 'custom' &&
    customFrom !== '' &&
    customTo !== '' &&
    customTo < customFrom

  const maxService = stats && stats.byService.length > 0 ? stats.byService[0].total : 0
  const maxWeekday = stats ? Math.max(0, ...stats.byWeekday) : 0
  const maxHour = stats ? Math.max(0, ...stats.byHour.map((h) => h.count)) : 0

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

        <p className="text-xs text-muted-foreground">
          Período: {periodLabel} ({dayString(period.from)} a {dayString(period.to)})
        </p>
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

            {/* Por serviço e por dia da semana */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Panel className="p-5">
                <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                  Faturamento por serviço (avulso)
                </h2>
                {stats.byService.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum atendimento concluído neste período.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {stats.byService.map((s) => (
                      <li key={s.name}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate font-medium">{s.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {s.count}x ·{' '}
                            <span className="font-semibold text-foreground">
                              {currency.format(s.total)}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gold"
                            style={{
                              width: `${maxService > 0 ? (s.total / maxService) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel className="p-5">
                <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                  Atendimentos por dia da semana
                </h2>
                {stats.completed === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum atendimento concluído neste período.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {WEEKDAYS.map((name, i) => (
                      <li key={name}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{name}</span>
                          <span className="tabular-nums font-semibold">{stats.byWeekday[i]}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-info"
                            style={{
                              width: `${maxWeekday > 0 ? (stats.byWeekday[i] / maxWeekday) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            {/* Por horário e melhores clientes */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Panel className="p-5">
                <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                  Atendimentos por horário
                </h2>
                {stats.byHour.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum atendimento concluído neste período.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {stats.byHour.map((h) => (
                      <li key={h.hour}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium tabular-nums">{h.hour}</span>
                          <span className="tabular-nums font-semibold">{h.count}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-success"
                            style={{
                              width: `${maxHour > 0 ? (h.count / maxHour) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel className="p-5">
                <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                  Melhores clientes do período
                </h2>
                {stats.topClients.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum atendimento concluído neste período.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {stats.topClients.map((c, i) => (
                      <li
                        key={`${c.name}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold/12 text-xs font-semibold text-gold">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.count} atendimento(s)
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {currency.format(c.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </>
        )
      )}
    </div>
  )
}