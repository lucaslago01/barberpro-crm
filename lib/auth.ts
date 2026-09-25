import type { Session } from '@supabase/supabase-js'
import { lastAuthServerError, supabase } from './supabase'

const ISSUE_KEY = 'crm-auth-issue'

// Marca que a saída foi pedida pela própria pessoa (botão Sair), para não virar "aviso de queda"
let userSignedOut = false

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) {
    throw new Error('E-mail ou senha incorretos.')
  }
  clearAuthIssue()
}

export async function signOut() {
  userSignedOut = true
  await supabase.auth.signOut()
}

/* ---------- Motivo da última queda do login (diagnóstico) ---------- */

// Guarda por que o login foi encerrado sem a pessoa pedir. A tela de login mostra isso,
// e assim dá para saber se foi o servidor recusando a renovação ou outra coisa.
export function rememberAuthIssue(text: string) {
  try {
    localStorage.setItem(ISSUE_KEY, JSON.stringify({ text, at: new Date().toISOString() }))
  } catch {
    // sem localStorage: só perde o diagnóstico
  }
}

export function readAuthIssue(): { text: string; at: string } | null {
  try {
    const raw = localStorage.getItem(ISSUE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAuthIssue() {
  try {
    localStorage.removeItem(ISSUE_KEY)
  } catch {
    // ignora
  }
}

// Resposta do servidor que causou a queda, quando houve (ex.: 400 refresh_token_already_used)
function serverDetail() {
  const detail = lastAuthServerError()
  return detail ? ` · servidor: ${detail}` : ' · sem recusa do servidor (saída em outra aba?)'
}

/* ---------- Conferir se a pessoa está logada ---------- */

export type SessionCheck =
  | { status: 'ok'; session: Session }
  | { status: 'none' } // o login realmente acabou: precisa entrar de novo
  | { status: 'unknown'; reason: string } // não deu para confirmar agora (servidor lento, rede, outra aba)

const CHECK_TIMEOUT_MS = 12_000

// Falhas que NÃO significam "deslogado": servidor fora do ar ou lento, rede caindo, ou outra aba
// renovando o login ao mesmo tempo. O login continua guardado e vale tentar de novo.
function isTemporaryFailure(error: { name?: string; status?: number }) {
  return (
    error.name === 'AuthRetryableFetchError' ||
    error.name === 'AuthRefreshDiscardedError' ||
    error.status === 0 ||
    (typeof error.status === 'number' && error.status >= 500)
  )
}

export async function checkSession(): Promise<SessionCheck> {
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), CHECK_TIMEOUT_MS)),
    ])

    if (result === 'timeout') {
      return { status: 'unknown', reason: 'O servidor demorou demais para responder.' }
    }

    const { data, error } = result
    if (data.session) return { status: 'ok', session: data.session }

    if (error && isTemporaryFailure(error)) {
      return { status: 'unknown', reason: 'Servidor indisponível ou conexão instável.' }
    }

    // Sem login guardado, ou o servidor recusou a renovação de vez
    if (error) {
      rememberAuthIssue(
        `${error.name}${error.message ? `: ${error.message}` : ''}${serverDetail()}`,
      )
    }
    return { status: 'none' }
  } catch (err) {
    // Erro inesperado ao conferir: não derruba o login por isso
    return {
      status: 'unknown',
      reason: err instanceof Error ? err.message : 'Erro ao confirmar o login.',
    }
  }
}

// Versão simples usada em telas que só precisam saber se existe sessão (login, menu lateral)
export async function getSession() {
  const check = await checkSession()
  return check.status === 'ok' ? check.session : null
}

// Avisa quando a pessoa entra ou sai. Devolve uma função para parar de escutar.
export function onAuthChange(callback: (loggedIn: boolean) => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // Só sai da tela num logout de verdade; oscilações de rede na renovação não derrubam o CRM.
    if (event === 'SIGNED_OUT') {
      if (!userSignedOut) {
        rememberAuthIssue(`SIGNED_OUT: login encerrado sem você pedir${serverDetail()}`)
      }
      callback(false)
    } else if (session) {
      callback(true)
    }
  })
  return () => data.subscription.unsubscribe()
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    throw new Error(error.message)
  }
}
