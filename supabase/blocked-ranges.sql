-- FRAMES STUDIO CRM — dias bloqueados visíveis no /agendar
-- Rode no SQL Editor do Supabase (self-hosted). É idempotente.
-- Sem esta função, o /agendar continua bloqueando os horários normalmente
-- (todos aparecem riscados), mas o dia ainda aparece como disponível no calendário.
-- Com ela, dias bloqueados por inteiro ficam desabilitados no calendário.
-- Devolve só dia e horários (nunca o motivo do bloqueio).

CREATE OR REPLACE FUNCTION public.barberpro_blocked_ranges(p_from date, p_to date)
RETURNS TABLE (day date, start_time time, end_time time)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.day, b.start_time, b.end_time
  FROM public.barberpro_blocks b
  WHERE b.day BETWEEN p_from AND p_to
  ORDER BY b.day, b.start_time
$$;

REVOKE ALL ON FUNCTION public.barberpro_blocked_ranges(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.barberpro_blocked_ranges(date, date) TO anon, authenticated;
