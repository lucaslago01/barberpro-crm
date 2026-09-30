import { supabase } from './supabase'
import { notifyDataChanged } from './refresh-bus'

export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

export interface RecurringAppointment {
  id: string
  clientName: string
  clientPhone: string | null
  serviceName: string
  addonServiceName: string | null
  weekday: number // 0 = domingo ... 6 = sábado, igual ao Date.getDay()
  time: string // "09:00:00"
  notes: string | null
  isClubVisit: boolean
}

export async function listRecurringAppointments(): Promise<RecurringAppointment[]> {
  const { data, error } = await supabase.rpc('barberpro_list_recurring_appointments')

  if (error) {
    throw new Error(`Erro ao buscar horários fixos: ${error.message}`)
  }

  return ((data as any[]) || []).map((r) => ({
    id: r.id,
    clientName: r.client_name,
    clientPhone: r.client_phone,
    serviceName: r.service_name,
    addonServiceName: r.addon_service_name,
    weekday: r.weekday,
    time: r.time_of_day,
    notes: r.notes,
    isClubVisit: r.is_club_visit,
  }))
}

export async function createRecurringAppointment(params: {
  clientId: string
  serviceId: string
  weekday: number
  time: string // "09:00"
  notes?: string
  isClubVisit?: boolean
  addonServiceId?: string | null
  addonPrice?: number
}): Promise<void> {
  const { error } = await supabase.rpc('barberpro_create_recurring_appointment', {
    p_client_id: params.clientId,
    p_service_id: params.serviceId,
    p_weekday: params.weekday,
    p_time: params.time.length === 5 ? `${params.time}:00` : params.time,
    p_notes: params.notes || null,
    p_is_club_visit: params.isClubVisit || false,
    p_addon_service_id: params.addonServiceId || null,
    p_addon_price: params.addonPrice || 0,
  })

  if (error) {
    throw new Error(error.message)
  }

  notifyDataChanged()
}

export async function deleteRecurringAppointment(id: string): Promise<void> {
  const { error } = await supabase.rpc('barberpro_delete_recurring_appointment', {
    p_id: id,
  })

  if (error) {
    throw new Error(error.message)
  }

  notifyDataChanged()
}
