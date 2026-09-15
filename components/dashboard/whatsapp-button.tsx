import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WhatsappIconButton({
  label = 'Enviar mensagem no WhatsApp',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full bg-success/15 text-success transition-colors hover:bg-success/25',
        className,
      )}
    >
      <MessageCircle className="size-4" />
    </button>
  )
}

export function WhatsappButton({
  label = 'Enviar WhatsApp',
}: {
  label?: string
}) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20">
      <MessageCircle className="size-3.5" />
      {label}
    </button>
  )
}
