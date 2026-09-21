import { supabase } from './supabase'

// Quantos dias sem voltar deixam um cliente "em risco"
export const RISK_DAYS = 30

// created_at é gravado em UTC pelo banco, sem indicação de fuso
function parseUtc(value: string) {
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

export async function getClientKpis() {
  const now = new Date()
  const riskLimit = new Date(now.getTime() - RISK_DAYS * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

  const { data: clients, error: clientsError } = await supabase
    .from('barberpro_clients')
    .select('id, created_at')

  if (clientsError) {
    throw new Error(`Erro ao buscar clientes: ${clientsError.message}`)
  }

  const { data: appointments, error: apptError } = await supabase
    .from('barberpro_appointments')
    .select('client_id, time, status')

  if (apptError) {
    throw new Error(`Erro ao buscar agendamentos: ${apptError.message}`)
  }

  // Último atendimento concluído de cada cliente e clientes com agendamento futuro
  const lastVisit = new Map<string, number>()
  const hasUpcoming = new Set<string>()

  for (const a of appointments || []) {
    const t = new Date(a.time).getTime()
    if (a.status === 'concluido') {
      const prev = lastVisit.get(a.client_id)
      if (prev === undefined || t > prev) lastVisit.set(a.client_id, t)
    }
    if (a.status !== 'cancelado' && t >= now.getTime()) {
      hasUpcoming.add(a.client_id)
    }
  }

  let atRisk = 0
  lastVisit.forEach((last, clientId) => {
    if (last < riskLimit.getTime() && !hasUpcoming.has(clientId)) atRisk++
  })

  const newClients = (clients || []).filter(
    (c: any) => c.created_at && parseUtc(c.created_at).getTime() >= monthStart.getTime(),
  ).length

  return { atRisk, newClients }
}