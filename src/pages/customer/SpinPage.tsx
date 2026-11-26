import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignShell } from "../../components/customer/CampaignShell";
import { Wheel } from "../../components/customer/Wheel";
import { useCampaign } from "../../context/CampaignContext";
import { spinWheel } from "../../services/campaignService";
import { celebrate } from "../../lib/confetti";
import { toMessage } from "../../lib/errors";
import { REWARD_INFO, type RewardKey } from "../../lib/wheel";
import type { SpinResult } from "../../types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SpinPage() {
  const navigate = useNavigate();
  const { status, applySpin } = useCampaign();

  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<RewardKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const resultRef = useRef<SpinResult | null>(null);

  const onSpinClick = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await spinWheel();
      if (!result?.reward || !(result.reward in REWARD_INFO)) {
        throw new Error(
          "Unexpected reward returned: " + String(result?.reward),
        );
      }
      resultRef.current = result;
      setTarget(result.reward);
    } catch (e) {
      console.error("spin failed", e);
      setError(toMessage(e));
      inFlight.current = false;
    } finally {
      setBusy(false);
    }
  }, []);

  const onFinished = useCallback(async () => {
    try {
      if (target !== "better_luck") celebrate();
    } catch (e) {
      console.error("confetti failed", e); // never block the redirect
    }
    await sleep(1600);
    if (resultRef.current) applySpin(resultRef.current);
    navigate("/result", { replace: true });
  }, [navigate, applySpin, target]);

  return (
    <CampaignShell>
      <div className="text-center -mt-2">
        <p className="text-2xl mb-2">
          Hi {status.full_name?.split(" ")[0] ?? "there"} 👋
        </p>
        <h1 className="font-display text-3xl font-extrabold">
          {target === null ? "Spin Your Luck!" : "Good luck… 🤞"}
        </h1>
      </div>

      <div className="mt-8 mb-6">
        <Wheel
          target={target}
          busy={busy}
          onSpinClick={() => void onSpinClick()}
          onFinished={() => void onFinished()}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-500/20 px-4 py-3 text-center text-sm font-medium text-red-100"
        >
          {error}
        </div>
      )}
      <p className="mt-2 text-center text-sm text-white/60">
        One spin per day — make it count!
      </p>
    </CampaignShell>
  );
}
