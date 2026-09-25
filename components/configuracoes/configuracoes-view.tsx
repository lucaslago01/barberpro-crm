'use client'

import { useState } from 'react'
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
  Ban,
  X,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
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

function WorkingHours() {
  const [schedule, setSchedule] = useState(initialSchedule)

  function toggle(index: number, enabled: boolean) {
    setSchedule((prev) =>
      prev.map((d, i) => (i === index ? { ...d, enabled } : d)),
    )
  }

  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Clock className="size-[18px]" />}
        title="Horário de funcionamento"
      />
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Defina seus horários de atendimento.
      </p>
      <ul className="space-y-2">
        {schedule.map((d, i) => (
          <li
            key={d.day}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-background/30 px-3 py-2.5"
          >
            <Switch
              checked={d.enabled}
              onChange={(v) => toggle(i, v)}
              label={`Ativar ${d.day}`}
            />
            <span className="min-w-[110px] flex-1 text-sm font-medium">
              {d.day}
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
        icon={<Ban className="size-[18px]" />}
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
        icon={<CalendarCog className="size-[18px]" />}
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
        icon={<Bell className="size-[18px]" />}
        title="Preferências de notificações"
      />
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Escolha quais notificações você deseja receber.
      </p>
      <ul className="space-y-2">
        {notificationItems.map((item) => {
          const Icon = item.icon
          return (
            <li
              key={item.key}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/30 px-4 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 text-muted-foreground">
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
                  ? 'bg-gold text-primary-foreground shadow-[0_8px_24px_-12px_rgba(212,175,55,0.6)]'
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
