import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SEGMENT_ANGLE,
  SPIN_DURATION_MS,
  WHEEL_SEGMENTS,
  computeTargetRotation,
  polar,
  segmentPath,
} from '../../lib/wheel';
import { Spinner } from '../common/Spinner';

interface Props {
  /** Reward chosen by the SERVER. null until the server has answered. */
  target: number | null;
  /** True while waiting for the server response. */
  busy: boolean;
  disabled?: boolean;
  onSpinClick: () => void;
  onFinished: () => void;
}

const CX = 200;
const CY = 200;
const R = 186;

export function Wheel({ target, busy, disabled, onSpinClick, onFinished }: Props) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animating = useRef(false);
  const finishedRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const finish = useCallback(() => {
    if (!animating.current || finishedRef.current) return;
    finishedRef.current = true;
    animating.current = false;
    clearTimeout(timer.current);
    onFinishedRef.current();
  }, []);

  // Start the animation only once the server has told us the reward.
  useEffect(() => {
    if (target === null || animating.current || finishedRef.current) return;
    const next = computeTargetRotation(rotationRef.current, target);
    rotationRef.current = next;
    animating.current = true;
    setRotation(next);
    // Safety net in case `transitionend` never fires (background tab, reduced motion…).
    timer.current = setTimeout(finish, SPIN_DURATION_MS + 600);
    return () => undefined;
  }, [target, finish]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const bulbs = Array.from({ length: 20 }, (_, i) => polar(CX, CY, 194, (i * 360) / 20));
  const locked = disabled || busy || target !== null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem] select-none">
      {/* pointer */}
      <svg
        className="absolute left-1/2 top-0 z-20 h-12 w-10 -translate-x-1/2 -translate-y-2 drop-shadow-lg"
        viewBox="0 0 40 48"
        aria-hidden="true"
      >
        <path d="M20 46 L3 10 A18 18 0 0 1 37 10 Z" fill="#FFFFFF" stroke="#1a0b2e" strokeWidth="3" />
        <circle cx="20" cy="14" r="5" fill="#FF2E63" />
      </svg>

      {/* glow */}
      <div className="absolute inset-2 rounded-full shadow-glow" />

      {/* rotating wheel */}
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: animating.current
            ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
            : 'none',
          willChange: 'transform',
        }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === 'transform') finish();
        }}
      >
        <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label="Prize wheel with five rewards">
          <circle cx={CX} cy={CY} r="199" fill="#1a0b2e" />
          <circle cx={CX} cy={CY} r="199" fill="none" stroke="#FFC400" strokeWidth="3" />
          {WHEEL_SEGMENTS.map((seg, i) => {
            const mid = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
            return (
              <g key={seg.reward}>
                <path d={segmentPath(i, R)} fill={seg.fill} stroke="#FFFFFF" strokeWidth="3" />
                <g transform={`rotate(${mid} ${CX} ${CY})`}>
                  <text
                    x={CX}
                    y={CY - 112}
                    textAnchor="middle"
                    fontFamily="Poppins, sans-serif"
                    fontWeight="800"
                    fontSize="46"
                    fill={seg.text}
                  >
                    {seg.reward}
                  </text>
                  <text
                    x={CX}
                    y={CY - 84}
                    textAnchor="middle"
                    fontFamily="Poppins, sans-serif"
                    fontWeight="700"
                    fontSize="22"
                    letterSpacing="3"
                    fill={seg.text}
                  >
                    ML
                  </text>
                </g>
              </g>
            );
          })}
          {bulbs.map((b, i) => (
            <circle
              key={i}
              cx={b.x}
              cy={b.y}
              r="3.6"
              fill={i % 2 ? '#FFFFFF' : '#FFC400'}
              className="animate-bulb"
              style={{ animationDelay: `${(i % 2) * 0.6}s` }}
            />
          ))}
        </svg>
      </div>

      {/* centre SPIN button (does not rotate) */}
      <button
        type="button"
        onClick={onSpinClick}
        disabled={locked}
        aria-label="Spin the wheel"
        className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-amber-300 to-orange-500 font-display text-lg font-extrabold tracking-wider text-ink-900 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-90"
      >
        {busy ? <Spinner className="h-7 w-7" /> : 'SPIN'}
      </button>
    </div>
  );
}
