# SERVICEDRAFT.AI — CLAUDE CODE BUILD INSTRUCTIONS

## WHAT THIS DOCUMENT IS

This is the master instruction set for Claude Code when working on the ServiceDraft.AI application. It contains the full technical specification for every system in the app, including exact file paths, code patterns, TypeScript interfaces, CSS variable references, database schemas, and implementation details.

The initial build (Phases 0–10) is complete. All post-build improvement sprints through Stage 6 Sprint B are complete. The pre-deployment security audit is complete. The app is deployed and live at `servicedraft.ai`. This document now serves as the **architecture reference, coding standards guide, and sprint execution playbook** for ongoing maintenance, bug fixes, and new feature development.

**CRITICAL: Before starting any work, ALWAYS read `BUILD_PROGRESS_TRACKER.md` first to see what has been completed and what the next task is.**

---

## HOW TO USE THIS DOCUMENT

1. **At the start of every session:**
   - Read `BUILD_PROGRESS_TRACKER.md` to identify the next incomplete task
   - Read the corresponding sections in THIS document for detailed instructions
   - Read any referenced project knowledge files as needed

2. **When completing a task:**
   - Implement the task as described
   - Test that it works (run `npm run dev`, check for errors, run `npm run build` for production verification)
   - Update `BUILD_PROGRESS_TRACKER.md` — add a new sprint/task entry with `[x]` status and today's date
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

The following reference documents contain detailed specifications. Read them as needed:

| File | When to Reference |
|------|-------------------|
| `ServiceDraft_AI_Spec_v1_3.md` | Page layouts, database schema, feature requirements, workflow diagrams |
| `ServiceDraft_AI_Project_Instructions_v1_3.md` | Tech stack, communication rules, quality standards |
| `ServiceDraft_AI_Prompt_Logic_v1.md` | ALL AI prompts, dropdown logic, customization sliders, JSON response structures |
| `ServiceDraft_AI_UI_Design_Spec_v1.md` | ALL visual design specs — colors, typography, components, CSS, Tailwind config |
| `DEPLOYMENT_NOTES.md` | Environment variables, Supabase RLS policies, Stripe webhook setup, security measures |
| `SERVIDRAFT_AI_LOGO_1_.PNG` | Logo asset file |
| `ServiceDraft-Ai Vector Logo.png` | Vector logo used in NavBar and export documents |

---

## GLOBAL DEVELOPMENT RULES

Follow these at ALL times:

### Code Standards
- **TypeScript** for all files (`.ts` and `.tsx`)
- **"use client"** directive at the top of any component that uses React hooks, state, or browser APIs
- **"use server"** is NOT needed — API routes in `app/api/` are server-side by default in Next.js App Router
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
- **`useAuth.ts`** — module-level singleton auth state with listener pattern (same approach as narrativeStore)
- **`ThemeProvider.tsx`** — React context for accent color, dark/light mode, and background animation toggle
- Do NOT use Redux, MobX, zustand, or other state libraries

### Data Access Pattern (CRITICAL)
- **ALL Supabase data operations (SELECT, INSERT, UPDATE, DELETE) MUST go through server-side API routes** (`/api/*`)
- The browser-side Supabase client (`src/lib/supabase/client.ts`) is ONLY used for auth state checking (e.g., `getUser()`) and activity logging (fire-and-forget inserts)
- Server-side API routes authenticate via HTTP cookies using `createClient()` from `@/lib/supabase/server`
- This pattern was established after discovering that browser-side Supabase data queries have unreliable auth state across Next.js route transitions, causing timeouts and lockups

### Field ID Convention
**CRITICAL:** Always use field IDs as defined in `src/constants/fieldConfig.ts`:
- Required fields: `ro_number`, `year`, `make`, `model`, `customer_concern`
- Conditional fields: `codes_present`, `diagnostics_performed`, `root_cause`, `recommended_action`, `repair_performed`, `repair_verification`

When accessing field values in the narrative store: `state.fieldValues['year']` (NOT `state.fieldValues['vehicle_year']`).

---

## TECHNOLOGY STACK (Current Versions)

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 | React framework with SSR |
| **React** | React | 19.2.3 | UI library |
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
| **Hosting** | Vercel | — | CI/CD + hosting |
| **DNS/Domain** | Cloudflare | — | Domain registrar for servicedraft.ai |

---

## CURRENT APPLICATION ARCHITECTURE

### Complete Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx              ← HeroArea + NavBar + ParticleNetwork + ErrorBoundary + session expiry
│   │   ├── main-menu/page.tsx      ← Role-based dashboard buttons (Owner/Team/User)
│   │   ├── input/page.tsx
│   │   ├── narrative/page.tsx
│   │   ├── dashboard/page.tsx      ← User Dashboard (profile, preferences, narrative history)
│   │   ├── admin/page.tsx          ← Owner Dashboard — owner role required (5+ tabs)
│   │   └── team-dashboard/page.tsx ← Team Dashboard — admin role required (team members, activity)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── route.ts            ← User management CRUD + team management (service role client)
│   │   │   ├── analytics/route.ts  ← Dashboard metrics and chart data (service role client)
│   │   │   └── usage/route.ts      ← Gemini API token usage aggregated stats (service role client)
│   │   ├── apply-edits/route.ts    ← Apply selected proofread edits to narrative
│   │   ├── convert-recommendation/route.ts  ← Tense conversion (exists but unused by frontend)
│   │   ├── customize/route.ts      ← AI narrative customization
│   │   ├── delete-account/route.ts ← Self-service account deletion (service role)
│   │   ├── export-docx/route.ts    ← Word document generation
│   │   ├── export-pdf/route.ts     ← PDF document generation
│   │   ├── generate/route.ts       ← AI narrative generation (auth + rate limited + restriction check)
│   │   ├── narratives/
│   │   │   ├── route.ts            ← GET saved narratives for authenticated user
│   │   │   └── save/route.ts       ← POST save narrative (INSERT — not upsert)
│   │   ├── proofread/route.ts      ← AI audit (story-type-aware prompt selection)
│   │   ├── saved-repairs/
│   │   │   ├── route.ts            ← GET/POST repair templates
│   │   │   └── [id]/route.ts       ← PUT/DELETE individual template (ownership verified)
│   │   ├── send-email/route.ts     ← Email export via Resend (up to 10 recipients)
│   │   ├── stripe/
│   │   │   ├── route.ts            ← Checkout session creation + access code bypass
│   │   │   └── webhook/route.ts    ← Stripe webhook handler (signature verification)
│   │   ├── support/route.ts        ← Support ticket submission
│   │   ├── teams/route.ts          ← Team CRUD operations (admin-accessible)
│   │   └── update-narrative/route.ts  ← Diagnostic→Repair Complete narrative update
│   ├── auth/callback/route.ts      ← Supabase PKCE code exchange for email confirmation
│   ├── layout.tsx                  ← Root layout: Orbitron + Inter fonts, ThemeProvider, ToastProvider, env validation
│   ├── page.tsx                    ← Landing page (cinematic entrance, wave background)
│   └── globals.css                 ← Tailwind v4 @theme config + :root CSS custom properties
├── components/
│   ├── ThemeProvider.tsx            ← Accent color + dark/light mode + background animation context
│   ├── admin/
│   │   ├── ActivityDetailModal.tsx  ← Shared modal for viewing full activity log entry details
│   │   └── TokenCalculator.tsx     ← Gemini API token pricing calculator widget
│   ├── dashboard/
│   │   ├── EditProfileModal.tsx     ← First/last name, location, position dropdown editor
│   │   ├── NarrativeDetailModal.tsx ← Read-only saved narrative viewer + export + update-with-repair
│   │   ├── NarrativeHistory.tsx     ← Saved narrative table with search, sort, filter, type badges
│   │   ├── PreferencesPanel.tsx     ← Accent color picker + dark/light toggle + particle animation toggle
│   │   ├── ProfileSection.tsx       ← Position-based icon + profile info display
│   │   └── UpdateWithRepairModal.tsx ← Diagnostic→Repair update flow modal
│   ├── input/
│   │   ├── ConditionalField.tsx     ← Field 6+ with dropdown (Include/Don't Include/Generate)
│   │   ├── EditRepairModal.tsx      ← Edit saved repair template
│   │   ├── MyRepairsPanel.tsx       ← Slide-out panel for repair templates
│   │   ├── PreGenCustomization.tsx  ← Pre-generation output customization (Length/Tone/Detail)
│   │   ├── SaveRepairModal.tsx      ← Save current form as repair template
│   │   └── StoryTypeSelector.tsx    ← Diagnostic Only / Repair Complete toggle
│   ├── layout/
│   │   ├── FAQContent.tsx           ← 15 Q&A items covering all features
│   │   ├── HeroArea.tsx             ← 100px reactive sine wave hero banner with oversized floating logo
│   │   ├── NavBar.tsx               ← 64px sticky nav: MAIN MENU button, centered vector logo, theme toggle, UserPopup
│   │   ├── SupportForm.tsx          ← Support ticket form component
│   │   ├── TermsOfUse.tsx           ← 11-section Terms of Use content
│   │   └── UserPopup.tsx            ← PositionIcon + T.Cloyd name format + dropdown (Dashboard, Owner/Team Dashboard, Logout)
│   ├── narrative/
│   │   ├── CustomizationPanel.tsx   ← 3 segmented controls + custom instructions (max 50 chars)
│   │   ├── EditStoryModal.tsx       ← Editable narrative with auto-sizing textareas
│   │   ├── EmailExportModal.tsx     ← Email input + multi-recipient (up to 10) + Resend integration
│   │   ├── NarrativeDisplay.tsx     ← Block/C/C/C format display with typing animation + proofread highlighting
│   │   ├── ProofreadResults.tsx     ← Flagged issues + suggested edits with checkboxes + rating badge
│   │   └── ShareExportModal.tsx     ← Copy/Print/PDF/DOCX/Email export hub
│   └── ui/
│       ├── AccentColorPicker.tsx    ← 9-swatch color picker (uses useTheme)
│       ├── AutoTextarea.tsx         ← Auto-expanding textarea (resize:none + scrollHeight)
│       ├── Button.tsx               ← motion.button with primary/secondary/ghost variants
│       ├── CursorGlow.tsx           ← Cursor-following radial gradient underglow wrapper
│       ├── ErrorBoundary.tsx        ← React error boundary for protected layout
│       ├── Input.tsx                ← Themed text input with forwardRef
│       ├── LiquidCard.tsx           ← Glassmorphism card with CursorGlow wrapper
│       ├── LoadingSpinner.tsx       ← Branded spinner with contextual message prop
│       ├── Logo.tsx                 ← Accent-colored logo with size variants (hydration-safe)
│       ├── Modal.tsx                ← Portaled modal with scale animation + scroll + backdrop
│       ├── PageTransition.tsx       ← Framer Motion fade+slide wrapper
│       ├── ParticleNetwork.tsx      ← Full-page particle network canvas animation (protected pages)
│       ├── PositionIcon.tsx         ← Position-based SVG icon (Wrench, Hammer, ScanLine, etc.)
│       ├── Select.tsx               ← Themed select dropdown with ChevronDown icon
│       ├── Textarea.tsx             ← Themed multiline textarea with forwardRef
│       ├── ToastProvider.tsx        ← react-hot-toast with themed styling
│       └── WaveBackground.tsx       ← Sine wave canvas animation (landing/auth pages)
├── constants/
│   ├── fieldConfig.ts              ← Input field definitions for both story types + dropdown options
│   ├── positions.ts                ← POSITION_OPTIONS: Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk
│   └── prompts.ts                  ← ALL Gemini system prompts + LENGTH/TONE/DETAIL modifier constants
├── hooks/
│   ├── useActivityPulse.ts         ← Hero wave reactivity system (module-level shared amplitude)
│   ├── useAuth.ts                  ← Shared auth state singleton (module-level, never torn down on navigation)
│   ├── useSessionExpiry.ts         ← 8-hour auto-logout with 60-second check interval
│   └── useTypingAnimation.ts       ← Character-by-character text display with skip() function
├── lib/
│   ├── activityLogger.ts           ← Fire-and-forget activity log inserts (never blocks UI)
│   ├── compileDataBlock.ts         ← Input fields + dropdown logic → compiled API prompt string
│   ├── constants/themeColors.ts    ← 9 AccentColor definitions + buildCssVars() + perceivedBrightness()
│   ├── env.ts                      ← Environment variable validation (required + optional)
│   ├── exportUtils.ts              ← Shared ExportPayload interface + downloadExport() + buildPrintHtml() + buildEmailHtml()
│   ├── gemini/client.ts            ← generateWithGemini() + parseJsonResponse<T>() — model: gemini-3-flash-preview
│   ├── highlightUtils.ts           ← findHighlightRanges() for proofread snippet highlighting
│   ├── rateLimit.ts                ← In-memory rate limiter (resets on server restart)
│   ├── stripe/client.ts            ← Server-side Stripe client initialization
│   ├── supabase/
│   │   ├── client.ts               ← Browser-side Supabase client (createBrowserClient)
│   │   ├── middleware.ts            ← updateSession() — session refresh + route protection
│   │   └── server.ts               ← Server-side Supabase client (createServerClient with cookie auth)
│   ├── usageLogger.ts              ← Server-side Gemini API token usage logger (instruments all 6 AI routes)
│   └── utils.ts                    ← cn() class merger + withTimeout() promise wrapper
├── middleware.ts                    ← Next.js middleware → calls updateSession()
├── stores/
│   └── narrativeStore.ts           ← Global narrative state (useSyncExternalStore pattern)
└── types/
    └── database.ts                 ← TypeScript interfaces: UserProfile, UserPreferences, ActivityLog, Narrative, Team, etc.
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
  team_id UUID REFERENCES public.teams(id),  -- Team assignment (nullable — unassigned users)
  preferences JSONB DEFAULT '{}'::jsonb,  -- Stores appearance + template prefs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies:
-- "Users can view own profile" FOR SELECT USING (auth.uid() = id)
-- "Users can update own profile" FOR UPDATE USING (auth.uid() = id)
-- "Users can insert own profile" FOR INSERT WITH CHECK (auth.uid() = id)
-- Admin policies also exist for owner-level operations via service role client
```

**Role Hierarchy (3-tier system — restructured in Stage 5 Sprint 8):**
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
  full_narrative TEXT,      -- block_narrative field
  story_type VARCHAR NOT NULL CHECK (story_type IN ('diagnostic_only', 'repair_complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- NO unique constraint on (user_id, ro_number) — same RO# can have both diagnostic and repair entries
-- This is critical: diagnostic-only and repair-complete narratives sharing the same RO# MUST save as separate rows via plain INSERT — never upsert or overwrite
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
  access_code TEXT NOT NULL,      -- Unique team access code for signup auto-assignment
  description TEXT,
  created_by UUID REFERENCES auth.users(id),  -- Owner who created the team
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
  added_by UUID REFERENCES auth.users(id),  -- Who added this member
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- UNIQUE constraint on (team_id, user_id) prevents duplicate membership
);
```

### Table: `public.api_usage_log` — Gemini API token usage tracking

```sql
CREATE TABLE public.api_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action_type TEXT NOT NULL,         -- 'generate', 'customize', 'proofread', 'apply-edits', 'update-narrative', 'convert-recommendation'
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  model_name TEXT DEFAULT 'gemini-3-flash-preview',
  estimated_cost_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Pricing rates (as of gemini-3-flash-preview):**
- Input: $0.50 per 1M tokens ($0.0000005 per token)
- Output: $3.00 per 1M tokens ($0.000003 per token)

### Legacy Table: `public.token_usage`

This table was created before `api_usage_log` and may still have its default model_name set to `gemini-2.0-flash`. It is no longer actively used by the application — `api_usage_log` is the current token tracking table. Consider dropping this table during a future cleanup sprint.

### Migrations (in chronological order)

1. `001_initial_schema.sql` — users, narratives, auto-profile trigger, RLS
2. `002_add_name_fields_and_position_update.sql` — first_name, last_name columns
3. `003_narrative_upsert_support.sql` — updated_at, dedup, unique constraint, UPDATE policy
4. `004_admin_role_and_activity_log.sql` — role, is_restricted, activity_log table, admin RLS, is_admin() helper
5. `005_saved_repairs.sql` — saved_repairs table + RLS
6. `006_drop_narrative_unique_constraint.sql` — drops unique(user_id, ro_number) for multi-entry support
7. `fix_activity_log_user_fk_to_public_users` — Redirects activity_log FK from auth.users to public.users for PostgREST joins
8. `create_token_usage_table` — Legacy token tracking table (superseded by api_usage_log)
9. `create_groups_table` — Originally created group system tables
10. `rename_groups_to_teams` — Renamed groups → teams across all tables/columns
11. `009_api_usage_log.sql` — api_usage_log table with token tracking and cost estimation

Additional manual SQL applied:
- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;`
- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);`

---

## TYPESCRIPT INTERFACES (`src/types/database.ts`)

```typescript
export interface UserPreferences {
  appearance?: {
    accentColor: string;        // Key from themeColors.ts (e.g., 'violet', 'blue')
    mode: 'dark' | 'light';
    backgroundAnimation?: boolean;  // Particle network on/off — undefined treated as true
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
  role: 'owner' | 'admin' | 'user';  // 3-tier hierarchy
  is_restricted: boolean;
  team_id: string | null;              // UUID of assigned team
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

**Browser client** (`src/lib/supabase/client.ts`) — used ONLY for auth state and activity logging:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

**Server client** (`src/lib/supabase/server.ts`) — used for ALL data operations in API routes:
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

**Token usage instrumentation:** The `generateWithGemini` function also returns token usage metadata (`promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`) which is captured by `src/lib/usageLogger.ts` and written to the `api_usage_log` table. All 6 AI-calling API routes (generate, customize, proofread, apply-edits, update-narrative, convert-recommendation) are instrumented.

---

## GLOBAL STATE: NARRATIVE STORE (`src/stores/narrativeStore.ts`)

Uses React's `useSyncExternalStore` for automatic listener cleanup on unmount (replaced broken useState pub/sub pattern that caused stale listeners and lockups):

```typescript
interface NarrativeState {
  storyType: StoryType | null;
  fieldValues: Record<string, string>;
  dropdownSelections: Record<string, DropdownOption>;
  roNumber: string;
  compiledDataBlock: string;
  narrative: NarrativeData | null;      // { block_narrative, concern, cause, correction }
  displayFormat: 'block' | 'ccc';      // default: 'ccc'
  lengthSlider: 'short' | 'standard' | 'detailed';
  toneSlider: 'warranty' | 'standard' | 'customer_friendly';
  detailSlider: 'concise' | 'standard' | 'additional';
  customInstructions: string;
  generationId: number;                 // increments on new generation request
  isSaved: boolean;                     // navigation guard — true initially (no narrative to protect)
  savedNarrativeId: string | null;      // Supabase UUID for duplicate prevention
}
```

**Key actions:**
- `setStoryType(type)` — preserves shared fields (year, make, model, customer_concern, codes_present, diagnostics_performed, root_cause) when switching between diagnostic/repair
- `setNarrative(data)` — sets narrative and resets `isSaved: false`, `savedNarrativeId: null`
- `clearForNewGeneration()` — resets narrative + customization + increments generationId
- `markSaved(id)` — sets `isSaved: true` and `savedNarrativeId`
- `setForRepairUpdate(data)` — sets narrative from update-narrative API, carries forward vehicle info + RO#, sets storyType to 'repair_complete'
- `clearFormFields()` — resets fieldValues + dropdownSelections + roNumber (does NOT change storyType)

---

## GLOBAL STATE: AUTH HOOK (`src/hooks/useAuth.ts`)

Module-level singleton pattern — same as narrativeStore. Auth subscription persists for the app lifetime and is NEVER torn down during route transitions.

**Key exports:**
- `user: User | null` — Supabase auth user
- `profile: UserProfile | null` — Profile from users table (includes role, team_id, preferences)
- `loading: boolean` — True until initial auth check completes
- `signOut()` — Clears localStorage keys (sd-login-timestamp, sd-accent-color, sd-color-mode, sd-bg-animation), calls Supabase signOut, redirects to `/`
- `refreshProfile()` — Re-fetches profile from users table, notifies all subscribers

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
  required: boolean;       // true = always required, no dropdown
  hasDropdown: boolean;     // true = conditional field with dropdown
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

When non-standard settings are selected on the Input Page via `PreGenCustomization.tsx`, the compiled data block gets an appended section using the same modifier constants from `src/constants/prompts.ts`:

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

Ref: `ServiceDraft_AI_Prompt_Logic_v1.md` Section 7 for exact slider modifier text.

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

**Enhanced metadata (Stage 6 Sprint B):** generate, regenerate, customize, and save actions now include metadata with: narrative preview (first 500 chars), vehicle year/make/model, RO number, and story type. This data is displayed in the `ActivityDetailModal` component.

---

## API USAGE TRACKING SYSTEM (Stage 6 Sprint B)

### Architecture

```
src/lib/usageLogger.ts            → logApiUsage() function — server-side only
src/lib/gemini/client.ts           → Returns token usage metadata from Gemini responses
src/app/api/admin/usage/route.ts   → Aggregated usage stats endpoint
src/components/admin/TokenCalculator.tsx → Interactive pricing calculator widget
```

### How It Works

1. **`generateWithGemini()`** returns both the response text and token usage metadata (`promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`) from the Gemini API response
2. **`logApiUsage()`** (`src/lib/usageLogger.ts`) is called by each instrumented API route after a successful Gemini call. It calculates `estimated_cost_usd` using the current pricing rates and inserts a row into `api_usage_log`
3. **All 6 AI routes are instrumented:** generate, customize, proofread, apply-edits, update-narrative, convert-recommendation

### Usage Logger (`src/lib/usageLogger.ts`)

```typescript
const INPUT_COST_PER_TOKEN = 0.0000005;   // $0.50 / 1M tokens
const OUTPUT_COST_PER_TOKEN = 0.000003;    // $3.00 / 1M tokens

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

## TEAM MANAGEMENT SYSTEM (Stage 5 Sprints 9-10 + Stage 6)

### Overview

Teams are organizational groups of users managed by the platform owner. Each team has a unique access code used during signup for automatic assignment. Team Managers (admin role) can view their team's members and activity.

### Architecture

```
Database:     public.teams + public.team_members + users.team_id
API:          src/app/api/teams/route.ts (team CRUD for admin-level users)
              src/app/api/admin/route.ts (owner-level team operations: list_teams, assign_user, create_team)
Pages:        src/app/(protected)/team-dashboard/page.tsx
Signup:       src/app/(auth)/signup/page.tsx (team auto-assignment via access code)
```

### Signup Team Auto-Assignment Flow

1. User enters an access code during signup (Step 2)
2. The `/api/stripe/route.ts` access code validation checks:
   - First: Does the code match the global `ACCESS_CODE` env var? → bypass subscription
   - Second: Does the code match any `teams.access_code`? → bypass subscription AND auto-assign to that team
3. If team match found: sets `team_id` on the user record and creates a `team_members` entry
4. User proceeds to Step 3 (profile creation) with team assignment already in place

### Team API Routes (`/api/teams`)

| Action | Method | Access | Description |
|--------|--------|--------|-------------|
| List teams | GET | admin+ | Returns teams the user manages or belongs to |
| Create team | POST | owner | Creates team with auto-generated access code |
| Update team | PUT | owner | Updates team name/description |
| Delete team | DELETE | owner | Soft-deletes team (is_active = false) |

### Owner Dashboard Team Actions (`POST /api/admin`)

These team actions are available to owner-role users through the admin API:

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

The entire app uses CSS custom properties for all accent colors, backgrounds, text, borders, shadows, and glow effects. The theme is controlled by `ThemeProvider` (`src/components/ThemeProvider.tsx`) which applies CSS variables to `document.documentElement` at runtime. Changing the accent color updates every component instantly.

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
| White | `white` | `#e2e8f0` | Forces dark mode |
| Black | `black` | `#1e293b` | Forces light mode |

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
  // accent.isLightMode → false
  // accent.isDarkMode → false
}
```

### ThemeProvider Internals

**`applyTheme(accent, mode)` — called on mount and whenever accent or colorMode changes:**
1. Calls `buildCssVars(accent)` to generate all CSS variable values
2. Loops through returned `Record<string, string>` and sets each via `root.style.setProperty(key, value)`
3. Sets `color-scheme` property to `'dark'` or `'light'` (controls browser form control rendering)
4. Computes `effectiveMode`: Black accent forces `'light'`, White accent forces `'dark'`, otherwise uses stored mode
5. If light mode active: applies additional overrides for `--bg-primary`, `--text-primary`, `--text-muted`, `--bg-modal`, `--bg-nav`, `--body-bg`, `--card-border`, `--modal-border`
6. Luminance check: `perceivedBrightness()` on `accent.hover` determines `--btn-text-on-accent` (black text if brightness > 180, white otherwise)
7. Sets `data-mode` attribute on `<html>` element for CSS selector targeting

**`--body-bg` resolution strategy:**
The page background gradient is set as a **fully resolved string** in `buildCssVars()`, NOT as CSS `var()` composition. This is because CSS `var()` composition in `:root` is unreliable when source variables are set as inline styles by JavaScript.

**`--wave-color` format:**
Bare RGB components (e.g., `195, 171, 226`) rather than `rgb()` or hex — allows canvas code to interpolate opacity per-wave using `rgba(${waveRgb}, ${wave.opacity})`.

### Background Animation and CSS Variables

Both `ParticleNetwork` (protected pages) and `WaveBackground` (landing/auth pages) read `--wave-color` from the DOM:

```tsx
const root = document.documentElement;
const waveRgb =
  root.style.getPropertyValue('--wave-color').trim() ||           // 1. Inline style (set by ThemeProvider)
  getComputedStyle(root).getPropertyValue('--wave-color').trim() || // 2. Computed style fallback
  '195, 171, 226';                                                  // 3. Hardcoded fallback (Violet)
```

ParticleNetwork re-reads every 2 seconds via `setInterval`. WaveBackground reads every frame.

### Form Control Styling

Two layers ensure dark-themed form controls:
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
- Only buttons and small interactive controls use scale hover
- Disabled buttons: pass `undefined` for whileHover/whileTap (no animation when disabled)
- Button uses `motion.button` with interface extending `Omit<ButtonHTMLAttributes, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'>` to avoid Framer Motion type conflicts

### Using Framer Motion boxShadow with CSS Variables

```tsx
<motion.div
  whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glow-accent)' }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
```

### Cursor Underglow Effect (`src/components/ui/CursorGlow.tsx`)

```tsx
<CursorGlow radius={200} opacity={0.15} enabled={true}>
  <div>Card content here</div>
</CursorGlow>
```

Props: `radius` (default 200px), `opacity` (default 0.15), `enabled` (default true), `className`

How it works: `onMouseMove` tracks cursor → positioned overlay with `radial-gradient(circle ${radius}px at ${x}px ${y}px, var(--accent-primary), transparent)` → fades in/out via CSS transition → `pointer-events: none` on overlay → `borderRadius: inherit` for rounded corners.

LiquidCard wraps its content in CursorGlow automatically (controlled by `glow` prop, default true).

### Page Transitions

Every protected page: `<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>`

Landing page: cinematic stagger — logo (scale 0.8→1 over 1s), subtitle (0.6s delay), buttons (1.1s delay).

Landing→Login: fade-out (350ms) → fade-in (400ms) crossfade.

---

## APPENDIX: PAGE LAYOUT STRUCTURE

### Overview

All protected pages follow this top-to-bottom fixed header layout:

```
┌─────────────────────────────────────────────────────┐
│  HERO AREA (100px, fixed, z-90) — reactive waves    │
│  + oversized floating logo (z-110, 409px tall,      │
│    pointer-events-none)                              │
├─────────────────────────────────────────────────────┤
│  NAV BAR (64px, fixed, z-100) — MAIN MENU button,  │
│  centered vector logo (theme-aware filter),          │
│  theme toggle, UserPopup                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PAGE CONTENT (scrollable, paddingTop: 164px)       │
│  ParticleNetwork at z-10 behind content             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Protected Layout (`src/app/(protected)/layout.tsx`)

```tsx
<>
  {backgroundAnimation && <ParticleNetwork />}  {/* z-10, full-page, toggleable */}
  <HeroArea />                                    {/* fixed top-0, z-90 */}
  <NavBar />                                      {/* fixed top-100px, z-100 */}
  <main className="relative z-30 min-h-[calc(100vh-164px)]" style={{ paddingTop: '164px' }}>
    <ErrorBoundary>{children}</ErrorBoundary>
  </main>
</>
```

### HeroArea Reactive Animation (`src/components/layout/HeroArea.tsx`)

5-layer sine wave animation responding to `useActivityPulse`:

| Activity | Spike Intensity |
|----------|----------------|
| Typing in any form field | 0.35 |
| Button click | 0.65 |
| Generic click | 0.15 |
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

NavBar also displays centered "v1.0.0-beta" version label (accent-bright color, hidden on mobile).

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

- **Not logged in:** ThemeProvider resets to purple dark defaults
- **SIGNED_OUT event:** Resets to purple dark + clears localStorage
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
- **Analytics API:** `src/app/api/admin/analytics/route.ts` — GET endpoint with `?range=` param (7/30/90/all)
- **Usage API:** `src/app/api/admin/usage/route.ts` — GET endpoint for Gemini token usage stats
- **Access:** All routes verify `role = 'owner'` on the user's profile. Non-owners are redirected.

### Owner Dashboard Tabs

1. **Overview** — 8 metric cards (total users, new this week/month, active subscriptions, total narratives, narratives this week/today, total generations)
2. **Activity Log** — Paginated table of all user activity with search, action filter, sort. Clickable rows open `ActivityDetailModal` with full metadata display
3. **User Management** — Sortable user table with search, inline actions (reset password, restrict, change subscription, promote/demote, delete). Includes Team column with assignment. CREATE TEAM button.
4. **Analytics** — Recharts-powered charts (LineChart for generation trends, BarChart for activity by type, PieChart for story types, AreaChart for usage over time). Time range selector (7d/30d/90d/all). System health indicators.
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
| `assign_user` | `userId`, `teamId` | Assigns user to team (updates team_id + team_members) |
| `create_team` | `name` | Creates team with auto-generated access code |

### Analytics API Returns

`totalUsers`, `newUsersWeek`, `newUsersMonth`, `activeSubscriptions`, `totalNarratives`, `narrativesWeek`, `narrativesToday`, `totalGenerations`, `totalExports`, `totalProofreads`, `totalCustomizations`, `totalSavedTemplates`, `activityByType`, `activityByDay`, `dailyNarratives`, `topUsers` (top 10), `storyTypes`, `subscriptionBreakdown`, `usageOverTime`, `actionTypes`, `systemHealth` (DB row counts, last activity, app version)

### Protected User

`hvcadip@gmail.com` shows "Protected" badge with ShieldCheck icon instead of delete/restrict buttons. Cannot be accidentally deleted or restricted.

### Key Patterns

- Service role client (`SUPABASE_SERVICE_ROLE_KEY`) used for admin operations bypassing RLS
- Admin verification via session client — checks user's own auth, then reads role from `users` table
- Analytics charts built with `recharts` (LineChart, BarChart, PieChart, AreaChart)
- Tab transitions use AnimatePresence with slide/fade variants
- Auto-refresh uses `setInterval(fetchAnalytics, 60000)` with cleanup on tab switch
- Table UI: email column truncation (max-w-[180px] with tooltip), center-aligned headers/cells, glowing accent-colored row hover effects

### Activity Detail Modal (`src/components/admin/ActivityDetailModal.tsx`)

Shared modal component used by BOTH Owner Dashboard and Team Dashboard activity log tabs:

- Framer Motion animations (fade backdrop + scale modal)
- Content sections: action type badge (color-coded), timestamp (MM/DD/YYYY HH:MM AM/PM), user info (name + email), vehicle info, RO number, story type badge, narrative text in scrollable container, input data, and collapsible "View Raw Data" JSON section
- Gracefully handles entries with minimal metadata (e.g., login events show only action badge, timestamp, and user info)
- Close on X button, backdrop click, and Escape key

---

## APPENDIX: MY REPAIRS / TEMPLATES SYSTEM

### API Routes

- `GET /api/saved-repairs` — Fetch all templates for authenticated user (ordered by updated_at desc)
- `POST /api/saved-repairs` — Create new template (validates template_name + story_type)
- `PUT /api/saved-repairs/[id]` — Update template (ownership verified, allowlist of updatable fields)
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

- `MyRepairsPanel.tsx` — slide-out panel from right side (positioned at `top: 164px` below hero+nav), portaled to document.body
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
| `NEXT_PUBLIC_APP_URL` | Public app URL for Stripe redirects (https://servicedraft.ai) |
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

Reference these before making changes in these areas:

1. **Supabase PostgREST joins require FKs on `public` schema tables.** If a query returns "Could not find a relationship in the schema cache," the FK likely points to `auth.users` instead of `public.users`. Fix: drop FK, recreate pointing to `public.users`, then run `NOTIFY pgrst, 'reload schema'`.

2. **All Supabase data operations belong in server-side API routes.** The browser Supabase client has unreliable auth state across Next.js route transitions, causing timeouts and save lockups.

3. **Diagnostic Only and Repair Complete narratives sharing the same RO# must save as separate database rows** via plain INSERT — never upsert or overwrite across story types.

4. **Stale `.next` cache can serve old code after fixes are committed.** When behavior doesn't match committed code, delete `.next` with `rmdir /s /q .next` (Windows) or `rm -rf .next` before further debugging.

5. **The `useAuth` hook and `narrativeStore` are module-level singletons.** They persist across route transitions and should NEVER be torn down during navigation. Only a full page reload or explicit sign-out resets them. Tearing down the auth subscription on unmount causes AbortError and login lockups.

6. **`useSyncExternalStore` must be used for the narrative store.** The original `useState(() => subscribe())` pattern never cleaned up listeners on unmount — every page navigation added a permanent listener to the global Set, causing stale re-renders and state corruption.

7. **SUPABASE_SERVICE_ROLE_KEY copy errors:** Accidentally prepending surrounding UI text (e.g., "you") to the key value is a known failure mode — always verify the raw key value with `.trim()` and `auth` options in the service client initialization.

8. **Cloudflare proxy must be disabled (grey cloud/DNS-only) when pointing to Vercel.** Orange cloud (proxy enabled) breaks Vercel's domain verification and SSL.

9. **Documentation updates must happen before git commits**, not after. Every sprint should explicitly update `BUILD_PROGRESS_TRACKER.md` before the commit step.

10. **React hydration mismatches** from ThemeProvider: Components that read accent color from context should render with default Violet values during SSR and swap to real values after mount using a `mounted` state guard pattern.

11. **Tailwind v4 uses CSS-first configuration** via `@theme` blocks in `globals.css`. There is no `tailwind.config.ts` file.

12. **`--body-bg` must be a fully resolved gradient string**, not CSS `var()` composition, because CSS `var()` in `:root` is unreliable when source vars are set as inline styles by JavaScript.

13. **Team-related database columns (e.g., `team_id`) must exist before code referencing them is deployed.** Run migrations in Supabase SQL Editor before deploying code that queries new columns. Console errors like "column users.team_id does not exist" mean the migration hasn't been applied to the live database.

14. **The 3-tier role system (owner/admin/user) replaced the original 2-tier system.** All access gates, API routes, badges, promote/demote logic, and conditional UI rendering must check for the correct role string. Never assume only 'admin' and 'user' exist.

---

## APPENDIX: SIGNUP FLOW DETAILS

### Step 1 — Email & Password
Standard Supabase email/password signup. Email confirmation is currently **disabled** for beta testing (toggle in Supabase Dashboard: Auth > Providers > Email > "Confirm email" OFF). Must be re-enabled for production launch.

### Step 2 — Access Code & Payment
- User enters an access code
- Code is validated against: (1) global `ACCESS_CODE` env var, (2) team-specific `teams.access_code` values
- If global match: subscription set to `'bypass'`, no team assignment
- If team match: subscription set to `'bypass'` AND user auto-assigned to that team (team_id set, team_members row created)
- If no match: redirects to Stripe checkout for subscription payment

### Step 3 — Profile Creation
- First Name (required), Last Name (required)
- Location — US state dropdown (all 50 states)
- Position — dropdown: Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk
- Username (required, must be unique)
- AccentColorPicker — 9-swatch color picker for initial theme preference

---

## APPENDIX: MODAL OPACITY & BLUR STANDARDS

Modals use a solid dark background so text is fully readable without background bleed-through:
- **Modal panel:** `bg-[var(--bg-modal)]` with `backdrop-blur-xl` (24px), `border-[var(--modal-border)]`
- **Modal backdrop:** `bg-black/70` with `backdrop-blur-[4px]`
- **LiquidCard** (non-modal): `bg-[var(--bg-card)]` with `backdrop-blur-sm`, `border-[var(--card-border)]` — lighter for in-page cards

---

## APPENDIX: PROGRESS UPDATE FUNCTION

After completing each task, update `BUILD_PROGRESS_TRACKER.md`:

1. Add a new sprint/task section with `[x]` status and today's date
2. Add relevant notes and details
3. Update the "CURRENT STATUS" section at the top:
   - `**Last Updated:**` — today's date
   - `**Current Phase:**` — current phase/sprint name
   - `**Next Task:**` — the next thing to work on
4. Update summary counts if applicable
5. Commit with descriptive message

---

*— End of Claude Code Build Instructions —*
