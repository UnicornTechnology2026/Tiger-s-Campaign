import { customerSupabase as sb } from "../lib/supabase";
import type { MyStatus, OtpResult, SpinResult } from "../types";

/**
 * Customer identity = an anonymous Supabase Auth session. The server derives
 * the customer from the session JWT (auth.uid()); nothing here sends a customer
 * id or a reward.
 */
async function ensureSession(): Promise<void> {
  const { data } = await sb.auth.getSession();
  if (data.session) return;
  const { error } = await sb.auth.signInAnonymously();
  if (error) throw error;
}

const EMPTY: MyStatus = {
  status: "unregistered",
  full_name: null,
  mobile: null,
  reward: null,
  claim_id: null,
  spun_at: null,
};

export async function getMyStatus(): Promise<MyStatus> {
  const { data: s } = await sb.auth.getSession();
  if (!s.session) return EMPTY;
  const { data, error } = await sb.rpc("get_my_status");
  if (error) throw error;
  return { ...EMPTY, ...(data as Partial<MyStatus>) };
}

export async function registerCustomer(
  fullName: string,
  mobile: string,
): Promise<void> {
  await ensureSession();
  const { error } = await sb.rpc("register_customer", {
    p_name: fullName,
    p_mobile: mobile,
  });
  if (error) throw error;
}

export async function verifyOtp(otp: string): Promise<OtpResult> {
  const { data, error } = await sb.rpc("verify_otp", { p_otp: otp });
  if (error) throw error;
  return data as OtpResult;
}

export async function spinWheel(): Promise<SpinResult> {
  const { data, error } = await sb.rpc("spin_wheel");
  if (error) throw error;
  return data as SpinResult;
}
