import { supabase } from './supabase'

export async function getAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('time', { ascending: true })
  
  if (error) throw error
  return data
}

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
  
  if (error) throw error
  return data
}

export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
  
  if (error) throw error
  return data
}
