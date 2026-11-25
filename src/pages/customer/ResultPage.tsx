import { useEffect, useRef, useState } from 'react';
import { CampaignShell } from '../../components/customer/CampaignShell';
import { useCampaign } from '../../context/CampaignContext';
import { celebrate } from '../../lib/confetti';
import { config } from '../../lib/config';

export default function ResultPage() {
  const { status } = useCampaign();
  const [copied, setCopied] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    celebrate(2500);
  }, []);

  const copy = async () => {
    if (!status.claim_id) return;
    try {
      await navigator.clipboard.writeText(status.claim_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the ID is still on screen */
    }
  };

  const spunAt = status.spun_at ? new Date(status.spun_at).toLocaleString('en-IN') : '';

  return (
    <CampaignShell>
      <div className="text-center">
        <p className="animate-pop text-6xl" aria-hidden="true">
          🎉
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Congratulations, {status.full_name?.split(' ')[0]}!</h1>
        <p className="text-white/80">You&apos;ve won</p>
      </div>

      <div className="glass-card mt-5 animate-pop text-center">
        <p className="bg-gradient-to-r from-amber-300 via-orange-400 to-brand-400 bg-clip-text font-display text-7xl font-extrabold leading-none text-transparent">
          {status.reward_ml}
          <span className="ml-2 text-3xl">ML</span>
        </p>

        <dl className="mt-6 space-y-3 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-white/60">Winner</dt>
            <dd className="font-semibold">{status.full_name}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/60">Claim ID</dt>
            <dd className="flex items-center gap-2">
              <span className="rounded-lg bg-white px-3 py-1 font-mono text-base font-bold tracking-wider text-ink-900">
                {status.claim_id}
              </span>
              <button
                type="button"
                onClick={() => void copy()}
                className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </dd>
          </div>
          {spunAt && (
            <div className="flex justify-between gap-4">
              <dt className="text-white/60">Won on</dt>
              <dd className="font-medium">{spunAt}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-5 rounded-2xl bg-amber-300 p-4 text-center text-ink-900">
        <p className="font-display font-bold">Redeem your reward</p>
        <p className="mt-1 text-sm">
          Please contact the staff at {config.outletName} and show this screen with your claim ID to redeem your{' '}
          {status.reward_ml}&nbsp;ML reward. Take a screenshot to keep it safe.
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-white/60">
        Your spin has been used. Each mobile number can spin only once.
      </p>
    </CampaignShell>
  );
}
