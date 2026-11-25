import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Safety net: the fixed development OTP must never ship in a production
  // build by accident. Set VITE_ALLOW_DEV_OTP_IN_PRODUCTION_BUILD=true only
  // for a staging/test deployment.
  if (
    mode === 'production' &&
    env.VITE_DEV_OTP_ENABLED === 'true' &&
    env.VITE_ALLOW_DEV_OTP_IN_PRODUCTION_BUILD !== 'true'
  ) {
    throw new Error(
      '\n\nVITE_DEV_OTP_ENABLED=true in a production build.\n' +
        'The fixed development OTP (1234) must not be deployed to production.\n' +
        'Set VITE_DEV_OTP_ENABLED=false (and run supabase/production/disable_dev_otp.sql),\n' +
        'or for a staging deployment set VITE_ALLOW_DEV_OTP_IN_PRODUCTION_BUILD=true.\n',
    );
  }

  return {
    plugins: [react()],
    server: { port: 5173 },
  };
});
