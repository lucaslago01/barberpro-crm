import { supabase } from './supabase'
import { todayString } from './supabase-finance'

export const PRODUCT_CATEGORIES = ['bebidas', 'pomadas e cuidados', 'acessórios', 'outros']

export interface Product {
  id: string
  name: string
  category: string
  cost_price: number // custo médio por unidade
  sale_price: number
  stock: number
  min_stock: number
  active: boolean
}

export type MovementKind = 'entrada' | 'venda' | 'ajuste' | 'estorno'

export interface ProductMovement {
  id: string
  product_id: string
  product_name: string
  kind: MovementKind
  quantity: number // positivo entra no estoque, negativo sai
  unit_cost: number
  unit_price: number
  day: string // "2026-09-21"
  client_name: string | null
  note: string | null
  reverses_id: string | null
  reversed: boolean // venda que já foi estornada
}

const MISSING_MESSAGE =
  'Para usar Produtos, rode o arquivo supabase/products.sql no SQL Editor do Supabase (cole o conteúdo do arquivo).'

function isMissingTable(error: { code?: string; message: string }) {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    error.code === 'PGRST202' ||
    /does not exist|schema cache|Could not find/i.test(error.message)
  )
}

function fail(prefix: string, error: { code?: string; message: string }): never {
  if (isMissingTable(error)) throw new Error(MISSING_MESSAGE)
  throw new Error(`${prefix}: ${error.message}`)
}

function toProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    cost_price: Number(p.cost_price),
    sale_price: Number(p.sale_price),
    stock: Number(p.stock),
    min_stock: Number(p.min_stock),
    active: !!p.active,
  }
}

/* ---------- Cadastro ---------- */

export async function getProducts(includeArchived = false): Promise<Product[]> {
  let query = supabase
    .from('barberpro_products')
    .select('id, name, category, cost_price, sale_price, stock, min_stock, active')
    .order('name', { ascending: true })
  if (!includeArchived) query = query.eq('active', true)

  const { data, error } = await query
  if (error) fail('Erro ao buscar produtos', error)
  return (data || []).map(toProduct)
}

export interface ProductInput {
  name: string
  category: string
  sale_price: number
  min_stock: number
}

// O custo e o estoque não se digitam no cadastro depois de criado: só mudam por reposição/ajuste.
export async function createProduct(
  input: ProductInput & { cost_price: number; stock: number },
): Promise<void> {
  const { data, error } = await supabase
    .from('barberpro_products')
    .insert({
      name: input.name,
      category: input.category,
      cost_price: input.cost_price,
      sale_price: input.sale_price,
      min_stock: input.min_stock,
      stock: 0,
    })
    .select('id')
    .single()
  if (error) fail('Erro ao cadastrar o produto', error)

  // Estoque inicial entra como uma reposição, para o histórico e o custo médio ficarem certos
  if (input.stock > 0) {
    await restockProduct({
      productId: data.id,
      quantity: input.stock,
      unitCost: input.cost_price,
      day: todayString(),
      note: 'Estoque inicial',
    })
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await supabase
    .from('barberpro_products')
    .update({
      name: input.name,
      category: input.category,
      sale_price: input.sale_price,
      min_stock: input.min_stock,
    })
    .eq('id', id)
  if (error) fail('Erro ao salvar o produto', error)
}

// Produtos com histórico não são apagados: ficam arquivados e somem da lista e das vendas.
export async function setProductActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('barberpro_products').update({ active }).eq('id', id)
  if (error) fail('Erro ao atualizar o produto', error)
}

/* ---------- Estoque e vendas (funções do banco: atômicas) ---------- */

export async function sellProduct(params: {
  productId: string
  quantity: number
  unitPrice: number
  day: string
  clientId?: string | null
  note?: string
}): Promise<void> {
  const { error } = await supabase.rpc('barberpro_product_sell', {
    p_product_id: params.productId,
    p_qty: params.quantity,
    p_unit_price: params.unitPrice,
    p_day: params.day,
    p_client_id: params.clientId || null,
    p_note: params.note || null,
  })
  if (error) fail('Erro ao registrar a venda', error)
}

export async function restockProduct(params: {
  productId: string
  quantity: number
  unitCost: number
  day: string
  note?: string
}): Promise<void> {
  const { error } = await supabase.rpc('barberpro_product_restock', {
    p_product_id: params.productId,
    p_qty: params.quantity,
    p_unit_cost: params.unitCost,
    p_day: params.day,
    p_note: params.note || null,
  })
  if (error) fail('Erro ao repor o estoque', error)
}

export async function adjustStock(params: {
  productId: string
  delta: number
  day: string
  note?: string
}): Promise<void> {
  const { error } = await supabase.rpc('barberpro_product_adjust', {
    p_product_id: params.productId,
    p_delta: params.delta,
    p_day: params.day,
    p_note: params.note || null,
  })
  if (error) fail('Erro ao ajustar o estoque', error)
}

export async function refundSale(movementId: string): Promise<void> {
  const { error } = await supabase.rpc('barberpro_product_refund', { p_movement_id: movementId })
  if (error) fail('Erro ao estornar a venda', error)
}

/* ---------- Histórico ---------- */

export async function getMovements(limit = 200): Promise<ProductMovement[]> {
  const { data, error } = await supabase
    .from('barberpro_product_movements')
    .select(
      'id, product_id, kind, quantity, unit_cost, unit_price, day, note, reverses_id, created_at, barberpro_products (name), barberpro_clients (name)',
    )
    .order('day', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail('Erro ao buscar as movimentações', error)

  const rows = (data || []) as any[]
  const reversedIds = new Set(rows.filter((m) => m.reverses_id).map((m) => m.reverses_id as string))

  return rows.map((m) => ({
    id: m.id,
    product_id: m.product_id,
    product_name: m.barberpro_products?.name ?? 'Produto',
    kind: m.kind,
    quantity: Number(m.quantity),
    unit_cost: Number(m.unit_cost),
    unit_price: Number(m.unit_price),
    day: m.day,
    client_name: m.barberpro_clients?.name ?? null,
    note: m.note,
    reverses_id: m.reverses_id,
    reversed: m.kind === 'venda' && reversedIds.has(m.id),
  }))
}

/* ---------- Resumo do mês (Financeiro) e do período (Relatórios) ---------- */

export interface ProductSaleLine {
  id: string
  day: string
  product: string
  quantity: number // já líquido de estornos
  revenue: number
  cost: number
  profit: number
  client: string | null
}

export interface TopProduct {
  name: string
  units: number
  revenue: number
  profit: number
}

export interface ProductsPeriod {
  available: boolean // false enquanto supabase/products.sql não foi rodado
  sales: number // vendas líquidas (já sem estornos)
  cost: number // custo dos produtos vendidos
  losses: number // perdas e quebras (ajustes negativos), ao custo
  profit: number // vendas - custo - perdas
  units: number
  saleList: ProductSaleLine[]
  top: TopProduct[]
  dailySales: Record<string, number> // "2026-09-21" -> vendas do dia
  lowStock: number // produtos ativos com estoque no mínimo ou abaixo
}

const EMPTY: ProductsPeriod = {
  available: false,
  sales: 0,
  cost: 0,
  losses: 0,
  profit: 0,
  units: 0,
  saleList: [],
  top: [],
  dailySales: {},
  lowStock: 0,
}

// from e to em "YYYY-MM-DD"; "to" é exclusivo. Nunca lança erro: se as tabelas ainda não existem,
// devolve available = false e o resto do Financeiro segue funcionando.
export async function getProductsPeriod(from: string, toExclusive: string): Promise<ProductsPeriod> {
  const [mov, prods] = await Promise.all([
    supabase
      .from('barberpro_product_movements')
      .select(
        'id, kind, quantity, unit_cost, unit_price, day, reverses_id, created_at, barberpro_products (name), barberpro_clients (name)',
      )
      .in('kind', ['venda', 'estorno', 'ajuste'])
      .gte('day', from)
      .lt('day', toExclusive)
      .order('day', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('barberpro_products').select('stock, min_stock, active').eq('active', true),
  ])

  if (mov.error) return { ...EMPTY }

  let sales = 0
  let cost = 0
  let losses = 0
  let units = 0
  const dailySales: Record<string, number> = {}
  const perProduct = new Map<string, TopProduct>()
  const lines: ProductSaleLine[] = []
  const rows = (mov.data || []) as any[]
  // Estorno fica no mesmo dia da venda; a venda estornada não aparece na lista (já saiu dos totais)
  const reversedIds = new Set(rows.filter((m) => m.reverses_id).map((m) => m.reverses_id as string))

  for (const m of rows) {
    const qty = Number(m.quantity)
    const unitCost = Number(m.unit_cost)
    const unitPrice = Number(m.unit_price)
    const name = m.barberpro_products?.name ?? 'Produto'

    if (m.kind === 'ajuste') {
      if (qty < 0) losses += -qty * unitCost // só perdas pesam no lucro
      continue
    }

    // venda: quantity negativa; estorno: quantity positiva (anula a venda)
    const soldUnits = -qty
    const revenue = soldUnits * unitPrice
    const lineCost = soldUnits * unitCost
    sales += revenue
    cost += lineCost
    units += soldUnits
    dailySales[m.day] = (dailySales[m.day] || 0) + revenue

    const top = perProduct.get(name) || { name, units: 0, revenue: 0, profit: 0 }
    top.units += soldUnits
    top.revenue += revenue
    top.profit += revenue - lineCost
    perProduct.set(name, top)

    if (m.kind === 'venda' && !reversedIds.has(m.id)) {
      lines.push({
        id: m.id,
        day: m.day,
        product: name,
        quantity: -qty,
        revenue,
        cost: lineCost,
        profit: revenue - lineCost,
        client: m.barberpro_clients?.name ?? null,
      })
    }
  }

  const lowStock = prods.error
    ? 0
    : ((prods.data || []) as any[]).filter((p) => Number(p.stock) <= Number(p.min_stock)).length

  return {
    available: true,
    sales,
    cost,
    losses,
    profit: sales - cost - losses,
    units,
    saleList: lines,
    top: Array.from(perProduct.values())
      .filter((t) => t.units > 0)
      .sort((a, b) => b.revenue - a.revenue),
    dailySales,
    lowStock,
  }
}

// month: 0 = janeiro
export async function getMonthProducts(year: number, month: number): Promise<ProductsPeriod> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const from = `${year}-${pad(month + 1)}-01`
  const next = new Date(year, month + 1, 1)
  const to = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`
  return getProductsPeriod(from, to)
}
