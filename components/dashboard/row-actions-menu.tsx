'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Check, Scissors, CircleCheck, UserX, X } from 'lucide-react'
import type { AgendaSlot, AppointmentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const actions: {
  status: AppointmentStatus
  label: string
  icon: typeof Check
  tone: string
}[] = [
  { status: 'confirmado', label: 'Confirmar', icon: Check, tone: 'hover:text-info' },
  { status: 'atendimento', label: 'Iniciar atendimento', icon: Scissors, tone: 'hover:text-gold' },
  { status: 'concluido', label: 'Concluir', icon: CircleCheck, tone: 'hover:text-success' },
  { status: 'faltou', label: 'Marcar como faltou', icon: UserX, tone: 'hover:text-rose-400' },
  { status: 'cancelado', label: 'Cancelar', icon: X, tone: 'hover:text-danger' },
]

export function RowActionsMenu({
  slot,
  onChangeStatus,
  className,
}: {
  slot: AgendaSlot
  onChangeStatus: (id: string, status: AppointmentStatus) => Promise<void> | void
  className?: string
}) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<AppointmentStatus | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const open = pos !== null

  useEffect(() => {
    if (!open) return
    const close = () => setPos(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  function toggle() {
    if (open) {
      setPos(null)
      return
    }
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  async function choose(status: AppointmentStatus) {
    setPos(null)
    // Confirmação própria: o alerta do navegador é bloqueado em alguns apps
    if (status === 'cancelado' || status === 'faltou') {
      setConfirming(status)
      return
    }
    await apply(status)
  }

  async function apply(status: AppointmentStatus) {
    setBusy(true)
    try {
      await onChangeStatus(slot.id, status)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        aria-label="Mais ações"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={toggle}
        className={cn(
          'grid size-7 place-items-center rounded-md hover:bg-white/5 hover:text-foreground disabled:opacity-50',
          className,
        )}
      >
        <MoreVertical className="size-4" />
      </button>

      {confirming &&
        createPortal(
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-2 text-base font-semibold">
                {confirming === 'cancelado' ? 'Cancelar agendamento' : 'Marcar como faltou'}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {confirming === 'cancelado'
                  ? 'O horário volta a ficar livre na agenda.'
                  : 'O atendimento fica registrado como falta do cliente.'}
              </p>
              <div className="mb-5 rounded-lg border border-border bg-background/40 px-3 py-2">
                <p className="text-sm font-medium">{slot.client}</p>
                <p className="text-xs text-muted-foreground">
                  {slot.service} · {slot.time}
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setConfirming(null)}
                  className="h-11 rounded-lg border border-border px-3.5 text-sm text-muted-foreground hover:text-foreground sm:h-auto sm:py-2"
                >
                  Voltar
                </button>
                <button
                  onClick={async () => {
                    const status = confirming
                    setConfirming(null)
                    await apply(status)
                  }}
                  className={cn(
                    'h-11 rounded-lg px-3.5 text-sm font-semibold text-white hover:brightness-105 sm:h-auto sm:py-2',
                    confirming === 'cancelado' ? 'bg-danger' : 'bg-rose-500',
                  )}
                >
                  {confirming === 'cancelado' ? 'Cancelar agendamento' : 'Marcar como faltou'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPos(null)} />
            <div
              role="menu"
              style={{ top: pos.top, right: pos.right }}
              className="fixed z-50 w-52 rounded-xl border border-border bg-card p-1 shadow-xl"
            >
              {actions.map(({ status, label, icon: Icon, tone }) => {
                const current = slot.status === status
                return (
                  <button
                    key={status}
                    role="menuitem"
                    disabled={current}
                    onClick={() => choose(status)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-white/5',
                      tone,
                      current && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}