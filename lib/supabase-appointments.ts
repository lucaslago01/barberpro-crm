import { supabase } from './supabase'

export interface ServiceOption {
  id: string
  name: string
  duration: number
  price: number
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// A coluna "time" não tem fuso, então guardamos o relógio local (ex.: 2026-09-21T11:30:00)
function toLocalWallClock(date: Date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

export async function getServices(): Promise<ServiceOption[]> {
  const { data, error } = await supabase
    .from('barberpro_services')
    .select('id, name, duration, price')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar serviços: ${error.message}`)
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    duration: Number(s.duration),
    price: Number(s.price),
  }))
}

// Devolve os horários já ocupados no dia, ex.: ["09:00", "14:30"].
// Agendamentos cancelados não contam como ocupados.
export async function getBookedTimes(date: Date): Promise<string[]> {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0)

  const { data, error } = await supabase
    .from('barberpro_appointments')
    .select('time, status')
    .gte('time', toLocalWallClock(start))
    .lt('time', toLocalWallClock(end))

  if (error) {
    throw new Error(`Erro ao buscar horários ocupados: ${error.message}`)
  }

  return (data || [])
    .filter((a: any) => a.status !== 'cancelado')
    .map((a: any) =>
      new Date(a.time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
}

export async function createAppointment(params: {
  clientId: string
  serviceId: string
  dateTime: string
  notes?: string
}): Promise<void> {
  const { error } = await supabase.from('barberpro_appointments').insert({
    client_id: params.clientId,
    service_id: params.serviceId,
    time: toLocalWallClock(new Date(params.dateTime)),
    status: 'agendado',
    notes: params.notes || null,
  })

  if (error) {
    throw new Error(`Erro ao criar agendamento: ${error.message}`)
  }
}

// Muda o dia e a hora de um agendamento que já existe. O status não é alterado.
export async function rescheduleAppointment(
  id: string,
  dateTime: string,
): Promise<void> {
  const wallClock = toLocalWallClock(new Date(dateTime))

  // Confere se o novo horário está livre (ignora o próprio agendamento e os cancelados)
  const { data: taken, error: takenError } = await supabase
    .from('barberpro_appointments')
    .select('id')
    .eq('time', wallClock)
    .neq('status', 'cancelado')
    .neq('id', id)
    .limit(1)

  if (takenError) {
    throw new Error(`Erro ao conferir horário: ${takenError.message}`)
  }

  if (taken && taken.length > 0) {
    throw new Error('Esse horário acabou de ser ocupado. Escolha outro.')
  }

  const { error } = await supabase
    .from('barberpro_appointments')
    .update({ time: wallClock })
    .eq('id', id)

  if (error) {
    // 23505 = a trava do banco recusou um horário duplicado
    if ((error as any).code === '23505') {
      throw new Error('Esse horário acabou de ser ocupado. Escolha outro.')
    }
    throw new Error(`Erro ao reagendar: ${error.message}`)
  }
}