-- Run this AFTER you create the user in Supabase Authentication.
-- Replace the email below with the exact admin email you created.

insert into public.admin_users (user_id, email)
select id, email
from auth.users
where email = 'erefthiking@gmail.com'
on conflict (user_id) do update
set email = excluded.email;

select email, created_at
from public.admin_users
where email = 'erefthiking@gmail.com';
