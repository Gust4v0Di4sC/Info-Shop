create table if not exists public.newsletter_subscribers (
  id text primary key default gen_random_uuid()::text,
  email text not null,
  status text not null default 'active',
  source text not null default 'landing-newsletter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_subscribers_status_allowed'
      and conrelid = 'public.newsletter_subscribers'::regclass
  ) then
    alter table public.newsletter_subscribers
      add constraint newsletter_subscribers_status_allowed check (status in ('active', 'unsubscribed'));
  end if;
end;
$$;

drop trigger if exists newsletter_subscribers_set_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_set_updated_at
before update on public.newsletter_subscribers
for each row execute function public.set_updated_at();

create or replace function public.subscribe_newsletter(email_value text)
returns public.newsletter_subscribers
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  subscribed public.newsletter_subscribers;
begin
  normalized_email := lower(btrim(coalesce(email_value, '')));

  if normalized_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'Informe um e-mail valido.' using errcode = '22023';
  end if;

  insert into public.newsletter_subscribers (email, status, source)
  values (normalized_email, 'active', 'landing-newsletter')
  on conflict ((lower(email))) do update
    set status = 'active',
        source = excluded.source
  returning * into subscribed;

  return subscribed;
end;
$$;

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "admins read newsletter subscribers" on public.newsletter_subscribers;
create policy "admins read newsletter subscribers"
on public.newsletter_subscribers for select
using (public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor']));

grant execute on function public.subscribe_newsletter(text) to anon, authenticated;
