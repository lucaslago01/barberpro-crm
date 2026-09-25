'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { AgendaSlot } from '@/lib/types'

export function EditAppointmentModal({
  slot,
  onClose,
  onSave,
}: {
  slot: AgendaSlot
  onClose: () => void
  onSave: (notes: string) => Promise<void> | void
}) {
  const [notes, setNotes] = useState(slot.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(notes)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Editar agendamento</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-3 rounded-lg border border-border bg-background/40 px-3 py-2">
          <p className="text-sm font-medium">{slot.client}</p>
          <p className="text-xs text-muted-foreground">
            {slot.service} · {slot.time}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40"
            placeholder="Observações sobre o agendamento..."
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}