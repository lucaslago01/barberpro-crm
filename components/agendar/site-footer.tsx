'use client'

import { useEffect, useState } from 'react'
import { getCachedSettings, getSettings } from '@/lib/supabase-settings'

export function SiteFooter() {
  const [name, setName] = useState('')

  useEffect(() => {
    const cached = getCachedSettings()
    if (cached) setName(cached.barbershopName)
    getSettings()
      .then((s) => setName(s.barbershopName))
      .catch(() => setName((n) => n || 'BarberPro'))
  }, [])

  return (
    <footer className="px-4 py-10 text-center">
      <p className="text-sm font-bold tracking-[0.15em] text-amber-400">{name}</p>
      <p className="mt-1.5 text-xs text-zinc-600">Mais que uma barbearia, um estilo de vida.</p>
    </footer>
  )
}