import { supabase } from './supabase'
import { RISK_DAYS } from './supabase-kpis'
import { INACTIVE_DAYS, VIP_VISITS } from './supabase-client-stats'

export type CampaignAudience = 'todos' | 'clube' | 'recuperar' | 'vip' | 'aniversariantes'
export type CampaignStatus = 'rascunho' | 'agendada' | 'concluida'

export interface Campaign {
  id: string
  name: string
  message: string
  audience: CampaignAudience
  sendAt: string
  status: CampaignStatus
  sentCount: number
  failedCount: number
  createdAt: string
}

export const AUDIENCE_LABELS: Record<CampaignAudience, string> = {
  todos: 'Todos os clientes',
  clube: 'Assinantes do clube',
  recuperar: 'Clientes para recuperar',
  vip: 'Clientes VIP',
  aniversariantes: 'Aniversariantes do mês',
}

function mapRow(row: any): Campaign {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    audience: row.audience,
    // a coluna não guarda fuso: o valor é sempre UTC, então marcamos com Z
    sendAt: row.send_at && !/(Z|[+-]\d\d:?\d\d)$/i.test(row.send_at) ? row.send_at + 'Z' : row.send_at,
    status: row.status,
    sentCount: row.sent_count,
    failedCount: row.failed_count || 0,
    createdAt: row.created_at,
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('barberpro_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Erro ao buscar campanhas: ${error.message}`)
  return (data || []).map(mapRow)
}

export async function createCampaign(input: {
  name: string
  message: string
  audience: CampaignAudience
  sendAt: string
  appendOptOut?: boolean
}): Promise<Campaign> {
  const finalMessage = input.appendOptOut
    ? `${input.message}

Responda PARAR para não receber mais mensagens.`
    : input.message
  const { data, error } = await supabase
    .from('barberpro_campaigns')
    .insert({
      name: input.name,
      message: finalMessage,
      audience: input.audience,
      send_at: input.sendAt,
      status: 'agendada',
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar campanha: ${error.message}`)
  return mapRow(data)
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('barberpro_campaigns').delete().eq('id', id)
  if (error) throw new Error(`Erro ao excluir campanha: ${error.message}`)
}

export interface CampaignStatsSummary {
  scheduled: number
  sentTotal: number
  completed: number
  total: number
}

export async function getCampaignStatsSummary(): Promise<CampaignStatsSummary> {
  const { data, error } = await supabase
    .from('barberpro_campaigns')
    .select('status, sent_count')

  if (error) throw new Error(`Erro ao buscar estatísticas: ${error.message}`)

  const rows = data || []
  return {
    scheduled: rows.filter((r) => r.status === 'agendada').length,
    sentTotal: rows.reduce((sum, r) => sum + (r.sent_count || 0), 0),
    completed: rows.filter((r) => r.status === 'concluida').length,
    total: rows.length,
  }
}

// Conta quantos clientes cada público-alvo atinge, para mostrar antes de criar a campanha.
export async function getAudienceCount(audience: CampaignAudience): Promise<number> {
  if (audience === 'todos') {
    const { count, error } = await supabase
      .from('barberpro_clients')
      .select('*', { count: 'exact', head: true })
      .neq('campaign_opt_out', true)
    if (error) throw new Error(error.message)
    return count || 0
  }

  if (audience === 'clube') {
    const { count, error } = await supabase
      .from('barberpro_clients')
      .select('*', { count: 'exact', head: true })
      .not('club_plan', 'is', null)
      .neq('campaign_opt_out', true)
    if (error) throw new Error(error.message)
    return count || 0
  }

  if (audience === 'aniversariantes') {
    const { data, error } = await supabase
      .from('barberpro_clients')
      .select('birth_date, campaign_opt_out')
      .not('birth_date', 'is', null)
      .neq('campaign_opt_out', true)
    if (error) throw new Error(error.message)
    const month = new Date().getMonth() + 1
    return (data || []).filter((c: any) => {
      const d = new Date(`${c.birth_date}T00:00:00`)
      return d.getMonth() + 1 === month
    }).length
  }

  if (audience === 'recuperar') {
    const { getRecoverableClients } = await import('./supabase-client-stats')
    const list = await getRecoverableClients()
    return list.filter((c: any) => !c.campaign_opt_out).length
  }

  if (audience === 'vip') {
    const { data: optOutData, error: optOutError } = await supabase
      .from('barberpro_clients')
      .select('id')
      .eq('campaign_opt_out', true)
    if (optOutError) throw new Error(optOutError.message)
    const optOutIds = new Set((optOutData || []).map((c: any) => c.id))

    const { data, error } = await supabase
      .from('barberpro_appointments')
      .select('client_id, status')
      .eq('status', 'concluido')
    if (error) throw new Error(error.message)
    const counts = new Map<string, number>()
    for (const a of data || []) {
      if (!optOutIds.has(a.client_id)) {
        counts.set(a.client_id, (counts.get(a.client_id) || 0) + 1)
      }
    }
    return Array.from(counts.values()).filter((c) => c >= VIP_VISITS).length
  }

  return 0
}