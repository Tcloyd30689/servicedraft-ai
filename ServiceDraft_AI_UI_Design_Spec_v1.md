# SERVICEDRAFT.AI — UI DESIGN SPECIFICATION v2.0

## Table of Contents
1. [Design Philosophy & Visual Identity](#1-design-philosophy--visual-identity)
2. [Logo Specifications](#2-logo-specifications)
3. [Dynamic Theming System](#3-dynamic-theming-system)
4. [Color System](#4-color-system)
5. [Background & Animation System](#5-background--animation-system)
6. [Card & Container Design System](#6-card--container-design-system)
7. [Modal System](#7-modal-system)
8. [Button Design System](#8-button-design-system)
9. [Form Elements & Input Fields](#9-form-elements--input-fields)
10. [Typography System](#10-typography-system)
11. [Navigation & Layout System](#11-navigation--layout-system)
12. [Effects & Visual Enhancements](#12-effects--visual-enhancements)
13. [CSS Custom Properties Reference](#13-css-custom-properties-reference)

---

## 1. Design Philosophy & Visual Identity

### Core Design Principles

ServiceDraft.AI follows a **"Premium Dark Automotive Tech"** aesthetic:
- **Dark Foundation**: Pure black (#000000) base with deep purple-tinted surfaces
- **Neon Accent Energy**: 9 selectable accent colors with the default Violet (#a855f7) as the signature
- **Liquid Glass Materials**: Glassmorphism with backdrop blur and translucent surfaces
- **Living Backgrounds**: Sine wave animations (landing/auth) and particle network (protected pages)
- **Premium Micro-interactions**: Cursor underglow, smooth transitions, hover glow, typing animations
- **Dynamic Theming**: Full accent color + dark/light mode system with CSS custom properties

### Design Mood

> *"The interface should feel like stepping into a high-end automotive diagnostic bay at night — dark, focused, professional, with glowing instrumentation that guides your attention to what matters."*

---

## 2. Logo Specifications

### Logo Assets

| File | Usage | Location |
|------|-------|----------|
| `SERVIDRAFT.AI LOGO #1 .PNG` | Original full logo (large, with energy trail) | Root + public/ |
| `logo-violet.PNG` through `logo-black.PNG` | 9 accent-colored logo variants for hero area | public/ |
| `ServiceDraft-Ai Vector Logo.png` | Vector wordmark for NavBar center | public/ |
| `ServiceDraft-ai-tight logo.PNG` | SD icon for exports + small displays | public/ |

### Hero Logo Behavior
- Displayed at 409px height (262% of hero+nav combined) in a fixed overlay (`z-[110]`)
- Floats above both hero area and nav bar via `pointer-events-none`
- Dynamically loads accent-colored variant matching user's theme selection
- Uses standard `<img>` tag (not Next.js Image) for reliable inline style control
- Hydration-safe: renders default violet logo during SSR, swaps to accent logo after mount

### NavBar Logo Behavior
- Vector wordmark centered in nav bar via absolute positioning
- Theme-aware CSS filter: `brightness(0) invert(1)` for dark mode (white), `brightness(0)` for light mode (black)

### Export Logo
- `ServiceDraft-ai-tight logo.PNG` in document footer (bottom-right)
- PDF: 25×12mm (native 2.09:1 aspect ratio)
- DOCX: 55×26px

---

## 3. Dynamic Theming System

### Architecture
- **ThemeProvider** (`src/components/ThemeProvider.tsx`): React context providing accent color, color mode, and background animation state
- **themeColors** (`src/lib/constants/themeColors.ts`): 9 accent color definitions with full derived values
- **CSS Custom Properties**: 40+ properties set on `document.documentElement.style` by `buildCssVars()`
- **Persistence**: localStorage (instant) + Supabase `users.preferences` JSONB column (cross-device)

### 9 Accent Colors

| Key | Name | Hex | Special Behavior |
|-----|------|-----|-----------------|
| violet | Violet | #a855f7 | Default |
| red | Red | #ef4444 | — |
| orange | Orange | #f97316 | — |
| yellow | Yellow | #eab308 | — |
| green | Green | #22c55e | — |
| blue | Blue | #3b82f6 | — |
| pink | Pink | #ec4899 | — |
| white | White | #f1f5f9 | Forces dark mode (`isDarkMode: true`) |
| black | Black | #1e293b | Forces light mode (`isLightMode: true`) |

### Color Mode
- **Dark** (default): Dark backgrounds, light text, accent-colored highlights
- **Light**: Light backgrounds, dark text, accent-colored highlights with adjusted contrast
- Toggle available in NavBar and Preferences Panel
- `perceivedBrightness()` helper auto-determines button text color (black vs white) based on accent hover brightness

### Key Theme Variables (set by ThemeProvider)
```
--accent-primary, --accent-hover, --accent-bright, --accent-border, --accent-deep
--accent-text, --accent-5, --accent-8, --accent-10, --accent-15, --accent-20, --accent-30, --accent-50
--bg-primary, --bg-gradient-1, --bg-gradient-2, --bg-input, --bg-elevated, --bg-card, --bg-modal, --bg-nav
--text-primary, --text-secondary, --text-muted
--shadow-glow-sm, --shadow-glow-md, --shadow-glow-lg
--wave-color (RGB triplet for canvas animations)
--body-bg, --btn-text-on-accent, --accent-vivid, --accent-text-emphasis
```

### CRITICAL RULE: No Hardcoded Colors
All components MUST use `var(--accent-*)`, `var(--bg-*)`, `var(--text-*)`, `var(--shadow-*)` references. NEVER use hardcoded hex values like `#a855f7` or `text-white` for themed elements.

---

## 4. Color System

### Default Palette (Violet Dark Mode)

**Accent Family:**
| Token | Default Value | CSS Variable |
|-------|---------------|-------------|
| Primary | #a855f7 | `--accent-primary` |
| Hover | #c084fc | `--accent-hover` |
| Bright | #e9d5ff | `--accent-bright` |
| Border | #6b21a8 | `--accent-border` |
| Deep | #49129b | `--accent-deep` |

**Backgrounds:**
| Token | Default Value | CSS Variable |
|-------|---------------|-------------|
| Base | #000000 | `--bg-primary` |
| Gradient 1 | #260d3f | `--bg-gradient-1` |
| Gradient 2 | #490557 | `--bg-gradient-2` |
| Input | #0f0520 | `--bg-input` |
| Elevated | #1a0a2e | `--bg-elevated` |
| Card | rgba(accent, 0.05) | `--bg-card` |
| Modal | rgba(15,10,30,0.85) | `--bg-modal` |

**Text:**
| Token | Default Value | CSS Variable |
|-------|---------------|-------------|
| Primary | #ffffff | `--text-primary` |
| Secondary | accent-derived | `--text-secondary` |
| Muted | #9ca3af | `--text-muted` |

---

## 5. Background & Animation System

### Sine Wave Background (Landing/Auth Pages)
- Component: `src/components/ui/WaveBackground.tsx`
- Canvas-based, 4 wave layers with varying amplitude, frequency, speed, opacity
- Color: reads `--wave-color` CSS variable (RGB triplet) — reactive to accent color
- Configurable `centerYPercent` prop for vertical baseline positioning
- Landing page: `centerYPercent={0.50}`, Login/Signup: `centerYPercent={0.35}`

### Particle Network (Protected Pages)
- Component: `src/components/ui/ParticleNetwork.tsx`
- 30 floating particles with random velocity, wrapped edges, dynamic connection lines (max distance 200px)
- Color: reads `--wave-color` (same as WaveBackground) — re-reads every 2 seconds for theme changes
- Canvas at `z-10`, fixed positioning, pointer-events-none
- Toggleable via Preferences Panel → saves to Supabase/localStorage

### Hero Area Reactive Waves
- Component: `src/components/layout/HeroArea.tsx`
- 5-layer sine wave animation within the 100px hero banner
- Responds to user activity via `useActivityPulse` hook
- Activity amplitude controls wave height (1x–3.5x multiplier), opacity boost, and stroke width
- Spike triggers: typing (0.35), button click (0.65), AI generation (0.8), save (0.5)

### Page Gradient
```css
background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-primary) 50%, var(--bg-gradient-2) 100%);
```

---

## 6. Card & Container Design System

### Liquid Card (`LiquidCard.tsx`)
| Property | Value |
|----------|-------|
| Background | `var(--bg-card)` (default: rgba(accent, 0.05)) |
| Border | 2px solid `var(--card-border)` |
| Border Radius | 23px |
| Backdrop Blur | 2px |
| Glow | `var(--shadow-glow-md)` |
| Hover | Cursor underglow effect (CursorGlow wrapper) |

### Cursor Underglow (`CursorGlow.tsx`)
- Tracks mouse position via `onMouseMove`
- Applies `radial-gradient(circle 200px at {x}px {y}px, var(--accent-primary), transparent)` as overlay
- 15% opacity, fades in/out on mouse enter/leave
- `pointer-events: none` on overlay, `borderRadius: inherit`

### Size Variants
| Variant | Padding |
|---------|---------|
| compact | 16px |
| standard | 24px |
| spacious | 32px |

---

## 7. Modal System

- Component: `src/components/ui/Modal.tsx`
- Portaled to `document.body` via `createPortal` (escapes parent overflow constraints)
- Flexbox centered within viewport space below nav bar (`pt-20`)
- Content: `max-h-[calc(100vh-8rem)] overflow-y-auto` — scrolls internally for long content
- Scale animation: 95% → 100% via Framer Motion
- Background: `var(--bg-modal)` with `backdrop-blur-xl`
- Close: backdrop click + Escape key
- Border radius: 23px

---

## 8. Button Design System

### Primary Button
| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `var(--accent-primary)` | `var(--accent-primary)` |
| Text | `var(--btn-text-on-accent)` (auto: white or black based on luminance) | Same |
| Hover | `var(--accent-hover)` + glow | Same |
| Active | scale(0.95) | Same |
| Disabled | opacity 0.5, no interaction | Same |

### Secondary Button
| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | transparent | transparent |
| Text | `var(--accent-vivid)` | `var(--accent-vivid)` (darker for contrast) |
| Border | 1px solid `var(--accent-vivid)` | Same |
| Hover | 10% accent tint | Same |

### Ghost Button
| Property | Value |
|----------|-------|
| Background | transparent |
| Text | `var(--accent-vivid)` |
| Border | none |
| Hover | subtle background tint |

### Framer Motion
- All buttons: `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`
- Spring transition: `stiffness: 400, damping: 25`
- Disabled buttons skip hover/tap animations

---

## 9. Form Elements & Input Fields

| Property | Value |
|----------|-------|
| Background | `var(--bg-input)` |
| Border | 1px solid `var(--accent-border)` |
| Text | `var(--text-primary)` |
| Placeholder | `var(--text-muted)` |
| Focus | `var(--accent-primary)` border with glow ring |
| Border Radius | 8px |
| Font | `.font-data` (Inter, 400 weight) |

### Auto-Expanding Textareas
- `AutoTextarea.tsx` — measures `scrollHeight` on every change
- Starts at 2 rows, expands as needed
- `resize: none` + `overflow: hidden` pattern

---

## 10. Typography System

### Dual Font System

| Role | Font | Import | CSS Variable | Weight | Tracking |
|------|------|--------|-------------|--------|----------|
| **Headings/UI** | Orbitron | `next/font/google` | `--font-orbitron` | 600 | 0.04em |
| **Data/Input** | Inter | `next/font/google` | `--font-data` | 400 | 0.01em |

### Application
- **Orbitron** (default body font): Page titles, card titles, section headings, button text, navigation labels, column headers, badges
- **Inter** (`.font-data` class): Generated narratives, user input fields, table data cells, audit results, profile data values, export modal fields, search inputs

### Type Scale
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page Title | 32px | 700 | `--text-primary` |
| Card Title | 24px | 600 | `--accent-bright` |
| Section Heading | 20px | 600 | `--text-primary` |
| Subtitle | 16px | 400 | `--text-secondary` |
| Body Text | 16px | 400 | `--text-primary` |
| Small Text | 14px | 400 | `--text-muted` |
| Label | 14px | 500 | `--text-secondary` |
| Version Label | 14px | 500 | `--accent-bright` |

### Light Mode Typography
- `--accent-text-emphasis`: Switches to bold black (#0f172a) in light mode for headings/emphasis text
- `--accent-text-emphasis-weight`: `inherit` in dark mode, `700` in light mode

---

## 11. Navigation & Layout System

### Fixed Header (164px total)

**Hero Area (100px)**
- Fixed at top (`z-[90]`)
- Reactive sine wave background responding to user activity
- Oversized floating logo overlay (`z-[110]`, 409px height, `pointer-events-none`)

**Nav Bar (64px)**
- Fixed below hero (`z-[100]`, `top: 100px`)
- Three-section layout:
  - LEFT: Styled "MAIN MENU" button with accent tint background
  - CENTER: Vector logo (`ServiceDraft-Ai Vector Logo.png`) with theme-aware CSS filter
  - RIGHT: Color mode toggle (Sun/Moon icons) + UserPopup trigger (PositionIcon + "T.Cloyd" format + chevron)
- Mobile: hamburger menu with dropdown

**Content Area**
- `paddingTop: 164px` (100px hero + 64px nav)
- `min-height: calc(100vh - 164px)`

### UserPopup (`UserPopup.tsx`)
- Trigger: PositionIcon + formatted display name + chevron (accent border, hover background)
- Dropdown: User info (name, location, position), Dashboard link, Owner Dashboard link (admin only), Log Out
- `formatDisplayName()`: first initial + period + last name

---

## 12. Effects & Visual Enhancements

### Framer Motion Animations
- **Page entrances**: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}` (300ms easeOut)
- **Landing page**: Cinematic stagger — logo (0s, scale 0.8→1), subtitle (0.6s), buttons (1.1s)
- **Page transitions**: Landing page fade-out (350ms) → next page fade-in (400ms)
- **Button hover/tap**: scale 1.05/0.95 with spring transition
- **Story type selector**: scale 1.03 on hover
- **Tab transitions**: AnimatePresence with slide/fade variants
- **Template cards**: exit animation (slide right + fade out on delete)

### Glow Effects
- Buttons: `var(--shadow-glow-sm)` on hover
- Cards: `var(--shadow-glow-md)` default
- Focus states: `var(--shadow-glow-lg)` ring
- Owner Dashboard title: neon glow via `text-shadow` with accent color

### Owner Dashboard Premium Styling
- Title: "OWNER DASHBOARD" at text-5xl with outlined text (transparent fill, accent stroke) and neon glow text-shadow
- Liquid glass background: rgba backdrop-blur with accent border, rounded-[16px]
- Mouse-tracking spotlight animation: radial-gradient overlay that follows cursor via `onMouseMove`

### Proofread Highlighting
- `<mark>` elements with `var(--accent-30)` background and `2px solid var(--accent-primary)` bottom border
- Hover tooltip with issue description (opaque dark background #111827, dark shadow)
- Highlights persist until narrative changes

---

## 13. CSS Custom Properties Reference

All properties are defined in `src/app/globals.css` `:root` block with defaults, and dynamically overridden by ThemeProvider's `buildCssVars()` function.

### Accent Colors
```
--accent-primary    Main accent color
--accent-hover      Hover/bright variant
--accent-bright     Lightest accent
--accent-border     Dark accent for borders
--accent-deep       Darkest accent for glow
--accent-text       Text-appropriate accent shade
--accent-5 through --accent-50    Opacity variants (5%, 8%, 10%, 15%, 20%, 30%, 50%)
```

### Backgrounds
```
--bg-primary        Base background color
--bg-gradient-1     Gradient start
--bg-gradient-2     Gradient end
--bg-input          Input field background
--bg-elevated       Elevated surface
--bg-card           Card background (derived)
--bg-modal          Modal background
--bg-nav            Nav bar background
--body-bg           Full body gradient (resolved string)
```

### Text
```
--text-primary      Main text color
--text-secondary    Secondary text (accent-derived)
--text-muted        Muted/placeholder text
--accent-text-emphasis    Heading emphasis color (accent in dark, black in light)
```

### Shadows
```
--shadow-glow-sm    Small glow (buttons hover)
--shadow-glow-md    Medium glow (cards)
--shadow-glow-lg    Large glow (focus states)
```

### Buttons
```
--btn-text-on-accent    Auto: white or black based on accent brightness
--accent-vivid          Secondary button text (darker in light mode for contrast)
```

### Animation
```
--wave-color        RGB triplet for canvas animations (e.g., "168, 85, 247")
```

### Borders
```
--card-border       Card border color
--modal-border      Modal border color
--border-default    Default border (transparent dark, rgba(0,0,0,0.1) light)
```

### Radius
```
--radius-2xl        23px (cards, modals)
--radius-lg         12px
--radius-md         8px (buttons, inputs)
```

---

*— End of UI Design Specification v2.0 —*
