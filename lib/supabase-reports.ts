import { supabase } from './supabase'
import { getClients } from './supabase-data'
import { getClientStats } from './supabase-client-stats'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function dayString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

const DAY_MS = 24 * 60 * 60 * 1000

// Período: de "from" até "to", os dois dias inclusos
export interface Period {
  from: Date
  to: Date
}

export type PeriodPreset = 'mes' | 'mes-passado' | '7dias' | '30dias' | 'custom'

export function getPreset(preset: PeriodPreset): Period {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (preset === 'mes') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    }
  }
  if (preset === 'mes-passado') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0),
    }
  }
  if (preset === '7dias') {
    return { from: new Date(today.getTime() - 6 * DAY_MS), to: today }
  }
  return { from: new Date(today.getTime() - 29 * DAY_MS), to: today }
}

// Período anterior de mesmo tamanho. Para mês fechado, devolve o mês anterior inteiro.
export function getPreviousPeriod(p: Period, preset: PeriodPreset): Period {
  if (preset === 'mes' || preset === 'mes-passado') {
    return {
      from: new Date(p.from.getFullYear(), p.from.getMonth() - 1, 1),
      to: new Date(p.from.getFullYear(), p.from.getMonth(), 0),
    }
  }
  const days = Math.round((p.to.getTime() - p.from.getTime()) / DAY_MS) + 1
  return {
    from: new Date(p.from.getTime() - days * DAY_MS),
    to: new Date(p.from.getTime() - DAY_MS),
  }
}

export interface DailyRevenue {
  label: string // "21/09"
  revenue: number // avulso (sem clube) + clube do dia
  sessions: number // atendimentos concluídos do dia (avulso + clube)
}

export interface PeriodStats {
  completed: number // atendimentos concluídos avulsos (sem clube)
  clubVisits: number // atendimentos concluídos que eram do clube
  noShows: number
  cancelled: number
  total: number // agendamentos do período (todos os status)
  walkIn: number
  club: number
  revenue: number // avulso (sem clube) + clube
  avgTicket: number
  newClients: number
  byService: { name: string; count: number; total: number }[]
  byWeekday: number[] // 0 = domingo ... 6 = sábado (atendimentos concluídos, avulso + clube)
  byHour: { hour: string; count: number }[]
  topClients: { name: string; count: number; total: number }[]
  noShowRate: number // 0 a 100
  daily: DailyRevenue[]
}

export async function getPeriodStats(p: Period): Promise<PeriodStats> {
  const startDay = dayString(p.from)
  const endExclusive = new Date(p.to.getFullYear(), p.to.getMonth(), p.to.getDate() + 1)
  const endDay = dayString(endExclusive)

  const [appts, club, clients] = await Promise.all([
    supabase
      .from('barberpro_appointments')
      .select(
        'id, time, status, client_id, is_club_visit, barberpro_clients (name), barberpro_services!service_id (name, price)',
      )
      .gte('time', `${startDay}T00:00:00`)
      .lt('time', `${endDay}T00:00:00`),
    supabase
      .from('barberpro_club_payments')
      .select('day, amount')
      .gte('day', startDay)
      .lt('day', endDay),
    supabase
      .from('barberpro_clients')
      .select('id, created_at')
      .gte('created_at', `${startDay}T00:00:00`)
      .lt('created_at', `${endDay}T00:00:00`),
  ])

  if (appts.error) throw new Error(`Erro ao buscar atendimentos: ${appts.error.message}`)
  if (club.error) throw new Error(`Erro ao buscar mensalidades: ${club.error.message}`)
  if (clients.error) throw new Error(`Erro ao buscar clientes: ${clients.error.message}`)

  const rows: any[] = appts.data || []
  const doneAll = rows.filter((a) => a.status === 'concluido')
  const done = doneAll.filter((a) => !a.is_club_visit) // avulsos, para a receita
  const clubVisits = doneAll.filter((a) => a.is_club_visit)
  const noShows = rows.filter((a) => a.status === 'faltou').length
  const cancelled = rows.filter((a) => a.status === 'cancelado').length

  const walkIn = done.reduce((s, a) => s + Number(a.barberpro_services?.price || 0), 0)
  const clubRows: any[] = club.data || []
  const clubTotal = clubRows.reduce((s: number, c: any) => s + Number(c.amount || 0), 0)

  // Série por dia (todos os dias do período, mesmo os vazios)
  const dailyMap = new Map<string, DailyRevenue>()
  const cursor = new Date(p.from.getFullYear(), p.from.getMonth(), p.from.getDate())
  while (cursor.getTime() <= p.to.getTime()) {
    dailyMap.set(dayString(cursor), {
      label: `${pad(cursor.getDate())}/${pad(cursor.getMonth() + 1)}`,
      revenue: 0,
      sessions: 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  const svc = new Map<string, { count: number; total: number }>()
  const weekday = [0, 0, 0, 0, 0, 0, 0]
  const hours = new Map<string, number>()
  const cli = new Map<string, { name: string; count: number; total: number }>()

  // Serviço, dia da semana, horário e melhores clientes contam avulso + clube (é atendimento de verdade)
  for (const a of doneAll) {
    const price = a.is_club_visit ? 0 : Number(a.barberpro_services?.price || 0)
    const sName = a.barberpro_services?.name || 'Serviço desconhecido'
    const s = svc.get(sName) || { count: 0, total: 0 }
    s.count += 1
    s.total += price
    svc.set(sName, s)

    const t = String(a.time)
    const dayKey = t.slice(0, 10)
    const point = dailyMap.get(dayKey)
    if (point) {
      point.revenue += price
      point.sessions += 1
    }

    const d = new Date(
      Number(t.slice(0, 4)),
      Number(t.slice(5, 7)) - 1,
      Number(t.slice(8, 10)),
    )
    weekday[d.getDay()] += 1

    const h = `${t.slice(11, 13)}:00`
    hours.set(h, (hours.get(h) || 0) + 1)

    const key = a.client_id || 'sem'
    const c = cli.get(key) || { name: a.barberpro_clients?.name || 'Cliente', count: 0, total: 0 }
    c.count += 1
    c.total += price
    cli.set(key, c)
  }

  for (const c of clubRows) {
    const point = dailyMap.get(String(c.day))
    if (point) point.revenue += Number(c.amount || 0)
  }

  const scheduledForRate = doneAll.length + noShows
  const revenue = walkIn + clubTotal

  return {
    completed: doneAll.length,
    clubVisits: clubVisits.length,
    noShows,
    cancelled,
    total: rows.length,
    walkIn,
    club: clubTotal,
    revenue,
    avgTicket: done.length > 0 ? walkIn / done.length : 0,
    newClients: (clients.data || []).length,
    byService: Array.from(svc.entries())
      .map(([name, v]) => ({ name, count: v.count, total: v.total }))
      .sort((a, b) => b.count - a.count || b.total - a.total),
    byWeekday: weekday,
    byHour: Array.from(hours.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour)),
    topClients: Array.from(cli.values())
      .sort((a, b) => b.total - a.total || b.count - a.count)
      .slice(0, 5),
    noShowRate: scheduledForRate > 0 ? (noShows / scheduledForRate) * 100 : 0,
    daily: Array.from(dailyMap.values()),
  }
}

/* ---------- Clientes por tipo (rosca) ---------- */

export interface ClientTypeCount {
  name: string
  count: number
}

// Mesmas regras da tela /clientes. Quem nunca foi atendido entra em "Sem atendimento".
export async function getClientsByType(): Promise<{ total: number; types: ClientTypeCount[] }> {
  const [clients, stats] = await Promise.all([getClients(), getClientStats()])

  let vip = 0
  let ativo = 0
  let risco = 0
  let inativo = 0
  let sem = 0

  for (const c of clients) {
    const s = stats[c.id]
    if (!s) sem += 1
    else if (s.status === 'vip') vip += 1
    else if (s.status === 'em risco') risco += 1
    else if (s.status === 'inativo') inativo += 1
    else ativo += 1
  }

  return {
    total: clients.length,
    types: [
      { name: 'VIP', count: vip },
      { name: 'Ativos', count: ativo },
      { name: 'Em risco', count: risco },
      { name: 'Inativos', count: inativo },
      { name: 'Sem atendimento', count: sem },
    ],
  }
}

/* ---------- Evolução de clientes (últimos 6 meses) ---------- */

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export interface GrowthPoint {
  month: string
  year: number
  value: number
}

// Total acumulado de clientes cadastrados até o fim de cada mês
export async function getClientsGrowth(): Promise<GrowthPoint[]> {
  const { data, error } = await supabase.from('barberpro_clients').select('created_at')

  if (error) throw new Error(`Erro ao buscar evolução de clientes: ${error.message}`)

  const keys: string[] = (data || [])
    .map((c: any) => (c.created_at ? String(c.created_at).slice(0, 7) : ''))
    .filter(Boolean)

  const now = new Date()
  const points: GrowthPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d)
    points.push({
      month: MONTH_SHORT[d.getMonth()],
      year: d.getFullYear(),
      value: keys.filter((k) => k <= key).length,
    })
  }
  return points
}

/* ---------- Metas ---------- */

export interface Goal {
  revenue_goal: number | null
  appointments_goal: number | null
}

export async function getGoal(month: string): Promise<Goal> {
  const { data, error } = await supabase
    .from('barberpro_goals')
    .select('revenue_goal, appointments_goal')
    .eq('month', month)
    .maybeSingle()

  if (error) throw new Error(`Erro ao buscar metas: ${error.message}`)

  return {
    revenue_goal: data?.revenue_goal != null ? Number(data.revenue_goal) : null,
    appointments_goal: data?.appointments_goal != null ? Number(data.appointments_goal) : null,
  }
}

export async function saveGoal(month: string, goal: Goal): Promise<void> {
  const { error } = await supabase
    .from('barberpro_goals')
    .upsert(
      {
        month,
        revenue_goal: goal.revenue_goal,
        appointments_goal: goal.appointments_goal,
      },
      { onConflict: 'month' },
    )

  if (error) throw new Error(`Erro ao salvar meta: ${error.message}`)
}