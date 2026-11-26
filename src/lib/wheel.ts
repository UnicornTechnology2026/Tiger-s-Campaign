/**
 * Wheel geometry. Segment i spans [i*60°, (i+1)*60°] measured clockwise from
 * the top (12 o'clock), where the pointer sits. "better_luck" appears twice.
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

export type SegmentTone = "red" | "black";

/** Clockwise from the pointer: Cap, Keychain, Coaster, Snacks, Better Luck, Better Luck. */
export const WHEEL_SEGMENTS: ReadonlyArray<{
  reward: RewardKey;
  tone: SegmentTone;
}> = [
  { reward: "cap", tone: "red" },
  { reward: "better_luck", tone: "black" },
  { reward: "coaster", tone: "red" },
  { reward: "snacks", tone: "black" },
  { reward: "better_luck", tone: "red" },
  { reward: "keychain", tone: "black" },
];

export const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length; // 60
export const SPIN_DURATION_MS = 6000;

/** Colours used by the admin charts (one per reward). */
const CHART_COLORS: Record<RewardKey, string> = {
  cap: "#E11D2E",
  keychain: "#FFC400",
  coaster: "#00C896",
  snacks: "#2F6BFF",
  better_luck: "#64748B",
};

export function rewardColor(reward: string): string {
  return CHART_COLORS[reward as RewardKey] ?? "#888888";
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
 * Final rotation (degrees, clockwise, cumulative) that brings the middle of a
 * segment for `reward` under the pointer. If the reward appears on more than
 * one segment (better_luck), one of them is picked at random.
 * The reward itself comes from the server; this only animates to it.
 */
export function computeTargetRotation(
  currentRotation: number,
  reward: RewardKey,
): number {
  const matches = WHEEL_SEGMENTS.map((s, i) =>
    s.reward === reward ? i : -1,
  ).filter((i) => i >= 0);
  if (matches.length === 0) throw new Error(`Unknown reward ${reward}`);
  const index = matches[Math.floor(Math.random() * matches.length)];
  const center = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const jitter = (Math.random() * 2 - 1) * 22; // stays inside the ±30° segment
  const base = Math.ceil(currentRotation / 360) * 360;
  const fullTurns = 360 * 6;
  return base + fullTurns + ((360 - center) % 360) + jitter;
}
