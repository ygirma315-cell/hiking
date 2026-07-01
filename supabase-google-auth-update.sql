-- Google login support for the public Ereft Hiking site.
-- Run this in Supabase SQL Editor for an existing database.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.site_users add column if not exists google_provider text default '';
alter table public.site_users add column if not exists google_provider_id text;
alter table public.site_users add column if not exists google_email text default '';
alter table public.site_users add column if not exists google_name text default '';

create unique index if not exists site_users_google_provider_id_idx
  on public.site_users (google_provider_id)
  where google_provider_id is not null and google_provider_id <> '';

create or replace function public.user_google_login(
  p_google_id text,
  p_email text default '',
  p_name text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_google_id text := trim(coalesce(p_google_id, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := trim(coalesce(p_name, ''));
  v_base text;
  v_username text;
  v_suffix int := 0;
  v_user public.site_users%rowtype;
  v_token uuid;
begin
  if length(v_google_id) < 8 then
    return jsonb_build_object('success', false, 'error', 'Google account could not be verified.');
  end if;

  select * into v_user
  from public.site_users
  where google_provider_id = v_google_id
  limit 1;

  if v_user.id is null and v_email <> '' then
    select * into v_user
    from public.site_users
    where lower(coalesce(google_email, '')) = v_email
    limit 1;
  end if;

  if v_user.id is null then
    v_base := public.normalize_login_name(split_part(v_email, '@', 1));
    if length(v_base) < 3 then
      v_base := 'google_' || lower(left(regexp_replace(v_google_id, '[^a-zA-Z0-9]', '', 'g'), 16));
    end if;
    v_base := left(v_base, 24);
    v_username := v_base;

    while exists (select 1 from public.site_users where username = v_username) loop
      v_suffix := v_suffix + 1;
      v_username := left(v_base, 22) || '_' || v_suffix::text;
    end loop;

    insert into public.site_users (
      username,
      password_hash,
      phone,
      google_provider,
      google_provider_id,
      google_email,
      google_name,
      last_login
    )
    values (
      v_username,
      extensions.crypt('google:' || v_google_id || ':' || extensions.gen_random_uuid()::text, extensions.gen_salt('bf')),
      '',
      'google',
      v_google_id,
      v_email,
      v_name,
      now()
    )
    returning * into v_user;
  else
    update public.site_users
    set google_provider = 'google',
        google_provider_id = v_google_id,
        google_email = coalesce(nullif(v_email, ''), google_email),
        google_name = coalesce(nullif(v_name, ''), google_name),
        last_login = now()
    where id = v_user.id
    returning * into v_user;
  end if;

  insert into public.site_user_sessions (user_id) values (v_user.id)
  returning token into v_token;

  return jsonb_build_object(
    'success', true,
    'session_token', v_token,
    'user', jsonb_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'phone', v_user.phone
    )
  );
end;
$$;

grant execute on function public.user_google_login(text, text, text) to anon, authenticated;
