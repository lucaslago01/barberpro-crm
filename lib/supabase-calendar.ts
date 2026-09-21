import { supabase } from './supabase'

// month: 0 = Janeiro, 11 = Dezembro
export async function getDaysWithAppointments(
  year: number,
  month: number,
): Promise<number[]> {
  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0)

  const { data, error } = await supabase
    .from('barberpro_appointments')
    .select('time, status')
    .gte('time', start.toISOString())
    .lt('time', end.toISOString())

  if (error) {
    throw new Error(`Erro ao buscar dias com agendamento: ${error.message}`)
  }

  const days = new Set<number>()
  for (const apt of data || []) {
    if (apt.status === 'cancelado') continue
    days.add(new Date(apt.time).getDate())
  }

  return Array.from(days)
}