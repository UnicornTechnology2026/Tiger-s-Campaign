import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const url = config.supabaseUrl || 'http://localhost:54321';
const key = config.supabaseAnonKey || 'missing-anon-key';

/**
 * Two separate clients with separate session storage keys, so an admin who is
 * signed in at /admin and a customer testing the wheel in the same browser can
 * never share (or overwrite) each other's session.
 *
 * Only the public anon key is used here. The service-role key is never
 * referenced anywhere in this project.
 */
export const customerSupabase = createClient(url, key, {
  auth: {
    storageKey: 'sw-customer-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const adminSupabase = createClient(url, key, {
  auth: {
    storageKey: 'sw-admin-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
