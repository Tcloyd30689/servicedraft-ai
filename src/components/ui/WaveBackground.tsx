'use client';

import { useEffect, useRef } from 'react';

interface Wave {
  amplitude: number;
  frequency: number;
  speed: number;
  offset: number;
  opacity: number;
}

const waves: Wave[] = [
  { amplitude: 30, frequency: 0.02, speed: 0.02, offset: 0, opacity: 0.15 },
  { amplitude: 25, frequency: 0.015, speed: 0.015, offset: Math.PI / 4, opacity: 0.2 },
  { amplitude: 35, frequency: 0.025, speed: 0.025, offset: Math.PI / 2, opacity: 0.18 },
  { amplitude: 20, frequency: 0.018, speed: 0.012, offset: Math.PI / 3, opacity: 0.15 },
];

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;

      for (const wave of waves) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(195, 171, 226, ${wave.opacity})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x <= canvas.width; x += 2) {
          const y =
            centerY +
            wave.amplitude *
              Math.sin(x * wave.frequency + timeRef.current * wave.speed + wave.offset);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      timeRef.current += 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
