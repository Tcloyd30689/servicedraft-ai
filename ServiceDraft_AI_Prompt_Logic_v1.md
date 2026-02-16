# SERVICEDRAFT.AI — PROMPT & API LOGIC DOCUMENT v1.0

## Table of Contents
1. [Prompt Assembly Pipeline Overview](#1-prompt-assembly-pipeline-overview)
2. [Input Field Dropdown Logic](#2-input-field-dropdown-logic)
3. [Main Generate Narrative Prompt — Diagnostic Only](#3-main-generate-narrative-prompt--diagnostic-only)
4. [Main Generate Narrative Prompt — Repair Complete](#4-main-generate-narrative-prompt--repair-complete)
5. [JSON Response Structure & Parsing](#5-json-response-structure--parsing)
6. [Story Audit / Proofreading Prompt](#6-story-audit--proofreading-prompt)
7. [AI Output Customization Panel Logic](#7-ai-output-customization-panel-logic)
8. [Customization-Applied Regeneration Prompt](#8-customization-applied-regeneration-prompt)
9. [Complete API Call Reference](#9-complete-api-call-reference)

---

## 1. Prompt Assembly Pipeline Overview

Every API call in ServiceDraft.AI follows a **prompt assembly pipeline** — meaning the final prompt sent to the AI is never static. It is dynamically constructed based on user selections, field inputs, and customization settings.

### How It Works

```
USER INPUT FIELDS ──► DROPDOWN LOGIC FILTERS ──► PROMPT TEMPLATE ──► GEMINI API
                                                        │
                                                   Customization
                                                   Modifiers (if any)
```

**Step 1:** User fills in fields on the Input Page.
**Step 2:** The app checks each field's dropdown selection and builds a "compiled data block." (R.O. # is excluded — it's saved for database use only.)
**Step 3:** The compiled data block is injected into the appropriate prompt template (Diagnostic Only or Repair Complete).
**Step 4:** The complete prompt is sent to the Gemini API.
**Step 5:** The JSON response is parsed and routed to the correct display areas.
**Step 6:** If the user applies customization, the CURRENTLY DISPLAYED narrative is sent back to the AI with modifier instructions to rewrite it.

---

## 2. Input Field Dropdown Logic

### Overview

Fields 1–5 are **always required** and have no dropdown menu. Fields 6+ each have a dropdown with three options that control how that field's data is handled in the final prompt.

### Dropdown Options & Behavior

#### Option 1: "Include Information"
- **Field becomes REQUIRED** — user must type text before GENERATE STORY enables
- **Prompt behavior:** The field label and the user's entered text are included in the compiled data block exactly as written

**Example compiled line:**
```
CODES PRESENT: P0300, P0301, P0304 — RANDOM/MULTIPLE MISFIRES ON CYLINDERS 1 AND 4
```

#### Option 2: "Don't Include Information"
- **Field is NOT required** — can be left completely empty
- **Prompt behavior:** The field is **completely excluded** from the compiled data block — as if the field does not exist at all. No label, no text, no placeholder.

**Example:** If "Codes Present" is set to "Don't Include Information," the compiled data block simply skips that field entirely. The AI never sees it.

#### Option 3: "Generate Applicable Info"
- **Field is NOT required** — user does NOT need to type anything
- **Prompt behavior:** Instead of user-entered text, a special instruction is injected for that field telling the AI to infer the most probable information based on the other fields the user DID provide.

**Injected instruction per field:**
```
[FIELD NAME]: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable [FIELD NAME] using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.
```

**Example compiled line (for "Root Cause/Failure" set to Generate Applicable Info):**
```
ROOT CAUSE/FAILURE: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable ROOT CAUSE/FAILURE using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.
```

### Compiled Data Block Assembly

**IMPORTANT:** The R.O. # (Field 1) is **never sent to the API**. It is only used for saving the narrative to the user's profile/database. The compiled data block sent to the AI starts with Year, Make, and Model (Fields 2–4), which allow the AI to infer manufacturer-specific processes, system names, and terminology relevant to that vehicle.

The app loops through fields and builds the compiled data block using this logic:

```
SKIP Field 1 (R.O. #) — stored in app state for database save only, never sent to API

FOR EACH REMAINING FIELD:
  ├── If field is REQUIRED (fields 2–5):
  │     └── ADD: "FIELD_LABEL: user_entered_text"
  │
  ├── If dropdown = "Include Information":
  │     └── ADD: "FIELD_LABEL: user_entered_text"
  │
  ├── If dropdown = "Don't Include Information":
  │     └── SKIP — do not add anything for this field
  │
  └── If dropdown = "Generate Applicable Info":
        └── ADD: "FIELD_LABEL: [AI inference instruction]"
```

### Example: Fully Compiled Data Block (Repair Complete)

Assume the user has filled out the form like this:

| Field | Dropdown | User Input |
|-------|----------|------------|
| R.O. # | — (required, saved to database only) | 123456 |
| Year | — (required) | 2022 |
| Make | — (required) | Chevrolet |
| Model | — (required) | Silverado 1500 |
| Customer Concern | — (required) | Engine has a rough idle and check engine light is on |
| Codes Present | Include Information | P0300, P0301, P0304 — random/multiple misfires cyl 1 and 4 |
| Diagnostics Performed | Include Information | Scanned for codes, performed cylinder balance test, checked fuel trims, inspected ignition components |
| Root Cause/Failure | Generate Applicable Info | *(empty — AI will infer)* |
| Repair Performed | Include Information | Replaced spark plugs and ignition coils on cylinders 1 and 4 |
| Repair Verification | Don't Include | *(skipped entirely)* |

**Resulting compiled data block (sent to API):**
```
YEAR: 2022
MAKE: Chevrolet
MODEL: Silverado 1500
CUSTOMER CONCERN: Engine has a rough idle and check engine light is on
CODES PRESENT: P0300, P0301, P0304 — random/multiple misfires cyl 1 and 4
DIAGNOSTICS PERFORMED: Scanned for codes, performed cylinder balance test, checked fuel trims, inspected ignition components
ROOT CAUSE/FAILURE: This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable ROOT CAUSE/FAILURE using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.
REPAIR PERFORMED: Replaced spark plugs and ignition coils on cylinders 1 and 4
```

Notice: "Repair Verification" is completely absent because it was set to "Don't Include Information."

### GENERATE STORY Button Enable/Disable Logic

The button is **DISABLED** until ALL of the following are true:

1. **Fields 1–5** all have text entered (not empty, not just whitespace)
2. **Every field 6+** that has its dropdown set to **"Include Information"** has text entered
3. Fields set to "Don't Include Information" or "Generate Applicable Info" do NOT need text — they are ignored in the validation check

```
BUTTON ENABLED = 
  (field_1 has text) AND
  (field_2 has text) AND
  (field_3 has text) AND
  (field_4 has text) AND
  (field_5 has text) AND
  FOR EACH conditional field (6+):
    IF dropdown = "Include Information" → field must have text
    IF dropdown = "Don't Include Information" → ignored (passes automatically)
    IF dropdown = "Generate Applicable Info" → ignored (passes automatically)
```

---

## 3. Main Generate Narrative Prompt — Diagnostic Only

This prompt is used when the user selects **"DIAGNOSTIC ONLY"** as their story type on the Input Page.

### System Prompt (sent as the system/instruction role)

```
You are an expert-level automotive warranty documentation specialist with extensive knowledge of dealership service operations, warranty claim processing, and professional automotive terminology. You have deep experience writing audit-proof warranty narratives that pass manufacturer review without issue.

Your role is to act as a professional warranty writing assistant. You generate narratives that are professional, detailed, accurate, and written in a natural, easy-to-read style.

CRITICAL RULES:
1. Write in a professional, warranty-appropriate tone at all times.
2. All narrative text must be FULLY CAPITALIZED for visual uniformity.
3. If the root cause or reason for a component failure was not specifically stated, include the most probable technical reason for that failure — every failed component needs a documented "cause" in the narrative.
4. NEVER use the word "damaged" or any language that implies external force, customer misuse, abuse, neglect, or any condition that could be interpreted as invalidating warranty coverage.
5. You ARE allowed and encouraged to use manufacturer-specific terminology, proprietary system names, and OEM-specific language in the generated narrative when the vehicle's year, make, and model are provided. This makes the output more accurate and relevant to the specific vehicle being serviced. Use the vehicle information to infer the correct technical names for systems, components, and procedures specific to that manufacturer.
6. The narrative should read naturally and flow well as a cohesive story, not as a list of bullet points.
7. If diagnostic steps or details seem sparse, you may add reasonable professional language to make the narrative more complete, but do NOT fabricate information that contradicts what was provided.

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

### User Prompt Template

```
Generate an audit-proof warranty narrative based on the following diagnostic-only repair order information. This is a diagnosis-only scenario — the repair has NOT been performed yet. The correction section should describe what repair is RECOMMENDED.

VEHICLE & REPAIR ORDER INFORMATION:
---
{compiled_data_block}
---
```

---

## 4. Main Generate Narrative Prompt — Repair Complete

This prompt is used when the user selects **"REPAIR COMPLETE"** as their story type on the Input Page.

### System Prompt (sent as the system/instruction role)

```
You are an expert-level automotive warranty documentation specialist with extensive knowledge of dealership service operations, warranty claim processing, and professional automotive terminology. You have deep experience writing audit-proof warranty narratives that pass manufacturer review without issue.

Your role is to act as a professional warranty writing assistant. You generate narratives that are professional, detailed, accurate, and written in a natural, easy-to-read style.

CRITICAL RULES:
1. Write in a professional, warranty-appropriate tone at all times.
2. All narrative text must be FULLY CAPITALIZED for visual uniformity.
3. If the root cause or reason for a component failure was not specifically stated, include the most probable technical reason for that failure — every failed component needs a documented "cause" in the narrative.
4. NEVER use the word "damaged" or any language that implies external force, customer misuse, abuse, neglect, or any condition that could be interpreted as invalidating warranty coverage.
5. You ARE allowed and encouraged to use manufacturer-specific terminology, proprietary system names, and OEM-specific language in the generated narrative when the vehicle's year, make, and model are provided. This makes the output more accurate and relevant to the specific vehicle being serviced. Use the vehicle information to infer the correct technical names for systems, components, and procedures specific to that manufacturer.
6. The narrative should read naturally and flow well as a cohesive story, not as a list of bullet points.
7. If diagnostic steps or details seem sparse, you may add reasonable professional language to make the narrative more complete, but do NOT fabricate information that contradicts what was provided.
8. If repair verification steps were provided, incorporate them naturally into the correction section to demonstrate the repair was confirmed successful.

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

### User Prompt Template

```
Generate an audit-proof warranty narrative based on the following completed repair order information. This repair has been fully completed and verified.

VEHICLE & REPAIR ORDER INFORMATION:
---
{compiled_data_block}
---
```

---

## 5. JSON Response Structure & Parsing

### Expected API Response

```json
{
  "block_narrative": "CUSTOMER STATES THE ENGINE HAS A ROUGH IDLE AND THE CHECK ENGINE LIGHT IS ILLUMINATED. TECHNICIAN CONNECTED THE DIAGNOSTIC SCAN TOOL AND RETRIEVED DIAGNOSTIC TROUBLE CODES P0300, P0301, AND P0304 INDICATING RANDOM AND MULTIPLE MISFIRES ON CYLINDERS 1 AND 4. PERFORMED A CYLINDER BALANCE TEST WHICH CONFIRMED THE MISFIRE CONDITIONS ON THE AFFECTED CYLINDERS. CHECKED FUEL TRIM DATA AND FOUND VALUES WITHIN ACCEPTABLE RANGE, RULING OUT FUEL DELIVERY CONCERNS. UPON INSPECTION OF THE IGNITION COMPONENTS, FOUND THE SPARK PLUGS ON CYLINDERS 1 AND 4 TO BE EXCESSIVELY WORN WITH DEGRADED ELECTRODE GAPS, AND THE CORRESPONDING IGNITION COILS SHOWED SIGNS OF INTERNAL INSULATION BREAKDOWN DUE TO NORMAL WEAR AND EXTENDED USE. THE WORN IGNITION COMPONENTS WERE UNABLE TO PRODUCE CONSISTENT SPARK UNDER LOAD, RESULTING IN THE MISFIRE CONDITIONS. REPLACED THE SPARK PLUGS AND IGNITION COILS ON CYLINDERS 1 AND 4. CLEARED ALL DIAGNOSTIC TROUBLE CODES AND PERFORMED A ROAD TEST TO VERIFY THE REPAIR. ENGINE IDLE IS NOW SMOOTH AND NO MISFIRES ARE PRESENT. VEHICLE IS OPERATING AS DESIGNED.",

  "concern": "CUSTOMER STATES THE ENGINE HAS A ROUGH IDLE AND THE CHECK ENGINE LIGHT IS ILLUMINATED.",

  "cause": "TECHNICIAN CONNECTED THE DIAGNOSTIC SCAN TOOL AND RETRIEVED DIAGNOSTIC TROUBLE CODES P0300, P0301, AND P0304 INDICATING RANDOM AND MULTIPLE MISFIRES ON CYLINDERS 1 AND 4. PERFORMED A CYLINDER BALANCE TEST WHICH CONFIRMED THE MISFIRE CONDITIONS ON THE AFFECTED CYLINDERS. CHECKED FUEL TRIM DATA AND FOUND VALUES WITHIN ACCEPTABLE RANGE, RULING OUT FUEL DELIVERY CONCERNS. UPON INSPECTION OF THE IGNITION COMPONENTS, FOUND THE SPARK PLUGS ON CYLINDERS 1 AND 4 TO BE EXCESSIVELY WORN WITH DEGRADED ELECTRODE GAPS, AND THE CORRESPONDING IGNITION COILS SHOWED SIGNS OF INTERNAL INSULATION BREAKDOWN DUE TO NORMAL WEAR AND EXTENDED USE. THE WORN IGNITION COMPONENTS WERE UNABLE TO PRODUCE CONSISTENT SPARK UNDER LOAD, RESULTING IN THE MISFIRE CONDITIONS.",

  "correction": "REPLACED THE SPARK PLUGS AND IGNITION COILS ON CYLINDERS 1 AND 4. CLEARED ALL DIAGNOSTIC TROUBLE CODES AND PERFORMED A ROAD TEST TO VERIFY THE REPAIR. ENGINE IDLE IS NOW SMOOTH AND NO MISFIRES ARE PRESENT. VEHICLE IS OPERATING AS DESIGNED."
}
```

### Parsing Logic

```
ON API RESPONSE:
  1. Parse JSON response into object
  2. Store all four values in application state:
     - state.blockNarrative = response.block_narrative
     - state.concern = response.concern
     - state.cause = response.cause
     - state.correction = response.correction
  3. Default display = BLOCK FORMAT → show state.blockNarrative
  4. When user clicks "C/C/C FORMAT" toggle → show concern, cause, correction as separate labeled sections
  5. When user clicks "BLOCK FORMATTING" toggle → show blockNarrative again
```

### Display Rendering

**Block Format (Default):**
```
┌─────────────────────────────────────────┐
│                                         │
│  {state.blockNarrative}                 │
│                                         │
└─────────────────────────────────────────┘
```

**C/C/C Format (Toggled):**
```
┌─────────────────────────────────────────┐
│  CONCERN:                               │
│  {state.concern}                        │
│                                         │
│  CAUSE:                                 │
│  {state.cause}                          │
│                                         │
│  CORRECTION:                            │
│  {state.correction}                     │
└─────────────────────────────────────────┘
```

### Error Handling

If the API response is not valid JSON or is missing any of the four required keys:

```
ON PARSE ERROR:
  1. Show error toast: "There was an issue generating your narrative. Please try again."
  2. Re-enable the REGENERATE STORY button
  3. Log the raw response for debugging
  4. Do NOT display partial/broken data to the user
```

---

## 6. Story Audit / Proofreading Prompt

This prompt is triggered when the user clicks **"REVIEW & PROOFREAD STORY"** on the Generated Narrative Page. It takes the CURRENT narrative text (including any manual edits the user may have made) and audits it for warranty compliance issues.

### System Prompt

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
10. Any manufacturer-specific branding or proprietary terminology that should be replaced with universal language

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
  "summary": "Brief one-sentence overall assessment of the narrative quality"
}

RULES:
- Each flagged issue should have a corresponding suggested edit at the same array index.
- If the narrative passes audit with no issues found, return empty arrays for both flagged_issues and suggested_edits, with overall_rating "PASS".
- The overall_rating should be:
  - "PASS" — No issues found, narrative is audit-ready
  - "NEEDS_REVIEW" — Minor issues found that should be addressed but may not cause rejection
  - "FAIL" — Critical issues found that are very likely to cause claim rejection
- Be specific in your suggestions — don't just say "fix the language," tell the user exactly what to change and what to change it to.
- Keep all feedback professional and constructive.
```

### User Prompt Template

```
Review the following warranty narrative for audit compliance issues. Identify any language, missing information, or structural problems that could cause this claim to be flagged or rejected during a manufacturer warranty audit.

STORY TYPE: {story_type}
VEHICLE: {year} {make} {model}

NARRATIVE TO REVIEW:
---
CONCERN: {current_concern_text}

CAUSE: {current_cause_text}

CORRECTION: {current_correction_text}
---
```

**Note:** The narrative sent for review should always be the CURRENT text, including any edits the user has made through the Edit Story modal. This ensures the audit reflects the actual text that would be submitted.

### Response Parsing

```
ON AUDIT RESPONSE:
  1. Parse JSON response
  2. Populate "Flagged Issues" box:
     - Join flagged_issues array with line breaks
     - Each issue displayed as a numbered item
     - Apply typing animation effect
  3. Populate "Suggested Edits" box:
     - Join suggested_edits array with line breaks
     - Each suggestion displayed as a numbered item
     - Apply typing animation effect
  4. Display overall_rating as a visual badge:
     - PASS → Green badge
     - NEEDS_REVIEW → Yellow/amber badge
     - FAIL → Red badge
  5. Display summary text below the badge
```

### Example Response

```json
{
  "flagged_issues": [
    "The phrase 'CUSTOMER CAUSED THE COMPONENT TO FAIL' directly implies customer fault and will flag an audit.",
    "No repair verification step is documented — the narrative does not mention confirming the repair was successful.",
    "The root cause states the part was 'DAMAGED' which suggests external force rather than normal wear."
  ],
  "suggested_edits": [
    "Replace 'CUSTOMER CAUSED THE COMPONENT TO FAIL' with 'THE COMPONENT WAS FOUND TO HAVE FAILED DUE TO NORMAL WEAR AND INTERNAL DEGRADATION.'",
    "Add a verification step such as: 'CLEARED ALL DIAGNOSTIC TROUBLE CODES AND PERFORMED A ROAD TEST TO VERIFY THE REPAIR. VEHICLE IS OPERATING AS DESIGNED.'",
    "Replace 'DAMAGED' with 'FOUND TO HAVE FAILED DUE TO INTERNAL WEAR' or 'EXHIBITED SIGNS OF NORMAL MATERIAL DEGRADATION.'"
  ],
  "overall_rating": "FAIL",
  "summary": "Narrative contains language that directly implies customer fault and is missing verification steps — both are critical audit flags that need to be addressed before submission."
}
```

---

## 7. AI Output Customization Panel Logic

### Overview

The customization panel gives users control over three narrative characteristics via sliders, plus a free-text field for custom instructions. When the user clicks "APPLY CUSTOMIZATION TO STORY," the app takes the ORIGINAL input data (not the current narrative text) and regenerates with modified prompt instructions.

### Slider Definitions

#### Length Slider (3 positions)

| Position | Value | Prompt Modifier |
|----------|-------|-----------------|
| Left | Short | `LENGTH PREFERENCE: Generate a concise narrative. Keep the story brief and to the point — include only the essential information needed for the warranty claim. Aim for 3-5 sentences total.` |
| Center | Standard | *(no modifier added — this is the default behavior)* |
| Right | Detailed | `LENGTH PREFERENCE: Generate a detailed, thorough narrative. Include expanded descriptions of diagnostic steps, detailed technical reasoning for the root cause, and comprehensive repair/verification information. Aim for a robust, in-depth story that leaves no questions for an auditor.` |

#### Tone Slider (3 positions)

| Position | Value | Prompt Modifier |
|----------|-------|-----------------|
| Left | Warranty | `TONE PREFERENCE: Write in a strict warranty-formal tone. Use precise technical language, maintain a formal structure, and prioritize language that is specifically optimized for passing manufacturer warranty audits. Avoid any conversational or explanatory language.` |
| Center | Standard | *(no modifier added — this is the default behavior)* |
| Right | Customer Friendly | `TONE PREFERENCE: Write in a tone that is professional but also easy for a non-technical person to understand. While maintaining accuracy and audit compliance, use language that a customer or service advisor could read and clearly understand what was wrong, what was done, and why. Avoid overly technical jargon where a plain-language alternative exists.` |

#### Detail Level Slider (3 positions)

| Position | Value | Prompt Modifier |
|----------|-------|-----------------|
| Left | Concise | `DETAIL LEVEL PREFERENCE: Keep diagnostic and repair steps concise. Summarize the diagnostic process and repair steps without listing every individual action. Focus on the key findings and actions.` |
| Center | Standard | *(no modifier added — this is the default behavior)* |
| Right | Additional Steps | `DETAIL LEVEL PREFERENCE: Include additional professional diagnostic and repair steps that a qualified technician would typically perform in this scenario, even if they were not explicitly listed in the input. Add reasonable verification checks, preliminary inspections, and supplementary steps that strengthen the narrative and demonstrate thoroughness.` |

### Custom Instructions Field

A free-text field where the user can type any additional instructions they want applied to the regeneration. This text is appended to the prompt exactly as written.

**Examples of what a user might type:**
- "Make sure to mention the TSB number 22-NA-123"
- "Emphasize that the part was an internal electrical failure"
- "Don't mention the transmission fluid flush"
- "Keep the concern section very short"

### How Customization Modifiers Are Applied

When the user clicks "APPLY CUSTOMIZATION TO STORY," the app takes the **currently displayed narrative** and sends it back to the AI with instructions to rewrite it according to the slider preferences. This means customization modifies the story the user is already looking at — it does NOT go back to the original input fields.

**Why this approach:**
- The user may have already edited the story via the Edit Story modal — customization should respect those edits
- If the user hit Regenerate and got a variation they liked, customization should modify THAT version
- It's faster and more intuitive — "adjust what I'm looking at" rather than "start over with different settings"

**Process:**

1. Reads the **current narrative text** from the display state (block_narrative, concern, cause, correction — including any manual edits)
2. Uses a **customization-specific system prompt** (see Section 8)
3. **Builds a user prompt** that includes the current narrative text + all active customization modifiers
4. Sends to the API
5. Parses the new JSON response and replaces the current narrative display

```
CUSTOMIZATION ASSEMBLY:

current_narrative = read current state (block_narrative, concern, cause, correction)
story_type = stored story type from original generation

customization_block = ""

IF length_slider != "Standard":
  customization_block += length_modifier + "\n"

IF tone_slider != "Standard":
  customization_block += tone_modifier + "\n"

IF detail_slider != "Standard":
  customization_block += detail_modifier + "\n"

IF custom_instructions_field is NOT empty:
  customization_block += "ADDITIONAL INSTRUCTIONS: " + custom_instructions_text + "\n"

IF customization_block is NOT empty:
  send customization API call with current_narrative + customization_block
ELSE:
  do nothing — show toast: "Adjust at least one slider or add custom instructions before applying."
```

### Customization State Management

- Slider positions are **preserved** during the session — if a user changes them and applies, then toggles the panel off and back on, the sliders should still show their current positions
- Customization settings do NOT carry over to a new narrative generation — if the user goes back to the Input Page and generates a brand new story, all sliders reset to "Standard"
- The "REGENERATE STORY" button always uses the **original compiled data block** to generate a fresh variation from the base prompt — it ignores customization settings entirely
- Customization can be applied **multiple times** — each application reads the currently displayed narrative (which may already be a customized version) and modifies it further
- If all sliders are at "Standard" and the custom instructions field is empty, the "APPLY CUSTOMIZATION TO STORY" button should show a toast: "Adjust at least one slider or add custom instructions before applying."

---

## 8. Customization-Applied Regeneration Prompt

Customization uses a **dedicated system prompt** since it's rewriting an existing narrative rather than generating from raw input data.

### System Prompt (Customization-Specific)

```
You are an expert-level automotive warranty documentation specialist. You are being given an existing warranty narrative that needs to be rewritten according to specific customization preferences.

Your job is to take the provided narrative and rewrite it while:
1. Preserving ALL factual information — do not add, remove, or change any facts, diagnostic codes, part names, procedures, or findings unless a customization preference specifically asks for it.
2. Maintaining FULL CAPITALIZATION throughout all text.
3. Keeping the narrative audit-proof — NEVER introduce language that implies external damage, customer misuse, abuse, or neglect.
4. Applying the customization preferences provided below to adjust the style, length, tone, and/or detail level of the narrative.

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

### User Prompt Template (Customization)

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

### Complete Example: Repair Complete + Short Length + Customer Friendly Tone

**System Prompt:** *(Customization-specific system prompt above)*

**User Prompt:**
```
Rewrite the following warranty narrative according to the customization preferences listed below. Preserve all factual content — only adjust the style, length, tone, and detail level as specified.

STORY TYPE: Repair Complete

CURRENT NARRATIVE:
---
CONCERN: CUSTOMER STATES THE ENGINE HAS A ROUGH IDLE AND THE CHECK ENGINE LIGHT IS ILLUMINATED.

CAUSE: TECHNICIAN CONNECTED THE DIAGNOSTIC SCAN TOOL AND RETRIEVED DIAGNOSTIC TROUBLE CODES P0300, P0301, AND P0304 INDICATING RANDOM AND MULTIPLE MISFIRES ON CYLINDERS 1 AND 4. PERFORMED A CYLINDER BALANCE TEST WHICH CONFIRMED THE MISFIRE CONDITIONS ON THE AFFECTED CYLINDERS. CHECKED FUEL TRIM DATA AND FOUND VALUES WITHIN ACCEPTABLE RANGE, RULING OUT FUEL DELIVERY CONCERNS. UPON INSPECTION OF THE IGNITION COMPONENTS, FOUND THE SPARK PLUGS ON CYLINDERS 1 AND 4 TO BE EXCESSIVELY WORN WITH DEGRADED ELECTRODE GAPS, AND THE CORRESPONDING IGNITION COILS SHOWED SIGNS OF INTERNAL INSULATION BREAKDOWN DUE TO NORMAL WEAR AND EXTENDED USE.

CORRECTION: REPLACED THE SPARK PLUGS AND IGNITION COILS ON CYLINDERS 1 AND 4. CLEARED ALL DIAGNOSTIC TROUBLE CODES AND PERFORMED A ROAD TEST TO VERIFY THE REPAIR. ENGINE IDLE IS NOW SMOOTH AND NO MISFIRES ARE PRESENT. VEHICLE IS OPERATING AS DESIGNED.
---

CUSTOMIZATION PREFERENCES:
LENGTH PREFERENCE: Generate a concise narrative. Keep the story brief and to the point — include only the essential information needed for the warranty claim. Aim for 3-5 sentences total.
TONE PREFERENCE: Write in a tone that is professional but also easy for a non-technical person to understand. While maintaining accuracy and audit compliance, use language that a customer or service advisor could read and clearly understand what was wrong, what was done, and why. Avoid overly technical jargon where a plain-language alternative exists.
```

**Note:** The customization prompt sends the CURRENT narrative text (which may include user edits or previous customizations), not the original input data. This means the AI is rewriting what the user is currently looking at.

---

## 9. Complete API Call Reference

### Summary Table

| API Call | Trigger | System Prompt | User Prompt | Input Data |
|----------|---------|---------------|-------------|------------|
| **Generate Narrative (Diagnostic)** | GENERATE STORY button (Diagnostic Only selected) | Section 3 System Prompt | Section 3 User Prompt + compiled data | Compiled data block (no R.O. #) |
| **Generate Narrative (Repair)** | GENERATE STORY button (Repair Complete selected) | Section 4 System Prompt | Section 4 User Prompt + compiled data | Compiled data block (no R.O. #) |
| **Regenerate Story** | REGENERATE STORY button | Same system prompt as original generation | Same user prompt as original generation | Original compiled data block (fresh variation) |
| **Apply Customization** | APPLY CUSTOMIZATION TO STORY button | Section 8 Customization System Prompt | Section 8 User Prompt + current narrative + modifiers | Current displayed narrative text |
| **Review & Proofread** | REVIEW & PROOFREAD STORY button | Section 6 System Prompt | Section 6 User Prompt + current narrative text | Current displayed narrative text |

### Data Flow Per Call

**Generate / Regenerate:**
```
INPUT: compiled_data_block (from Input Page fields + dropdown logic, excluding R.O. #)
OUTPUT: JSON with block_narrative, concern, cause, correction
DISPLAY: Narrative display area (block or C/C/C format)
ANIMATION: Loading spinner → typing animation for text
```

**Apply Customization:**
```
INPUT: Current displayed narrative text (concern, cause, correction — including any user edits or prior customizations)
OUTPUT: JSON with block_narrative, concern, cause, correction (rewritten version)
DISPLAY: Replaces current narrative display (block or C/C/C format)
ANIMATION: Loading spinner → typing animation for text
```

**Review & Proofread:**
```
INPUT: Current narrative text (concern, cause, correction — including user edits)
OUTPUT: JSON with flagged_issues, suggested_edits, overall_rating, summary
DISPLAY: Flagged Issues box, Suggested Edits box, rating badge
ANIMATION: Loading spinner → typing animation for flagged/suggested text
```

### Important Notes

1. **Regenerate** re-sends the exact same prompt as the original generation (using the stored compiled data block). The AI will naturally produce a variation because of how language models work. No changes to the prompt are needed.

2. **Apply Customization** reads the CURRENT displayed narrative (not the original compiled data block) and sends it to the AI with rewriting instructions. This means user edits and prior customizations are preserved and modified — not overwritten.

3. **The compiled data block must be stored in application state** after the initial generation so it can be re-used for Regenerate calls without requiring the user to go back to the Input Page.

4. **The story type (Diagnostic Only vs. Repair Complete) must also be stored in state** so the correct system prompt is used for Regenerate, and so the customization prompt can reference the story type.

5. **The current narrative text (including any user edits from the Edit Story modal) must be read from the display state** at the time Apply Customization or Review & Proofread is clicked.

6. **R.O. # is NEVER sent to the API** — it is stored in application state solely for saving the narrative to the user's profile/database. Year, Make, and Model ARE sent to the API so the AI can infer manufacturer-specific processes, system names, and terminology relevant to that specific vehicle.

7. **The AI's generated output CAN and SHOULD contain manufacturer-specific terminology** (e.g., "Active Fuel Management," "StabiliTrak," "OnStar Diagnostics") when the vehicle year/make/model makes it relevant. This is intentional — it produces more accurate, professional narratives. The restriction on brand-neutral language applies only to the application's own source code, UI text, and hardcoded prompt strings — NOT to the AI's generated output.

---

*— End of Prompt & API Logic Document v1.0 —*
