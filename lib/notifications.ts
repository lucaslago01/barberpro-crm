import { supabase } from './supabase'
import { getRecoverableClients } from './supabase-client-stats'

export type NotificationKind =
  | 'confirmacao'
  | 'lembrete'
  | 'cancelamento'
  | 'aniversarios'
  | 'recuperar'

export type NotificationPrefs = Record<NotificationKind, boolean>

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  description: string
}

const PREFS_KEY = 'crm:notif-prefs'
const SEEN_KEY = 'crm:notif-seen'
const PREFS_EVENT = 'crm:notif-prefs-changed'

export const DEFAULT_PREFS: NotificationPrefs = {
  confirmacao: true,
  lembrete: true,
  cancelamento: true,
  aniversarios: true,
  recuperar: true,
}

/* ---------- Preferências (salvas neste navegador) ---------- */

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFS
  }
}

export function setNotificationPrefs(prefs: NotificationPrefs) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {}
  window.dispatchEvent(new Event(PREFS_EVENT))
}

export function onPrefsChanged(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(PREFS_EVENT, callback)
  return () => window.removeEventListener(PREFS_EVENT, callback)
}

/* ---------- Avisos já vistos ---------- */

export function getSeenIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function markSeen(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    const merged = Array.from(new Set([...getSeenIds(), ...ids])).slice(-300)
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(merged))
  } catch {}
}

/* ---------- Busca dos avisos ---------- */

const DAY_MS = 24 * 60 * 60 * 1000

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// A coluna "time" não tem fuso: comparamos com o relógio local
function wallClock(date: Date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function hhmm(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dm(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

export async function fetchNotifications(
  prefs: NotificationPrefs,
): Promise<AppNotification[]> {
  const now = new Date()
  const list: AppNotification[] = []

  // Confirmação: agendamentos criados nas últimas 48h
  if (prefs.confirmacao) {
    const since = new Date(now.getTime() - 2 * DAY_MS).toISOString()
    const { data } = await supabase
      .from('barberpro_appointments')
      .select('id, time, status, created_at, barberpro_clients (name), barberpro_services!service_id (name)')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20)
    for (const a of (data || []) as any[]) {
      if (a.status === 'cancelado') continue
      list.push({
        id: `conf-${a.id}`,
        kind: 'confirmacao',
        title: 'Novo agendamento',
        description: `${a.barberpro_clients?.name || 'Cliente'} · ${
          a.barberpro_services?.name || 'Serviço'
        } · ${dm(a.time)} às ${hhmm(a.time)}`,
      })
    }
  }

  // Lembrete: atendimentos de hoje que ainda vão acontecer
  if (prefs.lembrete) {
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
    const { data } = await supabase
      .from('barberpro_appointments')
      .select('id, time, status, barberpro_clients (name), barberpro_services!service_id (name)')
      .gte('time', wallClock(now))
      .lt('time', wallClock(endOfDay))
      .order('time', { ascending: true })
      .limit(20)
    for (const a of (data || []) as any[]) {
      if (a.status === 'cancelado' || a.status === 'concluido' || a.status === 'faltou') continue
      list.push({
        id: `lem-${a.id}`,
        kind: 'lembrete',
        title: `Atendimento hoje às ${hhmm(a.time)}`,
        description: `${a.barberpro_clients?.name || 'Cliente'} · ${
          a.barberpro_services?.name || 'Serviço'
        }`,
      })
    }
  }

  // Cancelamento: cancelados de ontem em diante
  if (prefs.cancelamento) {
    const from = new Date(now.getTime() - DAY_MS)
    const { data } = await supabase
      .from('barberpro_appointments')
      .select('id, time, status, barberpro_clients (name), barberpro_services!service_id (name)')
      .eq('status', 'cancelado')
      .gte('time', wallClock(from))
      .order('time', { ascending: true })
      .limit(20)
    for (const a of (data || []) as any[]) {
      list.push({
        id: `can-${a.id}`,
        kind: 'cancelamento',
        title: 'Agendamento cancelado',
        description: `${a.barberpro_clients?.name || 'Cliente'} · ${dm(a.time)} às ${hhmm(a.time)}`,
      })
    }
  }

  // Aniversários: hoje e próximos 7 dias
  if (prefs.aniversarios) {
    const { data } = await supabase
      .from('barberpro_clients')
      .select('id, name, birth_date')
      .not('birth_date', 'is', null)
    const todayMD = now.getMonth() * 100 + now.getDate()
    for (const c of (data || []) as any[]) {
      if (!c.birth_date) continue
      const d = new Date(`${c.birth_date}T00:00:00`)
      const md = d.getMonth() * 100 + d.getDate()
      const diff = md >= todayMD ? md - todayMD : 1200 - todayMD + md
      if (diff > 7) continue
      list.push({
        id: `ani-${c.id}-${now.getFullYear()}`,
        kind: 'aniversarios',
        title: diff === 0 ? 'Aniversário hoje' : `Aniversário em ${diff} dia(s)`,
        description: `${c.name} · ${d.toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
        })}`,
      })
    }
  }

  // Recuperar: um aviso por dia com o total
  if (prefs.recuperar) {
    const recover = await getRecoverableClients()
    if (recover.length > 0) {
      list.push({
        id: `rec-${dayKey(now)}`,
        kind: 'recuperar',
        title: `${recover.length} cliente(s) para recuperar`,
        description: 'Clientes em risco ou inativos. Veja em Clientes.',
      })
    }
  }

  return list
}
