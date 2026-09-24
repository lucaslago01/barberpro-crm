import { supabase } from './supabase'
import { notifyDataChanged } from './refresh-bus'

export interface ServiceOption {
  id: string
  name: string
  duration: number
  price: number
  price_from: boolean
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
    .select('id, name, duration, price, price_from')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar serviços: ${error.message}`)
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    price_from: s.price_from ?? false,
    duration: Number(s.duration),
    price: Number(s.price),
  }))
}

// Devolve os horários já ocupados no dia, ex.: ["09:00", "14:30"].
// Já considera a duração de cada serviço e os bloqueios do barbeiro.
export async function getBookedTimes(date: Date): Promise<string[]> {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

  const { data, error } = await supabase.rpc('barberpro_booked_times', {
    p_day: day,
  })

  if (error) {
    throw new Error(`Erro ao buscar horários ocupados: ${error.message}`)
  }

  return ((data as { slot: string }[]) || []).map((row) => row.slot)
}

export async function createAppointment(params: {
  clientId: string
  serviceId: string
  dateTime: string
  notes?: string
  isClubVisit?: boolean
  addonServiceId?: string | null
  addonPrice?: number
}): Promise<void> {
  const { error } = await supabase.rpc('barberpro_create_appointment_v3', {
    p_client_id: params.clientId,
    p_service_id: params.serviceId,
    p_time: toLocalWallClock(new Date(params.dateTime)),
    p_notes: params.notes || null,
    p_addon_service_id: params.addonServiceId || null,
    p_addon_price: params.addonPrice || 0,
    p_is_club_visit: params.isClubVisit || false,
  })

  if (error) {
    throw new Error(error.message)
  }

  notifyDataChanged()
}

// Muda o dia e a hora de um agendamento que já existe. O status não é alterado.
export async function rescheduleAppointment(
  id: string,
  dateTime: string,
): Promise<void> {
  const { error } = await supabase.rpc('barberpro_reschedule_appointment', {
    p_id: id,
    p_time: toLocalWallClock(new Date(dateTime)),
  })

  if (error) {
    throw new Error(error.message)
  }

  notifyDataChanged()
}
export interface ServiceInput {
  name: string
  duration: number
  price: number
  price_from: boolean
}

export async function createService(input: ServiceInput): Promise<void> {
  const { error } = await supabase.from('barberpro_services').insert(input)
  if (error) throw new Error(`Erro ao criar serviço: ${error.message}`)
}

export async function updateService(id: string, input: ServiceInput): Promise<void> {
  const { error } = await supabase.from('barberpro_services').update(input).eq('id', id)
  if (error) throw new Error(`Erro ao atualizar serviço: ${error.message}`)
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('barberpro_services').delete().eq('id', id)
  if (error) {
    if ((error as any).code === '23503') {
      throw new Error(
        'Esse serviço já foi usado em algum agendamento e não pode ser apagado.',
      )
    }
    throw new Error(`Erro ao apagar serviço: ${error.message}`)
  }
}