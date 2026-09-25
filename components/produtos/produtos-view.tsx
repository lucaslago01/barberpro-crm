'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Undo2,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Panel } from '@/components/dashboard/panel'
import { getClients } from '@/lib/supabase-data'
import { todayString } from '@/lib/supabase-finance'
import {
  PRODUCT_CATEGORIES,
  adjustStock,
  createProduct,
  getMovements,
  getProducts,
  refundSale,
  restockProduct,
  sellProduct,
  setProductActive,
  updateProduct,
  type MovementKind,
  type Product,
  type ProductMovement,
} from '@/lib/supabase-products'
import type { Client } from '@/lib/types'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const fieldClass =
  'w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40'

function parseMoney(value: string) {
  const n = Number(value.trim().replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function parseWhole(value: string) {
  const n = Number(value.trim())
  return Number.isInteger(n) ? n : NaN
}

// "2026-09-21" -> "21/09"
function shortDay(day: string) {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

function cap(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function marginPct(cost: number, price: number) {
  return price > 0 ? Math.round(((price - cost) / price) * 100) : 0
}

/* ---------- Estrutura de janela ---------- */

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  error,
  actions,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  error?: string | null
  actions: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {subtitle && <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>}
        <div className={cn('space-y-3', !subtitle && 'mt-3')}>{children}</div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  )
}

function CancelButton({ onClick, label = 'Cancelar' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground"
    >
      {label}
    </button>
  )
}

function PrimaryButton({
  onClick,
  saving,
  label,
  savingLabel = 'Salvando...',
  danger,
}: {
  onClick: () => void
  saving: boolean
  label: string
  savingLabel?: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={cn(
        'rounded-lg px-3.5 py-2 text-sm font-semibold hover:brightness-105 disabled:opacity-60',
        danger ? 'bg-danger text-white' : 'bg-gold text-primary-foreground',
      )}
    >
      {saving ? savingLabel : label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

// Executa uma ação de salvar com trava contra clique duplo e mostra o erro na janela
function useSaver(onDone: () => void) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(false)

  const run = useCallback(
    async (action: () => Promise<void>) => {
      if (ref.current) return
      ref.current = true
      setSaving(true)
      setError(null)
      try {
        await action()
        onDone()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
      } finally {
        ref.current = false
        setSaving(false)
      }
    },
    [onDone],
  )

  return { saving, error, setError, run }
}

/* ---------- Janela: cadastrar / editar produto ---------- */

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const editing = product !== null
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? PRODUCT_CATEGORIES[0])
  const [salePrice, setSalePrice] = useState(product ? String(product.sale_price) : '')
  const [costPrice, setCostPrice] = useState('')
  const [stock, setStock] = useState('')
  const [minStock, setMinStock] = useState(product ? String(product.min_stock) : '0')
  const done = useCallback(() => {
    onSaved()
    onClose()
  }, [onSaved, onClose])
  const { saving, error, setError, run } = useSaver(done)

  const sale = parseMoney(salePrice)
  const cost = editing ? product.cost_price : parseMoney(costPrice)

  function handleSave() {
    setError(null)
    const min = parseWhole(minStock || '0')
    if (!name.trim()) return setError('Escreva o nome do produto.')
    if (!(sale >= 0)) return setError('Informe o preço de venda.')
    if (!(min >= 0)) return setError('O estoque mínimo precisa ser um número inteiro.')

    if (editing) {
      run(() =>
        updateProduct(product.id, {
          name: name.trim(),
          category,
          sale_price: sale,
          min_stock: min,
        }),
      )
      return
    }

    const startCost = parseMoney(costPrice || '0')
    const startStock = parseWhole(stock || '0')
    if (!(startCost >= 0)) return setError('Informe o custo por unidade.')
    if (!(startStock >= 0)) return setError('O estoque inicial precisa ser um número inteiro.')
    run(() =>
      createProduct({
        name: name.trim(),
        category,
        sale_price: sale,
        min_stock: min,
        cost_price: startCost,
        stock: startStock,
      }),
    )
  }

  return (
    <ModalShell
      title={editing ? 'Editar produto' : 'Novo produto'}
      subtitle={
        editing
          ? 'O custo e o estoque mudam pela reposição e pelos ajustes, para o histórico ficar certo.'
          : undefined
      }
      onClose={onClose}
      error={error}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} saving={saving} label={editing ? 'Salvar' : 'Cadastrar'} />
        </>
      }
    >
      <Field label="Nome">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          placeholder="Ex.: Pomada modeladora"
        />
      </Field>
      <Field label="Categoria">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {cap(c)}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {!editing && (
          <Field label="Custo por unidade (R$)">
            <input
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
              placeholder="0,00"
            />
          </Field>
        )}
        <Field label="Preço de venda (R$)">
          <input
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            inputMode="decimal"
            className={fieldClass}
            placeholder="0,00"
          />
        </Field>
        {!editing && (
          <Field label="Estoque inicial">
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              inputMode="numeric"
              className={fieldClass}
              placeholder="0"
            />
          </Field>
        )}
        <Field label="Estoque mínimo">
          <input
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            inputMode="numeric"
            className={fieldClass}
            placeholder="0"
          />
        </Field>
      </div>
      {sale > 0 && cost >= 0 && (
        <p className="text-xs text-muted-foreground">
          Lucro por unidade:{' '}
          <span className="font-medium text-foreground">{currency.format(sale - cost)}</span> ·
          margem {marginPct(cost, sale)}%
        </p>
      )}
      {!editing && (
        <p className="text-xs leading-snug text-muted-foreground">
          O aviso de estoque baixo aparece quando o estoque chega ao mínimo.
        </p>
      )}
    </ModalShell>
  )
}

/* ---------- Janela: vender ---------- */

function SellModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product
  onClose: () => void
  onSaved: () => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [quantity, setQuantity] = useState('1')
  const [price, setPrice] = useState(String(product.sale_price))
  const [day, setDay] = useState(todayString())
  const [clientId, setClientId] = useState('')
  const [note, setNote] = useState('')
  const done = useCallback(() => {
    onSaved()
    onClose()
  }, [onSaved, onClose])
  const { saving, error, setError, run } = useSaver(done)

  useEffect(() => {
    let cancelled = false
    getClients()
      .then((data) => {
        if (!cancelled) setClients(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const qty = parseWhole(quantity)
  const unit = parseMoney(price)
  const total = qty > 0 && unit >= 0 ? qty * unit : 0
  const profit = qty > 0 && unit >= 0 ? qty * (unit - product.cost_price) : 0

  function handleSave() {
    setError(null)
    if (!(qty > 0)) return setError('A quantidade precisa ser um número inteiro maior que zero.')
    if (qty > product.stock) return setError(`Estoque insuficiente: restam ${product.stock}.`)
    if (!(unit >= 0)) return setError('Informe o preço.')
    if (!day) return setError('Escolha a data.')
    run(() =>
      sellProduct({
        productId: product.id,
        quantity: qty,
        unitPrice: unit,
        day,
        clientId: clientId || null,
        note,
      }),
    )
  }

  return (
    <ModalShell
      title="Vender produto"
      subtitle={`${product.name} · ${product.stock} em estoque`}
      onClose={onClose}
      error={error}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} saving={saving} label="Registrar venda" />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantidade">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="numeric"
            className={fieldClass}
          />
        </Field>
        <Field label="Preço por unidade (R$)">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className={fieldClass}
          />
        </Field>
      </div>
      <Field label="Data">
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={fieldClass} />
      </Field>
      <Field label="Cliente (opcional)">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={fieldClass}>
          <option value="">Sem cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` · ${c.phone}` : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Observação (opcional)">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={fieldClass}
          placeholder="Ex.: pago no Pix"
        />
      </Field>
      <div className="rounded-xl border border-border bg-background/30 px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total da venda</span>
          <span className="font-semibold tabular-nums">{currency.format(total)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Lucro (custo {currency.format(product.cost_price)} cada)</span>
          <span className={cn('font-medium tabular-nums', profit < 0 ? 'text-danger' : 'text-success')}>
            {currency.format(profit)}
          </span>
        </div>
      </div>
    </ModalShell>
  )
}

/* ---------- Janela: repor estoque ---------- */

function RestockModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product
  onClose: () => void
  onSaved: () => void
}) {
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState(String(product.cost_price))
  const [day, setDay] = useState(todayString())
  const [note, setNote] = useState('')
  const done = useCallback(() => {
    onSaved()
    onClose()
  }, [onSaved, onClose])
  const { saving, error, setError, run } = useSaver(done)

  const qty = parseWhole(quantity)
  const cost = parseMoney(unitCost)
  const valid = qty > 0 && cost >= 0
  const newAvg = valid ? (product.stock * product.cost_price + qty * cost) / (product.stock + qty) : null

  function handleSave() {
    setError(null)
    if (!(qty > 0)) return setError('A quantidade precisa ser um número inteiro maior que zero.')
    if (!(cost >= 0)) return setError('Informe o custo por unidade.')
    if (!day) return setError('Escolha a data.')
    run(() => restockProduct({ productId: product.id, quantity: qty, unitCost: cost, day, note }))
  }

  return (
    <ModalShell
      title="Repor estoque"
      subtitle={`${product.name} · ${product.stock} em estoque`}
      onClose={onClose}
      error={error}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} saving={saving} label="Repor" />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantidade comprada">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="numeric"
            className={fieldClass}
            placeholder="0"
          />
        </Field>
        <Field label="Custo por unidade (R$)">
          <input
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            inputMode="decimal"
            className={fieldClass}
          />
        </Field>
      </div>
      <Field label="Data da compra">
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={fieldClass} />
      </Field>
      <Field label="Observação (opcional)">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={fieldClass}
          placeholder="Ex.: fornecedor, nota"
        />
      </Field>
      {newAvg !== null && (
        <p className="text-xs leading-snug text-muted-foreground">
          Estoque passa a {product.stock + qty}. O custo médio vira{' '}
          <span className="font-medium text-foreground">{currency.format(newAvg)}</span> por
          unidade, e é ele que entra no lucro das próximas vendas.
        </p>
      )}
    </ModalShell>
  )
}

/* ---------- Janela: ajustar estoque ---------- */

function AdjustModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product
  onClose: () => void
  onSaved: () => void
}) {
  const [direction, setDirection] = useState<'loss' | 'gain'>('loss')
  const [quantity, setQuantity] = useState('')
  const [day, setDay] = useState(todayString())
  const [note, setNote] = useState('')
  const done = useCallback(() => {
    onSaved()
    onClose()
  }, [onSaved, onClose])
  const { saving, error, setError, run } = useSaver(done)

  const qty = parseWhole(quantity)

  function handleSave() {
    setError(null)
    if (!(qty > 0)) return setError('A quantidade precisa ser um número inteiro maior que zero.')
    if (direction === 'loss' && qty > product.stock) {
      return setError(`O estoque não pode ficar negativo: há ${product.stock}.`)
    }
    if (!day) return setError('Escolha a data.')
    run(() =>
      adjustStock({
        productId: product.id,
        delta: direction === 'loss' ? -qty : qty,
        day,
        note,
      }),
    )
  }

  return (
    <ModalShell
      title="Ajustar estoque"
      subtitle={`${product.name} · ${product.stock} em estoque`}
      onClose={onClose}
      error={error}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <PrimaryButton onClick={handleSave} saving={saving} label="Ajustar" />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/40 p-1">
        {(
          [
            ['loss', 'Perda ou quebra'],
            ['gain', 'Correção (+)'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setDirection(key)}
            className={
              direction === key
                ? 'rounded-md bg-gold px-2 py-1.5 text-xs font-semibold text-primary-foreground'
                : 'rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground'
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantidade">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="numeric"
            className={fieldClass}
            placeholder="0"
          />
        </Field>
        <Field label="Data">
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={fieldClass} />
        </Field>
      </div>
      <Field label="Motivo (opcional)">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={fieldClass}
          placeholder={direction === 'loss' ? 'Ex.: quebrou, venceu' : 'Ex.: contagem do estoque'}
        />
      </Field>
      <p className="text-xs leading-snug text-muted-foreground">
        {direction === 'loss'
          ? `Sai do estoque e entra como perda no Financeiro, ao custo de ${currency.format(product.cost_price)} por unidade.`
          : 'Soma ao estoque sem custo e sem efeito no lucro. Para compras, use Repor.'}
      </p>
    </ModalShell>
  )
}

/* ---------- Janela: confirmar (arquivar / estornar) ---------- */

function ConfirmModal({
  title,
  message,
  label,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  title: string
  message: string
  label: string
  confirmLabel: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const { saving, error, run } = useSaver(onClose)
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      error={error}
      actions={
        <>
          <CancelButton onClick={onClose} label="Voltar" />
          <PrimaryButton
            onClick={() => run(onConfirm)}
            saving={saving}
            label={confirmLabel}
            savingLabel="Aguarde..."
            danger={danger}
          />
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
        <p className="truncate text-sm font-medium">{label}</p>
      </div>
    </ModalShell>
  )
}

/* ---------- Cartão de número ---------- */

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  detail?: string
  icon: LucideIcon
  tone: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', tone)}>
          <Icon className="size-[18px]" />
        </span>
        <p className="min-w-0 text-xs font-medium uppercase leading-tight tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 break-words text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{value}</p>
      {detail && <p className="mt-1 text-xs leading-snug text-muted-foreground">{detail}</p>}
    </div>
  )
}

function StockBadge({ product }: { product: Product }) {
  if (product.stock === 0) {
    return (
      <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">
        Sem estoque
      </span>
    )
  }
  if (product.stock <= product.min_stock) {
    return (
      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold">
        Estoque baixo
      </span>
    )
  }
  return null
}

const KIND_LABEL: Record<MovementKind, string> = {
  venda: 'Venda',
  entrada: 'Reposição',
  ajuste: 'Ajuste',
  estorno: 'Estorno',
}

const KIND_TONE: Record<MovementKind, string> = {
  venda: 'bg-success/15 text-success',
  entrada: 'bg-info/15 text-info',
  ajuste: 'bg-gold/15 text-gold',
  estorno: 'bg-danger/15 text-danger',
}

/* ---------- Tela ---------- */

type Modal =
  | { type: 'new' }
  | { type: 'edit'; product: Product }
  | { type: 'sell'; product: Product }
  | { type: 'restock'; product: Product }
  | { type: 'adjust'; product: Product }
  | { type: 'archive'; product: Product }
  | { type: 'refund'; movement: ProductMovement }

export function ProdutosView() {
  const [tab, setTab] = useState<'produtos' | 'movimentacoes'>('produtos')
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<ProductMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [modal, setModal] = useState<Modal | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('todas')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setError(null)
        const [p, m] = await Promise.all([getProducts(), getMovements()])
        if (!cancelled) {
          setProducts(p)
          setMovements(m)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar os produtos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  const closeModal = useCallback(() => setModal(null), [])

  // Fecha o menu "Mais ações" ao clicar fora
  useEffect(() => {
    if (!menuFor) return
    const close = () => setMenuFor(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuFor])

  const summary = useMemo(() => {
    const units = products.reduce((s, p) => s + p.stock, 0)
    const value = products.reduce((s, p) => s + p.stock * p.cost_price, 0)
    const low = products.filter((p) => p.stock <= p.min_stock).length
    return { units, value, low }
  }, [products])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(
      (p) =>
        (category === 'todas' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q)),
    )
  }, [products, search, category])

  return (
    <div className="space-y-5">
      {modal?.type === 'new' && <ProductModal product={null} onClose={closeModal} onSaved={reload} />}
      {modal?.type === 'edit' && (
        <ProductModal product={modal.product} onClose={closeModal} onSaved={reload} />
      )}
      {modal?.type === 'sell' && <SellModal product={modal.product} onClose={closeModal} onSaved={reload} />}
      {modal?.type === 'restock' && (
        <RestockModal product={modal.product} onClose={closeModal} onSaved={reload} />
      )}
      {modal?.type === 'adjust' && (
        <AdjustModal product={modal.product} onClose={closeModal} onSaved={reload} />
      )}
      {modal?.type === 'archive' && (
        <ConfirmModal
          title="Arquivar produto"
          message="Ele sai da lista e não pode mais ser vendido. O histórico e o Financeiro continuam como estão."
          label={modal.product.name}
          confirmLabel="Arquivar"
          danger
          onClose={closeModal}
          onConfirm={async () => {
            await setProductActive(modal.product.id, false)
            reload()
          }}
        />
      )}
      {modal?.type === 'refund' && (
        <ConfirmModal
          title="Estornar venda"
          message="A venda é desfeita: o produto volta ao estoque e o valor sai do Financeiro daquele mês."
          label={`${modal.movement.product_name} · ${-modal.movement.quantity} un. · ${currency.format(
            -modal.movement.quantity * modal.movement.unit_price,
          )}`}
          confirmLabel="Estornar"
          danger
          onClose={closeModal}
          onConfirm={async () => {
            await refundSale(modal.movement.id)
            reload()
          }}
        />
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-background/40 p-1 sm:w-auto">
          {(
            [
              ['produtos', 'Produtos'],
              ['movimentacoes', 'Movimentações'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={
                tab === key
                  ? 'rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground'
                  : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground'
              }
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal({ type: 'new' })}
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 sm:h-10 sm:w-auto"
        >
          <Plus className="size-4" />
          Novo produto
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && !error ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        !error && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard
                label="Produtos"
                value={String(products.length)}
                detail="Ativos no cadastro"
                icon={Package}
                tone="bg-gold/12 text-gold"
              />
              <StatCard
                label="Unidades"
                value={String(summary.units)}
                detail="Total em estoque"
                icon={Boxes}
                tone="bg-info/12 text-info"
              />
              <StatCard
                label="Valor em estoque"
                value={currency.format(summary.value)}
                detail="Pelo custo médio"
                icon={Wallet}
                tone="bg-success/12 text-success"
              />
              <StatCard
                label="Estoque baixo"
                value={String(summary.low)}
                detail={summary.low > 0 ? 'Produto(s) no mínimo ou sem estoque' : 'Tudo acima do mínimo'}
                icon={AlertTriangle}
                tone={summary.low > 0 ? 'bg-danger/12 text-danger' : 'bg-white/5 text-muted-foreground'}
              />
            </div>

            {tab === 'produtos' ? (
              <Panel className="p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar produto"
                      className={cn(fieldClass, 'pl-9')}
                    />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={cn(fieldClass, 'sm:w-52')}
                  >
                    <option value="todas">Todas as categorias</option>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {cap(c)}
                      </option>
                    ))}
                  </select>
                </div>

                {products.length === 0 ? (
                  <div className="py-10 text-center">
                    <Package className="mx-auto size-8 text-muted-foreground/50" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Nenhum produto cadastrado ainda. Cadastre água, cerveja, pomada e o que mais você
                      vende.
                    </p>
                  </div>
                ) : visible.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum produto encontrado.
                  </p>
                ) : (
                  <ul className="-mx-2 divide-y divide-border/50">
                    {visible.map((p) => (
                      <li key={p.id} className="relative px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                          <div className="min-w-0 flex-1 basis-56">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold">{p.name}</p>
                              <StockBadge product={p} />
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {cap(p.category)} · Custo {currency.format(p.cost_price)} · Venda{' '}
                              {currency.format(p.sale_price)} · Margem{' '}
                              {marginPct(p.cost_price, p.sale_price)}%
                              {p.min_stock > 0 ? ` · Mín. ${p.min_stock}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="shrink-0 text-right">
                              <p className="text-lg font-bold leading-none tabular-nums">{p.stock}</p>
                              <p className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">
                                em estoque
                              </p>
                            </div>
                            <button
                              onClick={() => setModal({ type: 'sell', product: p })}
                              disabled={p.stock === 0}
                              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gold px-3 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9"
                            >
                              <ShoppingBag className="size-4" />
                              Vender
                            </button>
                            <button
                              onClick={() => setModal({ type: 'restock', product: p })}
                              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground hover:text-foreground sm:h-9"
                            >
                              <Plus className="size-4" />
                              Repor
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                                aria-label="Mais ações"
                                className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground sm:size-9"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                              {menuFor === p.id && (
                                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                                  {(
                                    [
                                      ['Ajustar estoque', 'adjust'],
                                      ['Editar produto', 'edit'],
                                      ['Arquivar', 'archive'],
                                    ] as const
                                  ).map(([label, type]) => (
                                    <button
                                      key={type}
                                      onClick={() => {
                                        setMenuFor(null)
                                        setModal({ type, product: p })
                                      }}
                                      className={cn(
                                        'block w-full px-3 py-2.5 text-left text-sm hover:bg-white/5',
                                        type === 'archive' && 'text-danger',
                                      )}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ) : (
              <Panel className="p-5">
                {movements.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma movimentação ainda. Vendas, reposições e ajustes aparecem aqui.
                  </p>
                ) : (
                  <ul className="-mx-2 divide-y divide-border/50">
                    {movements.map((m) => {
                      const value =
                        m.kind === 'venda' || m.kind === 'estorno'
                          ? -m.quantity * m.unit_price
                          : m.kind === 'entrada'
                            ? -m.quantity * m.unit_cost
                            : null
                      return (
                        <li
                          key={m.id}
                          className={cn(
                            'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5',
                            m.reversed && 'opacity-60',
                          )}
                        >
                          <div className="min-w-0 flex-1 basis-48">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                  KIND_TONE[m.kind],
                                )}
                              >
                                {KIND_LABEL[m.kind]}
                              </span>
                              <p className="truncate text-sm font-medium">{m.product_name}</p>
                              {m.reversed && (
                                <span className="text-[11px] text-muted-foreground">estornada</span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {shortDay(m.day)}
                              {m.client_name ? ` · ${m.client_name}` : ''}
                              {m.note ? ` · ${m.note}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold tabular-nums">
                                {m.quantity > 0 ? '+' : ''}
                                {m.quantity} un.
                              </p>
                              {value !== null && (
                                <p
                                  className={cn(
                                    'text-xs tabular-nums',
                                    m.kind === 'entrada'
                                      ? 'text-muted-foreground'
                                      : value >= 0
                                        ? 'text-success'
                                        : 'text-danger',
                                  )}
                                >
                                  {m.kind === 'entrada'
                                    ? `custo ${currency.format(Math.abs(value))}`
                                    : `${value >= 0 ? '+ ' : '- '}${currency.format(Math.abs(value))}`}
                                </p>
                              )}
                            </div>
                            {m.kind === 'venda' && !m.reversed && (
                              <button
                                onClick={() => setModal({ type: 'refund', movement: m })}
                                aria-label="Estornar venda"
                                title="Estornar venda"
                                className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/15 hover:text-danger sm:size-8"
                              >
                                <Undo2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Panel>
            )}
          </>
        )
      )}
    </div>
  )
}
