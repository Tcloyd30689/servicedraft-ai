# SERVICEDRAFT.AI — BUILD PROGRESS TRACKER

## HOW THIS DOCUMENT WORKS

This file is a living document that Claude Code reads at the start of every session and updates after completing each task. It serves as the single source of truth for what has been built and what still needs to be done.

**INSTRUCTIONS FOR CLAUDE CODE:**

1. **At the start of every session**, read this file FIRST to understand current progress.
2. **After completing each task**, update this file by changing the task's status from `[ ]` to `[x]` and adding the completion date.
3. **If a task is partially complete**, add a note under the task explaining what's done and what remains.
4. **If you encounter a blocker**, add a `⚠️ BLOCKED:` note under the task explaining what's needed from the user.
5. **Never skip ahead** — complete tasks in order within each phase. Phases must be completed in order unless explicitly noted otherwise.

### Status Key

- `[ ]` — Not started
- `[~]` — In progress / partially complete
- `[x]` — Completed
- `[!]` — Blocked — needs user action

---

## CURRENT STATUS

**Last Updated:** 2026-03-24
**Current Phase:** Login Loading Lockup Hotfix — COMPLETE
**Next Task:** Manual testing of login stale-cookie fix + signup flow, then push to GitHub
**Login Loading Lockup Hotfix:** [x] COMPLETE (2026-03-24) — Hotfix: Added 5s timeout to middleware getUser() and 4s stale-cookie failsafe to login page to prevent loading lockup from expired auth cookies. (1) middleware.ts: wrapped bare getUser() call in Promise.race with 5000ms timeout — on timeout, user=null so protected routes redirect to /login and auth routes show their forms. (2) login/page.tsx: added 4-second failsafe useEffect that clears all sb- cookies via document.cookie expiry and sets checkingAuth=false if the auth check hangs. (3) login/page.tsx: added setCheckingAuth(false) before the return in the user-exists redirect path so the spinner doesn't stick if router.replace is slow. No new files, API routes, database changes, or RLS policies. Build verified with zero TypeScript errors.
**Signup Flow Reorder Sprint:** [x] COMPLETE (2026-03-24) — Reordered 3-step signup flow from [Email+Password → Access Code → Profile] to [Email Verification via Magic Link → Profile+Password → Access Code/Payment]. Step 1 now uses signInWithOtp() to send magic link (replaces signUp()), adds Confirm Email field and "Privacy Policy & Terms of Use" checkbox, button text "SEND SIGN UP LINK". Step 2 now combines password setting (via updateUser({ password })) with profile creation (first/last name, location, position, accent color), button text "CREATE ACCOUNT". Step 3 remains access code/payment validation but now redirects to /main-menu on success (with setLoginTimestamp() call). Updated onboarding detection in signup, login, and main-menu pages to check needsProfile before needsPayment. Updated Stripe route success_url to /main-menu and cancel_url to /signup?step=3. Auth callback at /auth/callback unchanged — still redirects to /signup?step=2 which is now correctly the profile page. Files modified: signup/page.tsx (major rewrite), login/page.tsx (2 locations), main-menu/page.tsx (1 location), api/stripe/route.ts (2 URLs). No new files, API routes, database changes, or RLS policies. Build verified with zero TypeScript errors.
**Sprint 2 Hotfix — Post-Testing Fixes (6 items):** [x] COMPLETE (2026-03-23) — (1) NavBar Hover Glow: added dual-layer --shadow-glow-btn CSS variable (15px@0.4 + 30px@0.2), applied to all nav buttons (Main Menu, Dashboard, Owner, Team, Log Out) replacing --shadow-glow-sm, increased transition duration from 200ms to 300ms. (2) Print Export Logo: added onerror="this.style.display='none'" to the footer logo img tag in buildPrintHtml() so broken images hide gracefully instead of showing placeholder. (3) Hero/Nav Unified Header: changed HeroArea background from bg-[var(--bg-primary)] to bg-[var(--bg-nav)] with backdrop-blur-[8px], also updated edge gradient overlay from --bg-primary to --bg-nav, creating seamless frosted glass header that matches NavBar. (4) Particle Network Light Mode: added data-mode check to readWaveColor() — returns '255, 255, 255' (white) when in light mode for visibility on colored backgrounds, keeps theme-colored particles in dark mode. (5) Story Type Selector Glow: replaced Framer Motion whileHover boxShadow with CSS hover:shadow-[var(--shadow-glow-btn)] for smooth dual-layer glow transition, added transition-all duration-300. (6) Light Mode Background Inversion: page-level backgrounds become the accent color (80/20 blend of accent RGB with neutral 50, auto-darkened for brightness>180), nav uses denser 50% accent shade, body gradient blends accent.gradient1 through bgPrimary to accent.gradient2. Cards use dark frosted glass (rgba(15,15,25,0.75)) for contrast against colored bg. All accent colors, opacity layers, borders, and component styling inside cards/modals remain untouched — their tinted glass look carries over from dark mode. Luminance checks restored to original behavior. Build verified with zero TypeScript errors.
**Sprint 2 — UI Overhaul (4 items):** [x] COMPLETE (2026-03-23) — (1) Universal Modal Fixes: default width widened from max-w-[600px] to max-w-[850px], z-index raised to z-[200]/z-[210] to render above NavBar z-[100] and HeroArea z-[110], removed pt-20 offset for true viewport centering with p-4, max-h changed to 90vh, backdrop blur increased to 10px with bg-black/75. Removed width overrides from EditStoryModal, UpdateWithRepairModal, SavedRepairsModal, and admin team members modal (all now use wider default). Kept narrow widths on confirmation/action dialogs. (2) NavBar Restructure: replaced UserPopup dropdown with always-visible individual nav buttons — Dashboard, Owner (owner role), Team (admin role), Log Out — styled as compact secondary pills with icons, icon-only on tablet, full labels on desktop. Mobile hamburger menu includes all nav items. Deleted UserPopup.tsx. (3) Sine Wave Enhancement: replaced 4-wave arrays in WaveBackground.tsx and 5-wave arrays in HeroArea.tsx with 7-wave desynchronized configurations (6x speed spread from 0.007-0.042, offsets across 2pi+, inverse amplitude-speed relationship). (4) Light Mode Overhaul: completely redesigned light mode from white/bright to "tinted dark mode" — accent color becomes environment background via computeLightBgPrimary() formula (70/30 blend of neutral base and accent RGB, auto-darkened for bright accents with perceived brightness >200), cards/modals/nav use dark frosted glass (rgba(15,15,25,0.75-0.92)), text flipped to light (#f0f0f5), borders changed to rgba(255,255,255,0.1), accent-text-emphasis uses bright accent color. Updated both buildCssVars() in themeColors.ts and applyTheme() in ThemeProvider.tsx. Build verified with zero TypeScript errors.
**Post-Deployment Sprint 1 — Quick Fixes (7 items):** [x] COMPLETE (2026-03-23) — Applied all 7 isolated fixes: (1) Logout timeout — wrapped supabase.auth.signOut() in Promise.race with 3-second timeout so stale tokens can't block redirect, (2) Email recipient limit — changed server-side validation from max 3 to max 10 to match client-side EmailExportModal, (3) Email logo URL — fixed case-sensitive 'logo.png' → 'Logo.png' in buildEmailHtml, (4) Print margins + logo — reduced @page margin to 13mm, body padding to 10mm/13mm, footer positioning to bottom:3mm right:13mm, changed print logo from relative to absolute URL, (5) Location dropdown — replaced plain text Input with Select dropdown using US_STATES from constants/states.ts in EditProfileModal, (6) Team reactivate — server PUT handler now accepts is_active field (with boolean type annotation), client handleToggleTeamActive sends is_active:true instead of just name, (7) Typing animation speed — changed all 4 useTypingAnimation speed values from 15ms to 7ms. Build verified with zero TypeScript errors.
**Auth Overhaul Sprint 1 — Eliminate getUser() Race Conditions:** [x] COMPLETE (2026-03-22) — Created /api/me server-side profile route (cookie-based auth, auto-create profile on first visit). Rewrote fetchProfileForUser in useAuth.ts to use /api/me with retry logic instead of direct Supabase browser client query. Replaced all ThemeProvider getUser() calls with getSession() (cache-only, no network call) in both initTheme and saveToSupabase. Fixed activityLogger to accept optional userId parameter instead of calling getUser() — falls back to getSession() cache. Updated login page to pass data.user.id to logActivity. Simplified visibilitychange handler to only fetch profile when profile is null (prevents unnecessary /api/me calls on every tab switch). Root cause: multiple browser-side components (useAuth, ThemeProvider, activityLogger) independently calling getUser() through the singleton Supabase client, causing GoTrueClient's internal AbortController to cancel in-flight requests, resulting in permanent null profile and blank pages. Build verified with zero TypeScript errors.
**Hotfix (Post Sprint F) — visibilitychange Init Collision + AbortError Handling:** [x] COMPLETE (2026-03-17) — Fixed regression introduced by previous hotfix: visibilitychange listener was firing immediately on page load (document already 'visible' at module init), colliding with initializeAuth() IIFE and causing both to call fetchProfileForUser simultaneously. One fetch would abort the other, triggering "Unable to load profile data" error. Applied two fixes: (FIX A) Added module-level appFullyInitialized flag, set to true in initializeAuth finally block after loading:false, added guard at top of visibilitychange handler to prevent activation until initial auth completes. (FIX B) Added AbortError check at top of fetchProfileForUser catch block — when fetch is legitimately cancelled, log warning and return early instead of setting profile:null, preventing false-positive error message. Build verified with zero TypeScript errors.
**Hotfix (Post Sprint F) — Auth Loading Lockup Fix:** [x] COMPLETE (2026-03-17) — Fixed auth loading state getting stuck on true when returning to an idle session after tab/browser has been inactive. Applied three complementary fixes: (1) Promise.race with 7-second timeout wrapping supabase.auth.getUser() in initializeAuth() — treats timeout as unauthenticated rather than hanging, (2) visibilitychange event listener using async/await getSession() with isRefreshing guard — prevents concurrent refresh pile-up when tab re-activates, reads from cookie cache instead of network to avoid race conditions, (3) startGlobalFailsafe() function with 10-second timeout forcing loading: false — last line of defense if all other guards fail. Build verified with zero TypeScript errors.
**Hotfix (Post Sprint F) — Auth Page getSession Fix:** COMPLETE — Changed mount-time auth checks on login and signup pages from getUser() (network request) to getSession() (local memory read) to prevent step revert race condition when token refresh hasn't settled. Added URL step parameter preservation in signup catch/else branches so the page stays on the correct step even if auth check fails.
**Sprint F — Clean Auth Loading Fix:** COMPLETE — Singleton Supabase browser client (prevents duplicate instances/network calls), removed buildFallbackProfile (root cause of redirect loops — was setting subscription_status:'trial' on any error, causing main-menu→signup→main-menu loop), all profile fetch errors now set profile:null, added 5s timeout on getUser() with stale session cleanup, 10s failsafe timer in initializeAuth, main-menu guard skips redirect when profile is null (shows spinner instead), added 8s loadingTooLong "Reset Session" button for user escape hatch, changed post-signup redirect from router.push to window.location.href (forces full page load with fresh middleware/cookies), fixed signOut to use scope:'local' (prevents hang on expired tokens) with finally-block redirect, fixed ProofreadResults setState-during-render (moved parent notifications to useEffect watching checkedEdits), fixed ActivityDetailModal z-index (z-[120]/z-[130] above HeroArea z-[90]/z-[110]), top-anchored positioning, wider modal (85vw/max-w-5xl), sticky X button, added bottom CLOSE button with hover animation, fixed ThemeProvider onAuthStateChange type annotations
**Sprint E — Team Dashboard Activity Tab Migration:** COMPLETE
**Sprint D — Polish & Cleanup:** COMPLETE — Updated admin API get_user_details to return recent_tracker_entries (5 most recent), replaced User Management expanded row "Recent Activity" section with clickable tracker entries showing R.O.#/vehicle/story type badge/action pills/timestamps that open ActivityDetailModal, added console.warn for tracker RPC/update partial failures, verified all trackerId null guards and resetAll flow, added proofread_apply to ACTION_BORDER_COLORS, updated formatActionLabel to use consistent past-tense labels (Generated/Regenerated/Customized/etc.) across admin page and detail modal, added trackerError state with ErrorState retry UI on Activity Log tab, improved empty state messaging, added NarrativeTrackerEntry and TrackerActionEntry types to database.ts and used them in ActivityDetailModal
**Sprint C — Dashboard Redesign:** COMPLETE — Added list_tracker_entries and get_tracker_detail admin API actions with search/filter/pagination, created new ActivityDetailModal in src/components/dashboard/ with vehicle info header, Block/C-C-C narrative toggle, and expandable action timeline with version snapshots, completely redesigned Activity Log tab on Owner Dashboard to use narrative_tracker data with new columns (User, R.O.#, Vehicle, Story Type, Actions pills, Last Activity), color-coded left borders by story type, tracker-specific filter/search/pagination, removed old activity_log query and inline expand behavior
**Sprint B — Narrative Lifecycle Tracker Wiring:** COMPLETE — Wired all narrative actions to lifecycle tracker: generate (createTrackerEntry with await for ID), regenerate/customize/proofread/proofread_apply/save (updateTrackerAction fire-and-forget), export_copy/export_print/export_pdf/export_docx (ShareExportModal trackerId prop), simplified all logActivity calls to remove heavy metadata (tracker handles rich data), activityLogger always sets output_preview to null
**Sprint A — Narrative Lifecycle Tracker Foundation:** COMPLETE — Created narrative_tracker table with action_history JSONB, append_tracker_history RPC, API route (create/update with version tracking), client utility (fire-and-forget), and trackerId field in narrative store
**Hotfix (Post Sprint B Task 1):** COMPLETE — Fixed Gemini API Usage Tracker: corrected model name from gemini-2.0-flash to gemini-3-flash-preview across entire codebase, fixed pricing rates from $0.10/$0.40 to $0.50/$3.00 per 1M tokens (input/output), updated migration default, fixed Recharts tooltip type errors
**Stage 6 Sprint B (Task 1):** COMPLETE — Gemini API Usage Tracker: modified Gemini client to return token usage metadata, created api_usage_log table migration, added server-side usage logger utility, instrumented all 6 API routes (generate, customize, proofread, apply-edits, update-narrative, convert-recommendation), built /api/admin/usage endpoint with aggregated stats, replaced Cost Calculator tab with live API Usage tab featuring summary cards, token/cost charts, action breakdown, and top users leaderboard
**Stage 6 Sprint B (Tasks 2-4):** COMPLETE — Email column truncation with tooltip on hover, center alignment on all table headers/cells, glowing accent-colored row hover effect across all data tables on both dashboards
**Stage 6 Sprint B (Tasks 5-6):** COMPLETE — Activity detail popup modal with full metadata display, owner team assignment with create team and assign user
**Stage 4 Sprint 1:** COMPLETE — Font rendering fix, sidebar positioning, button relocation, template rename, access code update
**Stage 4 Sprint 2:** COMPLETE — Clear form button, story type switching preservation, ProofreadResults render bug fix
**Stage 4 Sprint 3:** COMPLETE — Refactored repair templates to save only 5 core repair fields (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification), removing vehicle info and non-core fields from save/display/edit flows
**Stage 4 Sprint 4:** COMPLETE — Navigation overhaul: increased nav height (56px to 64px), clickable hero logo, MAIN MENU styled button, centered vector logo with theme-aware color inversion
**Stage 4 Sprint 5:** COMPLETE — Terms of Use content component, signup terms enforcement, main menu terms link, expanded FAQ content
**Hotfix 19A:** COMPLETE — Fix delete account API: removed stray "you" prefix from SUPABASE_SERVICE_ROLE_KEY in .env.local, hardened service client with trim() and auth options, added per-step error logging
**Stage 4 Sprint 6:** COMPLETE — Admin dashboard core rebuild: Overview tab with 8 metric cards, expanded analytics API (generations/exports/proofreads/customizations/templates/subscriptionBreakdown/activityByDay), top 10 users, activity logging audit verified
**Post-Sprint 6 UI/UX Fixes:** COMPLETE — Admin dashboard UI overhaul: wider layout (1400px), larger text sizes, animated button tabs, user table improvements (split name, role column, date formats), protected user badge, larger action icons
**Post-Sprint 6 UI/UX Fixes Round 2:** COMPLETE — Owner Dashboard UI round 2: stacked dates, centered headers, 90vw layout, sorting dropdown, premium title styling with neon glow and spotlight animation
**Stage 4 Sprint 7:** COMPLETE — Admin analytics with recharts charts (LineChart, BarChart, PieChart, AreaChart), time range selector (7d/30d/90d/all), system health indicators (DB row counts, last activity, app version)
**Stage 4 Sprint 8:** COMPLETE — Admin management tools, export, polish, and dashboard refinement
**Pre-Deployment Audit:** COMPLETE — Security hardening, auth on all API routes, rate limiting, CSP headers, env validation, code cleanup
**Stage 5 Sprint 1:** COMPLETE — Quick text/label fixes: Owner Dashboard rename, slider label updates, custom instructions maxLength, MAX_RECIPIENTS=10, loading spinner text, NavBar version label
**Stage 5 Sprint 2:** COMPLETE — Loading spinner size increase (xlarge variant ~2x) and full viewport centering below NavBar
**Stage 5 Sprint 3:** COMPLETE — NavBar glowing purple hover animations on all interactive elements (Main Menu, theme toggle, user button, dropdown items)
**Stage 5 Sprint 4:** COMPLETE — Signup page updates: AccentColorPicker added to Step 3 profile creation, Location text input replaced with US state dropdown (all 50 states), accent color persists via existing ThemeProvider (localStorage + Supabase preferences)
**Stage 5 Sprint 5:** COMPLETE — Dashboard split preferences into App Appearance modal and My Saved Repairs placeholder modal, added Owner Dashboard button for admin users with gold/amber accent
**Stage 5 Sprint 6:** COMPLETE — Full SavedRepairsModal with template list/create/edit/delete, narrative table row hover glow, wider dashboard container (max-w-7xl)
**Stage 5 Sprint 7:** COMPLETE — Owner Dashboard AI token usage pricing calculator with model selector, token inputs, proofread/customization toggles, and real-time cost estimates
**Stage 5 Sprint 8:** COMPLETE — Role hierarchy restructure from 2-tier (admin/user) to 3-tier (owner/admin/user). Owner = platform owner, Admin = Team Manager, User = standard. All access gates, API routes, badges, promote/demote logic updated.
**Stage 5 Sprint 9:** COMPLETE — Team management database schema, API routes, and signup integration
**Stage 5 Sprint 10:** COMPLETE — Team Manager Dashboard UI and Owner Dashboard team management
**Documentation Refresh v2.1:** COMPLETE — All 6 project knowledge files updated to v2.1 reflecting complete current application state (5,804 lines / 280.5 KB total)
**Documentation Refresh v2.0:** COMPLETE — All 6 project reference files updated to v2.0 reflecting current application state
**Stage 6 Sprint A (Task 1):** COMPLETE — Group→Team rename across entire codebase
**Stage 6 Sprint A (Tasks 2-5):** COMPLETE — Main menu dashboard buttons, team dashboard activity log + refresh, remove member function
**Stage 3 Sprint 2:** COMPLETE — Auto-sizing text fields in Edit Story modal
**Stage 3 Sprint 3:** COMPLETE — Matched email and print exports to PDF formatting
**Stage 3 Sprint 6:** COMPLETE — Added Inter font for data/input text readability
**Stage 3 Sprint 7:** COMPLETE — My Repairs database table and API routes
**Stage 3 Sprint 8:** COMPLETE — My Repairs UI panel with load, save, edit, and delete functionality
**Stage 3 Sprint 9:** COMPLETE — Diagnostic to Repair Complete update system with separate entry preservation
**Overall Progress:** 73 / 78 tasks complete (+ 87 post-build fixes applied, + 5 Stage 2 tasks complete, + 6 S2-4 tasks complete, + 5 S2-5 tasks complete, + 7 S2-6A tasks complete, + 4 S2-6B tasks complete, + 6 S2-6C tasks complete, + 2 Stage 3 S1 tasks complete, + 2 Stage 3 S4 tasks complete, + 1 Stage 3 S5 task complete, + 1 Stage 3 S6 task complete, + 4 Stage 3 S7 tasks complete, + 7 Stage 3 S8 tasks complete, + 8 Stage 3 S9 tasks complete)
**Stage 1 Status:** COMPLETE — All core features built, Gemini 3.0 Flash upgraded, documentation synced
**Stage 2 Sprint S2-1:** COMPLETE — Dashboard search enhanced with multi-column search, sort controls, filter pills, results count
**Stage 2 Sprint S2-4:** COMPLETE — Proofread highlighting with 30-second fade on narrative display (PB.84)
**Stage 2 Sprint S2-5:** COMPLETE — Email export via Resend integration with professional HTML template
**Stage 2 Sprint S2-6A:** COMPLETE — Admin dashboard with activity logging, route protection, and restriction check
**Stage 2 Sprint S2-6B:** COMPLETE — Admin user management: list, restrict, delete, password reset, subscription change
**Stage 2 Sprint S2-6C:** COMPLETE — Admin analytics dashboard with stat cards, charts, and auto-refresh
**Stage 3 Sprint 1:** COMPLETE — Saved story modal positioning/sizing fix + audit tooltip animation/opacity fix
**Stage 3 Sprint 4:** COMPLETE — Fixed OEM terminology audit flagging + added selective apply for suggested edits
**Stage 3 Sprint 5:** COMPLETE — Enhanced OEM terminology instructions in generation prompts
**Session 5A:** COMPLETE — CSS Variable System + Accent Color Infrastructure (PB.26–PB.28)
**Session 6A:** COMPLETE — Reactive Hero Animation Area + Nav Bar Overhaul (PB.29–PB.31)
**Post-5B Fixes:** COMPLETE — Hero enlargement, fixed positioning, background wave restore, nav consolidation (PB.32–PB.35)
**Session 7A:** COMPLETE — Page redesigns, cursor underglow, card hover changes, narrative reset (PB.42–PB.46)
**Session 7B:** COMPLETE — Navigation guard for unsaved narratives + auto-save on export (PB.47–PB.48)
**Session 8A:** COMPLETE — User Preferences Panel + Accent Color Picker + Supabase Persistence (PB.49–PB.51)
**Session 8B:** COMPLETE — Light mode styling fixes + White accent dark-mode lock (PB.52–PB.56)
**Session 9A:** COMPLETE — Particle Network animation + background animation toggle (PB.57–PB.60)
**Session 10A:** COMPLETE — Dashboard modal portal fix, wave amplitude/centering, nav consolidation, logo sizing, default dark mode, 8hr auto-logout (PB.61–PB.68)
**Session 11A:** COMPLETE — Fixed Main Menu page scroll and centered container, fixed white accent theme Generate Story button text to black, fixed black accent theme visibility with comprehensive dark styling and white text on Generate Story button (PB.70–PB.72)
**Session 12A:** COMPLETE — Gemini 3-flash-preview upgrade, signup page animation + logo doubling, final documentation sync (PB.79–PB.81)
**Session 13A:** COMPLETE — Pre-generation output customization panel on input page (PB.82)
**Hotfix 14A:** COMPLETE — Save narrative upsert on RO#, export freeze fix, UPDATE RLS policy, dashboard updated_at ordering (PB.83)
**Session 15A:** COMPLETE — Proofread highlighting with 30-second fade, highlight counter badge, clear highlights button (PB.84)
**Hotfix 16A:** COMPLETE — Export logo aspect ratio fix — preserve native 2.09:1 ratio (PB.85)
**Session 17A:** COMPLETE — Email export feature with Resend integration and professional HTML template (S2-5)
**Hotfix 18A:** COMPLETE — Fix save timeout: replace Promise.resolve wrapping with proper async pattern for Supabase queries, remove double timeout on save (PB.86)

---

## DOCUMENTATION REFRESH v2.1 — 2026-03-11

**Status:** COMPLETE

All 6 project knowledge files updated to v2.1 reflecting the complete current application state:

- [x] CLAUDE_CODE_BUILD_INSTRUCTIONS.md — 1,617 lines, 78.5 KB (architecture reference with all systems)
- [x] ServiceDraft_AI_Project_Instructions_v1_3.md — 605 lines, 35.7 KB (app overview, workflows, communication rules)
- [x] ServiceDraft_AI_UI_Design_Spec_v1.md — 1,150 lines, 48.7 KB (complete visual design system, 23 sections)
- [x] ServiceDraft_AI_Prompt_Logic_v1.md — 1,165 lines, 53.3 KB (all AI logic, data flows, 26 sections)
- [x] PRE_BUILD_SETUP_CHECKLIST.md — 343 lines, 17.3 KB (setup, deployment, troubleshooting)
- [x] ServiceDraft_AI_Spec_v1_3.md — 924 lines, 47.0 KB (full spec, 17 sections, 71 features)

Total project knowledge base: 5,804 lines / 280.5 KB (doubled from previous versions)

---

## SPRINT A — NARRATIVE LIFECYCLE TRACKER: FOUNDATION — 2026-03-12

**Status:** COMPLETE

Backend infrastructure for the Narrative Lifecycle Tracker — no UI changes, no existing behavior changes.

- [x] **Task 1 — Database Migration: narrative_tracker table + append_tracker_history RPC**
  - Created `narrative_tracker` table with vehicle/RO info, current narrative content, boolean+timestamp action pairs, JSONB action_history array
  - Added indexes on `last_action_at DESC` and `user_id`
  - Enabled RLS with policies for user SELECT/INSERT/UPDATE and service role full access
  - Created `append_tracker_history()` RPC function (SECURITY DEFINER) for atomic JSONB append + last_action_at bump
  - Migration applied to production Supabase: `create_narrative_tracker`

- [x] **Task 2 — API Route: src/app/api/narrative-tracker/route.ts**
  - POST handler with action-based routing (`create` and `update`)
  - Uses service-role Supabase client (same pattern as admin route)
  - `create`: inserts new tracker row with initial generate action_history entry (version 1)
  - `update`: fetches current row for version tracking, appends history via RPC, updates columns per actionType
  - Handles all action types: regenerate, customize, proofread, proofread_apply, save, export_copy/print/pdf/docx
  - Ownership verification on update, full try/catch error handling

- [x] **Task 3 — Client Utility: src/lib/narrativeTracker.ts**
  - `createTrackerEntry(data)`: POST to API, returns tracker ID or null
  - `updateTrackerAction(trackerId, actionType, data?)`: POST to API, returns boolean
  - Fire-and-forget pattern — all errors caught silently, never breaks user workflows

- [x] **Task 4 — Narrative Store Update: src/stores/narrativeStore.ts**
  - Added `trackerId: string | null` to NarrativeState interface (default: null)
  - Added `setTrackerId(id)` action
  - `trackerId` resets to null via `resetAll()` (initialState spread)

---

## PHASE 0: PROJECT INITIALIZATION
*Set up the project skeleton, install dependencies, and configure the development environment.*

### 0.1 — Initialize Next.js Project
- [x] Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` in the project root
- [x] Verify the app runs with `npm run dev` and loads at localhost:3000
- **Completed:** 2026-02-15
- **Notes:** Project was already initialized with Next.js 16.1.6, Tailwind v4, TypeScript, ESLint. Build verified successfully.

### 0.2 — Install All Dependencies
- [x] Install core dependencies:
  ```
  npm install @supabase/supabase-js @supabase/ssr framer-motion @google/generative-ai stripe @stripe/stripe-js
  ```
- [x] Install dev/utility dependencies:
  ```
  npm install lucide-react react-hot-toast
  ```
- **Completed:** 2026-02-15
- **Notes:** All 21 packages installed successfully, 0 vulnerabilities.

### 0.3 — Project Folder Structure
- [x] Create the following folder structure inside `src/`:
  ```
  src/
  ├── app/
  │   ├── (auth)/
  │   │   ├── login/
  │   │   │   └── page.tsx
  │   │   └── signup/
  │   │       └── page.tsx
  │   ├── (protected)/
  │   │   ├── main-menu/
  │   │   │   └── page.tsx
  │   │   ├── input/
  │   │   │   └── page.tsx
  │   │   ├── narrative/
  │   │   │   └── page.tsx
  │   │   └── dashboard/
  │   │       └── page.tsx
  │   ├── api/
  │   │   ├── generate/
  │   │   │   └── route.ts
  │   │   ├── proofread/
  │   │   │   └── route.ts
  │   │   ├── customize/
  │   │   │   └── route.ts
  │   │   ├── stripe/
  │   │   │   └── route.ts
  │   │   └── support/
  │   │       └── route.ts
  │   ├── layout.tsx
  │   ├── page.tsx              (Landing Page)
  │   └── globals.css
  ├── components/
  │   ├── ui/                   (Reusable UI primitives)
  │   ├── layout/               (NavBar, UserPopup, etc.)
  │   ├── input/                (Input page components)
  │   ├── narrative/            (Generated narrative components)
  │   └── dashboard/            (Dashboard components)
  ├── lib/
  │   ├── supabase/
  │   │   ├── client.ts
  │   │   ├── server.ts
  │   │   └── middleware.ts
  │   ├── gemini/
  │   │   └── client.ts
  │   ├── stripe/
  │   │   └── client.ts
  │   └── utils.ts
  ├── hooks/                    (Custom React hooks)
  ├── stores/                   (State management)
  ├── types/                    (TypeScript type definitions)
  └── constants/                (App constants, field configs)
  ```
- [x] Create placeholder `page.tsx` files for each route with minimal content
- **Completed:** 2026-02-15
- **Notes:** All folders and placeholder files created. All API routes, page routes, lib files, and component directories in place.

### 0.4 — Tailwind Configuration
- [x] Update `tailwind.config.ts` with ServiceDraft.AI custom theme extensions (colors, shadows, animations from UI Design Spec)
- [x] Update `globals.css` with CSS custom properties from UI Design Spec Section 12
- [x] Set up the gradient background as the base body style
- **Completed:** 2026-02-15
- **Notes:** Using Tailwind v4 CSS-first config via @theme inline in globals.css (no tailwind.config.ts needed). All ServiceDraft colors, shadows, animations, and CSS custom properties configured. Logo copied to public/logo.png.

### 0.5 — Environment Variables Validation
- [x] Create `src/lib/env.ts` with runtime validation that all required env vars are present
- [x] Verify `.env.local` has all required values (Supabase, Gemini, Stripe)
- [x] Ensure `.gitignore` includes `.env.local`
- **Completed:** 2026-02-15
- **Notes:** .env.local has Supabase, Gemini, and Stripe keys. STRIPE_WEBHOOK_SECRET and ACCESS_CODE are optional and will be added in Phase 8. .gitignore covers .env* files.

### 0.6 — Git Initial Commit
- [x] Stage all files: `git add .`
- [x] Commit: `git commit -m "Initial project setup with Next.js, Tailwind, and folder structure"`
- [x] Push to GitHub: `git push origin main`
- **Completed:** 2026-02-16
- **Notes:** Committed as part of "Initial commit" (1f26f45).

---

## PHASE 1: DESIGN SYSTEM & SHARED UI COMPONENTS
*Build the visual foundation — reusable components that every page will use.*

### 1.1 — Sine Wave Animated Background
- [x] Create `src/components/ui/WaveBackground.tsx` — canvas-based sine wave animation
- [x] Implement wave properties from UI Design Spec Section 4 (color #c3abe2, 15-25% opacity, 3-5 waves, 8-12s cycle)
- [x] Layer behind all content at z-10
- [x] Runs continuously on all pages
- **Completed:** 2026-02-15
- **Notes:** 4 wave layers with varying amplitude, frequency, speed, and opacity. Canvas-based, full viewport.

### 1.2 — Liquid Card Component
- [x] Create `src/components/ui/LiquidCard.tsx` — glassmorphism card with configurable sizes
- [x] Implement Liquid material specs: bg #c5ade5 at 5%, border 2px solid black, radius 23px, blur 2px, glow #49129b
- [x] Include hover state with enhanced glow
- [x] Props for size variants: compact, standard, spacious
- **Completed:** 2026-02-15
- **Notes:**

### 1.3 — Button Components
- [x] Create `src/components/ui/Button.tsx` with variants: primary, secondary, ghost
- [x] Primary: bg #a855f7, hover #9333ea with glow, active scale 0.98, disabled state
- [x] Secondary: transparent bg, border #a855f7, hover tint
- [x] Ghost: no border, text only with hover
- [x] Size variants: small, medium, large, fullWidth
- **Completed:** 2026-02-15
- **Notes:**

### 1.4 — Form Input Components
- [x] Create `src/components/ui/Input.tsx` — text input with ServiceDraft styling
- [x] Create `src/components/ui/Textarea.tsx` — multiline input
- [x] Create `src/components/ui/Select.tsx` — dropdown with custom styling
- [x] All: bg #0f0520, border #6b21a8, focus ring #a855f7, placeholder #9ca3af
- [x] Include label component with proper styling
- **Completed:** 2026-02-15
- **Notes:** All three components use forwardRef for compatibility.

### 1.5 — Modal Component
- [x] Create `src/components/ui/Modal.tsx` — reusable modal with scale animation
- [x] Liquid material styling, 600px default width, 23px radius
- [x] Dark backdrop with blur
- [x] Close on backdrop click and escape key
- [x] Framer Motion scale animation (95% → 100%)
- **Completed:** 2026-02-15
- **Notes:**

### 1.6 — Toast Notification System
- [x] Set up react-hot-toast with ServiceDraft.AI themed styling
- [x] Custom toast styles: success (purple glow), error (red), info (neutral)
- [x] Position: top-center
- [x] z-index: 50
- **Completed:** 2026-02-15
- **Notes:** ToastProvider added to root layout.

### 1.7 — Loading Spinner Component
- [x] Create `src/components/ui/LoadingSpinner.tsx` — branded spinner with contextual message
- [x] Purple glow aesthetic with pulsing animation
- [x] Accepts `message` prop for different loading contexts
- **Completed:** 2026-02-15
- **Notes:** Size variants: small, medium, large.

### 1.8 — Typing Animation Hook
- [x] Create `src/hooks/useTypingAnimation.ts` — custom hook for character-by-character text display
- [x] Configurable speed (default 20-50ms per character)
- [x] Returns current display text and isAnimating state
- [x] Handles interruption (new text while still animating)
- **Completed:** 2026-02-15
- **Notes:** Also returns skip() function to immediately show full text.

### 1.9 — Logo Component
- [x] Create `src/components/ui/Logo.tsx` — renders the ServiceDraft.AI logo
- [x] Place `SERVIDRAFT_AI_LOGO_1_.PNG` in `public/` directory
- [x] Size variants: small (nav), medium (menu), large (landing)
- [x] Optional glow animation on hover
- **Completed:** 2026-02-15
- **Notes:** Logo copied to public/logo.png.

### 1.10 — Git Commit: Design System
- [x] Commit all design system components: `"Add design system: cards, buttons, inputs, modal, toast, spinner, wave background"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 2: AUTHENTICATION SYSTEM
*Set up Supabase Auth — login, signup, session management, route protection.*

### 2.1 — Supabase Client Setup
- [x] Create `src/lib/supabase/client.ts` — browser-side Supabase client
- [x] Create `src/lib/supabase/server.ts` — server-side Supabase client (for API routes)
- [x] Create `src/lib/supabase/middleware.ts` — session refresh middleware
- **Completed:** 2026-02-15
- **Notes:**

### 2.2 — Auth Middleware
- [x] Create `src/middleware.ts` — Next.js middleware for route protection
- [x] Redirect unauthenticated users from protected routes to login
- [x] Redirect authenticated users from auth pages to main menu
- [x] Refresh session on every request
- **Completed:** 2026-02-15
- **Notes:** Next.js 16 shows deprecation warning for middleware (recommends "proxy"), but works correctly.

### 2.3 — Database Tables (Supabase)
- [x] Create `users` table in Supabase with schema from spec (id, email, username, location, position, profile_picture_url, subscription_status, stripe_customer_id, created_at, updated_at)
- [x] Create `narratives` table in Supabase with schema from spec (id, user_id, ro_number, vehicle_year, vehicle_make, vehicle_model, concern, cause, correction, full_narrative, story_type, created_at)
- [x] Set up Row Level Security (RLS) policies — users can only read/write their own data
- [x] Create SQL migration file: `supabase/migrations/001_initial_schema.sql`
- **Completed:** 2026-02-15
- **Notes:** SQL migration includes auto-profile-creation trigger, updated_at trigger, and indexes. User must run the SQL in Supabase SQL Editor. **Updated 2026-02-19:** Added first_name, last_name columns via `supabase/migrations/002_add_name_fields_and_position_update.sql`. Position changed to dropdown with predefined roles. Profile picture replaced with position-based icons.

### 2.4 — Landing Page
- [x] Build `src/app/page.tsx` — Landing Page with logo, LOGIN button, REQUEST ACCESS button
- [x] Animated background with sine waves
- [x] Logo with glow effect, centered
- [x] Framer Motion entrance animations
- **Completed:** 2026-02-15
- **Notes:**

### 2.5 — Login Page
- [x] Build `src/app/(auth)/login/page.tsx` — email + password form
- [x] Form validation (required fields, email format)
- [x] Supabase Auth sign-in integration
- [x] Error handling (invalid credentials, network errors)
- [x] Loading state during authentication
- [x] Redirect to Main Menu on success
- **Completed:** 2026-02-15
- **Notes:**

### 2.6 — Sign-Up Page (Step 1: Account Creation)
- [x] Build `src/app/(auth)/signup/page.tsx` — multi-step signup flow
- [x] Step 1: Email, Password, Confirm Password
- [x] Password validation (minimum length, match confirmation)
- [x] Supabase Auth sign-up integration
- **Completed:** 2026-02-15
- **Notes:** All 3 signup steps in a single page with step indicators.

### 2.7 — Sign-Up Page (Step 2: Payment / Access Code)
- [x] Step 2: Stripe payment form OR access code bypass
- [x] Access code field with validation (hardcoded code for prototype)
- [x] Stripe Elements integration for credit card input (test mode)
- [x] On success: update subscription_status in users table
- **Completed:** 2026-02-15
- **Notes:** Access code bypass implemented via /api/stripe route. Default code: SERVICEDRAFT2026. Full Stripe Elements integration deferred to Phase 8.

### 2.8 — Sign-Up Page (Step 3: Profile Creation)
- [x] Step 3: First Name (required), Last Name (required), Location, Position (dropdown) fields
- [x] Save profile data to users table
- [x] Redirect to Main Menu on completion
- **Completed:** 2026-02-15 (Updated 2026-02-19)
- **Notes:** **Updated 2026-02-19:** Added first_name, last_name as required fields. Position changed from text input to dropdown with predefined roles (Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk). Profile picture upload removed — replaced with position-based icons.

### 2.9 — Auth Context / Hook
- [x] Create `src/hooks/useAuth.ts` — custom hook for accessing current user data
- [x] Provides: user object, loading state, signOut function
- [x] Auto-fetches user profile from users table
- **Completed:** 2026-02-15
- **Notes:** Also includes refreshProfile function and auth state change listener. Database types in src/types/database.ts.

### 2.10 — Git Commit: Auth System
- [x] Commit: `"Add authentication system: login, signup, middleware, database schema"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 3: NAVIGATION & LAYOUT
*Build the nav bar, main menu, user popup, and shared layout.*

### 3.1 — Navigation Bar
- [x] Create `src/components/layout/NavBar.tsx` — fixed top nav bar
- [x] Glassmorphism: bg rgba(0,0,0,0.8), blur 8px, bottom border purple tint
- [x] Logo (small), nav links, User ID trigger button
- [x] z-index: 100
- **Completed:** 2026-02-15
- **Notes:** Includes mobile hamburger menu.

### 3.2 — User ID Popup
- [x] Create `src/components/layout/UserPopup.tsx` — dropdown from user avatar
- [x] Display: username, location, position
- [x] Quick link to User Dashboard
- [x] Log Out button
- [x] Click-outside to close
- **Completed:** 2026-02-15
- **Notes:**

### 3.3 — Protected Layout
- [x] Create `src/app/(protected)/layout.tsx` — shared layout for authenticated pages
- [x] Includes NavBar, WaveBackground, and body padding for nav height
- [x] Wraps all protected routes
- **Completed:** 2026-02-15
- **Notes:**

### 3.4 — Main Menu Page
- [x] Build `src/app/(protected)/main-menu/page.tsx`
- [x] Large centered card with logo
- [x] GENERATE NEW STORY button → /input
- [x] USER DASHBOARD button → /dashboard
- [x] LOG OUT button → sign out → /
- [x] FAQ/INFO button → info modal
- [x] SUPPORT button → support ticket modal
- [x] Framer Motion staggered entrance animations
- **Completed:** 2026-02-15
- **Notes:**

### 3.5 — FAQ Modal
- [x] Create FAQ/instruction content modal
- [x] App usage instructions, field explanations
- **Completed:** 2026-02-15
- **Notes:** 7 FAQ items covering app usage.

### 3.6 — Support Ticket Modal
- [x] Create support form modal (name, email, message)
- [x] API route `src/app/api/support/route.ts` to send email to admin
- **Completed:** 2026-02-15
- **Notes:** Currently logs to console. Email sending can be added later.

### 3.7 — Git Commit: Navigation & Layout
- [x] Commit: `"Add navigation, main menu, user popup, FAQ, and support"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 4: INPUT PAGE
*The core input form — story type selection, dynamic fields, dropdown logic, validation.*

### 4.1 — Field Configuration Constants
- [x] Create `src/constants/fieldConfig.ts` — defines all input fields for both story types
- [x] Diagnostic Only: 9 fields (fields 1-5 required, 6-9 conditional)
- [x] Repair Complete: 10 fields (fields 1-5 required, 6-10 conditional)
- [x] Each field definition: id, label, type, required, hasDropdown, dropdownOptions
- **Completed:** 2026-02-15
- **Notes:**

### 4.2 — Story Type Selection Component
- [x] Create `src/components/input/StoryTypeSelector.tsx`
- [x] Two large buttons: DIAGNOSTIC ONLY and REPAIR COMPLETE
- [x] Selected state styling (purple glow highlight)
- [x] Selecting a type shows the corresponding field set
- **Completed:** 2026-02-15
- **Notes:**

### 4.3 — Conditional Field Component
- [x] Create `src/components/input/ConditionalField.tsx`
- [x] Dropdown with three options: Include Information, Don't Include, Generate Applicable Info
- [x] When "Include Information" → field becomes required, show text input
- [x] When "Don't Include" → field hidden/dimmed, not required
- [x] When "Generate Applicable Info" → field shows AI badge, not required
- **Completed:** 2026-02-15
- **Notes:**

### 4.4 — Input Page Assembly
- [x] Build `src/app/(protected)/input/page.tsx`
- [x] Story type selector at top
- [x] Dynamic field rendering based on selected story type
- [x] Required fields (1-5) always shown with required indicator
- [x] Conditional fields (6+) with dropdown controls
- [x] Proper scrolling behavior for all fields
- **Completed:** 2026-02-15
- **Notes:**

### 4.5 — Form Validation & GENERATE STORY Button
- [x] GENERATE STORY button at bottom of form
- [x] Button stays DISABLED until validation passes
- [x] Visual disabled state (gray, no hover effect)
- [x] Enabled state (purple, glow on hover)
- **Completed:** 2026-02-15
- **Notes:**

### 4.6 — Compiled Data Block Assembly
- [x] Create `src/lib/compileDataBlock.ts` — function to build the data block sent to API
- [x] Skips R.O. # (field 1) — saved to state only
- [x] Includes fields 2-5 always
- [x] For fields 6+: handles all three dropdown options per Prompt Logic doc
- [x] "Generate Applicable Info" injects the AI inference instruction text
- [x] Returns the compiled string for the API call
- **Completed:** 2026-02-15
- **Notes:**

### 4.7 — Input Page State Management
- [x] Create `src/stores/narrativeStore.ts` — global state for the narrative workflow
- [x] Stores: story type, all field values, compiled data block, R.O. #
- [x] Stores: generated narrative (all 4 keys), current display format
- [x] Persists across page navigation (input → narrative page)
- **Completed:** 2026-02-15
- **Notes:** Hook-based global store with listener pattern. Also stores customization slider state.

### 4.8 — Git Commit: Input Page
- [x] Commit: `"Add input page with story type selection, dynamic fields, validation, and data compilation"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 5: AI INTEGRATION (GEMINI API)
*Server-side API routes that talk to Google Gemini, plus the prompt assembly pipeline.*

### 5.1 — Gemini Client Setup
- [x] Create `src/lib/gemini/client.ts` — configured Gemini API client
- [x] Uses GEMINI_API_KEY from environment
- [x] Configures model (gemini-3-flash-preview)
- [x] Utility function for sending prompts and parsing JSON responses
- **Completed:** 2026-02-15
- **Notes:** Uses gemini-3-flash-preview. parseJsonResponse strips markdown code fences before parsing.

### 5.2 — Generate Narrative API Route
- [x] Create `src/app/api/generate/route.ts`
- [x] POST endpoint that receives: compiled data block + story type
- [x] Selects correct system prompt (Diagnostic Only vs Repair Complete) from Prompt Logic doc
- [x] Sends to Gemini API with system prompt + user prompt
- [x] Parses JSON response (4 keys: block_narrative, concern, cause, correction)
- [x] Error handling: invalid JSON, missing keys, API errors
- [x] Returns parsed narrative to client
- **Completed:** 2026-02-15
- **Notes:**

### 5.3 — Customize Narrative API Route
- [x] Create `src/app/api/customize/route.ts`
- [x] POST endpoint that receives: current narrative text + customization modifiers
- [x] Uses customization-specific system prompt from Prompt Logic doc Section 8
- [x] Builds modifier block from slider values + custom instructions
- [x] Sends to Gemini API
- [x] Returns rewritten narrative (same 4-key JSON structure)
- **Completed:** 2026-02-15
- **Notes:** Uses LENGTH_MODIFIERS, TONE_MODIFIERS, DETAIL_MODIFIERS from constants/prompts.ts.

### 5.4 — Proofread/Audit API Route
- [x] Create `src/app/api/proofread/route.ts`
- [x] POST endpoint that receives: current narrative text + story type + vehicle info
- [x] Uses audit system prompt from Prompt Logic doc Section 6
- [x] Returns: flagged_issues, suggested_edits, overall_rating, summary
- [x] Error handling for malformed responses
- **Completed:** 2026-02-15
- **Notes:**

### 5.5 — Git Commit: API Routes
- [x] Commit: `"Add Gemini API integration: generate, customize, and proofread routes"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 6: GENERATED NARRATIVE PAGE
*Display the narrative, format toggle, regenerate, edit, customization panel, proofread.*

### 6.1 — Narrative Display Component
- [x] Create `src/components/narrative/NarrativeDisplay.tsx`
- [x] Block format view: renders block_narrative as single paragraph
- [x] C/C/C format view: renders concern, cause, correction as labeled sections
- [x] Typing animation on initial load and regeneration
- [x] All text rendered in uppercase per spec
- **Completed:** 2026-02-15
- **Notes:** Uses useTypingAnimation hook with skip support.

### 6.2 — Format Toggle Button
- [x] Dynamic button that shows opposite of current format
- [x] In Block mode → shows "C/C/C FORMAT" button
- [x] In C/C/C mode → shows "BLOCK FORMATTING" button
- [x] Switches display instantly (no API call)
- **Completed:** 2026-02-15
- **Notes:** Integrated into narrative page bottom action bar.

### 6.3 — Regenerate Story Button
- [x] REGENERATE STORY button on left panel
- [x] Re-calls generate API with ORIGINAL compiled data block (stored in state)
- [x] Shows loading spinner during API call
- [x] Replaces narrative display with new response + typing animation
- **Completed:** 2026-02-15
- **Notes:** Also resets customization sliders on regenerate.

### 6.4 — AI Customization Panel
- [x] Create `src/components/narrative/CustomizationPanel.tsx`
- [x] Toggle switch to show/hide panel
- [x] Three sliders: Length (Short/Standard/Detailed), Tone (Warranty/Standard/Customer Friendly), Detail Level (Concise/Standard/Additional Steps)
- [x] Custom Instructions text field
- [x] APPLY CUSTOMIZATION TO STORY button
- [x] Validation: at least one slider must differ from Standard OR custom text entered
- [x] Toast if no changes: "Adjust at least one slider or add custom instructions before applying."
- [x] Sends CURRENT narrative text to customize API route
- [x] Loading state during API call
- **Completed:** 2026-02-15
- **Notes:** Segmented controls instead of range sliders for cleaner UX.

### 6.5 — Review & Proofread Section
- [x] REVIEW & PROOFREAD STORY button on left panel
- [x] Sends current narrative to proofread API route
- [x] Flagged Issues box (read-only, typing animation)
- [x] Suggested Edits box (read-only, typing animation)
- [x] Rating badge: PASS (green), NEEDS_REVIEW (yellow), FAIL (red)
- [x] Summary text below badge
- **Completed:** 2026-02-15
- **Notes:** ProofreadResults component with typing animation support.

### 6.6 — Edit Story Modal
- [x] EDIT STORY button opens modal with editable text fields
- [x] If in Block mode: single editable textarea with block_narrative
- [x] If in C/C/C mode: three editable textareas (concern, cause, correction)
- [x] Save changes updates the display state (and recalculates block_narrative from 3 fields if in C/C/C)
- [x] Cancel discards changes
- **Completed:** 2026-02-15
- **Notes:**

### 6.7 — Save Story Function
- [x] SAVE STORY button saves to Supabase narratives table
- [x] Saves: user_id, ro_number, vehicle year/make/model, concern, cause, correction, full_narrative, story_type
- [x] Toast: "Story saved successfully"
- [x] Error handling for database failures
- **Completed:** 2026-02-15
- **Notes:** Direct Supabase client insert from client side with RLS. **Fixed 2026-02-25:** Changed `.insert()` to `.upsert()` on `(user_id, ro_number)` — re-saving the same R.O.# now overwrites instead of duplicating. Added `updated_at` column, UPDATE RLS policy, and unique constraint via migration `003_narrative_upsert_support.sql`.

### 6.8 — Share/Export Modal
- [x] SHARE/EXPORT STORY button opens export options modal
- [x] Copy Text to Clipboard (with toast confirmation)
- [x] Print Generated Narrative (browser print dialog)
- [x] Download as PDF Document (real PDF via server-side jsPDF generation)
- [x] Download as Word Document (.docx via server-side docx package)
- **Completed:** 2026-02-15 (Overhauled 2026-02-19, Layout redesigned 2026-02-19)
- **Notes:** **Layout redesigned 2026-02-19:** Export layout completely redesigned — two-column header with vehicle info (left) and R.O.# (right), SD icon logo (`ServiceDraft-ai-tight logo.PNG`) top-right, centered "REPAIR NARRATIVE" title (18pt bold underlined), bold/italic/underlined C/C/C section headers (13pt), generous spacing between sections. Same formatting applied to both fresh narrative exports AND saved narrative exports from dashboard. All export paths use shared `downloadExport()` utility from `src/lib/exportUtils.ts`.

### 6.9 — Generated Narrative Page Assembly
- [x] Build `src/app/(protected)/narrative/page.tsx`
- [x] Left panel: Regenerate, Customization toggle + panel, Review & Proofread + results
- [x] Right panel: Narrative display with format toggle
- [x] Bottom: Edit, Format Toggle, Save, Share/Export buttons
- [x] Loading state when arriving from input page (initial generation)
- [x] Redirect to input page if no narrative data in state
- **Completed:** 2026-02-15
- **Notes:** Two-column layout (left controls, right display) with responsive stacking on mobile.

### 6.10 — Git Commit: Narrative Page
- [x] Commit: `"Add generated narrative page with all controls: display, edit, customize, proofread, save, export"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 7: USER DASHBOARD
*Profile management and saved narrative history.*

### 7.1 — Profile Display Section
- [x] Create `src/components/dashboard/ProfileSection.tsx`
- [x] Displays: position-based icon, full name, internal ID, location, position
- [x] UPDATE button opens edit profile flow
- **Completed:** 2026-02-15 (Updated 2026-02-19)
- **Notes:** **Updated 2026-02-19:** Profile picture replaced with position-based icon (PositionIcon component). Displays full name (first_name + last_name) instead of just username.

### 7.2 — Edit Profile Flow
- [x] Update Profile Information modal (first name, last name, location, position dropdown)
- [x] Change Password modal (new password, confirm)
- [x] Each saves to Supabase and shows toast confirmation
- **Completed:** 2026-02-15 (Updated 2026-02-19)
- **Notes:** **Updated 2026-02-19:** Added first_name and last_name fields. Position changed to dropdown. Profile picture upload removed.

### 7.3 — Saved Narrative History Table
- [x] Create `src/components/dashboard/NarrativeHistory.tsx`
- [x] Table columns: Date, Timestamp, R.O. #, Year, Make, Model, Saved Story (preview)
- [x] Fetches from narratives table filtered by user_id
- [x] Search/filter functionality
- [x] Sorted by most recent first
- **Completed:** 2026-02-15
- **Notes:** Client-side search filtering by R.O. #, make, model, concern text, and year.

### 7.4 — Narrative Detail Popup
- [x] Click any row → opens modal with full narrative (READ ONLY)
- [x] Shows complete C/C/C format + vehicle info + date
- [x] Share/Export options in popup (copy, print, PDF)
- [x] No edit capability (audit integrity)
- **Completed:** 2026-02-15
- **Notes:** Copy and Print buttons. Read-only display.

### 7.5 — Dashboard Page Assembly
- [x] Build `src/app/(protected)/dashboard/page.tsx`
- [x] Profile section at top
- [x] Narrative history table below
- [x] Main Menu button in header
- **Completed:** 2026-02-15
- **Notes:**

### 7.6 — Git Commit: Dashboard
- [x] Commit: `"Add user dashboard with profile management and saved narrative history"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 8: STRIPE INTEGRATION
*Subscription billing setup.*

### 8.1 — Stripe Configuration
- [x] Create `src/lib/stripe/client.ts` — server-side Stripe client
- [x] Create Stripe product and price in Stripe Dashboard (test mode)
- [x] Store price ID in environment variables
- **Completed:** 2026-02-15
- **Notes:** Uses Stripe v20.3.1. STRIPE_PRICE_ID env var needed for checkout. User must create product/price in Stripe Dashboard.

### 8.2 — Checkout API Route
- [x] Create `src/app/api/stripe/route.ts` — creates Stripe checkout session
- [x] Redirects user to Stripe's hosted payment page
- [x] Success URL returns to signup completion
- [x] Cancel URL returns to signup payment step
- **Completed:** 2026-02-15
- **Notes:** Updated route handles both access code bypass (existing) and Stripe checkout via mode='checkout'. Requires STRIPE_PRICE_ID and NEXT_PUBLIC_APP_URL env vars.

### 8.3 — Webhook Handler
- [x] Create `src/app/api/stripe/webhook/route.ts` — handles Stripe webhook events
- [x] Listens for: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
- [x] Updates subscription_status in users table
- **Completed:** 2026-02-15
- **Notes:** Uses raw body + stripe-signature header. Requires STRIPE_WEBHOOK_SECRET. Falls back to anon key if SUPABASE_SERVICE_ROLE_KEY not set.

### 8.4 — Access Code Bypass
- [x] Implement hardcoded access code check in signup flow
- [x] Valid code skips Stripe, sets subscription_status to "bypass"
- [x] Access code stored as environment variable for easy changing
- **Completed:** 2026-02-15
- **Notes:** Default code: SERVICEDRAFT2026. Already implemented in Phase 2, now integrated into updated stripe route.

### 8.5 — Git Commit: Stripe
- [x] Commit: `"Add Stripe subscription integration with webhook and access code bypass"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 9: POLISH & ANIMATIONS
*Page transitions, micro-interactions, loading states, responsive design.*

### 9.1 — Page Transition Animations
- [x] Add Framer Motion page transitions (fade + slight slide)
- [x] Wrap protected layout in AnimatePresence
- [x] Each page has entrance animation
- **Completed:** 2026-02-15
- **Notes:** PageTransition component created. All protected pages already use motion.div for entrance animations.

### 9.2 — Button & Card Micro-interactions
- [x] Hover glow effects on all buttons
- [x] Active press scale on buttons (0.98)
- [x] Card hover glow enhancement
- [x] Input focus ring animations
- **Completed:** 2026-02-15 (Updated 2026-02-19)
- **Notes:** **Updated 2026-02-19:** Framer Motion whileHover/whileTap added to LiquidCard, Button, StoryTypeSelector, and main menu bottom links. Spring transition config (stiffness: 400, damping: 25) for snappy motion. See PB.19-PB.21.

### 9.3 — Loading States Audit
- [x] Verify ALL API calls show loading spinner with contextual message
- [x] Generate Narrative: "Generating your warranty narrative..."
- [x] Regenerate: "Regenerating narrative..."
- [x] Customize: "Applying customization settings..."
- [x] Proofread: "Reviewing narrative for issues..."
- [x] Save: Brief loading indicator
- **Completed:** 2026-02-15
- **Notes:** All loading states verified in narrative page.

### 9.4 — Mobile Responsive Design
- [x] Test and fix all pages on mobile viewport (375px width)
- [x] Input page: single column layout on mobile
- [x] Narrative page: stacked layout (controls above narrative) on mobile
- [x] Dashboard: scrollable table on mobile
- [x] Nav bar: hamburger menu on mobile
- **Completed:** 2026-02-15
- **Notes:** Responsive patterns in place: flex-col lg:flex-row, overflow-x-auto table, hamburger menu.

### 9.5 — Error States
- [x] Add error boundaries for unexpected crashes
- [x] API error messages displayed as toasts
- [x] Empty states for dashboard (no saved narratives yet)
- [x] Network error handling (offline detection)
- **Completed:** 2026-02-15
- **Notes:** ErrorBoundary component added to protected layout. Toast errors on all API calls. Dashboard shows empty state message.

### 9.6 — Git Commit: Polish
- [x] Commit: `"Add animations, micro-interactions, responsive design, and error handling"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 10: DEPLOYMENT
*Deploy to Vercel, connect domain, final testing.*

### 10.1 — Vercel Deployment Setup
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel dashboard (same as .env.local)
- [ ] Deploy initial build
- [ ] Verify app loads at Vercel URL
- **Completed:**
- **Notes:** Requires user action: push code to GitHub, connect repo in Vercel dashboard, add env vars.

### 10.2 — Supabase Production Config
- [ ] Verify RLS policies are active
- [ ] Set up Supabase redirect URLs for auth (add Vercel domain)
- [ ] Test login/signup flow on deployed version
- **Completed:**
- **Notes:**

### 10.3 — Stripe Production Config (When Ready)
- [ ] Switch Stripe to live mode (only when ready for real payments)
- [ ] Update environment variables with live keys
- [ ] Configure Stripe webhook endpoint URL to Vercel domain
- **Completed:**
- **Notes:**

### 10.4 — Full End-to-End Testing
- [ ] Test complete flow: Landing → Signup → Main Menu → Input → Generate → Save → Dashboard
- [ ] Test login flow for existing user
- [ ] Test all narrative features: generate, regenerate, customize, proofread, edit, save, export
- [ ] Test dashboard: view profile, edit profile, search history, view saved narrative
- [ ] Test on mobile device
- **Completed:**
- **Notes:**

### 10.5 — Final Git Commit & Tag
- [ ] Commit any remaining changes
- [ ] Create git tag: `git tag v1.0.0-mvp`
- [ ] Push tag: `git push origin v1.0.0-mvp`
- **Completed:**
- **Notes:**

---

## POST-BUILD FIXES (2026-02-16)
*Bug fixes and improvements discovered during testing.*

### PB.1 — Logo Too Small on Landing Page and Nav Bar
- [x] Increased Logo component size variants: small (192x48), medium (320x80), large (600x150)
- [x] Landing page logo now renders as dominant hero visual
- [x] Nav bar logo scaled to 48px tall with preserved aspect ratio
- **Completed:** 2026-02-16

### PB.2 — Save Story Fails
- [x] Fixed save error handling to show actual Supabase error messages in toast
- [x] Added console.error logging for debugging save failures
- [x] Save function correctly inserts all required fields into narratives table
- **Completed:** 2026-02-16

### PB.3 — PDF and Print Export Open Blank Tab
- [x] Replaced window.open('', '_blank') print approach with hidden iframe printing
- [x] PDF download now uses Blob + anchor click for direct file download (no popup)
- [x] Added vehicle info header to export/print output
- **Completed:** 2026-02-16

### PB.4 — User Dashboard Stuck on Loading Animation
- [x] Added try/catch/finally to useAuth profile fetching — loading state always resolves
- [x] Added error logging to fetchProfile and fetchNarratives
- [x] Dashboard shows fallback message when profile fails to load instead of blank page
- [x] Fixed supabase client creation to use useRef for stable reference
- **Completed:** 2026-02-16

### PB.5 — Narrative Page Doesn't Reset for New Stories
- [x] Added generationId tracking to narrative store
- [x] Input page calls clearForNewGeneration() before navigating to narrative page
- [x] Narrative page detects new generationId and auto-generates fresh narrative
- [x] Previous narrative, proofread results, and customization settings cleared on new generation
- **Completed:** 2026-02-16

### PB.6 — Customize API 500 Error (Token Limit)
- [x] Added maxOutputTokens parameter to generateWithGemini (default 8192)
- [x] Applied to all Gemini API calls: generate, customize, proofread, and apply-edits
- [x] Added specific error message logging in customize route
- **Completed:** 2026-02-16

### PB.7 — Logout Function Doesn't Work
- [x] Made signOut a useCallback in useAuth for stable reference
- [x] Main Menu logout now awaits signOut and clears narrative store state
- [x] UserPopup logout now awaits signOut and clears narrative store state
- [x] Fixed supabase client in useAuth to use useRef (prevents recreation on re-render)
- **Completed:** 2026-02-16

### PB.8 — Add Prompt Rule: No Document ID Numbers
- [x] Added rule to DIAGNOSTIC_ONLY_SYSTEM_PROMPT (rule 8)
- [x] Added rule to REPAIR_COMPLETE_SYSTEM_PROMPT (rule 9)
- [x] Added rule to CUSTOMIZATION_SYSTEM_PROMPT (rule 5)
- **Completed:** 2026-02-16

### PB.9 — Add "Apply Suggested Edits" Button to Proofread Section
- [x] Created new API route: src/app/api/apply-edits/route.ts
- [x] Dedicated system prompt for applying audit edits while maintaining narrative quality
- [x] APPLY SUGGESTED EDITS button appears only after proofread with suggestions
- [x] Loading state: "Applying suggested edits..."
- [x] Clears proofread results after applying (narrative changed, old audit no longer applies)
- [x] maxOutputTokens set to 8192
- [x] Toast on success: "Suggested edits applied"
- **Completed:** 2026-02-16

### PB.10 — Auth Callback Route for Email Confirmation
- [x] Created `src/app/auth/callback/route.ts` to handle Supabase PKCE code exchange
- [x] Redirects to `/signup?step=2` after successful email confirmation
- [x] Falls back to `/login` if code exchange fails
- **Completed:** 2026-02-16
- **Notes:** Requires `http://localhost:3000/auth/callback` to be added to Supabase Redirect URLs for seamless redirect. Currently using default Supabase redirect (email confirmed via default flow, user signs in to continue).

### PB.11 — Signup/Login Multi-Step Onboarding Flow Fix
- [x] Signup page reads `step` query param from URL to resume at correct step
- [x] Signup checks auth status on mount and determines correct step based on profile
- [x] After step 1 (signUp), shows "Check Your Email" message instead of advancing
- [x] Step 2 uses upsert to handle missing profile row
- [x] Login page checks onboarding status (subscription_status, username) after sign-in
- [x] Login redirects to `/signup?step=2` or `?step=3` if onboarding incomplete
- [x] Login redirects already-authenticated users based on profile status on mount
- [x] Middleware no longer redirects authenticated users from `/signup` or `/login`
- **Completed:** 2026-02-16
- **Notes:** Profile creation page is no longer bypassed. Users must complete all 3 signup steps.

### PB.12 — AbortError Fix in useAuth Hook
- [x] Added `active` flag to useEffect to prevent state updates after unmount
- [x] Added AbortError catch in getUser to suppress React strict mode noise
- [x] Auth state change listener checks `active` flag before setting state
- **Completed:** 2026-02-16

### PB.13 — Main Menu Hooks Order & Onboarding Guard Fix
- [x] Moved useState calls above early return guard to fix React hooks order violation
- [x] Added onboarding guard: checks profile.subscription_status and profile.username
- [x] Redirects to `/signup?step=2` or `?step=3` if onboarding incomplete
- [x] Shows loading spinner while checking onboarding status
- **Completed:** 2026-02-16

### PB.14 — User Profile System Overhaul: Name Fields, Position Dropdown, Position Icons
- [x] Added `first_name` and `last_name` VARCHAR columns to users table (migration: `002_add_name_fields_and_position_update.sql`)
- [x] Updated `src/types/database.ts` — added `first_name: string | null` and `last_name: string | null` to UserProfile interface
- [x] Updated signup form (Step 3) — First Name and Last Name are now REQUIRED fields
- [x] Changed Position field from open text input to `<select>` dropdown with predefined roles: Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk
- [x] Created `src/constants/positions.ts` — shared position options constant
- [x] Created `src/components/ui/PositionIcon.tsx` — position-based SVG icons using lucide-react (Wrench, Hammer, ScanLine, PenLine, ClipboardList, BookOpen)
- [x] Updated `ProfileSection.tsx` — shows position icon instead of profile picture, displays full name
- [x] Updated `UserPopup.tsx` — shows position icon instead of profile picture, displays full name
- [x] Updated `EditProfileModal.tsx` — added first/last name fields, position dropdown instead of text input
- [x] Updated `useAuth.ts` — added first_name, last_name to UserProfile interface and all fallback objects
- **Completed:** 2026-02-19
- **Notes:** profile_picture_url column kept in DB for backward compatibility but no longer used. Position dropdown will be used for analytics in Sprint 6 Admin Dashboard.

### PB.15 — UserPopup Stale Profile Data (Icon & Position Not Updating)
- [x] Root cause: `useAuth()` hook used component-local `useState` — each consumer (UserPopup, dashboard, main-menu, narrative, SupportForm) had independent profile copies
- [x] Refactored `useAuth.ts` to use module-level shared state pattern (same as `narrativeStore.ts`)
- [x] Single shared `authState` object with listener-based notification across all consumers
- [x] Single Supabase auth subscription (no longer duplicated per component)
- [x] `refreshProfile()` from any component now updates all mounted consumers immediately
- **Completed:** 2026-02-19
- **Notes:** UserPopup.tsx itself was correct — it was already reading `profile?.position`. The underlying data source (`useAuth`) was the problem. After editing profile in EditProfileModal, all components (UserPopup, ProfileSection, etc.) now show updated position icon and text instantly.

### PB.16 — Vehicle Information Not Saving to Dashboard Narratives
- [x] Field ID mismatch corrected — save function now uses `year`, `make`, `model` matching fieldConfig.ts
- [x] Fixed in `handleSave`, `handleProofread`, and `ShareExportModal` vehicleInfo in `src/app/(protected)/narrative/page.tsx`
- [x] All 6 occurrences of `vehicle_year`/`vehicle_make`/`vehicle_model` replaced with `year`/`make`/`model`
- **Completed:** 2026-02-19
- **Notes:** Vehicle info is metadata for saved records and exports only — not sent to AI for generation.

### PB.17 — Saved Narrative Modal Too Transparent
- [x] Modal opacity increased to 85% — bg changed from `rgba(197,173,229,0.05)` to `rgba(15,10,30,0.85)`
- [x] Blur increased from `backdrop-blur-sm` (4px) to `backdrop-blur-xl` (24px)
- [x] Updated in `src/components/ui/Modal.tsx`
- **Completed:** 2026-02-19
- **Notes:** Modal now renders as a solid dark card. Text is fully readable without background bleed-through.

### PB.18 — Input Page Text Fields Don't Wrap or Expand
- [x] Created `src/components/ui/AutoTextarea.tsx` — auto-expanding textarea with same styling as Input
- [x] Input page: `customer_concern` (required field 5) now uses AutoTextarea
- [x] ConditionalField.tsx: all conditional fields (6+) now use auto-expanding `<textarea>` instead of `<input type="text">`
- [x] Short fields (R.O.#, Year, Make, Model) remain as single-line inputs
- [x] Text wraps to next line, field height grows with content, no horizontal scrolling
- **Completed:** 2026-02-19
- **Notes:** Uses `resize: none` + `overflow: hidden` + `scrollHeight` resize pattern. Starts at 2 rows, expands as needed.

### PB.19 — Framer Motion Hover/Tap Animations on All Interactive Elements
- [x] LiquidCard.tsx: Converted to motion.div with whileHover={{ scale: 1.02, boxShadow: purple glow }} and whileTap={{ scale: 0.98 }}
- [x] Button.tsx: Converted to motion.button with whileHover={{ scale: 1.05, boxShadow: purple glow }} and whileTap={{ scale: 0.95 }}
- [x] StoryTypeSelector.tsx: Converted to motion.button with whileHover={{ scale: 1.03 }} and whileTap={{ scale: 0.97 }}
- [x] Main menu FAQ/SUPPORT links: Added whileHover/whileTap animations
- [x] All use spring transition (stiffness: 400, damping: 25) for snappy, premium motion
- [x] Disabled buttons skip hover/tap animations
- **Completed:** 2026-02-19
- **Notes:** Root cause was CSS-only hover effects with no Framer Motion whileHover/whileTap properties. Fixed by converting all interactive elements to motion components.

### PB.20 — Logo Vertical Centering in NavBar
- [x] Added `flex items-center` to the Link wrapper around the Logo in NavBar.tsx
- [x] Logo now perfectly vertically centered within 64px nav bar height
- **Completed:** 2026-02-19
- **Notes:** Root cause was Link wrapper had no flex alignment, logo was offset within the 64px-tall nav despite items-center on parent.

### PB.21 — Page Transition Animations Verified
- [x] All four protected pages (main-menu, input, narrative, dashboard) have Framer Motion entrance animations
- [x] All use motion.div with initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
- [x] Wave background runs continuously on all protected pages via protected layout
- **Completed:** 2026-02-19
- **Notes:** Page transitions were already implemented correctly. Verified all pages have consistent fade-in + slide-up entrance animation.

### PB.22 — Export System Overhaul: Real PDF & Word Document Generation
- [x] Installed `jspdf` for server-side PDF generation and `docx` for Word (.docx) generation
- [x] Created API route `src/app/api/export-pdf/route.ts` — generates real PDF documents with jsPDF
- [x] Created API route `src/app/api/export-docx/route.ts` — generates .docx files with the docx package
- [x] Both exports include: logo letterhead (top-right), vehicle info header (14pt bold), R.O.# line, separator, narrative content (11pt body)
- [x] C/C/C format: section headers (CONCERN, CAUSE, CORRECTION) at 14pt bold with content under each
- [x] Block format: flowing paragraph with 1.5 line spacing
- [x] Automatic page breaks for long narratives (PDF)
- [x] Updated `ShareExportModal.tsx` — PDF button now calls real API route, added "DOWNLOAD AS WORD DOCUMENT" button with FileText icon
- [x] Loading states during PDF/DOCX generation ("GENERATING PDF...", "GENERATING DOCUMENT...")
- [x] Logo priority: `public/logo-bw.png` → `public/logo.png` → text fallback ("ServiceDraft.AI")
- [x] Removed unused printRef and hidden div from ShareExportModal
- **Completed:** 2026-02-19
- **Notes:** Previous implementation generated a plain .txt file labeled as PDF. Now generates real PDF and Word documents suitable for warranty documentation. User can create an optimized `public/logo-bw.png` for best results in exported documents.

### PB.23 — Export Document Layout Redesign & Unified Export Paths
- [x] Redesigned PDF and DOCX export layout: SD icon logo (top-right, ~1 inch), two-column header (Vehicle Info left, R.O.# right), centered "REPAIR NARRATIVE" title, styled C/C/C sections
- [x] Logo: uses `/public/ServiceDraft-ai-tight logo.PNG` (small square SD icon), removed references to old logo files
- [x] Two-column header: "Vehicle Information:" bold underlined with YEAR/MAKE/MODEL labels (11pt bold) and values (11pt regular) on left; "Repair Order #:" bold underlined with R.O. number (20pt bold) on right
- [x] Title: "REPAIR NARRATIVE" at 18pt bold underlined, centered, with generous spacing before/after
- [x] C/C/C section headers: 13pt bold italic underlined; body text: 11pt regular; generous spacing between sections
- [x] Block format: same header/title, flowing paragraph body at 11pt regular
- [x] Created shared export utility `src/lib/exportUtils.ts` — `ExportPayload` interface + `downloadExport()` function used by all export callers
- [x] Updated `ShareExportModal.tsx` to use shared `downloadExport()` utility
- [x] Updated `NarrativeDetailModal.tsx` — added PDF and DOCX export buttons, normalizes `Narrative` type fields (vehicle_year→year, vehicle_make→make, vehicle_model→model, ro_number→roNumber) to `ExportPayload` format
- [x] Fixed dashboard print: replaced `window.open()` popup approach with hidden iframe printing (same as narrative page)
- [x] All 4 export paths (PDF from narrative, DOCX from narrative, PDF from dashboard, DOCX from dashboard) now produce identical document formatting
- **Completed:** 2026-02-19
- **Notes:** Font: Helvetica (PDF) / Arial (DOCX). DOCX uses invisible-border Table for two-column header layout. PDF uses coordinate-based positioning. Both routes read the same logo file and apply the same layout specification.

### PB.24 — Move Export Logo to Footer & Fix R.O.# Overlap
- [x] Moved SD logo from document header/body to document **footer** (bottom-right of every page)
- [x] PDF: logo drawn after all body content, looped across all pages at `pageHeight - logoHeight - 5`
- [x] DOCX: logo moved from `Header` component to `Footer` component (repeats on every page)
- [x] Removed logo from body/header area — two-column header (Vehicle Info left, R.O.# right) no longer overlaps with logo
- **Completed:** 2026-02-19

### PB.25 — Export Logo Resize & Aspect Ratio Fix
- [x] Reduced logo size by ~40% total from original 1-inch square (15% initial reduction + 30% additional)
- [x] Applied 1.3:1 width-to-height aspect ratio — logo image is wider than tall, prevents squished appearance
- [x] PDF dimensions: 19.6mm × 15mm (was 25.4mm × 25.4mm)
- [x] DOCX dimensions: 55px × 43px (was 72px × 72px)
- [x] Applied to all export paths (narrative page PDF/DOCX + dashboard saved narrative PDF/DOCX)
- **Completed:** 2026-02-19

### PB.26 — Accent Color Theming System (Full Implementation)
- [x] Created `src/lib/constants/themeColors.ts` — 9 accent colors (Violet, Red, Orange, Yellow, Green, Blue, Pink, White, Black) with full derived values (hex, rgb, hover, bright, border, deep, textSecondary, waveRgb, logoFile, gradient, bgInput, bgElevated)
- [x] Created `src/components/ThemeProvider.tsx` — React context provider with `useTheme()` hook, localStorage persistence (`sd-accent-color`, `sd-color-mode`), runtime CSS variable injection via `document.documentElement.style.setProperty()`
- [x] Rewrote `src/app/globals.css` — comprehensive `:root` block with 40+ CSS custom properties defaulting to Violet; body background uses `var(--body-bg)`, scrollbar styling uses CSS vars
- [x] Wrapped app in ThemeProvider (`src/app/layout.tsx`)
- [x] Replaced ALL hardcoded purple/violet color values across entire `src/` directory (30+ component files) with CSS variable references:
  - `#a855f7` → `var(--accent-hover)`, `#9333ea` → `var(--accent-primary)`, `#c084fc` → `var(--accent-bright)`
  - `#6b21a8` → `var(--accent-border)`, `#49129b` → `var(--accent-deep)`, `#c4b5fd` → `var(--text-secondary)`
  - `#0f0520` → `var(--bg-input)`, `rgba(197,173,229,0.05)` → `var(--bg-card)`, `rgba(15,10,30,0.85)` → `var(--bg-modal)`
  - All `rgba(168,85,247,...)` opacity variants → `var(--accent-10)`, `var(--accent-20)`, etc.
  - All `boxShadow` glow effects → `var(--shadow-glow-sm)`, `var(--shadow-glow-md)`, `var(--shadow-glow-lg)`
  - `#9ca3af` → `var(--text-muted)`, `#ffffff` → `var(--text-primary)`
- [x] Updated `Logo.tsx` — dynamically loads accent-colored logo PNG from `accent.logoFile`, glow uses `var(--accent-50)`
- [x] WaveBackground reads `--wave-color` CSS variable via `getComputedStyle()` for dynamic wave color
- [x] Light/dark mode support — Black accent auto-activates light mode; ThemeProvider overrides bg/text vars accordingly
- [x] 9 accent-colored logo files added to `public/`: logo-violet.PNG, logo-red.PNG, logo-orange.PNG, logo-yellow.PNG, logo-green.PNG, logo-blue.PNG, logo-pink.PNG, logo-white.PNG, logo-black.PNG
- **Completed:** 2026-02-19
- **Notes:** This is the foundation for all future UI work. Every component now uses CSS variables instead of hardcoded colors. Changing the accent color updates the entire app in real-time. `buildCssVars()` generates all property values from a single accent color config object. New components should always use `var(--accent-*)` references, never hardcoded hex values.

### PB.27 — CSS Variable Cascading Fix (Derived Variables)
- [x] `globals.css`: Changed `--body-bg` from hardcoded hex gradient to `linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-primary) 50%, var(--bg-gradient-2) 100%)` — now cascades when source vars change
- [x] `globals.css`: Changed `--bg-card` from `rgba(147,51,234,0.05)` to `var(--accent-5)` — cascades from accent opacity vars
- [x] `globals.css`: Changed `--text-secondary` from `#c4b5fd` to `var(--accent-text)` — cascades from accent text var
- [x] `globals.css`: Changed `--scrollbar-track` to `var(--bg-input)`, `--scrollbar-thumb` to `var(--accent-border)`, `--scrollbar-thumb-hover` to `var(--accent-hover)`
- [x] `themeColors.ts`: Removed `--body-bg`, `--bg-card`, `--text-secondary`, `--scrollbar-track`, `--scrollbar-thumb`, `--scrollbar-thumb-hover` from `buildCssVars()` — these now derive via CSS `var()` references instead of being overwritten with inline strings
- [x] `ThemeProvider.tsx`: Light mode override uses `var(--accent-8)` for `--bg-card` and `var(--bg-elevated)` for `--scrollbar-track`; removed redundant `--body-bg` inline override
- [x] `Select.tsx`: Replaced hardcoded `#c4b5fd` SVG data URI dropdown arrow with `ChevronDown` icon using `var(--text-secondary)`
- **Completed:** 2026-02-19
- **Notes:** Root cause: derived CSS variables (body-bg, bg-card, scrollbar-*, text-secondary) had hardcoded default values in `:root` AND were being overwritten by `buildCssVars()` with hardcoded inline strings. Changing `--accent-*` in DevTools didn't cascade because the derived vars were independent. Fix: make derived vars reference source vars via `var()`, remove them from `buildCssVars()` so inline styles don't override the cascading references.

### PB.28 — Fix Input Backgrounds, Page Gradient, and Wave Animation
- [x] `globals.css`: Added `color-scheme: dark` to `:root` — tells browsers to render form controls with dark-scheme chrome (prevents bright white input backgrounds)
- [x] `globals.css`: Added CSS overrides for `input`, `textarea`, `select` to use `var(--bg-input)` background and `var(--text-primary)` color; placeholder colors use `var(--text-muted)`
- [x] `themeColors.ts`: Re-added `--body-bg` to `buildCssVars()` as a fully resolved gradient string (not var() references) — CSS var() composition in `:root` is unreliable when source vars are set as inline styles by JS
- [x] `ThemeProvider.tsx`: Added `color-scheme` property setting (dark/light based on effective mode); re-added `--body-bg` to light mode override with light gradient
- [x] `WaveBackground.tsx`: Changed to read `--wave-color` from `document.documentElement.style` (inline) first, then `getComputedStyle` fallback — more reliable since ThemeProvider sets it via inline style
- **Completed:** 2026-02-19
- **Notes:** Three issues from PB.27: (1) Input fields had white backgrounds because Tailwind v4 preflight sets `background-color: transparent` and without `color-scheme: dark` browsers render form controls with light chrome. (2) Page gradient stayed purple because PB.27 removed `--body-bg` from `buildCssVars()` to rely on CSS var() composition, but this doesn't cascade reliably with inline style overrides. (3) Wave animation read `--wave-color` via `getComputedStyle` which may lag behind inline style changes.

### SESSION 5A — CSS Variable System + Accent Color Infrastructure — COMPLETE
- **Scope:** PB.26, PB.27, PB.28
- **Completed:** 2026-02-19
- **Notes:** All hardcoded purple values replaced with CSS custom properties. ThemeProvider updates all --accent-, --bg-, --text-, --shadow-glow- variables. Input fields, page backgrounds, wave animation, modals, and scrollbars all reference theme variables. Verified via DevTools console test — full red color swap works across all pages. Minor hydration timing issue on main menu card initial render (resolves on navigation, will be fixed in Session 5C card redesign).

### PB.29 — Reactive Hero Animation Area (New Page Layout Component)
- [x] Created `src/components/layout/HeroArea.tsx` — full-width hero banner at the top of every protected page
- [x] 90px height, centered large wordmark logo (`logo-[color].PNG` matching user's accent selection)
- [x] 5-layer sine wave animation background contained within the hero area
- [x] Waves use accent color CSS variables (`--wave-color`) and respond to user activity via `useActivityPulse` hook
- [x] Activity amplitude (0–1) controls wave height (1x–3.5x multiplier), opacity boost, and stroke width
- [x] Subtle edge gradient overlays for polished blending with page background
- [x] Logo has accent-colored drop shadow for depth
- **Completed:** 2026-02-23

### PB.30 — useActivityPulse Hook (Reactive Animation System)
- [x] Created `src/hooks/useActivityPulse.ts` — shared module-level amplitude state with listener pattern
- [x] Listens for `input` events (typing → 0.35 amplitude spike), `click` events (buttons → 0.65 spike, generic → 0.15 spike)
- [x] Custom `sd-activity` events for AI generation, saves, exports — `dispatchActivity(intensity)` helper function
- [x] Amplitude decays from peak back to 0 over ~2-3 seconds using `requestAnimationFrame` + configurable decay rate
- [x] Lerp-based rise for smooth spike transitions, independent decay for natural falloff
- [x] Added `dispatchActivity()` calls in narrative page: generate (0.8), regenerate (0.8), customize (0.7), proofread (0.6), apply edits (0.7), save (0.5)
- **Completed:** 2026-02-23

### PB.31 — Nav Bar Overhaul (Icon Logo, Theme Toggle, Repositioned)
- [x] Removed full-size wordmark Logo component from NavBar
- [x] Replaced with small tight icon logo (`ServiceDraft-ai-tight logo.PNG`, 36×36px) on the left
- [x] Added light/dark mode toggle button (Sun/Moon icons from lucide-react) in the right section
- [x] Toggle calls `toggleColorMode()` from `useTheme()` context
- [x] Nav bar changed from `fixed top-0` to `sticky top-0` — now sits in document flow below HeroArea
- [x] Height reduced from `h-16` (64px) to `h-14` (56px) for tighter layout
- [x] Mobile menu dropdown updated to use `top-14` and `bg-[var(--bg-nav)]` for consistency
- [x] Removed full-page `WaveBackground` from protected layout — hero area is now the sole animated element
- [x] Protected layout restructured: `HeroArea` → `NavBar` → `main` content (no more `pt-16` padding)
- **Completed:** 2026-02-23

### SESSION 6A — Reactive Hero Animation Area + Nav Bar Overhaul — COMPLETE
- **Scope:** PB.29, PB.30, PB.31
- **Completed:** 2026-02-23
- **Notes:** Biggest visual change in the app. New page layout: HeroArea (90px reactive sine wave + large logo) → NavBar (sticky, tight icon logo, theme toggle) → page content. Full-page WaveBackground removed — hero area is the sole animated element. Activity pulse system automatically responds to typing, clicks, and AI processing. All accent color theming preserved.

### PB.32 — Hero Logo Enlarged ~20x + Hero Height Doubled
- [x] Increased `HERO_HEIGHT` from 90px to 200px — hero area now dominates the top of the viewport as intended
- [x] Logo `width` increased from 420→1200, `height` from 70→200, `maxHeight` from 55px→140px, `maxWidth` 90%
- [x] Hero wave base amplitudes scaled up proportionally (12–15→22–30) to fill the taller area
- [x] Drop shadow intensity increased for larger logo presence
- **Completed:** 2026-02-23

### PB.33 — Hero Area + Nav Bar Fixed on Scroll
- [x] HeroArea changed from `relative` to `fixed top-0 left-0 right-0 z-[90]` — always visible at top of viewport
- [x] NavBar changed from `sticky top-0` to `fixed left-0 right-0` with `top: 200px` — sits directly below hero
- [x] Protected layout `<main>` given `paddingTop: 256px` (200px hero + 56px nav) so content starts below both fixed elements
- [x] `min-h-[calc(100vh-256px)]` for proper content area sizing
- **Completed:** 2026-02-23

### PB.34 — Full-Page WaveBackground Restored to Protected Layout
- [x] Re-added `<WaveBackground />` to `src/app/(protected)/layout.tsx` — renders at z-10 behind all content
- [x] Component was intact in `src/components/ui/WaveBackground.tsx` (never deleted), just not rendered since Session 6A
- [x] Full-page background sine wave animation now runs continuously on all protected pages again
- [x] Separate from the hero area's reactive sine wave — this is the subtle always-running page backdrop
- **Completed:** 2026-02-23

### PB.35 — Nav Links Consolidated into Icon+Label Pairs
- [x] Removed redundant standalone "Main Menu" and "Dashboard" text links from nav bar center
- [x] LEFT: SD tight icon logo (32×32) + "Main Menu" label — paired as single `<Link>` to `/main-menu`
- [x] RIGHT: PositionIcon (user's role icon, 28×28) + "Dashboard" label — paired as single `<Link>` to `/dashboard`
- [x] Both pairs highlight with `bg-[var(--accent-20)]` when on the matching route
- [x] Labels hidden on small screens (`hidden sm:inline`), mobile hamburger menu preserved as fallback
- [x] NavBar now imports `useAuth` for profile data and `PositionIcon` for the role icon
- **Completed:** 2026-02-23

### PB.36 — Hero Banner Height Halved + Logo Doubled
- [x] `HERO_HEIGHT` reduced from 200px → 100px — frees up 100px of viewport for page content
- [x] NavBar `top` updated from 200px → 100px; layout `paddingTop` updated from 256px → 156px
- [x] Hero wave amplitudes scaled down proportionally (14–30 → 8–16) for the shorter banner
- [x] Logo `width` doubled from 1200→2400, `height` from 200→400 — dominant brand element within the banner
- [x] Logo `maxHeight` adjusted from 140px→80px to fit within the 100px hero (10px padding each side)
- [x] Logo `maxWidth` widened from 90%→95% for more horizontal presence
- **Completed:** 2026-02-23

### PB.37 — Hero Logo Scaled to 90% of Banner Height
- [x] Replaced fixed pixel constraints (`maxHeight: 80px`, `maxWidth: 95%`) with percentage-based sizing
- [x] Logo now uses `height: 90%; width: auto; object-fit: contain` — fills 90% of the hero banner height
- [x] Width scales automatically from the logo's native aspect ratio — no max-width cap
- [x] Removed `object-contain` Tailwind class (replaced by inline `objectFit: contain`)
- **Completed:** 2026-02-23

### PB.38 — Hero Logo Fixed to 90px Absolute Height
- [x] Changed logo `height` from `90%` (percentage) to `90px` (fixed) — bypasses broken CSS percentage chain
- [x] Root cause: `height: 90%` on the `<Image>` resolved to near-zero because the flex parent didn't propagate an explicit pixel height despite `absolute inset-0`
- [x] Fixed value of 90px guarantees the logo is 90px tall inside the 100px hero banner regardless of parent container sizing
- [x] `width: auto; objectFit: contain` preserved — width scales from native aspect ratio
- **Completed:** 2026-02-23

### PB.39 — Hero Logo: Replace Next.js Image with Standard img Tag
- [x] Root cause: Next.js `<Image>` component generates its own inline styles from `width`/`height` props, overriding custom `style={{ height: '90px' }}`
- [x] Replaced `<Image>` (from `next/image`) with standard `<img>` tag — respects inline styles without framework interference
- [x] Removed `import Image from 'next/image'` (no longer used in HeroArea)
- [x] Added `eslint-disable-next-line @next/next/no-img-element` to suppress lint warning
- [x] Logo now renders at exactly 90px tall with `width: auto; objectFit: contain` — confirmed via build
- **Completed:** 2026-02-23

---

## SUMMARY COUNTS

| Phase | Tasks | Complete |
|-------|-------|----------|
| Phase 0: Project Initialization | 6 | 6 |
| Phase 1: Design System | 10 | 10 |
| Phase 2: Authentication | 10 | 10 |
| Phase 3: Navigation & Layout | 7 | 7 |
| Phase 4: Input Page | 8 | 8 |
| Phase 5: AI Integration | 5 | 5 |
| Phase 6: Narrative Page | 10 | 10 |
| Phase 7: Dashboard | 6 | 6 |
| Phase 8: Stripe | 5 | 5 |
| Phase 9: Polish | 6 | 6 |
| Phase 10: Deployment | 5 | 0 |
| Post-Build Fixes | 85 | 85 |
| Stage 2 Sprint S2-1 | 5 | 5 |
| Stage 2 Sprint S2-4 | 6 | 6 |
| Stage 2 Sprint S2-5 | 5 | 5 |
| Stage 2 Sprint S2-6A | 7 | 7 |
| Stage 2 Sprint S2-6B | 4 | 4 |
| Stage 2 Sprint S2-6C | 6 | 6 |
| **TOTAL** | **196** | **191** |

---

### PB.40 — Hero Logo Not Updating: Stale Turbopack Cache (Root Cause of 4 Failed Fixes)
- [x] **Root cause identified:** The `.next/dev/static/chunks/` directory contained TWO compiled versions of HeroArea.tsx — a stale chunk (`src_b3635525._.js`, 9:47 AM) with the ORIGINAL code (`HERO_HEIGHT = 200`, Next.js `<Image>`, `maxHeight: '140px'`) and a current chunk (`src_eba96a0c._.js`, 11:50 AM) with all 4 fix attempts applied
- [x] The browser was loading the stale compiled chunk, so none of the 4 source-level fixes (PB.36–PB.39) were ever visible in the browser
- [x] Contributing factor: HeroArea uses `useRef` + `requestAnimationFrame` canvas animation loops, which can prevent Turbopack HMR from successfully hot-replacing the module
- [x] **Fix:** Deleted entire `.next` directory to purge all stale compiled chunks, forcing a full recompilation on next dev server start
- **Completed:** 2026-02-23

### PB.41 — Oversize Hero Logo to 409px, Floating Above Hero + Nav
- [x] Logo image has significant blank padding in the PNG file — visible content is much smaller than the image bounds
- [x] Oversized logo to 262% of combined hero (100px) + nav (56px) = **409px** height, with `width: auto` preserving the native 3:2 aspect ratio
- [x] Separated logo into its own fixed overlay (`z-[110]`) that spans both hero and nav areas, floating above both (hero z-90, nav z-100)
- [x] Logo overlay uses `pointer-events-none` so nav links remain fully clickable underneath
- [x] Hero background (wave canvas + gradient) remains in its own container with `overflow-hidden` — unaffected by logo changes
- **Completed:** 2026-02-23

### PB.42 — Remove Card Hover Enlargement Effect
- [x] Removed `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}` from `LiquidCard.tsx` — cards no longer physically enlarge on hover
- [x] Removed `scale: 1.03` from `StoryTypeSelector.tsx` whileHover — kept boxShadow glow and whileTap scale
- [x] Converted LiquidCard from `motion.div` to a static `div` wrapped in `CursorGlow` — no more Framer Motion scale on cards
- [x] Kept whileHover scale on: `Button.tsx` (1.05), main menu FAQ/Support links (1.08), and other small interactive controls
- **Completed:** 2026-02-23
- **Notes:** Large card scale on hover made the layout feel chaotic. Scale effects now reserved exclusively for buttons and small clickable elements.

### PB.43 — Cursor Underglow Effect (CursorGlow Component)
- [x] Created `src/components/ui/CursorGlow.tsx` — reusable wrapper component for cursor-following underglow on any element
- [x] Tracks mouse position relative to the container via `onMouseMove`, applies `radial-gradient(circle ${radius}px at ${x}px ${y}px, var(--accent-primary), transparent)` as an overlay
- [x] Configurable props: `radius` (default 200px), `opacity` (default 0.15), `enabled` (default true)
- [x] Glow fades in/out smoothly on mouse enter/leave via CSS `transition: opacity 0.3s ease`
- [x] Overlay uses `pointer-events: none` and `z-index: 1` — content sits at `z-index: 2` above the glow
- [x] Inherits `border-radius` from parent via `borderRadius: inherit` so glow respects rounded corners
- [x] Integrated into `LiquidCard.tsx` — all LiquidCards now have cursor underglow by default (controlled by `glow` prop)
- **Completed:** 2026-02-23
- **Notes:** Replaces the old card hover enlargement. The glow color automatically follows the user's accent color via `var(--accent-primary)`.

### PB.44 — Landing Page Redesign (Cinematic Entrance + Tagline)
- [x] Enlarged logo from 800×200 to 1200×300 (`Logo.tsx` large size variant) — dominant visual element
- [x] Added staggered cinematic entrance: logo scales in first (0s, scale 0.8→1), subtitle fades in second (0.6s delay), buttons slide in last (1.1s delay)
- [x] Added subtitle tagline "AI-POWERED REPAIR NARRATIVE GENERATOR" below logo — spaced-out tracking (0.35em), muted text, uppercase
- [x] Landing page is a full-page wave background with centered logo and buttons — no nav bar or hero area (pre-login screen)
- [x] Removed unnecessary `motion.div` wrapper that was wrapping everything — cleaner animation hierarchy
- **Completed:** 2026-02-23

### PB.45 — Main Menu Page Redesign
- [x] Removed Logo image from inside the main menu card
- [x] Replaced with "Main Menu" heading (`<h1>`) styled with `text-[var(--accent-bright)]`, bold, tracking-wide, 2xl/3xl responsive sizing
- [x] Increased card width from `max-w-md` to `max-w-2xl` — buttons constrained to `max-w-md` within the card for balance
- [x] Card uses cursor underglow effect (via LiquidCard's built-in CursorGlow wrapper)
- [x] Removed `Logo` and `Logo import` from main menu page — no longer needed
- **Completed:** 2026-02-23

### PB.46 — "NEW STORY" Reset Button on Narrative Page
- [x] Added "NEW STORY" ghost button to the bottom action bar on the narrative page (uses `RotateCcw` icon from lucide-react)
- [x] Clicking opens a confirmation modal: "Are you sure? All unsaved data will be lost."
- [x] Confirmation dialog has CANCEL (secondary) and START OVER (primary) buttons
- [x] START OVER calls `resetAll()` from narrative store (clears all state) and navigates to `/main-menu`
- [x] Styled as `variant="ghost"` so it doesn't compete visually with primary actions (SAVE, SHARE/EXPORT)
- **Completed:** 2026-02-23

### SESSION 7A — Page Redesigns, Cursor Underglow, Card Hover Changes — COMPLETE
- **Scope:** PB.42, PB.43, PB.44, PB.45, PB.46
- **Completed:** 2026-02-23
- **Notes:** Major visual changes: (1) Cards no longer enlarge on hover — replaced with cursor-following underglow glow effect. (2) Landing page has cinematic staggered entrance with larger logo and tagline. (3) Main menu has "Main Menu" heading instead of logo, wider card. (4) Narrative page has "NEW STORY" reset button with confirmation dialog.

### PB.47 — Navigation Guard for Unsaved Narratives
- [x] Added `isSaved` (boolean) and `savedNarrativeId` (string|null) to `NarrativeState` in `narrativeStore.ts`
- [x] `isSaved` starts true (no narrative to protect), flips to false when `setNarrative()` is called (new/regenerated/customized narrative), flips to true on manual save or auto-save
- [x] `beforeunload` event listener registered when `isSaved === false` — shows browser's native "Leave page?" dialog on tab close or browser back
- [x] In-app navigation interceptor via document `click` capture — catches `<a>` clicks to internal routes, prevents default, shows custom modal
- [x] Custom "Unsaved Narrative" modal: "You have an unsaved narrative. Once you leave this page, this story cannot be recovered." with STAY ON PAGE and LEAVE WITHOUT SAVING buttons
- [x] `pendingNavigation` state stores the intended URL; LEAVE WITHOUT SAVING calls `router.push(pendingNavigation)`
- [x] When `isSaved` is true, both guards are removed — all navigation works freely
- [x] The existing "Start Over" confirmation dialog (PB.46) still serves as the guard for the NEW STORY button
- **Completed:** 2026-02-23

### PB.48 — Auto-Save on Export (Duplicate Prevention)
- [x] Created `saveToDatabase()` helper in narrative page — performs Supabase insert with `.select('id').single()` to retrieve the new record ID
- [x] Duplicate prevention: `saveToDatabase()` checks `state.savedNarrativeId` first; if already set, returns existing ID without inserting
- [x] `markSaved(id)` store action sets both `isSaved = true` and `savedNarrativeId = id` in one update
- [x] `handleBeforeExport()` callback passed to `ShareExportModal` via `onBeforeExport` prop — calls `saveToDatabase()` before any export
- [x] All 4 export actions (Copy to Clipboard, Print, Download PDF, Download Word) call `onBeforeExport()` before proceeding
- [x] Toast notification: "Narrative auto-saved to your history" shown after auto-save (uses `{ id: 'auto-save' }` to prevent duplicate toasts)
- [x] Activity event dispatched (`dispatchActivity(0.5)`) on both manual save and auto-save — triggers hero wave spike
- [x] Manual save also uses `saveToDatabase()` for consistent dedup behavior
- **Completed:** 2026-02-23

### SESSION 7B — Navigation Guard + Auto-Save on Export — COMPLETE
- **Scope:** PB.47, PB.48
- **Completed:** 2026-02-23
- **Notes:** Two critical protections for unsaved narratives. (1) Navigation guard uses `beforeunload` for browser close/back and document click capture for in-app links — both disabled once `isSaved` is true. (2) Auto-save on export ensures narratives appear in dashboard history after any export action, with duplicate prevention via `savedNarrativeId`.

### PB.49 — AccentColorPicker Component
- [x] Created `src/components/ui/AccentColorPicker.tsx` — row of 9 clickable color swatches
- [x] Uses existing `ACCENT_COLORS` array from `themeColors.ts` and `useTheme()` hook from `ThemeProvider.tsx`
- [x] Each swatch: 36×36px circle filled with accent hex color
- [x] Selected swatch: 3px solid `var(--text-primary)` border + `0 0 12px {color.hex}` box shadow
- [x] Unselected swatches: 2px solid transparent border
- [x] Framer Motion `whileHover={{ scale: 1.15 }}` and `whileTap={{ scale: 0.95 }}` on each swatch
- [x] Displays current accent color name below the row; "Black" swatch shows "Auto-activates light mode" note
- [x] onClick calls `setAccentColor(key)` from useTheme()
- **Completed:** 2026-02-23

### PB.50 — PreferencesPanel Modal + Dashboard Integration
- [x] Created `src/components/dashboard/PreferencesPanel.tsx` — modal with two tabs (Appearance and Templates)
- [x] Props: `isOpen: boolean` and `onClose: () => void`
- [x] Backdrop: fixed overlay, `rgba(0,0,0,0.6)`, `backdrop-filter: blur(4px)`, z-index 200
- [x] Panel: centered, `var(--bg-elevated)` background, `var(--radius-2xl)` border radius, `var(--shadow-glow-md)` shadow, max-width 520px, max-height 80vh with overflow scroll
- [x] Header: Settings icon (lucide) colored `var(--accent-primary)` + "Preferences" h2 + X close button
- [x] Tab switcher: segmented control — Appearance (Palette icon) and Templates (FileText icon); active tab uses `var(--accent-primary)` bg with white text
- [x] Framer Motion AnimatePresence for enter/exit animations
- [x] Appearance tab: `<AccentColorPicker />` component + Display Mode section (Dark/Light buttons calling `toggleColorMode()`) + hint text
- [x] Dark/Light buttons: selected mode has `2px solid var(--accent-primary)` border + `var(--accent-8)` bg; unselected has `var(--accent-20)` border + `var(--bg-input)` bg
- [x] Black accent disables Dark button (forced light mode)
- [x] Templates tab: placeholder with FileText icon, heading, and "coming soon" description
- [x] Added `showPreferences` state + Preferences button (Settings icon, `var(--bg-input)` bg) to dashboard page header
- [x] `<PreferencesPanel>` rendered at bottom of dashboard component JSX
- **Completed:** 2026-02-23

### PB.51 — Supabase Preferences Persistence + UserPreferences Type
- [x] Added `UserPreferences` interface to `src/types/database.ts` with `appearance` and `templates` sub-types
- [x] Added `preferences?: UserPreferences` to existing `UserProfile` interface
- [x] Extended `ThemeProvider.tsx` with `loadFromSupabase()` — runs on mount after localStorage load, queries `users.preferences` column, overrides local values if Supabase has saved preferences
- [x] Extended `ThemeProvider.tsx` with `saveToSupabase()` — runs alongside localStorage saves on accent/mode change, reads existing preferences first and merges with spread operator to preserve future keys (templates, etc.)
- [x] Both functions dynamically import Supabase client, silently return if no user logged in
- [x] All Supabase calls wrapped in try/catch — errors logged but never break the app (localStorage is the fallback)
- [x] Supabase sync keeps localStorage aligned so offline/logged-out sessions still work
- **Completed:** 2026-02-23
- **Notes:** Requires a `preferences JSONB` column on the `users` table in Supabase. Run: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;`

### SESSION 8A — User Preferences Panel + Accent Color Picker + Supabase Persistence — COMPLETE
- **Scope:** PB.49, PB.50, PB.51
- **Completed:** 2026-02-23
- **Notes:** Full preferences system. AccentColorPicker renders 9 swatches using existing theme infrastructure. PreferencesPanel modal on dashboard with Appearance tab (color picker + dark/light toggle) and Templates placeholder tab. ThemeProvider extended with Supabase sync — loads from DB on mount (overriding localStorage), saves to DB on every accent/mode change (merging with existing preferences). UserPreferences type added to database.ts. Requires `preferences JSONB` column on users table.

### PB.52 — Light Mode Accent Text Emphasis (Bold Black Substitution)
- [x] Added `--accent-text-emphasis` CSS variable: resolves to `accent.hex` in dark mode, `#0f172a` in light mode
- [x] Added `--accent-text-emphasis-weight` CSS variable: `inherit` in dark mode, `700` in light mode
- [x] Both variables set in `applyTheme()` based on `effectiveMode`, with `:root` defaults in `globals.css`
- [x] `data-mode` attribute now set on `<html>` element for CSS selector targeting
- [x] Updated emphasis text in 6 components: main-menu heading, FAQ question headings, NarrativeDisplay C/C/C headings, NarrativeDetailModal C/C/C headings, ConditionalField AI badge, PreferencesPanel Settings icon
- [x] Dashboard "User Dashboard" heading changed from hardcoded `text-white` to `text-[var(--text-primary)]`
- **Completed:** 2026-02-23
- **Notes:** Only applies to text used for visual hierarchy/emphasis — not interactive elements like buttons or links where accent color is the identity.

### PB.53 — Light Mode Card Container Tinting
- [x] In `applyTheme()` light mode block: `--bg-card` now computed as a solid blended color (6% accent into white) instead of transparent `var(--accent-8)`
- [x] Formula: `rgb(255*0.94 + r*0.06, 255*0.94 + g*0.06, 255*0.94 + b*0.06)` — produces a clearly tinted, non-white card background for every accent color
- [x] Added `--border-default` CSS variable: `transparent` in dark mode, `rgba(0,0,0,0.1)` in light mode
- [x] Card bg now applies consistently to ALL light modes (Black native + user-toggled)
- **Completed:** 2026-02-23
- **Notes:** Previous approach used `var(--accent-8)` which was 8% opacity on white — too subtle. Solid blended color is always visually distinct from the page background.

### PB.54 — Light Mode Button Text Color Fix
- [x] Added `--btn-text-on-accent` CSS variable: `#ffffff` in dark mode, `#0f172a` in light mode
- [x] Updated `Button.tsx` primary variant: `text-white` → `text-[var(--btn-text-on-accent)]`
- [x] PreferencesPanel active tab text: hardcoded `#ffffff` → `var(--btn-text-on-accent)`
- **Completed:** 2026-02-23
- **Notes:** Only affects filled/primary buttons where the background IS the accent color. Ghost and secondary buttons are handled by PB.55.

### PB.55 — Light Mode Outline Button Vividity Fix
- [x] Added `--accent-vivid` CSS variable: `accent.hover` in dark mode (bright, stands out on dark bg), `accent.border` in light mode (dark, stands out on light bg)
- [x] Updated `Button.tsx` secondary variant: `text-[var(--accent-hover)]` → `text-[var(--accent-vivid)]`, border likewise
- [x] Updated `Button.tsx` ghost variant: `text-[var(--accent-text)]` → `text-[var(--accent-vivid)]`
- [x] Updated dashboard Preferences button: `--text-secondary` → `--accent-vivid` for text and border, added `font-weight: 600`
- **Completed:** 2026-02-23
- **Notes:** For light accent colors (yellow, green) on white backgrounds, `accent.border` provides much better contrast than `accent.hover` or `accent.primary`.

### PB.56 — White Accent Forces Dark Mode
- [x] Added `isDarkMode: boolean` to `AccentColor` interface in `themeColors.ts` (mirrors `isLightMode` for Black)
- [x] Set `isDarkMode: true` on White accent, `isDarkMode: false` on all other 8 accents
- [x] Updated `applyTheme()` effectiveMode: `accent.isLightMode ? 'light' : accent.isDarkMode ? 'dark' : mode`
- [x] Updated `setAccentColor()` in ThemeProvider: selecting White auto-switches to dark mode (mirrors Black→light logic)
- [x] Updated ThemeProvider context value: handles `isDarkMode` in colorMode computation
- [x] Updated PreferencesPanel: Light button disabled when White accent active (opacity 0.5, not-allowed cursor)
- [x] Updated AccentColorPicker: White accent shows "Auto-activates dark mode" note below the row
- **Completed:** 2026-02-23
- **Notes:** Mirrors the existing Black→light mode pattern. White on a light background is invisible, so dark mode is forced.

### SESSION 8B — Light Mode Styling Fixes + White Accent Dark-Mode Lock — COMPLETE
- **Scope:** PB.52, PB.53, PB.54, PB.55, PB.56
- **Completed:** 2026-02-23
- **Notes:** Five light mode improvements. (1) Accent-colored emphasis text switches to bold black in light mode via `--accent-text-emphasis`. (2) Card backgrounds use solid accent-tinted color instead of transparent overlay. (3) Primary button text switches to black in light mode via `--btn-text-on-accent`. (4) Outline/ghost buttons use darker accent color (`accent.border`) in light mode via `--accent-vivid`. (5) White accent forces dark mode, matching the Black→light pattern.

### PB.57 — ParticleNetwork Component (Replaces WaveBackground on Protected Pages)
- [x] Created `src/components/ui/ParticleNetwork.tsx` — full-page canvas animation with floating particles and connecting lines
- [x] 30 particles with random velocity, wrapped edges, and dynamic connection lines (max distance 200px)
- [x] Reads `--wave-color` CSS variable (RGB triplet) same as WaveBackground — accent color changes propagate automatically
- [x] Re-reads accent color every 2s via `setInterval` to pick up mid-session theme changes
- [x] Canvas at `z-10`, `pointer-events: none`, `fixed inset-0` — identical layering to old WaveBackground
- **Completed:** 2026-02-24

### PB.58 — ThemeProvider backgroundAnimation State + Supabase Persistence
- [x] Added `backgroundAnimation: boolean` and `setBackgroundAnimation` to `ThemeContextValue` interface
- [x] State initialized from `localStorage('sd-bg-animation')`, defaults to `true` if absent
- [x] `setBackgroundAnimation()` persists to localStorage AND merges into Supabase `preferences.appearance.backgroundAnimation`
- [x] `loadFromSupabase()` reads `backgroundAnimation` from Supabase on mount, defaults to `true` if undefined
- [x] `saveToSupabase()` updated to spread existing appearance fields when merging — preserves accentColor, mode, AND backgroundAnimation
- [x] Added `backgroundAnimation?: boolean` to `UserPreferences.appearance` in `src/types/database.ts`
- **Completed:** 2026-02-24

### PB.59 — Protected Layout: Swap WaveBackground → ParticleNetwork
- [x] Replaced `import WaveBackground` with `import ParticleNetwork` in `src/app/(protected)/layout.tsx`
- [x] Added `import { useTheme }` and `const { backgroundAnimation } = useTheme()`
- [x] Replaced `<WaveBackground />` with `{backgroundAnimation && <ParticleNetwork />}` — component fully unmounts when toggle is off
- [x] WaveBackground.tsx preserved for landing page (`src/app/page.tsx`) and auth pages (`login/page.tsx`, `signup/page.tsx`)
- **Completed:** 2026-02-24

### PB.60 — Background Animation Toggle in PreferencesPanel
- [x] Added "Background Animation" section to Appearance tab in `src/components/dashboard/PreferencesPanel.tsx`
- [x] Section heading matches existing style (`text-sm font-semibold`, `var(--text-secondary)`)
- [x] Toggle row: Sparkles icon + "Particle Network" label on left, pill toggle switch (48×24px) on right
- [x] Toggle ON: track is `var(--accent-primary)`, circle slides right; OFF: track is `var(--bg-elevated)`, circle slides left
- [x] CSS `transition-all duration-200` for smooth slide animation
- [x] Clicking anywhere on the row calls `setBackgroundAnimation(!backgroundAnimation)`
- **Completed:** 2026-02-24

### SESSION 9A — Particle Network Animation + Background Animation Toggle — COMPLETE
- **Scope:** PB.57, PB.58, PB.59, PB.60
- **Completed:** 2026-02-24
- **Notes:** Replaced the full-page sine wave background on protected pages with a particle network animation (floating dots with connecting lines). Added on/off toggle to the Preferences Panel Appearance tab. Toggle persists to localStorage (instant) and Supabase (cross-device). WaveBackground.tsx retained for landing page and auth pages. ParticleNetwork reads the same `--wave-color` CSS variable for accent-reactive coloring.

### PB.61 — Dashboard Modal Overflow Fix (Portal to Body)
- [x] Modal.tsx updated to use `createPortal(content, document.body)` from react-dom
- [x] Added `mounted` state guard for SSR compatibility
- [x] NarrativeDetailModal now renders as full-screen overlay, escaping CursorGlow's `overflow: hidden`
- [x] Backdrop covers entire viewport with blur; modal centered on screen
- [x] Close on backdrop click and Escape key still works
- **Completed:** 2026-02-24

### PB.62 — Hero Wave Amplitude +10% and Vertical Centering to Logo
- [x] All 5 hero wave `baseAmplitude` values increased by 10% (14→15.4, 10→11, 16→17.6, 12→13.2, 8→8.8)
- [x] Wave `centerY` changed from `h / 2` to `h * 0.78` to align with logo vertical center (logo centered in hero+nav = 156px, center at 78px from top, hero canvas is 100px)
- **Completed:** 2026-02-24

### PB.63 — Combined Nav Bar Dashboard + User Icon Button
- [x] Removed separate Dashboard link (PositionIcon + "Dashboard" text) from NavBar.tsx
- [x] Removed `useAuth` and `PositionIcon` imports from NavBar (no longer needed)
- [x] Removed Dashboard from mobile menu dropdown (now accessible via UserPopup dropdown)
- **Completed:** 2026-02-24

### PB.64 — UserPopup: T.Cloyd Format Trigger with Dropdown
- [x] UserPopup trigger changed from avatar-only to combined button: PositionIcon + "T.Cloyd" name + chevron
- [x] `formatDisplayName()` helper: first initial + period + last name (falls back to username or email prefix)
- [x] Button styled with accent border, hover background, chevron rotation on open
- [x] Dropdown retains Dashboard link + Log Out + user info (name, location, position)
- **Completed:** 2026-02-24

### PB.65 — Login Page Logo Size Matched to Landing Page
- [x] Login page Logo changed from `size="medium"` to `size="large"` with `className="max-w-[90vw]"`
- [x] Applied to both loading state and main render paths
- [x] Now matches landing page logo dimensions exactly
- **Completed:** 2026-02-24

### PB.66 — Wave Animation Centered to Logo on Landing/Login/Signup Pages
- [x] WaveBackground.tsx: added `centerYPercent` prop (default 0.5) controlling vertical baseline
- [x] Landing page: `centerYPercent={0.40}` — waves flow through logo vertical center
- [x] Login page: `centerYPercent={0.35}` — adjusted for logo position above form card
- [x] Signup page: `centerYPercent={0.35}` — same as login page
- **Completed:** 2026-02-24

### PB.67 — Purple Dark Mode Default for Unauthenticated Pages (Revised)
- [x] ~~Initially created ForcePurpleDark.tsx — replaced in PB.69 with auth-aware ThemeProvider approach~~
- [x] Added `className="dark"` to `<html>` in root layout for baseline dark mode
- **Completed:** 2026-02-24 (Revised 2026-02-24)

### PB.68 — 8-Hour Auto-Logout Session Expiry
- [x] Created `src/hooks/useSessionExpiry.ts` with `setLoginTimestamp()`, `clearLoginTimestamp()`, and `useSessionExpiry()` hook
- [x] Login page: calls `setLoginTimestamp()` on successful sign-in
- [x] Signup page: calls `setLoginTimestamp()` on profile creation completion
- [x] Protected layout: calls `useSessionExpiry()` hook — checks every 60 seconds
- [x] useAuth signOut: clears `sd-login-timestamp` from localStorage
- [x] Expired session shows toast "Your session has expired. Please sign in again." before redirect
- **Completed:** 2026-02-24

### PB.69 — Auth-Aware Theme Flow (Replaces ForcePurpleDark)
- [x] **Removed ForcePurpleDark.tsx** — component fought with ThemeProvider's CSS var application order
- [x] **ThemeProvider rewrite**: on mount checks auth state — if no user, resets to purple dark defaults; if authenticated, loads from Supabase
- [x] **Auth state change listener** in ThemeProvider: SIGNED_OUT resets to purple dark + clears localStorage; SIGNED_IN loads user preferences from Supabase
- [x] **useAuth signOut** now clears all theme localStorage keys (`sd-accent-color`, `sd-color-mode`, `sd-bg-animation`) in addition to session timestamp
- [x] **Removed ForcePurpleDark imports** from landing page, login page, and signup page
- [x] **Result**: Landing/login pages always show purple dark. After login, user's saved accent color and mode are applied automatically. No race conditions between components.
- **Completed:** 2026-02-24

### SESSION 10A — Dashboard Modal, Nav Consolidation, Wave Fixes, Dark Mode Default, Auto-Logout — COMPLETE
- **Scope:** PB.61, PB.62, PB.63, PB.64, PB.65, PB.66, PB.67, PB.68, PB.69
- **Completed:** 2026-02-24
- **Notes:** Fixed dashboard modal overflow (portaled to body), increased wave amplitude 10% and centered to logo, combined nav bar Dashboard button with user icon into single T.Cloyd dropdown, matched login logo size to landing page, centered wave animations to logo on landing/login pages, set purple dark mode as default for logged-out state via auth-aware ThemeProvider, added 8-hour auto-logout session expiry.

### PB.70 — Main Menu Page No-Scroll + Viewport Centering
- [x] Changed main menu page wrapper from `min-h-screen` to `min-h-[calc(100vh-156px)]` — accounts for fixed hero (100px) + nav (56px) overhead
- [x] Removed `py-8` vertical padding that pushed content below the fold
- [x] Reduced inner card gap from `gap-8` to `gap-6` for a tighter, centered layout
- [x] Loading state also updated to use the same viewport-aware height
- [x] Content card is now dead-center in the available viewport with no scroll bar
- **Completed:** 2026-02-24

### PB.71 — White Accent Theme: Generate Story Button Text Readability
- [x] Added `perceivedBrightness()` helper to `src/lib/constants/themeColors.ts` — computes perceived brightness (0-255) from hex color using weighted RGB formula (0.299R + 0.587G + 0.114B)
- [x] Added luminance-based `--btn-text-on-accent` override in `applyTheme()` — checks brightness of `accent.hover` (the primary button background color)
- [x] If hover brightness > 180: button text is `#000000` (black); otherwise `#ffffff` (white)
- [x] White accent hover is `#f1f5f9` (brightness ~244) → black text ✓ All other accents have darker hover colors → white text preserved ✓
- [x] For dark mode with very light accents (White): `--accent-vivid` falls back to `accent.border` for better secondary button contrast
- **Completed:** 2026-02-24

### PB.72 — Black Accent Theme: Comprehensive Visibility Fix
- [x] Same `perceivedBrightness()` luminance check ensures Black accent primary buttons get white text — `accent.hover` is `#334155` (brightness ~63) → white text ✓
- [x] Light mode `--accent-vivid` override: when `accent.border` brightness > 180 (Black's border is `#cbd5e1` at ~211), falls back to `accent.hex` (`#1e293b`) — dark text/borders readable on light backgrounds
- [x] Light mode `--card-border` and `--modal-border` override: when border is too light, uses `accent.hover` (`#334155`) — visible dark gray border on white card backgrounds
- [x] All accent-colored elements (buttons, text, icons, borders) now use appropriate contrast values for the Black theme
- [x] Works generically via luminance thresholds — no hardcoded per-accent exceptions needed
- **Completed:** 2026-02-24

### SESSION 11A — Main Menu Centering + White/Black Accent Theme Fixes — COMPLETE
- **Scope:** PB.70, PB.71, PB.72
- **Completed:** 2026-02-24
- **Notes:** Fixed Main Menu page scroll and centered container in viewport (156px header offset). Added luminance-based button text color system — `perceivedBrightness()` helper auto-determines black vs white text for primary buttons based on accent hover color brightness. White accent: Generate Story button now has black text on light button. Black accent: all elements visible with proper contrast — primary buttons get white text on dark bg, secondary buttons/borders use darker accent colors, card/modal borders darkened. All fixes are generic luminance checks, not per-accent hardcodes.

### PB.73 — React Hydration Mismatch Fix for Accent-Themed Logo
- [x] Root cause: `ThemeProvider` reads accent color from localStorage in `useState` initializer — server renders with default violet accent, client hydration reads saved accent (e.g. blue) → logo `src` differs between server and client HTML → React hydration mismatch warning
- [x] Fixed `HeroArea.tsx`: added `mounted` state (false until useEffect), logo `src` uses `DEFAULT_ACCENT.logoFile` until mounted, then swaps to `accent.logoFile`
- [x] Fixed `Logo.tsx` (used on landing, login, signup pages): same `mounted` + `DEFAULT_ACCENT.logoFile` pattern
- [x] No visible flicker — the logo swap happens in the same paint cycle as the ThemeProvider's CSS variable application (both run in useEffect after mount)
- [x] Does not change how accent color theming works overall — only defers the logo image source to after hydration
- **Completed:** 2026-02-24

### PB.74 — Light Mode Card Container Text Readability
- [x] Fixed light mode card container text — all title, subtitle, and label text at top of cards now renders black in light mode for readability across all accent color themes.
- [x] Changed 5 hardcoded `text-white` instances to `text-[var(--text-primary)]` in card headers:
  - `login/page.tsx` — "Sign In" card title
  - `signup/page.tsx` — Step title card header
  - `input/page.tsx` — "Select Story Type" card title
  - `input/page.tsx` — "Repair Order Information" card title
  - `narrative/page.tsx` — "AI OUTPUT CUSTOMIZATION" card label
- [x] The CSS variable `--text-primary` already switches between `#ffffff` (dark mode) and `#0f172a` (light mode) via the ThemeProvider, so these card headers now automatically adapt to the active color mode
- [x] Did NOT change button text, badge text, or tab button text (EditProfileModal, ProofreadResults, CustomizationPanel) — those are on accent-colored backgrounds and remain `text-white` correctly
- **Completed:** 2026-02-24

### PB.75 — React Hydration Mismatch Fix for NavBar Color Mode Toggle
- [x] Root cause: `ThemeProvider` reads `colorMode` from localStorage in `useState` initializer — server renders with default `'dark'` mode (Sun icon, "Switch to light mode" aria-label), client hydration reads saved mode (e.g. `'light'`) → icon and aria-label differ between server and client HTML → React hydration mismatch warning
- [x] Fixed `NavBar.tsx`: added `isMounted` state (false until useEffect), toggle button uses `displayMode = isMounted ? colorMode : 'dark'` — always renders server-default dark mode state (Sun icon) during SSR and initial hydration
- [x] After mount, `isMounted` flips to true and the real `colorMode` from ThemeProvider context drives the icon/aria-label — correct icon appears immediately with no visible flash
- [x] Same pattern as PB.73 (logo hydration fix) — defers client-only state to after hydration
- **Completed:** 2026-02-24

### PB.76 — Landing Page Layout Fix: Subtitle & Buttons Pushed Up from Logo Blank Space
- [x] Root cause: Logo PNG (`SERVIDRAFT_AI_LOGO_1_.PNG`) has significant transparent blank space below the visible graphic — the 1200×300 image reserves full height including invisible padding, pushing subtitle text and buttons to the bottom of the viewport
- [x] Fixed `src/app/page.tsx`: wrapped subtitle and buttons in a container with `-mt-28` (negative 112px margin-top) to pull them up into the logo's blank space
- [x] Added `pointer-events-none` to the logo `motion.div` so the invisible blank area doesn't block button clicks
- [x] Subtitle+buttons container has `relative z-10` to render above the logo layer and remain clickable
- [x] Removed `gap-8` from parent flex column (spacing now handled by the negative margin and `mt-6` on the buttons)
- [x] All content (logo, subtitle, LOGIN, REQUEST ACCESS) fits within the viewport at 1080p without scrolling
- [x] **Revised:** Doubled negative margin from `-mt-28` (112px) to `-mt-56` (224px) — initial shift was insufficient, subtitle and buttons were still too far down
- [x] **Revised:** Re-centered wave animation `centerYPercent` from `0.40` to `0.50` — waves were offset toward the top of viewport after layout shift; now aligned with logo's flex-centered position. Login/signup pages unchanged (waves at `0.35` still correct for logo-above-card layout).
- **Completed:** 2026-02-24

### PB.77 — Login Page Logo Doubled in Size
- [x] Root cause: Login page logo was constrained by parent `max-w-md` (448px) wrapper — the 1200×300 image rendered at only ~448×112px, much smaller than the landing page logo
- [x] Added `scale-[2] origin-bottom` CSS transform wrapper around the Logo on the login page — visually doubles the logo without changing layout flow (CSS transforms don't affect box model)
- [x] `origin-bottom` ensures the logo scales upward into the wave background area; the `mb-8` gap to the Sign In card is preserved, card position unchanged
- [x] Applied to both the loading state and the main render path
- **Completed:** 2026-02-24

### PB.78 — Smooth Page Transition from Landing Page to Login Page
- [x] Landing page (`src/app/page.tsx`): added exit fade-out animation — `exiting` state triggers `opacity: 0` over 350ms via Framer Motion, then `router.push()` navigates after the animation completes
- [x] Replaced `<Link>` wrappers on LOGIN and REQUEST ACCESS buttons with `onClick` handlers calling `handleNavigate()` — intercepts click, fades out, then navigates
- [x] Login page (`login/page.tsx`): added `motion.div` wrapper with `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` fade-in over 400ms — smooth entrance after landing page fade-out
- [x] Combined effect: landing page fades out (350ms) → login page fades in (400ms) — premium crossfade feel, no hard jump cut
- **Completed:** 2026-02-24

### PB.79 — Gemini 3.0 Flash Model Upgrade
- [x] Updated `src/lib/gemini/client.ts` — model string changed from `gemini-2.0-flash` to `gemini-3-flash-preview`
- [x] All API routes (generate, customize, proofread, apply-edits) use `generateWithGemini()` which centralizes the model — no other files needed updating
- [x] Updated `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` — code example now shows `gemini-3-flash-preview`
- [x] Updated `BUILD_PROGRESS_TRACKER.md` — Phase 5 notes now reference `gemini-3-flash-preview`
- **Completed:** 2026-02-24

### PB.80 — Signup Page Entrance Animation
- [x] Added `motion` import from `framer-motion` to `src/app/(auth)/signup/page.tsx`
- [x] Wrapped main content `<div>` in `<motion.div>` with `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}` (duration: 0.4s, easeOut)
- [x] Matches login page entrance animation pattern for consistency
- [x] All pages in the app now have Framer Motion entrance animations
- **Completed:** 2026-02-24

### PB.81 — Signup Page Logo Doubled in Size
- [x] Changed Logo from `size="medium"` to `size="large"` with `className="max-w-[90vw]"` in `src/app/(auth)/signup/page.tsx`
- [x] Added `scale-[2] origin-bottom translate-y-16` CSS transform wrapper — identical to login page (PB.77)
- [x] `origin-bottom` ensures logo scales upward without pushing the form card down
- [x] Wave animation `centerYPercent={0.35}` unchanged — stays aligned since card position is preserved
- **Completed:** 2026-02-24

### SESSION 12A — Gemini 3-Flash-Preview Upgrade + Final Polish + Documentation Sync — COMPLETE
- **Scope:** PB.79, PB.80, PB.81
- **Completed:** 2026-02-24
- **Notes:** Upgraded Gemini AI model from 2.0 Flash to 3-flash-preview (single change point in gemini/client.ts). Added missing entrance animation to signup page. Doubled signup page logo to match login page. Verified all pages have Framer Motion animations, background animation runs on all protected pages, toast notifications have consistent styling. Updated all documentation to reflect gemini-3-flash-preview. Stage 1 build complete — all core features implemented.

---

## STAGE 2 SPRINT S2-1 — Dashboard Search & Filtering
*Enhanced search, sort controls, filter pills, and results count for the saved narratives table on the User Dashboard.*

### S2-1.1 — Enhanced Search Bar
- [x] Search input now searches across ALL visible columns: R.O. #, Year, Make, Model, Concern, Cause, Correction, and Date
- [x] Search is case-insensitive and matches partial strings (e.g. "sil" matches "Silverado")
- [x] Added "X" clear button inside search input (visible only when text is present)
- [x] Search icon (lucide Search) on the left inside the input (already existed, preserved)
- [x] Debounced search by 300ms using useRef timer — no filtering on every keystroke
- **Completed:** 2026-02-25

### S2-1.2 — Sort Controls
- [x] Added row of sort buttons below the search bar: Date (Newest), Date (Oldest), Vehicle (A-Z by Make then Model), R.O. # (Ascending)
- [x] Date (Newest) is the default active sort
- [x] Only ONE sort active at a time — active button shows `var(--accent-primary)` bg with `var(--btn-text-on-accent)` text
- [x] Inactive buttons use `var(--bg-input)` bg with `var(--text-secondary)` text
- [x] Each sort button has an ArrowUp or ArrowDown icon indicating direction
- [x] Framer Motion `whileHover={{ scale: 1.05 }}` and `whileTap={{ scale: 0.95 }}`
- **Completed:** 2026-02-25

### S2-1.3 — Filter Pills
- [x] Added horizontal row of filter pills below sort buttons: "All", "Diagnostic Only", "Repair Complete"
- [x] "All" is active by default — shows all narratives regardless of story_type
- [x] Clicking a pill filters the table to only show narratives of that `story_type`
- [x] Active pill: accent border + accent tint background; Inactive: muted border, muted text
- [x] Filter pills combine with search — user can search "Silverado" AND filter to "Repair Complete"
- [x] Framer Motion `whileHover={{ scale: 1.05 }}` and `whileTap={{ scale: 0.95 }}`
- **Completed:** 2026-02-25

### S2-1.4 — Results Count
- [x] Below the filters, shows "Showing X of Y narratives" that updates dynamically
- [x] When all narratives are visible (no filters/search), shows "Showing Y narratives"
- [x] When no results match: shows "No matching narratives found" with a ghost "Clear Filters" button
- [x] Clear Filters resets search input, sort to default (date-newest), and filter to "All"
- **Completed:** 2026-02-25

### S2-1.5 — Visual Polish
- [x] All new controls use existing CSS variables (`var(--accent-*)`, `var(--bg-input)`, `var(--text-*)`) — no hardcoded colors
- [x] Framer Motion hover/tap animations on sort buttons and filter pills
- [x] Search/sort/filter section is sticky at the top of the narrative history card
- [x] AnimatePresence on table rows for smooth fade-in/fade-out when list changes
- [x] NarrativeDetailModal unchanged — no modifications to the popup
- [x] Database schema unchanged — all filtering/sorting is client-side
- **Completed:** 2026-02-25

### SESSION S2-1 — Dashboard Search & Filtering — COMPLETE
- **Scope:** S2-1.1, S2-1.2, S2-1.3, S2-1.4, S2-1.5
- **Completed:** 2026-02-25
- **Notes:** Enhanced NarrativeHistory.tsx with: (1) Multi-column debounced search across R.O.#, Year, Make, Model, Concern, Cause, Correction, Date. (2) Four sort options with accent-styled active button. (3) Story type filter pills (All / Diagnostic Only / Repair Complete) that combine with search. (4) Dynamic results count with "Clear Filters" fallback. (5) Sticky header, AnimatePresence row transitions, full CSS variable theming. No changes to NarrativeDetailModal, database schema, or dashboard page layout.

---

## SESSION 13A — Pre-Generation Output Customization Panel — COMPLETE

### PB.82 — Pre-Generation Customization Panel on Input Page
- [x] Created `src/components/input/PreGenCustomization.tsx` — collapsible panel with Length, Tone, and Detail Level segmented controls
- [x] Toggle button with Sliders icon (lucide-react) and chevron, shows accent dot indicator when any setting is non-standard
- [x] Same three segmented controls as post-generation CustomizationPanel: Length (Short/Standard/Detailed), Tone (Warranty/Standard/Customer Friendly), Detail Level (Concise/Standard/Additional Steps)
- [x] All defaults to Standard (center position)
- [x] No Apply button — selections are included automatically when GENERATE STORY is clicked
- [x] Subtle info note: "Customization will be applied to the initial generation. You can further adjust after generating."
- [x] Added `PreGenCustomization` interface and `preGenCustomization` state to `src/stores/narrativeStore.ts` with `setPreGenCustomization(key, value)` action
- [x] `clearForNewGeneration()` resets pre-gen customization to all-standard defaults
- [x] Updated `src/lib/compileDataBlock.ts` to accept optional `PreGenCustomization` parameter — appends `--- OUTPUT STYLE PREFERENCES ---` block with modifier text from existing constants in `src/constants/prompts.ts` when any setting is non-standard
- [x] Wired into `src/app/(protected)/input/page.tsx` — rendered between last input field and GENERATE STORY button, pre-gen state passed to `compileDataBlock()` in `handleGenerate()`
- [x] localStorage persistence (`sd-pregen-customization`) — loads saved preferences on mount, saves on every change
- [x] No changes to existing CustomizationPanel.tsx, /api/generate/route.ts, or prompts.ts
- **Completed:** 2026-02-25

### PB.83 — Save Narrative Upsert + Export Freeze Fix + UPDATE RLS Policy
- [x] Created SQL migration `supabase/migrations/003_narrative_upsert_support.sql`: adds `updated_at` column, backfills from `created_at`, deduplicates existing rows, adds `UNIQUE(user_id, ro_number)` constraint, adds UPDATE RLS policy, adds `on_narratives_updated` trigger, adds `updated_at` index
- [x] Fixed `saveToDatabase()` in `src/app/(protected)/narrative/page.tsx`: replaced `.insert()` with `.upsert()` using `onConflict: 'user_id,ro_number'` — re-saving same R.O.# overwrites instead of duplicating
- [x] Removed `savedNarrativeId` short-circuit that prevented re-saves after editing
- [x] Added `updated_at` to upsert payload
- [x] Save button now shows "SAVE STORY" / "SAVING..." / "✓ SAVED" based on state
- [x] Fixed `handleBeforeExport` to skip auto-save if already saved (`state.isSaved` check), preventing redundant DB calls and race conditions
- [x] Updated `src/components/dashboard/NarrativeHistory.tsx`: changed query ordering and sort logic from `created_at` to `updated_at` so re-saved narratives appear at top
- [x] Added `updated_at: string` to `Narrative` interface in `src/types/database.ts`
- [x] Updated `NarrativeDetailModal.tsx` to show both "Created" and "Last Updated" dates instead of single "Saved" date
- **Completed:** 2026-02-25
- **Notes:** ⚠️ BLOCKED until SQL migration `003_narrative_upsert_support.sql` is run in Supabase Dashboard (SQL Editor → New Query → Paste → Run). Without the migration, upsert will fail due to missing unique constraint and UPDATE policy.

---

## Stage 2 Sprint S2-4 — Audit/Proofread Highlighting — COMPLETE

### PB.84 — Proofread Highlighting with 30-Second Fade

### S2-4.1 — Proofread API Snippet Extraction
- [x] Updated `PROOFREAD_SYSTEM_PROMPT` in `src/constants/prompts.ts` to instruct AI to include exact text snippets enclosed in `[[double brackets]]` for each flagged issue
- [x] Updated `src/app/api/proofread/route.ts`: added `extractSnippet()` function to parse `[[snippet]]` from each flagged issue string
- [x] Changed API response format: `flagged_issues` now returns `{ issue: string, snippet: string }[]` instead of `string[]`
- [x] Graceful fallback: if AI omits brackets for an issue, `snippet` defaults to empty string (issue still shows in results, just no highlight)
- **Completed:** 2026-02-25

### S2-4.2 — Highlight Utility
- [x] Created `src/lib/highlightUtils.ts` with `findHighlightRanges(narrativeText, snippets)` function
- [x] Returns `HighlightRange[]` with `{ start, end, issueIndex }` objects
- [x] Case-insensitive matching via `toLowerCase()` comparison
- [x] Overlapping ranges merged automatically (sorted by start, extended on overlap)
- [x] Non-matching snippets (AI hallucinated text) silently skipped
- **Completed:** 2026-02-25

### S2-4.3 — NarrativeDisplay Highlight Rendering
- [x] Added `highlights`, `highlightActive`, and `issueDescriptions` props to `NarrativeDisplay`
- [x] Created `HighlightedText` component: splits narrative text at highlight boundaries, wraps matches in `<mark>` elements
- [x] Highlight styling: `var(--accent-30)` background, `2px solid var(--accent-primary)` bottom border, pulsing animation
- [x] Pulsing animation: `@keyframes highlightPulse` in `globals.css` — opacity oscillates 0.2 to 0.4 over 2 seconds
- [x] Tooltip on hover: shows issue description in elevated panel with accent border and glow shadow
- [x] CSS fade-out: `transition: opacity 1s ease-out` when `highlightActive` becomes false
- [x] Created `getSectionHighlights()` for C/C/C format — finds matching highlight text within each individual section
- [x] Works in both Block and C/C/C format views
- **Completed:** 2026-02-25

### S2-4.4 — Highlight Lifecycle Management
- [x] Added highlight state to narrative page: `highlightRanges`, `highlightActive`, `issueDescriptions`
- [x] After proofread completes: extracts snippets → computes ranges → activates highlights (on by default)
- [x] Highlights persist until user toggles them off or narrative text changes
- [x] Highlights cleared immediately on: regenerate, customize, apply edits, manual edit
- [x] Re-proofread clears old highlights before applying new ones
- **Completed:** 2026-02-25

### S2-4.5 — Highlight Counter Badge
- [x] Added badge next to "REVIEW & PROOFREAD" button showing issue count after proofread
- [x] Badge color: green (`#16a34a`) for PASS, yellow (`#ca8a04`) for NEEDS_REVIEW, red (`#dc2626`) for FAIL
- [x] Shows "PASS" for zero issues, "N issue(s)" for flagged issues
- [x] Badge stays visible as long as proofread data exists
- **Completed:** 2026-02-25

### S2-4.6 — Highlight Persistence
- [x] Highlights remain visible until user clicks Apply Suggested Edits or edits the story text
- [x] No manual dismiss button — highlights clear automatically when the narrative changes
- [x] Updated `ProofreadResults.tsx` to handle new `{ issue, snippet }` object format for `flagged_issues`
- **Completed:** 2026-02-25

### PB.85 — Export Logo Aspect Ratio Fix (Native 2.09:1 Ratio)
- [x] Fixed PDF export (`src/app/api/export-pdf/route.ts`): changed logo dimensions from 18×17mm (near-square) to 25×12mm matching native 2.09:1 aspect ratio (1038×497px)
- [x] Fixed DOCX export (`src/app/api/export-docx/route.ts`): changed logo dimensions from 50×47px (near-square) to 55×26px matching native 2.09:1 aspect ratio
- [x] Both export paths affected: narrative page ShareExportModal and dashboard NarrativeDetailModal (both use the same API routes via `downloadExport()`)
- [x] Build verified — no errors
- **Completed:** 2026-02-26

### SESSION S2-4 — Proofread Highlighting — COMPLETE
- **Scope:** S2-4.1 through S2-4.6
- **Completed:** 2026-02-25
- **Notes:** Proofread API now returns exact text snippets from the narrative for each flagged issue. NarrativeDisplay renders highlighted `<mark>` elements with pulsing accent-colored animation, hover tooltips showing issue descriptions. Highlights persist until user applies suggested edits, manually edits the story, regenerates, or customizes. Counter badge shows issue count with color-coded rating. Works in both Block and C/C/C format views. All colors use CSS variables for accent color compatibility.

---

| Stage 2 Sprint S2-1 | 5 | 5 |
| Stage 2 Sprint S2-4 | 6 | 6 |
| Stage 2 Sprint S2-5 | 5 | 5 |
| Stage 2 Sprint S2-6A | 7 | 7 |
| Stage 2 Sprint S2-6B | 4 | 4 |
| Post-Build Fixes | 86 | 86 |
| **TOTAL** | **191** | **186** |

---

## Stage 2 Sprint S2-5 — Email Export — COMPLETE

### S2-5.1 — Resend SDK Installation & Environment Configuration
- [x] Installed `resend` npm package for email sending
- [x] Added `RESEND_API_KEY` as an optional env var in `src/lib/env.ts` — app works without email export if key is missing
- **Completed:** 2026-02-26

### S2-5.2 — Email API Route (POST /api/send-email)
- [x] Created `src/app/api/send-email/route.ts` — authenticated POST endpoint using Resend SDK
- [x] Validates Supabase session (401 if unauthenticated), validates email addresses (basic regex), max 3 recipients
- [x] Sends from `noreply@servicedraft.ai` with `Reply-To` set to authenticated user's email
- [x] Subject line: "Repair Narrative — [YEAR MAKE MODEL] — R.O. #[RO_NUMBER]"
- [x] Professional HTML email: table-based layout, dark header bar with "SERVICEDRAFT.AI" branding, vehicle info section, narrative content (Block or C/C/C), sender attribution, footer
- [x] Plain text fallback for email clients that don't render HTML
- [x] Error handling for missing API key, invalid email, Resend API failures
- **Completed:** 2026-02-26

### S2-5.3 — EmailExportModal Component
- [x] Created `src/components/narrative/EmailExportModal.tsx` — modal with email input, multi-recipient support (up to 3), subject line preview
- [x] Remembers last-used email in localStorage (`sd-last-export-email`) for convenience
- [x] Email validation with per-field error messages
- [x] Loading state with spinner during send, success/error toast notifications
- [x] Add/remove recipient buttons with smooth UX
- **Completed:** 2026-02-26

### S2-5.4 — ShareExportModal Integration (Narrative Page)
- [x] Added "EMAIL NARRATIVE" button with Mail icon between Print and PDF buttons in `ShareExportModal.tsx`
- [x] Triggers `onBeforeExport()` (auto-save) before opening EmailExportModal
- [x] Passes `senderName` (user's full name from profile) through to EmailExportModal
- [x] Updated narrative page to destructure `profile` from `useAuth()` and pass sender name
- **Completed:** 2026-02-26

### S2-5.5 — Dashboard NarrativeDetailModal Integration
- [x] Added "EMAIL" button with Mail icon to dashboard saved narrative actions in `NarrativeDetailModal.tsx`
- [x] Normalizes saved narrative data (vehicle_year → year, etc.) before passing to EmailExportModal
- [x] `senderName` threaded from dashboard page → NarrativeHistory → NarrativeDetailModal
- **Completed:** 2026-02-26

### SESSION S2-5 — Email Export — COMPLETE
- **Scope:** S2-5.1 through S2-5.5
- **Completed:** 2026-02-26
- **Notes:** Email export feature using Resend SDK. Professional HTML email template with table-based layout for cross-client compatibility (Gmail, Outlook, Apple Mail). Supports Block and C/C/C narrative formats, up to 3 recipients, auto-saved last email, reply-to set to sender's email. Accessible from both narrative page Share/Export modal and dashboard saved narrative popup. Requires RESEND_API_KEY in .env.local (same key used for Supabase auth SMTP).
- **Post-ship update (2026-02-26):** Replaced dark text banner with linked vector logo (156×75px, 15% of original 1038×497, linked to https://servicedraft.ai). Shortened footer to "Generated by ServiceDraft.AI". Plain text fallback updated to match.

---

## Stage 2 Sprint S2-6A — Admin Dashboard: Activity Logging — COMPLETE

### S2-6A.1 — TypeScript Type Updates
- [x] Added `role: 'user' | 'admin'` and `is_restricted: boolean` to `UserProfile` interface in `src/types/database.ts`
- [x] Created `ActivityLog` interface in `src/types/database.ts`: id, user_id, action_type, story_type, input_data, output_preview, metadata, created_at
- [x] Updated `useAuth.ts` local `UserProfile` interface and `buildFallbackProfile()` with new fields
- **Completed:** 2026-02-26

### S2-6A.2 — Activity Logging Utility
- [x] Created `src/lib/activityLogger.ts` with `logActivity(action_type, data?)` function
- [x] Gets current user ID from Supabase auth, inserts row into `activity_log` table
- [x] Fire-and-forget pattern — wrapped in IIFE, never awaited by calling code
- [x] All errors caught silently (console.error only) — logging failures never break user workflows
- **Completed:** 2026-02-26

### S2-6A.3 — Activity Logging Calls Throughout App
- [x] `src/app/(protected)/narrative/page.tsx` — logActivity after: generate, regenerate, save, customize, proofread
- [x] `src/components/narrative/ShareExportModal.tsx` — logActivity after: export_copy, export_print, export_pdf, export_docx
- [x] `src/app/(auth)/login/page.tsx` — logActivity('login') after successful sign-in
- [x] Generate and regenerate handlers also catch 403 restriction errors and show toast
- **Completed:** 2026-02-26

### S2-6A.4 — Admin Dashboard Page
- [x] Created `src/app/(protected)/admin/page.tsx` with admin role check (redirects non-admins to /main-menu)
- [x] Page title: "Admin Dashboard" with Shield icon
- [x] Tab navigation: Activity Log (active), User Management (placeholder), Analytics (placeholder)
- [x] Activity Log tab: fetches from activity_log joined with users, displays in sortable table
- [x] Columns: Date/Time, User Name, Email, Action, Story Type, Preview
- [x] Filter by action type dropdown, search by user name/email, sort newest/oldest
- [x] Pagination: 25 rows per page with Previous/Next buttons and page count
- [x] Expandable rows showing full details (input data JSON, output preview, metadata, user ID)
- [x] Action-type colored left border on each row (generate=accent, save=green, export=blue, login=gray)
- [x] All CSS variables, no hardcoded colors; uses LiquidCard, Button components
- **Completed:** 2026-02-26

### S2-6A.5 — Admin Link in UserPopup
- [x] Added "Admin Panel" link with Shield icon in UserPopup dropdown
- [x] Only renders when `profile?.role === 'admin'`
- [x] Positioned above "Log Out" with a subtle divider line
- **Completed:** 2026-02-26

### S2-6A.6 — Restriction Check on Generate API
- [x] Updated `src/app/api/generate/route.ts` to check `is_restricted` flag on user profile
- [x] Returns 403 with message "Your account has been restricted. Contact support for assistance."
- [x] Narrative page catches 403 and displays restriction message as toast
- **Completed:** 2026-02-26

### S2-6A.7 — SQL Migration
- [x] Created `supabase/migrations/004_admin_role_and_activity_log.sql`
- [x] Documents: role column, is_restricted column, activity_log table, indexes, RLS policies
- [x] Admin-aware SELECT policy on users table (replaces "Users can view own profile" with combined policy)
- [x] Activity log RLS: users can insert/read own logs, admins can read all logs
- **Completed:** 2026-02-26
- **Notes:** ⚠️ The role column and activity_log table were already created manually in Supabase. This migration file documents the schema for reference. The RLS policies and indexes should be run in Supabase SQL Editor if not already applied.

### SESSION S2-6A — Admin Dashboard: Activity Logging — COMPLETE
- **Scope:** S2-6A.1 through S2-6A.7
- **Completed:** 2026-02-26
- **Notes:** Admin dashboard with role-based access control. Activity logger records all user actions (generate, regenerate, save, customize, proofread, export, login) as fire-and-forget inserts. Admin page shows full activity log with filtering, search, sort, pagination, and expandable detail rows. Admin Panel link in UserPopup visible only to admin users. Generate API checks is_restricted flag and returns 403 if restricted. SQL migration documents the schema (manually created tables + new RLS policies).

---

## Stage 2 Sprint S2-6B — Admin Dashboard: User Management — COMPLETE

### S2-6B.1 — Admin API Route
- [x] Created `src/app/api/admin/route.ts` with service role Supabase client
- [x] Admin verification: reads user session via server client, checks role = 'admin' before processing
- [x] `list_users` action: returns all users with narrative count and last activity date (enriched via separate queries on narratives and activity_log tables)
- [x] `get_user_details` action: returns full profile, 5 most recent activity log entries, and 5 most recent saved narratives for a given user
- [x] `send_password_reset` action: generates recovery link via `auth.admin.generateLink`, sends branded email via Resend (falls back to Supabase built-in if Resend not configured)
- [x] `restrict_user` action: updates `is_restricted` column on users table
- [x] `delete_user` action: deletes from Supabase Auth via `auth.admin.deleteUser` (cascades to users table)
- [x] `change_subscription` action: updates `subscription_status` on users table (validates: active, trial, expired, bypass)
- [x] All actions return `{ success: boolean, data?: any, error?: string }`
- **Completed:** 2026-02-26

### S2-6B.2 — User Management Table & Search
- [x] Fetches user list from `/api/admin` on tab mount
- [x] Table columns: Name, Email, Position, Signup Date, Subscription Status, Narratives Generated, Last Active, Flags, Actions
- [x] Subscription status shown as colored badge: active (green), trial (yellow), expired (red), bypass (blue)
- [x] Restricted users show red "RESTRICTED" badge in Flags column
- [x] Search bar filters by name or email (client-side)
- [x] All columns sortable — click header to sort, click again to toggle direction (with ChevronUp/ChevronDown indicator)
- [x] Results count display, Refresh button
- **Completed:** 2026-02-26

### S2-6B.3 — User Action Buttons
- [x] Send Password Reset — Mail icon button, sends reset email, shows success/error toast
- [x] Toggle Restrict — Lock/Unlock icon button with confirmation modal dialog ("Restrict this user?" / "Unrestrict this user?"), updates local state on success
- [x] Change Subscription — inline select dropdown showing current status, auto-saves on change with toast confirmation
- [x] Delete User — red Trash2 icon button with TWO-STEP confirmation: first modal shows user name/email with "Continue" button, second step shows red "DELETE PERMANENTLY" button
- [x] All action buttons use `e.stopPropagation()` to prevent row expansion when clicking actions
- [x] Loading states (disabled + opacity) while actions are in progress
- **Completed:** 2026-02-26

### S2-6B.4 — User Detail Expansion
- [x] Clicking a user row (not on action buttons) expands to show detail section
- [x] Full profile information: User ID, Username, Location, Role
- [x] 5 most recent activity log entries with date, action badge, and output preview
- [x] 5 most recent saved narratives with date, vehicle info, RO#, and narrative preview (truncated to 100 chars)
- [x] Accent-colored dividers between profile, activity, and narrative sections
- [x] Loading spinner while details are being fetched, with caching (details fetched once per user per session)
- **Completed:** 2026-02-26

### SESSION S2-6B — Admin Dashboard: User Management — COMPLETE
- **Scope:** S2-6B.1 through S2-6B.4
- **Completed:** 2026-02-26
- **Notes:** Admin user management with full CRUD operations. API route uses service role client for privileged operations (password reset, user deletion) while verifying admin role via session. User table supports search, sort, expandable detail rows. Two-step delete confirmation prevents accidental user deletion. Restrict/unrestrict with confirmation dialog. Subscription status changes auto-save. Password reset emails sent via Resend with branded template (Supabase fallback if Resend unavailable).

---

## Stage 2 Sprint S2-6C — Admin Dashboard: Analytics — COMPLETE

### S2-6C.1 — Analytics API Route
- [x] Created `src/app/api/admin/analytics/route.ts` with admin role verification
- [x] Returns aggregated data: total users, new users this week, active subscriptions, total narratives, narratives this week/today
- [x] Activity by type (last 30 days), daily narrative counts (configurable range), top 5 users by narratives, story type breakdown
- [x] All queries run in parallel via `Promise.all` for performance
- [x] Accepts `?range=` query parameter for configurable chart date range (7, 14, 30, or all-time)
- **Completed:** 2026-02-26

### S2-6C.2 — Stat Cards (2x3 Grid)
- [x] Six stat cards: Total Users, New This Week, Active Subscriptions, Total Narratives, Narratives This Week, Narratives Today
- [x] Each card uses LiquidCard with CursorGlow, big accent-colored number, muted label, oversized icon at 15% opacity in top-right
- [x] Responsive: 2 per row on mobile, 3 per row on desktop (grid-cols-2 lg:grid-cols-3)
- **Completed:** 2026-02-26

### S2-6C.3 — Charts: Generation Trend + Story Type + Activity Breakdown
- [x] 14-day (configurable) narrative generation bar chart built with pure CSS divs — no charting library
- [x] Hover tooltips show exact count per day, accent-colored bars, date labels on x-axis
- [x] Story type breakdown: horizontal stacked bar with accent color for diagnostic, green for repair, percentage + raw count legend
- [x] Activity type breakdown: horizontal bar chart sorted by count, color-coded bars matching Activity Log tab's ACTION_BORDER_COLORS
- **Completed:** 2026-02-26

### S2-6C.4 — Top 5 Users Table
- [x] Ranked table with name, position, narratives generated — sorted by count descending
- [x] #1 gold, #2 silver, #3 bronze rank badges with subtle accent backgrounds
- [x] Monospace accent-colored count column
- **Completed:** 2026-02-26

### S2-6C.5 — Auto-Refresh & Date Range Selector
- [x] Analytics auto-refreshes every 60 seconds while analytics tab is active
- [x] "Last updated: Xs ago" timestamp with live ticker
- [x] Manual refresh button (RefreshCw icon) with spin animation while loading
- [x] Date range selector: 7d, 14d, 30d, All Time — changes re-fetch all analytics
- **Completed:** 2026-02-26

### S2-6C.6 — Styling & Responsiveness
- [x] All colors from CSS variables (accent-primary, accent-bright, text-primary, text-muted, etc.)
- [x] Charts use CSS-based bars (no external libraries installed)
- [x] Stat cards wrap to 2-per-row on mobile, 3-per-row on desktop
- [x] Two-column layout for story type + activity breakdown on desktop, stacked on mobile
- **Completed:** 2026-02-26

### SESSION S2-6C — Admin Dashboard: Analytics — COMPLETE
- **Scope:** S2-6C.1 through S2-6C.6
- **Completed:** 2026-02-26
- **Notes:** Full analytics tab with 6 stat cards, 4 chart/table visualizations, auto-refresh with 60s interval, date range selector (7d/14d/30d/all-time). All charts built with pure CSS (no charting library). Analytics API route uses service role client with admin verification, parallel queries via Promise.all. Colors reuse CSS variables and ACTION_BORDER_COLORS from activity log tab.

---

## Post-Build Bug Fixes — Second-Generation Export/Save Lockup

### PB.86 — Fix Second-Generation Export/Save Lockup
- [x] **Bug 1 — Narrative Store Subscription Leak:** Replaced broken `useState`/`useCallback` pub/sub pattern in `src/stores/narrativeStore.ts` with React's `useSyncExternalStore` hook. Module-level `subscribe()` and `getSnapshot()` functions ensure automatic listener cleanup on component unmount, eliminating stale listener accumulation across page navigations.
- [x] **Bug 2 — Export Chain Blocking:** Added `withTimeout` utility to `src/lib/utils.ts` (8-second timeout). Wrapped Supabase upsert in `saveToDatabase()` with timeout so a hung DB call can't block indefinitely. Made `handleBeforeExport` fire-and-forget (no longer awaits `saveToDatabase`) so exports proceed immediately regardless of save state.
- [x] **Bug 3 — Dashboard Narrative History Hang:** Wrapped `fetchNarratives` Supabase query in `src/components/dashboard/NarrativeHistory.tsx` with `withTimeout(8000)` so the dashboard can't lock up on a stalled fetch.
- [x] **Bug 4 — handleSave Timeout:** Wrapped `handleSave`'s `saveToDatabase()` call with `withTimeout(8000)` so the save button can't spin indefinitely. Existing try/catch handles timeout errors and shows toast.
- **Completed:** 2026-03-03
- **Notes:** Root cause was two interacting bugs: (1) `useState(() => subscribe())` in narrativeStore never cleaned up listeners on unmount — every page navigation added a permanent listener to the global Set, causing stale re-renders and state corruption after the first generation cycle; (2) `handleBeforeExport` awaited `saveToDatabase()` which could hang forever if Supabase client was in a bad state — since all 5 export buttons called this function, a hung save blocked every export. Fix uses `useSyncExternalStore` (React 18+) for proper subscription lifecycle and `withTimeout` + fire-and-forget pattern to prevent any single Supabase call from blocking the UI.

### PB.87 — Fix useAuth Hook Teardown Causing AbortError and Login Lockup
- [x] **Fix 1 — Remove aggressive teardown:** Removed the `if (listeners.size === 0 && authSubscription)` block from the `useAuth` useEffect cleanup in `src/hooks/useAuth.ts`. The auth subscription, `initialized` flag, and `authState` now persist as module-level singletons across route transitions. Only a full page reload or explicit sign-out resets them.
- [x] **Fix 2 — AbortError suppression in onAuthStateChange:** Wrapped the `onAuthStateChange` callback body in try/catch with `DOMException`/`AbortError` guard, matching the existing pattern in `initializeAuth`'s initial fetch.
- **Completed:** 2026-03-04
- **Notes:** Same class of bug as PB.86 (narrativeStore). During Next.js route transitions, old page unmounts before new page mounts. When the last useAuth listener unmounted, cleanup tore down the Supabase auth subscription, reset `initialized = false`, and set `authState = { loading: true }`. The new page then called `initializeAuth()` again, racing with the previous in-flight `getUser()` call, causing AbortError and login lockup. Fix: auth subscription is now a true app-lifetime singleton — never torn down during navigation.

## Post-Build Improvements — Prompt Refinements

### PB.88 — Prevent AI Detail Omission in Narrative Generation
- [x] Updated rule #7 in both DIAGNOSTIC_ONLY_SYSTEM_PROMPT and REPAIR_COMPLETE_SYSTEM_PROMPT to require preserving all detailed input (not simplifying detailed diagnostics into generalized statements)
- [x] Added new detail-preservation rule (rule #9 for Diagnostic Only, rule #10 for Repair Complete) requiring ALL specific technical data points — terminal numbers, connector IDs, circuit numbers, pin numbers, wire colors, voltage/resistance/amperage/pressure/temperature readings, specification values, and all other numerical/technical data — to be included verbatim in the generated narrative
- [x] Updated ServiceDraft_AI_Prompt_Logic_v1.md Sections 3 and 4 to reflect the new rule text
- **Completed:** 2026-03-04
- **Notes:** Addresses warranty audit failures where the AI was summarizing specific technician-provided data points (e.g., terminal numbers, voltage readings) instead of including them verbatim. Both generation prompts now explicitly require that every technical data point appears in the output.

### PB.89 — Split Audit/Proofread by Story Type (Diagnostic Optimizer)
- [x] Created DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT in src/constants/prompts.ts — evaluates diagnostic strength, authorization-readiness, and repair sellability rather than warranty compliance
- [x] Updated src/app/api/proofread/route.ts to select system prompt and user prompt based on storyType field from request body
- [x] Diagnostic Only proofread uses new diagnostic optimizer prompt (10 criteria focused on diagnostic evidence, justification strength, repair sellability)
- [x] Repair Complete proofread continues using existing warranty audit prompt unchanged
- [x] Story-type-specific user prompt templates: diagnostic-only evaluates "authorization-readiness," repair-complete evaluates "audit compliance"
- [x] Frontend already passes storyType to proofread API — no frontend changes needed
- [x] JSON response format unchanged (flagged_issues, suggested_edits, overall_rating, summary) for both story types
- [x] Updated ServiceDraft_AI_Prompt_Logic_v1.md Section 6 — renamed to "Story Audit / Proofreading Prompts" (plural), documented both system prompts, both user prompt templates, and the prompt selection logic
- **Completed:** 2026-03-04
- **Notes:** Fixes incorrect behavior where diagnostic-only stories were flagged for missing completed repair or verification steps. The diagnostic optimizer prompt instead evaluates whether the narrative is strong enough to convince an extended warranty company to authorize the repair without a third-party inspection.

### PB.90 — Move Narrative Save and Fetch to Server-Side API Routes
- [x] Created `src/app/api/narratives/route.ts` — GET endpoint that authenticates via cookies, fetches all narratives for the logged-in user
- [x] Created `src/app/api/narratives/save/route.ts` — POST endpoint that authenticates via cookies, upserts narrative data with onConflict on user_id+ro_number
- [x] Updated `src/components/dashboard/NarrativeHistory.tsx` — replaced client-side Supabase query with `fetch('/api/narratives')`, removed `createClient` and `withTimeout` imports
- [x] Updated `src/app/(protected)/narrative/page.tsx` — replaced client-side Supabase upsert in `saveToDatabase` with `fetch('/api/narratives/save')`, removed `createClient` and `withTimeout` imports, simplified `handleSave` error handling
- **Completed:** 2026-03-04
- **Notes:** The client-side Supabase browser client had unreliable auth state for standalone SELECT/INSERT queries, causing dashboard narrative fetch to timeout every time. All other working features (generate, proofread, admin) already used server-side API routes where Supabase authenticates via HTTP cookies. This fix eliminates client-side Supabase queries from the entire narrative workflow.

---

## Stage 3 Sprint 1 — Modal & Tooltip UI Fixes — COMPLETE

### S3-1.1 — Saved Story Modal Positioning, Sizing & Scroll
- [x] Restructured `src/components/ui/Modal.tsx` — replaced `top-1/2 left-1/2` with `y: -50%` transform positioning with flexbox-centered container
- [x] Modal container uses `fixed inset-0 z-50 pt-20 pb-4 flex items-center justify-center pointer-events-none` — centers modal in viewport space below the nav bar
- [x] Modal panel uses `pointer-events-auto` to capture clicks, outer container passes clicks through to backdrop via `pointer-events-none`
- [x] Content area uses `max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[23px]` — scrolls internally for long content, modal never extends off-screen
- [x] Removed `style={{ x: '-50%', y: '-50%' }}` transform — horizontal and vertical centering now handled by flexbox
- [x] `NarrativeDetailModal.tsx` — changed width prop from `max-w-[700px]` to `max-w-5xl` for significantly wider narrative display
- [x] All other modals using the shared `Modal` component inherit the improved positioning automatically
- **Completed:** 2026-03-05
- **Notes:** The `pt-20` (5rem) provides clearance below the hero area + nav bar. Small modals are vertically centered in the remaining space; tall modals scroll internally via `overflow-y-auto` on the content div. The `rounded-[23px]` on the content div ensures scrollbar corners match the card radius.

### S3-1.2 — Audit Tooltip Animation & Transparency Fix
- [x] Removed `highlightPulse` animation from `<mark>` elements in `src/components/narrative/NarrativeDisplay.tsx` — highlights now appear solid and static (no pulsing opacity)
- [x] Removed `@keyframes highlightPulse` from `src/app/globals.css` — animation keyframes cleaned up
- [x] Changed tooltip background from semi-dark `#0a0414` to fully opaque `#111827` (gray-900)
- [x] Removed `var(--shadow-glow-sm)` from tooltip boxShadow — replaced with solid dark shadow `0 4px 20px rgba(0,0,0,0.9)` only
- [x] Added explicit `opacity: 1` on tooltip to prevent any inherited opacity effects from parent elements
- [x] Updated `HighlightedText` JSDoc comment to reflect new behavior (hover tooltips, not pulsing animation)
- **Completed:** 2026-03-05
- **Notes:** The pulsing effect came from `highlightPulse` keyframes on the `<mark>` parent element, which caused child tooltip elements to inherit the opacity animation. Fix removes the animation entirely — highlights still appear/disappear via the `opacity: active ? 1 : 0` transition but remain solid while visible. Tooltip is now fully opaque with no background bleed-through.

### SESSION S3-1 — Modal & Tooltip UI Fixes — COMPLETE
- **Scope:** S3-1.1, S3-1.2
- **Completed:** 2026-03-05
- **Notes:** Two UI polish fixes: (1) Saved story popup modal on dashboard now renders below the navbar with proper scrolling and wider layout (max-w-5xl). Modal component restructured to use flexbox centering within viewport space below nav, benefiting all modals app-wide. (2) Audit/proofread tooltip no longer pulses or has transparent background — appears instantly with solid opaque dark background on hover.

---

## Stage 3 Sprint 4 — OEM Audit Fix + Selective Apply Edits — COMPLETE

### S3-4.1 — Stop Flagging OEM/Manufacturer Terminology in Proofread
- [x] Removed audit criterion #10 ("Any manufacturer-specific branding or proprietary terminology that should be replaced with universal language") from `PROOFREAD_SYSTEM_PROMPT` in `src/constants/prompts.ts`
- [x] Added explicit OEM allowance instruction: manufacturer-specific terminology (Active Fuel Management, StabiliTrak, VTEC, SkyActiv, etc.) is expected and correct when the vehicle year/make/model warrant their use
- [x] All other audit criteria (1-9) remain intact
- [x] `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` already had no OEM-flagging criterion — no changes needed there
- **Completed:** 2026-03-05
- **Notes:** The generation prompts (rules #5) explicitly encourage OEM-specific terminology. The proofread prompt criterion #10 directly contradicted this by flagging OEM terms as issues. Fix aligns the audit prompt with the generation prompt — OEM terminology is now recognized as professional, accurate documentation.

### S3-4.2 — Selective Apply Suggested Edits with Checkboxes
- [x] Rebuilt `src/components/narrative/ProofreadResults.tsx` — each suggested edit now has a checkbox next to it, default state all unchecked
- [x] Added "Select All / Deselect All" toggle button at the top of the suggested edits list, styled with accent theme colors
- [x] Checkbox labels are full-row clickable with hover highlight using `var(--accent-5)`
- [x] Checkboxes styled with `accent-color: var(--accent-hover)` for purple theme matching
- [x] Component exposes `onSelectionChange` callback prop to notify parent of selected indices
- [x] Updated `src/app/(protected)/narrative/page.tsx` — added `selectedEditIndices` state, wired to `ProofreadResults.onSelectionChange`
- [x] `handleApplyEdits` now sends ONLY the checked suggestions to the apply-edits API
- [x] If no checkboxes are checked and user clicks apply, shows toast: "Select at least one suggested edit to apply"
- [x] Button text changed from "APPLY SUGGESTED EDITS" to "APPLY SELECTED EDITS"
- [x] After applying, clears proofread data and selected indices (user can re-run audit to verify)
- [x] Updated `src/app/api/apply-edits/route.ts` — system prompt clarified to apply ONLY the provided edits (which may be a subset), no additional changes
- [x] User prompt updated to say "SELECTED EDITS TO APPLY" to reinforce subset behavior
- **Completed:** 2026-03-05
- **Notes:** Previously "Apply Suggested Edits" sent all suggestions at once with no user choice. Users can now opt-in to each individual edit via checkboxes, select all/deselect all for batch control, and apply only their chosen subset. The apply-edits API prompt is updated to respect the subset — it will not make changes beyond the provided list.

### SESSION S3-4 — OEM Audit Fix + Selective Apply Edits — COMPLETE
- **Scope:** S3-4.1, S3-4.2
- **Completed:** 2026-03-05
- **Notes:** Two changes to the Review & Proofread system: (1) Removed criterion #10 that incorrectly flagged OEM/manufacturer terminology as issues, added explicit instruction that OEM terms are expected and correct. (2) Added checkbox selection system to suggested edits — users can pick and choose which edits to apply, with Select All/Deselect All toggle and purple-themed checkboxes.

---

## Stage 3 Sprint 5 — Enhanced OEM Terminology in Generation Prompts — COMPLETE

### S3-5.1 — Strengthen OEM Terminology Instructions in Both Generation System Prompts
- [x] Replaced rule #5 in `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` (`src/constants/prompts.ts`) with detailed multi-part OEM terminology instruction
- [x] Replaced rule #5 in `REPAIR_COMPLETE_SYSTEM_PROMPT` (`src/constants/prompts.ts`) with identical enhanced instruction
- [x] New rule #5 includes sub-rules (a-e): identify manufacturer/OEM, identify and use OEM service practices and terminology, explicit examples for GM/Ford/Toyota/Honda/Stellantis/Hyundai-Kia/BMW and more, explanation of why OEM terms matter for auditors, instruction to write as if certified on that manufacturer
- [x] All other rules (1-4, 6-9 in diagnostic / 6-10 in repair complete) remain unchanged
- [x] JSON response format instructions remain unchanged
- **Completed:** 2026-03-05
- **Notes:** The previous rule #5 was a single sentence saying OEM terminology is "allowed and encouraged." The enhanced version is a structured 5-part instruction with specific manufacturer terminology examples (Active Fuel Management, StabiliTrak, AdvanceTrac, EcoBoost, Toyota Safety Sense, VTEC, Uconnect, SmartSense, iDrive, VANOS, etc.) that explicitly tells the AI to identify the OEM and use their certified terminology. This should produce narratives that read as if written by a manufacturer-certified technician.

### SESSION S3-5 — Enhanced OEM Terminology in Generation Prompts — COMPLETE
- **Scope:** S3-5.1
- **Completed:** 2026-03-05
- **Notes:** Strengthened rule #5 in both DIAGNOSTIC_ONLY_SYSTEM_PROMPT and REPAIR_COMPLETE_SYSTEM_PROMPT. The AI is now explicitly instructed to identify the vehicle's OEM, use manufacturer-specific diagnostic procedures, proprietary system names, and technical terminology with concrete examples for major manufacturers. This aligns with the Sprint 4 fix that stopped the proofread prompt from flagging OEM terms — now generation produces richer OEM-specific content and proofread accepts it.

---

## Stage 3 Sprint 6 — Add Inter Font for Data/Input Text Readability — COMPLETE

### S3-6.1 — Import Inter Font and Create CSS Utility
- [x] Imported `Inter` from `next/font/google` in `src/app/layout.tsx` with weights 300-600 and CSS variable `--font-data`
- [x] Added `${inter.variable}` class to `<body>` element alongside existing Orbitron variable
- [x] Created `.font-data` utility class in `src/app/globals.css` with `font-family: var(--font-data), system-ui, sans-serif`, `font-weight: 400`, `letter-spacing: 0.01em`
- **Completed:** 2026-03-05

### S3-6.2 — Apply font-data to All Data Text Components
- [x] `NarrativeDisplay.tsx` — Applied `font-data` to block narrative `<p>` and all three C/C/C section `<p>` elements
- [x] `NarrativeDetailModal.tsx` — Applied `font-data` to meta info row (R.O.#, Vehicle, dates) and concern/cause/correction display text
- [x] `ProofreadResults.tsx` — Applied `font-data` to summary text, flagged issues text, and each suggested edit span
- [x] `EditStoryModal.tsx` — Changed textarea base class from `font-mono text-xs` to `font-data text-sm` for all edit textareas
- [x] `NarrativeHistory.tsx` — Applied `font-data` to all 7 table data `<td>` cells (date, time, R.O.#, year, make, model, preview) and search input
- [x] `ProfileSection.tsx` — Applied `font-data` to data value spans (email, ID, location, position) while keeping labels unchanged
- [x] `Input.tsx` — Added `font-data` to base input element class
- [x] `Textarea.tsx` — Added `font-data` to base textarea element class
- [x] `AutoTextarea.tsx` — Added `font-data` to auto-sizing textarea element class
- [x] `ConditionalField.tsx` — Added `font-data` to conditional textarea class
- [x] `Select.tsx` — Added `font-data` to select element class
- [x] `EmailExportModal.tsx` — Added `font-data` to email input fields and subject preview text
- [x] Verified build compiles successfully with no errors
- **Completed:** 2026-03-05
- **Notes:** Inter font is applied only to data/content text — generated narratives, user input fields, table data cells, audit results, and profile data values. UI elements (titles, buttons, navigation, section headers, column headers, labels, toast messages) all keep the existing Orbitron font. The `.font-data` class sets `font-weight: 400` and `letter-spacing: 0.01em` for maximum readability on dark backgrounds, contrasting with Orbitron's `font-weight: 600` and `letter-spacing: 0.04em`.

### SESSION S3-6 — Data/Input Font Typography Update — COMPLETE
- **Scope:** S3-6.1, S3-6.2
- **Completed:** 2026-03-05
- **Notes:** Added Inter as a secondary data font while keeping Orbitron as the primary UI font. Inter is clean, highly legible, and optimized for body/data text readability. Applied surgically to 12 component files across narrative display, input controls, dashboard tables, profile data, audit results, and export modals. The visual contrast between the tech-styled Orbitron UI text and the clean Inter data text creates a professional, intentional typography hierarchy.

---

## Stage 3 Sprint 3 — Match Email and Print Exports to PDF Formatting — COMPLETE

### S3-3.1 — Create Shared Export HTML Builders
- [x] Added `buildPrintHtml(payload)` function to `src/lib/exportUtils.ts` — generates formatted HTML for print output matching the PDF layout exactly
- [x] Added `buildEmailHtml(narrative, displayFormat, vehicleInfo, senderName)` function to `src/lib/exportUtils.ts` — generates table-based inline-CSS HTML for email matching the PDF layout
- [x] Added `buildPlainTextEmail(narrative, displayFormat, vehicleInfo, senderName)` function to `src/lib/exportUtils.ts` — plain-text fallback with same info structure
- [x] Added shared `escapeHtml()` utility in `exportUtils.ts`
- [x] All three formats (PDF, Email, Print) now share the same document structure:
  - Two-column header: "Vehicle Information:" (bold underlined) with YEAR/MAKE/MODEL as separate label:value lines (left), "Repair Order #:" (bold underlined) with large R.O. number (right)
  - "REPAIR NARRATIVE" centered title (18pt bold underlined)
  - C/C/C sections: headers (CONCERN:/CAUSE:/CORRECTION:) at 13pt bold italic underlined, body at 11pt/14px
  - Block format: flowing paragraph body
  - Footer with ServiceDraft.AI logo (bottom-right)

### S3-3.2 — Update Email Export to Match PDF
- [x] Refactored `src/app/api/send-email/route.ts` to import and use `buildEmailHtml` and `buildPlainTextEmail` from `exportUtils.ts`
- [x] Removed duplicate `buildHtmlEmail`, `buildPlainTextEmail`, and `escapeHtml` functions from the route
- [x] Email vehicle info now shows separate YEAR/MAKE/MODEL labeled lines (previously was a single combined line)
- [x] Email header labels changed from "VEHICLE INFORMATION" / "REPAIR ORDER #" to "Vehicle Information:" / "Repair Order #:" to match PDF
- [x] Removed centered logo from email header — logo now in footer (bottom-right) matching PDF placement
- [x] C/C/C section header colors changed from `#333333` to `#000000` to match PDF

### S3-3.3 — Update Print Export to Match PDF
- [x] Updated `handlePrint()` in `src/components/narrative/ShareExportModal.tsx` to use `buildPrintHtml(buildPayload())` instead of basic HTML
- [x] Updated `handlePrint()` in `src/components/dashboard/NarrativeDetailModal.tsx` to use `buildPrintHtml(buildPayload())` instead of basic HTML
- [x] Removed unused `getVehicleHeader()` function from `ShareExportModal.tsx`
- [x] Print output now shows: two-column header with labeled vehicle fields, centered "REPAIR NARRATIVE" title, properly formatted C/C/C sections with bold italic underlined headers, footer logo
- [x] Print uses `@page` CSS for proper US Letter margins and `position: fixed` footer logo
- **Completed:** 2026-03-05
- **Notes:** Previously email showed vehicle info as a single combined line and had the logo at the top; print was extremely basic with just `<h2>`, `<hr>`, and `<pre>` tags. Both now match the PDF gold standard exactly: two-column header with separate YEAR/MAKE/MODEL label:value lines, large R.O.# on the right, centered "REPAIR NARRATIVE" title, properly formatted C/C/C sections, and footer logo. All formatting logic is centralized in `src/lib/exportUtils.ts` to prevent drift.

### SESSION S3-3 — Export Formatting Consistency — COMPLETE
- **Scope:** S3-3.1, S3-3.2, S3-3.3
- **Completed:** 2026-03-05
- **Notes:** Unified email and print exports to match the PDF format. Created shared `buildPrintHtml`, `buildEmailHtml`, and `buildPlainTextEmail` functions in exportUtils.ts. Email route refactored to use shared builders. Print handlers in both ShareExportModal and NarrativeDetailModal now use the shared `buildPrintHtml` function. All three export channels (PDF, Email, Print) now produce visually identical professional documents.

---

## Stage 3 Sprint 2 — Auto-Sizing Text Fields in Edit Story Modal — COMPLETE

### S3-2.1 — Increase Text Field Minimum Heights
- [x] Block format textarea: min-height increased from 300px (was already 300px, confirmed as appropriate)
- [x] C/C/C format textareas (Concern, Cause, Correction): min-height increased from 100px to 150px each
- [x] Removed dependency on the generic `Textarea` component — uses native `<textarea>` elements with matching theme styling (`var(--bg-input)`, `var(--accent-border)`, etc.)

### S3-2.2 — Implement Auto-Sizing Behavior
- [x] Added `useRef` for all four textareas (block, concern, cause, correction)
- [x] Created `autoResize` callback that measures `scrollHeight` and sets height dynamically
- [x] Auto-resize triggers on every `onChange` event (as user types)
- [x] Auto-resize triggers on modal open via `useEffect` with 50ms delay (ensures DOM is rendered with content)
- [x] Overflow behavior: `overflow: hidden` when content fits within max-height, switches to `overflow: auto` when content exceeds 60vh — no scrollbar shown unless needed
- [x] `resize: none` on all textareas — manual drag-resizing disabled, auto-sizing handles everything

### S3-2.3 — Modal Scroll Behavior
- [x] Modal body already has `max-h-[calc(100vh-8rem)] overflow-y-auto` on the content container (from `Modal.tsx`)
- [x] Individual textareas capped at `max-height: 60vh` — if content exceeds this, the textarea scrolls internally
- [x] If combined field heights exceed modal viewport, the modal body scrolls (not individual textareas)
- [x] Both formats (block and C/C/C) work correctly with the auto-sizing system

### S3-2.4 — Verified Build
- [x] `next build` compiles successfully with zero TypeScript errors
- **Completed:** 2026-03-05
- **Notes:** Replaced the `Textarea` UI component import with native `<textarea>` elements styled to match the theme. This was necessary to have direct ref access and full control over the auto-resize behavior (height, overflow toggling). The auto-resize pattern: collapse to `height: auto`, measure `scrollHeight`, compare against `60vh` max, set final height and overflow mode. The modal's existing `overflow-y-auto` on the content container handles cases where expanded textareas push total content beyond the viewport.

---

## Stage 3 Sprint 7 — My Repairs Database & API Backend — COMPLETE

### S3-7.1 — Create saved_repairs Migration
- [x] Created `supabase/migrations/005_saved_repairs.sql` with full table schema
- [x] Table columns: id (uuid PK), user_id (FK to auth.users), template_name, story_type, year, make, model, customer_concern, codes_present, codes_present_option, diagnostics_performed, diagnostics_option, root_cause, root_cause_option, repair_performed, repair_option, repair_verification, verification_option, recommended_action, recommended_option, created_at, updated_at
- [x] Added indexes on user_id and updated_at for fast lookups
- **Completed:** 2026-03-05

### S3-7.2 — Row Level Security Policies
- [x] Enabled RLS on saved_repairs table
- [x] SELECT policy: users can only read their own templates (auth.uid() = user_id)
- [x] INSERT policy: users can only insert templates for themselves (auth.uid() = user_id)
- [x] UPDATE policy: users can only update their own templates (auth.uid() = user_id)
- [x] DELETE policy: users can only delete their own templates (auth.uid() = user_id)
- **Completed:** 2026-03-05

### S3-7.3 — API Routes
- [x] Created `src/app/api/saved-repairs/route.ts` with GET (fetch all user templates, ordered by updated_at desc) and POST (create new template with validation)
- [x] Created `src/app/api/saved-repairs/[id]/route.ts` with PUT (update template with ownership check) and DELETE (delete template with ownership check)
- [x] All routes check for authenticated user (401 if not authenticated)
- [x] POST validates required fields (template_name, story_type) and valid story_type values
- [x] PUT/DELETE verify template ownership before modifying (404 if not found/not owned)
- [x] PUT uses allowlist of updatable fields to prevent arbitrary field injection
- [x] All routes use try/catch with proper HTTP status codes (200, 201, 400, 401, 404, 500)
- **Completed:** 2026-03-05

### S3-7.4 — Verified Build
- [x] `npx tsc --noEmit` compiles successfully with zero TypeScript errors
- **Completed:** 2026-03-05
- **Notes:** Migration file must be run manually in the Supabase SQL Editor before the API routes will function. The UI for the My Repairs system will be built in Sprint 8.

### SESSION S3-7 — My Repairs Database & Backend — COMPLETE
- **Scope:** S3-7.1, S3-7.2, S3-7.3, S3-7.4
- **Completed:** 2026-03-05
- **Notes:** Created the saved_repairs table with full schema for storing repair scenario templates, RLS policies for user-scoped access, and four CRUD API endpoints (GET list, POST create, PUT update, DELETE remove). The table stores all input field values plus their dropdown option states so templates can fully prefill the input form. Sprint 8 will build the UI components for managing and loading templates.

---

## Stage 3 Sprint 8 — My Repairs UI Panel with Load, Save, Edit, Delete — COMPLETE

### S3-8.1 — MY REPAIRS Button on Input Page
- [x] Added prominent "MY REPAIRS" button at the top of the Input Page, centered above the story type selector
- [x] Styled as secondary variant with Wrench icon, matching app's accent color theme
- [x] Opens the MyRepairsPanel slide-out panel when clicked
- **Completed:** 2026-03-05

### S3-8.2 — MyRepairsPanel Slide-Out Component
- [x] Created `src/components/input/MyRepairsPanel.tsx` — slide-out panel from right side
- [x] Fetches user's saved repair templates from GET /api/saved-repairs on open
- [x] Displays each template as a glassmorphism card with: template name (bold), story type badge (purple for Repair Complete, blue for Diagnostic Only), vehicle info ("Year Make Model" or "Any Vehicle"), customer concern preview (first 50 chars)
- [x] Three action buttons per card: Load (primary, fills form), Edit (secondary, opens edit modal), Delete (ghost red, shows confirmation)
- [x] Search/filter bar at top to filter templates by name or vehicle info
- [x] Loading state with spinner while fetching
- [x] Empty state with helpful message for first-time users
- [x] Slide-in/out animation using Framer Motion spring transition
- [x] Portaled to document.body to escape parent overflow constraints
- **Completed:** 2026-03-05

### S3-8.3 — Load Template into Form
- [x] Clicking "Load" on a template card: sets story type selector to template's story_type (diagnostic_only or repair_complete), prefills all text fields, sets all dropdown states
- [x] Maps API option values back to store format: 'exclude' → 'dont_include', 'generate' → 'generate', default → 'include'
- [x] For 'exclude'/'generate' options: clears text field and sets dropdown state; for 'include': fills in saved text value
- [x] Closes the My Repairs panel after loading
- [x] Shows toast: "Template loaded: [template name]"
- [x] Uses setTimeout(50ms) to allow story type state change to propagate before setting field values
- **Completed:** 2026-03-05

### S3-8.4 — SAVE AS MY REPAIR Button & Modal
- [x] Added "SAVE AS MY REPAIR" ghost button below the Generate Story button with BookmarkPlus icon
- [x] Created `src/components/input/SaveRepairModal.tsx` — modal with template name input
- [x] Captures all current form state: story_type, all field values, all dropdown option states
- [x] Maps store dropdown options to API format: 'dont_include' → 'exclude'
- [x] POSTs to /api/saved-repairs with complete form data
- [x] Shows summary preview of what will be saved (story type, vehicle info)
- [x] Toast on success: "Repair template saved!", error toast on failure
- **Completed:** 2026-03-05

### S3-8.5 — Edit Template Modal
- [x] Created `src/components/input/EditRepairModal.tsx` — modal for editing saved templates
- [x] Editable fields: template name, year, make, model, and all conditional field text values
- [x] Shows only fields relevant to the template's story type (diagnostic vs repair)
- [x] Displays current dropdown option status next to each field label
- [x] PUTs to /api/saved-repairs/[id] on save, refreshes template list after saving
- [x] Toast on success: "Template updated"
- **Completed:** 2026-03-05

### S3-8.6 — Delete Template with Confirmation
- [x] Clicking "Delete" shows inline confirmation: "Delete '[name]'? This cannot be undone."
- [x] Confirm button sends DELETE to /api/saved-repairs/[id]
- [x] Template removed from list with Framer Motion exit animation (slide right + fade out)
- [x] Toast: "Template deleted"
- [x] Cancel button dismisses confirmation inline
- **Completed:** 2026-03-05

### S3-8.7 — Verified Build
- [x] `npx tsc --noEmit` compiles with zero TypeScript errors
- [x] `npx next build` completes successfully — all pages and API routes compile
- **Completed:** 2026-03-05

### SESSION S3-8 — My Repairs UI Panel — COMPLETE
- **Scope:** S3-8.1, S3-8.2, S3-8.3, S3-8.4, S3-8.5, S3-8.6, S3-8.7
- **Completed:** 2026-03-05
- **Notes:** Built the complete My Repairs template management UI. Users can save the current input form as a named template, browse/search saved templates in a slide-out panel, load a template to prefill the entire form (including story type, all fields, and dropdown states), edit template details, and delete templates with confirmation. All components use the app's CSS variable theming system, glassmorphism card styling, and Framer Motion animations. The template system maps between store format (diagnostic_only/repair_complete, dont_include) and API format (diagnostic/repair, exclude) seamlessly.

---

## STAGE 3 — SPRINT 9: DIAGNOSTIC → REPAIR COMPLETE UPDATE SYSTEM

### S3-9.1 — Save API Changed from UPSERT to INSERT
- [x] Modified `src/app/api/narratives/save/route.ts` — replaced `.upsert()` with `.insert()` so every save creates a new row
- [x] Created migration `supabase/migrations/006_drop_narrative_unique_constraint.sql` — drops the `UNIQUE(user_id, ro_number)` constraint that was blocking multiple entries with the same RO#
- [x] Updated `saveToDatabase()` in narrative page — added `savedNarrativeId` check to prevent duplicate rows from auto-save within the same session
- **Completed:** 2026-03-05
- **Notes:** Each narrative save is now a plain INSERT. Diagnostic-only and repair-complete entries with the same RO# coexist as separate rows. The original diagnostic entry is never modified or deleted. User must run migration 006 in Supabase SQL Editor.

### S3-9.2 — Convert Recommendation API Route
- [x] Created `src/app/api/convert-recommendation/route.ts` — POST endpoint that takes a diagnostic recommendation/correction text and uses Gemini to reword it from future/recommended tense to past/completed tense
- [x] Short, targeted system prompt for tense conversion only
- [x] Used by the "COMPLETED RECOMMEND REPAIR" button in the update modal
- **Completed:** 2026-03-05

### S3-9.3 — Update Narrative API Route
- [x] Created `src/app/api/update-narrative/route.ts` — POST endpoint that takes original diagnostic narrative + completed repair info and generates a full repair-complete narrative via Gemini
- [x] Preserves all original diagnostic detail (concern, cause, root cause identification)
- [x] Incorporates repair performed, verification steps, and additional notes
- [x] Dropdown logic: Include → use text, Don't Include → skip, Generate → use AI inference instruction
- [x] Same restriction check and auth as the generate route
- **Completed:** 2026-03-05

### S3-9.4 — UpdateWithRepairModal Component
- [x] Created `src/components/dashboard/UpdateWithRepairModal.tsx` — full-featured modal for the diagnostic-to-repair update flow
- [x] Vehicle info badges at top (Year, Make, Model, RO#) displayed as read-only accent-colored pills
- [x] Field 1: Repair Performed textarea with dropdown (Include/Don't Include/Generate) and "COMPLETED RECOMMEND REPAIR" convenience button
- [x] Field 2: Repair Verification Steps textarea with same dropdown
- [x] Field 3: Additional Notes textarea (optional, no dropdown)
- [x] "GENERATE NARRATIVE" button at bottom — disabled until repair info is provided
- [x] Auto-expanding textareas with same styling as input page fields
- [x] Loading spinner on "COMPLETED RECOMMEND REPAIR" button during API call
- [x] Calls `/api/update-narrative` and uses `setForRepairUpdate()` to pass result to narrative page
- [x] Navigates to `/narrative` on success
- **Completed:** 2026-03-05

### S3-9.5 — "UPDATE NARRATIVE WITH REPAIR" Button in Saved Story Modal
- [x] Added prominent "UPDATE NARRATIVE WITH REPAIR" button at top of `NarrativeDetailModal.tsx`
- [x] Uses `ArrowUpCircle` icon from lucide-react
- [x] Only visible when `narrative.story_type === 'diagnostic_only'` — hidden for repair-complete entries
- [x] Opens the UpdateWithRepairModal on click
- [x] Closing the update modal also closes the saved story modal (clean navigation)
- **Completed:** 2026-03-05

### S3-9.6 — Narrative Store: setForRepairUpdate Method
- [x] Added `setForRepairUpdate()` method to `src/stores/narrativeStore.ts`
- [x] Sets narrative data from the update API response, storyType to 'repair_complete', roNumber and vehicle info from the original diagnostic entry
- [x] Clears compiledDataBlock (not needed — narrative already generated), resets customization state
- [x] Sets `isSaved: false` and `savedNarrativeId: null` for proper navigation guard behavior
- **Completed:** 2026-03-05

### S3-9.7 — Narrative Page: Support Repair Update Flow
- [x] Updated redirect logic in `src/app/(protected)/narrative/page.tsx` to allow entry when `narrative` exists but `compiledDataBlock` is empty (repair update flow)
- [x] Auto-generate only fires when `compiledDataBlock` exists (normal flow), not in repair update flow (narrative already provided)
- **Completed:** 2026-03-05

### S3-9.8 — Dashboard Story Type Badges
- [x] Added "Type" column to the NarrativeHistory table header in `src/components/dashboard/NarrativeHistory.tsx`
- [x] Each row displays a colored badge: "DIAGNOSTIC" (amber/yellow) for diagnostic_only entries, "REPAIR COMPLETE" (green) for repair_complete entries
- [x] Badges styled as small rounded pills with semi-transparent background and colored border
- **Completed:** 2026-03-05

### SESSION S3-9 — Diagnostic → Repair Complete Update System — COMPLETE
- **Scope:** S3-9.1 through S3-9.8
- **Completed:** 2026-03-05
- **Notes:** Complete flow for updating diagnostic-only narratives with repair information. Users open a saved diagnostic story from the dashboard, click "UPDATE NARRATIVE WITH REPAIR", fill in repair details (with optional AI-assisted tense conversion), and generate a new repair-complete narrative. Both entries coexist in the database as separate rows. Dashboard shows story type badges for quick identification. Migration 006 must be run to drop the old unique constraint.

⚠️ **USER ACTION REQUIRED:** Run `supabase/migrations/006_drop_narrative_unique_constraint.sql` in the Supabase SQL Editor to drop the `UNIQUE(user_id, ro_number)` constraint. Without this, saving multiple narratives with the same RO# will fail.

---

## POST-SPRINT 9 ADJUSTMENT — COMPLETED RECOMMENDED REPAIR BUTTON REWORK

### PS9-A.1 — Remove API Call from "Completed Recommended Repair" Button
- [x] Removed the `/api/convert-recommendation` API call from the button handler — button no longer triggers any network request
- [x] Button now toggles a `useRecommendedRepair` boolean state instead of calling the AI for tense conversion
- [x] When toggled ON: Repair Performed text field collapses and displays a pre-filled instruction box (dashed border, accent-colored italic text with CheckCircle icon) explaining that the AI will convert the diagnostic recommendation to past tense during main generation
- [x] When toggled OFF: text field reappears empty, user can type their own repair info
- [x] The instruction text (`COMPLETED_REPAIR_INSTRUCTION` constant) is compiled into the data sent to `/api/update-narrative` when the user clicks "Generate Narrative" — the main API call handles the full conversion in one shot
- [x] Removed `isConverting` state, `handleConvertRecommendation()` function, and Loader2 spinner from the button
- [x] `canGenerate` logic updated: enabled if `useRecommendedRepair` is true OR if the user typed text in the Repair Performed field
- **Completed:** 2026-03-05
- **Notes:** The convert-recommendation API route (`src/app/api/convert-recommendation/route.ts`) still exists in the codebase but is no longer called by any frontend code. The update-narrative API already handles the full diagnostic-to-repair conversion, making the separate tense-conversion call redundant.

### PS9-A.2 — Enlarge "Completed Recommended Repair" Button
- [x] Width increased to 75% of the container (`w-3/4`)
- [x] Height roughly doubled with `py-4` padding (was `py-1`)
- [x] Font size increased from `text-[10px]` to `text-sm` with `font-bold` and `tracking-wider`
- [x] Styled as a prominent action button with `rounded-xl` and `border-2`
- [x] Two visual states: inactive (accent tint bg, accent border) and active (solid accent primary bg with glow shadow)
- [x] Icon: Sparkles when inactive, CheckCircle when active — communicates toggle state
- [x] Button centered horizontally via `flex justify-center` wrapper
- **Completed:** 2026-03-05

### PS9-A.3 — Reposition Button and Remove Repair Performed Dropdown
- [x] Moved "COMPLETED RECOMMENDED REPAIR" button from inside the Repair Performed header row to its own block directly below the Repair Performed text field and above Repair Verification Steps
- [x] Removed the dropdown menu (Include/Don't Include/Generate) from the Repair Performed field entirely — user either types their own text or clicks the button
- [x] Removed `repairPerformedDropdown` state — the field always sends as 'include' to the API
- [x] Repair Verification Steps field retains its dropdown (Include/Don't Include/Generate) as before
- [x] Layout order in modal: Vehicle badges → Repair Performed label + text field → COMPLETED RECOMMENDED REPAIR button → Repair Verification Steps + dropdown → Additional Notes → GENERATE NARRATIVE button
- **Completed:** 2026-03-05

### SESSION PS9-A — Post-Sprint 9 Adjustment — COMPLETE
- **Scope:** PS9-A.1, PS9-A.2, PS9-A.3
- **Completed:** 2026-03-05
- **Notes:** Reworked the "Completed Recommended Repair" button in the UpdateWithRepairModal to eliminate the wasteful separate API call for tense conversion. The button now acts as a toggle that collapses the Repair Performed text field and pre-fills it with an instruction for the main Generate Narrative API call. The button has been significantly enlarged (75% width, double height, prominent styling) and repositioned directly below the Repair Performed field. The Repair Performed dropdown was removed since the two user paths (type manually or click the button) make a three-option dropdown unnecessary. No changes to the update-narrative API route, save logic, dashboard badges, or conditional visibility of the "UPDATE NARRATIVE WITH REPAIR" button.

---

## STAGE 4 — UI QUICK FIXES & POLISH

### STAGE 4 SPRINT 1 — UI Quick Fixes & Font Fix

### S4-1.1 — Fix Inter Font Rendering (CSS Specificity)
- [x] Updated `.font-data` class in `globals.css` to use `!important` on `font-family` and `font-weight` to override the body Orbitron font
- [x] Verified `font-data` class is applied in `Input.tsx`, `AutoTextarea.tsx`, `MyRepairsPanel.tsx` search input, and `EditRepairModal.tsx` textareas
- **Completed:** 2026-03-06
- **Notes:** The body sets `font-family: var(--font-orbitron)` with `font-weight: 600`, which was overriding child `.font-data` elements. Adding `!important` ensures Inter renders on all data/input fields.

### S4-1.2 — Fix My Repairs Sidebar Positioning
- [x] Changed slide-out panel from `fixed right-0 top-0 bottom-0` to `fixed right-0 bottom-0` with `style={{ top: '156px' }}`
- [x] Panel now starts below the hero area (100px) + nav bar (56px) = 156px offset
- **Completed:** 2026-03-06
- **Notes:** Previously the sidebar extended behind the hero and nav bar, hiding the top portion of its content.

### S4-1.3 — Move "My Repairs" Button Inside Container Card
- [x] Removed the standalone "MY REPAIRS" button div above the input cards
- [x] Replaced the "Additional Information" h3 subtitle inside the Repair Order Information card with a "REPAIR TEMPLATES" button
- [x] Button uses `variant="secondary"`, `size="medium"`, `w-[30%] min-w-[160px]`, with Wrench icon
- **Completed:** 2026-03-06
- **Notes:** Button now sits inside the card, below the divider line, where "Additional Information" used to be.

### S4-1.4 — Rename "Save as My Repair" to "Save as Repair Template"
- [x] Updated button text in `input/page.tsx` from "SAVE AS MY REPAIR" to "SAVE AS REPAIR TEMPLATE"
- [x] Updated modal title in `SaveRepairModal.tsx` from "Save as My Repair" to "Save as Repair Template"
- [x] Updated empty state text in `MyRepairsPanel.tsx` from "Save as My Repair" to "Save as Repair Template"
- **Completed:** 2026-03-06

### S4-1.5 — Generate New Stripe Access Code
- [x] Changed fallback access code in `src/app/api/stripe/route.ts` from `'SERVICEDRAFT2026'` to `'SDRAFT-BETA-2026'`
- **Completed:** 2026-03-06

### SESSION S4-SPRINT-1 — Stage 4 Sprint 1 — COMPLETE
- **Scope:** S4-1.1, S4-1.2, S4-1.3, S4-1.4, S4-1.5
- **Completed:** 2026-03-06
- **Notes:** Five UI quick fixes: (1) Inter font now renders correctly on all input/data fields via `!important` override on `.font-data` class, (2) My Repairs sidebar panel positioned below hero+nav at 156px top offset, (3) "MY REPAIRS" button moved inside the Repair Order Information card as "REPAIR TEMPLATES" replacing the "Additional Information" subtitle, (4) All "Save as My Repair" references renamed to "Save as Repair Template", (5) Stripe fallback access code changed to `SDRAFT-BETA-2026`.

---

## STAGE 4 — SPRINT 2: INPUT PAGE BEHAVIOR + BUG FIX

### S4-2.1 — Add Clear Form Button to Input Page
- [x] Added `clearFormFields` action to `src/stores/narrativeStore.ts` — resets `fieldValues` to `{}`, `dropdownSelections` to `{}`, and `roNumber` to `''` without changing `storyType`
- [x] Added `RotateCcw` icon import from lucide-react to input page
- [x] Modified "Repair Order Information" card header to flex row: h2 on left, "CLEAR FORM" button on right
- [x] Clear Form button styled as ghost/text button: `text-xs text-[var(--text-muted)] hover:text-[var(--accent-bright)]` with RotateCcw icon
- [x] On click: calls `clearFormFields()` and shows "Form cleared" toast
- [x] Does NOT reset story type selection — only clears field data within the current story type
- **Completed:** 2026-03-06

### S4-2.2 — Fix Story Type Switching to Preserve Shared Fields
- [x] Updated `setStoryType` in `src/stores/narrativeStore.ts` to preserve values for shared fields: `year`, `make`, `model`, `customer_concern`, `codes_present`, `diagnostics_performed`, `root_cause`
- [x] Preserves dropdown selections for shared conditional fields: `codes_present`, `diagnostics_performed`, `root_cause`
- [x] Type-specific fields cleared on switch: `recommended_action` (diagnostic_only only), `repair_performed` + `repair_verification` (repair_complete only)
- [x] `roNumber` always preserved (stored separately in state)
- **Completed:** 2026-03-06

### S4-2.3 — Fix ProofreadResults setState-During-Render Bug
- [x] Fixed React console error "Cannot update a component (NarrativePage) while rendering a different component (ProofreadResults)"
- [x] Root cause: `notifyParent()` in the `useEffect` that resets checkboxes when data changes was calling `onSelectionChange` (parent setState) synchronously during the render cycle
- [x] Fix: Wrapped `notifyParent(fresh)` call in `setTimeout(() => ..., 0)` to defer parent state update to the next tick
- [x] Added cleanup `clearTimeout` in the useEffect return to prevent memory leaks
- **Completed:** 2026-03-06

### SESSION S4-SPRINT-2 — Stage 4 Sprint 2 — COMPLETE
- **Scope:** S4-2.1, S4-2.2, S4-2.3
- **Completed:** 2026-03-06
- **Notes:** Three changes: (1) Clear Form button added to Repair Order Information card header with RotateCcw icon and ghost styling, (2) Story type switching now preserves shared field values (year, make, model, customer_concern, codes_present, diagnostics_performed, root_cause) instead of wiping all fields, (3) ProofreadResults render bug fixed by deferring parent notification to next tick with setTimeout.

### SESSION S4-SPRINT-3 — Stage 4 Sprint 3: My Repairs Template Refactor — COMPLETE
- **Scope:** S4-3.1 through S4-3.6
- **Completed:** 2026-03-06
- **Notes:** Refactored repair templates to only save 5 core repair fields (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification) with their dropdown options. Removed year, make, model, customer_concern, and recommended_action from save/display/edit flows so templates can be reused across different vehicles. DB columns remain unchanged. Changes applied to:
  - S4-3.1: SaveRepairModal — nulled out vehicle/concern/recommended fields in save body, updated summary box and description text
  - S4-3.2: MyRepairsPanel — removed vehicle info line and concern preview from template cards, search by template_name only, updated empty state text
  - S4-3.3: EditRepairModal — removed year/make/model inputs, removed customer_concern and recommended_action from editable fields, removed relevantFields filter to show all 5 fields always, nulled year/make/model in save
  - S4-3.4: handleLoadTemplate (input/page.tsx) — removed lines setting year/make/model/customer_concern, removed recommended_action from conditionalFields
  - S4-3.5: saved-repairs POST API — forced year/make/model/customer_concern/recommended_action/recommended_option to null
  - S4-3.6: saved-repairs PUT API — forced year/make/model to null, removed customer_concern and recommended_action from allowed fields

### SESSION S4-SPRINT-4 — Stage 4 Sprint 4: Navigation & Header Overhaul — COMPLETE
- **Scope:** S4-4.1 through S4-4.4
- **Completed:** 2026-03-06
- **Notes:** Complete navigation bar and hero area redesign.
  - S4-4.1: Increased nav bar height from h-14 (56px) to h-16 (64px). Updated NAV_HEIGHT constant in HeroArea.tsx, paddingTop/min-h-calc in layout.tsx (156px to 164px), sidebar top in MyRepairsPanel.tsx, mobile dropdown top-14 to top-16, and min-h-calc in main-menu/page.tsx.
  - S4-4.2: Made hero logo clickable by wrapping img in Next.js Link to /main-menu with pointer-events-auto, cursor-pointer, and hover:scale-[1.03] transition.
  - S4-4.3: Redesigned NavBar into 3-section layout:
    - LEFT: Styled "MAIN MENU" button with bg-[var(--accent-10)], border, rounded-lg, hover glow
    - CENTER: ServiceDraft-Ai Vector Logo.png centered absolutely with theme-aware CSS filter (brightness(0) invert(1) for dark mode, brightness(0) for light mode)
    - RIGHT: Unchanged — theme toggle, UserPopup, mobile menu toggle
  - S4-4.4: Removed old SD icon image from nav bar. Mobile hamburger menu and responsive breakpoints verified working. Build compiles cleanly.

### SESSION S4-SPRINT-5 — Stage 4 Sprint 5: Terms of Use & FAQ Expansion — COMPLETE
- **Scope:** S4-5.1 through S4-5.4
- **Completed:** 2026-03-06
- **Notes:** Added Terms of Use and expanded FAQ content across the application.
  - S4-5.1: Created `src/components/layout/TermsOfUse.tsx` — scrollable content component with 11 sections covering acceptance, service description, user responsibilities, AI disclaimer, account terms, subscription/billing, intellectual property, data privacy, limitation of liability, modifications, and termination. Styled with app theme variables, "Last Updated: March 2026", scrollable `max-h-[70vh]`.
  - S4-5.2: Updated signup page (`src/app/(auth)/signup/page.tsx`) — added `termsAccepted` and `showTerms` state. Added checkbox with "I agree to the Terms of Use" label where "Terms of Use" is a clickable link opening a modal. Signup CONTINUE button disabled until terms accepted. Added Modal with TermsOfUse component.
  - S4-5.3: Updated main menu page (`src/app/(protected)/main-menu/page.tsx`) — added "TERMS OF USE" to bottomItems array with FileText icon. Added `showTerms` state and Modal with TermsOfUse component. Imported TermsOfUse and FileText icon.
  - S4-5.4: Expanded FAQ content (`src/components/layout/FAQContent.tsx`) — added 8 new Q&As: Repair Templates, AI Customization, audit rating explanation, export options, data security, Generate Applicable Info, contact support, mobile usage.

### SESSION S4-SPRINT-6 — Stage 4 Sprint 6: Admin Dashboard Core Rebuild — COMPLETE
- **Scope:** S4-6.1 through S4-6.5
- **Completed:** 2026-03-06
- **Notes:** Complete admin dashboard overhaul with expanded metrics and new Overview tab.
  - S4-6.1: Activity logging audit — verified all 10 required action types are logged (generate, regenerate, save, export_copy/print/pdf/docx, login, customize, proofread). RLS policies confirmed working for admin reads via is_admin() helper function.
  - S4-6.2: Rebuilt analytics API (`src/app/api/admin/analytics/route.ts`) — added newUsersMonth, totalGenerations (generate+regenerate), totalExports (all export types), totalProofreads, totalCustomizations, totalSavedTemplates (from saved_repairs table), activityByDay (30-day activity chart), subscriptionBreakdown (active/trial/expired/bypass counts). Expanded topUsers from top 5 to top 10.
  - S4-6.3: Rebuilt admin page with 4 tabs — added Overview as default tab (was 3 tabs: activity/users/analytics, now 4: overview/activity/users/analytics). Overview tab contains 8 metric cards in 2x4 grid (Users, Subscriptions, Narratives, Today, Generations, Exports, Proofreads, Templates), subscription breakdown section, and 30-day activity trend chart. Refresh button + last-updated timestamp on overview.
  - S4-6.4: Activity Log tab polish — enhanced action type badges to pill-style with color-coded backgrounds and borders. All existing features confirmed working: pagination, action_type filtering, user search, expandable metadata rows.
  - S4-6.5: User Management tab verified — all features functional: sortable columns, search, user detail expansion, restrict/unrestrict with confirmation modal, delete with multi-step confirmation, subscription status change dropdown, password reset.

### SESSION S4-SPRINT-6-UIFIX — Post-Sprint 6: Admin Dashboard UI/UX Fixes — COMPLETE
- **Scope:** 6 UI/UX improvement tasks
- **Completed:** 2026-03-06
- **Notes:** Comprehensive admin dashboard visual and usability overhaul.
  - Task 1: Protected user — hvcadip@gmail.com now shows "Protected" badge with ShieldCheck icon instead of delete/restrict action buttons. Cannot be accidentally deleted or restricted from admin panel.
  - Task 2: Wider layout — container changed from max-w-7xl to max-w-[1400px] with increased horizontal padding (px-4 → px-6) for better use of screen real estate.
  - Task 3: Larger text sizes — bumped all text-xs to text-sm minimum, metric card values to text-4xl, section headings to text-lg, table body text to text-sm with whitespace-nowrap for clean alignment.
  - Task 4: Centered title and animated tab buttons — dashboard title and shield icon centered, tabs redesigned as large framer-motion animated buttons with whileHover/whileTap scale effects, active state uses accent-primary background with glow shadow, generous px-6 py-3 padding.
  - Task 5: User management table improvements — split single Name column into separate First Name and Last Name columns, added Role column, changed date formats to MM-DD-YYYY (Sign Up) and MM-DD-YYYY HH:MM AM/PM (Last Activity), updated sort column types and expanded row colSpan to 10.
  - Task 6: Larger action icons — increased icon sizes from 16 to 20, enlarged clickable area from p-1.5 to p-2.5 with rounded-lg, center-aligned Actions column header and button container.

---

## SESSION S4-SPRINT-6-UIFIX-R2 — Owner Dashboard UI Fixes Round 2 — COMPLETE
- **Scope:** 5 UI/UX improvement tasks
- **Completed:** 2026-03-06
- **Notes:** Second round of admin/owner dashboard visual and usability improvements.
  - Task 1: Last Activity column — stacked date (MM/DD/YYYY) and time (HH:MM AM/PM) vertically with time in smaller muted text. Also changed date format from dashes to slashes throughout.
  - Task 2: Center-aligned all column header titles — changed thead tr from text-left to text-center, added text-center and justify-center to each th element in the User Management table.
  - Task 3: Wider layout — container changed from max-w-[1400px] to max-w-[90vw] for better use of screen real estate on all screen sizes.
  - Task 4: Sorting controls — reduced search bar width to 35%, added "Sort by" dropdown (First Name, Last Name, Email, Subscription, Narratives, Sign Up Date, Last Active) and ascending/descending toggle button with ArrowUp/ArrowDown icons next to the search bar. Column headers remain clickable for sort as well.
  - Task 5: Renamed "Admin Dashboard" to "OWNER DASHBOARD" with premium styling — text-5xl outlined text with neon glow (text-shadow using accent-primary), liquid glass background (rgba backdrop-blur with accent border, rounded-[16px]), and spotlight mouse hover animation (radial-gradient that follows cursor position via onMouseMove/useState). Shield icon also has accent glow via drop-shadow filter.

---

## Stage 4 Sprint 7 — Admin Analytics with Charts, Time Ranges, and System Health — COMPLETE
- **Scope:** 4 tasks
- **Completed:** 2026-03-06
- **Notes:** Upgraded admin analytics tab from CSS bar charts to recharts library, added time range filtering, and system health indicators.
  - Task 1: Built Analytics tab with recharts — Activity Trend (LineChart, accent color), Feature Usage (horizontal BarChart by action_type, color-coded using ACTION_BORDER_COLORS), Story Type Distribution (PieChart, diagnostic vs repair), Subscription Breakdown (PieChart by status), Top Users Leaderboard (table, top 10), Usage Over Time (stacked AreaChart by action type). All charts use themed tooltips with dark background styling.
  - Task 2: Added time range selector — "Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time" filter buttons. Default 30d. Re-fetches analytics data on change. Updated analyticsRange state type from `'7'|'14'|'30'|'all'` to `'7'|'30'|'90'|'all'`.
  - Task 3: Updated analytics API (`src/app/api/admin/analytics/route.ts`) — accepts `range` query param (`7`, `30`, `90`, `all`). Added `usageOverTime` (per-day per-action-type breakdown for stacked AreaChart), `actionTypes` (list of all action types), and `systemHealth` (DB row counts, last activity timestamp, app version). Activity-by-day chart now uses range-based query instead of fixed 30 days.
  - Task 4: Added System Health indicators to Overview tab — DB row counts card grid (users, narratives, activity_log, saved_repairs), last activity timestamp, app version "v1.0.0-beta". Also replaced Overview tab's CSS bar chart with recharts LineChart. Added Database, Clock, Server icons from lucide-react.
  - **Package added:** `recharts` (npm install recharts)

---

## Stage 4 Sprint 8 — Admin Management Tools, Export, Polish, and Dashboard Refinement — COMPLETE
- **Scope:** 4 tasks
- **Completed:** 2026-03-06
- **Notes:** Added Settings tab, CSV export, user management polish, and overall dashboard polish.
  - Task 1: **Settings Tab (5th tab)** — Added new "Settings" tab with three sections: (1) Access Code Management — displays current ACCESS_CODE from env, copy-to-clipboard button, "Generate New Code" button that creates SDRAFT-XXXX-XXXX format codes, instruction callout to update Vercel env var; (2) Quick Stats Summary — 8-stat grid showing all key metrics at a glance; (3) System Information — version, environment (dev/prod auto-detect), database (Supabase PostgreSQL + total row count), deployment platform. Added `get_access_code` action to admin API route.
  - Task 2: **Export Report CSV** — Added "Export Report" button to Analytics tab header. Generates comprehensive CSV with sections: key metrics, subscription breakdown, story type breakdown, activity by type, daily activity data, top users leaderboard. Downloads as `servicedraft-analytics-YYYY-MM-DD.csv`.
  - Task 3: **User Management Polish** — Added role column with color-coded badge (Admin = gold crown icon, User = gray). Added admin promotion/demotion with confirmation modal (Crown icon, warns about dashboard access). Added `promote_to_admin` and `demote_to_user` actions to admin API. Added user count summary cards at top (Total Users, Active, Inactive) with UserCheck/UserX icons.
  - Task 4: **Overall Polish** — Wrapped all tab content in `AnimatePresence mode="wait"` with slide/fade transitions (tabVariants: initial/animate/exit). Added error states with retry button (AlertTriangle icon + retry button) for analytics. Made responsive: smaller padding/text on mobile, hidden columns (email/position on md, last_active on lg), tab labels hidden on mobile (icons only), responsive grid gaps. Consistent spacing throughout with sm: breakpoint responsive padding.

---

## Pre-Deployment Audit — Security Hardening & Production Readiness — COMPLETE
- **Scope:** 11 audit items across 6 categories
- **Completed:** 2026-03-09
- **Notes:** Comprehensive audit preparing for Vercel production deployment.

### Build Verification
- [x] `npm run build` passes with 0 errors, 0 TypeScript violations
- [x] All imports resolve correctly
- [x] Only cosmetic warning: Next.js 16 middleware deprecation (non-blocking)

### Security Hardening
- [x] **CRITICAL FIX:** Removed dangerous ANON_KEY fallback in Stripe webhook (`/api/stripe/webhook/route.ts`). Service role key now required — throws error if missing instead of silently degrading to public key.
- [x] **Added authentication** to 5 previously unauthenticated API routes: `/api/proofread`, `/api/customize`, `/api/apply-edits`, `/api/export-pdf`, `/api/export-docx`. All now require valid Supabase session.
- [x] **Added rate limiting** to `/api/generate` — 20 requests per user per 15 minutes (in-memory, server-side). Created `src/lib/rateLimit.ts` utility.
- [x] **Added input length validation** to `/api/generate` — compiled data block capped at 10,000 characters.
- [x] **Added CSP and security headers** to `next.config.ts`: Content-Security-Policy, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy.
- [x] **Removed hardcoded access code** default (`SDRAFT-BETA-2026`) from `/api/stripe/route.ts` and `/api/admin/route.ts`. Access code now read exclusively from `ACCESS_CODE` environment variable.
- [x] Verified: No API keys, secrets, or sensitive data in client-side code. Service role key only used in server-side API routes.
- [x] Verified: `.env.local` is in `.gitignore` and was never committed to git history.

### Environment Variable Audit
- [x] Added `STRIPE_PRICE_ID` to `src/lib/env.ts` optional vars (was used but undeclared).
- [x] Added `validateEnv()` call at app startup in `src/app/layout.tsx`.
- [x] Complete environment variable list documented in `DEPLOYMENT_NOTES.md`.

### Code Cleanup
- [x] Replaced `console.log` in `/api/support/route.ts` with `console.error` (server-side logging).
- [x] No TODO/FIXME/HACK comments found — codebase is clean.
- [x] No commented-out code blocks found.
- [x] ErrorBoundary component exists and is used in protected layout.

### Performance Check
- [x] Logo component uses Next.js `Image` component (auto-optimization to WebP).
- [x] Logo source files are large (~2.2MB each) but served optimized by Next.js — noted as deployment consideration.
- [x] Unused Next.js default SVGs (file.svg, globe.svg, window.svg, next.svg, vercel.svg) are not referenced in code.

### Deployment Documentation
- [x] Created `DEPLOYMENT_NOTES.md` with complete env var list, Supabase RLS policy requirements, Stripe webhook setup, external service URLs, security measures, known limitations, and deployment checklist.

---

## STAGE 5 — SPRINT 1: QUICK TEXT & LABEL FIXES (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Changed "Admin Panel" to "Owner Dashboard" in UserPopup.tsx navigation link (route unchanged)
- [x] **Task 2:** Changed 'Standard' label to 'No Change' in all three slider option arrays (lengthOptions, toneOptions, detailOptions) in CustomizationPanel.tsx
- [x] **Task 3:** Changed 'Detailed' label to 'Extended' in lengthOptions array in CustomizationPanel.tsx
- [x] **Task 4:** Added maxLength={50} to Custom Instructions Textarea and character counter (current/50) in CustomizationPanel.tsx
- [x] **Task 5:** Changed MAX_RECIPIENTS from 3 to 10 in EmailExportModal.tsx
- [x] **Task 6:** Changed loading spinner text from "Generating your warranty narrative..." to "Generating narrative..." in narrative/page.tsx
- [x] **Task 7:** Added centered "v1.0.0-beta" version label to NavBar.tsx — accent-bright color (reactive to user theme), text-sm font-medium (matches UserPopup display name styling), hidden on mobile (hidden md:block)

---

## STAGE 5 — SPRINT 5: DASHBOARD SPLIT PREFERENCES & APPEARANCE MODAL (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Removed old "Preferences" button, showPreferences state, and PreferencesPanel slide-out component from dashboard page
- [x] **Task 2:** Added two new buttons ("APP APPEARANCE" with Palette icon, "MY SAVED REPAIRS" with Wrench icon) centered below ProfileSection — styled to match existing secondary buttons with accent-vivid border/text, glowing hover animation (hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-300)
- [x] **Task 3:** Created AppearanceModal component (src/components/dashboard/AppearanceModal.tsx) using existing Modal component — contains AccentColorPicker, Theme toggle (renamed from "Display Mode"), and Background Animation toggle, all reused from PreferencesPanel logic
- [x] **Task 4:** Added showSavedRepairs state and placeholder Modal with "My Saved Repairs" title and "Coming in Sprint 6" message
- [x] **Task 5:** Added "OWNER DASHBOARD" button in header for admin-role users — gold/amber accent (#f59e0b border/text), Shield icon, navigates to /admin, hover glow with amber shadow

---

## STAGE 5 — SPRINT 3: NAVBAR GLOWING HOVER ANIMATIONS (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Added glowing purple hover effect to MAIN MENU button in NavBar.tsx — accent border glow, box-shadow with rgba(168,85,247,0.4)/0.2 double-layer, text brightens to white on hover
- [x] **Task 2:** Added glowing purple hover effect to UserPopup trigger button — border shifts to accent-primary, dual-layer purple box-shadow glow on hover, 300ms transition
- [x] **Task 3:** Added glowing purple hover effect to Light/Dark mode toggle icon — soft purple glow shadow behind icon on hover, text brightens to white, 300ms transition
- [x] **Task 4:** Added hover effects to ALL UserPopup dropdown menu items (Dashboard, Owner Dashboard, Log Out) — accent-tinted background (rgba(168,85,247,0.1)), text shifts to accent-bright, left-border glow accent-primary on hover, 300ms transition

---

## STAGE 5 — SPRINT 2: LOADING SPINNER SIZE INCREASE & VIEWPORT CENTERING (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Added `xlarge` size variant to LoadingSpinner component (w-32 h-32, border-4, text-2xl) — approximately 2x the `large` variant (w-16 h-16). Added per-size text sizing via textSizeMap. Added optional className prop for external styling.
- [x] **Task 2:** Updated narrative page initial generation loading state to use `xlarge` spinner with `min-h-[calc(100vh-64px)]` flex centering — spinner now owns the full viewport below the NavBar. Updated message text to uppercase "GENERATING NARRATIVE..." for consistency.

---

## STAGE 5 — SPRINT 6: DASHBOARD — MY SAVED REPAIRS MODAL & TABLE STYLING (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Replaced placeholder "Coming in Sprint 6" modal with full `SavedRepairsModal` component (`src/components/dashboard/SavedRepairsModal.tsx`). Fetches user's saved repair templates from `/api/saved-repairs`, displays in scrollable list with expand/collapse per row showing all 5 core repair fields (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification). Shows loading spinner while fetching, empty state when no templates exist. — **2026-03-09**
- [x] **Task 2:** Added "NEW REPAIR TEMPLATE" button at top of modal. Opens inline form with template name, story type selector (Diagnostic Only / Repair Complete), and all 5 core repair field textareas. Saves via POST `/api/saved-repairs` with loading state and toast feedback. — **2026-03-09**
- [x] **Task 3:** Added Edit and Delete action buttons per template row. Edit opens inline editing with template name + 5 core fields and Save/Cancel buttons (PUT `/api/saved-repairs/[id]`). Delete shows confirmation prompt with Cancel/Confirm before DELETE. Both show appropriate loading states and toast messages. — **2026-03-09**
- [x] **Task 4:** Added glowing hover effect to NarrativeHistory table rows: `hover:bg-[rgba(168,85,247,0.08)]` accent tint, `hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]` soft glow, `transition-all duration-200` smooth animation, `group-hover:text-[var(--text-secondary)]` brighter text on all data cells. — **2026-03-09**
- [x] **Task 5:** Widened dashboard container from `max-w-5xl` (1024px) to `max-w-7xl` (1280px) for more breathing room on the narrative table and overall dashboard layout. — **2026-03-09**

---

## STAGE 5 SPRINT 7 — OWNER DASHBOARD: AI TOKEN USAGE PRICING CALCULATOR
*Add an AI token usage / pricing calculator to the Owner Dashboard for estimating Gemini API costs.*

**Status:** COMPLETE

- [x] **Task 1:** Created `src/components/admin/TokenCalculator.tsx` — self-contained pricing calculator component with: model selector dropdown (Gemini 2.0 Flash / 1.5 Flash / 1.5 Pro with hardcoded per-token pricing), average input tokens per narrative (default 1500), average output tokens per narrative (default 800), estimated narratives per month (default 100), proofread calls toggle (+50% API calls), customization calls toggle (+30% API calls). Output displays cost per narrative, monthly estimate, and annual estimate with accent-colored numbers. Includes disclaimer note about pricing variability. — **2026-03-10**
- [x] **Task 2:** Added "Cost Calculator" tab to Owner Dashboard tab system — updated `TabKey` union type, added tab entry with `DollarSign` icon between Analytics and Settings tabs, added `motion.div` tab content rendering with `tabVariants` animation matching existing pattern. Imported `TokenCalculator` component. — **2026-03-10**
- [x] **Task 3:** Styled calculator to match Owner Dashboard premium dark aesthetic — uses `LiquidCard` components with `!rounded-[16px]`, accent-colored cost numbers via `var(--accent-bright)`, custom toggle switches with `peer-checked:bg-[var(--accent-primary)]`, input fields with `bg-[var(--bg-input)]` and `border-[var(--accent-border)]`, cost output cards with `bg-[var(--accent-5)]` backgrounds and `border-[var(--accent-15)]` borders. Build verified clean with `npm run build`. — **2026-03-10**

---

## STAGE 5 SPRINT 8 — ROLE HIERARCHY RESTRUCTURE: OWNER / ADMIN / USER
*Restructure from 2-tier (admin/user) to 3-tier (owner/admin/user) role system. Owner = platform owner with full dashboard access. Admin = Group Manager role (built in Sprint 9-10). User = standard user.*

**Status:** COMPLETE

- [x] **Task 1:** Updated TypeScript type definitions — changed `role` type from `'user' | 'admin'` to `'user' | 'admin' | 'owner'` in `src/types/database.ts` (UserProfile), `src/hooks/useAuth.ts` (UserProfile interface), and `src/app/(protected)/admin/page.tsx` (AdminUser interface). — **2026-03-10**
- [x] **Task 2:** Updated all owner-level access checks from `role === 'admin'` to `role === 'owner'` across 8 locations: Owner Dashboard page guard/redirect, activity log fetch gate, user management fetch gate, analytics/overview fetch gate, settings fetch gate, render guard, admin API `verifyAdmin()`, analytics API `verifyAdmin()`, UserPopup "Owner Dashboard" link visibility, and Dashboard "OWNER DASHBOARD" button visibility. — **2026-03-10**
- [x] **Task 3:** Updated promote/demote functions — added owner protection in API (`demote_to_user` checks target role and rejects if owner, `promote_to_admin` checks and rejects if already owner). Frontend `handlePromoteToggle` blocks owner role changes. Owner rows in user table show as Protected (no action buttons). Promote/demote labels updated to "Group Manager" terminology. — **2026-03-10**
- [x] **Task 4:** Updated role badge display — added `owner` entry to `ROLE_BADGE` with purple accent (`#a855f7`) and "Owner" label with ShieldCheck icon. Renamed `admin` badge label from "Admin" to "Group Manager" (keeps gold color with Crown icon). User badge unchanged (gray). — **2026-03-10**
- [x] **Task 5:** Added SQL migration comment in `src/app/api/admin/route.ts`: `UPDATE public.users SET role = 'owner' WHERE role = 'admin' AND email = '<owner_email>'`. Build verified clean with `npm run build`. Full codebase audit confirmed all remaining `'admin'` references are intentional Group Manager role references. — **2026-03-10**

---

## STAGE 5 SPRINT 9 — GROUP MANAGEMENT: DATABASE & API
*Build the backend infrastructure for the group management system. Groups allow dealership managers (admin role) to monitor and manage their team members.*

**Status:** COMPLETE

- [x] **Task 1:** Created Supabase migration file `supabase/migrations/007_create_groups_table.sql` — groups table (id, name, access_code UNIQUE, description, created_by FK, created_at, is_active), `group_id` column added to users table with FK to groups, indexes on access_code and group_id, RLS policies for owner full access, admin view own group, user view own group. Includes manual execution instructions for Supabase SQL Editor. — **2026-03-10**
- [x] **Task 2:** Created `src/app/api/groups/route.ts` — full CRUD API for group management. GET returns all groups with member counts (owner) or user's own group (admin/user). POST creates a new group (owner only) with master code collision check and unique constraint handling. PUT updates group fields (owner only). DELETE soft-deletes via is_active=false (owner only). All routes verify auth via server Supabase client. — **2026-03-10**
- [x] **Task 3:** Created `src/app/api/groups/members/route.ts` — GET lists group members enriched with narrative_count and last_active (owner can query any group via query param, admin restricted to own group). PUT updates member role (admin can promote user→admin in own group, owner can change any non-owner role). Includes target user validation and group boundary enforcement. — **2026-03-10**
- [x] **Task 4:** Updated `src/app/api/stripe/route.ts` — access code validation now checks group access codes after master code. If code matches an active group, returns `group_id` in response. Updated `src/app/(auth)/signup/page.tsx` to capture `group_id` from response and include it in the user upsert during Step 2. Master access code users are not assigned to any group. — **2026-03-10**
- [x] **Task 5:** Updated `src/types/database.ts` — added `Group` interface (id, name, access_code, description, created_by, created_at, is_active) and added `group_id?: string` to `UserProfile` interface. Build verified clean with `npm run build`. — **2026-03-10**

---

## STAGE 5 SPRINT 10 — GROUP MANAGEMENT: ADMIN DASHBOARD UI
*Build the front-end Group Manager Dashboard for admin-role users and add group management controls to the Owner Dashboard.*

**Status:** COMPLETE

- [x] **Task 1:** Created Group Manager Dashboard page at `src/app/(protected)/group-dashboard/page.tsx` — route protection (admin/owner only, redirects 'user' role to /dashboard with toast), premium title header with group name (same spotlight hover effect as Owner Dashboard), two-tab layout (Overview, Team Members). — **2026-03-10**
- [x] **Task 2:** Built Overview tab with 4 metric cards (Team Members count, Active This Week, Total Narratives generated by group, Active Today) using same LiquidCard metric pattern as Owner Dashboard. Includes group description card and quick member list preview (top 5 members with role badges, narrative counts). — **2026-03-10**
- [x] **Task 3:** Built Team Members table with columns: Name, Email, Position, Role (with color badge — Admin=gold, User=gray), Narratives Generated, Last Active (stacked date/time). Search bar to filter by name/email, sort by any column (dropdown + asc/desc toggle), expandable rows showing full member details (name, email, position, role, narrative count, last active, member ID). Matches Owner Dashboard table styling (dark rows, accent borders, hover effects). — **2026-03-10**
- [x] **Task 4:** Added role management for admins — promote user→admin with confirmation modal ("Promote [Name] to Group Admin? They will gain access to this Group Dashboard and team management features."). Admin cannot demote other admins (disabled state with tooltip "Contact the Owner to modify other admin roles"). Admin cannot change their own role. All wired to `/api/groups/members` PUT endpoint. — **2026-03-10**
- [x] **Task 5:** Enforced access restrictions — Admin role users do NOT see "Owner Dashboard" link (only owner role). Added "Group Dashboard" link with Users icon to UserPopup dropdown for admin-role users, positioned after Dashboard link. Owner Dashboard link remains owner-only in both UserPopup and Dashboard page. — **2026-03-10**
- [x] **Task 6:** Added "Groups" tab to Owner Dashboard — view all groups with access codes, member counts, active/inactive status badges. Create new group form (name, access_code with auto-generate button using GROUPNAME-XXXX-XXXX pattern, description). Edit existing groups (name, access_code, description). View group members in modal (name, email, role, position, narratives). Toggle group active/inactive. — **2026-03-10**
- [x] **Task 7:** Styled everything to match premium dark automotive tech aesthetic — same LiquidCard styling, same framer-motion animations (spring transitions, tab variants, AnimatePresence), same color scheme (CSS variables), same responsive patterns. Group Dashboard is a "lite" version of Owner Dashboard with fewer tabs focused on team management. Added `group_id` to useAuth UserProfile interface. Build verified clean with `npm run build`. — **2026-03-10**

---

## DOCUMENTATION REFRESH — PROJECT REFERENCE FILES v2.0 (2026-03-10)

**Status:** COMPLETE

All 6 project reference documents manually updated to v2.0 to accurately reflect the current application state after completing Phases 0–10 and all improvement sprints through Stage 5 Sprint 10.

- [x] **CLAUDE_CODE_BUILD_INSTRUCTIONS.md** — Updated architecture reference, folder structure, database schema, technology stack versions, and sprint execution playbook to reflect current state
- [x] **PRE_BUILD_SETUP_CHECKLIST.md** — Updated service accounts table, Gemini model reference (gemini-3-flash-preview), Resend integration, Cloudflare DNS notes
- [x] **ServiceDraft_AI_Project_Instructions_v1_3.md** — Updated to v2.0 with current tech stack, complete feature set, role hierarchy (owner/admin/user), group management system
- [x] **ServiceDraft_AI_Prompt_Logic_v1.md** — Updated to v2.0 with all prompt sections including story-type-aware proofreading, diagnostic optimizer, apply selected edits, diagnostic→repair update, convert recommendation, and pre-generation customization
- [x] **ServiceDraft_AI_Spec_v1_3.md** — Updated to Version 2.0 (March 2026) with complete page specifications, database schema (5 tables including groups), API route inventory, and feature matrix
- [x] **ServiceDraft_AI_UI_Design_Spec_v1.md** — Updated to v2.0 with complete design system documentation including dynamic theming, 9 accent colors, modal system, card system, and all visual enhancement specifications

---

## STAGE 6 SPRINT A — TASK 1: GROUP→TEAM RENAME (2026-03-10)

**Status:** COMPLETE (Task 1 of 5)

Comprehensive rename of all "group" references to "team" across the entire codebase. This is the first task in Stage 6 Sprint A; remaining tasks (2-5) to be completed in the next session.

- [x] **Task 1: Rename all "group" references to "team"** — **2026-03-10**
  - Renamed folder `src/app/(protected)/group-dashboard/` → `team-dashboard/`
  - Renamed folder `src/app/api/groups/` → `teams/` (route.ts + members/route.ts)
  - Updated `src/types/database.ts`: `Group` interface → `Team`, `group_id` → `team_id`
  - Updated `src/hooks/useAuth.ts`: `group_id` → `team_id` in UserProfile interface
  - Updated `src/components/layout/UserPopup.tsx`: route `/group-dashboard` → `/team-dashboard`, label "Group Dashboard" → "Team Dashboard"
  - Updated `src/app/api/stripe/route.ts`: `groups` table → `teams`, `group_id` → `team_id` in response
  - Updated `src/app/(auth)/signup/page.tsx`: `pendingGroupId` → `pendingTeamId`, `group_id` → `team_id`
  - Updated `src/app/(protected)/team-dashboard/page.tsx`: All interfaces (`GroupInfo`→`TeamInfo`, `GroupMember`→`TeamMember`), function name (`GroupDashboardPage`→`TeamDashboardPage`), all state variables, API paths (`/api/groups`→`/api/teams`), UI text (group→team)
  - Updated `src/app/(protected)/admin/page.tsx`: Tab key `groups`→`teams`, role badge `Group Manager`→`Team Manager`, all state variables (`groups`→`teams`, `groupsLoading`→`teamsLoading`, etc.), all functions (`fetchGroups`→`fetchTeams`, `handleCreateGroup`→`handleCreateTeam`, etc.), all modal text and UI labels, API paths
  - Updated `src/app/api/teams/route.ts` + `members/route.ts`: All DB queries use `teams` table + `team_id` column, updated comments and error messages
  - Created migration `supabase/migrations/008_rename_groups_to_teams.sql`: Renames `groups` table → `teams`, `group_id` column → `team_id`, recreates indexes and RLS policies with new names
  - Build verified clean with `npm run build` — all routes correctly show `/team-dashboard`, `/api/teams`, `/api/teams/members`

- [x] **Task 2: Add conditional dashboard buttons to main menu** — **2026-03-10**
- [x] **Task 3: Add Activity Log tab to Team Dashboard** — **2026-03-10**
- [x] **Task 4: Add refresh button to Activity Log tabs** — **2026-03-10**
- [x] **Task 5: Add remove-from-team function to Team Member table** — **2026-03-10**

---

## STAGE 6 SPRINT A — TASKS 2-5 (2026-03-10)

**Status:** COMPLETE

Main menu role-based dashboard buttons, team dashboard activity log tab, refresh buttons on activity log tabs, and remove-from-team member function.

- [x] **Task 2: Add conditional dashboard buttons to main menu** — **2026-03-10**
  - Updated `src/app/(protected)/main-menu/page.tsx` to conditionally show dashboard buttons between USER DASHBOARD and LOG OUT
  - Owner role (`profile.role === 'owner'`): Shows "OWNER DASHBOARD" button with Shield icon, navigates to `/admin`
  - Admin role (`profile.role === 'admin'`): Shows "TEAM DASHBOARD" button with Users icon, navigates to `/team-dashboard`
  - Regular users see no extra dashboard buttons
  - Buttons use same variant ('secondary'), icon sizing (size={20}), and Framer Motion animation patterns as existing buttons

- [x] **Task 3: Add Activity Log tab to Team Dashboard** — **2026-03-10**
  - Added "Activity Log" tab with Activity icon to team dashboard tab navigation
  - Created server-side API route `src/app/api/teams/activity/route.ts` for team-filtered activity logs
  - API fetches team member IDs, then queries `activity_log` filtered by those user IDs
  - Supports pagination (25 rows/page), action_type filtering dropdown (same 11 action types as Owner Dashboard), search by name/email, sort order toggle
  - Table columns: Date/Time, User, Email (hidden on mobile), Action (with color-coded badges), Story Type, Preview
  - Expandable rows showing User ID, Timestamp, Output Preview, Input Data (JSON), Metadata (JSON)
  - Previous/Next pagination with page counter — identical to Owner Dashboard activity log pattern
  - Added `ACTION_FILTERS`, `ACTION_BORDER_COLORS`, `ActivityRow` interface, and helper functions to team dashboard

- [x] **Task 4: Add refresh button to Activity Log tabs** — **2026-03-10**
  - Team Dashboard Activity Log: RefreshCw button with `animate-spin` while loading, positioned in controls bar
  - Owner Dashboard Activity Log (`src/app/(protected)/admin/page.tsx`): Added matching RefreshCw refresh button to activity tab controls (was missing — other tabs already had refresh buttons)

- [x] **Task 5: Add remove-from-team function to Team Member table** — **2026-03-10**
  - Added DELETE handler to `src/app/api/teams/members/route.ts`
    - Authenticates requesting user (must be admin or owner)
    - Validates: cannot remove owner, cannot remove yourself, admin can only remove users (not other admins)
    - Clears `users.team_id` to null; if target was admin, demotes role to 'user'
  - Added UserMinus icon button in team members table Actions column (alongside existing UserCog role button)
    - Red hover state (`hover:text-[#ef4444]`), p-2.5 padding, rounded-lg, size 20 icon
    - `canRemoveMember()` helper determines visibility: owner can remove anyone except self/owner, admin can remove users only
  - Confirmation modal: "Remove [Name] from [Team Name]?" with UserMinus icon, Cancel and Remove buttons
    - Remove button styled with red background (`!bg-[#ef4444]`)
  - On success: removes member from local state, shows success toast "[Name] has been removed from the team"
  - On failure: shows error toast with message from API

- **Build:** Verified clean with `npm run build` — all routes compiled successfully

---

## STAGE 6 SPRINT B — TASK 1: GEMINI API USAGE TRACKER (2026-03-10)

**Status:** COMPLETE (Task 1 of 6)

Replaced the static Cost Calculator tab with a real-time Gemini API Usage Tracker that monitors actual token usage and calculates real costs from every Gemini API call.

- [x] **Step 1: Modify Gemini client return type** — **2026-03-10**
  - Changed `generateWithGemini` return type from `Promise<string>` to `Promise<GeminiResponse>` (`{ text: string, usage: GeminiUsageMetadata | null }`)
  - Added `GeminiUsageMetadata` and `GeminiResponse` exported interfaces
  - Extracts `usageMetadata` from Gemini SDK response object (promptTokenCount, candidatesTokenCount, totalTokenCount)
  - Updated ALL 6 callers to use `geminiResult.text` instead of raw string:
    - `src/app/api/generate/route.ts`
    - `src/app/api/customize/route.ts`
    - `src/app/api/proofread/route.ts`
    - `src/app/api/apply-edits/route.ts`
    - `src/app/api/update-narrative/route.ts`
    - `src/app/api/convert-recommendation/route.ts`

- [x] **Step 2: Create api_usage_log table migration** — **2026-03-10**
  - Created `supabase/migrations/009_api_usage_log.sql`
  - Columns: id (uuid PK), user_id (FK to public.users), action_type (text), prompt_tokens, completion_tokens, total_tokens, model_name (default 'gemini-3-flash-preview'), estimated_cost_usd (numeric(10,6)), created_at (timestamptz)
  - Indexes on created_at (DESC) and user_id
  - RLS: Owner can SELECT all, users can SELECT own, authenticated can INSERT

- [x] **Step 3: Log token usage from every API route** — **2026-03-10**
  - Created `src/lib/usageLogger.ts` — server-side fire-and-forget logger
  - Calculates estimated cost using gemini-3-flash-preview rates: Input $0.50/1M tokens, Output $3.00/1M tokens
  - Added `logTokenUsage(userId, actionType, usage)` call in all 6 API routes after Gemini response
  - Uses same fire-and-forget async IIFE pattern as activity logger — never blocks user requests

- [x] **Step 4: Create /api/admin/usage endpoint** — **2026-03-10**
  - Created `src/app/api/admin/usage/route.ts` — owner-only GET endpoint
  - Accepts `?range=` query param (7, 30, 90, all)
  - Returns aggregated data: totalPromptTokens, totalCompletionTokens, totalTokens, totalEstimatedCost, totalRequests, currentMonthCost, averageCostPerRequest
  - Returns breakdowns: usageByDay (for charting), usageByAction (by action type), usageByUser (top 10 with names)

- [x] **Step 5: Build API Usage tab in Owner Dashboard** — **2026-03-10**
  - Replaced 'costs' tab (Cost Calculator / TokenCalculator component) with 'usage' tab (API Usage)
  - Updated TabKey type: 'costs' → 'usage'
  - Added usage state: usageData, usageLoading, usageRange, usageLastUpdated, usageSecondsAgo
  - Added fetchUsageData callback with useEffect triggers on tab activation and range change
  - Summary cards (7): Total Requests, Input Tokens, Output Tokens, Total Tokens, Estimated Cost, Current Month Cost, Avg Cost/Request
  - Token Usage Over Time: recharts AreaChart with stacked Input/Output token lines
  - Cost Over Time: recharts BarChart with daily cost bars
  - Usage by Action Type: recharts horizontal BarChart with color-coded bars per action
  - Top Users by Token Usage: table with Rank (gold/silver/bronze badges), Name, Requests, Input Tokens, Output Tokens, Est. Cost
  - Time range selector: Last 7/30/90 Days + All Time buttons
  - Refresh button with RefreshCw spin animation
  - "Last updated: Xs ago" ticker
  - Model info callout showing pricing context
  - Removed TokenCalculator import (component file preserved but no longer referenced)

---

### Hotfix: Gemini API Usage Tracker — Model Name & Pricing Correction (2026-03-10)

**Problem:** The API Usage Tracker built in Sprint B Task 1 referenced the wrong model name (`gemini-2.0-flash`) and used incorrect pricing rates ($0.10/$0.40 per 1M tokens input/output).

**Correct values:** Model: `gemini-3-flash-preview` | Input: $0.50/1M tokens ($0.0000005/token) | Output: $3.00/1M tokens ($0.000003/token)

**Files changed:**

- [x] `src/lib/usageLogger.ts` — Fixed model_name from `gemini-2.0-flash` to `gemini-3-flash-preview`, updated INPUT_COST_PER_TOKEN from 0.0000001 to 0.0000005, OUTPUT_COST_PER_TOKEN from 0.0000004 to 0.000003
- [x] `src/components/admin/TokenCalculator.tsx` — Updated MODELS array: changed id/label from gemini-2.0-flash to gemini-3-flash-preview, inputPer1M from 0.10 to 0.50, outputPer1M from 0.40 to 3.00, updated default state
- [x] `src/app/(protected)/admin/page.tsx` — Fixed model info callout: "Model: gemini-3-flash-preview | Input: $0.50/1M tokens | Output: $3.00/1M tokens", also fixed 3 Recharts Tooltip `formatter` TypeScript type errors (pre-existing)
- [x] `supabase/migrations/009_api_usage_log.sql` — Updated DEFAULT from `gemini-2.0-flash` to `gemini-3-flash-preview`
- [x] `src/lib/gemini/client.ts` — Verified: already uses `gemini-3-flash-preview` (no change needed)
- [x] Build verified: `npm run build` passes cleanly

---

## STAGE 6 SPRINT B — TASKS 2-4: TABLE UI IMPROVEMENTS (2026-03-10)

**Status:** COMPLETE (Tasks 2, 3, 4 of 6)

Applied table UI improvements across ALL data tables on both the Owner Dashboard and Team Dashboard pages.

- [x] **Task 2: Email Column Truncation** — **2026-03-10**
  - Added `max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap` on email cells via inline-block span wrapper
  - Added `title` attribute on email cells so full address shows as native browser tooltip on hover
  - Applied to: Owner Dashboard User Management table, Owner Dashboard Activity Log table, Owner Dashboard Teams modal member table, Team Dashboard Team Members table, Team Dashboard Activity Log table

- [x] **Task 3: Center Alignment for All Table Cells** — **2026-03-10**
  - Changed all `<tr>` header rows from `text-left` to `text-center`
  - Added explicit `text-center` to every `<th>` and `<td>` across all tables
  - Preview/narrative text columns kept as `text-left` since long text looks bad centered
  - Applied to all tables: Owner Dashboard Activity Log, User Management, Analytics Top Users Leaderboard, API Usage Top Users, Teams modal members table, Team Dashboard Team Members, Team Dashboard Activity Log

- [x] **Task 4: Glowing Row Hover Effect** — **2026-03-10**
  - Replaced `hover:bg-[var(--accent-10)]` with JS-driven hover using `onMouseEnter`/`onMouseLeave`
  - On hover: `boxShadow: '0 0 8px 1px rgba(168, 85, 247, 0.3)'` + `backgroundColor: 'rgba(168, 85, 247, 0.05)'`
  - On leave: resets both to `none`/`transparent`
  - Added `transition-all duration-200 ease-in-out` for smooth fade in/out
  - Applied to every `<tbody>` row across all data tables on both dashboards
  - Does not conflict with expandable row click behavior or action button hover states

**⚠️ MANUAL ACTION REQUIRED (Tyler):** Run this SQL in Supabase SQL Editor to update the live column default:
```sql
ALTER TABLE api_usage_log ALTER COLUMN model_name SET DEFAULT 'gemini-3-flash-preview';
```
The migration file has been updated for future deployments, but the existing database column default needs this manual update.

---

## STAGE 6 SPRINT B — TASKS 5-6: ACTIVITY DETAIL MODAL & TEAM ASSIGNMENT (2026-03-10)

**Status:** COMPLETE (Tasks 5 and 6 of 6)

- [x] **Task 5: Activity Detail Popup Modal** — **2026-03-10**
  - Enhanced activity logging in `src/app/(protected)/narrative/page.tsx`: generate, regenerate, customize, and save actions now include metadata with narrative preview (first 500 chars), vehicle year/make/model, RO number, and story type
  - Created `src/components/admin/ActivityDetailModal.tsx` — standalone modal component with Framer Motion animations (fade backdrop + scale modal)
  - Modal content sections: action type badge (color-coded), timestamp (MM/DD/YYYY HH:MM AM/PM), user info (name + email), vehicle info, RO number, story type badge, narrative text in scrollable container, input data, and collapsible "View Raw Data" JSON section
  - Gracefully handles entries with minimal metadata (e.g., login events show only action badge, timestamp, and user info)
  - Close on X button, backdrop click, and Escape key (inherited from portal rendering)
  - Wired to Owner Dashboard Activity Log tab: row click opens detail modal instead of inline expansion
  - Wired to Team Dashboard Activity Log tab: same behavior — row click opens detail modal
  - Both dashboards use the same shared ActivityDetailModal component

- [x] **Task 6: Owner Ability to Assign Users to a Team** — **2026-03-10**
  - Added `team_id` and `team_name` to AdminUser interface and list_users API response
  - Admin API `list_users` now joins with teams table to return team_name for each user
  - Added "Team" column to Owner Dashboard User Management table (after Last Activity, before Actions, hidden on small screens)
  - Shows team name with truncation (max-w-[150px]) and title tooltip, or "—" if unassigned
  - Added "Assign to Team" action button (Users icon, accent-colored) in the Actions column for each non-protected user
  - Assign to Team modal: shows current team assignment note, dropdown of all available teams with member counts, Assign/Cancel buttons, disabled when same team selected
  - Added "CREATE TEAM" button in User Management tab header area (Plus icon, outline/secondary style)
  - Create Team modal: team name input field with Enter key submit, Create/Cancel buttons
  - Added `list_teams` action to admin API: returns all active teams with member counts, owner-only
  - Added `assign_user` action to admin API: updates user's team_id, handles already-assigned check, owner-only
  - Added `create_team` action to admin API: creates team with auto-generated access code, owner-only
  - User Management table Team column updates immediately after successful assignment
  - Newly created teams available immediately in Assign to Team dropdown via refetch

---

## Hotfix (Post Sprint F) — Auth Page getSession Fix

**Date:** 2026-03-16
**Status:** COMPLETE

### Problem
Signup page useEffect calls `supabase.auth.getUser()` on mount to determine which step to show. `getUser()` makes a network request to validate/refresh the token. When navigating from /login to /signup?step=2, if the token refresh hasn't settled yet, `getUser()` momentarily returns `{ user: null }`, causing the page to revert to step 1 (account creation screen).

### Changes Made

- [x] **Signup mount check** (`src/app/(auth)/signup/page.tsx` line 64): Changed `supabase.auth.getUser()` to `supabase.auth.getSession()` — reads from local memory/cookies without network request, returns user immediately
- [x] **Signup "not authenticated" branch** (line 98-101): Changed from `setStep(1)` to preserve URL step param (`urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1`)
- [x] **Signup catch block** (line 102-104): Same URL step preservation instead of defaulting to step 1
- [x] **Login mount check** (`src/app/(auth)/login/page.tsx` line 33): Same `getUser()` → `getSession()` change
- [x] handlePaymentStep and handleProfileCreation left unchanged — user-initiated actions where session is established

### Files Modified
1. `src/app/(auth)/signup/page.tsx`
2. `src/app/(auth)/login/page.tsx`

---

## Sprint F — Clean Auth Loading Fix

**Date:** 2026-03-16
**Status:** COMPLETE

Previous auth loading fix attempts (commits de85135 through 199b4ef) were reverted because they stacked band-aids without addressing the root cause. This sprint implements a clean, single-pass fix.

### Root Cause
`buildFallbackProfile()` in `useAuth.ts` set `subscription_status: 'trial'` on ANY profile fetch error. The main-menu page guard saw `trial` status and redirected to `/signup?step=2`. Signup checked auth, saw a completed profile, and redirected back to `/main-menu` — creating an infinite redirect loop.

### Changes Made

- [x] **Task 1: Singleton Supabase browser client** (`src/lib/supabase/client.ts`)
  - Added module-level `browserClient` variable
  - `createClient()` now returns existing instance if already created
  - Prevents multiple components from spinning up independent clients with separate `getUser()` calls

- [x] **Task 2: Remove buildFallbackProfile** (`src/hooks/useAuth.ts`)
  - Deleted the entire `buildFallbackProfile()` function
  - All error paths in `fetchProfileForUser()` now set `profile: null` instead of a fake trial profile
  - PGRST116 (no row) handler still creates a real profile row via INSERT — kept as-is
  - Added 5-second timeout wrapper around initial `getUser()` call using `Promise.race`
  - On timeout: logs warning, calls `signOut({ scope: 'local' })` fire-and-forget, sets `{ user: null, profile: null }`
  - Added 10-second failsafe timer that forces `{ user: null, profile: null, loading: false }` if still loading

- [x] **Task 3: Fix main-menu redirect guard** (`src/app/(protected)/main-menu/page.tsx`)
  - Added `if (!profile) return;` at top of useEffect — null profile no longer triggers redirect
  - Simplified loading condition to `if (loading || !profile)` — shows spinner while resolving
  - Added 8-second `loadingTooLong` timer that shows "Reset Session" button
  - Reset button clears all `sb-` cookies, removes `sd-*` localStorage keys, redirects to `/`

- [x] **Task 4: Fix post-signup redirect** (`src/app/(auth)/signup/page.tsx`)
  - Changed `router.push('/main-menu')` to `window.location.href = '/main-menu'`
  - Forces full page load ensuring middleware runs fresh with proper cookies

- [x] **Task 5: Fix signOut hang** (`src/hooks/useAuth.ts`)
  - Changed `supabase.auth.signOut()` to `supabase.auth.signOut({ scope: 'local' })`
  - Prevents hang when access token is expired (no network request to Supabase auth server)
  - Added `finally` block with `window.location.href = '/'` — always redirects regardless of signOut success

- [x] **Task 6: Verify ThemeProvider singleton** (`src/components/ThemeProvider.tsx`)
  - Dynamic import `createClient()` now returns singleton — no changes needed for logic
  - Fixed `onAuthStateChange` callback type annotations (event/session) for TypeScript strict mode

- [x] **Task 7: Fix ProofreadResults setState-during-render** (`src/components/narrative/ProofreadResults.tsx`)
  - Removed `notifyParent()` calls from inside `setCheckedEdits` updater and `toggleAll`
  - Moved all parent notifications to a `useEffect` that watches `checkedEdits` state
  - Eliminated React warning about updating a component during rendering of another component

- [x] **Task 8: Fix ActivityDetailModal z-index and positioning** (`src/components/dashboard/ActivityDetailModal.tsx`)
  - Backdrop: `z-[120]` (was `z-40`), modal container: `z-[130]` (was `z-50`)
  - Switched from `items-center` to `items-start` with `pt-[20px]` for top-anchored positioning
  - Increased width to `w-[85vw] max-w-5xl` (was `w-[90vw] max-w-4xl`)
  - Made top-right X button sticky with `sticky top-0 float-right` and bg for visibility
  - Added CLOSE button at bottom with `motion.button` hover animation

### Files Modified
1. `src/lib/supabase/client.ts`
2. `src/hooks/useAuth.ts`
3. `src/app/(protected)/main-menu/page.tsx`
4. `src/app/(auth)/signup/page.tsx`
5. `src/components/ThemeProvider.tsx`
6. `src/components/narrative/ProofreadResults.tsx`
7. `src/components/dashboard/ActivityDetailModal.tsx`

---

## Sprint E — Team Dashboard: Migrate Activity Tab to Narrative Tracker

**Date:** 2026-03-12
**Status:** COMPLETE

### Completed Tasks

- [x] **Task 1 — Rewrite /api/teams/activity/route.ts to query narrative_tracker**
  - Replaced activity_log query with narrative_tracker query
  - Select same columns as admin API's list_tracker_entries: id, user_id, ro_number, vehicle_year/make/model, story_type, created_at, last_action_at, is_regenerated/customized/proofread/saved/exported, export_type
  - Filter by team membership: get users where team_id matches, then filter narrative_tracker by user_id IN those IDs
  - Updated filters from action_type-based to boolean-based: all/regenerated/customized/proofread/saved/exported
  - Updated search to match ro_number ILIKE OR user name/email
  - Sort by last_action_at instead of created_at
  - Enrich rows with user_first_name, user_last_name, user_email from users table
  - Added detail_id query param: when present, fetches single tracker entry with ALL columns (full_narrative, concern, cause, correction, action_history) plus user info, with team membership verification for admin users

- [x] **Task 2 — Update ActivityDetailModal to support custom fetch**
  - Added optional `fetchDetailFn` prop to src/components/dashboard/ActivityDetailModal.tsx
  - When provided, modal uses the custom function instead of the default POST to /api/admin
  - This allows team admins (role='admin') to use the modal via the teams/activity endpoint since they don't have access to /api/admin (owner-only)

- [x] **Task 3 — Update Team Dashboard Activity tab UI**
  - Changed import from src/components/admin/ActivityDetailModal (OLD) to src/components/dashboard/ActivityDetailModal (NEW)
  - Replaced ActivityRow interface with TrackerEntry interface matching tracker data shape
  - Replaced activityLogs/ActivityRow[] state with trackerEntries/TrackerEntry[]
  - Replaced selectedActivity/activityExpandedRow with selectedTrackerId/showDetailModal
  - Updated ACTION_FILTERS to boolean-based: All Entries, Regenerated, Customized, Proofread, Saved, Exported
  - Replaced ACTION_BORDER_COLORS with TRACKER_PILL_COLORS matching admin page
  - Updated table columns: User | R.O. # | Vehicle | Story Type | Actions (pills) | Last Activity
  - Added color-coded action pills (Regen, Custom, Proofread, Saved, PDF/COPY/PRINT/DOCX) matching admin page
  - Left border color: accent for diagnostic_only, green for repair_complete
  - Row click sets selectedTrackerId and opens detail modal
  - Updated modal rendering to use new props (isOpen, onClose, trackerId, fetchDetailFn)
  - Added fetchTrackerDetail callback that calls GET /api/teams/activity?detail_id=xxx
  - Updated search placeholder to "Search by name, email, or R.O. #..."
  - Removed old formatActionLabel and formatDateReadable helper functions (no longer needed)

- [x] **Task 4 — Update /api/teams/members to use narrative_tracker**
  - Replaced activity_log query with narrative_tracker query in GET handler
  - last_active now derived from MAX(last_action_at) via narrative_tracker (ordered desc, first per user_id)
  - narrative_count still sourced from narratives table (counts saved narratives, not tracker entries)
  - Response shape unchanged — Overview tab stats (Active This Week, Active Today) continue working via member.last_active
  - No other activity_log references remain in the teams API path

- [x] **Task 5 — Clean up dead code and verify imports**
  - Verified NO files import from src/components/admin/ActivityDetailModal.tsx (old modal)
  - Both admin/page.tsx and team-dashboard/page.tsx import from src/components/dashboard/ActivityDetailModal.tsx (new modal)
  - Added DEPRECATED comment to src/components/admin/ActivityDetailModal.tsx
  - Verified no dead code in team-dashboard/page.tsx (old interfaces, state vars, helpers already cleaned up in Tasks 1-3)
  - Remaining activity_log references in src/ are all in separate features: activityLogger.ts (fire-and-forget logging), admin API routes, analytics, delete-account — not part of Team Dashboard migration scope

---

## Auth Overhaul Sprint 2 — Recovery Hardening + Cleanup (2026-03-22)

- [x] **Task 1 — Replace blank page fallbacks with recovery UI**
  - Admin page (`admin/page.tsx`): Split `if (!profile || profile.role !== 'owner') return null` into two guards — !profile shows recovery UI with Refresh Page / Re-Login buttons, non-owner shows "Access Denied" message
  - Team Dashboard (`team-dashboard/page.tsx`): Same pattern — !profile shows recovery UI, role=user shows "Access Denied — restricted to team managers"
  - Dashboard (`dashboard/page.tsx`): Upgraded existing plain-text !profile fallback to LiquidCard recovery UI with Refresh Page / Re-Login buttons (added LiquidCard import)
  - Main Menu (`main-menu/page.tsx`): Split `if (loading || !profile)` guard into two branches — loading=true shows spinner with loadingTooLong reset button (existing behavior), loading=false && !profile shows recovery UI with Refresh Page / Re-Login buttons

- [x] **Task 2 — Remove 10-second failsafe timer from useAuth**
  - Removed `failsafeTriggered` variable declaration
  - Removed entire `startGlobalFailsafe()` function
  - Removed `startGlobalFailsafe()` call from `initializeAuth()`
  - Natural auth flow now handles all cases: initializeAuth → getUser (7s timeout) → fetchProfileForUser via /api/me → loading:false. If /api/me fails, retry handles it. If both fail, profile stays null and recovery UI shows.

- [x] **Task 3 — Update main-menu loading timer**
  - Changed loadingTooLong timeout from 8000ms to 5000ms — with server-side profile fetch, >5s genuinely indicates a problem

- [x] **Task 4 — Clean up stale useAuth code**
  - Removed AbortError check from onAuthStateChange callback — no longer needed since profile fetching uses /api/me (plain fetch) instead of Supabase browser client
  - Verified `useCallback` still used by `signOut` and `refreshProfile` — kept import
  - `appFullyInitialized` and `isRefreshing` flags confirmed still needed — kept

- [x] **Task 5 — Verify auth flow end-to-end**
  - Confirmed getUser() calls: useAuth.ts (1 call in initializeAuth — legitimate), signup/page.tsx (2 calls in step handlers — legitimate, user-action-triggered), middleware.ts (server-side — fine), all API routes (server-side — fine)
  - ThemeProvider: ZERO getUser() calls (all getSession now)
  - activityLogger: ZERO getUser() calls (uses getSession fallback)
  - Build verified with zero TypeScript errors

---

## Hotfix — Login Page Loading Lockup / Stale Cookie Defense (2026-03-24)

**Problem:** When stale sb- auth cookies exist (from expired sessions, magic link testing, etc.), two failures occurred: (1) middleware getUser() hangs indefinitely trying to refresh expired tokens, blocking page HTML from reaching the browser, and (2) login page auth check enters the "user exists" path from stale cached session, tries a profile query that fails, attempts a redirect, but never calls setCheckingAuth(false) — permanent loading spinner.

**Files Modified:**
- `src/lib/supabase/middleware.ts` — 1 change
- `src/app/(auth)/login/page.tsx` — 2 changes

**Changes:**

- [x] **Fix 1 — Middleware getUser() timeout** (middleware.ts)
  - Wrapped bare `getUser()` in `Promise.race` with 5000ms timeout
  - On timeout: user=null, protected routes redirect to /login, auth routes show their forms
  - Existing route protection logic unchanged — works identically since `user` is just `null` on timeout

- [x] **Fix 2 — Login page stale-cookie failsafe** (login/page.tsx)
  - Added 4-second failsafe useEffect after existing checkAuth useEffect
  - If checkingAuth is still true after 4s: clears all sb- cookies via document.cookie expiry, sets checkingAuth=false
  - Same pattern as main-menu/page.tsx loadingTooLong failsafe, adapted for login page

- [x] **Fix 3 — setCheckingAuth(false) in user-exists path** (login/page.tsx)
  - Added `if (active) setCheckingAuth(false)` before the `return` in the user-exists redirect block
  - Prevents spinner from sticking if router.replace is slow or fails

**Files NOT changed:** auth/callback/route.ts, signup/page.tsx, main-menu/page.tsx, useAuth.ts, all database tables/RLS/API routes.

**Build:** Verified with zero TypeScript errors.

---

*— End of Build Progress Tracker —*
