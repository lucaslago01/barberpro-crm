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
  const { data } = await supabase.auth.getSession()
  return data.session
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