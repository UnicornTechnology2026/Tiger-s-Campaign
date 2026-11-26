import { useEffect, useRef } from "react";
import { CampaignShell } from "../../components/customer/CampaignShell";
import { useCampaign } from "../../context/CampaignContext";
import { celebrate } from "../../lib/confetti";
import { config } from "../../lib/config";
import { rewardLabel } from "../../lib/wheel";

export default function ResultPage() {
  const { status } = useCampaign();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (status.reward !== "better_luck") celebrate(2500);
  }, []);

  const noPrize = status.reward === "better_luck";
  const spunAt = status.spun_at
    ? new Date(status.spun_at).toLocaleString("en-IN")
    : "";

  return (
    <CampaignShell>
      <div className="text-center">
        <p className="animate-pop text-6xl" aria-hidden="true">
          {noPrize ? "🍀" : "🎉"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          {noPrize
            ? `Thanks for playing, ${status.full_name?.split(" ")[0]}!`
            : `Congratulations, ${status.full_name?.split(" ")[0]}!`}
        </h1>
        <p className="text-white/80">
          {noPrize ? "This time the wheel says" : "You've won"}
        </p>
      </div>

      <div className="glass-card mt-5 animate-pop text-center">
        <p className="bg-gradient-to-r from-amber-300 via-orange-400 to-brand-400 bg-clip-text font-display text-4xl font-extrabold leading-tight text-transparent">
          {rewardLabel(status.reward)}
        </p>

        <dl className="mt-6 space-y-3 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-white/60">Winner</dt>
            <dd className="font-semibold">{status.full_name}</dd>
          </div>

          {spunAt && (
            <div className="flex justify-between gap-4">
              <dt className="text-white/60">Won on</dt>
              <dd className="font-medium">{spunAt}</dd>
            </div>
          )}
        </dl>
      </div>

      {noPrize && (
        <div className="mt-5 rounded-2xl bg-white/10 p-4 text-center">
          <p className="font-display font-bold">Better luck next time!</p>
          <p className="mt-1 text-sm text-white/80">
            Visit {config.outletName} again for more offers.
          </p>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-white/60">
        Today's spin has been used. Come back tomorrow for another spin!
      </p>
    </CampaignShell>
  );
}
