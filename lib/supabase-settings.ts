import { supabase } from './supabase'

export interface BarbershopSettings {
  barbershopName: string
  phone: string
  address: string
  instagram: string
  description: string
  logoUrl: string | null
  avatarUrl?: string | null
  msgBoasVindas?: string
  msgAniversario?: string
  msgLembrete?: string
  msgOptOut?: string
}

const CACHE_KEY = 'crm:settings-cache'

export function getCachedSettings(): BarbershopSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as BarbershopSettings) : null
  } catch {
    return null
  }
}

function saveCache(settings: BarbershopSettings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(settings))
  } catch {}
}

function mergeCache(patch: Partial<BarbershopSettings>) {
  const current = getCachedSettings()
  if (current) saveCache({ ...current, ...patch })
}

export async function getSettings(): Promise<BarbershopSettings> {
  const { data, error } = await supabase
    .from('barberpro_settings')
    .select('barbershop_name, phone, address, instagram, description, logo_url, avatar_url, msg_boas_vindas, msg_aniversario, msg_lembrete, msg_opt_out')
    .eq('id', 1)
    .single()

  if (error) {
    throw new Error(`Erro ao buscar configurações: ${error.message}`)
  }

  const result: BarbershopSettings = {
    barbershopName: data.barbershop_name || 'FRAMES STUDIO',
    phone: data.phone || '',
    address: data.address || '',
    instagram: data.instagram || '',
    description: data.description || '',
    logoUrl: data.logo_url || null,
    avatarUrl: data.avatar_url || null,
    msgBoasVindas: data.msg_boas_vindas || '',
    msgAniversario: data.msg_aniversario || '',
    msgLembrete: data.msg_lembrete || '',
    msgOptOut: data.msg_opt_out || '',
  }
  saveCache(result)
  return result
}

export async function updateSettings(
  settings: Partial<Omit<BarbershopSettings, 'logoUrl' | 'avatarUrl'>>,
): Promise<void> {
  const { error } = await supabase
    .from('barberpro_settings')
    .update({
      ...(settings.barbershopName !== undefined && { barbershop_name: settings.barbershopName }),
      ...(settings.phone !== undefined && { phone: settings.phone }),
      ...(settings.address !== undefined && { address: settings.address }),
      ...(settings.instagram !== undefined && { instagram: settings.instagram }),
      ...(settings.description !== undefined && { description: settings.description }),
      ...(settings.msgBoasVindas !== undefined && { msg_boas_vindas: settings.msgBoasVindas }),
      ...(settings.msgAniversario !== undefined && { msg_aniversario: settings.msgAniversario }),
      ...(settings.msgLembrete !== undefined && { msg_lembrete: settings.msgLembrete }),
      ...(settings.msgOptOut !== undefined && { msg_opt_out: settings.msgOptOut }),
    })
    .eq('id', 1)

  if (error) {
    throw new Error(`Erro ao salvar configurações: ${error.message}`)
  }

  mergeCache(settings)
}

async function uploadImage(file: File, prefix: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${prefix}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('barbershop-assets')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    throw new Error(`Erro ao enviar a imagem: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('barbershop-assets')
    .getPublicUrl(path)

  return publicUrlData.publicUrl
}

// Envia a logo para o Supabase Storage e grava o link no banco.
export async function uploadLogo(file: File): Promise<string> {
  const publicUrl = await uploadImage(file, 'logo')

  const { error: updateError } = await supabase
    .from('barberpro_settings')
    .update({ logo_url: publicUrl })
    .eq('id', 1)

  if (updateError) {
    throw new Error(`Erro ao salvar a logo: ${updateError.message}`)
  }

  mergeCache({ logoUrl: publicUrl })

  return publicUrl
}

// Envia a foto de perfil do barbeiro e grava o link no banco.
export async function uploadAvatar(file: File): Promise<string> {
  const publicUrl = await uploadImage(file, 'avatar')

  const { error: updateError } = await supabase
    .from('barberpro_settings')
    .update({ avatar_url: publicUrl })
    .eq('id', 1)

  if (updateError) {
    throw new Error(`Erro ao salvar a foto: ${updateError.message}`)
  }

  mergeCache({ avatarUrl: publicUrl })

  return publicUrl
}