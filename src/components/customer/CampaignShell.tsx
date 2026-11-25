import type { ReactNode } from 'react';
import { config } from '../../lib/config';

/** Mobile-first gradient backdrop shared by all customer pages. */
export function CampaignShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-[#5b1a8f] text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl animate-float [animation-delay:1.5s]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl animate-float [animation-delay:3s]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="mb-4 flex items-center justify-center gap-2 py-2">
          <span className="text-2xl" aria-hidden="true">
            🎡
          </span>
          <span className="font-display text-lg font-extrabold tracking-wide">{config.campaignName}</span>
        </header>
        <main className="flex flex-1 flex-col justify-center">{children}</main>
        <footer className="mt-6 text-center text-xs text-white/50">
          One spin per mobile number · Redeem at the outlet
        </footer>
      </div>
    </div>
  );
}
