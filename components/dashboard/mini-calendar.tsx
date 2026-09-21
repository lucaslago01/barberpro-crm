'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Panel } from './panel'
import { cn } from '@/lib/utils'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function MiniCalendar() {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const leadingBlanks = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const now = new Date()
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month
  const today = isCurrentMonth ? now.getDate() : null

  function changeMonth(amount: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          aria-label="Mês anterior"
          onClick={() => changeMonth(-1)}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold">
          {monthNames[month]} {year}
        </p>
        <button
          aria-label="Próximo mês"
          onClick={() => changeMonth(1)}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {weekDays.map((d, i) => (
          <span
            key={i}
            className="text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`b-${i}`} />
          const isToday = day === today
          return (
            <button
              key={day}
              className={cn(
                'relative mx-auto grid size-8 place-items-center rounded-full text-[13px] transition-colors',
                isToday
                  ? 'bg-gold font-semibold text-primary-foreground'
                  : 'text-foreground/90 hover:bg-white/5',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}