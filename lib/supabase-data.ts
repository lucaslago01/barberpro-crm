import { supabase } from './supabase'
import type { AgendaSlot, Client } from './types'

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
    }))

    return slots
  } catch (error) {
    console.error('Erro em getAgendaSlots:', error)
    throw error
  }
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
    time: params.dateTime,
    status: 'agendado',
    notes: params.notes || null,
  })

  if (apptError) {
    throw new Error(`Erro ao criar agendamento: ${apptError.message}`)
  }
}
