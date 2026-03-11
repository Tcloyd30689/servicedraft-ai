# SERVICEDRAFT.AI — UI DESIGN SPECIFICATION v2.1

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

---

## 1. Design Philosophy & Visual Identity

### Core Design Principles

ServiceDraft.AI follows a **"Premium Dark Automotive Tech"** aesthetic:
- **Dark Foundation**: Pure black (#000000) base with deep purple-tinted surfaces
- **Neon Accent Energy**: 9 selectable accent colors with the default Violet (#9333ea) as the signature brand color
- **Liquid Glass Materials**: Glassmorphism with backdrop blur and translucent surfaces
- **Living Backgrounds**: Sine wave animations (landing/auth) and particle network (protected pages)
- **Premium Micro-interactions**: Cursor underglow, spring-based hover/tap animations, typing animations
- **Dynamic Theming**: Full accent color + dark/light mode system with 40+ CSS custom properties
- **Dual-Font Typography**: Orbitron for brand/heading personality, Inter for data readability
- **Reactive Environment**: Hero area sine waves respond in real-time to user activity

### Design Mood

> *"The interface should feel like stepping into a high-end automotive diagnostic bay at night — dark, focused, professional, with glowing instrumentation that guides your attention to what matters."*

### Key Design Decisions
- **Cards and containers do NOT scale on hover** — they use the CursorGlow underglow effect instead (keeps layout stable)
- **Only buttons and small interactive controls use scale hover** — prevents jarring layout shifts
- **All colors are CSS-variable-driven** — enables instant accent color switching without component re-renders
- **Orbitron body text uses italic font-style** — reinforces the tech-forward brand personality
- **Modals use high-opacity dark backgrounds** — ensures text readability without background bleed-through

---

## 2. Logo Specifications

### Logo Assets

| File | Usage | Location | Notes |
|------|-------|----------|-------|
| `SERVIDRAFT.AI LOGO #1 .PNG` | Original full logo (large, with energy trail) | Root + public/ | Brand reference asset |
| `logo-violet.PNG` through `logo-black.PNG` | 9 accent-colored logo variants for hero area | public/ | Dynamically loaded based on accent |
| `ServiceDraft-Ai Vector Logo.png` | Vector wordmark for NavBar center + export documents | public/ | Theme-aware CSS filter inversion |
| `ServiceDraftAi_Vector_Logo.png` | Alternate vector logo filename | public/ | Same asset, different naming |

### Hero Logo Behavior
- Displayed at **409px height** (262% of hero+nav combined) in a fixed overlay
- Z-index: `z-[110]` — floats above both hero area (z-90) and nav bar (z-100)
- `pointer-events-none` — clicks pass through to underlying elements
- Dynamically loads accent-colored variant matching user's theme selection: `accent.logoFile` from ThemeProvider
- Uses standard `<img>` tag (not Next.js `Image`) for reliable inline style control
- **Hydration-safe**: renders default violet logo during SSR, swaps to accent logo after mount using `mounted` state guard pattern:
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const logoSrc = mounted ? accent.logoFile : '/logo-violet.PNG';
```
- Hero logo is also a clickable link back to Main Menu (added in Stage 4 Sprint 4)

### NavBar Logo Behavior
- `ServiceDraft-Ai Vector Logo.png` centered in nav bar via absolute positioning
- Theme-aware CSS filter:
  - **Dark mode**: `brightness(0) invert(1)` — renders white
  - **Light mode**: `brightness(0)` — renders black
- Does NOT change with accent color — always monochrome

### Export Document Logo
- `ServiceDraft-Ai Vector Logo.png` in document footer (bottom-right corner of every page)
- **PDF dimensions**: 25×12mm (native 2.09:1 aspect ratio — MUST be preserved to prevent squishing)
- **DOCX dimensions**: 55×26px
- Falls back to italic text "ServiceDraft.AI" if image file not found

---

## 3. Dynamic Theming System

### Architecture

```
src/lib/constants/themeColors.ts    → AccentColor interface, 9 color definitions, buildCssVars(), perceivedBrightness()
src/components/ThemeProvider.tsx     → React context, applyTheme(), localStorage persistence, Supabase sync
src/app/globals.css                 → :root defaults (Violet), @theme Tailwind v4 config
src/app/layout.tsx                  → <ThemeProvider> wraps the entire app
public/logo-{color}.PNG             → 9 accent-colored logo files
```

### How It Works

1. **On mount**: ThemeProvider reads `sd-accent-color` and `sd-color-mode` from localStorage (instant, no network delay)
2. **`applyTheme(accent, mode)` is called**: generates all 40+ CSS variable values via `buildCssVars(accent)` and sets each on `document.documentElement.style`
3. **After hydration**: ThemeProvider asynchronously loads preferences from Supabase `users.preferences` JSONB column
4. **If Supabase has preferences**: They override localStorage values and sync localStorage for consistency
5. **On SIGNED_OUT event**: Resets to Violet dark defaults + clears localStorage
6. **On accent or mode change**: `applyTheme()` re-runs, all components update instantly via CSS variable inheritance

### 9 Accent Colors

| Key | Name | Primary Hex | Hover Hex | Special Behavior |
|-----|------|-------------|-----------|-----------------|
| `violet` | Violet | `#9333ea` | `#a855f7` | Default accent |
| `red` | Red | `#dc2626` | `#ef4444` | — |
| `orange` | Orange | `#ea580c` | `#f97316` | — |
| `yellow` | Yellow | `#eab308` | `#facc15` | — |
| `green` | Green | `#84cc16` | `#a3e635` | — |
| `blue` | Blue | `#2563eb` | `#3b82f6` | — |
| `pink` | Pink | `#d946ef` | `#e879f9` | — |
| `white` | White | `#e2e8f0` | `#f1f5f9` | Forces dark mode (`isDarkMode: true`) |
| `black` | Black | `#1e293b` | `#334155` | Forces light mode (`isLightMode: true`) |

Each accent color object includes: `key`, `name`, `hex`, `hover`, `bright`, `border`, `deep`, `text`, `gradient1`, `gradient2`, `waveRgb`, `logoFile`, `isLightMode`, `isDarkMode`

### Color Mode

- **Dark** (default): Dark backgrounds, light text, accent-colored highlights
- **Light**: White/light backgrounds, dark text, accent-colored highlights with adjusted contrast
- Toggle available in NavBar (Sun/Moon icons) and Preferences Panel
- **Black accent** automatically forces light mode — user cannot toggle
- **White accent** automatically forces dark mode — user cannot toggle
- `perceivedBrightness()` helper on `accent.hover` determines `--btn-text-on-accent` (black text if brightness > 180, white otherwise)
- `color-scheme` CSS property dynamically set to `'dark'` or `'light'` to control browser form control rendering (caret color, autofill, scrollbars inside inputs)

### Light Mode Overrides

When light mode is active, ThemeProvider applies additional overrides:
| Variable | Light Mode Value |
|----------|-----------------|
| `--bg-primary` | `#ffffff` |
| `--text-primary` | `#0f172a` (dark text) |
| `--text-muted` | `#475569` |
| `--bg-input` | `#f1f5f9` |
| `--bg-elevated` | `#e2e8f0` |
| `--bg-modal` | `rgba(255,255,255,0.92)` |
| `--bg-nav` | `rgba(255,255,255,0.85)` |
| `--body-bg` | Light gradient with accent tints |
| `--card-border` | `var(--accent-border)` |
| `--modal-border` | `var(--accent-border)` |
| `--accent-text-emphasis` | `#0f172a` (bold black for headings) |

### Persistence

| Layer | Storage Key(s) | Speed | Scope |
|-------|---------------|-------|-------|
| **localStorage** | `sd-accent-color`, `sd-color-mode`, `sd-bg-animation` | Instant (no network) | Single device |
| **Supabase** | `users.preferences` JSONB → `appearance.accentColor`, `appearance.mode`, `appearance.backgroundAnimation` | Async (after hydration) | Cross-device |

After loading from Supabase, localStorage keys are updated to match — so subsequent page loads show the correct theme before Supabase responds.

### CRITICAL RULE: No Hardcoded Colors

All components MUST use `var(--accent-*)`, `var(--bg-*)`, `var(--text-*)`, `var(--shadow-*)` references.

```tsx
// ✅ CORRECT
<div className="bg-[var(--bg-card)] border-[var(--accent-border)] text-[var(--text-primary)]">
<button className="bg-[var(--accent-hover)] hover:bg-[var(--accent-primary)]">
<div style={{ boxShadow: 'var(--shadow-glow-md)' }}>

// ❌ WRONG — NEVER DO THIS
<div className="bg-purple-600 text-[#c4b5fd]">
<button className="bg-[#a855f7]">
```

---

## 4. Color System

### Default Palette (Violet Dark Mode)

**Accent Family:**
| Token | Default Value | CSS Variable | Usage |
|-------|---------------|-------------|-------|
| Primary | `#9333ea` | `--accent-primary` | Main brand color, selected states, active indicators |
| Hover | `#a855f7` | `--accent-hover` | Button/link hover, interactive highlights |
| Bright | `#c084fc` | `--accent-bright` | Links, highlights, version label, brightest accent use |
| Border | `#6b21a8` | `--accent-border` | Input borders, card accents, focus ring base |
| Deep | `#49129b` | `--accent-deep` | Deep glow, subtle backgrounds, shadow cores |
| Text | `#c4b5fd` | `--accent-text` | Secondary text with accent tint |

**Opacity Variants (all derived from accent primary):**
| CSS Variable | Opacity | Usage |
|-------------|---------|-------|
| `--accent-3` | 3% | Extremely subtle backgrounds |
| `--accent-5` | 5% | Card backgrounds (`--bg-card`) |
| `--accent-8` | 8% | Hover state backgrounds |
| `--accent-10` | 10% | Button backgrounds (secondary), nav button backgrounds |
| `--accent-15` | 15% | Stronger hover states |
| `--accent-20` | 20% | Selected item backgrounds |
| `--accent-30` | 30% | Proofread highlight backgrounds, prominent overlays |
| `--accent-50` | 50% | Strong accent overlays |

**Backgrounds:**
| Token | Default Value | CSS Variable | Usage |
|-------|---------------|-------------|-------|
| Base | `#000000` | `--bg-primary` | Page base |
| Gradient 1 | `#260d3f` | `--bg-gradient-1` | Body gradient start |
| Gradient 2 | `#490557` | `--bg-gradient-2` | Body gradient end |
| Input | `#0f0520` | `--bg-input` | All input fields, textareas, selects |
| Elevated | `#1a0a2e` | `--bg-elevated` | Elevated surfaces |
| Card | `rgba(accent, 0.05)` | `--bg-card` | LiquidCard backgrounds |
| Modal | `rgba(15,10,30,0.85)` | `--bg-modal` | Modal panels (high opacity for readability) |
| Nav | `rgba(0,0,0,0.8)` | `--bg-nav` | Nav bar with backdrop blur |

**Text:**
| Token | Default Value | CSS Variable | Usage |
|-------|---------------|-------------|-------|
| Primary | `#ffffff` | `--text-primary` | Main body text, headings |
| Secondary | accent-derived | `--text-secondary` | Subtitles, secondary info |
| Muted | `#9ca3af` | `--text-muted` | Placeholders, timestamps, helper text |

**Shadows:**
| Token | Value Pattern | CSS Variable | Usage |
|-------|--------------|-------------|-------|
| Small | `0 0 15px rgba(accent, 0.3)` | `--shadow-glow-sm` | Button hover glow |
| Medium | `0 0 40px rgba(accent, 0.4)` | `--shadow-glow-md` | Card default glow |
| Large | `0 0 60px rgba(accent, 0.5)` | `--shadow-glow-lg` | Focus states, emphasis |
| Accent | `0 0 20px rgba(accent, 0.4)` | `--shadow-glow-accent` | Interactive element hover glow |

---

## 5. Background & Animation System

### Page Gradient (All Pages)
```css
background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-primary) 50%, var(--bg-gradient-2) 100%);
```
Set via `--body-bg` as a **fully resolved string** (not `var()` composition) because CSS `var()` in `:root` is unreliable when source vars are set as inline styles by JavaScript.

### Sine Wave Background (Landing & Auth Pages)
- **Component**: `src/components/ui/WaveBackground.tsx`
- Canvas-based, 4 wave layers with varying amplitude, frequency, speed, opacity
- Color: reads `--wave-color` CSS variable (bare RGB triplet, e.g., `195, 171, 226`) every animation frame
- Usage: `rgba(${waveRgb}, ${wave.opacity})` — bare RGB format allows per-wave opacity interpolation
- Configurable `centerYPercent` prop for vertical baseline positioning:
  - Landing page: `centerYPercent={0.50}` (waves centered vertically)
  - Login/Signup: `centerYPercent={0.35}` (waves higher, behind form)
- Full viewport canvas, `z-10`, `pointer-events-none`

### Particle Network (Protected Pages)
- **Component**: `src/components/ui/ParticleNetwork.tsx`
- 30 floating particles with random velocity, wrapped edges, dynamic connection lines (max distance 200px)
- Color: reads `--wave-color` (same variable as WaveBackground) — **re-reads every 2 seconds** via `setInterval` for theme changes
- Canvas at `z-10`, fixed positioning, `pointer-events-none`
- **Toggleable**: Preferences Panel → Background Animation toggle → saves to Supabase `preferences.appearance.backgroundAnimation` and localStorage `sd-bg-animation`
- When toggled off: canvas element not rendered (conditional `{backgroundAnimation && <ParticleNetwork />}` in protected layout)

### Hero Area Reactive Waves
- **Component**: `src/components/layout/HeroArea.tsx`
- **Hook**: `src/hooks/useActivityPulse.ts`
- 5-layer sine wave animation within the 100px hero banner
- Responds to user activity via module-level shared amplitude state
- Activity amplitude controls: wave height (1x–3.5x multiplier), opacity boost (+0.35), stroke width increase
- Activity decays back to base over ~2-3 seconds (smooth ease-out)
- Canvas uses `devicePixelRatio` scaling for sharp rendering on HiDPI/Retina displays
- Edge gradient overlays blend hero edges into page background

**Activity Spike Triggers:**
| User Action | Intensity (0–1) |
|-------------|-----------------|
| Typing in any form field | 0.35 |
| Button click (any) | 0.65 |
| Generic click | 0.15 |
| Generate / Regenerate narrative | 0.8 |
| Customize narrative | 0.7 |
| Proofread | 0.6 |
| Apply edits | 0.7 |
| Save narrative | 0.5 |

**Dispatching from new features:**
```typescript
import { dispatchActivity } from '@/hooks/useActivityPulse';
dispatchActivity(0.8); // intensity 0–1
```

---

## 6. Typography System

### Dual Font System

| Role | Font | Import Method | CSS Class/Variable | Weight | Tracking | Style |
|------|------|--------------|-------------------|--------|----------|-------|
| **Headings/UI/Brand** | Orbitron | `next/font/google` | `--font-orbitron` (body default) | 600 (semi-bold) | 0.04em | **italic** |
| **Data/Input/Readability** | Inter | `next/font/google` | `.font-data` class | 400 (regular) | 0.01em | normal |

### Where Each Font Is Used

**Orbitron (default body font — all text inherits this unless overridden):**
- Page titles, card titles, section headings
- Button text, navigation labels
- Column headers in data tables
- Badges, status labels
- Version label ("v1.0.0-beta")
- Main menu buttons
- Story type selector labels
- Dashboard tab labels

**Inter (`.font-data` class — explicitly applied for readability):**
- Generated narrative text (the actual warranty stories)
- User input fields and textareas
- Table data cell contents (email, dates, names, previews)
- Audit/proofread results text
- Profile data values
- Export modal fields
- Search input text
- Custom instructions text
- Activity detail modal content

### Type Scale

| Element | Size | Weight | Color | Font |
|---------|------|--------|-------|------|
| Page Title | 32px (text-3xl) | 700 | `--text-primary` | Orbitron |
| Dashboard Title (Owner) | 48px (text-5xl) | 700 | Outlined + neon glow | Orbitron |
| Card Title | 24px (text-xl) | 600 | `--accent-bright` | Orbitron |
| Section Heading | 20px (text-lg) | 600 | `--text-primary` | Orbitron |
| Subtitle | 16px (text-base) | 400 | `--text-secondary` | Orbitron |
| Body Text | 16px (text-base) | 400 | `--text-primary` | Orbitron |
| Data Text | 16px (text-base) | 400 | `--text-primary` | Inter |
| Small Text | 14px (text-sm) | 400 | `--text-muted` | Orbitron |
| Label | 14px (text-sm) | 500 | `--text-secondary` | Orbitron |
| Version Label | 14px (text-sm) | 500 | `--accent-bright` | Orbitron |
| Table Header | 13-14px (text-sm) | 600 | `--text-secondary` | Orbitron |
| Table Data | 13-14px (text-sm) | 400 | `--text-primary` | Inter |

### Light Mode Typography Adjustments
- `--accent-text-emphasis`: Switches to bold black (`#0f172a`) in light mode for headings/emphasis text (in dark mode, uses accent color)
- `--accent-text-emphasis-weight`: `inherit` in dark mode, `700` in light mode
- Ensures headings remain readable against light backgrounds

---

## 7. Page Layout & Navigation System

### Fixed Header Structure (164px total)

```
┌─────────────────────────────────────────────────────┐
│  HERO AREA (100px, position: fixed, z-[90])         │
│  ┌─────────────────────────────────────────────────┐│
│  │ 5-layer reactive sine wave canvas               ││
│  │ Oversized logo overlay (z-[110], 409px,         ││
│  │   pointer-events-none, clickable link)          ││
│  │ Edge gradient overlays for seamless blending    ││
│  └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│  NAV BAR (64px, position: fixed, top: 100px,        │
│  z-[100])                                           │
│  ┌──────────┬──────────────────┬───────────────────┐│
│  │ LEFT:    │ CENTER:          │ RIGHT:            ││
│  │ MAIN     │ Vector Logo      │ Theme Toggle      ││
│  │ MENU     │ + "v1.0.0-beta"  │ + UserPopup       ││
│  │ button   │                  │ + mobile hamburger││
│  └──────────┴──────────────────┴───────────────────┘│
├─────────────────────────────────────────────────────┤
│  PAGE CONTENT                                       │
│  padding-top: 164px                                 │
│  min-height: calc(100vh - 164px)                    │
│  z-30 (above ParticleNetwork at z-10)               │
│  ErrorBoundary wrapper for crash recovery           │
└─────────────────────────────────────────────────────┘
```

### Protected Layout (`src/app/(protected)/layout.tsx`)
```tsx
<>
  {backgroundAnimation && <ParticleNetwork />}  {/* z-10, full-page, toggleable */}
  <HeroArea />                                    {/* fixed top-0, z-90 */}
  <NavBar />                                      {/* fixed top-100px, z-100 */}
  <main className="relative z-30 min-h-[calc(100vh-164px)]" style={{ paddingTop: '164px' }}>
    <ErrorBoundary>{children}</ErrorBoundary>
  </main>
</>
```

### NavBar Component (`src/components/layout/NavBar.tsx`)

**Left Section — MAIN MENU Button:**
- Background: `bg-[var(--accent-10)]` with `border border-[var(--accent-border)]`
- Border radius: `rounded-lg` (8px)
- Hover: accent glow effect via `var(--shadow-glow-sm)`
- Framer Motion: `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`
- Links to `/main-menu`

**Center Section — Vector Logo + Version:**
- `ServiceDraft-Ai Vector Logo.png` centered via `absolute left-1/2 -translate-x-1/2`
- CSS filter: `brightness(0) invert(1)` (dark mode) / `brightness(0)` (light mode)
- "v1.0.0-beta" label below logo: `text-sm`, `text-[var(--accent-bright)]`, hidden on mobile

**Right Section — Controls:**
- **Color Mode Toggle**: Sun icon (light) / Moon icon (dark) from lucide-react. Calls `toggleColorMode()` from `useTheme()`. Hydration-safe icon rendering via mounted guard.
- **UserPopup Trigger**: PositionIcon + formatted name + ChevronDown icon. Bordered with accent, hover background tint.
- **Mobile Hamburger**: Visible below `md` breakpoint, opens dropdown overlay

### NavBar Interactive Element Styling (Stage 5 Sprint 3)
All interactive elements in the NavBar have glowing purple hover animations:
- MAIN MENU button: `var(--shadow-glow-sm)` on hover
- Theme toggle button: accent border glow on hover
- User popup trigger: accent background tint + glow on hover
- Dropdown items: accent background tint on hover

### UserPopup Dropdown (`src/components/layout/UserPopup.tsx`)

**Trigger Display:**
`formatDisplayName()` → first initial + period + last name (e.g., "T.Cloyd"). Falls back to username, then email prefix.

**Dropdown Content:**
- User info section: full name, location, position
- **Dashboard** link → `/dashboard` (all users)
- **Owner Dashboard** link → `/admin` (owner role only — Shield icon, gold/amber accent)
- **Team Dashboard** link → `/team-dashboard` (admin role only — Users icon)
- **Log Out** button → clears localStorage, signs out, redirects to `/`

**Dropdown Styling:**
- Background: `var(--bg-modal)` with `backdrop-blur-xl` — **NOT transparent** (opacity was increased to fix readability issues)
- Border: `var(--accent-border)`
- Border radius: `rounded-xl` (12px)
- Items: hover background `var(--accent-10)`, smooth transition

---

## 8. Card & Container Design System

### LiquidCard (`src/components/ui/LiquidCard.tsx`)

| Property | Value | CSS Variable |
|----------|-------|-------------|
| Background | 5% accent opacity | `var(--bg-card)` |
| Border | 2px solid | `var(--card-border)` (default: `#000000`) |
| Border Radius | 23px | — |
| Backdrop Blur | 2px (`backdrop-blur-sm`) | — |
| Glow Shadow | Medium glow | `var(--shadow-glow-md)` |
| Hover Effect | Cursor underglow (CursorGlow wrapper) | — |
| Transition | `transition-all duration-300` | — |

**Props:**
```typescript
interface LiquidCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'compact' | 'standard' | 'spacious';
  glow?: boolean;  // Enable CursorGlow (default: true)
}
```

### Padding Variants
| Variant | Padding Value |
|---------|-------------|
| `compact` | 16px (p-4) |
| `standard` | 24px (p-6) |
| `spacious` | 32px (p-8) |

### Cursor Underglow Effect (`src/components/ui/CursorGlow.tsx`)

Wraps card content with a mouse-tracking radial gradient overlay:

- Tracks mouse position via `onMouseMove` on the wrapper element
- Overlay element: `radial-gradient(circle 200px at {x}px {y}px, var(--accent-primary), transparent)`
- 15% opacity, fades in/out on mouse enter/leave via CSS transition
- `pointer-events: none` on overlay — clicks pass through
- `borderRadius: inherit` — matches parent card's rounded corners
- Controlled by LiquidCard's `glow` prop (default `true`)

**Props:**
```typescript
interface CursorGlowProps {
  children: React.ReactNode;
  radius?: number;     // default: 200 (px)
  opacity?: number;    // default: 0.15
  enabled?: boolean;   // default: true
  className?: string;
}
```

### Dashboard Container Widths
| Dashboard | Max Width | Class |
|-----------|----------|-------|
| User Dashboard | 7xl | `max-w-7xl` |
| Owner Dashboard | 90vw / 1400px | `w-[90vw] max-w-[1400px]` |
| Team Dashboard | 90vw / 1400px | `w-[90vw] max-w-[1400px]` |

---

## 9. Modal System

### Base Modal (`src/components/ui/Modal.tsx`)

| Property | Value |
|----------|-------|
| Rendering | Portaled to `document.body` via `createPortal` |
| Positioning | Flexbox centered within viewport, `pt-20` offset below nav |
| Background | `var(--bg-modal)` with `backdrop-blur-xl` (24px) |
| Backdrop | `bg-black/70` with `backdrop-blur-[4px]` |
| Border | `var(--modal-border)` |
| Border Radius | 23px (`rounded-[23px]`) |
| Max Width | 600px default (overridable via className) |
| Max Height | `max-h-[calc(100vh-8rem)]` — scrolls internally for long content |
| Animation | Scale 95% → 100% + fade via Framer Motion |
| Close Triggers | Backdrop click, Escape key, X button |

### Modal Opacity Standards (CRITICAL)
Modals use **high-opacity** dark backgrounds so text is always readable:
- **Modal panel**: `bg-[var(--bg-modal)]` → `rgba(15,10,30,0.85)` dark mode
- **Modal backdrop**: `bg-black/70` → 70% black overlay
- This is intentionally MORE opaque than the LiquidCard design — modals demand focus and readability

### Specific Modal Implementations

**Edit Story Modal** (`EditStoryModal.tsx`):
- Auto-sizing textareas that grow with content
- Format matches current display mode (block or C/C/C)

**Narrative Detail Modal** (`NarrativeDetailModal.tsx`):
- Read-only narrative display with vehicle info header
- Export buttons row
- "UPDATE NARRATIVE WITH REPAIR" button (diagnostic_only entries only)

**Update With Repair Modal** (`UpdateWithRepairModal.tsx`):
- Pre-filled vehicle info as read-only badges
- Repair fields with dropdown controls

**Email Export Modal** (`EmailExportModal.tsx`):
- Multi-recipient input (up to 10)
- Professional template preview

**Edit Profile Modal** (`EditProfileModal.tsx`):
- First/last name inputs, location dropdown, position dropdown

**Preferences Modal** (`PreferencesPanel.tsx`):
- Appearance tab: AccentColorPicker + mode toggle + animation toggle
- Templates tab: placeholder for future features

**Activity Detail Modal** (`ActivityDetailModal.tsx`):
- Framer Motion: fade backdrop + scale modal
- Sections: action badge, timestamp, user info, vehicle info, RO#, story type badge, narrative preview (scrollable), input data, collapsible raw JSON
- Gracefully handles minimal entries (login events: just badge + timestamp + user)

**Save/Edit Repair Modals** (`SaveRepairModal.tsx`, `EditRepairModal.tsx`):
- Template name input with summary preview
- Field editing with dropdown option controls

---

## 10. Button Design System

### Primary Button
| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `var(--accent-primary)` | `var(--accent-primary)` |
| Text | `var(--btn-text-on-accent)` (auto: white or black based on luminance) | Same |
| Hover | `var(--accent-hover)` + `var(--shadow-glow-sm)` | Same |
| Active | `scale(0.95)` | Same |
| Disabled | `opacity: 0.5`, no interaction, no hover/tap animation | Same |
| Border Radius | 8px (`rounded-lg`) | Same |

### Secondary Button
| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | transparent | transparent |
| Text | `var(--accent-vivid)` | `var(--accent-vivid)` (darker shade for contrast) |
| Border | 1px solid `var(--accent-vivid)` | Same |
| Hover | 10% accent tint background | Same |
| Border Radius | 8px | Same |

### Ghost Button
| Property | Value |
|----------|-------|
| Background | transparent |
| Text | `var(--accent-vivid)` |
| Border | none |
| Hover | subtle background tint (`var(--accent-8)`) |

### Owner Dashboard Button (Main Menu)
| Property | Value |
|----------|-------|
| Background | Gold/amber accent gradient |
| Icon | Shield (lucide-react) |
| Text | "OWNER DASHBOARD" |
| Styling | Distinctly different from standard buttons — gold/amber color scheme |

### Team Dashboard Button (Main Menu)
| Property | Value |
|----------|-------|
| Background | `var(--accent-primary)` |
| Icon | Users (lucide-react) |
| Text | "TEAM DASHBOARD" |
| Styling | Standard accent color |

### Framer Motion Button Behavior
```tsx
// Implemented via motion.button in src/components/ui/Button.tsx
<motion.button
  whileHover={disabled ? undefined : { scale: 1.05 }}
  whileTap={disabled ? undefined : { scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
```

- **Type conflict fix**: Button interface extends `Omit<ButtonHTMLAttributes, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'>` to avoid Framer Motion prop type conflicts
- Disabled buttons pass `undefined` for whileHover/whileTap — no animation when disabled

---

## 11. Form Elements & Input Fields

### Standard Input (`src/components/ui/Input.tsx`)

| Property | Value | CSS Variable |
|----------|-------|-------------|
| Background | Deep dark | `var(--bg-input)` |
| Border | 1px solid | `var(--accent-border)` |
| Text Color | Primary | `var(--text-primary)` |
| Placeholder | Muted | `var(--text-muted)` |
| Focus Border | Accent primary | `var(--accent-primary)` |
| Focus Ring | Glow | `var(--shadow-glow-sm)` |
| Border Radius | 8px | — |
| Font | Inter (`.font-data`) | — |
| Padding | `px-4 py-2.5` | — |

### Select Dropdown (`src/components/ui/Select.tsx`)
- Same base styling as Input
- ChevronDown icon (lucide-react) positioned absolute right
- `appearance: none` to remove browser default arrow
- Custom arrow via positioned SVG icon

### Auto-Expanding Textarea (`src/components/ui/AutoTextarea.tsx`)
- Measures `scrollHeight` on every `onChange` event
- Starts at `rows={2}`, expands as user types
- `resize: none` + `overflow: hidden` pattern
- Short metadata fields (R.O.#, Year, Make, Model) use standard `<Input>` instead

### Standard Textarea (`src/components/ui/Textarea.tsx`)
- Same styling as Input but multiline
- With `forwardRef` for form library compatibility

### Conditional Field Dropdowns (Input Page)
- Dropdown positioned to the right of the field label
- Three options: "Include Information" / "Don't Include Information" / "Generate Applicable Info"
- When "Don't Include" selected: field is hidden/disabled with subtle styling change
- When "Generate" selected: field shows italic placeholder text indicating AI will infer

### AccentColorPicker (`src/components/ui/AccentColorPicker.tsx`)
- Row of 9 circular color swatches
- Selected swatch shows: checkmark icon + ring border + glow shadow
- Calls `setAccentColor()` from `useTheme()` on click
- Used in: Preferences Panel (dashboard) and Signup Step 3

### Form Control Browser Styling
Two layers ensure properly themed form controls:
1. `color-scheme: dark` (or `light`) set by ThemeProvider — controls browser chrome (caret, autofill, scrollbars)
2. Explicit CSS overrides in `globals.css`:
```css
input, textarea, select {
  background-color: var(--bg-input);
  color: var(--text-primary);
}
input::placeholder, textarea::placeholder {
  color: var(--text-muted);
}
```

---

## 12. Data Table Design System

### Common Table Styling (Applied Across All Dashboards)

| Property | Value |
|----------|-------|
| Header Alignment | `text-center` on all `<th>` elements |
| Cell Alignment | `text-center` on all `<td>` elements (except long text columns which use `text-left`) |
| Header Font | Orbitron, `text-sm`, `font-semibold`, `text-[var(--text-secondary)]` |
| Cell Font | Inter (`.font-data`), `text-sm`, `text-[var(--text-primary)]` |
| Row Hover | Glowing accent-colored effect (see below) |
| Border | Bottom border on rows: `border-b border-[var(--accent-5)]` |

### Glowing Row Hover Effect (Stage 6 Sprint B Task 4)
- **Implementation**: JavaScript-driven via `onMouseEnter`/`onMouseLeave` (not CSS-only)
- **On hover**: `boxShadow: '0 0 8px 1px rgba(168, 85, 247, 0.3)'` + `backgroundColor: 'rgba(168, 85, 247, 0.05)'`
- **On leave**: resets both to `none` / `transparent`
- **Transition**: `transition-all duration-200 ease-in-out` for smooth fade
- Applied to every `<tbody>` row across all data tables on both dashboards
- Does not conflict with expandable row click behavior or action button hover states

### Email Column Truncation (Stage 6 Sprint B Task 2)
- Email cells: `max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap` via inline-block span
- `title` attribute on email cells shows full address as native browser tooltip on hover
- Applied to all tables showing email addresses

### Long Text Columns
- Narrative preview, metadata, and description columns use `text-left` alignment
- Truncated with `max-w-[250px]` or similar + `text-ellipsis whitespace-nowrap overflow-hidden`
- `title` attribute for full text on hover

### Clickable Rows (Activity Log Tables)
- Rows in Activity Log tabs (both Owner and Team Dashboard) are clickable
- Cursor: `cursor-pointer`
- On click: opens `ActivityDetailModal` with full entry details
- Visual indicator: row hover glow serves as affordance

### Story Type Badges
| Type | Color | Label |
|------|-------|-------|
| Diagnostic Only | Blue/indigo tint | "Diagnostic" |
| Repair Complete | Green tint | "Repair" |

### Role Badges
| Role | Color | Label |
|------|-------|-------|
| Owner | Gold/amber | "Owner" |
| Admin | Purple/accent | "Admin" |
| User | Gray/muted | "User" |

---

## 13. Effects & Micro-Interactions

### Framer Motion Standards

**Spring Transition Config (used everywhere):**
```tsx
const springTransition = { type: 'spring', stiffness: 400, damping: 25 };
```

**Scale Values by Element Type:**
| Element | whileHover | whileTap | boxShadow on hover |
|---------|-----------|---------|-------------------|
| LiquidCard | **NONE** (CursorGlow instead) | **NONE** | CSS hover shadow |
| Button (Primary/Secondary) | `scale: 1.05` | `scale: 0.95` | `var(--shadow-glow-sm)` |
| StoryTypeSelector cards | **NONE** | `scale: 0.97` | `var(--shadow-glow-sm)` |
| Small links (FAQ, Terms) | `scale: 1.08` | `scale: 0.95` | none |
| NavBar interactive elements | `scale: 1.05` | `scale: 0.95` | accent glow |

**Page Entrances (all protected pages):**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
```

**Landing Page Cinematic Entrance:**
- Logo: `scale: 0.8 → 1` over 1 second
- Subtitle: 0.6s delay, fade up
- Buttons: 1.1s delay, fade up

**Page-to-Page Crossfade:**
- Landing → Login: fade-out (350ms) → fade-in (400ms)

**Dashboard Tab Transitions:**
- AnimatePresence with slide + fade variants between tab content
- Direction-aware: sliding left vs right based on tab index change

**Template Card Delete Animation:**
- Exit: slide right + fade out

### Owner Dashboard Premium Styling

**Title Treatment:**
- "OWNER DASHBOARD" at `text-5xl` (48px)
- Outlined text effect: transparent fill with accent-colored stroke (`-webkit-text-stroke`)
- Neon glow via `text-shadow` with multiple accent-colored layers
- Creates a premium "holographic" appearance

**Title Container:**
- Liquid glass background: `rgba` backdrop-blur with accent border
- Rounded corners: `rounded-[16px]`
- Mouse-tracking spotlight: radial-gradient overlay that follows cursor via `onMouseMove`

### Proofread Highlighting
- `<mark>` elements wrapping matched text snippets
- Background: `var(--accent-30)` (30% opacity accent)
- Bottom border: `2px solid var(--accent-primary)` for emphasis
- **30-second auto-fade**: highlights gradually fade out using CSS `transition: opacity 1s ease-out` triggered by a timeout
- **Highlight counter badge**: shows number of active highlights in the proofread results area
- **"Clear Highlights" button**: allows immediate removal before the 30-second timer
- Hover tooltip on highlighted text: issue description displayed in opaque dark tooltip (`bg-[#111827]`)

### Typing Animation
- **Component**: `src/hooks/useTypingAnimation.ts`
- Character-by-character text display on new narrative generation
- Configurable speed (characters per frame)
- `skip()` function: click to instantly show full text
- Applied to `NarrativeDisplay.tsx` when `generationId` changes

### NavBar Glowing Hover Animations (Stage 5 Sprint 3)
All NavBar interactive elements have accent-colored glow on hover:
- MAIN MENU button: `var(--shadow-glow-sm)` box-shadow
- Theme toggle: border glow
- User popup trigger: background tint + subtle glow
- Dropdown items: accent background wash

---

## 14. Page-Specific UI Specifications

### Landing Page
- Cinematic stagger entrance animation (logo → subtitle → buttons)
- WaveBackground canvas with `centerYPercent={0.50}`
- Full-viewport layout, content centered vertically
- Two CTA buttons: "LOGIN" (primary) and "REQUEST ACCESS" (secondary)
- Logo: accent-colored variant, large centered display

### Login Page
- WaveBackground canvas with `centerYPercent={0.35}` (higher positioning)
- Centered LiquidCard form with email + password fields
- "Forgot Password?" link
- "Sign Up" redirect link

### Signup Page (3 Steps)
- Step indicator showing progress (1/3, 2/3, 3/3)
- **Step 1**: Email, Password, Confirm Password in LiquidCard
- **Step 2**: Access Code input field (single field, LiquidCard)
- **Step 3**: Profile form with AccentColorPicker at the top, first/last name, US state dropdown for location, position dropdown, username, Terms of Use checkbox

### Main Menu
- Centered LiquidCard container
- Role-based button stack (Generate Story → User Dashboard → conditional Owner/Team Dashboard)
- Footer links: FAQ, Support, Terms of Use, Log Out

### Input Page
- StoryTypeSelector at top (two side-by-side cards)
- Fields rendered dynamically from `fieldConfig.ts`
- Required fields: no dropdown, always visible
- Conditional fields: dropdown selector + field content
- "REPAIR TEMPLATES" button opens MyRepairsPanel slide-out
- PreGenCustomization collapsible panel
- "GENERATE STORY" primary button at bottom
- "CLEAR FORM" ghost button

### Narrative Page
- Two-column layout: controls (left) + narrative display (right)
- Action buttons bar at bottom
- Format toggle button dynamically changes label
- ShareExportModal for all export options

### User Dashboard
- ProfileSection with PositionIcon + info + action buttons
- NarrativeHistory table (full width, max-w-7xl)
- Preferences button opening modal
- My Saved Repairs button opening modal

### Owner Dashboard
- Premium title treatment with neon glow
- Tab navigation with animated transitions (6 tabs)
- Wide layout: `w-[90vw] max-w-[1400px]`
- Recharts visualizations (LineChart, BarChart, PieChart, AreaChart)
- Activity Detail Modal on row click

### Team Dashboard
- Tab navigation (2 tabs: Team Members, Activity Log)
- Wide layout matching Owner Dashboard
- Activity Detail Modal on row click (shared component)

---

## 15. Icon System

### Position-Based Icons (`src/components/ui/PositionIcon.tsx`)

| Position | Icon (lucide-react) | Visual Reference |
|----------|-------------------|-----------------|
| Technician | `Wrench` | Matches logo wrench styling |
| Foreman | `Hammer` | — |
| Diagnostician | `ScanLine` | Diagnostic/test light style |
| Advisor | `PenLine` | — |
| Manager | `ClipboardList` | — |
| Warranty Clerk | `BookOpen` | — |
| (fallback) | `User` | When position is null/unknown |

**Size Variants:**
| Variant | Size | Usage |
|---------|------|-------|
| `small` | 20px | NavBar UserPopup trigger |
| `medium` | 32px | Default, general display |
| `large` | 48px | Dashboard profile section |

Styled with accent-colored glow to match app theme. Used in: `ProfileSection.tsx`, `UserPopup.tsx`, `ActivityDetailModal.tsx`.

### Common UI Icons (lucide-react)

| Icon | Usage |
|------|-------|
| Shield | Owner Dashboard button, protected user badge |
| ShieldCheck | Protected user indicator |
| Users | Team Dashboard button, Assign to Team action |
| Sun / Moon | Color mode toggle |
| ChevronDown | Select dropdowns, UserPopup trigger |
| Plus | Create Team button |
| Trash2 | Delete actions |
| Lock / Unlock | Restrict/Unrestrict user |
| Mail | Email export, password reset |
| Copy | Copy to clipboard |
| Printer | Print export |
| FileText | PDF export |
| FileSpreadsheet | DOCX export |
| Search | Search inputs |
| X | Close buttons, clear actions |
| RefreshCw | Refresh button on activity logs |
| AlertTriangle | Warning states |

---

## 16. Toast Notification System

### Configuration (`src/components/ui/ToastProvider.tsx`)
- Library: `react-hot-toast`
- Position: top-right
- Duration: 4 seconds (default)
- Themed styling matching app aesthetic

### Toast Types
| Type | Color | Usage |
|------|-------|-------|
| Success | Green accent | Save confirmed, export complete, action success |
| Error | Red accent | API failures, validation errors |
| Loading | Accent spinner | During async operations |
| Custom | Accent-colored | Auto-save notification |

### Key Toast Messages
- "Narrative generated successfully" (success)
- "Narrative auto-saved to your history" (success, id: `'auto-save'` for deduplication)
- "Story saved to your history" (success)
- "Copied to clipboard" (success)
- "Failed to generate narrative. Please try again." (error)
- "Rate limit exceeded. Please wait..." (error)
- "Your account is restricted. Contact your administrator." (error)

---

## 17. Loading States

### Loading Spinner (`src/components/ui/LoadingSpinner.tsx`)
- Branded spinner with contextual message prop
- Accent-colored animated spinner element
- **Size variants**: default, `xlarge` (approximately 2x size — added in Stage 5 Sprint 2)
- **Full viewport centering**: when used as page-level loader, centered below NavBar in remaining viewport space

### Page Loading Pattern
- Spinner displayed during initial auth check (`useAuth` loading state)
- Spinner displayed during data fetches (dashboard narrative load, admin data load)
- Contextual message changes: "Loading your dashboard...", "Generating narrative...", "Saving...", etc.

### API Call Loading States
- All buttons that trigger API calls show loading state:
  - Text changes to loading indicator
  - Button disabled during operation
  - Spinner or animated dots displayed

---

## 18. Responsive & Mobile Design

### Breakpoint Strategy
- **Desktop-first** layout design
- Mobile responsive via Tailwind breakpoint modifiers
- Key breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)

### Mobile Adaptations
- NavBar: hamburger menu replaces right-section controls below `md`
- Two-column layouts (narrative page) stack vertically on mobile
- Tables: horizontal scroll on narrow screens
- Version label: hidden on mobile (`hidden md:block`)
- MyRepairsPanel slide-out: full-width on mobile
- Dashboard containers: full-width with padding on mobile

---

## 19. Z-Index Reference

| Z-Index | Element | Notes |
|---------|---------|-------|
| `z-[10]` | ParticleNetwork / WaveBackground | Behind all content |
| `z-[30]` | Page content (`<main>`) | Above particle network |
| `z-[90]` | HeroArea | Fixed header — hero banner |
| `z-[100]` | NavBar | Fixed header — navigation bar |
| `z-[110]` | Hero floating logo overlay | Above nav bar, `pointer-events-none` |
| `z-[9999]` | Modal portal / Toast notifications | Above everything |

---

## 20. Tailwind v4 @theme Configuration

Tailwind v4 uses **CSS-first configuration** via `@theme` blocks in `globals.css`. There is **NO `tailwind.config.ts` file**.

### Key @theme Extensions (in `src/app/globals.css`)
```css
@theme {
  /* Custom spacing, sizes, colors extended here */
  /* Border radius tokens */
  --radius-2xl: 23px;
  --radius-lg: 12px;
  --radius-md: 8px;

  /* Font family references */
  /* (Orbitron and Inter loaded via next/font/google in layout.tsx) */
}
```

### CSS Custom Properties in :root
The `:root` block in `globals.css` defines default values for all theme variables. These are the initial state before ThemeProvider hydrates and applies the user's selected accent color:

```css
:root {
  /* Default Violet dark mode values */
  --accent-primary: #9333ea;
  --accent-hover: #a855f7;
  --accent-bright: #c084fc;
  --accent-border: #6b21a8;
  --accent-deep: #49129b;
  /* ... all other variables ... */
  color-scheme: dark;
}
```

After ThemeProvider mounts, `buildCssVars()` overwrites all of these via `document.documentElement.style.setProperty()`.

---

## 21. CSS Custom Properties Complete Reference

All properties defined in `globals.css` `:root` and dynamically overridden by ThemeProvider's `buildCssVars()`.

### Accent Colors
```
--accent-primary          Main accent color (brand identity)
--accent-hover            Hover/bright variant (interactive states)
--accent-bright           Lightest accent (links, highlights, version label)
--accent-border           Dark accent for borders (inputs, cards)
--accent-deep             Darkest accent for glow cores
--accent-text             Text-appropriate accent shade (secondary text tint)
```

### Accent Opacity Variants
```
--accent-3                3% opacity   (extremely subtle backgrounds)
--accent-5                5% opacity   (card backgrounds)
--accent-8                8% opacity   (hover state backgrounds)
--accent-10               10% opacity  (secondary button bg, nav button bg)
--accent-15               15% opacity  (stronger hover states)
--accent-20               20% opacity  (selected item backgrounds)
--accent-30               30% opacity  (proofread highlights, prominent overlays)
--accent-50               50% opacity  (strong accent overlays)
```

### Backgrounds
```
--bg-primary              Base background color (#000000 dark, #ffffff light)
--bg-gradient-1           Gradient start color
--bg-gradient-2           Gradient end color
--bg-input                Input field background
--bg-elevated             Elevated surface background
--bg-card                 Card background (derived from accent at 5% opacity)
--bg-modal                Modal background (high opacity for readability)
--bg-nav                  Nav bar background (with backdrop blur)
--body-bg                 Full body gradient (FULLY RESOLVED string — not var() composition)
```

### Text
```
--text-primary            Main text color (#ffffff dark, #0f172a light)
--text-secondary          Secondary text (accent-derived tint)
--text-muted              Muted/placeholder text (#9ca3af dark, #475569 light)
--accent-text-emphasis    Heading emphasis (accent color in dark, #0f172a in light)
```

### Shadows
```
--shadow-glow-sm          Small glow (button hover)        — 0 0 15px rgba(accent, 0.3)
--shadow-glow-md          Medium glow (card default)       — 0 0 40px rgba(accent, 0.4)
--shadow-glow-lg          Large glow (focus states)        — 0 0 60px rgba(accent, 0.5)
--shadow-glow-accent      Interactive glow (hover accents) — 0 0 20px rgba(accent, 0.4)
```

### Buttons
```
--btn-text-on-accent      Auto-determined: white or black based on accent brightness (perceivedBrightness > 180 → black)
--accent-vivid            Secondary button text (accent-hover in dark, darker shade in light for contrast)
--accent-text-emphasis-weight    inherit (dark) / 700 (light) — for heading font weight adjustments
```

### Animation
```
--wave-color              RGB triplet for canvas animations (bare components: e.g., "195, 171, 226")
                          Format: NO rgb() wrapper — allows per-wave opacity: rgba(${waveRgb}, ${opacity})
```

### Borders
```
--card-border             Card border color (#000000 dark, accent-border light)
--modal-border            Modal border color (#000000 dark, accent-border light)
--border-default          Default border (transparent dark, rgba(0,0,0,0.1) light)
```

### Radius Tokens
```
--radius-2xl              23px (cards, modals)
--radius-lg               12px (dropdowns, panels)
--radius-md               8px (buttons, inputs)
```

### Scrollbar (Custom Styling)
```
--scrollbar-track          Scrollbar track background — var(--bg-input)
--scrollbar-thumb          Scrollbar thumb background — var(--accent-border)
--scrollbar-thumb-hover    Scrollbar thumb hover — var(--accent-hover)
```

---

## APPENDIX: DESIGN IMPLEMENTATION CHECKLIST

When implementing a new component or page, verify:

- [ ] All colors use CSS variables (`var(--*)`) — no hardcoded hex
- [ ] Text uses correct font (Orbitron for headings/UI, Inter for data)
- [ ] Interactive elements have Framer Motion hover/tap (buttons: 1.05/0.95)
- [ ] Cards use LiquidCard with CursorGlow (not scale hover)
- [ ] Modals use portaled Modal component with high-opacity background
- [ ] Loading states have branded spinner with contextual message
- [ ] Form inputs use themed Input/Select/Textarea components
- [ ] Data tables follow center-alignment + row hover glow + email truncation patterns
- [ ] Role-conditional UI checks for correct role string (`'owner'` / `'admin'` / `'user'`)
- [ ] Page wrapped in `motion.div` with fade+slide entrance animation
- [ ] Any new activity triggers `dispatchActivity()` for hero wave reactivity
- [ ] Component renders safely during SSR (hydration-safe patterns for theme values)

---

*— End of UI Design Specification v2.1 —*
