-- Optional helper.
-- Run this only after the admin dashboard content looks correct.
-- It saves the current website content as the "Reset Defaults" version.

insert into public.site_defaults (id, payload)
select 'main', payload
from public.site_content
where id = 'main'
  and payload <> '{}'::jsonb
on conflict (id) do update
set payload = excluded.payload;
