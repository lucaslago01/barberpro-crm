'use client'

import { useEffect, useState } from 'react'
import { Check, MessageCircle, Gift, Clock, BellOff } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/dashboard/panel'
import { getSettings, updateSettings } from '@/lib/supabase-settings'

const textareaClass =
  'w-full resize-none rounded-xl border border-border bg-background/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/40 focus:ring-1 focus:ring-gold/30 leading-relaxed'

type MsgKey = 'msg_boas_vindas' | 'msg_aniversario' | 'msg_lembrete' | 'msg_opt_out'

const mensagens: {
  key: MsgKey
  label: string
  description: string
  prefix?: string
  hint?: string
  icon: React.ReactNode
  rows: number
}[] = [
  {
    key: 'msg_boas_vindas',
    label: 'Boas-vindas / Resposta automática',
    description: 'Enviada quando o cliente manda qualquer mensagem no WhatsApp.',
    icon: <MessageCircle className="size-[18px]" />,
    rows: 8,
  },
  {
    key: 'msg_aniversario',
    label: 'Parabéns de aniversário',
    description: 'Enviada automaticamente no dia do aniversário do cliente.',
    prefix: '🎂 Feliz aniversário, [nome do cliente]!',
    icon: <Gift className="size-[18px]" />,
    rows: 3,
  },
  {
    key: 'msg_lembrete',
    label: 'Lembrete de agendamento',
    description: 'Enviada antes do horário agendado como lembrete.',
    prefix: 'Olá, [nome do cliente]! Passando para lembrar do seu agendamento amanhã às [horário] ([serviço]).',
    icon: <Clock className="size-[18px]" />,
    rows: 3,
  },
  {
    key: 'msg_opt_out',
    label: 'Confirmação de descadastro',
    description: 'Enviada quando o cliente responde PARAR para sair das campanhas.',
    icon: <BellOff className="size-[18px]" />,
    rows: 3,
  },
]

export function MensagensSettings() {
  const [values, setValues] = useState<Record<MsgKey, string>>({
    msg_boas_vindas: '',
    msg_aniversario: '',
    msg_lembrete: '',
    msg_opt_out: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSettings()
      .then((s) => {
        setValues({
          msg_boas_vindas: (s as any).msgBoasVindas || '',
          msg_aniversario: (s as any).msgAniversario || '',
          msg_lembrete: (s as any).msgLembrete || '',
          msg_opt_out: (s as any).msgOptOut || '',
        })
      })
      .catch(() => setError('Erro ao carregar mensagens'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)
      await updateSettings({
        barbershopName: '',
        phone: '',
        address: '',
        instagram: '',
        description: '',
        msgBoasVindas: values.msg_boas_vindas,
        msgAniversario: values.msg_aniversario,
        msgLembrete: values.msg_lembrete,
        msgOptOut: values.msg_opt_out,
      } as any)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Erro ao salvar mensagens')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-4">
      {mensagens.map((m) => (
        <Panel key={m.key} className="p-5">
          <PanelHeader className="px-0 pt-0" icon={m.icon} title={m.label} />
          <p className="-mt-2 mb-3 text-sm text-muted-foreground">{m.description}</p>

          {m.prefix && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-white/5 px-3 py-2">
              <span className="text-xs text-muted-foreground">Início fixo:</span>
              <span className="text-sm font-medium text-gold">{m.prefix}</span>
            </div>
          )}

          <textarea
            value={values[m.key]}
            onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
            rows={m.rows}
            placeholder="Digite o restante da mensagem..."
            className={textareaClass}
          />
          {m.hint && (
            <p className="mt-1.5 text-xs text-muted-foreground">💡 {m.hint}</p>
          )}
        </Panel>
      ))}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        {saved && (
          <span className="mr-auto inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1.5 text-sm font-medium text-success">
            <Check className="size-4" />
            Mensagens salvas
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-primary-foreground hover:bg-gold/90 disabled:opacity-60"
        >
          <Check className="size-4" />
          {saving ? 'Salvando...' : 'Salvar mensagens'}
        </button>
      </div>
    </div>
  )
}
