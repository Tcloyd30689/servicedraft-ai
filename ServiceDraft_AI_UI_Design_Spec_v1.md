# SERVICEDRAFT.AI — UI DESIGN SPECIFICATION v1.0

## Table of Contents
1. [Design Philosophy & Visual Identity](#1-design-philosophy--visual-identity)
2. [Logo Specifications](#2-logo-specifications)
3. [Color System](#3-color-system)
4. [Background & Animation System](#4-background--animation-system)
5. [Card & Container Design System](#5-card--container-design-system)
6. [Modal System](#6-modal-system)
7. [Button Design System](#7-button-design-system)
8. [Form Elements & Input Fields](#8-form-elements--input-fields)
9. [Typography System](#9-typography-system)
10. [Effects & Visual Enhancements](#10-effects--visual-enhancements)
11. [Navigation Bar Specification](#11-navigation-bar-specification)
12. [Component Reference Library](#12-component-reference-library)
13. [Tailwind CSS Implementation Guide](#13-tailwind-css-implementation-guide)

---

## 1. Design Philosophy & Visual Identity

### Core Design Principles

ServiceDraft.AI follows a **"Premium Dark Automotive Tech"** aesthetic that communicates professionalism, cutting-edge technology, and the high-stakes nature of warranty documentation. The visual language draws inspiration from:

- **High-end automotive dashboards**: Dark, sophisticated, precision-focused
- **Modern SaaS platforms**: Clean layouts, clear hierarchy, purposeful animations
- **Gaming/tech interfaces**: Vibrant accent colors, dynamic backgrounds, subtle glow effects

### Visual Pillars

| Pillar | Implementation |
|--------|----------------|
| **Dark Foundation** | Pure black (#000000) base with deep purple-tinted surfaces |
| **Neon Purple Energy** | Violet/purple (#a855f7 primary) as the signature accent color |
| **Liquid Glass Materials** | Glassmorphism with backdrop blur and translucent surfaces |
| **Living Backgrounds** | Continuously animating sine wave patterns that pulse with energy |
| **Premium Micro-interactions** | Smooth transitions, hover states, and typing animations |

### Design Mood

> *"The interface should feel like stepping into a high-end automotive diagnostic bay at night — dark, focused, professional, with glowing purple instrumentation that guides your attention to what matters."*

---

## 2. Logo Specifications

### Logo Description

The ServiceDraft.AI logo is a horizontal lockup consisting of:

1. **Icon Element (Left)**: A stylized "SD" monogram rendered in 3D with:
   - Dark metallic/carbon fiber texture base
   - Purple neon outline glow effect
   - Integrated wrench icon within the "D" shape representing automotive service
   - Dimensional depth with beveled edges and subtle reflections
   - Star/sparkle accent at key intersection points

2. **Wordmark (Right)**: "ServiceDraft.AI" in a custom tech/automotive typeface:
   - Italic angle suggesting speed and efficiency
   - Purple color matching the accent system (#a855f7 to #9333ea gradient)
   - Professional weight that balances readability with style

3. **Energy Trail Effect**: A horizontal purple plasma/energy streak that:
   - Emanates from behind the icon
   - Extends through and beyond the wordmark
   - Creates a sense of motion, speed, and technological power
   - Features varying intensity with brighter spots and wispy tendrils

### Logo Usage Guidelines

| Context | Specification |
|---------|---------------|
| **Header/Nav Bar** | Scaled to fit header height (approx. 40-48px tall) |
| **Landing Page Hero** | Full-size display, centered or left-aligned |
| **Favicon** | Use "SD" icon portion only, simplified for small sizes |
| **Loading States** | Icon portion with animated glow pulse |

### Logo File Reference

**Primary Logo File**: `SERVIDRAFT_AI_LOGO_1_.PNG`
- Optimized for dark backgrounds (transparent PNG)
- High resolution for scaling
- Includes energy trail effect

### Logo Clearspace

Maintain minimum clearspace equal to the height of the "S" character on all sides of the logo lockup.

---

## 3. Color System

### Primary Palette (22 Active Colors)

Based on the UI Configurator export, the following color system has been established:

#### Core Purple Accent Family
```
Primary Purple:     #a855f7  (Main accent, buttons, borders, focus states)
Purple Light:       #c084fc  (Hover states, highlights)
Purple Dark:        #9333ea  (Active states, pressed buttons)
Purple Deep:        #7c3aed  (Secondary accents)
Purple Glow:        #49129b  (Glow effects, shadow color)
```

#### Background & Surface Colors
```
True Black:         #000000  (Primary background)
Dark Base:          #260d3f  (Gradient color 1)
Deep Purple Black:  #490557  (Gradient color 2)  
Surface Dark:       #0c5ade5 (Card backgrounds - note: with 5% opacity)
Surface Elevated:   #1a0a2e  (Elevated surfaces, input backgrounds)
```

#### Text Colors
```
Text Primary:       #ffffff  (Headings, important text)
Text Secondary:     #c4b5fd  (Subtext, descriptions)
Text Muted:         #9ca3af  (Placeholder text, labels)
Text Disabled:      #6b7280  (Disabled states)
```

#### Animation Colors
```
Wave Animation:     #c3abe2  (Sine wave stroke color)
Glow Overlay:       #000000  (With varying opacity for glow spread)
```

### Color Application Rules

| Element | Color | Opacity | Notes |
|---------|-------|---------|-------|
| Page Background | Gradient (see Section 4) | 100% | Never solid black |
| Card Background | #c5ade5 | 5% | Extremely subtle tint |
| Card Border | #000000 | 100% | Solid black, 2px width |
| Card Glow | #49129b | 40 intensity | Outer glow effect |
| Primary Button | #a855f7 | 100% | Solid fill |
| Secondary Button | transparent | — | Border only |
| Input Background | #0f0520 | 100% | Darker than cards |
| Input Border | #6b21a8 | 100% | Subtle purple |
| Focus Ring | #a855f7 | 100% | Visible focus state |

### Complete Swatch Reference

The UI Configurator identified 22 active colors in use. Click any swatch to copy its hex value:

**Row 1**: `#c084fc` `#1a1a1a` `#a855f7` `#4b5563` `#c4b5fd` `#9333ea` `#6b21a8`
**Row 2**: `#f0abfc` `#e879f9` `#3f3f46` `#7c3aed` `#d8b4fe` `#8b5cf6`
**Row 3**: `#22c55e` `#f97316` `#fbbf24` `#a78bfa` `#000000` `#d946ef` `#e9d5ff`
**Row 4**: `#fde047`

---

## 4. Background & Animation System

### Gradient Background

The application uses a multi-stop gradient background that creates depth and visual interest:

```json
{
  "type": "gradient",
  "colors": [
    "#260d3f",
    "#000000",
    "#490557"
  ]
}
```

**Implementation (Tailwind/CSS)**:
```css
background: linear-gradient(135deg, #260d3f 0%, #000000 50%, #490557 100%);
```

**Alternative radial implementation for centered focus**:
```css
background: radial-gradient(ellipse at center, #260d3f 0%, #000000 40%, #490557 100%);
```

### Sine Wave Animation (PRIMARY ANIMATION)

The application features a continuously looping **sine wave animation** that creates a "living" background effect. This is the primary animation to be used across all pages.

#### Wave Animation Specification

```json
{
  "animation": {
    "type": "waves",
    "enabled": true,
    "color": "#c3abe2"
  }
}
```

#### Wave Properties

| Property | Value | Description |
|----------|-------|-------------|
| **Type** | Sine Waves | Smooth, mathematical wave pattern |
| **Stroke Color** | #c3abe2 | Light purple with slight desaturation |
| **Stroke Width** | 1-2px | Thin, elegant lines |
| **Opacity** | 15-25% | Subtle, non-distracting |
| **Wave Count** | 3-5 | Multiple overlapping waves |
| **Animation Speed** | 8-12 seconds | Full cycle duration |
| **Direction** | Horizontal flow | Left to right movement |
| **Amplitude** | 20-40px | Height of wave peaks |
| **Frequency** | Variable | Different for each wave layer |

#### Wave Animation Implementation (React/Canvas)

```javascript
// Conceptual implementation for sine wave background
const WaveBackground = () => {
  const waves = [
    { amplitude: 30, frequency: 0.02, speed: 0.02, offset: 0 },
    { amplitude: 25, frequency: 0.015, speed: 0.015, offset: Math.PI / 4 },
    { amplitude: 35, frequency: 0.025, speed: 0.025, offset: Math.PI / 2 },
  ];
  
  // Animation loop draws sine waves with:
  // y = centerY + amplitude * Math.sin(x * frequency + time * speed + offset)
  
  // Stroke color: rgba(195, 171, 226, 0.2) — #c3abe2 at 20% opacity
};
```

#### Wave Positioning

- Waves should span the **full viewport width**
- Vertical positioning: **Center of viewport** with waves extending above/below
- Waves should **not interfere** with content readability
- Consider adding a subtle **gradient mask** at top/bottom edges for smooth fade

### Animation Integration with Content

The wave animation runs **behind all content** as a CSS background layer or canvas element:

```
Z-INDEX LAYERS:
z-0   : Gradient background base
z-10  : Wave animation canvas
z-20  : Content overlay (slight dark tint if needed)
z-30  : Cards and UI components
z-40  : Modals and overlays
z-50  : Toasts and notifications
```

---

## 5. Card & Container Design System

### Card Material: "Liquid"

The UI uses a custom **"Liquid" material** effect that creates a fluid, premium appearance:

```json
{
  "material": "liquid",
  "bg": "#c5ade5",
  "opacity": 5,
  "borderColor": "#000000",
  "blur": 2,
  "glow": {
    "color": "#49129b",
    "intensity": 40
  }
}
```

### Card Specifications

| Property | Value | CSS Implementation |
|----------|-------|-------------------|
| **Background Color** | #c5ade5 | `background-color: rgba(197, 173, 229, 0.05)` |
| **Background Opacity** | 5% | Already in rgba above |
| **Border Color** | #000000 | `border-color: #000000` |
| **Border Width** | 2px | `border-width: 2px` |
| **Border Style** | Solid | `border-style: solid` |
| **Border Radius** | 23px | `border-radius: 23px` |
| **Backdrop Blur** | 2px | `backdrop-filter: blur(2px)` |
| **Glow Color** | #49129b | Via box-shadow |
| **Glow Intensity** | 40 | Spread/blur of shadow |

### Card CSS Implementation

```css
.card-liquid {
  /* Background with liquid material */
  background-color: rgba(197, 173, 229, 0.05);
  
  /* Border */
  border: 2px solid #000000;
  border-radius: 23px;
  
  /* Glass effect */
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  
  /* Glow effect */
  box-shadow: 
    0 0 40px rgba(73, 18, 155, 0.4),
    inset 0 0 20px rgba(168, 85, 247, 0.05);
  
  /* Smooth transitions */
  transition: all 0.3s ease;
}

.card-liquid:hover {
  box-shadow: 
    0 0 60px rgba(73, 18, 155, 0.5),
    inset 0 0 30px rgba(168, 85, 247, 0.08);
}
```

### Tailwind Implementation

```jsx
<div className="
  bg-[#c5ade5]/5
  border-2 border-black
  rounded-[23px]
  backdrop-blur-sm
  shadow-[0_0_40px_rgba(73,18,155,0.4)]
  transition-all duration-300
  hover:shadow-[0_0_60px_rgba(73,18,155,0.5)]
">
  {/* Card content */}
</div>
```

### Card Padding Standards

| Card Type | Padding | Use Case |
|-----------|---------|----------|
| **Compact** | 16px (p-4) | Small info cards, badges |
| **Standard** | 24px (p-6) | Most content cards |
| **Spacious** | 32-40px (p-8 to p-10) | Hero sections, main forms |

---

## 6. Modal System

### Modal Specifications

```json
{
  "material": "liquid",
  "animation": "scale",
  "position": "center",
  "width": 600,
  "borderRadius": 23
}
```

### Modal Properties

| Property | Value | Description |
|----------|-------|-------------|
| **Material** | Liquid | Same as cards, glassmorphism effect |
| **Animation** | Scale | Scales up from 95% to 100% on open |
| **Position** | Center | Vertically and horizontally centered |
| **Width** | 600px | Default modal width |
| **Max Width** | 90vw | Responsive constraint |
| **Border Radius** | 23px | Matches card system |
| **Backdrop** | Dark overlay | 60-70% black with blur |

### Modal Animation Options

| Animation | CSS Transform | Duration | Easing |
|-----------|---------------|----------|--------|
| **Fade** | opacity 0→1 | 200ms | ease-out |
| **Scale** | scale(0.95)→scale(1) + fade | 200ms | ease-out |
| **SlideUp** | translateY(20px)→translateY(0) + fade | 250ms | ease-out |
| **SlideDown** | translateY(-20px)→translateY(0) + fade | 250ms | ease-out |

**DEFAULT**: Scale animation is the recommended default for ServiceDraft.AI modals.

### Modal CSS Implementation

```css
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 40;
}

/* Modal container */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  z-index: 50;
  
  /* Liquid material (same as cards) */
  background-color: rgba(197, 173, 229, 0.05);
  border: 2px solid #000000;
  border-radius: 23px;
  backdrop-filter: blur(2px);
  box-shadow: 0 0 60px rgba(73, 18, 155, 0.5);
  
  /* Animation */
  animation: modalScaleIn 200ms ease-out;
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
```

### Modal Anatomy

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐  X │ ← Close button (top right)
│  │                                             │    │
│  │           MODAL TITLE                       │    │ ← Title (18-20px, bold, white)
│  │                                             │    │
│  │  Modal description text goes here. This     │    │ ← Body text (14-16px, muted)
│  │  explains the purpose of the modal.         │    │
│  │                                             │    │
│  │  ┌─────────────────────────────────────┐   │    │
│  │  │        Input fields if needed       │   │    │ ← Form elements
│  │  └─────────────────────────────────────┘   │    │
│  │                                             │    │
│  │      ┌──────────┐  ┌────────────────┐      │    │
│  │      │  Cancel  │  │    Confirm     │      │    │ ← Action buttons
│  │      └──────────┘  └────────────────┘      │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Modal Content Spacing

| Element | Spacing |
|---------|---------|
| Modal Padding | 24-32px |
| Title to Description | 12px |
| Description to Content | 20px |
| Content to Buttons | 24px |
| Button Gap | 12px |

---

## 7. Button Design System

### Button Hierarchy

ServiceDraft.AI uses a three-tier button hierarchy:

1. **Primary Button**: Main CTA actions (Generate Story, Save, Confirm)
2. **Secondary Button**: Alternative actions (Cancel, Clear, Back)
3. **Ghost Button**: Tertiary actions (Edit, Toggle, Info)

### Primary Button (Option #1)

Solid purple background with white text:

```json
{
  "background": "#a855f7",
  "textColor": "#ffffff",
  "borderWidth": 0,
  "borderRadius": 8
}
```

**CSS Implementation**:
```css
.btn-primary {
  background-color: #a855f7;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #9333ea;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
}

.btn-primary:active {
  background-color: #7c3aed;
  transform: scale(0.98);
}

.btn-primary:disabled {
  background-color: #4b5563;
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Secondary Button (Option #2)

Transparent background with purple border and text:

```json
{
  "background": "transparent",
  "textColor": "#a855f7",
  "borderColor": "#a855f7",
  "borderWidth": 1,
  "borderRadius": 8
}
```

**CSS Implementation**:
```css
.btn-secondary {
  background-color: transparent;
  color: #a855f7;
  border: 1px solid #a855f7;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: rgba(168, 85, 247, 0.1);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
}

.btn-secondary:active {
  background-color: rgba(168, 85, 247, 0.2);
}
```

### Tailwind Button Classes

```jsx
// Primary Button
<button className="
  bg-purple-500 
  hover:bg-purple-600 
  text-white 
  font-semibold 
  py-3.5 px-6 
  rounded-lg 
  transition-all duration-200
  hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]
  active:scale-[0.98]
  disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60
">
  Primary Action
</button>

// Secondary Button
<button className="
  bg-transparent 
  hover:bg-purple-500/10 
  text-purple-500 
  font-semibold 
  py-3.5 px-6 
  rounded-lg 
  border border-purple-500
  transition-all duration-200
  hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]
">
  Secondary Action
</button>
```

### Button Sizing

| Size | Padding | Font Size | Use Case |
|------|---------|-----------|----------|
| **Small** | 8px 16px | 14px | Inline actions, tags |
| **Medium** | 12px 20px | 15px | Standard buttons |
| **Large** | 14px 24px | 16px | Primary CTAs, modal actions |
| **Full Width** | 14px 24px | 16px | Form submit, mobile |

---

## 8. Form Elements & Input Fields

### Text Input Specification

Based on the UI Configurator design:

```json
{
  "background": "#0f0520",
  "borderColor": "#6b21a8",
  "borderWidth": 1,
  "textColor": "#ffffff",
  "placeholderColor": "#9ca3af",
  "borderRadius": 8
}
```

### Input CSS Implementation

```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  background-color: #0f0520;
  border: 1px solid #6b21a8;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  transition: all 0.2s ease;
}

.input-field::placeholder {
  color: #9ca3af;
}

.input-field:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
}

.input-field:hover:not(:focus) {
  border-color: #7c3aed;
}
```

### Textarea Specification

Same styling as inputs, with additional properties:

```css
.textarea-field {
  /* Inherits all input styles */
  min-height: 120px;
  resize: vertical;
  line-height: 1.5;
}
```

### Dropdown/Select Specification

```json
{
  "label": "DropDown Menu Label",
  "background": "#0f0520",
  "borderColor": "#6b21a8",
  "textColor": "#ffffff",
  "borderRadius": 8
}
```

**CSS Implementation**:
```css
.select-field {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px; /* Space for chevron */
  background-color: #0f0520;
  border: 1px solid #6b21a8;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Chevron icon */
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: all 0.2s ease;
}

.select-field:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
}
```

### Form Label Specification

```css
.form-label {
  display: block;
  color: #c4b5fd;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}
```

### Form Field Group Structure

```jsx
<div className="mb-5">
  <label className="block text-purple-200 text-sm font-medium mb-2">
    Field Label
  </label>
  <input 
    className="
      w-full p-3
      bg-[#0f0520]
      border border-purple-800
      rounded-lg
      text-white
      placeholder-gray-500
      focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
      transition-all duration-200
    "
    placeholder="Placeholder text..."
  />
</div>
```

---

## 9. Typography System

### Font Family

**Primary Font**: System font stack (for performance) or Inter/Outfit (for design consistency)

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height | Color | Tailwind |
|---------|------|--------|-------------|-------|----------|
| **Page Title** | 32px | 700 (Bold) | 1.2 | #ffffff | `text-3xl font-bold` |
| **Card Title** | 24px | 600 (Semibold) | 1.3 | #a855f7 | `text-2xl font-semibold text-purple-500` |
| **Section Heading** | 20px | 600 | 1.4 | #ffffff | `text-xl font-semibold` |
| **Subtitle/Subtext** | 16px | 400 (Regular) | 1.5 | #c4b5fd | `text-base text-purple-200` |
| **Body Text** | 16px | 400 | 1.6 | #ffffff | `text-base` |
| **Small Text** | 14px | 400 | 1.5 | #9ca3af | `text-sm text-gray-400` |
| **Label** | 14px | 500 (Medium) | 1.4 | #c4b5fd | `text-sm font-medium text-purple-200` |
| **Caption** | 12px | 400 | 1.4 | #6b7280 | `text-xs text-gray-500` |

### Typography Examples from UI Configurator

**Card Title Text** (as seen in screenshots):
```css
.card-title {
  font-size: 24px;
  font-weight: 600;
  color: #a855f7;
  margin-bottom: 8px;
}
```

**Subtitle/Subtext**:
```css
.subtitle {
  font-size: 16px;
  font-weight: 400;
  color: #c4b5fd;
  margin-bottom: 16px;
}
```

### Text in Uppercase Contexts

For generated warranty narratives and certain UI elements, text should be rendered in **ALL CAPS**:

```css
.narrative-text {
  text-transform: uppercase;
  letter-spacing: 0.02em; /* Slight letter spacing for readability */
}
```

---

## 10. Effects & Visual Enhancements

### Global Glow Effect (SFX)

```json
{
  "globalGlow": true,
  "glowColor": "#000000",
  "gradientBorder": false
}
```

The global glow creates an ambient lighting effect around interactive elements and cards.

### Glow Effect Specifications

| Element | Glow Color | Blur | Spread | Opacity |
|---------|------------|------|--------|---------|
| **Cards (default)** | #49129b | 40px | 0 | 40% |
| **Cards (hover)** | #49129b | 60px | 0 | 50% |
| **Primary Buttons (hover)** | #a855f7 | 20px | 0 | 40% |
| **Input Focus** | #a855f7 | 0 | 3px | 20% |
| **Logo** | #a855f7 | 30px | 10px | 50% |

### CSS Box-Shadow Recipes

```css
/* Card glow */
box-shadow: 0 0 40px rgba(73, 18, 155, 0.4);

/* Card glow on hover */
box-shadow: 0 0 60px rgba(73, 18, 155, 0.5);

/* Button glow on hover */
box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);

/* Input focus ring */
box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);

/* Logo ambient glow */
filter: drop-shadow(0 0 30px rgba(168, 85, 247, 0.5));
```

### Backdrop Blur

Glassmorphism effect using backdrop blur:

```css
.glass-effect {
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* Stronger blur for modals */
.modal-backdrop {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
```

### Transition Timing

All interactive elements should use consistent easing:

```css
/* Standard transition */
transition: all 0.2s ease;

/* Smooth transition for larger elements */
transition: all 0.3s ease;

/* Animation timing function */
animation-timing-function: ease-out;
```

---

## 11. Navigation Bar Specification

### Nav Bar Structure

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  │  Main Menu  │  Dashboard  │  FAQ  │  Support  │  [USER ID] │
└──────────────────────────────────────────────────────────────────────────┘
```

### Nav Bar Styling

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  
  /* Glassmorphism */
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
  
  z-index: 100;
}
```

### Nav Link Styling

```css
.nav-link {
  color: #c4b5fd;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #ffffff;
  background-color: rgba(168, 85, 247, 0.1);
}

.nav-link.active {
  color: #ffffff;
  background-color: rgba(168, 85, 247, 0.2);
}
```

### User ID Popup Trigger

```css
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #a855f7;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-avatar:hover {
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
}
```

---

## 12. Component Reference Library

### Quick Reference: CSS Custom Properties

To maintain consistency across the application, define these CSS custom properties:

```css
:root {
  /* Colors */
  --color-primary: #a855f7;
  --color-primary-light: #c084fc;
  --color-primary-dark: #9333ea;
  --color-glow: #49129b;
  
  --color-bg-base: #000000;
  --color-bg-gradient-1: #260d3f;
  --color-bg-gradient-2: #490557;
  
  --color-surface: rgba(197, 173, 229, 0.05);
  --color-surface-elevated: #1a0a2e;
  --color-input-bg: #0f0520;
  
  --color-text-primary: #ffffff;
  --color-text-secondary: #c4b5fd;
  --color-text-muted: #9ca3af;
  
  --color-border: #000000;
  --color-border-input: #6b21a8;
  
  --color-wave: #c3abe2;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 23px;
  
  /* Shadows */
  --shadow-glow-sm: 0 0 15px rgba(73, 18, 155, 0.3);
  --shadow-glow-md: 0 0 40px rgba(73, 18, 155, 0.4);
  --shadow-glow-lg: 0 0 60px rgba(73, 18, 155, 0.5);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

### Component Checklist

Use this checklist when implementing any UI component:

- [ ] Uses correct background color/opacity
- [ ] Has appropriate border (color, width, radius)
- [ ] Implements glow effect (if applicable)
- [ ] Has hover state defined
- [ ] Has focus state defined (for interactive elements)
- [ ] Has disabled state defined (for buttons/inputs)
- [ ] Uses correct typography scale
- [ ] Has smooth transitions
- [ ] Maintains consistent spacing
- [ ] Works on dark background

---

## 13. Tailwind CSS Implementation Guide

### Tailwind Config Extensions

Add these to your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'sd-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#49129b',
        },
        'sd-dark': {
          base: '#000000',
          surface: '#0f0520',
          elevated: '#1a0a2e',
          gradient1: '#260d3f',
          gradient2: '#490557',
        },
        'sd-text': {
          primary: '#ffffff',
          secondary: '#c4b5fd',
          muted: '#9ca3af',
        }
      },
      borderRadius: {
        'card': '23px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(73, 18, 155, 0.3)',
        'glow-md': '0 0 40px rgba(73, 18, 155, 0.4)',
        'glow-lg': '0 0 60px rgba(73, 18, 155, 0.5)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
      },
      animation: {
        'wave': 'wave 10s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'wave': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
}
```

### Utility Class Combinations

**Standard Card**:
```jsx
className="bg-[#c5ade5]/5 border-2 border-black rounded-card backdrop-blur-sm shadow-glow-md"
```

**Primary Button**:
```jsx
className="bg-sd-purple-500 hover:bg-sd-purple-600 text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 hover:shadow-glow-purple active:scale-[0.98] disabled:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
```

**Secondary Button**:
```jsx
className="bg-transparent hover:bg-sd-purple-500/10 text-sd-purple-500 font-semibold py-3.5 px-6 rounded-lg border border-sd-purple-500 transition-all duration-200"
```

**Input Field**:
```jsx
className="w-full p-3 bg-sd-dark-surface border border-sd-purple-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-sd-purple-500 focus:ring-2 focus:ring-sd-purple-500/20 transition-all duration-200"
```

**Card Title**:
```jsx
className="text-2xl font-semibold text-sd-purple-500"
```

**Subtitle**:
```jsx
className="text-base text-sd-text-secondary"
```

---

## Summary: Design System at a Glance

| Property | Value |
|----------|-------|
| **Primary Color** | #a855f7 (Purple 500) |
| **Background** | Gradient: #260d3f → #000000 → #490557 |
| **Animation** | Sine Waves (#c3abe2 at 20% opacity) |
| **Card Material** | Liquid (5% opacity, 2px blur, black border) |
| **Card Border Radius** | 23px |
| **Card Glow** | #49129b at 40 intensity |
| **Modal Animation** | Scale (95% → 100%) |
| **Button Border Radius** | 8px |
| **Input Border Radius** | 8px |
| **Input Background** | #0f0520 |
| **Font Stack** | Inter, system fonts |
| **Title Size** | 32px |
| **Body Size** | 16px |

---

*— End of UI Design Specification v1.0 —*
