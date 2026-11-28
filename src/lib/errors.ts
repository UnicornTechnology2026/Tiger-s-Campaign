/** Maps the error codes raised by the Postgres functions to friendly messages. */
const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Your session has expired. Please start again.",
  NOT_REGISTERED: "Please register first.",
  INVALID_NAME: "Please enter a valid name (2–60 characters).",
  INVALID_MOBILE: "Please enter a valid 10-digit Indian mobile number.",
  ALREADY_PARTICIPATED:
    "You have already played today. Come back tomorrow for another spin!",
  CAMPAIGN_INACTIVE: "This campaign is not active right now.",
  OTP_NOT_VERIFIED: "Please verify your mobile number first.",
  TOO_MANY_ATTEMPTS:
    "Too many incorrect OTP attempts. Please register again or ask the outlet staff for help.",
  OTP_PROVIDER_NOT_CONFIGURED:
    "OTP verification is not available yet. Please contact the outlet staff.",
  CLAIM_ID_GENERATION_FAILED:
    "Something went wrong while saving your reward. Please try again.",
  FORBIDDEN: "You do not have permission to do that.",
  INVALID_STATUS: "Invalid status.",
  NOT_FOUND: "Record not found.",
  NOT_ADMIN: "This account is not an administrator.",
  INVALID_OTP: "Incorrect OTP. Please check the code and try again.",
  OTP_INVALID: "Incorrect OTP. Please check the code and try again.",
  OTP_EXPIRED: "This OTP has expired. Please request a new one.",
};

export function errorCode(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message ?? "");
  }
  return String(err ?? "");
}

export function toMessage(err: unknown): string {
  const raw = errorCode(err);
  if (MESSAGES[raw]) return MESSAGES[raw];
  const known = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (known) return MESSAGES[known];
  if (/failed to fetch|network|load failed/i.test(raw)) {
    return "Network problem. Please check your connection and try again.";
  }
  if (/invalid login credentials/i.test(raw))
    return "Incorrect email or password.";
  if (/anonymous sign-ins are disabled/i.test(raw)) {
    return 'Setup incomplete: enable "Allow anonymous sign-ins" in Supabase Auth settings.';
  }
  if (/rate limit|too many requests|over_request_rate_limit/i.test(raw)) {
    return "Too many requests right now. Please wait a minute and try again.";
  }
  return "Something went wrong. Please try again.";
}
