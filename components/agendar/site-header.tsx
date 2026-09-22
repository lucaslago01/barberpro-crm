'use client'

import { useEffect, useState } from 'react'
import { AtSign, Phone } from 'lucide-react'
import { getSettings } from '@/lib/supabase-settings'

export function SiteHeader() {
  const [name, setName] = useState('BarberPro')
  const [instagram, setInstagram] = useState('@barberpro')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    getSettings()
      .then((s) => {
        setName(s.barbershopName)
        if (s.instagram) setInstagram(s.instagram)
        if (s.phone) setPhone(s.phone)
      })
      .catch(() => {})
  }, [])

  const instagramHandle = instagram
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/^@?/, '@')

  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
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
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-amber-400 sm:text-lg">
              {name}
            </p>
            <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-500">BARBEARIA</p>
          </div>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          {phone && (
            <>
              <div className="flex items-center gap-2.5 text-right">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-400">
                  <Phone className="size-3.5" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-medium text-white">Atendimento</p>
                  <p className="text-[11px] text-zinc-500">{phone}</p>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10" aria-hidden="true" />
            </>
          )}

          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-400">
              <AtSign className="size-3.5" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-medium text-white">Nos siga</p>
              <p className="text-[11px] text-zinc-500">{instagramHandle}</p>
            </div>
          </div>
        </div>

        <a
          href={"https://instagram.com/" + instagramHandle.replace('@', '')}
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-400 sm:hidden"
          aria-label={"Instagram de " + name}
        >
          <AtSign className="size-4" />
        </a>
      </div>
    </header>
  )
}