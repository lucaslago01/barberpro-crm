'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { getSession, onAuthChange } from '@/lib/auth'
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
  const [checking, setChecking] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [barbershopName, setBarbershopName] = useState('')
  const [userFirstName, setUserFirstName] = useState('')

  // Confere a sessão ao abrir a tela
  useEffect(() => {
    let cancelled = false

            getSession().then((session) => {
      if (cancelled) return
      if (session) {
        setLoggedIn(true)
        setChecking(false)
        const email = session.user?.email ?? ''
        const namePart = email.split('@')[0]?.split('.')[0] ?? ''
        setUserFirstName(namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : '')
      } else {
        router.replace('/login')
      }
    })

    // Se a pessoa sair (em qualquer aba), volta para o login
    const stop = onAuthChange((isLogged) => {
      if (!isLogged) router.replace('/login')
    })

    const cached = getCachedSettings()
    if (cached) setBarbershopName(cached.barbershopName)
    getSettings()
      .then((s) => setBarbershopName(s.barbershopName))
      .catch(() => setBarbershopName((n) => n || 'BarberPro'))

    return () => {
      cancelled = true
      stop()
    }
  }, [router])

  if (checking || !loggedIn) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-[80vw] max-w-72 border-r border-sidebar-border shadow-2xl',
            )}
          >
            <button
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/5"
            >
              <X className="size-5" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-8">
                    <Topbar
            onMenuClick={() => setOpen(true)}
            title={title ?? (userFirstName ? `Olá, ${userFirstName}!` : 'Olá!')}
            subtitle={subtitle}
            action={headerAction}
          />
          <main className="mt-6">{children}</main>
          <footer className="mt-8 flex flex-col items-center gap-1 border-t border-border py-4 text-center text-[10px] tracking-[0.2em] text-muted-foreground/60 sm:flex-row sm:justify-between sm:text-[11px]">
            <span className="font-serif font-semibold">{barbershopName.toUpperCase()}</span>
            <span>MAIS QUE UM CORTE, UMA EXPERIÊNCIA.</span>
          </footer>
        </div>
      </div>
    </div>
  )
}