'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  MessageCircle,
  CircleDollarSign,
  Megaphone,
  LineChart,
  Settings,
  LogOut,
  Package,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { navItems } from '@/lib/data'
import { UserAvatar } from './user-avatar'
import { getSession, signOut } from '@/lib/auth'
import { getCachedSettings, getSettings } from '@/lib/supabase-settings'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  MessageCircle,
  CircleDollarSign,
  Megaphone,
  LineChart,
  Settings,
  Package,
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [barbershopName, setBarbershopName] = useState('')
  const [ready, setReady] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    getSession().then((session) => {
      setUserEmail(session?.user?.email ?? '')
    })
    const cached = getCachedSettings()
    if (cached) {
      setBarbershopName(cached.barbershopName)
      setLogoUrl(cached.logoUrl)
      setAvatarUrl(cached.avatarUrl ?? null)
      setReady(true)
    }
    getSettings()
      .then((s) => {
        setBarbershopName(s.barbershopName)
        setLogoUrl(s.logoUrl)
        setAvatarUrl(s.avatarUrl ?? null)
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Brilho de fundo discreto no topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl"
      />

      {/* Logo */}
      <div
        className={cn(
          'relative flex flex-col items-center gap-2 border-b border-sidebar-border px-6 py-6 transition-opacity duration-300',
          !ready && 'opacity-0',
        )}
      >
        <div className="relative flex items-center gap-2">
          {logoUrl ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gold/40 blur-md" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={barbershopName}
                className="relative size-11 rounded-xl object-cover ring-1 ring-gold/30"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gold/40 blur-md" aria-hidden />
              <div className="relative grid size-11 place-items-center rounded-xl bg-gradient-to-br from-gold/30 to-gold/5 ring-1 ring-gold/40">
                <Scissors className="size-5 -rotate-90 text-gold" strokeWidth={2.2} />
              </div>
            </div>
          )}
        </div>
        <div className="text-center leading-none">
          <p className="min-h-[1.25rem] font-serif text-xl font-bold tracking-[0.15em] gradient-text-gold">
            {barbershopName.toUpperCase()}
          </p>
          <p className="mt-2 text-[9px] font-medium tracking-[0.25em] text-muted-foreground">
            MAIS QUE UM CORTE
          </p>
          <p className="text-[9px] font-medium tracking-[0.25em] text-muted-foreground">
            UMA EXPERIÊNCIA
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.href !== '#' && pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground hover:translate-x-0.5',
              )}
            >
              {/* Fundo ativo com gradient + glow */}
              {isActive && (
                <>
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold via-[oklch(0.56_0.21_302)] to-[oklch(0.48_0.21_300)] shadow-[0_8px_24px_-10px_oklch(0.62_0.19_305/60%)]"
                  />
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-white/80 shadow-[0_0_12px_oklch(1_0_0/60%)]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent"
                  />
                </>
              )}
              <Icon
                className={cn(
                  'relative size-[18px] shrink-0 transition-transform duration-300',
                  isActive ? 'scale-110' : 'group-hover:scale-105 group-hover:text-gold',
                )}
                strokeWidth={isActive ? 2.3 : 2}
              />
              <span className="relative flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'relative grid size-5 place-items-center rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-danger text-white shadow-[0_0_12px_oklch(0.65_0.2_22/50%)]',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Quote */}
      <div className="relative mx-5 mb-3 flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
        <Sparkles className="size-3 text-gold/70 shrink-0" />
        <p className="font-serif text-[10px] italic leading-relaxed tracking-wide text-muted-foreground/80">
          Disciplina também transforma estilos.
        </p>
      </div>

      {/* Profile */}
      <div className="relative border-t border-sidebar-border p-3">
        <div className="flex w-full items-center gap-3 rounded-xl bg-white/[0.02] px-2.5 py-2 text-left">
          <UserAvatar name={userEmail || 'Usuário'} size="md" ring src={avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {userEmail ? userEmail.split('@')[0] : 'Usuário'}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <div className="mt-1 space-y-0.5">
          <button
            onClick={handleSignOut}
            className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-danger"
          >
            <LogOut className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
