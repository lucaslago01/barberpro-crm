'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Crown,
  TriangleAlert,
  Clock,
  Search,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  Eye,
  Pencil,
  MoreHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader, SeeAll } from '@/components/dashboard/panel'
import { UserAvatar } from '@/components/dashboard/user-avatar'
import { ClientStatusBadge } from '@/components/dashboard/badges'
import { WhatsappIconButton } from '@/components/dashboard/whatsapp-button'
import {
  clientStatusFilters,
  type Client,
  type ClientStatus,
  type FeaturedTab,
} from '@/lib/data'
import {
  getClients,
  createClient,
  updateClient,
  getClientAppointments,
  deleteClient,
  getRecentInteractions,
  type ClientAppointmentHistoryItem,
  type RecentInteraction,
} from '@/lib/supabase-data'
import { supabase } from '@/lib/supabase'
import {
  getClientStats,
  type ClientStats,
  getRecoverableClients,
  type RecoverableClient,
} from '@/lib/supabase-client-stats'
import {
  CLUB_PLANS,
  cancelClub,
  getClubInfo,
  getClubMembers,
  markClubPaymentAndRecord,
  setClubDueDate,
  type ClubInfo,
  type ClubMember,
} from '@/lib/supabase-club'
import type { Client as SupabaseClient } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Cake, MessageCircle, Zap } from 'lucide-react'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Valor sugerido de cada plano (o Juan pode ajustar na hora de confirmar o pagamento)
const PLAN_PRICES: Record<string, number> = {
  Corte: 139,
  'Corte e barba': 229,
  Barba: 159,
}

function mapToRow(c: SupabaseClient, stats?: ClientStats): Client {
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.phone || '-',
    lastVisit: stats?.lastVisit || '-',
    lastVisitAgo: stats?.lastVisitAgo || '-',
    lastVisitTimestamp: stats?.lastVisitTimestamp || 0,
    frequency: stats?.frequency || '-',
    visits: stats?.visits || 0,
    avgTicket: stats?.avgTicket || 0,
    status: stats?.status || 'ativo',
    isClubMember: Boolean(c.club_plan),
    clubPlan: c.club_plan || null,
  }
}

const statIconMap: Record<string, LucideIcon> = {
  Users,
  Crown,
  TriangleAlert,
  Clock,
}

const statToneMap: Record<string, string> = {
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  danger: 'bg-danger/12 text-danger',
  muted: 'bg-white/5 text-muted-foreground',
}

function StatCards() {
  const [counts, setCounts] = useState<{
    total: number
    vip: number
    risk: number
    inactive: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [clients, stats] = await Promise.all([getClients(), getClientStats()])
        if (cancelled) return
        const values = Object.values(stats)
        setCounts({
          total: clients.length,
          vip: values.filter((s) => s.status === 'vip').length,
          risk: values.filter((s) => s.status === 'em risco').length,
          inactive: values.filter((s) => s.status === 'inativo').length,
        })
      } catch (err) {
        console.error('Erro ao carregar cartões de clientes:', err)
        if (!cancelled) setCounts(null)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = [
    { label: 'Total de clientes', value: counts?.total, icon: 'Users', tone: 'gold' },
    { label: 'Clientes VIP', value: counts?.vip, icon: 'Crown', tone: 'success' },
    { label: 'Clientes em risco', value: counts?.risk, icon: 'TriangleAlert', tone: 'danger' },
    { label: 'Clientes inativos', value: counts?.inactive, icon: 'Clock', tone: 'muted' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = statIconMap[card.icon]
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/30"
          >
            <span
              className={cn(
                'grid size-10 place-items-center rounded-xl',
                statToneMap[card.tone],
              )}
            >
              <Icon className="size-5" />
            </span>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {card.value === undefined ? '-' : card.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p>
          </div>
        )
      })}
    </div>
  )
}


function RowAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: LucideIcon
  onClick?: () => void
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
    >
      <Icon className="size-4" />
    </button>
  )
}

function ClientRow({
  client,
  checked,
  onToggle,
  onEdit,
  onView,
  onViewHistory,
  onDelete,
  menuOpen,
  onToggleMenu,
}: {
  client: Client
  onView: () => void
  onViewHistory: () => void
  onDelete: () => void
  menuOpen: boolean
  onToggleMenu: () => void
  checked: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  return (
    <tr className="group border-t border-border transition-colors hover:bg-white/[0.02]">
      <td className="py-3 pl-4 pr-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Selecionar ${client.name}`}
          className="size-4 rounded border-border bg-transparent accent-gold"
        />
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={client.name} size="md" ring={client.status === 'vip'} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{client.name}</p>
            <p className="truncate text-xs text-muted-foreground sm:hidden">
              {client.whatsapp}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden py-3 pr-4 sm:table-cell">
        <span className="inline-flex items-center gap-1.5 text-sm text-success">
          <MessageCircle className="size-3.5" />
          {client.whatsapp}
        </span>
      </td>
      <td className="hidden py-3 pr-4 md:table-cell">
        <p className="text-sm">{client.lastVisit}</p>
        <p className="text-xs text-muted-foreground">{client.lastVisitAgo}</p>
      </td>
      <td className="hidden py-3 pr-4 text-sm text-muted-foreground lg:table-cell">
        {client.frequency}
      </td>
      <td className="hidden py-3 pr-4 text-sm font-medium tabular-nums lg:table-cell">
        {client.visits}
      </td>
      <td className="hidden py-3 pr-4 text-sm font-semibold tabular-nums md:table-cell">
        {currency.format(client.avgTicket)}
      </td>
      <td className="py-3 pr-4">
        <ClientStatusBadge status={client.status} />
      </td>
      <td className="py-3 pr-4">
        <div className="relative flex items-center gap-0.5">
          <RowAction label="Ver perfil" icon={Eye} onClick={onView} />
          <RowAction label="Editar" icon={Pencil} onClick={onEdit} />
          <WhatsappIconButton
            label={`Enviar WhatsApp para ${client.name}`}
            phone={client.whatsapp === '-' ? null : client.whatsapp}
          />
          <RowAction label="Mais opções" icon={MoreHorizontal} onClick={onToggleMenu} />

          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
              <button
                onClick={onViewHistory}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-white/5"
              >
                Ver histórico
              </button>
              <button
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-white/5"
              >
                Excluir cliente
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

function NewClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (c: SupabaseClient) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClub, setIsClub] = useState(false)
  const [clubPlan, setClubPlan] = useState(CLUB_PLANS[0])
  const [alreadyPaid, setAlreadyPaid] = useState(true)
  const [dueDate, setDueDate] = useState('')

  async function handleSave() {
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    if (isClub && !alreadyPaid && !dueDate) {
      setError('Informe a data de vencimento')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const created = await createClient({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        club_plan: isClub && !alreadyPaid ? clubPlan : undefined,
        club_due_date: isClub && !alreadyPaid ? dueDate : undefined,
      })
      if (isClub && alreadyPaid) {
        await markClubPaymentAndRecord(created.id, clubPlan, null, PLAN_PRICES[clubPlan] ?? 0)
      }
      onCreated(created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Novo cliente</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">WhatsApp</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              placeholder="(41) 99999-9999"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              placeholder="email@exemplo.com"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isClub}
              onChange={(e) => setIsClub(e.target.checked)}
              className="size-4 rounded border-border accent-gold"
            />
            Cliente do clube
          </label>

          {isClub && (
            <div className="space-y-3 rounded-xl border border-border bg-background/30 p-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Plano</label>
                <select
                  value={clubPlan}
                  onChange={(e) => setClubPlan(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
                >
                  {CLUB_PLANS.map((p) => (
                    <option key={p} value={p} className="bg-card text-foreground">
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={alreadyPaid}
                  onChange={(e) => setAlreadyPaid(e.target.checked)}
                  className="size-4 rounded border-border accent-gold"
                />
                Já pagou a mensalidade
              </label>

              {!alreadyPaid && (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Data de vencimento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
                  />
                </div>
              )}
            </div>
          )}
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

function ConfirmPaymentModal({
  plan,
  onClose,
  onConfirm,
}: {
  plan: string
  onClose: () => void
  onConfirm: (amount: number) => Promise<void>
}) {
  const [amount, setAmount] = useState(String(PLAN_PRICES[plan] ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function parseAmount(value: string) {
    const n = Number(value.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : NaN
  }

  async function handleConfirm() {
    setError(null)
    const value = parseAmount(amount)
    if (!(value > 0)) return setError('Informe um valor maior que zero.')

    setSaving(true)
    try {
      await onConfirm(value)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar pagamento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Confirmar pagamento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Plano: <span className="font-medium text-foreground">{plan}</span>
        </p>
        <label className="mb-1 block text-xs text-muted-foreground">Valor recebido (R$)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="h-9 w-full rounded-lg border border-border bg-background/60 px-2 text-sm outline-none focus:border-gold/40"
          placeholder="0,00"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Empurra o vencimento +30 dias e lança essa entrada no Financeiro.
        </p>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60"
          >
            {saving ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ClubSection({ clientId }: { clientId: string }) {
  const [info, setInfo] = useState<ClubInfo | null>(null)
  const [plan, setPlan] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingPayment, setConfirmingPayment] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const data = await getClubInfo(clientId)
      setInfo(data)
      setPlan(data.club_plan || CLUB_PLANS[0])
      setCustomDate(data.club_due_date || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o plano')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function handleConfirmPayment(amount: number) {
    await markClubPaymentAndRecord(clientId, plan, info?.club_due_date ?? null, amount)
    await load()
  }

  async function handleSaveDate() {
    if (!customDate) return setError('Escolha uma data.')
    setError(null)
    setSaving(true)
    try {
      // Se ainda não tem plano, define o plano escolhido junto com a data
      if (!info?.club_plan) {
        await setClubDueDate(clientId, customDate)
        // garante que o plano também fica salvo
        await markClubPaymentAndRecord(clientId, plan, null, 0).catch(() => {})
      }
      await setClubDueDate(clientId, customDate)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a data')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancelar o plano do clube deste cliente?')) return
    setError(null)
    setSaving(true)
    try {
      await cancelClub(clientId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar o plano')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-xs text-muted-foreground">Carregando plano...</p>
  }

  const dueLabel = info?.club_due_date
    ? new Date(`${info.club_due_date}T00:00:00`).toLocaleDateString('pt-BR')
    : null

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      {confirmingPayment && (
        <ConfirmPaymentModal
          plan={plan}
          onClose={() => setConfirmingPayment(false)}
          onConfirm={handleConfirmPayment}
        />
      )}

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Clube (assinatura)
      </p>

      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">Plano</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background/60 px-2 text-sm outline-none focus:border-gold/40"
        >
          {CLUB_PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {info?.club_plan && (
        <div className="mb-3 flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {info.club_plan} · vence {dueLabel}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              info.status === 'em_dia'
                ? 'bg-success/15 text-success'
                : 'bg-danger/15 text-danger',
            )}
          >
            {info.status === 'em_dia' ? 'Em dia' : 'Vencido'}
          </span>
        </div>
      )}

      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Vencimento (editar manualmente, sem lançar no Financeiro)
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-border bg-background/60 px-2 text-sm outline-none focus:border-gold/40"
          />
          <button
            onClick={handleSaveDate}
            disabled={saving}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            Salvar data
          </button>
        </div>
      </div>

      {error && <p className="mb-2 text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => setConfirmingPayment(true)}
          disabled={saving}
          className="flex-1 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60"
        >
          Marcar pagamento (+30 dias)
        </button>
        {info?.club_plan && (
          <button
            onClick={handleCancel}
            disabled={saving}
            className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
          >
            Cancelar plano
          </button>
        )}
      </div>
    </div>
  )
}

function EditClientModal({
  client,
  onClose,
  onUpdated,
}: {
  client: SupabaseClient
  onClose: () => void
  onUpdated: () => void
}) {
  const [name, setName] = useState(client.name)
  const [phone, setPhone] = useState(client.phone || '')
  const [email, setEmail] = useState(client.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    try {
      setSaving(true)
      setError(null)
      await updateClient(client.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Editar cliente</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">WhatsApp</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              placeholder="(41) 99999-9999"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              placeholder="email@exemplo.com"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <div className="my-4 h-px bg-border" />

        <ClubSection clientId={client.id} />

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

function ClientProfileModal({
  client,
  initialTab = 'info',
  onClose,
}: {
  client: SupabaseClient
  initialTab?: 'info' | 'historico'
  onClose: () => void
}) {
  const [tab, setTab] = useState<'info' | 'historico'>(initialTab)
  const [history, setHistory] = useState<ClientAppointmentHistoryItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getClientAppointments(client.id)
      .then((data) => {
        if (!cancelled) setHistory(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar histórico')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client.id])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{client.name}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg border border-border bg-background/30 p-1">
          <button
            onClick={() => setTab('info')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === 'info' ? 'bg-gold text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setTab('historico')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === 'historico' ? 'bg-gold text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Histórico
          </button>
        </div>

        {tab === 'info' && (
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Nome:</span> {client.name}</p>
            <p><span className="text-muted-foreground">WhatsApp:</span> {client.phone || '-'}</p>
            <p><span className="text-muted-foreground">Email:</span> {client.email || '-'}</p>
            <p><span className="text-muted-foreground">Plano do clube:</span> {client.club_plan || 'Não é assinante'}</p>
            {client.club_due_date && (
              <p><span className="text-muted-foreground">Vencimento do clube:</span> {new Date(`${client.club_due_date}T00:00:00`).toLocaleDateString('pt-BR')}</p>
            )}
          </div>
        )}

        {tab === 'historico' && (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
            {!loading && !error && history?.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p>
            )}
            {!loading && history?.map((h) => (
              <div key={h.id} className="rounded-lg border border-border bg-background/30 p-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{h.serviceName}</span>
                  <span className="font-semibold">{currency.format(h.price)}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(h.time).toLocaleDateString('pt-BR')}</span>
                  <span className="capitalize">{h.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClientsTable() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ClientStatus | 'todos'>('todos')
  const [period, setPeriod] = useState<'todos' | '3m'>('todos')
  const [sortBy, setSortBy] = useState<'recentes' | 'nome'>('recentes')
  const [onlyClub, setOnlyClub] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minVisits, setMinVisits] = useState('')
  const [maxVisits, setMaxVisits] = useState('')
  const [minTicket, setMinTicket] = useState('')
  const [maxTicket, setMaxTicket] = useState('')
  const [clubPlanFilter, setClubPlanFilter] = useState<string>('todos')
  const [viewingClient, setViewingClient] = useState<SupabaseClient | null>(null)
  const [viewingTab, setViewingTab] = useState<'info' | 'historico'>('info')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingClient, setDeletingClient] = useState<SupabaseClient | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<SupabaseClient | null>(null)
  const [rawClients, setRawClients] = useState<SupabaseClient[]>([])

  async function loadClients() {
    try {
      setLoading(true)
      setError(null)
      const data = await getClients()
      let stats: Record<string, ClientStats> = {}
      try {
        stats = await getClientStats()
      } catch (statsErr) {
        console.error('Erro ao calcular estatísticas dos clientes:', statsErr)
      }
      setClients(data.map((c) => mapToRow(c, stats[c.id])))
      setRawClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000

    const result = clients.filter((c) => {
      const matchesStatus = status === 'todos' || c.status === status
      const matchesSearch =
        q === '' ||
        c.name.toLowerCase().includes(q) ||
        c.whatsapp.toLowerCase().includes(q)
      const matchesPeriod =
        period === 'todos' ||
        (c.lastVisitTimestamp !== undefined && c.lastVisitTimestamp >= threeMonthsAgo)
      const matchesClub = !onlyClub || c.isClubMember
      const matchesMinVisits = minVisits === '' || c.visits >= Number(minVisits)
      const matchesMaxVisits = maxVisits === '' || c.visits <= Number(maxVisits)
      const matchesMinTicket = minTicket === '' || c.avgTicket >= Number(minTicket)
      const matchesMaxTicket = maxTicket === '' || c.avgTicket <= Number(maxTicket)
      const matchesClubPlan = clubPlanFilter === 'todos' || c.clubPlan === clubPlanFilter
      return (
        matchesStatus &&
        matchesSearch &&
        matchesPeriod &&
        matchesClub &&
        matchesMinVisits &&
        matchesMaxVisits &&
        matchesMinTicket &&
        matchesMaxTicket &&
        matchesClubPlan
      )
    })

    result.sort((a, b) => {
      if (sortBy === 'nome') return a.name.localeCompare(b.name)
      return (b.lastVisitTimestamp || 0) - (a.lastVisitTimestamp || 0)
    })

    return result
   }, [clients, search, status, period, sortBy, onlyClub, minVisits, maxVisits, minTicket, maxTicket, clubPlanFilter])

  const allChecked = filtered.length > 0 && filtered.every((c) => selected.has(c.id))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allChecked) {
        const next = new Set(prev)
        filtered.forEach((c) => next.delete(c.id))
        return next
      }
      const next = new Set(prev)
      filtered.forEach((c) => next.add(c.id))
      return next
    })
  }

  return (
    <Panel>
      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onCreated={() => loadClients()}
        />
      )}

      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onUpdated={() => loadClients()}
        />
      )}

      {viewingClient && (
        <ClientProfileModal
          client={viewingClient}
          initialTab={viewingTab}
          onClose={() => setViewingClient(null)}
        />
      )}

      {deletingClient && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-2 text-base font-semibold">Excluir cliente</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong>{deletingClient.name}</strong>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingClient(null)}
                className="rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await deleteClient(deletingClient.id)
                  setDeletingClient(null)
                  loadClients()
                }}
                className="rounded-lg bg-danger px-3.5 py-2 text-sm font-semibold text-white hover:brightness-105"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome ou WhatsApp..."
            className="h-10 w-full rounded-lg border border-border bg-background/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/40"
          />
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClientStatus | 'todos')}
            className="h-10 shrink-0 appearance-none rounded-lg border border-border bg-background/40 pl-3 pr-9 text-sm text-foreground outline-none transition-colors hover:text-foreground focus:border-gold/40"
          >
            {clientStatusFilters.map((f) => (
              <option key={f.key} value={f.key} className="bg-card text-foreground">
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'todos' | '3m')}
            className="h-10 shrink-0 appearance-none rounded-lg border border-border bg-background/40 pl-3 pr-9 text-sm text-foreground outline-none transition-colors hover:text-foreground focus:border-gold/40"
          >
            <option value="todos" className="bg-card text-foreground">Todos os períodos</option>
            <option value="3m" className="bg-card text-foreground">Últimos 3 meses</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recentes' | 'nome')}
            className="h-10 shrink-0 appearance-none rounded-lg border border-border bg-background/40 pl-3 pr-9 text-sm text-foreground outline-none transition-colors hover:text-foreground focus:border-gold/40"
          >
            <option value="recentes" className="bg-card text-foreground">Mais recentes</option>
            <option value="nome" className="bg-card text-foreground">Nome (A-Z)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        
        <button
          type="button"
          onClick={() => setOnlyClub((v) => !v)}
          aria-pressed={onlyClub}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
            onlyClub
              ? 'border-gold/40 bg-gold/10 text-gold'
              : 'border-border bg-background/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          Clube
        </button>

        <button
          aria-label="Mais filtros"
          onClick={() => setShowAdvanced((v) => !v)}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-colors ${
            showAdvanced
              ? 'border-gold/40 bg-gold/10 text-gold'
              : 'border-border bg-background/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="size-4" />
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
        >
          <Plus className="size-4" />
          Novo cliente
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Visitas (mín. / máx.)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={minVisits}
                onChange={(e) => setMinVisits(e.target.value)}
                placeholder="Mín."
                className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              />
              <input
                type="number"
                min="0"
                value={maxVisits}
                onChange={(e) => setMaxVisits(e.target.value)}
                placeholder="Máx."
                className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Ticket médio (mín. / máx.)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={minTicket}
                onChange={(e) => setMinTicket(e.target.value)}
                placeholder="R$ mín."
                className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              />
              <input
                type="number"
                min="0"
                value={maxTicket}
                onChange={(e) => setMaxTicket(e.target.value)}
                placeholder="R$ máx."
                className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Plano do clube</label>
            <select
              value={clubPlanFilter}
              onChange={(e) => setClubPlanFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
            >
              <option value="todos" className="bg-card text-foreground">Todos os planos</option>
              {CLUB_PLANS.map((p) => (
                <option key={p} value={p} className="bg-card text-foreground">
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              onClick={() => {
                setMinVisits('')
                setMaxVisits('')
                setMinTicket('')
                setMaxTicket('')
                setClubPlanFilter('todos')
              }}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Limpar filtros avançados
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Carregando clientes...
        </div>
      )}

      {error && (
        <div className="p-8 text-center text-sm text-danger">Erro: {error}</div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="py-2.5 pl-4 pr-2 font-medium">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Selecionar todos"
                    className="size-4 rounded border-border bg-transparent accent-gold"
                  />
                </th>
                <th className="py-2.5 pr-4 font-medium">Cliente</th>
                <th className="hidden py-2.5 pr-4 font-medium sm:table-cell">
                  WhatsApp
                </th>
                <th className="hidden py-2.5 pr-4 font-medium md:table-cell">
                  Último atendimento
                </th>
                <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">
                  Frequência
                </th>
                <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">
                  Visitas
                </th>
                <th className="hidden py-2.5 pr-4 font-medium md:table-cell">
                  Ticket médio
                </th>
                <th className="py-2.5 pr-4 font-medium">Status</th>
                <th className="py-2.5 pr-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  checked={selected.has(client.id)}
                  onToggle={() => toggle(client.id)}
                  onEdit={() =>
                    setEditingClient(rawClients.find((c) => c.id === client.id) || null)
                  }
                  onView={() => {
                    setViewingClient(rawClients.find((c) => c.id === client.id) || null)
                    setViewingTab('info')
                  }}
                  onViewHistory={() => {
                    setViewingClient(rawClients.find((c) => c.id === client.id) || null)
                    setViewingTab('historico')
                    setOpenMenuId(null)
                  }}
                  onDelete={() => {
                    setDeletingClient(rawClients.find((c) => c.id === client.id) || null)
                    setOpenMenuId(null)
                  }}
                  menuOpen={openMenuId === client.id}
                  onToggleMenu={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                />
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="grid place-items-center gap-2 py-16 text-center">
              <Users className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum cliente encontrado com esses filtros.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Mostrando {filtered.length} de {clients.length} clientes
        </p>
      </div>
    </Panel>
  )
}

function ClubMembersPanel() {
  const [members, setMembers] = useState<ClubMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    getClubMembers()
      .then((data) => {
        if (!cancelled) setMembers(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar assinantes')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function dueLabel(m: ClubMember) {
    if (m.days < 0) return `Vencido há ${Math.abs(m.days)} dia(s)`
    if (m.days === 0) return 'Vence hoje'
    return `Vence em ${m.days} dia(s)`
  }

  function toneClass(m: ClubMember) {
    if (m.days < 0) return 'text-danger'
    if (m.days <= 5) return 'text-warning'
    return 'text-muted-foreground'
  }

  function renderMemberRow(m: ClubMember) {
    return (
      <li
        key={m.id}
        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
      >
        <UserAvatar name={m.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{m.name}</p>
          <p className="truncate text-xs text-muted-foreground">{m.plan}</p>
          <p className={cn('truncate text-xs font-medium', toneClass(m))}>
            {dueLabel(m)}
          </p>
        </div>
        <WhatsappIconButton
          label={`Cobrar ${m.name} no WhatsApp`}
          phone={m.phone}
        />
      </li>
    )
  }

  const visibleMembers = members?.slice(0, 3) || []

  return (
    <Panel>
      <PanelHeader
        icon={<Crown className="size-[18px]" />}
        title="Assinantes do clube"
        action={
          members !== null && members.length > 3 ? (
            <SeeAll onClick={() => setShowAll(true)} />
          ) : undefined
        }
      />
      <div className="px-3 pb-3">
        {error && <p className="px-2 py-3 text-xs text-danger">{error}</p>}
        {!error && members === null && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Carregando...</p>
        )}
        {members !== null && members.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Nenhum assinante cadastrado ainda.
          </p>
        )}
        {members !== null && members.length > 0 && (
          <ul className="space-y-0.5">
            {visibleMembers.map(renderMemberRow)}
          </ul>
        )}
      </div>

      {showAll && members && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Assinantes do clube</h3>
              <button
                onClick={() => setShowAll(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="max-h-96 space-y-0.5 overflow-y-auto">
              {members.map(renderMemberRow)}
            </ul>
          </div>
        </div>
      )}
    </Panel>
  )
}
const featuredTabs: { key: FeaturedTab; label: string }[] = [
  { key: 'vip', label: 'VIP' },
  { key: 'frequencia', label: 'Maior frequência' },
  { key: 'ticket', label: 'Maior ticket' },
]

function FeaturedPanel() {
  const [tab, setTab] = useState<FeaturedTab>('vip')
  const [allClients, setAllClients] = useState<SupabaseClient[]>([])
  const [stats, setStats] = useState<Record<string, ClientStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getClients(), getClientStats()])
      .then(([c, s]) => { if (!cancelled) { setAllClients(c as SupabaseClient[]); setStats(s) } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const rows = useMemo(() => {
    if (tab === 'vip') {
      return allClients
        .filter((c) => stats[c.id]?.status === 'vip')
        .map((c) => ({ name: c.name, detail: `${stats[c.id]?.visits ?? 0} visitas` }))
        .slice(0, 3)
    }
    if (tab === 'frequencia') {
      return [...allClients]
        .filter((c) => stats[c.id])
        .sort((a, b) => (stats[b.id]?.visits ?? 0) - (stats[a.id]?.visits ?? 0))
        .slice(0, 3)
        .map((c) => ({ name: c.name, detail: `${stats[c.id]?.visits ?? 0} visitas · ${stats[c.id]?.frequency ?? '-'}` }))
    }
    if (tab === 'ticket') {
      return [...allClients]
        .filter((c) => stats[c.id])
        .sort((a, b) => (stats[b.id]?.avgTicket ?? 0) - (stats[a.id]?.avgTicket ?? 0))
        .slice(0, 3)
        .map((c) => ({ name: c.name, detail: `${stats[c.id]?.visits ?? 0} visitas · R$ ${(stats[c.id]?.avgTicket ?? 0).toFixed(2)}` }))
    }
    return []
  }, [tab, allClients, stats])

  return (
    <Panel>
      <PanelHeader
        icon={<Crown className="size-[18px]" />}
        title="Clientes em destaque"
        action={<SeeAll onClick={() => { window.location.href = '/clientes' }} />}
      />
      <div className="flex gap-1 px-3 pb-1">
        {featuredTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              tab === t.key
                ? 'bg-gold/12 text-gold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul className="space-y-0.5 px-3 pb-3">
        {loading && <li className="px-2 py-3 text-xs text-muted-foreground">Carregando...</li>}
        {!loading && rows.length === 0 && <li className="px-2 py-3 text-xs text-muted-foreground">Nenhum cliente nesta categoria ainda.</li>}
        {!loading && rows.map((c, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={c.name} size="md" ring={tab === 'vip'} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.detail}</p>
            </div>
            <Crown className="size-4 text-gold" />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function RecoverPanel() {
  const [clients, setClients] = useState<RecoverableClient[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    getRecoverableClients()
      .then((data) => {
        if (!cancelled) setClients(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function daysLabel(c: RecoverableClient) {
    return `há ${c.daysSince} dias sem atendimento`
  }

  function renderRow(c: RecoverableClient) {
    return (
      <li
        key={c.id}
        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
      >
        <UserAvatar name={c.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{c.name}</p>
          <p className="truncate text-xs text-danger">{daysLabel(c)}</p>
        </div>
        <WhatsappIconButton
          label={`Recuperar ${c.name} no WhatsApp`}
          phone={c.phone || null}
        />
      </li>
    )
  }

  const visibleClients = clients?.slice(0, 3) || []

  return (
    <Panel>
      <PanelHeader
        icon={<TriangleAlert className="size-[18px]" />}
        title="Clientes para recuperar"
        action={
          clients !== null && clients.length > 3 ? (
            <SeeAll onClick={() => setShowAll(true)} />
          ) : undefined
        }
      />
      <div className="px-3 pb-3">
        {error && <p className="px-2 py-3 text-xs text-danger">{error}</p>}
        {!error && clients === null && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Carregando...</p>
        )}
        {clients !== null && clients.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Nenhum cliente para recuperar no momento.
          </p>
        )}
        {clients !== null && clients.length > 0 && (
          <ul className="space-y-0.5">{visibleClients.map(renderRow)}</ul>
        )}
      </div>

      {showAll && clients && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Clientes para recuperar</h3>
              <button
                onClick={() => setShowAll(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="max-h-96 space-y-0.5 overflow-y-auto">
              {clients.map(renderRow)}
            </ul>
          </div>
        </div>
      )}
    </Panel>
  )
}

function BirthdaysPanel() {
  const [clients, setClients] = useState<{ id: string; name: string; phone: string | null; date: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data, error } = await supabase
          .from('barberpro_clients')
          .select('id, name, phone, birth_date')
          .not('birth_date', 'is', null)
        if (cancelled || error || !data) return
        const today = new Date()
        const todayMD = today.getMonth() * 100 + today.getDate()
        const result: { id: string; name: string; phone: string | null; date: string; diff: number }[] = []
        for (const c of data as any[]) {
          if (!c.birth_date) continue
          const d = new Date(`${c.birth_date}T00:00:00`)
          const md = d.getMonth() * 100 + d.getDate()
          const diff = md >= todayMD ? md - todayMD : 1200 - todayMD + md
          if (diff > 60) continue
          result.push({
            id: c.id,
            name: c.name,
            phone: c.phone || null,
            date: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
            diff,
          })
        }
        result.sort((a, b) => a.diff - b.diff)
        if (!cancelled) setClients(result)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const visible = clients.slice(0, 3)

  function renderRow(b: { id: string; name: string; phone: string | null; date: string }) {
    return (
      <li
        key={b.id}
        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
      >
        <UserAvatar name={b.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{b.name}</p>
          <p className="truncate text-xs text-muted-foreground">{b.date}</p>
        </div>
        <WhatsappIconButton label={`Parabenizar ${b.name} no WhatsApp`} phone={b.phone} />
      </li>
    )
  }

  return (
    <>
      <Panel>
        <PanelHeader
          icon={<Cake className="size-[18px]" />}
          title="Próximos aniversários"
          action={
            clients.length > 3
              ? <SeeAll onClick={() => setShowAll(true)} />
              : <SeeAll onClick={() => { window.location.href = '/clientes' }} />
          }
        />
        <ul className="space-y-0.5 px-3 pb-3">
          {loading && <li className="px-2 py-3 text-xs text-muted-foreground">Carregando...</li>}
          {!loading && clients.length === 0 && <li className="px-2 py-3 text-xs text-muted-foreground">Nenhum aniversário nos próximos 60 dias.</li>}
          {!loading && visible.map(renderRow)}
        </ul>
      </Panel>
      {showAll && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Próximos aniversários</h3>
              <button onClick={() => setShowAll(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <ul className="max-h-96 space-y-0.5 overflow-y-auto">{clients.map(renderRow)}</ul>
          </div>
        </div>
      )}
    </>
  )
}

function InteractionsPanel() {
  const [interactions, setInteractions] = useState<RecentInteraction[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    getRecentInteractions()
      .then((data) => {
        if (!cancelled) setInteractions(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar interações')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function renderRow(c: RecentInteraction) {
    return (
      <li
        key={c.id}
        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
      >
        <UserAvatar name={c.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{c.name}</p>
          <p className="truncate text-xs text-muted-foreground">{c.action}</p>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {c.time}
        </span>
      </li>
    )
  }

  const visibleInteractions = interactions?.slice(0, 3) || []

  return (
    <Panel>
      <PanelHeader
        icon={<Zap className="size-[18px]" />}
        title="Últimas interações"
        action={
          interactions !== null && interactions.length > 3 ? (
            <SeeAll onClick={() => setShowAll(true)} />
          ) : undefined
        }
      />
      <div className="px-3 pb-3">
        {error && <p className="px-2 py-3 text-xs text-danger">{error}</p>}
        {!error && interactions === null && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Carregando...</p>
        )}
        {interactions !== null && interactions.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Nenhuma interação recente.
          </p>
        )}
        {interactions !== null && interactions.length > 0 && (
          <ul className="space-y-0.5">{visibleInteractions.map(renderRow)}</ul>
        )}
      </div>

      {showAll && interactions && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Últimas interações</h3>
              <button
                onClick={() => setShowAll(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="max-h-96 space-y-0.5 overflow-y-auto">
              {interactions.map(renderRow)}
            </ul>
          </div>
        </div>
      )}
    </Panel>
  )
}

export function ClientsView() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
      {/* Main column */}
      <div className="space-y-5">
        <StatCards />
        <ClientsTable />
      </div>

      {/* Insights column */}
      <aside className="space-y-5">
        <ClubMembersPanel />
        <FeaturedPanel />
        <RecoverPanel />
        <BirthdaysPanel />
        <InteractionsPanel />
      </aside>
    </div>
  )
}