'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  CalendarCheck,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { Panel } from '@/components/dashboard/panel'
import { getClients } from '@/lib/supabase-data'
import {
  CLUB_PLANS,
  EXPENSE_CATEGORIES,
  createClubPayment,
  createExpense,
  deleteClubPayment,
  deleteExpense,
  getMonthFinance,
  todayString,
  type DailyPoint,
  type MonthFinance,
} from '@/lib/supabase-finance'
import type { Client } from '@/lib/types'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Valor sugerido de cada plano do clube (o Juan pode mudar na hora de lançar)
const PLAN_PRICES: Record<string, number> = {
  Corte: 139,
  'Corte e barba': 229,
  Barba: 159,
}

const fieldClass =
  'w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40'

function parseAmount(value: string) {
  const n = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

// "2026-09-21" -> "21/09"
function shortDay(day: string) {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

/* ---------- Janela: lançar despesa ---------- */

function ExpenseModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [day, setDay] = useState(todayString())
  const [category, setCategory] = useState('aluguel')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  async function handleSave() {
    if (savingRef.current) return
    setError(null)

    const value = parseAmount(amount)
    if (!day) return setError('Escolha a data.')
    if (!description.trim()) return setError('Escreva uma descrição.')
    if (!(value > 0)) return setError('Informe um valor maior que zero.')

    savingRef.current = true
    setSaving(true)
    try {
      await createExpense({
        day,
        category,
        description: description.trim(),
        amount: value,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao lançar despesa')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Lançar despesa</h3>
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
            <label className="mb-1 block text-xs text-muted-foreground">Data</label>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(fieldClass, 'capitalize')}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldClass}
              placeholder="Ex.: aluguel de setembro"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Valor (R$)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
              placeholder="0,00"
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
            {saving ? 'Salvando...' : 'Lançar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Janela: lançar mensalidade do clube ---------- */

function ClubModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [day, setDay] = useState(todayString())
  const [clientId, setClientId] = useState('')
  const [plan, setPlan] = useState(CLUB_PLANS[0])
  const [amount, setAmount] = useState(String(PLAN_PRICES[CLUB_PLANS[0]] ?? ''))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    getClients()
      .then((data) => {
        if (!cancelled) setClients(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handlePlanChange(value: string) {
    setPlan(value)
    if (PLAN_PRICES[value] !== undefined) setAmount(String(PLAN_PRICES[value]))
  }

  async function handleSave() {
    if (savingRef.current) return
    setError(null)

    const value = parseAmount(amount)
    if (!day) return setError('Escolha a data.')
    if (!(value > 0)) return setError('Informe um valor maior que zero.')

    savingRef.current = true
    setSaving(true)
    try {
      await createClubPayment({
        day,
        client_id: clientId || null,
        plan,
        amount: value,
        note,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao lançar mensalidade')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Lançar mensalidade</h3>
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
            <label className="mb-1 block text-xs text-muted-foreground">Data do pagamento</label>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Cliente (opcional)</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Plano</label>
            <select
              value={plan}
              onChange={(e) => handlePlanChange(e.target.value)}
              className={fieldClass}
            >
              {CLUB_PLANS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Valor (R$)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Observação (opcional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={fieldClass}
              placeholder="Ex.: pago no Pix"
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
            {saving ? 'Salvando...' : 'Lançar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Cartão de número ---------- */

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  detail?: string
  icon: LucideIcon
  tone: string
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
      {detail && <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  )
}

/* ---------- Gráfico de barras por dia ---------- */

const W = 760
const H = 260
const PAD_L = 46
const PAD_R = 10
const PAD_T = 16
const PAD_B = 26
const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B

// Escolhe um teto "redondo" para o eixo, conforme o maior valor do mês
function niceMax(value: number) {
  if (value <= 0) return 100
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const n = value / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

function DailyChart({ daily }: { daily: DailyPoint[] }) {
  const maxValue = niceMax(Math.max(0, ...daily.map((d) => Math.max(d.revenue, d.expense))))
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxValue)
  const n = daily.length
  const step = innerW / n
  const barW = Math.min(step * 0.32, 9)
  const gap = 2

  const y = (v: number) => PAD_T + innerH - (v / maxValue) * innerH

  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="size-[18px] text-gold" />
          <h2 className="text-[15px] font-semibold tracking-tight">Receitas e despesas por dia</h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-gold" />
            Receitas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-danger" />
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
              {g === 0 ? '0' : Math.round(g).toLocaleString('pt-BR')}
            </text>
          </g>
        ))}

        {daily.map((d, i) => {
          const center = PAD_L + i * step + step / 2
          return (
            <g key={d.day}>
              <title>{`Dia ${d.day}: receitas ${currency.format(d.revenue)} · despesas ${currency.format(d.expense)}`}</title>
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
                className="fill-danger"
              />
            </g>
          )
        })}

        {daily.map((d, i) =>
          d.day === 1 || d.day % 5 === 0 ? (
            <text
              key={`l-${d.day}`}
              x={PAD_L + i * step + step / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {String(d.day).padStart(2, '0')}
            </text>
          ) : null,
        )}
      </svg>
    </Panel>
  )
}

/* ---------- Tela ---------- */

export function FinanceiroMes() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [data, setData] = useState<MonthFinance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [clubOpen, setClubOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const result = await getMonthFinance(year, month)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar o financeiro')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [year, month, reloadKey])

  function changeMonth(amount: number) {
    const next = new Date(year, month + amount, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const reload = () => setReloadKey((k) => k + 1)

  async function handleDeleteExpense(id: string, description: string) {
    if (!window.confirm(`Apagar a despesa "${description}"?`)) return
    try {
      await deleteExpense(id)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao apagar despesa')
    }
  }

  async function handleDeleteClub(id: string, plan: string) {
    if (!window.confirm(`Apagar a mensalidade "${plan}"?`)) return
    try {
      await deleteClubPayment(id)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao apagar mensalidade')
    }
  }

  const monthLabelRaw = new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1)

  const income = data ? data.walkIn + data.club : 0
  const maxCategory = data && data.byCategory.length > 0 ? data.byCategory[0].total : 0
  const maxService = data && data.byService.length > 0 ? data.byService[0].total : 0

  return (
    <div className="space-y-5">
      {expenseOpen && <ExpenseModal onClose={() => setExpenseOpen(false)} onSaved={reload} />}
      {clubOpen && <ClubModal onClose={() => setClubOpen(false)} onSaved={reload} />}

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background/40 px-1 py-1">
          <button
            aria-label="Mês anterior"
            onClick={() => changeMonth(-1)}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium">{monthLabel}</span>
          <button
            aria-label="Próximo mês"
            onClick={() => changeMonth(1)}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setClubOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-4" />
            Lançar mensalidade
          </button>
          <button
            onClick={() => setExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
          >
            <Plus className="size-4" />
            Lançar despesa
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          Erro: {error}
        </div>
      )}

      {loading && !data ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        data && (
          <>
            {/* Cartões */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Entradas"
                value={currency.format(income)}
                detail={`Avulso ${currency.format(data.walkIn)} · Clube ${currency.format(data.club)}${data.clubAddons > 0 ? ` · Extras ${currency.format(data.clubAddons)}` : ''}`}
                icon={TrendingUp}
                tone="bg-success/12 text-success"
              />
              <StatCard
                label="Saídas"
                value={currency.format(data.expenses)}
                detail={`${data.expenseList.length} despesa(s) lançada(s)`}
                icon={TrendingDown}
                tone="bg-danger/12 text-danger"
              />
              <StatCard
                label="Lucro do mês"
                value={currency.format(data.profit)}
                detail="Entradas menos saídas"
                icon={CircleDollarSign}
                tone="bg-gold/12 text-gold"
              />
              <StatCard
                label="Atendimentos concluídos"
                value={String(data.completed)}
                detail={
                  data.completed > 0
                    ? `Ticket médio ${currency.format(data.walkIn / data.completed)}${data.clubVisits > 0 ? ` · +${data.clubVisits} do clube` : ''}`
                    : data.clubVisits > 0
                      ? `${data.clubVisits} atendimento(s) do clube`
                      : 'Nenhum atendimento concluído'
                }
                icon={CalendarCheck}
                tone="bg-info/12 text-info"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              O valor avulso soma os atendimentos marcados como concluídos na agenda. O valor do
              clube vem das mensalidades que você lança aqui.
            </p>

            {/* Gráfico */}
            <DailyChart daily={data.daily} />

            {/* Por serviço e por categoria */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Panel className="p-5">
                <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                  Entradas por serviço (avulso)
                </h2>
                {data.byService.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum atendimento concluído neste mês.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data.byService.map((s) => (
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
                  Despesas por categoria
                </h2>
                {data.byCategory.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma despesa neste mês.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data.byCategory.map((c) => (
                      <li key={c.category}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate font-medium capitalize">
                            {c.category}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {currency.format(c.total)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-danger"
                            style={{
                              width: `${maxCategory > 0 ? (c.total / maxCategory) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            {/* Cortes avulsos */}
            <Panel className="p-5">
              <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                Atendimentos avulsos do mês
              </h2>
              {data.walkInList.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum atendimento concluído neste mês. Marque como Concluído na agenda para ele
                  aparecer aqui.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.walkInList.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{w.client}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {shortDay(w.day)} às {w.time} · {w.service}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
                        + {currency.format(w.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* Extras vendidos em visitas do clube */}
            {data.clubAddonsList.length > 0 && (
              <Panel className="p-5">
                <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                  Extras do clube (serviços adicionais)
                </h2>
                <ul className="space-y-2">
                  {data.clubAddonsList.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{w.client}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {shortDay(w.day)} às {w.time} · {w.addonService ?? w.service}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
                        + {currency.format(w.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {/* Listas de lançamentos */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Panel className="p-5">
                <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                  Despesas do mês
                </h2>
                {data.expenseList.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma despesa neste mês.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.expenseList.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{e.description}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {shortDay(e.day)} · {e.category}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums text-danger">
                            - {currency.format(e.amount)}
                          </span>
                          <button
                            onClick={() => handleDeleteExpense(e.id, e.description)}
                            aria-label="Apagar despesa"
                            title="Apagar despesa"
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel className="p-5">
                <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
                  Mensalidades do clube
                </h2>
                {data.clubList.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma mensalidade neste mês.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.clubList.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {c.client_name || 'Sem cliente'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {shortDay(c.day)} · {c.plan}
                            {c.note ? ` · ${c.note}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums text-success">
                            + {currency.format(c.amount)}
                          </span>
                          <button
                            onClick={() => handleDeleteClub(c.id, c.plan)}
                            aria-label="Apagar mensalidade"
                            title="Apagar mensalidade"
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
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