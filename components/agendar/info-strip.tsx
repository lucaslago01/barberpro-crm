import { CalendarDays, MapPin, ShieldCheck } from "lucide-react"

const items = [
  {
    icon: CalendarDays,
    title: "Horários",
    subtitle: "Ter–Sex: 9h às 20h • Sáb: 9h às 18h",
  },
  {
    icon: MapPin,
    title: "Nossa localização",
    subtitle: "Curitiba - PR",
  },
  {
    icon: ShieldCheck,
    title: "Ambiente seguro",
    subtitle: "Higiene e qualidade",
  },
]

export function InfoStrip({ bordered = true }: { bordered?: boolean }) {
  return (
    <div
      className={
        bordered
          ? "grid grid-cols-1 gap-4 border-t border-white/10 px-4 py-5 sm:grid-cols-3 sm:px-6"
          : "grid grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-3 sm:px-6"
      }
    >
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400">
            <item.icon className="size-4.5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-[13px] text-zinc-400">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
