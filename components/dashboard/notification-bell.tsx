'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, CalendarCheck, Cake, Clock, Users, XCircle, type LucideIcon } from 'lucide-react'
import { onDataChanged } from '@/lib/refresh-bus'
import {
  fetchNotifications,
  getNotificationPrefs,
  getSeenIds,
  markSeen,
  onPrefsChanged,
  type AppNotification,
  type NotificationKind,
} from '@/lib/notifications'
import { cn } from '@/lib/utils'

const kindIcon: Record<NotificationKind, LucideIcon> = {
  confirmacao: CalendarCheck,
  lembrete: Clock,
  cancelamento: XCircle,
  aniversarios: Cake,
  recuperar: Users,
}

export function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [seen, setSeen] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const prefs = getNotificationPrefs()
      const list = await fetchNotifications(prefs)
      setItems(list)
      setSeen(getSeenIds())
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
    }
  }, [])

  useEffect(() => {
    load()
    const offData = onDataChanged(load)
    const offPrefs = onPrefsChanged(load)
    const timer = setInterval(load, 60_000)
    return () => {
      offData()
      offPrefs()
      clearInterval(timer)
    }
  }, [load])

  const unread = items.filter((n) => !seen.includes(n.id)).length

  function closePanel() {
    markSeen(items.map((n) => n.id))
    setSeen(getSeenIds())
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        aria-label="Notificações"
        onClick={() => (open ? closePanel() : setOpen(true))}
        className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Fechar notificações"
            onClick={closePanel}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between px-2">
              <h3 className="text-sm font-semibold">Notificações</h3>
              <a
                href="/configuracoes"
                className="text-xs text-muted-foreground transition-colors hover:text-gold"
              >
                Preferências
              </a>
            </div>
            <ul className="max-h-96 space-y-0.5 overflow-y-auto">
              {items.length === 0 && (
                <li className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Nenhuma notificação no momento.
                </li>
              )}
              {items.map((n) => {
                const Icon = kindIcon[n.kind]
                const isNew = !seen.includes(n.id)
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 rounded-xl px-2 py-2.5',
                      isNew && 'bg-gold/[0.06]',
                    )}
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-gold">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.description}</p>
                    </div>
                    {isNew && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" />}
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
