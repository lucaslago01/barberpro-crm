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
      setInstagram(cached.instagram || '@barberpro')
      setPhone(cached.phone || '')
      setLogoUrl(cached.logoUrl)
      setReady(true)
    }
    getSettings()
      .then((s) => {
        setName(s.barbershopName)
        setInstagram(s.instagram || '@barberpro')
        setPhone(s.phone || '')
        setLogoUrl(s.logoUrl)
      })
      .catch(() => {
        setName((n) => n || 'BarberPro')
        setInstagram((i) => i || '@barberpro')
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
    <header className={`border-b border-white/10 bg-black/40 backdrop-blur-sm ${ready ? '' : 'opacity-0'}`}>
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
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-gradient-to-br from-amber-400/20 to-transparent text-amber-400"
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
            <p className="text-base font-bold tracking-tight text-amber-400 sm:text-lg">
              {name}
            </p>
            <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-500">BARBEARIA</p>
          </div>

          <a
            href="/agendar"
            className="ml-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-400"
            aria-label="Voltar ao menu inicial"
          >
            <Home className="size-3.5" />
            <span>Início</span>
          </a>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          {phone && (
            <>
              <a href={whatsappUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-right transition-opacity hover:opacity-80">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-400">
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
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-400">
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
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-400 transition-opacity hover:opacity-80 sm:hidden"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle className="size-4" />
        </a>

        <a
          href="/"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-400 transition-opacity hover:opacity-80 sm:hidden"
          aria-label="Voltar para home"
        >
          <Home className="size-4" />
        </a>

        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-400 sm:hidden"
          aria-label={"Instagram de " + name}
        >
          <AtSign className="size-4" />
        </a>
      </div>
    </header>
  )
}
