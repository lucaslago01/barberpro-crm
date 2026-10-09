'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors } from 'lucide-react'
import { getSession, readAuthIssue, signIn } from '@/lib/auth'
import { getCachedSettings, getSettings } from '@/lib/supabase-settings'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [barbershopName, setBarbershopName] = useState('')
  const [issue, setIssue] = useState<{ text: string; at: string } | null>(null)

  useEffect(() => {
    setIssue(readAuthIssue())
    getSession().then((session) => {
      if (session) router.replace('/')
    })
    const cached = getCachedSettings()
    if (cached) setBarbershopName(cached.barbershopName)
    getSettings()
      .then((s) => setBarbershopName(s.barbershopName))
      .catch(() => setBarbershopName((n) => n || 'FRAMES STUDIO'))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)

    if (!email.trim() || !password) {
      setError('Preencha o e-mail e a senha.')
      return
    }

    try {
      setLoading(true)
      await signIn(email, password)
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.')
      setLoading(false)
    }
  }

  const fieldClass =
    'h-11 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none transition-all focus:border-gold/60 focus:bg-background/60 focus:shadow-[0_0_0_3px_oklch(0.62_0.19_305/15%)]'

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      {/* Aurora de fundo */}
      <div className="pointer-events-none absolute inset-0 aurora" aria-hidden />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-[oklch(0.19_0.01_300)] p-7 shadow-[0_30px_80px_-30px_oklch(0_0_0/80%),0_0_0_1px_oklch(0.62_0.19_305/10%)] animate-scale-in">
        {/* linha de luz no topo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />
        <div className="mb-6 text-center">
          <div className="relative mx-auto grid size-14 place-items-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-2xl bg-gold/30 blur-xl animate-pulse-glow"
            />
            <span className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-gold/30 to-gold/5 ring-1 ring-gold/40">
              <Scissors className="size-6 -rotate-90 text-gold" strokeWidth={2.2} />
            </span>
          </div>
          <h1 className="mt-4 min-h-[2rem] font-serif text-2xl font-bold tracking-[0.2em] gradient-text-gold">
            {barbershopName.toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre para acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-muted-foreground">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs text-muted-foreground">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              placeholder="Sua senha"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {issue && !error && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Seu login foi encerrado. Entre de novo.
              <span className="mt-1 block text-[11px] text-muted-foreground/60">
                {new Date(issue.at).toLocaleString('pt-BR')} · {issue.text}
              </span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold-glow h-11 w-full rounded-lg text-sm font-semibold"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-3 animate-pulse rounded-full bg-white/80" />
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}