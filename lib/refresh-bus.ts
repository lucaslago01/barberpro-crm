// Evento global simples: qualquer parte do app pode avisar que os dados
// mudaram (agendamento criado, status alterado, cliente editado, etc),
// e qualquer painel pode escutar para recarregar sozinho, sem precisar
// que cada tela saiba de todas as outras.

const EVENT_NAME = 'crm:data-changed'

export function notifyDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_NAME))
  }
}

// Retorna uma função para cancelar a inscrição (usar no cleanup do useEffect)
export function onDataChanged(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT_NAME, callback)
  return () => window.removeEventListener(EVENT_NAME, callback)
}
