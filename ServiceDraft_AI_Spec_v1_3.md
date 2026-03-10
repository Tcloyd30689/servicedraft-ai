# SERVICEDRAFT.AI

**Project Specification Document**

*AI-Powered Warranty Narrative Generator for Automotive Dealership Service Departments*

**Version 2.0**

March 2026

---

## Table of Contents

1. Executive Summary
2. Project Overview
3. Technology Stack
4. Authentication & Payment Flows
5. Page Specifications
6. Database Schema
7. API Route Inventory
8. Visual Design System
9. Feature Matrix
10. Complete Workflow Diagram
11. Project Knowledge Files

---

## 1. Executive Summary

ServiceDraft.AI is a web application that transforms technician diagnostic and repair notes into professional, audit-proof warranty narratives. The application serves automotive dealership service departments by automating the creation of warranty claim stories in the industry-standard 3C format (Concern, Cause, Correction).

### Core Value Proposition

- Reduces narrative writing time from 5-10 minutes to under 30 seconds
- Ensures consistent, professional language that passes warranty audits
- Eliminates warranty claim rejections due to poor documentation
- Supports both diagnostic-only and completed repair scenarios
- Provides AI-powered story-type-aware proofreading
- Supports diagnostic-to-repair-complete narrative updates
- Offers 9-color accent theming, dark/light mode, and user preference persistence

---

## 2. Project Overview

### 2.1 Application Name
ServiceDraft.AI

### 2.2 Domain
servicedraft.ai (registered via Cloudflare, hosted on Vercel)

### 2.3 Target Users
- **Primary**: Automotive service technicians at franchised dealerships
- **Secondary**: Service advisors and warranty administrators
- **Future**: Independent repair facilities and fleet maintenance operations

### 2.4 Design Aesthetic
- "Premium Dark Automotive Tech" — dark foundation, neon accent colors with glow effects
- 9 selectable accent colors (Violet default) with dark/light mode support
- Orbitron font for headings, Inter font for data/input text
- Animated sine wave (landing/auth) and particle network (protected pages) backgrounds
- Glassmorphism "liquid" card system with cursor underglow effect
- Professional, premium appearance with cinematic page transitions

### 2.5 Current Status
Core build complete (Phases 0-10 + Stages 2-5 improvement sprints). Pre-deployment security audit passed. Ready for production deployment.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 | React framework with SSR |
| **React** | React | 19.2.3 | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | CSS-first config (no tailwind.config.ts — uses @theme in globals.css) |
| **Database/Auth** | Supabase | 2.95+ | PostgreSQL + Auth + RLS |
| **AI** | Google Gemini | gemini-3-flash-preview | Narrative generation, proofreading, customization |
| **Payments** | Stripe | 20.3.1 | Subscription billing + access code bypass |
| **Email** | Resend | 6.9.2 | Transactional email (exports, password resets) |
| **Animations** | Framer Motion | 12.34+ | Page transitions, micro-interactions |
| **Charts** | Recharts | 3.8+ | Admin analytics |
| **PDF Export** | jsPDF | 4.2+ | Server-side PDF generation |
| **DOCX Export** | docx | 9.5+ | Server-side Word document generation |
| **Icons** | Lucide React | 0.564+ | SVG icon library |
| **Toasts** | react-hot-toast | 2.6+ | Notifications |
| **Hosting** | Vercel | — | CI/CD + hosting |
| **DNS** | Cloudflare | — | Domain registrar (DNS-only mode, no proxy) |

---

## 4. Authentication & Payment Flows

### 4.1 Sign In Flow (Existing Users)
1. Landing Page → Click "LOGIN"
2. Enter Email + Password → Supabase Auth
3. Check onboarding status (subscription_status, profile completion)
4. Redirect to appropriate step or Main Menu

### 4.2 Sign Up Flow (New Users)
**Step 1 — Account Creation:** Email, Password, Confirm Password → Supabase Auth signUp → Email confirmation → callback redirect
**Step 2 — Payment/Access Code:** Stripe checkout OR access code bypass (env var: ACCESS_CODE). Valid code sets subscription_status to "bypass"
**Step 3 — Profile Creation:** First Name (required), Last Name (required), Location, Position (dropdown: Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk), Terms of Use acceptance checkbox → Save to users table → Main Menu

### 4.3 Session Management
- 8-hour auto-logout session expiry (via `useSessionExpiry` hook)
- Session refresh on every request via Next.js middleware
- Auth state is module-level singleton (`useAuth` hook) — persists across route transitions

---

## 5. Page Specifications

### 5.1 Landing Page (`/`)
- Cinematic staggered entrance animation (logo → tagline → buttons)
- Full-page sine wave background
- Logo with glow effect, tagline "AI-POWERED REPAIR NARRATIVE GENERATOR"
- LOGIN and REQUEST ACCESS buttons with fade-out transition to next page

### 5.2 Main Menu Page (`/main-menu`)
- Central navigation hub with LiquidCard + CursorGlow
- Buttons: GENERATE NEW STORY, USER DASHBOARD, LOG OUT, FAQ/INFO, SUPPORT, TERMS OF USE
- No-scroll viewport centering (accounts for hero + nav height)

### 5.3 Input Page (`/input`)
- Story type selector (DIAGNOSTIC ONLY / REPAIR COMPLETE)
- Dynamic field rendering with auto-expanding textareas
- REPAIR TEMPLATES button → slide-out panel for managing saved templates
- Pre-Generation Output Customization panel (collapsible, 3 segmented controls)
- GENERATE STORY button (disabled until validation passes)
- SAVE AS REPAIR TEMPLATE button
- CLEAR FORM button in card header

### 5.4 Generated Narrative Page (`/narrative`)
- Two-column layout: left controls, right display (stacked on mobile)
- Left panel: Regenerate, AI Customization (3 sliders + custom text), Review & Proofread (with selective apply)
- Right panel: Narrative display with C/C/C format (default) or Block format toggle
- Bottom: Edit Story, Format Toggle, Save Story, Share/Export, New Story
- Navigation guard for unsaved narratives
- Auto-save before exports

### 5.5 User Dashboard (`/dashboard`)
- Profile section with position-based icon
- Narrative history table with multi-column search, sort, and filter
- Narrative detail modal (read-only) with export options
- "UPDATE NARRATIVE WITH REPAIR" for diagnostic entries
- Preferences panel (accent color, dark/light mode, particle animation toggle)

### 5.6 Owner Dashboard (`/admin`)
- Admin role required (`role = 'admin'`)
- 5 tabs: Overview, Activity Log, User Management, Analytics, Settings
- Recharts visualizations, CSV export, time range filtering
- Protected user system (specified email cannot be deleted/restricted)

---

## 6. Database Schema

### 6.1 Tables

**`users`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK, FK auth.users) | User ID |
| email | text | Email address |
| first_name | varchar | First name |
| last_name | varchar | Last name |
| location | text | User location |
| position | text | Job position (dropdown value) |
| role | text | 'user' or 'admin' |
| subscription_status | text | 'active', 'trial', 'expired', 'bypass' |
| stripe_customer_id | text | Stripe customer ID |
| is_restricted | boolean | Account restriction flag |
| accent_color | text | Selected accent color key |
| preferences | jsonb | User preferences (appearance, templates) |
| created_at | timestamptz | Account creation date |
| updated_at | timestamptz | Last profile update |

**`narratives`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Narrative ID |
| user_id | uuid (FK public.users) | Owner |
| ro_number | text | Repair order number |
| vehicle_year | text | Vehicle year |
| vehicle_make | text | Vehicle make |
| vehicle_model | text | Vehicle model |
| concern | text | Concern section |
| cause | text | Cause section |
| correction | text | Correction section |
| block_narrative | text | Full block format |
| story_type | text | 'diagnostic_only' or 'repair_complete' |
| created_at | timestamptz | First save date |
| updated_at | timestamptz | Last save date |

**Note:** No unique constraint on (user_id, ro_number) — same RO# can have both diagnostic and repair entries as separate rows.

**`activity_log`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Log entry ID |
| user_id | uuid (FK public.users) | User who performed action |
| action_type | text | Action type (generate, save, export_pdf, etc.) |
| story_type | text | Story type context |
| input_data | jsonb | Request metadata |
| output_preview | text | Response preview |
| metadata | jsonb | Additional context |
| created_at | timestamptz | Action timestamp |

**Important:** FK on activity_log.user_id points to `public.users` NOT `auth.users`. This is required for PostgREST joins.

**`saved_repairs`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Template ID |
| user_id | uuid (FK auth.users) | Owner |
| template_name | text | User-chosen name |
| story_type | text | 'diagnostic_only' or 'repair_complete' |
| codes_present | text | Saved field value |
| codes_present_option | text | Dropdown state |
| diagnostics_performed | text | Saved field value |
| diagnostics_option | text | Dropdown state |
| root_cause | text | Saved field value |
| root_cause_option | text | Dropdown state |
| repair_performed | text | Saved field value |
| repair_option | text | Dropdown state |
| repair_verification | text | Saved field value |
| verification_option | text | Dropdown state |
| created_at | timestamptz | Creation date |
| updated_at | timestamptz | Last update |

**Note:** Vehicle info columns exist in schema but are always null (templates are vehicle-agnostic). Only 5 core repair fields are saved.

### 6.2 Migrations
1. `001_initial_schema.sql` — users, narratives, auto-profile trigger, RLS
2. `002_add_name_fields_and_position_update.sql` — first_name, last_name
3. `003_narrative_upsert_support.sql` — updated_at, unique constraint, UPDATE policy
4. `004_admin_role_and_activity_log.sql` — role, is_restricted, activity_log
5. `005_saved_repairs.sql` — saved_repairs table + RLS
6. `006_drop_narrative_unique_constraint.sql` — drops unique(user_id, ro_number)

Additional manual: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;`

### 6.3 RLS Policies
All tables have Row Level Security enabled. Users can only read/write their own data. Admin users have expanded SELECT access on users and activity_log tables via `is_admin()` helper function.

---

## 7. API Route Inventory

| Route | Method | Purpose | Auth | Notes |
|-------|--------|---------|------|-------|
| `/api/generate` | POST | AI narrative generation | Session | Rate limited: 20/15min, 10K char input limit |
| `/api/customize` | POST | AI narrative customization | Session | |
| `/api/proofread` | POST | AI story-type-aware audit | Session | Selects prompt based on storyType |
| `/api/apply-edits` | POST | Apply selected proofread edits | Session | |
| `/api/convert-recommendation` | POST | Tense conversion | Session | Exists but unused by frontend |
| `/api/update-narrative` | POST | Diagnostic→Repair update | Session | |
| `/api/narratives` | GET | Fetch user's saved narratives | Session (cookies) | |
| `/api/narratives/save` | POST | Save narrative (INSERT) | Session (cookies) | |
| `/api/saved-repairs` | GET/POST | Repair template CRUD | Session | |
| `/api/saved-repairs/[id]` | PUT/DELETE | Individual template ops | Session | Ownership verified |
| `/api/export-pdf` | POST | PDF generation | Session | |
| `/api/export-docx` | POST | DOCX generation | Session | |
| `/api/send-email` | POST | Email via Resend | Session | Up to 10 recipients |
| `/api/stripe` | POST | Checkout + access code | Session | |
| `/api/stripe/webhook` | POST | Stripe events | Stripe signature | |
| `/api/support` | POST | Support ticket | Session | |
| `/api/delete-account` | POST | Account deletion | Session | Service role |
| `/api/admin` | POST | Admin management | Admin role | Service role |
| `/api/admin/analytics` | GET | Analytics data | Admin role | |

---

## 8. Visual Design System

### Design Aesthetic: "Premium Dark Automotive Tech"
- Dark foundation (pure black #000000 base with deep purple-tinted surfaces)
- 9 selectable accent colors: Violet (default), Red, Orange, Yellow, Green, Blue, Pink, White, Black
- All colors implemented via CSS custom properties — no hardcoded hex values in components
- White accent forces dark mode; Black accent forces light mode
- Dynamic theming via ThemeProvider context + Supabase preferences persistence

### Typography
- **Headings/UI**: Orbitron (imported via next/font/google, weight 600, tracking 0.04em)
- **Data/Input**: Inter (imported via next/font/google, weight 400, tracking 0.01em, applied via `.font-data` class)

### Background Animations
- **Landing/Auth pages**: Sine wave canvas animation (WaveBackground.tsx)
- **Protected pages**: Particle network canvas animation (ParticleNetwork.tsx) — toggleable in preferences

### Card System: "Liquid" Material
- Glassmorphism with backdrop blur
- Cursor underglow effect (CursorGlow.tsx) — radial gradient follows mouse
- No hover enlargement on cards (removed in favor of underglow)

### Hero Area + Navigation
- Fixed hero banner (100px) with reactive sine wave animation + oversized floating logo
- Sticky nav bar (64px) below hero: MAIN MENU button (left), centered vector logo with theme-aware color inversion, theme toggle + user popup (right)
- Combined hero + nav = 164px fixed header offset

### Z-Index Layers
```
z-0   : Gradient background
z-10  : Background animation (ParticleNetwork/WaveBackground)
z-20  : Content overlay
z-30  : Cards and UI components
z-40  : Modals (portaled to body)
z-50  : Toasts
z-90  : Hero area
z-100 : Navigation bar
z-110 : Floating hero logo overlay
z-200 : Preferences panel
```

For complete design specifications, see `ServiceDraft_AI_UI_Design_Spec_v1.md`.

---

## 9. Feature Matrix

| Feature | Page | Status |
|---------|------|--------|
| Email/password authentication | Landing/Auth | ✅ Complete |
| Stripe paywall + access code bypass | Sign Up | ✅ Complete |
| Profile creation (name, location, position dropdown) | Sign Up | ✅ Complete |
| Terms of Use acceptance | Sign Up | ✅ Complete |
| 8-hour auto-logout session expiry | All protected | ✅ Complete |
| Main menu navigation hub | Main Menu | ✅ Complete |
| FAQ/Info modal (15 Q&As) | Main Menu | ✅ Complete |
| Support ticket form | Main Menu | ✅ Complete |
| Terms of Use display | Main Menu | ✅ Complete |
| Story type selection (Diagnostic/Repair) | Input | ✅ Complete |
| Required field validation (1-5) | Input | ✅ Complete |
| Conditional field dropdowns (6+) | Input | ✅ Complete |
| Auto-expanding textareas | Input | ✅ Complete |
| Pre-generation output customization | Input | ✅ Complete |
| Repair templates (save/load/edit/delete) | Input | ✅ Complete |
| Clear form button | Input | ✅ Complete |
| Story type switching preserves shared fields | Input | ✅ Complete |
| AI narrative generation (4-key JSON) | Narrative | ✅ Complete |
| Typing animation for text display | Narrative | ✅ Complete |
| C/C/C format as default display | Narrative | ✅ Complete |
| Dynamic format toggle button | Narrative | ✅ Complete |
| AI customization sliders (3 + custom text) | Narrative | ✅ Complete |
| Story-type-aware proofread with highlighting | Narrative | ✅ Complete |
| Selective apply for suggested edits (checkboxes) | Narrative | ✅ Complete |
| Audit rating badge (PASS/NEEDS_REVIEW/FAIL) | Narrative | ✅ Complete |
| Edit story modal (auto-sizing textareas) | Narrative | ✅ Complete |
| Save to database (INSERT — separate rows per type) | Narrative | ✅ Complete |
| Navigation guard for unsaved narratives | Narrative | ✅ Complete |
| Auto-save before exports | Narrative | ✅ Complete |
| Copy to clipboard | Narrative/Dashboard | ✅ Complete |
| Print narrative (professional format) | Narrative/Dashboard | ✅ Complete |
| Download as PDF (jsPDF) | Narrative/Dashboard | ✅ Complete |
| Download as Word (.docx) | Narrative/Dashboard | ✅ Complete |
| Email narrative (Resend, up to 10 recipients) | Narrative/Dashboard | ✅ Complete |
| Saved narrative history with search/sort/filter | Dashboard | ✅ Complete |
| Profile management (name, location, position) | Dashboard | ✅ Complete |
| Password change | Dashboard | ✅ Complete |
| Delete account (with confirmation) | Dashboard | ✅ Complete |
| Accent color picker (9 colors) | Dashboard Prefs | ✅ Complete |
| Dark/light mode toggle | Dashboard Prefs | ✅ Complete |
| Particle network animation toggle | Dashboard Prefs | ✅ Complete |
| Preferences persistence (Supabase + localStorage) | Dashboard Prefs | ✅ Complete |
| Diagnostic → Repair Complete update flow | Dashboard | ✅ Complete |
| "Completed Recommended Repair" button | Dashboard | ✅ Complete |
| Story type badges in history table | Dashboard | ✅ Complete |
| Owner Dashboard (admin only) | Admin | ✅ Complete |
| Activity logging (10 action types) | Admin | ✅ Complete |
| User management (CRUD + restriction) | Admin | ✅ Complete |
| Analytics with recharts charts | Admin | ✅ Complete |
| CSV analytics export | Admin | ✅ Complete |
| Protected user system | Admin | ✅ Complete |
| Rate limiting on generate (20/15min) | API | ✅ Complete |
| CSP + security headers | Config | ✅ Complete |
| Toast notifications (themed) | All | ✅ Complete |
| 9-color accent theming system | All | ✅ Complete |
| Sine wave + particle backgrounds | All | ✅ Complete |
| Glassmorphism cards + cursor underglow | All | ✅ Complete |
| Framer Motion animations | All | ✅ Complete |
| Mobile responsive design | All | ✅ Complete |
| Error boundaries | All protected | ✅ Complete |

### Planned (Post-Launch)
| Feature | Priority |
|---------|----------|
| Group Manager Dashboard | Next |
| Page-specific Help/Instructions | Next |
| "My Saved Repairs" expansion (enhanced UI) | Next |
| Dashboard search/filtering improvements | Next |
| PWA capabilities | Future |
| Expo/React Native mobile app | Future |
| Multi-tool platform (RepairSuite.ai) | Future |

---

## 10. Complete Workflow Diagram

**LANDING PAGE**
```
├── LOGIN → Sign In → Check Onboarding → MAIN MENU
└── REQUEST ACCESS → Sign Up Flow
    ├── 1. Account Creation (Email/Password)
    ├── 2. STRIPE PAYWALL (Pay or Access Code)
    ├── 3. Profile Creation + Terms of Use
    └── → MAIN MENU
```

**MAIN MENU (Hub)**
```
├── GENERATE NEW STORY → INPUT PAGE
├── USER DASHBOARD → DASHBOARD
├── FAQ/INFO → Info Modal
├── SUPPORT → Ticket Form
├── TERMS OF USE → Terms Modal
└── LOG OUT → LANDING PAGE
```

**INPUT PAGE**
```
├── Select Story Type (Diagnostic/Repair)
├── Fill Required Fields 1-5
├── Fill/Configure Fields 6+ (with dropdown)
├── [Optional] Pre-Gen Customization (Length/Tone/Detail)
├── [Optional] Load from REPAIR TEMPLATES
├── GENERATE STORY (enabled when valid)
│   └── [LOADING] → API Call → NARRATIVE PAGE
├── SAVE AS REPAIR TEMPLATE
└── MAIN MENU → MAIN MENU
```

**GENERATED NARRATIVE PAGE**
```
├── [TYPING ANIMATION] → Text fills display
├── View Narrative (C/C/C format default)
├── Toggle Format Button (switches view, no API call)
├── REGENERATE → [LOADING] → Re-call API with original data
├── AI Customization → Sliders + Custom Text → Apply to current narrative
├── REVIEW & PROOFREAD → [LOADING] → Story-type-aware audit
│   ├── Proofread Results with highlighting
│   └── Select Edits (checkboxes) → APPLY SELECTED EDITS
├── EDIT STORY → Edit Modal → Save Changes
├── SAVE STORY → Database INSERT → Toast
├── SHARE/EXPORT → Copy/Print/PDF/DOCX/Email (auto-save first)
├── NEW STORY → Confirmation → MAIN MENU
└── [Navigation Guard if unsaved]
```

**USER DASHBOARD**
```
├── Profile Section → UPDATE → Edit Modal
├── History Table → Search/Sort/Filter
│   ├── Click Row → View Modal (READ ONLY)
│   │   ├── SHARE/EXPORT → Copy/Print/PDF/DOCX/Email
│   │   └── UPDATE WITH REPAIR (diagnostic only) → Update Modal
│   │       ├── Fill Repair Details
│   │       ├── [Optional] COMPLETED RECOMMENDED REPAIR button
│   │       └── GENERATE NARRATIVE → NARRATIVE PAGE (repair complete)
├── Preferences → Accent Color / Dark-Light / Particle Toggle
└── MAIN MENU → MAIN MENU
```

**OWNER DASHBOARD (Admin Only)**
```
├── Overview → Metrics + Charts + System Health
├── Activity Log → Filter/Search/Paginate/Expand
├── User Management → Search/Sort/CRUD Actions
├── Analytics → Time Range + Charts + CSV Export
└── Settings → Access Code + System Info
```

---

## 11. Project Knowledge Files

| Document | Purpose |
|----------|---------|
| **ServiceDraft_AI_Project_Instructions_v1_3.md** | How to work with Tyler, tech stack, communication rules |
| **ServiceDraft_AI_Spec_v1_3.md** | This file — detailed specs, schema, features, workflows |
| **ServiceDraft_AI_Prompt_Logic_v1.md** | All AI prompts, dropdown logic, customization, JSON structures |
| **ServiceDraft_AI_UI_Design_Spec_v1.md** | Visual design system — colors, typography, theming, animations |
| **CLAUDE_CODE_BUILD_INSTRUCTIONS.md** | Architecture reference + sprint execution guide for Claude Code |
| **BUILD_PROGRESS_TRACKER.md** | Living document tracking all completed and remaining work |
| **PRE_BUILD_SETUP_CHECKLIST.md** | Setup guide for accounts, tools, environment (completed) |
| **DEPLOYMENT_NOTES.md** | Environment variables, Supabase config, Stripe setup, security |

---

*— End of Specification Document v2.0 —*
