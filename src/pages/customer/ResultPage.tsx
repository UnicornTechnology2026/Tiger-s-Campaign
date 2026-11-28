import { useEffect, useRef } from "react";
import { CampaignShell } from "../../components/customer/CampaignShell";
import { useCampaign } from "../../context/CampaignContext";
import { celebrate } from "../../lib/confetti";
import { rewardLabel } from "../../lib/wheel";
import { formatDateTime } from "../../lib/formatDate";

export default function ResultPage() {
  const { status } = useCampaign();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (status.reward !== "better_luck") celebrate(2500);
  }, []);

  const noPrize = status.reward === "better_luck";
  const spunAt = status.spun_at ? formatDateTime(status.spun_at) : "";

  return (
    <CampaignShell>
      <div className="text-center">
        <p className="animate-pop text-6xl" aria-hidden="true">
          {noPrize ? "😭" : "🎉"}
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
        <p className="bg-gradient-to-r from-red-300 via-red-400 to-amber-500 bg-clip-text font-display text-4xl font-extrabold leading-tight text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
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

      <p className="mt-4 text-center text-xs text-white/60">
        Today's spin has been used. Come back tomorrow for another spin!
      </p>
    </CampaignShell>
  );
}
