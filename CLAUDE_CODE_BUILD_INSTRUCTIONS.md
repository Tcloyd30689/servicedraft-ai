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

Pattern:
```tsx
"use client";
import { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Use requestAnimationFrame to draw sine waves
  // y = centerY + amplitude * Math.sin(x * frequency + time * speed + offset)
  // Multiple wave layers with varying parameters
}
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
    model: 'gemini-2.0-flash',
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

### Light/Dark Mode

- **Dark mode** is the default for all accent colors except Black
- **Black accent** automatically activates light mode (white backgrounds, dark text)
- `ThemeProvider` handles mode switching by overriding `--bg-primary`, `--text-primary`, `--text-muted`, `--bg-modal`, `--bg-nav` when in light mode
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
| LiquidCard | 1.02 | 0.98 | `var(--shadow-glow-accent)` |
| Button | 1.05 | 0.95 | `var(--shadow-glow-sm)` |
| StoryTypeSelector cards | 1.03 | 0.97 | `var(--shadow-glow-sm)` |
| Small links (FAQ, etc.) | 1.08 | 0.95 | none |

**Rules:**
- Disabled buttons: pass `undefined` for whileHover/whileTap (no animation when disabled)
- LiquidCard: controlled by `hover` prop (default true), set `hover={false}` to disable
- Button uses `motion.button` — interface extends `Omit<ButtonHTMLAttributes, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'>` to avoid type conflicts with Framer Motion

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

The animated wave background runs continuously on all protected pages via `WaveBackground` in `src/app/(protected)/layout.tsx`.

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

*— End of Claude Code Build Instructions —*
