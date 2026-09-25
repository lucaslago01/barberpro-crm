# BarberPro CRM

CRM e agendamento online para barbearia. Next.js 16, React 19, TypeScript, Tailwind e Supabase.

- `/agendar`: página pública onde o cliente marca o horário.
- Demais rotas (`/`, `/agenda`, `/clientes`, `/atendimentos`, `/financeiro`, `/campanhas`, `/relatorios`, `/configuracoes`): CRM, exige login.

## Rodar local

```bash
cp .env.example .env.local   # preencha a URL e a anon key do Supabase
pnpm install
pnpm dev
```

## Deploy (Easypanel)

1. Serviço do tipo App com origem no GitHub e build por **Dockerfile**.
2. Cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` como variáveis de ambiente **e** como build args (são embutidas no build; se mudar, faça novo deploy).
3. Porta do serviço: `3000`.

## Banco (Supabase)

Antes de entregar, rode `supabase/rls.sql` no SQL Editor. Ele ativa RLS nas tabelas `barberpro_*`, libera só o mínimo para o `/agendar` e restringe o resto a usuários logados.
