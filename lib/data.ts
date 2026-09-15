export type AppointmentStatus =
  | 'atendido'
  | 'confirmado'
  | 'pendente'
  | 'cancelado'

export type Appointment = {
  id: string
  time: string
  client: string
  service: string
  duration: string
  price: number
  status: AppointmentStatus
  available?: boolean
}

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
  { label: 'Atendimentos', icon: 'Scissors', href: '#' },
  { label: 'WhatsApp', icon: 'MessageCircle', href: '#', badge: 3 },
  { label: 'Financeiro', icon: 'CircleDollarSign', href: '#' },
  { label: 'Campanhas', icon: 'Megaphone', href: '#' },
  { label: 'Relatórios', icon: 'LineChart', href: '#' },
  { label: 'Configurações', icon: 'Settings', href: '#' },
]

export const kpis = [
  {
    label: 'Agendamentos hoje',
    value: '8',
    icon: 'CalendarCheck',
    trend: 14,
    trendUp: true,
  },
  {
    label: 'Faturamento do dia',
    value: 'R$ 560,00',
    icon: 'CircleDollarSign',
    trend: 22,
    trendUp: true,
  },
  {
    label: 'Clientes totais',
    value: '126',
    icon: 'Users',
    trend: 8,
    trendUp: true,
  },
  {
    label: 'Clientes em risco',
    value: '12',
    icon: 'Star',
    trend: 5,
    trendUp: false,
  },
  {
    label: 'Novos clientes',
    value: '18',
    icon: 'UserPlus',
    trend: 28,
    trendUp: true,
  },
]

export const appointments: Appointment[] = [
  {
    id: '1',
    time: '09:00',
    client: 'João Silva',
    service: 'Corte',
    duration: '40 min',
    price: 40,
    status: 'atendido',
  },
  {
    id: '2',
    time: '10:00',
    client: 'Pedro Santos',
    service: 'Corte + Barba',
    duration: '60 min',
    price: 65,
    status: 'confirmado',
  },
  {
    id: '3',
    time: '11:00',
    client: 'Matheus Lima',
    service: 'Corte',
    duration: '40 min',
    price: 40,
    status: 'confirmado',
  },
  {
    id: '4',
    time: '12:00',
    client: '',
    service: '',
    duration: '',
    price: 0,
    status: 'pendente',
    available: true,
  },
  {
    id: '5',
    time: '13:00',
    client: 'Carlos Eduardo',
    service: 'Barba',
    duration: '30 min',
    price: 30,
    status: 'pendente',
  },
  {
    id: '6',
    time: '14:00',
    client: 'Felipe Rocha',
    service: 'Corte + Sobrancelha',
    duration: '60 min',
    price: 70,
    status: 'confirmado',
  },
  {
    id: '7',
    time: '15:00',
    client: 'Bruno Almeida',
    service: 'Corte',
    duration: '40 min',
    price: 40,
    status: 'confirmado',
  },
  {
    id: '8',
    time: '16:00',
    client: 'Ricardo Nunes',
    service: 'Corte + Barba',
    duration: '60 min',
    price: 65,
    status: 'pendente',
  },
]

export const birthdays = [
  { name: 'Lucas Mendes', date: '18 de Setembro' },
  { name: 'Gabriel Souza', date: '22 de Setembro' },
  { name: 'André Lima', date: '27 de Setembro' },
]

export type WhatsappInteraction = {
  name: string
  message: string
  time: string
  unknown?: boolean
}

export const whatsappInteractions: WhatsappInteraction[] = [
  { name: 'João Silva', message: 'Valeu pelo corte, ficou top!', time: '10:24' },
  { name: 'Pedro Santos', message: 'Consegue me encaixar amanhã?', time: '09:18' },
  { name: 'Cliente novo', message: 'Quais são os valores?', time: '08:47', unknown: true },
  { name: 'Matheus Lima', message: 'Vou chegar 10 min atrasado', time: 'Ontem' },
  { name: 'Ricardo Nunes', message: 'Tem horário no sábado?', time: 'Ontem' },
]

export type ClientTag = 'vip' | 'ativo' | 'em risco'

export const featuredClients: {
  name: string
  tag: ClientTag
  lastCut: string
  frequency: string
}[] = [
  { name: 'João Silva', tag: 'vip', lastCut: '25/08/2025', frequency: '20 dias' },
  { name: 'Pedro Santos', tag: 'em risco', lastCut: '05/08/2025', frequency: '25 dias' },
  { name: 'Carlos Eduardo', tag: 'ativo', lastCut: '12/09/2025', frequency: '15 dias' },
  { name: 'Matheus Lima', tag: 'em risco', lastCut: '01/08/2025', frequency: '20 dias' },
]

export type RecoverStatus = 'perdido' | 'em risco'

export const recoverClients: {
  name: string
  days: string
  status: RecoverStatus
}[] = [
  { name: 'Marcos Vinícius', days: '53 dias sem corte', status: 'perdido' },
  { name: 'Rafael Costa', days: '32 dias sem corte', status: 'em risco' },
  { name: 'Leandro Alves', days: '41 dias sem corte', status: 'perdido' },
  { name: 'Diego Gomes', days: '28 dias sem corte', status: 'em risco' },
  { name: 'Rafael Costa', days: '32 dias sem corte', status: 'em risco' },
  { name: 'Diego Martins', days: '28 dias sem corte', status: 'em risco' },
]

export const performanceStats = [
  { label: 'Faturamento', value: 'R$ 8.450,00', trend: 18 },
  { label: 'Atendimentos', value: '142', trend: 12 },
  { label: 'Ticket médio', value: 'R$ 59,50', trend: 6 },
  { label: 'Novos clientes', value: '18', trend: 28 },
]

// bars = faturamento, line = atendimentos (normalized values for the mini chart)
export const monthlyChart = [
  { day: '01', revenue: 2.1, sessions: 2.0 },
  { day: '02', revenue: 2.8, sessions: 2.4 },
  { day: '03', revenue: 3.4, sessions: 3.0 },
  { day: '04', revenue: 2.9, sessions: 2.7 },
  { day: '05', revenue: 3.8, sessions: 3.4 },
  { day: '06', revenue: 4.4, sessions: 3.9 },
  { day: '07', revenue: 4.0, sessions: 4.2 },
  { day: '08', revenue: 4.9, sessions: 4.5 },
  { day: '09', revenue: 5.3, sessions: 4.8 },
  { day: '10', revenue: 4.7, sessions: 5.1 },
  { day: '11', revenue: 5.6, sessions: 5.3 },
  { day: '12', revenue: 6.1, sessions: 5.6 },
  { day: '13', revenue: 5.4, sessions: 5.9 },
  { day: '14', revenue: 6.4, sessions: 6.1 },
  { day: '15', revenue: 6.9, sessions: 6.4 },
  { day: '16', revenue: 6.2, sessions: 6.7 },
  { day: '17', revenue: 7.1, sessions: 6.9 },
  { day: '18', revenue: 7.6, sessions: 7.2 },
  { day: '19', revenue: 7.0, sessions: 7.5 },
  { day: '20', revenue: 7.9, sessions: 7.7 },
  { day: '21', revenue: 8.3, sessions: 8.0 },
  { day: '22', revenue: 7.6, sessions: 8.2 },
  { day: '23', revenue: 8.5, sessions: 8.4 },
  { day: '24', revenue: 7.9, sessions: 8.1 },
  { day: '25', revenue: 8.9, sessions: 8.6 },
  { day: '26', revenue: 8.2, sessions: 8.9 },
  { day: '27', revenue: 9.4, sessions: 9.1 },
  { day: '28', revenue: 8.7, sessions: 9.3 },
  { day: '29', revenue: 9.1, sessions: 9.0 },
  { day: '30', revenue: 8.45, sessions: 8.8 },
]

// ----- Agenda page -----

export type AgendaStatus =
  | 'agendado'
  | 'confirmado'
  | 'atendimento'
  | 'concluido'
  | 'cancelado'
  | 'faltou'

export type AgendaSlot = {
  id: string
  time: string
  client: string
  service: string
  duration: string
  price: number
  status: AgendaStatus
  available?: boolean
}

export const agendaAppointments: AgendaSlot[] = [
  {
    id: 'a1',
    time: '09:00',
    client: 'João Silva',
    service: 'Corte',
    duration: '40 min',
    price: 40,
    status: 'concluido',
  },
  {
    id: 'a2',
    time: '09:40',
    client: '',
    service: '',
    duration: '',
    price: 0,
    status: 'agendado',
    available: true,
  },
  {
    id: 'a3',
    time: '10:00',
    client: 'Pedro Santos',
    service: 'Corte + Barba',
    duration: '60 min',
    price: 65,
    status: 'concluido',
  },
  {
    id: 'a4',
    time: '11:00',
    client: 'Carlos Oliveira',
    service: 'Barba',
    duration: '30 min',
    price: 30,
    status: 'atendimento',
  },
  {
    id: 'a5',
    time: '11:30',
    client: '',
    service: '',
    duration: '',
    price: 0,
    status: 'agendado',
    available: true,
  },
  {
    id: 'a6',
    time: '12:00',
    client: 'Matheus Lima',
    service: 'Corte',
    duration: '40 min',
    price: 40,
    status: 'confirmado',
  },
  {
    id: 'a7',
    time: '13:00',
    client: '',
    service: '',
    duration: '',
    price: 0,
    status: 'agendado',
    available: true,
  },
  {
    id: 'a8',
    time: '13:30',
    client: 'Felipe Rocha',
    service: 'Corte + Sobrancelha',
    duration: '60 min',
    price: 70,
    status: 'confirmado',
  },
  {
    id: 'a9',
    time: '14:30',
    client: 'Bruno Almeida',
    service: 'Corte',
    duration: '40 min',
    price: 40,
    status: 'agendado',
  },
  {
    id: 'a10',
    time: '15:10',
    client: '',
    service: '',
    duration: '',
    price: 0,
    status: 'agendado',
    available: true,
  },
  {
    id: 'a11',
    time: '15:30',
    client: 'Rafael Costa',
    service: 'Corte + Barba',
    duration: '60 min',
    price: 65,
    status: 'cancelado',
  },
  {
    id: 'a12',
    time: '16:30',
    client: 'André Lima',
    service: 'Barba',
    duration: '30 min',
    price: 30,
    status: 'faltou',
  },
  {
    id: 'a13',
    time: '17:00',
    client: 'Ricardo Nunes',
    service: 'Corte',
    duration: '40 min',
    price: 40,
    status: 'agendado',
  },
]

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
  frequency: string
  visits: number
  avgTicket: number
  status: ClientStatus
}

export const clientStats: {
  label: string
  value: string
  icon: string
  trend: number
  trendUp: boolean
  tone: 'gold' | 'success' | 'danger' | 'muted'
}[] = [
  {
    label: 'Total de clientes',
    value: '126',
    icon: 'Users',
    trend: 12,
    trendUp: true,
    tone: 'gold',
  },
  {
    label: 'Clientes VIP',
    value: '18',
    icon: 'Crown',
    trend: 28,
    trendUp: true,
    tone: 'success',
  },
  {
    label: 'Clientes em risco',
    value: '12',
    icon: 'TriangleAlert',
    trend: 5,
    trendUp: false,
    tone: 'danger',
  },
  {
    label: 'Clientes inativos',
    value: '8',
    icon: 'Clock',
    trend: 18,
    trendUp: false,
    tone: 'muted',
  },
]

export const clientsList: Client[] = [
  {
    id: 'c1',
    name: 'João Silva',
    whatsapp: '(41) 99123-4567',
    lastVisit: '12/09/2025',
    lastVisitAgo: 'há 3 dias',
    frequency: 'A cada 18 dias',
    visits: 12,
    avgTicket: 65,
    status: 'ativo',
  },
  {
    id: 'c2',
    name: 'Marcos Costa',
    whatsapp: '(41) 98876-5432',
    lastVisit: '10/09/2025',
    lastVisitAgo: 'há 5 dias',
    frequency: 'A cada 15 dias',
    visits: 28,
    avgTicket: 72,
    status: 'vip',
  },
  {
    id: 'c3',
    name: 'Pedro Ferreira',
    whatsapp: '(41) 99765-4321',
    lastVisit: '02/09/2025',
    lastVisitAgo: 'há 13 dias',
    frequency: 'A cada 21 dias',
    visits: 8,
    avgTicket: 55,
    status: 'ativo',
  },
  {
    id: 'c4',
    name: 'Rafael Almeida',
    whatsapp: '(41) 99654-3210',
    lastVisit: '25/08/2025',
    lastVisitAgo: 'há 21 dias',
    frequency: 'A cada 30 dias',
    visits: 6,
    avgTicket: 48,
    status: 'em risco',
  },
  {
    id: 'c5',
    name: 'Gabriel Vieira',
    whatsapp: '(41) 99543-2109',
    lastVisit: '01/07/2025',
    lastVisitAgo: 'há 76 dias',
    frequency: 'A cada 45 dias',
    visits: 4,
    avgTicket: 52,
    status: 'inativo',
  },
  {
    id: 'c6',
    name: 'Lucas Carvalho',
    whatsapp: '(41) 99432-1098',
    lastVisit: '14/09/2025',
    lastVisitAgo: 'há 1 dia',
    frequency: 'A cada 20 dias',
    visits: 16,
    avgTicket: 68,
    status: 'ativo',
  },
  {
    id: 'c7',
    name: 'Felipe Martins',
    whatsapp: '(41) 99321-0987',
    lastVisit: '05/09/2025',
    lastVisitAgo: 'há 10 dias',
    frequency: 'A cada 17 dias',
    visits: 20,
    avgTicket: 70,
    status: 'vip',
  },
  {
    id: 'c8',
    name: 'Bruno Rocha',
    whatsapp: '(41) 99210-9876',
    lastVisit: '20/08/2025',
    lastVisitAgo: 'há 26 dias',
    frequency: 'A cada 28 dias',
    visits: 7,
    avgTicket: 60,
    status: 'em risco',
  },
  {
    id: 'c9',
    name: 'Carlos Mendes',
    whatsapp: '(41) 99109-8765',
    lastVisit: '18/06/2025',
    lastVisitAgo: 'há 89 dias',
    frequency: 'A cada 50 dias',
    visits: 3,
    avgTicket: 45,
    status: 'inativo',
  },
  {
    id: 'c10',
    name: 'Daniel Nunes',
    whatsapp: '(41) 99098-7654',
    lastVisit: '09/09/2025',
    lastVisitAgo: 'há 6 dias',
    frequency: 'A cada 16 dias',
    visits: 14,
    avgTicket: 66,
    status: 'ativo',
  },
]

export const clientStatusFilters: { key: ClientStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos os status' },
  { key: 'ativo', label: 'Ativos' },
  { key: 'vip', label: 'VIP' },
  { key: 'em risco', label: 'Em risco' },
  { key: 'inativo', label: 'Inativos' },
]

export type FeaturedTab = 'vip' | 'frequencia' | 'ticket'

export const clientFeatured: Record<
  FeaturedTab,
  { name: string; detail: string }[]
> = {
  vip: [
    { name: 'Marcos Costa', detail: '28 visitas · R$ 72,00' },
    { name: 'Felipe Martins', detail: '20 visitas · R$ 70,00' },
    { name: 'Lucas Carvalho', detail: '16 visitas · R$ 68,00' },
  ],
  frequencia: [
    { name: 'Daniel Nunes', detail: 'A cada 16 dias' },
    { name: 'Marcos Costa', detail: 'A cada 15 dias' },
    { name: 'Felipe Martins', detail: 'A cada 17 dias' },
  ],
  ticket: [
    { name: 'Marcos Costa', detail: 'R$ 72,00 de ticket' },
    { name: 'Felipe Martins', detail: 'R$ 70,00 de ticket' },
    { name: 'Lucas Carvalho', detail: 'R$ 68,00 de ticket' },
  ],
}

export const clientsToRecover: { name: string; days: string }[] = [
  { name: 'Gabriel Vieira', days: 'há 76 dias sem atendimento' },
  { name: 'Carlos Mendes', days: 'há 89 dias sem atendimento' },
  { name: 'Thiago Souza', days: 'há 102 dias sem atendimento' },
]

export const clientBirthdays: { name: string; date: string }[] = [
  { name: 'Rafael Almeida', date: '18 de Setembro' },
  { name: 'Bruno Rocha', date: '25 de Setembro' },
  { name: 'Matheus Lima', date: '03 de Outubro' },
]

export const clientInteractions: {
  name: string
  action: string
  time: string
}[] = [
  { name: 'João Silva', action: 'Mensagem enviada', time: 'há 2 horas' },
  { name: 'Pedro Ferreira', action: 'Agendamento realizado', time: 'há 5 horas' },
  { name: 'Marcos Costa', action: 'Confirmou o horário', time: 'há 1 dia' },
]
