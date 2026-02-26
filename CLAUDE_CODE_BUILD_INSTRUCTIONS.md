# SERVICEDRAFT.AI — CLAUDE CODE BUILD INSTRUCTIONS

## WHAT THIS DOCUMENT IS

This is the master instruction set for Claude Code to build the ServiceDraft.AI application. It contains the full technical specification for every phase of the build, including exact file paths, code patterns, and configuration details.

**CRITICAL: Before starting any work, ALWAYS read `BUILD_PROGRESS_TRACKER.md` first to see what has been completed and what the next task is.**

---

## HOW TO USE THIS DOCUMENT

1. **At the start of every session:**
   - Read `BUILD_PROGRESS_TRACKER.md` to identify the next incomplete task
   - Read the corresponding phase section in THIS document for detailed instructions
   - Read any referenced project knowledge files as needed

2. **When completing a task:**
   - Implement the task as described
   - Test that it works (run `npm run dev`, check for errors)
   - Update `BUILD_PROGRESS_TRACKER.md` — change `[ ]` to `[x]` and add today's date
   - Update the "CURRENT STATUS" section at the top of the tracker

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
| `SERVIDRAFT_AI_LOGO_1_.PNG` | Logo asset file — copy to `public/` directory |

---

## GLOBAL DEVELOPMENT RULES

Follow these at ALL times during the build:

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
- Use the **custom Tailwind theme** extensions defined in Phase 0, Task 0.4
- For one-off styles that Tailwind can't handle, use inline `style={}` or `globals.css`
- **CRITICAL: Use CSS variables for ALL colors** — never hardcode hex values like `#a855f7` or `rgba(168,85,247,0.3)`. Use `var(--accent-hover)`, `var(--accent-30)`, etc. See the "Accent Color Theming System" appendix below for the full variable reference.

### Error Handling
- Every API call must be wrapped in try/catch
- Every API route must return proper HTTP status codes (200, 400, 401, 500)
- User-facing errors shown as toast notifications
- Console.error for debugging, never console.log in production code

### State Management
- Use React `useState` and `useContext` for component-level state
- Use a global store (simple React context or zustand if needed) for cross-page state (narrative data, user data)
- Do NOT use Redux, MobX, or other heavy state libraries

---

## PHASE 0: PROJECT INITIALIZATION — DETAILED INSTRUCTIONS

### Task 0.1: Initialize Next.js Project

Run in the project root (the `servicedraft-ai` folder):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

If the folder already has files (README, build plan docs), Next.js may warn about a non-empty directory. If so:
1. Move the build plan files temporarily
2. Run the command
3. Move the files back

After initialization, verify with `npm run dev` — you should see the Next.js default page at `http://localhost:3000`.

### Task 0.2: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr framer-motion @google/generative-ai stripe @stripe/stripe-js lucide-react react-hot-toast
```

### Task 0.3: Project Folder Structure

Create all directories and placeholder page files. Each `page.tsx` should have minimal content like:

```tsx
// src/app/(protected)/main-menu/page.tsx
export default function MainMenuPage() {
  return <div>Main Menu — Coming Soon</div>;
}
```

### Task 0.4: Tailwind Configuration

Update `tailwind.config.ts` with the COMPLETE custom theme from `ServiceDraft_AI_UI_Design_Spec_v1.md` Section 13. This includes:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sd-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#49129b',
        },
        'sd-dark': {
          base: '#000000',
          surface: '#0f0520',
          elevated: '#1a0a2e',
          gradient1: '#260d3f',
          gradient2: '#490557',
        },
        'sd-text': {
          primary: '#ffffff',
          secondary: '#c4b5fd',
          muted: '#9ca3af',
        },
        'sd-wave': '#c3abe2',
      },
      borderRadius: {
        card: '23px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(73, 18, 155, 0.3)',
        'glow-md': '0 0 40px rgba(73, 18, 155, 0.4)',
        'glow-lg': '0 0 60px rgba(73, 18, 155, 0.5)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

Update `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #a855f7;
  --color-primary-light: #c084fc;
  --color-primary-dark: #9333ea;
  --color-glow: #49129b;
  --color-bg-base: #000000;
  --color-bg-gradient-1: #260d3f;
  --color-bg-gradient-2: #490557;
  --color-surface: rgba(197, 173, 229, 0.05);
  --color-surface-elevated: #1a0a2e;
  --color-input-bg: #0f0520;
  --color-text-primary: #ffffff;
  --color-text-secondary: #c4b5fd;
  --color-text-muted: #9ca3af;
  --color-border: #000000;
  --color-border-input: #6b21a8;
  --color-wave: #c3abe2;
}

body {
  background: linear-gradient(135deg, #260d3f 0%, #000000 50%, #490557 100%);
  min-height: 100vh;
  color: #ffffff;
}
```

### Task 0.5: Environment Variables Validation

Create `src/lib/env.ts`:

```typescript
// src/lib/env.ts
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\nCheck your .env.local file.`
    );
  }
}
```

---

## PHASE 1: DESIGN SYSTEM — DETAILED INSTRUCTIONS

### Task 1.1: Sine Wave Background

Create a canvas-based component. Ref: `ServiceDraft_AI_UI_Design_Spec_v1.md` Section 4.

Key requirements:
- Full viewport canvas behind all content
- 3-5 overlapping sine waves with different frequencies/amplitudes/speeds
- Stroke color: `#c3abe2` at 15-25% opacity
- Stroke width: 1-2px
- Animation speed: 8-12 second full cycle
- Uses `requestAnimationFrame` for smooth performance
- Canvas positioned at z-index: 10 (behind content)
- Must be performant — no frame drops

Pattern (protected pages use ParticleNetwork; landing/auth pages still use WaveBackground):
```tsx
"use client";
import { useEffect, useRef } from 'react';

// ParticleNetwork — floating particles with connecting lines (protected layout)
// WaveBackground — sine wave animation (landing page, auth pages)
// Both read --wave-color CSS variable for accent-reactive coloring
```

### Task 1.2: Liquid Card

Ref: `ServiceDraft_AI_UI_Design_Spec_v1.md` Section 5.

```tsx
// Props interface
interface LiquidCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'compact' | 'standard' | 'spacious';
  hover?: boolean; // Enable hover glow enhancement
}
```

CSS classes to apply:
- `bg-[rgba(197,173,229,0.05)]` (or use the CSS variable)
- `border-2 border-black`
- `rounded-card` (23px from Tailwind config)
- `backdrop-blur-sm`
- `shadow-glow-md`
- `transition-all duration-300`
- Hover: `hover:shadow-glow-lg`

### Task 1.3-1.9: Remaining Design Components

Follow the specifications in `ServiceDraft_AI_UI_Design_Spec_v1.md` for each component. Each component should:
- Be in its own file in `src/components/ui/`
- Accept standard props (className, children, etc.)
- Use the custom Tailwind theme defined in Phase 0
- Include all states (default, hover, focus, active, disabled)

---

## PHASE 2: AUTHENTICATION — DETAILED INSTRUCTIONS

### Task 2.1: Supabase Client Setup

Follow Supabase's official Next.js App Router guide. Two clients are needed:

**Browser client** (`src/lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Server client** (`src/lib/supabase/server.ts`):
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
              cookieStore.set(name, value, options)
            );
          } catch { /* Server component */ }
        },
      },
    }
  );
}
```

### Task 2.3: Database Tables

Create this SQL and run it in Supabase's SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- Users profile table (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR NOT NULL,
  username VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  location VARCHAR,
  position VARCHAR,
  profile_picture_url VARCHAR,  -- No longer used; position-based icons displayed instead
  subscription_status VARCHAR DEFAULT 'trial',
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Narratives table
CREATE TABLE public.narratives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  ro_number VARCHAR NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_make VARCHAR NOT NULL,
  vehicle_model VARCHAR NOT NULL,
  concern TEXT NOT NULL,
  cause TEXT NOT NULL,
  correction TEXT NOT NULL,
  full_narrative TEXT NOT NULL,
  story_type VARCHAR NOT NULL CHECK (story_type IN ('diagnostic_only', 'repair_complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;

-- Users can only access their own narratives
CREATE POLICY "Users can view own narratives" ON public.narratives
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own narratives" ON public.narratives
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**IMPORTANT:** This SQL must be run manually by the user in the Supabase Dashboard. Claude Code should create the SQL file at `supabase/migrations/001_initial_schema.sql` AND instruct the user to run it. Add a `⚠️ BLOCKED:` note if the user hasn't confirmed the tables are created.

### Signup Step 3: Profile Fields (Updated 2026-02-19)

The signup profile creation step collects:
- **First Name** (required) — saved as `first_name` in users table
- **Last Name** (required) — saved as `last_name` in users table
- **Location** (optional) — free text input
- **Position** (required) — dropdown with predefined roles:
  - Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk
  - Defined in `src/constants/positions.ts` as `POSITION_OPTIONS`
  - This field is used for analytics (Sprint 6 Admin Dashboard)

### Position-Based Icon System (Added 2026-02-19)

Profile pictures have been replaced with position-based icons. The mapping is:

| Position | Icon (lucide-react) | Component |
|----------|-------------------|-----------|
| Technician | `Wrench` | Reflects logo wrench styling |
| Foreman | `Hammer` | |
| Diagnostician | `ScanLine` | Diagnostic/test light style |
| Advisor | `PenLine` | |
| Manager | `ClipboardList` | |
| Warranty Clerk | `BookOpen` | |
| (fallback) | `User` | When position is null/unknown |

Implementation: `src/components/ui/PositionIcon.tsx`
- Size variants: `small` (nav bar), `medium` (default), `large` (dashboard profile)
- Styled with purple glow to match app theme
- Used in: `ProfileSection.tsx`, `UserPopup.tsx`

---

## PHASE 4: INPUT PAGE — DETAILED INSTRUCTIONS

### Task 4.1: Field Configuration

Ref: `ServiceDraft_AI_Spec_v1_3.md` Section 5.3 and `ServiceDraft_AI_Prompt_Logic_v1.md` Section 2.

```typescript
// src/constants/fieldConfig.ts
export type DropdownOption = 'include' | 'exclude' | 'generate';

export interface FieldConfig {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;       // Always required (fields 1-5)
  hasDropdown: boolean;    // Has conditional dropdown (fields 6+)
  sentToApi: boolean;      // Whether this field is included in the compiled data block
  fieldType: 'text' | 'textarea';
}

export const DIAGNOSTIC_FIELDS: FieldConfig[] = [
  { id: 'ro_number', label: 'R.O. #', placeholder: 'Enter repair order number', required: true, hasDropdown: false, sentToApi: false, fieldType: 'text' },
  { id: 'year', label: 'Year', placeholder: '2024', required: true, hasDropdown: false, sentToApi: true, fieldType: 'text' },
  { id: 'make', label: 'Make', placeholder: 'Chevrolet', required: true, hasDropdown: false, sentToApi: true, fieldType: 'text' },
  { id: 'model', label: 'Model', placeholder: 'Silverado 1500', required: true, hasDropdown: false, sentToApi: true, fieldType: 'text' },
  { id: 'customer_concern', label: 'Customer Concern', placeholder: 'Describe what the customer reported...', required: true, hasDropdown: false, sentToApi: true, fieldType: 'textarea' },
  { id: 'codes_present', label: 'Codes Present', placeholder: 'P0300, P0301...', required: false, hasDropdown: true, sentToApi: true, fieldType: 'textarea' },
  { id: 'diagnostics_performed', label: 'Diagnostics Performed', placeholder: 'Describe diagnostic steps taken...', required: false, hasDropdown: true, sentToApi: true, fieldType: 'textarea' },
  { id: 'root_cause', label: 'Root Cause / Failure', placeholder: 'Describe identified root cause...', required: false, hasDropdown: true, sentToApi: true, fieldType: 'textarea' },
  { id: 'recommended_action', label: 'Recommended Action', placeholder: 'Describe recommended repair...', required: false, hasDropdown: true, sentToApi: true, fieldType: 'textarea' },
];

export const REPAIR_COMPLETE_FIELDS: FieldConfig[] = [
  // Same fields 1-8 as diagnostic, then:
  // field 9: repair_performed (instead of recommended_action)
  // field 10: repair_verification
];
```

### Task 4.6: Compiled Data Block Assembly

Ref: `ServiceDraft_AI_Prompt_Logic_v1.md` Section 2 — complete logic.

```typescript
// src/lib/compileDataBlock.ts
export function compileDataBlock(
  fields: FieldConfig[],
  values: Record<string, string>,
  dropdownSelections: Record<string, DropdownOption>
): string {
  const lines: string[] = [];

  for (const field of fields) {
    // Skip R.O. # — never sent to API
    if (!field.sentToApi) continue;

    // Required fields (1-5) — always included
    if (field.required) {
      lines.push(`${field.label.toUpperCase()}: ${values[field.id]}`);
      continue;
    }

    // Conditional fields (6+)
    const selection = dropdownSelections[field.id];

    if (selection === 'include') {
      lines.push(`${field.label.toUpperCase()}: ${values[field.id]}`);
    } else if (selection === 'generate') {
      lines.push(
        `${field.label.toUpperCase()}: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable ${field.label.toUpperCase()} using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.`
      );
    }
    // 'exclude' — skip entirely
  }

  return lines.join('\n');
}
```

---

## PHASE 5: AI INTEGRATION — DETAILED INSTRUCTIONS

### Task 5.1: Gemini Client

```typescript
// src/lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;
  return response.text();
}

export function parseNarrativeResponse(raw: string): {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
} {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  // Validate all 4 keys exist
  const required = ['block_narrative', 'concern', 'cause', 'correction'];
  for (const key of required) {
    if (!parsed[key] || typeof parsed[key] !== 'string') {
      throw new Error(`Missing or invalid key in AI response: ${key}`);
    }
  }

  return parsed;
}
```

### Task 5.2: Generate Narrative Route

Ref: `ServiceDraft_AI_Prompt_Logic_v1.md` Sections 3 and 4 for the EXACT system prompts and user prompt templates. Copy them EXACTLY — do not modify the prompt text.

```typescript
// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini, parseNarrativeResponse } from '@/lib/gemini/client';

// Import the system prompts from a constants file
// These should be COPIED EXACTLY from ServiceDraft_AI_Prompt_Logic_v1.md

export async function POST(request: NextRequest) {
  try {
    const { compiledDataBlock, storyType } = await request.json();

    // Select system prompt based on story type
    const systemPrompt = storyType === 'diagnostic_only'
      ? DIAGNOSTIC_SYSTEM_PROMPT
      : REPAIR_COMPLETE_SYSTEM_PROMPT;

    // Build user prompt
    const userPrompt = storyType === 'diagnostic_only'
      ? `Generate an audit-proof warranty narrative based on the following diagnostic-only repair order information. This is a diagnosis-only scenario — the repair has NOT been performed yet. The correction section should describe what repair is RECOMMENDED.\n\nVEHICLE & REPAIR ORDER INFORMATION:\n---\n${compiledDataBlock}\n---`
      : `Generate an audit-proof warranty narrative based on the following completed repair order information. This repair has been fully completed and verified.\n\nVEHICLE & REPAIR ORDER INFORMATION:\n---\n${compiledDataBlock}\n---`;

    const raw = await generateWithGemini(systemPrompt, userPrompt);
    const narrative = parseNarrativeResponse(raw);

    return NextResponse.json(narrative);
  } catch (error) {
    console.error('Generate narrative error:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative. Please try again.' },
      { status: 500 }
    );
  }
}
```

### Tasks 5.3 and 5.4: Customize and Proofread Routes

Follow the same pattern as 5.2 but use the system prompts from:
- Customize: `ServiceDraft_AI_Prompt_Logic_v1.md` Section 8
- Proofread: `ServiceDraft_AI_Prompt_Logic_v1.md` Section 6

**CRITICAL:** Copy the prompt text EXACTLY from the Prompt Logic document. Do not paraphrase, shorten, or modify the prompts in any way.

---

## PHASE 6: NARRATIVE PAGE — KEY IMPLEMENTATION NOTES

### Customization Panel Slider Logic

Ref: `ServiceDraft_AI_Prompt_Logic_v1.md` Section 7 for exact slider modifier text.

Each slider has 3 positions. When at "Standard" (center), no modifier is added. When at either extreme, the exact modifier text from the Prompt Logic doc is appended to the customization block.

The customization sends the CURRENTLY DISPLAYED narrative (not the original input data). This means user edits via the Edit Story modal are preserved.

### State Management for Narrative Flow

The narrative page needs access to:
1. `compiledDataBlock` — from the input page (for regeneration)
2. `storyType` — from the input page
3. `roNumber` — from the input page (for saving to database)
4. `vehicleInfo` — year, make, model (for saving and proofread)
5. `currentNarrative` — the 4 keys from the latest API response (updated by generate, regenerate, customize, and edit)
6. `displayFormat` — 'block' or 'ccc'
7. `customizationSliders` — current slider positions

This state should persist across the input → narrative page navigation. Use React Context or a simple store.

### Export System (Redesigned 2026-02-19)

The Share/Export modal provides four options: Copy to Clipboard, Print, Download as PDF, and Download as Word Document. Both the narrative page and the dashboard's saved narrative modal share the same export paths.

**Shared Export Utility** (`src/lib/exportUtils.ts`):
- `ExportPayload` interface: normalizes data from both the narrative page (fieldValues-based) and dashboard (Narrative type with vehicle_year/vehicle_make/vehicle_model)
- `downloadExport(type, payload)`: calls the appropriate API route and triggers file download
- Used by `ShareExportModal` (narrative page) and `NarrativeDetailModal` (dashboard)

**Export Logo File:** `/public/ServiceDraft-ai-tight logo.PNG` — small square SD icon logo, placed in the document **footer** (bottom-right of every page). Dimensions: 19.6×15mm (PDF) / 55×43px (DOCX) with 1.3:1 width-to-height aspect ratio to prevent squishing. Falls back to italic text "ServiceDraft.AI" if file not found.

**Document Layout Specification** (identical for PDF and DOCX):
1. **Footer logo**: bottom-right of every page, right-aligned, aspect-corrected (1.3:1 w:h ratio)
2. **Two-column header**:
   - LEFT: "Vehicle Information:" (11pt bold underlined), then YEAR/MAKE/MODEL label:value lines (labels 11pt bold, values 11pt regular)
   - RIGHT: "Repair Order #:" (11pt bold underlined), then R.O. number (20pt bold, right-aligned)
3. **Title**: "REPAIR NARRATIVE" — 18pt bold underlined, centered, generous spacing before/after
4. **C/C/C sections**: headers (CONCERN:/CAUSE:/CORRECTION:) at 13pt bold italic underlined, body at 11pt regular, generous spacing between sections
5. **Block format**: same header/title, then flowing paragraph body at 11pt regular

**Font:** Helvetica (PDF, built-in) / Arial (DOCX). Both are visually near-identical.

**PDF Generation** (`src/app/api/export-pdf/route.ts`):
- Uses `jspdf` package, US Letter format, coordinate-based positioning
- Custom underline helper (jsPDF has no native underline)
- Automatic page breaks for long narratives
- Logo drawn in footer area after all body content, looped across all pages

**Word (.docx) Generation** (`src/app/api/export-docx/route.ts`):
- Uses `docx` package with native underline/bold/italic support
- Invisible-border `Table` for two-column header layout
- Logo placed in `Footer` component (repeats on every page)
- `ImageRun` for logo with `type: 'png'`, `UnderlineType.SINGLE` for underlined text

**npm packages:** `jspdf` (PDF generation), `docx` (Word document generation)

---

## PHASE 7: DASHBOARD — KEY IMPLEMENTATION NOTES

### Saved Narratives are READ ONLY

This is an intentional business decision for audit integrity. The dashboard shows saved narratives but does NOT allow editing them. The popup modal for viewing a saved narrative should have no edit controls.

---

## PHASE 8: STRIPE — KEY IMPLEMENTATION NOTES

### Access Code Bypass

For the prototype phase, implement a simple access code check:

```typescript
const VALID_ACCESS_CODES = [process.env.ACCESS_CODE || 'SERVICEDRAFT2026'];

export function validateAccessCode(code: string): boolean {
  return VALID_ACCESS_CODES.includes(code.toUpperCase().trim());
}
```

If a valid access code is entered, skip Stripe payment entirely and set `subscription_status` to `'bypass'` in the users table.

---

## PHASE 10: DEPLOYMENT — KEY IMPLEMENTATION NOTES

### Vercel Environment Variables

When deploying to Vercel, the user must manually add all environment variables from `.env.local` to the Vercel project settings. Claude Code should provide clear instructions for this.

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL` (set to the Vercel domain)

---

## APPENDIX: ACCENT COLOR THEMING SYSTEM (Added 2026-02-19)

### Overview

The entire app uses CSS custom properties for all accent colors, backgrounds, text, borders, shadows, and glow effects. The theme is controlled by `ThemeProvider` (`src/components/ThemeProvider.tsx`) which applies CSS variables to `document.documentElement` at runtime. Changing the accent color updates every component instantly.

### Architecture

```
src/lib/constants/themeColors.ts    → Color definitions & buildCssVars()
src/components/ThemeProvider.tsx     → React context, localStorage persistence, CSS injection
src/app/globals.css                 → :root defaults (Violet), CSS variable declarations
src/app/layout.tsx                  → <ThemeProvider> wraps the entire app
public/logo-{color}.PNG             → 9 accent-colored logo files
```

### How to Use in Components

**NEVER** hardcode hex colors. **ALWAYS** use CSS variable references via Tailwind arbitrary values:

```tsx
// CORRECT — uses CSS variables
<div className="bg-[var(--bg-card)] border-[var(--accent-border)] text-[var(--text-primary)]">
<button className="bg-[var(--accent-hover)] hover:bg-[var(--accent-primary)] text-white">
<span className="text-[var(--text-secondary)]">Secondary text</span>
<div className="shadow-[var(--shadow-glow-md)]">Glowing card</div>

// WRONG — hardcoded colors
<div className="bg-purple-600 text-[#c4b5fd]">
<button className="bg-[#a855f7]">
```

### CSS Variable Reference

| Variable | Purpose | Default (Violet) |
|----------|---------|-------------------|
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
| `--bg-input` | Input field background | `#0f0520` |
| `--bg-elevated` | Elevated surface | `#1a0a2e` |
| `--bg-card` | Card background (low opacity) | `rgba(r,g,b,0.05)` |
| `--bg-modal` | Modal background (high opacity) | `rgba(15,10,30,0.85)` |
| `--bg-nav` | Nav bar background | `rgba(0,0,0,0.8)` |
| `--body-bg` | Full body gradient | `linear-gradient(...)` |
| `--text-primary` | Primary text | `#ffffff` |
| `--text-secondary` | Secondary text (accent-tinted) | `#c4b5fd` |
| `--text-muted` | Muted/subtle text | `#9ca3af` |
| `--wave-color` | Wave RGB for canvas | `195, 171, 226` |
| `--card-border` | Card border color | `#000000` |
| `--modal-border` | Modal border color | `#000000` |
| `--scrollbar-track` | Scrollbar track bg | `var(--bg-input)` |
| `--scrollbar-thumb` | Scrollbar thumb bg | `var(--accent-border)` |
| `--scrollbar-thumb-hover` | Scrollbar thumb hover | `var(--accent-hover)` |
| `--bg-gradient-1` | Body gradient start | `#260d3f` |
| `--bg-gradient-2` | Body gradient end | `#490557` |

### Using Framer Motion boxShadow with CSS Variables

For Framer Motion `whileHover` boxShadow, pass the CSS variable string directly:

```tsx
<motion.div
  whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glow-accent)' }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
```

### Using the Theme Context

```tsx
import { useTheme } from '@/components/ThemeProvider';

function MyComponent() {
  const { accent, setAccentColor, colorMode, toggleColorMode } = useTheme();

  // accent.logoFile → '/logo-violet.PNG'
  // accent.key → 'violet'
  // accent.name → 'Violet'
  // accent.isLightMode → false
}
```

### 9 Available Accent Colors

| Color | Key | Hex | Light Mode? |
|-------|-----|-----|-------------|
| Violet | `violet` | `#9333ea` | No (default) |
| Red | `red` | `#dc2626` | No |
| Orange | `orange` | `#ea580c` | No |
| Yellow | `yellow` | `#eab308` | No |
| Green | `green` | `#84cc16` | No |
| Blue | `blue` | `#2563eb` | No |
| Pink | `pink` | `#d946ef` | No |
| White | `white` | `#e2e8f0` | No |
| Black | `black` | `#1e293b` | Yes (auto-activates light mode) |

### Logo System

Each accent color has a matching logo file in `public/`. The `Logo` component (`src/components/ui/Logo.tsx`) reads `accent.logoFile` from the theme context and renders the matching PNG. The original `logo.png` is kept as a fallback.

### ThemeProvider Internals (`src/components/ThemeProvider.tsx`)

The `ThemeProvider` is a React context provider that manages the accent color and color mode. It wraps the entire app in `src/app/layout.tsx`.

**How it works:**
1. On mount, reads `sd-accent-color` and `sd-color-mode` from `localStorage`
2. Calls `buildCssVars(accent)` from `themeColors.ts` to generate all CSS variable values
3. Loops through the returned `Record<string, string>` and sets each as an inline style on `document.documentElement` via `root.style.setProperty(key, value)`
4. Sets `color-scheme` property to `'dark'` or `'light'` (controls browser form control rendering)
5. If light mode is active (non-Black accent + user toggled), applies additional overrides for backgrounds, text, and borders

**Key function — `applyTheme(accent, mode)`:**
- Called on mount and whenever `accent` or `colorMode` state changes
- Computes `effectiveMode` — Black accent forces `'light'`, otherwise uses the stored mode
- Sets all 40+ CSS variables as inline styles on `:root`
- Light mode override block sets: `--bg-primary` to white, `--text-primary` to dark, `--bg-input`/`--bg-elevated` to light grays, `--body-bg` to light gradient, `--card-border`/`--modal-border` to accent border

**Key function — `buildCssVars(accent)` (`src/lib/constants/themeColors.ts`):**
- Takes an `AccentColor` object and returns a `Record<string, string>` of all CSS variable key-value pairs
- Generates: accent hex/hover/bright/border/deep, opacity variants (3%-50%), shadow presets, backgrounds, body gradient, text colors, wave color, card/modal borders
- `--body-bg` is fully resolved as a `linear-gradient(...)` string with actual hex values (NOT `var()` references) because CSS `var()` composition in `:root` is unreliable when source variables are set as inline styles by JavaScript
- `--wave-color` is emitted as bare RGB components (e.g., `195, 171, 226`) for use in canvas `rgba()` strings

**Exports:**
- `useTheme()` — hook returning `{ accent, setAccentColor, colorMode, toggleColorMode, accentColors, backgroundAnimation, setBackgroundAnimation }`
- `ThemeProvider` — default export, wraps children in context provider

### Background Animation and CSS Variables (`src/components/ui/ParticleNetwork.tsx` + `WaveBackground.tsx`)

Both background animation components read the accent color from CSS variables. ParticleNetwork (used on protected pages) polls every 2s; WaveBackground (used on landing/auth pages) reads every frame:

```tsx
// Inside the requestAnimationFrame draw loop:
const root = document.documentElement;
const waveRgb =
  root.style.getPropertyValue('--wave-color').trim() ||           // 1. Inline style (set by ThemeProvider)
  getComputedStyle(root).getPropertyValue('--wave-color').trim() || // 2. Computed style fallback
  '195, 171, 226';                                                  // 3. Hardcoded fallback (Violet)

// Used as: ctx.strokeStyle = `rgba(${waveRgb}, ${wave.opacity})`
```

**Why inline style first:** ThemeProvider sets `--wave-color` via `document.documentElement.style.setProperty()`. Reading from `root.style.getPropertyValue()` (inline) is more reliable and immediate than `getComputedStyle()`, which may lag behind during rapid theme changes.

**Why bare RGB format:** The `--wave-color` variable stores bare RGB components (e.g., `195, 171, 226`) rather than a complete `rgb()` or hex value. This allows the canvas drawing code to interpolate opacity per-wave using `rgba(${waveRgb}, ${wave.opacity})`.

### Form Control Styling (`color-scheme` + CSS Overrides)

Browsers render form controls (inputs, textareas, selects) based on the `color-scheme` CSS property. Without it, form controls default to light-scheme chrome (white backgrounds) even if CSS `background-color` is set.

**Solution (two layers):**

1. **`color-scheme` property** — Set in `:root` in `globals.css` as `color-scheme: dark` (default). ThemeProvider dynamically updates it to `'light'` when the effective mode is light. This tells the browser to render form control chrome (caret, autofill, scrollbars inside inputs) in dark or light mode.

2. **Explicit CSS overrides** — In `globals.css`, form elements are explicitly styled:
   ```css
   input, textarea, select {
     background-color: var(--bg-input);
     color: var(--text-primary);
   }
   input::placeholder, textarea::placeholder {
     color: var(--text-muted);
   }
   ```
   This ensures form controls always use theme variables regardless of Tailwind's preflight reset (which sets `background-color: transparent`).

### `--body-bg` Resolution Strategy

The page background gradient (`--body-bg`) is set as a **fully resolved string** in `buildCssVars()`, NOT as a CSS `var()` composition:

```typescript
// CORRECT — fully resolved gradient in buildCssVars():
'--body-bg': `linear-gradient(135deg, ${accent.gradient1} 0%, #000000 50%, ${accent.gradient2} 100%)`

// WRONG — var() composition in :root (unreliable with inline overrides):
'--body-bg': 'linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-primary) 50%, var(--bg-gradient-2) 100%)'
```

**Why:** When ThemeProvider sets `--bg-gradient-1` as an inline style on `:root`, a `--body-bg` defined in the stylesheet's `:root` block that references `var(--bg-gradient-1)` may not pick up the inline override in all browsers. By pre-resolving the gradient with actual hex values in `buildCssVars()`, the gradient is always correct.

The `:root` block in `globals.css` still declares `--body-bg` with `var()` references as the initial default (before ThemeProvider hydrates), but at runtime `buildCssVars()` overwrites it with the resolved string.

### Light/Dark Mode

- **Dark mode** is the default for all accent colors except Black
- **Black accent** automatically activates light mode (white backgrounds, dark text)
- `ThemeProvider` handles mode switching by overriding `--bg-primary`, `--text-primary`, `--text-muted`, `--bg-modal`, `--bg-nav` when in light mode
- `color-scheme` CSS property is dynamically set to `'light'` or `'dark'` to control browser form control rendering
- Preferences persist in localStorage under `sd-color-mode`

### Adding a New Accent Color

1. Add a new entry to `ACCENT_COLORS` array in `src/lib/constants/themeColors.ts`
2. Add a matching logo PNG to `public/logo-{key}.PNG`
3. That's it — `buildCssVars()` auto-generates all derived CSS properties

---

## APPENDIX: CONVENTIONS & STANDARDS (Added 2026-02-19)

### Field ID Convention

**CRITICAL:** Always use field IDs as defined in `src/constants/fieldConfig.ts`. The IDs are:
- `ro_number`, `year`, `make`, `model`, `customer_concern` (required fields)
- `codes_present`, `diagnostics_performed`, `root_cause`, `recommended_action`, `repair_performed`, `repair_verification` (conditional fields)

When accessing field values in the narrative store: `state.fieldValues['year']` (NOT `state.fieldValues['vehicle_year']`).

### Modal Opacity & Blur Standards

Modals use a solid dark background so text is fully readable without background bleed-through:
- **Modal panel:** `bg-[var(--bg-modal)]` with `backdrop-blur-xl` (24px), `border-[var(--modal-border)]`
- **Modal backdrop:** `bg-black/70` with `backdrop-blur-[4px]`
- **LiquidCard** (non-modal): `bg-[var(--bg-card)]` with `backdrop-blur-sm`, `border-[var(--card-border)]` — lighter for in-page cards

### Auto-Expanding Textarea Pattern

For text entry fields where content may exceed one line, use `AutoTextarea` (`src/components/ui/AutoTextarea.tsx`):
- Text wraps to the next line when it reaches field width
- Field height grows automatically as the user types
- Uses `resize: none` + `overflow: hidden` + `scrollHeight` auto-resize on input
- Starts at `rows={2}`, grows as needed
- Short metadata fields (R.O.#, Year, Make, Model) use standard `<Input>` instead

### Framer Motion Animation Standards (Added 2026-02-19)

All interactive elements use Framer Motion `whileHover` and `whileTap` for premium feel. CSS-only hover effects are insufficient.

**Spring transition config (used everywhere):**
```tsx
const springTransition = { type: 'spring', stiffness: 400, damping: 25 };
```

**Hover/Tap scale values by element type:**

| Element | whileHover scale | whileTap scale | boxShadow on hover |
|---------|-----------------|----------------|-------------------|
| LiquidCard | **NONE** (cursor underglow instead) | NONE | CSS hover `shadow-glow-accent` |
| Button | 1.05 | 0.95 | `var(--shadow-glow-sm)` |
| StoryTypeSelector cards | **NONE** | 0.97 | `var(--shadow-glow-sm)` |
| Small links (FAQ, etc.) | 1.08 | 0.95 | none |

**Rules:**
- **Cards and containers do NOT scale on hover** — they use the CursorGlow underglow effect instead (see below)
- **Only buttons and small interactive controls use scale hover** — keeps the layout stable
- Disabled buttons: pass `undefined` for whileHover/whileTap (no animation when disabled)
- LiquidCard: controlled by `glow` prop (default true), set `glow={false}` to disable cursor underglow
- Button uses `motion.button` — interface extends `Omit<ButtonHTMLAttributes, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'>` to avoid type conflicts with Framer Motion

### Cursor Underglow Effect (CursorGlow Component) (Added 2026-02-23)

Cards use a cursor-following underglow instead of scale hover. When the mouse enters a card, a soft radial glow appears under the cursor and follows mouse movement.

**Component:** `src/components/ui/CursorGlow.tsx`

```tsx
import CursorGlow from '@/components/ui/CursorGlow';

// Wrap any element — the glow appears under the cursor on hover
<CursorGlow radius={200} opacity={0.15} enabled={true}>
  <div>Card content here</div>
</CursorGlow>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `radius` | number | 200 | Radius of the glow circle in px |
| `opacity` | number | 0.15 | Max opacity of the glow overlay |
| `enabled` | boolean | true | Enable/disable the effect |
| `className` | string | — | CSS class for the outer container |

**How it works:**
1. `onMouseMove` tracks cursor position relative to the container
2. A positioned overlay `<div>` renders a `radial-gradient(circle ${radius}px at ${x}px ${y}px, var(--accent-primary), transparent)`
3. The overlay fades in/out via CSS `transition: opacity 0.3s ease`
4. `pointer-events: none` on the overlay, content sits at `z-index: 2` above
5. `borderRadius: inherit` ensures glow respects rounded card corners

**Integration with LiquidCard:**
LiquidCard wraps its content in CursorGlow automatically. The `glow` prop (default true) controls whether the effect is enabled. This replaced the old Framer Motion `whileHover={{ scale: 1.02 }}` behavior.

### Page Transition Pattern (Added 2026-02-19)

Every protected page wraps its main content in a `motion.div` with a fade-in + slide-up entrance:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  {/* Page content */}
</motion.div>
```

The reactive sine wave animation runs in the `HeroArea` component at the top of every protected page (see "Page Layout Structure" appendix below).

---

## APPENDIX: COMMON PATTERNS

### API Call Pattern (Client Side)

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleGenerate() {
  setIsLoading(true);
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiledDataBlock, storyType }),
    });

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    const data = await response.json();
    // Update state with data
    toast.success('Narrative generated successfully');
  } catch (error) {
    toast.error('Failed to generate narrative. Please try again.');
    console.error(error);
  } finally {
    setIsLoading(false);
  }
}
```

### Protected Route Pattern

```typescript
// In any protected page component
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Page content here
}
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

## APPENDIX: PROGRESS UPDATE FUNCTION

After completing each task, update `BUILD_PROGRESS_TRACKER.md` using this pattern:

1. Change the task checkbox from `[ ]` to `[x]`
2. Add the completion date after `**Completed:**`
3. Add any relevant notes after `**Notes:**`
4. Update the "CURRENT STATUS" section at the top:
   - `**Last Updated:**` — today's date
   - `**Current Phase:**` — current phase name
   - `**Next Task:**` — the next incomplete task
   - `**Overall Progress:**` — X / 78 tasks complete
5. Update the "SUMMARY COUNTS" table at the bottom

Example of a completed task:

```markdown
### 0.1 — Initialize Next.js Project
- [x] Run `npx create-next-app@latest...`
- [x] Verify the app runs with `npm run dev`
- **Completed:** February 15, 2026
- **Notes:** Used Next.js 14.2.3, TypeScript 5.x
```

---

## APPENDIX: PAGE LAYOUT STRUCTURE (Added 2026-02-23)

### Overview

All protected pages follow a top-to-bottom layout:

```
┌─────────────────────────────────────────────────┐
│  HERO AREA (90px) — reactive sine waves + logo  │
├─────────────────────────────────────────────────┤
│  NAV BAR (56px) — sticky, icon logo, links      │
├─────────────────────────────────────────────────┤
│                                                 │
│           PAGE CONTENT (scrollable)             │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Architecture

```
src/app/(protected)/layout.tsx       → HeroArea + NavBar + main content
src/components/layout/HeroArea.tsx   → Reactive sine wave hero banner
src/components/layout/NavBar.tsx     → Sticky nav with icon logo + theme toggle
src/hooks/useActivityPulse.ts        → Shared activity amplitude system
```

### HeroArea Component (`src/components/layout/HeroArea.tsx`)

Full-width banner at the top of every protected page. Contains:
- **Canvas-based sine wave animation** — 5 wave layers with varying amplitude, frequency, speed
- **Large centered wordmark logo** — uses `accent.logoFile` from ThemeProvider (matches user's accent color)
- **Reactive amplitude** — wave height, opacity, and stroke width respond to `useActivityPulse` amplitude

**Wave reactivity mapping:**
- Base state: gentle low-amplitude waves (amplitude multiplier 1.0x)
- On activity: amplitude multiplier scales up to 3.5x, opacity boosts by +0.35, stroke width increases
- Activity decays back to base over ~2-3 seconds

**Canvas rendering:**
- Uses `devicePixelRatio` scaling for sharp rendering on HiDPI displays
- Reads `--wave-color` CSS variable on every frame for real-time accent color changes
- Edge gradient overlays blend the hero edges into the page background

### NavBar Changes (`src/components/layout/NavBar.tsx`)

- **Logo:** Small tight icon logo (`/ServiceDraft-ai-tight logo.PNG`, 36×36px) on the left
- **Theme toggle:** Sun/Moon button (lucide-react icons) calls `toggleColorMode()` from `useTheme()`
- **Position:** `sticky top-0` (not fixed) — sits in document flow below HeroArea
- **Height:** 56px (`h-14`)
- **Background:** `var(--bg-nav)` with backdrop blur

### Reactive Animation System (`src/hooks/useActivityPulse.ts`)

Shared module-level state pattern (same as `narrativeStore.ts` and `useAuth.ts`):

```typescript
import { useActivityPulse, dispatchActivity } from '@/hooks/useActivityPulse';

// In a component with requestAnimationFrame:
const { amplitudeRef } = useActivityPulse();
// Read amplitudeRef.current (0–1) in your animation loop

// To trigger a spike from any component:
dispatchActivity(0.8); // intensity 0–1
```

**Event listening (automatic):**
| Event | Source | Spike Intensity |
|-------|--------|----------------|
| `input` | Any form field (typing) | 0.35 |
| `click` | Button or link | 0.65 |
| `click` | Generic element | 0.15 |
| `sd-activity` | Custom event | Configurable |

**Pre-wired dispatches in narrative page:**
| Action | Intensity |
|--------|-----------|
| Generate narrative | 0.8 |
| Regenerate | 0.8 |
| Customize | 0.7 |
| Proofread | 0.6 |
| Apply edits | 0.7 |
| Save | 0.5 |

**Dispatching custom activity from new features:**
```typescript
import { dispatchActivity } from '@/hooks/useActivityPulse';

// When starting an AI generation or background process:
dispatchActivity(0.8);
```

### Full-Page Background Animation

The protected layout renders `ParticleNetwork` (`src/components/ui/ParticleNetwork.tsx`) at z-10 behind all content, controlled by the `backgroundAnimation` toggle in ThemeProvider (on by default). When toggled off, the component fully unmounts. The original `WaveBackground` component is still used on the landing page (`src/app/page.tsx`) and auth pages.

---

## APPENDIX: LANDING PAGE & MAIN MENU (Added 2026-02-23)

### Landing Page (`src/app/page.tsx`)

The landing page is a premium product launch screen — no nav bar or hero area (user isn't logged in yet). Full-page wave background with centered content.

**Layout:**
1. **Logo** — `Logo` component at `large` size (1200×300), dominant visual element with `max-w-[90vw]`
2. **Subtitle** — "AI-POWERED REPAIR NARRATIVE GENERATOR" in small spaced-out tracking (0.35em), muted color
3. **Buttons** — LOGIN (primary) and REQUEST ACCESS (secondary), constrained to `max-w-xs`

**Cinematic entrance animation (staggered):**
- Logo: `scale 0.8→1` over 1s with custom easing `[0.16, 1, 0.3, 1]`
- Subtitle: `opacity 0→1, y 10→0` at 0.6s delay
- Buttons: `opacity 0→1, y 15→0` at 1.1s delay

### Main Menu (`src/app/(protected)/main-menu/page.tsx`)

**Changes from original:**
- **Removed**: Logo image from inside the card
- **Added**: "Main Menu" heading (`<h1>`) styled with `text-[var(--accent-bright)]`, bold, tracking-wide
- **Width**: Card increased from `max-w-md` to `max-w-2xl`; buttons constrained to `max-w-md` within
- **Cursor underglow**: Applied automatically via LiquidCard's built-in CursorGlow wrapper

### Narrative Page Reset Button

A "NEW STORY" ghost button in the bottom action bar opens a confirmation modal ("Are you sure? All unsaved data will be lost."). On confirm: calls `resetAll()` from narrative store and navigates to `/main-menu`.

---

## APPENDIX: NARRATIVE SAVE STATE & NAVIGATION GUARD (Added 2026-02-23)

### isSaved State Pattern

The narrative store (`src/stores/narrativeStore.ts`) tracks two save-related fields:

| Field | Type | Purpose |
|-------|------|---------|
| `isSaved` | `boolean` | Whether the current narrative has been persisted to the database |
| `savedNarrativeId` | `string \| null` | The Supabase UUID of the saved record (for duplicate prevention) |

**State transitions:**
- `initialState`: `isSaved: true` (no narrative exists yet, nothing to protect)
- `setNarrative()` (new generation, regenerate, customize, apply edits): resets both to `false` / `null`
- `markSaved(id)`: sets `isSaved: true` and `savedNarrativeId: id`
- `clearForNewGeneration()` / `resetAll()`: resets both to `true` / `null` (clean slate)

### beforeunload Event (Browser Close / Back)

When `isSaved === false`, a `beforeunload` event listener is active on the narrative page. This triggers the browser's native "Leave page?" confirmation dialog when the user:
- Closes the browser tab
- Clicks the browser back button
- Refreshes the page
- Types a new URL in the address bar

The listener is removed when `isSaved` becomes `true`.

```tsx
useEffect(() => {
  if (state.isSaved) return;
  const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [state.isSaved]);
```

### In-App Navigation Interception

For internal links (Next.js `<Link>` components in the nav bar, etc.), the narrative page intercepts clicks at the document level using capture-phase event listeners:

1. A `click` listener on `document` (capture phase) catches clicks on `<a>` elements with `href` attributes
2. External URLs (`http://`, `#`, `mailto:`) are ignored
3. Internal route links are prevented and a custom modal is shown:
   - **Title:** "Unsaved Narrative"
   - **Message:** "You have an unsaved narrative. Once you leave this page, this story cannot be recovered."
   - **Actions:** STAY ON PAGE (dismisses) / LEAVE WITHOUT SAVING (navigates to `pendingNavigation`)
4. The interceptor is only active when `isSaved === false`

### Auto-Save on Export

Whenever the user performs any export action (Copy to Clipboard, Print, Download PDF, Download Word), the narrative is automatically saved to the database **before** the export proceeds.

**Implementation:**
1. `saveToDatabase()` — shared helper that performs the Supabase insert and returns the record ID
2. `handleBeforeExport()` — callback passed to `ShareExportModal` via `onBeforeExport` prop
3. `ShareExportModal` calls `await onBeforeExport?.()` at the start of every export handler

**Duplicate prevention via `savedNarrativeId`:**
- `saveToDatabase()` checks `state.savedNarrativeId` first
- If already set (previous manual save or auto-save), returns the existing ID without inserting
- This prevents multiple database records for the same narrative across multiple exports

**Toast:** "Narrative auto-saved to your history" (uses `{ id: 'auto-save' }` to deduplicate)

**Activity pulse:** Both manual save and auto-save dispatch `dispatchActivity(0.5)` for hero wave animation.

### How All Three Guards Work Together

| Trigger | Guard | Behavior |
|---------|-------|----------|
| Browser close/back/refresh | `beforeunload` | Browser native dialog |
| Nav bar links / in-app routes | Document click capture | Custom "Unsaved Narrative" modal |
| "NEW STORY" button | Existing PB.46 reset confirm dialog | "Are you sure? All unsaved data will be lost." |
| Any export action | Auto-save | Silently saves first, then exports |
| Manual "SAVE STORY" click | `handleSave()` | Explicit save, disables all guards |

---

## APPENDIX: PREFERENCES SYSTEM (Added 2026-02-23)

### Overview

User preferences are stored as a JSONB column (`preferences`) on the `users` table in Supabase. The system uses a **localStorage-first, Supabase-async-override** pattern:

1. **On page load:** ThemeProvider reads `sd-accent-color` and `sd-color-mode` from localStorage (instant, no network)
2. **After hydration:** ThemeProvider asynchronously queries `users.preferences` from Supabase
3. **If Supabase has preferences:** They override the localStorage values and sync localStorage for consistency
4. **If not logged in or network fails:** localStorage values remain (graceful degradation)

### JSONB Column Structure

```sql
-- Add this column to the existing users table:
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
```

The `preferences` column uses this TypeScript interface (`src/types/database.ts`):

```typescript
interface UserPreferences {
  appearance?: {
    accentColor: string;   // Key from themeColors.ts (e.g., 'violet', 'blue')
    mode: 'dark' | 'light';
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
```

### Merge Pattern for Adding New Preference Categories

When saving preferences, the ThemeProvider reads the existing `preferences` object from Supabase FIRST, then merges the new values using the spread operator:

```typescript
const existingPrefs = row?.preferences || {};
const merged = {
  ...existingPrefs,           // Preserves templates, future keys
  appearance: { accentColor, mode },  // Overwrites only appearance
};
await supabase.from('users').update({ preferences: merged }).eq('id', user.id);
```

**To add a new preference category** (e.g., `templates`):
1. Read the existing `preferences` JSONB
2. Spread the existing object
3. Set your new key (e.g., `templates: { defaultFormat: 'block' }`)
4. Write the merged object back

This pattern ensures independent features never overwrite each other's preferences.

### Architecture

```
src/types/database.ts                    → UserPreferences interface
src/components/ThemeProvider.tsx          → loadFromSupabase() + saveToSupabase()
src/components/ui/AccentColorPicker.tsx   → 9-swatch color picker (uses useTheme)
src/components/dashboard/PreferencesPanel.tsx → Modal with Appearance + Templates tabs
src/app/(protected)/dashboard/page.tsx   → Preferences button + panel integration
```

### Key Files

| File | Role |
|------|------|
| `src/components/ui/AccentColorPicker.tsx` | Row of 9 color swatches, calls `setAccentColor()` |
| `src/components/dashboard/PreferencesPanel.tsx` | Two-tab modal: Appearance (functional) + Templates (placeholder) |
| `src/components/ThemeProvider.tsx` | Extended with `loadFromSupabase()` and `saveToSupabase()` |
| `src/types/database.ts` | `UserPreferences` interface + updated `UserProfile` |

### Supabase Sync Details

- **Dynamic import:** Supabase client is imported via `await import('@/lib/supabase/client')` to avoid bundling it in the ThemeProvider's initial chunk
- **Auth check:** `supabase.auth.getUser()` — if no user (not logged in), both load and save silently return
- **Error handling:** All Supabase calls wrapped in try/catch. Errors are logged to console but never break the app
- **localStorage alignment:** After loading from Supabase, localStorage keys are updated to match, so subsequent page loads (before Supabase loads) show the correct theme

---

## ADMIN DASHBOARD (Sprint S2-6A/6B/6C)

### Route & Access

- **Page:** `src/app/(protected)/admin/page.tsx` — admin-only page with three tabs
- **API:** `src/app/api/admin/route.ts` — POST endpoint for user management actions (list_users, get_user_details, send_password_reset, restrict_user, delete_user, change_subscription)
- **Analytics API:** `src/app/api/admin/analytics/route.ts` — GET endpoint returning aggregated analytics data
- **Access:** Both routes verify `role = 'admin'` on the user's profile. Non-admins are redirected.

### Admin API Actions (`POST /api/admin`)

| Action | Params | Description |
|--------|--------|-------------|
| `list_users` | — | Returns all users with narrative counts and last activity |
| `get_user_details` | `userId` | Returns profile, recent activity (5), recent narratives (5) |
| `send_password_reset` | `email` | Sends reset via Resend (branded) or Supabase fallback |
| `restrict_user` | `userId`, `restricted` | Sets `is_restricted` flag |
| `delete_user` | `userId` | Permanently deletes user via `auth.admin.deleteUser` |
| `change_subscription` | `userId`, `status` | Updates subscription_status (active/trial/expired/bypass) |

### Analytics API (`GET /api/admin/analytics`)

Query param: `?range=14` (default) — controls chart date range (7, 14, 30, or large number for all-time).

Returns:
- `totalUsers`, `newUsersWeek`, `activeSubscriptions` — user counts
- `totalNarratives`, `narrativesWeek`, `narrativesToday` — narrative counts
- `activityByType` — `Record<string, number>` grouped action_type counts (last 30 days)
- `dailyNarratives` — `Array<{date, count}>` for chart (range-based)
- `topUsers` — `Array<{rank, name, position, count}>` top 5 by narratives
- `storyTypes` — `{diagnostic_only: number, repair_complete: number}`

### Database Tables Used

| Table | Fields Referenced |
|-------|-------------------|
| `users` | id, email, first_name, last_name, position, subscription_status, is_restricted, role, created_at |
| `narratives` | id, user_id, story_type, created_at |
| `activity_log` | id, user_id, action_type, story_type, input_data, output_preview, metadata, created_at |

### Admin Page Tabs

1. **Activity Log** — Paginated table of all user activity with search, action filter, sort, expandable detail rows
2. **User Management** — Sortable user table with search, inline actions (reset password, restrict, change subscription, delete)
3. **Analytics** — Stat cards (6), generation trend chart (CSS bars), story type breakdown, activity type breakdown, top 5 users table, auto-refresh (60s), date range selector

### Key Patterns

- Service role client (`SUPABASE_SERVICE_ROLE_KEY`) used for admin operations that bypass RLS
- Admin verification via session client (`createServerClient`) — checks user's own auth, then reads role from `users` table
- Activity log joined to users table via `activity_log_user_id_fkey` foreign key
- All analytics charts built with CSS divs (no external charting library)
- Auto-refresh uses `setInterval(fetchAnalytics, 60000)` with cleanup on tab switch

---

*— End of Claude Code Build Instructions —*
