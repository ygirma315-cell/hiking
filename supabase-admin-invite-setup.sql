create table if not exists public.admin_invites (
  email text primary key,
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.admin_invites enable row level security;

drop policy if exists "Admins can read admin invites" on public.admin_invites;
create policy "Admins can read admin invites"
on public.admin_invites for select
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()));

create or replace function public.invite_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text := lower(trim(p_email));
  target_user uuid;
begin
  if clean_email = '' or clean_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid email address';
  end if;

  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'Only admins can invite admins';
  end if;

  insert into public.admin_invites (email, invited_by)
  values (clean_email, auth.uid())
  on conflict (email) do update
  set invited_by = excluded.invited_by,
      invited_at = now();

  select id into target_user
  from auth.users
  where lower(email) = clean_email
  limit 1;

  if target_user is not null then
    insert into public.admin_users (user_id, email)
    values (target_user, clean_email)
    on conflict (user_id) do update
    set email = excluded.email;

    update public.admin_invites
    set accepted_at = now()
    where email = clean_email;

    return 'Admin access added for existing Auth user.';
  end if;

  return 'Invite saved. Create this email in Supabase Auth, then run invite again or let the trigger promote it on signup.';
end;
$$;

grant execute on function public.invite_admin(text) to authenticated;

create or replace function public.apply_admin_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.admin_invites where email = lower(new.email)) then
    insert into public.admin_users (user_id, email)
    values (new.id, lower(new.email))
    on conflict (user_id) do update
    set email = excluded.email;

    update public.admin_invites
    set accepted_at = now()
    where email = lower(new.email);
  end if;

  return new;
end;
$$;

drop trigger if exists apply_admin_invite_on_auth_user on auth.users;
create trigger apply_admin_invite_on_auth_user
after insert on auth.users
for each row execute function public.apply_admin_invite();
