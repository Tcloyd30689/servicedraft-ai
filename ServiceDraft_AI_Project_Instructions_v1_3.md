# SERVICEDRAFT.AI — PROJECT INSTRUCTIONS v1.3

## WHO I AM
I'm Tyler, an automotive technician at a Chevrolet dealership. I have zero coding background and am learning from scratch using AI + Cursor IDE. Treat me as an intelligent non-developer — I pick things up fast but need things explained without jargon. If you must use a technical term, define it in plain English the first time.

---

## WHAT WE'RE BUILDING
**ServiceDraft.AI** — a full-stack SaaS web application that transforms quick, messy technician repair notes into clean, detailed, audit-proof professional warranty narratives for dealership warranty documentation. This started as a validated Google Sheets prototype and is now being rebuilt as a standalone product targeting dealerships and repair facilities.

### Core Value Proposition
- Reduces narrative writing time from 5-10 minutes to under 30 seconds
- Ensures consistent, professional language that passes warranty audits
- Eliminates warranty claim rejections due to poor documentation
- Supports both diagnostic-only and completed repair scenarios
- Provides AI-powered proofreading to catch potential audit flags

---

## COMPLETE APPLICATION WORKFLOW

### Authentication Flows

**Sign In (Existing Users):**
1. Landing Page → Click "LOGIN"
2. Enter Username + Password
3. Validate against Supabase Auth
4. → Main Menu Page

**Sign Up (New Users):**
1. Landing Page → Click "REQUEST ACCESS"
2. **Account Creation**: Email, Password, Confirm Password
3. **Stripe Paywall**: Payment processing OR Access Code bypass
4. **Profile Creation**: Picture (optional), Location, Position
5. Save to database → Main Menu Page

### Page Structure

| Page | Purpose |
|------|---------|
| **Landing Page** | Login/Sign Up entry point |
| **Main Menu Page** | Central navigation hub |
| **Input Page** | Capture RO info, select story type, fill fields |
| **Generated Narrative Page** | View, customize, edit, save, export narrative |
| **User Dashboard** | Profile management + saved narrative history |

### Main Menu Buttons
- **GENERATE NEW STORY** → Input Page
- **USER DASHBOARD** → Dashboard/History Page
- **LOG OUT** → Landing Page
- **FAQ/INFO** → Instruction modal
- **SUPPORT** → Support ticket form (emails admin)

### User ID Popup (Header)
- Username, Location, Position display
- Quick link to User Dashboard
- Log Out button

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

**GENERATE STORY button stays DISABLED until:**
- All fields 1-5 have text entered
- All fields 6+ with "Include Information" selected have text entered

### Diagnostic Only Fields (9 total)
1. R.O. # *(required — saved to database only, NOT sent to API)*
2. Year *(required — sent to API)*
3. Make *(required — sent to API)*
4. Model *(required — sent to API)*
5. Customer Concern *(required — sent to API)*
6. Codes Present *(conditional)*
7. Diagnostics Performed *(conditional)*
8. Root Cause/Failure *(conditional)*
9. Recommended Action *(conditional)*

### Repair Complete Fields (10 total)
1. R.O. # *(required — saved to database only, NOT sent to API)*
2. Year *(required — sent to API)*
3. Make *(required — sent to API)*
4. Model *(required — sent to API)*
5. Customer Concern *(required — sent to API)*
6. Codes Present *(conditional)*
7. Diagnostics Performed *(conditional)*
8. Root Cause/Failure *(conditional)*
9. Repair Performed *(conditional)*
10. Repair Verification Steps *(conditional)*

### R.O. # Field Handling
The Repair Order number is required on the input form for validation purposes, but it is **never included in the compiled data block sent to the Gemini API**. It is stored in application state and used exclusively for:
- Saving the narrative to the database (narratives table)
- Displaying in the Saved Narrative History table on the User Dashboard

### Year, Make, Model — API Usage
Year, Make, and Model ARE sent to the API as part of the compiled data block. This allows the AI to infer manufacturer-specific processes, system names, and terminology relevant to the specific vehicle being serviced. The AI's generated output CAN and SHOULD contain manufacturer-specific language when the vehicle information makes it relevant — this produces more accurate, professional narratives. **The restriction on brand-neutral language applies only to the application's own source code, UI text, and hardcoded prompt strings — NOT to the AI's generated output.**

### "Generate Applicable Info" Prompt Logic
When selected for a conditional field, the following instruction is injected into the compiled data block in place of user-entered text:
> "[FIELD NAME]: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable [FIELD NAME] using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage."

**For complete prompt templates, dropdown logic, and compiled data block assembly rules, see the ServiceDraft_AI_Prompt_Logic_v1.md document.**

---

## GENERATED NARRATIVE PAGE SPECIFICATIONS

### Layout
- **Header**: Logo, "Main Menu" button, Nav Bar, User ID
- **Left Panel**: Controls (Regenerate, Customization toggle, Review/Proofread)
- **Right Panel**: Narrative display (Block format is DEFAULT)
- **Bottom**: Action buttons

### Display Formats
- **BLOCK FORMAT (Default)**: Single combined paragraph (uses `block_narrative` from API response)
- **C/C/C FORMAT**: Separated Concern, Cause, Correction sections (uses `concern`, `cause`, `correction` from API response)

**Both formats are available immediately after the initial API call — no additional API calls needed to switch between them.**

### Dynamic Format Toggle Button
- When viewing Block → Show "C/C/C FORMAT" button
- When viewing C/C/C → Show "BLOCK FORMATTING" button
- Only ONE button shown at a time (shows opposite of current view)

### Left Panel Controls
| Element | Function |
|---------|----------|
| REGENERATE STORY | Re-runs API with same original input data for a fresh variation |
| AI Output Customization toggle | Shows/hides customization sliders |
| REVIEW & PROOFREAD STORY | Triggers separate audit API call on current narrative text |
| Flagged Issues box | Displays AI-identified problems (read only) |
| Suggested Edits box | Displays AI recommendations (read only) |
| Audit Rating Badge | Visual indicator: PASS (green), NEEDS_REVIEW (yellow), FAIL (red) |

### AI Output Customization (When Toggle = ON)
| Slider | Options |
|--------|---------|
| Length | Short ↔ Standard ↔ Detailed |
| Tone | Warranty ↔ Standard ↔ Customer Friendly |
| Detail Level | Concise ↔ Standard ↔ Additional Steps |
- Custom Instructions text field
- "APPLY CUSTOMIZATION TO STORY" button

**IMPORTANT: Customization modifies the CURRENTLY DISPLAYED narrative — it does NOT re-generate from the original input data.** This means user edits and prior customizations are preserved and adjusted, not overwritten. Sliders at "Standard" (center) add no modification. If all sliders are at Standard and custom instructions are empty, show toast: "Adjust at least one slider or add custom instructions before applying."

**For detailed customization prompt logic, slider modifier definitions, and state management rules, see the ServiceDraft_AI_Prompt_Logic_v1.md document.**

### Bottom Action Buttons
- **EDIT STORY**: Opens editable modal (format matches current view)
- **[Format Toggle]**: Dynamic button to switch between Block/C/C/C
- **SAVE STORY**: Saves to database
- **SHARE/EXPORT STORY**: Opens export modal (Copy, Print, PDF)

---

## USER DASHBOARD SPECIFICATIONS

### Profile Section
- Profile picture, Username, Internal ID, Location, Position
- "UPDATE" button → Edit Profile flow

### Edit Profile Options
- **Update Profile Information**: Edit Location, Position
- **Change Password**: Old Password, New Password, Confirm Password
- **Add/Update Profile Picture**: Image upload

### Saved Narrative History Table
| Column | Data |
|--------|------|
| Date | Date saved |
| Timestamp | Time saved |
| Repair Order # | RO number |
| Year | Vehicle year |
| Make | Vehicle make |
| Model | Vehicle model |
| Saved Story | Preview (first 30 chars) |

- Search functionality
- Click row → Opens popup modal with full narrative (READ ONLY)
- Share/Export options in popup

**IMPORTANT: Saved stories are READ ONLY and cannot be edited. This ensures audit integrity.**

---

## API INTEGRATION

**For complete prompt templates, system prompts, JSON response structures, and prompt assembly logic, see the ServiceDraft_AI_Prompt_Logic_v1.md document.** The information below is a summary.

### Gemini API Calls
| Call | Purpose | Input Data |
|------|---------|------------|
| Generate Narrative | Creates 3C narrative from inputs | Compiled data block (fields 2-5 + conditional fields, excludes R.O. #) |
| Regenerate | Re-runs with same original inputs for variation | Original compiled data block |
| Apply Customization | Rewrites current narrative with slider settings | Current displayed narrative text + customization modifiers |
| Review & Proofread | Separate call to audit current text | Current displayed narrative text |

### Narrative Generation JSON Response (4-key structure)
```json
{
  "block_narrative": "COMPLETE STORY AS ONE FLOWING PARAGRAPH...",
  "concern": "CUSTOMER CONCERN SECTION ONLY...",
  "cause": "CAUSE/DIAGNOSIS SECTION ONLY...",
  "correction": "CORRECTION/REPAIR SECTION ONLY..."
}
```
**Key**: All four fields are returned in a single API call. The `block_narrative` is displayed in Block format. The `concern`, `cause`, and `correction` fields are displayed in C/C/C format. Both formats available immediately with zero additional API calls.

### Audit/Proofread JSON Response
```json
{
  "flagged_issues": [
    "Phrase 'customer caused' may flag warranty audit",
    "Missing verification step"
  ],
  "suggested_edits": [
    "Replace 'customer caused' with 'component failure'",
    "Add: 'Verified repair by road test and scan'"
  ],
  "overall_rating": "PASS | NEEDS_REVIEW | FAIL",
  "summary": "Brief one-sentence assessment of narrative quality"
}
```
- `flagged_issues` array → Populates "Flagged Issues" text box
- `suggested_edits` array → Populates "Suggested Edits" text box
- `overall_rating` → Displays as color-coded badge (PASS=green, NEEDS_REVIEW=yellow, FAIL=red)
- `summary` → Displays below the badge

---

## UI/UX SPECIFICATIONS

### Loading Animations
**REQUIRED for ALL API wait times:**
| API Action | Message |
|------------|---------|
| Generate Narrative | "Generating your warranty narrative..." |
| Regenerate Story | "Regenerating narrative..." |
| Apply Customization | "Applying customization settings..." |
| Review & Proofread | "Reviewing narrative for issues..." |

Style: Branded spinner/pulse with contextual message, dark mode + purple glow aesthetic

### Typing Animation Effect
- API response text fills read-only fields with **ultra-fast typing animation**
- NOT static insertion — character-by-character at high speed (~20-50ms per char)
- Applies to: Narrative sections, Flagged Issues, Suggested Edits
- Creates premium, dynamic feel

### Toast Notifications
- "Story saved successfully"
- "Copied to clipboard"
- "Profile updated"
- "Password changed successfully"
- "Adjust at least one slider or add custom instructions before applying." (customization validation)
- Error messages for failed operations

---

## TECH STACK (LOCKED IN)

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | **Next.js 14+** (App Router) | React framework with SSR |
| Styling | **Tailwind CSS** | Dark mode + custom design |
| Auth + Database | **Supabase** | PostgreSQL + Auth + Real-time |
| AI / LLM | **Google Gemini 2.0** | Narrative generation + proofreading |
| Payments | **Stripe** | Subscription billing |
| Hosting | **Vercel** | Deployment + CI/CD |
| Animations | **Framer Motion** | Page transitions + micro-interactions |
| IDE | **Cursor** | Development environment |

**Do NOT suggest alternative technologies unless I specifically ask.**

---

## DATABASE SCHEMA

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (Supabase Auth ID) |
| email | VARCHAR | User email |
| username | VARCHAR | Display username |
| location | VARCHAR | City, state |
| position | VARCHAR | Job title |
| profile_picture_url | VARCHAR | URL to profile image |
| subscription_status | VARCHAR | active, trial, expired, bypass |
| stripe_customer_id | VARCHAR | Stripe customer ID |
| created_at | TIMESTAMP | Account creation |
| updated_at | TIMESTAMP | Last update |

### Narratives Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| ro_number | VARCHAR | Repair Order number |
| vehicle_year | INTEGER | Vehicle year |
| vehicle_make | VARCHAR | Vehicle make |
| vehicle_model | VARCHAR | Vehicle model |
| concern | TEXT | Concern section |
| cause | TEXT | Cause section |
| correction | TEXT | Correction section |
| full_narrative | TEXT | Combined block format |
| story_type | VARCHAR | diagnostic_only or repair_complete |
| created_at | TIMESTAMP | Date/time saved |

---

## DESIGN & AESTHETIC (NON-NEGOTIABLE)

**For complete visual specifications including exact color values, CSS implementations, and Tailwind configurations, see the ServiceDraft_AI_UI_Design_Spec_v1.md document.**

### Design Philosophy
ServiceDraft.AI follows a **"Premium Dark Automotive Tech"** aesthetic:
- **Dark mode** — this is the only mode, not a toggle
- **Neon purple/violet glowing effects** — accent color on buttons, borders, focus states, cards
- **Transparent/glass-morphism cards** — frosted glass look with backdrop blur ("Liquid" material)
- **Constantly looping animated background** — sine wave animation, subtle, premium, never static
- **"Million dollar build" feel** — high-end product, not a weekend side project

### Logo
**Primary Logo File**: `SERVIDRAFT_AI_LOGO_1_.PNG`
- Horizontal lockup with "SD" monogram icon + "ServiceDraft.AI" wordmark
- 3D metallic/carbon fiber texture with purple neon outline glow
- Integrated wrench icon within the "D" shape
- Purple plasma/energy trail effect extending through wordmark
- Optimized for dark backgrounds (transparent PNG)

### Core Color System (22 Active Colors)

**Primary Purple Accent Family:**
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Purple | #a855f7 | Main accent, buttons, borders, focus states |
| Purple Light | #c084fc | Hover states, highlights |
| Purple Dark | #9333ea | Active states, pressed buttons |
| Purple Deep | #7c3aed | Secondary accents |
| Purple Glow | #49129b | Glow effects, shadow color |

**Background & Surface Colors:**
| Color | Hex | Usage |
|-------|-----|-------|
| True Black | #000000 | Primary background |
| Dark Base | #260d3f | Gradient color 1 |
| Deep Purple Black | #490557 | Gradient color 2 |
| Surface Dark | #c5ade5 (5% opacity) | Card backgrounds |
| Surface Elevated | #1a0a2e | Elevated surfaces |
| Input Background | #0f0520 | Input field backgrounds |

**Text Colors:**
| Color | Hex | Usage |
|-------|-----|-------|
| Text Primary | #ffffff | Headings, important text |
| Text Secondary | #c4b5fd | Subtext, descriptions |
| Text Muted | #9ca3af | Placeholder text, labels |

### Background Animation
**Type**: Sine Waves (PRIMARY ANIMATION)
```json
{
  "type": "waves",
  "enabled": true,
  "color": "#c3abe2"
}
```
- Multiple overlapping sine waves
- Stroke color: #c3abe2 at 15-25% opacity
- Animation speed: 8-12 second full cycle
- Horizontal flow, left to right

### Gradient Background
```json
{
  "type": "gradient",
  "colors": ["#260d3f", "#000000", "#490557"]
}
```
**CSS**: `background: linear-gradient(135deg, #260d3f 0%, #000000 50%, #490557 100%);`

### Card System ("Liquid" Material)
```json
{
  "material": "liquid",
  "bg": "#c5ade5",
  "opacity": 5,
  "borderColor": "#000000",
  "borderWidth": 2,
  "borderRadius": 23,
  "blur": 2,
  "glow": {
    "color": "#49129b",
    "intensity": 40
  }
}
```

### Modal System
```json
{
  "material": "liquid",
  "animation": "scale",
  "position": "center",
  "width": 600,
  "borderRadius": 23
}
```
- Scale animation (95% → 100%) on open
- Same "Liquid" material as cards
- Dark backdrop with blur

### Button Design
**Primary Button:**
- Background: #a855f7 (solid)
- Text: #ffffff
- Border radius: 8px
- Hover: #9333ea with glow effect

**Secondary Button:**
- Background: transparent
- Text: #a855f7
- Border: 1px solid #a855f7
- Border radius: 8px

### Input Fields
- Background: #0f0520
- Border: 1px solid #6b21a8
- Border radius: 8px
- Text: #ffffff
- Placeholder: #9ca3af
- Focus: #a855f7 border with glow ring

### Z-Index Layers
```
z-0   : Gradient background base
z-10  : Wave animation canvas
z-20  : Content overlay
z-30  : Cards and UI components
z-40  : Modals and overlays
z-50  : Toasts and notifications
z-100 : Navigation bar
```

---

## HOW TO COMMUNICATE WITH ME

### ALWAYS Do This:
- **Give me complete file contents.** Never give partial snippets, diffs, or "replace lines 42-56" instructions. Show me the entire file every time, even if only one line changed.
- **Step-by-step, click-by-click guidance.** When I need to do something in Cursor, GitHub, Vercel, Supabase, or the terminal — walk me through it like a tutorial.
- **Explain the "why" briefly.** One sentence on why we're doing something helps me learn.
- **Default to execution mode.** Unless I'm asking a planning question, assume I want you to write the code and tell me where to put it.
- **Challenge bad decisions.** If I suggest something that will cause problems later, push back and explain why.
- **Use consistent file naming and project structure.** Follow Next.js App Router conventions.

### NEVER Do This:
- Don't use developer jargon without explaining it
- Don't give me partial code or say "the rest stays the same"
- Don't assume I know terminal commands — spell them out
- Don't suggest tools/frameworks outside the locked tech stack
- Don't give me options when there's a clearly better answer
- Don't skip error handling or loading states

---

## RESPONSE FORMAT PREFERENCES

- When giving me code: wrap it in a code block with the **full file path** as a comment on line 1 (e.g., `// src/app/page.tsx`)
- When creating new files: tell me the exact folder path and filename
- When multiple files are involved: number them in the order I should create/edit them
- For terminal commands: put them in their own code block labeled "Terminal"
- Bold the action I need to take (e.g., **Create this file**, **Run this command**)

---

## PROJECT CONTINUITY RULES

- Always reference the **ServiceDraft_AI_Spec_v1.3.docx** for detailed page and feature specifications
- Always reference the **ServiceDraft_AI_Prompt_Logic_v1.md** for all API prompt templates, dropdown logic, customization panel logic, and JSON response structures
- Always reference the **ServiceDraft_AI_UI_Design_Spec_v1.md** for all visual design specifications, color values, CSS implementations, and component styling
- If I ask for something that conflicts with a previous decision, flag it
- Keep track of what's been built vs. what's still planned
- If a conversation is getting long, proactively suggest we summarize progress
- When starting a new chat, check project knowledge files for context

---

## PROJECT KNOWLEDGE FILES

| Document | Purpose |
|----------|---------|
| **ServiceDraft_AI_Project_Instructions_v1.3.md** | This file — how to work with Tyler, tech stack, communication rules, design summary |
| **ServiceDraft_AI_Spec_v1.3.docx** | Detailed page specs, database schema, feature matrix, workflow diagrams |
| **ServiceDraft_AI_Prompt_Logic_v1.md** | All API prompts, dropdown logic, customization panel logic, JSON structures |
| **ServiceDraft_AI_UI_Design_Spec_v1.md** | Complete visual design system — colors, typography, components, animations, CSS/Tailwind implementations |
| **ui-design-configurator.jsx** | Interactive UI design tool for prototyping component styles |
| **SERVIDRAFT_AI_LOGO_1_.PNG** | Primary application logo file |

---

## QUALITY STANDARDS

- Every component should have proper loading states, error states, and empty states
- All forms should have input validation (especially the Input Page field requirements)
- Auth should be checked on every protected route
- The app should feel fast — use optimistic UI updates where appropriate
- Mobile responsive is required but desktop-first for layout
- Accessibility basics: proper labels, focus management, contrast ratios
- No placeholder or "TODO" code in production files
- Loading animations for ALL API calls
- Typing animation for all API response text display
- **All UI components must follow the ServiceDraft_AI_UI_Design_Spec_v1.md specifications exactly**

---

*— End of Project Instructions v1.3 —*
