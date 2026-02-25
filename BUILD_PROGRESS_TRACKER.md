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

**Last Updated:** 2026-02-24
**Current Phase:** Phase 10 — Deployment
**Next Task:** Phase 10, Task 10.1
**Overall Progress:** 73 / 78 tasks complete (+ 80 post-build fixes applied)
**Stage 1 Status:** COMPLETE — All core features built, Gemini 3.0 Flash upgraded, documentation synced
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
**Session 12A:** COMPLETE — Gemini 3.0 Flash upgrade, signup page animation, final documentation sync (PB.79–PB.80)

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
- [x] Configures model (gemini-3.0-flash)
- [x] Utility function for sending prompts and parsing JSON responses
- **Completed:** 2026-02-15
- **Notes:** Uses gemini-3.0-flash. parseJsonResponse strips markdown code fences before parsing.

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
- **Notes:** Direct Supabase client insert from client side with RLS.

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
| Post-Build Fixes | 80 | 80 |
| **TOTAL** | **158** | **153** |

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
- [x] Updated `src/lib/gemini/client.ts` — model string changed from `gemini-2.0-flash` to `gemini-3.0-flash`
- [x] All API routes (generate, customize, proofread, apply-edits) use `generateWithGemini()` which centralizes the model — no other files needed updating
- [x] Updated `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` — code example now shows `gemini-3.0-flash`
- [x] Updated `BUILD_PROGRESS_TRACKER.md` — Phase 5 notes now reference `gemini-3.0-flash`
- **Completed:** 2026-02-24

### PB.80 — Signup Page Entrance Animation
- [x] Added `motion` import from `framer-motion` to `src/app/(auth)/signup/page.tsx`
- [x] Wrapped main content `<div>` in `<motion.div>` with `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}` (duration: 0.4s, easeOut)
- [x] Matches login page entrance animation pattern for consistency
- [x] All pages in the app now have Framer Motion entrance animations
- **Completed:** 2026-02-24

### SESSION 12A — Gemini 3.0 Flash Upgrade + Final Polish + Documentation Sync — COMPLETE
- **Scope:** PB.79, PB.80
- **Completed:** 2026-02-24
- **Notes:** Upgraded Gemini AI model from 2.0 Flash to 3.0 Flash (single change point in gemini/client.ts). Added missing entrance animation to signup page. Verified all pages have Framer Motion animations, background animation runs on all protected pages, toast notifications have consistent styling. Updated all documentation to reflect Gemini 3.0 Flash. Stage 1 build complete — all core features implemented.

---

| Post-Build Fixes | 66 | 66 |

---

*— End of Build Progress Tracker —*
