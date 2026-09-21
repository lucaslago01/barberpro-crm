import { supabase } from './supabase'
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
      price: apt.barberpro_services?.price || 0,
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
    price: apt.barberpro_services?.price || 0,
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
}): Promise<Client> {
  const { data, error } = await supabase
    .from('barberpro_clients')
    .insert(client)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar cliente: ${error.message}`)
  }

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
  const { data: appointments, error: apptError } = await supabase
    .from('barberpro_appointments')
    .select('status, barberpro_services (price)')

  if (apptError) {
    throw new Error(`Erro ao buscar agendamentos: ${apptError.message}`)
  }

  const { count: totalClients, error: clientsError } = await supabase
    .from('barberpro_clients')
    .select('*', { count: 'exact', head: true })

  if (clientsError) {
    throw new Error(`Erro ao buscar clientes: ${clientsError.message}`)
  }

  const totalAppointments = appointments?.length || 0
  const revenue = (appointments || [])
    .filter((a: any) => a.status === 'concluido')
    .reduce((sum: number, a: any) => sum + (a.barberpro_services?.price || 0), 0)

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
}): Promise<void> {
  const wallClock = toLocalWallClock(new Date(params.dateTime))

  // Confere se o horário ainda está livre (cancelados não contam)
  const { data: taken, error: takenError } = await supabase
    .from('barberpro_appointments')
    .select('id')
    .eq('time', wallClock)
    .neq('status', 'cancelado')
    .limit(1)

  if (takenError) {
    throw new Error(`Erro ao conferir horário: ${takenError.message}`)
  }

  if (taken && taken.length > 0) {
    throw new Error('Esse horário acabou de ser ocupado. Volte e escolha outro.')
  }

  const { data: service, error: serviceError } = await supabase
    .from('barberpro_services')
    .select('id')
    .ilike('name', params.serviceName)
    .single()

  if (serviceError || !service) {
    throw new Error(`Serviço "${params.serviceName}" não encontrado`)
  }

  let clientId: string

  const { data: existingClient } = await supabase
    .from('barberpro_clients')
    .select('id')
    .eq('phone', params.clientPhone)
    .maybeSingle()

  if (existingClient) {
    clientId = existingClient.id
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('barberpro_clients')
      .insert({
        name: params.clientName,
        phone: params.clientPhone,
        email: params.clientEmail || null,
      })
      .select('id')
      .single()

    if (clientError || !newClient) {
      throw new Error(`Erro ao criar cliente: ${clientError?.message}`)
    }
    clientId = newClient.id
  }

  const { error: apptError } = await supabase.from('barberpro_appointments').insert({
    client_id: clientId,
    service_id: service.id,
    time: wallClock,
    status: 'agendado',
    notes: params.notes || null,
  })

  if (apptError) {
    throw new Error(`Erro ao criar agendamento: ${apptError.message}`)
  }
}