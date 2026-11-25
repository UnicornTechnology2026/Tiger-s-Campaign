export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function FullPageSpinner({ label = 'Loading…', dark = false }: { label?: string; dark?: boolean }) {
  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center gap-3 ${
        dark ? 'bg-ink-900 text-white' : 'bg-slate-50 text-slate-600'
      }`}
      role="status"
    >
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
