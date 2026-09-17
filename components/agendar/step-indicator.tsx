import { Check } from "lucide-react"

const steps = [
  { number: 1, label: "Serviço" },
  { number: 2, label: "Data" },
  { number: 3, label: "Horário" },
  { number: 4, label: "Seus dados" },
  { number: 5, label: "Confirmação" },
]

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
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
                    ? "flex size-7 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/15 text-xs font-semibold text-amber-400 sm:size-8"
                    : isActive
                      ? "flex size-7 items-center justify-center rounded-full bg-amber-400 text-xs font-semibold text-black shadow-[0_0_0_4px_rgba(251,191,36,0.15)] sm:size-8"
                      : "flex size-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-zinc-500 sm:size-8"
                }
              >
                {isCompleted ? <Check className="size-4" /> : String(step.number).padStart(2, "0")}
              </div>
              <span
                className={
                  isCompleted
                    ? "text-[11px] font-medium text-amber-400/80 sm:text-xs"
                    : isActive
                      ? "text-[11px] font-medium text-amber-400 sm:text-xs"
                      : "text-[11px] font-medium text-zinc-500 sm:text-xs"
                }
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={
                  isCompleted
                    ? "mt-3.5 h-px flex-1 bg-gradient-to-r from-amber-400/60 to-amber-400/20 sm:mt-4"
                    : "mt-3.5 h-px flex-1 bg-white/10 sm:mt-4"
                }
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
