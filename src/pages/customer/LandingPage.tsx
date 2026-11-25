import { useNavigate } from 'react-router-dom';
import { CampaignShell } from '../../components/customer/CampaignShell';
import { routeForStage, useCampaign } from '../../context/CampaignContext';
import { config } from '../../lib/config';

const STEPS = [
  { icon: '📝', title: 'Register', text: 'Enter your name and mobile number' },
  { icon: '🔐', title: 'Verify', text: 'Confirm your number with an OTP' },
  { icon: '🎡', title: 'Spin once', text: 'Spin the wheel and win up to 45 ML' },
  { icon: '🏪', title: 'Redeem', text: `Show your claim ID to the staff at ${config.outletName}` },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { status, loading } = useCampaign();

  const label =
    status.status === 'spun'
      ? 'View my reward'
      : status.status === 'unregistered'
        ? 'Start Now'
        : 'Continue';

  const go = () => navigate(status.status === 'unregistered' ? '/register' : routeForStage(status.status));

  return (
    <CampaignShell>
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex animate-pop items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-amber-300 backdrop-blur">
          ✨ Scan · Spin · Win
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Spin the wheel &amp; win{' '}
          <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-brand-400 bg-clip-text text-transparent">
            free ML!
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-base text-white/80">
          Every customer gets one spin. 10, 20, 30, 40 or a jackpot 45&nbsp;ML — it&apos;s waiting for you.
        </p>
      </div>

      <div className="glass-card mt-7">
        <h2 className="mb-4 text-center font-display text-sm font-bold uppercase tracking-widest text-amber-300">
          How it works
        </h2>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl">
                {s.icon}
              </span>
              <div className="text-left">
                <p className="font-semibold leading-tight">
                  {i + 1}. {s.title}
                </p>
                <p className="text-sm text-white/70">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <button type="button" className="btn-primary mt-6" onClick={go} disabled={loading}>
        {loading ? 'Loading…' : `${label} →`}
      </button>
      <p className="mt-3 text-center text-xs text-white/50">Free to play · Valid at the outlet only</p>
    </CampaignShell>
  );
}
