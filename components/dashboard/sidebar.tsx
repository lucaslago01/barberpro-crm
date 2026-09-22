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
  ChevronsUpDown,
  LogOut,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { navItems } from '@/lib/data'
import { UserAvatar } from './user-avatar'
import { getSession, signOut } from '@/lib/auth'
import { getSettings } from '@/lib/supabase-settings'
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
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [barbershopName, setBarbershopName] = useState('BarberPro')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    getSession().then((session) => {
      setUserEmail(session?.user?.email ?? '')
    })
    getSettings()
      .then((s) => {
        setBarbershopName(s.barbershopName)
        setLogoUrl(s.logoUrl)
      })
      .catch(() => {})
  }, [])

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 border-b border-sidebar-border px-6 py-6">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={barbershopName}
              className="size-9 rounded-lg object-cover"
            />
          ) : (
            <Scissors className="size-6 -rotate-90 text-gold" />
          )}
        </div>
        <div className="text-center leading-none">
          <p className="font-serif text-xl font-bold tracking-[0.15em] text-gold">
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
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
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gold text-primary-foreground shadow-[0_8px_24px_-12px_rgba(212,175,55,0.6)]'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'grid size-5 place-items-center rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-black/20 text-primary-foreground'
                      : 'bg-danger text-white',
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
      <p className="px-6 pb-3 font-serif text-[10px] italic leading-relaxed tracking-wide text-muted-foreground/70">
        Disciplina também transforma estilos.
      </p>

      {/* Profile */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left">
          <UserAvatar name={userEmail || 'Usuário'} size="md" ring />
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
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}