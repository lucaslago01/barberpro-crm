'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { MobileNav } from './mobile-nav'
import { checkSession, onAuthChange, signOut } from '@/lib/auth'
import { getCachedSettings, getSettings } from '@/lib/supabase-settings'
import { cn } from '@/lib/utils'

export function AppShell({
  children,
  title,
  subtitle,
  headerAction,
}: {
  children: ReactNode
  title?: string
  subtitle?: string
  headerAction?: ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  // checking: primeira conferência | ok: logado | unknown: não deu para confirmar agora
  const [state, setState] = useState<'checking' | 'ok' | 'unknown'>('checking')
  const [reason, setReason] = useState('')
  const [attempting, setAttempting] = useState(true)
  const [retryKey, setRetryKey] = useState(0)
  const [barbershopName, setBarbershopName] = useState('')
  const [userFirstName, setUserFirstName] = useState('')

  // Fecha o drawer com Esc + trava scroll do body quando aberto
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Confere a sessão.
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    setAttempting(true)

    checkSession().then((check) => {
      if (cancelled) return
      setAttempting(false)
      if (check.status === 'ok') {
        setState('ok')
        const email = check.session.user?.email ?? ''
        const namePart = email.split('@')[0]?.split('.')[0] ?? ''
        setUserFirstName(namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : '')
      } else if (check.status === 'none') {
        router.replace('/login')
      } else {
        setReason(check.reason)
        setState('unknown')
        timer = setTimeout(() => setRetryKey((k) => k + 1), 6000)
      }
    })

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [router, retryKey])

  // Ao voltar para a aba ou quando a internet volta, tenta de novo na hora
  useEffect(() => {
    if (state !== 'unknown') return
    const retry = () => setRetryKey((k) => k + 1)
    const onVisible = () => {
      if (document.visibilityState === 'visible') retry()
    }
    window.addEventListener('online', retry)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', retry)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [state])

  useEffect(() => {
    // Se a pessoa sair (em qualquer aba), volta para o login
    const stop = onAuthChange((isLogged) => {
      if (!isLogged) router.replace('/login')
    })

    const cached = getCachedSettings()
    if (cached) setBarbershopName(cached.barbershopName)
    getSettings()
      .then((s) => setBarbershopName(s.barbershopName))
      .catch(() => setBarbershopName((n) => n || 'FRAMES STUDIO'))

    return () => {
      stop()
    }
  }, [router])

  if (state === 'unknown') {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center animate-scale-in">
          <p className="text-base font-semibold">
            {attempting ? 'Reconectando...' : 'Não consegui confirmar seu login'}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Seu login continua salvo. O servidor está lento ou a internet caiu, e vou tentar de novo
            sozinho.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">{reason}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              disabled={attempting}
              className="btn-gold-glow h-10 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
            >
              Tentar agora
            </button>
            <button
              onClick={async () => {
                await signOut()
                router.replace('/login')
              }}
              className="h-10 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-gold/30"
            >
              Entrar de novo
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state !== 'ok') {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/50" />
            <span className="relative inline-flex size-2.5 rounded-full bg-gold" />
          </span>
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-[82vw] max-w-80 border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <button
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
          <Sidebar />
        </div>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-8 mobile-nav-pad">
          <Topbar
            onMenuClick={() => setOpen(true)}
            title={title ?? (userFirstName ? `Olá, ${userFirstName}!` : 'Olá!')}
            subtitle={subtitle}
            action={headerAction}
          />
          <main className="mt-6 animate-fade-in">{children}</main>
          <footer className="mt-8 flex flex-col items-center gap-1 border-t border-border py-4 text-center text-[10px] tracking-[0.2em] text-muted-foreground/60 sm:flex-row sm:justify-between sm:text-[11px]">
            <span className="font-serif font-semibold gradient-text-gold">
              {barbershopName.toUpperCase()}
            </span>
            <span>MAIS QUE UM CORTE, UMA EXPERIÊNCIA.</span>
          </footer>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav onMenuClick={() => setOpen(true)} />
    </div>
  )
}
