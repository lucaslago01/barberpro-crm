export type AppointmentStatus =
  | 'atendido'
  | 'confirmado'
  | 'pendente'
  | 'cancelado'

export type NavItem = {
  label: string
  icon: string
  href: string
  badge?: number
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'LayoutDashboard', href: '/' },
  { label: 'Agenda', icon: 'CalendarDays', href: '/agenda' },
  { label: 'Clientes', icon: 'Users', href: '/clientes' },
  { label: 'Atendimentos', icon: 'Scissors', href: '/atendimentos' },
  { label: 'Financeiro', icon: 'CircleDollarSign', href: '/financeiro' },
  { label: 'Campanhas', icon: 'Megaphone', href: '/campanhas' },
  { label: 'Relatórios', icon: 'LineChart', href: '/relatorios' },
  { label: 'Configurações', icon: 'Settings', href: '/configuracoes' },
]

export type ClientTag = 'vip' | 'ativo' | 'em risco'

export type RecoverStatus = 'perdido' | 'em risco'

export type AgendaStatus =
  | 'agendado'
  | 'confirmado'
  | 'atendimento'
  | 'concluido'
  | 'cancelado'
  | 'faltou'

export const agendaFilters: { key: AgendaStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'agendado', label: 'Agendados' },
  { key: 'confirmado', label: 'Confirmados' },
  { key: 'atendimento', label: 'Em atendimento' },
  { key: 'concluido', label: 'Concluídos' },
  { key: 'cancelado', label: 'Cancelados' },
  { key: 'faltou', label: 'Faltou' },
]

// ----- Clientes page -----

export type ClientStatus = 'ativo' | 'vip' | 'em risco' | 'inativo'

export type Client = {
  id: string
  name: string
  whatsapp: string
  lastVisit: string
  lastVisitAgo: string
  lastVisitTimestamp?: number
  frequency: string
  visits: number
  avgTicket: number
  status: ClientStatus
  isClubMember?: boolean
  clubPlan?: string | null
}

export const clientStatusFilters: { key: ClientStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos os status' },
  { key: 'ativo', label: 'Ativos' },
  { key: 'vip', label: 'VIP' },
  { key: 'em risco', label: 'Em risco' },
  { key: 'inativo', label: 'Inativos' },
]

export type FeaturedTab = 'vip' | 'frequencia' | 'ticket'

export type ServiceStatus =
  | 'concluido'
  | 'em_andamento'
  | 'agendado'
  | 'cancelado'
  | 'nao_compareceu'

export type CampaignStatus = 'ativa' | 'agendada' | 'concluida' | 'rascunho'
