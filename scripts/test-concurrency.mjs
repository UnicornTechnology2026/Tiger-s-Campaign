// End-to-end concurrency / duplicate test against your real Supabase project.
//
//   npm run test:concurrency        (reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env)
//
// Requires Node 20.6+ and "Allow anonymous sign-ins" enabled in Supabase Auth.
// Creates a few test customers (mobile numbers starting 90000) - delete them afterwards:
//   delete from public.campaign_spins where customer_id in (select id from public.customers where mobile like '90000%');
//   delete from public.customers where mobile like '90000%';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const newClient = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const suffix = String(Date.now()).slice(-5);
const mobileA = `90000${suffix}`; // 10 digits, starts with 9
const mobileB = `90001${suffix}`;

async function signedIn() {
  const c = newClient();
  const { error } = await c.auth.signInAnonymously();
  if (error) throw error;
  return c;
}

// --- Test 1: 25 parallel spins from one verified customer => exactly one spin
{
  const c = await signedIn();
  await c.rpc('register_customer', { p_name: 'Concurrency Test', p_mobile: mobileA });
  await c.rpc('verify_otp', { p_otp: '1234' });
  const results = await Promise.all(Array.from({ length: 25 }, () => c.rpc('spin_wheel')));
  const ok = results.filter((r) => !r.error).map((r) => r.data);
  const claims = new Set(ok.map((r) => r.claim_id));
  const rewards = new Set(ok.map((r) => r.reward_ml));
  const firsts = ok.filter((r) => r.already_spun === false).length;
  check('25 parallel spins return one claim id', claims.size === 1, `${claims.size} distinct`);
  check('25 parallel spins return one reward', rewards.size === 1, [...rewards].join(','));
  check('exactly one call created the spin', firsts === 1, `${firsts} created`);
}

// --- Test 2: same mobile from a second session after spinning => rejected
{
  const c = await signedIn();
  const { error } = await c.rpc('register_customer', { p_name: 'Someone Else', p_mobile: mobileA });
  check('re-registering a spun mobile is rejected', error?.message === 'ALREADY_PARTICIPATED', error?.message);
}

// --- Test 3: spinning without OTP verification is rejected
{
  const c = await signedIn();
  await c.rpc('register_customer', { p_name: 'No Otp', p_mobile: mobileB });
  const { error } = await c.rpc('spin_wheel');
  check('spin before OTP verification is rejected', error?.message === 'OTP_NOT_VERIFIED', error?.message);
  const wrong = await c.rpc('verify_otp', { p_otp: '9999' });
  check('wrong OTP does not verify', wrong.data?.verified === false);
}

// --- Test 4: customers cannot read tables or call admin functions
{
  const c = await signedIn();
  const { data } = await c.from('customers').select('*');
  check('customer cannot read customers table', (data ?? []).length === 0);
  const cfg = await c.from('app_config').select('*');
  check('customer cannot read app_config', !!cfg.error || (cfg.data ?? []).length === 0);
  const stats = await c.rpc('admin_dashboard_stats');
  check('customer cannot call admin_dashboard_stats', stats.error?.message === 'FORBIDDEN', stats.error?.message);
  const redeem = await c.rpc('admin_set_redemption', {
    p_spin_id: '00000000-0000-0000-0000-000000000000',
    p_status: 'redeemed',
  });
  check('customer cannot change redemption', redeem.error?.message === 'FORBIDDEN', redeem.error?.message);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
