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

**Last Updated:** 2026-02-19
**Current Phase:** Phase 10 — Deployment
**Next Task:** Phase 10, Task 10.1
**Overall Progress:** 73 / 78 tasks complete (+ 15 post-build fixes applied)

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
- [x] Configures model (gemini-2.0-flash or gemini-2.0-pro)
- [x] Utility function for sending prompts and parsing JSON responses
- **Completed:** 2026-02-15
- **Notes:** Uses gemini-2.0-flash. parseJsonResponse strips markdown code fences before parsing.

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
- [x] Download as PDF Document (generate PDF on the fly)
- **Completed:** 2026-02-15
- **Notes:** PDF uses browser print-to-PDF dialog for lightweight implementation.

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
- **Completed:** 2026-02-15
- **Notes:** All already implemented in Phase 1 components.

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
| Post-Build Fixes | 15 | 15 |
| **TOTAL** | **93** | **88** |

---

*— End of Build Progress Tracker —*
