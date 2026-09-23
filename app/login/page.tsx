'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors } from 'lucide-react'
import { getSession, signIn } from '@/lib/auth'
import { getCachedSettings, getSettings } from '@/lib/supabase-settings'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [barbershopName, setBarbershopName] = useState('')

  useEffect(() => {
    getSession().then((session) => {
      if (session) router.replace('/')
    })
    const cached = getCachedSettings()
    if (cached) setBarbershopName(cached.barbershopName)
    getSettings()
      .then((s) => setBarbershopName(s.barbershopName))
      .catch(() => setBarbershopName((n) => n || 'BarberPro'))
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
    'h-11 w-full rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40'

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <div className="mb-6 text-center">
          <Scissors className="mx-auto size-8 text-gold" />
          <h1 className="mt-3 min-h-[2rem] font-serif text-2xl font-semibold tracking-[0.2em]">
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

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-gold text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}