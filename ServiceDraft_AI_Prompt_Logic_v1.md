# SERVICEDRAFT.AI — PROMPT & API LOGIC DOCUMENT v2.0

## Table of Contents
1. [Prompt Assembly Pipeline Overview](#1-prompt-assembly-pipeline-overview)
2. [Input Field Dropdown Logic](#2-input-field-dropdown-logic)
3. [Main Generate Narrative Prompt — Diagnostic Only](#3-main-generate-narrative-prompt--diagnostic-only)
4. [Main Generate Narrative Prompt — Repair Complete](#4-main-generate-narrative-prompt--repair-complete)
5. [JSON Response Structure & Parsing](#5-json-response-structure--parsing)
6. [Story Audit / Proofreading Prompts](#6-story-audit--proofreading-prompts)
7. [AI Output Customization Panel Logic](#7-ai-output-customization-panel-logic)
8. [Customization-Applied Regeneration Prompt](#8-customization-applied-regeneration-prompt)
9. [Apply Selected Edits Prompt](#9-apply-selected-edits-prompt)
10. [Diagnostic → Repair Complete Update Prompt](#10-diagnostic--repair-complete-update-prompt)
11. [Convert Recommendation Prompt (Tense Conversion)](#11-convert-recommendation-prompt-tense-conversion)
12. [Pre-Generation Output Customization](#12-pre-generation-output-customization)
13. [Complete API Call Reference](#13-complete-api-call-reference)

---

## 1. Prompt Assembly Pipeline Overview

Every API call in ServiceDraft.AI follows a **prompt assembly pipeline** — the final prompt sent to the AI is dynamically constructed based on user selections, field inputs, and customization settings.

### How It Works

```
USER INPUT FIELDS ──► DROPDOWN LOGIC FILTERS ──► PROMPT TEMPLATE ──► GEMINI API
                                                        │
                                                   Customization
                                                   Modifiers (if any)
```

**Step 1:** User fills in fields on the Input Page.
**Step 2:** The app checks each field's dropdown selection and builds a "compiled data block." (R.O. # is excluded.)
**Step 3:** If pre-generation customization is set, output style preferences are appended to the data block.
**Step 4:** The compiled data block is injected into the appropriate prompt template (Diagnostic Only or Repair Complete).
**Step 5:** The complete prompt is sent to the Gemini API (model: `gemini-3-flash-preview`).
**Step 6:** The JSON response is parsed and routed to the correct display areas.
**Step 7:** If the user applies post-generation customization, the CURRENTLY DISPLAYED narrative is sent back to the AI with modifier instructions.

### AI Model Configuration
- **Model:** `gemini-3-flash-preview`
- **Max Output Tokens:** 8192 (applied to all Gemini calls)
- **Client:** `src/lib/gemini/client.ts` — centralized `generateWithGemini(systemPrompt, userPrompt, maxTokens)` function
- **JSON Parsing:** `parseJsonResponse<T>(raw)` strips markdown code fences before parsing

---

## 2. Input Field Dropdown Logic

### Overview

Fields 1–5 are **always required** and have no dropdown. Fields 6+ each have a dropdown with three options that control how that field's data is handled in the final prompt.

### Dropdown Options & Behavior

**Option 1: "Include Information"**
- Field becomes REQUIRED — user must type text before GENERATE STORY enables
- Prompt behavior: Field label + user's entered text included in compiled data block exactly as written

**Option 2: "Don't Include Information"**
- Field is NOT required — can be left empty
- Prompt behavior: Field is **completely excluded** from the compiled data block

**Option 3: "Generate Applicable Info"**
- Field is NOT required — user does NOT need to type anything
- Prompt behavior: Special AI inference instruction injected for that field

**Injected instruction per field:**
```
[FIELD NAME]: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable [FIELD NAME] using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.
```

### Compiled Data Block Assembly

The app loops through fields and builds the compiled data block using this logic:

```
SKIP Field 1 (R.O. #) — stored in app state for database save only

FOR EACH REMAINING FIELD:
  ├── If field is REQUIRED (fields 2–5):
  │     └── ADD: "FIELD_LABEL: user_entered_text"
  │
  ├── If dropdown = "Include Information":
  │     └── ADD: "FIELD_LABEL: user_entered_text"
  │
  ├── If dropdown = "Don't Include Information":
  │     └── SKIP — do not add anything
  │
  └── If dropdown = "Generate Applicable Info":
        └── ADD: "FIELD_LABEL: [AI inference instruction]"

IF pre-gen customization has non-standard settings:
  └── APPEND: "--- OUTPUT STYLE PREFERENCES ---" block with modifier text
```

### GENERATE STORY Button Enable/Disable Logic

The button is **DISABLED** until ALL of the following are true:
1. Fields 1–5 all have text entered (not empty, not just whitespace)
2. Every field 6+ with "Include Information" selected has text entered
3. Fields with "Don't Include" or "Generate Applicable Info" do NOT require text

---

## 3. Main Generate Narrative Prompt — Diagnostic Only

**File location:** `src/constants/prompts.ts` → `DIAGNOSTIC_ONLY_SYSTEM_PROMPT`

### Critical Rules (in the system prompt)
1. Professional warranty-appropriate tone
2. All text FULLY CAPITALIZED
3. Include most probable technical reason for any failure not explicitly stated
4. NEVER use "damaged" or imply external force/customer misuse/abuse/neglect
5. **OEM Terminology (Enhanced)**: Identify manufacturer based on MAKE, use manufacturer-specific OEM service practices, proprietary system names, diagnostic tools, fluids, and procedures. The narrative should read as if written by a manufacturer-certified technician.
6. Natural flowing story, not bullet points
7. Preserve all detailed diagnostic info provided; add reasonable language only when input is sparse
8. NEVER fabricate document ID numbers, reference numbers, case numbers, authorization numbers
9. **Technical Detail Preservation**: Include ALL specific technical data points verbatim — terminal numbers, connector IDs, circuit numbers, pin numbers, wire colors, voltage/resistance/amperage/pressure/temperature readings, specification values, measurement tool readings. NEVER summarize or omit these details.

### JSON Response Format
```json
{
  "block_narrative": "COMPLETE FLOWING PARAGRAPH",
  "concern": "CUSTOMER CONCERN SECTION",
  "cause": "CAUSE/DIAGNOSIS SECTION",
  "correction": "RECOMMENDED ACTION (future tense — 'RECOMMEND REPLACING...')"
}
```

---

## 4. Main Generate Narrative Prompt — Repair Complete

**File location:** `src/constants/prompts.ts` → `REPAIR_COMPLETE_SYSTEM_PROMPT`

Same rules as Diagnostic Only with these differences:
- Rule 8: If repair verification steps were provided, incorporate them naturally into the correction section
- Correction section uses **past tense** ("REPLACED THE..." not "RECOMMEND REPLACING...")
- Rules renumbered: no-fabricated-IDs is rule 9, technical detail preservation is rule 10

---

## 5. JSON Response Structure & Parsing

### Standard 4-Key Response (Used by: Generate, Regenerate, Customize, Apply Edits, Update Narrative)
```json
{
  "block_narrative": "string",
  "concern": "string",
  "cause": "string",
  "correction": "string"
}
```

### Proofread Response
```json
{
  "flagged_issues": ["string with [[snippet]] markers"],
  "suggested_edits": ["string"],
  "overall_rating": "PASS | NEEDS_REVIEW | FAIL",
  "summary": "string"
}
```

### Parsing
All Gemini responses are processed by `parseJsonResponse<T>()` in `src/lib/gemini/client.ts`, which strips markdown code fences (`\`\`\`json ... \`\`\``) before JSON.parse().

---

## 6. Story Audit / Proofreading Prompts

The proofread system uses **two different prompts** selected based on story type.

### 6A. Repair Complete Proofread (Warranty Audit)

**File location:** `src/constants/prompts.ts` → `PROOFREAD_SYSTEM_PROMPT`

**9 Audit Criteria:**
1. Language implying external damage, customer misuse, abuse, neglect
2. Missing verification steps (repair performed without documented verification)
3. Vague or ambiguous language
4. Missing root cause (part replaced without WHY it failed)
5. Inconsistent information between concern, cause, correction
6. Non-professional language, slang, informal tone
7. Uncertainty language ("might be", "could be", "possibly")
8. Missing diagnostic steps (part replaced without documenting how conclusion was reached)
9. Overly brief narratives

**OEM Terminology Allowance:** Manufacturer-specific terminology is EXPECTED and should NOT be flagged.

**Snippet Extraction:** Each flagged issue must include exact text from the narrative enclosed in `[[double brackets]]` for UI highlighting.

### 6B. Diagnostic Only Proofread (Authorization-Readiness Optimizer)

**File location:** `src/constants/prompts.ts` → `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT`

This is a completely different evaluation system. It does NOT flag for missing completed repairs or verification steps.

**10 Optimization Criteria:**
1. Insufficient diagnostic evidence
2. Weak root cause documentation
3. Missing specific data points (no vague "found abnormal readings")
4. Logical flow and clarity
5. Justification strength (would an extended warranty company authorize without third-party inspection?)
6. Harmful warranty language
7. Uncertainty language
8. Missing recommendation clarity
9. Non-professional language
10. Repair sellability (could a service advisor confidently present this to a customer?)

### Prompt Selection Logic (in `/api/proofread/route.ts`)
```
if (storyType === 'diagnostic_only')
  → use DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT
  → user prompt evaluates "authorization-readiness"
else
  → use PROOFREAD_SYSTEM_PROMPT
  → user prompt evaluates "audit compliance"
```

---

## 7. AI Output Customization Panel Logic

### Slider Definitions

Each slider has 3 positions. When at center ("No Change"), no modifier is added. When at either extreme, the modifier text is appended to the customization block.

**Length Slider:**
| Position | Key | Modifier |
|----------|-----|----------|
| Short | `short` | "Generate a concise narrative. Keep the story brief and to the point — include only the essential information needed for the warranty claim. Aim for 3-5 sentences total." |
| No Change | `standard` | *(no modifier added)* |
| Extended | `detailed` | "Generate a detailed, thorough narrative. Include expanded descriptions of diagnostic steps, detailed technical reasoning for the root cause, and comprehensive repair/verification information." |

**Tone Slider:**
| Position | Key | Modifier |
|----------|-----|----------|
| Warranty | `warranty` | "Write in a strict warranty-formal tone. Use precise technical language, maintain a formal structure, and prioritize language specifically optimized for passing manufacturer warranty audits." |
| No Change | `standard` | *(no modifier added)* |
| Customer Friendly | `customer_friendly` | "Write in a tone that is professional but also easy for a non-technical person to understand. While maintaining accuracy, use language that a customer or service advisor could clearly understand." |

**Detail Level Slider:**
| Position | Key | Modifier |
|----------|-----|----------|
| Concise | `concise` | "Keep diagnostic and repair steps concise. Summarize the diagnostic process without listing every individual action. Focus on the key findings and actions." |
| No Change | `standard` | *(no modifier added)* |
| Additional Steps | `additional` | "Include additional professional diagnostic and repair steps that a qualified technician would typically perform, even if not explicitly listed in the input." |

**Custom Instructions:** Free-text field (max 50 characters) appended as "CUSTOM INSTRUCTIONS: {text}"

### Validation
If all sliders are at "No Change" AND custom instructions are empty → toast: "Adjust at least one slider or add custom instructions before applying."

---

## 8. Customization-Applied Regeneration Prompt

**File location:** `src/constants/prompts.ts` → `CUSTOMIZATION_SYSTEM_PROMPT`

**Key behavior:** Customization modifies the CURRENTLY DISPLAYED narrative — it does NOT re-generate from original input. This means user edits and prior customizations are preserved and adjusted.

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

---

## 9. Apply Selected Edits Prompt

**File location:** `src/app/api/apply-edits/route.ts` (inline system prompt)

**Purpose:** Apply ONLY the user-selected subset of proofread suggestions to the narrative.

**Key rules:**
- Apply every edit in the provided list — do not skip any
- Do NOT make additional changes beyond the provided edits
- Maintain FULL CAPITALIZATION
- Keep audit-proof language
- Preserve factual content

**User Prompt Template:**
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

---

## 10. Diagnostic → Repair Complete Update Prompt

**File location:** `src/app/api/update-narrative/route.ts` (inline system prompt)

**Purpose:** Take an existing diagnostic-only narrative and generate a new repair-complete narrative that preserves all original diagnostic detail while incorporating newly provided repair information.

**Key rules:**
1. PRESERVE all original diagnostic detail (concern, diagnostic steps, root cause)
2. INCORPORATE repair performed + verification steps
3. Transform correction from recommended (future tense) to completed (past tense)
4. Maintain same professional audit-proof tone
5. All text FULLY CAPITALIZED
6. Use manufacturer-specific terminology consistent with the original
7. If additional notes provided, incorporate naturally
8. Final narrative should read as complete repair-complete story — not a patch

**User Prompt Template:**
```
Original diagnostic narrative:
CONCERN: {originalConcern}
CAUSE: {originalCause}
CORRECTION: {originalCorrection}

Newly completed repair information:
{repair data — either typed text or AI inference instruction based on dropdown selections}
```

### Dropdown Logic for Update Fields
The UpdateWithRepairModal has dropdowns for Repair Performed and Repair Verification:
- "Include" → use provided text
- "Don't Include" → skip field
- "Generate" → inject AI inference instruction

### "Completed Recommended Repair" Button
When toggled ON, the Repair Performed field is replaced with a static instruction:
```
REPAIR PERFORMED: The technician has completed the repair that was recommended in the original diagnostic narrative. Convert the recommended/future-tense repair language from the original CORRECTION section into past-tense completed repair language.
```
This instruction is sent to the update-narrative API — the AI handles the tense conversion during main generation (no separate API call).

---

## 11. Convert Recommendation Prompt (Tense Conversion)

**File location:** `src/app/api/convert-recommendation/route.ts` (inline system prompt)

**Purpose:** Simple tense conversion — takes a diagnostic recommendation and rewords it as a completed repair.

**System Prompt:** "You are an automotive warranty narrative assistant. Your only task is to take a diagnostic recommendation statement and reword it as a completed repair statement. Change future/recommended tense to past/completed tense."

**Note:** This route exists in the codebase but is **no longer called by any frontend code** as of Post-Sprint 9 (the "Completed Recommended Repair" button now uses the static instruction approach instead). Kept for potential future use.

---

## 12. Pre-Generation Output Customization

**File location:** `src/lib/compileDataBlock.ts` + `src/components/input/PreGenCustomization.tsx`

When the user sets non-standard preferences on the Input Page's pre-gen customization panel, the compiled data block gets an appended section:

```
--- OUTPUT STYLE PREFERENCES ---
LENGTH PREFERENCE: {modifier text from LENGTH_MODIFIERS}
TONE PREFERENCE: {modifier text from TONE_MODIFIERS}
DETAIL LEVEL PREFERENCE: {modifier text from DETAIL_MODIFIERS}
```

This uses the same modifier constants from `src/constants/prompts.ts` as the post-generation customization panel.

---

## 13. Complete API Call Reference

### Summary Table

| API Call | Route | Trigger | System Prompt Source | Input Data |
|----------|-------|---------|---------------------|------------|
| **Generate (Diagnostic)** | `/api/generate` | GENERATE STORY button | `prompts.ts` → DIAGNOSTIC_ONLY_SYSTEM_PROMPT | Compiled data block |
| **Generate (Repair)** | `/api/generate` | GENERATE STORY button | `prompts.ts` → REPAIR_COMPLETE_SYSTEM_PROMPT | Compiled data block |
| **Regenerate** | `/api/generate` | REGENERATE STORY button | Same as original | Original compiled data block |
| **Customize** | `/api/customize` | APPLY CUSTOMIZATION button | `prompts.ts` → CUSTOMIZATION_SYSTEM_PROMPT | Current narrative + modifiers |
| **Proofread (Repair)** | `/api/proofread` | REVIEW & PROOFREAD button | `prompts.ts` → PROOFREAD_SYSTEM_PROMPT | Current narrative |
| **Proofread (Diagnostic)** | `/api/proofread` | REVIEW & PROOFREAD button | `prompts.ts` → DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT | Current narrative |
| **Apply Edits** | `/api/apply-edits` | APPLY SELECTED EDITS button | Inline in route.ts | Current narrative + selected edits |
| **Update Narrative** | `/api/update-narrative` | GENERATE NARRATIVE (update modal) | Inline in route.ts | Original diagnostic narrative + repair data |
| **Convert Recommendation** | `/api/convert-recommendation` | *(unused — route exists but not called)* | Inline in route.ts | Diagnostic correction text |

### Important Notes

1. **Regenerate** re-sends the exact same prompt as the original generation (using the stored compiled data block). The AI naturally produces a variation.

2. **Customize** reads the CURRENT displayed narrative (including user edits and prior customizations), not the original input data.

3. **The compiled data block must be stored in application state** after initial generation for Regenerate calls (stored in `narrativeStore.ts`).

4. **The story type must also be stored** so the correct system prompt is used for Regenerate and Proofread.

5. **R.O. # is NEVER sent to the API** — stored in state solely for database saves.

6. **Year, Make, and Model ARE sent to the API** so the AI can infer manufacturer-specific terminology.

7. **The AI's generated output CAN and SHOULD contain manufacturer-specific terminology.** The restriction on brand-neutral language applies only to the application's source code, UI text, and hardcoded prompt strings.

8. **Technical detail preservation** (rule 9/10 in generation prompts): All specific values — terminal numbers, voltages, connector IDs, etc. — must appear verbatim in the output. The AI should produce MORE detail, never less.

9. **Diagnostic and Repair Complete narratives with the same RO# save as separate database rows** (INSERT, not upsert). The unique constraint was dropped in migration 006.

---

*— End of Prompt & API Logic Document v2.0 —*
