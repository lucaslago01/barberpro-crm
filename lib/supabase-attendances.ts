import { supabase } from './supabase'
import { dayString, type Period } from './supabase-reports'

export interface AttendanceRecord {
  id: string
  client: string
  whatsapp: string
  service: string
  day: string // "2026-09-21"
  time: string // "14:30"
  duration: number
  price: number // 0 se for atendimento do clube
  status: string
  isClub: boolean
  notes: string
}

// includeAll = false: só concluídos. true: todos os status do período.
export async function getAttendances(
  period: Period,
  includeAll = false,
): Promise<AttendanceRecord[]> {
  const startDay = dayString(period.from)
  const endExclusive = new Date(
    period.to.getFullYear(),
    period.to.getMonth(),
    period.to.getDate() + 1,
  )
  const endDay = dayString(endExclusive)

  let query = supabase
    .from('barberpro_appointments')
    .select(
      'id, time, status, is_club_visit, notes, barberpro_clients (name, phone), barberpro_services (name, duration, price)',
    )
    .gte('time', `${startDay}T00:00:00`)
    .lt('time', `${endDay}T00:00:00`)
    .order('time', { ascending: false })

  if (!includeAll) {
    query = query.eq('status', 'concluido')
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Erro ao buscar atendimentos: ${error.message}`)
  }

  return (data || []).map((a: any) => {
    const timeStr = String(a.time)
    return {
      id: a.id,
      client: a.barberpro_clients?.name || 'Cliente desconhecido',
      whatsapp: a.barberpro_clients?.phone || '-',
      service: a.barberpro_services?.name || 'Serviço desconhecido',
      day: timeStr.slice(0, 10),
      time: timeStr.slice(11, 16),
      duration: Number(a.barberpro_services?.duration || 0),
      price: a.is_club_visit ? 0 : Number(a.barberpro_services?.price || 0),
      status: a.status,
      isClub: !!a.is_club_visit,
      notes: a.notes || '',
    }
  })
}