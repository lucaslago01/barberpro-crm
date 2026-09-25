'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { CalendarDays, Menu } from 'lucide-react'
import { NotificationBell } from './notification-bell'


function formatToday(date: Date) {
  const label = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  // "segunda-feira, 21 de setembro de 2026" -> "Segunda-feira, 21 de Setembro de 2026"
  return label
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/ de ([a-zç]+) de /, (_, m: string) => ` de ${m.charAt(0).toUpperCase()}${m.slice(1)} de `)
}

function TodayLabel() {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const update = () => setLabel(formatToday(new Date()))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return <span className="min-w-[16rem] whitespace-nowrap">{label}</span>
}

export function Topbar({
  onMenuClick,
  title = 'Olá, Lucas!',
  subtitle = 'Confira o resumo da sua barbearia hoje.',
  action,
}: {
  onMenuClick?: () => void
  title?: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
          <CalendarDays className="size-4 text-gold" />
          <TodayLabel />
        </div>

        <NotificationBell />

        

        {action}
      </div>
    </header>
  )
}