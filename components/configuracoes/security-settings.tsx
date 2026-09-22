'use client'

import { useRef, useState } from 'react'
import { Check, KeyRound, Lock } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import { updatePassword } from '@/lib/auth'

const fieldClass =
  'h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/40 focus:ring-1 focus:ring-gold/30'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-4">
      <label className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const savingRef = useRef(false)

  async function handleUpdate() {
    if (savingRef.current) return
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      return setError('A senha precisa ter pelo menos 6 caracteres.')
    }
    if (newPassword !== confirmPassword) {
      return setError('As senhas não são iguais.')
    }

    savingRef.current = true
    setSaving(true)
    try {
      await updatePassword(newPassword)
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar senha')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<KeyRound className="size-[18px]" />}
        title="Alterar senha"
      />
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Recomendamos uma senha forte e única.
      </p>
      <div className="space-y-3.5">
        <Field label="Nova senha">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className={fieldClass}
          />
        </Field>
        <Field label="Confirmar senha">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={fieldClass}
          />
        </Field>

        {error && <p className="sm:col-start-2 text-xs text-danger sm:pl-0">{error}</p>}
        {success && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
            <Check className="size-3.5" />
            Senha atualizada com sucesso.
          </p>
        )}

        <div className="sm:grid sm:grid-cols-[140px_1fr] sm:gap-4">
          <span className="hidden sm:block" />
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold/90 disabled:opacity-60"
          >
            <Lock className="size-4" />
            {saving ? 'Atualizando...' : 'Atualizar senha'}
          </button>
        </div>
      </div>
    </Panel>
  )
}