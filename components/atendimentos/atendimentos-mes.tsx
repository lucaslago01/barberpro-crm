'use client'

import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  CircleDollarSign,
  Crown,
  Receipt,
  Search,
  Pencil,
  Scissors,
  ListChecks,
  BarChart3,
  History,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import { UserAvatar } from '@/components/dashboard/user-avatar'
import { getAttendances, type AttendanceRecord } from '@/lib/supabase-attendances'
import { getPeriodStats, getPreset, type Period, type PeriodPreset, type PeriodStats } from '@/lib/supabase-reports'
import { updateAppointmentNotes } from '@/lib/supabase-data'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'mes', label: 'Este mês' },
  { key: 'mes-passado', label: 'Mês passado' },
  { key: '7dias', label: 'Últimos 7 dias' },
  { key: '30dias', label: 'Últimos 30 dias' },
  { key: 'custom', label: 'Datas' },
]

const statToneMap: Record<string, string> = {
  gold: 'bg-gold/12 text-gold',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
  muted: 'bg-white/5 text-muted-foreground',
}

function parseInputDate(value: string) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function shortDay(day: string) {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

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
    <div className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/30">
      <span className={cn('grid size-10 place-items-center rounded-xl', statToneMap[tone])}>
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {detail && <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>}
    </div>
  )
}

function EditNotesModal({
  record,
  onClose,
  onSaved,
}: {
  record: AttendanceRecord
  onClose: () => void
  onSaved: () => void
}) {
  const [notes, setNotes] = useState(record.notes)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateAppointmentNotes(record.id, notes)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar observações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Editar observações</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-3 rounded-lg border border-border bg-background/40 px-3 py-2">
          <p className="text-sm font-medium">{record.client}</p>
          <p className="text-xs text-muted-foreground">
            {record.service} · {shortDay(record.day)} às {record.time}
          </p>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold/40"
          placeholder="Observações sobre o atendimento..."
        />

        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AttendanceRow({
  record,
  onEdit,
}: {
  record: AttendanceRecord
  onEdit: () => void
}) {
  return (
    <tr className="group border-t border-border transition-colors hover:bg-white/[0.02]">
      <td className="py-3 pr-6">
        <div className="flex items-center gap-3">
          <UserAvatar name={record.client} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{record.client}</p>
            <p className="truncate text-xs text-muted-foreground">{record.whatsapp}</p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-6">
        <span className="inline-flex items-center gap-1.5 text-sm">
          <Scissors className="size-3.5 text-gold/70" />
          {record.service}
        </span>
      </td>
      <td className="hidden py-3 pr-6 md:table-cell">
        <p className="text-sm">{shortDay(record.day)}</p>
        <p className="text-xs text-muted-foreground">{record.time}</p>
      </td>
      <td className="hidden py-3 pr-6 text-sm text-muted-foreground lg:table-cell">
        {record.duration} min
      </td>
      <td className="py-3 pr-6 text-sm font-semibold tabular-nums sm:table-cell">
        {record.isClub ? (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <Crown className="size-3.5" />
            Clube
          </span>
        ) : (
          currency.format(record.price)
        )}
      </td>
      <td className="py-3 pr-6">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
            record.status === 'concluido'
              ? 'bg-success/12 text-success'
              : record.status === 'faltou'
                ? 'bg-danger/12 text-danger'
                : record.status === 'cancelado'
                  ? 'bg-white/5 text-muted-foreground'
                  : 'bg-info/12 text-info',
          )}
        >
          {record.status === 'concluido'
            ? 'Concluído'
            : record.status === 'faltou'
              ? 'Faltou'
              : record.status === 'cancelado'
                ? 'Cancelado'
                : record.status}
        </span>
      </td>
      <td className="py-3 pr-4">
        <button
          onClick={onEdit}
          aria-label="Editar observações"
          title="Editar observações"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
      </td>
    </tr>
  )
}

export function AtendimentosMes() {
  const [preset, setPreset] = useState<PeriodPreset>('mes')
  const [period, setPeriod] = useState<Period>(() => getPreset('mes'))
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<PeriodStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const fromKey = period.from.getTime()
  const toKey = period.to.getTime()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const current: Period = { from: new Date(fromKey), to: new Date(toKey) }
        const [r, s] = await Promise.all([
          getAttendances(current, showAll),
          getPeriodStats(current),
        ])
        if (cancelled) return
        setRecords(r)
        setStats(s)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar atendimentos')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [fromKey, toKey, showAll, reloadKey])

  function choosePreset(key: PeriodPreset) {
    setPreset(key)
    if (key !== 'custom') setPeriod(getPreset(key))
  }

  function applyCustom(fromStr: string, toStr: string) {
    const from = parseInputDate(fromStr)
    const to = parseInputDate(toStr)
    if (from && to && to.getTime() >= from.getTime()) {
      setPeriod({ from, to })
    }
  }

  const filtered = records.filter((r) => {
    const q = search.trim().toLowerCase()
    return (
      q === '' ||
      r.client.toLowerCase().includes(q) ||
      r.service.toLowerCase().includes(q)
    )
  })

  const fieldClass =
    'h-10 rounded-lg border border-border bg-background/40 px-3 text-sm outline-none focus:border-gold/40'

  const customInvalid =
    preset === 'custom' && customFrom !== '' && customTo !== '' && customTo < customFrom

  return (
    <div className="space-y-5">
      {editingRecord && (
        <EditNotesModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}

      {/* Período */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => choosePreset(p.key)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                preset === p.key
                  ? 'border-gold/40 bg-gold/12 text-gold'
                  : 'border-border bg-background/30 text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">De</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value)
                  applyCustom(e.target.value, customTo)
                }}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Até</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value)
                  applyCustom(customFrom, e.target.value)
                }}
                className={fieldClass}
              />
            </div>
            {customInvalid && (
              <p className="text-sm text-red-500">A data final precisa ser depois da inicial.</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          Erro: {error}
        </div>
      )}

      {/* Cartões */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Atendimentos concluídos"
            value={String(stats.completed)}
            detail={stats.clubVisits > 0 ? `+${stats.clubVisits} do clube` : undefined}
            icon={CalendarCheck}
            tone="gold"
          />
          <StatCard
            label="Faturamento avulso"
            value={currency.format(stats.walkIn)}
            icon={CircleDollarSign}
            tone="success"
          />
          <StatCard
            label="Ticket médio"
            value={currency.format(stats.avgTicket)}
            icon={Receipt}
            tone="info"
          />
          <StatCard
            label="Atendimentos do clube"
            value={String(stats.clubVisits)}
            icon={Crown}
            tone="muted"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        {/* Tabela */}
        <Panel>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente ou serviço..."
                className="h-10 w-full rounded-lg border border-border bg-background/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/40"
              />
            </div>
            <button
              onClick={() => setShowAll((v) => !v)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                showAll
                  ? 'border-gold/40 bg-gold/12 text-gold'
                  : 'border-border bg-background/40 text-muted-foreground hover:text-foreground',
              )}
            >
              {showAll ? 'Mostrando todos os status' : 'Só concluídos'}
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="py-2.5 pr-6 font-medium">Cliente</th>
                    <th className="py-2.5 pr-6 font-medium">Serviço</th>
                    <th className="hidden py-2.5 pr-6 font-medium md:table-cell">Data e horário</th>
                    <th className="hidden py-2.5 pr-6 font-medium lg:table-cell">Duração</th>
                    <th className="py-2.5 pr-6 font-medium">Valor</th>
                    <th className="py-2.5 pr-6 font-medium">Status</th>
                    <th className="py-2.5 pr-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <AttendanceRow key={r.id} record={r} onEdit={() => setEditingRecord(r)} />
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="grid place-items-center gap-2 py-16 text-center">
                  <Scissors className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum atendimento encontrado com esses filtros.
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && (
            <div className="border-t border-border p-4">
              <p className="text-xs text-muted-foreground">
                Mostrando {filtered.length} de {records.length} atendimentos
              </p>
            </div>
          )}
        </Panel>

        {/* Painéis */}
        <aside className="space-y-5">
          {stats && (
            <Panel>
              <PanelHeader icon={<ListChecks className="size-[18px]" />} title="Serviços mais realizados" />
              {stats.byService.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-muted-foreground">Nenhum atendimento no período.</p>
              ) : (
                <ul className="space-y-3 px-4 pb-4">
                  {stats.byService.slice(0, 6).map((s) => {
                    const total = stats.byService.reduce((sum, x) => sum + x.count, 0)
                    const percent = total > 0 ? Math.round((s.count / total) * 100) : 0
                    return (
                      <li key={s.name} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate">{s.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {s.count}
                            <span className="ml-2 text-xs">{percent}%</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-gold/70" style={{ width: `${percent}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Panel>
          )}

          {stats && (
            <Panel>
              <PanelHeader icon={<BarChart3 className="size-[18px]" />} title="Faturamento por serviço" />
              {stats.byService.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-muted-foreground">Nenhum atendimento no período.</p>
              ) : (
                <ul className="space-y-0.5 px-3 pb-3">
                  {stats.byService.map((s) => (
                    <li
                      key={s.name}
                      className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-white/[0.03]"
                    >
                      <span className="truncate text-muted-foreground">{s.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {currency.format(s.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel>
            <PanelHeader icon={<History className="size-[18px]" />} title="Últimos atendimentos" />
            {records.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">Nenhum atendimento no período.</p>
            ) : (
              <ul className="space-y-0.5 px-3 pb-3">
                {records.slice(0, 6).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
                  >
                    <UserAvatar name={r.client} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.client}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.service} · {r.isClub ? 'Clube' : currency.format(r.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {shortDay(r.day)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}