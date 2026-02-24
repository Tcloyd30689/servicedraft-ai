'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useActivityPulse } from '@/hooks/useActivityPulse';
import { DEFAULT_ACCENT } from '@/lib/constants/themeColors';

const HERO_HEIGHT = 100; // px
const NAV_HEIGHT = 56;   // px (h-14 in NavBar)
const LOGO_HEIGHT = Math.round((HERO_HEIGHT + NAV_HEIGHT) * 2.622); // 262% of combined hero+nav

interface HeroWave {
  baseAmplitude: number;
  frequency: number;
  speed: number;
  offset: number;
  baseOpacity: number;
}

const heroWaves: HeroWave[] = [
  { baseAmplitude: 15.4, frequency: 0.02,  speed: 0.025, offset: 0, baseOpacity: 0.25 },
  { baseAmplitude: 11,   frequency: 0.015, speed: 0.018, offset: Math.PI / 3, baseOpacity: 0.3 },
  { baseAmplitude: 17.6, frequency: 0.025, speed: 0.03,  offset: Math.PI / 2, baseOpacity: 0.2 },
  { baseAmplitude: 13.2, frequency: 0.018, speed: 0.012, offset: Math.PI, baseOpacity: 0.22 },
  { baseAmplitude: 8.8,  frequency: 0.03,  speed: 0.022, offset: Math.PI * 1.5, baseOpacity: 0.18 },
];

export default function HeroArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const { accent } = useTheme();
  const { amplitudeRef } = useActivityPulse();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!ctx || !canvas) return;

      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, w, h);

      // Read wave color from CSS variable
      const root = document.documentElement;
      const waveRgb =
        root.style.getPropertyValue('--wave-color').trim() ||
        getComputedStyle(root).getPropertyValue('--wave-color').trim() ||
        '195, 171, 226';

      // Read accent color for intensity boost
      const accentRgb =
        root.style.getPropertyValue('--accent-primary').trim() ||
        getComputedStyle(root).getPropertyValue('--accent-primary').trim() ||
        '#9333ea';

      const activity = amplitudeRef.current; // 0–1
      // Align wave baseline with logo vertical center: logo is centered in
      // hero (100px) + nav (56px) = 156px, so logo center is at 78px from top.
      // Canvas covers the 100px hero area, so 78/100 = 0.78.
      const centerY = h * 0.78;

      // Amplitude multiplier: base 1.0, spikes up to 3.5x on activity
      const ampMult = 1.0 + activity * 2.5;

      // Opacity boost: waves get brighter/more saturated with activity
      const opacityBoost = activity * 0.35;

      for (const wave of heroWaves) {
        const amplitude = wave.baseAmplitude * ampMult;
        const opacity = Math.min(0.7, wave.baseOpacity + opacityBoost);

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${waveRgb}, ${opacity})`;
        ctx.lineWidth = 1.5 + activity * 0.8;

        for (let x = 0; x <= w; x += 2) {
          const y =
            centerY +
            amplitude *
              Math.sin(x * wave.frequency + timeRef.current * wave.speed + wave.offset);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      // Draw a subtle horizontal glow line at center when active
      if (activity > 0.1) {
        const glowOpacity = activity * 0.12;
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(0, centerY - 20, 0, centerY + 20);
        gradient.addColorStop(0, `rgba(${waveRgb}, 0)`);
        gradient.addColorStop(0.5, `rgba(${waveRgb}, ${glowOpacity})`);
        gradient.addColorStop(1, `rgba(${waveRgb}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, centerY - 20, w, 40);
      }

      timeRef.current += 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [amplitudeRef]);

  return (
    <>
      {/* Hero background — wave canvas + gradient */}
      <div
        className="fixed top-0 left-0 right-0 overflow-hidden bg-[var(--bg-primary)] z-[90]"
        style={{ height: `${HERO_HEIGHT}px` }}
      >
        {/* Animated wave canvas — fills entire hero */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        />

        {/* Subtle gradient overlay at edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, var(--bg-primary) 0%, transparent 8%, transparent 92%, var(--bg-primary) 100%)`,
          }}
        />
      </div>

      {/* Oversized logo — spans hero + nav, floats above both */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-center z-[110] pointer-events-none px-4"
        style={{ height: `${HERO_HEIGHT + NAV_HEIGHT}px` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mounted ? accent.logoFile : DEFAULT_ACCENT.logoFile}
          alt="ServiceDraft.AI"
          className="drop-shadow-[0_0_20px_var(--accent-30)]"
          style={{ height: `${LOGO_HEIGHT}px`, width: 'auto', objectFit: 'contain' }}
        />
      </div>
    </>
  );
}
