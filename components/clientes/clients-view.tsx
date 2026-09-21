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
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader, SeeAll } from '@/components/dashboard/panel'
import { UserAvatar } from '@/components/dashboard/user-avatar'
import { ClientStatusBadge } from '@/components/dashboard/badges'
import { WhatsappIconButton } from '@/components/dashboard/whatsapp-button'
import {
  clientStats,
  clientStatusFilters,
  clientFeatured,
  clientsToRecover,
  clientBirthdays,
  clientInteractions,
  type Client,
  type ClientStatus,
  type FeaturedTab,
} from '@/lib/data'
import { getClients, createClient, updateClient } from '@/lib/supabase-data'
import { getClientStats, type ClientStats } from '@/lib/supabase-client-stats'
import type { Client as SupabaseClient } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Cake, MessageCircle, Zap } from 'lucide-react'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function mapToRow(c: SupabaseClient, stats?: ClientStats): Client {
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.phone || '-',
    lastVisit: stats?.lastVisit || '-',
    lastVisitAgo: stats?.lastVisitAgo || '-',
    frequency: stats?.frequency || '-',
    visits: stats?.visits || 0,
    avgTicket: stats?.avgTicket || 0,
    status: stats?.status || 'ativo',
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

function FakeSelect({ label }: { label: string }) {
  return (
    <button className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-background/40 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="size-4" />
    </button>
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
}: {
  client: Client
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
        <div className="flex items-center gap-0.5">
          <RowAction label="Ver perfil" icon={Eye} />
          <RowAction label="Editar" icon={Pencil} onClick={onEdit} />
                    <WhatsappIconButton
            label={`Enviar WhatsApp para ${client.name}`}
            phone={client.whatsapp === '-' ? null : client.whatsapp}
          />

          <RowAction label="Mais opções" icon={MoreHorizontal} />
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

  async function handleSave() {
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const created = await createClient({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
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

function ClientsTable() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ClientStatus | 'todos'>('todos')
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
    return clients.filter((c) => {
      const matchesStatus = status === 'todos' || c.status === status
      const matchesSearch =
        q === '' ||
        c.name.toLowerCase().includes(q) ||
        c.whatsapp.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [clients, search, status])

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

        <FakeSelect label="Últimos 3 meses" />
        <FakeSelect label="Mais recentes" />

        <button
          aria-label="Mais filtros"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background/40 text-muted-foreground transition-colors hover:text-foreground"
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

const featuredTabs: { key: FeaturedTab; label: string }[] = [
  { key: 'vip', label: 'VIP' },
  { key: 'frequencia', label: 'Maior frequência' },
  { key: 'ticket', label: 'Maior ticket' },
]

function FeaturedPanel() {
  const [tab, setTab] = useState<FeaturedTab>('vip')
  const rows = clientFeatured[tab]

  return (
    <Panel>
      <PanelHeader
        icon={<Crown className="size-[18px]" />}
        title="Clientes em destaque"
        action={<SeeAll />}
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
        {rows.map((c, i) => (
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
  return (
    <Panel>
      <PanelHeader
        icon={<TriangleAlert className="size-[18px]" />}
        title="Clientes para recuperar"
        action={<SeeAll />}
      />
      <ul className="space-y-0.5 px-3 pb-3">
        {clientsToRecover.map((c, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={c.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-danger">{c.days}</p>
            </div>
            <WhatsappIconButton label={`Recuperar ${c.name} no WhatsApp`} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function BirthdaysPanel() {
  return (
    <Panel>
      <PanelHeader
        icon={<Cake className="size-[18px]" />}
        title="Próximos aniversários"
        action={<SeeAll />}
      />
      <ul className="space-y-0.5 px-3 pb-3">
        {clientBirthdays.map((b) => (
          <li
            key={b.name}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <UserAvatar name={b.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{b.name}</p>
              <p className="truncate text-xs text-muted-foreground">{b.date}</p>
            </div>
            <WhatsappIconButton label={`Parabenizar ${b.name} no WhatsApp`} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function InteractionsPanel() {
  return (
    <Panel>
      <PanelHeader
        icon={<Zap className="size-[18px]" />}
        title="Últimas interações"
        action={<SeeAll />}
      />
      <ul className="space-y-0.5 px-3 pb-3">
        {clientInteractions.map((c, i) => (
          <li
            key={i}
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
        ))}
      </ul>
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
        <FeaturedPanel />
        <RecoverPanel />
        <BirthdaysPanel />
        <InteractionsPanel />
      </aside>
    </div>
  )
}
