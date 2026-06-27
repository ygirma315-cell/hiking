-- Run this after the UI update if you already ran the main schema before.
-- It keeps existing users/bookings and only updates booking price/payment behavior.

create or replace function public.create_booking(
  p_session_token uuid,
  p_full_name text,
  p_phone text,
  p_age int,
  p_participants_count int,
  p_gender text,
  p_destination text,
  p_package_name text,
  p_trip_date text,
  p_price numeric,
  p_currency text,
  p_payment_method text,
  p_sender_account text,
  p_transaction_id text
)
returns setof public.registrations
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.site_users%rowtype;
  v_payment_status text;
  v_payload jsonb;
  v_package jsonb;
  v_price numeric;
  v_currency text;
begin
  select * into v_user
  from public.site_users
  where id = public.valid_site_user(p_session_token);

  if trim(coalesce(p_full_name, '')) = '' then
    raise exception 'Full name is required.';
  end if;
  if trim(coalesce(p_phone, '')) = '' then
    raise exception 'Phone number is required.';
  end if;
  if trim(coalesce(p_destination, '')) = '' or trim(coalesce(p_package_name, '')) = '' then
    raise exception 'Destination and package are required.';
  end if;

  v_payment_status := case
    when nullif(trim(p_sender_account), '') is not null then 'submitted'
    else 'pending'
  end;

  select sc.payload into v_payload
  from public.site_content sc where sc.id = 'main';

  if v_payload is not null then
    select package_item into v_package
    from jsonb_array_elements(jsonb_build_array(
      v_payload #> '{packages,nativeDay}',
      v_payload #> '{packages,nativeOvernight}',
      v_payload #> '{packages,foreignerDay}',
      v_payload #> '{packages,foreignerOvernight}'
    )) as packages(package_item)
    where package_item is not null
      and package_item ->> 'name' = p_package_name
    limit 1;
  end if;

  v_price := nullif(v_package ->> 'price', '')::numeric;
  if v_price is not null then
    v_price := v_price * greatest(1, coalesce(p_participants_count, 1));
  else
    v_price := coalesce(p_price, 0);
  end if;
  v_currency := coalesce(nullif(v_package ->> 'currency', ''), nullif(p_currency, ''), 'ETB');

  return query
  with ins as (
    insert into public.registrations (
      user_id, username, full_name, phone, age, participants_count,
      gender, destination, package_name, trip_date, price, currency,
      payment_method, sender_account, transaction_id, payment_status, status
    ) values (
      v_user.id, v_user.username, trim(p_full_name), trim(p_phone),
      p_age, greatest(1, coalesce(p_participants_count, 1)),
      p_gender, p_destination, p_package_name, coalesce(p_trip_date, ''),
      v_price, v_currency,
      coalesce(nullif(p_payment_method, ''), 'Not selected'),
      coalesce(trim(p_sender_account), ''), '',
      v_payment_status, 'pending'
    )
    returning id
  )
  update public.registrations r
  set hike_id = 'HIK-' || upper(substr(md5(ins.id::text), 1, 6))
  from ins
  where r.id = ins.id
  returning r.*;
end;
$$;

create or replace function public.submit_booking_payment(
  p_session_token uuid,
  p_hike_id text,
  p_sender_account text,
  p_transaction_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id bigint;
begin
  v_user_id := public.valid_site_user(p_session_token);
  update public.registrations
  set
    sender_account = coalesce(trim(p_sender_account), ''),
    transaction_id = '',
    payment_status = case
      when nullif(trim(p_sender_account), '') is not null then 'submitted'
      else payment_status
    end
  where user_id = v_user_id
    and hike_id = p_hike_id;

  return found;
end;
$$;

grant execute on function public.create_booking(uuid, text, text, int, int, text, text, text, text, numeric, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_booking_payment(uuid, text, text, text) to anon, authenticated;
