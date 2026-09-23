'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  Settings2,
  Scissors,
  Clock,
  MessageCircle,
  CalendarCog,
  Bell,
  ShieldCheck,
  UserRound,
  Store,
  Upload,
  Plus,
  Check,
  X,
  ChevronDown,
  MonitorSmartphone,
  LogOut,
  KeyRound,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import { ServicesSettings } from './servicos-settings'
import { SecuritySettings } from './security-settings'
import { GeralSettings } from './geral-settings'
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

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'geral', label: 'Geral', icon: Settings2 },
  { key: 'servicos', label: 'Serviços', icon: Scissors },
  { key: 'horario', label: 'Horário', icon: Clock },
  { key: 'agendamento', label: 'Agendamento', icon: CalendarCog },
  { key: 'notificacoes', label: 'Notificações', icon: Bell },
  { key: 'seguranca', label: 'Segurança', icon: ShieldCheck },
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

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-4">
      <label className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'h-10 w-full rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/40 focus:ring-1 focus:ring-gold/30'

function TextInput({
  defaultValue,
  placeholder,
}: {
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={inputClass}
    />
  )
}

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

/* ---------- Geral tab ---------- */



function BarbershopInfo() {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<Store className="size-[18px]" />}
        title="Informações da barbearia"
      />
      <p className="-mt-2 mb-5 text-sm text-muted-foreground">
        Dados que aparecem para seus clientes.
      </p>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="grid size-28 place-items-center rounded-2xl border border-border bg-background/40">
            <div className="text-center leading-none">
              <Scissors className="mx-auto mb-1.5 size-5 -rotate-90 text-gold" />
              <p className="font-serif text-sm font-bold tracking-[0.12em]">
                BARBER<span className="text-gold">PRO</span>
              </p>
              <p className="mt-1 text-[7px] font-medium tracking-[0.25em] text-muted-foreground">
                BARBEARIA
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/40 px-3 text-xs font-medium text-foreground transition-colors hover:border-gold/40"
          >
            <Upload className="size-3.5 text-gold" />
            Alterar logo
          </button>
        </div>
        <div className="flex-1 space-y-3.5">
          <Field label="Nome da barbearia">
            <TextInput defaultValue="BarberPro" />
          </Field>
          <Field label="Telefone / WhatsApp">
            <TextInput defaultValue="(41) 99999-9999" />
          </Field>
          <Field label="Endereço">
            <TextInput defaultValue="R. das Flores, 123 - Centro, Curitiba - PR" />
          </Field>
          <Field label="Instagram">
            <TextInput defaultValue="@barberpro" />
          </Field>
          <div className="grid gap-1.5 sm:grid-cols-[140px_1fr] sm:gap-4">
            <label className="text-sm text-muted-foreground sm:pt-2">
              Descrição
            </label>
            <textarea
              defaultValue="Cortes modernos, barba e estilo. Mais que um corte, uma experiência."
              rows={3}
              className={cn(inputClass, 'h-auto resize-none py-2 leading-relaxed')}
            />
          </div>
        </div>
      </div>
    </Panel>
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

/* ---------- WhatsApp tab ---------- */

function WhatsappConnection() {
  return (
    <Panel className="p-5">
      <PanelHeader
        className="px-0 pt-0"
        icon={<MessageCircle className="size-[18px]" />}
        title="Conexão WhatsApp"
      />
      <p className="-mt-2 mb-5 text-sm text-muted-foreground">
        Gerencie a conexão com seu número do WhatsApp.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/10 p-4">
          <span className="relative grid size-10 place-items-center rounded-full bg-success/15">
            <span className="size-2.5 rounded-full bg-success" />
            <span className="absolute size-2.5 animate-ping rounded-full bg-success/60" />
          </span>
          <div>
            <p className="text-sm font-semibold text-success">Conectado</p>
            <p className="text-xs text-muted-foreground">
              Seu WhatsApp está conectado e pronto para uso.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/30 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Número conectado</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums">
              (41) 99999-9999
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 text-sm font-medium text-danger transition-colors hover:bg-danger/20"
          >
            <X className="size-4" />
            Desconectar
          </button>
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

/* ---------- Segurança tab ---------- */

const sessions = [
  { device: 'MacBook Pro · Chrome', location: 'Curitiba, PR', current: true, time: 'Agora' },
  { device: 'iPhone 15 · Safari', location: 'Curitiba, PR', current: false, time: 'há 2 horas' },
  { device: 'Windows · Edge', location: 'São Paulo, SP', current: false, time: 'há 3 dias' },
]


/* ---------- Tab content ---------- */

function TabContent({ tab }: { tab: TabKey }) {
  switch (tab) {
        case 'geral':
      return <GeralSettings />
    case 'servicos':
      return <ServicesSettings />
    case 'horario':
      return <WorkingHours />
    case 'agendamento':
      return <BookingSettings />
    case 'notificacoes':
      return <NotificationSettings />
    case 'seguranca':
      return <SecuritySettings />
    default:
      return null
  }
}

/* ---------- Page ---------- */

export function ConfiguracoesView() {
  const [activeTab, setActiveTab] = useState<TabKey>('geral')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
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

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
        {saved && (
          <span className="mr-auto inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1.5 text-sm font-medium text-success">
            <Check className="size-4" />
            Alterações salvas com sucesso
          </span>
        )}
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-xl border border-border bg-background/40 px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold/90"
        >
          <Check className="size-4" />
          Salvar alterações
        </button>
      </div>
    </div>
  )
}
