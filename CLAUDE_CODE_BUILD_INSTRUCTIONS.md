# SERVICEDRAFT.AI — CLAUDE CODE BUILD INSTRUCTIONS

## WHAT THIS DOCUMENT IS

This is the master reference guide for Claude Code when working on the ServiceDraft.AI application. The initial build (Phases 0–10) and all post-build improvement sprints through Stage 5 Sprint 1 are complete. This document now serves as the **architecture reference, coding standards guide, and sprint execution playbook** for ongoing maintenance, bug fixes, and new feature development.

**CRITICAL: Before starting any work, ALWAYS read `BUILD_PROGRESS_TRACKER.md` first to see what has been completed and what the next task is.**

---

## HOW TO USE THIS DOCUMENT

1. **At the start of every session:**
   - Read `BUILD_PROGRESS_TRACKER.md` to understand current progress and identify the next task
   - Read the relevant sections of THIS document for architecture context
   - Read any referenced project knowledge files as needed

2. **When completing a task:**
   - Implement the task as described
   - Test that it works (run `npm run dev`, check for errors, run `npm run build` for production verification)
   - Update `BUILD_PROGRESS_TRACKER.md` — add the new sprint/task with status `[x]` and today's date
   - Update the "CURRENT STATUS" section at the top of the tracker
   - Commit all changes to Git with a descriptive message

3. **When encountering a blocker:**
   - Add a `⚠️ BLOCKED:` note in the tracker
   - Explain to the user what's needed
   - Move to the next task that can be done independently (if any)

4. **When a session is ending:**
   - Make sure `BUILD_PROGRESS_TRACKER.md` is fully up to date
   - Commit all changes to Git with a descriptive message
   - Tell the user what was accomplished and what's next

---

## PROJECT KNOWLEDGE FILES

| File | When to Reference |
|------|-------------------|
| `ServiceDraft_AI_Spec_v1_3.md` | Page layouts, database schema, feature requirements, workflow diagrams |
| `ServiceDraft_AI_Project_Instructions_v1_3.md` | Tech stack, communication rules, quality standards |
| `ServiceDraft_AI_Prompt_Logic_v1.md` | ALL AI prompts, dropdown logic, customization sliders, JSON response structures |
| `ServiceDraft_AI_UI_Design_Spec_v1.md` | ALL visual design specs — colors, typography, components, CSS, theming system |
| `DEPLOYMENT_NOTES.md` | Environment variables, Supabase config, Stripe setup, security measures |

---

## TECHNOLOGY STACK (Current)

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 16.1.6 | React framework with App Router |
| **React** | React | 19.2.3 | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | CSS-first config via @theme in globals.css |
| **Database/Auth** | Supabase | @supabase/supabase-js 2.95+ | PostgreSQL + Auth + RLS |
| **AI** | Google Gemini | gemini-3-flash-preview | Narrative generation, proofreading, customization |
| **Payments** | Stripe | 20.3.1 | Subscription billing + access code bypass |
| **Email** | Resend | 6.9.2 | Transactional email (exports, password resets) |
| **Animations** | Framer Motion | 12.34+ | Page transitions, micro-interactions |
| **Charts** | Recharts | 3.8+ | Admin analytics visualizations |
| **PDF Export** | jsPDF | 4.2+ | Server-side PDF generation |
| **DOCX Export** | docx | 9.5+ | Server-side Word document generation |
| **Icons** | Lucide React | 0.564+ | SVG icon library |
| **Toasts** | react-hot-toast | 2.6+ | Notification system |
| **Hosting** | Vercel | — | CI/CD + hosting |
| **DNS/Domain** | Cloudflare | — | Domain registrar for servicedraft.ai |

---

## CURRENT APPLICATION ARCHITECTURE

### Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx              (NavBar, HeroArea, WaveBackground, ParticleNetwork, session expiry)
│   │   ├── main-menu/page.tsx
│   │   ├── input/page.tsx
│   │   ├── narrative/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── admin/page.tsx          (Owner Dashboard — admin role required)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── route.ts            (User management CRUD — service role)
│   │   │   └── analytics/route.ts  (Dashboard metrics — service role)
│   │   ├── apply-edits/route.ts    (Apply selected proofread edits to narrative)
│   │   ├── convert-recommendation/route.ts  (Tense conversion — diagnostic→repair)
│   │   ├── customize/route.ts      (AI narrative customization)
│   │   ├── delete-account/route.ts (Self-service account deletion — service role)
│   │   ├── export-docx/route.ts    (Word document generation)
│   │   ├── export-pdf/route.ts     (PDF document generation)
│   │   ├── generate/route.ts       (AI narrative generation — rate limited)
│   │   ├── narratives/
│   │   │   ├── route.ts            (GET saved narratives for user)
│   │   │   └── save/route.ts       (POST save narrative — INSERT only)
│   │   ├── proofread/route.ts      (AI audit — story-type-aware prompts)
│   │   ├── saved-repairs/
│   │   │   ├── route.ts            (GET/POST repair templates)
│   │   │   └── [id]/route.ts       (PUT/DELETE individual template)
│   │   ├── send-email/route.ts     (Email export via Resend)
│   │   ├── stripe/
│   │   │   ├── route.ts            (Checkout + access code bypass)
│   │   │   └── webhook/route.ts    (Stripe webhook handler)
│   │   ├── support/route.ts        (Support ticket submission)
│   │   └── update-narrative/route.ts  (Diagnostic→Repair Complete update)
│   ├── auth/callback/route.ts      (Supabase PKCE code exchange)
│   ├── layout.tsx                  (Root layout — fonts, ThemeProvider, ToastProvider)
│   ├── page.tsx                    (Landing page)
│   └── globals.css                 (Tailwind v4 @theme config + CSS custom properties)
├── components/
│   ├── ThemeProvider.tsx            (Accent color + dark/light mode context)
│   ├── dashboard/
│   │   ├── EditProfileModal.tsx
│   │   ├── NarrativeDetailModal.tsx
│   │   ├── NarrativeHistory.tsx
│   │   ├── PreferencesPanel.tsx
│   │   ├── ProfileSection.tsx
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
│   │   ├── NavBar.tsx
│   │   ├── SupportForm.tsx
│   │   ├── TermsOfUse.tsx
│   │   └── UserPopup.tsx
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
│   ├── fieldConfig.ts              (Input field definitions for both story types)
│   ├── positions.ts                (Job position dropdown options)
│   └── prompts.ts                  (All Gemini system prompts + modifier constants)
├── hooks/
│   ├── useActivityPulse.ts         (Hero wave reactivity system)
│   ├── useAuth.ts                  (Shared auth state — module-level singleton)
│   ├── useSessionExpiry.ts         (8-hour auto-logout)
│   └── useTypingAnimation.ts       (Character-by-character text display)
├── lib/
│   ├── activityLogger.ts           (Fire-and-forget activity log inserts)
│   ├── compileDataBlock.ts         (Input fields → API prompt assembly)
│   ├── constants/themeColors.ts    (9 accent colors + CSS variable builder)
│   ├── env.ts                      (Environment variable validation)
│   ├── exportUtils.ts              (Shared PDF/DOCX/Print/Email HTML builders)
│   ├── gemini/client.ts            (Gemini API client — model: gemini-3-flash-preview)
│   ├── highlightUtils.ts           (Proofread highlight range computation)
│   ├── rateLimit.ts                (In-memory rate limiter for /api/generate)
│   ├── stripe/client.ts            (Server-side Stripe client)
│   ├── supabase/
│   │   ├── client.ts               (Browser-side Supabase client)
│   │   ├── middleware.ts            (Session refresh middleware helper)
│   │   └── server.ts               (Server-side Supabase client — cookie-based auth)
│   └── utils.ts                    (withTimeout utility)
├── middleware.ts                    (Next.js route protection middleware)
├── stores/
│   └── narrativeStore.ts           (Global narrative state — useSyncExternalStore pattern)
└── types/
    └── database.ts                 (TypeScript interfaces for all DB tables)
```

### Database Schema (4 Tables)

**`users`** — User profiles
- id (uuid PK, FK to auth.users), email, first_name, last_name, location, position, role ('user'|'admin'), subscription_status, stripe_customer_id, is_restricted, accent_color, preferences (JSONB), created_at, updated_at

**`narratives`** — Saved warranty narratives
- id (uuid PK), user_id (FK), ro_number, vehicle_year, vehicle_make, vehicle_model, concern, cause, correction, block_narrative, story_type, created_at, updated_at
- No unique constraint on (user_id, ro_number) — same RO# can have both diagnostic and repair entries

**`activity_log`** — User activity tracking
- id (uuid PK), user_id (FK to public.users), action_type, story_type, input_data (JSONB), output_preview, metadata (JSONB), created_at
- FK points to `public.users` NOT `auth.users` (critical for PostgREST joins)

**`saved_repairs`** — Repair template storage
- id (uuid PK), user_id (FK), template_name, story_type, codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification (+ option columns for each), created_at, updated_at
- Vehicle info fields exist in schema but are always null (templates are vehicle-agnostic)

### Migrations (in order)
1. `001_initial_schema.sql` — users, narratives, auto-profile trigger, RLS
2. `002_add_name_fields_and_position_update.sql` — first_name, last_name columns
3. `003_narrative_upsert_support.sql` — updated_at, dedup, unique constraint, UPDATE policy
4. `004_admin_role_and_activity_log.sql` — role, is_restricted, activity_log table, admin RLS
5. `005_saved_repairs.sql` — saved_repairs table + RLS
6. `006_drop_narrative_unique_constraint.sql` — drops unique(user_id, ro_number) for multi-entry support

---

## GLOBAL DEVELOPMENT RULES

Follow these at ALL times:

### Code Standards
- **TypeScript** for all files (`.ts` and `.tsx`)
- **"use client"** directive at the top of any component that uses React hooks, state, or browser APIs
- **"use server"** is NOT needed — API routes in `app/api/` are server-side by default
- **Always export default** for page components
- **Named exports** for reusable components and utility functions

### File Naming
- React components: `PascalCase.tsx` (e.g., `LiquidCard.tsx`)
- Utility files: `camelCase.ts` (e.g., `compileDataBlock.ts`)
- Page files: always `page.tsx` inside route folders
- Layout files: always `layout.tsx`
- API routes: always `route.ts` inside API folders

### Styling Rules
- Use **Tailwind CSS** classes for all styling — no separate CSS files except `globals.css`
- Use **CSS custom properties** (`var(--accent-primary)`, `var(--bg-input)`, etc.) for all colors — NEVER hardcode hex values
- The Tailwind v4 config lives in `globals.css` via `@theme` inline blocks (no `tailwind.config.ts`)
- For one-off styles that CSS variables can't handle, use inline `style={}`

### Error Handling
- Every API call must be wrapped in try/catch
- Every API route must return proper HTTP status codes (200, 400, 401, 403, 500)
- User-facing errors shown as toast notifications
- `console.error` for debugging, never `console.log` in production code

### State Management
- **narrativeStore.ts** — module-level global state using `useSyncExternalStore` pattern
- **useAuth.ts** — module-level singleton auth state with listener pattern
- **ThemeProvider** — React context for accent color and dark/light mode
- Do NOT use Redux, MobX, zustand, or other state libraries

### Data Access Pattern (CRITICAL)
- **ALL Supabase data operations (SELECT, INSERT, UPDATE, DELETE) MUST go through server-side API routes** (`/api/*`)
- The browser-side Supabase client is ONLY used for auth state checking (e.g., `getUser()`)
- Server-side API routes authenticate via HTTP cookies using `createClient()` from `@/lib/supabase/server`
- This pattern was established after discovering that browser-side Supabase queries have unreliable auth state across Next.js route transitions

### Theming
- All UI components use CSS custom properties from the theming system (see `ThemeProvider.tsx` and `themeColors.ts`)
- 9 accent colors available: Violet, Red, Orange, Yellow, Green, Blue, Pink, White, Black
- White accent forces dark mode; Black accent forces light mode
- New components must use `var(--accent-*)`, `var(--bg-*)`, `var(--text-*)` — never hardcoded hex values
- Button text color is automatically determined by luminance via `perceivedBrightness()` helper

---

## KEY PATTERNS & EXAMPLES

### API Route Pattern (Server-Side)

```typescript
// src/app/api/example/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

### Gemini API Call Pattern

```typescript
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';

const raw = await generateWithGemini(systemPrompt, userPrompt, 8192);
const parsed = parseJsonResponse<NarrativeResponse>(raw);
```

### Activity Logging (Fire-and-Forget)

```typescript
import { logActivity } from '@/lib/activityLogger';

// Never awaited — runs in background
logActivity('generate', { storyType, vehicleInfo: `${year} ${make} ${model}` });
```

### Framer Motion Page Entrance

```tsx
"use client";
import { motion } from 'framer-motion';

export default function PageWithAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Page content */}
    </motion.div>
  );
}
```

---

## CRITICAL LESSONS LEARNED

These are patterns discovered through debugging. Reference them before making changes in these areas:

1. **Supabase PostgREST joins require FKs on `public` schema tables.** If a query returns "Could not find a relationship in the schema cache," the FK likely points to `auth.users` instead of `public.users`. Fix: drop FK, recreate pointing to `public.users`, then run `NOTIFY pgrst, 'reload schema'`.

2. **All Supabase data operations belong in server-side API routes.** The browser Supabase client has unreliable auth state across Next.js route transitions. Server routes authenticate via HTTP cookies reliably.

3. **Diagnostic Only and Repair Complete narratives sharing the same RO# must save as separate database rows** via plain INSERT — never upsert or overwrite across story types.

4. **Stale `.next` cache can serve old code after fixes are committed.** When behavior doesn't match committed code, delete `.next` with `cmd /c "rmdir /s /q .next"` (Windows) or `rm -rf .next` (Mac/Linux) before further debugging.

5. **The `useAuth` hook and `narrativeStore` are module-level singletons.** They persist across route transitions and should never be torn down during navigation. Only a full page reload or explicit sign-out resets them.

6. **SUPABASE_SERVICE_ROLE_KEY copy errors:** Accidentally prepending surrounding UI text (e.g., "you") to the key value is a known failure mode — always verify the raw key value.

7. **Cloudflare proxy must be disabled (grey cloud/DNS-only) when pointing to Vercel.** Orange cloud (proxy enabled) breaks Vercel's domain verification and SSL.

8. **Documentation updates must happen before git commits**, not after. Every sprint should explicitly update `BUILD_PROGRESS_TRACKER.md` before the commit step.

9. **React hydration mismatches** from ThemeProvider: Components that read accent color from context should render with default values during SSR and swap to real values after mount using a `mounted` state guard.

10. **Tailwind v4 uses CSS-first configuration** via `@theme` blocks in `globals.css`. There is no `tailwind.config.ts` file.

---

## ENVIRONMENT VARIABLES

### Required (app will not function without these)

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
| `NEXT_PUBLIC_APP_URL` | Public app URL for Stripe redirects |
| `RESEND_API_KEY` | Resend email service API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe subscription price ID |

---

## SPRINT EXECUTION TEMPLATE

When creating a new sprint, follow this structure:

1. **Read** `BUILD_PROGRESS_TRACKER.md` to confirm current state
2. **Create** a new section in the tracker for the sprint
3. **Implement** changes with proper error handling and loading states
4. **Test** with `npm run dev` for functionality, `npm run build` for production verification
5. **Update** `BUILD_PROGRESS_TRACKER.md` with completed tasks, dates, and notes
6. **Commit** with descriptive message: `"Stage X Sprint Y: Brief description of changes"`

---

*— End of Claude Code Build Instructions —*
