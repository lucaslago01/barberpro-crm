'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Crown,
  Scissors,
  Receipt,
  Wallet,
  CalendarClock,
  Repeat,
  type LucideIcon,
} from 'lucide-react'
import { Panel } from '@/components/dashboard/panel'
import { getClients } from '@/lib/supabase-data'
import { markClubPaymentAndRecord, setClubSubscription } from '@/lib/supabase-club'
import {
  CLUB_PLANS,
  EXPENSE_CATEGORIES,
  PLAN_PRICES,
  createClubPayment,
  createExpense,
  createRecurringExpense,
  deleteClubPayment,
  deleteExpense,
  deleteRecurringExpense,
  getMonthFinance,
  markRecurringPaid,
  todayString,
  type ClubForecastItem,
  type DailyPoint,
  type MonthFinance,
  type PendingExpense,
} from '@/lib/supabase-finance'
import type { Client } from '@/lib/types'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

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

/* ---------- Chave "recorrente" (usada nas janelas de despesa e de mensalidade) ---------- */

function RecurringToggle({
  checked,
  onChange,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  hint: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
        checked ? 'border-gold/40 bg-gold/10' : 'border-border bg-background/30',
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Repeat className={cn('size-4 shrink-0', checked ? 'text-gold' : 'text-muted-foreground')} />
        <span className="min-w-0">
          <span className="block text-sm font-medium">Recorrente</span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
      </span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-gold' : 'bg-white/10',
        )}
      >
        <span
          className={cn(
            'inline-block size-4 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}

// "2026-09-21" + 30 dias -> "2026-10-21"
function addDaysToDay(day: string, days: number) {
  const d = new Date(`${day}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  const [recurring, setRecurring] = useState(false)
  const [dueDay, setDueDay] = useState(String(new Date().getDate()))
  const [startMonth, setStartMonth] = useState(todayString().slice(0, 7))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  async function handleSave() {
    if (savingRef.current) return
    setError(null)

    const value = parseAmount(amount)
    const dueDayNumber = Number(dueDay)
    if (recurring) {
      if (!Number.isInteger(dueDayNumber) || dueDayNumber < 1 || dueDayNumber > 31) {
        return setError('O dia do vencimento precisa ser de 1 a 31.')
      }
      if (!startMonth) return setError('Escolha o mês em que começa.')
    } else if (!day) {
      return setError('Escolha a data.')
    }
    if (!description.trim()) return setError('Escreva uma descrição.')
    if (!(value > 0)) return setError('Informe um valor maior que zero.')

    savingRef.current = true
    setSaving(true)
    try {
      if (recurring) {
        await createRecurringExpense({
          description: description.trim(),
          category,
          amount: value,
          due_day: dueDayNumber,
          start_month: startMonth,
        })
      } else {
        await createExpense({
          day,
          category,
          description: description.trim(),
          amount: value,
        })
      }
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
          <h3 className="text-base font-semibold">
            {recurring ? 'Cadastrar despesa recorrente' : 'Lançar despesa'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <RecurringToggle
            checked={recurring}
            onChange={setRecurring}
            hint="Repete todo mês, com vencimento"
          />
          {recurring ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Dia do vencimento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    inputMode="numeric"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Começa em</label>
                  <input
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
              <p className="text-xs leading-snug text-muted-foreground">
                Todo mês ela aparece em Pagamentos futuros no dia do vencimento. Você confirma
                quando pagar, e só então entra no lucro. Em meses curtos, o dia 31 vale o último
                dia do mês.
              </p>
            </>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data</label>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className={fieldClass}
              />
            </div>
          )}
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
            {saving ? 'Salvando...' : recurring ? 'Cadastrar' : 'Lançar'}
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
  const [recurring, setRecurring] = useState(false)
  const [receivedNow, setReceivedNow] = useState(true)
  const [dueDate, setDueDate] = useState('')
  const [dueTouched, setDueTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  const selectedClient = clients.find((c) => c.id === clientId)

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

  // Vencimento sugerido, no mesmo padrão de Clientes: +30 dias a partir de hoje ou do vencimento
  // atual (o que for mais tarde). Sem pagamento agora, sugere o vencimento atual do cliente.
  useEffect(() => {
    if (!recurring || dueTouched) return
    const current = selectedClient?.club_due_date || ''
    if (receivedNow) {
      setDueDate(addDaysToDay(current && current > day ? current : day, 30))
    } else {
      setDueDate(current || day)
    }
  }, [recurring, receivedNow, dueTouched, day, selectedClient])

  function handlePlanChange(value: string) {
    setPlan(value)
    if (PLAN_PRICES[value] !== undefined) setAmount(String(PLAN_PRICES[value]))
  }

  function handleClientChange(id: string) {
    setClientId(id)
    setDueTouched(false)
    // Cliente que já é assinante: já vem com o plano dele
    const found = clients.find((c) => c.id === id)
    if (found?.club_plan && CLUB_PLANS.includes(found.club_plan)) handlePlanChange(found.club_plan)
  }

  async function handleSave() {
    if (savingRef.current) return
    setError(null)

    const value = parseAmount(amount)
    const needsPayment = !recurring || receivedNow
    if (recurring) {
      if (!clientId) return setError('Escolha o cliente: a assinatura recorrente fica ligada a ele.')
      if (!dueDate) return setError('Informe o vencimento.')
    }
    if (needsPayment) {
      if (!day) return setError('Escolha a data.')
      if (!(value > 0)) return setError('Informe um valor maior que zero.')
    }

    savingRef.current = true
    setSaving(true)
    try {
      if (recurring) {
        await setClubSubscription({
          clientId,
          plan,
          dueDate,
          payment: receivedNow ? { day, amount: value, note } : undefined,
        })
      } else {
        await createClubPayment({
          day,
          client_id: clientId || null,
          plan,
          amount: value,
          note,
        })
      }
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
          <h3 className="text-base font-semibold">
            {recurring ? 'Assinatura recorrente do clube' : 'Lançar mensalidade'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <RecurringToggle
            checked={recurring}
            onChange={setRecurring}
            hint="Renova todo mês, com vencimento"
          />

          {recurring && (
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/40 p-1">
              {(
                [
                  [true, 'Já recebi'],
                  [false, 'Só agendar vencimento'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setReceivedNow(value)
                    setDueTouched(false)
                  }}
                  className={
                    receivedNow === value
                      ? 'rounded-md bg-gold px-2 py-1.5 text-xs font-semibold text-primary-foreground'
                      : 'rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {(!recurring || receivedNow) && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data do pagamento</label>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className={fieldClass}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {recurring ? 'Cliente' : 'Cliente (opcional)'}
            </label>
            <select
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className={fieldClass}
            >
              <option value="">{recurring ? 'Escolha o cliente' : 'Sem cliente'}</option>
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
          {(!recurring || receivedNow) && (
            <>
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
                <label className="mb-1 block text-xs text-muted-foreground">
                  Observação (opcional)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={fieldClass}
                  placeholder="Ex.: pago no Pix"
                />
              </div>
            </>
          )}

          {recurring && (
            <>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {receivedNow ? 'Próximo vencimento' : 'Vencimento'}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value)
                    setDueTouched(true)
                  }}
                  className={fieldClass}
                />
              </div>
              <p className="text-xs leading-snug text-muted-foreground">
                {receivedNow
                  ? 'Lança a mensalidade no clube e deixa o plano e o vencimento salvos no cliente, igual a Marcar pagamento em Clientes. Todo mês ele aparece na renda prevista.'
                  : 'Só salva o plano e o vencimento no cliente. Nada entra na receita até você confirmar o pagamento em Recebi.'}
              </p>
            </>
          )}
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
            {saving ? 'Salvando...' : recurring && !receivedNow ? 'Agendar' : 'Lançar'}
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
    <div className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/25 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', tone)}>
          <Icon className="size-[18px]" />
        </span>
        <p className="min-w-0 truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 break-words text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs leading-snug text-muted-foreground">{detail}</p>}
    </div>
  )
}

/* ---------- Título de seção ---------- */

function SectionTitle({
  icon: Icon,
  children,
  hint,
}: {
  icon: LucideIcon
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-[18px] shrink-0 text-gold" />
        <h2 className="truncate text-[15px] font-semibold tracking-tight">{children}</h2>
      </div>
      {hint && (
        <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>
      )}
    </div>
  )
}

/* ---------- Lista com "ver todos" ---------- */

const LIST_PREVIEW = 6

function ExpandableList<T>({
  items,
  renderItem,
  noun,
}: {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  noun: string
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, LIST_PREVIEW)
  const hidden = items.length - visible.length

  return (
    <>
      <ul className="-mx-2 divide-y divide-border/50">{visible.map(renderItem)}</ul>
      {hidden > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 h-10 w-full rounded-lg border border-border text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver todos os {items.length} {noun}
        </button>
      )}
      {showAll && items.length > LIST_PREVIEW && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 h-10 w-full rounded-lg border border-border text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Mostrar menos
        </button>
      )}
    </>
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
  const [width, setWidth] = useState(W)
  const [hover, setHover] = useState<number | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)

  // Desenha na largura real: sem isso os rótulos encolhem junto com o SVG no celular
  const wrapRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    if (!el) return
    setWidth(Math.round(el.getBoundingClientRect().width) || W)
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setWidth(Math.round(w))
    })
    ro.observe(el)
    roRef.current = ro
  }, [])

  useEffect(() => () => roRef.current?.disconnect(), [])

  const chartW = width
  const innerWidth = Math.max(40, chartW - PAD_L - PAD_R)

  const maxValue = niceMax(Math.max(0, ...daily.map((d) => Math.max(d.revenue, d.expense))))
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxValue)
  const n = daily.length
  const step = innerWidth / n
  const barW = Math.min(step * 0.34, 9)
  const gap = 2

  const y = (v: number) => PAD_T + innerH - (v / maxValue) * innerH

  // Dia em foco: por padrão o de maior movimento, para o painel nunca ficar vazio
  const peak = useMemo(() => {
    let best = 0
    daily.forEach((d, i) => {
      if (d.revenue + d.expense > daily[best].revenue + daily[best].expense) best = i
    })
    return best
  }, [daily])

  const activeIndex = hover ?? peak
  const active = daily[activeIndex]

  // Rótulos do eixo com folga garantida
  const labelIndexes = useMemo(() => {
    const minGap = 26
    const every = Math.max(1, Math.ceil(minGap / Math.max(1, step)))
    const out: number[] = []
    for (let i = 0; i < n; i += every) out.push(i)
    return out
  }, [n, step])

  return (
    <Panel className="flex flex-col p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
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

      {/* Leitura do dia em foco, no lugar de números sobre cada barra */}
      {active && (
        <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold tabular-nums">
            Dia {String(active.day).padStart(2, '0')}
          </span>
          <span className="tabular-nums text-gold">{currency.format(active.revenue)}</span>
          <span className="tabular-nums text-danger">{currency.format(active.expense)}</span>
          {hover === null && (
            <span className="text-xs text-muted-foreground">· dia de maior movimento</span>
          )}
        </div>
      )}

      <div ref={wrapRef} className="w-full" onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${chartW} ${H}`}
        width={chartW}
        height={H}
        className="h-[240px] w-full"
        role="img"
        aria-label="Gráfico comparando receitas e despesas ao longo do mês"
      >
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={PAD_L}
              x2={chartW - PAD_R}
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
              className="fill-muted-foreground text-[10px]"
            >
              {g === 0 ? '0' : Math.round(g).toLocaleString('pt-BR')}
            </text>
          </g>
        ))}

        {daily.map((d, i) => {
          const center = PAD_L + i * step + step / 2
          const isActive = i === activeIndex
          return (
            <g key={d.day}>
              <title>{`Dia ${d.day}: receitas ${currency.format(d.revenue)} · despesas ${currency.format(d.expense)}`}</title>
              {/* área de toque maior que as barras */}
              <rect
                x={PAD_L + i * step}
                y={PAD_T}
                width={step}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {d.revenue > 0 && (
                <rect
                  x={center - barW - gap / 2}
                  y={y(d.revenue)}
                  width={barW}
                  height={Math.max(2, PAD_T + innerH - y(d.revenue))}
                  rx={2}
                  className={cn('pointer-events-none', isActive ? 'fill-gold' : 'fill-gold/45')}
                />
              )}
              {d.expense > 0 && (
                <rect
                  x={center + gap / 2}
                  y={y(d.expense)}
                  width={barW}
                  height={Math.max(2, PAD_T + innerH - y(d.expense))}
                  rx={2}
                  className={cn('pointer-events-none', isActive ? 'fill-danger' : 'fill-danger/45')}
                />
              )}
            </g>
          )
        })}

        {labelIndexes.map((i) => {
          const d = daily[i]
          if (!d) return null
          return (
            <text
              key={`l-${d.day}`}
              x={PAD_L + i * step + step / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {String(d.day).padStart(2, '0')}
            </text>
          )
        })}
      </svg>
      </div>
    </Panel>
  )
}

/* ---------- Pagamentos futuros: despesas a pagar e renda prevista do clube ---------- */

function OverdueBadge() {
  return (
    <span className="ml-1.5 rounded-full bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
      Atrasada
    </span>
  )
}

function FutureBills({
  data,
  monthKey,
  currentKey,
  busyKey,
  onPayExpense,
  onPayClub,
  onRemoveRecurring,
}: {
  data: MonthFinance
  monthKey: string
  currentKey: string
  busyKey: string | null
  onPayExpense: (item: PendingExpense) => void
  onPayClub: (item: ClubForecastItem) => void
  onRemoveRecurring: (id: string, description: string) => void
}) {
  const isPastMonth = monthKey < currentKey
  const canConfirmClub = monthKey === currentKey
  const projectedProfit = data.profit + data.clubForecastTotal - data.pendingExpensesTotal

  const smallButton =
    'inline-flex h-9 shrink-0 items-center rounded-lg border border-gold/40 bg-gold/10 px-3 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <CalendarClock className="size-[18px] shrink-0 text-gold" />
        <h2 className="text-[15px] font-semibold tracking-tight">Pagamentos futuros</h2>
      </div>

      {!isPastMonth && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="A pagar"
            value={currency.format(data.pendingExpensesTotal)}
            detail={`${data.pendingExpenses.length} despesa(s) recorrente(s)`}
            icon={Wallet}
            tone="bg-danger/12 text-danger"
          />
          <StatCard
            label="Clube previsto"
            value={currency.format(data.clubForecastTotal)}
            detail={`${data.clubForecast.length} mensalidade(s) esperada(s)`}
            icon={Crown}
            tone="bg-success/12 text-success"
          />
          <StatCard
            label="Lucro previsto"
            value={currency.format(projectedProfit)}
            detail="Lucro do mês + clube previsto − despesas a pagar"
            icon={CircleDollarSign}
            tone="bg-gold/12 text-gold"
          />
        </div>
      )}

      <div className={cn('grid grid-cols-1 gap-5', !isPastMonth && 'xl:grid-cols-2')}>
        <Panel className="p-5">
          <SectionTitle
            icon={TrendingDown}
            hint={data.pendingExpenses.length > 0 ? currency.format(data.pendingExpensesTotal) : undefined}
          >
            Despesas a pagar
          </SectionTitle>
          {!data.recurringAvailable ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Para usar despesas recorrentes, rode o arquivo{' '}
              <span className="font-medium text-foreground">supabase/recurring.sql</span> no SQL
              Editor do Supabase.
            </p>
          ) : data.pendingExpenses.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma despesa recorrente a pagar neste mês.
            </p>
          ) : (
            <ul className="-mx-2 divide-y divide-border/50">
              {data.pendingExpenses.map((p) => (
                <li
                  key={p.recurringId}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.description}
                      {p.overdue && <OverdueBadge />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence {shortDay(p.dueDate)} · <span className="capitalize">{p.category}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-danger">
                      - {currency.format(p.amount)}
                    </span>
                    <button
                      onClick={() => onPayExpense(p)}
                      disabled={busyKey === p.recurringId}
                      className={smallButton}
                    >
                      {busyKey === p.recurringId ? 'Salvando...' : 'Paguei'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data.recurringAvailable && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Repeat className="size-3.5" />
                Cadastradas (repetem todo mês)
              </p>
              {data.recurringList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ainda. Em Lançar despesa, ative a chave Recorrente.
                </p>
              ) : (
                <ul className="-mx-2 divide-y divide-border/50">
                  {data.recurringList.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Todo dia {r.due_day} · <span className="capitalize">{r.category}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {currency.format(r.amount)}
                        </span>
                        <button
                          onClick={() => onRemoveRecurring(r.id, r.description)}
                          aria-label="Encerrar recorrência"
                          title="Encerrar recorrência"
                          className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger sm:size-8"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Panel>

        {!isPastMonth && (
          <Panel className="p-5">
            <SectionTitle
              icon={Crown}
              hint={data.clubForecast.length > 0 ? currency.format(data.clubForecastTotal) : undefined}
            >
              Renda prevista do clube
            </SectionTitle>
            {data.clubForecast.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma mensalidade esperada neste mês.
              </p>
            ) : (
              <ul className="-mx-2 divide-y divide-border/50">
                {data.clubForecast.map((c) => (
                  <li
                    key={c.clientId}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.name}
                        {c.overdue && <OverdueBadge />}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Vence {shortDay(c.dueDate)} · {c.plan}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-success">
                        + {currency.format(c.amount)}
                      </span>
                      {canConfirmClub && (
                        <button
                          onClick={() => onPayClub(c)}
                          disabled={busyKey === c.clientId}
                          className={smallButton}
                        >
                          {busyKey === c.clientId ? 'Salvando...' : 'Recebi'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs leading-snug text-muted-foreground">
              Previsão pelo vencimento atual de cada assinante. Nos meses seguintes, considera que
              ele renova no mesmo dia. Ao marcar Recebi, a mensalidade é lançada no clube e o
              vencimento avança.
            </p>
          </Panel>
        )}
      </div>
    </div>
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
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    kind: 'expense' | 'club' | 'recurring'
    id: string
    label: string
  } | null>(null)

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

  function handleDeleteExpense(id: string, description: string) {
    setPendingDelete({ kind: 'expense', id, label: description })
  }

  function handleDeleteClub(id: string, plan: string) {
    setPendingDelete({ kind: 'club', id, label: plan })
  }

  function handleRemoveRecurring(id: string, description: string) {
    setPendingDelete({ kind: 'recurring', id, label: description })
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const { kind, id } = pendingDelete
    setPendingDelete(null)
    try {
      if (kind === 'expense') await deleteExpense(id)
      else if (kind === 'recurring') await deleteRecurringExpense(id)
      else await deleteClubPayment(id)
      reload()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : kind === 'expense'
            ? 'Erro ao apagar despesa'
            : kind === 'recurring'
              ? 'Erro ao encerrar despesa recorrente'
              : 'Erro ao apagar mensalidade',
      )
    }
  }

  async function handlePayExpense(item: PendingExpense) {
    if (busyKey) return
    setBusyKey(item.recurringId)
    setError(null)
    try {
      await markRecurringPaid(item, year, month)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar o pagamento')
    } finally {
      setBusyKey(null)
    }
  }

  async function handlePayClub(item: ClubForecastItem) {
    if (busyKey) return
    setBusyKey(item.clientId)
    setError(null)
    try {
      await markClubPaymentAndRecord(item.clientId, item.plan, item.dueDate, item.amount)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao lançar a mensalidade')
    } finally {
      setBusyKey(null)
    }
  }

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const currentKey = todayString().slice(0, 7)

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

      {pendingDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-2 text-base font-semibold">
              {pendingDelete.kind === 'expense'
                ? 'Apagar despesa'
                : pendingDelete.kind === 'recurring'
                  ? 'Encerrar despesa recorrente'
                  : 'Apagar mensalidade'}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {pendingDelete.kind === 'recurring'
                ? 'Ela deixa de aparecer como a pagar nos próximos meses. O que já foi pago continua no histórico.'
                : 'O lançamento sai do mês e o lucro é recalculado. Não dá para desfazer.'}
            </p>
            <div className="mb-5 rounded-lg border border-border bg-background/40 px-3 py-2">
              <p className="truncate text-sm font-medium">{pendingDelete.label}</p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setPendingDelete(null)}
                className="h-11 rounded-lg border border-border px-3.5 text-sm text-muted-foreground hover:text-foreground sm:h-auto sm:py-2"
              >
                Voltar
              </button>
              <button
                onClick={confirmDelete}
                className="h-11 rounded-lg bg-danger px-3.5 text-sm font-semibold text-white hover:brightness-105 sm:h-auto sm:py-2"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full items-center justify-between gap-1 rounded-xl border border-border bg-background/40 px-1 py-1 sm:w-auto sm:justify-start">
          <button
            aria-label="Mês anterior"
            onClick={() => changeMonth(-1)}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-0 flex-1 truncate px-2 text-center text-sm font-semibold sm:min-w-[9rem] sm:flex-none">
            {monthLabel}
          </span>
          <button
            aria-label="Próximo mês"
            onClick={() => changeMonth(1)}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            onClick={() => setClubOpen(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:h-10 sm:flex-none"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Lançar mensalidade</span>
            <span className="sm:hidden">Mensalidade</span>
          </button>
          <button
            onClick={() => setExpenseOpen(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold px-3 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 sm:h-10 sm:flex-none"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Lançar despesa</span>
            <span className="sm:hidden">Despesa</span>
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
            {/* Lucro em destaque: é o número que resume o mês */}
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
                      Lucro do mês
                    </p>
                    <p
                      className={cn(
                        'mt-2 text-[40px] font-bold leading-none tracking-tight tabular-nums sm:text-5xl',
                        data.profit < 0 && 'text-danger',
                      )}
                    >
                      {currency.format(data.profit)}
                    </p>
                  </div>

                  {income > 0 && (
                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Margem
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-2xl font-bold leading-none tabular-nums',
                          data.profit >= 0 ? 'text-success' : 'text-danger',
                        )}
                      >
                        {Math.round((data.profit / income) * 100)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Quanto das entradas sobrou depois das saídas */}
                {income > 0 && (
                  <div className="mt-5">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full bg-success/80"
                        style={{
                          width: `${Math.max(0, Math.min(100, ((income - data.expenses) / income) * 100))}%`,
                        }}
                      />
                      <div
                        className="h-full bg-danger/80"
                        style={{
                          width: `${Math.max(0, Math.min(100, (data.expenses / income) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <TrendingUp className="size-4 text-success" />
                        <span className="text-muted-foreground">Entradas</span>
                        <span className="font-semibold tabular-nums">
                          {currency.format(income)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <TrendingDown className="size-4 text-danger" />
                        <span className="text-muted-foreground">Saídas</span>
                        <span className="font-semibold tabular-nums">
                          {currency.format(data.expenses)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Cartões de apoio */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard
                label="Avulso"
                value={currency.format(data.walkIn)}
                detail={`${data.completed} atendimento(s) concluído(s)`}
                icon={Scissors}
                tone="bg-gold/12 text-gold"
              />
              <StatCard
                label="Clube"
                value={currency.format(data.club)}
                detail={
                  data.clubAddons > 0
                    ? `${data.clubList.length} mensalidade(s) · Extras ${currency.format(data.clubAddons)}`
                    : `${data.clubList.length} mensalidade(s) lançada(s)`
                }
                icon={Crown}
                tone="bg-success/12 text-success"
              />
              <StatCard
                label="Saídas"
                value={currency.format(data.expenses)}
                detail={`${data.expenseList.length} despesa(s) lançada(s)`}
                icon={Wallet}
                tone="bg-danger/12 text-danger"
              />
              <StatCard
                label="Ticket médio"
                value={
                  data.completed > 0
                    ? currency.format(data.walkIn / data.completed)
                    : currency.format(0)
                }
                detail={
                  data.clubVisits > 0
                    ? `Avulso · +${data.clubVisits} atendimento(s) do clube`
                    : 'Média dos atendimentos avulsos'
                }
                icon={Receipt}
                tone="bg-info/12 text-info"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              O valor avulso soma os atendimentos marcados como concluídos na agenda. O valor do
              clube vem das mensalidades que você lança aqui.
            </p>

            {/* Pagamentos futuros */}
            <FutureBills
              data={data}
              monthKey={monthKey}
              currentKey={currentKey}
              busyKey={busyKey}
              onPayExpense={handlePayExpense}
              onPayClub={handlePayClub}
              onRemoveRecurring={handleRemoveRecurring}
            />

            {/* Gráfico */}
            <DailyChart daily={data.daily} />

            {/* Por serviço e por categoria */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Panel className="p-5">
                <SectionTitle icon={Scissors}>Entradas por serviço (avulso)</SectionTitle>
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
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
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
                <SectionTitle icon={Wallet}>Despesas por categoria</SectionTitle>
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
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
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
              <SectionTitle icon={CalendarCheck} hint={`${data.walkInList.length} atendimento(s)`}>Atendimentos avulsos do mês</SectionTitle>
              {data.walkInList.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum atendimento concluído neste mês. Marque como Concluído na agenda para ele
                  aparecer aqui.
                </p>
              ) : (
                <ExpandableList
                  items={data.walkInList}
                  noun="atendimentos"
                  renderItem={(w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
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
                  )}
                />
              )}
            </Panel>

            {/* Extras vendidos em visitas do clube */}
            {data.clubAddonsList.length > 0 && (
              <Panel className="p-5">
                <SectionTitle icon={Crown} hint={currency.format(data.clubAddons)}>Extras do clube (serviços adicionais)</SectionTitle>
                <ExpandableList
                  items={data.clubAddonsList}
                  noun="extras"
                  renderItem={(w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
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
                  )}
                />
              </Panel>
            )}

            {/* Listas de lançamentos */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Panel className="p-5">
                <SectionTitle icon={TrendingDown} hint={currency.format(data.expenses)}>Despesas do mês</SectionTitle>
                {data.expenseList.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma despesa neste mês.
                  </p>
                ) : (
                  <ul className="-mx-2 divide-y divide-border/50">
                    {data.expenseList.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
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
                            className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger sm:size-8"
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
                <SectionTitle icon={Crown} hint={currency.format(data.club)}>Mensalidades do clube</SectionTitle>
                {data.clubList.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma mensalidade neste mês.
                  </p>
                ) : (
                  <ul className="-mx-2 divide-y divide-border/50">
                    {data.clubList.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
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
                            className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger sm:size-8"
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