# SERVICEDRAFT.AI

**Project Specification Document**

*AI-Powered Warranty Narrative Generator for Automotive Dealership Service Departments*

**Version 2.1**

March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technology Stack](#3-technology-stack)
4. [User Role Hierarchy](#4-user-role-hierarchy)
5. [Authentication & Payment Flows](#5-authentication--payment-flows)
6. [Page Specifications](#6-page-specifications)
7. [Database Schema](#7-database-schema)
8. [API Route Inventory](#8-api-route-inventory)
9. [AI Prompt System](#9-ai-prompt-system)
10. [Export System](#10-export-system)
11. [Visual Design System](#11-visual-design-system)
12. [State Management Architecture](#12-state-management-architecture)
13. [Security & Rate Limiting](#13-security--rate-limiting)
14. [Feature Matrix](#14-feature-matrix)
15. [Complete Workflow Diagrams](#15-complete-workflow-diagrams)
16. [Project Knowledge Files](#16-project-knowledge-files)

---

## 1. Executive Summary

ServiceDraft.AI is a web application that transforms technician diagnostic and repair notes into professional, audit-proof warranty narratives. The application serves automotive dealership service departments by automating the creation of warranty claim stories in the industry-standard 3C format (Concern, Cause, Correction).

### Core Value Proposition

- Reduces narrative writing time from 5-10 minutes to under 30 seconds
- Ensures consistent, professional language that passes warranty audits
- Eliminates warranty claim rejections due to poor documentation
- Supports both diagnostic-only and completed repair scenarios
- Provides AI-powered story-type-aware proofreading to catch potential audit flags
- Supports diagnostic-to-repair-complete narrative updates (preserves original diagnostic detail)
- Multi-format professional export: Copy, Print, PDF, Word, Email — all produce identical documents
- Team management system for multi-technician dealership deployments
- Owner Dashboard with real-time analytics, user management, and Gemini API usage tracking
- 9-color accent theming, dark/light mode, and cross-device preference persistence
- Reusable repair template system for frequently performed repairs

### Current Status

Core build complete (Phases 0–10 + Stage 2–6 improvement sprints). Pre-deployment security audit passed. **App is deployed and live at `servicedraft.ai`** via Vercel with Cloudflare DNS. Currently in beta testing with access-code-gated signup and Stripe in test mode.

---

## 2. Project Overview

### 2.1 Application Name
ServiceDraft.AI

### 2.2 Domain
`servicedraft.ai` — registered via Cloudflare, hosted on Vercel (auto-deploys from GitHub `main` branch)

### 2.3 Target Users
- **Primary**: Automotive service technicians at franchised dealerships
- **Secondary**: Service advisors, warranty administrators, and service managers
- **Tertiary**: Independent repair facilities and fleet maintenance operations

### 2.4 Design Aesthetic
- "Premium Dark Automotive Tech" — dark foundation, neon accent colors with glow effects
- 9 selectable accent colors (Violet default) with dark/light mode support
- Orbitron font (italic, semi-bold) for headings/UI, Inter font for data/input text
- Animated sine wave (landing/auth) and particle network (protected pages) backgrounds
- Glassmorphism "liquid" card system with cursor underglow effect
- Reactive hero area — 5-layer sine waves respond to user activity in real-time
- Professional, premium appearance with cinematic page transitions

### 2.5 Organizational Model
- **Platform Owner** (Tyler — `owner` role): Full system access, manages all users and teams
- **Team Managers** (`admin` role): View their team's members and activity
- **Standard Users** (`user` role): Generate narratives, manage own dashboard and templates
- **Teams**: Organizational groups with unique access codes for signup auto-assignment

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 | React framework with SSR |
| **React** | React | 19.2.3 | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | CSS-first config via @theme in globals.css (NO tailwind.config.ts) |
| **Database/Auth** | Supabase | @supabase/supabase-js 2.95+ / @supabase/ssr 0.8+ | PostgreSQL + Auth + RLS |
| **AI** | Google Gemini | @google/generative-ai 0.24+ | Model: `gemini-3-flash-preview` |
| **Payments** | Stripe | 20.3.1 | Subscription billing + access code bypass (test mode for beta) |
| **Email** | Resend | 6.9.2 | Transactional email exports + password reset emails |
| **Animations** | Framer Motion | 12.34+ | Page transitions, micro-interactions, spring physics |
| **Charts** | Recharts | 3.8+ | Owner Dashboard analytics (LineChart, BarChart, PieChart, AreaChart) |
| **PDF Export** | jsPDF | 4.2+ | Server-side PDF generation |
| **DOCX Export** | docx | 9.5+ | Server-side Word document generation |
| **Icons** | Lucide React | 0.564+ | SVG icon library |
| **Toasts** | react-hot-toast | 2.6+ | Notification system |
| **Hosting** | Vercel | — | CI/CD + hosting (auto-deploys from GitHub) |
| **DNS/Domain** | Cloudflare | — | Domain registrar for servicedraft.ai (DNS-only mode — grey cloud) |

---

## 4. User Role Hierarchy

The app uses a **3-tier role system** (restructured in Stage 5 Sprint 8 from the original 2-tier admin/user model):

| Role | Label in UI | Database Value | Who | Access |
|------|------------|----------------|-----|--------|
| **Owner** | Platform Owner | `'owner'` | Tyler (`hvcadip@gmail.com`) | Full system: Owner Dashboard (6 tabs), all user management, team management, analytics, API usage tracking, promote/demote |
| **Admin** | Team Manager | `'admin'` | Dealership foremen, service managers | Team Dashboard: view team members, team activity log |
| **User** | Standard User | `'user'` | Technicians, advisors, warranty clerks | Generate narratives, user dashboard, saved repair templates |

### Role Assignment Rules
- All new signups default to `user`
- Owner can promote users to `admin` (Team Manager) or demote back to `user` from Owner Dashboard
- Only one account should have `owner` role — set via direct SQL (`UPDATE public.users SET role = 'owner' WHERE email = '...'`)
- Owner role cannot be assigned through the UI (safety measure)
- Protected user (`hvcadip@gmail.com`) cannot be deleted or restricted

---

## 5. Authentication & Payment Flows

### 5.1 Sign In Flow (Existing Users)
1. Landing Page → Click "LOGIN"
2. Enter Email + Password → Supabase Auth validation
3. Check onboarding status (subscription_status, profile completion — username presence)
4. If profile incomplete → redirect to appropriate signup step
5. If complete → redirect to Main Menu

### 5.2 Sign Up Flow (New Users)

**Step 1 — Account Creation:**
- Email, Password, Confirm Password
- Creates Supabase Auth user + auto-profile trigger creates `public.users` row

**Step 2 — Payment / Access Code:**
- User enters an access code
- **Global code match** (env var `ACCESS_CODE`): Sets `subscription_status = 'bypass'`, no team assignment
- **Team code match** (`teams.access_code`): Sets `subscription_status = 'bypass'` AND auto-assigns user to that team (`team_id` set on users table + `team_members` row created)
- **No match**: Redirects to Stripe checkout for subscription payment

**Step 3 — Profile Creation:**
- First Name *(required)*
- Last Name *(required)*
- Location *(US state dropdown — all 50 states)*
- Position *(dropdown: Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk)*
- Username *(required, must be unique)*
- Accent Color Picker *(9-swatch color picker for initial theme preference)*
- Terms of Use acceptance checkbox *(required — links to 11-section Terms of Use)*
- Save to users table → redirect to Main Menu

**Email Confirmation:** Currently **disabled** for beta testing (Supabase: Auth → Providers → Email → "Confirm email" OFF). **MUST be re-enabled** for production launch.

### 5.3 Session Management
- **8-hour auto-logout** session expiry via `useSessionExpiry` hook (checks every 60 seconds against `sd-login-timestamp` in localStorage)
- Session refresh on every request via Next.js middleware (`src/middleware.ts` → `updateSession()`)
- Auth state is a **module-level singleton** (`useAuth` hook) — persists across route transitions, NEVER torn down during navigation

### 5.4 Stripe Configuration (Beta)
- Currently in **test mode** — no real payments processed
- Access code bypass is the primary signup method during beta
- Stripe webhook at `/api/stripe/webhook` handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Switch to live mode when ready for production

---

## 6. Page Specifications

### 6.1 Landing Page (`/`)
- **Access**: Public (unauthenticated)
- Cinematic staggered entrance animation (logo → tagline → buttons, timed delays)
- Full-page sine wave background (`WaveBackground.tsx`, `centerYPercent={0.50}`)
- Accent-colored logo with glow effect
- Tagline "AI-POWERED REPAIR NARRATIVE GENERATOR"
- Two CTA buttons: "LOGIN" (primary) and "REQUEST ACCESS" (secondary)
- Fade-out transition (350ms) → next page fade-in (400ms)

### 6.2 Login Page (`/login`)
- **Access**: Public
- Sine wave background (`centerYPercent={0.35}`)
- Centered LiquidCard form: email + password fields
- "Forgot Password?" link, "Sign Up" redirect link
- Logo size matches landing page

### 6.3 Sign Up Page (`/signup`)
- **Access**: Public
- 3-step flow with progress indicator (see Section 5.2)
- Each step in a centered LiquidCard
- Step 3 includes AccentColorPicker at the top of the form

### 6.4 Main Menu Page (`/main-menu`)
- **Access**: All authenticated users
- Central navigation hub with LiquidCard + CursorGlow
- No-scroll viewport centering (accounts for hero + nav height)

**Role-based button rendering:**
| Button | Visible To | Styling | Icon |
|--------|-----------|---------|------|
| GENERATE NEW STORY | All users | Primary accent | — |
| USER DASHBOARD | All users | Secondary | — |
| OWNER DASHBOARD | `owner` only | Gold/amber accent | Shield |
| TEAM DASHBOARD | `admin` only | Accent-colored | Users |

**Footer links (all users):** FAQ/INFO (modal), SUPPORT (form), TERMS OF USE (modal), LOG OUT

### 6.5 Input Page (`/input`)
- **Access**: All authenticated users
- **Story type selector**: DIAGNOSTIC ONLY / REPAIR COMPLETE (two side-by-side cards with whileTap scale)
- **Dynamic field rendering**: 9 fields (diagnostic) or 10 fields (repair) from `fieldConfig.ts`
  - Fields 1-5: always required, no dropdown
  - Fields 6+: conditional with dropdown (Include / Don't Include / Generate)
  - Auto-expanding textareas for long-form fields, standard inputs for short metadata
- **REPAIR TEMPLATES button**: Opens `MyRepairsPanel` slide-out from right (portaled, `top: 164px`)
- **Pre-Generation Customization**: Collapsible panel with 3 segmented controls (Length/Tone/Detail), persists in localStorage
- **GENERATE STORY button**: Disabled until all validation passes
- **CLEAR FORM button**: Resets field values and dropdowns without changing story type
- **Story type switching**: Preserves shared fields (year, make, model, concern, codes_present, diagnostics, root_cause)

### 6.6 Generated Narrative Page (`/narrative`)
- **Access**: All authenticated users (requires narrative in store)
- **Two-column layout**: Left controls panel, right narrative display (stacks on mobile)
- **Left panel controls**:
  - REGENERATE STORY button
  - AI Customization toggle → 3 sliders + custom text field (max 50 chars)
  - REVIEW & PROOFREAD → story-type-aware audit results with checkbox selection
- **Right panel**: Narrative display with typing animation, C/C/C format (default) or Block format
  - Proofread highlighting with 30-second auto-fade, counter badge, clear button
- **Bottom action buttons**:
  - EDIT STORY → modal with auto-sizing textareas
  - Format Toggle (dynamic label, no API call)
  - SAVE STORY → INSERT to database
  - SHARE/EXPORT → modal with Copy/Print/PDF/DOCX/Email
  - NEW STORY → confirmation dialog → Main Menu
- **Navigation guard**: `beforeunload` + document click capture for unsaved narratives
- **Auto-save**: Triggers before any export action

### 6.7 User Dashboard (`/dashboard`)
- **Access**: All authenticated users
- **Profile section**: PositionIcon (size: large) + name + email + ID + location + position
  - UPDATE button → Edit Profile modal (first/last name, location dropdown, position dropdown)
  - Change Password modal
  - Delete Account (2-step confirmation, service role client)
- **Narrative history table** (`max-w-7xl`):
  - Columns: Date, Time, R.O.#, Type badge (green=Repair, blue=Diagnostic), Year, Make, Model, Preview
  - Multi-column search, sort controls, filter pills (All/Diagnostic/Repair), results count
  - Row hover glow effect
  - Click row → `NarrativeDetailModal` (read-only):
    - Full C/C/C display with vehicle info header
    - Export buttons: Copy, Print, PDF, DOCX, Email
    - "UPDATE NARRATIVE WITH REPAIR" button (diagnostic_only entries only) → `UpdateWithRepairModal`
- **Preferences**: Two modal buttons:
  - App Appearance: AccentColorPicker (9 colors) + dark/light toggle + particle animation toggle
  - My Saved Repairs: Template management (same as input page panel)

### 6.8 Owner Dashboard (`/admin`)
- **Access**: `owner` role ONLY — non-owners redirected
- **Premium title**: "OWNER DASHBOARD" with neon glow text-shadow + outlined text stroke + mouse-tracking spotlight
- **Layout**: `w-[90vw] max-w-[1400px]`
- **6 tabs** with AnimatePresence slide/fade transitions:

**Tab 1 — Overview:**
- 8 metric cards (total users, new this week, new this month, active subscriptions, total narratives, narratives this week, narratives today, total generations)
- Subscription breakdown summary
- 30-day activity trend chart (Recharts LineChart)
- System health indicators (DB row counts, last activity timestamp, app version "v1.0.0-beta")

**Tab 2 — Activity Log:**
- Full activity history table with pagination
- Action type filter dropdown, user search field
- Clickable rows → `ActivityDetailModal` (shared component):
  - Action type badge (color-coded), timestamp, user info (name + email)
  - Vehicle info, RO#, story type badge, narrative preview (scrollable), input data
  - Collapsible "View Raw Data" JSON section
  - Graceful handling for minimal entries (login events: badge + timestamp + user only)
- Refresh button for manual data reload

**Tab 3 — User Management:**
- Sortable user table with search
- Columns: Name (split first/last), Email (truncated max-w-[180px] with tooltip), Position, Role (badge), Team (name or "—"), Subscription, Last Active (stacked date/time), Actions
- Center-aligned headers/cells, glowing row hover effect
- **Per-user actions**: Restrict/Unrestrict, Delete (2-step), Change Subscription, Send Password Reset, Promote to Admin / Demote to User
- **Protected user** (`hvcadip@gmail.com`): ShieldCheck badge, no delete/restrict buttons
- **CREATE TEAM button** in tab header → modal with name input → auto-generated access code
- **Assign to Team action** per user → modal with team dropdown (shows member counts)

**Tab 4 — Analytics:**
- Time range selector: 7d / 30d / 90d / All
- 6 Recharts visualizations: Activity Trend (LineChart), Feature Usage (BarChart), Story Type Distribution (PieChart), Subscription Breakdown (PieChart), Top 10 Users, Usage Over Time (AreaChart)
- Auto-refresh every 60 seconds

**Tab 5 — API Usage:**
- Live Gemini API token usage tracking (from `api_usage_log` table)
- Summary cards: total tokens, total estimated cost, average per call
- Token/cost charts by day, action type breakdown, top users by tokens
- Model info: "gemini-3-flash-preview | Input: $0.50/1M tokens | Output: $3.00/1M tokens"

**Tab 6 — Settings:**
- Token Calculator widget: interactive pricing estimator with model selector, token inputs, toggle multipliers
- Current access code display (reads `ACCESS_CODE` env var via API)
- System information

### 6.9 Team Dashboard (`/team-dashboard`)
- **Access**: `admin` role ONLY — non-admins redirected
- **Layout**: Matches Owner Dashboard width (`w-[90vw] max-w-[1400px]`)
- **2 tabs**:

**Tab 1 — Team Members:**
- Table of users in the manager's team
- Columns: Name, Email (truncated + tooltip), Position, Role, Last Active, Actions
- "Remove from Team" action (removes assignment, does NOT delete user)
- Center-aligned, glowing row hover

**Tab 2 — Activity Log:**
- Activity from team members only (scoped to team)
- Clickable rows → same shared `ActivityDetailModal` component
- Refresh button

---

## 7. Database Schema

### 7.1 Tables (7 Active)

**`public.users`** — User profiles

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid (PK, FK auth.users) | — | User ID from Supabase Auth |
| email | varchar | NOT NULL | Email address |
| username | varchar | — | Unique display name |
| first_name | varchar | — | First name |
| last_name | varchar | — | Last name |
| location | varchar | — | US state (dropdown value) |
| position | varchar | — | Job position (dropdown value) |
| profile_picture_url | varchar | — | *Unused — position-based icons used instead* |
| role | varchar | `'user'` | `'owner'`, `'admin'`, or `'user'` (3-tier hierarchy) |
| subscription_status | varchar | `'trial'` | `'active'`, `'trial'`, `'expired'`, `'bypass'` |
| stripe_customer_id | varchar | — | Stripe customer ID |
| is_restricted | boolean | `false` | Account restriction flag (blocks generation) |
| team_id | uuid (FK teams) | — | Assigned team (nullable — unassigned users) |
| preferences | jsonb | `'{}'` | User preferences (appearance, templates) |
| created_at | timestamptz | `NOW()` | Account creation date |
| updated_at | timestamptz | `NOW()` | Last profile update |

**`public.narratives`** — Saved warranty narratives

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid (PK) | `gen_random_uuid()` | Narrative ID |
| user_id | uuid (FK public.users) | NOT NULL | Owner |
| ro_number | varchar | — | Repair order number |
| vehicle_year | integer | — | Vehicle year |
| vehicle_make | varchar | — | Vehicle make |
| vehicle_model | varchar | — | Vehicle model |
| concern | text | — | Concern section |
| cause | text | — | Cause section |
| correction | text | — | Correction section |
| full_narrative | text | — | Block format (full paragraph) |
| story_type | varchar | NOT NULL | `'diagnostic_only'` or `'repair_complete'` |
| created_at | timestamptz | `NOW()` | First save date |
| updated_at | timestamptz | `NOW()` | Last save date |

**No unique constraint** on (user_id, ro_number) — same RO# can have both diagnostic and repair entries as separate rows. Saves use INSERT only — never upsert.

**`public.activity_log`** — User activity tracking

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid (PK) | `gen_random_uuid()` | Log entry ID |
| user_id | uuid (FK **public.users**) | NOT NULL | User who performed action |
| action_type | varchar | NOT NULL | generate, save, export_pdf, proofread, customize, login, etc. |
| story_type | varchar | — | Story type context |
| input_data | jsonb | — | Request metadata |
| output_preview | text | — | Response preview |
| metadata | jsonb | `'{}'` | Vehicle info, RO#, narrative preview (500 chars) |
| created_at | timestamptz | `NOW()` | Action timestamp |

**CRITICAL:** FK on `activity_log.user_id` points to `public.users(id)`, NOT `auth.users(id)`. Required for PostgREST joins.

**`public.saved_repairs`** — Repair template storage

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid (PK) | `gen_random_uuid()` | Template ID |
| user_id | uuid (FK auth.users) | NOT NULL | Owner |
| template_name | text | NOT NULL | User-chosen name |
| story_type | text | NOT NULL | `'diagnostic_only'` or `'repair_complete'` |
| codes_present | text | — | Saved field value |
| codes_present_option | text | `'include'` | Dropdown state |
| diagnostics_performed | text | — | Saved field value |
| diagnostics_option | text | `'include'` | Dropdown state |
| root_cause | text | — | Saved field value |
| root_cause_option | text | `'include'` | Dropdown state |
| repair_performed | text | — | Saved field value |
| repair_option | text | — | Dropdown state |
| repair_verification | text | — | Saved field value |
| verification_option | text | — | Dropdown state |
| recommended_action | text | — | Saved field value |
| recommended_option | text | — | Dropdown state |
| created_at | timestamptz | `NOW()` | Creation date |
| updated_at | timestamptz | `NOW()` | Last update |

Vehicle info columns (year, make, model, customer_concern) exist in schema but are always null — templates are vehicle-agnostic.

**`public.teams`** — Team management

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid (PK) | `gen_random_uuid()` | Team ID |
| name | text | NOT NULL | Team display name |
| access_code | text | NOT NULL | Unique signup access code (auto-generated) |
| description | text | — | Optional team description |
| created_by | uuid (FK auth.users) | — | Owner who created the team |
| created_at | timestamptz | `NOW()` | Creation date |
| is_active | boolean | `true` | Soft-delete flag |

**`public.team_members`** — Team membership junction table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid (PK) | `gen_random_uuid()` | Membership ID |
| team_id | uuid (FK teams) | NOT NULL | Team reference |
| user_id | uuid (FK auth.users) | NOT NULL | User reference |
| added_by | uuid (FK auth.users) | — | Who added this member |
| created_at | timestamptz | `NOW()` | Join date |

UNIQUE constraint on (team_id, user_id) prevents duplicate membership.

**`public.api_usage_log`** — Gemini API token usage tracking

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid (PK) | `gen_random_uuid()` | Log entry ID |
| user_id | uuid | — | User who triggered the call |
| action_type | text | NOT NULL | generate, customize, proofread, apply-edits, update-narrative, convert-recommendation |
| prompt_tokens | integer | `0` | Input tokens consumed |
| completion_tokens | integer | `0` | Output tokens consumed |
| total_tokens | integer | `0` | Total tokens |
| model_name | text | `'gemini-3-flash-preview'` | AI model used |
| estimated_cost_usd | numeric | `0` | Calculated cost ($0.50/1M input, $3.00/1M output) |
| created_at | timestamptz | `NOW()` | Timestamp |

### 7.2 Migrations (Chronological Order)

| # | Migration File | What It Creates/Modifies |
|---|---------------|--------------------------|
| 1 | `001_initial_schema.sql` | users, narratives, auto-profile trigger, RLS policies |
| 2 | `002_add_name_fields_and_position_update.sql` | first_name, last_name columns |
| 3 | `003_narrative_upsert_support.sql` | updated_at, dedup, unique constraint, UPDATE policy |
| 4 | `004_admin_role_and_activity_log.sql` | role, is_restricted, activity_log table, admin RLS, is_admin() |
| 5 | `005_saved_repairs.sql` | saved_repairs table + RLS |
| 6 | `006_drop_narrative_unique_constraint.sql` | Drops unique(user_id, ro_number) for multi-entry support |
| 7 | `fix_activity_log_user_fk_to_public_users` | Redirects activity_log FK from auth.users → public.users |
| 8 | `create_token_usage_table` | Legacy token tracking (superseded by api_usage_log) |
| 9 | `create_groups_table` | Initial group management tables |
| 10 | `rename_groups_to_teams` | Renames groups → teams across all tables/columns |
| 11 | `009_api_usage_log.sql` | api_usage_log table with token tracking and cost estimation |

**Manual SQL also applied:**
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);
ALTER TABLE api_usage_log ALTER COLUMN model_name SET DEFAULT 'gemini-3-flash-preview';
```

### 7.3 RLS Policies
- All tables have Row Level Security enabled
- Users can only read/write their own data (SELECT/INSERT/UPDATE on `auth.uid() = id`)
- Admin-level operations use the service role client (`SUPABASE_SERVICE_ROLE_KEY`) which bypasses RLS
- `is_admin()` helper function provides expanded SELECT access on users and activity_log for admin-role users

### 7.4 Legacy Table
`public.token_usage` — created before `api_usage_log`, no longer actively used. Default model_name still shows `gemini-2.0-flash`. Consider dropping during a future cleanup.

---

## 8. API Route Inventory (21 Routes)

### AI Routes (Token-Instrumented)

All 6 AI routes log token usage to `api_usage_log` via `src/lib/usageLogger.ts` after every successful Gemini call.

| Route | Method | Purpose | Auth | Notes |
|-------|--------|---------|------|-------|
| `/api/generate` | POST | AI narrative generation | Session + restriction check | Rate limited: 20/15min, 10K char input limit |
| `/api/customize` | POST | AI narrative customization | Session | Modifies current narrative (preserves edits) |
| `/api/proofread` | POST | AI story-type-aware audit | Session | Selects prompt based on storyType |
| `/api/apply-edits` | POST | Apply selected proofread edits | Session | Only checked suggestions applied |
| `/api/update-narrative` | POST | Diagnostic → Repair Complete update | Session | Preserves original diagnostic detail |
| `/api/convert-recommendation` | POST | Tense conversion | Session | **Route exists but unused by frontend** |

### Data Routes

| Route | Method | Purpose | Auth | Notes |
|-------|--------|---------|------|-------|
| `/api/narratives` | GET | Fetch user's saved narratives | Session (cookies) | Ordered by updated_at desc |
| `/api/narratives/save` | POST | Save narrative (INSERT only) | Session (cookies) | Never upsert — separate rows per type |
| `/api/saved-repairs` | GET/POST | List/create repair templates | Session | Ordered by updated_at desc |
| `/api/saved-repairs/[id]` | PUT/DELETE | Update/delete individual template | Session | Ownership verified |

### Export Routes

| Route | Method | Purpose | Auth | Notes |
|-------|--------|---------|------|-------|
| `/api/export-pdf` | POST | PDF document generation | Session | jsPDF, Helvetica font |
| `/api/export-docx` | POST | Word document generation | Session | docx package, Arial font |
| `/api/send-email` | POST | Email via Resend | Session | Up to 10 recipients, HTML + plain text |

### Payment & Auth Routes

| Route | Method | Purpose | Auth | Notes |
|-------|--------|---------|------|-------|
| `/api/stripe` | POST | Checkout session + access code bypass + team auto-assignment | Session | Validates global code + team codes |
| `/api/stripe/webhook` | POST | Stripe event handler | Stripe signature | checkout.session.completed, subscription events |
| `/auth/callback` | GET | Supabase PKCE code exchange | — | Email confirmation callback |

### Admin/Owner Routes

| Route | Method | Purpose | Auth | Notes |
|-------|--------|---------|------|-------|
| `/api/admin` | POST | User management + team management (12 actions) | Owner role | Service role client |
| `/api/admin/analytics` | GET | Analytics data with time range | Owner role | ?range=7/30/90/all |
| `/api/admin/usage` | GET | Gemini API token usage stats | Owner role | Aggregated from api_usage_log |
| `/api/teams` | GET/POST/PUT/DELETE | Team CRUD operations | Admin+ | Team managers can view their teams |

### Utility Routes

| Route | Method | Purpose | Auth | Notes |
|-------|--------|---------|------|-------|
| `/api/support` | POST | Support ticket submission | Session | |
| `/api/delete-account` | POST | Self-service account deletion | Session | Service role client |

---

## 9. AI Prompt System

### 9.1 Overview

All AI calls use the `gemini-3-flash-preview` model with a max output of 8192 tokens. System prompts are stored in `src/constants/prompts.ts`. Full prompt logic is documented in `ServiceDraft_AI_Prompt_Logic_v2_1.md`.

### 9.2 Generation Prompts

| Story Type | System Prompt Constant | Correction Tense |
|-----------|----------------------|-------------------|
| Diagnostic Only | `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` | Future/recommended ("RECOMMEND REPLACING...") |
| Repair Complete | `REPAIR_COMPLETE_SYSTEM_PROMPT` | Past/completed ("REPLACED THE...") |

**Key rules in both prompts:**
- Professional warranty-appropriate tone, all text FULLY CAPITALIZED
- OEM terminology: Identify manufacturer from MAKE, use manufacturer-specific practices/names/tools
- Technical detail preservation: ALL specific data points VERBATIM (terminal numbers, voltages, connector IDs, etc.)
- NEVER use "damaged" or language implying external force/customer misuse/abuse/neglect
- NEVER fabricate document IDs, reference numbers, TSB numbers
- Natural flowing paragraph — not bullet points

### 9.3 Proofread Prompts (Story-Type-Aware)

| Story Type | Prompt | Purpose | Criteria Count |
|-----------|--------|---------|----------------|
| Repair Complete | `PROOFREAD_SYSTEM_PROMPT` | Warranty audit compliance | 9 criteria |
| Diagnostic Only | `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` | Authorization-readiness optimization | 10 criteria |

Diagnostic proofread does NOT flag for missing completed repairs — evaluates diagnostic evidence strength, justification for authorization, and repair sellability.

### 9.4 Customization System

- Post-generation: 3 sliders (Length/Tone/Detail) + custom text (50 char max) modify the CURRENTLY DISPLAYED narrative
- Pre-generation: Same modifier constants appended to compiled data block before generation
- Constants: `LENGTH_MODIFIERS`, `TONE_MODIFIERS`, `DETAIL_MODIFIERS` in `prompts.ts`

### 9.5 Response Formats

**Standard 4-key** (Generate, Customize, Apply Edits, Update):
```json
{ "block_narrative": "...", "concern": "...", "cause": "...", "correction": "..." }
```

**Proofread**:
```json
{
  "flagged_issues": ["Issue with [[snippet marker]]"],
  "suggested_edits": ["Suggested fix"],
  "overall_rating": "PASS | NEEDS_REVIEW | FAIL",
  "summary": "Overall assessment"
}
```

---

## 10. Export System

### 10.1 Export Formats

| Format | Trigger | Implementation | Notes |
|--------|---------|---------------|-------|
| Copy to Clipboard | Copy button | `navigator.clipboard.writeText()` | Plain text, auto-save first |
| Print | Print button | `buildPrintHtml()` → `window.print()` | Professional HTML layout, auto-save first |
| PDF | PDF button | `/api/export-pdf` → jsPDF | Helvetica font, US Letter, auto-save first |
| Word (.docx) | DOCX button | `/api/export-docx` → docx package | Arial font, auto-save first |
| Email | Email button | `/api/send-email` → Resend | HTML + plain text, up to 10 recipients, auto-save first |

### 10.2 Document Layout (Identical Across All Formats)

1. **Footer logo**: `ServiceDraft-Ai Vector Logo.png` — bottom-right, 2.09:1 aspect ratio
2. **Two-column header**: LEFT = "Vehicle Information:" (bold underlined) + YEAR/MAKE/MODEL; RIGHT = "Repair Order #:" (bold underlined) + R.O. # (20pt bold)
3. **Title**: "REPAIR NARRATIVE" — 18pt bold underlined, centered
4. **C/C/C sections**: Headers at 13pt bold italic underlined, body at 11pt regular
5. **Block format**: Same header/title, then 11pt flowing paragraph

### 10.3 Shared Export Utility

`src/lib/exportUtils.ts` provides `ExportPayload` interface, `downloadExport()`, `buildPrintHtml()`, `buildEmailHtml()`, `buildPlainTextEmail()` — used by both `ShareExportModal` (narrative page) and `NarrativeDetailModal` (dashboard) for identical output.

---

## 11. Visual Design System

### 11.1 Design Aesthetic: "Premium Dark Automotive Tech"
- Dark foundation (pure black #000000 base with deep purple-tinted surfaces)
- 9 selectable accent colors: Violet (default `#9333ea`), Red, Orange, Yellow, Green, Blue, Pink, White, Black
- All colors via CSS custom properties — **no hardcoded hex values in components**
- White accent forces dark mode; Black accent forces light mode
- Dynamic theming via ThemeProvider context + Supabase preferences persistence + localStorage instant-load

### 11.2 Typography
- **Headings/UI**: Orbitron (via `next/font/google`, weight 600, tracking 0.04em, **italic**)
- **Data/Input**: Inter (via `next/font/google`, weight 400, tracking 0.01em, `.font-data` class)

### 11.3 Background Animations
- **Landing/Auth**: Sine wave canvas (`WaveBackground.tsx`) — reads `--wave-color` CSS variable
- **Protected pages**: Particle network canvas (`ParticleNetwork.tsx`) — toggleable, re-reads color every 2s
- **Hero area**: 5-layer reactive sine waves — amplitude responds to user activity via `useActivityPulse`

### 11.4 Card System: "Liquid" Material
- Glassmorphism with `backdrop-blur-sm`, border `var(--card-border)`, radius 23px
- Cursor underglow effect (`CursorGlow.tsx`) — radial gradient follows mouse at 15% opacity
- **No hover enlargement** on cards — underglow replaces scale hover (keeps layout stable)

### 11.5 Hero Area + Navigation (164px Fixed Header)
- **Hero** (100px, fixed, z-90): Reactive sine wave + oversized floating logo (409px, z-110, pointer-events-none, clickable link to main menu)
- **NavBar** (64px, fixed, z-100): MAIN MENU button (left, accent-tinted), centered vector logo with theme-aware CSS filter, "v1.0.0-beta" label, theme toggle + UserPopup (right)
- **Content**: `paddingTop: 164px`, `min-height: calc(100vh - 164px)`, z-30

### 11.6 Z-Index Layers
| Z | Element |
|---|---------|
| 10 | Background animations (ParticleNetwork, WaveBackground) |
| 30 | Page content (`<main>`) |
| 90 | Hero area |
| 100 | NavBar |
| 110 | Floating hero logo |
| 9999 | Modal portals, toast notifications |

### 11.7 Data Table Styling
- Center-aligned headers and cells (except long text columns → left-aligned)
- Email truncation: `max-w-[180px]` with `text-ellipsis` and `title` tooltip
- Glowing row hover: JS-driven `boxShadow` + `backgroundColor` with 200ms transition
- Applied uniformly across all tables on both dashboards

For complete design specifications, see `ServiceDraft_AI_UI_Design_Spec_v2_1.md`.

---

## 12. State Management Architecture

### 12.1 Narrative Store (`src/stores/narrativeStore.ts`)
- **Pattern**: Module-level global state with `useSyncExternalStore` hook
- **Persists across route transitions** — NOT torn down on navigation
- Stores: storyType, fieldValues, dropdownSelections, roNumber, compiledDataBlock, narrative (4-key), displayFormat, slider positions, customInstructions, generationId, isSaved, savedNarrativeId
- Key actions: `setStoryType()`, `setNarrative()`, `clearForNewGeneration()`, `markSaved()`, `setForRepairUpdate()`, `clearFormFields()`

### 12.2 Auth Hook (`src/hooks/useAuth.ts`)
- **Pattern**: Module-level singleton (same as narrativeStore)
- Auth subscription persists for app lifetime — NEVER torn down during navigation
- Exports: `user`, `profile` (includes role, team_id, preferences), `loading`, `signOut()`, `refreshProfile()`

### 12.3 Theme Provider (`src/components/ThemeProvider.tsx`)
- **Pattern**: React context wrapping the entire app
- Manages: accent color, color mode (dark/light), background animation toggle
- Applies 40+ CSS variables to `:root` via `buildCssVars()`
- Persistence: localStorage (instant) + Supabase JSONB (cross-device)

### 12.4 Activity Pulse (`src/hooks/useActivityPulse.ts`)
- **Pattern**: Module-level shared amplitude state
- Receives intensity dispatches from UI events (typing, clicking, generating)
- Read by `HeroArea.tsx` in `requestAnimationFrame` loop for reactive wave animation

---

## 13. Security & Rate Limiting

### 13.1 Rate Limiting
- In-memory store (`src/lib/rateLimit.ts`) — resets on server restart
- `/api/generate`: 20 requests per user per 15 minutes
- Input length limit: compiled data block capped at 10,000 characters

### 13.2 Security Headers (`next.config.ts`)
- Content-Security-Policy, X-Frame-Options (DENY), X-Content-Type-Options (nosniff)
- Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy
- CSP allows: Stripe JS, Google Fonts, Supabase, Gemini API, Resend API

### 13.3 Authentication
- All API routes (except Stripe webhook) require authenticated Supabase session via server client
- Admin/Owner routes verify role from `users` table after auth check
- `/api/generate` additionally checks `is_restricted` flag — restricted users get 403

### 13.4 Access Code Security
- Global code read from `ACCESS_CODE` environment variable — no hardcoded defaults
- Team codes stored in `teams.access_code` column — auto-generated on team creation
- Access codes bypass Stripe payment (set `subscription_status = 'bypass'`)

---

## 14. Feature Matrix

### Core Features (All Complete)

| Feature | Page | Status |
|---------|------|--------|
| Email/password authentication | Auth | ✅ |
| Stripe paywall + access code bypass | Sign Up | ✅ |
| Team auto-assignment via team access code | Sign Up | ✅ |
| Profile creation (name, US state dropdown, position, accent color) | Sign Up | ✅ |
| Terms of Use acceptance | Sign Up | ✅ |
| 8-hour auto-logout session expiry | All protected | ✅ |
| Main menu navigation hub with role-based buttons | Main Menu | ✅ |
| Owner Dashboard button (owner only, gold/amber) | Main Menu | ✅ |
| Team Dashboard button (admin only) | Main Menu | ✅ |
| FAQ/Info modal (15 Q&As) | Main Menu | ✅ |
| Support ticket form | Main Menu | ✅ |
| Terms of Use display (11 sections) | Main Menu | ✅ |
| Story type selection (Diagnostic/Repair) with field preservation | Input | ✅ |
| Required field validation (1-5) | Input | ✅ |
| Conditional field dropdowns (6+) with Include/Don't Include/Generate | Input | ✅ |
| Auto-expanding textareas | Input | ✅ |
| Pre-generation output customization (3 sliders, localStorage persist) | Input | ✅ |
| Repair templates (save/load/edit/delete, vehicle-agnostic) | Input | ✅ |
| Clear form button | Input | ✅ |
| AI narrative generation (4-key JSON, OEM terminology) | Narrative | ✅ |
| Typing animation with skip function | Narrative | ✅ |
| C/C/C format as default, block format toggle (no API call) | Narrative | ✅ |
| AI customization sliders (3 + custom text, 50 char max) | Narrative | ✅ |
| Story-type-aware proofread with snippet highlighting (30s fade) | Narrative | ✅ |
| Selective apply for suggested edits (checkboxes + select all) | Narrative | ✅ |
| Audit rating badge (PASS / NEEDS_REVIEW / FAIL) | Narrative | ✅ |
| Edit story modal (auto-sizing textareas) | Narrative | ✅ |
| Save to database (INSERT — separate rows per type per RO#) | Narrative | ✅ |
| Navigation guard (beforeunload + click capture + custom modal) | Narrative | ✅ |
| Auto-save before exports | Narrative | ✅ |
| Copy to clipboard | Narrative/Dashboard | ✅ |
| Print (professional format) | Narrative/Dashboard | ✅ |
| Download as PDF (jsPDF, Helvetica) | Narrative/Dashboard | ✅ |
| Download as Word .docx (docx package, Arial) | Narrative/Dashboard | ✅ |
| Email narrative (Resend, up to 10 recipients, HTML + plain text) | Narrative/Dashboard | ✅ |
| Saved narrative history with multi-column search/sort/filter | Dashboard | ✅ |
| Profile management (name, location, position) | Dashboard | ✅ |
| Password change | Dashboard | ✅ |
| Delete account (2-step confirmation, service role) | Dashboard | ✅ |
| Accent color picker (9 colors) | Dashboard Prefs | ✅ |
| Dark/light mode toggle (White forces dark, Black forces light) | Dashboard Prefs | ✅ |
| Particle network animation toggle | Dashboard Prefs | ✅ |
| Preferences persistence (Supabase JSONB + localStorage) | Dashboard Prefs | ✅ |
| Diagnostic → Repair Complete update flow | Dashboard | ✅ |
| "Completed Recommended Repair" convenience button | Dashboard | ✅ |
| Story type badges in history table (green=Repair, blue=Diagnostic) | Dashboard | ✅ |
| Owner Dashboard — 6 tabs (Overview, Activity Log, User Mgmt, Analytics, API Usage, Settings) | Admin | ✅ |
| Activity logging (10+ action types with enriched metadata) | Admin | ✅ |
| Activity Detail Modal (shared component, both dashboards) | Admin | ✅ |
| User management (restrict, delete, subscription, password reset, promote/demote) | Admin | ✅ |
| Protected user system (hvcadip@gmail.com) | Admin | ✅ |
| Analytics with Recharts (6 chart types, time range selector) | Admin | ✅ |
| Gemini API token usage tracking with cost estimation | Admin | ✅ |
| Token Calculator pricing estimator widget | Admin | ✅ |
| Team management (create team, assign users, auto-generated access codes) | Admin | ✅ |
| Team Dashboard — 2 tabs (Team Members, Activity Log) | Team Dashboard | ✅ |
| Remove member from team | Team Dashboard | ✅ |
| 3-tier role hierarchy (owner/admin/user) with all access gates | System | ✅ |
| Rate limiting on generate (20/15min) | API | ✅ |
| CSP + security headers | Config | ✅ |
| Toast notifications (themed, deduped) | All | ✅ |
| 9-color accent theming system with 40+ CSS variables | All | ✅ |
| Sine wave + particle network backgrounds (accent-reactive) | All | ✅ |
| Glassmorphism cards + cursor underglow | All | ✅ |
| Framer Motion animations (spring transitions, page entrances) | All | ✅ |
| NavBar glowing hover animations | All | ✅ |
| Data table styling (center align, email truncation, row glow) | Dashboards | ✅ |
| Position-based icon system (6 positions + fallback) | All | ✅ |
| Mobile responsive design (desktop-first) | All | ✅ |
| Error boundaries | All protected | ✅ |
| Token usage instrumentation on all 6 AI routes | API | ✅ |

### Planned (Post-Beta)

| Feature | Priority |
|---------|----------|
| Re-enable email confirmation for production | Pre-launch |
| Switch Stripe to live mode | Pre-launch |
| Page-specific Help/Instructions system | Next sprint |
| Enhanced group analytics in Team Dashboard | Next sprint |
| Voice dictation via Whisper API | Future |
| Image capture with OCR for diagnostic screens | Future |
| Batch narrative processing | Future |
| Google Doc export option | Future |
| PWA capabilities (installable, offline) | Future |
| Expo/React Native mobile app | Future |
| Multi-tool platform expansion (RepairSuite.ai) | Long-term |

---

## 15. Complete Workflow Diagrams

**LANDING PAGE**
```
├── LOGIN → Sign In → Check Onboarding → MAIN MENU
└── REQUEST ACCESS → Sign Up Flow
    ├── 1. Account Creation (Email/Password)
    ├── 2. Access Code (global OR team-specific) / Stripe Payment
    │   └── Team code match → auto-assign to team
    ├── 3. Profile Creation (name, location, position, accent color, terms)
    └── → MAIN MENU
```

**MAIN MENU (Hub — Role-Based)**
```
├── GENERATE NEW STORY → INPUT PAGE                    [All users]
├── USER DASHBOARD → DASHBOARD                         [All users]
├── OWNER DASHBOARD → ADMIN PAGE                       [Owner only]
├── TEAM DASHBOARD → TEAM DASHBOARD PAGE               [Admin only]
├── FAQ/INFO → Info Modal (15 Q&As)                    [All users]
├── SUPPORT → Ticket Form                              [All users]
├── TERMS OF USE → Terms Modal (11 sections)           [All users]
└── LOG OUT → LANDING PAGE                             [All users]
```

**INPUT PAGE**
```
├── Select Story Type (Diagnostic/Repair) — preserves shared fields on switch
├── Fill Required Fields 1-5
├── Fill/Configure Fields 6+ (with Include/Don't Include/Generate dropdown)
├── [Optional] Pre-Gen Customization (Length/Tone/Detail sliders)
├── [Optional] Load from REPAIR TEMPLATES (slide-out panel)
├── [Optional] CLEAR FORM (resets values, keeps story type)
├── GENERATE STORY (enabled when all validation passes)
│   └── [LOADING] → Auth + Restriction + Rate Limit → Gemini → NARRATIVE PAGE
└── MAIN MENU → MAIN MENU
```

**GENERATED NARRATIVE PAGE**
```
├── [TYPING ANIMATION] → Text fills display (with skip button)
├── View Narrative (C/C/C format default)
├── Toggle Format Button (switches view — NO API call)
├── REGENERATE → [LOADING] → Re-call API with original compiled data block
├── AI Customization → Sliders + Custom Text → Apply to CURRENT narrative
├── REVIEW & PROOFREAD → [LOADING] → Story-type-aware audit
│   ├── Proofread Results with snippet highlighting (30s fade)
│   └── Select Edits (checkboxes) → APPLY SELECTED EDITS → modified narrative
├── EDIT STORY → Edit Modal (auto-sizing textareas) → Save Changes
├── SAVE STORY → Database INSERT → Toast → Navigation guards disabled
├── SHARE/EXPORT → Auto-save first → Copy/Print/PDF/DOCX/Email
├── NEW STORY → Confirmation Dialog → Clear store → MAIN MENU
└── [Navigation Guard if unsaved — beforeunload + click capture + custom modal]
```

**USER DASHBOARD**
```
├── Profile Section → UPDATE → Edit Modal
│   ├── Change Password
│   └── Delete Account (2-step confirmation)
├── History Table → Search/Sort/Filter
│   ├── Click Row → View Modal (READ ONLY)
│   │   ├── SHARE/EXPORT → Copy/Print/PDF/DOCX/Email
│   │   └── UPDATE WITH REPAIR (diagnostic only) → Update Modal
│   │       ├── Fill Repair Details (or toggle "Completed Recommended Repair")
│   │       └── GENERATE NARRATIVE → NARRATIVE PAGE (new repair-complete entry)
├── Preferences → App Appearance modal / My Saved Repairs modal
└── MAIN MENU → MAIN MENU
```

**OWNER DASHBOARD (Owner Only)**
```
├── Overview → 8 Metric Cards + Charts + System Health
├── Activity Log → Filter/Search → Click Row → Activity Detail Modal
├── User Management → Search/Sort → CRUD Actions per user
│   ├── CREATE TEAM → Name input → Auto-generated access code
│   └── Assign to Team → Team dropdown with member counts
├── Analytics → Time Range + 6 Recharts Charts
├── API Usage → Token stats + Cost charts + Top users + Action breakdown
└── Settings → Token Calculator + Access Code + System Info
```

**TEAM DASHBOARD (Admin Only)**
```
├── Team Members → Member table → Remove from Team action
└── Activity Log → Team-scoped activity → Click Row → Activity Detail Modal
```

---

## 16. Project Knowledge Files

| Document | Version | Purpose |
|----------|---------|---------|
| **ServiceDraft_AI_Project_Instructions** | v2.1 | How to work with Tyler, app overview, workflow, communication rules |
| **ServiceDraft_AI_Spec** | v2.1 | This file — detailed specs, schema, features, workflows |
| **ServiceDraft_AI_Prompt_Logic** | v2.1 | All AI prompts, dropdown logic, customization, JSON structures, data flow |
| **ServiceDraft_AI_UI_Design_Spec** | v2.1 | Visual design system — colors, typography, theming, animations, components |
| **CLAUDE_CODE_BUILD_INSTRUCTIONS** | v2.1 | Architecture reference, coding standards, TypeScript interfaces, sprint guide |
| **BUILD_PROGRESS_TRACKER** | Living | Living document tracking all completed and remaining work |
| **PRE_BUILD_SETUP_CHECKLIST** | v2.1 | Setup guide for accounts, tools, environment, deployment, troubleshooting |
| **DEPLOYMENT_NOTES** | — | Environment variables, Supabase config, Stripe setup, security |

---

*— End of Specification Document v2.1 —*
