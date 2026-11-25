import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CampaignShell } from '../../components/customer/CampaignShell';
import { OtpInput } from '../../components/customer/OtpInput';
import { Spinner } from '../../components/common/Spinner';
import { useCampaign } from '../../context/CampaignContext';
import { verifyOtp } from '../../services/campaignService';
import { config } from '../../lib/config';
import { maskMobile } from '../../lib/validation';
import { toMessage } from '../../lib/errors';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const { status, refresh } = useCampaign();

  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const inFlight = useRef(false);

  const submit = async () => {
    if (otp.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const res = await verifyOtp(otp);
      if (res.verified) {
        await refresh();
        navigate('/spin', { replace: true });
      } else {
        setOtp('');
        setError(
          res.attempts_left > 0
            ? `Incorrect OTP. ${res.attempts_left} attempt${res.attempts_left === 1 ? '' : 's'} left.`
            : 'Too many incorrect attempts.',
        );
      }
    } catch (e) {
      setError(toMessage(e));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <CampaignShell>
      <div className="glass-card space-y-5">
        <div className="text-center">
          <h1 className="font-display text-2xl font-extrabold">Verify your number</h1>
          <p className="mt-1 text-sm text-white/70">
            Enter the 4-digit OTP for <span className="font-semibold text-white">{maskMobile(status.mobile)}</span>
          </p>
        </div>

        {config.devOtpEnabled && (
          <div
            role="note"
            className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-300/15 px-4 py-3 text-center text-sm"
          >
            <p className="font-extrabold uppercase tracking-wide text-amber-300">⚠ Development-only OTP</p>
            <p className="mt-1 text-white/90">
              No SMS is sent. Use OTP <strong className="font-mono text-base text-amber-200">1234</strong>. This
              verification is for testing and will be replaced before launch.
            </p>
          </div>
        )}

        <OtpInput value={otp} onChange={setOtp} disabled={submitting} hasError={!!error} />

        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        <button type="button" className="btn-primary" onClick={() => void submit()} disabled={submitting || otp.length !== 4}>
          {submitting ? (
            <>
              <Spinner /> Verifying…
            </>
          ) : (
            'Verify & Continue →'
          )}
        </button>

        <div className="flex items-center justify-between text-sm text-white/70">
          <Link to="/register" className="underline underline-offset-2">
            Change number
          </Link>
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => {
              setResent(true);
              setOtp('');
              setError(null);
            }}
          >
            {resent ? 'OTP re-sent (dev)' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </CampaignShell>
  );
}
