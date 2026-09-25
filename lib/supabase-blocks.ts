import { supabase } from './supabase'
import { getDayCloseTime, getDaySlots, isOpenDay } from './business-hours'

export interface Block {
  id: string
  day: string
  start_time: string
  end_time: string
  reason: string | null
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// Devolve a data como "2026-09-22"
export function toDayString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export async function getBlocksByDay(date: Date): Promise<Block[]> {
  const { data, error } = await supabase
    .from('barberpro_blocks')
    .select('id, day, start_time, end_time, reason')
    .eq('day', toDayString(date))
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar bloqueios: ${error.message}`)
  }

  return (data as Block[]) || []
}

// start e end no formato "HH:MM"
export async function createBlock(params: {
  date: Date
  start: string
  end: string
  reason?: string
}): Promise<void> {
  if (params.end <= params.start) {
    throw new Error('O horário final precisa ser depois do inicial.')
  }

  const { error } = await supabase.from('barberpro_blocks').insert({
    day: toDayString(params.date),
    start_time: params.start,
    end_time: params.end,
    reason: params.reason?.trim() || null,
  })

  if (error) {
    throw new Error(`Erro ao criar bloqueio: ${error.message}`)
  }
}

export async function deleteBlock(id: string): Promise<void> {
  const { error } = await supabase.from('barberpro_blocks').delete().eq('id', id)

  if (error) {
    throw new Error(`Erro ao apagar bloqueio: ${error.message}`)
  }
}

export async function deleteBlocks(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('barberpro_blocks').delete().in('id', ids)

  if (error) {
    throw new Error(`Erro ao apagar bloqueios: ${error.message}`)
  }
}

/* ---------- Bloqueio de vários dias ---------- */

// Converte "2026-09-22" em Date local (sem virar o dia por causa de fuso)
export function parseDayString(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function shortTime(value: string) {
  return value.slice(0, 5)
}

// Diz se os bloqueios do dia cobrem todos os horários em que a barbearia abre
export function isDayFullyBlocked(
  date: Date,
  blocks: { start_time: string; end_time: string }[],
): boolean {
  const slots = getDaySlots(date)
  if (slots.length === 0) return false
  return slots.every((slot) =>
    blocks.some((b) => shortTime(b.start_time) <= slot && slot < shortTime(b.end_time)),
  )
}

export const MAX_BLOCK_RANGE_DAYS = 366

// Bloqueia o dia inteiro em cada dia aberto entre "from" e "to" (inclusive).
// Dias em que a barbearia já fecha e dias já bloqueados por inteiro são pulados.
// Devolve quantos dias foram bloqueados.
export async function createBlockRange(params: {
  from: Date
  to: Date
  reason?: string
}): Promise<number> {
  const from = new Date(params.from.getFullYear(), params.from.getMonth(), params.from.getDate())
  const to = new Date(params.to.getFullYear(), params.to.getMonth(), params.to.getDate())

  if (to < from) {
    throw new Error('A data final precisa ser igual ou depois da inicial.')
  }

  const totalDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
  if (totalDays > MAX_BLOCK_RANGE_DAYS) {
    throw new Error(`Escolha um período de no máximo ${MAX_BLOCK_RANGE_DAYS} dias.`)
  }

  // Bloqueios que já existem no período, para não duplicar
  const { data: existing, error: existingError } = await supabase
    .from('barberpro_blocks')
    .select('id, day, start_time, end_time, reason')
    .gte('day', toDayString(from))
    .lte('day', toDayString(to))

  if (existingError) {
    throw new Error(`Erro ao verificar bloqueios: ${existingError.message}`)
  }

  const byDay = new Map<string, Block[]>()
  for (const b of (existing as Block[]) || []) {
    const list = byDay.get(b.day) ?? []
    list.push(b)
    byDay.set(b.day, list)
  }

  const reason = params.reason?.trim() || 'Fechado'
  const rows: Omit<Block, 'id'>[] = []

  for (let i = 0; i < totalDays; i++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    if (!isOpenDay(day)) continue
    if (isDayFullyBlocked(day, byDay.get(toDayString(day)) ?? [])) continue

    rows.push({
      day: toDayString(day),
      start_time: getDaySlots(day)[0],
      end_time: getDayCloseTime(day)!,
      reason,
    })
  }

  if (rows.length === 0) {
    throw new Error('Nenhum dia para bloquear: no período a barbearia já está fechada ou bloqueada.')
  }

  const { error } = await supabase.from('barberpro_blocks').insert(rows)

  if (error) {
    throw new Error(`Erro ao bloquear o período: ${error.message}`)
  }

  return rows.length
}

export interface BlockedPeriod {
  key: string
  from: string // "2026-09-22"
  to: string
  reason: string | null
  days: number
  ids: string[]
}

// Dias inteiros bloqueados de hoje em diante, agrupados em períodos.
// Dias seguidos (pulando os que a barbearia já fecha) com o mesmo motivo viram um período só.
export async function getUpcomingBlockedPeriods(): Promise<BlockedPeriod[]> {
  const { data, error } = await supabase
    .from('barberpro_blocks')
    .select('id, day, start_time, end_time, reason')
    .gte('day', toDayString(new Date()))
    .order('day', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar bloqueios: ${error.message}`)
  }

  const rows = (data as Block[]) || []

  // Um dia só entra na lista se estiver bloqueado por inteiro
  const byDay = new Map<string, Block[]>()
  for (const b of rows) {
    const list = byDay.get(b.day) ?? []
    list.push(b)
    byDay.set(b.day, list)
  }
  const fullDays = [...byDay.entries()]
    .filter(([day, list]) => isDayFullyBlocked(parseDayString(day), list))
    .map(([day, list]) => ({
      day,
      ids: list.map((b) => b.id),
      reason: list.find((b) => b.reason)?.reason ?? null,
    }))

  const periods: BlockedPeriod[] = []
  let last: { day: string; reason: string | null } | null = null

  for (const item of fullDays) {
    const current = periods[periods.length - 1]
    if (current && last && last.reason === item.reason && nextOpenDay(last.day) === item.day) {
      current.to = item.day
      current.days += 1
      current.ids.push(...item.ids)
    } else {
      periods.push({
        key: item.ids[0],
        from: item.day,
        to: item.day,
        reason: item.reason,
        days: 1,
        ids: [...item.ids],
      })
    }
    last = { day: item.day, reason: item.reason }
  }

  return periods
}

// Próximo dia em que a barbearia abre depois de "day"
function nextOpenDay(day: string): string {
  const d = parseDayString(day)
  for (let i = 1; i <= 7; i++) {
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
    if (isOpenDay(next)) return toDayString(next)
  }
  return ''
}

// Usado pelo /agendar (visitante sem login) para desabilitar dias bloqueados no calendário.
// Depende da função barberpro_blocked_ranges (supabase/blocked-ranges.sql). Se ela ainda
// não existir no banco, devolve lista vazia e o calendário segue como antes.
export async function getBlockedRanges(
  from: Date,
  to: Date,
): Promise<Map<string, { start_time: string; end_time: string }[]>> {
  const map = new Map<string, { start_time: string; end_time: string }[]>()
  const { data, error } = await supabase.rpc('barberpro_blocked_ranges', {
    p_from: toDayString(from),
    p_to: toDayString(to),
  })

  if (error || !data) return map

  for (const row of data as { day: string; start_time: string; end_time: string }[]) {
    const list = map.get(row.day) ?? []
    list.push({ start_time: row.start_time, end_time: row.end_time })
    map.set(row.day, list)
  }
  return map
}