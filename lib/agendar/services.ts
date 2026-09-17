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
    duracaoMin: 30,
    precoCentavos: 4000,
    imagem: "/agendar/corte-masculino.png",
  },
  {
    id: "barba",
    nome: "Barba",
    descricao: "Aparação e desenho da barba.",
    duracaoMin: 30,
    precoCentavos: 3000,
    imagem: "/agendar/barba.png",
  },
  {
    id: "corte-barba",
    nome: "Corte + Barba",
    descricao: "O combo completo para você.",
    duracaoMin: 60,
    precoCentavos: 7000,
    imagem: "/agendar/corte-barba.png",
  },
  {
    id: "corte-infantil",
    nome: "Corte Infantil",
    descricao: "Estilo e conforto para os pequenos.",
    duracaoMin: 30,
    precoCentavos: 3500,
    imagem: "/agendar/corte-infantil.png",
  },
  {
    id: "sobrancelha",
    nome: "Sobrancelha",
    descricao: "Design e alinhamento da sobrancelha.",
    duracaoMin: 20,
    precoCentavos: 2000,
    imagem: "/agendar/sobrancelha.png",
  },
  {
    id: "tratamento-capilar",
    nome: "Tratamento Capilar",
    descricao: "Cuidado completo para seus cabelos.",
    duracaoMin: 40,
    precoCentavos: 5000,
    imagem: "/agendar/tratamento-capilar.png",
  },
]

export function formatPreco(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
