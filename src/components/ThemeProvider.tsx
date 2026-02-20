'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ACCENT_COLORS, DEFAULT_ACCENT, getAccentByKey, buildCssVars, type AccentColor } from '@/lib/constants/themeColors';

const STORAGE_KEY = 'sd-accent-color';
const MODE_STORAGE_KEY = 'sd-color-mode';

type ColorMode = 'dark' | 'light';

interface ThemeContextValue {
  accent: AccentColor;
  setAccentColor: (key: string) => void;
  colorMode: ColorMode;
  toggleColorMode: () => void;
  accentColors: AccentColor[];
}

const ThemeContext = createContext<ThemeContextValue>({
  accent: DEFAULT_ACCENT,
  setAccentColor: () => {},
  colorMode: 'dark',
  toggleColorMode: () => {},
  accentColors: ACCENT_COLORS,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(accent: AccentColor, mode: ColorMode) {
  const vars = buildCssVars(accent);
  const root = document.documentElement;

  // If it's the Black accent, force light mode
  const effectiveMode = accent.isLightMode ? 'light' : mode;

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  // Set color-scheme for proper browser form control rendering
  root.style.setProperty('color-scheme', effectiveMode === 'light' ? 'light' : 'dark');

  // Override bg/text if user explicitly toggled mode (non-Black accent in light mode)
  if (effectiveMode === 'light' && !accent.isLightMode) {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-gradient-1', '#f0f2f5');
    root.style.setProperty('--bg-gradient-2', '#e8eaee');
    root.style.setProperty('--bg-input', '#f1f5f9');
    root.style.setProperty('--bg-elevated', '#e2e8f0');
    root.style.setProperty('--bg-modal', 'rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--bg-nav', 'rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--bg-card', 'var(--accent-8)');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-muted', '#64748b');
    root.style.setProperty('--card-border', accent.border);
    root.style.setProperty('--modal-border', accent.border);
    root.style.setProperty('--scrollbar-track', 'var(--bg-elevated)');
    root.style.setProperty('--body-bg', 'linear-gradient(135deg, #f0f2f5 0%, #ffffff 50%, #e8eaee 100%)');
  }
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccent] = useState<AccentColor>(() => {
    if (typeof window === 'undefined') return DEFAULT_ACCENT;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? getAccentByKey(saved) : DEFAULT_ACCENT;
  });

  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  // Apply theme on mount and when accent/mode changes
  useEffect(() => {
    applyTheme(accent, colorMode);
  }, [accent, colorMode]);

  const setAccentColor = useCallback((key: string) => {
    const newAccent = getAccentByKey(key);
    setAccent(newAccent);
    localStorage.setItem(STORAGE_KEY, key);

    // If selecting Black, auto-switch to light mode
    if (newAccent.isLightMode) {
      setColorMode('light');
      localStorage.setItem(MODE_STORAGE_KEY, 'light');
    }
    // If switching away from Black while in light mode forced by Black, revert to dark
    if (!newAccent.isLightMode && accent.isLightMode) {
      setColorMode('dark');
      localStorage.setItem(MODE_STORAGE_KEY, 'dark');
    }
  }, [accent]);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(MODE_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        accent,
        setAccentColor,
        colorMode: accent.isLightMode ? 'light' : colorMode,
        toggleColorMode,
        accentColors: ACCENT_COLORS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
