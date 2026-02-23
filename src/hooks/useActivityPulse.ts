'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Activity pulse system for reactive sine wave animation.
 *
 * Maintains a shared amplitude value (0–1) that spikes on user activity
 * and decays back to 0 over ~2-3 seconds.
 *
 * Listened events:
 *  - input/keydown on any form field → moderate spike (0.4)
 *  - click on buttons → sharp spike (0.7)
 *  - Custom 'sd-activity' events → configurable intensity
 *    Dispatch: window.dispatchEvent(new CustomEvent('sd-activity', { detail: { intensity: 0.8 } }))
 */

// Shared module-level state so all consumers read the same amplitude
let currentAmplitude = 0;
let targetAmplitude = 0;
const listeners = new Set<() => void>();
let frameId: number | null = null;
let initialized = false;

const DECAY_RATE = 0.025; // per frame (~60fps → ~1.5s full decay from 1.0)
const LERP_UP = 0.15;     // how fast amplitude rises toward target

function tick() {
  // Lerp toward target
  if (targetAmplitude > currentAmplitude) {
    currentAmplitude += (targetAmplitude - currentAmplitude) * LERP_UP;
  }

  // Decay target
  targetAmplitude = Math.max(0, targetAmplitude - DECAY_RATE);

  // Decay current if target is below
  if (currentAmplitude > targetAmplitude) {
    currentAmplitude = Math.max(0, currentAmplitude - DECAY_RATE * 0.5);
  }

  // Clamp
  currentAmplitude = Math.min(1, Math.max(0, currentAmplitude));

  // Notify listeners
  for (const fn of listeners) fn();

  frameId = requestAnimationFrame(tick);
}

function spike(intensity: number) {
  targetAmplitude = Math.min(1, Math.max(targetAmplitude, intensity));
}

function initGlobalListeners() {
  if (initialized) return;
  initialized = true;

  // Typing in inputs/textareas
  const handleInput = () => spike(0.35);
  document.addEventListener('input', handleInput, { passive: true });

  // Button clicks — sharp spike
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('a')
    ) {
      spike(0.65);
    } else {
      // Generic click — subtle
      spike(0.15);
    }
  };
  document.addEventListener('click', handleClick, { passive: true });

  // Custom activity events (AI generation, saves, exports)
  const handleCustom = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    spike(detail?.intensity ?? 0.5);
  };
  window.addEventListener('sd-activity', handleCustom);

  // Start the animation loop
  frameId = requestAnimationFrame(tick);
}

/**
 * Returns the current activity amplitude (0–1).
 * The returned ref updates every animation frame — read `.current` in your
 * requestAnimationFrame loop for zero-cost reactivity.
 */
export function useActivityPulse() {
  const amplitudeRef = useRef(0);

  useEffect(() => {
    initGlobalListeners();

    const update = () => {
      amplitudeRef.current = currentAmplitude;
    };

    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const emitActivity = useCallback((intensity: number = 0.5) => {
    spike(intensity);
  }, []);

  return { amplitudeRef, emitActivity };
}

/**
 * Helper to dispatch an activity event from anywhere (including non-hook code).
 * Usage: dispatchActivity(0.8)  // sustained high for AI generation
 */
export function dispatchActivity(intensity: number = 0.5) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sd-activity', { detail: { intensity } })
    );
  }
}
