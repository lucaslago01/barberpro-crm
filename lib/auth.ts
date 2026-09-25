import { supabase } from './supabase'

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) {
    throw new Error('E-mail ou senha incorretos.')
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (data.session) return data.session
  // Falha ao renovar o login (ex.: rede ainda acordando depois de a aba ficar em
  // segundo plano ou o celular bloquear): espera um instante e tenta de novo antes
  // de considerar a pessoa deslogada.
  if (error) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const retry = await supabase.auth.getSession()
    return retry.data.session
  }
  return null
}

// Avisa quando a pessoa entra ou sai. Devolve uma função para parar de escutar.
export function onAuthChange(callback: (loggedIn: boolean) => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // Só sai da tela num logout de verdade; oscilações de rede na renovação não derrubam o CRM.
    if (event === 'SIGNED_OUT') callback(false)
    else if (session) callback(true)
  })
  return () => data.subscription.unsubscribe()
}
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    throw new Error(error.message)
  }
}