export interface AccentColor {
  name: string;
  key: string;
  hex: string;
  rgb: [number, number, number];
  hover: string;
  bright: string;
  border: string;
  deep: string;
  textSecondary: string;
  waveRgb: [number, number, number];
  logoFile: string;
  /** When true, this accent forces light mode (e.g., Black) */
  isLightMode: boolean;
  /** When true, this accent forces dark mode (e.g., White) */
  isDarkMode: boolean;
  /** Dark-tinted gradient colors for body background */
  gradient1: string;
  gradient2: string;
  /** Input/surface bg in dark mode */
  bgInput: string;
  bgElevated: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    name: 'Violet',
    key: 'violet',
    hex: '#9333ea',
    rgb: [147, 51, 234],
    hover: '#a855f7',
    bright: '#c084fc',
    border: '#6b21a8',
    deep: '#49129b',
    textSecondary: '#c4b5fd',
    waveRgb: [195, 171, 226],
    logoFile: '/logo-violet.PNG',
    isLightMode: false,
    isDarkMode: false,
    gradient1: '#260d3f',
    gradient2: '#490557',
    bgInput: '#0f0520',
    bgElevated: '#1a0a2e',
  },
  {
    name: 'Red',
    key: 'red',
    hex: '#dc2626',
    rgb: [220, 38, 38],
    hover: '#ef4444',
    bright: '#f87171',
    border: '#991b1b',
    deep: '#7f1d1d',
    textSecondary: '#fca5a5',
    waveRgb: [226, 171, 171],
    logoFile: '/logo-red.PNG',
    isLightMode: false,
    isDarkMode: false,
    gradient1: '#3f0d0d',
    gradient2: '#570505',
    bgInput: '#200505',
    bgElevated: '#2e0a0a',
  },
  {
    name: 'Orange',
    key: 'orange',
    hex: '#ea580c',
    rgb: [234, 88, 12],
    hover: '#f97316',
    bright: '#fb923c',
    border: '#9a3412',
    deep: '#7c2d12',
    textSecondary: '#fdba74',
    waveRgb: [226, 195, 171],
    logoFile: '/logo-orange.PNG',
    isLightMode: false,
    isDarkMode: false,
    gradient1: '#3f200d',
    gradient2: '#572205',
    bgInput: '#200f05',
    bgElevated: '#2e170a',
  },
  {
    name: 'Yellow',
    key: 'yellow',
    hex: '#eab308',
    rgb: [234, 179, 8],
    hover: '#facc15',
    bright: '#fde047',
    border: '#a16207',
    deep: '#854d0e',
    textSecondary: '#fde68a',
    waveRgb: [226, 219, 171],
    logoFile: '/logo-yellow.PNG',
    isLightMode: false,
    isDarkMode: false,
    gradient1: '#3f350d',
    gradient2: '#574205',
    bgInput: '#201a05',
    bgElevated: '#2e250a',
  },
  {
    name: 'Green',
    key: 'green',
    hex: '#84cc16',
    rgb: [132, 204, 22],
    hover: '#a3e635',
    bright: '#bef264',
    border: '#4d7c0f',
    deep: '#3f6212',
    textSecondary: '#bef264',
    waveRgb: [186, 226, 171],
    logoFile: '/logo-green.PNG',
    isLightMode: false,
    isDarkMode: false,
    gradient1: '#0d3f10',
    gradient2: '#055718',
    bgInput: '#052010',
    bgElevated: '#0a2e12',
  },
  {
    name: 'Blue',
    key: 'blue',
    hex: '#2563eb',
    rgb: [37, 99, 235],
    hover: '#3b82f6',
    bright: '#60a5fa',
    border: '#1d4ed8',
    deep: '#1e3a8a',
    textSecondary: '#93c5fd',
    waveRgb: [171, 195, 226],
    logoFile: '/logo-blue.PNG',
    isLightMode: false,
    isDarkMode: false,
    gradient1: '#0d1a3f',
    gradient2: '#050e57',
    bgInput: '#050f20',
    bgElevated: '#0a152e',
  },
  {
    name: 'Pink',
    key: 'pink',
    hex: '#d946ef',
    rgb: [217, 70, 239],
    hover: '#e879f9',
    bright: '#f0abfc',
    border: '#a21caf',
    deep: '#86198f',
    textSecondary: '#f0abfc',
    waveRgb: [226, 171, 226],
    logoFile: '/logo-pink.PNG',
    isLightMode: false,
    isDarkMode: false,
    gradient1: '#3f0d3f',
    gradient2: '#570557',
    bgInput: '#200520',
    bgElevated: '#2e0a2e',
  },
  {
    name: 'White',
    key: 'white',
    hex: '#e2e8f0',
    rgb: [226, 232, 240],
    hover: '#f1f5f9',
    bright: '#f8fafc',
    border: '#94a3b8',
    deep: '#64748b',
    textSecondary: '#cbd5e1',
    waveRgb: [210, 215, 226],
    logoFile: '/logo-white.PNG',
    isLightMode: false,
    isDarkMode: true,
    gradient1: '#1a1d21',
    gradient2: '#1f2226',
    bgInput: '#0f1114',
    bgElevated: '#1a1d21',
  },
  {
    name: 'Black',
    key: 'black',
    hex: '#1e293b',
    rgb: [30, 41, 59],
    hover: '#334155',
    bright: '#475569',
    border: '#cbd5e1',
    deep: '#020617',
    textSecondary: '#475569',
    waveRgb: [171, 175, 185],
    logoFile: '/logo-black.PNG',
    isLightMode: true,
    isDarkMode: false,
    gradient1: '#f0f2f5',
    gradient2: '#e2e6eb',
    bgInput: '#f1f5f9',
    bgElevated: '#e2e8f0',
  },
];

export const DEFAULT_ACCENT = ACCENT_COLORS[0]; // Violet

export function getAccentByKey(key: string): AccentColor {
  return ACCENT_COLORS.find((c) => c.key === key) || DEFAULT_ACCENT;
}

/** Compute perceived brightness (0-255) of a hex color like "#abcdef" */
export function perceivedBrightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Build all CSS custom property values for a given accent color.
 * Returns a Record of `--var-name` → `value` pairs.
 */
export function buildCssVars(accent: AccentColor): Record<string, string> {
  const [r, g, b] = accent.rgb;
  const [wr, wg, wb] = accent.waveRgb;
  const isLight = accent.isLightMode;

  return {
    // Accent hex
    '--accent-primary': accent.hex,
    '--accent-hover': accent.hover,
    '--accent-bright': accent.bright,
    '--accent-border': accent.border,
    '--accent-deep': accent.deep,
    '--accent-text': accent.textSecondary,

    // Accent at various opacities
    '--accent-3': `rgba(${r}, ${g}, ${b}, 0.03)`,
    '--accent-5': `rgba(${r}, ${g}, ${b}, 0.05)`,
    '--accent-8': `rgba(${r}, ${g}, ${b}, 0.08)`,
    '--accent-10': `rgba(${r}, ${g}, ${b}, 0.1)`,
    '--accent-15': `rgba(${r}, ${g}, ${b}, 0.15)`,
    '--accent-20': `rgba(${r}, ${g}, ${b}, 0.2)`,
    '--accent-25': `rgba(${r}, ${g}, ${b}, 0.25)`,
    '--accent-30': `rgba(${r}, ${g}, ${b}, 0.3)`,
    '--accent-40': `rgba(${r}, ${g}, ${b}, 0.4)`,
    '--accent-50': `rgba(${r}, ${g}, ${b}, 0.5)`,

    // Shadow presets
    '--shadow-glow-sm': `0 0 15px rgba(${r}, ${g}, ${b}, 0.3)`,
    '--shadow-glow-md': `0 0 40px rgba(${r}, ${g}, ${b}, 0.4)`,
    '--shadow-glow-lg': `0 0 60px rgba(${r}, ${g}, ${b}, 0.5)`,
    '--shadow-glow-accent': `0 0 20px rgba(${r}, ${g}, ${b}, 0.4)`,

    // Backgrounds
    '--bg-primary': isLight ? '#ffffff' : '#000000',
    '--bg-gradient-1': accent.gradient1,
    '--bg-gradient-2': accent.gradient2,
    '--bg-input': accent.bgInput,
    '--bg-elevated': accent.bgElevated,
    '--bg-modal': isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 10, 30, 0.85)',
    '--bg-nav': isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',

    // Body gradient (fully resolved — CSS var() composition in :root is unreliable with inline overrides)
    '--body-bg': isLight
      ? `linear-gradient(135deg, ${accent.gradient1} 0%, #ffffff 50%, ${accent.gradient2} 100%)`
      : `linear-gradient(135deg, ${accent.gradient1} 0%, #000000 50%, ${accent.gradient2} 100%)`,

    // Text
    '--text-primary': isLight ? '#0f172a' : '#ffffff',
    '--text-muted': isLight ? '#64748b' : '#9ca3af',

    // Wave
    '--wave-color': `${wr}, ${wg}, ${wb}`,

    // Card border for dark/light
    '--card-border': isLight ? accent.border : '#000000',

    // Modal border
    '--modal-border': isLight ? accent.border : '#000000',
  };
}
