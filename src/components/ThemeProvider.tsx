'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { ACCENT_COLORS, DEFAULT_ACCENT, getAccentByKey, buildCssVars, perceivedBrightness, computeLightBgPrimary, type AccentColor } from '@/lib/constants/themeColors';

const STORAGE_KEY = 'sd-accent-color';
const MODE_STORAGE_KEY = 'sd-color-mode';
const BG_ANIM_STORAGE_KEY = 'sd-bg-animation';

type ColorMode = 'dark' | 'light';

interface ThemeContextValue {
  accent: AccentColor;
  setAccentColor: (key: string) => void;
  colorMode: ColorMode;
  toggleColorMode: () => void;
  accentColors: AccentColor[];
  backgroundAnimation: boolean;
  setBackgroundAnimation: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  accent: DEFAULT_ACCENT,
  setAccentColor: () => {},
  colorMode: 'dark',
  toggleColorMode: () => {},
  accentColors: ACCENT_COLORS,
  backgroundAnimation: true,
  setBackgroundAnimation: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(accent: AccentColor, mode: ColorMode) {
  const vars = buildCssVars(accent);
  const root = document.documentElement;

  // Determine effective mode: Black forces light, White forces dark, otherwise user choice
  const effectiveMode = accent.isLightMode ? 'light' : accent.isDarkMode ? 'dark' : mode;

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  // Set color-scheme and data-mode for CSS selectors
  root.style.setProperty('color-scheme', effectiveMode === 'light' ? 'light' : 'dark');
  root.setAttribute('data-mode', effectiveMode);

  const [r, g, b] = accent.rgb;

  // Override backgrounds if user explicitly toggled to light mode (non-Black accent).
  // Only page-level surfaces change — card/modal internals keep their accent-tinted glass styling.
  if (effectiveMode === 'light' && !accent.isLightMode) {
    // Page background → accent color (80/20 blend with neutral, darkened for bright accents)
    let bgR = Math.round(r * 0.8 + 50 * 0.2);
    let bgG = Math.round(g * 0.8 + 50 * 0.2);
    let bgB = Math.round(b * 0.8 + 50 * 0.2);

    const bgBrightness = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
    if (bgBrightness > 180) {
      bgR = Math.round(r * 0.55 + 30 * 0.45);
      bgG = Math.round(g * 0.55 + 30 * 0.45);
      bgB = Math.round(b * 0.55 + 30 * 0.45);
    }
    const bgPrimary = `rgb(${bgR}, ${bgG}, ${bgB})`;

    // Nav: denser/darker accent shade for visual weight
    const navR = Math.round(r * 0.5);
    const navG = Math.round(g * 0.5);
    const navB = Math.round(b * 0.5);

    root.style.setProperty('--bg-primary', bgPrimary);
    root.style.setProperty('--bg-nav', `rgba(${navR}, ${navG}, ${navB}, 0.85)`);
    root.style.setProperty('--bg-modal', `rgba(${Math.round(r * 0.15)}, ${Math.round(g * 0.15)}, ${Math.round(b * 0.15)}, 0.92)`);
    root.style.setProperty('--bg-input', 'rgba(0, 0, 0, 0.2)');
    root.style.setProperty('--bg-elevated', 'rgba(0, 0, 0, 0.15)');
    root.style.setProperty('--text-primary', '#f0f0f5');
    root.style.setProperty('--text-muted', '#9ca3af');
    root.style.setProperty('--body-bg', `linear-gradient(135deg, ${accent.gradient1} 0%, ${bgPrimary} 50%, ${accent.gradient2} 100%)`);
    root.style.setProperty('--scrollbar-track', 'rgba(0, 0, 0, 0.2)');

    // All accent colors, opacity layers, borders, and component styling remain
    // untouched — cards and their contents keep their tinted glass look from dark mode.
  }

  // Mode-adaptive variables — apply to ALL light modes (Black native + user-toggled)
  if (effectiveMode === 'light') {
    // Dark frosted glass card bg — cards need contrast against colored page background
    root.style.setProperty('--bg-card', 'rgba(15, 15, 25, 0.75)');
    root.style.setProperty('--border-default', 'rgba(255, 255, 255, 0.1)');
    // Accent colors stay themed — card internals look the same as dark mode
    root.style.setProperty('--accent-text-emphasis', accent.hex);
    root.style.setProperty('--accent-text-emphasis-weight', 'inherit');
    root.style.setProperty('--accent-vivid', accent.hover);
    root.style.setProperty('--scrollbar-track', 'rgba(0, 0, 0, 0.2)');
  } else {
    root.style.setProperty('--bg-card', `rgba(${r}, ${g}, ${b}, 0.05)`);
    root.style.setProperty('--border-default', 'transparent');
    root.style.setProperty('--accent-text-emphasis', accent.hex);
    root.style.setProperty('--accent-text-emphasis-weight', 'inherit');
    root.style.setProperty('--btn-text-on-accent', '#ffffff');
    root.style.setProperty('--accent-vivid', accent.hover);
  }

  // --- Luminance-based overrides for extreme accent colors (White, Black, etc.) ---

  // Button text: ensure contrast on accent-hover backgrounds (used by primary buttons)
  const hoverBrightness = perceivedBrightness(accent.hover);
  root.style.setProperty('--btn-text-on-accent', hoverBrightness > 180 ? '#000000' : '#ffffff');

  // Light mode: if accent.border is too light on dark glass cards, use accent.hover for borders
  if (effectiveMode === 'light') {
    const borderBrightness = perceivedBrightness(accent.border);
    if (borderBrightness > 180) {
      root.style.setProperty('--accent-vivid', accent.hex);
      root.style.setProperty('--card-border', accent.hover);
      root.style.setProperty('--modal-border', accent.hover);
    }
  }

  // Dark mode: if accent.hover is very light (e.g. White accent), darken secondary/ghost text
  if (effectiveMode === 'dark' && hoverBrightness > 200) {
    root.style.setProperty('--accent-vivid', accent.border);
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

  const [backgroundAnimation, setBackgroundAnimationState] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(BG_ANIM_STORAGE_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  // Track current values in refs for async Supabase helpers
  const accentRef = useRef(accent);
  const modeRef = useRef(colorMode);
  const bgAnimRef = useRef(backgroundAnimation);
  useEffect(() => { accentRef.current = accent; }, [accent]);
  useEffect(() => { modeRef.current = colorMode; }, [colorMode]);
  useEffect(() => { bgAnimRef.current = backgroundAnimation; }, [backgroundAnimation]);

  // --- Server-side persistence helpers (no browser Supabase client) ---

  const saveToSupabase = useCallback(async (accentKey: string, mode: ColorMode) => {
    try {
      // Read existing preferences via server-side API
      const getRes = await fetch('/api/preferences', { credentials: 'include' });
      if (!getRes.ok) return;
      const { preferences: existing } = await getRes.json();

      const merged = {
        ...(existing || {}),
        appearance: {
          ...(existing?.appearance || {}),
          accentColor: accentKey,
          mode,
          backgroundAnimation: bgAnimRef.current,
        },
      };

      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferences: merged }),
      });
    } catch (err) {
      console.error('ThemeProvider: failed to save preferences', err);
    }
  }, []);

  // Apply theme on mount and when accent/mode changes
  useEffect(() => {
    applyTheme(accent, colorMode);
  }, [accent, colorMode]);

  /** Reset state + CSS to purple dark defaults (for logged-out pages) */
  const resetToDefaults = useCallback(() => {
    setAccent(DEFAULT_ACCENT);
    setColorMode('dark');
    setBackgroundAnimationState(true);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODE_STORAGE_KEY);
    localStorage.removeItem(BG_ANIM_STORAGE_KEY);
  }, []);

  /** Load user preferences via server-side API and apply */
  const loadUserPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/preferences', { credentials: 'include' });
      if (!res.ok) return;
      const { preferences: prefs } = await res.json();
      if (!prefs?.appearance) return;

      const { accentColor, mode } = prefs.appearance;

      if (accentColor) {
        const loaded = getAccentByKey(accentColor);
        setAccent(loaded);
        localStorage.setItem(STORAGE_KEY, accentColor);
      }

      if (mode) {
        setColorMode(mode);
        localStorage.setItem(MODE_STORAGE_KEY, mode);
      }

      const bgAnim = prefs.appearance.backgroundAnimation;
      const bgAnimValue = bgAnim !== undefined ? bgAnim : true;
      setBackgroundAnimationState(bgAnimValue);
      localStorage.setItem(BG_ANIM_STORAGE_KEY, String(bgAnimValue));
    } catch {
      // Network error — localStorage values remain
    }
  }, []);

  // On mount: check auth state via server-side /api/me and load preferences
  useEffect(() => {
    async function initTheme() {
      try {
        // Check for valid session entirely server-side
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) {
          resetToDefaults();
          return;
        }
        // Authenticated — load preferences from server
        await loadUserPreferences();
      } catch {
        // Fallback — localStorage values or defaults already applied
      }
    }

    initTheme();
  }, [resetToDefaults, loadUserPreferences]);

  // Auth state changes are handled by full page navigation on login/logout.
  // The initTheme useEffect above runs on mount and handles both states.
  // No browser Supabase client onAuthStateChange listener needed.

  const setAccentColor = useCallback((key: string) => {
    const newAccent = getAccentByKey(key);
    setAccent(newAccent);
    localStorage.setItem(STORAGE_KEY, key);

    let resolvedMode = modeRef.current;

    // If selecting Black, auto-switch to light mode
    if (newAccent.isLightMode) {
      resolvedMode = 'light';
      setColorMode('light');
      localStorage.setItem(MODE_STORAGE_KEY, 'light');
    }
    // If selecting White, auto-switch to dark mode
    if (newAccent.isDarkMode) {
      resolvedMode = 'dark';
      setColorMode('dark');
      localStorage.setItem(MODE_STORAGE_KEY, 'dark');
    }
    // If switching away from Black while in light mode forced by Black, revert to dark
    if (!newAccent.isLightMode && accentRef.current.isLightMode) {
      resolvedMode = 'dark';
      setColorMode('dark');
      localStorage.setItem(MODE_STORAGE_KEY, 'dark');
    }

    saveToSupabase(key, resolvedMode);
  }, [saveToSupabase]);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(MODE_STORAGE_KEY, next);
      saveToSupabase(accentRef.current.key, next);
      return next;
    });
  }, [saveToSupabase]);

  const setBackgroundAnimation = useCallback((enabled: boolean) => {
    setBackgroundAnimationState(enabled);
    localStorage.setItem(BG_ANIM_STORAGE_KEY, String(enabled));
    // Persist to Supabase — bgAnimRef is updated via useEffect, but we need the new value now
    bgAnimRef.current = enabled;
    saveToSupabase(accentRef.current.key, modeRef.current);
  }, [saveToSupabase]);

  return (
    <ThemeContext.Provider
      value={{
        accent,
        setAccentColor,
        colorMode: accent.isLightMode ? 'light' : accent.isDarkMode ? 'dark' : colorMode,
        toggleColorMode,
        accentColors: ACCENT_COLORS,
        backgroundAnimation,
        setBackgroundAnimation,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
