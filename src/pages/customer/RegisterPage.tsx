import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignShell } from "../../components/customer/CampaignShell";
import { Spinner } from "../../components/common/Spinner";
import { useCampaign } from "../../context/CampaignContext";
import { registerCustomer } from "../../services/campaignService";
import {
  normalizeMobileInput,
  validateMobile,
  validateName,
} from "../../lib/validation";
import { toMessage } from "../../lib/errors";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { status, refresh } = useCampaign();

  const [name, setName] = useState(status.full_name ?? "");
  const [mobile, setMobile] = useState(status.mobile ?? "");
  const [touched, setTouched] = useState({ name: false, mobile: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const inFlight = useRef(false); // blocks double taps / duplicate submissions

  const nameError = validateName(name);
  const mobileError = validateMobile(mobile);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, mobile: true });
    setServerError(null);
    if (nameError || mobileError || inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    try {
      await registerCustomer(name.trim().replace(/\s+/g, " "), mobile);
      await refresh();
      navigate("/verify");
    } catch (err) {
      setServerError(toMessage(err));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <CampaignShell>
      <form onSubmit={onSubmit} noValidate className="space-y-5 glass-card  ">
        <div className="text-center">
          <h1 className="font-display text-2xl font-extrabold">
            Get ready to spin!
          </h1>
        </div>

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
            Full name
          </label>
          <input
            id="name"
            className="field-input"
            placeholder="e.g. Rahul Sharma"
            autoComplete="name"
            value={name}
            maxLength={60}
            disabled={submitting}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            aria-invalid={touched.name && !!nameError}
          />
          {touched.name && nameError && (
            <p className="mt-1.5 text-sm font-medium text-red-300">
              {nameError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="mobile"
            className="mb-1.5 block text-sm font-semibold"
          >
            Mobile number
          </label>
          <div className="flex overflow-hidden rounded-xl border border-white/30 bg-white/95 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/40">
            <span className="flex items-center border-r border-slate-200 bg-slate-100 px-3 text-base font-semibold text-slate-600">
              +91
            </span>
            <input
              id="mobile"
              className="w-full bg-transparent px-4 py-3.5 text-base text-slate-900 placeholder-slate-400 outline-none"
              placeholder="10-digit mobile number"
              inputMode="numeric"
              autoComplete="tel-national"
              value={mobile}
              disabled={submitting}
              onChange={(e) => setMobile(normalizeMobileInput(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
              aria-invalid={touched.mobile && !!mobileError}
            />
          </div>
          {touched.mobile && mobileError && (
            <p className="mt-1.5 text-sm font-medium text-red-300">
              {mobileError}
            </p>
          )}
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-xl bg-red-500/20 px-4 py-3 text-sm font-medium text-red-100"
          >
            {serverError}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner /> Sending OTP…
            </>
          ) : (
            "Send OTP →"
          )}
        </button>
      </form>
    </CampaignShell>
  );
}
