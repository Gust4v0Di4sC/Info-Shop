alter table public.clients
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists email text;

create unique index if not exists clients_user_id_key
  on public.clients (user_id);

create index if not exists clients_email_idx
  on public.clients (email);

create or replace function public.user_phone_to_numeric(phone_value text)
returns numeric
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(phone_value, ''), '\D', '', 'g'), '')::numeric
$$;

create or replace function public.sync_user_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.admins admins
    where admins.user_id = new.id
  ) then
    return new;
  end if;

  insert into public.clients (
    user_id,
    email,
    name,
    age,
    address,
    cpf,
    phone,
    "imageUrl"
  )
  values (
    new.id,
    new.email,
    coalesce(nullif(btrim(new.full_name), ''), new.email, 'Cliente'),
    0,
    coalesce(new.address, ''),
    coalesce(new.document, ''),
    public.user_phone_to_numeric(new.phone),
    new.avatar_url
  )
  on conflict (user_id) do update
    set email = excluded.email,
        name = coalesce(nullif(btrim(excluded.name), ''), public.clients.name),
        address = coalesce(nullif(btrim(excluded.address), ''), public.clients.address, ''),
        cpf = coalesce(nullif(btrim(excluded.cpf), ''), public.clients.cpf, ''),
        phone = coalesce(excluded.phone, public.clients.phone),
        "imageUrl" = coalesce(excluded."imageUrl", public.clients."imageUrl");

  return new;
end;
$$;

drop trigger if exists users_sync_client on public.users;
create trigger users_sync_client
after insert or update of email, full_name, phone, document, address, avatar_url on public.users
for each row execute function public.sync_user_client();

insert into public.clients (
  user_id,
  email,
  name,
  age,
  address,
  cpf,
  phone,
  "imageUrl"
)
select
  users.id,
  users.email,
  coalesce(nullif(btrim(users.full_name), ''), users.email, 'Cliente'),
  0,
  coalesce(users.address, ''),
  coalesce(users.document, ''),
  public.user_phone_to_numeric(users.phone),
  users.avatar_url
from public.users users
where not exists (
  select 1
  from public.admins admins
  where admins.user_id = users.id
)
on conflict (user_id) do update
  set email = excluded.email,
      name = coalesce(nullif(btrim(excluded.name), ''), public.clients.name),
      address = coalesce(nullif(btrim(excluded.address), ''), public.clients.address, ''),
      cpf = coalesce(nullif(btrim(excluded.cpf), ''), public.clients.cpf, ''),
      phone = coalesce(excluded.phone, public.clients.phone),
      "imageUrl" = coalesce(excluded."imageUrl", public.clients."imageUrl");
