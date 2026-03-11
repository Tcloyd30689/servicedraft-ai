# SERVICEDRAFT.AI — PROMPT & API LOGIC DOCUMENT v2.1

## Table of Contents
1. [Prompt Assembly Pipeline Overview](#1-prompt-assembly-pipeline-overview)
2. [Input Field Configuration & Dropdown Logic](#2-input-field-configuration--dropdown-logic)
3. [Compiled Data Block Assembly](#3-compiled-data-block-assembly)
4. [Main Generate Narrative Prompt — Diagnostic Only](#4-main-generate-narrative-prompt--diagnostic-only)
5. [Main Generate Narrative Prompt — Repair Complete](#5-main-generate-narrative-prompt--repair-complete)
6. [JSON Response Structures & Parsing](#6-json-response-structures--parsing)
7. [Story Audit / Proofreading Prompts](#7-story-audit--proofreading-prompts)
8. [Proofread Snippet Extraction & Highlighting](#8-proofread-snippet-extraction--highlighting)
9. [AI Output Customization Panel Logic (Post-Generation)](#9-ai-output-customization-panel-logic-post-generation)
10. [Customization-Applied Regeneration Prompt](#10-customization-applied-regeneration-prompt)
11. [Apply Selected Edits Prompt](#11-apply-selected-edits-prompt)
12. [Pre-Generation Output Customization](#12-pre-generation-output-customization)
13. [Diagnostic → Repair Complete Update Prompt](#13-diagnostic--repair-complete-update-prompt)
14. [Convert Recommendation Prompt (Legacy — Unused)](#14-convert-recommendation-prompt-legacy--unused)
15. [Regenerate Behavior](#15-regenerate-behavior)
16. [Format Toggle (No API Call)](#16-format-toggle-no-api-call)
17. [Narrative Save Logic](#17-narrative-save-logic)
18. [Export Document Generation](#18-export-document-generation)
19. [Email Export via Resend](#19-email-export-via-resend)
20. [Token Usage Instrumentation](#20-token-usage-instrumentation)
21. [Rate Limiting & Input Validation](#21-rate-limiting--input-validation)
22. [Activity Logging on API Calls](#22-activity-logging-on-api-calls)
23. [Complete API Call Reference](#23-complete-api-call-reference)
24. [Prompt Content Rules — Master Reference](#24-prompt-content-rules--master-reference)
25. [Data Flow Diagrams](#25-data-flow-diagrams)

---

## 1. Prompt Assembly Pipeline Overview

Every AI call in ServiceDraft.AI follows a **prompt assembly pipeline** — the final prompt sent to Gemini is dynamically constructed from user inputs, dropdown selections, customization settings, and the appropriate system prompt.

### How It Works

```
USER INPUT FIELDS ──► DROPDOWN LOGIC ──► COMPILED DATA BLOCK ──► SYSTEM PROMPT + USER PROMPT ──► GEMINI API
                       FILTERS              │                                                        │
                                       Pre-Gen                                                  Token Usage
                                       Customization                                            Logged to
                                       (if non-standard)                                        api_usage_log
```

**Step 1:** User selects story type (Diagnostic Only or Repair Complete) on the Input Page.
**Step 2:** User fills in fields 1–5 (required) and optionally fields 6+ (conditional with dropdowns).
**Step 3:** The app loops through all fields and builds a "compiled data block" string. R.O. # is excluded — never sent to the API.
**Step 4:** If pre-generation customization has any non-standard settings (sliders moved from center), output style preferences are appended to the compiled data block.
**Step 5:** The compiled data block is injected into the appropriate user prompt template. The matching system prompt (Diagnostic Only or Repair Complete) is selected.
**Step 6:** Both prompts are sent to Gemini (`gemini-3-flash-preview`) via `generateWithGemini()`.
**Step 7:** The response text is parsed as JSON via `parseJsonResponse<T>()` and the 4-key narrative object is stored in `narrativeStore`.
**Step 8:** Token usage metadata (prompt_tokens, completion_tokens, total_tokens) is logged to `api_usage_log` via `logApiUsage()`.
**Step 9:** Activity is logged to `activity_log` via the client-side `logActivity()` (fire-and-forget).
**Step 10:** If the user later applies post-generation customization, the CURRENTLY DISPLAYED narrative (including any user edits) is sent back to the AI with modifier instructions — the original input data is NOT re-sent.

### AI Model Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Model | `gemini-3-flash-preview` | `src/lib/gemini/client.ts` |
| Max Output Tokens | 8192 | Default in `generateWithGemini()` — applied to ALL Gemini calls |
| Client Function | `generateWithGemini(systemPrompt, userPrompt, maxTokens?)` | `src/lib/gemini/client.ts` |
| JSON Parser | `parseJsonResponse<T>(raw)` | `src/lib/gemini/client.ts` |
| Token Logger | `logApiUsage({ userId, actionType, promptTokens, completionTokens, totalTokens })` | `src/lib/usageLogger.ts` |

### Prompt Source Locations

| Prompt | Location | Constant Name |
|--------|----------|--------------|
| Diagnostic Only Generate | `src/constants/prompts.ts` | `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` |
| Repair Complete Generate | `src/constants/prompts.ts` | `REPAIR_COMPLETE_SYSTEM_PROMPT` |
| Customization | `src/constants/prompts.ts` | `CUSTOMIZATION_SYSTEM_PROMPT` |
| Proofread (Repair Complete) | `src/constants/prompts.ts` | `PROOFREAD_SYSTEM_PROMPT` |
| Proofread (Diagnostic Only) | `src/constants/prompts.ts` | `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` |
| Apply Edits | `src/app/api/apply-edits/route.ts` | Inline in route file |
| Update Narrative | `src/app/api/update-narrative/route.ts` | Inline in route file |
| Convert Recommendation | `src/app/api/convert-recommendation/route.ts` | Inline in route file (unused) |
| Length/Tone/Detail Modifiers | `src/constants/prompts.ts` | `LENGTH_MODIFIERS`, `TONE_MODIFIERS`, `DETAIL_MODIFIERS` |

**CRITICAL:** When modifying ANY prompt text, copy from the constants file EXACTLY. Do not paraphrase, shorten, or reword prompt instructions. The phrasing has been carefully tuned for Gemini's response quality.

---

## 2. Input Field Configuration & Dropdown Logic

### Field Configuration Source

All field definitions live in `src/constants/fieldConfig.ts`:

```typescript
export type StoryType = 'diagnostic_only' | 'repair_complete';
export type DropdownOption = 'include' | 'dont_include' | 'generate';

export interface FieldConfig {
  id: string;
  label: string;
  fieldNumber: number;
  required: boolean;       // true = always required (fields 1-5), no dropdown
  hasDropdown: boolean;     // true = conditional field with dropdown (fields 6+)
  placeholder: string;
}
```

### Diagnostic Only Fields (9 total)

| # | Field ID | Label | Required | Has Dropdown | Sent to API |
|---|----------|-------|----------|-------------|-------------|
| 1 | `ro_number` | R.O. # | ✅ | ❌ | **NO** — database only |
| 2 | `year` | Year | ✅ | ❌ | ✅ |
| 3 | `make` | Make | ✅ | ❌ | ✅ |
| 4 | `model` | Model | ✅ | ❌ | ✅ |
| 5 | `customer_concern` | Customer Concern | ✅ | ❌ | ✅ |
| 6 | `codes_present` | Codes Present | ❌ | ✅ | Depends on dropdown |
| 7 | `diagnostics_performed` | Diagnostics Performed | ❌ | ✅ | Depends on dropdown |
| 8 | `root_cause` | Root Cause / Failure | ❌ | ✅ | Depends on dropdown |
| 9 | `recommended_action` | Recommended Action | ❌ | ✅ | Depends on dropdown |

### Repair Complete Fields (10 total)

Fields 1–8 are identical to Diagnostic Only. Fields 9–10 differ:

| # | Field ID | Label | Required | Has Dropdown | Sent to API |
|---|----------|-------|----------|-------------|-------------|
| 9 | `repair_performed` | Repair Performed | ❌ | ✅ | Depends on dropdown |
| 10 | `repair_verification` | Repair Verification | ❌ | ✅ | Depends on dropdown |

### Dropdown Option Behavior (Fields 6+)

**Option 1: "Include Information"**
- Field becomes REQUIRED — user must type text before GENERATE STORY enables
- Compiled data block: `FIELD_LABEL: {user's exact entered text}`

**Option 2: "Don't Include Information"**
- Field is NOT required — can be left empty
- Compiled data block: **field is completely excluded** — no line added

**Option 3: "Generate Applicable Info"**
- Field is NOT required — user does NOT need to type anything
- Compiled data block: AI inference instruction injected for that field

**AI Inference Instruction Template (injected per field):**
```
[FIELD LABEL]: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable [FIELD LABEL] using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.
```

### GENERATE STORY Button Enable/Disable Logic

The button is **DISABLED** until ALL of the following are true:
1. A story type is selected (Diagnostic Only or Repair Complete)
2. Fields 1–5 all have non-empty, non-whitespace text
3. Every field 6+ with "Include Information" selected has non-empty text
4. Fields with "Don't Include" or "Generate Applicable Info" do NOT require text

### Story Type Switching — Field Preservation

When the user switches between Diagnostic Only and Repair Complete:
- **Preserved fields**: year, make, model, customer_concern, codes_present, diagnostics_performed, root_cause (fields 1–8 share the same IDs)
- **Cleared fields**: story-type-specific fields (recommended_action for diagnostic, repair_performed/repair_verification for repair)
- Implemented via `setStoryType()` in `narrativeStore.ts`

---

## 3. Compiled Data Block Assembly

**File location:** `src/lib/compileDataBlock.ts`

### Assembly Logic (Pseudocode)

```
SKIP Field 1 (R.O. # — id: 'ro_number') — NEVER sent to API

FOR EACH REMAINING FIELD:
  ├── If field.required (fields 2–5):
  │     └── ADD: "FIELD_LABEL: {user_entered_text.trim()}"
  │
  ├── If dropdown = "include":
  │     └── ADD: "FIELD_LABEL: {user_entered_text.trim()}"
  │
  ├── If dropdown = "dont_include":
  │     └── SKIP — do not add anything for this field
  │
  └── If dropdown = "generate":
        └── ADD: "FIELD_LABEL: {AI inference instruction template}"

IF pre-gen customization has non-standard settings:
  └── APPEND: "--- OUTPUT STYLE PREFERENCES ---" section
      └── One line per non-standard slider using modifier text from prompts.ts
```

### Actual Implementation

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
    // 'dont_include' — skip entirely (no line added)
  }
  return lines.join('\n');
}
```

### Example Compiled Data Block

For a Diagnostic Only narrative with "Codes Present" set to Include, "Root Cause" set to Generate, and "Recommended Action" set to Don't Include:

```
YEAR: 2024
MAKE: CHEVROLET
MODEL: SILVERADO 1500
CUSTOMER CONCERN: CUSTOMER STATES CHECK ENGINE LIGHT IS ON AND VEHICLE HAS A ROUGH IDLE
CODES PRESENT: P0300, P0301, P0304
DIAGNOSTICS PERFORMED: PERFORMED CYLINDER POWER BALANCE TEST. CYLINDERS 1 AND 4 SHOWED SIGNIFICANTLY REDUCED CONTRIBUTION.
ROOT CAUSE / FAILURE: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable ROOT CAUSE / FAILURE using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.
```

Note: "Recommended Action" is completely absent because "Don't Include" was selected.

---

## 4. Main Generate Narrative Prompt — Diagnostic Only

**File location:** `src/constants/prompts.ts` → `DIAGNOSTIC_ONLY_SYSTEM_PROMPT`

### System Prompt Content Rules

The Diagnostic Only system prompt instructs Gemini to:

1. **Professional warranty-appropriate tone** — formal, precise, suitable for manufacturer review
2. **All text FULLY CAPITALIZED** — output must be entirely uppercase for visual uniformity
3. **Include most probable technical reason** for any failure not explicitly stated — fill gaps with reasonable professional language
4. **NEVER use "damaged"** or language implying external force, customer misuse, abuse, neglect, or any condition that would invalidate warranty coverage
5. **OEM Terminology (Enhanced)**: Identify the manufacturer based on the MAKE field. Use manufacturer-specific OEM service practices, proprietary system names (e.g., GM's Active Fuel Management, Ford's EcoBoost), diagnostic tool names, fluids, and procedures. The narrative should read as if written by a manufacturer-certified technician.
6. **Natural flowing story** — not bullet points, not numbered lists. Professional paragraph narrative.
7. **Preserve all detailed diagnostic info** provided by the technician. Add reasonable professional language only when the input is sparse. Never remove or summarize away provided details.
8. **NEVER fabricate** document ID numbers, reference numbers, case numbers, authorization numbers, TSB numbers, or any official identifiers that were not provided in the input
9. **Technical Detail Preservation (CRITICAL)**: Include ALL specific technical data points VERBATIM — terminal numbers, connector IDs, circuit numbers, pin numbers, wire colors, voltage readings, resistance readings, amperage readings, pressure readings, temperature readings, specification values, measurement tool readings. NEVER summarize, generalize, or omit these details. The AI should produce MORE detail, never less.
10. **Correction section uses future/recommended tense**: "RECOMMEND REPLACING...", "ADVISE PERFORMING...", etc. — the repair has NOT been performed yet.

### User Prompt Template (Diagnostic Only)

```
Generate an audit-proof warranty narrative based on the following diagnostic-only repair order information. This is a diagnosis-only scenario — the repair has NOT been performed yet. The correction section should describe what repair is RECOMMENDED.

VEHICLE & REPAIR ORDER INFORMATION:
---
{compiled_data_block}
---
```

### Expected JSON Response Format

```json
{
  "block_narrative": "COMPLETE FLOWING PARAGRAPH COMBINING ALL SECTIONS...",
  "concern": "CUSTOMER CONCERN SECTION TEXT...",
  "cause": "CAUSE/DIAGNOSIS SECTION TEXT...",
  "correction": "RECOMMENDED ACTION SECTION (FUTURE TENSE — 'RECOMMEND REPLACING...')"
}
```

---

## 5. Main Generate Narrative Prompt — Repair Complete

**File location:** `src/constants/prompts.ts` → `REPAIR_COMPLETE_SYSTEM_PROMPT`

### Differences from Diagnostic Only

The Repair Complete system prompt shares the same foundational rules as Diagnostic Only with these specific differences:

1. **Verification incorporation (additional rule)**: If repair verification steps were provided in the input, incorporate them naturally into the correction section
2. **Correction section uses PAST tense**: "REPLACED THE...", "PERFORMED...", "INSTALLED..." — the repair has been completed
3. **Rule numbering shifted**: No-fabricated-IDs is rule 9, Technical Detail Preservation is rule 10 (accommodating the additional verification rule at position 8)

### User Prompt Template (Repair Complete)

```
Generate an audit-proof warranty narrative based on the following completed repair order information. This repair has been fully completed and verified.

VEHICLE & REPAIR ORDER INFORMATION:
---
{compiled_data_block}
---
```

### Expected JSON Response Format

```json
{
  "block_narrative": "COMPLETE FLOWING PARAGRAPH COMBINING ALL SECTIONS...",
  "concern": "CUSTOMER CONCERN SECTION TEXT...",
  "cause": "CAUSE/DIAGNOSIS SECTION TEXT...",
  "correction": "COMPLETED REPAIR SECTION (PAST TENSE — 'REPLACED THE...')"
}
```

---

## 6. JSON Response Structures & Parsing

### Standard 4-Key Narrative Response

Used by: **Generate, Regenerate, Customize, Apply Edits, Update Narrative**

```json
{
  "block_narrative": "string — complete flowing paragraph combining all sections",
  "concern": "string — customer concern section (maps to C/C/C 'Concern' display)",
  "cause": "string — cause/diagnosis section (maps to C/C/C 'Cause' display)",
  "correction": "string — repair/recommendation section (maps to C/C/C 'Correction' display)"
}
```

All four keys MUST be present as non-empty strings. The API routes validate this after parsing.

### Proofread Response

```json
{
  "flagged_issues": [
    "Description of issue found [[EXACT SNIPPET FROM NARRATIVE]]",
    "Another issue [[ANOTHER SNIPPET]]"
  ],
  "suggested_edits": [
    "Suggested rewrite or fix for issue 1",
    "Suggested rewrite or fix for issue 2"
  ],
  "overall_rating": "PASS | NEEDS_REVIEW | FAIL",
  "summary": "Brief overall assessment of narrative quality"
}
```

- `flagged_issues` and `suggested_edits` arrays are parallel — index 0 of each correspond to the same issue
- `[[double bracket]]` markers in flagged_issues contain the exact text to highlight in the UI
- `overall_rating` is one of exactly three values: `"PASS"`, `"NEEDS_REVIEW"`, or `"FAIL"`

### JSON Parsing (`parseJsonResponse<T>()`)

```typescript
export function parseJsonResponse<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim()) as T;
}
```

This handles Gemini's tendency to wrap JSON in markdown code fences. Strips `` ```json `` and `` ``` `` before parsing.

---

## 7. Story Audit / Proofreading Prompts

The proofread system uses **two completely different prompts** selected based on story type. This is a critical design decision — diagnostic stories and repair-complete stories are evaluated against different criteria.

### 7A. Repair Complete Proofread (Warranty Audit)

**File location:** `src/constants/prompts.ts` → `PROOFREAD_SYSTEM_PROMPT`

**Purpose:** Evaluate the narrative as if it's being reviewed by a manufacturer warranty auditor. Flag anything that would cause the claim to be rejected.

**9 Audit Criteria:**
1. **Damage language**: Language implying external damage, customer misuse, abuse, neglect
2. **Missing verification**: Repair performed without documented verification steps
3. **Vague/ambiguous language**: Imprecise descriptions that weaken the claim
4. **Missing root cause**: Part replaced without documenting WHY it failed
5. **Inconsistency**: Contradictions between concern, cause, and correction sections
6. **Non-professional language**: Slang, informal tone, colloquialisms
7. **Uncertainty language**: "might be", "could be", "possibly", "suspected" without confirmation
8. **Missing diagnostic steps**: Part replaced without documenting how the conclusion was reached
9. **Overly brief narratives**: Insufficient detail to support the warranty claim

**OEM Terminology Allowance:** Manufacturer-specific terminology (GM Active Fuel Management, Ford EcoBoost, Toyota VVT-i, etc.) is EXPECTED and should NOT be flagged as improper language.

### 7B. Diagnostic Only Proofread (Authorization-Readiness Optimizer)

**File location:** `src/constants/prompts.ts` → `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT`

**Purpose:** Evaluate the diagnostic narrative's strength for pre-authorization. This does NOT flag for missing completed repairs or verification steps — the repair hasn't happened yet.

**10 Optimization Criteria:**
1. **Insufficient diagnostic evidence**: Not enough documented testing to support the conclusion
2. **Weak root cause documentation**: Root cause stated without sufficient diagnostic backing
3. **Missing specific data points**: Vague "found abnormal readings" instead of actual measured values
4. **Logical flow and clarity**: Does the narrative flow logically from concern → diagnosis → cause → recommendation?
5. **Justification strength**: Would an extended warranty company or manufacturer authorize this repair without requesting a third-party inspection?
6. **Harmful warranty language**: Same as repair — no damage/abuse/neglect implications
7. **Uncertainty language**: "might be", "could be" without diagnostic confirmation
8. **Missing recommendation clarity**: Is the recommended repair action clear and specific?
9. **Non-professional language**: Slang, informal tone
10. **Repair sellability**: Could a service advisor confidently present this diagnostic result to a customer and recommend the repair?

### Prompt Selection Logic (in `/api/proofread/route.ts`)

```typescript
if (storyType === 'diagnostic_only') {
  systemPrompt = DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT;
  // User prompt frames evaluation as "authorization-readiness"
} else {
  systemPrompt = PROOFREAD_SYSTEM_PROMPT;
  // User prompt frames evaluation as "audit compliance"
}
```

### Proofread User Prompt Templates

**Repair Complete:**
```
Review the following completed repair warranty narrative for audit compliance. Identify any issues that could cause the warranty claim to be rejected.

STORY TYPE: repair_complete

NARRATIVE:
CONCERN: {concern}
CAUSE: {cause}
CORRECTION: {correction}
```

**Diagnostic Only:**
```
Review the following diagnostic-only warranty narrative for authorization readiness. Evaluate whether this diagnostic story is strong enough to support pre-authorization from a manufacturer or extended warranty company.

STORY TYPE: diagnostic_only

NARRATIVE:
CONCERN: {concern}
CAUSE: {cause}
CORRECTION: {correction}
```

---

## 8. Proofread Snippet Extraction & Highlighting

### How Snippet Markers Work

Each flagged issue in the proofread response includes exact text from the narrative enclosed in `[[double brackets]]`:

```
"The narrative uses vague language [[FOUND ABNORMAL READINGS]] without providing specific measurement values."
```

### Extraction Logic (in `/api/proofread/route.ts`)

The API route extracts snippets from each flagged issue:

```typescript
const snippetMatch = issue.match(/\[\[(.+?)\]\]/);
const snippet = snippetMatch ? snippetMatch[1] : '';
```

Returns array of `{ issue: string, snippet: string }[]` to the frontend.

### UI Highlighting (in `NarrativeDisplay.tsx`)

1. `findHighlightRanges()` (`src/lib/highlightUtils.ts`) searches the displayed narrative text for each snippet string
2. Matched ranges are wrapped in `<mark>` elements with accent-colored background
3. Each `<mark>` has a hover tooltip showing the associated issue description
4. **30-second auto-fade**: After highlights are applied, a timeout triggers CSS `opacity: 0` transition
5. **Highlight counter badge**: Shows the number of active highlights in the proofread results area
6. **"Clear Highlights" button**: Allows immediate removal before the 30-second timer expires

### Styling

```css
mark {
  background-color: var(--accent-30);    /* 30% opacity accent */
  border-bottom: 2px solid var(--accent-primary);
  transition: opacity 1s ease-out;
}
/* Tooltip: bg-[#111827], dark shadow, positioned above highlighted text */
```

---

## 9. AI Output Customization Panel Logic (Post-Generation)

### Overview

The post-generation customization panel appears on the Narrative Page after a narrative has been generated. It allows the user to adjust the narrative's style WITHOUT re-generating from scratch.

**Key behavior:** Customization modifies the CURRENTLY DISPLAYED narrative. If the user has edited the narrative via the Edit Story modal, those edits are preserved and the customized version builds on top of them.

### Slider Definitions

Each slider has 3 positions. When at center ("No Change" / `standard`), no modifier is added. When at either extreme, the exact modifier text from `src/constants/prompts.ts` is appended to the customization block.

**Length Slider:**
| Position | Key | Modifier Text (from `LENGTH_MODIFIERS`) |
|----------|-----|----------|
| Short | `short` | "Generate a concise narrative. Keep the story brief and to the point — include only the essential information needed for the warranty claim. Aim for 3-5 sentences total." |
| No Change | `standard` | *(no modifier added)* |
| Extended | `detailed` | "Generate a detailed, thorough narrative. Include expanded descriptions of diagnostic steps, detailed technical reasoning for the root cause, and comprehensive repair/verification information." |

**Tone Slider:**
| Position | Key | Modifier Text (from `TONE_MODIFIERS`) |
|----------|-----|----------|
| Warranty | `warranty` | "Write in a strict warranty-formal tone. Use precise technical language, maintain a formal structure, and prioritize language specifically optimized for passing manufacturer warranty audits." |
| No Change | `standard` | *(no modifier added)* |
| Customer Friendly | `customer_friendly` | "Write in a tone that is professional but also easy for a non-technical person to understand. While maintaining accuracy, use language that a customer or service advisor could clearly understand." |

**Detail Level Slider:**
| Position | Key | Modifier Text (from `DETAIL_MODIFIERS`) |
|----------|-----|----------|
| Concise | `concise` | "Keep diagnostic and repair steps concise. Summarize the diagnostic process without listing every individual action. Focus on the key findings and actions." |
| No Change | `standard` | *(no modifier added)* |
| Additional Steps | `additional` | "Include additional professional diagnostic and repair steps that a qualified technician would typically perform, even if not explicitly listed in the input." |

**Custom Instructions:**
- Free-text field with maxLength={50} and character counter
- Appended as: `CUSTOM INSTRUCTIONS: {text}`
- Can be used alone (all sliders at center) or combined with slider modifiers

### Customization Block Assembly

The customization block sent to the API is built from all non-standard settings:

```
LENGTH: {modifier text if not standard}
TONE: {modifier text if not standard}
DETAIL LEVEL: {modifier text if not standard}
CUSTOM INSTRUCTIONS: {text if non-empty}
```

### Validation

If all sliders are at "No Change" AND custom instructions are empty → toast: "Adjust at least one slider or add custom instructions before applying."

---

## 10. Customization-Applied Regeneration Prompt

**File location:** `src/constants/prompts.ts` → `CUSTOMIZATION_SYSTEM_PROMPT`

**Route:** `/api/customize` (POST)

### System Prompt Summary

Instructs Gemini to:
- Rewrite the provided narrative according to style preferences
- Preserve ALL factual content — only adjust style, length, tone, and detail level
- Maintain FULL CAPITALIZATION
- Maintain audit-proof professional language
- Return the same 4-key JSON structure

### User Prompt Template

```
Rewrite the following warranty narrative according to the customization preferences listed below. Preserve all factual content — only adjust the style, length, tone, and detail level as specified.

STORY TYPE: {story_type}

CURRENT NARRATIVE:
---
CONCERN: {current_concern_text}
CAUSE: {current_cause_text}
CORRECTION: {current_correction_text}
---

CUSTOMIZATION PREFERENCES:
{customization_block}
```

**Critical note:** The "CURRENT NARRATIVE" contains whatever is currently displayed — including user edits from the Edit Story modal and effects from prior customizations. This is NOT the original generated text.

---

## 11. Apply Selected Edits Prompt

**File location:** `src/app/api/apply-edits/route.ts` (inline system prompt)

**Route:** `/api/apply-edits` (POST)

### Purpose

After proofreading, users can select specific suggested edits via checkboxes. Only the checked edits are sent to this route. The AI applies ONLY those edits — no additional changes.

### System Prompt Rules

- Apply every edit in the provided list — do not skip any
- Do NOT make additional changes beyond the provided edits
- Maintain FULL CAPITALIZATION
- Keep audit-proof language
- Preserve all factual content
- Return the same 4-key JSON structure

### User Prompt Template

```
Apply the following SELECTED EDITS to the warranty narrative below. Apply ONLY the listed edits — do not make any other changes.

STORY TYPE: {storyType}

CURRENT NARRATIVE:
CONCERN: {concern}
CAUSE: {cause}
CORRECTION: {correction}

SELECTED EDITS TO APPLY:
1. {edit1}
2. {edit2}
...
```

### Frontend Flow

1. `ProofreadResults.tsx` renders checkboxes next to each suggested edit
2. "Select All / Deselect All" toggle for convenience
3. User checks desired edits, clicks "APPLY SELECTED EDITS"
4. Only checked items are sent to the API as an ordered list
5. Response replaces the current narrative in the store

---

## 12. Pre-Generation Output Customization

**File locations:**
- Component: `src/components/input/PreGenCustomization.tsx`
- Assembly: `src/lib/compileDataBlock.ts`
- Constants: `src/constants/prompts.ts` → `LENGTH_MODIFIERS`, `TONE_MODIFIERS`, `DETAIL_MODIFIERS`

### How It Works

The pre-gen customization panel is a collapsible section on the Input Page between the last field and the GENERATE STORY button. It uses the **same modifier constants** as the post-generation customization panel.

When any slider is moved from center ("No Change"), an `--- OUTPUT STYLE PREFERENCES ---` section is appended to the compiled data block BEFORE it's sent to the generate API.

### Appended Section Format

```
--- OUTPUT STYLE PREFERENCES ---
LENGTH PREFERENCE: Generate a concise narrative. Keep the story brief...
TONE PREFERENCE: Write in a strict warranty-formal tone...
DETAIL LEVEL PREFERENCE: Include additional professional diagnostic and repair steps...
```

Only non-standard sliders are included. If all three are at "No Change", the section is not appended.

### Persistence

Pre-gen settings persist in localStorage under key `sd-pregen-customization` between sessions. This means if a technician prefers "Short" length for all their narratives, they set it once and it sticks.

### Interaction with Post-Gen Customization

Pre-gen and post-gen customization are independent:
1. **Pre-gen** modifies the INITIAL generation prompt → affects the first narrative output
2. **Post-gen** modifies the CURRENT narrative → builds on top of what was already generated
3. A user can use pre-gen to get a "Short, Warranty-formal" narrative, then use post-gen to further adjust detail level

---

## 13. Diagnostic → Repair Complete Update Prompt

**File location:** `src/app/api/update-narrative/route.ts` (inline system prompt)

**Route:** `/api/update-narrative` (POST)

### Purpose

Takes an existing diagnostic-only narrative and generates a NEW repair-complete narrative that preserves all original diagnostic detail while incorporating newly provided repair information.

### System Prompt Rules

1. PRESERVE all original diagnostic detail (concern, diagnostic steps, root cause)
2. INCORPORATE repair performed + verification steps
3. Transform correction from recommended (future tense) to completed (past tense)
4. Maintain same professional audit-proof tone
5. All text FULLY CAPITALIZED
6. Use manufacturer-specific terminology consistent with the original narrative
7. If additional notes provided, incorporate naturally into the narrative flow
8. Final narrative should read as a complete repair-complete story — not a patch job

### User Prompt Template

```
Original diagnostic narrative:
CONCERN: {originalConcern}
CAUSE: {originalCause}
CORRECTION: {originalCorrection}

Newly completed repair information:
{repair data block — built from UpdateWithRepairModal fields}
```

### Update Modal Field Logic

The `UpdateWithRepairModal` has dropdowns for its fields:

| Field | Dropdown Options | Behavior |
|-------|-----------------|----------|
| Repair Performed | Include / Don't Include / Generate | Same as input page logic |
| Repair Verification | Include / Don't Include / Generate | Same as input page logic |
| Additional Notes | (optional free text) | Appended if non-empty |

### "Completed Recommended Repair" Toggle

When this button is toggled ON, the Repair Performed field is replaced with a **static instruction**:

```
REPAIR PERFORMED: The technician has completed the repair that was recommended in the original diagnostic narrative. Convert the recommended/future-tense repair language from the original CORRECTION section into past-tense completed repair language.
```

This instruction is sent directly in the user prompt — the AI handles the tense conversion during the main generation. **No separate API call** is needed.

### Data Flow

1. User opens a saved diagnostic-only narrative from the Dashboard
2. `NarrativeDetailModal` shows "UPDATE NARRATIVE WITH REPAIR" button
3. Opens `UpdateWithRepairModal` with pre-filled vehicle info badges
4. User fills repair fields (or uses "Completed Recommended Repair" toggle)
5. Clicks "GENERATE NARRATIVE" → calls `/api/update-narrative`
6. Response passed to `narrativeStore.setForRepairUpdate()` — sets narrative, carries forward vehicle info + RO#, sets storyType to `'repair_complete'`
7. User navigated to `/narrative` page with the new repair-complete narrative
8. **Both** the original diagnostic entry AND the new repair-complete entry exist as separate database rows

---

## 14. Convert Recommendation Prompt (Legacy — Unused)

**File location:** `src/app/api/convert-recommendation/route.ts` (inline system prompt)

**Route:** `/api/convert-recommendation` (POST)

**Purpose:** Simple tense conversion — takes a diagnostic recommendation and rewords it as a completed repair.

**System Prompt:** "You are an automotive warranty narrative assistant. Your only task is to take a diagnostic recommendation statement and reword it as a completed repair statement. Change future/recommended tense to past/completed tense."

**Status:** This route exists in the codebase but is **no longer called by any frontend code**. The "Completed Recommended Repair" button in the Update Modal now uses the static instruction approach (Section 13) instead of a separate API call. Kept for potential future use.

---

## 15. Regenerate Behavior

**Route:** `/api/generate` (POST) — same route as initial generation

**Trigger:** "REGENERATE STORY" button on the Narrative Page

**Key behavior:** Regenerate re-sends the **exact same prompt** as the original generation:
- Uses the stored `compiledDataBlock` from `narrativeStore.ts`
- Uses the same `storyType` to select the same system prompt
- The AI naturally produces a variation in output because Gemini's generation is non-deterministic

**What changes:** The narrative content. The compiled data block, story type, vehicle info, and RO# all remain the same.

**What is NOT re-sent:** Any post-generation customization settings are cleared. The regeneration starts fresh from the original input data.

---

## 16. Format Toggle (No API Call)

The format toggle button on the Narrative Page switches between Block format and C/C/C format.

**This is a client-side only operation — NO API call is made.**

- Both `block_narrative` and `concern`/`cause`/`correction` are stored in the narrative state simultaneously
- Toggle simply changes `displayFormat` in `narrativeStore.ts` between `'block'` and `'ccc'`
- The `NarrativeDisplay` component reads `displayFormat` and renders accordingly
- The toggle button label changes dynamically: shows "BLOCK FORMAT" when currently in C/C/C mode, shows "C/C/C FORMAT" when currently in block mode

---

## 17. Narrative Save Logic

**Route:** `/api/narratives/save` (POST)

### Save Method: INSERT Only (Not Upsert)

Saves use **plain INSERT** — never upsert. This means diagnostic and repair-complete narratives sharing the same RO# coexist as separate database rows. The unique constraint on `(user_id, ro_number)` was intentionally dropped in migration 006.

### Duplicate Prevention

`saveToDatabase()` in the narrative page checks `state.savedNarrativeId`:
- If already set (from a prior manual save or auto-save): returns existing ID without inserting again
- If null: performs the INSERT and calls `markSaved(id)` to set `savedNarrativeId` and `isSaved: true`

### Auto-Save on Export

All export actions (Copy, Print, PDF, DOCX, Email) call `onBeforeExport()` before proceeding:
1. `onBeforeExport()` calls `saveToDatabase()`
2. If narrative not yet saved: saves and shows toast "Narrative auto-saved to your history" (deduped via `{ id: 'auto-save' }`)
3. If already saved: silently returns existing ID
4. Export proceeds after save completes

### What Gets Saved

```typescript
{
  user_id: user.id,
  ro_number: state.roNumber,
  vehicle_year: parseInt(state.fieldValues['year']),
  vehicle_make: state.fieldValues['make'],
  vehicle_model: state.fieldValues['model'],
  concern: state.narrative.concern,
  cause: state.narrative.cause,
  correction: state.narrative.correction,
  full_narrative: state.narrative.block_narrative,
  story_type: state.storyType
}
```

---

## 18. Export Document Generation

### Shared Export Utility (`src/lib/exportUtils.ts`)

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

### PDF Generation (`/api/export-pdf`)

- Uses `jspdf` package, US Letter format, coordinate-based positioning
- Custom underline helper (jsPDF has no native underline support)
- Automatic page breaks for long narratives
- Logo drawn in footer area after all body content, looped across all pages
- Font: Helvetica (built-in to jsPDF)

### DOCX Generation (`/api/export-docx`)

- Uses `docx` package with native underline/bold/italic support
- Invisible-border `Table` for two-column header layout
- Logo placed in `Footer` component (repeats on every page)
- `ImageRun` for logo with `type: 'png'`
- Font: Arial

### Document Layout (Identical for PDF, DOCX, Print, Email)

1. **Footer logo**: `ServiceDraft-Ai Vector Logo.png` — bottom-right, 2.09:1 aspect ratio
2. **Two-column header**: LEFT = Vehicle Info (YEAR/MAKE/MODEL); RIGHT = R.O. # (20pt bold)
3. **Title**: "REPAIR NARRATIVE" — 18pt bold underlined, centered
4. **C/C/C sections**: 13pt bold italic underlined headers, 11pt regular body
5. **Block format**: same header/title, then 11pt flowing paragraph

Both `ShareExportModal` (narrative page) and `NarrativeDetailModal` (dashboard) use the same `downloadExport()` function — documents are always generated identically regardless of where the export is triggered.

---

## 19. Email Export via Resend

**Route:** `/api/send-email` (POST)

### Capabilities
- Up to 10 recipients per send (validated server-side via `MAX_RECIPIENTS` constant)
- Professional HTML email template matching the PDF/DOCX layout
- Plain text fallback included for email clients that don't render HTML
- Sender name included in signature area
- Powered by Resend API (requires `RESEND_API_KEY` env var)

### Email Content Generation
- `buildEmailHtml()`: Generates HTML template with inline CSS styling
- `buildPlainTextEmail()`: Generates clean plain text version
- Both use the same `ExportPayload` structure as PDF/DOCX exports

### UI Component
`EmailExportModal.tsx` provides:
- Recipient email input field
- "Add Recipient" button (up to 10)
- Recipient list with remove buttons
- Send button with loading state

---

## 20. Token Usage Instrumentation

### Overview

All 6 AI-calling API routes are instrumented to log token usage to the `api_usage_log` table after every successful Gemini call.

### How It Works

1. `generateWithGemini()` returns both the response text AND token usage metadata from Gemini's response object: `promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`
2. Each API route captures this metadata after a successful call
3. `logApiUsage()` from `src/lib/usageLogger.ts` calculates `estimated_cost_usd` and inserts a row

### Cost Calculation

```typescript
const INPUT_COST_PER_TOKEN = 0.0000005;   // $0.50 per 1M tokens
const OUTPUT_COST_PER_TOKEN = 0.000003;    // $3.00 per 1M tokens

const cost = (promptTokens * INPUT_COST_PER_TOKEN) + (completionTokens * OUTPUT_COST_PER_TOKEN);
```

### Instrumented Routes

| Route | action_type logged |
|-------|-------------------|
| `/api/generate` | `'generate'` |
| `/api/customize` | `'customize'` |
| `/api/proofread` | `'proofread'` |
| `/api/apply-edits` | `'apply-edits'` |
| `/api/update-narrative` | `'update-narrative'` |
| `/api/convert-recommendation` | `'convert-recommendation'` |

### Usage Data Access

Owner Dashboard → API Usage tab → reads from `/api/admin/usage` with aggregated stats.

---

## 21. Rate Limiting & Input Validation

### Rate Limiting (`src/lib/rateLimit.ts`)

- In-memory store (resets on Vercel cold start / server restart)
- `/api/generate` route: **20 requests per user per 15 minutes**
- Keyed by Supabase user ID
- Returns 429 status with "Rate limit exceeded" message when triggered

### Input Validation

**Generate route** (`/api/generate`):
- Auth required (Supabase session via server client)
- **Restriction check**: queries `users.is_restricted` — if `true`, returns 403 "Your account is restricted"
- **Input length limit**: compiled data block capped at 10,000 characters
- Validates `storyType` is either `'diagnostic_only'` or `'repair_complete'`
- Validates `compiledDataBlock` is a non-empty string

**All other AI routes**: Auth required, basic input validation (non-empty narrative text, valid story type).

---

## 22. Activity Logging on API Calls

### Client-Side Activity Logger (`src/lib/activityLogger.ts`)

Activity logging is **fire-and-forget** — it uses the browser Supabase client and NEVER blocks user workflows. All errors are caught silently.

```typescript
import { logActivity } from '@/lib/activityLogger';
// Fire-and-forget — never awaited, never blocks UI
logActivity('generate', { storyType, vehicleInfo: `${year} ${make} ${model}` });
```

### Logged Action Types

| Action Type | Trigger | Metadata Included |
|-------------|---------|-------------------|
| `generate` | GENERATE STORY / REGENERATE button | storyType, vehicleInfo, narrative preview (500 chars), RO# |
| `regenerate` | REGENERATE STORY button | storyType, vehicleInfo |
| `customize` | APPLY CUSTOMIZATION button | storyType, narrative preview (500 chars), vehicleInfo, RO# |
| `proofread` | REVIEW & PROOFREAD button | storyType |
| `save` | SAVE STORY button / auto-save | storyType, narrative preview (500 chars), vehicleInfo, RO# |
| `export_copy` | Copy to Clipboard | — |
| `export_print` | Print | — |
| `export_pdf` | Download PDF | — |
| `export_docx` | Download DOCX | — |
| `login` | Successful sign-in | — |

### Enhanced Metadata (Stage 6 Sprint B)

Generate, regenerate, customize, and save actions include enriched metadata:
- `narrative_preview`: First 500 characters of the block narrative
- `vehicle_year`, `vehicle_make`, `vehicle_model`: Vehicle identification
- `ro_number`: Repair order number
- `story_type`: Diagnostic or repair

This enriched metadata is displayed in the `ActivityDetailModal` component when clicking an activity log row.

---

## 23. Complete API Call Reference

### Summary Table

| API Call | Route | Trigger | System Prompt Source | Input Data | Returns |
|----------|-------|---------|---------------------|------------|---------|
| **Generate (Diagnostic)** | `/api/generate` | GENERATE STORY button | `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` | Compiled data block (+ pre-gen mods) | 4-key narrative JSON |
| **Generate (Repair)** | `/api/generate` | GENERATE STORY button | `REPAIR_COMPLETE_SYSTEM_PROMPT` | Compiled data block (+ pre-gen mods) | 4-key narrative JSON |
| **Regenerate** | `/api/generate` | REGENERATE STORY button | Same as original story type | Original stored compiled data block | 4-key narrative JSON |
| **Customize** | `/api/customize` | APPLY CUSTOMIZATION button | `CUSTOMIZATION_SYSTEM_PROMPT` | Current narrative + modifier block | 4-key narrative JSON |
| **Proofread (Repair)** | `/api/proofread` | REVIEW & PROOFREAD button | `PROOFREAD_SYSTEM_PROMPT` | Current narrative + story type | Proofread JSON (issues, edits, rating) |
| **Proofread (Diagnostic)** | `/api/proofread` | REVIEW & PROOFREAD button | `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` | Current narrative + story type | Proofread JSON (issues, edits, rating) |
| **Apply Edits** | `/api/apply-edits` | APPLY SELECTED EDITS button | Inline in route.ts | Current narrative + selected edits array | 4-key narrative JSON |
| **Update Narrative** | `/api/update-narrative` | GENERATE NARRATIVE (update modal) | Inline in route.ts | Original diag narrative + repair data | 4-key narrative JSON |
| **Convert Recommendation** | `/api/convert-recommendation` | *(unused — route exists)* | Inline in route.ts | Diagnostic correction text | Converted text |

### Important Operational Notes

1. **Regenerate** re-sends the exact same prompt as the original generation (stored compiled data block + story type). The AI naturally produces a variation.

2. **Customize** reads the CURRENT displayed narrative (including user edits and prior customizations), NOT the original input data.

3. **The compiled data block is stored in `narrativeStore.ts`** after initial generation for Regenerate calls.

4. **The story type is also stored** so the correct system prompt is used for Regenerate and Proofread.

5. **R.O. # is NEVER sent to the API** — stored in state solely for database saves and export documents.

6. **Year, Make, and Model ARE sent to the API** so the AI can infer manufacturer-specific OEM terminology.

7. **The AI's generated output CAN and SHOULD contain manufacturer-specific terminology.** The restriction on brand-neutral language applies only to the application's source code, UI text, and hardcoded prompt strings — NOT to AI-generated narratives.

8. **Technical detail preservation** (rules 9/10 in generation prompts): ALL specific values — terminal numbers, voltages, connector IDs, circuit numbers, pin numbers, wire colors, measurement values — must appear verbatim in the output. The AI should produce MORE detail, never less.

9. **Diagnostic and Repair Complete narratives with the same RO# save as separate database rows** (INSERT, not upsert). The unique constraint was dropped in migration 006.

10. **All 6 AI routes are token-usage-instrumented** — every Gemini call logs prompt/completion/total tokens + estimated cost to `api_usage_log`.

---

## 24. Prompt Content Rules — Master Reference

These rules apply across ALL generation and modification prompts. When writing or modifying any prompt text, ensure these are maintained:

### Universal Rules (All Prompts)
- All output text FULLY CAPITALIZED
- Professional warranty-appropriate language
- Natural flowing paragraph style — never bullet points or numbered lists
- NEVER use "damaged", "impact", "collision", or language implying external force, customer misuse, abuse, or neglect
- NEVER fabricate document ID numbers, reference numbers, case numbers, authorization numbers, TSB numbers, or any official identifiers
- Preserve all technical data points verbatim (voltages, connector IDs, pin numbers, etc.)
- OEM terminology is EXPECTED and should match the manufacturer identified by the MAKE field

### Diagnostic-Specific Rules
- Correction section uses FUTURE/RECOMMENDED tense ("RECOMMEND REPLACING...")
- Do NOT imply the repair has been performed
- Strength of diagnostic evidence matters for authorization-readiness

### Repair-Specific Rules
- Correction section uses PAST/COMPLETED tense ("REPLACED THE...")
- Include verification steps if provided
- Narrative should read as a complete documentation of a finished repair

### Customization-Specific Rules
- Preserve ALL factual content — only adjust style
- Maintain the same story type's tense convention
- Do not add or remove technical details

### Apply Edits-Specific Rules
- Apply ONLY the provided edits — no additional changes
- Each edit should be applied exactly as described
- Factual content preserved

---

## 25. Data Flow Diagrams

### Generate Narrative Flow

```
Input Page                    API Route               Gemini API              Store + UI
─────────────                 ─────────               ──────────              ──────────
Fill fields ─────────►
Select story type ───►
Set pre-gen prefs ───►
Click GENERATE ──────► /api/generate
                       │ Auth check
                       │ Restriction check
                       │ Rate limit check
                       │ Validate input
                       │ Select system prompt ──► gemini-3-flash-preview
                       │                          │
                       │                          ◄── JSON response + tokens
                       │ Parse JSON
                       │ Log token usage ──────► api_usage_log table
                       │ Return 4-key JSON
                       ◄──────────────────────────
                                                                              ┌ narrativeStore.setNarrative()
logActivity('generate') ──────────────────────────────────────────────────────┤ Navigate to /narrative
                                                                              └ Typing animation starts
```

### Proofread → Apply Edits Flow

```
Narrative Page                API Routes              Gemini API
──────────────                ──────────              ──────────
Click PROOFREAD ─────► /api/proofread
                       │ Select prompt by storyType
                       │ Send current narrative ──► gemini-3-flash-preview
                       │                            │
                       │                            ◄── Proofread JSON
                       │ Extract [[snippets]]
                       │ Return issues + edits
                       ◄──────────────────────
                       │
Display results ◄──────┘
Highlight snippets
User checks edits
                       │
Click APPLY ──────────► /api/apply-edits
                       │ Send narrative + checked edits ──► gemini-3-flash-preview
                       │                                     │
                       │                                     ◄── 4-key JSON
                       │ Return modified narrative
                       ◄──────────────────────────
Update display ◄───────┘
Clear highlights
```

### Customize Flow

```
Narrative Page                API Route               Gemini API
──────────────                ─────────               ──────────
Adjust sliders
Add custom text
Click APPLY ──────────► /api/customize
                       │ Build modifier block
                       │ Send CURRENT narrative
                       │   + modifiers ───────────► gemini-3-flash-preview
                       │                             │
                       │                             ◄── 4-key JSON
                       │ Return modified narrative
                       ◄─────────────────────────
Update display ◄───────┘
```

### Diagnostic → Repair Update Flow

```
Dashboard                     Narrative Page          API Route               Gemini
─────────                     ──────────────          ─────────               ──────
Open saved diagnostic
Click UPDATE WITH REPAIR
Fill repair fields
(or toggle "Completed
 Recommended Repair")
Click GENERATE ──────────────────────────────► /api/update-narrative
                                               │ Send original narrative
                                               │   + repair data ────────► gemini-3-flash-preview
                                               │                           │
                                               │                           ◄── 4-key JSON
                                               │ Return new narrative
                                               ◄──────────────────────────
                              ◄────────────────┘
                              setForRepairUpdate()
                              Navigate to /narrative
                              New repair-complete
                              narrative displayed
                              (Original diagnostic
                               row preserved in DB)
```

---

*— End of Prompt & API Logic Document v2.1 —*
