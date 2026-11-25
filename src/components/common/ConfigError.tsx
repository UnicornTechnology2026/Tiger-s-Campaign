export function ConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow">
        <h1 className="text-lg font-bold text-red-700">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-slate-600">
          Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to{' '}
          <code className="rounded bg-slate-100 px-1">.env</code> and set{' '}
          <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code>, then restart the dev server
          (on Vercel: add them under Project → Settings → Environment Variables and redeploy).
        </p>
      </div>
    </div>
  );
}
