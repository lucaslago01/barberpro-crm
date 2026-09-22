export interface AgendarService {
  id: string
  nome: string
  descricao: string
  duracaoMin: number
  precoCentavos: number
  imagem: string
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

export function formatPreco(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}