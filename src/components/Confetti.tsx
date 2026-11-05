import React, { useEffect, useRef } from "react";

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export const ConfettiCanvas: React.FC<ConfettiProps> = ({ active, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.width = window.innerWidth;
      height = canvasRef.current.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Warm, retro and sleek color palette: Emerald, Indigo, Amber, Rose, Cyan
    const colors = [
      "#047857", // emerald-700
      "#4338ca", // indigo-700
      "#b45309", // amber-700
      "#be123c", // rose-700
      "#0e7490", // cyan-700
      "#15803d", // green-700
      "#6d28d9", // violet-700
    ];

    const pCount = 180;
    const particles: any[] = [];

    // Initialize particles originating from bottom left and right or scattered
    for (let i = 0; i < pCount; i++) {
      const isLeft = Math.random() > 0.5;
      particles.push({
        x: isLeft ? 0 : width,
        y: height - Math.random() * 100,
        r: Math.random() * 5 + 4,
        angle: isLeft 
          ? (Math.random() * 45 + 15) * Math.PI / 180 
          : (Math.random() * 45 + 120) * Math.PI / 180,
        speed: Math.random() * 12 + 10,
        gravity: 0.25,
        friction: 0.98,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 15 - 7,
        tiltAngleIncremental: Math.random() * 0.08 + 0.03,
        tiltAngle: 0,
        opacity: 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (let i = 0; i < pCount; i++) {
        const p = particles[i];
        
        // Apply physics
        p.speed *= p.friction;
        p.x += Math.cos(p.angle) * p.speed;
        p.y -= Math.sin(p.angle) * p.speed - p.gravity;
        p.y += p.gravity * 8; // gravity drop acceleration

        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        if (p.speed < 2) {
          p.opacity -= 0.008;
        }

        if (p.y <= height && p.opacity > 0 && p.x >= -50 && p.x <= width + 50) {
          aliveCount++;
          
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.lineWidth = p.r;
          ctx.strokeStyle = p.color;
          ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
          ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};
