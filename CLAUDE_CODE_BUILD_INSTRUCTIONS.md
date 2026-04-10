# SERVICEDRAFT.AI — CLAUDE CODE BUILD INSTRUCTIONS

## WHAT THIS DOCUMENT IS

This is the master instruction set for Claude Code when working on the ServiceDraft.AI application. It contains the full technical specification for every system in the app, including exact file paths, code patterns, TypeScript interfaces, CSS variable references, database schemas, and implementation details.

The app is **live in production at `servicedraft.ai`** and in active beta use. All build phases and post-build improvement sprints through the OTP signup migration are complete. This document serves as the **architecture reference, coding standards guide, safeguard playbook, and sprint execution manual** for ongoing maintenance, bug fixes, and new feature development.

**CRITICAL — READ BEFORE ANY WORK:**
1. This document contains **mandatory safeguards** in the sections titled `PROTECTED FILES — HARD STOPS`, `THE DOUBLE-CHECK PROTOCOL (STOP, ALERT, EXPLAIN, ASK)`, and `MANDATORY VERSION BUMP RULE`. You MUST read and follow these sections on every sprint without exception.
2. Do NOT read `BUILD_PROGRESS_TRACKER.md` at the start of a session — it is a large file and wastes significant context window tokens. The sprint prompt you receive will contain all the context you need for the current task. Only WRITE to the tracker when your work is complete (see "When completing a task" below).
3. The app is LIVE. Production changes carry real risk. When in doubt, STOP and ask Tyler before proceeding.

---

## HOW TO USE THIS DOCUMENT

1. **At the start of every session:**
   - Read the sprint prompt provided by the user — it contains everything you need to know about the current task
   - Read `PROTECTED FILES — HARD STOPS`, `THE DOUBLE-CHECK PROTOCOL`, and `MANDATORY VERSION BUMP RULE` sections of this document (non-negotiable, every session)
   - Read any other sections of this document relevant to the current task
   - Read any referenced project knowledge files as needed
   - Do NOT read `BUILD_PROGRESS_TRACKER.md` — it is write-only during sprints to save tokens

2. **Before making any change:**
   - Check whether the change touches a file listed in `PROTECTED FILES — HARD STOPS`
   - Check whether the change falls into any category listed in `THE DOUBLE-CHECK PROTOCOL`
   - If either check triggers, follow the `STOP → ALERT → EXPLAIN → ASK` procedure and wait for Tyler's explicit `yes` before proceeding
   - If the change touches 5 or more files across multiple subsystems, output a brief "blast radius summary" before starting (what files, what systems, what could break) — no approval required, but Tyler should see it

3. **When completing a task:**
   - Implement the task as described
   - Test that it works (run `npm run dev`, check for errors, run `npm run build` for production verification)
   - **MANDATORY: bump the app version** per `MANDATORY VERSION BUMP RULE` — this happens on EVERY sprint without exception
   - Update `BUILD_PROGRESS_TRACKER.md` — add a new sprint/task entry with `[x]` status, today's date, and the new version number
   - Update the "CURRENT STATUS" section at the top of the tracker
   - Commit all changes to Git **locally only** with a descriptive message that includes the new version number
   - **DO NOT push to GitHub.** Tyler pushes manually after local testing. The app is live — pushing untested code would deploy bugs to production.

4. **When encountering a blocker:**
   - Add a `⚠️ BLOCKED:` note in the tracker
   - Explain to Tyler what's needed
   - Move to the next task that can be done independently (if any)

5. **When a session is ending:**
   - Make sure `BUILD_PROGRESS_TRACKER.md` is fully up to date, including the new version number
   - Confirm you have committed locally (NOT pushed)
   - Tell Tyler what was accomplished, what version he is now at locally, and what to test

---

## PROJECT KNOWLEDGE FILES

The following reference documents contain detailed specifications. Read them as needed. Note: versioned filenames (e.g. `_v1_3`, `_v2_1`) are being consolidated to clean names without version suffixes. The list below uses the target clean names; if you see versioned files in the repo, treat the highest-version file as canonical.

| File (target clean name) | When to Reference |
|---|---|
| `ServiceDraft_AI_Spec.md` | Page layouts, database schema, feature requirements, workflow diagrams |
| `ServiceDraft_AI_Project_Instructions.md` | Tech stack, communication rules, quality standards |
| `ServiceDraft_AI_Prompt_Logic.md` | ALL AI prompts, dropdown logic, customization sliders, JSON response structures |
| `ServiceDraft_AI_UI_Design_Spec.md` | ALL visual design specs — colors, typography, components, CSS, Tailwind config |
| `DEPLOYMENT_NOTES.md` | Environment variables, Supabase RLS policies, Stripe webhook setup, security measures |
| `SERVIDRAFT_AI_LOGO_1_.PNG` | Logo asset file |
| `ServiceDraft-Ai Vector Logo.png` | Vector logo used in NavBar and export documents |

**Important:** If any spec file contradicts THIS document (`CLAUDE_CODE_BUILD_INSTRUCTIONS.md`) or the actual source code, THIS document and the source code win. The spec files are being rewritten in a future sprint to reflect the current production state. Until then, verify against the live codebase before trusting spec file claims.

---

## PROTECTED FILES — HARD STOPS

The following files are **PROTECTED**. They control authentication, session management, theming, and core state. They have been the source of multiple past production incidents. **You may NOT modify any of these files without first invoking the DOUBLE-CHECK PROTOCOL (see next section) and receiving Tyler's explicit written `yes` in the same session.**

This is not a soft guideline. If your sprint prompt asks you to edit one of these files without first triggering the protocol, STOP and ask Tyler to confirm.

### Locked auth & session files
- `src/hooks/useAuth.ts`
- `src/middleware.ts`
- `src/lib/supabase/client.ts` (browser Supabase client singleton)
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/app/auth/callback/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/me/route.ts`
- `src/app/api/signup/verify-otp/route.ts`
- `src/app/api/signup/complete-profile/route.ts`
- `src/app/api/signup/activate/route.ts`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/login/page.tsx`

### Locked core state & theming files
- `src/components/ThemeProvider.tsx`
- `src/stores/narrativeStore.ts`

### Locked payment & webhook files
- `src/app/api/stripe/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- Any code path that writes to `users.subscription_status`

### Why these are locked
- **Auth/signup files:** The OTP signup flow took extensive debugging to get right. Past incidents included PKCE cross-browser failures, browser client mutex lockups, expired-cookie auto-refresh hangs, www vs non-www cookie scoping mismatches, and `handle_new_user` trigger silent failures. The current state works. Do not touch it.
- **Core state files:** Concurrent `getUser()` calls on the browser Supabase singleton cause mutex blocks. `useAuth.ts` was explicitly refactored to bypass the browser client and fetch via `/api/me` to solve this. `ThemeProvider.tsx` has hydration-safety logic that is easy to break.
- **Payment files:** Stripe webhook signature verification and access code logic gate all billing. A bug here could silently grant or revoke access.

### Lessons these files embody
Read the `CRITICAL LESSONS LEARNED` appendix before making ANY auth-adjacent change, even to files NOT on this list.

---

## THE DOUBLE-CHECK PROTOCOL (STOP, ALERT, EXPLAIN, ASK)

**Purpose:** Before performing any change that could disrupt the live production app, you must pause and verify with Tyler that he actually wants the change. This protocol exists because the app is live at `servicedraft.ai` and certain categories of changes have historically caused production incidents.

### When to trigger the protocol — HARD STOPS

Invoke `STOP → ALERT → EXPLAIN → ASK` automatically if the current task falls into ANY of these categories:

1. **Auth, sessions, signup, cookies, PKCE/OTP** — any edit to files in `PROTECTED FILES — HARD STOPS`, OR any change to session-cookie handling, OR any change to how auth state is fetched/refreshed
2. **Destructive database migrations** — any migration that contains `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN ... TYPE`, `TRUNCATE`, or any statement that could lose existing data. Pure additive migrations (`CREATE TABLE`, `ADD COLUMN`, `CREATE INDEX`) do NOT trigger this.
3. **RLS policy changes** — any `CREATE POLICY`, `DROP POLICY`, `ALTER POLICY`, or change to a policy's `USING` / `WITH CHECK` clause. RLS mistakes can leak data across users.
4. **Stripe, payments, or access-code logic** — edits to the Stripe webhook, checkout session creation, access code bypass, or anything that writes `subscription_status`
5. **Disabling existing safeguards** — removing a rate limit check, auth check, input validation, role guard (e.g. owner-only guard), or any other security control
6. **File, route, or data deletion** — `git rm` of any existing route/component/utility, dropping a database table, or removing an API endpoint (could break in-flight users on the live app)
7. **Changes to any file listed in `PROTECTED FILES — HARD STOPS`**

### When to perform a "blast radius summary" — SOFT CHECK

For any change that touches **5 or more files across multiple subsystems** (e.g. input + narrative + dashboard + API in one sprint), output a brief summary BEFORE starting work:
- Which files will be touched
- Which subsystems they belong to
- What could break if the change has a bug
- Confidence level (high/medium/low)

No approval required for soft checks — just make the blast radius visible so Tyler can catch overreach before it happens.

### The protocol — exact procedure

When a hard-stop trigger fires, perform these steps IN ORDER and do not deviate:

**Step 1 — STOP**
Do not begin editing. Do not run any file modification tool. Do not write code. Halt immediately.

**Step 2 — ALERT**
Output a clearly-marked block using this exact format:

```
🛑 SAFEGUARD TRIGGERED — DOUBLE-CHECK REQUIRED

Trigger category: [the category number and name from the list above]
Files/operations affected: [specific file paths and line ranges, or migration SQL]
```

**Step 3 — EXPLAIN**
In plain English (no jargon), explain:
- What the change would do
- What could go wrong if the change has a bug
- The realistic worst-case outcome for production users
- Whether there's a lower-risk alternative approach

Example phrasing: *"This would modify `middleware.ts` to change how session cookies are refreshed. If the change has a bug, users could be logged out unexpectedly or sessions could fail to refresh, causing blank screens on protected pages. A lower-risk alternative would be to add the new logic in a separate API route without touching middleware.ts."*

**Step 4 — ASK**
End with this exact question:
```
Do you want me to proceed with this change? Please respond with "yes" or "no".
```

Then STOP and wait. Do not perform any file modifications until Tyler responds with an explicit `yes`. If Tyler responds with anything other than `yes` (including silence, questions, "maybe", "let me think"), you MUST NOT proceed. Ambiguous responses default to NO.

### What counts as approval

- Explicit `yes` in the current session → approved, proceed
- `yes, but [modification]` → apply the modification, then proceed
- Any other response → NOT approved, do not proceed
- Approval granted for one change does NOT extend to other hard-stop changes in the same session. Each hard-stop trigger requires its own `STOP → ALERT → EXPLAIN → ASK` cycle.

### What the protocol is NOT for

Do not invoke the protocol for:
- Cosmetic UI tweaks (colors, spacing, copy text, icon swaps)
- Adding new pure-additive migrations (`CREATE TABLE`, `ADD COLUMN`)
- Adding new API routes that don't touch auth or payments
- Editing components under `src/components/ui/`, `src/components/dashboard/`, `src/components/input/`, `src/components/narrative/` (unless touching auth state)
- Editing the build instructions file itself
- Editing `BUILD_PROGRESS_TRACKER.md`

Over-triggering is almost as bad as under-triggering — it slows down routine work and trains Tyler to ignore alerts. Use judgment.

---

## MANDATORY VERSION BUMP RULE

**Every sprint MUST bump the app version before the final commit. No exceptions.**

### Why this exists
The app is live. Tyler needs to be able to verify at a glance whether the version running on `servicedraft.ai` matches the version that was supposedly deployed. Without an automatic bump, localhost and production can silently run the same version string, making it impossible to tell whether a deploy actually landed.

### Single source of truth
The version is defined in `src/lib/version.ts` as the exported constant `APP_VERSION`. This file is the ONLY place to change the runtime version string. The `version` field in `package.json` should be kept in sync (minus the `v` prefix and `-beta` suffix) for good hygiene, but the runtime code reads only from `version.ts`.

The version is displayed in two places, both of which import from `version.ts`:
- `src/components/layout/NavBar.tsx` — center section label
- `src/app/api/admin/analytics/route.ts` — `systemHealth.appVersion` field, rendered in the Owner Dashboard "System Health" card on the Overview tab

If either display drifts, something is wrong with the import — investigate immediately.

### Bump policy
- **Default (every sprint): PATCH bump.** Example: `v1.0.5-beta` → `v1.0.6-beta`.
- **MINOR bump:** only when the sprint prompt explicitly says "minor bump" or "new feature release". Example: `v1.0.6-beta` → `v1.1.0-beta`.
- **MAJOR bump:** only when the sprint prompt explicitly says "major bump". Example: `v1.1.0-beta` → `v2.0.0-beta`.

When in doubt, do a patch bump. Never skip a bump.

### The exact bump procedure
At the end of every sprint, before committing:

1. Open `src/lib/version.ts`
2. Read the current `APP_VERSION` value
3. Compute the new value per the bump policy above (default = increment patch)
4. Replace the string literal in `version.ts`
5. Open `package.json` and update the `version` field to match (strip the `v` prefix and the `-beta` suffix). Example: `v1.0.6-beta` in version.ts → `"1.0.6"` in package.json.
6. Run `npm run build` one more time to make sure nothing broke
7. Include the new version in the sprint's tracker entry
8. Include the new version in the commit message. Example: `"fix: correct narrative save logic — v1.0.6-beta"`

### Common mistakes to avoid
- Forgetting to bump → the tracker and production both lie about what's deployed
- Bumping `version.ts` but not `package.json` → inconsistency, confusing later
- Adding `-beta` to `package.json` → npm semver tools may misbehave
- Removing `-beta` from `version.ts` → premature, beta tag stays until full launch
- Bumping in the middle of a sprint → always bump LAST, right before the final commit

---

## GLOBAL DEVELOPMENT RULES

Follow these at ALL times:

### Code Standards
- **TypeScript** for all files (`.ts` and `.tsx`)
- **`"use client"`** directive at the top of any component that uses React hooks, state, or browser APIs
- **`"use server"`** is NOT needed — API routes in `app/api/` are server-side by default in Next.js App Router
- **Always export default** for page components
- **Named exports** for reusable components and utility functions

### File Naming
- React components: `PascalCase.tsx` (e.g., `LiquidCard.tsx`)
- Utility files: `camelCase.ts` (e.g., `compileDataBlock.ts`)
- Page files: always `page.tsx` inside route folders
- Layout files: always `layout.tsx`
- API routes: always `route.ts` inside API folders

### Styling Rules
- Use **Tailwind CSS** for all styling — no separate CSS files except `globals.css`
- Tailwind v4 uses **CSS-first configuration** via `@theme` blocks in `globals.css`. There is NO `tailwind.config.ts` file.
- For one-off styles that Tailwind can't handle, use inline `style={}` or `globals.css`
- **CRITICAL: Use CSS variables for ALL colors** — never hardcode hex values like `#a855f7` or `rgba(168,85,247,0.3)`. Use `var(--accent-hover)`, `var(--accent-30)`, etc. See the "Accent Color Theming System" appendix below for the full variable reference.

### Error Handling
- Every API call must be wrapped in try/catch
- Every API route must return proper HTTP status codes (200, 400, 401, 403, 429, 500)
- User-facing errors shown as toast notifications
- `console.error` for debugging, never `console.log` in production code

### State Management
- **`narrativeStore.ts`** — module-level global state using React's `useSyncExternalStore` hook pattern
- **`useAuth.ts`** — module-level singleton auth state with listener pattern. Fetches profile EXCLUSIVELY via `GET /api/me`. Does NOT use the browser Supabase client.
- **`ThemeProvider.tsx`** — React context for accent color, dark/light mode, and background animation toggle
- Do NOT use Redux, MobX, zustand, or other state libraries

### Data Access Pattern (CRITICAL)
- **ALL Supabase data operations (SELECT, INSERT, UPDATE, DELETE) MUST go through server-side API routes** (`/api/*`)
- The browser-side Supabase client (`src/lib/supabase/client.ts`) is used ONLY for `signInWithOtp()` during signup Step 1. It is NOT used by `useAuth.ts`, NOT used for data queries, NOT used for session checks.
- **`useAuth.ts` fetches the user profile exclusively via `GET /api/me`** — no browser Supabase client is involved in the auth hook. This was implemented to eliminate the browser client's internal auth mutex lock, which was causing production hangs and blank screens.
- Server-side API routes authenticate via HTTP cookies using `createClient()` from `@/lib/supabase/server`
- This pattern is non-negotiable. If you find yourself wanting to call `supabase.from(...)` in a client component, STOP — that's wrong. Route it through an API route instead.

### Field ID Convention
**CRITICAL:** Always use field IDs as defined in `src/constants/fieldConfig.ts`:
- Required fields: `ro_number`, `year`, `make`, `model`, `customer_concern`
- Conditional fields: `codes_present`, `diagnostics_performed`, `root_cause`, `recommended_action`, `repair_performed`, `repair_verification`

When accessing field values in the narrative store: `state.fieldValues['year']` (NOT `state.fieldValues['vehicle_year']`).

---

## TECHNOLOGY STACK (Current Versions)

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.2.1 | React framework with SSR |
| **React** | React | 19.2.4 | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | CSS-first config via @theme in globals.css |
| **Database/Auth** | Supabase | @supabase/supabase-js 2.95+ / @supabase/ssr 0.8+ | PostgreSQL + Auth + RLS |
| **AI** | Google Gemini | @google/generative-ai 0.24+ | Model: gemini-3-flash-preview |
| **Payments** | Stripe | 20.3.1 | Subscription billing + access code bypass |
| **Email** | Resend | 6.9.2 | Transactional email exports + password reset emails |
| **Animations** | Framer Motion | 12.34+ | Page transitions, micro-interactions |
| **Charts** | Recharts | 3.8+ | Admin/Owner analytics visualizations |
| **PDF Export** | jsPDF | 4.2+ | Server-side PDF generation |
| **DOCX Export** | docx | 9.5+ | Server-side Word document generation |
| **Icons** | Lucide React | 0.564+ | SVG icon library |
| **Toasts** | react-hot-toast | 2.6+ | Notification system |
| **Hosting** | Vercel | — | CI/CD + hosting (Hobby plan currently — upgrade to Pro before charging customers) |
| **DNS/Domain** | Cloudflare | — | Domain registrar for servicedraft.ai (proxy must be DISABLED / grey cloud) |

---

## CURRENT APPLICATION ARCHITECTURE

### Complete Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx        ← 3-step OTP-based signup (PROTECTED FILE)
│   ├── (protected)/
│   │   ├── layout.tsx              ← HeroArea + NavBar + ParticleNetwork + ErrorBoundary + session expiry
│   │   ├── main-menu/page.tsx      ← Role-based dashboard buttons (Owner/Team/User)
│   │   ├── input/page.tsx
│   │   ├── narrative/page.tsx
│   │   ├── dashboard/page.tsx      ← User Dashboard (profile, preferences, narrative history)
│   │   ├── admin/page.tsx          ← Owner Dashboard — owner role required (6 tabs)
│   │   └── team-dashboard/page.tsx ← Team Dashboard — admin role required (team members, activity)
│   ├── api/
│   │   ├── activity-log/route.ts   ← Activity log fetch endpoint
│   │   ├── admin/
│   │   │   ├── route.ts            ← User management CRUD + team management (service role client)
│   │   │   ├── analytics/route.ts  ← Dashboard metrics, chart data, systemHealth.appVersion
│   │   │   └── usage/route.ts      ← Gemini API token usage aggregated stats (service role client)
│   │   ├── apply-edits/route.ts    ← Apply selected proofread edits to narrative
│   │   ├── auth/
│   │   │   ├── login/route.ts      ← PROTECTED — server-side login
│   │   │   └── logout/route.ts     ← PROTECTED — server-side logout
│   │   ├── convert-recommendation/route.ts  ← Tense conversion
│   │   ├── customize/route.ts      ← AI narrative customization
│   │   ├── delete-account/route.ts ← Self-service account deletion (service role)
│   │   ├── export-docx/route.ts    ← Word document generation
│   │   ├── export-pdf/route.ts     ← PDF document generation
│   │   ├── generate/route.ts       ← AI narrative generation (auth + rate limited + restriction check)
│   │   ├── me/route.ts             ← PROTECTED — current user profile endpoint (used by useAuth)
│   │   ├── narratives/
│   │   │   ├── route.ts            ← GET saved narratives for authenticated user
│   │   │   └── save/route.ts       ← POST save narrative (INSERT — not upsert)
│   │   ├── narrative-tracker/route.ts ← Narrative interaction tracking
│   │   ├── preferences/route.ts    ← User preferences GET/PUT
│   │   ├── proofread/route.ts      ← AI audit (story-type-aware prompt selection)
│   │   ├── saved-repairs/
│   │   │   ├── route.ts            ← GET/POST repair templates
│   │   │   └── [id]/route.ts       ← PUT/DELETE individual template (ownership verified)
│   │   ├── send-email/route.ts     ← Email export via Resend (up to 10 recipients)
│   │   ├── signup/
│   │   │   ├── verify-otp/route.ts        ← PROTECTED — OTP code verification
│   │   │   ├── complete-profile/route.ts  ← PROTECTED — password + profile creation
│   │   │   └── activate/route.ts          ← PROTECTED — access code activation + team assignment
│   │   ├── stripe/
│   │   │   ├── route.ts            ← PROTECTED — checkout session creation + access code bypass
│   │   │   └── webhook/route.ts    ← PROTECTED — Stripe webhook handler (signature verification)
│   │   ├── support/route.ts        ← Support ticket submission
│   │   ├── teams/                  ← Team CRUD operations
│   │   │   ├── route.ts
│   │   │   ├── members/route.ts
│   │   │   └── activity/route.ts
│   │   └── update-narrative/route.ts  ← Diagnostic→Repair Complete narrative update
│   ├── auth/callback/route.ts      ← PROTECTED — Supabase code exchange / token verification fallback
│   ├── layout.tsx                  ← Root layout: Orbitron + Inter fonts, ThemeProvider, ToastProvider, env validation
│   ├── page.tsx                    ← Landing page (cinematic entrance, wave background)
│   └── globals.css                 ← Tailwind v4 @theme config + :root CSS custom properties
├── components/
│   ├── ThemeProvider.tsx            ← PROTECTED — accent color + dark/light mode + background animation context
│   ├── admin/
│   │   ├── ActivityDetailModal.tsx
│   │   └── TokenCalculator.tsx
│   ├── dashboard/
│   │   ├── AppearanceModal.tsx
│   │   ├── EditProfileModal.tsx
│   │   ├── NarrativeDetailModal.tsx
│   │   ├── NarrativeHistory.tsx
│   │   ├── PreferencesPanel.tsx
│   │   ├── ProfileSection.tsx
│   │   ├── SavedRepairsModal.tsx
│   │   ├── ActivityDetailModal.tsx
│   │   └── UpdateWithRepairModal.tsx
│   ├── input/
│   │   ├── ConditionalField.tsx
│   │   ├── EditRepairModal.tsx
│   │   ├── MyRepairsPanel.tsx
│   │   ├── PreGenCustomization.tsx
│   │   ├── SaveRepairModal.tsx
│   │   └── StoryTypeSelector.tsx
│   ├── layout/
│   │   ├── FAQContent.tsx
│   │   ├── HeroArea.tsx
│   │   ├── NavBar.tsx               ← Imports APP_VERSION from src/lib/version.ts
│   │   ├── SupportForm.tsx
│   │   └── TermsOfUse.tsx
│   ├── narrative/
│   │   ├── CustomizationPanel.tsx
│   │   ├── EditStoryModal.tsx
│   │   ├── EmailExportModal.tsx
│   │   ├── NarrativeDisplay.tsx
│   │   ├── ProofreadResults.tsx
│   │   └── ShareExportModal.tsx
│   └── ui/
│       ├── AccentColorPicker.tsx
│       ├── AutoTextarea.tsx
│       ├── Button.tsx
│       ├── CursorGlow.tsx
│       ├── ErrorBoundary.tsx
│       ├── Input.tsx
│       ├── LiquidCard.tsx
│       ├── LoadingSpinner.tsx
│       ├── Logo.tsx
│       ├── Modal.tsx
│       ├── PageTransition.tsx
│       ├── ParticleNetwork.tsx
│       ├── PositionIcon.tsx
│       ├── Select.tsx
│       ├── Textarea.tsx
│       ├── ToastProvider.tsx
│       └── WaveBackground.tsx
├── constants/
│   ├── fieldConfig.ts
│   ├── positions.ts
│   ├── prompts.ts
│   └── states.ts
├── hooks/
│   ├── useActivityPulse.ts
│   ├── useAuth.ts                   ← PROTECTED — fetches via /api/me, no browser Supabase client
│   └── useTypingAnimation.ts
├── lib/
│   ├── activityLogger.ts
│   ├── compileDataBlock.ts
│   ├── constants/themeColors.ts
│   ├── env.ts
│   ├── exportUtils.ts
│   ├── gemini/client.ts
│   ├── highlightUtils.ts
│   ├── narrativeTracker.ts
│   ├── rateLimit.ts
│   ├── stripe/client.ts
│   ├── supabase/
│   │   ├── client.ts                ← PROTECTED — browser client with clearExpiredAuthCookies guard
│   │   ├── middleware.ts            ← PROTECTED — updateSession() with 5s getUser timeout
│   │   └── server.ts                ← PROTECTED — server client used by all API routes
│   ├── usageLogger.ts
│   ├── utils.ts                     ← cn() + withTimeout() + clearExpiredAuthCookies()
│   └── version.ts                   ← SINGLE SOURCE OF TRUTH for APP_VERSION
├── middleware.ts                    ← PROTECTED — www→non-www redirect + updateSession()
├── stores/
│   └── narrativeStore.ts            ← PROTECTED — useSyncExternalStore pattern
└── types/
    └── database.ts
```

---

## DATABASE SCHEMA (7 Active Tables)

### Table: `public.users` — User profiles

```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR NOT NULL,
  username VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  location VARCHAR,
  position VARCHAR,
  profile_picture_url VARCHAR,  -- No longer used; position-based icons displayed instead
  role VARCHAR DEFAULT 'user',  -- 'owner', 'admin', or 'user' (3-tier hierarchy)
  subscription_status VARCHAR DEFAULT 'trial', -- 'active', 'trial', 'expired', 'bypass'
  stripe_customer_id VARCHAR,
  is_restricted BOOLEAN DEFAULT false,
  team_id UUID REFERENCES public.teams(id),  -- Team assignment (nullable)
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies:
-- "Users can view own profile" FOR SELECT USING (auth.uid() = id)
-- "Users can update own profile" FOR UPDATE USING (auth.uid() = id)
-- "Users can insert own profile" FOR INSERT WITH CHECK (auth.uid() = id)
-- Admin policies also exist for owner-level operations via service role client
```

**Role Hierarchy (3-tier system):**
| Role | Label in UI | Access Level |
|------|------------|--------------|
| `owner` | Platform Owner | Full system access: Owner Dashboard, all admin actions, team management, user management, analytics, API usage tracking |
| `admin` | Team Manager | Team Dashboard access: view team members, team activity log, team-scoped data |
| `user` | Standard User | Generate narratives, manage own dashboard, use saved repairs |

### Table: `public.narratives` — Saved warranty narratives

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
  full_narrative TEXT,
  story_type VARCHAR NOT NULL CHECK (story_type IN ('diagnostic_only', 'repair_complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- NO unique constraint on (user_id, ro_number) — same RO# can have both diagnostic and repair entries
-- CRITICAL: Diagnostic-only and repair-complete narratives sharing the same RO# MUST save as separate rows via plain INSERT — never upsert or overwrite
```

### Table: `public.activity_log` — User activity tracking

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

**CRITICAL:** The FK on `activity_log.user_id` points to `public.users(id)`, NOT `auth.users(id)`. This is required for PostgREST joins to work. If a join query returns "Could not find a relationship in the schema cache," the FK likely needs to be pointed at the public schema table.

### Table: `public.saved_repairs` — Repair template storage

```sql
CREATE TABLE public.saved_repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_name VARCHAR NOT NULL,
  story_type VARCHAR NOT NULL CHECK (story_type IN ('diagnostic_only', 'repair_complete')),
  -- Vehicle info columns exist but are always NULL (templates are vehicle-agnostic)
  year VARCHAR, make VARCHAR, model VARCHAR, customer_concern TEXT,
  -- These 5 core fields are actually saved:
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

### Table: `public.teams` — Team management

```sql
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  access_code TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

### Table: `public.team_members` — Team membership junction table

```sql
CREATE TABLE public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- UNIQUE constraint on (team_id, user_id) prevents duplicate membership
);
```

### Table: `public.api_usage_log` — Gemini API token usage tracking

```sql
CREATE TABLE public.api_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action_type TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  model_name TEXT DEFAULT 'gemini-3-flash-preview',
  estimated_cost_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Pricing rates (gemini-3-flash-preview):**
- Input: $0.50 per 1M tokens ($0.0000005 per token)
- Output: $3.00 per 1M tokens ($0.000003 per token)

### Migrations (in chronological order)

1. `001_initial_schema.sql` — users, narratives, auto-profile trigger, RLS
2. `002_add_name_fields_and_position_update.sql` — first_name, last_name columns
3. `003_narrative_upsert_support.sql` — updated_at, dedup, unique constraint, UPDATE policy
4. `004_admin_role_and_activity_log.sql` — role, is_restricted, activity_log table, admin RLS, is_admin() helper
5. `005_saved_repairs.sql` — saved_repairs table + RLS
6. `006_drop_narrative_unique_constraint.sql` — drops unique(user_id, ro_number) for multi-entry support
7. `007_create_groups_table.sql` — Originally created group system tables
8. `008_rename_groups_to_teams.sql` — Renamed groups → teams across all tables/columns
9. `009_api_usage_log.sql` — api_usage_log table with token tracking and cost estimation

Additional manual SQL applied via Supabase SQL Editor:
- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;`
- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);`
- FK redirect for `activity_log.user_id` from `auth.users` to `public.users`

**Important:** Many migrations were applied via the Supabase SQL Editor directly, so `supabase_migrations.schema_migrations` is unreliable as a source of truth. Use the `supabase/migrations/*.sql` files plus this list as the canonical migration history.

---

## TYPESCRIPT INTERFACES (`src/types/database.ts`)

```typescript
export interface UserPreferences {
  appearance?: {
    accentColor: string;
    mode: 'dark' | 'light';
    backgroundAnimation?: boolean;
  };
  templates?: {
    defaultFormat?: 'block' | 'ccc';
    defaultCustomization?: {
      tone?: string;
      warrantyCompliance?: boolean;
      detailLevel?: string;
    };
  };
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  position: string | null;
  profile_picture_url: string | null;
  subscription_status: 'active' | 'trial' | 'expired' | 'bypass';
  stripe_customer_id: string | null;
  role: 'owner' | 'admin' | 'user';
  is_restricted: boolean;
  team_id: string | null;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  story_type: string | null;
  input_data: Record<string, unknown> | null;
  output_preview: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Narrative {
  id: string;
  user_id: string;
  ro_number: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  concern: string | null;
  cause: string | null;
  correction: string | null;
  full_narrative: string | null;
  story_type: 'diagnostic_only' | 'repair_complete';
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  access_code: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  is_active: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  added_by: string | null;
  created_at: string;
}

export interface ApiUsageLog {
  id: string;
  user_id: string | null;
  action_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model_name: string;
  estimated_cost_usd: number;
  created_at: string;
}
```

---

## SUPABASE CLIENT SETUP

ServiceDraft.AI uses three separate Supabase client configurations. **All three are PROTECTED FILES.**

### 1. Browser client — `src/lib/supabase/client.ts`
Used ONLY for `signInWithOtp()` during signup Step 1. Not used for data queries, not used for session checks, not used by `useAuth.ts`.

**CRITICAL pattern:** Before `createBrowserClient()` is called, the file invokes `clearExpiredAuthCookies()` to strip stale/expired auth cookies from the browser. This exists because the SSR library's `_recoverAndRefresh()` reads cookies on init and acquires a 10-second mutex lock. If the cookies contain expired tokens, the auto-refresh loop blocks all subsequent auth calls (`getSession`, `signIn`, `signOut`), producing indefinite hangs.

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { clearExpiredAuthCookies } from '@/lib/utils';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;
  clearExpiredAuthCookies();   // MUST run BEFORE createBrowserClient()
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return browserClient;
}
```

Do NOT remove the `clearExpiredAuthCookies()` call. Do NOT change the initialization order. Do NOT remove the singleton pattern.

### 2. Server client — `src/lib/supabase/server.ts`
Used in all server-side API routes. Reads auth state from HTTP-only session cookies via the SSR cookie adapter. This is the client used for ALL database operations.

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch { /* Server Component — ignore */ }
        },
      },
    },
  );
}
```

### 3. Middleware client — `src/lib/supabase/middleware.ts`
Used exclusively by `src/middleware.ts` to refresh session cookies on incoming requests. The `updateSession()` function wraps `supabase.auth.getUser()` in a 5-second `Promise.race()` timeout. If `getUser()` hangs (historical cause of blank-screen incidents), the middleware proceeds without a user context rather than blocking the request. Protected routes will then redirect to `/login`, which is the correct fallback for stuck sessions.

Do NOT remove the timeout. Do NOT increase the timeout above 5 seconds.

The protected routes list maintained in middleware: `/main-menu`, `/input`, `/narrative`, `/dashboard`, `/admin`. (Team dashboard is gated client-side via role check in the page itself.)

### 4. Service role client
For operations that need to bypass RLS (admin user management, account deletion, etc.), routes import `createClient` from `@supabase/supabase-js` directly with `SUPABASE_SERVICE_ROLE_KEY`. Use this sparingly and ONLY in owner-role-gated routes. Never expose the service role key to the client.

---

## GEMINI CLIENT (`src/lib/gemini/client.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number = 8192,
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens },
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

export function parseJsonResponse<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim()) as T;
}
```

**Token usage instrumentation:** `generateWithGemini` returns token usage metadata (`promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`) which is captured by `src/lib/usageLogger.ts` and written to the `api_usage_log` table. All 6 AI-calling API routes (generate, customize, proofread, apply-edits, update-narrative, convert-recommendation) are instrumented.

---

## GLOBAL STATE: NARRATIVE STORE (`src/stores/narrativeStore.ts`)

**PROTECTED FILE.** Uses React's `useSyncExternalStore` for automatic listener cleanup on unmount (replaced broken useState pub/sub pattern that caused stale listeners and lockups):

```typescript
interface NarrativeState {
  storyType: StoryType | null;
  fieldValues: Record<string, string>;
  dropdownSelections: Record<string, DropdownOption>;
  roNumber: string;
  compiledDataBlock: string;
  narrative: NarrativeData | null;
  displayFormat: 'block' | 'ccc';      // default: 'ccc'
  lengthSlider: 'short' | 'standard' | 'detailed';
  toneSlider: 'warranty' | 'standard' | 'customer_friendly';
  detailSlider: 'concise' | 'standard' | 'additional';
  customInstructions: string;
  generationId: number;
  isSaved: boolean;
  savedNarrativeId: string | null;
}
```

**Key actions:**
- `setStoryType(type)` — preserves shared fields when switching between diagnostic/repair
- `setNarrative(data)` — sets narrative and resets `isSaved: false`, `savedNarrativeId: null`
- `clearForNewGeneration()` — resets narrative + customization + increments generationId
- `markSaved(id)` — sets `isSaved: true` and `savedNarrativeId`
- `setForRepairUpdate(data)` — sets narrative from update-narrative API, carries forward vehicle info + RO#, sets storyType to 'repair_complete'
- `clearFormFields()` — resets fieldValues + dropdownSelections + roNumber (does NOT change storyType)

---

## GLOBAL STATE: AUTH HOOK (`src/hooks/useAuth.ts`)

**PROTECTED FILE.** Module-level singleton auth state with a listener pattern. Does NOT use the browser Supabase client — it fetches the user profile exclusively via `GET /api/me`. This architectural choice eliminates the browser client's internal auth mutex as a source of production incidents.

### Key invariants (DO NOT VIOLATE)
- **No browser Supabase client.** `useAuth.ts` must never import from `@/lib/supabase/client`. If you find yourself wanting to call `supabase.auth.getUser()` in the hook, STOP — route it through `/api/me` instead.
- **Module-level singleton.** Auth state lives in a module-scoped `authState` object and a `listeners` set. Multiple components calling `useAuth()` share the same state via the listener pattern. Do NOT convert this to React Context or Redux.
- **Single initialization.** The `initializeAuth()` function uses an `initialized` flag to guarantee one-shot execution. Do not remove this flag.
- **Retry on failure.** `fetchProfile()` wraps `/api/me` in a 500ms-delay retry. If the first call fails (transient network or cookie race during sign-in), the retry usually succeeds.
- **Visibility-change re-validation.** On tab re-activation (`visibilitychange` → `visible`), if `authState.profile` is null, a refresh is attempted. Guarded by `isRefreshing` to prevent concurrent refresh pile-up.
- **Sign-out pattern.** `signOut()` clears localStorage theme keys, calls `POST /api/auth/logout` with a 3-second race timeout, clears auth state, and hard-redirects to `/`. The hard redirect is intentional — it guarantees a fresh state on the next page load.

### UserProfile shape
Returned by `GET /api/me` and stored in `authState.profile`. Fields:
- `id`, `email`, `username`, `first_name`, `last_name`, `location`, `position`
- `profile_picture_url`
- `subscription_status` — `'bypass'`, `'active'`, `'inactive'`, etc.
- `role` — `'user' | 'admin' | 'owner'`
- `is_restricted` — if true, generation is blocked
- `team_id` — nullable team membership reference

### Why this matters
This hook is on the `PROTECTED FILES — HARD STOPS` list. Any change to `useAuth.ts` requires the DOUBLE-CHECK PROTOCOL.

---

## MAIN MENU PAGE — ROLE-BASED NAVIGATION

The Main Menu page (`src/app/(protected)/main-menu/page.tsx`) renders different dashboard buttons based on the user's role:

| Role | Buttons Shown |
|------|---------------|
| `owner` | Generate Story, User Dashboard, **Owner Dashboard** (gold/amber accent, Shield icon) |
| `admin` | Generate Story, User Dashboard, **Team Dashboard** (accent-colored, Users icon) |
| `user` | Generate Story, User Dashboard |

The Owner Dashboard button uses distinctive gold/amber styling to visually distinguish it. The Team Dashboard button uses the app's accent color. Both conditional buttons appear directly below the User Dashboard button inside the main container card.

---

## INPUT PAGE — KEY IMPLEMENTATION DETAILS

### Field Configuration (`src/constants/fieldConfig.ts`)

```typescript
export type StoryType = 'diagnostic_only' | 'repair_complete';
export type DropdownOption = 'include' | 'dont_include' | 'generate';

export interface FieldConfig {
  id: string;
  label: string;
  fieldNumber: number;
  required: boolean;
  hasDropdown: boolean;
  placeholder: string;
}
```

**Diagnostic Only:** 9 fields (1-5 required, 6-9 conditional with dropdown)
**Repair Complete:** 10 fields (1-5 required, 6-10 conditional with dropdown)

Fields 1-8 share the same IDs across both types. Diagnostic has `recommended_action` (field 9); Repair has `repair_performed` (field 9) and `repair_verification` (field 10).

### Compiled Data Block Assembly (`src/lib/compileDataBlock.ts`)

```typescript
export function compileDataBlock(
  fields: FieldConfig[],
  fieldValues: Record<string, string>,
  dropdownSelections: Record<string, DropdownOption>,
): string {
  const lines: string[] = [];
  for (const field of fields) {
    if (field.id === 'ro_number') continue;  // NEVER sent to API
    if (field.required) {
      lines.push(`${field.label.toUpperCase()}: ${(fieldValues[field.id] || '').trim()}`);
      continue;
    }
    const dropdown = dropdownSelections[field.id] || 'include';
    if (dropdown === 'include') {
      lines.push(`${field.label.toUpperCase()}: ${(fieldValues[field.id] || '').trim()}`);
    } else if (dropdown === 'generate') {
      lines.push(`${field.label.toUpperCase()}: ${AI_INFERENCE_TEMPLATE(field.label)}`);
    }
    // 'dont_include' — skip entirely
  }
  return lines.join('\n');
}
```

### Pre-Generation Customization

When non-standard settings are selected via `PreGenCustomization.tsx`, the compiled data block gets an appended section:

```
--- OUTPUT STYLE PREFERENCES ---
LENGTH PREFERENCE: {modifier text from LENGTH_MODIFIERS}
TONE PREFERENCE: {modifier text from TONE_MODIFIERS}
DETAIL LEVEL PREFERENCE: {modifier text from DETAIL_MODIFIERS}
```

Settings persist in localStorage (`sd-pregen-customization`) between sessions.

---

## NARRATIVE PAGE — KEY IMPLEMENTATION DETAILS

### Customization Panel Slider Logic

Each slider has 3 positions. When at center ("No Change"), no modifier is added. When at either extreme, the exact modifier text from `src/constants/prompts.ts` is appended to the customization block.

**Slider labels:** Short / No Change / Extended (Length), Warranty / No Change / Customer Friendly (Tone), Concise / No Change / Additional Steps (Detail Level). Custom Instructions text field has maxLength={50} with character counter.

The customization sends the CURRENTLY DISPLAYED narrative (not the original input data). This means user edits via the Edit Story modal are preserved.

### Story-Type-Aware Proofread

The `/api/proofread` route selects the system prompt based on `storyType` from the request body:
- `diagnostic_only` → `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` (authorization-readiness optimizer — does NOT flag for missing repairs)
- `repair_complete` → `PROOFREAD_SYSTEM_PROMPT` (warranty audit — checks for harmful language, missing verification, etc.)

The API extracts `[[snippet]]` markers from each flagged issue for UI highlighting, returning `{ issue: string, snippet: string }[]`.

### Selective Apply Edits

After proofread, `ProofreadResults.tsx` renders checkboxes next to each suggested edit. Users can select/deselect individual edits and use "Select All / Deselect All" toggle. Only checked suggestions are sent to the `/api/apply-edits` route.

### Proofread Highlighting with Fade

When proofread results are received, `NarrativeDisplay.tsx` highlights matched snippets in the narrative text with an accent-colored background. The highlights automatically fade out after 30 seconds using CSS transitions. A highlight counter badge shows the number of active highlights, and a "Clear Highlights" button allows immediate removal.

### Export System

**Shared Export Utility** (`src/lib/exportUtils.ts`):

```typescript
export interface ExportPayload {
  narrative: { block_narrative: string; concern: string; cause: string; correction: string; };
  displayFormat: 'block' | 'ccc';
  vehicleInfo: { year: string; make: string; model: string; roNumber: string; };
}

export async function downloadExport(type: 'pdf' | 'docx', payload: ExportPayload): Promise<void>
export function buildPrintHtml(payload: ExportPayload): string
export function buildEmailHtml(narrative, displayFormat, vehicleInfo, senderName): string
export function buildPlainTextEmail(narrative, displayFormat, vehicleInfo, senderName): string
```

**Document Layout** (identical for PDF, DOCX, Print, and Email):
1. **Footer logo**: `ServiceDraft-Ai Vector Logo.png` — bottom-right, 25×12mm (PDF) / 55×26px (DOCX), 2.09:1 aspect ratio
2. **Two-column header**: LEFT = "Vehicle Information:" bold underlined + YEAR/MAKE/MODEL label:value lines; RIGHT = "Repair Order #:" bold underlined + R.O. number (20pt bold)
3. **Title**: "REPAIR NARRATIVE" — 18pt bold underlined, centered
4. **C/C/C sections**: headers at 13pt bold italic underlined, body at 11pt regular
5. **Font**: Helvetica (PDF) / Arial (DOCX)

Both `ShareExportModal` (narrative page) and `NarrativeDetailModal` (dashboard) use `downloadExport()` so documents are always generated identically.

### Narrative Save Pattern

Saves use plain INSERT (not upsert) via `/api/narratives/save` so diagnostic and repair-complete entries with the same RO# coexist as separate rows.

**Duplicate prevention:** `saveToDatabase()` checks `state.savedNarrativeId` — if already set, returns existing ID without inserting.

### Auto-Save on Export

All export actions call `onBeforeExport()` before proceeding, which triggers `saveToDatabase()`. Toast: "Narrative auto-saved to your history" (uses `{ id: 'auto-save' }` to deduplicate).

---

## NAVIGATION GUARD SYSTEM

Three guards work together to protect unsaved narratives:

| Trigger | Guard | Behavior |
|---------|-------|----------|
| Browser close/back/refresh | `beforeunload` event | Browser native dialog |
| Nav bar links / in-app routes | Document click capture (capture phase) | Custom "Unsaved Narrative" modal |
| "NEW STORY" button | Reset confirmation dialog | "Are you sure? All unsaved data will be lost." |
| Any export action | Auto-save | Silently saves first, then exports |
| Manual "SAVE STORY" click | `handleSave()` | Explicit save, disables all guards |

The `beforeunload` listener and click interceptor are only active when `state.isSaved === false`. Both are cleaned up when `isSaved` becomes true.

**In-app navigation interception:**
1. A `click` listener on `document` (capture phase) catches clicks on `<a>` elements with `href` attributes
2. External URLs (`http://`, `#`, `mailto:`) are ignored
3. Internal route links are prevented and a custom modal is shown with "STAY ON PAGE" / "LEAVE WITHOUT SAVING" actions
4. The interceptor stores `pendingNavigation` URL and calls `router.push()` on confirmation

---

## DIAGNOSTIC → REPAIR COMPLETE UPDATE FLOW

When a user opens a saved diagnostic-only narrative from the dashboard:

1. `NarrativeDetailModal` shows "UPDATE NARRATIVE WITH REPAIR" button (only for `story_type === 'diagnostic_only'`)
2. Clicking opens `UpdateWithRepairModal` with pre-filled vehicle info badges
3. User fills in: Repair Performed (required — either typed text or "COMPLETED RECOMMENDED REPAIR" toggle), Repair Verification (dropdown: Include/Don't Include/Generate), Additional Notes (optional)
4. "COMPLETED RECOMMENDED REPAIR" button: toggles a static instruction that tells the update-narrative API to convert the diagnostic recommendation to past-tense completed repair language — no separate API call
5. "GENERATE NARRATIVE" button calls `/api/update-narrative` with original narrative + repair data
6. Response is passed to narrative store via `setForRepairUpdate()` and user is navigated to `/narrative`
7. Both the original diagnostic entry and the new repair-complete entry exist as separate rows in the database

---

## ACTIVITY LOGGING SYSTEM

**Logger:** `src/lib/activityLogger.ts` — fire-and-forget pattern. All errors caught silently. Never blocks user workflows.

```typescript
logActivity('generate', { storyType, vehicleInfo: `${year} ${make} ${model}` });
```

**Logged actions:** generate, regenerate, save, export_copy, export_print, export_pdf, export_docx, login, customize, proofread

**Enhanced metadata:** generate, regenerate, customize, and save actions include metadata with: narrative preview (first 500 chars), vehicle year/make/model, RO number, and story type. This data is displayed in the `ActivityDetailModal` component.

---

## API USAGE TRACKING SYSTEM

### Architecture

```
src/lib/usageLogger.ts             → logApiUsage() function — server-side only
src/lib/gemini/client.ts            → Returns token usage metadata from Gemini responses
src/app/api/admin/usage/route.ts    → Aggregated usage stats endpoint
src/components/admin/TokenCalculator.tsx → Interactive pricing calculator widget
```

### How It Works

1. `generateWithGemini()` returns both the response text and token usage metadata (`promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`) from the Gemini API response
2. `logApiUsage()` is called by each instrumented API route after a successful Gemini call. It calculates `estimated_cost_usd` using the current pricing rates and inserts a row into `api_usage_log`
3. All 6 AI routes are instrumented: generate, customize, proofread, apply-edits, update-narrative, convert-recommendation

### Usage Logger (`src/lib/usageLogger.ts`)

```typescript
const INPUT_COST_PER_TOKEN = 0.0000005;   // $0.50 / 1M tokens
const OUTPUT_COST_PER_TOKEN = 0.000003;   // $3.00 / 1M tokens

export async function logApiUsage(params: {
  userId: string;
  actionType: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}): Promise<void>
```

### Usage API Endpoint (`GET /api/admin/usage`)

- Query params: `?range=7` (7/30/90/all)
- Requires owner role
- Returns: `totalTokens`, `totalCost`, `tokensByAction`, `tokensByDay`, `topUsersByTokens`, `costByDay`

### Token Calculator (`src/components/admin/TokenCalculator.tsx`)

Interactive widget in the Owner Dashboard that lets the owner estimate Gemini API costs:
- Model selector dropdown (currently only `gemini-3-flash-preview`)
- Input/output token count fields
- Proofread/customization toggle multipliers
- Real-time cost calculation display

---

## TEAM MANAGEMENT SYSTEM

### Overview

Teams are organizational groups of users managed by the platform owner. Each team has a unique access code used during signup for automatic assignment. Team Managers (admin role) can view their team's members and activity.

### Architecture

```
Database:     public.teams + public.team_members + users.team_id
API:          src/app/api/teams/route.ts (team CRUD for admin-level users)
              src/app/api/teams/members/route.ts (team member operations)
              src/app/api/teams/activity/route.ts (team activity log)
              src/app/api/admin/route.ts (owner-level: list_teams, assign_user, create_team)
Pages:        src/app/(protected)/team-dashboard/page.tsx
Signup:       src/app/api/signup/activate/route.ts (team auto-assignment via teamId)
```

### Signup Team Auto-Assignment Flow

1. User enters an access code during signup Step 3 (activation)
2. The `/api/stripe/route.ts` access code validation checks:
   - First: Does the code match the global `ACCESS_CODE` env var? → bypass subscription
   - Second: Does the code match any `teams.access_code`? → bypass subscription AND auto-assign to that team
3. If team match found: `/api/signup/activate` sets `team_id` on the user record
4. User is fully activated with team assignment in place

### Team API Routes (`/api/teams`)

| Action | Method | Access | Description |
|--------|--------|--------|-------------|
| List teams | GET | admin+ | Returns teams the user manages or belongs to |
| Create team | POST | owner | Creates team with auto-generated access code |
| Update team | PUT | owner | Updates team name/description |
| Delete team | DELETE | owner | Soft-deletes team (is_active = false) |

### Owner Dashboard Team Actions (`POST /api/admin`)

| Action | Params | Description |
|--------|--------|-------------|
| `list_teams` | — | Returns all active teams with member counts |
| `assign_user` | `userId`, `teamId` | Assigns user to team (updates users.team_id + creates team_members row) |
| `create_team` | `name` | Creates new team with auto-generated access code |

### Team Dashboard Page (`/team-dashboard`)

Admin-role (Team Manager) users can access this page. It includes:

**Team Members Tab:**
- Table of all users in the manager's team
- Columns: Name, Email (truncated with tooltip), Position, Role, Last Active, Actions
- Remove member action button
- Center-aligned text, glowing row hover effect

**Activity Log Tab:**
- Table of all activity from team members
- Same format as Owner Dashboard activity log but scoped to team
- Clickable rows open `ActivityDetailModal` (shared component)
- Refresh button for manual data reload

### User Management Table — Team Column (Owner Dashboard)

The Owner Dashboard's User Management table includes a "Team" column showing each user's assigned team name (truncated with tooltip if long), or "—" if unassigned.

**Assign to Team flow:**
1. Owner clicks "Assign to Team" action button (Users icon) on a user row
2. Modal shows current team assignment, dropdown of all teams with member counts
3. Select a team → click Assign → user's team_id updates, team_members entry created
4. Table updates immediately

**Create Team flow:**
1. Owner clicks "CREATE TEAM" button in User Management tab header
2. Modal with team name input + Enter key submit
3. On submit: calls admin API create_team action → team created with auto-generated access code
4. New team immediately available in Assign to Team dropdowns

---

## RATE LIMITING & SECURITY

### Rate Limiting (`src/lib/rateLimit.ts`)
- In-memory store (resets on server restart)
- `/api/generate`: 20 requests per user per 15 minutes
- Input length limit: compiled data block capped at 10,000 characters

### Security Headers (`next.config.ts`)
- Content-Security-Policy, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy
- CSP allows: Stripe JS, Google Fonts, Supabase, Gemini API, Resend API

### Auth on API Routes
All API routes (except Stripe webhook) require authenticated Supabase session via server client. Admin routes additionally verify `role = 'admin'` or `role = 'owner'`. Owner-only routes verify `role = 'owner'` specifically.

### Access Code
Read from `ACCESS_CODE` environment variable — no hardcoded defaults. Used in `/api/stripe/route.ts` for beta signup bypass. Team-specific access codes are stored in the `teams` table.

---

## APPENDIX: ACCENT COLOR THEMING SYSTEM

### Overview

The entire app uses CSS custom properties for all accent colors, backgrounds, text, borders, shadows, and glow effects. The theme is controlled by `ThemeProvider` (`src/components/ThemeProvider.tsx` — **PROTECTED FILE**) which applies CSS variables to `document.documentElement` at runtime. Changing the accent color updates every component instantly.

### Architecture

```
src/lib/constants/themeColors.ts    → AccentColor interface, 9 color definitions, buildCssVars(), perceivedBrightness()
src/components/ThemeProvider.tsx     → React context, localStorage persistence, Supabase sync, CSS injection
src/app/globals.css                 → :root defaults (Violet), @theme Tailwind config
src/app/layout.tsx                  → <ThemeProvider> wraps the entire app
public/logo-{color}.PNG             → 9 accent-colored logo files
```

### How to Use in Components

**NEVER** hardcode hex colors. **ALWAYS** use CSS variable references via Tailwind arbitrary values:

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

### 9 Available Accent Colors

| Color | Key | Hex | Forces Mode |
|-------|-----|-----|-------------|
| Violet | `violet` | `#9333ea` | — (default) |
| Red | `red` | `#dc2626` | — |
| Orange | `orange` | `#ea580c` | — |
| Yellow | `yellow` | `#eab308` | — |
| Green | `green` | `#84cc16` | — |
| Blue | `blue` | `#2563eb` | — |
| Pink | `pink` | `#d946ef` | — |
| Noir | `white` | `#e2e8f0` | Forces dark mode |
| White | `black` | `#1e293b` | Forces light mode |

### CSS Variable Reference

| Variable | Purpose | Default (Violet Dark) |
|----------|---------|----------------------|
| `--accent-primary` | Main accent color | `#9333ea` |
| `--accent-hover` | Hover/interactive accent | `#a855f7` |
| `--accent-bright` | Brightest accent (links, highlights) | `#c084fc` |
| `--accent-border` | Border color for inputs/cards | `#6b21a8` |
| `--accent-deep` | Darkest accent (deep glow) | `#49129b` |
| `--accent-text` | Text secondary (accent-tinted) | `#c4b5fd` |
| `--accent-3` through `--accent-50` | Accent at 3%-50% opacity | `rgba(r,g,b,0.XX)` |
| `--shadow-glow-sm` | Small glow shadow | `0 0 15px rgba(...)` |
| `--shadow-glow-md` | Medium glow shadow | `0 0 40px rgba(...)` |
| `--shadow-glow-lg` | Large glow shadow | `0 0 60px rgba(...)` |
| `--shadow-glow-accent` | Accent glow for interactive | `0 0 20px rgba(...)` |
| `--bg-primary` | Page background base | `#000000` |
| `--bg-gradient-1` | Body gradient start | `#260d3f` |
| `--bg-gradient-2` | Body gradient end | `#490557` |
| `--bg-input` | Input field background | `#0f0520` |
| `--bg-elevated` | Elevated surface | `#1a0a2e` |
| `--bg-card` | Card background (derived: `var(--accent-5)`) | `rgba(r,g,b,0.05)` |
| `--bg-modal` | Modal background | `rgba(15,10,30,0.85)` |
| `--bg-nav` | Nav bar background | `rgba(0,0,0,0.8)` |
| `--body-bg` | Full body gradient (fully resolved string) | `linear-gradient(...)` |
| `--text-primary` | Primary text | `#ffffff` |
| `--text-secondary` | Secondary text (derived: `var(--accent-text)`) | `#c4b5fd` |
| `--text-muted` | Muted/subtle text | `#9ca3af` |
| `--wave-color` | Wave RGB for canvas (bare components) | `195, 171, 226` |
| `--card-border` | Card border color | `#000000` |
| `--modal-border` | Modal border color | `#000000` |
| `--btn-text-on-accent` | Button text — auto: white or black based on luminance | `#ffffff` |
| `--accent-vivid` | Secondary button text — uses darker shade in light mode | `#a855f7` |
| `--accent-text-emphasis` | Heading emphasis — accent in dark, bold black in light | `accent.hex` |

### Using the Theme Context

```tsx
import { useTheme } from '@/components/ThemeProvider';

function MyComponent() {
  const { accent, setAccentColor, colorMode, toggleColorMode, backgroundAnimation, setBackgroundAnimation } = useTheme();
  // accent.logoFile → '/logo-violet.PNG'
  // accent.key → 'violet'
  // accent.name → 'Violet'
}
```

### ThemeProvider Internals

`applyTheme(accent, mode)` — called on mount and whenever accent or colorMode changes:
1. Calls `buildCssVars(accent)` to generate all CSS variable values
2. Loops through returned `Record<string, string>` and sets each via `root.style.setProperty(key, value)`
3. Sets `color-scheme` property to `'dark'` or `'light'` (controls browser form control rendering)
4. Computes `effectiveMode`: Black accent forces `'light'`, White accent forces `'dark'`, otherwise uses stored mode
5. If light mode active: applies additional overrides for `--bg-primary`, `--text-primary`, `--text-muted`, `--bg-modal`, `--bg-nav`, `--body-bg`, `--card-border`, `--modal-border`
6. Luminance check: `perceivedBrightness()` on `accent.hover` determines `--btn-text-on-accent` (black text if brightness > 180, white otherwise)
7. Sets `data-mode` attribute on `<html>` element for CSS selector targeting

`--body-bg` resolution strategy: The page background gradient is set as a **fully resolved string** in `buildCssVars()`, NOT as CSS `var()` composition. CSS `var()` composition in `:root` is unreliable when source variables are set as inline styles by JavaScript.

`--wave-color` format: Bare RGB components (e.g., `195, 171, 226`) rather than `rgb()` or hex — allows canvas code to interpolate opacity per-wave using `rgba(${waveRgb}, ${wave.opacity})`.

### Background Animation and CSS Variables

Both `ParticleNetwork` (protected pages) and `WaveBackground` (landing/auth pages) read `--wave-color` from the DOM:

```tsx
const root = document.documentElement;
const waveRgb =
  root.style.getPropertyValue('--wave-color').trim() ||
  getComputedStyle(root).getPropertyValue('--wave-color').trim() ||
  '195, 171, 226';
```

ParticleNetwork re-reads every 2 seconds via `setInterval`. WaveBackground reads every frame.

### Form Control Styling

Two layers ensure correctly themed form controls:
1. `color-scheme: dark` in `:root` (ThemeProvider dynamically updates to `'light'` when needed)
2. Explicit CSS overrides in `globals.css`: `input, textarea, select { background-color: var(--bg-input); color: var(--text-primary); }`

### React Hydration Safety

Components that read accent color from context render with default Violet values during SSR, then swap to the real accent after mount using a `mounted` state guard:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const logoSrc = mounted ? accent.logoFile : DEFAULT_ACCENT.logoFile;
```

Applied in: `HeroArea.tsx` (logo), `Logo.tsx` (landing/auth), `NavBar.tsx` (color mode toggle icon).

---

## APPENDIX: FRAMER MOTION ANIMATION STANDARDS

### Spring Transition Config (used everywhere)

```tsx
const springTransition = { type: 'spring', stiffness: 400, damping: 25 };
```

### Hover/Tap Scale Values by Element Type

| Element | whileHover scale | whileTap scale | boxShadow on hover |
|---------|-----------------|----------------|-------------------|
| LiquidCard | **NONE** (cursor underglow instead) | NONE | CSS hover |
| Button | 1.05 | 0.95 | `var(--shadow-glow-sm)` |
| StoryTypeSelector cards | **NONE** | 0.97 | `var(--shadow-glow-sm)` |
| Small links (FAQ, etc.) | 1.08 | 0.95 | none |

**Rules:**
- Cards and containers do NOT scale on hover — they use the CursorGlow underglow effect
- Buttons and small interactive elements use scale + glow
- Always use the spring transition config above for consistency

### Using Framer Motion `boxShadow` with CSS Variables

When animating boxShadow via Framer Motion, the CSS variable must be wrapped in the animation prop directly:

```tsx
whileHover={{ boxShadow: 'var(--shadow-glow-sm)' }}
```

Do NOT compose it inside a style object — Framer Motion can't tween an unresolved `var()` reference.

### Cursor Underglow Effect (`src/components/ui/CursorGlow.tsx`)

A wrapper component that adds a cursor-following radial gradient underglow to any child element. Used on `LiquidCard` and any container that should react to hover without scaling. Implementation: tracks `mousemove` events, sets a CSS custom property `--mouse-x` and `--mouse-y` on the element, applies a `radial-gradient(at var(--mouse-x) var(--mouse-y), var(--accent-30), transparent 80%)` background.

### Page Transitions

All protected pages wrap their root content in `PageTransition.tsx`, which provides a fade + slide entrance:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
```

---

## APPENDIX: PAGE LAYOUT STRUCTURE

### Overview

All protected pages share a consistent layout managed by `src/app/(protected)/layout.tsx`:

```
┌────────────────────────────────────┐
│  HeroArea (100px reactive wave)    │  ← Sticky top
├────────────────────────────────────┤
│  NavBar (64px sticky)              │  ← APP_VERSION displayed here
├────────────────────────────────────┤
│                                    │
│  Page content                      │  ← PageTransition wrapper
│  (with ParticleNetwork bg)         │
│                                    │
└────────────────────────────────────┘
```

### Protected Layout (`src/app/(protected)/layout.tsx`)

Wraps all `(protected)` routes with:
- `ErrorBoundary` — React error boundary catches render errors
- `HeroArea` — 100px reactive wave hero banner with floating logo
- `NavBar` — 64px sticky navigation
- `ParticleNetwork` — Full-page particle network canvas animation (toggleable in preferences)
- Session expiry watcher — 8-hour auto-logout with 60-second check interval

### HeroArea Reactive Animation (`src/components/layout/HeroArea.tsx`)

The hero wave reacts to user activity through the `useActivityPulse` hook system. When activity is dispatched, the wave amplitude pulses up and decays over ~1.5 seconds.

Activity intensity values:

| Action | Intensity (0–1) |
|--------|----------------|
| Generate/Regenerate narrative | 0.8 |
| Customize | 0.7 |
| Proofread | 0.6 |
| Apply edits | 0.7 |
| Save | 0.5 |

Dispatching from new features:
```typescript
import { dispatchActivity } from '@/hooks/useActivityPulse';
dispatchActivity(0.8); // intensity 0–1
```

### NavBar Layout (3 sections)

- **LEFT**: Styled "MAIN MENU" button with `bg-[var(--accent-10)]`, border, rounded-lg, hover glow
- **CENTER**: `ServiceDraft-Ai Vector Logo.png` centered absolutely with CSS filter: `brightness(0) invert(1)` for dark mode, `brightness(0)` for light mode
- **RIGHT**: Color mode toggle (Sun/Moon icons) + UserPopup trigger + mobile hamburger

NavBar also displays the centered `APP_VERSION` label imported from `src/lib/version.ts` (accent-bright color, hidden on mobile). This is one of the two display points governed by the `MANDATORY VERSION BUMP RULE`.

### UserPopup Trigger

`formatDisplayName()`: first initial + period + last name (e.g., "T.Cloyd"). Falls back to username, then email prefix.

Dropdown shows:
- User info (name, location, position)
- Dashboard link (all users)
- **Owner Dashboard** link (owner role only — Shield icon, gold accent)
- **Team Dashboard** link (admin role only — Users icon)
- Log Out button

---

## APPENDIX: PREFERENCES SYSTEM

### Overview

User preferences are stored as a JSONB column (`preferences`) on the `users` table. The system uses a **localStorage-first, Supabase-async-override** pattern:

1. **On page load:** ThemeProvider reads `sd-accent-color` and `sd-color-mode` from localStorage (instant)
2. **After hydration:** ThemeProvider asynchronously queries `users.preferences` from Supabase
3. **If Supabase has preferences:** They override localStorage and sync it for consistency
4. **If not logged in or network fails:** localStorage values remain (graceful degradation)

### Auth-Aware Theme Flow

- **Not logged in:** ThemeProvider resets to violet dark defaults
- **SIGNED_OUT event:** Resets to violet dark + clears localStorage
- **SIGNED_IN event:** Loads user preferences from Supabase

### Merge Pattern

When saving, ThemeProvider reads existing `preferences` JSONB first, then spreads:
```typescript
const merged = { ...existingPrefs, appearance: { accentColor, mode, backgroundAnimation } };
```
This ensures independent features (appearance, templates) never overwrite each other.

### Supabase Sync Details

- **Dynamic import:** Supabase client imported via `await import(...)` to avoid bundling in ThemeProvider's initial chunk
- **Auth check:** If no user logged in, load/save silently return
- **Error handling:** All Supabase calls wrapped in try/catch — errors logged, never break the app
- **localStorage alignment:** After Supabase load, localStorage keys are updated to match

---

## APPENDIX: OWNER DASHBOARD (Admin Page)

### Route & Access

- **Page:** `src/app/(protected)/admin/page.tsx` — owner-only page with 6 tabs
- **API:** `src/app/api/admin/route.ts` — POST endpoint for user management + team management actions
- **Analytics API:** `src/app/api/admin/analytics/route.ts` — GET endpoint with `?range=` param. Returns `systemHealth.appVersion` from `src/lib/version.ts`
- **Usage API:** `src/app/api/admin/usage/route.ts` — GET endpoint for Gemini token usage stats
- **Access:** All routes verify `role = 'owner'` on the user's profile. Non-owners are redirected.

### Owner Dashboard Tabs

1. **Overview** — 8 metric cards + **System Health card displaying APP_VERSION** (this is the second of the two governed version display points)
2. **Activity Log** — Paginated table of all user activity with search, action filter, sort. Clickable rows open `ActivityDetailModal` with full metadata display
3. **User Management** — Sortable user table with search, inline actions (reset password, restrict, change subscription, promote/demote, delete). Includes Team column with assignment. CREATE TEAM button.
4. **Analytics** — Recharts-powered charts (LineChart for generation trends, BarChart for activity by type, PieChart for story types, AreaChart for usage over time). Time range selector (7d/30d/90d/all)
5. **API Usage** — Live Gemini token usage tracking. Summary cards (total tokens, total cost, average per call). Token/cost charts by day. Action breakdown. Top users leaderboard.
6. **Settings** — Token Calculator widget for estimating API costs. Current access code display.

### Admin API Actions (`POST /api/admin`)

| Action | Params | Description |
|--------|--------|-------------|
| `list_users` | — | Returns all users with narrative counts, last activity, team_name |
| `get_user_details` | `userId` | Returns profile, recent activity (5), recent narratives (5) |
| `send_password_reset` | `email` | Sends reset via Resend (branded) or Supabase fallback |
| `restrict_user` | `userId`, `restricted` | Sets `is_restricted` flag |
| `delete_user` | `userId` | Permanently deletes user via `auth.admin.deleteUser` |
| `change_subscription` | `userId`, `status` | Updates subscription_status (active/trial/expired/bypass) |
| `promote_to_admin` | `userId` | Sets role to 'admin' (Team Manager) |
| `demote_to_user` | `userId` | Sets role to 'user' |
| `get_access_code` | — | Returns current ACCESS_CODE from env |
| `list_teams` | — | Returns all active teams with member counts |
| `assign_user` | `userId`, `teamId` | Assigns user to team |
| `create_team` | `name` | Creates team with auto-generated access code |

### Analytics API Returns

`totalUsers`, `newUsersWeek`, `newUsersMonth`, `activeSubscriptions`, `totalNarratives`, `narrativesWeek`, `narrativesToday`, `totalGenerations`, `totalExports`, `totalProofreads`, `totalCustomizations`, `totalSavedTemplates`, `activityByType`, `activityByDay`, `dailyNarratives`, `topUsers`, `storyTypes`, `subscriptionBreakdown`, `usageOverTime`, `actionTypes`, `systemHealth` (DB row counts, last activity, **`appVersion` imported from `@/lib/version`**)

### Protected User

`hvcadip@gmail.com` shows "Protected" badge with ShieldCheck icon instead of delete/restrict buttons. Cannot be accidentally deleted or restricted.

### Key Patterns

- Service role client used for admin operations bypassing RLS
- Admin verification via session client — checks user's own auth, then reads role from `users` table
- Analytics charts built with `recharts`
- Tab transitions use AnimatePresence with slide/fade variants
- Auto-refresh uses `setInterval(fetchAnalytics, 60000)` with cleanup on tab switch
- Table UI: email column truncation (max-w-[180px] with tooltip), center-aligned headers/cells, glowing accent-colored row hover effects

### Activity Detail Modal (`src/components/admin/ActivityDetailModal.tsx`)

Shared modal component used by BOTH Owner Dashboard and Team Dashboard activity log tabs:
- Framer Motion animations (fade backdrop + scale modal)
- Content sections: action type badge (color-coded), timestamp, user info, vehicle info, RO number, story type badge, narrative text in scrollable container, input data, collapsible "View Raw Data" JSON section
- Gracefully handles entries with minimal metadata
- Close on X button, backdrop click, and Escape key

---

## APPENDIX: MY REPAIRS / TEMPLATES SYSTEM

### API Routes

- `GET /api/saved-repairs` — Fetch all templates for authenticated user (ordered by updated_at desc)
- `POST /api/saved-repairs` — Create new template
- `PUT /api/saved-repairs/[id]` — Update template (ownership verified)
- `DELETE /api/saved-repairs/[id]` — Delete template (ownership verified)

### What Gets Saved

Only 5 core repair fields + their dropdown option states:
- `codes_present` / `codes_present_option`
- `diagnostics_performed` / `diagnostics_option`
- `root_cause` / `root_cause_option`
- `repair_performed` / `repair_option`
- `repair_verification` / `verification_option`

Vehicle info and customer concern are NOT saved — templates are vehicle-agnostic.

### Loading a Template

When user clicks "Load" on a template card:
1. Sets story type selector to template's story_type
2. Maps API option values back to store format: `'exclude'` → `'dont_include'`, `'generate'` → `'generate'`, default → `'include'`
3. For `'exclude'`/`'generate'` options: clears text field and sets dropdown; for `'include'`: fills saved text
4. Uses `setTimeout(50ms)` to allow story type state change to propagate before setting field values

### UI Components

- `MyRepairsPanel.tsx` — slide-out panel from right side, portaled to document.body
- `SaveRepairModal.tsx` — modal with template name input + summary preview
- `EditRepairModal.tsx` — modal for editing saved template fields

---

## APPENDIX: POSITION-BASED ICON SYSTEM

Profile pictures have been replaced with position-based icons (`src/components/ui/PositionIcon.tsx`):

| Position | Icon (lucide-react) |
|----------|-------------------|
| Technician | `Wrench` |
| Foreman | `Hammer` |
| Diagnostician | `ScanLine` |
| Advisor | `PenLine` |
| Manager | `ClipboardList` |
| Warranty Clerk | `BookOpen` |
| (fallback) | `User` |

Size variants: `small` (nav bar), `medium` (default), `large` (dashboard profile). Used in `ProfileSection.tsx`, `UserPopup.tsx`.

---

## APPENDIX: ENVIRONMENT VARIABLES

### Required (app will not function)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | Google Generative AI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Required for full functionality

| Variable | Description |
|----------|-------------|
| `ACCESS_CODE` | Beta access code for signup bypass (e.g., WHISLER-BETA-2026) |
| `NEXT_PUBLIC_APP_URL` | **MUST be `https://servicedraft.ai`** (non-www, used for canonical redirects in auth callback) |
| `RESEND_API_KEY` | Resend email service API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe subscription price ID |

---

## APPENDIX: COMMON PATTERNS

### API Route Pattern (Server-Side with Auth)

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    // ... process request ...
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Owner-Only API Route Pattern

```typescript
// After standard auth check:
const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
if (profile?.role !== 'owner') {
  return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
}
// Proceed with owner-only operations using service role client
```

### Client-Side API Call Pattern

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleAction() {
  setIsLoading(true);
  try {
    const response = await fetch('/api/example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: value }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Request failed');
    }
    const data = await response.json();
    toast.success('Action completed');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Something went wrong');
    console.error(error);
  } finally {
    setIsLoading(false);
  }
}
```

### Activity Logging

```typescript
import { logActivity } from '@/lib/activityLogger';
// Fire-and-forget — never awaited
logActivity('generate', { storyType, vehicleInfo: `${year} ${make} ${model}` });
```

### Framer Motion Page Entrance

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {/* Page content */}
</motion.div>
```

---

## APPENDIX: CRITICAL LESSONS LEARNED

These are hard-won lessons from actual production incidents. Read before touching auth, the browser Supabase client, middleware, or the signup flow. Every lesson here exists because something broke in production.

### Auth & Supabase client
1. **The browser Supabase client's internal auth mutex is a recurring incident source.** Concurrent `getUser()` calls cause the 10-second mutex lock to block, producing indefinite hangs and blank screens. `useAuth.ts` was explicitly refactored to bypass the browser client entirely and fetch via `GET /api/me` to eliminate this class of bug. Never re-introduce browser-client auth calls in `useAuth.ts`.
2. **Expired auth cookies deadlock the SDK on init.** `createBrowserClient()` → `_initialize()` → `_recoverAndRefresh()` reads cookies at construction and attempts token refresh. If the tokens are expired, the refresh loop blocks further auth calls. The fix: `clearExpiredAuthCookies()` must run BEFORE `createBrowserClient()` in `src/lib/supabase/client.ts`. Do not reorder.
3. **`getSession()` is safe; `getUser()` is not.** `getSession()` reads from local cache; `getUser()` makes a network call that can hang. Always wrap `getUser()` in a timeout (`Promise.race` with a 5-second reject) when called in middleware or critical paths.
4. **PKCE is browser-scoped.** The `code_verifier` cookie does not cross browser boundaries, making cross-browser magic-link verification impossible. The OTP flow exists specifically to solve this — do not revert.
5. **`verifyOtp` type must be `'signup'` for new users.** Supabase stores OTP tokens from `signInWithOtp()` on new accounts as `confirmation` type. The `verifyOtp` call must use `type: 'signup'` — `type: 'email'` will fail with "token has expired or is invalid".
6. **www vs non-www breaks cookie scope.** Session cookies bound to the apex domain are invisible on the www subdomain. The 308 redirect in `middleware.ts` forces all traffic to non-www BEFORE auth runs.
7. **Canonical domain in env vars matters.** `NEXT_PUBLIC_APP_URL` must be set to `https://servicedraft.ai` (non-www). The auth callback route uses this for all success/failure redirects to ensure cookies are visible.
8. **`handle_new_user` trigger needs defensive guards.** The Postgres trigger must have `SET search_path = public`, `ON CONFLICT DO NOTHING`, and an exception handler. Silent failures leave no `public.users` row. Both `/api/signup/complete-profile` and `/api/signup/activate` use UPSERT as a safety net in case the trigger failed.
9. **`useAuth` and `narrativeStore` are module-level singletons.** They persist across route transitions and should NEVER be torn down during navigation. Only a full page reload or explicit sign-out resets them. Tearing down the auth subscription on unmount causes AbortError and login lockups.
10. **`useSyncExternalStore` must be used for the narrative store.** The original `useState(() => subscribe())` pattern never cleaned up listeners on unmount — every page navigation added a permanent listener to the global Set, causing stale re-renders and state corruption.
11. **SUPABASE_SERVICE_ROLE_KEY copy errors:** Accidentally prepending surrounding UI text (e.g., "you") to the key value is a known failure mode — always verify the raw key value with `.trim()` and `auth` options in the service client initialization.

### Database & Supabase
12. **PostgREST relational joins require FKs to `public` schema tables, not `auth.users`.** If a join fails with "could not find relationship", check that the foreign key references `public.users`, not `auth.users`. Fix: drop FK, recreate pointing to `public.users`, then run `NOTIFY pgrst, 'reload schema'`.
13. **After schema changes, run `NOTIFY pgrst, 'reload schema'`** to flush the PostgREST cache. Otherwise, new columns are invisible to the API.
14. **RLS policies do not follow table renames.** When renaming a table, explicitly drop and recreate policies.
15. **`supabase_migrations.schema_migrations` is unreliable for this project's history.** Most migrations were applied via SQL Editor directly, so the migrations table does not reflect the full change log. Use the `supabase/migrations/*.sql` files plus the migration list in this doc as the source of truth.
16. **`apply_migration` is for DDL, `execute_sql` is for DML.** Don't swap them.
17. **Auth settings (email confirmation toggle, etc.) cannot be changed via SQL.** They must be changed in the Supabase Dashboard UI.
18. **Team-related database columns (e.g., `team_id`) must exist before code referencing them is deployed.** Run migrations in Supabase SQL Editor before deploying code that queries new columns. Console errors like "column users.team_id does not exist" mean the migration hasn't been applied to the live database.

### Narratives & AI
19. **Diagnostic Only and Repair Complete narratives sharing the same RO# must save as separate database rows** via plain INSERT — never upsert or overwrite across story types.
20. **AI prompts MUST explicitly require preservation of exact technical details** — terminal numbers, connector IDs, circuit numbers, measurement values. This is critical for GM warranty audit compliance. Generic paraphrasing breaks audit acceptance.
21. **`usageMetadata` path:** via the older `@google/generative-ai` SDK, token usage is at `result.response.usageMetadata`. Do not assume newer SDK paths.

### Frontend & Build
22. **Stale `.next` cache can serve old code after fixes are committed.** When behavior doesn't match committed code, delete `.next` with `rmdir /s /q .next` (Windows) or `rm -rf .next` before further debugging.
23. **React hydration mismatches** from ThemeProvider: Components that read accent color from context should render with default Violet values during SSR and swap to real values after mount using a `mounted` state guard pattern.
24. **Tailwind v4 uses CSS-first configuration** via `@theme` blocks in `globals.css`. There is no `tailwind.config.ts` file.
25. **`--body-bg` must be a fully resolved gradient string**, not CSS `var()` composition, because CSS `var()` in `:root` is unreliable when source vars are set as inline styles by JavaScript.
26. **The 3-tier role system (owner/admin/user) replaced the original 2-tier system.** All access gates, API routes, badges, promote/demote logic, and conditional UI rendering must check for the correct role string. Never assume only 'admin' and 'user' exist.

### Production safety
27. **The app is live. Local commits do not push automatically.** Every sprint ends with a local commit only. Tyler pushes manually after localhost testing. If you ever push to GitHub without explicit permission, you have caused a deployment.
28. **Never disable a safeguard without explicit permission.** Rate limits, auth checks, role guards, and validation exist because something happened that required them. If removing one seems to "simplify" the code, you are probably about to recreate a past bug.
29. **Version bumping is mandatory.** Every sprint bumps `src/lib/version.ts`. Skipping a bump makes it impossible to tell localhost from production.
30. **Cloudflare proxy must be disabled (grey cloud/DNS-only) when pointing to Vercel.** Orange cloud (proxy enabled) breaks Vercel's domain verification and SSL.
31. **Documentation updates must happen before git commits**, not after. Every sprint should explicitly update `BUILD_PROGRESS_TRACKER.md` before the commit step.

---

## APPENDIX: SIGNUP FLOW DETAILS

The signup flow is a 3-step OTP-based onboarding. It was migrated from a magic-link/PKCE flow after PKCE's browser-scoped `code_verifier` cookie caused cross-browser verification failures. The current flow has ZERO browser dependency on the verification device — the user can receive the email on one device/browser and enter the code on another.

### Step 1 — Email verification via OTP

**Frontend (`src/app/(auth)/signup/page.tsx`):**
- User enters email and confirm-email
- Client calls `supabase.auth.signInWithOtp({ email })` via the browser client (the only place the browser client is used)
- Supabase sends an email containing a 6-digit code (and optionally a magic link as fallback)
- UI transitions to "enter your code" view

**Backend verification (`src/app/api/signup/verify-otp/route.ts`):**
- User enters the 6-digit code on the signup page
- Client POSTs `{ email, token }` to `/api/signup/verify-otp`
- Server calls `supabase.auth.verifyOtp({ email, token, type: 'signup' })`
- **CRITICAL: the type is `'signup'`, NOT `'email'`.** Supabase stores OTP tokens for new users as `confirmation` type. Using `'signup'` in `verifyOtp` matches that token type. Using `'email'` fails with `"token has expired or is invalid"`. This is a documented lesson — see CRITICAL LESSONS LEARNED #5.
- On success, the SSR library sets session cookies via the `setAll()` callback in `src/lib/supabase/server.ts`
- Route returns `{ success: true, userId }`

**Supabase Dashboard requirement:** The "Magic Link" email template MUST include `{{ .Token }}` in its body to display the 6-digit code. If the template only includes `{{ .ConfirmationURL }}`, users will not see a code and the flow breaks. This is a dashboard-only setting — it cannot be managed in code.

### Step 2 — Password & profile (combined)

**Frontend:**
- User enters password, first name, last name, location, position, optional accent color preference
- Client POSTs all fields to `/api/signup/complete-profile`

**Backend (`src/app/api/signup/complete-profile/route.ts`):**
- Verifies user is authenticated (session from Step 1 must exist)
- Validates password length ≥ 6, first/last name non-empty, position set
- Calls `supabase.auth.updateUser({ password })` to set the password
- Upserts a row into `public.users` with `id`, `email`, `username` (derived from email), `first_name`, `last_name`, `location`, `position`, and optional `preferences.appearance`
- **Uses UPSERT, not UPDATE.** The `handle_new_user` Postgres trigger on `auth.users` can silently fail, leaving no `public.users` row. Upsert handles both the trigger-succeeded and trigger-failed cases.

### Step 3 — Access code activation

**Frontend:**
- User enters an access code (e.g. `WHISLER-BETA-2026`) OR is redirected to Stripe checkout (future)
- Client POSTs `{ teamId }` to `/api/signup/activate` after successful access code validation

**Backend (`src/app/api/signup/activate/route.ts`):**
- Verifies user is authenticated
- Upserts `public.users` row with `subscription_status: 'bypass'` and optional `team_id`
- Again, uses UPSERT as a safety net in case the trigger silently failed and no row exists

### Auth callback fallback — `src/app/auth/callback/route.ts`

The callback route still exists as a fallback for users who click the magic link in the email instead of entering the code. It handles two paths:
- `?code=...` — PKCE flow, calls `exchangeCodeForSession()`. If it fails (cross-browser), redirects to `/signup?error=cross-browser`.
- `?token_hash=...&type=...` — token-hash flow, calls `verifyOtp({ token_hash, type })`. If it fails (expired/used), redirects to `/signup?error=link-expired`.

Both success paths redirect to `/signup?step=2`. Both use the canonical non-www domain from `NEXT_PUBLIC_APP_URL` to match cookie scope.

### www → non-www middleware redirect

`src/middleware.ts` forces all `www.servicedraft.ai` requests to `servicedraft.ai` via a 308 redirect BEFORE any auth processing runs. This exists because session cookies are scoped to the non-www domain; without the redirect, a user who lands on the www subdomain would never see their session cookies and would appear permanently logged out.

Do NOT remove the www redirect. Do NOT change its order (it must run before `updateSession()`).

### What NOT to do (hard rules)
- Do NOT re-introduce a pure magic-link flow that depends on PKCE code_verifier cookies
- Do NOT change `type: 'signup'` to `type: 'email'` in `/api/signup/verify-otp`
- Do NOT remove the UPSERT safety net in complete-profile or activate
- Do NOT remove the www → non-www redirect
- Do NOT remove the `clearExpiredAuthCookies()` call in the browser client
- Do NOT remove the 5-second `getUser()` timeout in middleware
- Do NOT change `useAuth.ts` to use the browser Supabase client

All of the above are on the `PROTECTED FILES — HARD STOPS` list and changes require the DOUBLE-CHECK PROTOCOL.

**⚠️ Production reminder:** Supabase email confirmation is currently **disabled** for beta testing convenience (Auth → Providers → Email → "Confirm email" toggle). Before full production launch, this must be re-enabled at the Supabase Dashboard.

---

## APPENDIX: MODAL OPACITY & BLUR STANDARDS

Modals use a solid dark background so text is fully readable without background bleed-through:
- **Modal panel:** `bg-[var(--bg-modal)]` with `backdrop-blur-xl` (24px), `border-[var(--modal-border)]`
- **Modal backdrop:** `bg-black/70` with `backdrop-blur-[4px]`
- **LiquidCard** (non-modal): `bg-[var(--bg-card)]` with `backdrop-blur-sm`, `border-[var(--card-border)]` — lighter for in-page cards

---

## APPENDIX: PROGRESS UPDATE FUNCTION

After completing each task, update `BUILD_PROGRESS_TRACKER.md`:

1. Add a new sprint/task section with `[x]` status, today's date, **and the new version number**
2. Add relevant notes and details
3. Update the "CURRENT STATUS" section at the top:
   - `**Last Updated:**` — today's date
   - `**Current Version:**` — the new version after this sprint's bump
   - `**Current Phase:**` — current phase/sprint name
   - `**Next Task:**` — the next thing to work on
4. Update summary counts if applicable
5. Commit LOCALLY (not pushed) with a descriptive message that includes the new version

---

*— End of Claude Code Build Instructions —*
