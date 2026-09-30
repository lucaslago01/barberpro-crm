-- Horário fixo (recorrente semanal) para clientes.
-- Rode este arquivo inteiro no SQL Editor do Supabase (database.devlucaslago.com).

-- 1) Tabela com as "regras" de horário fixo
create table if not exists public.barberpro_recurring_appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.barberpro_clients(id) on delete cascade,
  service_id uuid not null references public.barberpro_services(id),
  addon_service_id uuid references public.barberpro_services(id),
  addon_price numeric not null default 0,
  is_club_visit boolean not null default false,
  notes text,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo ... 6 = sábado
  time_of_day time not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.barberpro_appointments
  add column if not exists recurring_id uuid references public.barberpro_recurring_appointments(id) on delete set null;

create index if not exists barberpro_appointments_recurring_id_idx
  on public.barberpro_appointments (recurring_id);

alter table public.barberpro_recurring_appointments enable row level security;

drop policy if exists "Authenticated full access" on public.barberpro_recurring_appointments;
create policy "Authenticated full access" on public.barberpro_recurring_appointments
  for all
  to authenticated
  using (true)
  with check (true);

-- 2) Gera os próximos agendamentos reais a partir de cada horário fixo ativo,
--    sempre "abastecendo" as próximas semanas. Idempotente: não duplica.
create or replace function public.barberpro_ensure_recurring_appointments(p_weeks_ahead int default 26)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  r record;
  v_first_date date;
  v_time timestamp;
  i int;
begin
  for r in select * from barberpro_recurring_appointments where active loop
    -- primeira data (a partir de hoje) que cai no dia da semana da regra
    v_first_date := current_date + ((r.weekday - extract(dow from current_date)::int + 7) % 7);

    for i in 0..p_weeks_ahead loop
      v_time := (v_first_date + (i * 7))::timestamp + r.time_of_day;

      if v_time > now()
         and not exists (
           select 1 from barberpro_appointments a
           where a.recurring_id = r.id and a."time" = v_time
         )
         and not exists (
           select 1 from barberpro_appointments a
           where a."time" = v_time
             and a.status not in ('cancelado', 'faltou')
             and a.recurring_id is distinct from r.id
         )
      then
        insert into barberpro_appointments
          (client_id, service_id, addon_service_id, addon_price, is_club_visit, notes, "time", status, recurring_id)
        values
          (r.client_id, r.service_id, r.addon_service_id, r.addon_price, r.is_club_visit, r.notes, v_time, 'agendado', r.id);
      end if;
    end loop;
  end loop;
end;
$function$;

-- 3) Cria uma regra de horário fixo e já materializa as próximas ocorrências
create or replace function public.barberpro_create_recurring_appointment(
  p_client_id uuid,
  p_service_id uuid,
  p_weekday smallint,
  p_time time,
  p_notes text default null,
  p_is_club_visit boolean default false,
  p_addon_service_id uuid default null,
  p_addon_price numeric default 0
)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  insert into barberpro_recurring_appointments
    (client_id, service_id, addon_service_id, addon_price, is_club_visit, notes, weekday, time_of_day)
  values
    (p_client_id, p_service_id, p_addon_service_id, p_addon_price, p_is_club_visit, p_notes, p_weekday, p_time)
  returning id into v_id;

  perform barberpro_ensure_recurring_appointments();

  return v_id;
end;
$function$;

-- 4) Lista os horários fixos ativos (para a tela de gerenciamento no CRM)
create or replace function public.barberpro_list_recurring_appointments()
 returns table (
   id uuid,
   client_name text,
   client_phone text,
   service_name text,
   addon_service_name text,
   weekday smallint,
   time_of_day time,
   notes text,
   is_club_visit boolean
 )
 language sql
 security definer
 set search_path to 'public'
as $function$
  select
    r.id,
    c.name,
    c.phone,
    sv.name,
    av.name,
    r.weekday,
    r.time_of_day,
    r.notes,
    r.is_club_visit
  from barberpro_recurring_appointments r
  join barberpro_clients c on c.id = r.client_id
  join barberpro_services sv on sv.id = r.service_id
  left join barberpro_services av on av.id = r.addon_service_id
  where r.active
  order by r.weekday, r.time_of_day;
$function$;

-- 5) Remove um horário fixo: desativa a regra e cancela as ocorrências futuras
--    ainda não atendidas (isso já libera o horário no /agendar automaticamente).
create or replace function public.barberpro_delete_recurring_appointment(p_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update barberpro_recurring_appointments set active = false where id = p_id;

  update barberpro_appointments
    set status = 'cancelado'
    where recurring_id = p_id
      and "time" > now()
      and status not in ('cancelado', 'faltou', 'concluido', 'atendimento');
end;
$function$;

-- 6) barberpro_booked_times agora também "abastece" os horários fixos antes de
--    calcular o que está ocupado no dia — assim o /agendar sempre risca certo,
--    mesmo em uma data bem no futuro que ainda não tinha sido gerada.
create or replace function public.barberpro_booked_times(p_day date)
 returns table(slot text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  perform barberpro_ensure_recurring_appointments();

  return query
  select to_char(s, 'HH24:MI')
  from barberpro_appointments a
  join barberpro_services sv on sv.id = a.service_id
  left join barberpro_services av on av.id = a.addon_service_id
  cross join lateral generate_series(
    date_trunc('hour', a."time")
      + (floor(extract(minute from a."time") / 30) * 30 || ' minutes')::interval,
    a."time" + ((sv.duration + coalesce(av.duration, 0)) || ' minutes')::interval - interval '1 minute',
    interval '30 minutes'
  ) s
  where a."time" >= p_day::timestamp
    and a."time" < (p_day + 1)::timestamp
    and a.status not in ('cancelado', 'faltou')
  union
  select to_char(s, 'HH24:MI')
  from barberpro_blocks b,
       generate_series(
         b.day::timestamp + b.start_time,
         b.day::timestamp + b.end_time - interval '30 minutes',
         interval '30 minutes'
       ) s
  where b.day = p_day;
end;
$function$;

-- 7) Deixa a tabela de horários fixos visível em tempo real (opcional, mas
--    ajuda a lista se atualizar sozinha caso duas telas fiquem abertas).
--    Em bloco seguro: não dá erro se você rodar este arquivo de novo no futuro.
do $$
begin
  alter publication supabase_realtime add table public.barberpro_recurring_appointments;
exception
  when duplicate_object then null;
end;
$$;

-- 8) Gera já agora as primeiras ocorrências de qualquer horário fixo que já exista
select public.barberpro_ensure_recurring_appointments();
