import { supabase } from './supabase'
import { createClubPayment } from './supabase-finance'

export const CLUB_PLANS = ['Corte', 'Corte e barba', 'Barba']

export type ClubStatus = 'sem_plano' | 'em_dia' | 'vencido'

export interface ClubInfo {
  club_plan: string | null
  club_due_date: string | null // "2026-10-21"
  status: ClubStatus
}

function computeStatus(dueDate: string | null): ClubStatus {
  if (!dueDate) return 'sem_plano'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dueDate}T00:00:00`)
  return due.getTime() >= today.getTime() ? 'em_dia' : 'vencido'
}

export async function getClubInfo(clientId: string): Promise<ClubInfo> {
  const { data, error } = await supabase
    .from('barberpro_clients')
    .select('club_plan, club_due_date')
    .eq('id', clientId)
    .single()

  if (error) throw new Error(`Erro ao buscar o plano do cliente: ${error.message}`)

  return {
    club_plan: data.club_plan,
    club_due_date: data.club_due_date,
    status: computeStatus(data.club_due_date),
  }
}

// Marca o pagamento: define o plano (se ainda não tiver) e empurra o vencimento 30 dias
// a partir de hoje ou do vencimento atual, o que for mais tarde.
export async function markClubPayment(
  clientId: string,
  plan: string,
  currentDueDate: string | null,
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const base =
    currentDueDate && new Date(`${currentDueDate}T00:00:00`).getTime() > today.getTime()
      ? new Date(`${currentDueDate}T00:00:00`)
      : today
  const next = new Date(base)
  next.setDate(next.getDate() + 30)

  const y = next.getFullYear()
  const m = String(next.getMonth() + 1).padStart(2, '0')
  const d = String(next.getDate()).padStart(2, '0')

  const { error } = await supabase
    .from('barberpro_clients')
    .update({ club_plan: plan, club_due_date: `${y}-${m}-${d}` })
    .eq('id', clientId)

  if (error) throw new Error(`Erro ao marcar pagamento: ${error.message}`)
}

export async function cancelClub(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('barberpro_clients')
    .update({ club_plan: null, club_due_date: null })
    .eq('id', clientId)

  if (error) throw new Error(`Erro ao cancelar o plano: ${error.message}`)
}
export interface ClubMember {
  id: string
  name: string
  phone: string | null
  plan: string
  due_date: string
  status: ClubStatus
  days: number // negativo = vencido há X dias; positivo = vence em X dias
}

export async function getClubMembers(): Promise<ClubMember[]> {
  const { data, error } = await supabase
    .from('barberpro_clients')
    .select('id, name, phone, club_plan, club_due_date')
    .not('club_plan', 'is', null)
    .order('club_due_date', { ascending: true })

  if (error) throw new Error(`Erro ao buscar assinantes: ${error.message}`)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (data || []).map((c: any) => {
    const due = new Date(`${c.club_due_date}T00:00:00`)
    const days = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      plan: c.club_plan,
      due_date: c.club_due_date,
      status: days >= 0 ? 'em_dia' : 'vencido',
      days,
    }
  })
}

export async function setClubDueDate(clientId: string, dueDate: string): Promise<void> {
  const { error } = await supabase
    .from('barberpro_clients')
    .update({ club_due_date: dueDate })
    .eq('id', clientId)

  if (error) throw new Error(`Erro ao atualizar o vencimento: ${error.message}`)
}

// Marca o pagamento e já lança a mensalidade no Financeiro, numa ação só.
export async function markClubPaymentAndRecord(
  clientId: string,
  plan: string,
  currentDueDate: string | null,
  amount: number,
): Promise<void> {
  await markClubPayment(clientId, plan, currentDueDate)

  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')

  await createClubPayment({
    day: `${y}-${m}-${d}`,
    client_id: clientId,
    plan,
    amount,
  })
}
export interface ClubLookupResult {
  found: boolean
  plan: string | null
  status: ClubStatus
}

// Usado pelo /agendar (sem login) para conferir se um WhatsApp é de assinante em dia
export async function lookupClubByPhone(phone: string): Promise<ClubLookupResult> {
  const { data, error } = await supabase.rpc('barberpro_club_lookup', {
    p_phone: phone,
  })

  if (error) throw new Error(`Erro ao consultar o plano: ${error.message}`)

  const row = (data && data[0]) || null
  if (!row) {
    return { found: false, plan: null, status: 'sem_plano' }
  }

  return {
    found: true,
    plan: row.plan,
    status: row.status as ClubStatus,
  }
}