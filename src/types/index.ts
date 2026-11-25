import type { RewardKey } from "../lib/wheel";

export type CustomerStage = "unregistered" | "registered" | "verified" | "spun";
export type RedemptionStatus = "pending" | "redeemed";

export interface MyStatus {
  status: CustomerStage;
  full_name: string | null;
  mobile: string | null;
  reward: RewardKey | null;
  claim_id: string | null;
  spun_at: string | null;
}

export interface OtpResult {
  verified: boolean;
  attempts_left: number;
}

export interface SpinResult {
  reward: RewardKey;
  claim_id: string;
  customer_name: string;
  spun_at: string;
  already_spun: boolean;
}

export interface DistributionItem {
  reward: RewardKey;
  count: number;
}

export interface RecentWinner {
  full_name: string;
  mobile: string;
  reward: RewardKey;
  claim_id: string;
  spun_at: string;
  redemption_status: RedemptionStatus;
}

export interface DashboardStats {
  total_registrations: number;
  verified_customers: number;
  total_spins: number;
  redeemed: number;
  pending: number;
  distribution: DistributionItem[];
  recent_winners: RecentWinner[];
}

export interface RecordRow {
  customer_id: string;
  full_name: string;
  mobile: string;
  registered_at: string;
  otp_verified: boolean;
  spin_id: string | null;
  reward: RewardKey | null;
  claim_id: string | null;
  spun_at: string | null;
  redemption_status: RedemptionStatus | null;
  redeemed_at: string | null;
  total_count: number;
}

export interface RecordFilters {
  search: string;
  dateFrom: string; // yyyy-mm-dd
  dateTo: string; // yyyy-mm-dd
  reward: "" | RewardKey;
  redemption: "" | RedemptionStatus;
}
