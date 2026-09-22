'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Scissors, Pencil, Trash2, X } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  type ServiceOption,
} from '@/lib/supabase-appointments'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function parseAmount(value: string) {
  const n = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

const fieldClass =
  'h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/40 focus:ring-1 focus:ring-gold/30'

function ServiceModal({
  service,
  onClose,
  onSaved,
}: {
  service: ServiceOption | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(service?.name ?? '')
  const [duration, setDuration] = useState(service ? String(service.duration) : '')
  const [price, setPrice] = useState(service ? String(service.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  async function handleSave() {
    if (savingRef.current) return
    setError(null)

    if (!name.trim()) return setError('Digite o nome do serviço.')
    const dur = Number(duration)
    if (!(dur > 0)) return setError('A duração precisa ser maior que zero.')
    const val = parseAmount(price)
    if (!(val > 0)) return setError('Informe um preço maior que zero.')

    savingRef.current = true
    setSaving(true)
    try {
      if (service) {
        await updateService(service.id, { name: name.trim(), duration: dur, price: val })
      } else {
        await createService({ name: name.trim(), duration: dur, price: val })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar serviço')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {service ? 'Editar serviço' : 'Novo serviço'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="Ex.: Corte"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Duração (minutos)</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              className={fieldClass}
              placeholder="Ex.: 35"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Preço (R$)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
              placeholder="Ex.: 80,00"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

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

export function ServicesSettings() {
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceOption | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await getServices()
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(s: ServiceOption) {
    setEditing(s)
    setModalOpen(true)
  }

  async function handleDelete(s: ServiceOption) {
    if (!window.confirm(`Apagar o serviço "${s.name}"?`)) return
    try {
      await deleteService(s.id)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao apagar serviço')
    }
  }

  return (
    <Panel className="p-5">
      {modalOpen && (
        <ServiceModal
          service={editing}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}

      <PanelHeader
        className="px-0 pt-0"
        icon={<Scissors className="size-[18px]" />}
        title="Serviços oferecidos"
        action={
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-gold px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold/90"
          >
            <Plus className="size-4" />
            Novo serviço
          </button>
        }
      />
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Gerencie os serviços, durações e valores da sua barbearia.
      </p>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-danger">Erro: {error}</p>
      ) : services.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/30 px-4 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold/12 text-gold">
                <Scissors className="size-4" />
              </span>
              <span className="flex-1 text-sm font-medium">{s.name}</span>
              <span className="text-sm text-muted-foreground">{s.duration} min</span>
              <span className="w-20 text-right text-sm font-semibold tabular-nums text-gold">
                {currency.format(s.price)}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => openEdit(s)}
                  aria-label={`Editar ${s.name}`}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  aria-label={`Apagar ${s.name}`}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}