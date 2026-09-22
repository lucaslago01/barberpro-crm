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
}

export interface Service {
  id: string
  name: string
  duration: number
  price: number
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
  duration: string
  price: number
  status: AppointmentStatus
  available?: boolean
  notes?: string
}