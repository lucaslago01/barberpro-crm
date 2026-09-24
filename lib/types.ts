export type AppointmentStatus = 
  | 'agendado'
  | 'confirmado'
  | 'atendimento'
  | 'concluido'
  | 'cancelado'
  | 'faltou'

export interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  preferred_barber?: string
  last_visit?: string
  club_plan?: string
  club_due_date?: string
  campaign_opt_out?: boolean
  campaign_opt_out_at?: string
}

export interface Service {
  id: string
  name: string
  duration: number
  price: number
  price_from: boolean
}

export interface Appointment {
  id: string
  client_id: string
  service_id: string
  time: string
  status: AppointmentStatus
  notes?: string
  client?: Client
  service?: Service
}

export interface AgendaSlot {
  id: string
  time: string
  client: string
  service: string
  addonService?: string | null
  duration: string
  price: number
  status: AppointmentStatus
  available?: boolean
  notes?: string
}