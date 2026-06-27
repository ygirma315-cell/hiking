create table if not exists public.site_defaults (
  id text primary key default 'main',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_defaults_touch_updated_at on public.site_defaults;
create trigger site_defaults_touch_updated_at
before update on public.site_defaults
for each row execute function public.touch_updated_at();

alter table public.site_defaults enable row level security;

drop policy if exists "Admins can read site defaults" on public.site_defaults;
create policy "Admins can read site defaults"
on public.site_defaults for select
to authenticated 
using (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage site defaults" on public.site_defaults;
create policy "Admins can manage site defaults"
on public.site_defaults for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

insert into public.site_defaults (id, payload)
select 'main', payload
from public.site_content
where id = 'main'
  and payload <> '{}'::jsonb
on conflict (id) do nothing;
