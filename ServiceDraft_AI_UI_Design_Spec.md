# SERVICEDRAFT.AI — UI DESIGN SPECIFICATION

**Canonical reference for every visual design decision in the ServiceDraft.AI application.**

This document is the authoritative source of truth for the app's aesthetic, design system, color palette, typography, component specs, and implementation patterns. Every visual choice in the app traces back to rules in this document. When adding new UI, the answer to "how should this look?" is always here first, in the codebase second.

---

## Table of Contents

1. [Design Philosophy & Visual Identity](#1-design-philosophy--visual-identity)
2. [Logo Specifications](#2-logo-specifications)
3. [Dynamic Theming System](#3-dynamic-theming-system)
4. [Color System](#4-color-system)
5. [Background & Animation System](#5-background--animation-system)
6. [Typography System](#6-typography-system)
7. [Page Layout & Navigation System](#7-page-layout--navigation-system)
8. [Card & Container Design System](#8-card--container-design-system)
9. [Modal System](#9-modal-system)
10. [Button Design System](#10-button-design-system)
11. [Form Elements & Input Fields](#11-form-elements--input-fields)
12. [Data Table Design System](#12-data-table-design-system)
13. [Effects & Micro-Interactions](#13-effects--micro-interactions)
14. [Page-Specific UI Specifications](#14-page-specific-ui-specifications)
15. [Icon System](#15-icon-system)
16. [Toast Notification System](#16-toast-notification-system)
17. [Loading States](#17-loading-states)
18. [Responsive & Mobile Design](#18-responsive--mobile-design)
19. [Z-Index Reference](#19-z-index-reference)
20. [Tailwind v4 @theme Configuration](#20-tailwind-v4-theme-configuration)
21. [CSS Custom Properties Complete Reference](#21-css-custom-properties-complete-reference)
22. [Design Implementation Checklist](#22-design-implementation-checklist)

---

## 1. Design Philosophy & Visual Identity

### Core aesthetic

ServiceDraft.AI blends **automotive-tech futurism** with **glassmorphism and cinematic depth**. Every surface feels like it's floating over a luminous gradient backdrop, with soft accent glows tracking cursor movement. The vibe is meant to evoke a modern dealership scan tool crossed with a sci-fi cockpit — professional, confident, and clearly built for technicians who spend their day around vehicles.

### Design pillars

1. **Accent-driven theming** — a single selectable accent color (from 9 options) cascades through every border, glow, text highlight, and background tint via CSS variables. The UI should feel unified regardless of which accent is picked.
2. **Glassmorphism with depth** — containers use blurred translucent backgrounds layered over the gradient body, creating a sense of depth without being distracting.
3. **Motion with restraint** — Framer Motion is used generously but subtly. Transitions are spring-based with tuned stiffness/damping so everything feels physical rather than mechanical.
4. **Dark-first, light-mode-capable** — the default experience is dark mode. Light mode works and is tested, but it inverts the philosophy: backgrounds become the accent color and accents become deep/dark shades. The two modes should feel like two different moods rather than a forced inversion.
5. **Cursor underglow over scale** — cards and containers do NOT scale on hover. Instead, they reveal a cursor-tracked radial gradient glow. Only buttons and small interactive elements scale.
6. **Professional data density** — tables are dense and center-aligned with glowing row hover effects. Modals are opaque for readability. Forms use generous spacing so technicians with gloves or tired eyes can hit targets.

### What we explicitly avoid

- Hardcoded hex colors anywhere outside `themeColors.ts` and `globals.css`
- Scale animations on cards or containers (only on interactive elements ≤ button size)
- Bright flat backgrounds — everything sits over the gradient body
- Small tap targets on mobile
- Sudden color changes without transition animations
- Light mode surfaces that look like "dark mode with inverted text"
- Emoji in UI text (the aesthetic is clean/professional, not playful)

---

## 2. Logo Specifications

### Logo files

Two primary logo assets live in the `public/` directory and in the project root:

| File | Purpose | Aspect Ratio |
|---|---|---|
| `SERVIDRAFT.AI LOGO #1 .PNG` | Primary square logo used on hero area (oversized floating), landing page, and auth pages | 1:1 |
| `ServiceDraft-Ai Vector Logo.png` | Horizontal vector wordmark used in NavBar center and in every export document footer | 2.09:1 |

Additionally, there are 9 accent-colored variants of the primary logo: `public/logo-violet.PNG`, `logo-red.PNG`, `logo-orange.PNG`, etc. The ThemeProvider picks the correct file based on the current accent color.

### Usage by surface

| Surface | Which Logo | Size/Treatment |
|---|---|---|
| HeroArea (protected pages) | `logo-{color}.PNG` | Oversized (~120px tall), floating, positioned to bleed above the hero wave |
| NavBar center | `ServiceDraft-Ai Vector Logo.png` | ~32px tall, centered absolutely, CSS filter: `brightness(0) invert(1)` in dark mode, `brightness(0)` in light mode |
| Landing page hero | `logo-{color}.PNG` | Large, centered, with cinematic entrance animation |
| Login/Signup pages | `logo-{color}.PNG` | Medium, centered above the form card |
| Export documents (PDF/DOCX) | `ServiceDraft-Ai Vector Logo.png` | Bottom-right corner, 25×12mm (PDF) / 55×26px (DOCX) |
| Email exports | `ServiceDraft-Ai Vector Logo.png` | Footer, matches document layout |

### Hydration safety

Logo components read the current accent from the ThemeProvider context, which means they can only render the correct color after React hydration completes. To prevent hydration mismatches, logo components use a `mounted` state guard:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const logoSrc = mounted ? accent.logoFile : DEFAULT_ACCENT.logoFile;
```

Applied in `HeroArea.tsx`, `Logo.tsx` (landing/auth), and `NavBar.tsx`.

### Vector logo CSS filters for mode adaptation

The `ServiceDraft-Ai Vector Logo.png` is a black wordmark. It's color-adjusted via CSS filter based on current mode:

```tsx
<img
  src="/ServiceDraft-Ai Vector Logo.png"
  style={{
    filter: colorMode === 'dark'
      ? 'brightness(0) invert(1)'  // Black → White
      : 'brightness(0)',            // Keep black
  }}
/>
```

---

## 3. Dynamic Theming System

### System overview

The app uses a runtime CSS custom property system controlled by `ThemeProvider` (`src/components/ThemeProvider.tsx`). Changing the accent color or mode triggers `applyTheme()`, which updates every CSS variable on `document.documentElement` in a single pass. Every styled component references these variables, so the entire UI updates in real-time without any re-render thrash.

### Architecture

```
src/lib/constants/themeColors.ts    → AccentColor interface, 9 color definitions, buildCssVars(), perceivedBrightness()
src/components/ThemeProvider.tsx     → React context, localStorage persistence, Supabase sync, CSS injection
src/app/globals.css                 → :root defaults (Violet), @theme Tailwind config, body styles
src/app/layout.tsx                  → <ThemeProvider> wraps the entire app
public/logo-{color}.PNG             → 9 accent-colored logo files
```

### Theme state (from `useTheme()`)

```typescript
interface ThemeContextValue {
  accent: AccentColor;                  // Current accent with all computed properties
  setAccentColor: (key: string) => void;
  colorMode: 'dark' | 'light';
  toggleColorMode: () => void;
  backgroundAnimation: boolean;
  setBackgroundAnimation: (enabled: boolean) => void;
}
```

### Persistence flow

1. **On mount (instant):** ThemeProvider reads `sd-accent-color`, `sd-color-mode`, and `sd-bg-animation` from localStorage and applies them immediately. No flash of unstyled content.
2. **After hydration:** ThemeProvider asynchronously queries `users.preferences.appearance` from Supabase via dynamic import.
3. **If Supabase has preferences:** They override localStorage and write back to localStorage for consistency across sessions on the same device.
4. **On sign-out / unauthenticated:** ThemeProvider resets to violet dark defaults and clears localStorage.
5. **On preference change:** The merge pattern reads existing `preferences` JSONB first, then spreads the new appearance object to avoid overwriting unrelated preference categories:
   ```typescript
   const merged = { ...existingPrefs, appearance: { accentColor, mode, backgroundAnimation } };
   ```

### Forced mode overrides

Two accents force a specific mode regardless of the user's toggle:
- **Noir accent (`white`)** — forces **dark mode** (the accent itself is very light, so dark mode is the only readable option)
- **White accent (`black`)** — forces **light mode** (the accent itself is very dark, so light mode is the only readable option)

The other 7 accents respect the user's selected mode freely.

---

## 4. Color System

### The 9 accent colors

| Display Name | Key | Hex | Forces Mode |
|---|---|---|---|
| **Violet** | `violet` | `#9333ea` | — (default) |
| **Red** | `red` | `#dc2626` | — |
| **Orange** | `orange` | `#ea580c` | — |
| **Yellow** | `yellow` | `#eab308` | — |
| **Green** | `green` | `#84cc16` | — |
| **Blue** | `blue` | `#2563eb` | — |
| **Pink** | `pink` | `#d946ef` | — |
| **Noir** | `white` | `#e2e8f0` | Forces dark mode |
| **White** | `black` | `#1e293b` | Forces light mode |

**Display name vs. key note:** The internal keys `white` and `black` are legacy and map to the user-facing display names **Noir** and **White** respectively. This is intentional — the display names were updated to match their mood (very light accent = "Noir" when on dark background, very dark accent = "White" when on light background). Do not rename the keys without a coordinated migration of localStorage values and Supabase preference data.

### Opacity ladder

Every accent has 10 opacity-derived variants available as CSS variables. These are all derived from the accent's primary RGB values:

| Variable | Opacity | Typical use |
|---|---|---|
| `--accent-3` | 3% | Subtle background wash |
| `--accent-5` | 5% | Card background (`--bg-card`) |
| `--accent-8` | 8% | Hover-background on subtle rows |
| `--accent-10` | 10% | Main Menu button background, NavBar accents |
| `--accent-15` | 15% | Button hover background |
| `--accent-20` | 20% | Active state backgrounds |
| `--accent-25` | 25% | Selected row backgrounds |
| `--accent-30` | 30% | Cursor underglow, small shadow glows |
| `--accent-40` | 40% | Medium shadow glows |
| `--accent-50` | 50% | Large shadow glows |

### Core accent variables

| Variable | Purpose | Default (Violet Dark) |
|---|---|---|
| `--accent-primary` | Main accent color | `#9333ea` |
| `--accent-hover` | Hover/interactive accent | `#a855f7` |
| `--accent-bright` | Brightest accent (links, highlights, version label) | `#c084fc` |
| `--accent-border` | Border color for inputs/cards | `#6b21a8` |
| `--accent-deep` | Darkest accent (deep glow) | `#49129b` |
| `--accent-text` | Text secondary (accent-tinted) | `#c4b5fd` |
| `--accent-vivid` | Secondary button text (darker shade in light mode) | `#a855f7` |
| `--accent-text-emphasis` | Heading emphasis (accent in dark, bold black in light) | `#9333ea` |

### Background variables

| Variable | Purpose | Default (Violet Dark) |
|---|---|---|
| `--bg-primary` | Page background base | `#000000` |
| `--bg-gradient-1` | Body gradient start | `#260d3f` |
| `--bg-gradient-2` | Body gradient end | `#490557` |
| `--bg-input` | Input field background | `#0f0520` |
| `--bg-elevated` | Elevated surface | `#1a0a2e` |
| `--bg-card` | Card background (derived: `var(--accent-5)`) | `rgba(147, 51, 234, 0.05)` |
| `--bg-modal` | Modal panel background | `rgba(15, 10, 30, 0.85)` |
| `--bg-nav` | NavBar background | `rgba(0, 0, 0, 0.8)` |
| `--body-bg` | Full body gradient (fully resolved string) | `linear-gradient(135deg, #260d3f 0%, #000000 50%, #490557 100%)` |

### Text variables

| Variable | Purpose | Default (Violet Dark) |
|---|---|---|
| `--text-primary` | Primary text | `#ffffff` |
| `--text-secondary` | Secondary text (derived: `var(--accent-text)`) | `#c4b5fd` |
| `--text-muted` | Muted/subtle text | `#9ca3af` |
| `--btn-text-on-accent` | Auto-computed: white or black based on accent luminance | `#ffffff` |

### Border variables

| Variable | Purpose | Default (Violet Dark) |
|---|---|---|
| `--card-border` | Card border color | `#000000` |
| `--modal-border` | Modal border color | `#000000` |
| `--border-default` | Generic fallback border | `transparent` |

### Shadow variables

| Variable | Purpose | Default (Violet) |
|---|---|---|
| `--shadow-glow-sm` | Small glow (buttons) | `0 0 15px rgba(147, 51, 234, 0.3)` |
| `--shadow-glow-md` | Medium glow (cards) | `0 0 40px rgba(147, 51, 234, 0.4)` |
| `--shadow-glow-lg` | Large glow (hero elements) | `0 0 60px rgba(147, 51, 234, 0.5)` |
| `--shadow-glow-accent` | Accent glow for interactive elements | `0 0 20px rgba(147, 51, 234, 0.4)` |

### Canvas animation variables

| Variable | Purpose | Default (Violet) |
|---|---|---|
| `--wave-color` | Wave RGB components as bare triplet (for canvas `rgba(r, g, b, a)` usage) | `195, 171, 226` |

### Scrollbar variables

| Variable | Purpose |
|---|---|
| `--scrollbar-track` | Track color (maps to `--bg-input`) |
| `--scrollbar-thumb` | Thumb color (maps to `--accent-border`) |
| `--scrollbar-thumb-hover` | Thumb hover color (maps to `--accent-hover`) |

### How to use in components

**NEVER** hardcode hex colors outside of `themeColors.ts` and `globals.css`. **ALWAYS** use CSS variable references via Tailwind arbitrary values:

```tsx
// CORRECT — uses CSS variables
<div className="bg-[var(--bg-card)] border-[var(--accent-border)] text-[var(--text-primary)]">
<button className="bg-[var(--accent-hover)] hover:bg-[var(--accent-primary)]">
<span className="text-[var(--text-secondary)]">Secondary text</span>
<div style={{ boxShadow: 'var(--shadow-glow-md)' }}>Glowing card</div>

// WRONG — hardcoded colors
<div className="bg-purple-600 text-[#c4b5fd]">
<button className="bg-[#a855f7]">
```

### `buildCssVars()` and the light mode transform

The function `buildCssVars(accent: AccentColor)` in `src/lib/constants/themeColors.ts` returns a `Record<string, string>` of every CSS variable to be set. When the effective mode is light, additional transforms are applied by `applyTheme()` in the ThemeProvider:

- `--bg-primary` inverted to near-white
- `--text-primary` inverted to black
- `--text-muted` adjusted to a darker gray
- `--bg-modal`, `--bg-nav`, `--body-bg`, `--card-border`, `--modal-border` all remapped for light surfaces
- `--accent-vivid` shifted to use the darker shade so secondary button text stays readable
- `--accent-text-emphasis` switches from accent color to bold black for headers

### Luminance-based button text color

```typescript
--btn-text-on-accent: computed via perceivedBrightness(accent.hover)
  → black (#000000) if brightness > 180
  → white (#ffffff) otherwise
```

This ensures button text is always readable against the accent background. The Yellow, White (`black` key), and Noir (`white` key) accents have bright-enough backgrounds that black text is used; the rest use white.

---

## 5. Background & Animation System

### Two background animation systems

The app has two distinct canvas animations depending on which area of the app the user is in:

| Animation | Component | Used On | Behavior |
|---|---|---|---|
| **WaveBackground** | `src/components/ui/WaveBackground.tsx` | Landing page, Login page, Signup page | Sine wave canvas with layered opacity, multi-hue cycling |
| **ParticleNetwork** | `src/components/ui/ParticleNetwork.tsx` | All protected pages (Main Menu, Input, Narrative, Dashboards) | Full-page particle field with line-of-sight connections |

Both animations read `--wave-color` from the DOM:

```tsx
const root = document.documentElement;
const waveRgb =
  root.style.getPropertyValue('--wave-color').trim() ||           // 1. Inline style (set by ThemeProvider)
  getComputedStyle(root).getPropertyValue('--wave-color').trim() || // 2. Computed style fallback
  '195, 171, 226';                                                  // 3. Hardcoded fallback (Violet)
```

### Performance considerations

- **ParticleNetwork** re-reads `--wave-color` every 2 seconds via `setInterval` to catch theme changes without polling every frame
- **WaveBackground** reads every frame because it's only used on pre-auth pages where theme changes are rare
- Both animations respect `prefers-reduced-motion` and the user's `backgroundAnimation` preference toggle

### User control

Users can disable particle network on protected pages via the User Dashboard preferences panel (`PreferencesPanel.tsx`). The setting is:
- Persisted in localStorage as `sd-bg-animation`
- Synced to Supabase at `users.preferences.appearance.backgroundAnimation`
- Default: enabled

### HeroArea reactive wave

The 100px-tall hero area at the top of every protected page contains its own mini sine wave animation (`src/components/layout/HeroArea.tsx`) that reacts to user activity. When an action happens, the wave amplitude pulses and decays.

See Section 13 for the activity pulse intensity table.

### Body gradient

The body background is a fixed 135° linear gradient rendered as a fully resolved CSS string in `--body-bg`:

```css
body {
  background: var(--body-bg);
  /* Resolved example for Violet dark mode: */
  /* linear-gradient(135deg, #260d3f 0%, #000000 50%, #490557 100%) */
}
```

**Critical:** `--body-bg` must be a fully resolved gradient string, NOT CSS `var()` composition. CSS `var()` composition in `:root` is unreliable when source variables are set as inline styles by JavaScript — see CRITICAL LESSONS LEARNED #25 in CLAUDE_CODE_BUILD_INSTRUCTIONS.md.

---

## 6. Typography System

### Font stack

Two Google Fonts are loaded in `src/app/layout.tsx` via `next/font/google`:

| Font | Usage | Weight Range |
|---|---|---|
| **Orbitron** | Headers, navigation, titles, buttons, body (primary) | 400–900 |
| **Inter** | Data fields, user-entered text, generated narrative content, long-form body text | 400–600 |

### Font variables

```css
--font-sans: var(--font-orbitron), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

The `--font-orbitron` variable is set by next/font and referenced first in the `--font-sans` stack, with Inter as the secondary fallback.

### Base body styles

```css
body {
  background: var(--body-bg);
  color: var(--text-primary);
  font-family: var(--font-orbitron), "Inter", -apple-system, ...;
  font-weight: 600;
  letter-spacing: 0.04em;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  letter-spacing: 0.06em;
}
```

### Typography scale (used across the app)

| Element | Size | Weight | Letter-spacing | Font |
|---|---|---|---|---|
| Page title (h1) | 36–48px (`text-4xl`/`text-5xl`) | 700 | 0.06em | Orbitron |
| Section header (h2) | 24–30px (`text-2xl`/`text-3xl`) | 700 | 0.06em | Orbitron |
| Card title (h3) | 18–20px (`text-lg`/`text-xl`) | 600 | 0.05em | Orbitron |
| Subsection (h4) | 16px (`text-base`) | 600 | 0.04em | Orbitron |
| Body text | 14–16px | 500–600 | 0.04em | Orbitron |
| Data text (Inter) | 14–16px | 400 | 0.01em | Inter (via `.font-data`) |
| Table text | 13–14px | 500 | 0.04em | Orbitron |
| Muted/caption | 12px (`text-xs`) | 500 | 0.04em | Orbitron |
| Button text | 14–16px | 600–700 | 0.05em | Orbitron |

### The `.font-data` utility class

For user-entered text and generated narrative content, the app uses Inter instead of Orbitron because Orbitron's geometric forms hurt readability for long-form prose. The `.font-data` class switches:

```css
.font-data {
  font-family: var(--font-data), system-ui, sans-serif !important;
  font-weight: 400 !important;
  letter-spacing: 0.01em;
}
```

Applied on:
- Input fields and textareas on the Input Page
- Generated narrative body text on the Narrative Page
- Narrative preview snippets in dashboards
- User profile data in ProfileSection and UserPopup

### Uppercase convention

Many UI labels use uppercase styling for visual uniformity. This is done via Tailwind's `uppercase` utility class, NOT by typing text in uppercase. Examples:
- Button labels (e.g., `GENERATE NARRATIVE`, `SAVE STORY`)
- Section headers in export documents
- Tab labels on the Owner Dashboard
- Field labels on the Input Page

Generated narrative text is uppercase because the AI prompts explicitly require it — that uppercasing is the content itself, not a CSS style.

---

## 7. Page Layout & Navigation System

### Protected page structure

Every page under `src/app/(protected)/` shares this layout managed by `src/app/(protected)/layout.tsx`:

```
┌────────────────────────────────────────────┐
│  HeroArea (100px, reactive sine wave)      │  ← Top sticky
│    • Oversized floating logo               │
│    • Bleeds above the nav bar              │
├────────────────────────────────────────────┤
│  NavBar (64px sticky)                      │
│    • LEFT: MAIN MENU button                │
│    • CENTER: Vector logo + APP_VERSION     │
│    • RIGHT: Mode toggle + UserPopup        │
├────────────────────────────────────────────┤
│                                            │
│  ParticleNetwork canvas                    │  ← Full-page background
│                                            │
│  Page content (PageTransition wrapper)     │  ← Framer Motion entrance
│                                            │
│                                            │
└────────────────────────────────────────────┘
```

### Layout file structure

```tsx
// src/app/(protected)/layout.tsx
export default function ProtectedLayout({ children }) {
  useSessionExpiry();  // 8-hour auto-logout watcher
  return (
    <ErrorBoundary>
      <ParticleNetwork />
      <HeroArea />
      <NavBar />
      <main className="relative z-10 pt-[164px]">
        <PageTransition>{children}</PageTransition>
      </main>
    </ErrorBoundary>
  );
}
```

The `pt-[164px]` top padding accommodates the combined 100px hero + 64px nav bar stack.

### HeroArea specifications

| Property | Value |
|---|---|
| Height | 100px |
| Position | Sticky top, z-index above body but below nav |
| Background | Transparent canvas with reactive sine wave |
| Wave color | Reads `--wave-color` each frame |
| Logo | Oversized (~120px tall), floating, absolutely positioned to bleed above the wave |
| Activity reactivity | `useActivityPulse` hook — pulses amplitude on dispatched events |

### HeroArea activity pulse intensities

When user actions happen elsewhere in the app, they dispatch an activity pulse that animates the hero wave:

| Action | Intensity (0–1) |
|---|---|
| Generate/Regenerate narrative | 0.8 |
| Customize | 0.7 |
| Proofread | 0.6 |
| Apply edits | 0.7 |
| Save | 0.5 |

Dispatch pattern:
```typescript
import { dispatchActivity } from '@/hooks/useActivityPulse';
dispatchActivity(0.8);
```

The wave amplitude smoothly ramps up to the dispatched intensity, holds briefly, then decays over ~1.5 seconds.

### NavBar layout (3 sections)

The NavBar is 64px tall, sticky below the HeroArea, with three distinct sections:

**LEFT section:**
- Styled "MAIN MENU" button
- `bg-[var(--accent-10)]` background
- `border-[var(--accent-border)]` border
- `rounded-lg` corners
- Hover: `bg-[var(--accent-15)]` + subtle glow
- Click: navigates to `/main-menu` with unsaved-narrative guard

**CENTER section (absolutely positioned):**
- `ServiceDraft-Ai Vector Logo.png`
- CSS filter: `brightness(0) invert(1)` in dark mode, `brightness(0)` in light mode
- `APP_VERSION` label below or beside (text color `text-[var(--accent-bright)]`, small font)
- The version string is imported from `src/lib/version.ts` and **MUST NEVER be hardcoded**. It's one of two display points governed by the MANDATORY VERSION BUMP RULE.
- Hidden on mobile breakpoints

**RIGHT section:**
- Color mode toggle button (Sun icon in dark mode, Moon icon in light mode)
- `UserPopup` trigger — displays position icon + formatted name (e.g., "T.Cloyd")
- Mobile hamburger menu button (replaces user popup on narrow screens)

### UserPopup component

The user popup is triggered by clicking the name/avatar in the NavBar right section. It slides down with a scale-and-fade animation and contains:

1. **User info section** — PositionIcon (large), full name, email, location, position
2. **Dashboard link** — all users → `/dashboard`
3. **Owner Dashboard link** — owner role only → `/admin`, Shield icon, gold/amber accent
4. **Team Dashboard link** — admin role only → `/team-dashboard`, Users icon
5. **Log Out button** — at the bottom, separated by divider

The name is formatted by `formatDisplayName()`:
- First initial + period + last name → `T.Cloyd`
- Fallback to username if names are missing
- Final fallback to email prefix

---

## 8. Card & Container Design System

### LiquidCard — the primary container component

`src/components/ui/LiquidCard.tsx` is the canonical card component used for almost every content container in the app.

**Specifications:**

```tsx
className="bg-[var(--bg-card)] backdrop-blur-sm border border-[var(--card-border)] rounded-[23px]"
```

| Property | Value |
|---|---|
| Background | `var(--bg-card)` — derived from `var(--accent-5)` (5% accent tint) |
| Backdrop blur | `backdrop-blur-sm` (4px) — subtle glassmorphism |
| Border | 1px solid `var(--card-border)` — typically black in dark mode |
| Border radius | 23px (from `--radius-card` in Tailwind @theme) |
| Hover effect | CursorGlow radial gradient (no scale) |
| Shadow | None by default; `var(--shadow-glow-md)` on interactive variants |

### Border radius scale

| Size | Variable | Value | Used For |
|---|---|---|---|
| `--radius-sm` | 6px | Small buttons, tight controls |
| `--radius-md` | 8px | Inputs, dropdowns, medium buttons |
| `--radius-lg` | 12px | Large buttons, form cards, list items |
| `--radius-xl` | 16px | Elevated containers |
| `--radius-2xl` | 23px | LiquidCard, modal panels, hero containers |
| `--radius-card` | 23px | Alias for `--radius-2xl`, used in `@theme` block |

The signature **23px border radius** is the most distinctive visual marker of the app's card system. It was chosen as a rounder-than-typical corner radius that reads as intentional rather than default.

### Container usage patterns

**Full-width page card:**
```tsx
<LiquidCard className="max-w-6xl mx-auto p-8">
  {/* Page content */}
</LiquidCard>
```

**Dashboard metric card:**
```tsx
<LiquidCard className="p-6 flex flex-col items-center">
  <div className="text-4xl font-bold text-[var(--accent-bright)]">{value}</div>
  <div className="text-sm text-[var(--text-muted)] uppercase tracking-wider mt-2">{label}</div>
</LiquidCard>
```

**Form container:**
```tsx
<LiquidCard className="p-6 md:p-8 space-y-4">
  {/* Form fields */}
</LiquidCard>
```

### CursorGlow wrapper

`src/components/ui/CursorGlow.tsx` adds a cursor-tracked radial gradient to any container. LiquidCard uses it automatically; other containers can wrap their children in `<CursorGlow>`.

**Implementation:**
- Tracks `mousemove` events on the wrapped element
- Sets `--mouse-x` and `--mouse-y` CSS custom properties on that element
- Applies a radial gradient: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), var(--accent-30), transparent 80%)`
- The glow follows the cursor smoothly and fades out when the cursor leaves

**Important:** CursorGlow is the hover effect for cards. Cards do NOT use scale animations. Only buttons and small interactive elements scale.

---

## 9. Modal System

### Modal component

`src/components/ui/Modal.tsx` — a portaled modal rendered to `document.body` with Framer Motion entrance animations.

### Modal opacity & blur standards (opaque for readability)

Modals use a **solid dark background** so text is fully readable without background bleed-through. This differs from LiquidCard (which is more translucent) because modal content usually requires careful reading.

| Layer | Styling |
|---|---|
| **Modal panel** | `bg-[var(--bg-modal)]` with `backdrop-blur-xl` (24px blur), `border-[var(--modal-border)]` |
| **Modal backdrop** | `bg-black/70` with `backdrop-blur-[4px]` |
| **LiquidCard (non-modal)** | `bg-[var(--bg-card)]` with `backdrop-blur-sm`, lighter translucency |

### Modal entrance animation

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {/* Backdrop */}
</motion.div>
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
  {/* Panel */}
</motion.div>
```

### Close behaviors

All modals support these close interactions:
1. **X button** in the top-right corner of the modal
2. **Backdrop click** — clicking outside the modal panel
3. **Escape key** — global `keydown` listener, auto-removed on unmount

### Modal structure

```tsx
<Modal open={isOpen} onClose={handleClose}>
  <div className="p-6 md:p-8 space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
      <button onClick={handleClose}><X size={24} /></button>
    </div>
    <div className="space-y-4">
      {/* Modal body */}
    </div>
    <div className="flex gap-3 justify-end pt-4">
      {/* Action buttons */}
    </div>
  </div>
</Modal>
```

### Modal scroll behavior

- Modal content that exceeds viewport height scrolls internally (`overflow-y-auto` on the modal panel)
- The backdrop does NOT scroll — it's fixed behind the modal
- Body scroll is locked while the modal is open (prevents dual-scroll confusion)

### Notable modals in the app

| Modal | Component | Used On |
|---|---|---|
| Save Repair | `SaveRepairModal.tsx` | Input Page |
| Edit Repair | `EditRepairModal.tsx` | Input Page (My Repairs panel) |
| Edit Story | `EditStoryModal.tsx` | Narrative Page |
| Share/Export | `ShareExportModal.tsx` | Narrative Page |
| Email Export | `EmailExportModal.tsx` | Narrative Page (inside Share/Export) |
| Update With Repair | `UpdateWithRepairModal.tsx` | User Dashboard (diagnostic narrative row) |
| Narrative Detail | `NarrativeDetailModal.tsx` | User Dashboard (any narrative row) |
| Activity Detail | `ActivityDetailModal.tsx` | Owner Dashboard + Team Dashboard |
| Edit Profile | `EditProfileModal.tsx` | User Dashboard |
| Appearance | `AppearanceModal.tsx` | User Dashboard |
| Saved Repairs | `SavedRepairsModal.tsx` | User Dashboard |

---

## 10. Button Design System

### Button component

`src/components/ui/Button.tsx` — a `motion.button` with three variants and consistent hover/tap behavior.

### Variants

**Primary (default)**
```tsx
<Button variant="primary">GENERATE NARRATIVE</Button>
```
- Background: `var(--accent-hover)` (active fill color)
- Text: `var(--btn-text-on-accent)` (auto white or black based on luminance)
- Border: 1px solid `var(--accent-border)`
- Hover: background shifts to `var(--accent-primary)`, glow added
- Tap: scale 0.95

**Secondary**
```tsx
<Button variant="secondary">CANCEL</Button>
```
- Background: transparent with a subtle `var(--accent-10)` tint
- Text: `var(--accent-vivid)` (darker shade in light mode for readability)
- Border: 1px solid `var(--accent-border)`
- Hover: fills with `var(--accent-15)`, glow added
- Tap: scale 0.95

**Ghost**
```tsx
<Button variant="ghost">Learn More</Button>
```
- Background: transparent
- Text: `var(--text-secondary)` or `var(--accent-bright)`
- Border: none
- Hover: text shifts to `var(--accent-hover)`, subtle underline
- Tap: scale 0.95
- Used for tertiary actions, links, and inline calls-to-action

### Scale animation rules

```tsx
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
transition={{ type: 'spring', stiffness: 400, damping: 25 }}
```

### Box shadow on hover

```tsx
whileHover={{ boxShadow: 'var(--shadow-glow-sm)' }}
```

**IMPORTANT:** Framer Motion cannot tween an unresolved `var()` reference inside a composed style object. The `var()` must be passed directly in the animation prop, not composed inside `style={{}}`.

### Hover/Tap matrix by element type

| Element | `whileHover scale` | `whileTap scale` | `boxShadow on hover` |
|---|---|---|---|
| LiquidCard | **NONE** (CursorGlow) | NONE | CSS hover only |
| Button | 1.05 | 0.95 | `var(--shadow-glow-sm)` |
| StoryTypeSelector cards | **NONE** | 0.97 | `var(--shadow-glow-sm)` |
| Small links (FAQ, footer) | 1.08 | 0.95 | none |
| Dropdown items | 1.02 | 0.98 | none |

**Rules:**
- Cards and containers do NOT scale on hover — they use CursorGlow instead
- Buttons and small interactive elements use scale + glow
- StoryTypeSelector cards are unique: they don't scale on hover but they DO scale on tap (0.97) for tactile feedback
- Always use the spring transition config (`stiffness: 400, damping: 25`) for consistency

### Button sizing

| Size | Padding | Font Size | Used For |
|---|---|---|---|
| `sm` | `px-3 py-1.5` | 13px | Table row actions, compact UI |
| `md` (default) | `px-5 py-2.5` | 14–16px | Standard form buttons |
| `lg` | `px-8 py-3` | 16–18px | Primary CTAs, modal confirmations |

### Disabled state

```tsx
<Button disabled>SAVING...</Button>
```
- Opacity: 50%
- Cursor: `not-allowed`
- No hover/tap animations
- No glow

---

## 11. Form Elements & Input Fields

### Input component

`src/components/ui/Input.tsx` — themed text input with `forwardRef` for programmatic focus.

**Base styling:**
```tsx
className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--accent-border)] rounded-[var(--radius-md)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-hover)] focus:border-[var(--accent-hover)] transition-all"
```

| Property | Value |
|---|---|
| Background | `var(--bg-input)` |
| Text color | `var(--text-primary)` |
| Border | 1px solid `var(--accent-border)` |
| Border radius | `var(--radius-md)` (8px) |
| Padding | `px-4 py-2.5` |
| Focus ring | 2px solid `var(--accent-hover)` |
| Placeholder color | `var(--text-muted)` |
| Font | `.font-data` (Inter) for text content |

### Textarea component

`src/components/ui/Textarea.tsx` — multi-line variant with the same base styling as Input plus `min-h-[100px]`.

### AutoTextarea component

`src/components/ui/AutoTextarea.tsx` — auto-expanding textarea that grows with content.

**Implementation:**
- `resize: none` (disables manual resize handle)
- Height is set dynamically via JavaScript: `element.style.height = 'auto'; element.style.height = element.scrollHeight + 'px'`
- Triggered on every `onInput` event
- Used on the Narrative Page in the Edit Story modal

### Select component

`src/components/ui/Select.tsx` — themed select dropdown with a `ChevronDown` icon.

**Base styling:**
```tsx
<select className="appearance-none bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--accent-border)] rounded-[var(--radius-md)] px-4 py-2.5 pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-hover)]">
  {/* Options */}
</select>
<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" size={18} />
```

The `appearance-none` strip removes browser default styling. The ChevronDown icon is absolutely positioned inside the wrapper.

### Form control dark mode enforcement

Two layers ensure correctly themed form controls regardless of browser defaults:

1. **`color-scheme` CSS property** — set on `:root` to `'dark'` or `'light'` by ThemeProvider. This influences browser native form control rendering (checkboxes, date pickers, etc.).

2. **Explicit CSS overrides in `globals.css`:**
```css
input,
textarea,
select {
  background-color: var(--bg-input);
  color: var(--text-primary);
}
input::placeholder,
textarea::placeholder {
  color: var(--text-muted);
}
```

This belt-and-suspenders approach prevents the "light blue autofill" phenomenon and similar browser default intrusions.

### Field validation display

Validation errors are shown below the field in `text-xs text-red-400` with no background highlight. The field itself does NOT get a red border — the focus ring remains accent-colored.

```tsx
<Input
  value={email}
  onChange={setEmail}
  placeholder="name@example.com"
/>
{emailError && (
  <p className="text-xs text-red-400 mt-1">{emailError}</p>
)}
```

---

## 12. Data Table Design System

Data tables appear in several places: Owner Dashboard (User Management, Activity Log, Analytics, API Usage), Team Dashboard (Members, Activity), and User Dashboard (Narrative History, Saved Repairs).

### Table base styling

```tsx
<table className="w-full border-separate border-spacing-0">
  <thead>
    <tr>
      <th className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold py-3 px-4 text-center border-b border-[var(--accent-border)]">
        {columnLabel}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-[var(--accent-10)] transition-colors cursor-pointer">
      <td className="py-3 px-4 text-center text-sm text-[var(--text-primary)] border-b border-[var(--accent-border)]">
        {cellValue}
      </td>
    </tr>
  </tbody>
</table>
```

### Table design principles

1. **Center-aligned content** — both headers and cells are `text-center`, creating a symmetric grid feel
2. **Uppercase column headers** — `text-xs uppercase tracking-wider` for visual uniformity
3. **Glowing row hover** — rows highlight with `var(--accent-10)` background on hover
4. **Transparent row background** by default (sits over the LiquidCard or page background)
5. **Accent-colored borders** between rows using `border-b border-[var(--accent-border)]`
6. **Clickable rows** where applicable — `cursor-pointer` + opens a modal with full details

### Column truncation pattern

Long values (email addresses, team names) are truncated with a tooltip:

```tsx
<td className="py-3 px-4 text-center text-sm text-[var(--text-primary)] max-w-[180px]">
  <span title={fullValue} className="block truncate">
    {fullValue}
  </span>
</td>
```

### Inline action buttons

Table rows that support actions (restrict, delete, reset password, etc.) use an actions column with small icon buttons:

```tsx
<td className="py-3 px-4 text-center">
  <div className="flex items-center justify-center gap-2">
    <button className="p-1.5 rounded hover:bg-[var(--accent-15)] text-[var(--accent-bright)]">
      <Lock size={16} />
    </button>
    <button className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
      <Trash2 size={16} />
    </button>
  </div>
</td>
```

Icon size is consistently 16px for table actions. Padding is `p-1.5` for compact hit targets.

### Sortable columns

Sortable columns show a ChevronUp/ChevronDown icon next to the header label:

```tsx
<th onClick={() => handleSort('name')} className="cursor-pointer ...">
  <div className="flex items-center justify-center gap-1">
    {columnLabel}
    {sortKey === 'name' && (
      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    )}
  </div>
</th>
```

### Empty states

When a table has no rows:

```tsx
<tr>
  <td colSpan={columnCount} className="py-12 text-center text-[var(--text-muted)]">
    No {itemType} found.
  </td>
</tr>
```

### Protected user indicator

In the Owner Dashboard User Management table, the owner's own email (`hvcadip@gmail.com`) shows a "Protected" badge with a ShieldCheck icon instead of delete/restrict buttons. This prevents accidental self-restriction or self-deletion.

---

## 13. Effects & Micro-Interactions

### Framer Motion spring config (used everywhere)

```tsx
const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};
```

This single config drives nearly every animation in the app. It produces a snappy but slightly bouncy motion that feels physical.

### Page transitions

All protected pages wrap their root content in `PageTransition.tsx`, which provides a fade + slide entrance:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

Note that page transitions use a `duration` + `ease` config, NOT the spring config. Pages feel better with a smooth fade than a bouncy entrance.

### CursorGlow (container hover)

`src/components/ui/CursorGlow.tsx` — a wrapper that adds a cursor-tracked radial gradient to its child.

**Implementation overview:**

```tsx
function CursorGlow({ children }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden group"
      style={{
        background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), var(--accent-30), transparent 80%)',
      }}
    >
      {children}
    </div>
  );
}
```

### Typing animation on narrative display

`src/hooks/useTypingAnimation.ts` provides a character-by-character text reveal for newly generated narratives. The hook exposes:

```typescript
interface TypingAnimationReturn {
  displayedText: string;     // The partial text at the current animation frame
  isComplete: boolean;       // True once the full text has been revealed
  skip: () => void;           // Jumps to the complete state
}
```

- **Characters per frame:** dynamically calculated so the full narrative takes ~2 seconds regardless of length
- **Skip button:** clicking anywhere on the narrative or pressing any key completes the animation immediately
- **Only runs on fresh narratives** — when loading a saved narrative from the dashboard, the typing animation is skipped

### Proofread highlight fade

When proofread results are received, `NarrativeDisplay.tsx` highlights matched snippets in the narrative text with an accent-colored background that fades out over 30 seconds:

```css
.highlight-fade {
  background-color: var(--accent-30);
  transition: background-color 30s ease-out;
}
.highlight-fade.faded {
  background-color: transparent;
}
```

A highlight counter badge shows the number of active highlights. A "Clear Highlights" button allows immediate removal.

### Session expiry warning

`useSessionExpiry` hook (`src/hooks/useSessionExpiry.ts`) tracks the user's session duration against an 8-hour limit. At 7.5 hours, it shows a warning toast. At 8 hours, it forces a sign-out with a redirect to login. Checked every 60 seconds.

---

## 14. Page-Specific UI Specifications

### Landing page (`src/app/page.tsx`)

- Full-screen WaveBackground animation
- Cinematic entrance: logo fades in, then title fades in from below, then CTA buttons fade in
- Dark translucent text over the wave
- "LOG IN" and "SIGN UP" CTAs at center
- Footer with Terms of Use link
- No nav bar (pre-auth page)

### Login / Signup pages (`src/app/(auth)/login/page.tsx`, `signup/page.tsx`)

- Full-screen WaveBackground animation
- Centered LiquidCard form (max-width ~450px)
- Logo above the form card
- Signup is a 3-step flow (OTP → profile → activate) with a step indicator at the top
- Error messages display in red text below affected fields
- "Back to Login" / "Create Account" link below the form

### Main Menu page (`src/app/(protected)/main-menu/page.tsx`)

- Protected layout (HeroArea + NavBar + ParticleNetwork)
- Centered LiquidCard with role-based dashboard buttons
- Each button is a large vertical card: icon on top, label below
- Role-based button visibility:
  - All users: "Generate Story", "User Dashboard"
  - Admin (Team Manager): adds "Team Dashboard" (accent-colored, Users icon)
  - Owner: adds "Owner Dashboard" (gold/amber accent, Shield icon)
- Buttons use a slight glass effect with accent border

### Input Page (`src/app/(protected)/input/page.tsx`)

- StoryTypeSelector at top (two cards: "Diagnostic Only" and "Repair Complete")
- Conditional field rendering based on selected story type
- Required fields always visible
- Conditional fields show a dropdown (Include / Don't Include / Generate) next to the label
- When dropdown is `dont_include` or `generate`, the text input is hidden or disabled
- Pre-Generation Customization panel below the form fields (collapsible)
- "GENERATE NARRATIVE" button at bottom (primary variant, large)
- "MY REPAIRS" button opens a slide-out panel from the right

### Narrative Page (`src/app/(protected)/narrative/page.tsx`)

- Narrative display card at top with format toggle (Block / C/C/C)
- Typing animation on first render (skippable)
- Customization Panel below narrative (3 sliders + custom instructions)
- Action buttons row: CUSTOMIZE, PROOFREAD, EDIT STORY, NEW STORY, SAVE STORY, SHARE/EXPORT
- After proofread: ProofreadResults panel appears with checkboxes + APPLY SELECTED EDITS button
- Navigation guard active whenever `isSaved === false`

### User Dashboard (`src/app/(protected)/dashboard/page.tsx`)

- Tabbed layout with Profile, Preferences, Narrative History, Saved Repairs
- Profile tab: ProfileSection (position icon, name, email, location, position) + Edit Profile button
- Preferences tab: AccentColorPicker + dark/light toggle + particle animation toggle
- Narrative History tab: searchable/sortable/filterable table of saved narratives
- Clicking a narrative row opens NarrativeDetailModal (view + export + update-with-repair)
- Saved Repairs: grid of template cards with load/edit/delete actions

### Owner Dashboard (`src/app/(protected)/admin/page.tsx`)

- Owner-only access (verified server-side)
- 6 tabs: Overview, Activity Log, User Management, Analytics, API Usage, Settings
- **Overview tab:** 8 metric cards + System Health card (displays APP_VERSION from `src/lib/version.ts`)
- **Activity Log tab:** paginated table with search, action filter, sort; clickable rows open ActivityDetailModal
- **User Management tab:** sortable user table with inline actions + Team column + CREATE TEAM button
- **Analytics tab:** Recharts charts (LineChart, BarChart, PieChart, AreaChart) + time range selector (7d/30d/90d/all)
- **API Usage tab:** token usage cards, daily charts, action breakdown, top users leaderboard
- **Settings tab:** Token Calculator widget + current access code display
- Tab transitions use AnimatePresence with slide/fade variants
- Auto-refresh analytics every 60 seconds (cleanup on tab switch)

### Team Dashboard (`src/app/(protected)/team-dashboard/page.tsx`)

- Admin (Team Manager) access
- 2 tabs: Team Members, Activity Log
- **Team Members tab:** table of all users in the manager's team (Name, Email, Position, Role, Last Active, Actions)
- **Activity Log tab:** team-scoped activity (same format as Owner Dashboard but filtered to team members only)
- Both tabs use the standard data table design from section 12

---

## 15. Icon System

### Lucide React

All icons come from `lucide-react` (version 0.564+). Never import icons from other libraries unless there's no Lucide equivalent.

### Position-based icons

`src/components/ui/PositionIcon.tsx` maps user positions to specific icons:

| Position | Icon |
|---|---|
| Technician | `Wrench` |
| Foreman | `Hammer` |
| Diagnostician | `ScanLine` |
| Advisor | `PenLine` |
| Manager | `ClipboardList` |
| Warranty Clerk | `BookOpen` |
| (fallback) | `User` |

### Size variants

| Variant | Size | Used For |
|---|---|---|
| `small` | 18px | NavBar UserPopup trigger, table avatars |
| `medium` | 32px | Dropdown menus, compact user cards |
| `large` | 64px | ProfileSection header, Edit Profile modal |

### Icon sizing conventions

| Use case | Icon size |
|---|---|
| Table row actions | 16px |
| Inline buttons | 18px |
| Primary buttons | 20px |
| Nav bar icons | 20–24px |
| Large feature buttons | 28–32px |
| Dashboard stats | 48px |
| Hero elements | 64px+ |

### Icon colors

Icons inherit `currentColor` by default, so they're colored by the parent's `text-*` class. For standalone icons, wrap in a span with the appropriate color class:

```tsx
<span className="text-[var(--accent-bright)]">
  <Settings size={20} />
</span>
```

---

## 16. Toast Notification System

### Library

`react-hot-toast` (version 2.6+) via `src/components/ui/ToastProvider.tsx`.

### Toast provider configuration

```tsx
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: 'var(--bg-modal)',
      color: 'var(--text-primary)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--radius-lg)',
      backdropFilter: 'blur(12px)',
    },
    success: {
      iconTheme: {
        primary: 'var(--accent-bright)',
        secondary: 'var(--bg-modal)',
      },
    },
    error: {
      iconTheme: {
        primary: '#f87171',
        secondary: 'var(--bg-modal)',
      },
    },
  }}
/>
```

### Usage patterns

```tsx
import toast from 'react-hot-toast';

// Success
toast.success('Narrative saved to your history');

// Error
toast.error('Failed to save narrative');

// With deduplication (prevents multiple identical toasts)
toast.success('Auto-saved to your history', { id: 'auto-save' });

// Loading → success
const toastId = toast.loading('Generating narrative...');
// ... later ...
toast.success('Narrative generated!', { id: toastId });
```

### Toast placement

Toasts appear in the top-right corner with the pointer offset to avoid the NavBar. On mobile, they slide down from the top-center.

---

## 17. Loading States

### LoadingSpinner component

`src/components/ui/LoadingSpinner.tsx` — a branded spinner with an optional contextual message.

```tsx
<LoadingSpinner message="Generating narrative..." size="large" />
```

**Props:**
- `message?: string` — optional text shown below the spinner
- `size?: 'small' | 'medium' | 'large'` — default 'medium'

**Design:**
- Circular SVG spinner with accent-colored stroke
- Infinite rotation animation
- Contextual message in `text-sm text-[var(--text-muted)]`
- Centered vertically and horizontally in its container

### Size variants

| Size | Spinner Diameter | Used For |
|---|---|---|
| `small` | 20px | Inline button loading states |
| `medium` | 40px | Modal loading overlays |
| `large` | 80px | Full-page loading states (generate, customize) |

### Full-page loading overlay

When the Narrative Page is generating, customizing, or proofreading, a semi-transparent overlay covers the narrative area with a LoadingSpinner + contextual message:

```tsx
{isLoading && (
  <div className="absolute inset-0 bg-[var(--bg-modal)] backdrop-blur-sm flex items-center justify-center z-20">
    <LoadingSpinner size="large" message={loadingMessage} />
  </div>
)}
```

### Contextual loading messages

| Action | Message |
|---|---|
| Generate | "Generating narrative..." |
| Regenerate | "Regenerating narrative..." |
| Customize | "Customizing narrative..." |
| Proofread | "Auditing narrative..." |
| Apply edits | "Applying edits..." |
| Update with repair | "Updating narrative with repair..." |
| Export PDF | "Generating PDF..." |
| Export DOCX | "Generating Word document..." |
| Send email | "Sending email..." |

### Button loading states

Buttons that trigger async actions show an inline spinner + disabled state:

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <LoadingSpinner size="small" />
      <span className="ml-2">GENERATING...</span>
    </>
  ) : (
    'GENERATE NARRATIVE'
  )}
</Button>
```

---

## 18. Responsive & Mobile Design

### Breakpoints (Tailwind defaults)

| Breakpoint | Min Width | Target |
|---|---|---|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Standard laptops |
| `2xl` | 1536px | Large desktops |

### Mobile-first approach

Base classes target mobile. Desktop styling is layered on via `md:`, `lg:`, `xl:` prefixes.

```tsx
<div className="p-4 md:p-6 lg:p-8">          {/* Padding scales up */}
<div className="text-base md:text-lg">       {/* Font size scales up */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">  {/* Grid columns adapt */}
```

### Mobile-specific adaptations

- **NavBar:** center vector logo and version label are hidden below `md` (`hidden md:flex`)
- **NavBar:** UserPopup is replaced with a hamburger menu trigger on `< md`
- **Tables:** horizontal scroll (`overflow-x-auto`) when content exceeds viewport
- **Modals:** full-width with minimal padding on mobile (`max-w-full md:max-w-2xl`)
- **Buttons:** larger tap targets (`py-3` on mobile vs `py-2.5` on desktop)
- **Form fields:** full width on mobile, constrained width on larger screens
- **Dashboard tabs:** horizontally scrollable on mobile, fully visible on desktop

### Mobile hamburger menu

The mobile menu is a slide-out panel from the right containing:
- User info
- Dashboard links (Main Menu, User Dashboard, Owner/Team Dashboard if applicable)
- Sign Out button

### Touch target minimums

All tappable elements on mobile are at least 44×44px to satisfy iOS Human Interface Guidelines.

---

## 19. Z-Index Reference

Consistent z-index ladder used across the app:

| Layer | z-index | Elements |
|---|---|---|
| Base content | 0 (default) | Page content, cards, forms |
| Background animations | -1 | ParticleNetwork, WaveBackground (behind content) |
| Sticky layout | 10 | HeroArea, NavBar, PageTransition wrapper |
| Dropdowns | 20 | Select option lists, UserPopup |
| Slide-out panels | 30 | MyRepairsPanel, mobile hamburger menu |
| Full-page overlays | 40 | Loading overlays over page content |
| Modal backdrop | 50 | Modal dark backdrop |
| Modal panel | 51 | Modal content panel |
| Toast notifications | 100 | react-hot-toast (top-right corner) |

### Modal/overlay stacking rules

- Only ONE modal should be open at a time
- If a second modal opens, the first should close first
- Toasts always appear above modals (z-100 > z-51)
- Loading overlays within modals use z-index relative to the modal, not global z-40

---

## 20. Tailwind v4 @theme Configuration

ServiceDraft.AI uses **Tailwind v4** with CSS-first configuration. There is **NO `tailwind.config.ts` file**. All theme configuration lives in `src/app/globals.css` inside the `@theme` block.

### Full `@theme inline` block

```css
@import "tailwindcss";

/* Exclude .md documentation files from Tailwind content scanning */
@source not "../../*.md";
@source not "../../**/*.md";

@theme inline {
  /* Fonts */
  --font-sans: var(--font-orbitron), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Card Border Radius */
  --radius-card: 23px;

  /* Animations */
  --animate-glow-pulse: glow-pulse 2s ease-in-out infinite;
}

/* Custom Keyframes */
@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.6; }
}
```

### `@source` directives

The `@source not` directives exclude markdown documentation files from Tailwind's content scanner. Without these, Tailwind would try to parse class names from the build instructions and spec docs, which slows builds and may generate spurious utility classes.

### Adding new theme values

To add a new theme value (e.g., a new border radius or animation), add it inside the `@theme inline` block:

```css
@theme inline {
  /* Existing values ... */
  --radius-button: 10px;  /* New */
  --animate-shimmer: shimmer 2s linear infinite;  /* New */
}
```

Then use via `rounded-button` or `animate-shimmer` in JSX.

### Why CSS-first configuration

Tailwind v4's CSS-first approach aligns with the app's use of CSS custom properties for theming. Since every accent color and background variable is already a CSS variable set at runtime by the ThemeProvider, extending Tailwind's theme via CSS variables keeps the configuration unified. A `tailwind.config.ts` file would duplicate what's already in `globals.css`.

---

## 21. CSS Custom Properties Complete Reference

This is the exhaustive list of every CSS custom property defined by the app. All values shown are the Violet dark-mode defaults from `globals.css`.

### Fonts & Radii

```css
--font-sans: var(--font-orbitron), "Inter", ...;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--radius-card: 23px;
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 23px;
--transition-fast: 0.15s ease;
--transition-normal: 0.2s ease;
--transition-slow: 0.3s ease;
```

### Accent colors

```css
--accent-primary: #9333ea;
--accent-hover: #a855f7;
--accent-bright: #c084fc;
--accent-border: #6b21a8;
--accent-deep: #49129b;
--accent-text: #c4b5fd;
```

### Accent opacity ladder

```css
--accent-3:  rgba(147, 51, 234, 0.03);
--accent-5:  rgba(147, 51, 234, 0.05);
--accent-8:  rgba(147, 51, 234, 0.08);
--accent-10: rgba(147, 51, 234, 0.10);
--accent-15: rgba(147, 51, 234, 0.15);
--accent-20: rgba(147, 51, 234, 0.20);
--accent-25: rgba(147, 51, 234, 0.25);
--accent-30: rgba(147, 51, 234, 0.30);
--accent-40: rgba(147, 51, 234, 0.40);
--accent-50: rgba(147, 51, 234, 0.50);
```

### Shadows

```css
--shadow-glow-sm:     0 0 15px rgba(147, 51, 234, 0.3);
--shadow-glow-md:     0 0 40px rgba(147, 51, 234, 0.4);
--shadow-glow-lg:     0 0 60px rgba(147, 51, 234, 0.5);
--shadow-glow-accent: 0 0 20px rgba(147, 51, 234, 0.4);
```

### Backgrounds

```css
--bg-primary: #000000;
--bg-gradient-1: #260d3f;
--bg-gradient-2: #490557;
--bg-input: #0f0520;
--bg-elevated: #1a0a2e;
--bg-card: var(--accent-5);
--bg-modal: rgba(15, 10, 30, 0.85);
--bg-nav: rgba(0, 0, 0, 0.8);
--body-bg: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-primary) 50%, var(--bg-gradient-2) 100%);
```

### Borders

```css
--card-border: #000000;
--modal-border: #000000;
--border-default: transparent;
```

### Text

```css
--text-primary: #ffffff;
--text-secondary: var(--accent-text);
--text-muted: #9ca3af;
--btn-text-on-accent: #ffffff;  /* auto-computed based on luminance */
```

### Mode-adaptive variables

```css
--accent-text-emphasis: var(--accent-primary);
--accent-text-emphasis-weight: inherit;
--accent-vivid: var(--accent-hover);
```

### Canvas animation

```css
--wave-color: 195, 171, 226;  /* Bare RGB triplet for canvas rgba() use */
```

### Scrollbar

```css
--scrollbar-track: var(--bg-input);
--scrollbar-thumb: var(--accent-border);
--scrollbar-thumb-hover: var(--accent-hover);
```

### Animation

```css
--animate-glow-pulse: glow-pulse 2s ease-in-out infinite;
```

Corresponding keyframes:
```css
@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.6; }
}
```

---

## 22. Design Implementation Checklist

When building a new UI component or page, verify every item on this checklist before merging:

### Colors
- [ ] No hardcoded hex colors anywhere (use CSS variables)
- [ ] All colors reference `var(--accent-*)`, `var(--bg-*)`, `var(--text-*)` or similar
- [ ] Hover states use `var(--accent-15)` or `var(--accent-20)` for backgrounds
- [ ] Borders use `var(--accent-border)` or `var(--card-border)` / `var(--modal-border)`

### Typography
- [ ] Headings use Orbitron (inherited from body) with `font-weight: 600`
- [ ] Body text has appropriate letter spacing (`tracking-wider` for uppercase)
- [ ] User-entered text and generated content use `.font-data` (Inter)
- [ ] No typing text in uppercase — use `uppercase` Tailwind class instead

### Layout
- [ ] Component works in both dark and light mode
- [ ] Responsive classes applied for mobile (`md:`, `lg:`)
- [ ] Touch targets are ≥ 44×44px on mobile
- [ ] Proper spacing (`space-y-*`, `gap-*`) for vertical rhythm

### Animation
- [ ] Framer Motion uses the standard spring config (stiffness 400, damping 25)
- [ ] Cards do NOT have hover scale (use CursorGlow instead)
- [ ] Buttons have hover scale (1.05) + tap scale (0.95) + glow
- [ ] Page-level transitions use `duration: 0.3, ease: 'easeOut'` (not spring)

### Cards
- [ ] Uses `LiquidCard` component OR matches its styling
- [ ] Border radius is 23px (`rounded-[23px]` or `rounded-[var(--radius-card)]`)
- [ ] `backdrop-blur-sm` for glassmorphism
- [ ] Background is `var(--bg-card)` (5% accent tint)

### Modals
- [ ] Uses `Modal` component or matches its styling
- [ ] Opaque background (`var(--bg-modal)` with `backdrop-blur-xl`)
- [ ] Backdrop is `bg-black/70` with `backdrop-blur-[4px]`
- [ ] Supports X button, backdrop click, and Escape key close
- [ ] Body scroll is locked while open

### Buttons
- [ ] Uses `Button` component with proper variant (`primary` / `secondary` / `ghost`)
- [ ] Disabled state shows 50% opacity and `cursor-not-allowed`
- [ ] Loading state shows inline spinner + disabled
- [ ] Text is uppercase for primary/secondary CTAs

### Forms
- [ ] Uses `Input` / `Textarea` / `Select` components
- [ ] Field values use `.font-data` for Inter rendering
- [ ] Focus ring is 2px solid `var(--accent-hover)`
- [ ] Validation errors shown below field in red, no red border on field
- [ ] Placeholders use `var(--text-muted)` color

### Tables
- [ ] Center-aligned headers and cells
- [ ] Uppercase column headers (`text-xs uppercase tracking-wider`)
- [ ] Row hover uses `var(--accent-10)`
- [ ] Row borders use `border-[var(--accent-border)]`
- [ ] Long values truncated with title tooltip and `max-w-[180px]`

### Icons
- [ ] Imported from `lucide-react` (not other icon libraries)
- [ ] Sized appropriately for context (16px table, 18–20px buttons, 24px nav)
- [ ] Inherit color from parent via `currentColor` or wrap in colored span

### Toasts
- [ ] Use `toast.success` / `toast.error` from `react-hot-toast`
- [ ] Deduplicate repeated toasts with `{ id: 'unique-id' }`

### Loading states
- [ ] Full-page loading shows `LoadingSpinner size="large"` with contextual message
- [ ] Button loading shows inline spinner + disabled state
- [ ] Loading overlays have `bg-[var(--bg-modal)] backdrop-blur-sm`

### Accessibility
- [ ] Interactive elements have sufficient color contrast
- [ ] All buttons and form controls are keyboard-accessible
- [ ] Focus states are visible
- [ ] Modals trap focus inside them
- [ ] Alt text on all images and logos

### Theming
- [ ] Component respects the current accent color
- [ ] Component works with all 9 accents (test at least Violet, Yellow, Noir, White)
- [ ] Light mode is tested — no invisible text, no dark-on-dark elements
- [ ] Hydration is safe (no accent-dependent rendering during SSR without `mounted` guard)

---

*— End of ServiceDraft.AI UI Design Specification —*
