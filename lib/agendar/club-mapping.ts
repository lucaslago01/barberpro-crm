// Liga o nome do plano do clube (cadastrado no cliente) aos serviços que ele libera de graça.
// "Corte e barba" libera qualquer um dos três (Corte, Barba, ou Corte + Barba).
export function planToServiceIds(plan: string | null): string[] {
  switch (plan) {
    case "Corte":
      return ["corte-masculino"]
    case "Barba":
      return ["barba"]
    case "Corte e barba":
      return ["corte-masculino", "barba", "corte-barba"]
    default:
      return []
  }
}

// Serviço que já vem pré-selecionado ao entrar na lista (o "principal" do plano)
export function planToDefaultServiceId(plan: string | null): string | null {
  switch (plan) {
    case "Corte":
      return "corte-masculino"
    case "Barba":
      return "barba"
    case "Corte e barba":
      return "corte-barba"
    default:
      return null
  }
}