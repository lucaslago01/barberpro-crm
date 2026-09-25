'use client'

import { useEffect, useState } from 'react'
import { AtSign, Clock, MapPin, MessageCircle } from 'lucide-react'
import { buildWhatsappUrl } from '@/components/dashboard/whatsapp-button'
import { getCachedSettings, getSettings } from '@/lib/supabase-settings'
import { getScheduleLabel } from "@/lib/business-hours"

export function SiteFooter() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const cached = getCachedSettings()
    if (cached) {
      setName(cached.barbershopName)
      setAddress(cached.address || '')
      setInstagram(cached.instagram || '')
      setPhone(cached.phone || '')
    }
    getSettings()
      .then((s) => {
        setName(s.barbershopName)
        setAddress(s.address || '')
        setInstagram(s.instagram || '')
        setPhone(s.phone || '')
      })
      .catch(() => setName((n) => n || 'FRAMES STUDIO'))
  }, [])

  const handle = instagram
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .replace(/^@?/, '@')
  const instagramUrl = 'https://instagram.com/' + handle.replace('@', '').replace(/\s+/g, '')
  const whatsappUrl = buildWhatsappUrl(phone)

  return (
    <footer className="relative mt-6 border-t border-white/[0.06] bg-gradient-to-b from-transparent to-white/[0.02]">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-14 text-center">
        <p className="font-serif text-2xl font-semibold tracking-tight text-white">{name}</p>
        <div aria-hidden="true" className="mt-4 flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="size-1 rotate-45 bg-gold/80" />
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/60" />
        </div>
        <p className="mt-4 text-sm text-zinc-500">Mais que uma barbearia, um estilo de vida.</p>

        <div className="mt-8 flex flex-col items-center gap-2.5 text-[13px] text-zinc-400">
          {address && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-gold/80" />
              {address}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-gold/80" />
            {getScheduleLabel()}
          </span>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-300 transition-colors hover:border-gold/40 hover:text-gold"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          )}
          {instagram && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-300 transition-colors hover:border-gold/40 hover:text-gold"
            >
              <AtSign className="size-4" />
              {handle}
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
