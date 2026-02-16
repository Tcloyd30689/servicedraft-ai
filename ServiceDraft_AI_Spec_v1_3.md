# SERVICEDRAFT.AI

**Project Specification Document**

*AI-Powered Warranty Narrative Generator for Automotive Dealership Service Departments*

**Version 1.3**

February 2026

---

## Table of Contents

1. Executive Summary
2. Project Overview
3. Technology Stack
4. Authentication & Payment Flows
5. Page Specifications
6. Database Schema
7. API Integration & JSON Structures
8. UI/UX Specifications
9. Visual Design System
10. Feature Matrix
11. Complete Workflow Diagram
12. Project Knowledge Files

---

## 1. Executive Summary

ServiceDraft.AI is a web application designed to transform technician diagnostic and repair notes into professional, audit-proof warranty narratives. The application serves automotive dealership service departments by automating the creation of warranty claim stories in the industry-standard 3C format (Concern, Cause, Correction).

### Core Value Proposition

- Reduces narrative writing time from 5-10 minutes to under 30 seconds
- Ensures consistent, professional language that passes warranty audits
- Eliminates warranty claim rejections due to poor documentation
- Supports both diagnostic-only and completed repair scenarios
- Provides AI-powered proofreading to catch potential audit flags

---

## 2. Project Overview

### 2.1 Application Name

ServiceDraft.AI

### 2.2 Target Users

- **Primary**: Automotive service technicians at franchised dealerships
- **Secondary**: Service advisors and warranty administrators
- **Future**: Independent repair facilities and fleet maintenance operations

### 2.3 Design Aesthetic

- Dark mode interface as default (only mode)
- Purple/violet accent colors with subtle glow effects
- Professional, premium appearance ("million dollar build" styling)
- Clean, intuitive navigation focused on speed of use
- Animated sine wave background for dynamic, living interface

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14+ | React framework with server-side rendering |
| **Styling** | Tailwind CSS | Utility-first CSS for dark mode and custom design |
| **Backend/Database** | Supabase | PostgreSQL database + authentication + real-time |
| **AI Integration** | Google Gemini 2.0 | Narrative generation and proofreading |
| **Payments** | Stripe | Subscription billing and payment processing |
| **Deployment** | Vercel | Hosting and CI/CD pipeline |
| **Animations** | Framer Motion | Page transitions and micro-interactions |

---

## 4. Authentication & Payment Flows

### 4.1 Sign In Flow (Existing Users)

1. User arrives at Landing Page
2. Clicks "LOGIN" button
3. Enters Username and Password
4. System validates credentials against Supabase Auth
5. On success: Redirect to Main Menu Page

### 4.2 Sign Up Flow (New Users)

**Step 1: Account Creation**
- Email address
- Password
- Confirm Password

**Step 2: Payment/Subscription (Stripe Paywall)**
- Display subscription plans and pricing
- Stripe checkout integration for payment processing
- Credit card input via Stripe Elements (secure, PCI compliant)
- Access Code field for prototype bypass
- Valid access code skips payment, sets subscription_status to "bypass"

**Step 3: Profile Creation**
- Profile picture upload (optional)
- Email (auto-populated, read-only)
- Location (e.g., "Rock Springs, WY")
- Position (e.g., "Technician", "Service Advisor")

**Step 4: Completion**
- Profile information saved to users table in database
- User redirected to Main Menu Page

---

## 5. Page Specifications

### 5.1 Landing Page

**Purpose:** First point of contact for all users

- ServiceDraft.AI logo with purple glow effect
- "LOGIN" button - opens sign-in form
- "REQUEST ACCESS" button - initiates sign-up flow

### 5.2 Main Menu Page (Hub)

**Purpose:** Central navigation hub after authentication

**User ID Popup Contents**

| Element | Description |
|---------|-------------|
| Username | Display user's username |
| Location | User's location (e.g., Rock Springs, WY) |
| Position | User's job title |
| User Dashboard button | Quick link to saved history |
| Log Out button | Ends session, returns to Landing Page |

**Main Menu Buttons**

| Button | Action |
|--------|--------|
| GENERATE NEW STORY | Navigate to Input Page |
| USER DASHBOARD | Navigate to Saved History Page |
| LOG OUT | Log out and return to Landing Page |
| FAQ/INFO | Display FAQ/instruction sheet modal |
| SUPPORT | Open support ticket form, sends email to admin |

### 5.3 Input Page

**Purpose:** Capture repair order information for narrative generation

**Story Type Selection**
- **DIAGNOSTIC ONLY**: For work orders where only diagnosis was performed
- **REPAIR COMPLETE**: For work orders where the repair has been fully completed

**Input Field Validation Rules**

| Fields | Requirement | Dropdown Menu |
|--------|-------------|---------------|
| 1-5 | ALWAYS REQUIRED | NO dropdown - must enter text |
| 6+ | CONDITIONAL | HAS dropdown - requirement depends on selection |

**Conditional Field Logic (Fields 6+)**

| Dropdown Selection | Field Required? | Result |
|--------------------|-----------------|--------|
| Include Information | YES | Must enter text to proceed |
| Don't Include Information | NO | Can be left empty |
| Generate Applicable Info | NO | AI will infer this field |

> **GENERATE STORY button remains DISABLED until: All required fields (1-5) have text AND all conditional fields with "Include Information" selected have text.**

**R.O. # Field Handling**

The Repair Order number (Field 1) is required on the input form for validation purposes, but it is NEVER included in the compiled data block sent to the Gemini API. It is stored in application state and used exclusively for saving the narrative to the database and displaying in the Saved Narrative History table.

**Year, Make, Model — API Usage**

Year, Make, and Model (Fields 2-4) ARE sent to the API as part of the compiled data block. This allows the AI to infer manufacturer-specific processes, system names, and terminology relevant to the specific vehicle being serviced.

> **The AI's generated output CAN and SHOULD contain manufacturer-specific language when relevant. The restriction on brand-neutral language applies ONLY to the application's source code, UI text, and hardcoded prompt strings — NOT to the AI's generated output.**

**Diagnostic Only Form Fields**

| # | Field Name | Type | Description |
|---|------------|------|-------------|
| 1 | R.O. # | REQUIRED (database only) | Repair Order number — NOT sent to API |
| 2 | Year | REQUIRED (sent to API) | Vehicle model year |
| 3 | Make | REQUIRED (sent to API) | Vehicle manufacturer |
| 4 | Model | REQUIRED (sent to API) | Vehicle model name |
| 5 | Customer Concern | REQUIRED (sent to API) | What customer reported |
| 6 | Codes Present | CONDITIONAL | Diagnostic trouble codes |
| 7 | Diagnostics Performed | CONDITIONAL | Steps to diagnose |
| 8 | Root Cause/Failure | CONDITIONAL | Identified cause |
| 9 | Recommended Action | CONDITIONAL | Recommended repair |

**Repair Complete Form Fields**

| # | Field Name | Type | Description |
|---|------------|------|-------------|
| 1 | R.O. # | REQUIRED (database only) | Repair Order number — NOT sent to API |
| 2 | Year | REQUIRED (sent to API) | Vehicle model year |
| 3 | Make | REQUIRED (sent to API) | Vehicle manufacturer |
| 4 | Model | REQUIRED (sent to API) | Vehicle model name |
| 5 | Customer Concern | REQUIRED (sent to API) | What customer reported |
| 6 | Codes Present | CONDITIONAL | Diagnostic trouble codes |
| 7 | Diagnostics Performed | CONDITIONAL | Steps to diagnose |
| 8 | Root Cause/Failure | CONDITIONAL | Identified cause |
| 9 | Repair Performed | CONDITIONAL | What repair was done |
| 10 | Repair Verification | CONDITIONAL | How verified successful |

**"Generate Applicable Info" Prompt Logic**

When a user selects "Generate Applicable Info" for a field, the following instruction is injected into the compiled data block in place of user-entered text:

> [FIELD NAME]: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable [FIELD NAME] using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.

**For complete prompt templates, dropdown logic, and compiled data block assembly rules, see the ServiceDraft_AI_Prompt_Logic_v1.md document.**

### 5.4 Generated Narrative Page

**Purpose:** Display, customize, review, edit, and export the AI-generated narrative

**Layout Overview**
- Header: Logo, "Main Menu" button, Nav Bar, User ID
- Left Panel: Controls (Regenerate, Customization, Review)
- Right Panel: Generated narrative display
- Bottom: Action buttons

> **DEFAULT FORMAT: Block formatting is the DEFAULT display mode. Both block and C/C/C formats are available immediately from the initial API response — no additional API calls needed to switch.**

**Left Panel Controls**

| Element | Function |
|---------|----------|
| REGENERATE STORY button | Re-runs API call with same original input data for fresh variation |
| AI Output Customization toggle | ON/OFF - shows or hides customization sliders |
| REVIEW & PROOFREAD STORY button | Triggers separate AI audit API call on current narrative |
| Flagged Issues box | Displays AI-identified potential problems (read only) |
| Suggested Edits box | Displays AI recommendations (read only) |
| Audit Rating Badge | PASS (green) / NEEDS_REVIEW (yellow) / FAIL (red) |

**AI Output Customization Panel (When Toggle = ON)**

| Slider | Options |
|--------|---------|
| Length | Short ↔ Standard ↔ Detailed |
| Tone | Warranty ↔ Standard ↔ Customer Friendly |
| Detail Level | Concise ↔ Standard ↔ Additional Steps |

- Custom Instructions text field for free-form AI guidance
- "APPLY CUSTOMIZATION TO STORY" button — rewrites current narrative with slider settings

> **CRITICAL: Customization modifies the CURRENTLY DISPLAYED narrative — it does NOT re-generate from the original input data. User edits and prior customizations are preserved and adjusted, not overwritten.**

**For detailed customization prompt logic, slider modifier definitions, and state management rules, see the ServiceDraft_AI_Prompt_Logic_v1.md document.**

**Bottom Action Buttons**

| Button | Function |
|--------|----------|
| EDIT STORY | Opens editable modal (format matches current view mode) |
| C/C/C FORMAT * | Switches display to separated sections (shown when in Block mode) |
| BLOCK FORMATTING * | Switches display to combined paragraph (shown when in C/C/C mode) |
| SAVE STORY | Saves current narrative to database/history |
| SHARE/EXPORT STORY | Opens export options modal |

*DYNAMIC BUTTON: Only ONE format button is shown at a time. The button displays the OPPOSITE of the current format, allowing the user to switch.*

**Share/Export Options**
- Copy Text to Clipboard
- Print Generated Narrative
- Download as PDF Document

### 5.5 User Dashboard / Saved History

**Purpose:** View profile information and access previously saved narratives

**Profile Section**
- Profile picture display
- Username, Internal ID, Location, Position
- "UPDATE" button - opens profile edit flow

**Saved Narrative History Table**

| Column | Description |
|--------|-------------|
| Date | Date the narrative was saved |
| Timestamp | Time the narrative was saved |
| Repair Order # | RO number from input form |
| Year | Vehicle year |
| Make | Vehicle manufacturer |
| Model | Vehicle model |
| Saved Story | Preview text (first 30 characters) |

- Search functionality to filter by any column
- Clicking any row opens popup modal with full details

> **IMPORTANT: Saved stories are READ ONLY and cannot be edited within the app. This ensures audit integrity.**

**Edit Profile Flow**

| Button | Opens |
|--------|-------|
| Add/Update Profile Picture | Image upload interface |
| Update Profile Information | Location and Position edit modal |
| Change Password | Password change modal |
| Go Back | Returns to Dashboard |

---

## 6. Database Schema

### 6.1 Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (Supabase Auth ID) |
| email | VARCHAR | User email address |
| username | VARCHAR | Display username |
| location | VARCHAR | User location (city, state) |
| position | VARCHAR | Job title |
| profile_picture_url | VARCHAR | URL to profile image in storage |
| subscription_status | VARCHAR | active, trial, expired, bypass |
| stripe_customer_id | VARCHAR | Stripe customer ID for billing |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last profile update |

### 6.2 Narratives Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| ro_number | VARCHAR | Repair Order number |
| vehicle_year | INTEGER | Vehicle model year |
| vehicle_make | VARCHAR | Vehicle manufacturer |
| vehicle_model | VARCHAR | Vehicle model name |
| concern | TEXT | Concern section of narrative |
| cause | TEXT | Cause section of narrative |
| correction | TEXT | Correction section of narrative |
| full_narrative | TEXT | Combined block format version |
| story_type | VARCHAR | diagnostic_only or repair_complete |
| created_at | TIMESTAMP | Date and time saved |

---

## 7. API Integration & JSON Structures

**For complete prompt templates, system prompts, and prompt assembly logic, see the ServiceDraft_AI_Prompt_Logic_v1.md document. The information below is a summary of the API call structure and JSON response formats.**

### 7.1 Gemini API Calls

| API Call | Purpose | Input Data |
|----------|---------|------------|
| Generate Narrative | Creates 3C narrative from input fields | Compiled data block (excludes R.O. #) |
| Regenerate | Re-run with same inputs for variation | Original compiled data block |
| Apply Customization | Rewrites current narrative with slider settings | Current displayed narrative + modifiers |
| Review & Proofread | Audits current narrative for issues | Current displayed narrative text |

### 7.2 Narrative Generation JSON Response

The API returns a 4-key JSON structure that provides both display formats in a single call. No additional API calls are needed to switch between block and C/C/C formats.

**Expected JSON Structure**

```json
{
  "block_narrative": "COMPLETE STORY AS ONE FLOWING PARAGRAPH...",
  "concern": "CUSTOMER CONCERN SECTION ONLY...",
  "cause": "CAUSE/DIAGNOSIS SECTION ONLY...",
  "correction": "CORRECTION/REPAIR SECTION ONLY..."
}
```

- `block_narrative`: Displayed in Block format view — one cohesive paragraph
- `concern`, `cause`, `correction`: Displayed in C/C/C format view — three separate labeled sections
- All four fields returned in a single API call; both formats available immediately

### 7.3 Audit/Proofread JSON Response

**Expected JSON Structure**

```json
{
  "flagged_issues": ["Issue description 1", "Issue description 2"],
  "suggested_edits": ["Specific fix for issue 1", "Specific fix for issue 2"],
  "overall_rating": "PASS | NEEDS_REVIEW | FAIL",
  "summary": "Brief one-sentence overall assessment"
}
```

**Display Parsing**
- `flagged_issues` array → Populates "Flagged Issues" text box (joined with line breaks)
- `suggested_edits` array → Populates "Suggested Edits" text box (joined with line breaks)
- `overall_rating` → Color-coded badge: PASS (green), NEEDS_REVIEW (yellow), FAIL (red)
- `summary` → Displayed below the rating badge

---

## 8. UI/UX Specifications

### 8.1 Loading Animations

Animated widgets/popups must be displayed during ALL API wait times:

| API Action | Loading Animation Context |
|------------|---------------------------|
| Generate Narrative | "Generating your warranty narrative..." |
| Regenerate Story | "Regenerating narrative..." |
| Apply Customization | "Applying customization settings..." |
| Review & Proofread | "Reviewing narrative for issues..." |

Animation Style: Branded spinner or pulsing animation with contextual message. Should match dark mode + purple glow aesthetic.

### 8.2 Typing Animation Effect

API response text fills read-only fields with ultra-fast typing animation rather than static insertion:

- Text appears character-by-character at high speed (typewriter effect)
- Speed: Ultra-fast (approximately 20-50ms per character)
- Applies to: Generated narrative sections (block_narrative or concern, cause, correction)
- Applies to: Flagged Issues and Suggested Edits boxes after proofread
- Creates premium, dynamic feel rather than abrupt text appearance

### 8.3 Toast Notifications

Brief, non-blocking notifications for user feedback:

- "Story saved successfully"
- "Copied to clipboard"
- "Profile updated"
- "Password changed successfully"
- "Adjust at least one slider or add custom instructions before applying."
- Error messages for failed operations

### 8.4 Form Validation Feedback

- Required fields show visual indicator when empty
- GENERATE STORY button visually disabled until conditions met
- Real-time validation as user fills form

---

## 9. Visual Design System

**For complete CSS implementations, Tailwind configurations, and detailed component specifications, see the ServiceDraft_AI_UI_Design_Spec_v1.md document.**

### 9.1 Design Philosophy

ServiceDraft.AI follows a **"Premium Dark Automotive Tech"** aesthetic inspired by high-end automotive dashboards, modern SaaS platforms, and gaming/tech interfaces. The visual language communicates professionalism, cutting-edge technology, and the high-stakes nature of warranty documentation.

### 9.2 Logo Specifications

**Primary Logo File**: `SERVIDRAFT_AI_LOGO_1_.PNG`

The ServiceDraft.AI logo is a horizontal lockup consisting of:

1. **Icon Element (Left)**: A stylized "SD" monogram with:
   - Dark metallic/carbon fiber texture base
   - Purple neon outline glow effect
   - Integrated wrench icon within the "D" shape
   - Dimensional depth with beveled edges

2. **Wordmark (Right)**: "ServiceDraft.AI" in a custom tech/automotive typeface:
   - Italic angle suggesting speed and efficiency
   - Purple color matching the accent system (#a855f7 to #9333ea gradient)

3. **Energy Trail Effect**: A horizontal purple plasma/energy streak extending through the wordmark

### 9.3 Color System (22 Active Colors)

**Core Purple Accent Family**

| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| Primary Purple | #a855f7 | Main accent, buttons, borders, focus states |
| Purple Light | #c084fc | Hover states, highlights |
| Purple Dark | #9333ea | Active states, pressed buttons |
| Purple Deep | #7c3aed | Secondary accents |
| Purple Glow | #49129b | Glow effects, shadow color |

**Background & Surface Colors**

| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| True Black | #000000 | Primary background |
| Dark Base | #260d3f | Gradient color 1 |
| Deep Purple Black | #490557 | Gradient color 2 |
| Surface Dark | #c5ade5 (5% opacity) | Card backgrounds |
| Surface Elevated | #1a0a2e | Elevated surfaces |
| Input Background | #0f0520 | Input field backgrounds |

**Text Colors**

| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| Text Primary | #ffffff | Headings, important text |
| Text Secondary | #c4b5fd | Subtext, descriptions |
| Text Muted | #9ca3af | Placeholder text, labels |

### 9.4 Background & Animation

**Gradient Background**

```json
{
  "type": "gradient",
  "colors": ["#260d3f", "#000000", "#490557"]
}
```

CSS Implementation: `background: linear-gradient(135deg, #260d3f 0%, #000000 50%, #490557 100%);`

**Sine Wave Animation (PRIMARY)**

```json
{
  "animation": {
    "type": "waves",
    "enabled": true,
    "color": "#c3abe2"
  }
}
```

| Property | Value |
|----------|-------|
| Type | Sine Waves |
| Stroke Color | #c3abe2 |
| Opacity | 15-25% |
| Wave Count | 3-5 overlapping waves |
| Animation Speed | 8-12 seconds full cycle |
| Direction | Horizontal flow, left to right |

### 9.5 Card System ("Liquid" Material)

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

| Property | Value | CSS |
|----------|-------|-----|
| Background | #c5ade5 at 5% | `rgba(197, 173, 229, 0.05)` |
| Border | 2px solid black | `border: 2px solid #000000` |
| Border Radius | 23px | `border-radius: 23px` |
| Backdrop Blur | 2px | `backdrop-filter: blur(2px)` |
| Glow | #49129b at 40 intensity | `box-shadow: 0 0 40px rgba(73, 18, 155, 0.4)` |

### 9.6 Modal System

```json
{
  "material": "liquid",
  "animation": "scale",
  "position": "center",
  "width": 600,
  "borderRadius": 23
}
```

| Property | Value |
|----------|-------|
| Material | Liquid (same as cards) |
| Animation | Scale (95% → 100% on open) |
| Position | Centered (vertical & horizontal) |
| Width | 600px (max: 90vw) |
| Border Radius | 23px |
| Backdrop | 70% black with 4px blur |

### 9.7 Button Design

**Primary Button**

```json
{
  "background": "#a855f7",
  "textColor": "#ffffff",
  "borderWidth": 0,
  "borderRadius": 8
}
```

- Hover: #9333ea with glow effect
- Active: #7c3aed with scale(0.98)
- Disabled: #4b5563 at 60% opacity

**Secondary Button**

```json
{
  "background": "transparent",
  "textColor": "#a855f7",
  "borderColor": "#a855f7",
  "borderWidth": 1,
  "borderRadius": 8
}
```

- Hover: 10% purple background tint

### 9.8 Input Fields

```json
{
  "background": "#0f0520",
  "borderColor": "#6b21a8",
  "borderWidth": 1,
  "textColor": "#ffffff",
  "placeholderColor": "#9ca3af",
  "borderRadius": 8
}
```

- Focus: #a855f7 border with 3px glow ring

### 9.9 Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page Title | 32px | 700 (Bold) | #ffffff |
| Card Title | 24px | 600 (Semibold) | #a855f7 |
| Section Heading | 20px | 600 | #ffffff |
| Subtitle/Subtext | 16px | 400 | #c4b5fd |
| Body Text | 16px | 400 | #ffffff |
| Small Text | 14px | 400 | #9ca3af |
| Label | 14px | 500 | #c4b5fd |

### 9.10 Z-Index Layers

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

## 10. Feature Matrix

| Feature | Page | Priority |
|---------|------|----------|
| Email/password authentication | Landing | MVP |
| Stripe paywall integration | Sign Up | MVP |
| Access code bypass for payment | Sign Up | MVP |
| Profile creation (picture, location, position) | Sign Up | MVP |
| Main menu navigation hub | Main Page | MVP |
| User ID popup with quick actions | Main Page | MVP |
| FAQ/Info display | Main Page | Phase 2 |
| Support ticket system | Main Page | Phase 2 |
| Story type selection (Diagnostic/Repair) | Input | MVP |
| Required fields (1-5) validation | Input | MVP |
| Conditional field dropdowns (6+) | Input | MVP |
| R.O. # saved to database only (not sent to API) | Input | MVP |
| Year/Make/Model sent to API for manufacturer inference | Input | MVP |
| Loading animations during API calls | Various | MVP |
| AI narrative generation (4-key JSON response) | Generated | MVP |
| Typing animation for text display | Generated | MVP |
| Block format as default | Generated | MVP |
| Dynamic format toggle button | Generated | MVP |
| AI customization sliders (modifies current narrative) | Generated | Phase 2 |
| Review & Proofread with rating badge | Generated | Phase 2 |
| Edit story modal | Generated | MVP |
| Save to history | Generated | MVP |
| Copy to clipboard | Generated/Dashboard | MVP |
| Print narrative | Generated/Dashboard | Phase 2 |
| Download as PDF | Generated/Dashboard | Phase 2 |
| Saved history table with search | Dashboard | MVP |
| Profile management | Dashboard | MVP |
| Password change | Dashboard | MVP |
| Toast notifications | Various | MVP |
| Dark mode + purple glow aesthetic | All | MVP |
| Sine wave background animation | All | MVP |
| Liquid material glassmorphism cards | All | MVP |

---

## 11. Complete Workflow Diagram

The following text-based diagram illustrates the complete user journey through the application:

**LANDING PAGE**
```
├── LOGIN → Sign In → MAIN PAGE
└── REQUEST ACCESS → Sign Up Flow
    ├── 1. Account Creation (Email/Password)
    ├── 2. STRIPE PAYWALL (Pay or Access Code)
    ├── 3. Profile Creation
    └── → MAIN PAGE
```

**MAIN PAGE (Hub)**
```
├── GENERATE NEW STORY → INPUT PAGE
├── USER DASHBOARD → DASHBOARD
├── FAQ/INFO → Info Modal
├── SUPPORT → Ticket Form → Email Admin
└── LOG OUT → LANDING PAGE
```

**INPUT PAGE**
```
├── Select Story Type (Diagnostic/Repair)
├── Fill Required Fields 1-5 (R.O. # saved to DB only)
├── Fill/Configure Fields 6+ (with dropdown)
├── GENERATE STORY (enabled when valid)
│   └── [LOADING] → API Call → GENERATED PAGE
└── MAIN MENU → MAIN PAGE
```

**GENERATED NARRATIVE PAGE**
```
├── [TYPING ANIMATION] → Text fills display
├── View Narrative (Block format default)
├── Toggle Format Button (switches view, no API call)
├── REGENERATE → [LOADING] → Re-call API with original data
├── AI Customization → Sliders → Apply to current narrative
├── REVIEW & PROOFREAD → [LOADING] → Audit + Rating Badge
├── EDIT STORY → Edit Modal → Save Changes
├── SAVE STORY → Database → Toast
├── SHARE/EXPORT → Copy/Print/PDF
└── MAIN MENU → MAIN PAGE
```

**USER DASHBOARD**
```
├── Profile Section → UPDATE → Edit Flow
├── History Table → Click Row → View Modal (READ ONLY)
│   └── SHARE/EXPORT → Copy/Print/PDF
└── MAIN MENU → MAIN PAGE
```

---

## 12. Project Knowledge Files

The following documents make up the complete project specification:

| Document | Purpose |
|----------|---------|
| **ServiceDraft_AI_Project_Instructions_v1.3.md** | How to work with Tyler, tech stack, communication rules, design summary |
| **ServiceDraft_AI_Spec_v1.3.md** | This file — detailed page specs, database schema, feature matrix, workflow diagrams |
| **ServiceDraft_AI_Prompt_Logic_v1.md** | All API prompts, dropdown logic, customization panel logic, JSON structures |
| **ServiceDraft_AI_UI_Design_Spec_v1.md** | Complete visual design system — colors, typography, components, animations, CSS/Tailwind implementations |
| **ui-design-configurator.jsx** | Interactive UI design tool for prototyping component styles |
| **SERVIDRAFT_AI_LOGO_1_.PNG** | Primary application logo file |

---

*— End of Specification Document v1.3 —*
