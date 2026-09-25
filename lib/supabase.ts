import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// Tempo máximo para o servidor de login responder. Sem limite, um servidor lento ou uma rede
// que acabou de voltar deixava a tela em "Carregando..." para sempre. Quando estoura, a
// biblioteca trata como falha TEMPORÁRIA (não apaga o login guardado) e tenta de novo.
const AUTH_TIMEOUT_MS = 20_000

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

const SERVER_ERROR_KEY = 'crm-auth-server-error'

// Guarda a última recusa do servidor de login (código e mensagem, sem nenhum token). Quando o CRM
// desloga, isso mostra o motivo real, por exemplo refresh_token_already_used.
async function noteServerError(res: Response): Promise<void> {
  if (res.ok) return
  try {
    const body = await res.clone().json()
    const code = body?.error_code ?? body?.code ?? body?.error ?? ''
    const msg = body?.msg ?? body?.message ?? body?.error_description ?? ''
    localStorage.setItem(
      SERVER_ERROR_KEY,
      JSON.stringify({ text: `${res.status} ${code} ${msg}`.trim(), at: Date.now() }),
    )
  } catch {
    // corpo sem JSON ou sem localStorage: só perde o detalhe
  }
}

// Última recusa do servidor de login nos últimos instantes (null se não houve)
export function lastAuthServerError(maxAgeMs = 60_000): string | null {
  try {
    const raw = localStorage.getItem(SERVER_ERROR_KEY)
    if (!raw) return null
    const { text, at } = JSON.parse(raw)
    return Date.now() - at <= maxAgeMs ? text : null
  } catch {
    return null
  }
}

const fetchWithAuthTimeout: typeof fetch = (input, init) => {
  if (!requestUrl(input).includes('/auth/v1/')) return fetch(input, init)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS)
  // Respeita um cancelamento que já venha de quem chamou
  init?.signal?.addEventListener('abort', () => controller.abort())

  return fetch(input, { ...init, signal: controller.signal })
    // Espera gravar o motivo antes de a biblioteca processar o erro (e disparar o logout)
    .then(async (res) => {
      await noteServerError(res)
      return res
    })
    .finally(() => clearTimeout(timer))
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: fetchWithAuthTimeout },
})
