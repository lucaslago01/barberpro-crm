import { Check } from "lucide-react"

const steps = [
  { number: 1, label: "Serviço" },
  { number: 2, label: "Adicional" },
  { number: 3, label: "Data" },
  { number: 4, label: "Horário" },
  { number: 5, label: "Seus dados" },
  { number: 6, label: "Confirmação" },
]

export function StepIndicator({ currentStep }: { currentStep: number }) {
  const current = steps.find((s) => s.number === currentStep)
  return (
    <>
    <nav
      aria-label="Etapas do agendamento"
      className="mx-auto flex w-full max-w-xl items-start justify-between px-4"
    >
      {steps.map((step, index) => {
        const isActive = step.number === currentStep
        const isCompleted = step.number < currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.number} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                aria-current={isActive ? "step" : undefined}
                className={
                  isCompleted
                    ? "flex size-7 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-xs font-semibold text-gold sm:size-8"
                    : isActive
                      ? "flex size-7 items-center justify-center rounded-full bg-gold text-xs font-semibold text-black shadow-[0_0_0_4px_rgba(212,175,55,0.15)] sm:size-8"
                      : "flex size-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-zinc-500 sm:size-8"
                }
              >
                {isCompleted ? <Check className="size-4" /> : String(step.number).padStart(2, "0")}
              </div>
              <span
                className={
                  "hidden sm:block " +
                  (isCompleted
                    ? "text-[11px] font-medium text-gold/80 sm:text-xs"
                    : isActive
                      ? "text-[11px] font-medium text-gold sm:text-xs"
                      : "text-[11px] font-medium text-zinc-500 sm:text-xs")
                }
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={
                  isCompleted
                    ? "mt-3.5 h-px flex-1 bg-gradient-to-r from-gold/60 to-gold/20 sm:mt-4"
                    : "mt-3.5 h-px flex-1 bg-white/10 sm:mt-4"
                }
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
    <p className="mt-3 text-center text-xs font-medium text-gold sm:hidden">
      Etapa {currentStep} de {steps.length} · {current?.label}
    </p>
    </>
  )
}
