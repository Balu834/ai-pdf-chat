'use client';

import { useEffect, useRef } from 'react';

/**
 * AnimatedBackground
 *
 * Fixed, pointer-events-none layer rendered behind all content (z-index: -1).
 * Three effects:
 *   1. CSS keyframe float on each blob (translate + scale, ~12-15s loop)
 *   2. Mouse-driven parallax via requestAnimationFrame (lerped, ±20px max)
 *   3. Slowly drifting gradient overlay (gradientDrift, 20s loop)
 *
 * No layout or component changes — purely cosmetic.
 */
export default function AnimatedBackground() {
  const p1 = useRef<HTMLDivElement>(null);
  const p2 = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  const target = useRef({ x: 0, y: 0 });
  const lerped = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Normalize to -1 … +1 range
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      // Low-pass filter — smooth trailing (factor 0.032 ≈ ~2s settle time)
      lerped.current.x += (target.current.x - lerped.current.x) * 0.032;
      lerped.current.y += (target.current.y - lerped.current.y) * 0.032;

      const { x, y } = lerped.current;

      // Blob 1 (purple, top-left) — moves counter to mouse
      if (p1.current) {
        p1.current.style.transform = `translate(${x * -20}px, ${y * -14}px)`;
      }
      // Blob 2 (cyan, bottom-right) — moves with mouse
      if (p2.current) {
        p2.current.style.transform = `translate(${x * 14}px, ${y * 10}px)`;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {/* Drifting gradient layer — adds very slow hue shift across the canvas */}
      <div className="bg-gradient-drift" />

      {/* Purple glow blob — top-left. Outer div: parallax offset (JS). Inner: CSS float. */}
      <div ref={p1} className="blob-parallax-1">
        <div className="blob-purple" />
      </div>

      {/* Cyan glow blob — bottom-right. Same two-div pattern. */}
      <div ref={p2} className="blob-parallax-2">
        <div className="blob-cyan" />
      </div>
    </div>
  );
}
