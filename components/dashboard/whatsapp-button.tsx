import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Deixa só dígitos e garante o código do Brasil (55).
// Devolve null se o número não parece válido (DDD + 8 ou 9 dígitos).
export function buildWhatsappUrl(phone?: string | null) {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2)
  }
  if (digits.length !== 10 && digits.length !== 11) return null
  return `https://wa.me/55${digits}`
}

export function WhatsappIconButton({
  label = 'Enviar mensagem no WhatsApp',
  className,
  phone,
}: {
  label?: string
  className?: string
  // undefined = botão de exemplo (sem número); string/null = número real do cliente
  phone?: string | null
}) {
  const hasPhoneProp = phone !== undefined
  const url = hasPhoneProp ? buildWhatsappUrl(phone) : null
  const disabled = hasPhoneProp && !url

  return (
    <button
      type="button"
      aria-label={label}
      title={disabled ? 'Cliente sem WhatsApp' : label}
      disabled={disabled}
      onClick={() => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      }}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full bg-success/15 text-success transition-colors hover:bg-success/25',
        disabled && 'cursor-not-allowed opacity-30 hover:bg-success/15',
        className,
      )}
    >
      <MessageCircle className="size-4" />
    </button>
  )
}

export function WhatsappButton({
  label = 'Enviar WhatsApp',
  phone,
}: {
  label?: string
  phone?: string | null
}) {
  const hasPhoneProp = phone !== undefined
  const url = hasPhoneProp ? buildWhatsappUrl(phone) : null
  const disabled = hasPhoneProp && !url

  return (
    <button
      type="button"
      title={disabled ? 'Cliente sem WhatsApp' : label}
      disabled={disabled}
      onClick={() => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-success/10',
      )}
    >
      <MessageCircle className="size-3.5" />
      {label}
    </button>
  )
}