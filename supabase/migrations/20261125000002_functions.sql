-- =============================================================================
-- Migration 2: secure RPC functions (all business logic lives here)
-- =============================================================================
-- Every function is SECURITY DEFINER with a pinned search_path and derives the
-- caller's identity from auth.uid(). The browser can NOT choose a customer id
-- or a reward.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Internal helpers
-- -----------------------------------------------------------------------------
create or replace function public.config_value(p_key text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select value from public.app_config where key = p_key;
$$;

-- Unique-looking claim id such as SW-7K3M-Q9XA (32-char alphabet, no 0/O/1/I).
create or replace function public.gen_claim_id()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(8);
  result text := 'SW-';
  i int;
begin
  for i in 0..7 loop
    if i = 4 then result := result || '-'; end if;
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- register_customer(name, mobile)
--   * validates input server-side
--   * one customer row per mobile (UNIQUE) and per session (UNIQUE)
--   * serialised per mobile + per session with advisory locks, so duplicate
--     taps / concurrent requests cannot create duplicates
--   * a mobile that has already spun can never register again
-- -----------------------------------------------------------------------------
create or replace function public.register_customer(p_name text, p_mobile text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_name      text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_mobile    text := btrim(coalesce(p_mobile, ''));
  v_by_mobile public.customers;
  v_own       public.customers;
  v_has_mobile boolean;
  v_has_own    boolean;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then
    raise exception 'INVALID_NAME';
  end if;
  if v_mobile !~ '^[6-9][0-9]{9}$' then
    raise exception 'INVALID_MOBILE';
  end if;
  if public.config_value('campaign_active') is distinct from 'true' then
    raise exception 'CAMPAIGN_INACTIVE';
  end if;

  -- Always take locks in the same order (mobile, then session) => no deadlocks.
  perform pg_advisory_xact_lock(hashtextextended('mobile:' || v_mobile, 0));
  perform pg_advisory_xact_lock(hashtextextended('uid:' || v_uid::text, 0));

  select * into v_by_mobile from public.customers where mobile = v_mobile;
  v_has_mobile := found;
  select * into v_own from public.customers where auth_user_id = v_uid;
  v_has_own := found;

  if v_has_mobile then
    -- This mobile number already took part.
    if exists (select 1 from public.campaign_spins where customer_id = v_by_mobile.id) then
      raise exception 'ALREADY_PARTICIPATED';
    end if;
    -- This browser session already spun with a different number.
    if v_has_own and v_own.id <> v_by_mobile.id then
      if exists (select 1 from public.campaign_spins where customer_id = v_own.id) then
        raise exception 'ALREADY_PARTICIPATED';
      end if;
      delete from public.customers where id = v_own.id;
    end if;
    -- Registered but never spun: (re)claim it for this session.
    update public.customers
       set auth_user_id = v_uid, full_name = v_name,
           otp_verified = false, otp_verified_at = null, otp_attempts = 0
     where id = v_by_mobile.id;
  elsif v_has_own then
    if exists (select 1 from public.campaign_spins where customer_id = v_own.id) then
      raise exception 'ALREADY_PARTICIPATED';
    end if;
    -- Same session, corrected its number before spinning.
    update public.customers
       set mobile = v_mobile, full_name = v_name,
           otp_verified = false, otp_verified_at = null, otp_attempts = 0
     where id = v_own.id;
  else
    insert into public.customers (auth_user_id, full_name, mobile)
    values (v_uid, v_name, v_mobile);
  end if;

  return jsonb_build_object('status', 'registered');
end;
$$;

-- -----------------------------------------------------------------------------
-- verify_otp(otp)
--   DEVELOPMENT ONLY mechanism: compares against app_config.dev_otp, and only
--   while app_config.dev_otp_enabled = 'true'. With the flag off it refuses to
--   verify anything until a real OTP provider is wired in.
-- -----------------------------------------------------------------------------
create or replace function public.verify_otp(p_otp text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_customer public.customers;
  c_max_attempts constant int := 5;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_customer from public.customers where auth_user_id = v_uid for update;
  if not found then raise exception 'NOT_REGISTERED'; end if;

  if v_customer.otp_verified then
    return jsonb_build_object('verified', true, 'attempts_left', c_max_attempts);
  end if;

  if v_customer.otp_attempts >= c_max_attempts then
    raise exception 'TOO_MANY_ATTEMPTS';
  end if;

  if public.config_value('dev_otp_enabled') is distinct from 'true' then
    raise exception 'OTP_PROVIDER_NOT_CONFIGURED';
  end if;

  if btrim(coalesce(p_otp, '')) = public.config_value('dev_otp') then
    update public.customers
       set otp_verified = true, otp_verified_at = now()
     where id = v_customer.id;
    return jsonb_build_object('verified', true, 'attempts_left', c_max_attempts);
  end if;

  update public.customers set otp_attempts = otp_attempts + 1 where id = v_customer.id;
  return jsonb_build_object(
    'verified', false,
    'attempts_left', c_max_attempts - (v_customer.otp_attempts + 1)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- spin_wheel()
--   Atomic and idempotent:
--     1. identity comes from auth.uid()
--     2. the customer row is locked FOR UPDATE, serialising concurrent calls
--     3. UNIQUE(customer_id) on campaign_spins is the final safety net
--     4. the reward is picked here, uniformly at random from the 5 segments
--   A repeat call returns the ORIGINAL result (already_spun = true); it never
--   creates a second spin.
-- -----------------------------------------------------------------------------
create or replace function public.spin_wheel()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_customer public.customers;
  v_spin     public.campaign_spins;
  v_rewards  constant int[] := array[45, 10, 20, 40, 30];
  v_reward   int;
  v_attempt  int := 0;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_customer from public.customers where auth_user_id = v_uid for update;
  if not found then raise exception 'NOT_REGISTERED'; end if;
  if not v_customer.otp_verified then raise exception 'OTP_NOT_VERIFIED'; end if;

  select * into v_spin from public.campaign_spins where customer_id = v_customer.id;
  if found then
    return jsonb_build_object(
      'reward_ml', v_spin.reward_ml, 'claim_id', v_spin.claim_id,
      'customer_name', v_customer.full_name, 'spun_at', v_spin.spun_at,
      'already_spun', true);
  end if;

  if public.config_value('campaign_active') is distinct from 'true' then
    raise exception 'CAMPAIGN_INACTIVE';
  end if;

  -- Uniform pick over the five rewards.
  v_reward := v_rewards[1 + floor(random() * array_length(v_rewards, 1))::int];

  loop
    begin
      insert into public.campaign_spins (customer_id, reward_ml, claim_id)
      values (v_customer.id, v_reward, public.gen_claim_id())
      returning * into v_spin;
      exit;
    exception when unique_violation then
      select * into v_spin from public.campaign_spins where customer_id = v_customer.id;
      if found then
        return jsonb_build_object(
          'reward_ml', v_spin.reward_ml, 'claim_id', v_spin.claim_id,
          'customer_name', v_customer.full_name, 'spun_at', v_spin.spun_at,
          'already_spun', true);
      end if;
      v_attempt := v_attempt + 1;            -- claim-id collision: retry
      if v_attempt > 5 then raise exception 'CLAIM_ID_GENERATION_FAILED'; end if;
    end;
  end loop;

  return jsonb_build_object(
    'reward_ml', v_spin.reward_ml, 'claim_id', v_spin.claim_id,
    'customer_name', v_customer.full_name, 'spun_at', v_spin.spun_at,
    'already_spun', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- get_my_status(): lets the app resume at the right step after a refresh
-- -----------------------------------------------------------------------------
create or replace function public.get_my_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_customer public.customers;
  v_spin     public.campaign_spins;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_customer from public.customers where auth_user_id = v_uid;
  if not found then
    return jsonb_build_object('status', 'unregistered');
  end if;

  select * into v_spin from public.campaign_spins where customer_id = v_customer.id;
  if found then
    return jsonb_build_object(
      'status', 'spun', 'full_name', v_customer.full_name, 'mobile', v_customer.mobile,
      'reward_ml', v_spin.reward_ml, 'claim_id', v_spin.claim_id, 'spun_at', v_spin.spun_at);
  end if;

  return jsonb_build_object(
    'status', case when v_customer.otp_verified then 'verified' else 'registered' end,
    'full_name', v_customer.full_name, 'mobile', v_customer.mobile);
end;
$$;

-- =============================================================================
-- Admin RPCs (each one re-checks is_admin(); RLS alone is not relied upon)
-- =============================================================================

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  return jsonb_build_object(
    'total_registrations', (select count(*) from public.customers),
    'verified_customers',  (select count(*) from public.customers where otp_verified),
    'total_spins',         (select count(*) from public.campaign_spins),
    'redeemed',            (select count(*) from public.campaign_spins where redemption_status = 'redeemed'),
    'pending',             (select count(*) from public.campaign_spins where redemption_status = 'pending'),
    'distribution', (
      select coalesce(jsonb_agg(jsonb_build_object('reward_ml', d.ml, 'count', d.cnt) order by d.ml), '[]'::jsonb)
      from (
        select r.ml, count(s.id) as cnt
        from (values (10), (20), (30), (40), (45)) as r(ml)
        left join public.campaign_spins s on s.reward_ml = r.ml
        group by r.ml
      ) d
    ),
    'recent_winners', (
      select coalesce(jsonb_agg(w order by w.spun_at desc), '[]'::jsonb)
      from (
        select c.full_name, c.mobile, s.reward_ml, s.claim_id, s.spun_at, s.redemption_status
        from public.campaign_spins s
        join public.customers c on c.id = s.customer_id
        order by s.spun_at desc
        limit 8
      ) w
    )
  );
end;
$$;

create or replace function public.admin_list_records(
  p_search     text        default null,
  p_from       timestamptz default null,
  p_to         timestamptz default null,
  p_reward     int         default null,
  p_redemption text        default null,
  p_limit      int         default 10,
  p_offset     int         default 0
)
returns table (
  customer_id       uuid,
  full_name         text,
  mobile            text,
  registered_at     timestamptz,
  otp_verified      boolean,
  spin_id           uuid,
  reward_ml         int,
  claim_id          text,
  spun_at           timestamptz,
  redemption_status text,
  redeemed_at       timestamptz,
  total_count       bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_pat    text;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  p_limit  := least(greatest(coalesce(p_limit, 10), 1), 1000);
  p_offset := greatest(coalesce(p_offset, 0), 0);

  if v_search is not null then
    -- escape LIKE wildcards typed by the admin
    v_pat := '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  return query
    select c.id, c.full_name, c.mobile, c.created_at, c.otp_verified,
           s.id, s.reward_ml, s.claim_id, s.spun_at, s.redemption_status, s.redeemed_at,
           count(*) over ()
    from public.customers c
    left join public.campaign_spins s on s.customer_id = c.id
    where (v_pat is null or c.full_name ilike v_pat or c.mobile ilike v_pat)
      and (p_from is null or c.created_at >= p_from)
      and (p_to   is null or c.created_at <  p_to)
      and (p_reward is null or s.reward_ml = p_reward)
      and (p_redemption is null or s.redemption_status = p_redemption)
    order by c.created_at desc, c.id
    limit p_limit offset p_offset;
end;
$$;

create or replace function public.admin_set_redemption(p_spin_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spin public.campaign_spins;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_status not in ('pending', 'redeemed') then raise exception 'INVALID_STATUS'; end if;

  update public.campaign_spins
     set redemption_status = p_status,
         redeemed_at = case when p_status = 'redeemed' then now() else null end,
         redeemed_by = case when p_status = 'redeemed' then auth.uid() else null end
   where id = p_spin_id
   returning * into v_spin;

  if not found then raise exception 'NOT_FOUND'; end if;

  return jsonb_build_object(
    'spin_id', v_spin.id, 'redemption_status', v_spin.redemption_status,
    'redeemed_at', v_spin.redeemed_at);
end;
$$;

-- =============================================================================
-- Execute privileges: lock everything down, then grant explicitly.
-- (anon-role requests can call nothing; customers use anonymous *auth* sessions,
--  which carry the `authenticated` role.)
-- =============================================================================
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin()                                  to authenticated;
grant execute on function public.register_customer(text, text)               to authenticated;
grant execute on function public.verify_otp(text)                            to authenticated;
grant execute on function public.spin_wheel()                                to authenticated;
grant execute on function public.get_my_status()                             to authenticated;
grant execute on function public.admin_dashboard_stats()                     to authenticated;
grant execute on function public.admin_list_records(text, timestamptz, timestamptz, int, text, int, int)
                                                                             to authenticated;
grant execute on function public.admin_set_redemption(uuid, text)            to authenticated;
-- config_value() and gen_claim_id() stay internal (no grant).
