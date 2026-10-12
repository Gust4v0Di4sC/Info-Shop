create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

alter table public.melhor_envio_tokens
  add column if not exists refresh_lock_id uuid,
  add column if not exists refresh_lock_until timestamptz,
  add column if not exists reauthorization_required_at timestamptz,
  add column if not exists last_refresh_attempt_at timestamptz,
  add column if not exists last_refresh_error text;

create table if not exists public.melhor_envio_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique check (length(state_hash) = 64),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists melhor_envio_oauth_states_expires_at_idx
  on public.melhor_envio_oauth_states (expires_at);

alter table public.melhor_envio_oauth_states enable row level security;
revoke all on public.melhor_envio_oauth_states from public, anon, authenticated;

create or replace function public.consume_melhor_envio_oauth_state(state_hash_value text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumed_admin_user_id uuid;
begin
  update public.melhor_envio_oauth_states
  set consumed_at = now()
  where state_hash = state_hash_value
    and consumed_at is null
    and expires_at > now()
  returning admin_user_id into consumed_admin_user_id;

  return consumed_admin_user_id;
end;
$$;

revoke all on function public.consume_melhor_envio_oauth_state(text) from public, anon, authenticated;
grant execute on function public.consume_melhor_envio_oauth_state(text) to service_role;

create or replace function public.claim_melhor_envio_token_refresh(
  refresh_lock_id_value uuid,
  refresh_before_value timestamptz
)
returns table (
  refresh_token text,
  refresh_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.melhor_envio_tokens as tokens
  set
    refresh_lock_id = refresh_lock_id_value,
    refresh_lock_until = now() + interval '60 seconds',
    last_refresh_attempt_at = now(),
    last_refresh_error = null
  where tokens.id = 'default'
    and tokens.expires_at <= refresh_before_value
    and tokens.reauthorization_required_at is null
    and (tokens.refresh_expires_at is null or tokens.refresh_expires_at > now())
    and (tokens.refresh_lock_until is null or tokens.refresh_lock_until <= now())
  returning tokens.refresh_token, tokens.refresh_expires_at;
end;
$$;

revoke all on function public.claim_melhor_envio_token_refresh(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_melhor_envio_token_refresh(uuid, timestamptz) to service_role;

create or replace function public.complete_melhor_envio_token_refresh(
  refresh_lock_id_value uuid,
  access_token_value text,
  refresh_token_value text,
  expires_at_value timestamptz,
  refresh_expires_at_value timestamptz,
  scopes_value text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  update public.melhor_envio_tokens
  set
    access_token = access_token_value,
    refresh_token = refresh_token_value,
    expires_at = expires_at_value,
    refresh_expires_at = refresh_expires_at_value,
    scopes = scopes_value,
    refresh_lock_id = null,
    refresh_lock_until = null,
    reauthorization_required_at = null,
    last_refresh_error = null
  where id = 'default'
    and refresh_lock_id = refresh_lock_id_value;

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke all on function public.complete_melhor_envio_token_refresh(uuid, text, text, timestamptz, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.complete_melhor_envio_token_refresh(uuid, text, text, timestamptz, timestamptz, text)
  to service_role;

create or replace function public.fail_melhor_envio_token_refresh(
  refresh_lock_id_value uuid,
  error_value text,
  requires_reauthorization_value boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.melhor_envio_tokens
  set
    refresh_lock_id = null,
    refresh_lock_until = null,
    reauthorization_required_at = case
      when requires_reauthorization_value then now()
      else reauthorization_required_at
    end,
    last_refresh_error = left(error_value, 500)
  where id = 'default'
    and refresh_lock_id = refresh_lock_id_value;
end;
$$;

revoke all on function public.fail_melhor_envio_token_refresh(uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function public.fail_melhor_envio_token_refresh(uuid, text, boolean)
  to service_role;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'melhor-envio-token-refresh-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end;
$$;

select cron.schedule(
  'melhor-envio-token-refresh-daily',
  '17 3 * * *',
  $job$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'info_shop_project_url'
        limit 1
      ) || '/functions/v1/melhor-envio-auth',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'info_shop_me_refresh_cron_secret'
          limit 1
        )
      ),
      body := jsonb_build_object('scheduled_at', now())
    ) as request_id;
  $job$
);
