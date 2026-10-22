import React, { useEffect, useRef } from "react";

export const DotPatternBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number | null = null;
    let isRunning = false;

    // Viewport dimensions with DPR capped at 2 for mobile efficiency
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mouse tracking state with smooth spring lerp
    let targetX = width / 2;
    let targetY = height / 3;
    let currentX = targetX;
    let currentY = targetY;

    let targetOpacity = 0.3; // Initial subtle hint
    let currentOpacity = 0.3;

    // Constants for pattern geometry & mouse proximity
    const STEP = 16; // Distance between dot centers in px
    const PROXIMITY_RADIUS = 160; // Reveal radius around mouse in px

    const render = () => {
      // Smooth interpolation for fluid cursor feel
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      const dOp = targetOpacity - currentOpacity;

      currentX += dx * 0.14;
      currentY += dy * 0.14;
      currentOpacity += dOp * 0.08;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      if (currentOpacity > 0.005) {
        // Calculate grid range within mouse proximity bounding box for extreme efficiency
        const minIx = Math.max(0, Math.floor((currentX - PROXIMITY_RADIUS) / STEP));
        const maxIx = Math.min(Math.ceil(width / STEP), Math.ceil((currentX + PROXIMITY_RADIUS) / STEP));
        const minIy = Math.max(0, Math.floor((currentY - PROXIMITY_RADIUS) / STEP));
        const maxIy = Math.min(Math.ceil(height / STEP), Math.ceil((currentY + PROXIMITY_RADIUS) / STEP));

        for (let ix = minIx; ix <= maxIx; ix++) {
          for (let iy = minIy; iy <= maxIy; iy++) {
            const x = ix * STEP;
            const y = iy * STEP;

            // Distance to cursor
            const pDx = x - currentX;
            const pDy = y - currentY;
            const dist = Math.hypot(pDx, pDy);

            if (dist < PROXIMITY_RADIUS) {
              // Smooth step falloff (0 at edge, 1 at center)
              const normDist = dist / PROXIMITY_RADIUS;
              const falloff = 1 - normDist;
              const intensity = falloff * falloff * (3 - 2 * falloff);

              // Halftone diagonal wave formula
              const diagWave = Math.sin((ix + iy) * 0.28) * 0.5 + 0.5;
              const secondaryWave = Math.cos((ix - iy) * 0.15) * 0.2;
              
              const baseR = 0.8 + (diagWave + secondaryWave) * 2.0;
              const r = Math.max(0.5, baseR * (1 + 0.2 * intensity));
              const alpha = intensity * 0.18 * currentOpacity;

              if (alpha > 0.005) {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(20, 20, 20, ${alpha.toFixed(3)})`;
                ctx.fill();
              }
            }
          }
        }
      }

      ctx.restore();

      // Check if settled to stop rAF loop and save mobile battery/CPU
      const isSettled =
        Math.abs(dx) < 0.15 &&
        Math.abs(dy) < 0.15 &&
        Math.abs(dOp) < 0.003;

      if (!isSettled || currentOpacity > 0.01) {
        animId = requestAnimationFrame(render);
      } else {
        isRunning = false;
        animId = null;
      }
    };

    const startAnimation = () => {
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(render);
      }
    };

    const updateCanvasSize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      startAnimation();
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize, { passive: true });

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      targetOpacity = 0.5;
      startAnimation();
    };

    const handlePointerLeave = () => {
      targetOpacity = 0;
      startAnimation();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    // Initial render
    startAnimation();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transform-gpu"
      aria-hidden="true"
    />
  );
};
