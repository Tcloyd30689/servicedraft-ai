# SERVICEDRAFT.AI — PROJECT INSTRUCTIONS v2.1

## WHO I AM
I'm Tyler, an automotive technician at a Chevrolet dealership. I started this project with zero coding background and have been learning development from scratch using AI + Cursor IDE. Treat me as an intelligent non-developer — I pick things up fast but need things explained without jargon. If you must use a technical term, define it in plain English the first time.

---

## WHAT WE'VE BUILT
**ServiceDraft.AI** — a full-stack SaaS web application that transforms quick, messy technician repair notes into clean, detailed, audit-proof professional warranty narratives for dealership warranty documentation. This started as a validated Google Sheets prototype and has been rebuilt as a standalone product targeting dealerships and repair facilities.

**Current Status:** Core build complete (Phases 0–10). All post-build improvement sprints through Stage 6 Sprint B complete. Pre-deployment security audit passed. App is **deployed and live at servicedraft.ai** via Vercel with Cloudflare DNS. Currently in beta testing with access-code-gated signup.

### Core Value Proposition
- Reduces narrative writing time from 5-10 minutes to under 30 seconds
- Ensures consistent, professional language that passes warranty audits
- Eliminates warranty claim rejections due to poor documentation
- Supports both diagnostic-only and completed repair scenarios
- Provides AI-powered story-type-aware proofreading to catch potential audit flags
- Supports diagnostic-to-repair-complete narrative updates (preserves original diagnostic detail)
- Multi-format export: Copy, Print, PDF, Word, Email — all produce identical professional documents
- Team management system for multi-technician dealership deployments
- Owner Dashboard with real-time analytics, user management, and Gemini API usage tracking

---

## COMPLETE TECHNOLOGY STACK

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 | React framework with SSR |
| **React** | React | 19.2.3 | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | CSS-first config via @theme in globals.css (NO tailwind.config.ts) |
| **Database/Auth** | Supabase | @supabase/supabase-js 2.95+ / @supabase/ssr 0.8+ | PostgreSQL + Auth + RLS |
| **AI** | Google Gemini | @google/generative-ai 0.24+ | Model: gemini-3-flash-preview |
| **Payments** | Stripe | 20.3.1 | Subscription billing + access code bypass (test mode for beta) |
| **Email** | Resend | 6.9.2 | Transactional email exports + password reset emails |
| **Animations** | Framer Motion | 12.34+ | Page transitions, micro-interactions |
| **Charts** | Recharts | 3.8+ | Owner Dashboard analytics visualizations |
| **PDF Export** | jsPDF | 4.2+ | Server-side PDF generation |
| **DOCX Export** | docx | 9.5+ | Server-side Word document generation |
| **Icons** | Lucide React | 0.564+ | SVG icon library |
| **Toasts** | react-hot-toast | 2.6+ | Notification system |
| **Hosting** | Vercel | — | CI/CD + hosting (auto-deploys from GitHub main branch) |
| **DNS/Domain** | Cloudflare | — | Domain registrar for servicedraft.ai (proxy DISABLED — grey cloud/DNS-only) |

---

## USER ROLE HIERARCHY (3-Tier System)

The app uses a 3-tier role system that controls access to pages, API routes, and UI elements:

| Role | Label in UI | Who | Access Level |
|------|------------|-----|--------------|
| **`owner`** | Platform Owner | Tyler (hvcadip@gmail.com) | Full system access: Owner Dashboard (analytics, user management, team management, API usage tracking), all admin actions, can promote/demote users |
| **`admin`** | Team Manager | Dealership foremen, service managers | Team Dashboard access: view team members, team activity log, team-scoped data |
| **`user`** | Standard User | Technicians, advisors, warranty clerks | Generate narratives, manage own dashboard, use saved repair templates |

**How roles are assigned:**
- All new signups default to `user` role
- The platform owner can promote users to `admin` (Team Manager) or demote back to `user` from the Owner Dashboard
- Only one account should have `owner` role — set manually in Supabase or via direct SQL
- The `owner` role cannot be assigned through the UI (safety measure)

---

## COMPLETE APPLICATION WORKFLOW

### Authentication Flows

**Sign In (Existing Users):**
1. Landing Page → Click "LOGIN"
2. Enter Email + Password
3. Validate against Supabase Auth
4. Check onboarding status (subscription, profile completion)
5. → Main Menu Page

**Sign Up (New Users):**
1. Landing Page → Click "REQUEST ACCESS"
2. **Step 1 — Account Creation**: Email, Password, Confirm Password
3. **Step 2 — Access Code / Payment**:
   - Enter an access code
   - If code matches global `ACCESS_CODE` env var → subscription set to `bypass`, proceed to Step 3
   - If code matches a team-specific `teams.access_code` → subscription set to `bypass` AND user auto-assigned to that team (team_id set + team_members row created)
   - If no code match → redirects to Stripe checkout for subscription payment
4. **Step 3 — Profile Creation**:
   - First Name *(required)*
   - Last Name *(required)*
   - Location *(US state dropdown — all 50 states)*
   - Position *(dropdown: Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk)*
   - Username *(required, must be unique)*
   - Accent Color Picker *(9-swatch color picker for initial theme preference)*
   - Terms of Use acceptance checkbox *(required)*
5. Save to database → Main Menu Page

**Email Confirmation:** Currently **disabled** for beta testing convenience (Supabase Dashboard: Auth > Providers > Email > "Confirm email" OFF). **MUST be re-enabled** when transitioning from beta to full production deployment.

### Auto-Logout
8-hour session expiry with 60-second check interval. After 8 hours of inactivity, user is automatically logged out and redirected to the landing page. Login timestamp stored in localStorage (`sd-login-timestamp`).

### Page Structure

| Page | Route | Access | Purpose |
|------|-------|--------|---------|
| **Landing Page** | `/` | Public | Login/Sign Up entry point (cinematic entrance animation) |
| **Login** | `/login` | Public | Email/password sign-in |
| **Sign Up** | `/signup` | Public | Multi-step registration (3 steps) |
| **Main Menu** | `/main-menu` | All authenticated | Central navigation hub (role-based buttons) |
| **Input Page** | `/input` | All authenticated | Capture RO info, select story type, fill fields, pre-gen customization |
| **Generated Narrative** | `/narrative` | All authenticated | View, customize, proofread, edit, save, export narrative |
| **User Dashboard** | `/dashboard` | All authenticated | Profile management, saved narrative history, preferences |
| **Owner Dashboard** | `/admin` | Owner only | Analytics, user management, team management, activity log, API usage, settings |
| **Team Dashboard** | `/team-dashboard` | Admin (Team Manager) only | Team member list, team activity log |

### Main Menu Navigation

The Main Menu page renders different buttons based on the user's role:

**All users see:**
- **GENERATE NEW STORY** → Input Page
- **USER DASHBOARD** → Dashboard/History Page

**Owner-role users additionally see:**
- **OWNER DASHBOARD** → Owner Dashboard (gold/amber accent styling, Shield icon)

**Admin-role (Team Manager) users additionally see:**
- **TEAM DASHBOARD** → Team Dashboard (accent-colored, Users icon)

**Footer links (all users):**
- **FAQ/INFO** → Instruction modal (15 Q&As covering all features)
- **SUPPORT** → Support ticket form
- **TERMS OF USE** → Legal terms modal (11 sections)
- **LOG OUT** → Landing Page

---

## INPUT PAGE SPECIFICATIONS

### Story Type Selection
User must first choose:
- **DIAGNOSTIC ONLY**: Diagnosis performed, repair recommended but not completed
- **REPAIR COMPLETE**: Full repair completed and verified

The selection cards use whileTap animation (scale 0.97) with glow on selection. Switching story types preserves shared field values (year, make, model, customer_concern, codes_present, diagnostics_performed, root_cause).

### Field Requirements

| Fields | Requirement | Dropdown Menu |
|--------|-------------|---------------|
| **1-5** | ALWAYS REQUIRED | NO dropdown |
| **6+** | CONDITIONAL | HAS dropdown |

**Conditional Logic (Fields 6+):**
- "Include Information" → Field REQUIRED, must enter text
- "Don't Include Information" → Field NOT required, excluded from prompt
- "Generate Applicable Info" → Field NOT required, AI infers this field

### Diagnostic Only Fields (9 total)
1. R.O. # *(required — saved to database only, NOT sent to API)*
2. Year *(required — sent to API)*
3. Make *(required — sent to API)*
4. Model *(required — sent to API)*
5. Customer Concern *(required — sent to API, auto-expanding textarea)*
6. Codes Present *(conditional)*
7. Diagnostics Performed *(conditional)*
8. Root Cause/Failure *(conditional)*
9. Recommended Action *(conditional)*

### Repair Complete Fields (10 total)
Fields 1-8 same as Diagnostic Only, plus:
9. Repair Performed *(conditional)*
10. Repair Verification *(conditional)*

### R.O. # Field Handling
The Repair Order number is required on the input form but is **never sent to the Gemini API**. It is used exclusively for saving to the database and displaying in the history table.

### Pre-Generation Output Customization
Collapsible panel between the last field and GENERATE STORY button with three segmented controls:
- **Length**: Short / No Change / Extended
- **Tone**: Warranty / No Change / Customer Friendly
- **Detail Level**: Concise / No Change / Additional Steps
- Selections are included automatically in the compiled data block when generating
- Settings persist in localStorage (`sd-pregen-customization`) between sessions

### Repair Templates System ("My Repairs")
- **REPAIR TEMPLATES** button inside the input card opens a slide-out panel from the right side
- Panel is portaled to document.body and positioned at `top: 164px` (below hero + nav)
- Templates store only 5 core repair fields (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification) with their dropdown option states
- Vehicle info and customer concern are NOT saved — templates are vehicle-agnostic
- CRUD operations: Save (template name + summary preview), Load (fills form fields + sets story type), Edit (update saved fields), Delete (with confirmation)
- Loading a template uses `setTimeout(50ms)` to allow story type state change to propagate before setting field values
- Option mapping: API `'exclude'` → store `'dont_include'`, `'generate'` → `'generate'`, default → `'include'`
- Saved via server-side API routes (`/api/saved-repairs`, `/api/saved-repairs/[id]`)

### Clear Form Button
A "CLEAR FORM" button resets all field values, dropdown selections, and R.O. number without changing the selected story type.

---

## GENERATED NARRATIVE PAGE SPECIFICATIONS

### Layout
- **Header**: Hero area with reactive sine waves + floating logo, Nav Bar with MAIN MENU button + centered vector logo + theme toggle + user popup
- **Left Panel**: Controls (Regenerate, Customization toggle + panel, Review & Proofread + results)
- **Right Panel**: Narrative display with typing animation (C/C/C format is DEFAULT)
- **Bottom**: Action buttons (Edit, Format Toggle, Save, Share/Export, New Story)

### Display Formats
- **C/C/C FORMAT (Default)**: Separated Concern, Cause, Correction sections with headers
- **BLOCK FORMAT**: Single combined paragraph
- Format toggle button dynamically changes label based on current format
- Toggle requires no API call — just switches display rendering

### Typing Animation
Narrative text appears character-by-character when first generated. Includes a `skip()` function so users can click to instantly show the full text. Implemented via `useTypingAnimation` hook.

### AI Customization Panel
- Three segmented controls: Length (Short / No Change / Extended), Tone (Warranty / No Change / Customer Friendly), Detail Level (Concise / No Change / Additional Steps)
- Custom Instructions text field (max 50 characters) with character counter
- Customization modifies the CURRENTLY DISPLAYED narrative — preserves user edits from Edit Story modal
- Uses exact modifier text constants from `src/constants/prompts.ts`

### Review & Proofread System (Story-Type-Aware)
- **Repair Complete**: Uses warranty audit prompt — checks for harmful language, missing verification, vague wording, damage-implying language, etc.
- **Diagnostic Only**: Uses "Diagnostic Story Optimizer" prompt — evaluates authorization-readiness (strong enough to support pre-authorization from manufacturers/extended warranty companies), NOT Repair Complete criteria
- Returns flagged issues with exact `[[snippet]]` text markers for UI highlighting
- Each issue includes suggested edit with checkbox for selective application
- Rating badge: PASS (green), NEEDS_REVIEW (yellow), FAIL (red) with overall summary

### Proofread Highlighting
- Matched snippets in the narrative text are highlighted with an accent-colored background
- Highlights automatically fade out after 30 seconds using CSS transitions
- Highlight counter badge shows the number of active highlights
- "Clear Highlights" button allows immediate removal

### Selective Apply Edits
- After proofread, `ProofreadResults.tsx` renders checkboxes next to each suggested edit
- "Select All / Deselect All" toggle for convenience
- "APPLY SELECTED EDITS" sends only the checked suggestions to `/api/apply-edits`
- AI applies ONLY the provided subset of edits — no additional changes

### Bottom Action Buttons
- **EDIT STORY**: Opens editable modal with auto-sizing textareas (format matches current view)
- **[Format Toggle]**: Dynamic button to switch between Block/C/C/C
- **SAVE STORY**: Saves to database via `/api/narratives/save` (INSERT — not upsert)
- **SHARE/EXPORT STORY**: Opens modal with Copy, Print, PDF, DOCX, Email options (all produce identical professional documents with `ServiceDraft-Ai Vector Logo.png` branding)
- **NEW STORY**: Reset confirmation dialog ("Are you sure? All unsaved data will be lost.") → clears form → Main Menu

### Navigation Guard
Three guards protect unsaved narratives:
1. **Browser close/back/refresh** → Browser native "Leave page?" dialog (`beforeunload` event)
2. **In-app navigation** (nav bar links, any internal routes) → Custom "Unsaved Narrative" modal with "STAY ON PAGE" / "LEAVE WITHOUT SAVING" options (document-level click capture, capture phase)
3. **Export actions** → Auto-save triggers silently before any export proceeds (prevents data loss)
4. **Manual save** → Explicit save disables all guards (sets `isSaved: true`)

Duplicate save prevention: `saveToDatabase()` checks `state.savedNarrativeId` — if already set (from prior save or auto-save), returns existing ID without inserting again.

---

## USER DASHBOARD SPECIFICATIONS

### Profile Section
- Position-based icon (PositionIcon component — Wrench for Technician, Hammer for Foreman, ScanLine for Diagnostician, PenLine for Advisor, ClipboardList for Manager, BookOpen for Warranty Clerk, User as fallback)
- Full Name, Email, Internal ID, Location, Position
- "UPDATE" button → Edit Profile modal (first name, last name, location dropdown, position dropdown)
- Change Password modal
- Delete Account (with 2-step confirmation, uses service role client)

### Saved Narrative History Table
- Columns: Date, Time, R.O. #, Type (badge — green for Repair Complete, blue for Diagnostic Only), Year, Make, Model, Preview
- Multi-column search (R.O.#, Year, Make, Model, Concern, Cause, Correction, Date)
- Sort controls: Date Newest/Oldest, Vehicle A-Z, R.O.# Ascending
- Filter pills: All, Diagnostic Only, Repair Complete
- Results count with "Clear Filters" fallback when no results match
- Wider container (max-w-7xl) for better table readability
- Row hover glow effect (accent-colored)

### Narrative Detail Modal (Read Only)
- Full C/C/C narrative display with vehicle info header and dates
- Export buttons: Copy, Print, PDF, DOCX, Email (all use shared `downloadExport()` for identical output)
- **UPDATE NARRATIVE WITH REPAIR** button (only visible for `story_type === 'diagnostic_only'` entries)
  - Opens UpdateWithRepairModal for the diagnostic → repair complete flow
  - Pre-fills vehicle info as read-only badges
  - Repair Performed field: either type text or click "COMPLETED RECOMMENDED REPAIR" toggle (pre-fills instruction for AI tense conversion — no separate API call)
  - Repair Verification dropdown: Include / Don't Include / Generate
  - Additional Notes (optional)
  - "GENERATE NARRATIVE" calls `/api/update-narrative` → response loaded into narrative store → navigates to `/narrative`
  - Both original diagnostic entry AND new repair-complete entry exist as separate database rows

### Preferences
Two modals accessible from the dashboard:
- **App Appearance**: Accent Color Picker (9 colors) + Dark/Light mode toggle + Particle Network animation toggle
- **My Saved Repairs**: Quick access to repair template management (same as input page panel)
- Preferences persist to Supabase JSONB (`users.preferences`) with localStorage fallback for instant load

---

## OWNER DASHBOARD (Owner Role Only)

Accessible via UserPopup "Owner Dashboard" link or Main Menu "OWNER DASHBOARD" button. Requires `role = 'owner'` on user profile. Non-owners are redirected away.

### 6 Tabs:

**1. Overview**
- 8 metric cards (total users, new this week, new this month, active subscriptions, total narratives, narratives this week, narratives today, total generations)
- Subscription breakdown
- 30-day activity trend chart (Recharts LineChart)
- System health indicators (DB row counts, last activity, app version "v1.0.0-beta")

**2. Activity Log**
- Full activity history table with pagination
- Action type filtering, user search
- Clickable rows open **Activity Detail Modal** — shared component (`ActivityDetailModal.tsx`) showing: action type badge (color-coded), timestamp (MM/DD/YYYY HH:MM AM/PM), user info (name + email), vehicle info, RO number, story type badge, narrative text preview (scrollable), input data, collapsible "View Raw Data" JSON section
- Activity Detail Modal gracefully handles entries with minimal metadata (login events show only badge + timestamp + user info)
- Refresh button for manual data reload

**3. User Management**
- Sortable user table with search
- Columns: Name (split first/last), Email (truncated max-w-[180px] with tooltip on hover), Position, Role (badge), Team (name with truncation, or "—" if unassigned), Subscription, Last Active (stacked date/time), Actions
- Center-aligned headers and cells, glowing row hover effect
- **Per-user actions:** Restrict/Unrestrict, Delete (2-step confirmation), Change Subscription Status, Send Password Reset, Promote to Admin / Demote to User
- **Protected user:** `hvcadip@gmail.com` shows "Protected" badge with ShieldCheck icon — cannot be deleted or restricted
- **"CREATE TEAM" button** in tab header — opens modal with team name input, creates team with auto-generated access code
- **"Assign to Team" action button** (Users icon) per user row — opens modal with team dropdown (shows member counts), assigns user to selected team

**4. Analytics**
- Time range selector (7d / 30d / 90d / All)
- 6 chart visualizations using Recharts:
  - Activity Trend (LineChart)
  - Feature Usage (BarChart)
  - Story Type Distribution (PieChart)
  - Subscription Breakdown (PieChart)
  - Top 10 Users (horizontal bar)
  - Usage Over Time (AreaChart)
- Auto-refresh every 60 seconds with cleanup on tab switch

**5. API Usage**
- Live Gemini API token usage tracking (data from `api_usage_log` table)
- Summary cards: total tokens consumed, total estimated cost, average tokens per call
- Token/cost charts by day
- Action type breakdown (which API operations consume the most tokens)
- Top users by token consumption leaderboard
- Model info callout: "Model: gemini-3-flash-preview | Input: $0.50/1M tokens | Output: $3.00/1M tokens"

**6. Settings**
- Token Calculator widget (`TokenCalculator.tsx`): interactive pricing estimator with model selector, input/output token fields, proofread/customization toggle multipliers, real-time cost calculation
- Current access code display (reads `ACCESS_CODE` env var via API)
- Quick system stats
- System information

---

## TEAM DASHBOARD (Admin / Team Manager Only)

Accessible via UserPopup "Team Dashboard" link or Main Menu "TEAM DASHBOARD" button. Requires `role = 'admin'` on user profile. Non-admins are redirected away.

### 2 Tabs:

**1. Team Members**
- Table of all users assigned to the manager's team
- Columns: Name, Email (truncated with tooltip), Position, Role, Last Active, Actions
- "Remove from Team" action button per member (removes team assignment, does NOT delete the user account)
- Center-aligned text, glowing row hover effect

**2. Activity Log**
- Table of all activity from team members (scoped to the manager's team)
- Same format as Owner Dashboard Activity Log but filtered to team members only
- Clickable rows open the same shared `ActivityDetailModal` component
- Refresh button for manual data reload

---

## TEAM MANAGEMENT SYSTEM

### Overview
Teams are organizational groups managed by the platform owner. Each team has a unique access code used during signup for automatic assignment. Team Managers (admin role) can view their team's members and activity via the Team Dashboard.

### How Teams Work
1. **Owner creates a team** from the Owner Dashboard (User Management tab → "CREATE TEAM" button)
2. Each team gets an auto-generated access code
3. **Owner shares the team access code** with the dealership/shop's team lead
4. **New users sign up** with the team-specific access code → auto-assigned to that team + bypass subscription
5. **Owner assigns existing users** to teams from User Management (Assign to Team action)
6. **Team Manager** (admin-role user assigned to a team) can view team members and activity

### Database Tables
- `public.teams` — id, name, access_code, description, created_by, is_active
- `public.team_members` — id, team_id, user_id, added_by, created_at (junction table with unique constraint on team_id + user_id)
- `public.users.team_id` — UUID reference to the assigned team

---

## EXPORT DOCUMENT SPECIFICATIONS

All export formats (PDF, DOCX, Print, Email) produce **identical professional documents**:

### Document Layout
1. **Footer logo**: `ServiceDraft-Ai Vector Logo.png` — bottom-right, 25×12mm (PDF) / 55×26px (DOCX), 2.09:1 aspect ratio
2. **Two-column header**:
   - LEFT: "Vehicle Information:" (bold underlined) + YEAR / MAKE / MODEL label:value lines
   - RIGHT: "Repair Order #:" (bold underlined) + R.O. number (20pt bold, right-aligned)
3. **Title**: "REPAIR NARRATIVE" — 18pt bold underlined, centered
4. **C/C/C sections**: headers (CONCERN: / CAUSE: / CORRECTION:) at 13pt bold italic underlined, body at 11pt regular
5. **Block format**: same header/title, then flowing paragraph body at 11pt regular
6. **Font**: Helvetica (PDF) / Arial (DOCX) — visually near-identical

### Email Export
- Up to 10 recipients per send
- Professional HTML template with same layout structure
- Plain text fallback included
- Sender name included in email signature
- Powered by Resend API

---

## API ROUTE INVENTORY (21 Routes)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/generate` | POST | AI narrative generation (rate limited: 20/15min, 10K char input limit) | ✅ + restriction check |
| `/api/customize` | POST | AI narrative customization | ✅ |
| `/api/proofread` | POST | AI story-type-aware audit (different prompts for diagnostic vs repair) | ✅ |
| `/api/apply-edits` | POST | Apply selected proofread edits to narrative | ✅ |
| `/api/convert-recommendation` | POST | Tense conversion — diagnostic→repair (exists but unused by frontend) | ✅ |
| `/api/update-narrative` | POST | Diagnostic→Repair Complete narrative update | ✅ |
| `/api/narratives` | GET | Fetch saved narratives for authenticated user | ✅ |
| `/api/narratives/save` | POST | Save narrative (INSERT — not upsert) | ✅ |
| `/api/saved-repairs` | GET/POST | List/create repair templates | ✅ |
| `/api/saved-repairs/[id]` | PUT/DELETE | Update/delete individual template (ownership verified) | ✅ |
| `/api/export-pdf` | POST | Generate PDF document | ✅ |
| `/api/export-docx` | POST | Generate Word document | ✅ |
| `/api/send-email` | POST | Email narrative via Resend (up to 10 recipients) | ✅ |
| `/api/stripe` | POST | Checkout session creation + access code bypass + team auto-assignment | Session |
| `/api/stripe/webhook` | POST | Stripe webhook handler (signature verification) | Stripe sig |
| `/api/support` | POST | Support ticket submission | ✅ |
| `/api/delete-account` | POST | Self-service account deletion (service role) | ✅ |
| `/api/admin` | POST | Owner: user management + team management (12 actions, service role) | Owner |
| `/api/admin/analytics` | GET | Owner: analytics data with time range selector | Owner |
| `/api/admin/usage` | GET | Owner: Gemini API token usage stats | Owner |
| `/api/teams` | GET/POST/PUT/DELETE | Team CRUD operations | Admin+ |

**All AI-calling routes** (generate, customize, proofread, apply-edits, update-narrative, convert-recommendation) are instrumented with token usage logging via `src/lib/usageLogger.ts` → writes to `api_usage_log` table.

---

## DATABASE SCHEMA (7 Active Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `public.users` | User profiles | id, email, username, first_name, last_name, location, position, role (`owner`/`admin`/`user`), subscription_status, is_restricted, team_id, preferences (JSONB) |
| `public.narratives` | Saved warranty narratives | id, user_id, ro_number, vehicle_year/make/model, concern, cause, correction, full_narrative, story_type |
| `public.activity_log` | User activity tracking | id, user_id (FK→public.users), action_type, story_type, input_data, output_preview, metadata |
| `public.saved_repairs` | Repair templates | id, user_id, template_name, story_type, 5 core fields + option columns |
| `public.teams` | Team management | id, name, access_code, description, created_by, is_active |
| `public.team_members` | Team membership | id, team_id, user_id, added_by (junction table) |
| `public.api_usage_log` | Gemini token tracking | id, user_id, action_type, prompt_tokens, completion_tokens, total_tokens, model_name, estimated_cost_usd |

**Critical schema rules:**
- `activity_log.user_id` FK points to `public.users(id)`, NOT `auth.users(id)` — required for PostgREST joins
- `narratives` has NO unique constraint on (user_id, ro_number) — same RO# can have both diagnostic and repair entries as separate rows
- `users.role` uses 3 values: `'owner'`, `'admin'`, `'user'` — NOT just admin/user

---

## DESIGN & AESTHETIC

### Visual Identity
- **Brand theme**: Dark/purple cyberpunk-industrial aesthetic with glassmorphism
- **Typography**: Orbitron (headings, UI labels, brand text — semi-bold, italic), Inter (data fields, input text — optimized for readability)
- **Logo**: Oversized floating accent-colored logo in hero area + centered vector logo in nav bar (theme-aware CSS filter inversion)
- **Cards**: "Liquid" glassmorphism — accent at 5% opacity, 2px black border, 23px radius, cursor underglow effect
- **Modals**: Scale animation (95%→100%), 600px width, 23px radius, high-opacity dark background for readability

### Accent Color Theming System
- 9 accent colors: Violet (default), Red, Orange, Yellow, Green, Blue, Pink, White (forces dark mode), Black (forces light mode)
- All colors use CSS custom properties (`var(--accent-*)`) — **NEVER hardcoded hex values**
- ThemeProvider applies 40+ CSS variables to `:root` at runtime
- Preferences persist to Supabase with localStorage instant-load fallback

### Background Animations
- **Protected pages**: ParticleNetwork — floating particles with connecting lines (toggleable via preferences)
- **Landing/Auth pages**: WaveBackground — sine wave canvas animation
- **Hero area**: 5-layer reactive sine wave that responds to user activity (typing, clicking, generating)
- All animations read `--wave-color` CSS variable for accent-reactive coloring

### Page Layout (All Protected Pages)
```
┌─────────────────────────────────────────────────────┐
│  HERO AREA (100px, fixed, z-90) — reactive waves    │
│  + oversized floating logo (z-110, pointer-events-   │
│    none)                                             │
├─────────────────────────────────────────────────────┤
│  NAV BAR (64px, fixed, z-100) — MAIN MENU button,  │
│  centered vector logo, v1.0.0-beta label, theme     │
│  toggle, UserPopup                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PAGE CONTENT (scrollable, paddingTop: 164px)       │
│  ParticleNetwork at z-10 behind content             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## HOW TO COMMUNICATE WITH ME

### ALWAYS Do This:
- **Give me complete file contents.** Never give partial snippets, diffs, or "replace lines 42-56" instructions. Show me the entire file every time.
- **Step-by-step, click-by-click guidance.** When I need to do something in Cursor, GitHub, Vercel, Supabase, or the terminal — walk me through it.
- **Explain the "why" briefly.** One sentence on why we're doing something helps me learn.
- **Default to execution mode.** Unless I'm asking a planning question, assume I want you to write the code.
- **Challenge bad decisions.** If I suggest something that will cause problems, push back and explain why.
- **Provide Claude Code prompts as single copyable text blocks** that begin with "Read BUILD_PROGRESS_TRACKER.md and CLAUDE_CODE_BUILD_INSTRUCTIONS.md" and end with "Update BUILD_PROGRESS_TRACKER.md and commit changes."
- **Thoroughness over brevity** for reference materials — I explicitly value comprehensive documentation given how my brain works.

### NEVER Do This:
- Don't use developer jargon without explaining it
- Don't give me partial code or say "the rest stays the same"
- Don't assume I know terminal commands — spell them out
- Don't suggest tools/frameworks outside the locked tech stack
- Don't give me options when there's a clearly better answer
- Don't skip error handling or loading states
- Don't reference the GitHub repo in Claude Code prompts (it works directly with the local project folder)

---

## PROJECT KNOWLEDGE FILES

| Document | Purpose |
|----------|---------|
| **ServiceDraft_AI_Project_Instructions_v2_1.md** | This file — how to work with Tyler, app overview, workflow, communication rules |
| **ServiceDraft_AI_Spec_v1_3.md** | Detailed page specs, original database schema, feature matrix, workflow diagrams |
| **ServiceDraft_AI_Prompt_Logic_v1.md** | All AI prompts, dropdown logic, customization panel logic, JSON response structures |
| **ServiceDraft_AI_UI_Design_Spec_v1.md** | Complete visual design system — colors, typography, theming, animations |
| **CLAUDE_CODE_BUILD_INSTRUCTIONS.md** | Architecture reference, coding standards, database schemas, TypeScript interfaces, sprint execution guide |
| **BUILD_PROGRESS_TRACKER.md** | Living document tracking all completed and remaining work |
| **PRE_BUILD_SETUP_CHECKLIST.md** | Setup guide for accounts, tools, and environment (completed) |
| **DEPLOYMENT_NOTES.md** | Environment variables, Supabase config, Stripe setup, security measures |

---

## PROJECT CONTINUITY RULES

When working on this project, Claude Code or any AI assistant MUST:

1. **Read `BUILD_PROGRESS_TRACKER.md` first** at the start of every session
2. **Read `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`** for architecture reference, coding patterns, and database schemas
3. **Reference `ServiceDraft_AI_Prompt_Logic_v1.md`** when modifying ANY AI prompts — copy prompt text EXACTLY, do not paraphrase
4. **Follow the CSS variable theming system** — never hardcode colors
5. **Use server-side API routes** for ALL Supabase data operations (never browser client queries)
6. **Make surgical changes** — don't rewrite files that aren't related to the current task
7. **Update `BUILD_PROGRESS_TRACKER.md`** BEFORE committing — every commit must include documentation updates
8. **Preserve the 3-tier role hierarchy** (owner/admin/user) in all access gates and conditional UI
9. **Maintain separate database rows** for diagnostic and repair-complete narratives sharing the same RO#

---

## QUALITY STANDARDS

- Every component should have proper loading states, error states, and empty states
- All forms should have input validation with user-friendly error messages
- Auth should be checked on every API route (admin/owner routes verify role)
- All Supabase data operations go through server-side API routes (never browser client queries)
- All colors use CSS custom properties (`var(--accent-*)`) — never hardcoded hex values
- Mobile responsive is required but desktop-first for layout
- Loading animations for ALL API calls (branded spinner with contextual message)
- Typing animation for narrative text display (with skip function)
- All UI components must follow the theming system (ThemeProvider + CSS variables)
- Typography: Orbitron for headings/UI elements, Inter for data/input text
- Framer Motion animations: spring transitions for buttons (scale 1.05/0.95), CursorGlow underglow for cards, fade+slide page entrances
- Documentation (`BUILD_PROGRESS_TRACKER.md`) updated before every git commit
- `npm run build` must pass cleanly before committing

---

## LONG-TERM VISION

### Immediate Next Steps
- Complete beta testing with Whisler Chevrolet technicians
- Re-enable email confirmation for production launch
- Switch Stripe from test mode to live mode

### Planned Future Features
- **Group Manager Dashboard improvements** (Sprint 9 — expanded team analytics)
- **Page-specific Help/Instructions system** (Sprint 10 — contextual guidance)
- **Voice dictation** via Whisper API for hands-free input
- **Image capture with OCR** for diagnostic screen photos
- **Batch processing** for multiple narratives
- **Google Doc export** option (in addition to Word)

### Mobile Strategy (Phased)
1. Ensure web app is mobile-responsive (current)
2. Add PWA capabilities (installable, offline-capable)
3. Pursue Expo/React Native build after product validation

### Platform Expansion
- Expand ServiceDraft.AI into a broader suite of automotive technician tools (e.g., RepairSuite.ai)
- Modular subscription pricing per tool
- Shared Supabase auth + Stripe billing foundation across tools
- Multi-dealership enterprise features

---

*— End of Project Instructions v2.1 —*
