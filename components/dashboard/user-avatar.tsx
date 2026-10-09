import { cn } from '@/lib/utils'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Hash determinístico simples para variar a tonalidade do roxo por nome */
function hashHue(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  // Varia entre 285 e 325 (família roxa/magenta — sem fugir da marca)
  return 285 + (h % 40)
}

const sizes = {
  sm: 'size-8 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
  xl: 'size-14 text-base',
}

export function UserAvatar({
  name,
  size = 'md',
  ring = false,
  className,
  src,
}: {
  name: string
  size?: keyof typeof sizes
  ring?: boolean
  className?: string
  src?: string | null
}) {
  const unknown = !name || name.toLowerCase().includes('cliente novo')
  const hue = unknown ? 300 : hashHue(name)
  const style = unknown
    ? undefined
    : ({
        backgroundImage: `linear-gradient(135deg, oklch(0.55 0.19 ${hue}), oklch(0.4 0.17 ${hue - 10}))`,
        color: `oklch(0.98 0.02 ${hue})`,
      } as React.CSSProperties)

  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none shadow-[0_4px_12px_-4px_oklch(0.4_0.15_300/30%)]',
        unknown && 'bg-gradient-to-br from-secondary to-accent text-muted-foreground',
        ring && 'ring-2 ring-gold/60 ring-offset-2 ring-offset-card',
        sizes[size],
        className,
      )}
      style={style}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : unknown ? (
        '?'
      ) : (
        initials(name)
      )}
    </div>
  )
}
