import { useNavigate } from "react-router-dom";
import { CampaignShell } from "../../components/customer/CampaignShell";
import { routeForStage, useCampaign } from "../../context/CampaignContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { status, loading } = useCampaign();

  const label =
    status.status === "spun"
      ? "View my reward"
      : status.status === "unregistered"
        ? "Start Now"
        : "Continue";

  const go = () =>
    navigate(
      status.status === "unregistered"
        ? "/register"
        : routeForStage(status.status),
    );

  return (
    <CampaignShell>
      <div className="text-center">
        <div className="mx-auto mb-3 inline-flex animate-pop items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-amber-300 backdrop-blur">
          Scan · Spin · Win
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Spin the wheel &amp; win{" "}
          <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-brand-400 bg-clip-text text-transparent">
            exciting rewards!
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-base text-white/80">
          Every customer gets one spin every day. Win a Cap, Keychain, Coaster
          or Snacks it's waiting for you.
        </p>
      </div>

      <button
        type="button"
        className="btn-primary mt-6"
        onClick={go}
        disabled={loading}
      >
        {loading ? "Loading…" : `${label} →`}
      </button>
      <p className="mt-3 text-center text-xs text-white/50">
        Free to play · Valid at the outlet only
      </p>
    </CampaignShell>
  );
}
