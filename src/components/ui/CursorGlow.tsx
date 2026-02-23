'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';

interface CursorGlowProps {
  children: ReactNode;
  /** Radius of the glow circle in px */
  radius?: number;
  /** Opacity of the glow (0-1) */
  opacity?: number;
  /** Whether the glow is enabled */
  enabled?: boolean;
  className?: string;
}

export default function CursorGlow({
  children,
  radius = 200,
  opacity = 0.15,
  enabled = true,
  className,
}: CursorGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [glowPos, setGlowPos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setGlowPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [enabled],
  );

  const handleMouseEnter = useCallback(() => {
    if (enabled) setIsHovered(true);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setGlowPos(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow overlay */}
      {enabled && glowPos && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            opacity: isHovered ? opacity : 0,
            transition: 'opacity 0.3s ease',
            background: `radial-gradient(circle ${radius}px at ${glowPos.x}px ${glowPos.y}px, var(--accent-primary), transparent)`,
            borderRadius: 'inherit',
          }}
        />
      )}
      {/* Content rendered above glow */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
