'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { ACCENT_COLORS, DEFAULT_ACCENT, getAccentByKey, buildCssVars, type AccentColor } from '@/lib/constants/themeColors';
import type { UserPreferences } from '@/types/database';

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

  // Override bg/text if user explicitly toggled mode (non-Black accent in light mode)
  if (effectiveMode === 'light' && !accent.isLightMode) {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-gradient-1', '#f0f2f5');
    root.style.setProperty('--bg-gradient-2', '#e8eaee');
    root.style.setProperty('--bg-input', '#f1f5f9');
    root.style.setProperty('--bg-elevated', '#e2e8f0');
    root.style.setProperty('--bg-modal', 'rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--bg-nav', 'rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-muted', '#64748b');
    root.style.setProperty('--card-border', accent.border);
    root.style.setProperty('--modal-border', accent.border);
    root.style.setProperty('--scrollbar-track', 'var(--bg-elevated)');
    root.style.setProperty('--body-bg', 'linear-gradient(135deg, #f0f2f5 0%, #ffffff 50%, #e8eaee 100%)');
  }

  // Mode-adaptive variables — apply to ALL light modes (Black native + user-toggled)
  const [r, g, b] = accent.rgb;
  if (effectiveMode === 'light') {
    // Solid accent-tinted card bg (6% accent blended into white)
    const cr = Math.round(255 * 0.94 + r * 0.06);
    const cg = Math.round(255 * 0.94 + g * 0.06);
    const cb = Math.round(255 * 0.94 + b * 0.06);
    root.style.setProperty('--bg-card', `rgb(${cr}, ${cg}, ${cb})`);
    root.style.setProperty('--border-default', 'rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--accent-text-emphasis', '#0f172a');
    root.style.setProperty('--accent-text-emphasis-weight', '700');
    root.style.setProperty('--btn-text-on-accent', '#0f172a');
    root.style.setProperty('--accent-vivid', accent.border);
  } else {
    root.style.setProperty('--bg-card', `rgba(${r}, ${g}, ${b}, 0.05)`);
    root.style.setProperty('--border-default', 'transparent');
    root.style.setProperty('--accent-text-emphasis', accent.hex);
    root.style.setProperty('--accent-text-emphasis-weight', 'inherit');
    root.style.setProperty('--btn-text-on-accent', '#ffffff');
    root.style.setProperty('--accent-vivid', accent.hover);
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

  // --- Supabase persistence helpers ---

  const saveToSupabase = useCallback(async (accentKey: string, mode: ColorMode) => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Read existing preferences first to merge
      const { data: row } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const existingPrefs: UserPreferences = (row?.preferences as UserPreferences) || {};
      const merged: UserPreferences = {
        ...existingPrefs,
        appearance: {
          ...existingPrefs.appearance,
          accentColor: accentKey,
          mode,
          backgroundAnimation: bgAnimRef.current,
        },
      };

      await supabase
        .from('users')
        .update({ preferences: merged })
        .eq('id', user.id);
    } catch (err) {
      console.error('ThemeProvider: failed to save preferences to Supabase', err);
    }
  }, []);

  // Apply theme on mount and when accent/mode changes
  useEffect(() => {
    applyTheme(accent, colorMode);
  }, [accent, colorMode]);

  // Load from Supabase on mount (after localStorage has already been applied)
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: row } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', user.id)
          .single();

        const prefs = row?.preferences as UserPreferences | null;
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

        // backgroundAnimation: undefined treated as true (existing users)
        const bgAnim = prefs.appearance.backgroundAnimation;
        const bgAnimValue = bgAnim !== undefined ? bgAnim : true;
        setBackgroundAnimationState(bgAnimValue);
        localStorage.setItem(BG_ANIM_STORAGE_KEY, String(bgAnimValue));
      } catch {
        // Not logged in or network issue — localStorage values already loaded
      }
    }

    loadFromSupabase();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
