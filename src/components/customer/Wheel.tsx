import { useCallback, useEffect, useRef, useState } from "react";
import {
  REWARD_INFO,
  SEGMENT_ANGLE,
  SPIN_DURATION_MS,
  WHEEL_SEGMENTS,
  computeTargetRotation,
  polar,
  segmentPath,
  type RewardKey,
} from "../../lib/wheel";
import { Spinner } from "../common/Spinner";
import logo from "../../assest/logo.png";

interface Props {
  /** Reward chosen by the SERVER. null until the server has answered. */
  target: RewardKey | null;
  /** True while waiting for the server response. */
  busy: boolean;
  disabled?: boolean;
  onSpinClick: () => void;
  onFinished: () => void;
}

const CX = 200;
const CY = 200;
const R = 181;
const BULBS = Array.from({ length: 24 }, (_, i) => polar(CX, CY, 191, i * 15));

const WHEEL_CSS = `
@keyframes sw-twinkle{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes sw-shine{from{transform:translateX(-360px)}to{transform:translateX(360px)}}
@keyframes sw-pulse{0%,100%{opacity:.45}50%{opacity:1}}
.sw-bulb{animation:sw-twinkle 1.1s ease-in-out infinite}
.sw-bulb-b{animation-delay:.55s}
.sw-shine{animation:sw-shine 3.8s ease-in-out infinite}
.sw-pulse{animation:sw-pulse 1.6s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){
  .sw-bulb,.sw-shine,.sw-pulse{animation:none}
}
`;

export function Wheel({
  target,
  busy,
  disabled,
  onSpinClick,
  onFinished,
}: Props) {
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

  const locked = disabled || busy || target !== null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[26rem] select-none">
      <style>{WHEEL_CSS}</style>

      <svg
        viewBox="-30 -30 460 460"
        className="h-full w-full"
        role="img"
        aria-label="Prize wheel with six segments"
      >
        <defs>
          <radialGradient
            id="sw-red"
            cx="200"
            cy="200"
            r="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#8A0000" />
            <stop offset=".4" stopColor="#D80C12" />
            <stop offset=".85" stopColor="#FF2424" />
            <stop offset="1" stopColor="#FF4A3C" />
          </radialGradient>
          <radialGradient
            id="sw-blk"
            cx="200"
            cy="200"
            r="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#000" />
            <stop offset=".6" stopColor="#0a0505" />
            <stop offset=".92" stopColor="#1a0a0a" />
            <stop offset="1" stopColor="#2c1111" />
          </radialGradient>
          <radialGradient
            id="sw-segGloss"
            cx="200"
            cy="200"
            r="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity="0" />
            <stop offset=".92" stopColor="#fff" stopOpacity=".3" />
            <stop offset="1" stopColor="#fff" stopOpacity=".05" />
          </radialGradient>
          <linearGradient id="sw-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFBE0" />
            <stop offset=".22" stopColor="#FFD43B" />
            <stop offset=".5" stopColor="#A06C06" />
            <stop offset=".75" stopColor="#FFE27A" />
            <stop offset="1" stopColor="#8A5C04" />
          </linearGradient>
          <linearGradient id="sw-gold2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF3B0" />
            <stop offset=".45" stopColor="#E8AE0A" />
            <stop offset=".8" stopColor="#7A5206" />
            <stop offset="1" stopColor="#FFD966" />
          </linearGradient>
          <linearGradient id="sw-txt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset=".35" stopColor="#FFE680" />
            <stop offset="1" stopColor="#F2A900" />
          </linearGradient>
          <radialGradient id="sw-hub" cx=".5" cy=".28" r=".85">
            <stop offset="0" stopColor="#FF3A3A" />
            <stop offset=".5" stopColor="#C80A10" />
            <stop offset="1" stopColor="#5a0000" />
          </radialGradient>
          <linearGradient id="sw-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".34" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sw-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".3" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".04" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="sw-spec" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#fff" stopOpacity=".85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id="sw-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sw-glow2" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sw-halo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <clipPath id="sw-face">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
          <clipPath id="sw-hubclip">
            <circle cx={CX} cy={CY} r="46" />
          </clipPath>
        </defs>

        {/* outer glow + floor shadow */}
        <circle
          cx={CX}
          cy={CY}
          r="208"
          fill="#FF2A12"
          opacity=".55"
          filter="url(#sw-halo)"
        />
        <ellipse
          cx={CX}
          cy="412"
          rx="150"
          ry="10"
          fill="#000"
          opacity=".55"
          filter="url(#sw-halo)"
        />

        {/* metallic rim */}
        <circle cx={CX} cy={CY} r="200" fill="#3a2300" />
        <circle cx={CX} cy={CY} r="198.5" fill="url(#sw-gold)" />
        <circle cx={CX} cy={CY} r="184" fill="url(#sw-gold2)" />
        <circle cx={CX} cy={CY} r="182" fill="#2a1700" />

        {/* rotating segments */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${rotation}deg)`,
            transition: animating.current
              ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
              : "none",
            willChange: "transform",
          }}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && e.propertyName === "transform")
              finish();
          }}
        >
          {WHEEL_SEGMENTS.map((seg, i) => {
            const a0 = i * SEGMENT_ANGLE;
            const mid = a0 + SEGMENT_ANGLE / 2;
            const info = REWARD_INFO[seg.reward];
            const d = segmentPath(i, R);
            const edge = polar(CX, CY, R, a0);
            const r0 = polar(CX, CY, R - 5, a0 + 2.4);
            const r1 = polar(CX, CY, R - 5, a0 + SEGMENT_ANGLE - 2.4);
            return (
              <g key={`${seg.reward}-${i}`}>
                <path
                  d={d}
                  fill={seg.tone === "red" ? "url(#sw-red)" : "url(#sw-blk)"}
                />

                <path
                  d={`M ${r0.x.toFixed(2)} ${r0.y.toFixed(2)} A ${R - 5} ${R - 5} 0 0 1 ${r1.x.toFixed(2)} ${r1.y.toFixed(2)}`}
                  fill="none"
                  stroke="#FFE27A"
                  strokeWidth="1.2"
                  opacity=".5"
                />
                <line
                  x1={CX}
                  y1={CY}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="#2a1700"
                  strokeWidth="5"
                />
                <line
                  x1={CX}
                  y1={CY}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="url(#sw-gold)"
                  strokeWidth="2.6"
                />

                <g transform={`rotate(${mid} ${CX} ${CY})`}>
                  {info.lines.map((line, li) => {
                    const two = info.lines.length > 1;
                    const y = two ? CY - 122 + li * 18 : CY - 110;
                    const fs = two ? 14.5 : 19;
                    return (
                      <g
                        key={li}
                        fontFamily="Poppins, sans-serif"
                        fontWeight={600}
                        fontSize={fs}
                        letterSpacing={0.6}
                        textAnchor="middle"
                      >
                        <text x={CX + 0.7} y={y + 2} fill="#6a4300">
                          {line}
                        </text>
                        <text
                          x={CX}
                          y={y}
                          fill="url(#sw-txt)"
                          stroke="#3a0000"
                          strokeWidth="0.8"
                          paintOrder="stroke"
                          filter="url(#sw-glow)"
                        >
                          {line}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            );
          })}
        </g>

        <circle
          cx={CX}
          cy={CY}
          r="182"
          fill="none"
          stroke="#1a0f00"
          strokeWidth="2.5"
        />
        <circle
          cx={CX}
          cy={CY}
          r="197.5"
          fill="none"
          stroke="#FFFBE0"
          strokeWidth="1.3"
          opacity=".9"
        />
        <circle
          cx={CX}
          cy={CY}
          r="186"
          fill="none"
          stroke="#FFF3B0"
          strokeWidth="1"
          opacity=".6"
        />

        {/* LED bulbs */}
        {BULBS.map((b, i) => (
          <g key={i}>
            <circle
              cx={b.x}
              cy={b.y}
              r="6.2"
              fill="#5a3a00"
              stroke="#FFE27A"
              strokeWidth=".8"
            />
            <g className={i % 2 ? "sw-bulb sw-bulb-b" : "sw-bulb"}>
              <circle
                cx={b.x}
                cy={b.y}
                r="4.4"
                fill={i % 2 ? "#FFF3C4" : "#FFD84D"}
                filter="url(#sw-glow2)"
              />
              <circle cx={b.x} cy={b.y} r="1.8" fill="#fff" />
            </g>
          </g>
        ))}

        {/* centre hub with embossed tiger */}
        <circle
          className="sw-pulse"
          cx={CX}
          cy={CY}
          r="60"
          fill="none"
          stroke="#FFE27A"
          strokeWidth="2.5"
          filter="url(#sw-glow)"
        />
        <circle cx={CX} cy={CY} r="56" fill="url(#sw-gold)" />
        <circle
          cx={CX}
          cy={CY}
          r="56"
          fill="none"
          stroke="#4a2f00"
          strokeWidth="1.4"
        />
        <circle cx={CX} cy={CY} r="50" fill="url(#sw-gold2)" />
        <circle
          cx={CX}
          cy={CY}
          r="47"
          fill="url(#sw-hub)"
          stroke="#3a2300"
          strokeWidth="1.5"
        />

        <circle
          cx={CX}
          cy={CY}
          r="47"
          fill="url(#sw-hub)"
          stroke="#3a2300"
          strokeWidth="1.5"
        />
        <image
          href={logo}
          x={CX - 35}
          y={CY - 41}
          width="70"
          height="82"
          preserveAspectRatio="xMidYMid meet"
          opacity=".32"
          clipPath="url(#sw-hubclip)"
          style={{ pointerEvents: "none" }}
        />
        {/* soft gloss highlight on the hub */}
        <path
          d="M156 194 A44 44 0 0 1 244 194 C226 175 174 175 156 194 Z"
          fill="#fff"
          opacity=".18"
        />
        <g
          fontFamily="Poppins, sans-serif"
          fontWeight={700}
          fontSize={29}
          textAnchor="middle"
          opacity={busy ? 0 : 1}
        >
          <text
            x="200"
            y="210.5"
            fill="#F5C518"
            stroke="#5a3a00"
            strokeWidth="0.8"
            paintOrder="stroke"
          >
            SPIN
          </text>
        </g>

        {/* pointer */}
        <path
          d="M200 -16 C185 -16 175 -4 175 9 C175 25 200 48 200 48 C200 48 225 25 225 9 C225 -4 215 -16 200 -16 Z"
          fill="url(#sw-gold)"
          stroke="#4a2f00"
          strokeWidth="2.2"
          filter="url(#sw-glow)"
        />
        <path
          d="M200 -12 C188 -12 180 -3 180 8"
          fill="none"
          stroke="#FFFBE0"
          strokeWidth="1.4"
          opacity=".8"
        />
        <circle
          cx="200"
          cy="9"
          r="10"
          fill="#FF1F1F"
          stroke="#FFE27A"
          strokeWidth="1.8"
          filter="url(#sw-glow2)"
        />
        <circle cx="196.5" cy="5.5" r="3.4" fill="#fff" opacity=".9" />
      </svg>

      {/* invisible click target over the centre hub (does not rotate) */}
      <button
        type="button"
        onClick={onSpinClick}
        disabled={locked}
        aria-label="Spin the wheel"
        className="absolute left-1/2 top-1/2 z-10 flex h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70 disabled:cursor-not-allowed"
      >
        {busy && <Spinner className="h-7 w-7" />}
      </button>
    </div>
  );
}
