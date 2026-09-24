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

function resolveImagem(nome: string): string {
  const n = nome.toLowerCase()
  if (n.includes('corte') && n.includes('barba')) return '/agendar/corte-barba.png'
  if (n.includes('corte') && n.includes('infantil')) return '/agendar/corte-infantil.png'
  if (n.includes('corte')) return '/agendar/corte-masculino.png'
  if (n.includes('barba') || n.includes('camuflagem')) return '/agendar/barba.png'
  if (n.includes('sobrancelha')) return '/agendar/sobrancelha.png'
  if (n.includes('selagem') || n.includes('hidratação') || n.includes('tratamento') || n.includes('platinado')) return '/agendar/tratamento-capilar.png'
  if (n.includes('limpeza') || n.includes('pele')) return '/agendar/tratamento-capilar.png'
  return '/agendar/corte-masculino.png'
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
    descricao: '',
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