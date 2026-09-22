'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getDaysWithAppointments } from '@/lib/supabase-calendar'
import { onDataChanged } from '@/lib/refresh-bus'
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

type MiniCalendarProps = {
  selectedDate?: Date
  onSelectDate?: (date: Date) => void
}

export function MiniCalendar({ selectedDate, onSelectDate }: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(() => {
    const base = selectedDate ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [busyDays, setBusyDays] = useState<number[]>([])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Quando o dia escolhido muda (ex.: setas da Agenda), o calendário acompanha o mês dele
  const selectedKey = selectedDate
    ? `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`
    : null

  useEffect(() => {
    if (!selectedDate) return
    setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey])

  // Busca os dias do mês que têm agendamento
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const days = await getDaysWithAppointments(year, month)
        if (!cancelled) setBusyDays(days)
      } catch (err) {
        console.error('Erro ao buscar dias com agendamento:', err)
        if (!cancelled) setBusyDays([])
      }
    }

      load()
      const unsubscribe = onDataChanged(load)
      return () => {
        cancelled = true
        unsubscribe()
      }
    }, [year, month])

  const leadingBlanks = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const now = new Date()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month
  const today = isCurrentMonth ? now.getDate() : null

  const isSelectedMonth =
    !!selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month
  const selectedDay = isSelectedMonth ? selectedDate!.getDate() : null

  function changeMonth(amount: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  function handleSelect(day: number) {
    onSelectDate?.(new Date(year, month, day))
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
          const isSelected = day === selectedDay
          const isToday = day === today
          const hasDot = busyDays.includes(day)
          return (
            <button
              key={day}
              onClick={() => handleSelect(day)}
              className={cn(
                'relative mx-auto grid size-8 place-items-center rounded-full text-[13px] transition-colors',
                isSelected
                  ? 'bg-gold font-semibold text-primary-foreground'
                  : isToday
                    ? 'border border-gold/50 font-semibold text-gold hover:bg-white/5'
                    : 'text-foreground/90 hover:bg-white/5',
              )}
            >
              {day}
              {hasDot && !isSelected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-gold" />
              )}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}