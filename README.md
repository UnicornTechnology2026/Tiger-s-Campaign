# Spin & Win — QR Spin-the-Wheel Reward Campaign

React + Vite + TypeScript + Tailwind CSS + Supabase.
Customers scan one QR code, register, verify (development OTP), spin once, and get a claim ID to redeem with outlet staff. Admins manage everything at `/admin`.

## How it works (security model)

| Concern | How it is enforced |
|---|---|
| Customer identity | Supabase **anonymous auth session**. The server reads `auth.uid()` from the JWT; the browser never sends a customer id. |
| Reward selection | Chosen inside the Postgres function `spin_wheel()` (uniform over 45/10/20/40/30). The browser only animates to the returned value. |
| One spin per mobile | `UNIQUE(mobile)` on `customers`, `UNIQUE(customer_id)` on `campaign_spins`, a `FOR UPDATE` row lock and advisory locks. Repeat calls return the *original* result. |
| Table access | RLS enabled on every table. Customers have **no** table access; all writes go through `SECURITY DEFINER` functions. |
| Admin | Supabase Auth user listed in `admin_users`. Every admin function re-checks `is_admin()`. No credentials in code. |
| Service-role key | Never used anywhere in this project. Only the public anon key is in the frontend. |
| Dev OTP `1234` | Checked **server-side** only while `app_config.dev_otp_enabled = 'true'`. Production builds fail if `VITE_DEV_OTP_ENABLED=true`. |

```
supabase/migrations/   001 schema + RLS, 002 functions (RPC) + grants
supabase/seed_admin.sql            promote a Supabase Auth user to admin
supabase/production/disable_dev_otp.sql   run before go-live
src/pages/customer/    Landing, Register, VerifyOtp, Spin, Result
src/pages/admin/       Login, Dashboard, Records
src/components/        customer/ (Wheel, OtpInput…), admin/ (Layout, charts…)
src/services/          campaignService.ts, adminService.ts (all Supabase calls)
src/lib/               config, supabase clients, wheel math, validation, csv
scripts/               generate-qr.mjs, test-concurrency.mjs
```

---

## 1. Local setup

**Prerequisites:** Node 20+, a free [Supabase](https://supabase.com) project.

### 1.1 Supabase project
1. Create a project at supabase.com.
2. **Authentication → Sign In / Providers → enable "Allow anonymous sign-ins"** (required: customers are identified by anonymous sessions).
3. **Authentication → Sign In / Providers → Email**: keep enabled (admins sign in with email + password). You may turn off "Allow new users to sign up" so nobody can self-create accounts.

### 1.2 Run the migrations
Either:
- **SQL Editor:** paste and run, in order, `supabase/migrations/20261125000001_schema.sql` then `20261125000002_functions.sql`; or
- **CLI:** `npm i -g supabase` (or `npx supabase`), then `supabase login`, `supabase link --project-ref <ref>`, `supabase db push`.

### 1.3 Create the first admin
1. **Authentication → Users → Add user → Create new user** (email + strong password, tick *Auto Confirm User*).
2. Edit the email in `supabase/seed_admin.sql` and run it in the SQL Editor. It should return one row.

### 1.4 Configure and run the app
```bash
cd spin-wheel-campaign
cp .env.example .env        # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev                 # http://localhost:5173  (also on your LAN for phone testing)
```
Keys are in **Supabase → Project Settings → API**. Use the **anon / publishable** key only.

- Customer flow: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin/login`

> To test on a real phone, open the "Network" URL printed by Vite (same Wi-Fi).

---

## 2. Deploy to Vercel

1. Push the project to GitHub.
2. Vercel → **Add New → Project** → import the repo. Framework preset: **Vite** (build `npm run build`, output `dist`). `vercel.json` already rewrites all paths to `index.html` so `/admin/login` works on refresh.
3. **Environment Variables** (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CAMPAIGN_NAME`, `VITE_OUTLET_NAME`.
   - For a **staging** deployment that deliberately keeps the dev OTP: `VITE_DEV_OTP_ENABLED=true` **and** `VITE_ALLOW_DEV_OTP_IN_PRODUCTION_BUILD=true`.
   - For **production**: leave `VITE_DEV_OTP_ENABLED` unset/`false`. The build fails if it is `true` without the override.
4. Deploy. Note the URL (e.g. `https://spin-win.vercel.app`) or attach your own domain.
5. **Supabase → Authentication → URL Configuration:** set *Site URL* to the deployed URL.

### Before real customers use it
- Run `supabase/production/disable_dev_otp.sql`. After this `verify_otp()` refuses everyone until you integrate a real OTP provider (SMS gateway via an Edge Function, or Supabase phone auth) and update that function.
- **Anonymous sign-in limits:** Supabase rate-limits anonymous sign-ins per IP (default is low, per hour). If many customers share the outlet Wi-Fi they may hit it. Raise it under **Authentication → Rate Limits**, and enable CAPTCHA (Turnstile/hCaptcha) under **Authentication → Attack Protection** for production.
- Without a real OTP, the mobile number is *not proven* to belong to the customer, so someone could register another person's number before they do. That is inherent to the development OTP and is closed by real OTP verification.

---

## 3. One common QR code

The same QR works for every customer and every outlet: it simply opens the campaign URL.

```bash
npm run qr -- https://your-campaign.vercel.app
# -> qr-output/campaign-qr.png (1200px, print)  and  qr-output/campaign-qr.svg (vector)
```
Tips: print at least 3×3 cm (larger for table stands); keep the white border; use the SVG for posters; test with 2–3 phone models before printing. Use a **static** QR (as generated here) rather than a paid dynamic-QR service so it can never expire. Use your own domain so the QR survives a hosting change.

---

## 4. Testing

### 4.1 Customer flow (manual)
Use a mobile number like `9876543210` (Indian format: 10 digits, starts 6–9).

| # | Steps | Expected |
|---|---|---|
| 1 | Open `/` | Landing page, "Start Now" |
| 2 | Register with name `A`, mobile `12345` | Inline validation errors, no request sent |
| 3 | Register `Test User` / `9876543210` | Moves to OTP screen with the amber **Development-only OTP** notice |
| 4 | Enter `0000` | "Incorrect OTP. 4 attempts left." (5 wrong attempts lock the registration) |
| 5 | Enter `1234` | Spin screen with 5 equal segments: 45, 10, 20, 40, 30 ML |
| 6 | Tap **SPIN** | Wheel spins ~6 s and stops exactly on the reward, confetti, then result page |
| 7 | Result page | Reward, name, claim ID `SW-XXXX-XXXX`, "contact outlet staff" message |
| 8 | Refresh / go to `/spin` | Redirected to `/result`; no second spin |
| 9 | New private window, register the same mobile | "This mobile number has already taken part…" |
| 10 | Go to `/verify` or `/spin` while not at that step | Redirected to the correct step |

### 4.2 Admin (manual)
1. `/admin` while logged out → redirected to `/admin/login`.
2. Sign in with a non-admin Supabase user → "This account is not an administrator."
3. Sign in as admin → dashboard shows registrations, verified, spins, redeemed/pending, bar + pie chart, recent winners.
4. **Customers & Winners:** search by name and by mobile; date range; reward filter; redemption filter; page size/pagination.
5. Change a row **Pending → Redeemed**; reload — it persists; the dashboard counts update.
6. **Export CSV** — opens in Excel with correct names; respects active filters.
7. Sign out → `/admin` redirects to login again.

### 4.3 Automated database / concurrency test
```bash
npm run test:concurrency     # Node 20.6+, uses .env
```
Fires 25 parallel `spin_wheel()` calls for one customer and checks: exactly one spin is created, all calls return the same claim ID/reward, a spun mobile can't re-register, spin-before-OTP is rejected, customers can't read tables or call admin functions. Clean up test rows afterwards (SQL is in the script header).

### 4.4 Fairness check (SQL editor)
```sql
select r, count(*) from (
  select (array[45,10,20,40,30])[1 + floor(random()*5)::int] as r
  from generate_series(1, 100000)
) t group by r order by r;   -- each reward should be ~20,000
```

### 4.5 Useful admin SQL
```sql
-- rewards given so far
select reward_ml, count(*) from public.campaign_spins group by 1 order by 1;
-- pause the campaign
update public.app_config set value = 'false' where key = 'campaign_active';
```

---

## 5. Notes & limits
- The wheel gives each reward a 20% chance (equal segments, uniform pick). If you later want weighted odds or stock limits, change only `spin_wheel()`; the UI needs no change.
- Supabase anonymous users accumulate; clear old ones periodically (their customer rows are kept because `auth_user_id` is `ON DELETE SET NULL`).
- `src/lib/wheel.ts` defines segment order/colours; the SQL array in `spin_wheel()` defines the allowed rewards. Keep the five values in sync if you change them (the DB also has a `CHECK` constraint).
