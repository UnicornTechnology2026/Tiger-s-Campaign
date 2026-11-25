import confetti from 'canvas-confetti';

const COLORS = ['#FF2E63', '#FFC400', '#00C896', '#2F6BFF', '#9B30FF', '#FFFFFF'];

export function celebrate(durationMs = 3500) {
  const end = Date.now() + durationMs;

  confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 }, colors: COLORS });

  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors: COLORS });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors: COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
