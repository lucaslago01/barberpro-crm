'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Store, Upload } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadAvatar,
  type BarbershopSettings,
} from '@/lib/supabase-settings'
import { cn } from '@/lib/utils'

const inputClass =
  'h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/40 focus:ring-1 focus:ring-gold/30'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-4">
      <label className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

const emptySettings: BarbershopSettings = {
  barbershopName: '',
  phone: '',
  address: '',
  instagram: '',
  description: '',
  logoUrl: null,
}

export function GeralSettings() {
  const [settings, setSettings] = useState<BarbershopSettings>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const savingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((s) => {
        if (!cancelled) setSettings(s)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function update(patch: Partial<BarbershopSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
    setSuccess(false)
  }

  async function handleSave() {
    if (savingRef.current) return
    setError(null)
    setSuccess(false)

    if (!settings.barbershopName.trim()) {
      return setError('O nome da barbearia não pode ficar em branco.')
    }

    savingRef.current = true
    setSaving(true)
    try {
      await updateSettings(settings)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem (PNG, JPG, etc.).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem precisa ter no máximo 2 MB.')
      return
    }

    setError(null)
    setUploading(true)
    try {
      const url = await uploadLogo(file)
      update({ logoUrl: url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar a logo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem (PNG, JPG, etc.).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem precisa ter no máximo 2 MB.')
      return
    }
    setError(null)
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(file)
      update({ avatarUrl: url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar a foto')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <Panel className="p-5">
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
      </Panel>
    )
  }

  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Store className="size-[18px]" />}
        title="Informações da barbearia"
      />
      <p className="-mt-2 mb-5 text-sm text-muted-foreground">
        Dados que aparecem para seus clientes no site e no sistema.
      </p>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="grid size-28 place-items-center overflow-hidden rounded-2xl border border-border bg-background/40">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt="Logo da barbearia"
                className="size-full object-cover"
              />
            ) : (
              <Store className="size-8 text-muted-foreground/50" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
            id="logo-upload"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/40 px-3 text-xs font-medium text-foreground transition-colors hover:border-gold/40 disabled:opacity-60"
          >
            <Upload className="size-3.5 text-gold" />
            {uploading ? 'Enviando...' : 'Alterar logo'}
          </button>
          <div className="mt-2 flex flex-col items-center gap-2 border-t border-border pt-4">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full border border-border bg-background/40 text-[10px] text-muted-foreground">
              {settings.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.avatarUrl} alt="Foto de perfil" className="size-full object-cover" />
              ) : (
                'Sem foto'
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/40 px-3 text-xs font-medium text-foreground transition-colors hover:border-gold/40 disabled:opacity-60"
            >
              <Upload className="size-3.5 text-gold" />
              {uploadingAvatar ? 'Enviando...' : 'Foto de perfil'}
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3.5">
          <Field label="Nome da barbearia">
            <input
              value={settings.barbershopName}
              onChange={(e) => update({ barbershopName: e.target.value })}
              className={inputClass}
              placeholder="Ex.: FRAMES STUDIO"
            />
          </Field>
          <Field label="Telefone / WhatsApp">
            <input
              value={settings.phone}
              onChange={(e) => update({ phone: e.target.value })}
              className={inputClass}
              placeholder="(41) 99999-9999"
            />
          </Field>
          <Field label="Endereço">
            <input
              value={settings.address}
              onChange={(e) => update({ address: e.target.value })}
              className={inputClass}
              placeholder="Rua, número - Bairro, Cidade - UF"
            />
          </Field>
          <Field label="Instagram">
            <input
              value={settings.instagram}
              onChange={(e) => update({ instagram: e.target.value })}
              className={inputClass}
              placeholder="@suabarbearia"
            />
          </Field>
          <div className="grid gap-1.5 sm:grid-cols-[140px_1fr] sm:gap-4">
            <label className="text-sm text-muted-foreground sm:pt-2">Descrição</label>
            <textarea
              value={settings.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              className={cn(inputClass, 'h-auto resize-none py-2 leading-relaxed')}
              placeholder="Uma frase sobre a barbearia..."
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
          {success && (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
              <Check className="size-3.5" />
              Salvo com sucesso.
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold/90 disabled:opacity-60"
          >
            <Check className="size-4" />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </Panel>
  )
}