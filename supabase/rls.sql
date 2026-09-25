-- FRAMES STUDIO CRM — RLS e permissões
-- Rode no SQL Editor do Supabase (self-hosted). É idempotente.
-- ANTES de rodar: confirme que o login do CRM (Supabase Auth) funciona.
-- DEPOIS de rodar: teste (1) /agendar deslogado e (2) o CRM logado.

-- 1) Tabelas do CRM: só usuário autenticado lê e escreve -----------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'barberpro_appointments','barberpro_blocks','barberpro_campaigns',
    'barberpro_clients','barberpro_club_payments','barberpro_expenses',
    'barberpro_goals','barberpro_services','barberpro_settings'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'crm_all_authenticated', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      'crm_all_authenticated', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- 2) Leitura pública mínima, usada pelo /agendar --------------------------------
-- Serviços (lista de serviços) e configurações (nome, endereço, Instagram, logo).
DROP POLICY IF EXISTS public_read_services ON public.barberpro_services;
CREATE POLICY public_read_services ON public.barberpro_services
  FOR SELECT TO anon USING (true);
GRANT SELECT ON public.barberpro_services TO anon;

DROP POLICY IF EXISTS public_read_settings ON public.barberpro_settings;
CREATE POLICY public_read_settings ON public.barberpro_settings
  FOR SELECT TO anon USING (true);
GRANT SELECT ON public.barberpro_settings TO anon;

-- 3) Funções (RPC) ----------------------------------------------------------------
-- Rodam com o dono da função (SECURITY DEFINER), para o /agendar funcionar sem
-- acesso direto às tabelas. Todas as sobrecargas de cada nome são ajustadas.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'barberpro_booked_times','barberpro_client_lookup_by_phone',
        'barberpro_club_lookup','barberpro_create_public_appointment',
        'barberpro_create_appointment_v2','barberpro_create_appointment_v3',
        'barberpro_reschedule_appointment')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    -- Públicas (fluxo do cliente em /agendar):
    IF r.proname IN ('barberpro_booked_times','barberpro_client_lookup_by_phone',
                     'barberpro_club_lookup','barberpro_create_appointment_v3') THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', r.sig);
    ELSE
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    END IF;
  END LOOP;
END $$;

-- A versão da create_appointment_v3 que recebe IDs (uuid,uuid,...) é do CRM:
-- fica só para usuário logado. Só a versão em texto (nome/telefone) é pública.
REVOKE EXECUTE ON FUNCTION public.barberpro_create_appointment_v3(uuid,uuid,timestamp without time zone,text,uuid,numeric,boolean) FROM anon;

-- 4) Storage (logo e foto do barbeiro) -------------------------------------------
-- Bucket público para leitura; só autenticado envia/troca arquivos.
DROP POLICY IF EXISTS assets_public_read ON storage.objects;
CREATE POLICY assets_public_read ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'barbershop-assets');

DROP POLICY IF EXISTS assets_auth_write ON storage.objects;
CREATE POLICY assets_auth_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'barbershop-assets')
  WITH CHECK (bucket_id = 'barbershop-assets');

-- 5) Conferência ---------------------------------------------------------------------
-- Deve listar todas as tabelas barberpro_* com rowsecurity = true:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'barberpro_%';
