# SERVICEDRAFT.AI — PROJECT INSTRUCTIONS v2.0

## WHO I AM
I'm Tyler, an automotive technician at a Chevrolet dealership. I started this project with zero coding background and have been learning development from scratch using AI + Cursor IDE. Treat me as an intelligent non-developer — I pick things up fast but need things explained without jargon. If you must use a technical term, define it in plain English the first time.

---

## WHAT WE'VE BUILT
**ServiceDraft.AI** — a full-stack SaaS web application that transforms quick, messy technician repair notes into clean, detailed, audit-proof professional warranty narratives for dealership warranty documentation. This started as a validated Google Sheets prototype and has been rebuilt as a standalone product targeting dealerships and repair facilities.

**Current Status:** Core build complete (Phases 0–10 + Stage 2–5 improvement sprints). Pre-deployment audit passed. Ready for Vercel production deployment on servicedraft.ai.

### Core Value Proposition
- Reduces narrative writing time from 5-10 minutes to under 30 seconds
- Ensures consistent, professional language that passes warranty audits
- Eliminates warranty claim rejections due to poor documentation
- Supports both diagnostic-only and completed repair scenarios
- Provides AI-powered story-type-aware proofreading to catch potential audit flags
- Supports diagnostic-to-repair-complete narrative updates (preserves original diagnostic detail)

---

## COMPLETE TECHNOLOGY STACK

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 | React framework with SSR |
| **React** | React | 19.2.3 | UI library |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | CSS-first config via @theme in globals.css |
| **Database/Auth** | Supabase | 2.95+ | PostgreSQL + Auth + RLS |
| **AI** | Google Gemini | gemini-3-flash-preview | Narrative generation, proofreading, customization |
| **Payments** | Stripe | 20.3.1 | Subscription billing + access code bypass |
| **Email** | Resend | 6.9.2 | Transactional email exports + password reset emails |
| **Animations** | Framer Motion | 12.34+ | Page transitions, micro-interactions |
| **Charts** | Recharts | 3.8+ | Admin analytics visualizations |
| **PDF Export** | jsPDF | 4.2+ | Server-side PDF generation |
| **DOCX Export** | docx | 9.5+ | Server-side Word document generation |
| **Icons** | Lucide React | 0.564+ | SVG icon library |
| **Toasts** | react-hot-toast | 2.6+ | Notification system |
| **Hosting** | Vercel | — | CI/CD + hosting |
| **DNS/Domain** | Cloudflare | — | Domain registrar for servicedraft.ai |

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
3. **Step 2 — Stripe Paywall**: Payment processing OR Access Code bypass (env variable: ACCESS_CODE)
4. **Step 3 — Profile Creation**: First Name, Last Name, Location, Position (dropdown), Terms of Use acceptance
5. Save to database → Main Menu Page

### Page Structure

| Page | Route | Purpose |
|------|-------|---------|
| **Landing Page** | `/` | Login/Sign Up entry point (cinematic entrance animation) |
| **Login** | `/login` | Email/password sign-in |
| **Sign Up** | `/signup` | Multi-step registration |
| **Main Menu** | `/main-menu` | Central navigation hub |
| **Input Page** | `/input` | Capture RO info, select story type, fill fields, pre-gen customization |
| **Generated Narrative** | `/narrative` | View, customize, proofread, edit, save, export narrative |
| **User Dashboard** | `/dashboard` | Profile management, saved narrative history, preferences |
| **Owner Dashboard** | `/admin` | Admin-only: analytics, user management, activity log, settings |

### Main Menu Navigation
- **GENERATE NEW STORY** → Input Page
- **USER DASHBOARD** → Dashboard/History Page
- **LOG OUT** → Landing Page
- **FAQ/INFO** → Instruction modal (15 Q&As covering all features)
- **SUPPORT** → Support ticket form
- **TERMS OF USE** → Legal terms modal

---

## INPUT PAGE SPECIFICATIONS

### Story Type Selection
User must first choose:
- **DIAGNOSTIC ONLY**: Diagnosis performed, repair recommended but not completed
- **REPAIR COMPLETE**: Full repair completed and verified

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

### Pre-Generation Output Customization
Collapsible panel between the last field and GENERATE STORY button with three segmented controls:
- **Length**: Short / No Change / Extended
- **Tone**: Warranty / No Change / Customer Friendly
- **Detail Level**: Concise / No Change / Additional Steps
- Selections are included automatically in the compiled data block when generating
- Settings persist in localStorage between sessions

### Repair Templates System
- **REPAIR TEMPLATES** button inside the input card opens a slide-out panel
- Templates store only 5 core repair fields (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification) with their dropdown option states
- Vehicle info and customer concern are NOT saved (templates are vehicle-agnostic)
- CRUD operations: save, load, edit, delete
- Saved via server-side API routes (`/api/saved-repairs`)

### R.O. # Field Handling
The Repair Order number is required on the input form but is **never sent to the Gemini API**. It is used exclusively for saving to the database and displaying in the history table.

---

## GENERATED NARRATIVE PAGE SPECIFICATIONS

### Layout
- **Header**: Hero area with logo, Nav Bar with MAIN MENU button + vector logo + theme toggle + user popup
- **Left Panel**: Controls (Regenerate, Customization toggle + panel, Review & Proofread + results)
- **Right Panel**: Narrative display (C/C/C format is DEFAULT)
- **Bottom**: Action buttons (Edit, Format Toggle, Save, Share/Export, New Story)

### Display Formats
- **C/C/C FORMAT (Default)**: Separated Concern, Cause, Correction sections
- **BLOCK FORMAT**: Single combined paragraph

### AI Customization Panel
- Three segmented controls: Length (Short / No Change / Extended), Tone (Warranty / No Change / Customer Friendly), Detail Level (Concise / No Change / Additional Steps)
- Custom Instructions text field (max 50 characters)
- Customization modifies the CURRENTLY DISPLAYED narrative — preserves user edits

### Review & Proofread System (Story-Type-Aware)
- **Repair Complete**: Uses warranty audit prompt — checks for harmful language, missing verification, vague wording, etc.
- **Diagnostic Only**: Uses authorization-readiness optimizer — evaluates diagnostic strength, justification, and repair sellability
- Returns flagged issues with exact text snippets for highlighting + suggested edits with checkbox selection
- Selective apply: users can check/uncheck individual suggested edits before applying
- Rating badge: PASS (green), NEEDS_REVIEW (yellow), FAIL (red)

### Apply Edits System
- After proofread, users select specific edits via checkboxes
- "APPLY SELECTED EDITS" sends only the checked suggestions to the AI
- AI applies ONLY the provided subset of edits — no additional changes

### Bottom Action Buttons
- **EDIT STORY**: Opens editable modal (format matches current view)
- **[Format Toggle]**: Dynamic button to switch between Block/C/C/C
- **SAVE STORY**: Saves to database via `/api/narratives/save` (INSERT — not upsert)
- **SHARE/EXPORT STORY**: Copy, Print, PDF, DOCX, Email (all formats produce identical professional documents)
- **NEW STORY**: Reset confirmation → Main Menu

### Navigation Guard
- Unsaved narratives trigger "Leave page?" confirmation for both browser close and in-app navigation
- Auto-save triggers before any export action (prevents data loss)

---

## USER DASHBOARD SPECIFICATIONS

### Profile Section
- Position-based icon (PositionIcon component), Full Name, Email, Internal ID, Location, Position
- "UPDATE" button → Edit Profile modal (first name, last name, location, position dropdown)
- Change Password modal
- Delete Account (with confirmation)

### Saved Narrative History Table
- Columns: Date, Time, R.O. #, Type (badge), Year, Make, Model, Preview
- Multi-column search (R.O.#, Year, Make, Model, Concern, Cause, Correction, Date)
- Sort controls: Date Newest/Oldest, Vehicle A-Z, R.O.# Ascending
- Filter pills: All, Diagnostic Only, Repair Complete
- Results count with "Clear Filters" fallback

### Narrative Detail Modal (Read Only)
- Full C/C/C narrative display with vehicle info and dates
- Export buttons: Copy, Print, PDF, DOCX, Email
- **UPDATE NARRATIVE WITH REPAIR** button (only visible for diagnostic_only entries)
  - Opens UpdateWithRepairModal for the diagnostic → repair complete flow
  - Pre-fills vehicle info, accepts repair details, generates new repair-complete narrative
  - "COMPLETED RECOMMENDED REPAIR" convenience button (pre-fills instruction for AI tense conversion)

### Preferences Panel
- Appearance tab: Accent Color Picker (9 colors) + Dark/Light mode toggle + Particle Network animation toggle
- Templates tab: Placeholder for future features
- Preferences persist to Supabase (cross-device) with localStorage fallback

---

## OWNER DASHBOARD (Admin Only)

Accessible via UserPopup "Owner Dashboard" link. Requires `role = 'admin'` on user profile.

### 5 Tabs:
1. **Overview**: 8 metric cards, subscription breakdown, 30-day activity trend chart (recharts LineChart), system health indicators (DB row counts, last activity, app version)
2. **Activity Log**: Full activity history with pagination, action type filtering, user search, expandable detail rows
3. **User Management**: User table with CRUD operations — restrict/unrestrict, delete (2-step confirmation), change subscription status, send password reset, promote/demote admin role. Protected user (hvcadip@gmail.com) cannot be deleted/restricted.
4. **Analytics**: Time range selector (7d/30d/90d/all), 6 chart visualizations (Activity Trend LineChart, Feature Usage BarChart, Story Type PieChart, Subscription PieChart, Top 10 Users, Usage Over Time AreaChart), CSV export
5. **Settings**: Access code display, quick stats, system information

---

## API ROUTE INVENTORY (17 Routes)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/generate` | POST | AI narrative generation (rate limited: 20/15min) | ✅ |
| `/api/customize` | POST | AI narrative customization | ✅ |
| `/api/proofread` | POST | AI story-type-aware audit | ✅ |
| `/api/apply-edits` | POST | Apply selected proofread edits | ✅ |
| `/api/convert-recommendation` | POST | Tense conversion (diagnostic→repair) | ✅ |
| `/api/update-narrative` | POST | Diagnostic→Repair Complete narrative update | ✅ |
| `/api/narratives` | GET | Fetch saved narratives for user | ✅ |
| `/api/narratives/save` | POST | Save narrative (INSERT) | ✅ |
| `/api/saved-repairs` | GET/POST | List/create repair templates | ✅ |
| `/api/saved-repairs/[id]` | PUT/DELETE | Update/delete individual template | ✅ |
| `/api/export-pdf` | POST | Generate PDF document | ✅ |
| `/api/export-docx` | POST | Generate Word document | ✅ |
| `/api/send-email` | POST | Email narrative via Resend (up to 10 recipients) | ✅ |
| `/api/stripe` | POST | Checkout session + access code bypass | Session |
| `/api/stripe/webhook` | POST | Stripe webhook handler | Stripe sig |
| `/api/support` | POST | Support ticket submission | ✅ |
| `/api/delete-account` | POST | Self-service account deletion (service role) | ✅ |
| `/api/admin` | POST | Admin user management (service role) | Admin |
| `/api/admin/analytics` | GET | Admin analytics data | Admin |

---

## HOW TO COMMUNICATE WITH ME

### ALWAYS Do This:
- **Give me complete file contents.** Never give partial snippets, diffs, or "replace lines 42-56" instructions. Show me the entire file every time.
- **Step-by-step, click-by-click guidance.** When I need to do something in Cursor, GitHub, Vercel, Supabase, or the terminal — walk me through it.
- **Explain the "why" briefly.** One sentence on why we're doing something helps me learn.
- **Default to execution mode.** Unless I'm asking a planning question, assume I want you to write the code.
- **Challenge bad decisions.** If I suggest something that will cause problems, push back and explain why.
- **Provide Claude Code prompts as single copyable text blocks** that begin with "Read BUILD_PROGRESS_TRACKER.md and CLAUDE_CODE_BUILD_INSTRUCTIONS.md" and end with "Update BUILD_PROGRESS_TRACKER.md and commit changes."

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
| **ServiceDraft_AI_Project_Instructions_v1_3.md** | This file — how to work with Tyler, tech stack, communication rules |
| **ServiceDraft_AI_Spec_v1_3.md** | Detailed page specs, database schema, feature matrix, workflow diagrams |
| **ServiceDraft_AI_Prompt_Logic_v1.md** | All AI prompts, dropdown logic, customization panel logic, JSON structures |
| **ServiceDraft_AI_UI_Design_Spec_v1.md** | Complete visual design system — colors, typography, theming, animations |
| **CLAUDE_CODE_BUILD_INSTRUCTIONS.md** | Architecture reference, coding standards, sprint execution guide for Claude Code |
| **BUILD_PROGRESS_TRACKER.md** | Living document tracking all completed and remaining work |
| **PRE_BUILD_SETUP_CHECKLIST.md** | Setup guide for accounts, tools, and environment (completed) |
| **DEPLOYMENT_NOTES.md** | Environment variables, Supabase config, Stripe setup, security measures |

---

## QUALITY STANDARDS

- Every component should have proper loading states, error states, and empty states
- All forms should have input validation
- Auth should be checked on every API route
- All Supabase data operations go through server-side API routes (never browser client queries)
- All colors use CSS custom properties (`var(--accent-*)`) — never hardcoded hex values
- Mobile responsive is required but desktop-first for layout
- Loading animations for ALL API calls
- Typing animation for all API response text display
- All UI components must follow the theming system (ThemeProvider + CSS variables)
- Typography: Orbitron for headings/UI elements, Inter for data/input text
- Documentation (BUILD_PROGRESS_TRACKER.md) updated before every git commit

---

*— End of Project Instructions v2.0 —*
