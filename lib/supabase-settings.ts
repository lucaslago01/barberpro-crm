import { supabase } from './supabase'

export interface BarbershopSettings {
  barbershopName: string
  phone: string
  address: string
  instagram: string
  description: string
  logoUrl: string | null
}

export async function getSettings(): Promise<BarbershopSettings> {
  const { data, error } = await supabase
    .from('barberpro_settings')
    .select('barbershop_name, phone, address, instagram, description, logo_url')
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
    logoUrl: data.logo_url || null,
  }
}

export async function updateSettings(
  settings: Omit<BarbershopSettings, 'logoUrl'>,
): Promise<void> {
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

// Envia a imagem para o Supabase Storage e grava o link no banco.
export async function uploadLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `logo-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('barbershop-assets')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    throw new Error(`Erro ao enviar a imagem: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('barbershop-assets')
    .getPublicUrl(path)

  const publicUrl = publicUrlData.publicUrl

  const { error: updateError } = await supabase
    .from('barberpro_settings')
    .update({ logo_url: publicUrl })
    .eq('id', 1)

  if (updateError) {
    throw new Error(`Erro ao salvar a logo: ${updateError.message}`)
  }

  return publicUrl
}