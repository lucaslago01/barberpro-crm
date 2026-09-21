import { supabase } from './supabase'

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

export interface PeriodStats {
  completed: number
  noShows: number
  cancelled: number
  total: number // agendamentos do período (todos os status)
  walkIn: number
  club: number
  revenue: number // avulso + clube
  avgTicket: number
  newClients: number
  byService: { name: string; count: number; total: number }[]
  byWeekday: number[] // 0 = domingo ... 6 = sábado (atendimentos concluídos)
  byHour: { hour: string; count: number }[]
  topClients: { name: string; count: number; total: number }[]
  noShowRate: number // 0 a 100
}

export async function getPeriodStats(p: Period): Promise<PeriodStats> {
  const startDay = dayString(p.from)
  const endExclusive = new Date(p.to.getFullYear(), p.to.getMonth(), p.to.getDate() + 1)
  const endDay = dayString(endExclusive)

  const [appts, club, clients] = await Promise.all([
    supabase
      .from('barberpro_appointments')
      .select('id, time, status, client_id, barberpro_clients (name), barberpro_services (name, price)')
      .gte('time', `${startDay}T00:00:00`)
      .lt('time', `${endDay}T00:00:00`),
    supabase
      .from('barberpro_club_payments')
      .select('amount')
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
  const done = rows.filter((a) => a.status === 'concluido')
  const noShows = rows.filter((a) => a.status === 'faltou').length
  const cancelled = rows.filter((a) => a.status === 'cancelado').length

  const walkIn = done.reduce((s, a) => s + Number(a.barberpro_services?.price || 0), 0)
  const clubTotal = (club.data || []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0)

  const svc = new Map<string, { count: number; total: number }>()
  const weekday = [0, 0, 0, 0, 0, 0, 0]
  const hours = new Map<string, number>()
  const cli = new Map<string, { name: string; count: number; total: number }>()

  for (const a of done) {
    const price = Number(a.barberpro_services?.price || 0)
    const sName = a.barberpro_services?.name || 'Serviço desconhecido'
    const s = svc.get(sName) || { count: 0, total: 0 }
    s.count += 1
    s.total += price
    svc.set(sName, s)

    const t = String(a.time)
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

  const scheduledForRate = done.length + noShows
  const revenue = walkIn + clubTotal

  return {
    completed: done.length,
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
      .sort((a, b) => b.total - a.total || b.count - a.count),
    byWeekday: weekday,
    byHour: Array.from(hours.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour)),
    topClients: Array.from(cli.values())
      .sort((a, b) => b.count - a.count || b.total - a.total)
      .slice(0, 5),
    noShowRate: scheduledForRate > 0 ? (noShows / scheduledForRate) * 100 : 0,
  }
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
