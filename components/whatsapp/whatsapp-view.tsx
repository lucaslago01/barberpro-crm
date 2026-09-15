'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  SlidersHorizontal,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Phone,
  Calendar,
  BarChart3,
  DollarSign,
  Tag,
  CalendarPlus,
  UserRound,
  ArrowLeft,
  User,
  MapPin,
  ReceiptText,
  Clock,
  Heart,
  CheckCheck,
  Zap,
  Scissors,
  type LucideIcon,
} from 'lucide-react'
import { Panel } from '@/components/dashboard/panel'
import { UserAvatar } from '@/components/dashboard/user-avatar'
import { AgendaStatusBadge } from '@/components/dashboard/badges'
import {
  conversations,
  whatsappQuickActions,
  type Conversation,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const quickActionIcons: Record<string, LucideIcon> = {
  CalendarPlus,
  MapPin,
  ReceiptText,
  Clock,
  Heart,
}

type Filter = 'todas' | 'nao-lidas' | 'arquivadas'
type MobileView = 'list' | 'chat' | 'profile'
type ProfileTab = 'informacoes' | 'historico' | 'agendamentos'

const filters: { key: Filter; label: string; count?: number }[] = [
  { key: 'todas', label: 'Todas', count: conversations.length },
  {
    key: 'nao-lidas',
    label: 'Não lidas',
    count: conversations.filter((c) => c.unread).length,
  },
  { key: 'arquivadas', label: 'Arquivadas' },
]

export function WhatsappView() {
  const [selectedId, setSelectedId] = useState(conversations[0].id)
  const [filter, setFilter] = useState<Filter>('todas')
  const [search, setSearch] = useState('')
  const [mobileView, setMobileView] = useState<MobileView>('list')

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0],
    [selectedId],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return conversations.filter((c) => {
      if (filter === 'nao-lidas' && !c.unread) return false
      if (filter === 'arquivadas' && !c.archived) return false
      if (q && !c.name.toLowerCase().includes(q) && !c.preview.toLowerCase().includes(q))
        return false
      return true
    })
  }, [filter, search])

  function openConversation(id: string) {
    setSelectedId(id)
    setMobileView('chat')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Mobile view switcher */}
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1 xl:hidden">
        {(
          [
            { key: 'list', label: 'Conversas' },
            { key: 'chat', label: 'Conversa' },
            { key: 'profile', label: 'Cliente' },
          ] as { key: MobileView; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setMobileView(t.key)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              mobileView === t.key
                ? 'bg-gold/12 text-gold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:h-[calc(100vh-16rem)] xl:min-h-[600px] xl:grid-cols-[340px_1fr_340px]">
        <ConversationsColumn
          className={cn(mobileView !== 'list' && 'hidden xl:flex')}
          conversations={visible}
          selectedId={selectedId}
          onSelect={openConversation}
          filter={filter}
          onFilter={setFilter}
          search={search}
          onSearch={setSearch}
        />
        <ChatColumn
          className={cn(mobileView !== 'chat' && 'hidden xl:flex')}
          conversation={selected}
          onBack={() => setMobileView('list')}
          onOpenProfile={() => setMobileView('profile')}
        />
        <ProfileColumn
          className={cn(mobileView !== 'profile' && 'hidden xl:flex')}
          conversation={selected}
          onBack={() => setMobileView('chat')}
        />
      </div>

      <QuickActions />
    </div>
  )
}

function ConversationsColumn({
  className,
  conversations: list,
  selectedId,
  onSelect,
  filter,
  onFilter,
  search,
  onSearch,
}: {
  className?: string
  conversations: Conversation[]
  selectedId: string
  onSelect: (id: string) => void
  filter: Filter
  onFilter: (f: Filter) => void
  search: string
  onSearch: (v: string) => void
}) {
  return (
    <Panel
      className={cn(
        'flex h-[70vh] flex-col overflow-hidden xl:h-auto',
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-[15px] font-semibold tracking-tight">Conversas</h2>
      </div>

      <div className="flex items-center gap-2 px-4 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="h-10 w-full rounded-lg border border-border bg-background/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/40"
          />
        </div>
        <button
          aria-label="Filtrar conversas"
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background/40 text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3 pb-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilter(f.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              filter === f.key
                ? 'text-gold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
            {f.count != null && (
              <span
                className={cn(
                  'grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold',
                  filter === f.key
                    ? 'bg-gold/15 text-gold'
                    : 'bg-white/5 text-muted-foreground',
                )}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 scrollbar-thin">
        {list.map((c) => {
          const active = c.id === selectedId
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors',
                active
                  ? 'bg-gold/10 ring-1 ring-inset ring-gold/25'
                  : 'hover:bg-white/[0.03]',
              )}
            >
              <div className="relative shrink-0">
                <UserAvatar name={c.name} size="lg" ring={active} />
                {c.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-success" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <span
                    className={cn(
                      'shrink-0 text-[11px]',
                      c.unread ? 'font-semibold text-gold' : 'text-muted-foreground',
                    )}
                  >
                    {c.time}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'truncate text-xs',
                      c.unread ? 'text-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {c.preview}
                  </p>
                  {c.unread ? (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gold text-[10px] font-bold text-primary-foreground">
                      {c.unread}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}

        {list.length === 0 && (
          <div className="grid place-items-center gap-2 py-16 text-center">
            <Search className="size-7 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Nenhuma conversa encontrada.
            </p>
          </div>
        )}
      </div>
    </Panel>
  )
}

function ChatColumn({
  className,
  conversation,
  onBack,
  onOpenProfile,
}: {
  className?: string
  conversation: Conversation
  onBack: () => void
  onOpenProfile: () => void
}) {
  return (
    <Panel
      className={cn(
        'flex h-[70vh] flex-col overflow-hidden xl:h-auto',
        className,
      )}
    >
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Voltar para conversas"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground xl:hidden"
        >
          <ArrowLeft className="size-5" />
        </button>
        <UserAvatar name={conversation.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{conversation.name}</p>
            <StatusPill status={conversation.status} />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.phone}
          </p>
        </div>
        <button
          aria-label="Pesquisar na conversa"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <Search className="size-[18px]" />
        </button>
        <button
          onClick={onOpenProfile}
          aria-label="Mais opções"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <MoreVertical className="size-[18px]" />
        </button>
      </div>

      {/* Messages */}
      <div className="relative min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative flex flex-col gap-2 px-4 py-5">
          {conversation.messages.map((m) => (
            <div key={m.id}>
              {m.dayLabel && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {m.dayLabel}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  'flex',
                  m.from === 'me' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[70%]',
                    m.from === 'me'
                      ? 'rounded-br-md bg-gold text-primary-foreground'
                      : 'rounded-bl-md border border-border bg-secondary text-foreground',
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  <div
                    className={cn(
                      'mt-1 flex items-center justify-end gap-1',
                      m.from === 'me'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground',
                    )}
                  >
                    <span className="text-[10px]">{m.time}</span>
                    {m.from === 'me' && (
                      <CheckCheck
                        className={cn(
                          'size-3.5',
                          m.read ? 'text-info' : 'text-primary-foreground/70',
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-border p-3">
        <button
          aria-label="Anexar arquivo"
          className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <Paperclip className="size-5" />
        </button>
        <div className="relative flex-1">
          <input
            placeholder="Digite uma mensagem..."
            className="h-11 w-full rounded-xl border border-border bg-background/40 pl-4 pr-11 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/40"
          />
          <button
            aria-label="Inserir emoji"
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            <Smile className="size-5" />
          </button>
        </div>
        <button
          aria-label="Enviar mensagem"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold text-primary-foreground transition-colors hover:brightness-105"
        >
          <Send className="size-5" />
        </button>
      </div>
    </Panel>
  )
}

function ProfileColumn({
  className,
  conversation,
  onBack,
}: {
  className?: string
  conversation: Conversation
  onBack: () => void
}) {
  const [tab, setTab] = useState<ProfileTab>('informacoes')
  const { profile } = conversation

  return (
    <Panel
      className={cn(
        'flex h-[70vh] flex-col overflow-hidden xl:h-auto',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Voltar para conversa"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground xl:hidden"
        >
          <ArrowLeft className="size-5" />
        </button>
        <UserAvatar name={conversation.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversation.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.phone}
          </p>
        </div>
        <button
          aria-label="Mais opções"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <MoreVertical className="size-[18px]" />
        </button>
      </div>

      <div className="flex items-center justify-center px-4 pt-3">
        <StatusPill status={conversation.status} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-3 py-3">
        {(
          [
            { key: 'informacoes', label: 'Informações' },
            { key: 'historico', label: 'Histórico' },
            { key: 'agendamentos', label: 'Agendamentos' },
          ] as { key: ProfileTab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
              tab === t.key
                ? 'bg-gold/12 text-gold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
        {tab === 'informacoes' && (
          <div className="space-y-1">
            <InfoRow icon={User} label="Nome completo" value={profile.fullName} />
            <InfoRow icon={Phone} label="Telefone" value={profile.phone} />
            <InfoRow
              icon={Calendar}
              label="Último atendimento"
              value={profile.lastVisit}
            />
            <InfoRow
              icon={BarChart3}
              label="Total de atendimentos"
              value={String(profile.totalVisits)}
            />
            <InfoRow
              icon={DollarSign}
              label="Valor total gasto"
              value={currency.format(profile.totalSpent)}
            />

            <div className="flex items-start gap-3 rounded-xl px-2 py-2.5">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-muted-foreground">
                <Tag className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Tags
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {profile.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-gold/30 bg-gold/12 px-2.5 py-0.5 text-[11px] font-medium text-gold"
                    >
                      {t}
                    </span>
                  ))}
                  <button
                    aria-label="Adicionar tag"
                    className="grid size-6 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'historico' && (
          <ul className="space-y-2">
            {conversation.history.map((h, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/12 text-gold">
                  <Scissors className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.service}</p>
                  <p className="text-xs text-muted-foreground">{h.date}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {currency.format(h.price)}
                </span>
              </li>
            ))}
            {conversation.history.length === 0 && <EmptyState label="Sem histórico ainda." />}
          </ul>
        )}

        {tab === 'agendamentos' && (
          <ul className="space-y-2">
            {conversation.appointments.map((a, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-background/40 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{a.service}</p>
                  <AgendaStatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.date} · {a.time}
                </p>
              </li>
            ))}
            {conversation.appointments.length === 0 && (
              <EmptyState label="Nenhum agendamento futuro." />
            )}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 border-t border-border p-3">
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105">
          <CalendarPlus className="size-4" />
          Novo agendamento
        </button>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5">
          <UserRound className="size-4" />
          Ver perfil completo
        </button>
      </div>
    </Panel>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-2 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-muted-foreground">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid place-items-center gap-2 py-12 text-center">
      <Clock className="size-7 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function StatusPill({ status }: { status: Conversation['status'] }) {
  const isVip = status === 'Cliente VIP'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        isVip
          ? 'border-gold/30 bg-gold/12 text-gold'
          : 'border-success/25 bg-success/12 text-success',
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', isVip ? 'bg-gold' : 'bg-success')}
      />
      {status}
    </span>
  )
}

function QuickActions() {
  return (
    <Panel className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 pr-1">
          <span className="grid size-9 place-items-center rounded-xl bg-gold/12 text-gold">
            <Zap className="size-[18px]" />
          </span>
          <h2 className="text-[15px] font-semibold tracking-tight">Ações rápidas</h2>
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          {whatsappQuickActions.map((a) => {
            const Icon = quickActionIcons[a.icon]
            return (
              <button
                key={a.label}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-gold/30 hover:bg-white/5"
              >
                <Icon className="size-4 text-gold" />
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
