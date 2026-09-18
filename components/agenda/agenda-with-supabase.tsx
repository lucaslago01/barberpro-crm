'use client'

import { useEffect, useState } from 'react'
import { getAgendaSlots, updateAppointmentStatus, updateAppointmentNotes } from '@/lib/supabase-data'
import { AgendaView } from './agenda-view'
import type { AgendaSlot } from '@/lib/types'
import type { AgendaStatus } from '@/lib/data'

export function AgendaWithSupabase() {
  const [slots, setSlots] = useState<AgendaSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    try {
      setLoading(true)
      const data = await getAgendaSlots()
      setSlots(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleUpdateStatus(id: string, status: AgendaStatus) {
    try {
      await updateAppointmentStatus(id, status)
      await fetchData()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  async function handleUpdateNotes(id: string, notes: string) {
    try {
      await updateAppointmentNotes(id, notes)
      await fetchData()
    } catch (err) {
      console.error('Erro ao atualizar observações:', err)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando agendamentos...</div>
  if (error) return <div className="p-8 text-center text-red-500">Erro: {error}</div>

  return (
    <AgendaView
      slots={slots}
      onUpdateStatus={handleUpdateStatus}
      onUpdateNotes={handleUpdateNotes}
    />
  )
}