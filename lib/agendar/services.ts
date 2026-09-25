export interface AgendarService {
  id: string
  nome: string
  descricao: string
  duracaoMin: number
  precoCentavos: number
  priceFrom?: boolean
  imagem: string
  isClube?: boolean
  clubPlanLabel?: string
  baseServiceName?: string
}

function resolveDescricao(nome: string): string {
  const n = nome.toLowerCase()
  if (n.includes('corte') && n.includes('barba')) return 'O combo completo para você.'
  if (n.includes('corte') && n.includes('infantil')) return 'Corte especial para os pequenos.'
  if (n.includes('corte')) return 'Corte tradicional ou moderno, do seu jeito.'
  if (n.includes('camuflagem') && n.includes('barba')) return 'Disfarce os fios brancos da barba.'
  if (n.includes('camuflagem')) return 'Disfarce os fios brancos com naturalidade.'
  if (n.includes('barba')) return 'Aparação e desenho da barba.'
  if (n.includes('sobrancelha')) return 'Design e alinhamento da sobrancelha.'
  if (n.includes('selagem')) return 'Selagem capilar para fios lisos e brilhosos.'
  if (n.includes('hidratação')) return 'Hidratação profunda para cabelos ressecados.'
  if (n.includes('platinado')) return 'Descoloração e platinado com técnica profissional.'
  if (n.includes('limpeza') && n.includes('pele')) return 'Limpeza facial profunda.'
  if (n.includes('tratamento')) return 'Tratamento capilar especializado.'
  if (n.includes('depilação') || n.includes('nariz')) return 'Remoção de pelos do nariz com cera.'
  return 'Serviço profissional de barbearia.'
}

function resolveImagem(nome: string): string {
  const n = nome.toLowerCase()
  if (n.includes('corte') && n.includes('barba')) return '/agendar/corte-barba.webp'
  if (n.includes('corte') && n.includes('infantil')) return '/agendar/corte-infantil.webp'
  if (n.includes('corte')) return '/agendar/corte-masculino.webp'
  if (n.includes('barba') || n.includes('camuflagem')) return '/agendar/barba.webp'
  if (n.includes('sobrancelha')) return '/agendar/sobrancelha.webp'
  if (n.includes('selagem') || n.includes('hidratação') || n.includes('tratamento') || n.includes('platinado')) return '/agendar/tratamento-capilar.webp'
  if (n.includes('limpeza') || n.includes('pele')) return '/agendar/tratamento-capilar.webp'
  return '/agendar/corte-masculino.webp'
}

export async function getServicesFromDB(): Promise<{ services: AgendarService[]; clubServices: AgendarService[] }> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase
    .from('barberpro_services')
    .select('id, name, duration, price, price_from')
    .order('name', { ascending: true })

  if (error || !data) return { services, clubServices }

  const dbServices: AgendarService[] = data.map((s: any) => ({
    id: s.id,
    nome: s.name,
    descricao: resolveDescricao(s.name),
    duracaoMin: s.duration,
    precoCentavos: Math.round(s.price * 100),
    priceFrom: s.price_from ?? false,
    imagem: resolveImagem(s.name),
  }))

  return { services: dbServices, clubServices }
}

export const services: AgendarService[] = [
  {
    id: "corte-masculino",
    nome: "Corte Masculino",
    descricao: "Corte tradicional ou moderno, do seu jeito.",
    duracaoMin: 35,
    precoCentavos: 8000,
    imagem: "/agendar/corte-masculino.webp",
  },
  {
    id: "barba",
    nome: "Barba",
    descricao: "Aparação e desenho da barba.",
    duracaoMin: 40,
    precoCentavos: 6500,
    imagem: "/agendar/barba.webp",
  },
  {
    id: "corte-barba",
    nome: "Corte + Barba",
    descricao: "O combo completo para você.",
    duracaoMin: 50,
    precoCentavos: 14000,
    imagem: "/agendar/corte-barba.webp",
  },
  {
    id: "sobrancelha",
    nome: "Sobrancelha",
    descricao: "Design e alinhamento da sobrancelha.",
    duracaoMin: 30,
    precoCentavos: 3000,
    imagem: "/agendar/sobrancelha.webp",
  },
]

export const clubServices: AgendarService[] = [
  {
    id: "corte-clube",
    nome: "Corte (Clube)",
    descricao: "Incluso no seu plano de assinatura.",
    duracaoMin: 35,
    precoCentavos: 0,
    imagem: "/agendar/corte-masculino.webp",
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
    imagem: "/agendar/barba.webp",
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
    imagem: "/agendar/corte-barba.webp",
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