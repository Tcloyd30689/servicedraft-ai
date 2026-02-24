'use client';

import { useEffect, useRef } from 'react';

export default function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef<any>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stateRef.current.particles = null;
    };
    resize();
    window.addEventListener('resize', resize);

    const cfg = {
      speed: 1,
      opacity: 0.6,
      lineWidth: 1.5,
      detail: 5,
      spread: 100,
      particleCount: 30,
    };

    // Read --wave-color which is an RGB triplet string like "195, 171, 226"
    // This is set by buildCssVars() in themeColors.ts and updates per accent color
    function readWaveColor(): string {
      const root = document.documentElement;
      return (
        root.style.getPropertyValue('--wave-color').trim() ||
        getComputedStyle(root).getPropertyValue('--wave-color').trim() ||
        '195, 171, 226'
      );
    }

    let waveRgb = readWaveColor();

    // Re-read accent color every 2s in case user changes it mid-session
    const colorInterval = setInterval(() => {
      waveRgb = readWaveColor();
    }, 2000);

    function animate(time: number) {
      const { particleCount, speed, opacity, lineWidth, spread, detail } = cfg;
      const w = canvas!.width;
      const h = canvas!.height;
      const count = Math.floor(particleCount * (detail / 5));

      if (!stateRef.current.particles || stateRef.current.particles.length !== count) {
        stateRef.current.particles = Array.from({ length: count }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 2 + 0.5,
        }));
      }

      const particles = stateRef.current.particles;
      const connectionDist = spread * 2;

      ctx!.clearRect(0, 0, w, h);

      particles.forEach((p: any) => {
        p.x += p.vx * speed * 0.3;
        p.y += p.vy * speed * 0.3;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * lineWidth * 0.5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${waveRgb}, ${opacity * 1.5})`;
        ctx!.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(${waveRgb}, ${opacity * (1 - dist / connectionDist)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
    }

    let startTime = performance.now();
    function loop(now: number) {
      const time = (now - startTime) / 1000;
      animate(time);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
      clearInterval(colorInterval);
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
