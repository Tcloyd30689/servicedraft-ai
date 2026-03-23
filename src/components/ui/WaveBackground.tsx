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
  { amplitude: 35, frequency: 0.020, speed: 0.010, offset: 0, opacity: 0.18 },
  { amplitude: 22, frequency: 0.013, speed: 0.023, offset: Math.PI / 3, opacity: 0.14 },
  { amplitude: 28, frequency: 0.028, speed: 0.016, offset: Math.PI * 0.7, opacity: 0.16 },
  { amplitude: 18, frequency: 0.017, speed: 0.031, offset: Math.PI * 1.2, opacity: 0.12 },
  { amplitude: 40, frequency: 0.010, speed: 0.007, offset: Math.PI * 0.4, opacity: 0.20 },
  { amplitude: 15, frequency: 0.035, speed: 0.042, offset: Math.PI * 1.6, opacity: 0.10 },
  { amplitude: 32, frequency: 0.022, speed: 0.019, offset: Math.PI * 2.1, opacity: 0.15 },
];

interface WaveBackgroundProps {
  /** Vertical center of the wave baseline as a fraction of viewport height (0–1). Default 0.5. */
  centerYPercent?: number;
}

export default function WaveBackground({ centerYPercent = 0.5 }: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const centerYRef = useRef(centerYPercent);
  centerYRef.current = centerYPercent;

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

      // Read the wave color from CSS custom property
      // Prefer inline style (set by ThemeProvider) over getComputedStyle for reliability
      const root = document.documentElement;
      const waveRgb =
        root.style.getPropertyValue('--wave-color').trim() ||
        getComputedStyle(root).getPropertyValue('--wave-color').trim() ||
        '195, 171, 226';

      const centerY = canvas.height * centerYRef.current;

      for (const wave of waves) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${waveRgb}, ${wave.opacity})`;
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
