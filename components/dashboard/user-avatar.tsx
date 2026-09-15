import { cn } from '@/lib/utils'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const sizes = {
  sm: 'size-8 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
}

export function UserAvatar({
  name,
  size = 'md',
  ring = false,
  className,
}: {
  name: string
  size?: keyof typeof sizes
  ring?: boolean
  className?: string
}) {
  const unknown = !name || name.toLowerCase().includes('cliente novo')
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-secondary font-semibold text-muted-foreground select-none',
        'bg-gradient-to-br from-secondary to-accent',
        ring && 'ring-2 ring-gold/60 ring-offset-2 ring-offset-card',
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {unknown ? '?' : initials(name)}
    </div>
  )
}
