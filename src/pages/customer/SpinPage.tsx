import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignShell } from '../../components/customer/CampaignShell';
import { Wheel } from '../../components/customer/Wheel';
import { useCampaign } from '../../context/CampaignContext';
import { spinWheel } from '../../services/campaignService';
import { celebrate } from '../../lib/confetti';
import { toMessage } from '../../lib/errors';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SpinPage() {
  const navigate = useNavigate();
  const { status, refresh } = useCampaign();

  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const onSpinClick = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      // The server picks the reward and stores it atomically. The wheel then
      // animates to exactly that reward.
      const result = await spinWheel();
      setTarget(result.reward_ml);
    } catch (e) {
      setError(toMessage(e));
      inFlight.current = false; // nothing was recorded, so a retry is safe
    } finally {
      setBusy(false);
    }
  }, []);

  const onFinished = useCallback(async () => {
    celebrate();
    await sleep(1600);
    await refresh();
    navigate('/result', { replace: true });
  }, [navigate, refresh]);

  return (
    <CampaignShell>
      <div className="text-center">
        <p className="text-sm text-white/70">Hi {status.full_name?.split(' ')[0] ?? 'there'} 👋</p>
        <h1 className="font-display text-3xl font-extrabold">
          {target === null ? 'Tap SPIN to win!' : 'Good luck… 🤞'}
        </h1>
      </div>

      <div className="mt-8 mb-6">
        <Wheel target={target} busy={busy} onSpinClick={() => void onSpinClick()} onFinished={() => void onFinished()} />
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-500/20 px-4 py-3 text-center text-sm font-medium text-red-100">
          {error}
        </div>
      )}
      <p className="mt-2 text-center text-sm text-white/60">You get one spin only — make it count!</p>
    </CampaignShell>
  );
}
