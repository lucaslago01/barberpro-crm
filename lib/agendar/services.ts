export interface AgendarService {
  id: string
  nome: string
  descricao: string
  duracaoMin: number
  precoCentavos: number
  imagem: string
  isClube?: boolean
  clubPlanLabel?: string
  baseServiceName?: string
}

export const services: AgendarService[] = [
  {
    id: "corte-masculino",
    nome: "Corte Masculino",
    descricao: "Corte tradicional ou moderno, do seu jeito.",
    duracaoMin: 35,
    precoCentavos: 8000,
    imagem: "/agendar/corte-masculino.png",
  },
  {
    id: "barba",
    nome: "Barba",
    descricao: "Aparação e desenho da barba.",
    duracaoMin: 40,
    precoCentavos: 6500,
    imagem: "/agendar/barba.png",
  },
  {
    id: "corte-barba",
    nome: "Corte + Barba",
    descricao: "O combo completo para você.",
    duracaoMin: 50,
    precoCentavos: 14000,
    imagem: "/agendar/corte-barba.png",
  },
  {
    id: "sobrancelha",
    nome: "Sobrancelha",
    descricao: "Design e alinhamento da sobrancelha.",
    duracaoMin: 30,
    precoCentavos: 3000,
    imagem: "/agendar/sobrancelha.png",
  },
]

export const clubServices: AgendarService[] = [
  {
    id: "corte-clube",
    nome: "Corte (Clube)",
    descricao: "Incluso no seu plano de assinatura.",
    duracaoMin: 35,
    precoCentavos: 0,
    imagem: "/agendar/corte-masculino.png",
    isClube: true,
    clubPlanLabel: "Corte",
    baseServiceName: "Corte",
  },
  {
    id: "barba-clube",
    nome: "Barba (Clube)",
    descricao: "Incluso no seu plano de assinatura.",
    duracaoMin: 40,
    precoCentavos: 0,
    imagem: "/agendar/barba.png",
    isClube: true,
    clubPlanLabel: "Barba",
    baseServiceName: "Barba",
  },
  {
    id: "corte-barba-clube",
    nome: "Corte + Barba (Clube)",
    descricao: "Incluso no seu plano de assinatura.",
    duracaoMin: 50,
    precoCentavos: 0,
    imagem: "/agendar/corte-barba.png",
    isClube: true,
    clubPlanLabel: "Corte e barba",
    baseServiceName: "Corte + Barba",
  },
]

export function formatPreco(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}