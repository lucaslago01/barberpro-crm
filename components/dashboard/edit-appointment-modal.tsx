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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-gradient-to-b from-card to-[oklch(0.19_0.009_300)] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_oklch(0.62_0.19_305/10%)] animate-scale-in before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gold/50 before:to-transparent">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Editar agendamento</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-white/5 hover:text-gold active:scale-90"
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
            className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/60 focus:bg-background/60 focus:shadow-[0_0_0_3px_oklch(0.62_0.19_305/15%)]"
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
            className="rounded-lg btn-gold-glow px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}