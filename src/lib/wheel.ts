/**
 * Wheel geometry. Segment i spans [i*72°, (i+1)*72°] measured clockwise from
 * the top (12 o'clock), where the pointer sits. The order below is the order
 * the rewards appear on the wheel.
 */
export type RewardKey =
  | "cap"
  | "keychain"
  | "coaster"
  | "snacks"
  | "better_luck";

export const REWARD_INFO: Record<
  RewardKey,
  { label: string; emoji: string; lines: [string] | [string, string] }
> = {
  cap: { label: "Cap", emoji: "🧢", lines: ["CAP"] },
  keychain: { label: "Keychain", emoji: "🔑", lines: ["KEYCHAIN"] },
  coaster: { label: "Coaster", emoji: "🥃", lines: ["COASTER"] },
  snacks: { label: "Snacks worth ₹10", emoji: "🍿", lines: ["SNACKS", "₹10"] },
  better_luck: {
    label: "Better Luck Next Time",
    emoji: "🍀",
    lines: ["BETTER LUCK", "NEXT TIME"],
  },
};

export const REWARD_KEYS = Object.keys(REWARD_INFO) as RewardKey[];

export function rewardLabel(reward: string | null | undefined): string {
  return reward && reward in REWARD_INFO
    ? REWARD_INFO[reward as RewardKey].label
    : "";
}

export function rewardEmoji(reward: string | null | undefined): string {
  return reward && reward in REWARD_INFO
    ? REWARD_INFO[reward as RewardKey].emoji
    : "🎁";
}

/** 1st Cap, 2nd Keychain, 3rd Coaster, 4th Snacks ₹10, 5th Better Luck Next Time. */
export const WHEEL_SEGMENTS: ReadonlyArray<{
  reward: RewardKey;
  fill: string;
  text: string;
}> = [
  { reward: "cap", fill: "#FF2E63", text: "#FFFFFF" },
  { reward: "keychain", fill: "#FFC400", text: "#3A2400" },
  { reward: "coaster", fill: "#00C896", text: "#FFFFFF" },
  { reward: "snacks", fill: "#2F6BFF", text: "#FFFFFF" },
  { reward: "better_luck", fill: "#64748B", text: "#FFFFFF" },
];

export const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length; // 72
export const SPIN_DURATION_MS = 6000;

export function rewardColor(reward: string): string {
  return WHEEL_SEGMENTS.find((s) => s.reward === reward)?.fill ?? "#888888";
}

export function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

export function segmentPath(
  index: number,
  r: number,
  cx = 200,
  cy = 200,
): string {
  const a0 = index * SEGMENT_ANGLE;
  const a1 = (index + 1) * SEGMENT_ANGLE;
  const s = polar(cx, cy, r, a0);
  const e = polar(cx, cy, r, a1);
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

/**
 * Final rotation (degrees, clockwise, cumulative) that brings the middle of the
 * segment for `reward` under the pointer. A small random offset keeps it
 * looking natural but always stays well inside the segment (±26° of ±36°).
 * The reward itself comes from the server; this only animates to it.
 */
export function computeTargetRotation(
  currentRotation: number,
  reward: RewardKey,
): number {
  const index = WHEEL_SEGMENTS.findIndex((s) => s.reward === reward);
  if (index < 0) throw new Error(`Unknown reward ${reward}`);
  const center = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const jitter = (Math.random() * 2 - 1) * 26;
  const base = Math.ceil(currentRotation / 360) * 360;
  const fullTurns = 360 * 6;
  return base + fullTurns + ((360 - center) % 360) + jitter;
}
