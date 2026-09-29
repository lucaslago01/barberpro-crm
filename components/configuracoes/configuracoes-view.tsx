'use client'

import { useEffect, useState } from 'react'
import {
  Settings2,
  Scissors,
  Clock,
  MessageCircle,
  CalendarCog,
  Bell,
  ShieldCheck,
  UserRound,
  Plus,
  CircleSlash,
  X,
  ChevronDown,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader, PanelIcon } from '@/components/dashboard/panel'
import { BlockPeriod } from '@/components/dashboard/block-period'
import { ServicesSettings } from './servicos-settings'
import { SecuritySettings } from './security-settings'
import { GeralSettings } from './geral-settings'
import { MensagensSettings } from './mensagens-settings'
import {
  getNotificationPrefs,
  setNotificationPrefs,
  type NotificationPrefs,
} from '@/lib/notifications'
import { getCachedSettings, getSettings } from '@/lib/supabase-settings'
import { getOpenStatus, getScheduleLabel, type OpenStatus } from '@/lib/business-hours'
import { cn } from '@/lib/utils'

type TabKey =
  | 'geral'
  | 'servicos'
  | 'horario'
  | 'agendamento'
  | 'notificacoes'
  | 'seguranca'
  | 'mensagens'

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'geral', label: 'Geral', icon: Settings2 },
  { key: 'servicos', label: 'Serviços', icon: Scissors },
  { key: 'horario', label: 'Horário', icon: Clock },
  { key: 'agendamento', label: 'Agendamento', icon: CalendarCog },
  { key: 'notificacoes', label: 'Notificações', icon: Bell },
  { key: 'seguranca', label: 'Segurança', icon: ShieldCheck },
  { key: 'mensagens', label: 'Mensagens', icon: MessageCircle },
]

/* ---------- Hero ---------- */

/** Cabeçalho da página: identifica de relance qual barbearia está sendo configurada. */
function formatHour(h: number) {
  return `${h}h`
}

function statusLabel(s: OpenStatus) {
  if (s.open) return `Aberto agora · até ${formatHour(s.closesAt)}`
  if (!s.opensDay) return 'Fechado'
  if (s.today) return `Fechado · abre hoje às ${formatHour(s.opensAt)}`
  return `Fechado · abre ${s.opensDay} às ${formatHour(s.opensAt)}`
}

function SettingsHero() {
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<OpenStatus | null>(null)

  useEffect(() => {
    const cached = getCachedSettings()
    if (cached) {
      setName(cached.barbershopName)
      setLogoUrl(cached.logoUrl)
      setReady(true)
    }
    getSettings()
      .then((s) => {
        setName(s.barbershopName)
        setLogoUrl(s.logoUrl)
      })
      .catch(() => {})
      .finally(() => setReady(true))

    const update = () => setStatus(getOpenStatus(new Date()))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_16px_40px_-24px_rgba(0,0,0,0.7)] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-gold/10 blur-3xl"
      />
      <div className="relative flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-background/50 sm:size-16">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <Store className="size-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/80">
            Configurações
          </p>
          <h1
            className={cn(
              'mt-0.5 truncate font-serif text-xl font-semibold tracking-tight text-foreground transition-opacity duration-300 sm:text-2xl',
              ready ? 'opacity-100' : 'opacity-0',
            )}
          >
            {name || 'Sua barbearia'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie dados, horários, serviços e preferências do sistema.
          </p>
        </div>

        {status && (
          <div className="ml-auto hidden shrink-0 flex-col items-end gap-1.5 text-right sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground">
              <span className="relative flex size-2">
                {status.open && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                )}
                <span
                  className={cn(
                    'relative inline-flex size-2 rounded-full',
                    status.open ? 'bg-success' : 'bg-zinc-500',
                  )}
                />
              </span>
              {statusLabel(status)}
            </span>
            <span className="text-xs text-muted-foreground">{getScheduleLabel()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Reusable primitives ---------- */

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
        checked ? 'bg-gold' : 'bg-white/10',
      )}
    >
      <span
        className={cn(
          'inline-block size-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

const inputClass =
  'h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/40 focus:ring-1 focus:ring-gold/30'

function Select({
  defaultValue,
  options,
}: {
  defaultValue: string
  options: string[]
}) {
  return (
    <div className="relative">
      <select
        defaultValue={defaultValue}
        className={cn(inputClass, 'appearance-none pr-9')}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-card">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

/* ---------- Horário tab ---------- */

type DaySchedule = {
  day: string
  enabled: boolean
  open: string
  close: string
}

const initialSchedule: DaySchedule[] = [
  { day: 'Segunda-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Terça-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Quarta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Quinta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Sexta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Sábado', enabled: true, open: '09:00', close: '17:00' },
  { day: 'Domingo', enabled: false, open: '09:00', close: '17:00' },
]

const hourOptions = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

// Índice (0=Segunda...6=Domingo) do dia de hoje, só para destacar a linha — não afeta os dados.
function todayIndex() {
  const jsDay = new Date().getDay() // 0=Domingo..6=Sábado
  return jsDay === 0 ? 6 : jsDay - 1
}

function WorkingHours() {
  const [schedule, setSchedule] = useState(initialSchedule)
  const [todayIdx] = useState(todayIndex)

  function toggle(index: number, enabled: boolean) {
    setSchedule((prev) =>
      prev.map((d, i) => (i === index ? { ...d, enabled } : d)),
    )
  }

  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<PanelIcon icon={<Clock className="size-[18px]" />} />}
        title="Horário de funcionamento"
      />
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Defina seus horários de atendimento.
      </p>
      <ul className="space-y-2">
        {schedule.map((d, i) => (
          <li
            key={d.day}
            className={cn(
              'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 transition-colors',
              i === todayIdx
                ? 'border-gold/25 bg-gold/[0.04]'
                : 'border-border bg-background/30',
            )}
          >
            <Switch
              checked={d.enabled}
              onChange={(v) => toggle(i, v)}
              label={`Ativar ${d.day}`}
            />
            <span className="flex min-w-[110px] flex-1 items-center gap-2 text-sm font-medium">
              {d.day}
              {i === todayIdx && (
                <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                  Hoje
                </span>
              )}
            </span>
            {d.enabled ? (
              <div className="flex items-center gap-2">
                <div className="w-24">
                  <Select defaultValue={d.open} options={hourOptions} />
                </div>
                <span className="text-sm text-muted-foreground">às</span>
                <div className="w-24">
                  <Select defaultValue={d.close} options={hourOptions} />
                </div>
                <button
                  type="button"
                  className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                  aria-label="Adicionar intervalo"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                Fechado
              </span>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function BlockedDates() {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<PanelIcon icon={<CircleSlash className="size-[18px]" />} className="bg-danger/12 text-danger" />}
        title="Bloquear datas"
      />
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Feche a agenda por vários dias, como férias, feriados ou viagem. O bloqueio vale
        para a agenda do CRM e para o agendamento online.
      </p>
      <BlockPeriod />
    </Panel>
  )
}

/* ---------- Agendamento tab ---------- */

function BookingSettings() {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<PanelIcon icon={<CalendarCog className="size-[18px]" />} />}
        title="Configurações de agendamento"
      />
      <p className="-mt-2 mb-5 text-sm text-muted-foreground">
        Regras aplicadas hoje pelo sistema.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-background/30 px-3 py-2.5">
          <div>
            <span className="text-sm font-medium">Prazo para cancelamento</span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              O cliente só pode cancelar pelo WhatsApp com pelo menos 2 horas de antecedência.
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold">
            2 horas
          </span>
        </div>
      </div>
    </Panel>
  )
}

/* ---------- Serviços tab ---------- */

/* ---------- Notificações tab ---------- */

const notificationItems: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'confirmacao', label: 'Confirmação de agendamento', icon: CalendarCog },
  { key: 'lembrete', label: 'Lembrete de atendimento', icon: Clock },
  { key: 'cancelamento', label: 'Cancelamento de agendamento', icon: X },
  { key: 'aniversarios', label: 'Aniversários de clientes', icon: Bell },
  { key: 'recuperar', label: 'Clientes para recuperar', icon: UserRound },
]

function NotificationSettings() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => getNotificationPrefs())

  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<PanelIcon icon={<Bell className="size-[18px]" />} />}
        title="Preferências de notificações"
      />
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Escolha quais notificações você deseja receber.
      </p>
      <ul className="space-y-2">
        {notificationItems.map((item) => {
          const Icon = item.icon
          const active = prefs[item.key]
          return (
            <li
              key={item.key}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                active ? 'border-gold/25 bg-gold/[0.04]' : 'border-border bg-background/30',
              )}
            >
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg transition-colors',
                  active ? 'bg-gold/15 text-gold' : 'bg-white/5 text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <Switch
                checked={prefs[item.key]}
                onChange={(v) => {
                  const next = { ...prefs, [item.key]: v }
                  setPrefs(next)
                  setNotificationPrefs(next as NotificationPrefs)
                }}
                label={item.label}
              />
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/* ---------- Tab content ---------- */

function TabContent({ tab }: { tab: TabKey }) {
  switch (tab) {
    case 'geral':
      return <GeralSettings />
    case 'servicos':
      return <ServicesSettings />
    case 'horario':
      return (
        <div className="space-y-5">
          <WorkingHours />
          <BlockedDates />
        </div>
      )
    case 'agendamento':
      return <BookingSettings />
    case 'notificacoes':
      return <NotificationSettings />
    case 'seguranca':
      return <SecuritySettings />
    case 'mensagens':
      return <MensagensSettings />
    default:
      return null
  }
}

/* ---------- Page ---------- */

export function ConfiguracoesView() {
  const [activeTab, setActiveTab] = useState<TabKey>('geral')
  return (
    <div className="space-y-5">
      <SettingsHero />

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 scrollbar-thin [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gold text-primary-foreground shadow-[0_8px_24px_-12px_color-mix(in_oklch,var(--gold)_65%,transparent)]'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <TabContent tab={activeTab} />
    </div>
  )
}
