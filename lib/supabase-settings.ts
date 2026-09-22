import { supabase } from './supabase'

export interface BarbershopSettings {
  barbershopName: string
  phone: string
  address: string
  instagram: string
  description: string
}

export async function getSettings(): Promise<BarbershopSettings> {
  const { data, error } = await supabase
    .from('barberpro_settings')
    .select('barbershop_name, phone, address, instagram, description')
    .eq('id', 1)
    .single()

  if (error) {
    throw new Error(`Erro ao buscar configurações: ${error.message}`)
  }

  return {
    barbershopName: data.barbershop_name || 'BarberPro',
    phone: data.phone || '',
    address: data.address || '',
    instagram: data.instagram || '',
    description: data.description || '',
  }
}

export async function updateSettings(settings: BarbershopSettings): Promise<void> {
  const { error } = await supabase
    .from('barberpro_settings')
    .update({
      barbershop_name: settings.barbershopName,
      phone: settings.phone,
      address: settings.address,
      instagram: settings.instagram,
      description: settings.description,
    })
    .eq('id', 1)

  if (error) {
    throw new Error(`Erro ao salvar configurações: ${error.message}`)
  }
}
