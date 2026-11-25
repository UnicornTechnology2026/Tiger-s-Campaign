/** Indian mobile numbers: 10 digits, starting with 6-9. */
export const MOBILE_REGEX = /^[6-9]\d{9}$/;
const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

export function validateName(value: string): string | null {
  const v = value.trim().replace(/\s+/g, ' ');
  if (!v) return 'Please enter your full name.';
  if (v.length < 2) return 'Name must be at least 2 characters.';
  if (v.length > 60) return 'Name must be 60 characters or fewer.';
  if (!NAME_REGEX.test(v)) return 'Name can contain only letters, spaces, . \' and -';
  return null;
}

export function validateMobile(value: string): string | null {
  if (!value) return 'Please enter your mobile number.';
  if (!/^\d+$/.test(value)) return 'Mobile number must contain digits only.';
  if (value.length !== 10) return 'Enter a valid 10-digit mobile number.';
  if (!MOBILE_REGEX.test(value)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  return null;
}

/** Keep digits only; tolerate pasted "+91 98765 43210" / "098765 43210". */
export function normalizeMobileInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function maskMobile(mobile: string | null): string {
  if (!mobile) return '';
  return `+91 ${mobile.slice(0, 2)}••••••${mobile.slice(-2)}`;
}
