'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Alguns navegadores mobile (Safari/iOS) não respeitam corretamente o
// z-index entre elementos com blur quando ambos são "fixed". Para evitar
// a barra inferior cobrindo botões de modais (ex.: Reagendar), escondemos
// ela sempre que detectamos um overlay de modal aberto na página.
function useHasOpenModal() {
  const [hasOpenModal, setHasOpenModal] = useState(false)

  useEffect(() => {
    const check = () => {
      setHasOpenModal(!!document.querySelector('[data-modal-overlay]'))
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return hasOpenModal
}

type Item = {
  label: string
  href: string
  icon: LucideIcon
}

const items: Item[] = [
  { label: 'Início', href: '/', icon: LayoutDashboard },
  { label: 'Agenda', href: '/agenda', icon: CalendarDays },
  { label: 'Clientes', href: '/clientes', icon: Users },
  { label: 'Serviços', href: '/atendimentos', icon: Scissors },
]

export function MobileNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const hasOpenModal = useHasOpenModal()

  if (hasOpenModal) return null

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-pb tap-highlight-none"
    >
      {/* Fundo com blur elegante */}
      <div className="relative">
        <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="glass border-t border-sidebar-border/80 px-2 pt-2 pb-2">
          <div className="flex items-center justify-around gap-1">
            {items.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10.5px] font-medium transition-colors',
                    isActive
                      ? 'text-gold'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold to-transparent"
                    />
                  )}
                  <span
                    className={cn(
                      'grid place-items-center rounded-xl transition-all duration-300',
                      isActive
                        ? 'size-9 bg-gold/15 scale-105'
                        : 'size-9',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-[18px] transition-transform duration-300',
                        isActive && 'scale-110',
                      )}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                  </span>
                  <span className="leading-none">{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={onMenuClick}
              aria-label="Mais opções"
              className="relative flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="grid size-9 place-items-center rounded-xl">
                <Menu className="size-[18px]" />
              </span>
              <span className="leading-none">Mais</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
