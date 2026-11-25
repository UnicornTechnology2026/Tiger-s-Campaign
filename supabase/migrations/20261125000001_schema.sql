-- =============================================================================
-- Migration 1: schema, constraints and Row Level Security
-- Spin the Wheel reward campaign
-- =============================================================================
-- Design notes
--  * Customers are identified by their Supabase *anonymous* auth session
--    (auth.uid() from the JWT). The browser never sends a customer id.
--  * All customer writes go through SECURITY DEFINER functions (migration 2).
--    Customers have NO direct table access.
--  * Admins are Supabase Auth users listed in public.admin_users.
--    They get read access via RLS and update redemption via an RPC.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- app_config: server-side switches (never readable from the browser)
-- -----------------------------------------------------------------------------
create table public.app_config (
  key   text primary key,
  value text not null
);

insert into public.app_config (key, value) values
  ('campaign_active',  'true'),
  -- DEVELOPMENT ONLY. Set to 'false' before going live (see supabase/production/).
  ('dev_otp_enabled',  'true'),
  ('dev_otp',          '1234');

-- -----------------------------------------------------------------------------
-- admin_users
-- -----------------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
create table public.customers (
  id              uuid primary key default gen_random_uuid(),
  -- anonymous auth session that owns this registration (set by RPC only)
  auth_user_id    uuid unique references auth.users (id) on delete set null,
  full_name       text not null check (char_length(full_name) between 2 and 60),
  mobile          text not null unique check (mobile ~ '^[6-9][0-9]{9}$'),
  otp_verified    boolean not null default false,
  otp_verified_at timestamptz,
  otp_attempts    integer not null default 0,
  created_at      timestamptz not null default now()
);

create index customers_created_at_idx on public.customers (created_at desc);

-- -----------------------------------------------------------------------------
-- campaign_spins  (UNIQUE customer_id = one spin per customer / mobile number)
-- -----------------------------------------------------------------------------
create table public.campaign_spins (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null unique references public.customers (id) on delete restrict,
  reward_ml         integer not null check (reward_ml in (45, 10, 20, 40, 30)),
  claim_id          text not null unique,
  spun_at           timestamptz not null default now(),
  redemption_status text not null default 'pending'
                      check (redemption_status in ('pending', 'redeemed')),
  redeemed_at       timestamptz,
  redeemed_by       uuid references auth.users (id) on delete set null,
  constraint redeemed_consistency
    check ((redemption_status = 'redeemed') = (redeemed_at is not null))
);

create index campaign_spins_reward_idx     on public.campaign_spins (reward_ml);
create index campaign_spins_redemption_idx on public.campaign_spins (redemption_status);
create index campaign_spins_spun_at_idx    on public.campaign_spins (spun_at desc);

-- -----------------------------------------------------------------------------
-- Helper: is the current JWT an admin?
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.app_config     enable row level security;
alter table public.admin_users    enable row level security;
alter table public.customers      enable row level security;
alter table public.campaign_spins enable row level security;

-- Start from zero privileges, then grant only what is needed.
revoke all on public.app_config, public.admin_users, public.customers, public.campaign_spins
  from public, anon, authenticated;

grant select on public.admin_users, public.customers, public.campaign_spins to authenticated;

-- app_config: no policies and no grants => unreachable from the API.

-- admin_users: an admin may read their own membership row only.
create policy admin_users_select_self on public.admin_users
  for select to authenticated
  using (user_id = auth.uid());

-- customers / campaign_spins: admins can read everything. Nobody can insert,
-- update or delete through the API (no such policies exist); writes happen
-- exclusively in SECURITY DEFINER functions.
create policy customers_admin_select on public.customers
  for select to authenticated
  using (public.is_admin());

create policy campaign_spins_admin_select on public.campaign_spins
  for select to authenticated
  using (public.is_admin());
