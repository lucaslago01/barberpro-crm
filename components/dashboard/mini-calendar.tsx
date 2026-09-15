'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Panel } from './panel'
import { cn } from '@/lib/utils'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
// September 2025 starts on a Monday (index 1 with Sunday-first grid)
const leadingBlanks = 1
const daysInMonth = 30
const today = 15
const dotDays = [18, 22, 27]

export function MiniCalendar() {
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          aria-label="Mês anterior"
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold">Setembro 2025</p>
        <button
          aria-label="Próximo mês"
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
          const hasDot = dotDays.includes(day)
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
              {hasDot && !isToday && (
                <span className="absolute bottom-1 size-1 rounded-full bg-gold" />
              )}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
