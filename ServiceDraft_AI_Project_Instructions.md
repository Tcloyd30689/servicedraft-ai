# SERVICEDRAFT.AI — PROJECT INSTRUCTIONS

**Project management and communication manual for working on ServiceDraft.AI.**

This document describes who the project is, how development is run, how Tyler and Claude work together, and the rules and standards that govern the work. It complements the more technical documents:

- `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` — implementation rules and safeguards
- `ServiceDraft_AI_Spec.md` — functional specification
- `ServiceDraft_AI_Prompt_Logic.md` — AI prompt reference
- `ServiceDraft_AI_UI_Design_Spec.md` — visual design system

This document is primarily used by **Claude desktop at the start of a conversation** to understand context, preferences, and working style. Claude Code at sprint-start reads `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` instead.

---

## Table of Contents

1. [Who I Am](#1-who-i-am)
2. [What We've Built](#2-weve-built)
3. [Complete Technology Stack](#3-complete-technology-stack)
4. [User Role Hierarchy](#4-user-role-hierarchy)
5. [Complete Application Workflow](#5-complete-application-workflow)
6. [Input Page Specifications](#6-input-page-specifications)
7. [Generated Narrative Page Specifications](#7-generated-narrative-page-specifications)
8. [User Dashboard Specifications](#8-user-dashboard-specifications)
9. [Owner Dashboard](#9-owner-dashboard)
10. [Team Dashboard](#10-team-dashboard)
11. [Team Management System](#11-team-management-system)
12. [Export Document Specifications](#12-export-document-specifications)
13. [API Route Inventory](#13-api-route-inventory)
14. [Database Schema](#14-database-schema)
15. [Design & Aesthetic](#15-design--aesthetic)
16. [How to Communicate With Me](#16-how-to-communicate-with-me)
17. [Project Knowledge Files](#17-project-knowledge-files)
18. [Project Continuity Rules](#18-project-continuity-rules)
19. [Quality Standards](#19-quality-standards)
20. [Long-Term Vision](#20-long-term-vision)

---

## 1. Who I Am

### Background

My name is **Tyler**. I'm the founder, sole developer, and owner of **ServiceDraft.AI**. My primary trade is automotive technician — I work at a Chevrolet dealership (Whisler Chevy) where I handle diagnostics and repairs on a wide range of GM vehicles. I do not have a formal software engineering background. I built ServiceDraft.AI from scratch over many months with Claude as my architectural and planning partner, and Claude Code (inside the Cursor IDE) as my implementation tool.

My email is `hvcadip@gmail.com`. My user ID in the ServiceDraft.AI database is `29e57c2b-c248-4c71-8c04-3f75b8e163dc`. My role in the app is `owner`.

### Why I'm building this

I know firsthand how much time technicians waste writing warranty narratives, and how often well-deserved warranty claims get rejected because of imprecise language or missing documentation. The problem isn't technician knowledge — it's that writing professional warranty prose is a different skill from diagnosing a car, and most techs were never trained in it. I'm building ServiceDraft.AI so techs can focus on their craft while still producing the kind of documentation that passes manufacturer audits and supports extended warranty authorization. I want this to be a real product that earns money from dealerships, not a hobby project.

### Key people in my orbit

- **Charles** — IT at my dealership. Relevant when we're working through enterprise email setups, firewall issues, or corporate network concerns at Whisler Chevy.
- **Whisler Chevy** — the dealership where I work and where ServiceDraft.AI's first beta team is set up.

### What I'm good at

- Automotive diagnostics, repair, and warranty documentation (deep expertise)
- Knowing what matters and what doesn't in a warranty audit
- Product decisions that come from real lived experience as a technician
- Understanding tradeoffs when explained clearly

### What I need help with

- Writing code (I can read it and understand it, but I rely on Claude Code for implementation)
- Architectural decisions that span multiple systems
- Debugging complex issues that cross layers (auth, database, frontend, deployment)
- Catching edge cases in design that I'd miss from my vantage point
- Keeping all the moving parts straight — this project has grown beyond what I can hold in my head at once

I am not offended when you push back on my ideas. If I say "let's do X" and X is a bad idea, I want you to tell me and explain why. I'm trying to build something real and I need honest technical partnership, not a yes-machine.

---

## 2. What We've Built

ServiceDraft.AI is a **live production SaaS application** at `https://servicedraft.ai`. It is currently in beta with my own dealership as the first team. Here is a high-level summary of what exists today:

### Core narrative generation

- **Two story types:** Diagnostic Only (pre-repair) and Repair Complete (post-repair)
- Full 9/10 field input system with per-field dropdowns (Include / Don't Include / Generate)
- AI narrative generation via Google Gemini (`gemini-3-flash-preview`)
- Pre-generation and post-generation customization (length / tone / detail level sliders)
- Story-type-aware proofreading (warranty audit for repair complete, authorization readiness for diagnostic only)
- Selective edit application from proofread results
- Manual narrative editing via Edit Story modal
- Diagnostic → Repair Complete update flow (both narratives preserved as separate DB rows)

### Authentication & onboarding

- **3-step OTP-based signup** (replaced an earlier magic-link / PKCE flow that kept failing cross-browser)
- Server-side login/logout via `/api/auth/*` routes
- Session cookies managed via Supabase SSR library
- 8-hour auto-logout via `useSessionExpiry` hook
- www → non-www 308 redirect in middleware to fix cookie scope
- 5-second timeout on middleware `getUser()` to prevent blank-screen hangs
- `clearExpiredAuthCookies()` guard before browser Supabase client initialization

### User profile & preferences

- User Dashboard with Profile, Preferences, Narrative History, Saved Repairs tabs
- 9 accent colors (Violet, Red, Orange, Yellow, Green, Blue, Pink, Noir, White)
- Dark mode / light mode toggle
- Background animation toggle (particle network on/off)
- Position-based icons (Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk)
- Self-service account deletion

### Saved repair templates

- Users can save current Input Page field values as reusable templates
- Templates are vehicle-agnostic (only the 5 core diagnostic/repair fields are saved)
- Load / edit / delete templates from the User Dashboard Saved Repairs tab
- Load button on Input Page via the My Repairs slide-out panel

### Team system

- Teams are created by the Platform Owner and have unique access codes
- Users can be assigned to a team (via signup access code OR by owner action)
- Team Managers (admin role) can view their team's members and activity
- `teams` + `team_members` tables with `users.team_id` for fast reads
- Team access codes bypass Stripe subscription during signup

### Owner Dashboard (6 tabs)

- **Overview** — 8 metric cards + System Health card showing `APP_VERSION`
- **Activity Log** — platform-wide activity with search, filter, sort, detail modal
- **User Management** — sortable user table with inline actions, team assignment, CREATE TEAM button
- **Analytics** — Recharts-powered charts with time range selector (7d/30d/90d/all)
- **API Usage** — Gemini token usage tracking with cost estimation
- **Settings** — Token Calculator widget + access code display

### Team Dashboard (2 tabs, admin role)

- **Team Members** — table of all users in the manager's team
- **Activity Log** — team-scoped activity with the shared detail modal

### Exports

- PDF (jsPDF server-side)
- DOCX (docx library server-side)
- Print (client-side HTML)
- Email (Resend, up to 10 recipients per send)
- Copy to clipboard
- All export actions auto-save the narrative to history first

### Version automation

- Single source of truth in `src/lib/version.ts` → exports `APP_VERSION`
- Displayed in two places: NavBar center + Owner Dashboard System Health card
- Mandatory patch bump on every sprint via `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` rule
- `package.json` version kept in sync (minus `v` prefix and `-beta` suffix)

### Token usage instrumentation

- All 6 AI-calling routes log to `api_usage_log` table
- Aggregated via `/api/admin/usage` for Owner Dashboard display
- Cost estimation using current Gemini pricing ($0.50/1M input, $3.00/1M output tokens)

### Activity logging

- Fire-and-forget pattern via `src/lib/activityLogger.ts`
- Logged actions: generate, regenerate, customize, proofread, save, export_*, login
- Enhanced metadata on generate/regenerate/customize/save actions (narrative preview, vehicle info, RO#)

### Rate limiting & restrictions

- `/api/generate` limited to 20 requests per user per 15 minutes (in-memory)
- Compiled data block capped at 10,000 characters
- `is_restricted` flag blocks generation for disciplined accounts

### What's NOT yet built

- **Saved Contacts System** — planned Sprint #4 (contact directory for email exports)
- **Internal User Messaging System** — architecture designed, not built
- **Landing Page expansion** — backlog, larger feature
- **Vercel Pro upgrade** — required before charging customers (Hobby plan prohibits commercial use)
- **Full Stripe subscription billing** — webhook is wired but beta uses access codes
- **Supabase email confirmation re-enabled** — currently disabled for beta testing convenience

---

## 3. Complete Technology Stack

### Core framework

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| React | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS (v4, CSS-first config) | 4.x |

There is **NO `tailwind.config.ts` file**. All Tailwind theme configuration lives inside `@theme inline { ... }` blocks in `src/app/globals.css`.

### Backend services

| Service | Package | Purpose |
|---|---|---|
| Supabase | `@supabase/supabase-js` 2.95+ / `@supabase/ssr` 0.8+ | Auth (OTP), PostgreSQL, RLS, session cookies |
| Google Gemini | `@google/generative-ai` 0.24+ | AI narrative generation via `gemini-3-flash-preview` |
| Stripe | `stripe` 20.3.1 | Subscription billing (wired but beta uses access codes) |
| Resend | `resend` 6.9.2 | Transactional email (exports + password resets) |

### Frontend libraries

| Package | Purpose |
|---|---|
| `framer-motion` 12.34+ | All animations (page transitions, modals, buttons, hero wave) |
| `recharts` 3.8+ | Owner Dashboard analytics charts |
| `jspdf` 4.2+ | PDF export generation |
| `docx` 9.5+ | DOCX export generation |
| `lucide-react` 0.564+ | SVG icon library |
| `react-hot-toast` 2.6+ | Toast notifications |

### Infrastructure

- **Hosting:** Vercel (Hobby plan, upgrade to Pro pending)
- **DNS:** Cloudflare — proxy MUST be disabled (grey cloud / DNS-only). Orange cloud breaks Vercel SSL.
- **Version control:** GitHub at `github.com/Tcloyd30689/servicedraft-ai`, main branch, auto-deploys to Vercel on push
- **Database:** Supabase project `ejhcirejshqpctfqeawi`

### Key project identifiers

- **Canonical domain:** `https://servicedraft.ai` (non-www, purchased via Cloudflare)
- **`NEXT_PUBLIC_APP_URL`:** `https://servicedraft.ai`
- **Beta access code:** `WHISLER-BETA-2026` (env var `ACCESS_CODE`)
- **Vercel project ID:** `prj_0u5KZQ8KQbs8p2ddMUmgzsc52IB6`
- **Vercel team:** `team_ZJDFKq6wgKwx375WzMmfsG4u`
- **Resend sender:** `noreply@servicedraft.ai` (lowercase — case sensitivity matters for DKIM)

---

## 4. User Role Hierarchy

ServiceDraft.AI uses a 3-tier role system:

| Role | Label in UI | What They Can Do |
|---|---|---|
| `owner` | Platform Owner | Everything — Owner Dashboard, user management, team management, all analytics, API usage tracking, role changes |
| `admin` | Team Manager | Team Dashboard — view team members, team-scoped activity log, limited team management |
| `user` | Standard User | Generate narratives, manage own profile, use saved repair templates, export documents |

Currently I (Tyler / `hvcadip@gmail.com`) am the only `owner` in the system. My account is marked as a **Protected User** — the Owner Dashboard User Management table shows a "Protected" badge with a ShieldCheck icon instead of delete/restrict buttons to prevent me from accidentally bricking the admin account.

Role transitions happen via the Owner Dashboard:

- `promote_to_admin` — user → admin
- `demote_to_user` — admin → user
- `owner` cannot be assigned through the UI; it's set directly in the database

### Why the 3-tier system exists

Originally there was a simpler 2-tier system (admin + user). When we added the team concept, we realized we needed a way to distinguish "the person who runs the whole platform" (me) from "the person who manages a single dealership's team" (a service manager or foreman who should see only their shop's data). The 3-tier system gives us:

- **Owner** → sees everything across all teams
- **Admin (Team Manager)** → sees only their own team
- **User** → sees only themselves

This matters because a service manager at one dealership shouldn't see another dealership's activity, user data, or narratives.

---

## 5. Complete Application Workflow

The typical path a technician takes through the app:

1. **Sign up** — 3-step OTP flow (email code → password + profile → access code activation)
2. **Log in** — email + password
3. **Main Menu** — clicks "Generate Story"
4. **Input Page** — picks Diagnostic Only or Repair Complete
5. **Fill fields** — required info (RO#, vehicle, customer concern) plus conditional fields
6. **Optional pre-gen customization** — adjusts length/tone/detail sliders
7. **Clicks GENERATE NARRATIVE**
8. **Narrative Page** — sees the generated narrative with typing animation
9. **Optional actions:**
   - Customize (slider-based restyle)
   - Proofread (audit for warranty compliance or authorization readiness)
   - Apply selected edits from proofread results
   - Manual edit via Edit Story modal
   - Format toggle (Block ↔ C/C/C)
10. **Save** — explicit save OR auto-save on export
11. **Export** — PDF, DOCX, Print, Email, or Copy
12. **Later:** returns to User Dashboard → Narrative History to find the saved narrative, optionally updates a diagnostic with the completed repair

See `ServiceDraft_AI_Spec.md` sections 16.1–16.5 for full workflow diagrams.

---

## 6. Input Page Specifications

### Story type selection

The top of the Input Page shows two large cards: "Diagnostic Only" and "Repair Complete". The user must select one before the field form appears.

When the user switches between story types mid-entry, shared fields (1–8 across both types) are preserved. Only the last 1–2 fields reset.

### Field list — Diagnostic Only (9 fields)

| # | Field | Required | Dropdown | Notes |
|---|---|---|---|---|
| 1 | R.O. # | ✅ | ❌ | Not sent to AI, used only for display/save/export |
| 2 | Year | ✅ | ❌ | |
| 3 | Make | ✅ | ❌ | |
| 4 | Model | ✅ | ❌ | |
| 5 | Customer Concern | ✅ | ❌ | |
| 6 | Codes Present | ❌ | ✅ | |
| 7 | Diagnostics Performed | ❌ | ✅ | |
| 8 | Root Cause / Failure | ❌ | ✅ | |
| 9 | Recommended Action | ❌ | ✅ | |

### Field list — Repair Complete (10 fields)

| # | Field | Required | Dropdown | Notes |
|---|---|---|---|---|
| 1 | R.O. # | ✅ | ❌ | |
| 2 | Year | ✅ | ❌ | |
| 3 | Make | ✅ | ❌ | |
| 4 | Model | ✅ | ❌ | |
| 5 | Customer Concern | ✅ | ❌ | |
| 6 | Codes Present | ❌ | ✅ | |
| 7 | Diagnostics Performed | ❌ | ✅ | |
| 8 | Root Cause / Failure | ❌ | ✅ | |
| 9 | Repair Performed | ❌ | ✅ | |
| 10 | Repair Verification | ❌ | ✅ | |

### Conditional field dropdown options

Each conditional field (6+) has a dropdown with three options:

- **Include Information** — field accepts user text (default state)
- **Don't Include Information** — field is hidden; content is entirely omitted from the compiled data block sent to the AI
- **Generate Applicable Info** — field is hidden; an AI inference template is substituted, instructing the model to infer reasonable content

### Pre-Generation Customization panel

Collapsible panel below the form fields containing three sliders:

- **Length:** Short / No Change / Extended
- **Tone:** Warranty / No Change / Customer Friendly
- **Detail Level:** Concise / No Change / Additional Steps

The center position ("No Change") maps to an empty modifier string — no instruction is added to the prompt. Settings persist in localStorage as `sd-pregen-customization` between sessions.

### My Repairs panel

A slide-out panel from the right side of the screen, triggered by the "MY REPAIRS" button. Displays a list of saved repair templates. Clicking "Load" on a template populates the Input Page fields with the saved values. Panel is portaled to `document.body` and positioned at `top: 164px` (below the hero + nav stack).

### SAVE AS REPAIR modal

Opens when the user clicks "Save Current as Repair". Modal has a template name input and a preview of which fields will be saved (only the 5 core diagnostic/repair fields are saved — vehicle info and customer concern are explicitly excluded since templates are vehicle-agnostic).

### GENERATE NARRATIVE button

Large primary button at the bottom of the form. Disabled until all required fields are filled. Submits to `POST /api/generate`.

---

## 7. Generated Narrative Page Specifications

### Narrative display

The narrative is shown in either **Block format** (single flowing paragraph) or **C/C/C format** (three labeled sections: CONCERN, CAUSE, CORRECTION). The format toggle is purely client-side — both representations are already in the JSON response from Gemini, so switching formats doesn't trigger an API call.

Default format comes from `users.preferences.templates.defaultFormat` (defaults to `'ccc'` if unset).

### Typing animation

When a narrative is first displayed, text reveals character-by-character over ~2 seconds. The animation is skippable by clicking anywhere on the narrative or pressing any key.

Only runs on fresh narratives. When loading a saved narrative from the dashboard, the animation is skipped.

### Proofread highlighting

When proofread results are received, the narrative display highlights matched snippets with an accent-colored background that fades out over 30 seconds. A counter badge shows the number of active highlights, and a "Clear Highlights" button allows immediate removal.

### Customization Panel

Three sliders with the same options as pre-gen customization:

- **Length:** Short / No Change / Extended
- **Tone:** Warranty / No Change / Customer Friendly
- **Detail Level:** Concise / No Change / Additional Steps

Plus a **Custom Instructions** text field with `maxLength={50}` and a character counter.

Clicking CUSTOMIZE sends the CURRENTLY DISPLAYED narrative (not the original input data) plus the customization preferences to `/api/customize`. This means any manual edits via the Edit Story modal are preserved and customized on top of.

### Action buttons

| Button | Action |
|---|---|
| CUSTOMIZE | POST to `/api/customize` with narrative + slider values |
| PROOFREAD | POST to `/api/proofread` — uses story-type-aware prompt |
| EDIT STORY | Opens `EditStoryModal` with auto-expanding textareas |
| NEW STORY | Reset confirmation → navigates back to Input Page |
| SAVE STORY | Explicit save → POST to `/api/narratives/save` |
| SHARE / EXPORT | Opens `ShareExportModal` |

### Proofread results panel

Appears after a proofread call completes. Displays:

- Overall rating badge (PASS / NEEDS_REVIEW / FAIL)
- Summary sentence
- List of flagged issues, each with a checkbox (all checked by default)
- "Select All / Deselect All" toggle
- "APPLY SELECTED EDITS" button → sends only the checked suggestions to `/api/apply-edits`

### Navigation guards

When `state.isSaved === false`:

- Browser close/back/refresh → native `beforeunload` dialog
- Click on a nav bar link → custom "Unsaved Narrative" modal with STAY ON PAGE / LEAVE WITHOUT SAVING options
- NEW STORY button → reset confirmation dialog
- Export action → auto-save first, then export

The guards are automatically removed when `isSaved` becomes true.

---

## 8. User Dashboard Specifications

The `/dashboard` route is the user's personal page. It has four tabs:

### Profile tab

- Large position-based icon (e.g., Wrench for Technician)
- Full name (first + last)
- Email
- Location (US state)
- Position
- "Edit Profile" button → opens `EditProfileModal`

### Preferences tab

- `AccentColorPicker` — 9 color swatches
- Dark mode / Light mode toggle
- Background animation toggle (particle network on/off)
- Default narrative format (Block or C/C/C)
- "Delete Account" button (destructive) → confirmation → POST to `/api/delete-account`

### Narrative History tab

Searchable, sortable, filterable table of saved narratives:

- Search by RO#, vehicle, or narrative text
- Sort by date (newest/oldest) or RO#
- Filter by story type
- Clicking a row opens `NarrativeDetailModal`

### NarrativeDetailModal

Read-only view of the saved narrative with:

- Vehicle info + RO# header
- Block format narrative display
- Format toggle
- Export actions (PDF, DOCX, Print, Email, Copy)
- For diagnostic-only narratives: **UPDATE NARRATIVE WITH REPAIR** button → opens `UpdateWithRepairModal`

### Saved Repairs tab

Grid of template cards:

- Each card shows template name, story type, and a preview of the 5 saved fields
- Actions: **Load** (navigates to Input Page with fields pre-filled), **Edit** (opens `EditRepairModal`), **Delete**

---

## 9. Owner Dashboard

The Owner Dashboard is accessible at `/admin`. It is owner-only — non-owners are redirected.

### Tab 1 — Overview

Eight metric cards:

1. Total Users
2. New Users This Week
3. New Users This Month
4. Active Subscriptions
5. Total Narratives
6. Narratives This Week
7. Narratives Today
8. Total Generations

Plus a **System Health card** that displays:
- `APP_VERSION` (from `src/lib/version.ts` via the analytics API)
- Database row counts per table
- Last activity timestamp

### Tab 2 — Activity Log

Paginated table of all platform activity:

- Search, action type filter, sort by date
- Columns: User, Action, Timestamp, Story Type, Vehicle Info, Actions
- Clicking a row opens `ActivityDetailModal` with:
  - Action type badge (color-coded)
  - Full timestamp (MM/DD/YYYY HH:MM AM/PM)
  - User info (name + email)
  - Vehicle info, RO number, story type
  - Narrative text in scrollable container
  - Input data
  - Collapsible "View Raw Data" JSON section

### Tab 3 — User Management

Sortable user table with:

- Columns: Name, Email (truncated + tooltip), Role, Subscription, Team, Narrative Count, Last Active, Actions
- Inline action buttons per row:
  - Send password reset
  - Restrict / unrestrict
  - Change subscription status
  - Promote / demote role
  - Assign to team
  - Delete user
- "CREATE TEAM" button in tab header

### Tab 4 — Analytics

Recharts-powered charts with a time range selector (7d / 30d / 90d / all):

- **LineChart** — generation trends over time
- **BarChart** — activity by action type
- **PieChart** — story type distribution
- **AreaChart** — usage over time

Auto-refreshes every 60 seconds.

### Tab 5 — API Usage

Gemini token usage tracking:

- Summary cards: Total Tokens, Total Cost, Average per Call
- Daily token/cost line charts
- Action breakdown pie chart
- Top users leaderboard

### Tab 6 — Settings

- **Token Calculator** — interactive widget for estimating Gemini API costs
- Current access code display

---

## 10. Team Dashboard

The Team Dashboard is accessible at `/team-dashboard` and is admin-only (Team Managers). It's scoped to the current user's team — a manager sees only their own team's data.

### Tab 1 — Team Members

Table of all users in the manager's team:

- Columns: Name, Email (truncated + tooltip), Position, Role, Last Active, Actions
- Remove member action button

### Tab 2 — Activity Log

Team-scoped activity table. Same format as Owner Dashboard's activity log but filtered to only show entries from users in this team. Clickable rows open the shared `ActivityDetailModal`.

---

## 11. Team Management System

### How teams work

Teams are organizational groups of users managed by the Platform Owner. Each team has:

- A name (e.g., "Whisler Chevy Service")
- A unique access code (e.g., `WHISLER-BETA-2026`)
- An optional description
- An `is_active` flag (for soft delete)
- A `created_by` user ID

Users are assigned to at most one team at a time. Team membership is tracked in two places:

- `users.team_id` — the "live" assignment (fast reads)
- `team_members` table — the historical join table

When a user is assigned to a team, both are updated. When removed, both are cleared.

### Creating a team

Only the owner can create teams. Flow:

1. Owner clicks "CREATE TEAM" in User Management tab header
2. Modal with team name input
3. On submit: calls `POST /api/admin` with action `create_team`
4. Server generates a random access code and creates the team
5. New team is immediately available in all Assign to Team dropdowns

### Assigning a user to a team

Owner clicks "Assign to Team" action button on a user row:

1. Modal shows current team assignment
2. Dropdown of all teams with member counts
3. Select a team → click Assign
4. Server calls `POST /api/admin` with action `assign_user`, params `{ userId, teamId }`
5. `users.team_id` updates AND a `team_members` row is created
6. Table updates immediately

### Signup auto-assignment via access code

When a user enters an access code during signup Step 3:

1. First check: Does the code match the global `ACCESS_CODE` env var? → Grants `subscription_status: 'bypass'`, no team
2. Second check: Does the code match any `teams.access_code`? → Grants bypass AND auto-assigns to that team
3. No match: Redirects to Stripe checkout (future)

---

## 12. Export Document Specifications

All exports use the same shared utility (`src/lib/exportUtils.ts`) and produce identically formatted documents across PDF, DOCX, Print, and Email.

### Shared payload interface

```typescript
interface ExportPayload {
  narrative: { block_narrative, concern, cause, correction };
  displayFormat: 'block' | 'ccc';
  vehicleInfo: { year, make, model, roNumber };
}
```

### Document layout

1. **Footer logo** — `ServiceDraft-Ai Vector Logo.png` in the bottom-right corner (25×12mm for PDF, 55×26px for DOCX, maintaining 2.09:1 aspect ratio)
2. **Two-column header:**
   - LEFT: "Vehicle Information:" bold underlined, followed by YEAR/MAKE/MODEL label:value lines
   - RIGHT: "Repair Order #:" bold underlined, followed by the RO number in 20pt bold
3. **Title:** "REPAIR NARRATIVE" — 18pt bold underlined, centered
4. **Body:**
   - Block format: single paragraph of `block_narrative`
   - C/C/C format: three sections with 13pt bold italic underlined headers ("CONCERN:", "CAUSE:", "CORRECTION:") and 11pt regular body text
5. **Font:** Helvetica (PDF) / Arial (DOCX) / inherited (email) / Helvetica (print)

### Export endpoints

| Endpoint | Library |
|---|---|
| `POST /api/export-pdf` | jsPDF 4.2+ (server-side) |
| `POST /api/export-docx` | docx 9.5+ (server-side) |
| `POST /api/send-email` | Resend 6.9+ |
| (client-side) `buildPrintHtml()` | Native browser print |

### Email export

Both HTML and plain-text versions are sent. The HTML version matches the exact document layout. Maximum 10 recipients per send. Sender is `noreply@servicedraft.ai` (must be lowercase for DKIM alignment).

### Auto-save on export

All export actions call an internal auto-save function that writes the narrative to the database before proceeding. A toast "Narrative auto-saved to your history" appears (deduplicated via `{ id: 'auto-save' }`).

---

## 13. API Route Inventory

### AI-calling routes (6)

| Endpoint | Purpose |
|---|---|
| `/api/generate` | Initial narrative generation |
| `/api/customize` | Post-generation slider-based restyling |
| `/api/proofread` | Story-type-aware audit |
| `/api/apply-edits` | Merge selected proofread suggestions |
| `/api/update-narrative` | Diagnostic → Repair Complete conversion |
| `/api/convert-recommendation` | (Legacy, unused) |

### Data routes

| Endpoint | Purpose |
|---|---|
| `/api/narratives` (GET) | List saved narratives |
| `/api/narratives/save` (POST) | INSERT new narrative |
| `/api/saved-repairs` (GET/POST) | List or create templates |
| `/api/saved-repairs/[id]` (PUT/DELETE) | Update or delete a template |
| `/api/activity-log` (GET) | Fetch activity entries |
| `/api/narrative-tracker` (POST) | Track narrative interactions |
| `/api/preferences` (GET/PUT) | User preferences JSONB |
| `/api/me` (GET) | Current user profile (used by useAuth) |
| `/api/support` (POST) | Submit support ticket |

### Export routes

| Endpoint | Purpose |
|---|---|
| `/api/export-pdf` | Generate and return PDF |
| `/api/export-docx` | Generate and return DOCX |
| `/api/send-email` | Email via Resend |

### Auth & signup routes (⚠️ PROTECTED)

| Endpoint | Purpose |
|---|---|
| `/api/auth/login` | Server-side login |
| `/api/auth/logout` | Server-side logout |
| `/api/signup/verify-otp` | OTP code verification |
| `/api/signup/complete-profile` | Password + profile creation |
| `/api/signup/activate` | Access code activation + team assignment |
| `/auth/callback` | Supabase code exchange fallback |

### Admin & team routes

| Endpoint | Role | Purpose |
|---|---|---|
| `/api/admin` | owner | User + team management actions |
| `/api/admin/analytics` | owner | Dashboard metrics + APP_VERSION |
| `/api/admin/usage` | owner | Gemini token usage stats |
| `/api/teams` | admin+ | Team CRUD |
| `/api/teams/members` | admin+ | Team member operations |
| `/api/teams/activity` | admin+ | Team-scoped activity log |

### Payment routes (⚠️ PROTECTED)

| Endpoint | Purpose |
|---|---|
| `/api/stripe` | Checkout session + access code bypass |
| `/api/stripe/webhook` | Stripe webhook handler |

### Account

| Endpoint | Purpose |
|---|---|
| `/api/delete-account` | Self-service account deletion |

---

## 14. Database Schema

Seven active tables in the Supabase PostgreSQL database. All have RLS enabled. For full DDL, see `ServiceDraft_AI_Spec.md` section 7 or `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`.

### Quick reference

| Table | Purpose |
|---|---|
| `public.users` | User profiles (id, email, name, role, subscription_status, team_id, preferences JSONB) |
| `public.narratives` | Saved narratives (ro_number, vehicle info, concern/cause/correction, story_type) |
| `public.activity_log` | User activity tracking (FK to public.users, not auth.users) |
| `public.saved_repairs` | Vehicle-agnostic repair templates |
| `public.teams` | Team records with access_code and is_active |
| `public.team_members` | Junction table for team membership |
| `public.api_usage_log` | Gemini token usage per API call |

### Critical rules

- **`narratives` has NO unique constraint** on `(user_id, ro_number)` — diagnostic and repair-complete can share an RO#
- **`activity_log.user_id` FK points to `public.users`**, NOT `auth.users` (required for PostgREST joins)
- **`users.preferences` JSONB** stores appearance + template preferences
- **`team_members` has UNIQUE(team_id, user_id)** to prevent duplicate memberships
- Most migrations were applied via SQL Editor directly — `supabase_migrations.schema_migrations` is unreliable as a history source; use the migration files in `supabase/migrations/` plus the list in `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`

---

## 15. Design & Aesthetic

### The vibe

Automotive-tech futurism + glassmorphism + cinematic depth. Modern scan tool crossed with a sci-fi cockpit. Not a generic SaaS dashboard.

### Core design principles

1. **Accent-driven theming** — 9 accent colors cascade through every border, glow, and tint via CSS variables. The UI feels unified regardless of which accent is selected.
2. **Glassmorphism with depth** — containers are blurred translucent surfaces layered over a gradient body.
3. **Motion with restraint** — Framer Motion with a spring config (stiffness 400, damping 25) everywhere.
4. **Dark-first, light-mode-capable** — dark mode is the default. Light mode works and is tested but feels like a different mood, not a forced inversion.
5. **Cursor underglow on cards, scale on buttons** — cards never scale on hover. Buttons scale (1.05 hover / 0.95 tap) + glow.
6. **Professional data density** — tables are dense and center-aligned with glowing row hover.

### The 9 accent colors

| Display Name | Internal Key | Hex | Forces Mode |
|---|---|---|---|
| Violet | `violet` | `#9333ea` | — (default) |
| Red | `red` | `#dc2626` | — |
| Orange | `orange` | `#ea580c` | — |
| Yellow | `yellow` | `#eab308` | — |
| Green | `green` | `#84cc16` | — |
| Blue | `blue` | `#2563eb` | — |
| Pink | `pink` | `#d946ef` | — |
| **Noir** | `white` | `#e2e8f0` | Forces dark mode |
| **White** | `black` | `#1e293b` | Forces light mode |

The last two have display names that don't match their internal keys. This is intentional — the display names were updated to match how the accent feels on its background (a very light accent becomes "Noir" when viewed on dark, a very dark accent becomes "White" when viewed on light). Do not rename the internal keys without a coordinated migration of localStorage and Supabase data.

### Typography

- **Orbitron** — headers, navigation, titles, body (primary)
- **Inter** — user-entered text and generated narrative content (via `.font-data` class)

Both loaded via `next/font/google` in `src/app/layout.tsx`.

### Core component library

- `LiquidCard` — glassmorphism container, 23px border radius, 5% accent tint background
- `Modal` — opaque panel with 24px backdrop blur, supports X / backdrop / Escape close
- `Button` — 3 variants (primary, secondary, ghost), spring animation + glow shadow
- `Input` / `Textarea` / `Select` — themed form controls with focus ring
- `CursorGlow` — wrapper for cursor-tracked radial gradient (instead of scale) on cards
- `ParticleNetwork` — full-page background animation on protected pages
- `WaveBackground` — sine wave animation on landing / auth pages
- `HeroArea` — 100px reactive hero wave that pulses on user activity
- `PositionIcon` — position-based SVG icons

### Page layout structure (protected pages)

```
HeroArea (100px) + NavBar (64px) + ParticleNetwork (background) + PageTransition wrapper
```

Total sticky top height is 164px, so `main` has `pt-[164px]`.

For full design details, see `ServiceDraft_AI_UI_Design_Spec.md`.

---

## 16. How to Communicate With Me

### Tone and approach

- **Be decisive, not exploratory.** When I ask a question, I usually want a recommendation, not a list of possibilities. I'd rather hear "here's what I'd do and why" than "here are 4 options, what do you think?"
- **Be direct.** I don't need soft language or hedging. If something is a bad idea, say it's a bad idea.
- **Push back on me when I'm wrong.** I can handle being corrected. What I can't handle is building something broken because nobody told me my idea had a problem.
- **Explain tradeoffs clearly.** When there are multiple reasonable paths, lay out the tradeoffs honestly and tell me which one you'd pick.
- **Use automotive diagnostics analogies when helpful.** I'll grok them faster than generic software metaphors. "Your auth middleware is like a pre-purchase inspection — if it's too strict it blocks good buyers, if it's too lenient bad cars slip through" is more useful to me than "your middleware is like a filter chain."
- **Don't flatter me.** I don't need "great question!" or "that's a thoughtful observation." Just answer.

### Formatting preferences

- **Markdown is fine, even preferred** for technical responses. Tables, code blocks, bold, and bullet lists all help.
- **Keep it skimmable.** I read code and docs all day — I can handle dense information, but I appreciate clear section headers.
- **Long responses are fine when warranted.** Don't truncate to be polite if the topic needs depth.
- **Short responses are fine too.** Not every question needs a three-section essay.
- **I communicate in all-caps when I want emphasis or when I'm in a rush.** Don't read it as me being angry — that's just how I type when I'm working fast. Respond normally.
- **I'm comfortable with emojis in moderation** — section headers, warnings, status indicators. Don't overdo it, but don't avoid them either.

### What I want from a sprint prompt

When I ask you to prepare a prompt for Claude Code:

1. **One fenced code block per sprint**, ready to paste into the Cursor terminal with zero editing
2. **Start the prompt with an instruction to read `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`** — this is non-negotiable
3. **Explicit task list** with exact file paths and line numbers where known
4. **Risk assessment** before the tasks — tell me which protected files are touched (if any) and whether the DOUBLE-CHECK PROTOCOL will fire
5. **Explicit end-of-sprint instructions** — update `BUILD_PROGRESS_TRACKER.md`, bump the version per the MANDATORY VERSION BUMP RULE, commit locally (never push), and report back to me
6. **If the sprint is too big for one Claude Code session**, split it into multiple fenced blocks (sprint 1, sprint 2, etc.) and tell me the order to run them in
7. **No pushing to GitHub** — I push manually after local testing because the app is live and I don't want untested code deployed

### What I DON'T want

- **Hand-holding through obvious things.** I know what git is. I know what npm is. Skip the preamble.
- **Excessive caveats or warnings.** One clear warning is better than five wishy-washy ones.
- **Guessing when you could just look.** If you're working on code and you're not sure about something, clone the repo or read the file — don't guess.
- **Rewriting something I didn't ask you to rewrite.** Scope creep is real. Stay on task.
- **Pretending you know something you don't.** If you're not sure, say so and figure out how to find out.

### When I'm asking for something potentially dangerous

If I ask you to do something that would touch auth, payments, or data deletion — or anything in the PROTECTED FILES list in `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` — walk me through the risk before you prepare the sprint prompt. I'd rather spend 3 minutes in dialogue than 3 hours undoing a breakage on the live site. Once I've understood and confirmed, you can proceed.

If I seem to be asking for something that contradicts something I said earlier, or that would undo recent work, flag it. I might have forgotten or changed my mind without thinking it through.

### When you mess up

If you make a mistake — give me wrong info, break something, miss a detail — just own it. Don't apologize excessively, don't self-flagellate, don't promise it'll never happen again. Just say "yeah, I got that wrong, here's what the correct answer is" and move on. I'd rather have that than a paragraph of contrition.

---

## 17. Project Knowledge Files

The project uses a set of markdown documentation files that are kept in sync between the codebase repo and the Claude Project knowledge base.

### Core docs (what to read when)

| File | When to Read |
|---|---|
| `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` | Claude Code reads this at the start of EVERY sprint. Claude desktop reads this when planning technical changes or when a question touches implementation details. |
| `ServiceDraft_AI_Spec.md` | When orienting to the app's overall functionality, answering "what does the app do" questions, or when a new conversation starts and context is needed. |
| `ServiceDraft_AI_Project_Instructions.md` (this document) | Claude desktop reads this at the start of every conversation to understand who Tyler is, how he works, and how to communicate. |
| `ServiceDraft_AI_Prompt_Logic.md` | When debugging or tweaking how the AI behaves — prompt edits, JSON schema questions, customization logic. |
| `ServiceDraft_AI_UI_Design_Spec.md` | When building new UI or asking "how should this look?" — colors, typography, component patterns. |

### Tracking files

| File | Purpose |
|---|---|
| `BUILD_PROGRESS_TRACKER.md` | Sprint history log. **Write-only during sessions** to save context tokens — Claude Code does NOT read this at the start of a sprint. Claude Code writes to it at the end. |
| `DEPLOYMENT_NOTES.md` | Environment variables, RLS policies, Stripe webhook setup, security measures. Reference only. |
| `PRE_BUILD_SETUP_CHECKLIST.md` | Pre-build environment checklist (mostly historical at this point). |

### Assets

| File | Usage |
|---|---|
| `SERVIDRAFT.AI LOGO #1 .PNG` | Primary square logo, used on hero area and landing/auth pages |
| `ServiceDraft-Ai Vector Logo.png` | Horizontal wordmark, used in NavBar and all exports |

### Filename convention going forward

We're migrating all spec docs to clean filenames without version suffixes (e.g., `ServiceDraft_AI_Spec.md` instead of `ServiceDraft_AI_Spec_v1_3.md`). When you see versioned files in the repo, treat the most recent version as canonical. Future updates overwrite in place.

---

## 18. Project Continuity Rules

### Git workflow

- **Branch:** main only
- **Deployment:** Vercel auto-deploys on push to main
- **Local testing:** I test every change on localhost BEFORE pushing
- **Pushing:** I push manually after I've verified the change works locally
- **Claude Code NEVER pushes** — it commits locally and stops, then reports to me

### Sprint structure

1. Claude desktop (you) audits the current state of the codebase via a fresh git clone
2. Claude desktop plans the sprint and produces a detailed sprint prompt in a single code block
3. I paste the prompt into Claude Code in my Cursor IDE terminal
4. Claude Code reads `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` first, then executes the sprint tasks
5. Claude Code bumps the app version per the MANDATORY VERSION BUMP RULE
6. Claude Code updates `BUILD_PROGRESS_TRACKER.md`
7. Claude Code commits locally (never pushes) with a descriptive message including the new version
8. Claude Code reports back to me what was done and what to test
9. I test on localhost
10. If good, I push to GitHub manually; Vercel auto-deploys

### Pre-sprint audit is mandatory

Before you prepare ANY sprint prompt, you must clone the repo fresh and audit the live code. Do NOT rely on your memory of what the codebase looks like — it drifts. Do NOT rely on what the spec docs say — they can be stale. **The live code in GitHub is the source of truth, always.**

The pattern:
```bash
cd /tmp && rm -rf servicedraft-ai && git clone --depth 1 https://github.com/Tcloyd30689/servicedraft-ai.git
```

Then look at the actual files involved in the sprint you're about to plan.

### Don't read BUILD_PROGRESS_TRACKER.md at session start

The progress tracker is a big file. Reading it at the start of every session would waste significant context tokens. The tracker is write-only during sprints — Claude Code writes to it at the end, but doesn't read it at the beginning. All the context Claude Code needs is in the sprint prompt itself.

### The DOUBLE-CHECK PROTOCOL

Before modifying any file in the PROTECTED FILES list (see `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`), or before doing any change that falls into one of the hard-stop categories (auth, destructive migrations, RLS, Stripe, safeguard removal, file/route/data deletion), Claude Code MUST:

1. **STOP** — do not begin editing
2. **ALERT** — output a clearly-marked `🛑 SAFEGUARD TRIGGERED` block
3. **EXPLAIN** — in plain English, what the change would do and what could go wrong
4. **ASK** — "Do you want me to proceed with this change? Please respond with 'yes' or 'no'."

Then wait for my explicit `yes` before proceeding. Anything other than `yes` defaults to `no`.

### Soft check: blast radius summary

For any change that touches 5 or more files across multiple subsystems, Claude Code outputs a brief blast radius summary before starting — no approval required, just making the scope visible.

### Mandatory version bump on every sprint

Every sprint bumps the version in `src/lib/version.ts` (and keeps `package.json` in sync) before the final commit. Default is a patch bump. Minor/major bumps only when the sprint prompt explicitly specifies.

### When a sprint fails

If Claude Code runs into a blocker it can't resolve:

1. Add a `⚠️ BLOCKED:` note in the tracker
2. Explain to me what's needed
3. Move to the next task that can be done independently (if any)
4. Don't silently fail or produce broken code

### When in doubt, ask

The app is live. I'm risk-averse for good reason. When you're not sure whether to do something, ask me first. I'd rather spend 2 minutes clarifying than 2 hours cleaning up.

---

## 19. Quality Standards

### Code quality expectations

- **TypeScript for all new files.** No JavaScript in new code.
- **Strict typing.** No `any` unless there's a justified reason (and even then, add a comment).
- **Error handling on every API call.** Wrap in try/catch, return appropriate HTTP status codes, log errors with `console.error`, show user-facing errors as toasts.
- **No hardcoded hex colors.** Use CSS variables. Every time.
- **No browser Supabase client for data operations.** Always route through server-side API routes.
- **No console.log in production.** Use `console.error` for debugging only.
- **No unused imports.** ESLint should catch these.
- **Keep components focused.** A component that's doing three things should probably be three components.

### Testing expectations

- `npm run build` must succeed before every commit
- `npm run dev` must run without errors
- Manual smoke test on localhost before I push to GitHub
- No automated test suite currently — the app is too UI-heavy and moves too fast for tests to pay off right now. This will change before full public launch.

### Documentation expectations

- Every protected file decision gets recorded in `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`
- Every painful lesson gets added to the CRITICAL LESSONS LEARNED appendix
- Spec docs are kept up to date (this is the current rewrite sprint)
- Sprint prompts must include the context needed to execute the sprint without requiring Claude Code to re-audit the entire codebase

### Architecture expectations

- Respect existing patterns. Don't introduce Redux because you're more comfortable with it.
- Respect the 3-tier role system. Every new feature needs to think about role gating.
- Respect the module-level singleton pattern for state. Don't add React Context for data.
- Respect the server-side data access rule. No exceptions.
- Respect the PROTECTED FILES list. Changes to those files require the DOUBLE-CHECK PROTOCOL.

### User experience expectations

- **No broken states.** If something can fail, the UI must show a clear, actionable error.
- **No silent failures.** Toasts, at minimum.
- **Loading states on every async action.** Either an inline spinner or a full-page overlay.
- **Navigation guards work.** Users should never lose unsaved work without a confirmation.
- **The app should feel fast.** If something takes more than 200ms, there should be a loading indicator. If it takes more than 2 seconds, there should be contextual messaging ("Generating narrative...").

### What "done" means

A sprint is not "done" until:

1. All tasks in the sprint prompt are complete
2. `npm run build` succeeds
3. The app version has been bumped
4. `BUILD_PROGRESS_TRACKER.md` has been updated
5. The changes have been committed locally
6. Claude Code has reported back to me with what was done and what to test
7. (After my manual verification) I've pushed to GitHub and confirmed the Vercel deploy succeeded

---

## 20. Long-Term Vision

### Short term (next 1–3 months)

- Complete the OTP signup flow verification and lock down the auth stack (mostly done)
- Build the Saved Contacts System for email exports
- Upgrade to Vercel Pro plan
- Launch full Stripe subscription billing to replace access-code-only signup
- Re-enable Supabase email confirmation for full production
- Add more robust error monitoring (Sentry or similar)
- Tighten up the landing page with product screenshots and value proposition copy

### Medium term (3–12 months)

- Expand beyond Whisler Chevy to other dealerships
- Build the Internal User Messaging System (designed but not built)
- Add a public-facing blog / changelog section
- Support manufacturer-specific templates (e.g., GM-specific fields, Ford-specific fields)
- Explore integrations with DMS systems (CDK, Reynolds, etc.) for auto-populating repair order info
- Build referral / affiliate program for service managers
- Get the first handful of paying dealership customers

### Long term (12+ months)

- Enterprise features: multi-dealership groups, SSO, custom branding, audit trails for compliance
- Direct integration with warranty claim submission systems where APIs exist
- Expand beyond GM to all major OEMs
- Potentially expand to adjacent industries — heavy duty trucks, powersports, marine, aviation — each has its own warranty documentation needs
- Explore AI-powered QC: scan a photo of a physical work order and auto-generate the narrative
- Build a native mobile app for on-the-floor use (iPad/tablet-first, given typical dealership hardware)
- Eventually, grow this into a sustainable business that generates enough revenue for me to work on it full-time

### Guiding principle

I don't want to build ServiceDraft.AI just to build it. I want to build it because it solves a real problem I live every day, and because techs deserve better tools. Every feature decision should pass this test: **"Would this actually help a tech write a better warranty narrative, or would it just look nice in a demo?"** If the answer is the second one, we're not building it.

---

*— End of ServiceDraft.AI Project Instructions —*
