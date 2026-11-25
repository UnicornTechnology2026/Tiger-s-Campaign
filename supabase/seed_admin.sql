-- =============================================================================
-- Make an existing Supabase Auth user an admin.
--
-- 1. Supabase Dashboard -> Authentication -> Users -> "Add user" -> "Create new user"
--    Enter the admin's email + a strong password and tick "Auto Confirm User".
-- 2. Replace the email below and run this in the SQL Editor.
--
-- No admin credentials are stored in the codebase; admins exist only in
-- Supabase Auth + this table.
-- =============================================================================
insert into public.admin_users (user_id)
select id from auth.users where email = 'admin@example.com'   -- <-- CHANGE ME
on conflict (user_id) do nothing;

-- Verify (should return one row):
select u.email, a.created_at
from public.admin_users a
join auth.users u on u.id = a.user_id;
