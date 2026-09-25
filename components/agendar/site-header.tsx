'use client'

import { useEffect, useState } from 'react'
import { AtSign, Phone, Home, MessageCircle } from 'lucide-react'
import { buildWhatsappUrl } from '@/components/dashboard/whatsapp-button'
import { getCachedSettings, getSettings } from '@/lib/supabase-settings'

export function SiteHeader() {
  const [name, setName] = useState('')
  const [instagram, setInstagram] = useState('')
  const [ready, setReady] = useState(false)
  const [phone, setPhone] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const cached = getCachedSettings()
    if (cached) {
      setName(cached.barbershopName)
      setInstagram(cached.instagram || '@framesstudio')
      setPhone(cached.phone || '')
      setLogoUrl(cached.logoUrl)
      setReady(true)
    }
    getSettings()
      .then((s) => {
        setName(s.barbershopName)
        setInstagram(s.instagram || '@framesstudio')
        setPhone(s.phone || '')
        setLogoUrl(s.logoUrl)
      })
      .catch(() => {
        setName((n) => n || 'FRAMES STUDIO')
        setInstagram((i) => i || '@framesstudio')
      })
      .finally(() => setReady(true))
  }, [])

  const instagramHandle = instagram
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .replace(/^@?/, '@')

  const instagramUrl =
    'https://instagram.com/' +
    instagramHandle.replace('@', '').replace(/\s+/g, '').replace(/\/$/, '')
  const whatsappUrl = buildWhatsappUrl(phone)

  return (
    <header className={`relative z-20 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl transition-opacity duration-500 ${ready ? '' : 'opacity-0'}`}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={name}
              className="size-9 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gradient-to-br from-gold/20 to-transparent text-gold"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path
                  d="M6 4h12M6 20h12M9 4c0 4-4 5-4 8s4 4 4 8M15 4c0 4 4 5 4 8s-4 4-4 8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
          <div className="leading-tight">
            <p className="font-serif text-[17px] font-semibold tracking-tight text-white sm:text-lg">
              {name}
            </p>
            <p className="text-[9px] font-semibold tracking-[0.3em] text-gold/80">BARBEARIA</p>
          </div>

          <a
            href="/agendar"
            className="ml-3 hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-gold sm:flex"
            aria-label="Voltar para início do agendamento"
          >
            <Home className="size-4" />
            <span>Início</span>
          </a>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          {phone && (
            <>
              <a href={whatsappUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-right transition-opacity hover:opacity-80">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gold">
                  <Phone className="size-3.5" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-medium text-white">Atendimento</p>
                  <p className="text-[11px] text-zinc-500">{phone}</p>
                </div>
              </a>

              <div className="h-8 w-px bg-white/10" aria-hidden="true" />
            </>
          )}

          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gold">
              <AtSign className="size-3.5" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-medium text-white">Nos siga</p>
              <p className="text-[11px] text-zinc-500">{instagramHandle}</p>
            </div>
          </a>
        </div>

        <a
          href={whatsappUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gold transition-opacity hover:opacity-80 sm:hidden"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle className="size-4" />
        </a>

        <a
          href="/agendar"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gold transition-opacity hover:opacity-80 sm:hidden"
          aria-label="Voltar para início do agendamento"
        >
          <Home className="size-4" />
        </a>

        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gold sm:hidden"
          aria-label={"Instagram de " + name}
        >
          <AtSign className="size-4" />
        </a>
      </div>
    </header>
  )
}
