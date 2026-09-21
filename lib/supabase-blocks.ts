import { supabase } from './supabase'

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