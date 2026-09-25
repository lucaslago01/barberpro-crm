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
  for (let minutes = hours.open * 60; minutes < hours.close * 60; minutes += SLOT_MINUTES) {
    slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`)
  }
  return slots
}

const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export type OpenStatus =
  | { open: true; closesAt: number }
  | { open: false; opensDay: string; opensAt: number; today: boolean }

// Diz se a barbearia está aberta agora e, se não, quando abre de novo.
// Usa a mesma tabela de horários do agendamento, então nunca diverge dela.
export function getOpenStatus(now: Date = new Date()): OpenStatus {
  const today = HOURS[now.getDay()]
  const hour = now.getHours() + now.getMinutes() / 60

  if (today && hour >= today.open && hour < today.close) {
    return { open: true, closesAt: today.close }
  }

  // Ainda não abriu hoje
  if (today && hour < today.open) {
    return { open: false, opensDay: 'hoje', opensAt: today.open, today: true }
  }

  // Procura o próximo dia com expediente
  for (let i = 1; i <= 7; i++) {
    const day = (now.getDay() + i) % 7
    const hours = HOURS[day]
    if (hours) {
      return {
        open: false,
        opensDay: i === 1 ? 'amanhã' : WEEKDAY_NAMES[day],
        opensAt: hours.open,
        today: false,
      }
    }
  }
  return { open: false, opensDay: '', opensAt: 0, today: false }
}

const SHORT_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Monta o texto de funcionamento a partir da própria tabela de horários,
// agrupando dias seguidos com o mesmo expediente. Ex.: "Ter–Sex 9h–20h · Sáb 9h–18h".
// Assim a página pública nunca mostra um horário diferente do que aceita agendar.
export function getScheduleLabel(separator = ' · '): string {
  const parts: string[] = []
  let runStart: number | null = null
  let runHours: { open: number; close: number } | null = null

  const flush = (end: number) => {
    if (runStart === null || !runHours) return
    const range =
      end === runStart
        ? SHORT_DAYS[runStart]
        : end === runStart + 1
          ? `${SHORT_DAYS[runStart]} e ${SHORT_DAYS[end]}`
          : `${SHORT_DAYS[runStart]}–${SHORT_DAYS[end]}`
    parts.push(`${range} ${runHours.open}h–${runHours.close}h`)
    runStart = null
    runHours = null
  }

  for (let day = 0; day <= 6; day++) {
    const hours = HOURS[day]
    if (!hours) {
      flush(day - 1)
      continue
    }
    if (runHours && runHours.open === hours.open && runHours.close === hours.close) continue
    flush(day - 1)
    runStart = day
    runHours = hours
  }
  flush(6)

  return parts.join(separator)
}
