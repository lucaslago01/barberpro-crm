'use client'

import { useEffect, useState } from 'react'
import {
  getAgendaSlotsByDate,
  updateAppointmentStatus,
  updateAppointmentNotes,
} from '@/lib/supabase-data'
import { supabase } from '@/lib/supabase'
import { AgendaView } from './agenda-view'
import type { AgendaSlot } from '@/lib/types'
import type { AgendaStatus } from '@/lib/data'

export function AgendaWithSupabase() {
  const [slots, setSlots] = useState<AgendaSlot[]>([])
  const [date, setDate] = useState(() => new Date())
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const dateKey = date.getTime()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError(null)
        const data = await getAgendaSlotsByDate(new Date(dateKey))
        if (!cancelled) setSlots(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos')
        }
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [dateKey, reloadKey])

  useEffect(() => {
    const channel = supabase
      .channel('agenda-appointments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barberpro_appointments' },
        () => {
          setReloadKey((k) => k + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleUpdateStatus(id: string, status: AgendaStatus) {
    // Atualização otimista: muda a tela na hora, sincroniza com o banco em seguida
    const previousSlots = slots
    setSlots((current) =>
      current.map((s) => (s.id === id ? { ...s, status } : s))
    )
    try {
      await updateAppointmentStatus(id, status)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setSlots(previousSlots)
      alert('Não foi possível atualizar o status. Tente de novo.')
    }
  }

  async function handleUpdateNotes(id: string, notes: string) {
    try {
      await updateAppointmentNotes(id, notes)
      setReloadKey((k) => k + 1)
    } catch (err) {
      console.error('Erro ao atualizar observações:', err)
      alert('Não foi possível salvar as observações. Tente de novo.')
    }
  }

  if (initialLoading) return <div className="p-8 text-center">Carregando agendamentos...</div>
  if (error) return <div className="p-8 text-center text-red-500">Erro: {error}</div>

  return (
    <AgendaView
      slots={slots}
      date={date}
      onDateChange={setDate}
      onReload={() => setReloadKey((k) => k + 1)}
      onUpdateStatus={handleUpdateStatus}
      onUpdateNotes={handleUpdateNotes}
    />
  )
}