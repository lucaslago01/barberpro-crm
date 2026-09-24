import { supabase } from './supabase'
import { notifyDataChanged } from './refresh-bus'
import type { AgendaSlot, Client } from './types'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// A coluna "time" não tem fuso, então comparamos e gravamos o relógio local (ex.: 2026-09-21T11:30:00)
function toLocalWallClock(date: Date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

export async function getAgendaSlots(): Promise<AgendaSlot[]> {
  try {
    const { data: appointments, error } = await supabase
      .from('barberpro_appointments')
      .select(`
        id,
        time,
        status,
        notes,
        is_club_visit,
        barberpro_clients (name, phone),
        barberpro_services (name, duration, price)
      `)
      .order('time', { ascending: true })

    if (error) {
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`)
    }

    if (!appointments || appointments.length === 0) {
      return []
    }

    const slots: AgendaSlot[] = appointments.map((apt: any) => ({
      id: apt.id,
      time: new Date(apt.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      client: apt.barberpro_clients?.name || 'Cliente desconhecido',
      service: apt.barberpro_services?.name || 'Serviço desconhecido',
      duration: `${apt.barberpro_services?.duration || 0} min`,
      price: apt.is_club_visit ? 0 : (apt.barberpro_services?.price || 0),
      status: apt.status,
      available: false,
      notes: apt.notes || '',
    }))

    return slots
  } catch (error) {
    console.error('Erro em getAgendaSlots:', error)
    throw error
  }
}

export async function getAgendaSlotsByDate(date: Date): Promise<AgendaSlot[]> {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0)

  const { data: appointments, error } = await supabase
    .from('barberpro_appointments')
    .select(`
      id,
      time,
      status,
      notes,
      is_club_visit,
      barberpro_clients (name, phone),
      barberpro_services (name, duration, price)
    `)
    .gte('time', toLocalWallClock(start))
    .lt('time', toLocalWallClock(end))
    .order('time', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar agendamentos do dia: ${error.message}`)
  }

  if (!appointments || appointments.length === 0) {
    return []
  }

  return appointments.map((apt: any) => ({
    id: apt.id,
    time: new Date(apt.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    client: apt.barberpro_clients?.name || 'Cliente desconhecido',
    service: apt.barberpro_services?.name || 'Serviço desconhecido',
    duration: `${apt.barberpro_services?.duration || 0} min`,
    price: apt.is_club_visit ? 0 : (apt.barberpro_services?.price || 0),
    status: apt.status,
    available: false,
    notes: apt.notes || '',
  }))
}

export async function updateClient(
  id: string,
  client: {
    name: string
    phone?: string
    email?: string
  },
): Promise<Client> {
  const { data, error } = await supabase
    .from('barberpro_clients')
    .update(client)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar cliente: ${error.message}`)
  }

  notifyDataChanged()
  return data
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('barberpro_clients')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  return data || []
}

export async function createClient(client: {
  name: string
  phone?: string
  email?: string
  club_plan?: string
  club_due_date?: string
}): Promise<Client> {
  const { data, error } = await supabase
    .from('barberpro_clients')
    .insert(client)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar cliente: ${error.message}`)
  }

  notifyDataChanged()
  return data
}

export async function updateAppointmentStatus(
  id: string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from('barberpro_appointments')
    .update({ status })
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao atualizar agendamento: ${error.message}`)
  }

  notifyDataChanged()
}

export async function updateAppointmentNotes(id: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('barberpro_appointments')
    .update({ notes })
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao atualizar observações: ${error.message}`)
  }
}

export async function getDashboardKpis() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)

  const { data: appointments, error: apptError } = await supabase
    .from('barberpro_appointments')
    .select('status, is_club_visit, barberpro_services (price)')
    .gte('time', toLocalWallClock(monthStart))
    .lt('time', toLocalWallClock(nextMonthStart))

  if (apptError) {
    throw new Error(`Erro ao buscar agendamentos: ${apptError.message}`)
  }

  const { count: totalClients, error: clientsError } = await supabase
    .from('barberpro_clients')
    .select('*', { count: 'exact', head: true })

  if (clientsError) {
    throw new Error(`Erro ao buscar clientes: ${clientsError.message}`)
  }

  // Cancelados não contam como agendamento do mês
  const active = (appointments || []).filter((a: any) => a.status !== 'cancelado')
  const totalAppointments = active.length
  const revenue = active
    .filter((a: any) => a.status === 'concluido')
    .reduce((sum: number, a: any) => sum + (a.is_club_visit ? 0 : (a.barberpro_services?.price || 0)), 0)

  return {
    totalAppointments,
    revenue,
    totalClients: totalClients || 0,
  }
}

export async function createPublicAppointment(params: {
  clientName: string
  clientPhone: string
  clientEmail?: string
  serviceName: string
  dateTime: string
  notes?: string
  asClub?: boolean
}): Promise<void> {
  const { error } = await supabase.rpc('barberpro_create_public_appointment', {
    p_client_name: params.clientName,
    p_client_phone: params.clientPhone,
    p_service_name: params.serviceName,
    p_time: toLocalWallClock(new Date(params.dateTime)),
    p_client_email: params.clientEmail ?? null,
    p_notes: params.notes ?? null,
    p_as_club: params.asClub ?? false,
  })

  if (error) {
    throw new Error(error.message)
  }
}
export interface ClientAppointmentHistoryItem {
  id: string
  time: string
  status: string
  serviceName: string
  price: number
}

export async function getClientAppointments(
  clientId: string,
): Promise<ClientAppointmentHistoryItem[]> {
  const { data, error } = await supabase
    .from('barberpro_appointments')
    .select('id, time, status, is_club_visit, barberpro_services (name, price)')
    .eq('client_id', clientId)
    .order('time', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar histórico do cliente: ${error.message}`)
  }

  return (data || []).map((a: any) => ({
    id: a.id,
    time: a.time,
    status: a.status,
    serviceName: a.barberpro_services?.name || '-',
    price: a.is_club_visit ? 0 : (Number(a.barberpro_services?.price) || 0),
  }))
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('barberpro_clients')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao excluir cliente: ${error.message}`)
  }

  notifyDataChanged()
}
export interface RecentInteraction {
  id: string
  name: string
  action: string
  time: string
}

function agoLabelShort(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  const days = Math.floor(hours / 24)
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
}

const interactionActionLabels: Record<string, string> = {
  agendado: 'Agendamento realizado',
  confirmado: 'Confirmou o horário',
  concluido: 'Atendimento concluído',
  cancelado: 'Cancelou o agendamento',
  faltou: 'Faltou ao horário',
}

export async function getRecentInteractions(): Promise<RecentInteraction[]> {
  const { data, error } = await supabase
    .from('barberpro_appointments')
    .select('id, status, created_at, barberpro_clients (name)')
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    throw new Error(`Erro ao buscar interações recentes: ${error.message}`)
  }

  return (data || []).map((a: any) => ({
    id: a.id,
    name: a.barberpro_clients?.name || 'Cliente',
    action: interactionActionLabels[a.status] || a.status,
    time: agoLabelShort(a.created_at),
  }))
}
export interface ClientLookupResult {
  name: string | null
  email: string | null
  birthDate: string | null
  clubPlan: string | null
}

export async function lookupClientByPhone(phone: string): Promise<ClientLookupResult | null> {
  const { data, error } = await supabase.rpc('barberpro_client_lookup_by_phone', {
    p_phone: phone,
  })

  if (error) {
    throw new Error(`Erro ao consultar cliente: ${error.message}`)
  }

  const row = data && data[0]
  if (!row) return null

  return {
    name: row.name || null,
    email: row.email || null,
    birthDate: row.birth_date || null,
    clubPlan: row.club_plan || null,
  }
}

export async function createAppointmentV2(params: {
  clientName: string
  clientPhone: string
  serviceName: string
  dateTime: string
  clientEmail?: string
  notes?: string
  birthDate?: string
  clubPlan?: string
}): Promise<void> {
  const { error } = await supabase.rpc('barberpro_create_appointment_v2', {
    p_client_name: params.clientName,
    p_client_phone: params.clientPhone,
    p_service_name: params.serviceName,
    p_time: toLocalWallClock(new Date(params.dateTime)),
    p_client_email: params.clientEmail || null,
    p_notes: params.notes || null,
    p_birth_date: params.birthDate || null,
    p_club_plan: params.clubPlan || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  notifyDataChanged()
}
export async function setClientOptOut(id: string, optOut: boolean): Promise<void> {
  const { error } = await supabase
    .from('barberpro_clients')
    .update({
      campaign_opt_out: optOut,
      campaign_opt_out_at: optOut ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao atualizar preferência de campanha: ${error.message}`)
  }

  notifyDataChanged()
}

