# SERVICEDRAFT.AI — FUNCTIONAL SPECIFICATION

**Top-to-bottom functional specification of the ServiceDraft.AI web application.**

This document is the canonical "what this app does" reference. It describes every page, every feature, every workflow, every data structure, and every API route — but at the functional / specification level rather than the implementation level. For the exact code patterns and protected files, see `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`. For the AI prompt text, see `ServiceDraft_AI_Prompt_Logic.md`. For the visual design, see `ServiceDraft_AI_UI_Design_Spec.md`.

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
9. [AI Prompt System (Summary)](#9-ai-prompt-system-summary)
10. [Export System](#10-export-system)
11. [Visual Design System (Summary)](#11-visual-design-system-summary)
12. [State Management Architecture](#12-state-management-architecture)
13. [Security & Rate Limiting](#13-security--rate-limiting)
14. [Version Management System](#14-version-management-system)
15. [Feature Matrix](#15-feature-matrix)
16. [Complete Workflow Diagrams](#16-complete-workflow-diagrams)
17. [Project Knowledge Files](#17-project-knowledge-files)

---

## 1. Executive Summary

**ServiceDraft.AI** is a web-based SaaS application that helps automotive service technicians transform raw diagnostic and repair notes into professional, audit-proof warranty narratives using AI. The app is currently live in production at `https://servicedraft.ai` and in active beta use at dealership service departments.

The core value proposition: technicians spend hours writing warranty narratives that often fail manufacturer audits because of poor language choices, missing diagnostic justification, or inconsistent terminology. ServiceDraft.AI takes a technician's plain-language input — a few fields describing the vehicle, the customer concern, the diagnostic process, and the repair — and produces a polished, professionally worded warranty narrative in the exact format manufacturers expect. The result passes warranty audits more reliably, saves the technician time, and helps the dealership recover more warranty dollars.

The app also serves a second use case: pre-repair authorization support. When a technician has completed diagnostics but not yet performed the repair, the "Diagnostic Only" story type generates a narrative specifically optimized to justify the recommended repair — useful for customer approval, extended warranty authorization, or manufacturer pre-authorization requests. This narrative type is audited against different criteria (justification strength rather than repair documentation) and helps service advisors sell the repair to customers.

ServiceDraft.AI uses Google's Gemini API for narrative generation and is built by a single automotive-technician-turned-developer using Claude as an architectural partner and Claude Code for implementation. The app is architected around a strict 3-tier role system (Owner, Admin/Team Manager, Standard User), a team-based multi-tenant structure, a comprehensive activity and token-usage logging system, and an OTP-based signup flow that replaced an earlier PKCE/magic-link flow after cross-browser verification issues.

---

## 2. Project Overview

### Who it's for

Primary users are automotive service technicians at dealerships, particularly those working within a manufacturer warranty program. Secondary users include:

- **Service advisors** who need to present repair justifications to customers
- **Service managers** who oversee warranty claim submissions
- **Warranty clerks** who review and submit warranty paperwork
- **Foremen / diagnosticians** who mentor other techs and review their work
- **Dealership owners / GMs** who want to improve warranty recovery rates

The app's design philosophy reflects its target audience: clean, professional, tech-forward, and built for people who spend their day around vehicles. The aesthetic is meant to feel more like a modern scan tool than a generic SaaS dashboard.

### Core user journey

1. Technician logs in and clicks "Generate Story"
2. Picks story type: **Diagnostic Only** (repair not yet performed) or **Repair Complete** (repair done)
3. Fills in vehicle info, customer concern, and diagnostic/repair details
4. For each conditional field, picks `Include Information` (type the content), `Don't Include Information` (skip entirely), or `Generate Applicable Info` (let the AI infer it)
5. Optionally adjusts length/tone/detail sliders before generating
6. Clicks "GENERATE NARRATIVE"
7. Reviews the generated narrative on the Narrative Page
8. Optionally runs Proofread (warranty audit or authorization-readiness review)
9. Optionally applies selected edits from the audit results
10. Optionally customizes the narrative (different length, tone, or detail level)
11. Manually edits the narrative if desired via the Edit Story modal
12. Saves the narrative to their history
13. Exports as PDF, DOCX, printable HTML, or email

### Project timeline (high level)

- **Phase 0–10:** Initial build (foundation through polish)
- **Stage 5 Sprints 1–10:** Post-build feature additions (team management, analytics, owner dashboard, role hierarchy restructure)
- **Stage 6 Sprints A–B:** Pre-deployment polish, security audit, token usage instrumentation
- **Live deployment:** Initial launch at servicedraft.ai
- **Post-launch sprints:** OTP signup migration (replaced magic-link/PKCE), comprehensive build instructions update, version automation infrastructure

### Core architectural decisions

1. **Next.js 16 App Router** with server-side API routes for all data operations
2. **Supabase** for auth (OTP-based signup), PostgreSQL database with RLS, and session cookies
3. **Google Gemini** (`gemini-3-flash-preview`) for all AI narrative generation
4. **Strict server-side data access** — browser Supabase client is used ONLY for OTP signup; `useAuth.ts` fetches profile via `GET /api/me`
5. **Dynamic CSS variable theming** with 9 accent colors applied at runtime
6. **Single source of truth for app version** in `src/lib/version.ts` with mandatory per-sprint bumps
7. **Module-level singleton state management** via `useSyncExternalStore` patterns (no Redux, no context for data)

---

## 3. Technology Stack

### Core framework

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| React | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS v4 (CSS-first config) | 4.x |

### Backend services

| Service | Package | Version | Purpose |
|---|---|---|---|
| Database & Auth | `@supabase/supabase-js` / `@supabase/ssr` | 2.95+ / 0.8+ | PostgreSQL, RLS, OTP auth, session cookies |
| AI | `@google/generative-ai` | 0.24+ | `gemini-3-flash-preview` for narrative generation |
| Payments | `stripe` | 20.3.1 | Subscription billing + access code bypass |
| Email | `resend` | 6.9.2 | Transactional email (exports + password resets) |

### Frontend libraries

| Package | Version | Purpose |
|---|---|---|
| `framer-motion` | 12.34+ | Page transitions, micro-interactions, modal animations |
| `recharts` | 3.8+ | Owner Dashboard analytics charts (Line, Bar, Pie, Area) |
| `jspdf` | 4.2+ | Server-side PDF export generation |
| `docx` | 9.5+ | Server-side Word DOCX export generation |
| `lucide-react` | 0.564+ | SVG icon library (including position-based icons) |
| `react-hot-toast` | 2.6+ | Toast notification system |

### Infrastructure

| Layer | Provider | Notes |
|---|---|---|
| Hosting | Vercel | Currently Hobby plan — upgrade to Pro required before charging customers (Hobby prohibits commercial use) |
| DNS | Cloudflare | Proxy must be **DISABLED** (grey cloud / DNS-only) — orange cloud breaks Vercel domain verification |
| Version control | GitHub | `github.com/Tcloyd30689/servicedraft-ai`, main branch, auto-deploys to Vercel on push |
| Database | Supabase | Project ID `ejhcirejshqpctfqeawi` |

### Environment variables (required)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, bypasses RLS) |
| `GEMINI_API_KEY` | Google Generative AI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Environment variables (optional but recommended)

| Variable | Purpose |
|---|---|
| `ACCESS_CODE` | Beta access code for signup bypass (e.g., `WHISLER-BETA-2026`) |
| `NEXT_PUBLIC_APP_URL` | **MUST be `https://servicedraft.ai`** (non-www) for canonical auth redirects |
| `RESEND_API_KEY` | Resend email service API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe subscription price ID |

---

## 4. User Role Hierarchy

ServiceDraft.AI uses a **3-tier role system** that replaced an earlier 2-tier system in Stage 5 Sprint 8. All access gates, API routes, badges, promote/demote logic, and conditional UI rendering check for the correct role string.

### Role matrix

| Role | Display Label | Access Level |
|---|---|---|
| `owner` | Platform Owner | Full system access: Owner Dashboard, all admin actions, team management, user management, analytics, API usage tracking, all team activity |
| `admin` | Team Manager | Team Dashboard access: view team members, team activity log, team-scoped data — can manage their own team only |
| `user` | Standard User | Generate narratives, manage own profile, use saved repair templates, access own narrative history |

### Role enforcement

- **Client-side:** Role-based navigation buttons on Main Menu page, conditional UserPopup links, role badges throughout the UI
- **Middleware:** Protected routes check for authenticated session; role-specific routes verify on page load
- **API level:** Every role-gated API route verifies the caller's role via the server-side Supabase client before executing

### Role transitions

Only the Platform Owner can change a user's role via the Owner Dashboard User Management tab:

| Action | Effect |
|---|---|
| `promote_to_admin` | user → admin (Team Manager) |
| `demote_to_user` | admin → user |

The `owner` role cannot be assigned through the UI — it's set directly in the database. Currently, Tyler's account (`hvcadip@gmail.com`) is the only owner and is marked as a "Protected User" to prevent accidental self-restriction or deletion.

### Protected user

The owner's email address is hardcoded as a protected user. In the Owner Dashboard User Management table, protected users display a "Protected" badge with a `ShieldCheck` icon instead of the usual delete/restrict action buttons. This is a last-line-of-defense safeguard against accidentally bricking the admin account.

### Team assignment

Independent of role, users can be assigned to a `team_id`. This is used by the Team Dashboard (Team Manager view) and the Owner Dashboard to filter data by team. Users can belong to at most one team at a time.

---

## 5. Authentication & Payment Flows

### Signup flow — 3-step OTP-based onboarding

The signup flow was migrated from a magic-link/PKCE flow to an OTP-based flow after PKCE's browser-scoped `code_verifier` cookie caused cross-browser verification failures. The current flow has **zero browser dependency** on the verification device — the user can receive the email on one device/browser and enter the code on another.

**⚠️ All signup route files and the signup page are PROTECTED FILES. See `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` for the full list.**

#### Step 1 — Email verification via OTP

1. User visits `/signup`, enters email + confirm email
2. Client calls `supabase.auth.signInWithOtp({ email })` via the browser Supabase client
3. Supabase sends an email containing a 6-digit verification code
4. UI transitions to the "enter your code" view
5. User enters the 6-digit code (can be on any device/browser)
6. Client POSTs `{ email, token }` to `/api/signup/verify-otp`
7. Server calls `supabase.auth.verifyOtp({ email, token, type: 'signup' })` — type MUST be `'signup'`, not `'email'`
8. On success, session cookies are set via the SSR library's `setAll()` callback
9. Response includes `{ success: true, userId }`

**Supabase Dashboard requirement:** The "Magic Link" email template MUST include `{{ .Token }}` in its body to display the 6-digit code. If the template only has `{{ .ConfirmationURL }}`, users won't see a code and the flow breaks.

#### Step 2 — Password & profile (combined)

1. User enters: password, first name, last name, location (US state dropdown), position (dropdown: Technician / Foreman / Diagnostician / Advisor / Manager / Warranty Clerk), optional accent color preference
2. Client POSTs all fields to `/api/signup/complete-profile`
3. Server verifies the user is authenticated (session from Step 1 must exist)
4. Server validates: password ≥ 6 chars, first/last name non-empty, position set
5. Server calls `supabase.auth.updateUser({ password })` to set the password
6. Server **upserts** a row into `public.users` with all profile fields (not updates — upsert handles the case where the `handle_new_user` trigger silently failed)

#### Step 3 — Access code activation

1. User enters an access code (e.g., `WHISLER-BETA-2026`) OR is redirected to Stripe checkout (future)
2. Client POSTs `{ teamId }` (if team code was used) to `/api/signup/activate` after access code validation
3. Server verifies authenticated user
4. Server **upserts** the user row with `subscription_status: 'bypass'` and optional `team_id`

### Access code validation hierarchy

When a user enters an access code during Step 3:

1. **First check:** Does the code match the global `ACCESS_CODE` env var? → Set `subscription_status: 'bypass'`, no team assignment
2. **Second check:** Does the code match any `teams.access_code` in the database? → Set `subscription_status: 'bypass'` AND auto-assign to that team (sets `team_id`, creates `team_members` row)
3. **No match:** Redirect to Stripe checkout for paid subscription (not yet fully wired in current build)

### Login flow

1. User visits `/login`, enters email + password
2. Client POSTs to `/api/auth/login`
3. Server calls `supabase.auth.signInWithPassword()` and sets session cookies
4. On success, redirects to `/main-menu`
5. Activity log records `login` action (fire-and-forget)

### Logout flow

1. User clicks "Log Out" in UserPopup dropdown
2. `useAuth.signOut()` clears localStorage theme keys
3. POSTs to `/api/auth/logout` with 3-second race timeout
4. Auth state cleared locally
5. Hard redirect to `/` (not a router.push — guarantees clean state reload)

### Auth callback fallback (`/auth/callback`)

This route still exists as a fallback for users who click the magic link in their email instead of entering the OTP code. It handles two paths:
- `?code=...` — PKCE flow, calls `exchangeCodeForSession()`; if it fails (cross-browser), redirects to `/signup?error=cross-browser`
- `?token_hash=...&type=...` — token-hash flow; if it fails (expired/used), redirects to `/signup?error=link-expired`

Both success paths redirect to `/signup?step=2`. Both use the canonical non-www domain from `NEXT_PUBLIC_APP_URL`.

### www → non-www redirect

`src/middleware.ts` forces all `www.servicedraft.ai` requests to `servicedraft.ai` via a 308 redirect BEFORE any auth processing runs. This exists because session cookies are scoped to the non-www domain; without the redirect, a user who lands on the www subdomain would never see their cookies and would appear permanently logged out.

### Session expiry

`useSessionExpiry` hook tracks session duration against an 8-hour limit:
- At 7.5 hours: warning toast
- At 8 hours: forced sign-out with redirect to login
- Checked every 60 seconds

### Payment flow (Stripe)

Currently only used for access code bypass. Full subscription billing is not yet wired in the beta. When it is:

1. User reaches Step 3 without a valid access code
2. Client calls `/api/stripe` to create a checkout session
3. Redirects to Stripe Checkout
4. On success, Stripe sends a webhook to `/api/stripe/webhook`
5. Webhook verifies signature, updates `users.subscription_status` to `active`
6. User is redirected to `/main-menu`

**⚠️ All Stripe route files are PROTECTED FILES.** Payment logic mistakes can silently grant or revoke access, so changes require the DOUBLE-CHECK PROTOCOL per `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`.

---

## 6. Page Specifications

### 6.1 Landing Page — `/`

**Purpose:** Unauthenticated marketing / entry point

**Components:**
- `WaveBackground` — full-screen sine wave canvas animation
- Cinematic entrance sequence: logo fades in, then title, then CTAs
- "LOG IN" and "SIGN UP" call-to-action buttons (center)
- Footer with Terms of Use link
- No NavBar (pre-auth)

**Access:** Public, no authentication required

### 6.2 Login Page — `/login`

**Purpose:** Return-user authentication

**Components:**
- `WaveBackground` animation
- Centered `LiquidCard` form (max-width ~450px)
- Logo above form card
- Email + Password inputs
- "LOG IN" primary button
- "Forgot password?" link → triggers Resend-branded password reset email
- "Create Account" link → `/signup`

**Access:** Public

**⚠️ PROTECTED FILE.** See build instructions.

### 6.3 Signup Page — `/signup`

**Purpose:** New user onboarding (3-step OTP flow)

**Components:**
- `WaveBackground` animation
- Centered `LiquidCard` form
- 3-step indicator at top (Step 1 / 2 / 3)
- **Step 1 view:** Email + Confirm Email inputs; "SEND CODE" button; after send, transitions to code entry with "Resend Code" option
- **Step 2 view:** Password + Confirm Password + First Name + Last Name + Location (US state dropdown) + Position (dropdown) + Accent Color Picker (9 swatches)
- **Step 3 view:** Access code input; "ACTIVATE" button
- Terms of Use acceptance checkbox (required before Step 2 submission)
- Error states shown below affected fields in red

**Access:** Public

**⚠️ PROTECTED FILE.** See build instructions.

### 6.4 Main Menu Page — `/main-menu`

**Purpose:** Central hub for navigating to the app's primary functions; role-based button visibility

**Components:**
- `HeroArea` + `NavBar` + `ParticleNetwork`
- Centered `LiquidCard` containing a vertical stack of large feature buttons
- Each button is a vertical card with an icon on top and a label below

**Buttons by role:**

| Role | Buttons Visible |
|---|---|
| All users | Generate Story, User Dashboard |
| Admin (Team Manager) | + Team Dashboard (accent-colored, Users icon) |
| Owner | + Owner Dashboard (gold/amber accent, Shield icon) |

The Owner Dashboard button uses distinct gold/amber styling to visually differentiate it from the rest. Both conditional buttons appear directly below the User Dashboard button.

**Access:** Authenticated users only

### 6.5 Input Page — `/input`

**Purpose:** Collect technician input to generate a warranty narrative

**Components:**

- **StoryTypeSelector** (top) — two large selectable cards: "Diagnostic Only" and "Repair Complete"
- **Required fields** (always visible when story type is selected):
  - R.O. # (RO number — never sent to AI, used for display/save/export only)
  - Year, Make, Model (vehicle info)
  - Customer Concern
- **Conditional fields** (6+ depending on story type), each with a dropdown:
  - `Include Information` — field accepts user text
  - `Don't Include Information` — field is hidden, skipped entirely
  - `Generate Applicable Info` — field is hidden, AI is instructed to infer the content
- **Pre-Generation Customization panel** (collapsible) — three sliders (Length, Tone, Detail Level) that append modifier instructions to the generate call
- **MY REPAIRS button** (bottom-right) — opens `MyRepairsPanel` slide-out for loading saved repair templates
- **SAVE AS REPAIR button** — opens `SaveRepairModal` to save current form values as a reusable template
- **GENERATE NARRATIVE button** (large, primary) — submits to `/api/generate`

**Field differences by story type:**
- **Diagnostic Only** (9 fields): ro_number, year, make, model, customer_concern, codes_present, diagnostics_performed, root_cause, recommended_action
- **Repair Complete** (10 fields): adds repair_performed and repair_verification, drops recommended_action

**Shared field preservation:** When the user switches between story types, fields 1–8 (which share IDs) are preserved; only the last 1–2 fields reset.

**Access:** Authenticated users only

### 6.6 Narrative Page — `/narrative`

**Purpose:** Display the generated narrative and provide all post-generation AI actions

**Components:**

- **Narrative Display Card** — shows the generated narrative in either Block format (single paragraph) or C/C/C format (three labeled sections). Format toggle is purely client-side (no API call).
- **Typing animation** on first display (~2 seconds total, skippable on click or any key)
- **Proofread highlights** when proofread results are received — accent-colored backgrounds on flagged snippets that fade out over 30 seconds
- **CustomizationPanel** — three sliders + custom instructions field (max 50 chars with counter)
- **Action button row:**
  - **CUSTOMIZE** — sends current narrative + slider preferences to `/api/customize`
  - **PROOFREAD** — sends current narrative to `/api/proofread` (uses story-type-aware prompt)
  - **EDIT STORY** — opens `EditStoryModal` for manual text editing
  - **NEW STORY** — reset confirmation → navigates back to Input Page
  - **SAVE STORY** — explicit save; disables navigation guards
  - **SHARE / EXPORT** — opens `ShareExportModal`
- **ProofreadResults panel** (appears after proofread) — flagged issues with checkboxes for selective edit application; "APPLY SELECTED EDITS" button
- **Navigation guards** active whenever `isSaved === false`

**Export options (via ShareExportModal):**
- Copy to clipboard
- Print (opens browser print dialog with formatted HTML)
- PDF download
- DOCX download
- Email (opens `EmailExportModal` for multi-recipient entry, max 10)

All exports auto-save the narrative to history before exporting.

**Access:** Authenticated users only

### 6.7 User Dashboard — `/dashboard`

**Purpose:** Personal profile, preferences, narrative history, and saved repair templates

**Tabs:**

#### Profile tab
- `ProfileSection` — large position-based icon (Wrench, Hammer, etc.) + full name + email + location + position
- "Edit Profile" button → opens `EditProfileModal` (first name, last name, location, position)

#### Preferences tab
- **Appearance settings:**
  - `AccentColorPicker` — 9-swatch color picker
  - Dark/Light mode toggle
  - Background animation (ParticleNetwork) on/off toggle
- **Default format preference** — Block or C/C/C (saved to `users.preferences.templates.defaultFormat`)
- "Delete Account" button (destructive) → confirmation → calls `/api/delete-account`

#### Narrative History tab
- `NarrativeHistory` — searchable, sortable, filterable table of saved narratives
- Columns: Date, RO#, Vehicle, Story Type, Actions
- Story type badge (Diagnostic Only / Repair Complete, color-coded)
- Search input (filters by RO#, vehicle, or narrative text)
- Sort by date (newest/oldest) or RO#
- Filter by story type
- Clicking a row opens `NarrativeDetailModal`:
  - Read-only narrative view
  - Export actions (same as Narrative Page)
  - "UPDATE NARRATIVE WITH REPAIR" button (only for diagnostic-only narratives) → opens `UpdateWithRepairModal`

#### Saved Repairs tab
- Grid of saved repair template cards
- Each card shows template name, story type, and a preview of the 5 saved repair fields
- Actions: Load (navigates to Input Page with fields pre-filled), Edit (opens `EditRepairModal`), Delete

**Access:** Authenticated users only

### 6.8 Owner Dashboard — `/admin`

**Purpose:** Platform Owner's command center for managing users, teams, activity, analytics, and API costs

**Access:** Owner role only (verified server-side on every API call; non-owners are redirected)

**Tabs (6):**

#### Overview tab
- 8 metric cards:
  1. Total Users
  2. New Users This Week
  3. New Users This Month
  4. Active Subscriptions
  5. Total Narratives
  6. Narratives This Week
  7. Narratives Today
  8. Total Generations
- **System Health card** — displays `APP_VERSION` from `src/lib/version.ts` (this is the second of two version display points governed by the MANDATORY VERSION BUMP RULE), database row counts, last activity timestamp

#### Activity Log tab
- Paginated table of all user activity across the platform
- Columns: User, Action, Timestamp, Story Type, Vehicle Info, Actions
- Search input, action type filter, sort by date
- Clicking a row opens `ActivityDetailModal` with full metadata (narrative preview, input data, raw JSON view)

#### User Management tab
- Sortable user table with search
- Columns: Name, Email (truncated with tooltip), Role, Subscription, Team, Narrative Count, Last Active, Actions
- Inline row actions (icon buttons):
  - Send password reset (Resend-branded email)
  - Restrict / unrestrict (sets `is_restricted` flag — restricted users cannot generate narratives)
  - Change subscription status (active / trial / expired / bypass)
  - Promote to admin / demote to user
  - Assign to team (opens team assignment modal)
  - Delete user (confirmation required)
- "CREATE TEAM" button in tab header — opens modal with team name input, auto-generates an access code
- Protected user (`hvcadip@gmail.com`) shows "Protected" badge instead of delete/restrict buttons

#### Analytics tab
- Time range selector (7d / 30d / 90d / all)
- Recharts-powered visualizations:
  - LineChart — generation trends over time
  - BarChart — activity by action type
  - PieChart — story type distribution
  - AreaChart — usage over time
- Auto-refreshes every 60 seconds via `setInterval`

#### API Usage tab
- Time range selector (7d / 30d / 90d / all)
- Summary cards: Total Tokens, Total Cost, Average per Call
- Daily token/cost line charts
- Action breakdown (pie chart of tokens by action type)
- Top users leaderboard (by token consumption)

#### Settings tab
- **Token Calculator widget** — interactive pricing estimator with model selector, input/output token count fields, and real-time cost display
- Current `ACCESS_CODE` display (read from env via API)

### 6.9 Team Dashboard — `/team-dashboard`

**Purpose:** Team Manager (admin) view of their own team's members and activity

**Access:** Admin role only (also accessible by owner)

**Tabs (2):**

#### Team Members tab
- Table of all users in the manager's team
- Columns: Name, Email (truncated with tooltip), Position, Role, Last Active, Actions
- Remove member action (with confirmation)
- Center-aligned text with glowing row hover

#### Activity Log tab
- Table of all activity from team members only (scoped to the manager's team_id)
- Same format as Owner Dashboard Activity Log
- Clickable rows open the shared `ActivityDetailModal`
- Refresh button for manual data reload

---

## 7. Database Schema

ServiceDraft.AI uses a Supabase PostgreSQL database with 7 active tables. All tables have Row-Level Security (RLS) enabled with policies that restrict access based on `auth.uid()`.

### 7.1 `public.users` — User profiles

```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR NOT NULL,
  username VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  location VARCHAR,
  position VARCHAR,
  profile_picture_url VARCHAR,  -- No longer used; position-based icons shown instead
  role VARCHAR DEFAULT 'user',  -- 'owner', 'admin', or 'user'
  subscription_status VARCHAR DEFAULT 'trial',  -- 'active', 'trial', 'expired', 'bypass'
  stripe_customer_id VARCHAR,
  is_restricted BOOLEAN DEFAULT false,
  team_id UUID REFERENCES public.teams(id),  -- Nullable — unassigned users have NULL
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS policies:**
- Users can SELECT their own profile: `auth.uid() = id`
- Users can UPDATE their own profile: `auth.uid() = id`
- Users can INSERT their own profile: `auth.uid() = id`
- Owner-level operations bypass RLS via the service role client

**`preferences` JSONB structure:**
```typescript
{
  appearance: {
    accentColor: 'violet' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'pink' | 'white' | 'black',
    mode: 'dark' | 'light',
    backgroundAnimation: boolean,
  },
  templates: {
    defaultFormat: 'block' | 'ccc',
    defaultCustomization: {
      tone: string,
      warrantyCompliance: boolean,
      detailLevel: string,
    },
  },
}
```

### 7.2 `public.narratives` — Saved warranty narratives

```sql
CREATE TABLE public.narratives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  ro_number VARCHAR,
  vehicle_year INTEGER,
  vehicle_make VARCHAR,
  vehicle_model VARCHAR,
  concern TEXT,
  cause TEXT,
  correction TEXT,
  full_narrative TEXT,  -- Block format narrative
  story_type VARCHAR NOT NULL CHECK (story_type IN ('diagnostic_only', 'repair_complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Critical rule:** No unique constraint on `(user_id, ro_number)`. The same RO number can have both a diagnostic-only AND a repair-complete narrative. They must coexist as separate rows via plain INSERT — never upsert or overwrite across story types. This is essential for the diagnostic → repair complete update flow and the warranty documentation lifecycle.

### 7.3 `public.activity_log` — User activity tracking

```sql
CREATE TABLE public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,  -- FK to public.users, NOT auth.users
  action_type VARCHAR NOT NULL,
  story_type VARCHAR,
  input_data JSONB,
  output_preview TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Critical:** The FK on `activity_log.user_id` points to `public.users(id)`, NOT `auth.users(id)`. This is required for PostgREST relational joins to work in the Owner Dashboard Activity Log tab. If a join query returns "could not find a relationship in the schema cache," the FK direction is the first thing to check.

**Logged action types:**
- `generate`, `regenerate` — narrative generation
- `customize` — slider-based customization
- `proofread` — narrative audit
- `save` — explicit save
- `export_copy`, `export_print`, `export_pdf`, `export_docx` — export actions
- `login` — successful authentication

**Enhanced metadata:** generate, regenerate, customize, and save include metadata with narrative preview (first 500 chars), vehicle year/make/model, RO number, and story type. Displayed in `ActivityDetailModal`.

### 7.4 `public.saved_repairs` — Repair template storage

```sql
CREATE TABLE public.saved_repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_name VARCHAR NOT NULL,
  story_type VARCHAR NOT NULL CHECK (story_type IN ('diagnostic_only', 'repair_complete')),
  -- Vehicle info columns exist but are always NULL (templates are vehicle-agnostic)
  year VARCHAR, make VARCHAR, model VARCHAR, customer_concern TEXT,
  -- 5 core saved fields + their dropdown option states:
  codes_present TEXT, codes_present_option VARCHAR,
  diagnostics_performed TEXT, diagnostics_option VARCHAR,
  root_cause TEXT, root_cause_option VARCHAR,
  repair_performed TEXT, repair_option VARCHAR,
  repair_verification TEXT, verification_option VARCHAR,
  recommended_action TEXT, recommended_option VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Templates are vehicle-agnostic — the vehicle info columns exist for schema symmetry but are always NULL. Only the 5 core diagnostic/repair fields are actually used.

### 7.5 `public.teams` — Team management

```sql
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  access_code TEXT NOT NULL,  -- Unique team access code for signup auto-assignment
  description TEXT,
  created_by UUID REFERENCES auth.users(id),  -- Owner who created the team
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true  -- Soft delete via is_active = false
);
```

### 7.6 `public.team_members` — Team membership junction

```sql
CREATE TABLE public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- UNIQUE(team_id, user_id) prevents duplicate memberships
);
```

Note: `users.team_id` is the "live" assignment (for fast reads), while `team_members` is the historical log. When a user is assigned to a team, both are updated; when removed, both are cleared.

### 7.7 `public.api_usage_log` — Gemini API token usage tracking

```sql
CREATE TABLE public.api_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action_type TEXT NOT NULL,  -- 'generate', 'customize', 'proofread', 'apply_edits', 'update_narrative', 'convert_recommendation'
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  model_name TEXT DEFAULT 'gemini-3-flash-preview',
  estimated_cost_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Pricing (gemini-3-flash-preview):**
- Input: $0.50 per 1M tokens ($0.0000005 per token)
- Output: $3.00 per 1M tokens ($0.000003 per token)

### Migration history

Canonical migration files in `supabase/migrations/`:

1. `001_initial_schema.sql` — users, narratives, auto-profile trigger, base RLS
2. `002_add_name_fields_and_position_update.sql` — first_name, last_name columns
3. `003_narrative_upsert_support.sql` — updated_at, deduplication, (former) unique constraint, UPDATE policy
4. `004_admin_role_and_activity_log.sql` — role column, is_restricted, activity_log table, admin RLS, is_admin() helper
5. `005_saved_repairs.sql` — saved_repairs table + RLS
6. `006_drop_narrative_unique_constraint.sql` — drops unique(user_id, ro_number) for multi-entry support
7. `007_create_groups_table.sql` — original group system tables
8. `008_rename_groups_to_teams.sql` — renamed groups → teams across all tables/columns
9. `009_api_usage_log.sql` — api_usage_log table with token tracking and cost estimation

Additional manual SQL applied via Supabase SQL Editor:
- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;`
- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);`
- FK redirect for `activity_log.user_id` from `auth.users` to `public.users`

**Note:** Most migrations were applied via the SQL Editor directly, so `supabase_migrations.schema_migrations` is unreliable as a source of truth. Use the migration files + this list as canonical.

---

## 8. API Route Inventory

### AI-calling routes (6)

| Endpoint | Method | Purpose | Rate Limited |
|---|---|---|---|
| `/api/generate` | POST | Initial narrative generation | ✅ 20/user/15min |
| `/api/customize` | POST | Post-generation restyling | ❌ |
| `/api/proofread` | POST | Audit / authorization-readiness review | ❌ |
| `/api/apply-edits` | POST | Merge selected proofread suggestions | ❌ |
| `/api/update-narrative` | POST | Diagnostic → Repair Complete conversion | ❌ |
| `/api/convert-recommendation` | POST | (Legacy, unused) | ❌ |

All 6 routes are instrumented with token usage logging to `api_usage_log`.

### Data routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/narratives` | GET | List saved narratives for authenticated user |
| `/api/narratives/save` | POST | INSERT new narrative (never upsert) |
| `/api/saved-repairs` | GET/POST | List or create repair templates |
| `/api/saved-repairs/[id]` | PUT/DELETE | Update or delete specific template |
| `/api/activity-log` | GET | Fetch activity entries |
| `/api/narrative-tracker` | POST | Track narrative interactions |
| `/api/preferences` | GET/PUT | User preferences (JSONB) |
| `/api/me` | GET | Current user profile (used exclusively by useAuth hook) |
| `/api/support` | POST | Submit support ticket |

### Export & email routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/export-pdf` | POST | Generate and return PDF |
| `/api/export-docx` | POST | Generate and return DOCX |
| `/api/send-email` | POST | Send narrative via Resend (up to 10 recipients) |

### Auth & signup routes (⚠️ PROTECTED FILES)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Server-side login |
| `/api/auth/logout` | POST | Server-side logout |
| `/api/signup/verify-otp` | POST | OTP code verification (Step 1) |
| `/api/signup/complete-profile` | POST | Password + profile creation (Step 2) |
| `/api/signup/activate` | POST | Access code activation + team assignment (Step 3) |
| `/auth/callback` | GET | Supabase code exchange / token verification fallback |

### Admin & team routes (role-gated)

| Endpoint | Method | Role Required | Purpose |
|---|---|---|---|
| `/api/admin` | POST | owner | User management + team CRUD actions |
| `/api/admin/analytics` | GET | owner | Dashboard metrics + systemHealth (includes APP_VERSION) |
| `/api/admin/usage` | GET | owner | Gemini token usage stats |
| `/api/teams` | GET/POST/PUT/DELETE | admin+ | Team CRUD |
| `/api/teams/members` | GET/POST/DELETE | admin+ | Team member operations |
| `/api/teams/activity` | GET | admin+ | Team-scoped activity log |

### Payment routes (⚠️ PROTECTED FILES)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/stripe` | POST | Checkout session creation + access code bypass |
| `/api/stripe/webhook` | POST | Stripe webhook handler (signature verification) |

### Account management

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/delete-account` | POST | Self-service account deletion (service role client) |

### Admin API actions (`POST /api/admin`)

The single `/api/admin` endpoint dispatches to multiple actions based on the `action` field in the request body:

| Action | Params | Description |
|---|---|---|
| `list_users` | — | Returns all users with narrative counts, last activity, team_name |
| `get_user_details` | `userId` | Returns profile + recent activity (5) + recent narratives (5) |
| `send_password_reset` | `email` | Sends reset via Resend (branded) or Supabase fallback |
| `restrict_user` | `userId`, `restricted` | Sets `is_restricted` flag |
| `delete_user` | `userId` | Permanently deletes user via `auth.admin.deleteUser` |
| `change_subscription` | `userId`, `status` | Updates subscription_status |
| `promote_to_admin` | `userId` | Sets role to 'admin' |
| `demote_to_user` | `userId` | Sets role to 'user' |
| `get_access_code` | — | Returns current ACCESS_CODE from env |
| `list_teams` | — | Returns all active teams with member counts |
| `assign_user` | `userId`, `teamId` | Assigns user to team (updates team_id + creates team_members row) |
| `create_team` | `name` | Creates team with auto-generated access code |

---

## 9. AI Prompt System (Summary)

For the full prompt text, see `ServiceDraft_AI_Prompt_Logic.md`. This section is a high-level overview.

### Prompt constants

All major prompts live in `src/constants/prompts.ts`:

- `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` — main generate for diagnostic-only narratives
- `REPAIR_COMPLETE_SYSTEM_PROMPT` — main generate for repair-complete narratives
- `CUSTOMIZATION_SYSTEM_PROMPT` — post-generation restyling
- `PROOFREAD_SYSTEM_PROMPT` — repair-complete audit (warranty compliance)
- `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` — diagnostic-only audit (authorization readiness)
- `LENGTH_MODIFIERS`, `TONE_MODIFIERS`, `DETAIL_MODIFIERS` — slider modifier string dictionaries

Two additional prompts live inline in their routes:

- `APPLY_EDITS_SYSTEM_PROMPT` — inside `/api/apply-edits/route.ts`
- Update-narrative prompt — inside `/api/update-narrative/route.ts`

### Shared behavioral rules across all narrative prompts

1. Write in professional, warranty-appropriate tone
2. All narrative text FULLY CAPITALIZED for visual uniformity
3. NEVER use "damaged" or language implying external force / customer misuse / abuse / neglect
4. Use OEM-specific terminology based on vehicle year/make/model
5. Preserve ALL specific technical data points (terminal numbers, voltages, connector IDs, etc.)
6. NEVER fabricate document IDs, claim numbers, or authorization numbers
7. Return ONLY a valid JSON object with 4 keys: `block_narrative`, `concern`, `cause`, `correction`
8. Diagnostic Only: use "RECOMMENDED REPLACING" tense
9. Repair Complete: use "REPLACED THE" past tense

### Response structure

Every narrative-generating route returns:

```typescript
{
  block_narrative: string,   // Single flowing paragraph for block display
  concern: string,            // Customer concern section
  cause: string,              // Diagnosis section
  correction: string,         // Repair section (future tense for diagnostic, past tense for repair complete)
}
```

Proofread returns a different shape:

```typescript
{
  flagged_issues: ParsedIssue[],       // { issue, snippet }[]
  suggested_edits: string[],
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL',
  summary: string,
}
```

### Proofread snippet extraction

Flagged issues from the repair-complete proofread include `[[exact text]]` markers that are extracted server-side via regex and used for UI highlighting on the narrative display.

### Customization slider modifiers

The three sliders (Length / Tone / Detail Level) each have 3 positions with exact modifier text that gets appended to customization calls:

- **Length:** `short` / `standard` (empty) / `detailed`
- **Tone:** `warranty` / `standard` (empty) / `customer_friendly`
- **Detail:** `concise` / `standard` (empty) / `additional`

The center positions (`standard`) map to empty strings — no modifier is added. Pre-generation and post-generation customization use the same modifier strings.

---

## 10. Export System

### Shared export utility

`src/lib/exportUtils.ts` exposes:

```typescript
export interface ExportPayload {
  narrative: { block_narrative, concern, cause, correction };
  displayFormat: 'block' | 'ccc';
  vehicleInfo: { year, make, model, roNumber };
}

export async function downloadExport(type: 'pdf' | 'docx', payload: ExportPayload): Promise<void>
export function buildPrintHtml(payload: ExportPayload): string
export function buildEmailHtml(narrative, displayFormat, vehicleInfo, senderName): string
export function buildPlainTextEmail(narrative, displayFormat, vehicleInfo, senderName): string
```

Both `ShareExportModal` (Narrative Page) and `NarrativeDetailModal` (Dashboard) call `downloadExport()` to ensure exports are always generated identically.

### Document layout (identical across PDF, DOCX, Print, Email)

1. **Footer logo:** `ServiceDraft-Ai Vector Logo.png` — bottom-right corner, 25×12mm (PDF) / 55×26px (DOCX), 2.09:1 aspect ratio
2. **Two-column header:**
   - LEFT: "Vehicle Information:" bold underlined, then Year/Make/Model labels with values
   - RIGHT: "Repair Order #:" bold underlined, then the RO number in 20pt bold
3. **Title:** "REPAIR NARRATIVE" — 18pt bold underlined, centered
4. **Body:**
   - Block format → single paragraph of `block_narrative`
   - C/C/C format → three sections with 13pt bold italic underlined headers ("CONCERN:", "CAUSE:", "CORRECTION:") and 11pt regular body text
5. **Font:** Helvetica (PDF) / Arial (DOCX) / inherited (email)

### PDF generation

Uses `jspdf` via `/api/export-pdf`. Server-side only — doesn't ship jsPDF to the browser.

### DOCX generation

Uses `docx` via `/api/export-docx`. Server-side only.

### Print

Client-side — `buildPrintHtml()` generates a standalone HTML document which is opened in a new window and triggers `window.print()`.

### Email

Uses Resend via `/api/send-email`. Both HTML and plain-text versions are sent. Maximum 10 recipients per send. Sender: `noreply@servicedraft.ai` (lowercase — capitalization matters for DKIM alignment). Domain is verified in Resend with SPF, DKIM, and DMARC records configured.

### Auto-save on export

All export actions trigger an implicit save before exporting. The toast "Narrative auto-saved to your history" appears (deduplicated via `{ id: 'auto-save' }`). This ensures every exported narrative exists in the dashboard history.

---

## 11. Visual Design System (Summary)

For the full design spec, see `ServiceDraft_AI_UI_Design_Spec.md`. This section is a high-level overview.

### Aesthetic

Automotive-tech futurism + glassmorphism + cinematic depth. Modern scan tool meets sci-fi cockpit. Every surface floats over a luminous gradient backdrop with soft accent glows tracking cursor movement.

### 9 accent colors

Violet (default), Red, Orange, Yellow, Green, Blue, Pink, Noir (forces dark mode), White (forces light mode).

The entire UI re-themes instantly when the accent color changes via CSS custom properties set at runtime by `ThemeProvider`.

### Typography

- **Orbitron** (Google Font) — headers, navigation, titles, body text
- **Inter** (Google Font) — user-entered text and generated narrative content (via `.font-data` class)

### Core components

- **`LiquidCard`** — glassmorphism container, 23px border radius, 5% accent tint background, backdrop blur, CursorGlow hover effect
- **`Modal`** — opaque panel (85% opacity) with 24px backdrop blur, supports X / backdrop click / Escape close
- **`Button`** — 3 variants (primary, secondary, ghost), spring animation on hover/tap (1.05 hover, 0.95 tap), glow shadow on hover
- **`Input` / `Textarea` / `Select`** — themed form controls with `var(--bg-input)` backgrounds and `var(--accent-hover)` focus ring
- **`CursorGlow`** — wrapper that adds a cursor-tracked radial gradient; used instead of scale animations on cards
- **`ParticleNetwork`** — full-page particle field animation on protected pages
- **`WaveBackground`** — sine wave canvas animation on landing / auth pages
- **`HeroArea`** — 100px reactive hero wave that pulses on user activity events
- **`PositionIcon`** — position-based SVG icons (Wrench, Hammer, ScanLine, etc.) replacing profile pictures

### Framer Motion spring config (used everywhere)

```typescript
{ type: 'spring', stiffness: 400, damping: 25 }
```

### Page layout structure

All protected pages share: `HeroArea` (100px) + `NavBar` (64px) + `ParticleNetwork` background + `PageTransition` wrapper around page content.

---

## 12. State Management Architecture

### No global state libraries

ServiceDraft.AI does **NOT** use Redux, MobX, Zustand, or similar. All shared state is managed via React's built-in primitives plus custom module-level singletons.

### `narrativeStore.ts` — Narrative page state

**Pattern:** Module-level state object + listener set, exposed via React's `useSyncExternalStore` hook.

**Why:** The original implementation used a `useState(() => subscribe())` pattern that never cleaned up listeners on unmount. Every page navigation added a permanent listener to the global Set, causing stale re-renders and state corruption. `useSyncExternalStore` handles listener cleanup automatically.

**State shape:**

```typescript
interface NarrativeState {
  storyType: 'diagnostic_only' | 'repair_complete' | null;
  fieldValues: Record<string, string>;
  dropdownSelections: Record<string, DropdownOption>;
  roNumber: string;
  compiledDataBlock: string;
  narrative: NarrativeData | null;
  displayFormat: 'block' | 'ccc';  // Default 'ccc'
  lengthSlider: 'short' | 'standard' | 'detailed';
  toneSlider: 'warranty' | 'standard' | 'customer_friendly';
  detailSlider: 'concise' | 'standard' | 'additional';
  customInstructions: string;
  generationId: number;  // Increments on new generation
  isSaved: boolean;       // Navigation guard controller
  savedNarrativeId: string | null;  // Supabase UUID for duplicate prevention
}
```

**Key actions:**

- `setStoryType(type)` — preserves shared fields when switching types
- `setNarrative(data)` — sets narrative and resets `isSaved` to false
- `clearForNewGeneration()` — resets narrative + customization + increments generationId
- `markSaved(id)` — sets `isSaved: true` and `savedNarrativeId`
- `setForRepairUpdate(data)` — sets narrative from update-narrative API, switches to repair_complete type
- `clearFormFields()` — resets field values + dropdowns + RO# (does NOT change story type)

**⚠️ PROTECTED FILE.** Do not modify without the DOUBLE-CHECK PROTOCOL.

### `useAuth.ts` — Auth state hook

**Pattern:** Module-level singleton state with listener set + hook wrapper.

**Key architectural choice:** `useAuth.ts` does **NOT** use the browser Supabase client. It fetches the user profile exclusively via `GET /api/me`. This eliminates the browser client's internal auth mutex as a source of production incidents (concurrent `getUser()` calls caused indefinite hangs).

**Exports:**
- `user: { id, email } | null` — basic auth identity
- `profile: UserProfile | null` — full profile from users table
- `loading: boolean` — true until initial fetch completes
- `signOut: () => Promise<void>` — clears localStorage + calls `/api/auth/logout` + hard-redirects to `/`
- `refreshProfile: () => Promise<void>` — re-fetches from `/api/me`

**Retry pattern:** `fetchProfile()` wraps the `/api/me` call in a 500ms-delay retry for transient network/cookie-race failures during sign-in.

**Visibility-change re-validation:** On tab re-activation, if `authState.profile` is null, a refresh is attempted (guarded by `isRefreshing` to prevent concurrent pile-up).

**⚠️ PROTECTED FILE.**

### `ThemeProvider.tsx` — Theme context

**Pattern:** React Context (the only Context-based state in the app).

**Exports:**
- `accent: AccentColor` — current accent with all computed properties
- `setAccentColor(key: string)`
- `colorMode: 'dark' | 'light'`
- `toggleColorMode()`
- `backgroundAnimation: boolean`
- `setBackgroundAnimation(enabled: boolean)`

**Persistence:** localStorage-first for instant rendering, then async override from `users.preferences` in Supabase. On sign-out, resets to violet dark defaults and clears localStorage.

**⚠️ PROTECTED FILE.**

### Other hooks

- `useActivityPulse` — hero wave reactivity dispatcher (module-level shared amplitude)
- `useSessionExpiry` — 8-hour auto-logout watcher (60-second check interval)
- `useTypingAnimation` — character-by-character text reveal with skip

---

## 13. Security & Rate Limiting

### Rate limiting

`src/lib/rateLimit.ts` — simple in-memory token bucket. Resets on server restart.

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| `/api/generate` | 20 requests | 15 minutes | `generate:${userId}` |

Currently only `/api/generate` is rate-limited. Other AI routes are less expensive and rely on the generate bottleneck.

### Input validation

- `/api/generate`: compiled data block capped at 10,000 characters
- All routes: body is parsed as JSON; missing required fields return HTTP 400
- Auth routes: email format validation, password length ≥ 6 chars

### Restriction check

Restricted users (`users.is_restricted = true`) cannot generate or update narratives. The flag is set by the Owner via the User Management table. Restricted status is checked on every call to `/api/generate` and `/api/update-narrative`:

```typescript
if (profile?.is_restricted) {
  return NextResponse.json(
    { error: 'Your account has been restricted. Contact support for assistance.' },
    { status: 403 },
  );
}
```

### Security headers (`next.config.ts`)

- `Content-Security-Policy` — allows Stripe JS, Google Fonts, Supabase, Gemini API, Resend API
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables unused browser features

### Auth enforcement on API routes

All API routes (except the Stripe webhook) require an authenticated Supabase session via the server client. Admin routes additionally verify `role = 'admin'` or `role = 'owner'`. Owner-only routes verify `role = 'owner'` specifically.

### Access code

Read from the `ACCESS_CODE` environment variable — no hardcoded defaults. Used in `/api/stripe/route.ts` for beta signup bypass. Team-specific access codes are stored in the `teams.access_code` column.

### Production reminder

Supabase email confirmation is currently **DISABLED** for beta testing convenience (Auth → Providers → Email → "Confirm email" toggle). Before full production launch, this must be re-enabled in the Supabase Dashboard.

---

## 14. Version Management System

### Single source of truth

The app version is defined in `src/lib/version.ts` as the exported constant `APP_VERSION`. This file is the ONLY place to change the runtime version string.

```typescript
export const APP_VERSION = 'v1.0.5-beta';
```

### Two display points

1. **NavBar center section** (`src/components/layout/NavBar.tsx`) — displays `APP_VERSION` imported from `@/lib/version`
2. **Owner Dashboard System Health card** (`src/app/api/admin/analytics/route.ts`) — returns `appVersion: APP_VERSION` as part of the `systemHealth` response object

If these two ever display different values, something is wrong with the import — investigate immediately.

### package.json alignment

The `version` field in `package.json` is kept in sync with `version.ts`, minus the `v` prefix and `-beta` suffix. Example: `v1.0.5-beta` in version.ts → `"1.0.5"` in package.json.

### Mandatory per-sprint bump rule

Per `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`, every sprint **MUST** bump the version before the final commit. Default is a patch bump (`1.0.5` → `1.0.6`). Minor/major bumps only when explicitly specified in the sprint prompt.

The bump must happen LAST, right before the final commit, and the new version must appear in the commit message.

### Why this matters

The app is live. The version system lets Tyler verify at a glance whether the version running on `servicedraft.ai` matches the version that was supposedly deployed. Without an automatic bump, localhost and production could silently run the same version string, making it impossible to tell whether a deploy actually landed.

---

## 15. Feature Matrix

| Feature | Status | Notes |
|---|---|---|
| **Authentication** | | |
| Email/password login | ✅ Live | |
| OTP-based signup (3-step) | ✅ Live | Migrated from PKCE/magic-link |
| Password reset via Resend | ✅ Live | Branded email template |
| 8-hour session auto-expiry | ✅ Live | |
| Cross-browser verification | ✅ Live | Via OTP |
| Email confirmation requirement | ⚠️ Disabled | Re-enable before full launch |
| **Narrative Generation** | | |
| Diagnostic Only story type | ✅ Live | |
| Repair Complete story type | ✅ Live | |
| Conditional field dropdowns (Include/Don't/Generate) | ✅ Live | |
| Pre-generation customization (sliders) | ✅ Live | Persists in localStorage |
| Post-generation customization (sliders) | ✅ Live | |
| Custom instructions field | ✅ Live | Max 50 chars |
| Regenerate | ✅ Live | Uses original input |
| **Narrative Features** | | |
| Block format display | ✅ Live | |
| C/C/C format display | ✅ Live | Default |
| Format toggle (client-side) | ✅ Live | |
| Typing animation on first display | ✅ Live | Skippable |
| Manual narrative editing (Edit Story modal) | ✅ Live | AutoTextarea expansion |
| **Proofread / Audit** | | |
| Repair Complete audit | ✅ Live | Warranty compliance |
| Diagnostic Only audit | ✅ Live | Authorization readiness |
| Flagged issues with highlights | ✅ Live | 30-second fade |
| Selective edit application (checkboxes) | ✅ Live | |
| Overall rating (PASS/NEEDS_REVIEW/FAIL) | ✅ Live | |
| **Save & History** | | |
| Save narrative to history | ✅ Live | INSERT only, never upsert |
| Auto-save on export | ✅ Live | Deduplicated toast |
| Narrative history with search/sort/filter | ✅ Live | |
| Diagnostic → Repair Complete update | ✅ Live | Both entries preserved |
| **Saved Repair Templates** | | |
| Create repair template | ✅ Live | |
| Load template to Input Page | ✅ Live | |
| Edit template | ✅ Live | |
| Delete template | ✅ Live | |
| Vehicle-agnostic templates | ✅ Live | |
| **Export** | | |
| PDF export | ✅ Live | jsPDF server-side |
| DOCX export | ✅ Live | docx library server-side |
| Print export | ✅ Live | Client-side HTML |
| Email export via Resend | ✅ Live | Up to 10 recipients |
| Copy to clipboard | ✅ Live | |
| **User Dashboard** | | |
| Profile view/edit | ✅ Live | |
| Preferences (theme, animation, default format) | ✅ Live | |
| Self-service account deletion | ✅ Live | |
| **Owner Dashboard** | | |
| Overview metrics (8 cards) | ✅ Live | |
| System Health card (shows APP_VERSION) | ✅ Live | |
| Activity Log tab | ✅ Live | Search, filter, sort, detail modal |
| User Management tab | ✅ Live | Inline actions, team column |
| Analytics tab (4 chart types) | ✅ Live | Auto-refresh every 60s |
| API Usage tab (token tracking) | ✅ Live | Cost estimation |
| Settings tab (Token Calculator) | ✅ Live | |
| Protected user safeguard | ✅ Live | hvcadip@gmail.com |
| **Team System** | | |
| Create teams | ✅ Live | Auto-generated access codes |
| Assign users to teams | ✅ Live | |
| Team auto-assignment via access code | ✅ Live | On signup Step 3 |
| Team Dashboard (Manager view) | ✅ Live | Members + Activity tabs |
| Team-scoped activity log | ✅ Live | |
| Remove team member | ✅ Live | |
| **Payment** | | |
| Stripe checkout integration | ⚠️ Wired | Not yet used — beta uses access codes |
| Stripe webhook handler | ⚠️ Wired | Signature verification active |
| Access code bypass | ✅ Live | |
| Vercel Pro upgrade | ⏳ Pending | Required before charging customers (Hobby prohibits commercial use) |
| **Infrastructure** | | |
| Deployed at servicedraft.ai | ✅ Live | |
| Vercel auto-deploy on git push | ✅ Live | |
| Supabase RLS policies | ✅ Live | |
| www → non-www middleware redirect | ✅ Live | |
| 5-second middleware auth timeout | ✅ Live | |
| clearExpiredAuthCookies guard | ✅ Live | |
| Version automation (src/lib/version.ts) | ✅ Live | |
| **Token Tracking** | | |
| All 6 AI routes instrumented | ✅ Live | |
| api_usage_log table | ✅ Live | |
| Aggregated stats API | ✅ Live | |
| Cost estimation | ✅ Live | |
| Token Calculator widget | ✅ Live | |
| **Pending / Future** | | |
| Saved Contacts System | ⏳ Planned | Sprint #4 |
| Internal User Messaging System | ⏳ Designed | Architecture complete, not built |
| Landing Page expansion | ⏳ Backlog | Larger feature |
| Next.js middleware → proxy.ts migration | ⏳ Backlog | Non-urgent |
| Spec doc rewrite / rename | 🔄 In progress | This document is part of that effort |

---

## 16. Complete Workflow Diagrams

### 16.1 New user onboarding (first-time signup)

```
┌─────────────────────┐
│  User visits /      │
│  (landing page)     │
└──────────┬──────────┘
           │ Clicks "SIGN UP"
           ▼
┌─────────────────────────────────────┐
│  Step 1: Email + Confirm Email      │
│  Clicks SEND CODE                   │
│  → supabase.auth.signInWithOtp()   │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Step 1 (cont): Enter 6-digit code  │
│  → POST /api/signup/verify-otp      │
│  → verifyOtp({ type: 'signup' })   │
└──────────┬──────────────────────────┘
           │ Success → session cookies set
           ▼
┌─────────────────────────────────────┐
│  Step 2: Password + Profile         │
│    - password (≥6 chars)            │
│    - first/last name                │
│    - location (US state)            │
│    - position                       │
│    - accent color preference        │
│  → POST /api/signup/complete-profile│
│  → upsert public.users row          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Step 3: Access Code                │
│    - enter code                     │
│  Code validation:                   │
│    1. Match global ACCESS_CODE?     │
│    2. Match teams.access_code?      │
│    3. Neither → Stripe (future)     │
│  → POST /api/signup/activate        │
│  → subscription_status: 'bypass'    │
│  → optional team_id assignment      │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Redirect to        │
│  /main-menu         │
└─────────────────────┘
```

### 16.2 Narrative generation (Diagnostic Only path)

```
┌─────────────────────┐
│  /main-menu         │
└──────────┬──────────┘
           │ Click "Generate Story"
           ▼
┌─────────────────────────────────────┐
│  /input                              │
│  Select "Diagnostic Only"            │
│  (or load saved repair template)    │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Fill required fields:               │
│    - RO# (not sent to AI)           │
│    - Year, Make, Model              │
│    - Customer Concern               │
│                                      │
│  Fill conditional fields with       │
│  dropdown selection:                 │
│    - Codes Present                  │
│    - Diagnostics Performed          │
│    - Root Cause                     │
│    - Recommended Action             │
│                                      │
│  (Optional) Pre-Gen Customization:  │
│    - Length / Tone / Detail sliders │
└──────────┬──────────────────────────┘
           │ Click GENERATE NARRATIVE
           ▼
┌─────────────────────────────────────┐
│  compileDataBlock() runs             │
│    - Strips RO#                     │
│    - Uppercases labels              │
│    - Substitutes AI_INFERENCE_TEMPLATE│
│      for "generate" dropdowns       │
│    - Skips "dont_include" fields    │
│    - Appends pre-gen modifiers      │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  POST /api/generate                  │
│    Body: { compiledDataBlock,        │
│             storyType: 'diagnostic_only' }│
│                                      │
│  Server:                             │
│    1. Auth check                    │
│    2. Rate limit check (20/15min)   │
│    3. Restriction check             │
│    4. Input length check (≤10k)     │
│    5. Select DIAGNOSTIC_ONLY_SYSTEM_PROMPT│
│    6. Call Gemini                   │
│    7. Parse JSON response           │
│    8. Log token usage (fire/forget) │
│    9. Return 4-key JSON             │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  /narrative                          │
│  Typing animation plays              │
│  Narrative displayed in C/C/C format │
│  (or block if user preference)      │
└──────────┬──────────────────────────┘
           │
           ▼
     User actions available:
     ├─ CUSTOMIZE → /api/customize
     ├─ PROOFREAD → /api/proofread (diagnostic variant)
     ├─ EDIT STORY → manual edit
     ├─ NEW STORY → reset + back to input
     ├─ SAVE STORY → /api/narratives/save
     └─ SHARE/EXPORT → PDF/DOCX/Print/Email
```

### 16.3 Proofread → selective apply edits flow

```
┌─────────────────────┐
│  /narrative          │
│  (narrative visible) │
└──────────┬──────────┘
           │ Click PROOFREAD
           ▼
┌─────────────────────────────────────┐
│  POST /api/proofread                 │
│    Body: { concern, cause, correction,│
│             storyType, year, make, model}│
│                                      │
│  Server selects prompt:              │
│    storyType === 'diagnostic_only' ? │
│      DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT│
│      : PROOFREAD_SYSTEM_PROMPT      │
│                                      │
│  Gemini returns:                     │
│    { flagged_issues: [],            │
│      suggested_edits: [],           │
│      overall_rating: 'PASS/NEEDS_REVIEW/FAIL',│
│      summary: '...' }                │
│                                      │
│  Server extracts [[snippets]]        │
│  Returns parsed response             │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  ProofreadResults panel appears      │
│  Snippet highlights on narrative     │
│  (30s fade-out)                      │
│                                      │
│  Each issue has a checkbox           │
│  (all checked by default)            │
│  Overall rating badge displayed      │
└──────────┬──────────────────────────┘
           │ User deselects unwanted edits
           │ Clicks APPLY SELECTED EDITS
           ▼
┌─────────────────────────────────────┐
│  POST /api/apply-edits               │
│    Body: { concern, cause, correction,│
│             suggestedEdits: string[] }│
│                                      │
│  Server:                             │
│    1. Validates selection non-empty │
│    2. Calls Gemini with APPLY_EDITS_SYSTEM_PROMPT│
│    3. Returns updated 4-key narrative│
│    4. Logs token usage              │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Narrative replaced on display       │
│  isSaved = false                     │
│  Navigation guards re-activated      │
└─────────────────────────────────────┘
```

### 16.4 Diagnostic → Repair Complete update flow

```
┌─────────────────────┐
│  /dashboard          │
│  Narrative History   │
└──────────┬──────────┘
           │ Click saved diagnostic row
           ▼
┌─────────────────────────────────────┐
│  NarrativeDetailModal opens          │
│  Read-only narrative displayed       │
│  "UPDATE NARRATIVE WITH REPAIR" btn  │
│  (only visible for diagnostic_only)  │
└──────────┬──────────────────────────┘
           │ Click UPDATE NARRATIVE WITH REPAIR
           ▼
┌─────────────────────────────────────┐
│  UpdateWithRepairModal opens         │
│  Pre-filled vehicle info badges      │
│                                      │
│  User inputs:                        │
│    - Repair Performed (required)    │
│      OR toggle "COMPLETED RECOMMENDED│
│      REPAIR" (uses static prompt)   │
│    - Repair Verification (dropdown) │
│    - Additional Notes (optional)    │
└──────────┬──────────────────────────┘
           │ Click GENERATE NARRATIVE
           ▼
┌─────────────────────────────────────┐
│  POST /api/update-narrative          │
│    Body: { originalConcern/Cause/Correction,│
│             vehicleYear/Make/Model,  │
│             repairPerformed + dropdown,│
│             repairVerification + dropdown,│
│             additionalNotes }        │
│                                      │
│  Server:                             │
│    1. Auth + restriction check      │
│    2. Build repair info section     │
│    3. Call Gemini with update prompt│
│    4. Parse 4-key response          │
│    5. Log token usage               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  setForRepairUpdate() updates store: │
│    - narrative = new response       │
│    - storyType = 'repair_complete'  │
│    - carries forward vehicle + RO#  │
│                                      │
│  User navigated to /narrative        │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  /narrative                          │
│  NEW repair-complete narrative shown │
│  User can save (INSERT new row)     │
│                                      │
│  RESULT in database:                 │
│    - Original diagnostic row still exists│
│    - New repair-complete row created│
│    - Both share same RO#             │
│    - Both tied to same user         │
└─────────────────────────────────────┘
```

### 16.5 Team assignment at signup

```
┌─────────────────────┐
│  /signup Step 3     │
└──────────┬──────────┘
           │ User enters access code
           │ e.g., "PATRIOT-CHEVY-2026"
           ▼
┌─────────────────────────────────────┐
│  POST /api/signup/activate           │
│    Body: { teamId?: string }        │
│                                      │
│  (teamId was resolved client-side   │
│   by matching code against          │
│   teams.access_code)                 │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Server:                             │
│    1. Verify authenticated user      │
│    2. Upsert public.users row with: │
│       - subscription_status: 'bypass'│
│       - team_id (if provided)       │
│    3. Return success                 │
└──────────┬──────────────────────────┘
           │ (Note: team_members row    │
           │  creation happens when Owner│
           │  uses "Assign to Team" from │
           │  admin dashboard, not during│
           │  signup itself)             │
           ▼
┌─────────────────────┐
│  User activated     │
│  Redirect to        │
│  /main-menu         │
└─────────────────────┘
```

---

## 17. Project Knowledge Files

ServiceDraft.AI uses a suite of markdown documentation files stored both in the codebase repo and in the Claude Project knowledge base. These files are used by Claude (desktop and Code) as reference material.

### Core documentation (4 files)

| File | Purpose | Primary Audience |
|---|---|---|
| `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` | Implementation reference, coding standards, safeguard playbook, sprint execution manual | Claude Code at session start |
| `ServiceDraft_AI_Spec.md` (this document) | Top-to-bottom functional specification | Claude desktop, new developers, stakeholders |
| `ServiceDraft_AI_Project_Instructions.md` | Who Tyler is, how we work, communication rules | Claude desktop at conversation start |
| `ServiceDraft_AI_Prompt_Logic.md` | Complete AI prompt reference + JSON schemas | Claude when tweaking prompts |
| `ServiceDraft_AI_UI_Design_Spec.md` | Complete visual design system reference | Claude when building new UI |

### Sprint tracking

| File | Purpose |
|---|---|
| `BUILD_PROGRESS_TRACKER.md` | Sprint history log (write-only during sessions to save context tokens) |
| `DEPLOYMENT_NOTES.md` | Environment setup, Supabase RLS policies, Stripe webhook config |
| `PRE_BUILD_SETUP_CHECKLIST.md` | Pre-build environment checklist |

### Assets

| File | Purpose |
|---|---|
| `SERVIDRAFT.AI LOGO #1 .PNG` | Primary square logo |
| `ServiceDraft-Ai Vector Logo.png` | Horizontal wordmark for NavBar + exports |

### Document hierarchy when they conflict

If any two docs contradict each other, use this precedence order:

1. **The live codebase** (source of truth — always wins)
2. **`CLAUDE_CODE_BUILD_INSTRUCTIONS.md`** — implementation rules and safeguards
3. **This document (`ServiceDraft_AI_Spec.md`)** — functional behavior
4. **`ServiceDraft_AI_Prompt_Logic.md`** — prompt text
5. **`ServiceDraft_AI_UI_Design_Spec.md`** — visual design
6. **`ServiceDraft_AI_Project_Instructions.md`** — project management / communication

When updating docs, the codebase is changed first. Then CLAUDE_CODE_BUILD_INSTRUCTIONS.md. Then this spec. Then the others as relevant.

---

*— End of ServiceDraft.AI Functional Specification —*
