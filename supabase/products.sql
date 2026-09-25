-- FRAMES STUDIO CRM — Produtos e estoque
-- Rode no SQL Editor do Supabase (self-hosted): cole TODO o conteúdo e clique em Run.
-- É idempotente (pode rodar mais de uma vez).
--
-- Como funciona:
--  * barberpro_products: cadastro (custo médio, preço de venda, estoque atual, estoque mínimo).
--  * barberpro_product_movements: histórico de tudo que mexe no estoque.
--      entrada (reposição) | venda | ajuste (perda ou correção) | estorno (desfaz uma venda)
--    quantity: positivo entra no estoque, negativo sai.
--    unit_cost / unit_price ficam gravados no momento, então o lucro de uma venda antiga
--    não muda se o custo ou o preço do produto mudarem depois.
--  * As funções abaixo fazem venda, reposição, ajuste e estorno de forma atômica: travam
--    o produto, conferem o estoque e gravam o movimento numa só transação. O estoque
--    nunca fica negativo, mesmo com duas vendas ao mesmo tempo.

-- 1) Tabelas --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.barberpro_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'outros',
  cost_price  numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),  -- custo médio por unidade
  sale_price  numeric(12,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock   integer NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  active      boolean NOT NULL DEFAULT true,                              -- false = arquivado
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.barberpro_product_movements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES public.barberpro_products(id) ON DELETE RESTRICT,
  kind         text NOT NULL CHECK (kind IN ('entrada','venda','ajuste','estorno')),
  quantity     integer NOT NULL CHECK (quantity <> 0),
  unit_cost    numeric(12,2) NOT NULL DEFAULT 0,
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  day          date NOT NULL,
  client_id    uuid REFERENCES public.barberpro_clients(id) ON DELETE SET NULL,
  note         text,
  reverses_id  uuid REFERENCES public.barberpro_product_movements(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS barberpro_product_movements_day_idx
  ON public.barberpro_product_movements (day);
CREATE INDEX IF NOT EXISTS barberpro_product_movements_product_idx
  ON public.barberpro_product_movements (product_id);
-- Uma venda só pode ser estornada uma vez
CREATE UNIQUE INDEX IF NOT EXISTS barberpro_product_movements_one_refund_idx
  ON public.barberpro_product_movements (reverses_id) WHERE reverses_id IS NOT NULL;

-- 2) Funções -----------------------------------------------------------------------------

-- Venda: baixa o estoque e grava o custo médio da hora da venda
CREATE OR REPLACE FUNCTION public.barberpro_product_sell(
  p_product_id uuid,
  p_qty        integer,
  p_unit_price numeric,
  p_day        date,
  p_client_id  uuid DEFAULT NULL,
  p_note       text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prod public.barberpro_products%ROWTYPE;
  new_id uuid;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'A quantidade precisa ser maior que zero.';
  END IF;
  IF p_unit_price IS NULL OR p_unit_price < 0 THEN
    RAISE EXCEPTION 'O preço não pode ser negativo.';
  END IF;

  SELECT * INTO prod FROM public.barberpro_products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado.'; END IF;
  IF NOT prod.active THEN RAISE EXCEPTION 'Este produto está arquivado.'; END IF;
  IF prod.stock < p_qty THEN
    RAISE EXCEPTION 'Estoque insuficiente: restam % unidade(s).', prod.stock;
  END IF;

  UPDATE public.barberpro_products SET stock = stock - p_qty WHERE id = p_product_id;

  INSERT INTO public.barberpro_product_movements
    (product_id, kind, quantity, unit_cost, unit_price, day, client_id, note)
  VALUES
    (p_product_id, 'venda', -p_qty, prod.cost_price, p_unit_price, p_day, p_client_id, NULLIF(btrim(p_note), ''))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Reposição: soma ao estoque e recalcula o custo médio ponderado
CREATE OR REPLACE FUNCTION public.barberpro_product_restock(
  p_product_id uuid,
  p_qty        integer,
  p_unit_cost  numeric,
  p_day        date,
  p_note       text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prod public.barberpro_products%ROWTYPE;
  new_cost numeric(12,2);
  new_id uuid;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'A quantidade precisa ser maior que zero.';
  END IF;
  IF p_unit_cost IS NULL OR p_unit_cost < 0 THEN
    RAISE EXCEPTION 'O custo não pode ser negativo.';
  END IF;

  SELECT * INTO prod FROM public.barberpro_products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado.'; END IF;

  new_cost := round(((prod.stock * prod.cost_price) + (p_qty * p_unit_cost)) / (prod.stock + p_qty), 2);

  UPDATE public.barberpro_products
     SET stock = stock + p_qty, cost_price = new_cost
   WHERE id = p_product_id;

  INSERT INTO public.barberpro_product_movements
    (product_id, kind, quantity, unit_cost, unit_price, day, note)
  VALUES
    (p_product_id, 'entrada', p_qty, p_unit_cost, 0, p_day, NULLIF(btrim(p_note), ''))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Ajuste: perda/quebra (negativo) ou correção de contagem (positivo)
CREATE OR REPLACE FUNCTION public.barberpro_product_adjust(
  p_product_id uuid,
  p_delta      integer,
  p_day        date,
  p_note       text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prod public.barberpro_products%ROWTYPE;
  new_id uuid;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 THEN
    RAISE EXCEPTION 'Informe uma quantidade diferente de zero.';
  END IF;

  SELECT * INTO prod FROM public.barberpro_products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado.'; END IF;
  IF prod.stock + p_delta < 0 THEN
    RAISE EXCEPTION 'O estoque não pode ficar negativo: há % unidade(s).', prod.stock;
  END IF;

  UPDATE public.barberpro_products SET stock = stock + p_delta WHERE id = p_product_id;

  INSERT INTO public.barberpro_product_movements
    (product_id, kind, quantity, unit_cost, unit_price, day, note)
  VALUES
    (p_product_id, 'ajuste', p_delta, prod.cost_price, 0, p_day, NULLIF(btrim(p_note), ''))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Estorno: desfaz uma venda (devolve ao estoque). Fica no mesmo dia da venda original,
-- então o mês da venda se corrige sozinho.
CREATE OR REPLACE FUNCTION public.barberpro_product_refund(p_movement_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  orig public.barberpro_product_movements%ROWTYPE;
  new_id uuid;
BEGIN
  SELECT * INTO orig FROM public.barberpro_product_movements WHERE id = p_movement_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venda não encontrada.'; END IF;
  IF orig.kind <> 'venda' THEN RAISE EXCEPTION 'Só é possível estornar vendas.'; END IF;
  IF EXISTS (SELECT 1 FROM public.barberpro_product_movements WHERE reverses_id = p_movement_id) THEN
    RAISE EXCEPTION 'Esta venda já foi estornada.';
  END IF;

  PERFORM 1 FROM public.barberpro_products WHERE id = orig.product_id FOR UPDATE;
  UPDATE public.barberpro_products SET stock = stock - orig.quantity WHERE id = orig.product_id; -- quantity é negativo

  INSERT INTO public.barberpro_product_movements
    (product_id, kind, quantity, unit_cost, unit_price, day, client_id, note, reverses_id)
  VALUES
    (orig.product_id, 'estorno', -orig.quantity, orig.unit_cost, orig.unit_price, orig.day,
     orig.client_id, 'Estorno de venda', orig.id)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- 3) Permissões: só usuário logado (nada disso aparece no /agendar) -------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['barberpro_products','barberpro_product_movements'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'crm_all_authenticated', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      'crm_all_authenticated', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.barberpro_product_sell(uuid,integer,numeric,date,uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.barberpro_product_restock(uuid,integer,numeric,date,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.barberpro_product_adjust(uuid,integer,date,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.barberpro_product_refund(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.barberpro_product_sell(uuid,integer,numeric,date,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barberpro_product_restock(uuid,integer,numeric,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barberpro_product_adjust(uuid,integer,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barberpro_product_refund(uuid) TO authenticated;
