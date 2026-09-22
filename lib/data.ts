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
  { label: 'Atendimentos', icon: 'Scissors', href: '/atendimentos' },
  { label: 'WhatsApp', icon: 'MessageCircle', href: '/whatsapp', badge: 3 },
  { label: 'Financeiro', icon: 'CircleDollarSign', href: '/financeiro' },
  { label: 'Campanhas', icon: 'Megaphone', href: '/campanhas' },
  { label: 'Relatórios', icon: 'LineChart', href: '/relatorios' },
  { label: 'Configurações', icon: 'Settings', href: '/configuracoes' },
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
    notes?: string
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
  lastVisitTimestamp?: number
  frequency: string
  visits: number
  avgTicket: number
  status: ClientStatus
  isClubMember?: boolean
  clubPlan?: string | null
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

// ----- Atendimentos page -----

export type ServiceStatus =
  | 'concluido'
  | 'em_andamento'
  | 'agendado'
  | 'cancelado'
  | 'nao_compareceu'

export type ServiceRecord = {
  id: string
  client: string
  whatsapp: string
  service: string
  date: string
  time: string
  duration: string
  price: number
  status: ServiceStatus
  barber: string
  rating: number | null
}

export const serviceStats: {
  label: string
  value: string
  icon: string
  trend: number
  trendUp: boolean
  tone: 'gold' | 'success' | 'info' | 'muted'
}[] = [
  {
    label: 'Atendimentos realizados',
    value: '48',
    icon: 'CalendarCheck',
    trend: 12,
    trendUp: true,
    tone: 'gold',
  },
  {
    label: 'Faturamento no período',
    value: 'R$ 2.480,00',
    icon: 'CircleDollarSign',
    trend: 18,
    trendUp: true,
    tone: 'success',
  },
  {
    label: 'Clientes atendidos',
    value: '42',
    icon: 'Users',
    trend: 9,
    trendUp: true,
    tone: 'info',
  },
  {
    label: 'Avaliação média',
    value: '4,9',
    icon: 'Star',
    trend: 3,
    trendUp: true,
    tone: 'gold',
  },
]

export const serviceStatusFilters: {
  key: ServiceStatus | 'todos'
  label: string
  count: number
}[] = [
  { key: 'todos', label: 'Todos', count: 48 },
  { key: 'concluido', label: 'Concluídos', count: 42 },
  { key: 'em_andamento', label: 'Em andamento', count: 3 },
  { key: 'cancelado', label: 'Cancelados', count: 2 },
  { key: 'nao_compareceu', label: 'Não compareceu', count: 1 },
]

export const servicesList: ServiceRecord[] = [
  {
    id: 's1',
    client: 'João Silva',
    whatsapp: '(41) 99123-4567',
    service: 'Corte',
    date: '15/09/2025',
    time: '09:00',
    duration: '40 min',
    price: 40,
    status: 'concluido',
    barber: 'Lucas',
    rating: 5.0,
  },
  {
    id: 's2',
    client: 'Marcos Costa',
    whatsapp: '(41) 98876-5432',
    service: 'Corte + Barba',
    date: '15/09/2025',
    time: '10:00',
    duration: '60 min',
    price: 72,
    status: 'concluido',
    barber: 'Lucas',
    rating: 5.0,
  },
  {
    id: 's3',
    client: 'Pedro Ferreira',
    whatsapp: '(41) 99765-4321',
    service: 'Sobrancelha',
    date: '15/09/2025',
    time: '11:20',
    duration: '20 min',
    price: 25,
    status: 'concluido',
    barber: 'Lucas',
    rating: 4.8,
  },
  {
    id: 's4',
    client: 'Rafael Almeida',
    whatsapp: '(41) 99654-3210',
    service: 'Corte',
    date: '15/09/2025',
    time: '13:00',
    duration: '40 min',
    price: 40,
    status: 'em_andamento',
    barber: 'Lucas',
    rating: null,
  },
  {
    id: 's5',
    client: 'Gabriel Vieira',
    whatsapp: '(41) 99543-2109',
    service: 'Corte + Barba',
    date: '15/09/2025',
    time: '14:30',
    duration: '60 min',
    price: 72,
    status: 'agendado',
    barber: 'Lucas',
    rating: null,
  },
  {
    id: 's6',
    client: 'Lucas Carvalho',
    whatsapp: '(41) 99432-1098',
    service: 'Corte',
    date: '15/09/2025',
    time: '16:00',
    duration: '40 min',
    price: 40,
    status: 'concluido',
    barber: 'Lucas',
    rating: 5.0,
  },
  {
    id: 's7',
    client: 'Felipe Martins',
    whatsapp: '(41) 99321-0987',
    service: 'Barba',
    date: '14/09/2025',
    time: '18:20',
    duration: '30 min',
    price: 35,
    status: 'concluido',
    barber: 'Lucas',
    rating: 4.9,
  },
  {
    id: 's8',
    client: 'Bruno Rocha',
    whatsapp: '(41) 99210-9876',
    service: 'Corte + Barba',
    date: '14/09/2025',
    time: '17:00',
    duration: '60 min',
    price: 72,
    status: 'cancelado',
    barber: 'Lucas',
    rating: null,
  },
  {
    id: 's9',
    client: 'Carlos Mendes',
    whatsapp: '(41) 99109-8765',
    service: 'Corte',
    date: '14/09/2025',
    time: '15:40',
    duration: '40 min',
    price: 40,
    status: 'nao_compareceu',
    barber: 'Lucas',
    rating: null,
  },
  {
    id: 's10',
    client: 'Daniel Nunes',
    whatsapp: '(41) 99098-7654',
    service: 'Corte + Sobrancelha',
    date: '14/09/2025',
    time: '14:00',
    duration: '70 min',
    price: 85,
    status: 'concluido',
    barber: 'Lucas',
    rating: 5.0,
  },
]

export const topServices: { name: string; count: number; percent: number }[] = [
  { name: 'Corte', count: 28, percent: 58 },
  { name: 'Corte + Barba', count: 12, percent: 25 },
  { name: 'Barba', count: 5, percent: 10 },
  { name: 'Sobrancelha', count: 3, percent: 6 },
  { name: 'Outros', count: 0, percent: 0 },
]

export const revenueByService: { name: string; value: number }[] = [
  { name: 'Corte', value: 1120 },
  { name: 'Corte + Barba', value: 864 },
  { name: 'Barba', value: 175 },
  { name: 'Sobrancelha', value: 75 },
  { name: 'Outros', value: 0 },
]

export const latestServices: {
  name: string
  service: string
  price: number
  time: string
  status: ServiceStatus
}[] = [
  { name: 'João Silva', service: 'Corte', price: 40, time: 'há 2 horas', status: 'concluido' },
  { name: 'Marcos Costa', service: 'Corte + Barba', price: 72, time: 'há 3 horas', status: 'concluido' },
  { name: 'Pedro Ferreira', service: 'Sobrancelha', price: 25, time: 'há 4 horas', status: 'concluido' },
  { name: 'Rafael Almeida', service: 'Corte', price: 40, time: 'há 5 horas', status: 'cancelado' },
  { name: 'Gabriel Vieira', service: 'Corte + Barba', price: 72, time: 'há 6 horas', status: 'agendado' },
]

export const recentReviews: {
  name: string
  rating: number
  comment: string
  time: string
}[] = [
  { name: 'João Silva', rating: 5, comment: 'Sempre um ótimo atendimento!', time: 'há 2 horas' },
  { name: 'Marcos Costa', rating: 5, comment: 'Melhor barbearia da região!', time: 'há 3 horas' },
  { name: 'Pedro Ferreira', rating: 5, comment: 'Serviço impecável.', time: 'há 4 horas' },
]

// ----- WhatsApp page -----

export type ChatMessage = {
  id: string
  text: string
  time: string
  from: 'client' | 'me'
  read?: boolean
  dayLabel?: string
}

export type ChatProfile = {
  fullName: string
  phone: string
  lastVisit: string
  totalVisits: number
  totalSpent: number
  tags: string[]
}

export type ChatHistoryItem = {
  service: string
  date: string
  price: number
}

export type ChatAppointmentItem = {
  service: string
  date: string
  time: string
  status: AgendaStatus
}

export type Conversation = {
  id: string
  name: string
  phone: string
  preview: string
  time: string
  unread?: number
  archived?: boolean
  online?: boolean
  status: 'Cliente ativo' | 'Cliente VIP' | 'Novo contato'
  messages: ChatMessage[]
  profile: ChatProfile
  history: ChatHistoryItem[]
  appointments: ChatAppointmentItem[]
}

export const conversations: Conversation[] = [
  {
    id: 'w1',
    name: 'João Silva',
    phone: '+55 41 98765-4321',
    preview: 'Opa, qual o valor do corte hoje?',
    time: '10:24',
    unread: 2,
    online: true,
    status: 'Cliente ativo',
    messages: [
      { id: 'm1', from: 'client', text: 'Fala, tudo bem?', time: '10:20', dayLabel: 'Hoje' },
      { id: 'm2', from: 'client', text: 'Opa, qual o valor do corte hoje?', time: '10:24' },
      {
        id: 'm3',
        from: 'me',
        text: 'Fala, João! Tudo bem? O corte está R$ 40,00.',
        time: '10:25',
        read: true,
      },
      {
        id: 'm4',
        from: 'me',
        text: 'Quer que eu verifique os horários disponíveis para você hoje?',
        time: '10:25',
        read: true,
      },
    ],
    profile: {
      fullName: 'João Silva',
      phone: '+55 41 98765-4321',
      lastVisit: '12/08/2026',
      totalVisits: 8,
      totalSpent: 320,
      tags: ['Frequente', 'Barba'],
    },
    history: [
      { service: 'Corte + Barba', date: '12/08/2026', price: 65 },
      { service: 'Corte', date: '25/07/2026', price: 40 },
      { service: 'Corte', date: '08/07/2026', price: 40 },
    ],
    appointments: [
      { service: 'Corte', date: '18/09/2026', time: '15:00', status: 'agendado' },
    ],
  },
  {
    id: 'w2',
    name: 'Matheus Lima',
    phone: '+55 41 99876-1234',
    preview: 'Quero agendar para amanhã',
    time: '09:56',
    unread: 1,
    online: true,
    status: 'Cliente ativo',
    messages: [
      { id: 'm1', from: 'client', text: 'Bom dia!', time: '09:54', dayLabel: 'Hoje' },
      { id: 'm2', from: 'client', text: 'Quero agendar para amanhã', time: '09:56' },
    ],
    profile: {
      fullName: 'Matheus Lima',
      phone: '+55 41 99876-1234',
      lastVisit: '30/07/2026',
      totalVisits: 5,
      totalSpent: 200,
      tags: ['Corte'],
    },
    history: [
      { service: 'Corte', date: '30/07/2026', price: 40 },
      { service: 'Corte', date: '10/07/2026', price: 40 },
    ],
    appointments: [],
  },
  {
    id: 'w3',
    name: 'Carlos Eduardo',
    phone: '+55 41 99654-7788',
    preview: 'Valeu! Até lá 👍',
    time: 'Ontem',
    status: 'Cliente ativo',
    messages: [
      { id: 'm1', from: 'me', text: 'Confirmado para quinta às 16h!', time: '17:40', dayLabel: 'Ontem', read: true },
      { id: 'm2', from: 'client', text: 'Valeu! Até lá 👍', time: '17:42' },
    ],
    profile: {
      fullName: 'Carlos Eduardo',
      phone: '+55 41 99654-7788',
      lastVisit: '02/08/2026',
      totalVisits: 11,
      totalSpent: 495,
      tags: ['Frequente'],
    },
    history: [
      { service: 'Corte + Barba', date: '02/08/2026', price: 65 },
      { service: 'Corte', date: '18/07/2026', price: 40 },
    ],
    appointments: [
      { service: 'Corte + Barba', date: '19/09/2026', time: '16:00', status: 'confirmado' },
    ],
  },
  {
    id: 'w4',
    name: 'Rafael Souza',
    phone: '+55 41 99321-5566',
    preview: 'Tem horário para as 18h?',
    time: 'Ontem',
    status: 'Cliente ativo',
    messages: [
      { id: 'm1', from: 'client', text: 'Boa tarde!', time: '14:10', dayLabel: 'Ontem' },
      { id: 'm2', from: 'client', text: 'Tem horário para as 18h?', time: '14:11' },
    ],
    profile: {
      fullName: 'Rafael Souza',
      phone: '+55 41 99321-5566',
      lastVisit: '20/07/2026',
      totalVisits: 4,
      totalSpent: 160,
      tags: ['Corte'],
    },
    history: [{ service: 'Corte', date: '20/07/2026', price: 40 }],
    appointments: [],
  },
  {
    id: 'w5',
    name: 'Pedro Henrique',
    phone: '+55 41 99112-9090',
    preview: 'Gostei do corte, parabéns!',
    time: 'Seg',
    status: 'Cliente VIP',
    messages: [
      { id: 'm1', from: 'client', text: 'Gostei do corte, parabéns!', time: '11:20', dayLabel: 'Segunda' },
      { id: 'm2', from: 'me', text: 'Obrigado, Pedro! Volte sempre.', time: '11:25', read: true },
    ],
    profile: {
      fullName: 'Pedro Henrique',
      phone: '+55 41 99112-9090',
      lastVisit: '13/09/2026',
      totalVisits: 22,
      totalSpent: 1210,
      tags: ['VIP', 'Barba'],
    },
    history: [
      { service: 'Corte + Barba', date: '13/09/2026', price: 65 },
      { service: 'Corte + Barba', date: '28/08/2026', price: 65 },
    ],
    appointments: [],
  },
  {
    id: 'w6',
    name: 'Lucas Martins',
    phone: '+55 41 99788-2211',
    preview: 'Pode ser esse mesmo horário',
    time: 'Seg',
    status: 'Cliente ativo',
    messages: [
      { id: 'm1', from: 'me', text: 'Consigo te encaixar sábado às 10h.', time: '09:00', dayLabel: 'Segunda', read: true },
      { id: 'm2', from: 'client', text: 'Pode ser esse mesmo horário', time: '09:05' },
    ],
    profile: {
      fullName: 'Lucas Martins',
      phone: '+55 41 99788-2211',
      lastVisit: '05/08/2026',
      totalVisits: 6,
      totalSpent: 260,
      tags: ['Corte'],
    },
    history: [{ service: 'Corte', date: '05/08/2026', price: 40 }],
    appointments: [
      { service: 'Corte', date: '20/09/2026', time: '10:00', status: 'agendado' },
    ],
  },
  {
    id: 'w7',
    name: 'Gabriel Almeida',
    phone: '+55 41 99500-3322',
    preview: 'Manda o pix por favor',
    time: 'Seg',
    status: 'Cliente ativo',
    messages: [
      { id: 'm1', from: 'client', text: 'Manda o pix por favor', time: '16:30', dayLabel: 'Segunda' },
    ],
    profile: {
      fullName: 'Gabriel Almeida',
      phone: '+55 41 99500-3322',
      lastVisit: '01/08/2026',
      totalVisits: 9,
      totalSpent: 405,
      tags: ['Frequente'],
    },
    history: [{ service: 'Corte + Barba', date: '01/08/2026', price: 65 }],
    appointments: [],
  },
  {
    id: 'w8',
    name: 'Thiago Costa',
    phone: '+55 41 99277-4455',
    preview: 'Blz, obrigado!',
    time: 'Dom',
    status: 'Cliente ativo',
    messages: [
      { id: 'm1', from: 'me', text: 'Seu horário está confirmado!', time: '19:10', dayLabel: 'Domingo', read: true },
      { id: 'm2', from: 'client', text: 'Blz, obrigado!', time: '19:12' },
    ],
    profile: {
      fullName: 'Thiago Costa',
      phone: '+55 41 99277-4455',
      lastVisit: '28/07/2026',
      totalVisits: 7,
      totalSpent: 300,
      tags: ['Corte'],
    },
    history: [{ service: 'Corte', date: '28/07/2026', price: 40 }],
    appointments: [],
  },
]

export const whatsappQuickActions: { label: string; icon: string }[] = [
  { label: 'Agendar horário', icon: 'CalendarPlus' },
  { label: 'Enviar localização', icon: 'MapPin' },
  { label: 'Tabela de preços', icon: 'ReceiptText' },
  { label: 'Horários disponíveis', icon: 'Clock' },
  { label: 'Agradecimento', icon: 'Heart' },
]

// ----- Financeiro page -----

export const financePeriod = '01/08/2026 - 31/08/2026'

export const financeStats: {
  label: string
  value: string
  icon: string
  trend: number
  tone: 'success' | 'danger' | 'gold' | 'info'
  trendTone: 'success' | 'danger'
}[] = [
  {
    label: 'Receita total',
    value: 'R$ 3.240,00',
    icon: 'TrendingUp',
    trend: 12,
    tone: 'success',
    trendTone: 'success',
  },
  {
    label: 'Despesas totais',
    value: 'R$ 620,00',
    icon: 'TrendingDown',
    trend: 8,
    tone: 'danger',
    trendTone: 'danger',
  },
  {
    label: 'Lucro líquido',
    value: 'R$ 2.620,00',
    icon: 'CircleDollarSign',
    trend: 15,
    tone: 'gold',
    trendTone: 'success',
  },
  {
    label: 'Total de atendimentos',
    value: '81',
    icon: 'CalendarCheck',
    trend: 10,
    tone: 'info',
    trendTone: 'success',
  },
]

// Daily revenue (gold) vs expense (gray) for the bar chart — values in R$
export const financeDaily: { day: string; revenue: number; expense: number }[] = [
  { day: '01', revenue: 480, expense: 180 },
  { day: '02', revenue: 390, expense: 120 },
  { day: '03', revenue: 560, expense: 220 },
  { day: '04', revenue: 300, expense: 90 },
  { day: '05', revenue: 580, expense: 240 },
  { day: '06', revenue: 470, expense: 160 },
  { day: '07', revenue: 540, expense: 140 },
  { day: '08', revenue: 600, expense: 300 },
  { day: '09', revenue: 520, expense: 120 },
  { day: '10', revenue: 470, expense: 110 },
  { day: '11', revenue: 560, expense: 160 },
  { day: '12', revenue: 610, expense: 210 },
  { day: '13', revenue: 420, expense: 120 },
  { day: '14', revenue: 600, expense: 200 },
  { day: '15', revenue: 520, expense: 140 },
  { day: '16', revenue: 470, expense: 110 },
  { day: '17', revenue: 610, expense: 210 },
  { day: '18', revenue: 540, expense: 140 },
  { day: '19', revenue: 470, expense: 110 },
  { day: '20', revenue: 560, expense: 160 },
  { day: '21', revenue: 660, expense: 260 },
  { day: '22', revenue: 470, expense: 110 },
  { day: '23', revenue: 690, expense: 190 },
  { day: '24', revenue: 540, expense: 140 },
  { day: '25', revenue: 800, expense: 300 },
  { day: '26', revenue: 600, expense: 200 },
  { day: '27', revenue: 470, expense: 170 },
  { day: '28', revenue: 560, expense: 160 },
  { day: '29', revenue: 760, expense: 260 },
  { day: '30', revenue: 540, expense: 140 },
  { day: '31', revenue: 560, expense: 160 },
]

export const financeCategories: {
  name: string
  percent: number
  value: number
  color: string
}[] = [
  { name: 'Cortes', percent: 62, value: 2008, color: 'oklch(0.8 0.12 84)' },
  { name: 'Barba', percent: 18, value: 583, color: 'oklch(0.86 0.11 92)' },
  { name: 'Sobrancelha', percent: 8, value: 259, color: 'oklch(0.7 0.09 96)' },
  { name: 'Produtos', percent: 6, value: 194, color: 'oklch(0.6 0.02 80)' },
  { name: 'Outros', percent: 6, value: 196, color: 'oklch(0.44 0.015 80)' },
]

export type FinanceTransactionType = 'entrada' | 'saida'

export type FinanceTransaction = {
  id: string
  date: string
  description: string
  category: string
  categoryIcon: string
  type: FinanceTransactionType
  value: number
}

export const financeTransactions: FinanceTransaction[] = [
  {
    id: 'f1',
    date: '31/08/2026',
    description: 'Corte - João Silva',
    category: 'Cortes',
    categoryIcon: 'Scissors',
    type: 'entrada',
    value: 40,
  },
  {
    id: 'f2',
    date: '31/08/2026',
    description: 'Produto - Pomada',
    category: 'Produtos',
    categoryIcon: 'ShoppingBag',
    type: 'entrada',
    value: 60,
  },
  {
    id: 'f3',
    date: '30/08/2026',
    description: 'Aluguel',
    category: 'Despesas',
    categoryIcon: 'Home',
    type: 'saida',
    value: 300,
  },
  {
    id: 'f4',
    date: '30/08/2026',
    description: 'Barba - Matheus Lima',
    category: 'Barba',
    categoryIcon: 'Brush',
    type: 'entrada',
    value: 50,
  },
  {
    id: 'f5',
    date: '29/08/2026',
    description: 'Internet',
    category: 'Despesas',
    categoryIcon: 'Wifi',
    type: 'saida',
    value: 120,
  },
  {
    id: 'f6',
    date: '29/08/2026',
    description: 'Corte - Carlos Eduardo',
    category: 'Cortes',
    categoryIcon: 'Scissors',
    type: 'entrada',
    value: 40,
  },
  {
    id: 'f7',
    date: '28/08/2026',
    description: 'Sobrancelha - Rafael',
    category: 'Sobrancelha',
    categoryIcon: 'Eye',
    type: 'entrada',
    value: 30,
  },
  {
    id: 'f8',
    date: '28/08/2026',
    description: 'Energia',
    category: 'Despesas',
    categoryIcon: 'Zap',
    type: 'saida',
    value: 200,
  },
]

export const financeQuickActions: {
  label: string
  icon: string
  tone: 'success' | 'danger' | 'muted'
}[] = [
  { label: 'Nova entrada', icon: 'ArrowUpRight', tone: 'success' },
  { label: 'Nova saída', icon: 'ArrowDownRight', tone: 'danger' },
  { label: 'Cadastrar despesa', icon: 'FileText', tone: 'muted' },
  { label: 'Enviar relatório', icon: 'BarChart3', tone: 'muted' },
]

export const financeGoals: {
  label: string
  icon: string
  current: string
  target: string
  percent: number
}[] = [
  {
    label: 'Meta de receita',
    icon: 'TrendingUp',
    current: 'R$ 3.240,00',
    target: 'R$ 4.000,00',
    percent: 81,
  },
  {
    label: 'Meta de atendimentos',
    icon: 'Scissors',
    current: '81',
    target: '100',
    percent: 81,
  },
]

// ----- Campanhas page -----

export type CampaignStatus = 'ativa' | 'agendada' | 'concluida' | 'rascunho'

export type Campaign = {
  id: string
  name: string
  description: string
  icon: string
  audience: string
  sendDate: string
  sendTime: string
  sent: number
  responses: number
  responseRate: number
  status: CampaignStatus
}

export const campaignStats: {
  label: string
  value: string
  icon: string
  trend: number
  trendUp: boolean
  tone: 'gold' | 'success' | 'info' | 'muted'
}[] = [
  {
    label: 'Campanhas ativas',
    value: '4',
    icon: 'Send',
    trend: 33,
    trendUp: true,
    tone: 'success',
  },
  {
    label: 'Mensagens enviadas',
    value: '2.850',
    icon: 'MessageCircle',
    trend: 52,
    trendUp: true,
    tone: 'info',
  },
  {
    label: 'Taxa de resposta',
    value: '32%',
    icon: 'Users',
    trend: 18,
    trendUp: true,
    tone: 'gold',
  },
  {
    label: 'Clientes recuperados',
    value: '112',
    icon: 'Crown',
    trend: 41,
    trendUp: true,
    tone: 'gold',
  },
]

export const campaignFilters: {
  key: CampaignStatus | 'todas'
  label: string
  count: number
}[] = [
  { key: 'todas', label: 'Todas', count: 8 },
  { key: 'ativa', label: 'Ativas', count: 3 },
  { key: 'agendada', label: 'Agendadas', count: 2 },
  { key: 'concluida', label: 'Concluídas', count: 2 },
  { key: 'rascunho', label: 'Rascunhos', count: 1 },
]

export const campaigns: Campaign[] = [
  {
    id: 'cp1',
    name: 'Promoção de corte',
    description: 'Corte + Barba com 20% OFF',
    icon: 'Scissors',
    audience: 'Todos os clientes',
    sendDate: '15/09/2026',
    sendTime: '14:00',
    sent: 520,
    responses: 186,
    responseRate: 36,
    status: 'ativa',
  },
  {
    id: 'cp2',
    name: 'Aniversariantes do mês',
    description: 'Parabéns pelo seu dia!',
    icon: 'Cake',
    audience: 'Aniversariantes',
    sendDate: '10/09/2026',
    sendTime: '09:00',
    sent: 120,
    responses: 48,
    responseRate: 40,
    status: 'concluida',
  },
  {
    id: 'cp3',
    name: 'Clientes em risco',
    description: 'Sentimos sua falta!',
    icon: 'Clock',
    audience: 'Clientes inativos 30+ dias',
    sendDate: '12/09/2026',
    sendTime: '10:00',
    sent: 430,
    responses: 98,
    responseRate: 23,
    status: 'agendada',
  },
  {
    id: 'cp4',
    name: 'Clientes VIP',
    description: 'Atendimento exclusivo',
    icon: 'Crown',
    audience: 'Clientes VIP',
    sendDate: '20/09/2026',
    sendTime: '16:00',
    sent: 180,
    responses: 72,
    responseRate: 40,
    status: 'rascunho',
  },
  {
    id: 'cp5',
    name: 'Novo serviço',
    description: 'Conheça nosso alisamento',
    icon: 'Sparkles',
    audience: 'Todos os clientes',
    sendDate: '05/09/2026',
    sendTime: '11:00',
    sent: 320,
    responses: 96,
    responseRate: 30,
    status: 'concluida',
  },
  {
    id: 'cp6',
    name: 'Volte a agendar',
    description: 'Seu horário está te esperando',
    icon: 'CalendarClock',
    audience: 'Clientes inativos 45+ dias',
    sendDate: '18/09/2026',
    sendTime: '09:30',
    sent: 260,
    responses: 74,
    responseRate: 28,
    status: 'ativa',
  },
  {
    id: 'cp7',
    name: 'Indique um amigo',
    description: 'Ganhe 15% de desconto',
    icon: 'Gift',
    audience: 'Clientes ativos',
    sendDate: '22/09/2026',
    sendTime: '13:00',
    sent: 410,
    responses: 132,
    responseRate: 32,
    status: 'ativa',
  },
  {
    id: 'cp8',
    name: 'Horários de terça',
    description: 'Agenda aberta com desconto',
    icon: 'Clock',
    audience: 'Todos os clientes',
    sendDate: '25/09/2026',
    sendTime: '08:00',
    sent: 610,
    responses: 154,
    responseRate: 25,
    status: 'agendada',
  },
]

export const suggestedCampaigns: {
  id: string
  title: string
  icon: string
  tone: 'gold' | 'success' | 'info' | 'danger'
}[] = [
  {
    id: 'sg1',
    title: 'Recuperar clientes que não voltam há 30 dias',
    icon: 'Users',
    tone: 'info',
  },
  {
    id: 'sg2',
    title: 'Parabenizar aniversariantes',
    icon: 'Gift',
    tone: 'danger',
  },
  {
    id: 'sg3',
    title: 'Lembrar clientes do próximo corte',
    icon: 'CalendarClock',
    tone: 'info',
  },
  {
    id: 'sg4',
    title: 'Oferecer horário disponível',
    icon: 'Clock',
    tone: 'gold',
  },
  {
    id: 'sg5',
    title: 'Campanha para clientes VIP',
    icon: 'Crown',
    tone: 'gold',
  },
]

export const campaignPerformance: {
  label: string
  value: string
  percent: string
  icon: string
  tone: 'gold' | 'success' | 'info'
}[] = [
  { label: 'Enviadas', value: '520', percent: '', icon: 'Send', tone: 'gold' },
  { label: 'Entregues', value: '498', percent: '96%', icon: 'CircleCheck', tone: 'success' },
  { label: 'Lidas', value: '420', percent: '81%', icon: 'Eye', tone: 'info' },
  { label: 'Respondidas', value: '186', percent: '36%', icon: 'MessageCircle', tone: 'success' },
  { label: 'Agendamentos', value: '48', percent: '9%', icon: 'CalendarCheck', tone: 'gold' },
]

// normalized daily responses for the mini bar chart (30 days)
export const campaignDailyResponses: { day: string; value: number }[] = [
  { day: '01', value: 8 },
  { day: '02', value: 12 },
  { day: '03', value: 10 },
  { day: '04', value: 15 },
  { day: '05', value: 18 },
  { day: '06', value: 14 },
  { day: '07', value: 20 },
  { day: '08', value: 22 },
  { day: '09', value: 17 },
  { day: '10', value: 24 },
  { day: '11', value: 19 },
  { day: '12', value: 26 },
  { day: '13', value: 21 },
  { day: '14', value: 30 },
  { day: '15', value: 42 },
  { day: '16', value: 28 },
  { day: '17', value: 24 },
  { day: '18', value: 32 },
  { day: '19', value: 22 },
  { day: '20', value: 27 },
  { day: '21', value: 19 },
  { day: '22', value: 25 },
  { day: '23', value: 21 },
  { day: '24', value: 18 },
  { day: '25', value: 23 },
  { day: '26', value: 16 },
  { day: '27', value: 20 },
  { day: '28', value: 14 },
  { day: '29', value: 17 },
  { day: '30', value: 12 },
]

// ----- Relatórios page -----

export const reportPeriods: string[] = [
  'Hoje',
  'Últimos 7 dias',
  'Este mês',
  'Mês anterior',
  'Personalizado',
]

export const reportStats: {
  label: string
  value: string
  icon: string
  trend: number
  trendUp: boolean
  tone: 'gold' | 'success' | 'info' | 'muted'
}[] = [
  {
    label: 'Receita total',
    value: 'R$ 3.240,00',
    icon: 'CircleDollarSign',
    trend: 12,
    trendUp: true,
    tone: 'gold',
  },
  {
    label: 'Total de atendimentos',
    value: '81',
    icon: 'Scissors',
    trend: 10,
    trendUp: true,
    tone: 'info',
  },
  {
    label: 'Novos clientes',
    value: '12',
    icon: 'Users',
    trend: 33,
    trendUp: true,
    tone: 'success',
  },
  {
    label: 'Ticket médio',
    value: 'R$ 40,00',
    icon: 'Star',
    trend: 8,
    trendUp: true,
    tone: 'gold',
  },
]

export type ReportDailyPoint = {
  day: string
  revenue: number
  sessions: number
}

// Revenue (R$) and sessions per day across the month
export const reportRevenueSessions: ReportDailyPoint[] = [
  { day: '01', revenue: 120, sessions: 3 },
  { day: '02', revenue: 260, sessions: 6 },
  { day: '03', revenue: 480, sessions: 9 },
  { day: '04', revenue: 520, sessions: 11 },
  { day: '05', revenue: 380, sessions: 8 },
  { day: '06', revenue: 440, sessions: 10 },
  { day: '07', revenue: 300, sessions: 7 },
  { day: '08', revenue: 560, sessions: 12 },
  { day: '09', revenue: 940, sessions: 19 },
  { day: '10', revenue: 900, sessions: 20 },
  { day: '11', revenue: 620, sessions: 13 },
  { day: '12', revenue: 560, sessions: 12 },
  { day: '13', revenue: 720, sessions: 15 },
  { day: '14', revenue: 1240, sessions: 24 },
  { day: '15', revenue: 900, sessions: 18 },
  { day: '16', revenue: 640, sessions: 14 },
  { day: '17', revenue: 700, sessions: 15 },
  { day: '18', revenue: 820, sessions: 17 },
  { day: '19', revenue: 1120, sessions: 22 },
  { day: '20', revenue: 900, sessions: 19 },
  { day: '21', revenue: 760, sessions: 16 },
  { day: '22', revenue: 1300, sessions: 25 },
  { day: '23', revenue: 1740, sessions: 33 },
  { day: '24', revenue: 980, sessions: 21 },
  { day: '25', revenue: 1300, sessions: 26 },
  { day: '26', revenue: 720, sessions: 15 },
  { day: '27', revenue: 640, sessions: 13 },
  { day: '28', revenue: 900, sessions: 18 },
  { day: '29', revenue: 700, sessions: 15 },
  { day: '30', revenue: 660, sessions: 14 },
]

export const reportTopServices: {
  name: string
  count: number
  percent: number
}[] = [
  { name: 'Corte', count: 42, percent: 52 },
  { name: 'Barba', count: 18, percent: 22 },
  { name: 'Corte + Barba', count: 12, percent: 15 },
  { name: 'Sobrancelha', count: 6, percent: 7 },
  { name: 'Platinado', count: 3, percent: 4 },
]

export const reportClientsByType: {
  name: string
  count: number
  percent: number
  color: string
}[] = [
  { name: 'Clientes fiéis', count: 48, percent: 39, color: '#d4af37' },
  { name: 'Novos clientes', count: 32, percent: 26, color: '#9ca3af' },
  { name: 'Clientes em risco', count: 28, percent: 23, color: '#a97142' },
  { name: 'Inativos', count: 16, percent: 13, color: '#b4453a' },
]

export const reportClientsTotal = 124

export const reportClientsGrowth: { month: string; value: number }[] = [
  { month: 'Jan', value: 28 },
  { month: 'Fev', value: 38 },
  { month: 'Mar', value: 52 },
  { month: 'Abr', value: 63 },
  { month: 'Mai', value: 78 },
  { month: 'Jun', value: 92 },
  { month: 'Jul', value: 108 },
  { month: 'Ago', value: 124 },
]

export const reportPaymentMethods: {
  name: string
  percent: number
  color: string
}[] = [
  { name: 'Dinheiro', percent: 45, color: '#d4af37' },
  { name: 'PIX', percent: 32, color: '#9ca3af' },
  { name: 'Cartão de débito', percent: 18, color: '#a97142' },
  { name: 'Cartão de crédito', percent: 5, color: '#b4453a' },
]

export const reportPaymentTotal = 'R$ 3.240'

export const reportTopClients: {
  name: string
  sessions: number
  spent: number
}[] = [
  { name: 'João Silva', sessions: 12, spent: 480 },
  { name: 'Carlos Eduardo', sessions: 10, spent: 400 },
  { name: 'Matheus Lima', sessions: 8, spent: 320 },
  { name: 'Rafael Santos', sessions: 7, spent: 280 },
  { name: 'Gabriel Ferreira', sessions: 6, spent: 240 },
]

export const reportWeekdayPerformance: { day: string; value: number }[] = [
  { day: 'Segunda', value: 12 },
  { day: 'Terça', value: 14 },
  { day: 'Quarta', value: 16 },
  { day: 'Quinta', value: 18 },
  { day: 'Sexta', value: 22 },
  { day: 'Sábado', value: 6 },
  { day: 'Domingo', value: 0 },
]
