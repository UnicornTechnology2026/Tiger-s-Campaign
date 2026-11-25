import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
}

export function OtpInput({ value, onChange, length = 4, disabled, hasError }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setAt = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join('').slice(0, length));
  };

  return (
    <div className="flex justify-center gap-3" role="group" aria-label="One-time password">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          className={`h-16 w-14 rounded-xl border-2 bg-white text-center font-display text-3xl font-bold text-ink-900 outline-none transition focus:ring-4 focus:ring-amber-400/50 ${
            hasError ? 'border-red-400' : 'border-white/40 focus:border-amber-400'
          }`}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1);
            setAt(i, ch);
            if (ch && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (pasted) {
              e.preventDefault();
              onChange(pasted);
              refs.current[Math.min(pasted.length, length - 1)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
