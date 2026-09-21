import { supabase } from './supabase'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalWallClock(date: Date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

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
    .gte('time', toLocalWallClock(start))
    .lt('time', toLocalWallClock(end))

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