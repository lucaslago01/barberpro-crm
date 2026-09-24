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

export interface Expense {
  id: string
  day: string
  description: string
  category: string
  amount: number
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

// month: 0 = janeiro
export async function getMonthFinance(year: number, month: number): Promise<MonthFinance> {
  const startDay = dayString(year, month, 1)
  const nextYear = month === 11 ? year + 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const endDay = dayString(nextYear, nextMonth, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const [appts, exp, club] = await Promise.all([
    supabase
      .from('barberpro_appointments')
      .select(
        'id, time, status, is_club_visit, addon_price, barberpro_clients (name), barberpro_services!service_id (name, price), addon_service:barberpro_services!addon_service_id (name)',
      )
      .gte('time', `${startDay}T00:00:00`)
      .lt('time', `${endDay}T00:00:00`)
      .eq('status', 'concluido')
      .order('time', { ascending: false }),
    supabase
      .from('barberpro_expenses')
      .select('id, day, description, category, amount')
      .gte('day', startDay)
      .lt('day', endDay)
      .order('day', { ascending: false }),
    supabase
      .from('barberpro_club_payments')
      .select('id, day, client_id, plan, amount, note, barberpro_clients (name)')
      .gte('day', startDay)
      .lt('day', endDay)
      .order('day', { ascending: false }),
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
  }
}

export async function createExpense(params: {
  day: string
  description: string
  category: string
  amount: number
}): Promise<void> {
  const { error } = await supabase.from('barberpro_expenses').insert(params)
  if (error) throw new Error(`Erro ao lançar despesa: ${error.message}`)
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