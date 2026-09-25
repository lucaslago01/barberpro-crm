'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Send,
  MessageCircle,
  Users,
  Crown,
  CalendarCheck,
  Search,
  ChevronDown,
  Trash2,
  Lightbulb,
  ChevronRight,
  X,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import {
  getCampaigns,
  createCampaign,
  deleteCampaign,
  getCampaignStatsSummary,
  getAudienceCount,
  AUDIENCE_LABELS,
  type Campaign,
  type CampaignAudience,
  type CampaignStatus,
  type CampaignStatsSummary,
} from '@/lib/supabase-campaigns'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  Send,
  MessageCircle,
  Users,
  Crown,
  CalendarCheck,
}

const statusLabels: Record<CampaignStatus, string> = {
  rascunho: 'Rascunho',
  agendada: 'Agendada',
  concluida: 'Concluída',
}

const statusToneMap: Record<CampaignStatus, string> = {
  rascunho: 'bg-white/5 text-muted-foreground',
  agendada: 'bg-info/12 text-info',
  concluida: 'bg-success/12 text-success',
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        statusToneMap[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  )
}

/* ---------- Stat cards ---------- */

function StatCards() {
  const [stats, setStats] = useState<CampaignStatsSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    getCampaignStatsSummary()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const cards = [
    { label: 'Campanhas agendadas', value: stats?.scheduled, icon: Send, tone: 'success' as const },
    { label: 'Mensagens enviadas', value: stats?.sentTotal, icon: MessageCircle, tone: 'info' as const },
    { label: 'Campanhas concluídas', value: stats?.completed, icon: CalendarCheck, tone: 'gold' as const },
    { label: 'Total de campanhas', value: stats?.total, icon: Users, tone: 'gold' as const },
  ]

  const toneMap: Record<string, string> = {
    gold: 'bg-gold/12 text-gold',
    success: 'bg-success/12 text-success',
    info: 'bg-info/12 text-info',
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/25 sm:p-5"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-xl',
                toneMap[stat.tone],
              )}
            >
              <stat.icon className="size-[18px]" />
            </span>
            <p className="min-w-0 text-xs font-medium uppercase leading-tight tracking-wider text-muted-foreground">
              {stat.label}
            </p>
          </div>
          <p className="mt-3 text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
            {stat.value === undefined ? '-' : stat.value.toLocaleString('pt-BR')}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ---------- Row actions ---------- */

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

/* ---------- Campaign row ---------- */

function CampaignRow({ campaign, onDelete }: { campaign: Campaign; onDelete: () => void }) {
  const sendDate = new Date(campaign.sendAt)

  return (
    <tr className="group border-t border-border transition-colors hover:bg-white/[0.02]">
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/12 text-gold">
            <Send className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{campaign.name}</p>
            <p className="truncate text-xs text-muted-foreground">{campaign.message}</p>
          </div>
        </div>
      </td>
      <td className="hidden py-3 pr-4 text-sm text-muted-foreground md:table-cell">
        {AUDIENCE_LABELS[campaign.audience]}
      </td>
      <td className="hidden py-3 pr-4 text-sm text-muted-foreground tabular-nums lg:table-cell">
        <div>{sendDate.toLocaleDateString('pt-BR')}</div>
        <div className="text-xs text-muted-foreground/70">
          {sendDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </td>
      <td className="py-3 pr-4 text-sm font-medium tabular-nums">
        <span className="text-foreground">{campaign.sentCount.toLocaleString('pt-BR')}</span>
        {campaign.failedCount > 0 && (
          <span className="ml-1.5 text-xs font-medium text-danger">
            · {campaign.failedCount} falha{campaign.failedCount > 1 ? 's' : ''}
          </span>
        )}
      </td>
      <td className="py-3 pr-4">
        <StatusBadge status={campaign.status} />
      </td>
      <td className="py-3 pl-2 pr-4">
        <div className="flex items-center gap-0.5">
          <RowAction label="Excluir campanha" icon={Trash2} onClick={onDelete} />
        </div>
      </td>
    </tr>
  )
}


/* ---------- Campanha em card (celular) ---------- */

function CampaignCard({
  campaign,
  onDelete,
}: {
  campaign: Campaign
  onDelete: () => void
}) {
  const sendDate = new Date(campaign.sendAt)
  return (
    <li className="rounded-xl border border-border bg-background/30 p-3.5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/12 text-gold">
          <Send className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{campaign.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{campaign.message}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs">
        <div className="col-span-2">
          <dt className="text-muted-foreground">Público</dt>
          <dd className="mt-0.5 font-medium">{AUDIENCE_LABELS[campaign.audience]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Envio</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {sendDate.toLocaleDateString('pt-BR')} ·{' '}
            {sendDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Enviadas</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {campaign.sentCount.toLocaleString('pt-BR')}
            {campaign.failedCount > 0 && (
              <span className="ml-1 text-danger">
                · {campaign.failedCount} falha{campaign.failedCount > 1 ? 's' : ''}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <button
        onClick={onDelete}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground transition-colors hover:border-danger/40 hover:text-danger"
      >
        <Trash2 className="size-4" />
        Excluir campanha
      </button>
    </li>
  )
}

/* ---------- New campaign modal ---------- */

const audienceOptions: CampaignAudience[] = ['todos', 'clube', 'recuperar', 'vip', 'aniversariantes']

type CampaignPreset = {
  name: string
  message: string
  audience: CampaignAudience
}

function NewCampaignModal({
  onClose,
  onCreated,
  preset,
}: {
  onClose: () => void
  onCreated: () => void
  preset?: CampaignPreset | null
}) {
  const [name, setName] = useState(preset?.name ?? '')
  const [message, setMessage] = useState(preset?.message ?? '')
  const [audience, setAudience] = useState<CampaignAudience>(preset?.audience ?? 'todos')
  const [sendDate, setSendDate] = useState('')
  const [sendTime, setSendTime] = useState('09:00')
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appendOptOut, setAppendOptOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    setAudienceCount(null)
    getAudienceCount(audience)
      .then((count) => {
        if (!cancelled) setAudienceCount(count)
      })
      .catch(() => {
        if (!cancelled) setAudienceCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [audience])

  async function handleSave() {
    if (!name.trim() || !message.trim() || !sendDate) {
      setError('Preencha nome, mensagem e data de envio.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const sendAt = new Date(`${sendDate}T${sendTime}:00`).toISOString()
      await createCampaign({
        name: name.trim(),
        message: message.trim(),
        audience,
        sendAt,
        appendOptOut,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Nova campanha</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nome da campanha</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              placeholder="Ex: Promoção de corte"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40"
              placeholder="Texto que será enviado no WhatsApp"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use <span className="font-mono text-gold">{'{nome}'}</span> para personalizar com o nome do cliente. Ex: <em>Oi, {'{nome}'}! Temos uma oferta pra você.</em>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Público-alvo</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as CampaignAudience)}
              className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
            >
              {audienceOptions.map((a) => (
                <option key={a} value={a} className="bg-card text-foreground">
                  {AUDIENCE_LABELS[a]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {audienceCount === null ? 'Calculando alcance...' : `${audienceCount} cliente(s) nesse público`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data de envio</label>
              <input
                type="date"
                value={sendDate}
                onChange={(e) => setSendDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Horário</label>
              <input
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40"
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <button
          type="button"
          onClick={() => setAppendOptOut((v) => !v)}
          className={`mt-3 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
            appendOptOut
              ? 'border-gold/40 bg-gold/10 text-gold'
              : 'border-border bg-background/30 text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Adicionar aviso de descadastro</span>
          <span className="text-xs font-semibold">{appendOptOut ? 'Ativado' : 'Desativado'}</span>
        </button>
        {appendOptOut && (
          <p className="mt-1 text-xs text-muted-foreground px-1">
            Será adicionado ao final: "Responda PARAR para não receber mais mensagens."
          </p>
        )}

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
            {saving ? 'Salvando...' : 'Agendar campanha'}
          </button>
        </div>
      </div>
    </div>
  )
}


/* ---------- Próxima campanha ---------- */

function daysUntil(dateIso: string) {
  const now = new Date()
  const target = new Date(dateIso)
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((day.getTime() - base.getTime()) / 86_400_000)
}

function whenLabel(dateIso: string) {
  const d = daysUntil(dateIso)
  if (d < 0) return `Atrasada ${Math.abs(d)} dia(s)`
  if (d === 0) return 'Hoje'
  if (d === 1) return 'Amanhã'
  return `Em ${d} dias`
}

function NextCampaign({
  campaigns,
  loading,
  onCreate,
}: {
  campaigns: Campaign[]
  loading: boolean
  onCreate: () => void
}) {
  const next = campaigns
    .filter((c) => c.status === 'agendada')
    .sort((a, b) => new Date(a.sendAt).getTime() - new Date(b.sendAt).getTime())[0]

  const sendDate = next ? new Date(next.sendAt) : null

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 size-64 rounded-full bg-gold/10 blur-3xl"
      />
      <div className="relative p-5 sm:p-6">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Send className="size-3.5 text-gold" />
          Próxima campanha
        </p>

        {loading ? (
          <div className="mt-3 h-16 w-full max-w-md animate-pulse rounded-xl bg-white/5" />
        ) : next && sendDate ? (
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {next.name}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{next.message}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-3.5" />
                  {AUDIENCE_LABELS[next.audience]}
                </span>
                <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground">
                  <CalendarCheck className="size-3.5" />
                  {sendDate.toLocaleDateString('pt-BR')} às{' '}
                  {sendDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <span className="w-fit shrink-0 justify-self-start rounded-full bg-gold/12 px-3 py-1.5 text-sm font-semibold text-gold lg:justify-self-end">
              {whenLabel(next.sendAt)}
            </span>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Nenhuma campanha agendada
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Crie uma campanha para avisar seus clientes sobre promoções e horários livres.
              </p>
            </div>
            <button
              onClick={onCreate}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
            >
              <Plus className="size-4" />
              Criar campanha
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- Campaigns table ---------- */

function CampaignsTable({
  campaigns,
  loading,
  error,
  onNew,
  onDelete,
}: {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  onNew: () => void
  onDelete: (campaign: Campaign) => void
}) {
  const [filter, setFilter] = useState<CampaignStatus | 'todas'>('todas')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const c = { todas: campaigns.length, rascunho: 0, agendada: 0, concluida: 0 }
    campaigns.forEach((camp) => {
      c[camp.status] += 1
    })
    return c
  }, [campaigns])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return campaigns.filter((c) => {
      const matchesStatus = filter === 'todas' || c.status === filter
      const matchesSearch = q === '' || c.name.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [campaigns, filter, search])

  const filters: { key: CampaignStatus | 'todas'; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'rascunho', label: 'Rascunhos' },
    { key: 'agendada', label: 'Agendadas' },
    { key: 'concluida', label: 'Concluídas' },
  ]

  return (
    // min-w-0: item de grade tem min-width auto, e a tabela larga empurrava a coluna, cortando a lateral
    <Panel className="min-w-0">
      <div className="flex flex-col gap-3 px-4 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f.key
                  ? 'bg-gold text-primary-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'text-xs',
                  filter === f.key ? 'text-primary-foreground/70' : 'text-muted-foreground/70',
                )}
              >
                ({counts[f.key]})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Buscar campanhas..."
              className="h-10 w-full rounded-lg border border-border bg-background/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/40 sm:w-44"
            />
          </div>
          <button
            onClick={onNew}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova campanha</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando campanhas...</div>
      )}

      {error && <div className="p-8 text-center text-sm text-danger">Erro: {error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="grid place-items-center gap-2 px-4 py-14 text-center">
          <Send className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {campaigns.length === 0
              ? 'Nenhuma campanha criada ainda.'
              : 'Nenhuma campanha encontrada com esses filtros.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
        <div className="mt-2 hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="py-2.5 pl-4 pr-3 font-medium">Nome da campanha</th>
                <th className="hidden py-2.5 pr-4 font-medium md:table-cell">Público</th>
                <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">Data de envio</th>
                <th className="py-2.5 pr-4 font-medium">Enviadas</th>
                <th className="py-2.5 pr-4 font-medium">Status</th>
                <th className="py-2.5 pl-2 pr-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <CampaignRow key={c.id} campaign={c} onDelete={() => onDelete(c)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Celular: lista de cards */}
        <ul className="space-y-2.5 p-3 md:hidden">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} onDelete={() => onDelete(c)} />
          ))}
        </ul>
        </>
      )}
    </Panel>
  )
}

/* ---------- Suggested campaigns (ideias, sem dado real) ---------- */

const suggestedCampaigns: {
  id: string
  title: string
  icon: string
  tone: 'gold' | 'success' | 'info'
  preset: CampaignPreset
}[] = [
  {
    id: 's1',
    title: 'Recuperar clientes que não voltam há 30 dias',
    icon: 'Users',
    tone: 'gold',
    preset: {
      name: 'Recuperar clientes parados',
      audience: 'recuperar',
      message:
        'Oi, {nome}! Faz um tempo que você não passa aqui na barbearia. Bora marcar um horário? Me chama que eu encaixo você.',
    },
  },
  {
    id: 's2',
    title: 'Parabenizar aniversariantes do mês',
    icon: 'Crown',
    tone: 'gold',
    preset: {
      name: 'Aniversariantes do mês',
      audience: 'aniversariantes',
      message:
        'Parabéns, {nome}! Passa aqui esse mês para comemorar seu aniversário com um corte caprichado.',
    },
  },
  {
    id: 's3',
    title: 'Lembrar clientes do próximo corte',
    icon: 'CalendarCheck',
    tone: 'info',
    preset: {
      name: 'Lembrete de corte',
      audience: 'todos',
      message:
        'Oi, {nome}! Já está na hora de dar um trato no visual. Me chama para marcar o seu horário.',
    },
  },
]

const suggestToneMap: Record<string, string> = {
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
}

function SuggestedCampaigns({ onPick }: { onPick: (preset: CampaignPreset) => void }) {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Lightbulb className="size-[18px]" />}
        title="Campanhas sugeridas"
      />
      <p className="-mt-2 mb-3 text-xs text-muted-foreground">
        Toque para abrir a campanha já preenchida. Dá para ajustar antes de agendar.
      </p>
      <ul className="space-y-2">
        {suggestedCampaigns.map((s) => {
          const Icon = iconMap[s.icon] ?? Users
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onPick(s.preset)}
                className="group flex w-full items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-3 text-left transition-colors hover:border-gold/30 hover:bg-white/[0.03]"
              >
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-lg',
                    suggestToneMap[s.tone],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{s.title}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
              </button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/* ---------- Page ---------- */

export function CampanhasView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [preset, setPreset] = useState<CampaignPreset | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await getCampaigns()
      setCampaigns(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openNew(next?: CampaignPreset) {
    setPreset(next ?? null)
    setShowModal(true)
  }

  async function confirmDelete() {
    if (!pendingDelete || deletingId) return
    const id = pendingDelete.id
    setPendingDelete(null)
    try {
      setDeletingId(id)
      await deleteCampaign(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir campanha')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      {showModal && (
        <NewCampaignModal
          preset={preset}
          onClose={() => {
            setShowModal(false)
            setPreset(null)
          }}
          onCreated={load}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-2 text-base font-semibold">Excluir campanha</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              A campanha sai da lista e não será enviada. Não dá para desfazer.
            </p>
            <div className="mb-5 rounded-lg border border-border bg-background/40 px-3 py-2">
              <p className="truncate text-sm font-medium">{pendingDelete.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {AUDIENCE_LABELS[pendingDelete.audience]}
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setPendingDelete(null)}
                className="h-11 rounded-lg border border-border px-3.5 text-sm text-muted-foreground hover:text-foreground sm:h-auto sm:py-2"
              >
                Voltar
              </button>
              <button
                onClick={confirmDelete}
                className="h-11 rounded-lg bg-danger px-3.5 text-sm font-semibold text-white hover:brightness-105 sm:h-auto sm:py-2"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <NextCampaign campaigns={campaigns} loading={loading} onCreate={() => openNew()} />

      <StatCards />

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <CampaignsTable
          campaigns={campaigns}
          loading={loading}
          error={error}
          onNew={() => openNew()}
          onDelete={(c) => setPendingDelete(c)}
        />
        <aside className="space-y-5">
          <SuggestedCampaigns onPick={(p) => openNew(p)} />
        </aside>
      </div>
    </div>
  )
}