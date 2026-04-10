# SERVICEDRAFT.AI — PROMPT & API LOGIC DOCUMENT

**Canonical reference for every AI prompt, input transformation, JSON schema, and API call in the ServiceDraft.AI application.**

This document is the authoritative source of truth for how user input becomes a warranty narrative, how that narrative gets audited, customized, edited, and updated through the AI pipeline. If the prompts in this document contradict the prompts in `src/constants/prompts.ts`, the source code wins — but this doc should be updated immediately when that happens.

---

## Table of Contents

1. [Prompt Assembly Pipeline Overview](#1-prompt-assembly-pipeline-overview)
2. [Input Field Configuration & Dropdown Logic](#2-input-field-configuration--dropdown-logic)
3. [Compiled Data Block Assembly](#3-compiled-data-block-assembly)
4. [Gemini Client Wrapper](#4-gemini-client-wrapper)
5. [Main Generate Narrative Prompt — Diagnostic Only](#5-main-generate-narrative-prompt--diagnostic-only)
6. [Main Generate Narrative Prompt — Repair Complete](#6-main-generate-narrative-prompt--repair-complete)
7. [JSON Response Structures & Parsing](#7-json-response-structures--parsing)
8. [Story Audit / Proofreading Prompts](#8-story-audit--proofreading-prompts)
9. [Proofread Snippet Extraction & Highlighting](#9-proofread-snippet-extraction--highlighting)
10. [Customization Panel Logic (Post-Generation)](#10-customization-panel-logic-post-generation)
11. [Customization-Applied Regeneration Prompt](#11-customization-applied-regeneration-prompt)
12. [Apply Selected Edits Prompt](#12-apply-selected-edits-prompt)
13. [Pre-Generation Output Customization](#13-pre-generation-output-customization)
14. [Diagnostic → Repair Complete Update Prompt](#14-diagnostic--repair-complete-update-prompt)
15. [Convert Recommendation Prompt (Legacy — Unused)](#15-convert-recommendation-prompt-legacy--unused)
16. [Regenerate Behavior](#16-regenerate-behavior)
17. [Format Toggle (No API Call)](#17-format-toggle-no-api-call)
18. [Narrative Save Logic](#18-narrative-save-logic)
19. [Export Document Generation](#19-export-document-generation)
20. [Email Export via Resend](#20-email-export-via-resend)
21. [Token Usage Instrumentation](#21-token-usage-instrumentation)
22. [Rate Limiting & Input Validation](#22-rate-limiting--input-validation)
23. [Activity Logging on API Calls](#23-activity-logging-on-api-calls)
24. [Complete API Call Reference](#24-complete-api-call-reference)

---

## 1. Prompt Assembly Pipeline Overview

Every AI-generated narrative in ServiceDraft.AI flows through this six-stage pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1 — User Input Collection (Input Page)                    │
│    • Story type selection (Diagnostic Only / Repair Complete)    │
│    • Required fields (RO#, Year, Make, Model, Customer Concern)  │
│    • Conditional fields with Include/Don't Include/Generate      │
│    • Optional pre-gen customization (Length/Tone/Detail sliders) │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 2 — Compiled Data Block Assembly                          │
│    • src/lib/compileDataBlock.ts                                 │
│    • Transforms field values + dropdown states into a single    │
│      UPPERCASE labeled string                                    │
│    • RO# is NEVER sent to the API                                │
│    • Pre-gen customization modifiers appended as trailing block  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 3 — System Prompt Selection                               │
│    • Diagnostic Only  → DIAGNOSTIC_ONLY_SYSTEM_PROMPT            │
│    • Repair Complete  → REPAIR_COMPLETE_SYSTEM_PROMPT            │
│    • Defined in src/constants/prompts.ts                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 4 — Gemini API Call                                       │
│    • src/lib/gemini/client.ts → generateWithGemini()             │
│    • Model: gemini-3-flash-preview                               │
│    • maxOutputTokens: 8192                                       │
│    • Returns text + usageMetadata (prompt/completion/total)      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 5 — JSON Response Parsing                                 │
│    • parseJsonResponse<T>() strips markdown fences               │
│    • Validates 4 required keys: block_narrative, concern,       │
│      cause, correction                                           │
│    • Throws on missing keys → route returns 500 to client       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 6 — Token Usage Logging (Fire-and-Forget)                 │
│    • logTokenUsage(userId, actionType, usage)                    │
│    • Writes to api_usage_log table                               │
│    • Never blocks the response — wrapped in try/catch            │
└─────────────────────────────────────────────────────────────────┘
```

**Post-generation flow:**

Once the narrative is displayed on the Narrative Page, five additional AI-calling flows become available:

1. **Customize** — reshape tone, length, and detail via sliders
2. **Proofread** — audit for warranty compliance or diagnostic strength
3. **Apply Edits** — merge selected proofread suggestions
4. **Update with Repair** — convert a saved diagnostic to a repair-complete
5. **Regenerate** — rerun the original generate call with same inputs

Each flow follows the same 6-stage pattern with its own system prompt.

---

## 2. Input Field Configuration & Dropdown Logic

Defined in `src/constants/fieldConfig.ts`.

### Field types

```typescript
export type StoryType = 'diagnostic_only' | 'repair_complete';
export type DropdownOption = 'include' | 'dont_include' | 'generate';

export interface FieldConfig {
  id: string;
  label: string;
  fieldNumber: number;
  required: boolean;       // true = always required, no dropdown
  hasDropdown: boolean;    // true = conditional field with dropdown
  placeholder: string;
}
```

### Diagnostic Only fields (9 fields)

| # | ID | Label | Required | Dropdown | Placeholder |
|---|---|---|---|---|---|
| 1 | `ro_number` | R.O. # | ✅ | ❌ | e.g., 123456 |
| 2 | `year` | Year | ✅ | ❌ | e.g., 2022 |
| 3 | `make` | Make | ✅ | ❌ | e.g., Chevrolet |
| 4 | `model` | Model | ✅ | ❌ | e.g., Silverado 1500 |
| 5 | `customer_concern` | Customer Concern | ✅ | ❌ | What did the customer report? |
| 6 | `codes_present` | Codes Present | ❌ | ✅ | e.g., P0300, P0301 — random/multiple misfires |
| 7 | `diagnostics_performed` | Diagnostics Performed | ❌ | ✅ | e.g., Scanned for codes, performed cylinder balance test |
| 8 | `root_cause` | Root Cause/Failure | ❌ | ✅ | e.g., Worn spark plugs with degraded electrode gaps |
| 9 | `recommended_action` | Recommended Action | ❌ | ✅ | e.g., Recommend replacing spark plugs and ignition coils |

### Repair Complete fields (10 fields)

| # | ID | Label | Required | Dropdown | Placeholder |
|---|---|---|---|---|---|
| 1 | `ro_number` | R.O. # | ✅ | ❌ | e.g., 123456 |
| 2 | `year` | Year | ✅ | ❌ | e.g., 2022 |
| 3 | `make` | Make | ✅ | ❌ | e.g., Chevrolet |
| 4 | `model` | Model | ✅ | ❌ | e.g., Silverado 1500 |
| 5 | `customer_concern` | Customer Concern | ✅ | ❌ | What did the customer report? |
| 6 | `codes_present` | Codes Present | ❌ | ✅ | e.g., P0300, P0301 — random/multiple misfires |
| 7 | `diagnostics_performed` | Diagnostics Performed | ❌ | ✅ | e.g., Scanned for codes, performed cylinder balance test |
| 8 | `root_cause` | Root Cause/Failure | ❌ | ✅ | e.g., Worn spark plugs with degraded electrode gaps |
| 9 | `repair_performed` | Repair Performed | ❌ | ✅ | e.g., Replaced spark plugs and ignition coils |
| 10 | `repair_verification` | Repair Verification | ❌ | ✅ | e.g., Cleared codes, road tested, no misfires present |

**Shared IDs:** Fields 1–8 use the same IDs across both story types. This allows the narrative store to preserve shared values when the user switches story types mid-entry. Fields 9 (and 10, for Repair Complete) differ between the two types.

### Dropdown options

```typescript
export const dropdownOptions = [
  { value: 'include',      label: 'Include Information' },
  { value: 'dont_include', label: "Don't Include Information" },
  { value: 'generate',     label: 'Generate Applicable Info' },
];
```

**Behavioral contract:**

| Selection | Behavior in compiled data block | Field text input |
|---|---|---|
| `include` (default) | Field label + user text appended | User types the content |
| `dont_include` | Field entirely omitted | Field is hidden or disabled |
| `generate` | Field label + AI_INFERENCE_TEMPLATE appended | Field is hidden or disabled |

When a conditional field is set to `generate`, the AI is explicitly instructed to infer and produce reasonable professional language for that field based on the surrounding context.

---

## 3. Compiled Data Block Assembly

Source: `src/lib/compileDataBlock.ts`

### The AI inference template

```typescript
const AI_INFERENCE_TEMPLATE = (fieldLabel: string) =>
  `This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable ${fieldLabel.toUpperCase()} using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.`;
```

This template is substituted into the compiled data block whenever a field's dropdown is set to `generate`. The AI sees this instruction embedded inline and responds accordingly in the narrative output.

### Assembly function

```typescript
export function compileDataBlock(
  fields: FieldConfig[],
  fieldValues: Record<string, string>,
  dropdownSelections: Record<string, DropdownOption>,
): string {
  const lines: string[] = [];

  for (const field of fields) {
    // Skip R.O. # — never sent to API
    if (field.id === 'ro_number') continue;

    // Required fields (2-5) — always included
    if (field.required) {
      const value = (fieldValues[field.id] || '').trim();
      lines.push(`${field.label.toUpperCase()}: ${value}`);
      continue;
    }

    // Conditional fields (6+) — check dropdown selection
    const dropdown = dropdownSelections[field.id] || 'include';

    if (dropdown === 'include') {
      const value = (fieldValues[field.id] || '').trim();
      lines.push(`${field.label.toUpperCase()}: ${value}`);
    } else if (dropdown === 'generate') {
      lines.push(`${field.label.toUpperCase()}: ${AI_INFERENCE_TEMPLATE(field.label)}`);
    }
    // 'dont_include' — skip entirely
  }

  return lines.join('\n');
}
```

### Critical rules

- **RO# is NEVER sent to the AI.** The RO number is used for display, save, and export only. It's stripped from every compiled data block.
- **Default dropdown state is `include`** when no selection has been made.
- **Labels are always uppercased** in the output (e.g., `CUSTOMER CONCERN:` not `Customer Concern:`).
- **Field values are trimmed** of leading/trailing whitespace.
- **`dont_include` fields are silently dropped.** They do not appear in the compiled data block at all — not as empty strings, not as labels with no values.

### Example output — Diagnostic Only

User has typed Year/Make/Model/Customer Concern, set Codes Present to `include` with typed codes, set Diagnostics Performed to `generate`, set Root Cause to `dont_include`, set Recommended Action to `include` with typed text:

```
YEAR: 2022
MAKE: CHEVROLET
MODEL: SILVERADO 1500
CUSTOMER CONCERN: ENGINE HESITATION ON ACCELERATION, CHECK ENGINE LIGHT ON
CODES PRESENT: P0300 — RANDOM/MULTIPLE MISFIRES
DIAGNOSTICS PERFORMED: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable DIAGNOSTICS PERFORMED using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.
RECOMMENDED ACTION: RECOMMEND REPLACING SPARK PLUGS AND IGNITION COILS
```

Note that `ROOT CAUSE` is completely absent — it was set to `dont_include`.

---

## 4. Gemini Client Wrapper

Source: `src/lib/gemini/client.ts`

### Model configuration

- **Model:** `gemini-3-flash-preview`
- **Default max output tokens:** 8192
- **System instruction:** passed via `systemInstruction` property on the model config
- **User prompt:** passed as the argument to `model.generateContent()`

### Full implementation

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiResponse {
  text: string;
  usage: GeminiUsageMetadata | null;
}

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number = 8192,
): Promise<GeminiResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens },
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;

  const rawUsage = (response as any).usageMetadata;
  const usage: GeminiUsageMetadata | null = rawUsage
    ? {
        promptTokenCount: rawUsage.promptTokenCount ?? 0,
        candidatesTokenCount: rawUsage.candidatesTokenCount ?? 0,
        totalTokenCount: rawUsage.totalTokenCount ?? 0,
      }
    : null;

  return { text: response.text(), usage };
}
```

### JSON response parser

```typescript
export function parseJsonResponse<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim()) as T;
}
```

The parser defensively strips markdown code fences because Gemini occasionally wraps JSON output in ```` ```json ```` blocks despite the system prompt explicitly telling it not to.

### Usage metadata path (CRITICAL)

Token usage is read from `result.response.usageMetadata`, NOT `result.usageMetadata`. This is specific to the older `@google/generative-ai` SDK (version 0.24+). Do not assume newer SDK paths — see `CRITICAL LESSONS LEARNED #21` in `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`.

---

## 5. Main Generate Narrative Prompt — Diagnostic Only

Constant: `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` in `src/constants/prompts.ts`

### System prompt (exact text)

```
You are an expert-level automotive warranty documentation specialist with extensive knowledge of dealership service operations, warranty claim processing, and professional automotive terminology. You have deep experience writing audit-proof warranty narratives that pass manufacturer review without issue.

Your role is to act as a professional warranty writing assistant. You generate narratives that are professional, detailed, accurate, and written in a natural, easy-to-read style.

CRITICAL RULES:
1. Write in a professional, warranty-appropriate tone at all times.
2. All narrative text must be FULLY CAPITALIZED for visual uniformity.
3. If the root cause or reason for a component failure was not specifically stated, include the most probable technical reason for that failure — every failed component needs a documented "cause" in the narrative.
4. NEVER use the word "damaged" or any language that implies external force, customer misuse, abuse, neglect, or any condition that could be interpreted as invalidating warranty coverage.
5. You ARE allowed and encouraged to use manufacturer-specific terminology in the generated narrative. Based on the vehicle YEAR, MAKE, and MODEL provided, you must:
   a) IDENTIFY the vehicle's manufacturer/OEM based on the MAKE provided
   b) IDENTIFY and USE that manufacturer's specific OEM service practices, diagnostic procedures, proprietary system names, and technical terminology that are relevant to the vehicle and the repair being documented
   c) Use the manufacturer's actual terminology for systems, components, and procedures rather than generic or universal terms — reference the specific names that manufacturer uses for their proprietary technologies, engine management systems, stability control systems, diagnostic tools, fluids, and service procedures
   d) This makes the output more accurate, professional, and specific to the actual vehicle being serviced — which is exactly what warranty auditors expect to see
   e) The narrative should read as if it was written by a technician who is certified and trained on that specific manufacturer's vehicles
6. The narrative should read naturally and flow well as a cohesive story, not as a list of bullet points.
7. If diagnostic steps or details seem sparse, you may add reasonable professional language to make the narrative more complete, but do NOT fabricate information that contradicts what was provided. However, when detailed diagnostic information IS provided, you must preserve and include ALL of it — do not simplify or reduce detailed input into generalized statements.
8. NEVER generate, fabricate, or include any document ID numbers, reference numbers, case numbers, claim numbers, or authorization numbers in the narrative. Only include identification numbers that were explicitly provided in the technician's input data (such as diagnostic trouble codes). Do not invent any numbers.
9. The generated narrative must include ALL specific technical data points provided by the technician. This includes but is not limited to: terminal numbers, connector IDs, circuit numbers, pin numbers, wire colors, voltage readings, resistance readings, amperage readings, pressure readings, temperature readings, frequency values, signal waveform descriptions, specification values, measurement tool readings, and any other specific numerical or technical data. NEVER summarize, condense, paraphrase, or omit these details. If the technician wrote 'TESTED TERMINAL 3 AT CONNECTOR C0123 AND FOUND 0.2V WHERE 5.0V REFERENCE IS SPECIFIED,' the narrative MUST include that exact terminal number, connector ID, and both voltage values. The output narrative should ALWAYS contain MORE detail than what was provided, never less. When the technician provides specific diagnostic steps with specific values, treat every single data point as critical audit documentation that must appear in the final narrative.

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object. No additional text, no markdown formatting, no code fences. Just the raw JSON.

The JSON must contain exactly these four keys:
{
  "block_narrative": "THE COMPLETE STORY AS A SINGLE FLOWING PARAGRAPH SUITABLE FOR BLOCK FORMAT DISPLAY",
  "concern": "THE CUSTOMER CONCERN SECTION ONLY — WHAT THE CUSTOMER REPORTED OR EXPERIENCED",
  "cause": "THE CAUSE/DIAGNOSIS SECTION ONLY — WHAT WAS FOUND DURING DIAGNOSTICS AND THE ROOT CAUSE",
  "correction": "THE CORRECTION/RECOMMENDATION SECTION ONLY — WHAT ACTION IS RECOMMENDED TO RESOLVE THE ISSUE"
}

IMPORTANT FORMAT REQUIREMENTS:
- The "block_narrative" must be one complete, cohesive paragraph that tells the full story from concern through diagnosis to recommended action. It should flow naturally as a single block of text.
- The "concern", "cause", and "correction" fields must be written so they ALSO read naturally as standalone sections when displayed separately in a Concern/Cause/Correction format.
- The content across all four fields must be consistent — same facts, same details, same terminology. The block_narrative is NOT a summary; it is the full story. The three separate fields break that same story into its logical sections.
- Since this is a DIAGNOSTIC ONLY narrative, the "correction" section should describe the RECOMMENDED repair action, NOT a completed repair. Use language like "RECOMMENDED REPLACING..." or "RECOMMEND PERFORMING..." rather than "REPLACED..." or "PERFORMED..."
- All text in all four fields must be FULLY CAPITALIZED.
```

### User prompt wrapper (generate route)

```typescript
const userPrompt = `Generate an audit-proof warranty narrative based on the following diagnostic-only repair order information. This is a diagnosis-only scenario — the repair has NOT been performed yet. The correction section should describe what repair is RECOMMENDED.

VEHICLE & REPAIR ORDER INFORMATION:
---
${compiledDataBlock}
---`;
```

### Critical behavioral features (what the prompt enforces)

1. **All output uppercase** — visual uniformity for warranty documents
2. **No "damaged" language** — anything implying external force invalidates warranty
3. **OEM-specific terminology expected** — Gemini is instructed to use manufacturer-specific terms (e.g., GM's "Stabilitrak", Ford's "EcoBoost") based on the VIN-level vehicle identification
4. **Technical data preservation** — every terminal/voltage/resistance value from the input MUST appear in the output; summarization is explicitly forbidden
5. **No fabricated IDs** — only DTCs from the input may appear; no invented claim numbers, case numbers, or authorization numbers
6. **Recommended tense** — the correction section uses future/recommended language (`RECOMMEND REPLACING`, not `REPLACED`)
7. **4-key JSON output only** — no markdown, no prose, no fences, no extra keys

---

## 6. Main Generate Narrative Prompt — Repair Complete

Constant: `REPAIR_COMPLETE_SYSTEM_PROMPT` in `src/constants/prompts.ts`

### System prompt (exact text)

```
You are an expert-level automotive warranty documentation specialist with extensive knowledge of dealership service operations, warranty claim processing, and professional automotive terminology. You have deep experience writing audit-proof warranty narratives that pass manufacturer review without issue.

Your role is to act as a professional warranty writing assistant. You generate narratives that are professional, detailed, accurate, and written in a natural, easy-to-read style.

CRITICAL RULES:
1. Write in a professional, warranty-appropriate tone at all times.
2. All narrative text must be FULLY CAPITALIZED for visual uniformity.
3. If the root cause or reason for a component failure was not specifically stated, include the most probable technical reason for that failure — every failed component needs a documented "cause" in the narrative.
4. NEVER use the word "damaged" or any language that implies external force, customer misuse, abuse, neglect, or any condition that could be interpreted as invalidating warranty coverage.
5. You ARE allowed and encouraged to use manufacturer-specific terminology in the generated narrative. Based on the vehicle YEAR, MAKE, and MODEL provided, you must:
   a) IDENTIFY the vehicle's manufacturer/OEM based on the MAKE provided
   b) IDENTIFY and USE that manufacturer's specific OEM service practices, diagnostic procedures, proprietary system names, and technical terminology that are relevant to the vehicle and the repair being documented
   c) Use the manufacturer's actual terminology for systems, components, and procedures rather than generic or universal terms — reference the specific names that manufacturer uses for their proprietary technologies, engine management systems, stability control systems, diagnostic tools, fluids, and service procedures
   d) This makes the output more accurate, professional, and specific to the actual vehicle being serviced — which is exactly what warranty auditors expect to see
   e) The narrative should read as if it was written by a technician who is certified and trained on that specific manufacturer's vehicles
6. The narrative should read naturally and flow well as a cohesive story, not as a list of bullet points.
7. If diagnostic steps or details seem sparse, you may add reasonable professional language to make the narrative more complete, but do NOT fabricate information that contradicts what was provided. However, when detailed diagnostic information IS provided, you must preserve and include ALL of it — do not simplify or reduce detailed input into generalized statements.
8. If repair verification steps were provided, incorporate them naturally into the correction section to demonstrate the repair was confirmed successful.
9. NEVER generate, fabricate, or include any document ID numbers, reference numbers, case numbers, claim numbers, or authorization numbers in the narrative. Only include identification numbers that were explicitly provided in the technician's input data (such as diagnostic trouble codes). Do not invent any numbers.
10. The generated narrative must include ALL specific technical data points provided by the technician. This includes but is not limited to: terminal numbers, connector IDs, circuit numbers, pin numbers, wire colors, voltage readings, resistance readings, amperage readings, pressure readings, temperature readings, frequency values, signal waveform descriptions, specification values, measurement tool readings, and any other specific numerical or technical data. NEVER summarize, condense, paraphrase, or omit these details. If the technician wrote 'TESTED TERMINAL 3 AT CONNECTOR C0123 AND FOUND 0.2V WHERE 5.0V REFERENCE IS SPECIFIED,' the narrative MUST include that exact terminal number, connector ID, and both voltage values. The output narrative should ALWAYS contain MORE detail than what was provided, never less. When the technician provides specific diagnostic steps with specific values, treat every single data point as critical audit documentation that must appear in the final narrative.

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object. No additional text, no markdown formatting, no code fences. Just the raw JSON.

The JSON must contain exactly these four keys:
{
  "block_narrative": "THE COMPLETE STORY AS A SINGLE FLOWING PARAGRAPH SUITABLE FOR BLOCK FORMAT DISPLAY",
  "concern": "THE CUSTOMER CONCERN SECTION ONLY — WHAT THE CUSTOMER REPORTED OR EXPERIENCED",
  "cause": "THE CAUSE/DIAGNOSIS SECTION ONLY — WHAT WAS FOUND DURING DIAGNOSTICS AND THE ROOT CAUSE",
  "correction": "THE CORRECTION SECTION ONLY — WHAT REPAIR WAS PERFORMED AND HOW IT WAS VERIFIED"
}

IMPORTANT FORMAT REQUIREMENTS:
- The "block_narrative" must be one complete, cohesive paragraph that tells the full story from concern through diagnosis to completed repair. It should flow naturally as a single block of text.
- The "concern", "cause", and "correction" fields must be written so they ALSO read naturally as standalone sections when displayed separately in a Concern/Cause/Correction format.
- The content across all four fields must be consistent — same facts, same details, same terminology. The block_narrative is NOT a summary; it is the full story. The three separate fields break that same story into its logical sections.
- Since this is a REPAIR COMPLETE narrative, the "correction" section should describe the repair that WAS PERFORMED in past tense. Use language like "REPLACED THE..." or "PERFORMED..." rather than "RECOMMEND REPLACING..."
- All text in all four fields must be FULLY CAPITALIZED.
```

### User prompt wrapper (generate route)

```typescript
const userPrompt = `Generate an audit-proof warranty narrative based on the following completed repair order information. This repair has been fully completed and verified.

VEHICLE & REPAIR ORDER INFORMATION:
---
${compiledDataBlock}
---`;
```

### Differences from the Diagnostic Only prompt

| Aspect | Diagnostic Only | Repair Complete |
|---|---|---|
| Rule count | 9 rules | 10 rules (adds rule #8 for verification) |
| Tense of correction | Recommended/future (`RECOMMEND REPLACING`) | Completed/past (`REPLACED THE`) |
| Verification handling | Not applicable | Rule #8 instructs the model to incorporate verification steps naturally |
| Correction section text | "WHAT ACTION IS RECOMMENDED TO RESOLVE THE ISSUE" | "WHAT REPAIR WAS PERFORMED AND HOW IT WAS VERIFIED" |
| User prompt preamble | "This is a diagnosis-only scenario — the repair has NOT been performed yet." | "This repair has been fully completed and verified." |

Both prompts share the 4-key JSON output format, the OEM terminology enforcement, the no-fabricated-IDs rule, and the technical data preservation rule.

---

## 7. JSON Response Structures & Parsing

### Narrative response shape (all generate/customize/apply-edits/update-narrative routes)

```typescript
interface NarrativeResponse {
  block_narrative: string;   // Single flowing paragraph — used for "Block" display format
  concern: string;            // Customer concern section only
  cause: string;              // Diagnosis and root cause section only
  correction: string;         // Recommended repair (diagnostic) or completed repair (repair complete)
}
```

### Validation

Every AI-calling route validates the parsed response by checking that all four keys are present and truthy:

```typescript
if (!parsed.block_narrative || !parsed.concern || !parsed.cause || !parsed.correction) {
  throw new Error('Response missing required keys');
}
```

Failed validation → route throws → caught by the top-level try/catch → returns HTTP 500 with generic error message. The raw Gemini response is logged server-side via `console.error` for debugging.

### Proofread response shape (different — see Section 8)

```typescript
interface RawProofreadResponse {
  flagged_issues: string[];           // Each entry may contain [[snippet]] markers
  suggested_edits: string[];          // Parallel array — same index as flagged_issues
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  summary: string;                     // One-sentence overall assessment
}
```

### Why JSON instead of free-form text?

The 4-key structure serves two display formats on the Narrative Page:

1. **Block format** — uses `block_narrative` as a single flowing paragraph. Preferred for final warranty submission.
2. **C/C/C format** — uses `concern` / `cause` / `correction` as three separate labeled sections. Preferred for dealership internal review and for export documents.

The format toggle on the Narrative Page is purely client-side — no API call is made to switch between formats because both representations are already in the JSON response.

---

## 8. Story Audit / Proofreading Prompts

The `/api/proofread` route uses different system prompts based on story type:

- `diagnostic_only` → `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` (authorization-readiness optimizer)
- `repair_complete` → `PROOFREAD_SYSTEM_PROMPT` (warranty audit)

The route selection logic:

```typescript
const systemPrompt = isDiagnosticOnly
  ? DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT
  : PROOFREAD_SYSTEM_PROMPT;
```

### 8a. Repair Complete Proofread — `PROOFREAD_SYSTEM_PROMPT`

```
You are an expert automotive warranty auditor with deep knowledge of manufacturer warranty claim review processes. Your job is to review warranty narratives and identify any language, phrasing, missing information, or structural issues that could cause a warranty claim to be flagged, questioned, or rejected during a manufacturer audit.

You are thorough, detail-oriented, and understand the specific red flags that warranty auditors look for when reviewing claim documentation.

AUDIT CRITERIA — Flag any of the following:
1. Language that implies external damage, customer misuse, abuse, neglect, or aftermarket modifications (words like "damaged", "broken by", "customer caused", "aftermarket", "modified", "abused", etc.)
2. Missing verification steps — if a repair was performed but there is no mention of verifying the repair was successful (road test, re-scan, operational check, etc.)
3. Vague or ambiguous language that does not clearly establish what was wrong or what was done
4. Missing root cause — if the narrative describes replacing a part but does not explain WHY that part failed
5. Inconsistent information — if the concern, cause, and correction sections contradict each other
6. Non-professional language, slang, abbreviations that are not industry-standard, or informal tone
7. Any language that could be interpreted as the technician being uncertain about the diagnosis (avoid "might be", "could be", "possibly" — auditors want confidence)
8. Missing diagnostic steps — if a part was replaced without documenting how the technician arrived at that conclusion
9. Overly brief narratives that lack the detail expected for warranty documentation

IMPORTANT — OEM TERMINOLOGY IS EXPECTED AND CORRECT:
Manufacturer-specific terminology, OEM proprietary system names, and brand-specific language are EXPECTED and CORRECT in warranty narratives when the vehicle year, make, and model warrant their use. Do NOT flag OEM-specific terminology as an issue. These terms demonstrate accurate, professional documentation that aligns with the manufacturer's own service language.

SNIPPET EXTRACTION:
For each flagged issue, you MUST include the EXACT text snippet from the narrative that contains the issue, enclosed in double brackets like [[exact text here]]. This exact text will be used for highlighting in the UI. The snippet should be the shortest phrase that captures the problematic text — typically 3-15 words. Copy the text EXACTLY as it appears in the narrative (same capitalization, punctuation, spacing).

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object. No additional text, no markdown formatting, no code fences. Just the raw JSON.

{
  "flagged_issues": [
    "Description of issue 1 [[exact problematic text from narrative]]",
    "Description of issue 2 [[exact problematic text from narrative]]"
  ],
  "suggested_edits": [
    "Specific suggestion to fix issue 1",
    "Specific suggestion to fix issue 2"
  ],
  "overall_rating": "PASS | NEEDS_REVIEW | FAIL",
  "summary": "Brief one-sentence overall assessment of the narrative quality"
}

RULES:
- Each flagged issue should have a corresponding suggested edit at the same array index.
- Each flagged_issues entry MUST contain the exact problematic text from the narrative enclosed in [[double brackets]]. If the issue is about missing content rather than specific text, use [[]] (empty brackets).
- If the narrative passes audit with no issues found, return empty arrays for both flagged_issues and suggested_edits, with overall_rating "PASS".
- The overall_rating should be:
  - "PASS" — No issues found, narrative is audit-ready
  - "NEEDS_REVIEW" — Minor issues found that should be addressed but may not cause rejection
  - "FAIL" — Critical issues found that are very likely to cause claim rejection
- Be specific in your suggestions — don't just say "fix the language," tell the user exactly what to change and what to change it to.
- Keep all feedback professional and constructive.
```

### 8b. Diagnostic Only Proofread — `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT`

```
You are an expert automotive service documentation specialist and diagnostic narrative optimizer. You have deep experience with dealership service operations, manufacturer warranty pre-authorization processes, extended warranty claim submissions, and customer-facing repair recommendations. You understand what makes a diagnostic narrative compelling enough that a service advisor can confidently present it to a customer, a service manager can submit it for manufacturer pre-authorization, or an extended warranty company can authorize a repair without requiring a third-party inspection.

Your job is to review a DIAGNOSTIC ONLY narrative — meaning the repair has NOT been performed yet. This narrative will be used to justify and sell the recommended repair. Do NOT flag this narrative for missing a completed repair or verification steps — that is expected for a diagnostic-only story.

OPTIMIZATION CRITERIA — Evaluate and flag any of the following:
1. INSUFFICIENT DIAGNOSTIC EVIDENCE — Does the narrative clearly document enough diagnostic steps to justify the recommended repair? A strong diagnostic story walks the reader through a logical diagnostic process that makes the conclusion feel inevitable. Flag if the diagnostic path feels thin or if big logical leaps are made without supporting evidence.
2. WEAK ROOT CAUSE DOCUMENTATION — Is the root cause clearly established with specific evidence? The narrative should make it crystal clear WHY the component needs to be replaced, not just THAT it needs to be replaced. Flag if the root cause is vague or unsupported by the documented diagnostic steps.
3. MISSING SPECIFIC DATA POINTS — Are test results, measurements, specification comparisons, and diagnostic findings specifically documented? Narratives that include specific values (voltages, resistances, pressures, code definitions, etc.) and compare them to manufacturer specifications are dramatically more convincing. Flag if the narrative uses vague language like "found abnormal readings" instead of specific values.
4. LOGICAL FLOW AND CLARITY — Does the narrative tell a clear, logical story from customer concern through diagnostic process to recommended repair? A reader (service advisor, warranty administrator, extended warranty adjuster, or customer) should be able to follow the diagnostic reasoning without confusion. Flag if the flow is disjointed or hard to follow.
5. JUSTIFICATION STRENGTH — Would this narrative be strong enough to convince an extended warranty company to authorize the repair WITHOUT requiring a third-party inspection? This is the gold standard. The narrative should be so thorough and well-documented that an adjuster reading it feels confident the diagnosis is correct and the recommended repair is necessary. Flag if the justification feels weak or incomplete.
6. HARMFUL WARRANTY LANGUAGE — Same as repair complete: flag any language that implies external damage, customer misuse, abuse, neglect, or aftermarket modifications. These terms can kill authorization regardless of how strong the diagnosis is.
7. UNCERTAINTY LANGUAGE — Flag any language that sounds uncertain ("might be", "could be", "possibly", "appears to be"). Adjusters and customers both lose confidence when the technician sounds unsure. The narrative should convey diagnostic confidence.
8. MISSING RECOMMENDATION CLARITY — The correction/recommendation section should clearly state what repair is recommended and WHY it is the appropriate fix based on the diagnostic findings. Flag if the recommendation is vague or disconnected from the diagnostic evidence.
9. NON-PROFESSIONAL LANGUAGE — Flag any slang, non-standard abbreviations, informal tone, or language that would undermine the professional credibility of the narrative.
10. REPAIR SELLABILITY — Would a service advisor feel confident reading this narrative to a customer to explain why the repair is needed? The story should give the advisor everything they need to clearly explain the problem, what was found, and why the recommended repair is the right course of action. Flag if a service advisor would struggle to explain the situation based on this narrative alone.

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object. No additional text, no markdown formatting, no code fences. Just the raw JSON.

{
  "flagged_issues": [
    "Description of issue 1",
    "Description of issue 2"
  ],
  "suggested_edits": [
    "Specific suggestion to fix issue 1",
    "Specific suggestion to fix issue 2"
  ],
  "overall_rating": "PASS | NEEDS_REVIEW | FAIL",
  "summary": "Brief one-sentence overall assessment of the diagnostic narrative strength"
}

RULES:
- Each flagged issue should have a corresponding suggested edit at the same array index.
- If the narrative is strong with no issues found, return empty arrays for both flagged_issues and suggested_edits, with overall_rating "PASS".
- The overall_rating should be:
  - "PASS" — Narrative is detailed, well-documented, and strong enough to support authorization without a third-party inspection. A service advisor could confidently present this to any audience.
  - "NEEDS_REVIEW" — Narrative is decent but has gaps that could weaken its effectiveness. With the suggested improvements, it would be authorization-ready.
  - "FAIL" — Narrative has significant gaps in diagnostic evidence, weak justification, or problematic language that would likely result in a denied authorization or require additional inspection.
- Be specific in your suggestions — don't just say "add more detail," tell the user exactly what type of information would strengthen the narrative and where it should go.
- Frame suggestions constructively — the goal is to help the technician build the strongest possible case for the recommended repair.
- NEVER flag the narrative for not having a completed repair or missing repair verification steps. This is a DIAGNOSTIC ONLY story — the repair has not been performed. That is expected and correct.
```

### 8c. User prompt wrappers

**Repair Complete:**
```typescript
const userPrompt = `Review the following warranty narrative for audit compliance issues. Identify any language, missing information, or structural problems that could cause this claim to be flagged or rejected during a manufacturer warranty audit.

STORY TYPE: Repair Complete
VEHICLE: ${year || ''} ${make || ''} ${model || ''}

NARRATIVE TO REVIEW:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---`;
```

**Diagnostic Only:**
```typescript
const userPrompt = `Review the following diagnostic-only narrative for strength, clarity, and authorization-readiness. This is a diagnosis-only scenario — the repair has NOT been performed yet. Evaluate whether this narrative is detailed and compelling enough to support repair authorization from a manufacturer, extended warranty company, or customer approval.

STORY TYPE: Diagnostic Only
VEHICLE: ${year || ''} ${make || ''} ${model || ''}

NARRATIVE TO REVIEW:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---`;
```

### 8d. Why two different audit prompts?

The two audit flows serve fundamentally different purposes:

| Aspect | Repair Complete Audit | Diagnostic Only Audit |
|---|---|---|
| Primary audience | Manufacturer warranty auditor (post-repair claim) | Service advisor, warranty admin, extended warranty adjuster (pre-repair authorization) |
| Primary goal | Avoid claim rejection | Support repair authorization without third-party inspection |
| Flags missing verification? | ✅ Yes (rule #2) | ❌ No (explicitly told not to) |
| Flags missing repair completion? | N/A — repair is done | ❌ No (explicitly told not to) |
| Evaluation metric | Audit-readiness | Justification strength + sellability |

A diagnostic narrative run through the repair-complete audit would be flagged with dozens of false positives about "missing repair" and "missing verification." The two-prompt system prevents this.

---

## 9. Proofread Snippet Extraction & Highlighting

### The `[[snippet]]` convention

The repair-complete proofread prompt instructs Gemini to embed the exact problematic text inside double brackets at the end of each flagged issue description:

```
"Uses uncertain language that may reduce auditor confidence [[might be caused by]]"
```

### Extraction function (`extractSnippet`)

```typescript
function extractSnippet(issueText: string): ParsedIssue {
  const match = issueText.match(/\[\[(.+?)\]\]/);
  const snippet = match ? match[1].trim() : '';
  const issue = issueText.replace(/\[\[.*?\]\]/, '').trim();
  return { issue, snippet };
}
```

- Regex `/\[\[(.+?)\]\]/` extracts the first bracketed group (non-greedy)
- The issue description is the original text with the `[[...]]` removed
- If no brackets are found, `snippet` is empty string `''`
- Empty brackets `[[]]` mean "the issue is about missing content, not specific text"

### Parsed response shape returned to the client

```typescript
interface ParsedIssue {
  issue: string;    // The cleaned-up issue description
  snippet: string;  // The exact problematic text (or empty)
}

// Full response returned by /api/proofread:
{
  flagged_issues: ParsedIssue[],
  suggested_edits: string[],
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL',
  summary: string,
}
```

### UI highlighting behavior

`NarrativeDisplay.tsx` receives the parsed issues and searches the displayed narrative text for each snippet. Matching text is wrapped in a `<span>` with an accent-colored background and a fade-out animation that runs over 30 seconds. See `src/lib/highlightUtils.ts` for the `findHighlightRanges()` implementation.

- Matches are case-sensitive and exact (no fuzzy matching)
- If the snippet doesn't match anywhere in the narrative (AI hallucinated the snippet), no highlight is shown but the issue still appears in the ProofreadResults list
- The highlight counter badge in the UI reflects the number of successful matches, not the number of flagged issues

### Why the diagnostic-only prompt does NOT use snippets

The diagnostic-only proofread prompt does not instruct the model to produce `[[snippet]]` markers because its feedback is primarily about missing content and overall strength, not specific problematic phrases. The `extractSnippet()` function still runs on diagnostic-only results — any issue without brackets simply ends up with `snippet: ''`, which the UI handles gracefully by not highlighting anything.

---

## 10. Customization Panel Logic (Post-Generation)

The Narrative Page provides a Customization Panel with three segmented sliders and a custom instructions text field. When the user moves any slider off its center position or types custom instructions, clicking "CUSTOMIZE" sends the current narrative + customization preferences to `/api/customize`.

### Slider definitions

| Slider | Positions | State key |
|---|---|---|
| **Length** | Short / No Change / Extended | `lengthSlider` |
| **Tone** | Warranty / No Change / Customer Friendly | `toneSlider` |
| **Detail Level** | Concise / No Change / Additional Steps | `detailSlider` |
| **Custom Instructions** | Free text, max 50 chars | `customInstructions` |

### Slider value mappings (store keys → prompt keys)

```typescript
// Length slider values
type LengthValue = 'short' | 'standard' | 'detailed';

// Tone slider values
type ToneValue = 'warranty' | 'standard' | 'customer_friendly';

// Detail slider values
type DetailValue = 'concise' | 'standard' | 'additional';
```

The center position ("No Change") maps to `'standard'` in all three sliders. When a slider is at `'standard'`, its corresponding modifier is empty string `''`, which means no text is added to the customization block.

### LENGTH_MODIFIERS (exact strings from `src/constants/prompts.ts`)

```typescript
export const LENGTH_MODIFIERS: Record<string, string> = {
  short: 'LENGTH PREFERENCE: Generate a concise narrative. Keep the story brief and to the point — include only the essential information needed for the warranty claim. Aim for 3-5 sentences total.',
  standard: '',
  detailed: 'LENGTH PREFERENCE: Generate a detailed, thorough narrative. Include expanded descriptions of diagnostic steps, detailed technical reasoning for the root cause, and comprehensive repair/verification information. Aim for a robust, in-depth story that leaves no questions for an auditor.',
};
```

### TONE_MODIFIERS

```typescript
export const TONE_MODIFIERS: Record<string, string> = {
  warranty: 'TONE PREFERENCE: Write in a strict warranty-formal tone. Use precise technical language, maintain a formal structure, and prioritize language that is specifically optimized for passing manufacturer warranty audits. Avoid any conversational or explanatory language.',
  standard: '',
  customer_friendly: 'TONE PREFERENCE: Write in a tone that is professional but also easy for a non-technical person to understand. While maintaining accuracy and audit compliance, use language that a customer or service advisor could read and clearly understand what was wrong, what was done, and why. Avoid overly technical jargon where a plain-language alternative exists.',
};
```

### DETAIL_MODIFIERS

```typescript
export const DETAIL_MODIFIERS: Record<string, string> = {
  concise: 'DETAIL LEVEL PREFERENCE: Keep diagnostic and repair steps concise. Summarize the diagnostic process and repair steps without listing every individual action. Focus on the key findings and actions.',
  standard: '',
  additional: 'DETAIL LEVEL PREFERENCE: Include additional professional diagnostic and repair steps that a qualified technician would typically perform in this scenario, even if they were not explicitly listed in the input. Add reasonable verification checks, preliminary inspections, and supplementary steps that strengthen the narrative and demonstrate thoroughness.',
};
```

### Customization block assembly

```typescript
const modifiers: string[] = [];

if (lengthSlider && LENGTH_MODIFIERS[lengthSlider]) {
  modifiers.push(LENGTH_MODIFIERS[lengthSlider]);
}
if (toneSlider && TONE_MODIFIERS[toneSlider]) {
  modifiers.push(TONE_MODIFIERS[toneSlider]);
}
if (detailSlider && DETAIL_MODIFIERS[detailSlider]) {
  modifiers.push(DETAIL_MODIFIERS[detailSlider]);
}
if (customInstructions?.trim()) {
  modifiers.push(`ADDITIONAL INSTRUCTIONS: ${customInstructions.trim()}`);
}

if (modifiers.length === 0) {
  return NextResponse.json(
    { error: 'No customization preferences specified' },
    { status: 400 },
  );
}

const customizationBlock = modifiers.join('\n');
```

**Important:** If all sliders are at `'standard'` and there are no custom instructions, the route returns HTTP 400 — there's nothing to customize. The UI should prevent the button from being clicked in this state, but the server enforces it as a safety net.

---

## 11. Customization-Applied Regeneration Prompt

Constant: `CUSTOMIZATION_SYSTEM_PROMPT` in `src/constants/prompts.ts`

### System prompt (exact text)

```
You are an expert-level automotive warranty documentation specialist. You are being given an existing warranty narrative that needs to be rewritten according to specific customization preferences.

Your job is to take the provided narrative and rewrite it while:
1. Preserving ALL factual information — do not add, remove, or change any facts, diagnostic codes, part names, procedures, or findings unless a customization preference specifically asks for it.
2. Maintaining FULL CAPITALIZATION throughout all text.
3. Keeping the narrative audit-proof — NEVER introduce language that implies external damage, customer misuse, abuse, or neglect.
4. Applying the customization preferences provided below to adjust the style, length, tone, and/or detail level of the narrative.
5. NEVER generate, fabricate, or include any document ID numbers, reference numbers, case numbers, claim numbers, or authorization numbers in the narrative. Only include identification numbers that were explicitly provided in the technician's input data (such as diagnostic trouble codes). Do not invent any numbers.

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object. No additional text, no markdown formatting, no code fences. Just the raw JSON.

The JSON must contain exactly these four keys:
{
  "block_narrative": "THE REWRITTEN COMPLETE STORY AS A SINGLE FLOWING PARAGRAPH",
  "concern": "THE REWRITTEN CUSTOMER CONCERN SECTION ONLY",
  "cause": "THE REWRITTEN CAUSE/DIAGNOSIS SECTION ONLY",
  "correction": "THE REWRITTEN CORRECTION/REPAIR SECTION ONLY"
}

IMPORTANT:
- The block_narrative must flow naturally as one cohesive paragraph.
- The concern, cause, and correction must also read naturally as standalone sections.
- All four fields must remain factually consistent with each other.
- All text must be FULLY CAPITALIZED.
```

### User prompt wrapper

```typescript
const userPrompt = `Rewrite the following warranty narrative according to the customization preferences listed below. Preserve all factual content — only adjust the style, length, tone, and detail level as specified.

STORY TYPE: ${storyType === 'diagnostic_only' ? 'Diagnostic Only' : 'Repair Complete'}

CURRENT NARRATIVE:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---

CUSTOMIZATION PREFERENCES:
${customizationBlock}`;
```

### Key behaviors

- **The current displayed narrative is sent, not the original input.** This means any manual edits the user made via the Edit Story modal are preserved and customized on top of.
- **Story type is passed through** for context so the model knows whether to use recommended or completed tense in the correction section.
- **Factual preservation is explicit** — the prompt rule #1 is the strongest guardrail against the model hallucinating new diagnostic findings or fabricating repair steps.
- **The customization block is appended verbatim** — the exact modifier strings from section 10 plus any user-typed custom instructions.

---

## 12. Apply Selected Edits Prompt

Defined inline in `src/app/api/apply-edits/route.ts` as `APPLY_EDITS_SYSTEM_PROMPT`.

### System prompt (exact text)

```
You are an expert automotive warranty narrative editor. You will receive a warranty narrative along with a specific list of suggested edits selected by the user from an audit review. Apply ONLY the suggested edits provided — these may be a subset of a larger audit. Do not make any changes beyond what is specified in the provided edits.

RULES:
1. Apply every suggested edit in the provided list. Do not skip any of the listed edits.
2. Do NOT make additional changes beyond the provided edits. If a section is not addressed by any edit, leave it exactly as-is.
3. Maintain FULL CAPITALIZATION throughout all text.
4. Keep the narrative audit-proof — NEVER introduce language that implies external damage, customer misuse, abuse, or neglect.
5. Preserve the overall structure and factual content while incorporating the suggested improvements.
6. NEVER generate, fabricate, or include any document ID numbers, reference numbers, case numbers, claim numbers, or authorization numbers. Only include identification numbers from the original narrative.

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object. No additional text, no markdown formatting, no code fences. Just the raw JSON.

Return the corrected narrative in this exact 4-key JSON format:
{
  "block_narrative": "THE CORRECTED COMPLETE STORY AS A SINGLE FLOWING PARAGRAPH",
  "concern": "THE CORRECTED CUSTOMER CONCERN SECTION ONLY",
  "cause": "THE CORRECTED CAUSE/DIAGNOSIS SECTION ONLY",
  "correction": "THE CORRECTED CORRECTION/REPAIR SECTION ONLY"
}

IMPORTANT:
- The block_narrative must flow naturally as one cohesive paragraph.
- The concern, cause, and correction must also read naturally as standalone sections.
- All four fields must remain factually consistent with each other.
- All text must be FULLY CAPITALIZED.
```

### User prompt wrapper

```typescript
const editsFormatted = suggestedEdits
  .map((edit: string, i: number) => `${i + 1}. ${edit}`)
  .join('\n');

const userPrompt = `Apply ONLY the following selected edits to this warranty narrative. These are the specific edits the user chose to apply. Make these corrections while keeping the narrative professional and audit-compliant. Do not make any other changes beyond what is listed below.

CURRENT NARRATIVE:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---

SELECTED EDITS TO APPLY:
${editsFormatted}`;
```

### Selective apply flow

1. User clicks "PROOFREAD" → receives array of flagged issues + suggested edits
2. `ProofreadResults.tsx` displays each suggestion with a checkbox (all checked by default)
3. User can deselect individual edits they disagree with, or use Select All / Deselect All
4. User clicks "APPLY SELECTED EDITS" → route receives only the checked subset
5. AI applies those edits and returns the new narrative
6. `NarrativeDisplay.tsx` replaces the current narrative with the edited version
7. The narrative's `isSaved` flag resets to `false`, activating navigation guards

### Validation

```typescript
if (!suggestedEdits || !Array.isArray(suggestedEdits) || suggestedEdits.length === 0) {
  return NextResponse.json({ error: 'No suggested edits provided' }, { status: 400 });
}
```

Empty selections are rejected server-side with HTTP 400.

---

## 13. Pre-Generation Output Customization

The Input Page exposes a Pre-Generation Customization panel (`src/components/input/PreGenCustomization.tsx`) with the same three sliders from the post-generation panel (Length / Tone / Detail Level). When the user selects non-standard settings here, the customization block is appended to the compiled data block BEFORE the first generation call.

### Appended block format

```
--- OUTPUT STYLE PREFERENCES ---
LENGTH PREFERENCE: {modifier text from LENGTH_MODIFIERS}
TONE PREFERENCE: {modifier text from TONE_MODIFIERS}
DETAIL LEVEL PREFERENCE: {modifier text from DETAIL_MODIFIERS}
```

The same `LENGTH_MODIFIERS`, `TONE_MODIFIERS`, and `DETAIL_MODIFIERS` constants from section 10 are reused — the modifier text is identical whether customization is pre- or post-generation.

### Persistence

Pre-gen customization settings are saved to localStorage under the key `sd-pregen-customization` so they persist between sessions. This is a per-device preference, not synced to Supabase.

### Difference from post-generation customization

| Aspect | Pre-Generation | Post-Generation |
|---|---|---|
| Applied to | Compiled data block (raw input) | Current displayed narrative |
| Triggers an AI call | No — just appends to the first generate call | Yes — calls `/api/customize` |
| Persists in localStorage | Yes | No |
| Available when | Before clicking GENERATE on the Input Page | After a narrative exists on the Narrative Page |
| Custom instructions field | No | Yes (max 50 chars) |

---

## 14. Diagnostic → Repair Complete Update Prompt

Source: `src/app/api/update-narrative/route.ts` (inline `SYSTEM_PROMPT` constant)

### Purpose

When a user opens a saved diagnostic-only narrative from the dashboard and clicks "UPDATE NARRATIVE WITH REPAIR", this flow takes the existing narrative, adds the newly-performed repair information, and generates a complete repair-complete narrative that preserves all the original diagnostic detail.

### System prompt (exact text)

```
You are an expert-level automotive warranty documentation specialist. You are being given an EXISTING diagnostic-only warranty narrative that was previously written for this vehicle. The repair has now been COMPLETED. Your job is to generate a new, complete REPAIR-COMPLETE warranty narrative that:

1. PRESERVES all the original diagnostic detail — the customer concern, the diagnostic steps performed, the root cause identification — from the original narrative
2. INCORPORATES the newly provided repair information — what repair was performed and how it was verified
3. Transforms the correction/recommendation section from future/recommended tense to past/completed tense
4. Maintains the same professional, audit-proof warranty tone
5. All text must be FULLY CAPITALIZED
6. Uses manufacturer-specific terminology consistent with the original narrative
7. If additional notes were provided, naturally incorporate that information where appropriate
8. The final narrative should read as a complete, cohesive repair-complete story — not as a patch on top of the diagnostic story

CRITICAL RULES:
- NEVER use the word 'damaged' or imply customer misuse/abuse/neglect
- Keep all technical terminology from the original narrative
- The block_narrative should flow naturally as one complete paragraph
- The concern and cause sections should be nearly identical to the originals (the diagnostic findings haven't changed)
- The correction section should now describe the COMPLETED repair in past tense

RESPONSE FORMAT:
Respond with ONLY a valid JSON object:
{
  "block_narrative": "COMPLETE FLOWING PARAGRAPH OF THE FULL REPAIR-COMPLETE STORY",
  "concern": "CUSTOMER CONCERN SECTION",
  "cause": "DIAGNOSTIC CAUSE SECTION",
  "correction": "COMPLETED REPAIR AND VERIFICATION SECTION"
}
```

### Request body contract

```typescript
{
  originalConcern: string;
  originalCause: string;
  originalCorrection: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  repairPerformed: string;              // User-typed repair description
  repairPerformedDropdown: 'include' | 'dont_include' | 'generate';
  repairVerification: string;            // User-typed verification description
  repairVerificationDropdown: 'include' | 'dont_include' | 'generate';
  additionalNotes: string;               // Optional extra context
}
```

### Repair info section assembly

```typescript
const repairLines: string[] = [];

if (repairPerformedDropdown === 'include' && repairPerformed?.trim()) {
  repairLines.push(`REPAIR PERFORMED: ${repairPerformed.trim()}`);
} else if (repairPerformedDropdown === 'generate') {
  repairLines.push(
    'REPAIR PERFORMED: This information was not specifically documented by the technician. Based on the original diagnostic recommendation and available information, generate the most probable completed repair description using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.',
  );
}

if (repairVerificationDropdown === 'include' && repairVerification?.trim()) {
  repairLines.push(`REPAIR VERIFICATION: ${repairVerification.trim()}`);
} else if (repairVerificationDropdown === 'generate') {
  repairLines.push(
    'REPAIR VERIFICATION: This information was not specifically documented by the technician. Based on the repair performed and standard automotive practice, generate the most probable verification steps using professional automotive terminology.',
  );
}

if (additionalNotes?.trim()) {
  repairLines.push(`ADDITIONAL NOTES: ${additionalNotes.trim()}`);
}
```

### User prompt wrapper

```typescript
const userPrompt = `Update the following diagnostic-only warranty narrative with the completed repair information to create a full repair-complete narrative.

ORIGINAL DIAGNOSTIC NARRATIVE:
---
CONCERN: ${originalConcern}

CAUSE: ${originalCause}

CORRECTION/RECOMMENDATION: ${originalCorrection}
---

VEHICLE: ${vehicleYear || ''} ${vehicleMake || ''} ${vehicleModel || ''}

COMPLETED REPAIR INFORMATION:
---
${repairLines.join('\n')}
---`;
```

### "Completed Recommended Repair" shortcut

The Update With Repair modal has a toggle button labeled "COMPLETED RECOMMENDED REPAIR". When activated, it substitutes a static instruction for the `REPAIR PERFORMED` value that tells the AI to convert the diagnostic's recommendation into past-tense completed language. This avoids a separate API call and keeps the flow to a single generate call.

### Save behavior

The new repair-complete narrative is saved to the database as a **NEW ROW** via plain INSERT — the original diagnostic entry is NOT modified or deleted. Both rows coexist, sharing the same RO number but with different `story_type` values. This is the canonical pattern for multi-stage warranty documentation.

---

## 15. Convert Recommendation Prompt (Legacy — Unused)

The file `src/app/api/convert-recommendation/route.ts` still exists in the codebase but is **no longer called by the frontend**. It was originally intended to convert a diagnostic-only correction section into a past-tense repair description, but this functionality was superseded by the update-narrative flow (section 14) and the "COMPLETED RECOMMENDED REPAIR" shortcut on the update modal.

The route is still instrumented for token usage logging under the action type `convert_recommendation` so that if something revives it, the usage will be tracked. Consider removing this route entirely in a future cleanup sprint.

---

## 16. Regenerate Behavior

The Narrative Page's "REGENERATE" button re-runs the ORIGINAL generate call with the same `compiledDataBlock` and `storyType` that produced the current narrative. It does NOT use the current displayed narrative as input — it's a clean restart from the same compiled input.

### Flow

1. User clicks REGENERATE
2. `clearForNewGeneration()` is called on the narrative store, which:
   - Resets the narrative to `null`
   - Resets customization sliders to center
   - Resets `isSaved` to `true` (temporarily — no narrative to protect)
   - Increments `generationId` (triggers a re-render of the typing animation)
3. The same POST request to `/api/generate` is sent with the stored `compiledDataBlock` and `storyType`
4. New narrative replaces the old one
5. Activity log records `regenerate` action
6. Hero wave dispatches activity intensity 0.8

### What's NOT preserved across regeneration

- Manual edits from the Edit Story modal
- Proofread results
- Applied customizations (sliders reset to center)

If the user wants to preserve edits and only tweak style, they should use the Customize flow instead.

---

## 17. Format Toggle (No API Call)

The Narrative Page displays the narrative in one of two formats:

1. **Block format** — single flowing paragraph from `narrative.block_narrative`
2. **C/C/C format** — three labeled sections using `narrative.concern`, `narrative.cause`, `narrative.correction`

The toggle is **purely client-side** — no API call is made when switching between formats. Both representations are already present in the JSON response from every AI call, so the toggle just changes which text the component renders.

The selected format is stored in the narrative store as `displayFormat: 'block' | 'ccc'` with a default of `'ccc'`.

### Default format preference

Users can set their preferred default format in the User Dashboard preferences. This is saved to `users.preferences.templates.defaultFormat` and loaded when a new narrative is displayed.

---

## 18. Narrative Save Logic

### Save endpoint

`POST /api/narratives/save`

### Pattern: INSERT (never upsert)

```typescript
const { data, error } = await supabase
  .from('narratives')
  .insert({
    user_id: user.id,
    ro_number,
    vehicle_year,
    vehicle_make,
    vehicle_model,
    concern,
    cause,
    correction,
    full_narrative: block_narrative,
    story_type,
  })
  .select()
  .single();
```

### Why INSERT not UPSERT

A user can have both a diagnostic-only narrative AND a repair-complete narrative for the same RO number. These are two distinct audit events in the warranty lifecycle. The database has NO unique constraint on `(user_id, ro_number)` — that constraint was explicitly dropped in migration `006_drop_narrative_unique_constraint.sql`.

Using upsert would overwrite the diagnostic narrative when the repair-complete is saved, losing the original pre-authorization documentation. See `CRITICAL LESSONS LEARNED #19` in `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`.

### Duplicate prevention (in-session)

The narrative store tracks `savedNarrativeId`. If the user clicks SAVE twice on the same narrative, the second click checks `state.savedNarrativeId` and returns the existing ID without performing another INSERT. This prevents accidental duplicate rows within a single browser session.

### Auto-save on export

All export actions (PDF, DOCX, Print, Email, Copy) trigger an implicit save before the export happens. The toast "Narrative auto-saved to your history" appears (deduplicated via `{ id: 'auto-save' }`). This ensures every exported narrative exists in the dashboard history.

---

## 19. Export Document Generation

Exports do NOT call the AI. They assemble formatted documents from the existing narrative data.

### Export routes

| Endpoint | Format | Library |
|---|---|---|
| `POST /api/export-pdf` | PDF | jsPDF 4.2+ |
| `POST /api/export-docx` | Word DOCX | docx 9.5+ |
| `POST /api/send-email` | Email via Resend | Resend 6.9+ |
| (client) `buildPrintHtml()` | Print (browser) | — |

### Shared payload interface

```typescript
export interface ExportPayload {
  narrative: {
    block_narrative: string;
    concern: string;
    cause: string;
    correction: string;
  };
  displayFormat: 'block' | 'ccc';
  vehicleInfo: {
    year: string;
    make: string;
    model: string;
    roNumber: string;
  };
}
```

### Document layout (identical across all 4 formats)

1. **Footer logo** — `ServiceDraft-Ai Vector Logo.png`, bottom-right corner, 25×12mm (PDF) / 55×26px (DOCX), 2.09:1 aspect ratio
2. **Two-column header**
   - LEFT column: "Vehicle Information:" bold underlined, followed by label:value lines for Year, Make, Model
   - RIGHT column: "Repair Order #:" bold underlined, followed by the RO number in 20pt bold
3. **Title** — "REPAIR NARRATIVE" in 18pt bold underlined, centered
4. **Body** — either the block narrative as a single paragraph, or three labeled C/C/C sections with 13pt bold italic underlined headers and 11pt regular body text
5. **Font** — Helvetica (PDF) / Arial (DOCX) / inherited (email) / Helvetica (print)

Both `ShareExportModal` (Narrative Page) and `NarrativeDetailModal` (Dashboard) use the same `downloadExport()` function from `src/lib/exportUtils.ts` so documents are always generated identically regardless of where the user exports from.

---

## 20. Email Export via Resend

### Endpoint

`POST /api/send-email`

### Request body

```typescript
{
  recipients: string[],           // Up to 10 email addresses
  senderName: string,              // Display name from user profile
  narrative: NarrativeResponse,
  displayFormat: 'block' | 'ccc',
  vehicleInfo: { year, make, model, roNumber },
}
```

### Resend configuration

- **Sender:** `noreply@servicedraft.ai` (lowercase — capitalization matters for DKIM alignment)
- **Domain:** `servicedraft.ai` verified in Resend dashboard
- **SPF:** `v=spf1 include:resend.com ~all`
- **DKIM:** `resend._domainkey.servicedraft.ai`
- **DMARC:** `p=none`

### Content

Both HTML and plain-text versions are sent. The HTML version is built by `buildEmailHtml()` in `src/lib/exportUtils.ts` and matches the same 2-column header + REPAIR NARRATIVE title + body layout as the PDF/DOCX exports. The plain-text version is built by `buildPlainTextEmail()` as a fallback for clients that don't render HTML.

### Recipient limit

Maximum 10 recipients per send. Enforced in the UI by the multi-email input component and re-validated server-side.

---

## 21. Token Usage Instrumentation

All 6 AI-calling routes are instrumented with fire-and-forget token usage logging.

### Logger

`src/lib/usageLogger.ts` → `logTokenUsage(userId, actionType, usage)`

### Pricing constants

```typescript
const INPUT_COST_PER_TOKEN = 0.0000005;   // $0.50 per 1M tokens
const OUTPUT_COST_PER_TOKEN = 0.000003;   // $3.00 per 1M tokens
```

### Database row written to `api_usage_log`

```typescript
{
  user_id: string,
  action_type: 'generate' | 'customize' | 'proofread' | 'apply_edits' | 'update_narrative' | 'convert_recommendation',
  prompt_tokens: number,
  completion_tokens: number,
  total_tokens: number,
  model_name: 'gemini-3-flash-preview',
  estimated_cost_usd: number,  // computed from prompt and completion tokens
  created_at: timestamp,
}
```

### Fire-and-forget pattern

```typescript
// Called inside the route handler after a successful Gemini call
logTokenUsage(user.id, 'generate', geminiResult.usage);
```

- Never awaited — the response to the user is not blocked
- All errors caught silently inside the logger
- If logging fails, the user's narrative still returns successfully

### 6 instrumented routes

1. `/api/generate` → `generate`
2. `/api/customize` → `customize`
3. `/api/proofread` → `proofread`
4. `/api/apply-edits` → `apply_edits`
5. `/api/update-narrative` → `update_narrative`
6. `/api/convert-recommendation` → `convert_recommendation` (legacy, unused)

### Owner Dashboard API Usage tab

Reads aggregated stats from `GET /api/admin/usage?range=7` (7/30/90/all). Returns:
- `totalTokens`
- `totalCost`
- `tokensByAction` (breakdown per action type)
- `tokensByDay` (time series)
- `topUsersByTokens` (leaderboard)
- `costByDay` (time series)

---

## 22. Rate Limiting & Input Validation

### Rate limiter

`src/lib/rateLimit.ts` — in-memory store that resets on server restart. Each key is scoped per-user-per-action.

### Rate limit configuration

| Route | Limit | Window | Key |
|---|---|---|---|
| `/api/generate` | 20 requests | 15 minutes | `generate:${userId}` |

Currently only `/api/generate` is rate-limited. Other AI routes are not rate-limited because they're less expensive and the generation flow is already the bottleneck.

### Rate limit response

```typescript
{ error: 'Too many requests. Please wait a few minutes before generating again.' }
// HTTP 429
```

### Input length cap

```typescript
if (typeof compiledDataBlock !== 'string' || compiledDataBlock.length > 10000) {
  return NextResponse.json(
    { error: 'Input data exceeds maximum allowed length' },
    { status: 400 },
  );
}
```

The compiled data block is capped at 10,000 characters to prevent abuse and to ensure predictable token costs. Only enforced on `/api/generate`.

### Restriction check

```typescript
const { data: profile } = await supabase
  .from('users')
  .select('is_restricted')
  .eq('id', user.id)
  .single();

if (profile?.is_restricted) {
  return NextResponse.json(
    { error: 'Your account has been restricted. Contact support for assistance.' },
    { status: 403 },
  );
}
```

Restricted accounts cannot generate or update narratives. The `is_restricted` flag is set by the Owner via the User Management table in the Owner Dashboard.

---

## 23. Activity Logging on API Calls

### Logger

`src/lib/activityLogger.ts` — fire-and-forget pattern. All errors caught silently.

### Logged actions

| Action | Source | Metadata captured |
|---|---|---|
| `generate` | Input Page → Generate | storyType, vehicleInfo, narrative preview (500 chars), RO number |
| `regenerate` | Narrative Page → Regenerate | Same as generate |
| `customize` | Narrative Page → Customize | Slider values, custom instructions, narrative preview |
| `proofread` | Narrative Page → Proofread | storyType, overall_rating |
| `save` | Narrative Page → Save | narrative preview, RO number, storyType, narrative ID |
| `export_copy` | Share/Export Modal → Copy | export format |
| `export_print` | Share/Export Modal → Print | export format |
| `export_pdf` | Share/Export Modal → PDF | export format |
| `export_docx` | Share/Export Modal → DOCX | export format |
| `login` | Login page on successful auth | — |

### Fire-and-forget usage

```typescript
import { logActivity } from '@/lib/activityLogger';
logActivity('generate', { storyType, vehicleInfo: `${year} ${make} ${model}` });
// No await — the user's UI action never waits on logging
```

### Database schema

Rows are inserted into `public.activity_log`:

```sql
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  action_type VARCHAR NOT NULL,
  story_type VARCHAR,
  input_data JSONB,
  output_preview TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Critical:** `activity_log.user_id` FK points to `public.users(id)`, NOT `auth.users(id)`. This is required for PostgREST relational joins in the Owner Dashboard Activity Log tab.

---

## 24. Complete API Call Reference

### AI-calling routes (6)

| Endpoint | Method | System Prompt | Purpose |
|---|---|---|---|
| `/api/generate` | POST | `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` or `REPAIR_COMPLETE_SYSTEM_PROMPT` | Initial narrative generation |
| `/api/customize` | POST | `CUSTOMIZATION_SYSTEM_PROMPT` | Post-generation restyling via sliders |
| `/api/proofread` | POST | `PROOFREAD_SYSTEM_PROMPT` or `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` | Audit / authorization-readiness review |
| `/api/apply-edits` | POST | `APPLY_EDITS_SYSTEM_PROMPT` (inline) | Merge selected proofread suggestions |
| `/api/update-narrative` | POST | `SYSTEM_PROMPT` (inline) | Diagnostic → Repair Complete conversion |
| `/api/convert-recommendation` | POST | (legacy, unused) | Originally used for tense conversion |

### Non-AI data routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/narratives` | GET | Fetch saved narratives for authenticated user |
| `/api/narratives/save` | POST | INSERT new narrative (never upsert) |
| `/api/saved-repairs` | GET | List repair templates |
| `/api/saved-repairs` | POST | Create new repair template |
| `/api/saved-repairs/[id]` | PUT | Update specific template |
| `/api/saved-repairs/[id]` | DELETE | Delete specific template |
| `/api/activity-log` | GET | Fetch activity entries |
| `/api/narrative-tracker` | POST | Track narrative interactions |
| `/api/preferences` | GET / PUT | User preferences (JSONB) |
| `/api/me` | GET | Current user profile (used by useAuth hook) |
| `/api/support` | POST | Submit support ticket |

### Export & email routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/export-pdf` | POST | Generate and return PDF |
| `/api/export-docx` | POST | Generate and return DOCX |
| `/api/send-email` | POST | Send narrative via Resend |

### Auth & signup routes (PROTECTED FILES)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Server-side login |
| `/api/auth/logout` | POST | Server-side logout |
| `/api/signup/verify-otp` | POST | OTP code verification (Step 1) |
| `/api/signup/complete-profile` | POST | Password + profile creation (Step 2) |
| `/api/signup/activate` | POST | Access code activation + team assignment (Step 3) |
| `/auth/callback` | GET | Supabase code exchange fallback |

### Admin & team routes (role-gated)

| Endpoint | Method | Role Required | Purpose |
|---|---|---|---|
| `/api/admin` | POST | owner | User management + team CRUD actions |
| `/api/admin/analytics` | GET | owner | Dashboard metrics + systemHealth |
| `/api/admin/usage` | GET | owner | Gemini token usage stats |
| `/api/teams` | GET/POST/PUT/DELETE | admin+ | Team CRUD |
| `/api/teams/members` | GET/POST/DELETE | admin+ | Team member operations |
| `/api/teams/activity` | GET | admin+ | Team-scoped activity log |

### Payment routes (PROTECTED FILES)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/stripe` | POST | Checkout session creation + access code bypass |
| `/api/stripe/webhook` | POST | Stripe webhook handler (signature verification) |

### Account management

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/delete-account` | POST | Self-service account deletion (service role client) |

---

*— End of ServiceDraft.AI Prompt & API Logic Document —*
