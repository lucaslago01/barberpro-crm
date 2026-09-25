-- FRAMES STUDIO CRM — despesas recorrentes (Financeiro)
-- Rode no SQL Editor do Supabase (self-hosted). É idempotente.
-- Sem este arquivo o Financeiro continua funcionando como antes; só a opção
-- "Despesa recorrente" fica indisponível.

-- 1) Despesas que se repetem todo mês (aluguel, internet, MEI...) -----------------
CREATE TABLE IF NOT EXISTS public.barberpro_recurring_expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description  text NOT NULL,
  category     text NOT NULL,
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  due_day      integer NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  start_month  date NOT NULL,           -- sempre dia 1 do primeiro mês, ex.: 2026-10-01
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2) Liga cada despesa paga à recorrência e ao mês que ela quitou ---------------------
-- Se a despesa paga for apagada, o mês volta a aparecer como "a pagar".
-- Se a recorrência for encerrada, as despesas já pagas ficam no histórico.
ALTER TABLE public.barberpro_expenses
  ADD COLUMN IF NOT EXISTS recurring_id    uuid
    REFERENCES public.barberpro_recurring_expenses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurring_month date;

CREATE INDEX IF NOT EXISTS barberpro_expenses_recurring_idx
  ON public.barberpro_expenses (recurring_id, recurring_month);

-- 3) Mesma regra das outras tabelas do CRM: só usuário logado lê e escreve -----------
ALTER TABLE public.barberpro_recurring_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_all_authenticated ON public.barberpro_recurring_expenses;
CREATE POLICY crm_all_authenticated ON public.barberpro_recurring_expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.barberpro_recurring_expenses FROM anon;
GRANT ALL ON public.barberpro_recurring_expenses TO authenticated;
