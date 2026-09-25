import { supabase } from './supabase'

export const EXPENSE_CATEGORIES = [
  'aluguel',
  'luz',
  'água',
  'internet',
  'produtos',
  'equipamentos',
  'impostos',
  'marketing',
  'outros',
]

export const CLUB_PLANS = ['Corte', 'Corte e barba', 'Barba']

// Valor sugerido de cada plano do clube (o Juan pode mudar na hora de lançar).
// Também é a base da previsão de renda do clube nos meses seguintes.
export const PLAN_PRICES: Record<string, number> = {
  Corte: 139,
  'Corte e barba': 229,
  Barba: 159,
}

export interface Expense {
  id: string
  day: string
  description: string
  category: string
  amount: number
  recurring_id: string | null
}

// Despesa que se repete todo mês (aluguel, internet...)
export interface RecurringExpense {
  id: string
  description: string
  category: string
  amount: number
  due_day: number // 1 a 31
  start_month: string // "2026-10-01"
}

// Recorrente que ainda não foi paga no mês em vista
export interface PendingExpense {
  recurringId: string
  description: string
  category: string
  amount: number
  dueDate: string // "2026-10-05"
  overdue: boolean
}

// Mensalidade do clube esperada no mês em vista, ainda sem pagamento lançado
export interface ClubForecastItem {
  clientId: string
  name: string
  plan: string
  amount: number
  dueDate: string
  overdue: boolean
}

export interface ClubPayment {
  id: string
  day: string
  client_id: string | null
  client_name: string | null
  plan: string
  amount: number
  note: string | null
}

export interface WalkInItem {
  id: string
  day: string // "2026-09-21"
  time: string // "14:30"
  client: string
  service: string
  addonService: string | null
  addonPrice: number
  price: number
  isClubVisit: boolean
}

export interface DailyPoint {
  day: number
  revenue: number
  expense: number
}

export interface CategoryTotal {
  category: string
  total: number
}

export interface ServiceTotal {
  name: string
  count: number
  total: number
}

export interface MonthFinance {
  walkIn: number // entradas dos atendimentos concluídos avulsos (sem clube)
  club: number // mensalidades lançadas
  clubAddons: number // extras vendidos durante visitas do clube (ex: sobrancelha)
  expenses: number // despesas lançadas
  profit: number
  completed: number // atendimentos concluídos avulsos
  clubVisits: number // atendimentos concluídos que eram do clube (não geram receita aqui)
  expenseList: Expense[]
  clubList: ClubPayment[]
  walkInList: WalkInItem[]
  clubAddonsList: WalkInItem[]
  daily: DailyPoint[]
  byCategory: CategoryTotal[]
  byService: ServiceTotal[]
  // Pagamentos futuros
  recurringAvailable: boolean // false enquanto supabase/recurring.sql não foi rodado
  recurringList: RecurringExpense[]
  pendingExpenses: PendingExpense[]
  pendingExpensesTotal: number
  clubForecast: ClubForecastItem[]
  clubForecastTotal: number
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function dayString(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export function todayString() {
  const d = new Date()
  return dayString(d.getFullYear(), d.getMonth(), d.getDate())
}

// "2026-09-21" -> 21
function dayNumber(day: string) {
  return Number(day.slice(8, 10))
}

// Vencimento dentro de um mês. Dia 31 em mês de 30 dias vira o último dia do mês.
export function dueDateInMonth(year: number, month: number, dueDay: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return dayString(year, month, Math.min(Math.max(dueDay, 1), daysInMonth))
}

// Recorrentes (ainda não pagas neste mês) e previsão do clube. Só faz sentido do mês atual em diante.
function buildPending(params: {
  year: number
  month: number
  recurring: RecurringExpense[]
  paidRecurringIds: Set<string>
}): { list: PendingExpense[]; total: number } {
  const { year, month, recurring, paidRecurringIds } = params
  const monthKey = dayString(year, month, 1).slice(0, 7)
  const today = todayString()
  const isPastOrCurrent = monthKey <= today.slice(0, 7)

  const list = recurring
    .filter((r) => r.start_month.slice(0, 7) <= monthKey && !paidRecurringIds.has(r.id))
    .map((r) => {
      const dueDate = dueDateInMonth(year, month, r.due_day)
      return {
        recurringId: r.id,
        description: r.description,
        category: r.category,
        amount: r.amount,
        dueDate,
        overdue: isPastOrCurrent && dueDate < today,
      }
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return { list, total: list.reduce((sum, p) => sum + p.amount, 0) }
}

// Assinantes que devem pagar no mês em vista e ainda não têm pagamento lançado nele.
// Usa o vencimento atual de cada assinante; nos meses seguintes assume que renova no mesmo dia.
function buildClubForecast(params: {
  year: number
  month: number
  members: { id: string; name: string; club_plan: string; club_due_date: string }[]
  paidClientIds: Set<string>
}): { list: ClubForecastItem[]; total: number } {
  const { year, month, members, paidClientIds } = params
  const monthKey = dayString(year, month, 1).slice(0, 7)
  const today = todayString()
  const currentKey = today.slice(0, 7)

  // Meses passados já estão fechados: o que valeu foi o que foi lançado
  if (monthKey < currentKey) return { list: [], total: 0 }

  const list: ClubForecastItem[] = []
  for (const m of members) {
    if (!m.club_due_date || paidClientIds.has(m.id)) continue
    const dueKey = m.club_due_date.slice(0, 7)
    if (dueKey > monthKey) continue // vence só em mês posterior

    // Vencimento deste mês: o dia exato se cai no mês; senão o mesmo dia do mês (renovação)
    // No mês atual, quem está atrasado de meses anteriores mostra a data real do vencimento
    const dueDate =
      dueKey === monthKey || monthKey === currentKey
        ? m.club_due_date
        : dueDateInMonth(year, month, dayNumber(m.club_due_date))

    list.push({
      clientId: m.id,
      name: m.name,
      plan: m.club_plan,
      amount: PLAN_PRICES[m.club_plan] ?? 0,
      dueDate,
      overdue: monthKey === currentKey && dueDate < today,
    })
  }
  list.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return { list, total: list.reduce((sum, i) => sum + i.amount, 0) }
}

// month: 0 = janeiro
export async function getMonthFinance(year: number, month: number): Promise<MonthFinance> {
  const startDay = dayString(year, month, 1)
  const nextYear = month === 11 ? year + 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const endDay = dayString(nextYear, nextMonth, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const [appts, exp, club, rec, members] = await Promise.all([
    supabase
      .from('barberpro_appointments')
      .select(
        'id, time, status, is_club_visit, addon_price, barberpro_clients (name), barberpro_services!service_id (name, price), addon_service:barberpro_services!addon_service_id (name)',
      )
      .gte('time', `${startDay}T00:00:00`)
      .lt('time', `${endDay}T00:00:00`)
      .eq('status', 'concluido')
      .order('time', { ascending: false }),
    // "*" para funcionar mesmo antes de rodar supabase/recurring.sql (colunas novas opcionais)
    supabase
      .from('barberpro_expenses')
      .select('*')
      .gte('day', startDay)
      .lt('day', endDay)
      .order('day', { ascending: false }),
    supabase
      .from('barberpro_club_payments')
      .select('id, day, client_id, plan, amount, note, barberpro_clients (name)')
      .gte('day', startDay)
      .lt('day', endDay)
      .order('day', { ascending: false }),
    // Pagamentos futuros: se a tabela ainda não existe, o Financeiro segue sem essa parte
    supabase
      .from('barberpro_recurring_expenses')
      .select('id, description, category, amount, due_day, start_month')
      .order('due_day', { ascending: true }),
    supabase
      .from('barberpro_clients')
      .select('id, name, club_plan, club_due_date')
      .not('club_plan', 'is', null)
      .not('club_due_date', 'is', null),
  ])

  if (appts.error) throw new Error(`Erro ao buscar atendimentos: ${appts.error.message}`)
  if (exp.error) throw new Error(`Erro ao buscar despesas: ${exp.error.message}`)
  if (club.error) throw new Error(`Erro ao buscar mensalidades: ${club.error.message}`)

  const allWalkIn: WalkInItem[] = (appts.data || []).map((a: any) => {
    const timeStr: string = String(a.time)
    return {
      id: a.id,
      day: timeStr.slice(0, 10),
      time: timeStr.slice(11, 16),
      client: a.barberpro_clients?.name || 'Cliente desconhecido',
      service: a.barberpro_services?.name || 'Serviço desconhecido',
      addonService: a.addon_service?.name || null,
      addonPrice: Number(a.addon_price || 0),
      price: a.is_club_visit ? Number(a.addon_price || 0) : (Number(a.barberpro_services?.price || 0) + Number(a.addon_price || 0)),
      isClubVisit: !!a.is_club_visit,
    }
  })

  // Visitas do clube contam como atendimento, mas não geram receita aqui
  // (a receita delas já entrou quando a mensalidade foi paga)
  // Exceção: extras vendidos na visita (ex: sobrancelha) geram receita separada
  const walkInList = allWalkIn.filter((w) => !w.isClubVisit)
  const clubAddonsList = allWalkIn.filter((w) => w.isClubVisit && w.price > 0)
  const clubVisitsCount = allWalkIn.length - walkInList.length

  const expenseList: Expense[] = (exp.data || []).map((e: any) => ({
    id: e.id,
    day: e.day,
    description: e.description,
    category: e.category,
    amount: Number(e.amount),
    recurring_id: e.recurring_id ?? null,
  }))

  const clubList: ClubPayment[] = (club.data || []).map((c: any) => ({
    id: c.id,
    day: c.day,
    client_id: c.client_id,
    client_name: c.barberpro_clients?.name ?? null,
    plan: c.plan,
    amount: Number(c.amount),
    note: c.note,
  }))

  const walkIn = walkInList.reduce((sum, w) => sum + w.price, 0)
  const clubTotal = clubList.reduce((sum, c) => sum + c.amount, 0)
  const clubAddonsTotal = clubAddonsList.reduce((sum, w) => sum + w.price, 0)
  const expenseTotal = expenseList.reduce((sum, e) => sum + e.amount, 0)

  // Valores dia a dia (entradas = avulso sem clube + mensalidades; saídas = despesas)
  const daily: DailyPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    revenue: 0,
    expense: 0,
  }))
  for (const w of walkInList) {
    const p = daily[dayNumber(w.day) - 1]
    if (p) p.revenue += w.price
  }
  for (const c of clubList) {
    const p = daily[dayNumber(c.day) - 1]
    if (p) p.revenue += c.amount
  }
  for (const w of clubAddonsList) {
    const p = daily[dayNumber(w.day) - 1]
    if (p) p.revenue += w.price
  }
  for (const e of expenseList) {
    const p = daily[dayNumber(e.day) - 1]
    if (p) p.expense += e.amount
  }

  // Despesas por categoria (maior primeiro)
  const catMap = new Map<string, number>()
  for (const e of expenseList) {
    catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount)
  }
  const byCategory: CategoryTotal[] = Array.from(catMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  // Entradas por serviço (avulso: base + extra; clube: só o extra), maior primeiro
  const svcMap = new Map<string, { count: number; total: number }>()
  for (const w of walkInList) {
    const basePrice = w.price - w.addonPrice
    if (basePrice > 0) {
      const cur = svcMap.get(w.service) || { count: 0, total: 0 }
      cur.count += 1
      cur.total += basePrice
      svcMap.set(w.service, cur)
    }
    if (w.addonPrice > 0) {
      const name = w.addonService || 'Extra'
      const cur = svcMap.get(name) || { count: 0, total: 0 }
      cur.count += 1
      cur.total += w.addonPrice
      svcMap.set(name, cur)
    }
  }
  for (const w of clubAddonsList) {
    const name = w.addonService || 'Extra'
    const cur = svcMap.get(name) || { count: 0, total: 0 }
    cur.count += 1
    cur.total += w.price
    svcMap.set(name, cur)
  }
  const byService: ServiceTotal[] = Array.from(svcMap.entries())
    .map(([name, v]) => ({ name, count: v.count, total: v.total }))
    .sort((a, b) => b.total - a.total || b.count - a.count)

  // Pagamentos futuros (nada disso entra no lucro até ser pago)
  const recurringAvailable = !rec.error
  const recurringList: RecurringExpense[] = (rec.data || []).map((r: any) => ({
    id: r.id,
    description: r.description,
    category: r.category,
    amount: Number(r.amount),
    due_day: Number(r.due_day),
    start_month: String(r.start_month),
  }))

  const paidRecurringIds = new Set(
    expenseList.filter((e) => e.recurring_id).map((e) => e.recurring_id as string),
  )
  const pending = buildPending({ year, month, recurring: recurringList, paidRecurringIds })

  const paidClientIds = new Set(
    clubList.filter((c) => c.client_id).map((c) => c.client_id as string),
  )
  const forecast = members.error
    ? { list: [] as ClubForecastItem[], total: 0 }
    : buildClubForecast({
        year,
        month,
        members: (members.data || []) as any[],
        paidClientIds,
      })

  return {
    walkIn,
    club: clubTotal,
    clubAddons: clubAddonsTotal,
    expenses: expenseTotal,
    profit: walkIn + clubTotal + clubAddonsTotal - expenseTotal,
    completed: walkInList.length,
    clubVisits: clubVisitsCount,
    expenseList,
    clubList,
    walkInList,
    clubAddonsList,
    daily,
    byCategory,
    byService,
    recurringAvailable,
    recurringList,
    pendingExpenses: pending.list,
    pendingExpensesTotal: pending.total,
    clubForecast: forecast.list,
    clubForecastTotal: forecast.total,
  }
}

export async function createExpense(params: {
  day: string
  description: string
  category: string
  amount: number
  recurring_id?: string
  recurring_month?: string
}): Promise<void> {
  const { error } = await supabase.from('barberpro_expenses').insert(params)
  if (error) throw new Error(`Erro ao lançar despesa: ${error.message}`)
}

const RECURRING_MISSING_MESSAGE =
  'Para usar despesas recorrentes, rode o arquivo supabase/recurring.sql no SQL Editor do Supabase.'

function isMissingTable(error: { code?: string; message: string }) {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|schema cache|Could not find/i.test(error.message)
  )
}

// Cadastra uma despesa que se repete todo mês. Ela aparece como "a pagar" a partir de start_month.
export async function createRecurringExpense(params: {
  description: string
  category: string
  amount: number
  due_day: number
  start_month: string // "2026-10" ou "2026-10-01"
}): Promise<void> {
  const { error } = await supabase.from('barberpro_recurring_expenses').insert({
    description: params.description,
    category: params.category,
    amount: params.amount,
    due_day: params.due_day,
    start_month: `${params.start_month.slice(0, 7)}-01`,
  })
  if (error) {
    if (isMissingTable(error)) throw new Error(RECURRING_MISSING_MESSAGE)
    throw new Error(`Erro ao cadastrar despesa recorrente: ${error.message}`)
  }
}

// Encerra a recorrência. O que já foi pago continua no histórico dos meses.
export async function deleteRecurringExpense(id: string): Promise<void> {
  const { error } = await supabase.from('barberpro_recurring_expenses').delete().eq('id', id)
  if (error) throw new Error(`Erro ao encerrar despesa recorrente: ${error.message}`)
}

// Confirma o pagamento de uma recorrente num mês: vira uma despesa normal daquele mês
// (na data do vencimento), e o item sai de "a pagar".
export async function markRecurringPaid(
  item: PendingExpense,
  year: number,
  month: number,
): Promise<void> {
  await createExpense({
    day: item.dueDate,
    description: item.description,
    category: item.category,
    amount: item.amount,
    recurring_id: item.recurringId,
    recurring_month: dayString(year, month, 1),
  })
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('barberpro_expenses').delete().eq('id', id)
  if (error) throw new Error(`Erro ao apagar despesa: ${error.message}`)
}

export async function createClubPayment(params: {
  day: string
  client_id: string | null
  plan: string
  amount: number
  note?: string
}): Promise<void> {
  const { error } = await supabase.from('barberpro_club_payments').insert({
    day: params.day,
    client_id: params.client_id,
    plan: params.plan,
    amount: params.amount,
    note: params.note?.trim() || null,
  })
  if (error) throw new Error(`Erro ao lançar mensalidade: ${error.message}`)
}

export async function deleteClubPayment(id: string): Promise<void> {
  const { error } = await supabase.from('barberpro_club_payments').delete().eq('id', id)
  if (error) throw new Error(`Erro ao apagar mensalidade: ${error.message}`)
}