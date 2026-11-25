const env = import.meta.env;

export const config = {
  supabaseUrl: (env.VITE_SUPABASE_URL as string | undefined) ?? '',
  supabaseAnonKey: (env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '',
  campaignName: (env.VITE_CAMPAIGN_NAME as string | undefined) || 'Spin & Win',
  outletName: (env.VITE_OUTLET_NAME as string | undefined) || 'our outlet',
  /** UI hint only. The server decides whether the dev OTP is accepted. */
  devOtpEnabled: env.VITE_DEV_OTP_ENABLED === 'true',
};

export const isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
