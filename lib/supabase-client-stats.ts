import { supabase } from './supabase'
import { RISK_DAYS } from './supabase-kpis'

// Limites do status dos clientes (fáceis de mudar depois)
export const INACTIVE_DAYS = 90
export const VIP_VISITS = 10

export type ClientStatusValue = 'ativo' | 'vip' | 'em risco' | 'inativo'

export interface ClientStats {
  visits: number
  avgTicket: number
  lastVisit: string
  lastVisitAgo: string
  lastVisitTimestamp: number
  frequency: string
  status: ClientStatusValue
}

const DAY_MS = 24 * 60 * 60 * 1000

function agoLabel(days: number) {
  if (days <= 0) return 'hoje'
  if (days === 1) return 'há 1 dia'
  return `há ${days} dias`
}

// Devolve as estatísticas de cada cliente que já tem atendimento concluído.
// Clientes sem atendimento concluído não aparecem aqui (a tela usa valores padrão).
export async function getClientStats(): Promise<Record<string, ClientStats>> {
  const { data, error } = await supabase
    .from('barberpro_appointments')
    .select('client_id, time, status, barberpro_services!service_id (price)')

  if (error) {
    throw new Error(`Erro ao buscar atendimentos dos clientes: ${error.message}`)
  }

  const now = Date.now()

  const done = new Map<string, { time: number; price: number }[]>()
  const hasUpcoming = new Set<string>()

  for (const a of data || []) {
    const row: any = a
    const t = new Date(row.time).getTime()

    if (row.status === 'concluido') {
      const list = done.get(row.client_id) || []
      list.push({ time: t, price: Number(row.barberpro_services?.price) || 0 })
      done.set(row.client_id, list)
    }

    if (row.status !== 'cancelado' && t >= now) {
      hasUpcoming.add(row.client_id)
    }
  }

  const result: Record<string, ClientStats> = {}

  done.forEach((list, clientId) => {
    list.sort((x, y) => x.time - y.time)

    const visits = list.length
    const total = list.reduce((sum, v) => sum + v.price, 0)
    const last = list[visits - 1].time
    const daysSince = Math.floor((now - last) / DAY_MS)

    let frequency = '-'
    if (visits >= 2) {
      const span = list[visits - 1].time - list[0].time
      frequency = `${Math.max(1, Math.round(span / DAY_MS / (visits - 1)))} dias`
    }

    let status: ClientStatusValue = 'ativo'
    if (daysSince > INACTIVE_DAYS) status = 'inativo'
    else if (daysSince > RISK_DAYS && !hasUpcoming.has(clientId)) status = 'em risco'
    else if (visits >= VIP_VISITS) status = 'vip'

    result[clientId] = {
          visits,
      avgTicket: total / visits,
      lastVisit: new Date(last).toLocaleDateString('pt-BR'),
      lastVisitAgo: agoLabel(daysSince),
      lastVisitTimestamp: last,
      frequency,
      status,
    }
  })

  return result
}
export interface RecoverableClient {
  id: string
  name: string
  phone: string
  daysSince: number
  status: ClientStatusValue
}

export async function getRecoverableClients(): Promise<RecoverableClient[]> {
  const { data: clients, error } = await supabase
    .from('barberpro_clients')
    .select('id, name, phone')

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  const stats = await getClientStats()

  const result: RecoverableClient[] = []
  for (const c of clients || []) {
    const s = stats[c.id]
    if (!s) continue
    if (s.status !== 'em risco' && s.status !== 'inativo') continue
    const daysSince = Math.round((Date.now() - s.lastVisitTimestamp) / DAY_MS)
    result.push({ id: c.id, name: c.name, phone: c.phone || '', daysSince, status: s.status })
  }

  result.sort((a, b) => b.daysSince - a.daysSince)
  return result
}