'use client';

import { useEffect } from 'react';
import { DEFAULT_ACCENT, buildCssVars } from '@/lib/constants/themeColors';

/**
 * Forces the purple dark mode color scheme on mount.
 * Used on unauthenticated pages (landing, login, signup) to ensure
 * consistent branding regardless of localStorage or OS preferences.
 */
export default function ForcePurpleDark() {
  useEffect(() => {
    const root = document.documentElement;
    const vars = buildCssVars(DEFAULT_ACCENT);

    // Apply all purple-dark accent CSS variables
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }

    // Force dark mode
    root.style.setProperty('color-scheme', 'dark');
    root.setAttribute('data-mode', 'dark');

    // Ensure dark-mode-specific variables
    const [r, g, b] = DEFAULT_ACCENT.rgb;
    root.style.setProperty('--bg-card', `rgba(${r}, ${g}, ${b}, 0.05)`);
    root.style.setProperty('--border-default', 'transparent');
    root.style.setProperty('--accent-text-emphasis', DEFAULT_ACCENT.hex);
    root.style.setProperty('--accent-text-emphasis-weight', 'inherit');
    root.style.setProperty('--btn-text-on-accent', '#ffffff');
    root.style.setProperty('--accent-vivid', DEFAULT_ACCENT.hover);
  }, []);

  return null;
}
