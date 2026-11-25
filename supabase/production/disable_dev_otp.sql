-- =============================================================================
-- RUN THIS BEFORE GOING LIVE.
-- Turns the development-only fixed OTP (1234) off on the server.
-- After this, verify_otp() refuses to verify anyone until you integrate a real
-- OTP provider (e.g. an Edge Function calling an SMS gateway, or Supabase
-- phone auth) and update verify_otp() accordingly.
-- =============================================================================
update public.app_config set value = 'false' where key = 'dev_otp_enabled';
delete from public.app_config where key = 'dev_otp';

select key, value from public.app_config;
