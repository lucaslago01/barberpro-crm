// Horário de funcionamento da barbearia (0 = domingo, 1 = segunda, ... 6 = sábado)
// open/close em horas cheias. Domingo e segunda ficam fechados.
const HOURS: Record<number, { open: number; close: number } | null> = {
  0: null,
  1: null,
  2: { open: 9, close: 20 },
  3: { open: 9, close: 20 },
  4: { open: 9, close: 20 },
  5: { open: 9, close: 20 },
  6: { open: 9, close: 18 },
}

// Tamanho de cada horário, em minutos
export const SLOT_MINUTES = 30

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function isOpenDay(date: Date) {
  return HOURS[date.getDay()] !== null
}

// Horários do dia, ex.: ["09:00", "09:30", ..., "20:00"]. Vazio se estiver fechado.
// O último horário é o próprio horário de fechamento.
export function getDaySlots(date: Date): string[] {
  const hours = HOURS[date.getDay()]
  if (!hours) return []

  const slots: string[] = []
  for (let minutes = hours.open * 60; minutes <= hours.close * 60; minutes += SLOT_MINUTES) {
    slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`)
  }
  return slots
}
