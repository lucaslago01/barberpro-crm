# FRAMES STUDIO CRM

CRM e agendamento online para barbearia. Next.js 16, React 19, TypeScript, Tailwind e Supabase.

- `/agendar`: página pública onde o cliente marca o horário.
- Demais rotas (`/`, `/agenda`, `/clientes`, `/atendimentos`, `/financeiro`, `/campanhas`, `/relatorios`, `/configuracoes`): CRM, exige login.

## Rodar local

```bash
cp .env.example .env.local   # preencha a URL e a anon key do Supabase
pnpm install
pnpm dev
```

## Deploy (Vercel)

1. Projeto ligado ao repositório, branch de produção `main`.
2. Em Settings → Environment Variables, cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para Production.
3. Cada push na `main` publica automaticamente.

## Banco (Supabase)

Antes de entregar, rode `supabase/rls.sql` no SQL Editor. Ele ativa RLS nas tabelas `barberpro_*`, libera só o mínimo para o `/agendar` e restringe o resto a usuários logados.
