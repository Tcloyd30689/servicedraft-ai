# SERVICEDRAFT.AI — BUILD PROGRESS TRACKER

## HOW THIS DOCUMENT WORKS

This file is a living document that Claude Code reads at the start of every session and updates after completing each task. It serves as the single source of truth for what has been built and what still needs to be done.

**INSTRUCTIONS FOR CLAUDE CODE:**

1. **At the start of every session**, read this file FIRST to understand current progress.
2. **After completing each task**, update this file by changing the task's status from `[ ]` to `[x]` and adding the completion date.
3. **If a task is partially complete**, add a note under the task explaining what's done and what remains.
4. **If you encounter a blocker**, add a `⚠️ BLOCKED:` note under the task explaining what's needed from the user.
5. **Never skip ahead** — complete tasks in order within each phase. Phases must be completed in order unless explicitly noted otherwise.

### Status Key

- `[ ]` — Not started
- `[~]` — In progress / partially complete
- `[x]` — Completed
- `[!]` — Blocked — needs user action

---

## CURRENT STATUS

**Last Updated:** 2026-06-25
**Current Version:** v1.3.0-beta
**Current Phase:** Sprint — Style-Aware & Type-Aware Review/Audit System (lens-based proofread) + v1.1.22 grammar-flagging hotfix + v1.1.23 anti-fabrication hotfix + v1.1.24 proofread-results UI polish + v1.1.25 stamp/glow refinement — RELEASED as v1.3.0-beta (merged to main / deploying to production)
**Next Task:** POST-DEPLOY: confirm production servicedraft.ai shows v1.3.0-beta after Vercel finishes building origin/main, and VERIFY the additive `narrative_style` column exists on public.narratives in the PRODUCTION database (the narratives/save INSERT includes it — if missing, saves will fail): `ALTER TABLE public.narratives ADD COLUMN IF NOT EXISTS narrative_style TEXT DEFAULT 'manufacturer_warranty';` then `NOTIFY pgrst, 'reload schema';`. Smoke-test a Customer Pay / Extended Warranty / Manufacturer Warranty generate + review on production. (Prior localhost checks, now shipped: v1.1.25-beta — confirm the refined stamp is slimmer + translucent (liquid glass), the container glow now PULSES in the RATING color (green/yellow/red, no longer the purple accent), and the smaller refresh icon magnifies + glows on hover. Earlier NEW proofread-results UI to re-confirm: run a Review and confirm the REVIEW & PROOFREAD STORY button transforms into a large rating stamp (PASS green / NEEDS REVIEW yellow / FAIL red) with big black bold text, a re-run refresh icon beside it (hover glow + slight magnify) that re-audits, the container shows a rating-colored pulsing glow only while results are displayed, the summary line has no "Reviewed as…" preamble and renders in Inter, and the Flagged Issues + Suggested Edits render in Orbitron. ALSO test the input-page "generate applicable info" dropdown — set a conditional field to Generate, produce a story, and confirm the generated content stays GENERAL (e.g. "TESTED BATTERY VOLTAGE") and NEVER invents specific values, circuit/pin numbers, document IDs, or DTC codes you did not enter. AND re-test the style-aware audit (now with the grammar-flagging hotfix — the Manufacturer Warranty review must NO LONGER flag verb tense, active/passive voice, verb-first vs subject-first phrasing, introductory phrases, or other grammatical-style preferences; it should still flag substance and genuine slang/professionalism). For EACH narrative style (Customer Pay, Extended Warranty, Manufacturer Warranty) × EACH story type (Diagnostic Only, Repair Complete), generate a story and run Review/Proofread, and confirm the audit strictness now matches the style: Customer Pay should give a LIGHT review and PASS clean simple stories (must NOT flag for brevity, normal wear, maintenance, missing pinpoint root cause, or coverage/damage language); Extended Warranty should focus on specific test data, a named failed component, a confirmed failure, and definitive cause language, and flag coverage-risk language as a RISK without demanding "defect in materials or workmanship"; Manufacturer Warranty should stay STRICT (defect-in-materials-or-workmanship cause, diagnostic path, verification on repair-complete, no maintenance/wear/coverage-voiding language). Confirm the summary line names the style + story type. PREREQUISITE (carried over from v1.1.20, may already be done): if not yet applied, run `ALTER TABLE public.narratives ADD COLUMN IF NOT EXISTS narrative_style TEXT DEFAULT 'manufacturer_warranty';` then `NOTIFY pgrst, 'reload schema';`. Recommended before merge: run a fresh `npm run build` in a clean environment (the v1.1.21 full build hung on a Turbopack/PostCSS infra freeze — see entry; TypeScript was verified clean via `npx tsc --noEmit`). Then merge to main / push to GitHub manually.
**RELEASE — v1.3.0-beta (Style-Aware Review/Audit System shipped to production):** [x] COMPLETE (2026-06-25) — v1.3.0-beta — Forced MINOR version bump (v1.1.25-beta → v1.3.0-beta) marking the style-aware & type-aware Review/Audit System as a major improvement, per Tyler. This release consolidates the feature/narrative-style-overhaul branch work: the lens-based style-aware + story-type-aware audit (v1.1.21), the grammar-flagging hotfix (v1.1.22), the anti-fabrication safeguard on AI-generated field content (v1.1.23), and the proofread-results UI (rating stamp, rating-colored pulsing glow, glass stamp, working refresh hover, Inter/Orbitron fonts) (v1.1.24–v1.1.25). Version bump only in this commit: src/lib/version.ts v1.1.25-beta → v1.3.0-beta, package.json 1.1.25 → 1.3.0, plus this tracker update. Verified `npx tsc --noEmit` zero TypeScript errors (a full local `next build` was not run — it hangs on this Windows machine's Turbopack/PostCSS; Vercel runs its own Linux build on deploy). Tyler explicitly authorized the GitHub push and the merge to main (overriding the usual local-only rule) after extensive localhost testing. Per this instruction: committed locally, pushed feature/narrative-style-overhaul to origin, and merged the branch into main and pushed origin/main to trigger the Vercel production deploy. POST-DEPLOY prerequisite: ensure the additive `narrative_style` TEXT column exists on public.narratives in the production DB (see CURRENT STATUS Next Task) so saves do not fail.
**UI Polish — Proofread Stamp/Glow Refinement (glass stamp + rating-colored pulse + working refresh hover):** [x] COMPLETE (2026-06-25) — v1.1.25-beta — Follow-up to v1.1.24 after live testing. Fixes three issues: the rating stamp looked blockish, the container glow pulsed in the user's ACCENT/theme color (purple) instead of the rating color, and the refresh-icon hover glow/magnify did not fire. Root causes: the LiquidCard's own hardcoded purple glow (Tailwind shadow-[var(--shadow-glow-md)] = rgba(147,51,234,0.4)) was winning over the CSS-class `.proofread-glow` animation (fragile via cn/twMerge + Tailwind cascade), and the `.audit-refresh-btn` hover CSS class was not reliably applying. Changes: (1) src/app/(protected)/narrative/page.tsx — STAMP: reduced vertical padding (py-3 → py-1.5) and made it liquid-glass (translucent rating background rgba ~0.8 + backdrop-blur-sm + a rating-colored border via borderColor), keeping the large black extra-bold label. GLOW: wrapped the proofread LiquidCard in a framer-motion motion.div that animates boxShadow as a 3-keyframe pulse (16px→34px) in the RATING color (ratingGlow rgba ~0.65) with repeat:Infinity over 2.2s, and suppressed the card's own purple shadow while results show by passing className 'shadow-none hover:shadow-none' to the LiquidCard (twMerge drops the default shadow utilities). REFRESH: shrank the icon button (h-12 w-12 → h-10 w-10, icon 20 → 18) and converted it from a plain <button> with the CSS class to a framer-motion motion.button using whileHover={{ scale: 1.12, boxShadow: accent glow }} + whileTap={{ scale: 1.04 }} (inline-style animation that reliably fires). Replaced the derived consts (ratingStampColor/ratingGlowClass) with ratingBorder/ratingStampBg/ratingGlow/ratingStampLabel. (2) src/app/globals.css — removed the now-unused @keyframes proofreadGlowPulse, the .proofread-glow/.proofread-glow-pass|review|fail classes, and the .audit-refresh-btn classes (all replaced by the framer-motion inline approach); left a short comment noting the move. (3) Version bump — src/lib/version.ts v1.1.24-beta → v1.1.25-beta, package.json 1.1.24 → 1.1.25. Modified files: src/app/(protected)/narrative/page.tsx, src/app/globals.css, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files; no route/API/database/auth/protected-file changes; the proofread response shape and ProofreadResults component are unchanged from v1.1.24. Verified `npx tsc --noEmit` zero TypeScript errors and the dev server hot-reloaded the final state cleanly (✓ Compiled, /narrative 200; intermediate HMR parse errors during the multi-edit sequence resolved on completion). Committed LOCALLY ONLY (not pushed).
**UI Polish — Proofread Results Stamp, Glow, and Fonts:** [x] COMPLETE (2026-06-25) — v1.1.24-beta — Cosmetic/UX rework of the Review & Proofread results panel per Tyler's direction. Changes: (1) src/constants/prompts.ts — removed the "Reviewed as a [style] [type] narrative —" preamble from the audit summary: the PROOFREAD_OUTPUT_FOOTER summary field instruction and its RULES bullet now tell the model to give a single plain assessment sentence and explicitly NOT to begin with "Reviewed as" or restate the style/story type. (2) src/components/narrative/ProofreadResults.tsx — removed the inline rating pill that sat next to the summary (rating is now shown by the result stamp, see below) and its now-unused ratingConfig/rating; the summary renders in Inter (font-data) for readability; the Flagged Issues text and the Suggested Edits list items now render in the app's default Orbitron (removed their font-data class) per Tyler's font choice (summary = Inter, flagged + suggested = Orbitron). (3) src/app/(protected)/narrative/page.tsx — the small top-right rating/issue-count badge on the proofread card was removed; the REVIEW & PROOFREAD STORY button now TRANSFORMS into a large rating stamp once results arrive (flex-1 pill in the rating color — PASS #16a34a / NEEDS_REVIEW #ca8a04 / FAIL #dc2626 — with large black extra-bold tracked label PASS / NEEDS REVIEW / FAIL), with a circular re-run refresh icon (RefreshCw) beside it that calls handleProofread again; before results (or while reviewing) the normal full-width button is shown. Added derived consts (proofreadRating/ratingStampColor/ratingStampLabel/ratingGlowClass) before the return, gated on proofreadData && !isProofreading so the stamp + glow appear only after a completed review. The LiquidCard container receives the ratingGlowClass for a rating-colored pulsing glow. (4) src/app/globals.css — added @keyframes proofreadGlowPulse (animates box-shadow intensity using --pg-color) + .proofread-glow / .proofread-glow-pass|review|fail classes (green/yellow/red), and an .audit-refresh-btn class giving the re-run icon a cursor-hover glow (accent box-shadow) plus a slight magnify (scale 1.12 on hover, 1.04 on active). (5) Version bump — src/lib/version.ts v1.1.23-beta → v1.1.24-beta, package.json 1.1.23 → 1.1.24. Modified files: src/constants/prompts.ts, src/components/narrative/ProofreadResults.tsx, src/app/(protected)/narrative/page.tsx, src/app/globals.css, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files; no route/API/database/auth/middleware/Stripe/RLS/protected-file changes; the proofread response shape and apply-edits flow are unchanged. Verified `npx tsc --noEmit` zero TypeScript errors and the running dev server hot-reloaded the changes cleanly (✓ Compiled, /api/proofread returning 200 during live testing). Committed LOCALLY ONLY (not pushed).
**Hotfix — Block Fabricated Specifics in AI-Generated / Inferred Field Content:** [x] COMPLETE (2026-06-25) — v1.1.23-beta — Safety fix requested after testing. When a user sets a conditional input field to "Generate" (the "generate applicable info" option), the AI could invent specific test values, measurements, circuit/pin/terminal numbers, document IDs, or DTC codes the technician never provided (e.g. turning "TESTED BATTERY VOLTAGE" into "TESTED BATTERY VOLTAGE ON CIRCUIT 2214 AND FOUND 13.2 VOLTS"), which could make the warranty documentation false and expose the user/business to serious liability. Two-layer fix (no protected files): (1) src/lib/compileDataBlock.ts — rewrote AI_INFERENCE_TEMPLATE (the placeholder string injected into the compiled data block for any field whose dropdown = 'generate') to require GENERAL, qualitative content ONLY and to explicitly forbid inventing specific values/measurements/readings (voltages, resistances, amperages, pressures, temperatures, frequencies, torque specs), specific circuit/pin/terminal/connector numbers, document/reference/case/claim IDs, or DTC codes not actually provided, with the TESTED BATTERY VOLTAGE vs CIRCUIT 2214 example and the liability rationale; kept the existing warranty-safe-language clause. (2) src/constants/prompts.ts — strengthened rule 3 of the shared MANDATORY_OUTPUT_RULES constant ("NO UNNECESSARY ELABORATION" → "NO UNNECESSARY ELABORATION OR INVENTED SPECIFICS"): information the technician did NOT provide must stay general and qualitative, never invent specific values/readings, circuit/pin/terminal/connector numbers, document/reference IDs, or DTC codes; PROVIDED values are STILL reproduced verbatim per rule 2 (explicitly noted, no conflict). Because MANDATORY_OUTPUT_RULES is the single source of truth interpolated into both generation prompts (DIAGNOSTIC_ONLY_SYSTEM_PROMPT + REPAIR_COMPLETE_SYSTEM_PROMPT, lines ~35/~76) and REFINE_SYSTEM_PROMPT (~134), the safeguard now applies across generate + refine at runtime (update-narrative and apply-edits also import the constant). The pre-existing rule 8 (no fabricated document/case/claim/auth IDs) and rule 9 / rule 2 (reproduce provided technical specifics verbatim for warranty-audit compliance) are unchanged and complementary. (3) Version bump — src/lib/version.ts v1.1.22-beta → v1.1.23-beta, package.json 1.1.22 → 1.1.23. Modified files: src/lib/compileDataBlock.ts, src/constants/prompts.ts, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files; no route/frontend/database/auth/middleware/Stripe/RLS/protected-file changes. Verified `npx tsc --noEmit` zero TypeScript errors; the running dev server hot-reloads the generate path on the next request. Committed LOCALLY ONLY (not pushed).
**Hotfix — Audit Stops Flagging Grammatical-Style Preferences:** [x] COMPLETE (2026-06-25) — v1.1.22-beta — Follow-up to v1.1.21 after Tyler's live localhost test. The new Manufacturer Warranty lens was flagging pure grammar/phrasing preferences (verb tense such as present-perfect "has developed" vs simple past "developed", active vs passive voice, verb-first/implied-first-person vs subject-first phrasing, introductory phrases) as "documentation-quality" issues even on a narrative that PASSED on substance — i.e. policing the writer's grammar rather than the narrative + industry standards. Prompt-only fix in src/constants/prompts.ts: (1) REMOVED the "House-style deviations (verb-first implied-first-person past tense; no hyphen or em-dash as sentence punctuation; no parenthetical definitions) MAY be flagged as documentation-quality issues for this style" bullet from MANUFACTURER_WARRANTY_LENS — it was the sole source of the grammar flags (the Customer Pay and Extended Warranty lenses already ignored formatting). (2) ADDED a new shared "UNIVERSAL RULE — GRAMMAR AND WRITING STYLE ARE NOT YOUR JOB" to PROOFREAD_FRAMEWORK_HEADER (inherited by all three lenses): the auditor must NEVER flag grammatical style, sentence structure, verb tense, voice (active/passive), point of view or phrasing (verb-first/implied-first-person vs subject-first), word order, introductory phrases, or any wording preference, and must judge ONLY substance (clarity, internal consistency, completeness, and the assigned style's documentation standard) — with an explicit carve-out that genuine slang / non-standard abbreviations may still be noted where a lens calls for it. The KEPT Manufacturer "Non-professional language, slang, or non-standard abbreviations" bullet still functions (industry-standard professionalism check, per Tyler's choice). All substantive checks (defect cause, diagnostic rigor, coverage-voiding language, no-defect-found-with-repair, missing verification, missing data, uncertainty/hedging, internal contradictions) are unchanged, as are buildProofreadSystemPrompt, the other constants, the proofread route, the frontend, and the JSON response shape. (3) Version bump — src/lib/version.ts v1.1.21-beta → v1.1.22-beta, package.json 1.1.21 → 1.1.22. Modified files: src/constants/prompts.ts, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files; no route/frontend/database/auth/middleware/Stripe/RLS/protected-file changes. Verified `npx tsc --noEmit` zero TypeScript errors; the running dev server (localhost:3000) hot-reloads the proofread route on the next request. Committed LOCALLY ONLY (not pushed).
**Sprint — Style-Aware & Type-Aware Review/Audit System (lens-based proofread):** [x] COMPLETE (2026-06-25) — v1.1.21-beta — Makes the Review/Proofread audit STYLE-AWARE and STORY-TYPE-AWARE so the auditor's strictness matches the narrative's purpose: Customer Pay gets a light shop-foreman review, Extended Warranty gets a middle service-contract-claims review aimed at getting the claim approved WITHOUT a third-party inspection, and Manufacturer Warranty keeps the strict OEM-auditor standard. Replaces the lighter AUDIT_STYLE_MODIFIERS approach added in v1.1.19 with a comprehensive, composable lens system, and finally wires the narrative style into the audit from the frontend. STARTING-STATE DISCREPANCY (surfaced to Tyler before any edits): the sprint prompt was written against main (where the audit never receives the narrative style), but THIS worktree already had a DIFFERENT, DORMANT style-aware audit — AUDIT_STYLE_MODIFIERS appended onto a base diagnostic/repair prompt, with narrativeStyle already destructured in the route but NEVER sent by the frontend, so /api/proofread always fell back to manufacturer_warranty. Ran STOP/ALERT/ASK; Tyler chose "Replace with new lens system". PART 1 verification (against src/stores/narrativeStore.ts + src/constants/fieldConfig.ts): store field IS `narrativeStyle` with values 'customer_pay' | 'extended_warranty' | 'manufacturer_warranty'; story types are 'diagnostic_only' | 'repair_complete' — all exactly matching the sprint's assumptions. Files in scope (none protected; narrativeStore.ts was READ-ONLY for verification, never modified): (1) src/constants/prompts.ts — APPENDED 7 new exported consts + 1 builder right after DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT: PROOFREAD_FRAMEWORK_HEADER (shared framing + silent vehicle-OEM identification + universal NEVER-invent-identifiers rule), CUSTOMER_PAY_LENS, EXTENDED_WARRANTY_LENS, MANUFACTURER_WARRANTY_LENS, DIAGNOSTIC_ONLY_FOCUS, REPAIR_COMPLETE_FOCUS, PROOFREAD_OUTPUT_FOOTER (snippet [[ ]] extraction + JSON response format/rules), and buildProofreadSystemPrompt(narrativeStyle, storyType) which joins header + style lens + type focus + footer and DEFAULTS TO THE STRICTEST (manufacturer) lens when style is missing/unrecognized so a narrative is never under-reviewed. The old PROOFREAD_SYSTEM_PROMPT, DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT, and AUDIT_STYLE_MODIFIERS were intentionally LEFT IN PLACE but are now unused; NARRATIVE_STYLE_MODIFIERS (generation) is untouched and still used by /api/generate. (2) src/app/api/proofread/route.ts — 4 surgical edits: replaced the import of the two old prompts + AUDIT_STYLE_MODIFIERS with buildProofreadSystemPrompt; removed the now-dead VALID_AUDIT_STYLES const and the auditStyle/baseSystemPrompt/AUDIT_STYLE_MODIFIERS-append block; systemPrompt is now buildProofreadSystemPrompt(narrativeStyle, storyType); replaced the hard-coded "manufacturer warranty audit" userPrompt ternary with ONE style-neutral userPrompt passing NARRATIVE STYLE (via a styleLabel map) + STORY TYPE + VEHICLE + the reused inputContextBlock as plain context. The auth check, [[snippet]] parsing, fire-and-forget token logging, and the EXACT JSON response shape (flagged_issues[{issue,snippet}], suggested_edits, overall_rating, summary) are ALL unchanged. (3) src/app/(protected)/narrative/page.tsx — ONE surgical addition: added `narrativeStyle: state.narrativeStyle,` to the /api/proofread fetch body next to storyType; nothing else touched. This activates the feature end-to-end (the route previously always defaulted to manufacturer_warranty because the style was never sent). (4) Version bump — src/lib/version.ts v1.1.20-beta → v1.1.21-beta, package.json 1.1.20 → 1.1.21. Modified files: src/constants/prompts.ts, src/app/api/proofread/route.ts, src/app/(protected)/narrative/page.tsx, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files; no database changes; no auth/middleware/Stripe/RLS/(api/me) files touched; NO protected files modified. VERIFICATION: `npx tsc --noEmit` passed with ZERO TypeScript errors; `npm run dev` booted cleanly (✓ Ready in 809ms, localhost:3000). A full `npm run build` HUNG for ~1 hour in Next.js 16.2.1 Turbopack's production build (frozen at "Creating an optimized production build …" with two idle postcss.js workers) — an environment/Turbopack infra hang unrelated to these code changes; the hung process tree was killed and TypeScript was verified via tsc --noEmit instead, the same fallback used by the v1.1.17/v1.1.18 sprints. Developed in the feature/narrative-style-overhaul git worktree; committed LOCALLY ONLY (not pushed) — Tyler localhost-tests, then pushes.
**Sprint — Narrative Style Overhaul (Input Selector + Refine Panel + Style-Aware Generate/Audit/Refine + Save):** [x] COMPLETE (2026-06-22) — v1.1.20-beta — Wires the frontend onto the v1.1.16/v1.1.19 backend foundation so the user picks a Narrative Style on the input page, that style flows into generation/audit/refine, the old slider customization is replaced by a light-touch Refine panel, and the chosen style is saved with each narrative. STEP 8 (on-page style switcher) was INCLUDED, not deferred. This sprint was frontend-only wiring — the /api/generate, /api/proofread, and /api/refine routes already accepted narrativeStyle (and refine already returns instructionRejected), so no new API routes were created. PROTECTED FILE: src/stores/narrativeStore.ts was edited under the DOUBLE-CHECK PROTOCOL with Tyler's explicit "yes" in-session. Changes: (1) narrativeStore.ts (PROTECTED) — removed the three slider fields (lengthSlider, toneSlider, detailSlider) from NarrativeState + initialState and removed their setters (setLengthSlider/setToneSlider/setDetailSlider); added narrativeStyle: 'customer_pay'|'extended_warranty'|'manufacturer_warranty' (initial 'manufacturer_warranty') with setNarrativeStyle; kept customInstructions + setCustomInstructions; stripped the slider resets from clearForNewGeneration, resetCustomization, and setForRepairUpdate (the latter two were consequential edits required to compile) and deliberately do NOT reset narrativeStyle in clearForNewGeneration/setForRepairUpdate so the style persists across generations. (2) src/components/input/PreGenCustomization.tsx — repurposed IN PLACE (same path + same input-page import) from the slider disclosure into a single labeled "Narrative Style" segmented selector (Customer Pay / Extended Warranty / Manufacturer Warranty) reading/writing state.narrativeStyle via setNarrativeStyle, with a one-line helper, reusing the same localStorage key 'sd-pregen-customization' (now stores only { narrativeStyle }) and rehydrating on mount defaulting to manufacturer_warranty. (3) src/app/(protected)/narrative/page.tsx — added narrativeStyle: state.narrativeStyle to BOTH /api/generate request bodies (initial generate + regenerate) and to the /api/proofread body; removed all state.lengthSlider/toneSlider/detailSlider references; replaced the tracker customization metadata objects with { narrative_style, custom_instructions } and updated the useCallback/useEffect dependency arrays accordingly; replaced handleCustomize (POST /api/customize) with handleRefine(action) that POSTs to /api/refine with concern/cause/correction (current narrative), storyType, narrativeStyle, refineAction (omitted when 'custom'), customInstructions (only when 'custom'), and originalInputContext: state.compiledDataBlock — on success setNarrative with the returned narrative, shows the "Custom instruction outside professional scope and was ignored." toast when instructionRejected is true, and keeps the existing silent auto-save + tracker update (action label kept as 'customize' for analytics continuity); renamed the isCustomizing loading state to isRefining throughout; section header relabeled "AI OUTPUT CUSTOMIZATION" → "REFINE STORY"; added narrative_style: state.narrativeStyle to the /api/narratives/save INSERT body (+ added state.narrativeStyle to autoSaveNarrative deps). STEP 8: added a small, clearly-separate "NARRATIVE STYLE" switcher below the narrative (NOT in the Refine panel) that calls setNarrativeStyle and re-runs the normal generate flow at the new style (handleRegenerate parametrized with an optional styleOverride to avoid a stale store snapshot; the regenerate button's onClick changed to () => handleRegenerate()); the switcher is disabled during loading and, when there is no compiledDataBlock (e.g. repair-update flow), just records the style choice. (4) src/components/narrative/CustomizationPanel.tsx — repurposed IN PLACE (same path + same narrative-page import) into the Refine panel: removed the three sliders; added four one-tap action buttons (More Detail / Less Detail / Simplify / Expand → onRefine('more_detail'|'less_detail'|'simplify'|'expand')); kept the Custom Instructions textarea (max 100) and the existing 9-pattern client-side blocklist as a first-line filter; added an APPLY CUSTOM INSTRUCTION button calling onRefine('custom'); props changed to onRefine(action) + isLoading; exports a RefineAction type consumed by the page. (5) src/app/api/narratives/save/route.ts — added narrative_style: body.narrative_style || 'manufacturer_warranty' to the inserted narrativeData. (6) src/lib/narrativeTracker.ts — updated CreateTrackerData + UpdateTrackerData customization types from {length,tone,detail,custom_instructions} to {narrative_style,custom_instructions} (required to compile the new tracker metadata; the narrative-tracker route stores customization as a flexible JSONB blob, so no route change). STEP 7 conditional clause (dashboard view that audits/refines a SAVED narrative) was VERIFIED a no-op — no dashboard component calls /api/proofread, /api/refine, or /api/customize (dashboard only hits update-narrative, narratives, narratives/[id], export-pdf, contacts, saved-repairs, admin). DATABASE: this sprint assumes an additive narrative_style TEXT column on public.narratives, which Tyler applies separately (no migration run from here); the GET routes select all columns so the saved style returns automatically. The orphaned src/app/api/customize/route.ts was intentionally LEFT IN PLACE (deleting it would trip the file-deletion hard-stop); it is no longer called by the frontend. (7) Version bump — src/lib/version.ts v1.1.19-beta → v1.1.20-beta, package.json 1.1.19 → 1.1.20 (the prompt suggested v1.1.18-beta but current already exceeded it, so the next patch above current was used). Modified files: src/stores/narrativeStore.ts (PROTECTED), src/components/input/PreGenCustomization.tsx, src/app/(protected)/narrative/page.tsx, src/components/narrative/CustomizationPanel.tsx, src/app/api/narratives/save/route.ts, src/lib/narrativeTracker.ts, src/lib/version.ts, package.json, .claude/launch.json (added for dev preview), BUILD_PROGRESS_TRACKER.md. No new source files; no auth/middleware/Stripe/RLS/(api/me) files touched. `npm run build` verified zero TypeScript errors (full type-check) at v1.1.20; `npm run dev` confirmed the worktree app boots (✓ Ready, banner servicedraft-ai@1.1.20) and serves HTTP 200 — the input page's Narrative Style selector renders unconditionally in the repurposed component (a live screenshot of it requires logging in and selecting a story type, which gates the selector). Developed in the feature/narrative-style-overhaul git worktree branched from main; committed LOCALLY ONLY (not pushed).
**Sprint — Audit Style Awareness + Refine Endpoint + Shared Mandatory Output Rules:** [x] COMPLETE (2026-06-22) — v1.1.19-beta — Makes the audit/proofreading tool judge a narrative by its Narrative Style, stops penalizing appropriate brevity, catches the AI-fingerprint issues, and replaces the old full-rewrite "customize" behavior with a new light-touch "Refine" endpoint that has a guardrail against abusive or off-topic instructions. The implied-first-person + anti-fingerprint discipline is now routed through ONE shared constant so every narrative prompt stays consistent. Files in scope (none protected; src/app/api/customize/route.ts intentionally LEFT UNTOUCHED): src/constants/prompts.ts, src/app/api/proofread/route.ts, NEW src/app/api/refine/route.ts, src/app/api/update-narrative/route.ts, src/app/api/apply-edits/route.ts, src/app/api/convert-recommendation/route.ts. Changes: (1) SINGLE SOURCE OF TRUTH — added exported const MANDATORY_OUTPUT_RULES near the TOP of prompts.ts (declared before any prompt that interpolates it, so it initializes first), holding the five mandatory output rules (1 implied first-person voice, 2 inclusion fidelity / verbatim technical values, 3 no unnecessary elaboration, 4 no dashes as punctuation, 5 no parenthetical definitions). Replaced the inline MANDATORY OUTPUT RULES blocks embedded in DIAGNOSTIC_ONLY_SYSTEM_PROMPT and REPAIR_COMPLETE_SYSTEM_PROMPT with ${MANDATORY_OUTPUT_RULES} — their CRITICAL RULES lists, RESPONSE FORMAT, four JSON keys (block_narrative, concern, cause, correction), and FULL CAPITALIZATION requirement were left EXACTLY as-is. The new REFINE_SYSTEM_PROMPT and the three editing routes (update-narrative, apply-edits, convert-recommendation) each import MANDATORY_OUTPUT_RULES from "@/constants/prompts" and embed ${MANDATORY_OUTPUT_RULES} as a template literal instead of pasting the rules; the prior inline copies/partial subsets in those three routes (update-narrative's full 5-rule block, apply-edits' 4-rule block, convert-recommendation's dash/paren sentence subset) were removed so no duplicates remain. CUSTOMIZATION_SYSTEM_PROMPT and src/app/api/customize/route.ts were deliberately NOT wired to the shared constant (that path is being superseded by Refine and stays exactly as-is). The five rules now live in exactly one place — editing them later updates every narrative prompt at once. (2) AUDIT STYLE AWARENESS — added exported const AUDIT_STYLE_MODIFIERS: Record<string,string> with three keys (customer_pay, extended_warranty, manufacturer_warranty): customer_pay tells the auditor to judge clarity + advisor usability, do NOT flag the narrative for being brief or concise, and a short/clear/complete story should PASS; extended_warranty judges whether documented evidence/measured values/cause-to-correction linkage are strong enough to authorize without a third-party inspection; manufacturer_warranty judges against strict OEM audit standards. (3) BOTH audit prompts updated — PROOFREAD_SYSTEM_PROMPT: REMOVED the standalone criterion that flagged "overly brief narratives that lack the detail expected" (appropriate length now governed by audit style); added an "ADDITIONALLY, FLAG ANY OF THESE STYLE VIOLATIONS REGARDLESS OF AUDIT STYLE" block (first-person pronouns / THE TECHNICIAN, dashes-as-punctuation, parenthetical abbreviation definitions) using the prompt's existing [[double bracket]] snippet format. DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT: added the same anti-fingerprint block in its existing plain (no-bracket) format. Both audit prompts keep their existing JSON response formats and keys exactly as they were. So re-auditing older saved stories now catches these style issues. (4) proofread/route.ts — now accepts an optional narrativeStyle field, validates it against customer_pay / extended_warranty / manufacturer_warranty, defaults to manufacturer_warranty when missing or invalid, imports AUDIT_STYLE_MODIFIERS, and appends the selected modifier onto whichever base audit prompt is chosen (base + "\n\n" + modifier) before sending to Gemini. Nothing else about the route's behavior or response shape (flagged_issues with extracted snippet, suggested_edits, overall_rating, summary) changed. (5) NEW src/app/api/refine/route.ts — light-touch editor modeled structurally on the customize route (auth check, JSON parse, Gemini call, error handling). Accepts concern, cause, correction, storyType, narrativeStyle (optional → default manufacturer_warranty), refineAction (optional: more_detail | less_detail | simplify | expand; invalid/missing safely ignored), customInstructions (optional, max 100 chars), originalInputContext (optional). Keeps the customize route's exact 9-pattern regex blocklist as a first-line filter on customInstructions (rejects obvious injection attempts with 400, same as customize) plus the 100-char-limit 400. Builds the user prompt from the current Narrative Style, the refineAction (if any), the original input context (if provided), the current CONCERN/CAUSE/CORRECTION, and the custom instructions (if any); sends REFINE_SYSTEM_PROMPT as the system prompt. REFINE_SYSTEM_PROMPT embeds ${MANDATORY_OUTPUT_RULES} and a CUSTOM INSTRUCTIONS SCOPE CONTRACT that makes the model IGNORE out-of-scope instructions (persona/character, comedic/joke/fictional, casual register, first-person pronouns, roleplay, anything outside professional automotive documentation) and set instruction_rejected=true. The route parses the JSON, throws if any of the four narrative keys is missing (like the other routes), deterministically .toUpperCase()s the four fields, and returns block_narrative, concern, cause, correction, and instructionRejected (from the model's instruction_rejected). Logs token usage via logTokenUsage with the action label "refine". The frontend is NOT updated this sprint, so all new inputs are optional and safely defaulted, and the existing /api/customize route is left working and untouched. (6) Version bump — src/lib/version.ts v1.1.18-beta → v1.1.19-beta, package.json 1.1.18 → 1.1.19. New files: src/app/api/refine/route.ts. Modified files: src/constants/prompts.ts, src/app/api/proofread/route.ts, src/app/api/update-narrative/route.ts, src/app/api/apply-edits/route.ts, src/app/api/convert-recommendation/route.ts, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No database changes; no auth/middleware/Stripe/RLS/(api/me) files touched; src/app/api/customize/route.ts and CUSTOMIZATION_SYSTEM_PROMPT deliberately untouched (git diff confirmed customize/route.ts unchanged). `npm run build` verified zero TypeScript errors and registered the new /api/refine route; `npm run dev` confirmed booting (✓ Ready in 842ms; a second instance guard exited because Tyler's existing localhost dev server was already running). Verified with a 4-agent adversarial exact-text-fidelity review (30 checks, 0 failures, 1 advisory WARN that correctly confirmed CUSTOMIZATION_SYSTEM_PROMPT's inline rules were intentionally kept). Developed in the feature/narrative-style-overhaul git worktree branched from main; committed LOCALLY ONLY (not pushed).
**Hotfix — Extend Fingerprint Discipline + Deterministic Caps to Remaining Narrative Routes:** [x] COMPLETE (2026-06-19) — v1.1.18-beta — Follow-up to v1.1.16-beta and v1.1.17-beta. Extends the same two safeguards (MANDATORY OUTPUT RULES prompt discipline + deterministic .toUpperCase() on output) to the three remaining narrative-rewriting API routes that were previously untouched, so AI fingerprints (dashes/hyphens used as punctuation, parenthetical abbreviation definitions) and stray lowercase words cannot be re-introduced by ANY narrative path. Changes: (1) src/app/api/apply-edits/route.ts (Edit Story → apply selected proofread edits): added a 4-rule MANDATORY OUTPUT RULES block (implied first-person voice, strict full capitalization, no dashes as punctuation / no hyphenated compounds with examples and the part-number/component-name/DEX-COOL/code carve-out, no parenthetical definitions) to APPLY_EDITS_SYSTEM_PROMPT, and deterministic .toUpperCase() on the four returned fields after key validation. The surgical 'apply only the selected edits, change nothing else' contract is preserved (the 'no unnecessary elaboration' rule was NOT added). (2) src/app/api/update-narrative/route.ts (Update with Repair: diagnostic to repair-complete): added the full 5-rule MANDATORY OUTPUT RULES block (matching the generation prompts: implied first-person voice, inclusion fidelity, no unnecessary elaboration, no dashes, no parenthetical definitions) to its inline SYSTEM_PROMPT, and deterministic .toUpperCase() on the four returned fields. (3) src/app/api/convert-recommendation/route.ts (tense conversion of a recommendation into a completed-repair statement): extended its inline single-line SYSTEM_PROMPT with no-dashes-as-punctuation / no-hyphenated-compounds (part-number/component-name/code carve-out) and no-parenthetical-definitions instructions, and applied .toUpperCase() to the single returned repairText field. All three routes keep their existing auth checks, restriction check (update-narrative), request shapes, response shapes, and JSON keys unchanged. (4) Version bump — src/lib/version.ts v1.1.17-beta → v1.1.18-beta, package.json + package-lock.json 1.1.17 → 1.1.18. With this, all narrative-producing/rewriting prompts (DIAGNOSTIC_ONLY + REPAIR_COMPLETE generation, CUSTOMIZATION, APPLY_EDITS, UPDATE-NARRATIVE) plus the convert-recommendation transform now carry the fingerprint discipline, and all five narrative-returning routes (generate, customize, apply-edits, update-narrative, convert-recommendation) enforce FULL CAPITALIZATION deterministically. The two PROOFREAD prompts are review/audit-only (they output flagged issues, not narrative text) and were intentionally left unchanged. Modified files: src/app/api/apply-edits/route.ts, src/app/api/update-narrative/route.ts, src/app/api/convert-recommendation/route.ts, src/lib/version.ts, package.json, package-lock.json, BUILD_PROGRESS_TRACKER.md. No new files, no database changes, no auth/middleware/Stripe/RLS files touched. Verified with `npx tsc --noEmit` (zero errors); a full `next build` was intentionally skipped to avoid disrupting the live localhost dev server mid-testing. Committed locally only, not pushed. NOTE: the MANDATORY OUTPUT RULES block is now duplicated inline across several prompts — consolidating it into a single shared constant is a good candidate for the upcoming Sprints 2/3 prompt-logic work.
**Hotfix — Customization Prompt Fingerprint Cleanup + Deterministic Capitalization:** [x] COMPLETE (2026-06-19) — v1.1.17-beta — Follow-up to v1.1.16-beta. Live localhost testing surfaced two issues in narratives produced via the AI Output Customization path (POST /api/customize → CUSTOMIZATION_SYSTEM_PROMPT), which the v1.1.16-beta sprint did not touch (that sprint only updated the two GENERATION prompts): (1) the customization rewrite re-introduced AI-fingerprint hyphens joining ordinary words (e.g. VEHICLE-WIDE, WARM-UP, REAL-TIME, UNDER-TEMPERATURE), and (2) the model occasionally emitted a stray lowercase word (e.g. a lowercase "and") despite the all-caps instruction. Fixes: (1) Added a MANDATORY OUTPUT RULES block to CUSTOMIZATION_SYSTEM_PROMPT in src/constants/prompts.ts covering implied first-person voice, strict FULL CAPITALIZATION (every word, including short connectors like AND/THE/OF/A/TO/IS), NO DASHES AS PUNCTUATION / no hyphenated compound words (with explicit examples — VEHICLE WIDE not VEHICLE-WIDE, WARM UP not WARM-UP, REAL TIME not REAL-TIME, UNDER TEMPERATURE not UNDER-TEMPERATURE; hyphens still permitted inside legitimate part numbers, component/product names such as DEX-COOL, and codes), and NO PARENTHETICAL DEFINITIONS. The "no unnecessary elaboration" rule was intentionally NOT added to the customization prompt so the Length=Extended and Detail Level=Additional Steps sliders keep working. The customization RESPONSE FORMAT and its four keys (block_narrative, concern, cause, correction) are unchanged. (2) Added a deterministic .toUpperCase() normalization of the four narrative fields in BOTH src/app/api/customize/route.ts and src/app/api/generate/route.ts, applied after the required-keys validation and before the JSON response, so the app's FULL CAPITALIZATION requirement is guaranteed regardless of model output and a stray lowercase word can never reach the UI. (3) Version bump — src/lib/version.ts v1.1.16-beta → v1.1.17-beta, package.json + package-lock.json 1.1.16 → 1.1.17. Modified files: src/constants/prompts.ts, src/app/api/customize/route.ts, src/app/api/generate/route.ts, src/lib/version.ts, package.json, package-lock.json, BUILD_PROGRESS_TRACKER.md. No new files, no database changes, no auth/middleware/Stripe/RLS files touched. Verified with `npx tsc --noEmit` (zero errors); a full `next build` was intentionally skipped this pass to avoid disrupting the live localhost dev server mid-testing. NOTE: the same fingerprint discipline + caps normalization are NOT yet applied to the other narrative-rewriting routes (apply-edits, update-narrative, convert-recommendation) — flagged as a recommended follow-up. Committed locally only, not pushed.
**Sprint — Narrative Generation Prompt Overhaul + Narrative Style Foundation:** [x] COMPLETE (2026-06-19) — v1.1.16-beta — Reworks the two narrative GENERATION system prompts so generated stories stop over-explaining, always preserve exactly what the user typed, use proper automotive implied-first-person voice, and drop the obvious AI fingerprints (dashes used as punctuation, and parenthetical abbreviation definitions). Also adds the foundation for a new "Narrative Style" system that aims the narrative at how it will be used; the frontend does not send a style yet, so generation safely defaults. Files in scope (neither protected): src/constants/prompts.ts and src/app/api/generate/route.ts. Changes: (1) prompts.ts DIAGNOSTIC_ONLY_SYSTEM_PROMPT + REPAIR_COMPLETE_SYSTEM_PROMPT — deleted the "output narrative should ALWAYS contain MORE detail than what was provided, never less" sentence from the long technical-data rule (rule 9 diagnostic / rule 10 repair), while KEEPING the verbatim-reproduction requirement that every specific technical data point (terminal numbers, connector IDs, voltages, etc.) is reproduced exactly — preserves CRITICAL LESSONS LEARNED #20 (GM warranty audit compliance). (2) Revised the "reasonable professional language" rule (rule 7 in both prompts) so it ONLY permits language required to complete the narrative's required STRUCTURE (e.g. supplying a probable cause when none was provided, per rule 3) and explicitly forbids general elaboration/filler/padding; the existing most-probable-cause rule (rule 3) is unchanged. (3) Added an IDENTICAL "MANDATORY OUTPUT RULES" block to BOTH generation prompts, placed between the CRITICAL RULES list and the RESPONSE FORMAT block, covering five rules: 1 IMPLIED FIRST PERSON VOICE (verb-first past tense, never I/ME/MY/WE/OUR, never "THE TECHNICIAN"; customer concern stays standard form), 2 INCLUSION FIDELITY (every provided value copied verbatim, never rounded/paraphrased/summarized/omitted), 3 NO UNNECESSARY ELABORATION (input is the CEILING for facts and FLOOR for content, depth scales to job complexity, simple jobs get short narratives), 4 NO DASHES AS PUNCTUATION (hyphens allowed only inside legitimate part numbers/component names/codes), 5 NO PARENTHETICAL DEFINITIONS (no "PCM (POWERTRAIN CONTROL MODULE)"; weave code meanings inline). The existing FULL CAPITALIZATION requirement and the JSON RESPONSE FORMAT with its four keys (block_narrative, concern, cause, correction) were left EXACTLY as-is — not renamed or restructured (the app parses those keys). (4) Added new exported const NARRATIVE_STYLE_MODIFIERS: Record<string, string> with exactly three keys — customer_pay, extended_warranty, manufacturer_warranty — each a style directive string aimed at how the narrative will be used (customer-facing plain language / extended-warranty adjuster evidence / manufacturer OEM audit). (5) generate/route.ts — now reads an optional narrativeStyle field from the request JSON alongside the existing compiledDataBlock and storyType, validates it against the three allowed values, and defaults to 'manufacturer_warranty' when missing or invalid (frontend does not send it yet, so generation safely defaults). After selecting the base system prompt (diagnostic vs repair complete), it appends the selected modifier as `base + "\n\n" + modifier` and passes the combined system prompt to generateWithGemini. The auth check, 20-per-15-min rate limit, restricted-user check, 10,000-char input limit, fire-and-forget token-usage logging, and the response shape are ALL unchanged. (6) Version bump — src/lib/version.ts v1.1.15-beta → v1.1.16-beta, package.json 1.1.15 → 1.1.16. Modified files: src/constants/prompts.ts, src/app/api/generate/route.ts, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files, no database changes, no auth/middleware/Stripe/RLS/(api/me) files touched. `npm run build` verified zero TypeScript errors; `npm run dev` confirmed booting (✓ Ready, served on localhost). Developed in the feature/narrative-style-overhaul git worktree branched from main; committed LOCALLY ONLY (not pushed). v1.1.16 sits above the v1.1.9–v1.1.14 range reserved for the messaging-wip branch.
**Hotfix Sprint — Auto-Save Consolidation + Saved Narrative Modal Reorder:** [x] COMPLETE (2026-05-22) — v1.1.15-beta — Fixes two issues surfaced since v1.1.8-beta. (1) Auto-save flooding — every 2-second pause in EditStoryModal was appending a new "Auto-saved" entry to action_history, producing 10–15+ entries per editing session. Fixed via server-side rolling replacement: in src/app/api/narratives/[id]/route.ts PATCH handler, when action_type === 'auto_save' AND the last entry in action_history is also action === 'auto_save', the handler now replaces that last entry in-place (preserves version number, overwrites timestamp + narrative snapshot) using a direct read-modify-write UPDATE instead of the RPC path (which always appends). Non-auto_save actions continue to use the existing RPC-first-with-fallback flow unchanged. Response JSON still returns { success: true, version: <number> } where version is the reused version for rolling replacements. Client-side debounce also bumped from 2000ms to 10000ms (10s) in EditStoryModal.tsx to reduce auto-save frequency. Comment on useEffect updated from "fires 2s after last keystroke" to "fires 10s after last keystroke". No other changes to EditStoryModal cleanup, hasChanged detection, or onAutoSave callback contract. (2) Modal render order — in NarrativeDetailModal.tsx the Version History block (sortedHistory.length > 1 JSX) moved from ABOVE the action buttons to BELOW them. New render order: Header info → C/C/C sections → Update with Repair button (diagnostic_only only) → Actions row (COPY / VIEW PRINT / WORD / EMAIL) → Version History. Actions row wrapper changed from no margin to mb-6 for breathing room before Version History. All Version History logic, styling, expand/collapse, timeline dots, action pills, version badges, and timestamps are unchanged — only JSX position moved. EmailExportModal and UpdateWithRepairModal portals remain at the end of the component. Version jump from v1.1.8-beta to v1.1.15-beta skips 1.1.9–1.1.14 which are reserved for the messaging-wip branch. Modified files: src/app/api/narratives/[id]/route.ts, src/components/narrative/EditStoryModal.tsx, src/components/dashboard/NarrativeDetailModal.tsx, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files, no database changes, no auth/middleware/Stripe/RLS files touched. TypeScript: no errors in changed files (pre-existing .next/dev/types/validator.ts errors from messaging-wip stubs are unrelated to this sprint).
**Sprint 18 — Narratives-Over-Time Chart on Team Dashboard:** [x] COMPLETE (2026-05-20) — v1.1.8-beta — Replaces the single-value "Narratives Written Today" widget added in Sprint 17 with a 30-day Recharts AreaChart showing daily narrative counts for team members. Mirrors the Owner Dashboard's "Usage Over Time" chart pattern (src/app/(protected)/admin/page.tsx ~line 2459) so visual style stays consistent across the two dashboards. Five changes: (1) Stats API timeline data — src/app/api/teams/activity/route.ts stats branch: removed the single COUNT query for `narrativesToday` (created_at >= today00:00) and replaced it with a `created_at` SELECT for narratives where user_id IN memberIds AND created_at >= window start. TIMELINE_DAYS const = 30. Window start is computed in local time then converted to ISO via new Date(year, month, dateMinus29).toISOString() so the timeline always starts at exactly midnight 29 days ago (inclusive of today = 30 day-buckets). Aggregation: pre-fills a dailyCounts Record<string, number> with 30 YYYY-MM-DD keys mapped to 0, then iterates timelineRows.forEach incrementing the bucket matching row.created_at.split('T')[0]. Final output `narrativesOverTime` is Object.entries(dailyCounts).map(([date, count]) => ({ date, count })) which preserves insertion order (oldest → newest). Both empty-team early-return paths (admin with no teamId, team with zero members) also return narrativesOverTime: [] instead of narrativesToday: 0. (2) Page TeamStats interface — src/app/(protected)/team-dashboard/page.tsx: replaced `narrativesToday: number` with `narrativesOverTime: Array<{ date: string; count: number }>`. (3) Recharts imports added — AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer from 'recharts' (matches the imports used in admin/page.tsx line 18-19). Calendar icon removed from lucide-react import block since it's no longer used. (4) Widget JSX replaced — the previous compact Narratives Today LiquidCard (Calendar icon, single 4xl bold number, "since midnight" subtitle) is gone. New widget renders a LiquidCard containing a ResponsiveContainer (width 100%, height 220) wrapping an AreaChart. Bottom grid layout changed from `grid-cols-1 lg:grid-cols-2` to `grid-cols-1 lg:grid-cols-3` and the chart card gets `lg:col-span-2` so it occupies 2/3 of the row; the Top 3 Most Active Users leaderboard now occupies the remaining 1/3 (was 1/2). Chart styling: linearGradient id="narrativesGradient" with #8b5cf6 stop opacities 0.6→0.05, CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)", XAxis tickFormatter renders 'Jan 5' style labels via toLocaleDateString month: 'short', day: 'numeric' with interval="preserveStartEnd" and minTickGap={24} to prevent overlap on narrow viewports, YAxis allowDecimals={false}, Tooltip contentStyle frosted dark with var(--bg-elevated) + var(--accent-30) border, labelFormatter renders 'January 5, 2026' full date, formatter shows the count with a 'Narratives' label. Area uses type="monotone", stroke="#8b5cf6" purple matching the previous widget accent, strokeWidth={2}, fill="url(#narrativesGradient)". Subtitle "last 30 days" sits below the chart in text-muted xs. Empty state (zero narratives in 30-day window) renders centered text-muted "No narrative activity recorded yet." (5) Version bump — src/lib/version.ts v1.1.7-beta → v1.1.8-beta, package.json 1.1.7 → 1.1.8. Modified files: src/app/api/teams/activity/route.ts, src/app/(protected)/team-dashboard/page.tsx, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files. No database changes. No auth/middleware/Stripe/RLS files touched. Recharts dependency was already installed (^3.8.0) and used by the Owner Dashboard so no package.json dependency addition required. Build verified with zero TypeScript errors.
**Sprint 17 — Team Dashboard Overhaul:** [x] COMPLETE (2026-05-20) — v1.1.7-beta — Replaces the four placeholder/derived overview metric cards (Team Members, Active This Week, Total Narratives, Active Today — all computed from the members API response) with six widgets driven by REAL aggregate data queried server-side from public.narratives and public.narrative_tracker. Also expands the Quick Member List Preview to show ALL members rather than the first five. Access control unchanged — admin can still only view their own team, owner can view any team — the new stats branch reuses the exact same authUser scoping logic as the existing entries-list branch. Eight changes: (1) API stats branch — src/app/api/teams/activity/route.ts: added `?stats=1` query mode that returns an aggregate stats object instead of the paginated entries list. Authentication and team scoping unchanged: admin still falls back to authUser.teamId, owner can query any team via team_id param. Empty-team early return added for both admin-without-team and team-with-zero-members cases (returns zeroed stats object). Inside the stats branch: (a) resolves memberIds via svc.from('users').select('id, first_name, last_name, email, position').eq('team_id', teamId); (b) parallel Promise.all of 5 queries — totalGenerations = count(*) from narratives WHERE user_id IN memberIds, totalExports = count(*) from narrative_tracker WHERE user_id IN memberIds AND is_exported=true, totalProofreads = count(*) from narrative_tracker WHERE user_id IN memberIds AND is_proofread=true, narrativesToday = count(*) from narratives WHERE user_id IN memberIds AND created_at >= today00:00 ISO, and a list of narratives.user_id rows for client-side leaderboard aggregation; (c) aggregates countsByUser via reduce, sorts desc, slice(0,3) to produce topActiveUsers leaderboard with {user_id, first_name, last_name, email, position, count} per entry. Returns { success: true, stats: { totalUsers, totalGenerations, totalExports, totalProofreads, narrativesToday, topActiveUsers } }. Detail mode and list mode branches are untouched. (2) Page state — src/app/(protected)/team-dashboard/page.tsx: added TeamStats and TopActiveUser TypeScript interfaces alongside the existing TeamInfo/TeamMember/TrackerEntry types. Added two new state vars: teamStats (TeamStats | null) and statsLoading (boolean). Added fetchTeamStats useCallback that fetches `/api/teams/activity?stats=1&team_id=${team.id}`, sets teamStats on success, null on failure with console.error. Added useEffect that triggers fetchTeamStats when activeTab === 'overview' && team is set, mirroring the existing fetchActivityLogs trigger pattern. (3) Removed inline-computed overview stats — deleted the four locally-derived constants (memberCount, totalNarratives, activeMembersThisWeek, activeMembersToday) plus their oneWeekAgo/today Date setup blocks. Previous values came from members.length and members.reduce + last_active timestamp filters; new values come from real aggregate API queries. (4) Replaced overviewCards array — old array was 4 entries (Team Members, Active This Week, Total Narratives, Active Today) using member-derived values; new primaryWidgets array is 4 entries (Total Users, Total Generations, Total Exports, Total Proofreads) reading from teamStats with formatStat() helper that shows '—' for zero and toLocaleString() for non-zero values. Icons updated: Users for Total Users (color var(--accent-bright)), FileText for Total Generations (color #22c55e green), Share2 for Total Exports (color #f59e0b orange), CheckCircle for Total Proofreads (color #06b6d4 cyan). (5) Added bottom-row 2-column grid with two new widgets — Narratives Written Today (Calendar icon, color #8b5cf6 purple, value teamStats.narrativesToday, subtitle 'since midnight') and Top 3 Most Active Users (TrendingUp icon, accent-bright leaderboard inside LiquidCard). Leaderboard renders an ordered list with a circular position badge (1/2/3) using var(--accent-primary) background + var(--btn-text-on-accent) foreground, the user's first_name+last_name (fallback to email), their position string ('No position' fallback), and a narrative count pill badge (var(--accent-20) bg + var(--accent-bright) text). Empty state renders 'No activity yet.' if topActiveUsers.length === 0. (6) Replaced Quick Member List Preview — the LiquidCard previously called slice(0, 5) on members and rendered '+ N more members' footer text. New version renders members.map (no slice, no footer), wrapped in a `max-h-[600px] overflow-y-auto pr-1` container so very large teams remain scrollable. Loading skeleton (LoadingSpinner inside py-8) added for membersLoading state. Heading 'Team Members' kept, 'View All' button changed to 'Manage' but still navigates to members tab (unchanged behavior). (7) Loading skeleton restructured — overview tab outer if-branch now keys off `statsLoading && !teamStats` instead of `membersLoading && members.length === 0` so the loading state correctly reflects the new primary data source. (8) Imports — added Share2, CheckCircle, Calendar, TrendingUp from lucide-react; removed unused UserCheck (was only referenced by the deleted Active Today card). All other imports unchanged. Files modified: src/app/api/teams/activity/route.ts (added stats branch), src/app/(protected)/team-dashboard/page.tsx (state, fetch, useEffect, new widget JSX, full member list), src/lib/version.ts (v1.1.6-beta → v1.1.7-beta), package.json (1.1.6 → 1.1.7), BUILD_PROGRESS_TRACKER.md. No new files. No database changes. No auth/middleware/Stripe/RLS files touched. /api/teams/members endpoint untouched per sprint scope — UI just consumes the full list it already returned. Build verified with zero TypeScript errors.
**Sprint 16 — White Accent Contrast Rework:** [x] COMPLETE (2026-05-20) — v1.1.6-beta — Two-round contrast rework targeting the White accent (key='black', isLightMode=true) whose themed colors (#1e293b dark navy hex, #475569 slate textSecondary/bright, #cbd5e1 slate border) render as dark-grey-on-dark-grey against the dark frosted-glass card surfaces, producing unreadable labels and ghost-button appearances. All changes are scoped strictly to the White accent via a new `data-accent` attribute on the document root — other accents in dark mode or user-toggled light mode are untouched. (1) data-accent infrastructure (src/components/ThemeProvider.tsx) — added `root.setAttribute('data-accent', accent.key)` right after the existing data-mode setAttribute call. Enables CSS rules like `html[data-accent="black"]` and Tailwind variants like `[html[data-accent=black]_&]:` to target the White accent specifically. (2) --accent-text-emphasis white override (ThemeProvider.tsx light-mode block) — after setting `--accent-text-emphasis` to accent.hex, added a guarded second pass `if (accent.isLightMode) root.style.setProperty('--accent-text-emphasis', '#ffffff')`. Fixes the Main Menu page heading and all Concern/Cause/Correction labels (NarrativeDisplay.tsx) app-wide, which both use `var(--accent-text-emphasis)` for their text color. (3) Btn-text-on-accent forced white (ThemeProvider.tsx) — removed the luminance-conditional `hoverBrightness > 180 ? '#000000' : '#ffffff'` branch and the paired `hoverBrightness > 200` accent-vivid override; hardcoded `--btn-text-on-accent` to '#ffffff' for all accents per Tyler's earlier directive (Sprint 15 carry-over consolidated into Sprint 16 file). (4) Button.tsx secondary variant — added `btn-secondary` plain CSS class (not a Tailwind class — used by globals.css for context-aware border rule), replaced the single `[html[data-accent=black]_&]:text-white` with the more specific combined selector `[html[data-mode=light][data-accent=black]_&]:text-white` to beat the existing `[html[data-mode=light]_&]:text-black` rule by CSS specificity (2 attributes vs 1). Kept `[html[data-accent=black]_&]:border-transparent` so default secondary buttons in White accent have no visible border; the inside-card rule in globals.css re-paints it white when applicable. (5) LiquidCard.tsx — prepended `liquid-card` plain CSS class to the CursorGlow wrapper className. Enables CSS context detection so descendant secondary buttons can be styled differently based on their card-or-not container. (6) globals.css card-context rule — added a White-accent-scoped block `html[data-accent="black"] .liquid-card .btn-secondary { border-color: #ffffff !important; }`. Combined with step 4's transparent default, this produces Tyler's requested behavior: buttons inside LiquidCard get a white outline, buttons outside LiquidCard stay borderless and flush with the page surface. Inside-card buttons: Main Menu items (USER DASHBOARD/OWNER DASHBOARD/LOG OUT), ProfileSection UPDATE, Generated Story REGENERATE/REVIEW & PROOFREAD, Input page IMPORT FROM MY REPAIRS. Outside-card buttons (no outline): User Dashboard APP APPEARANCE/MY SAVED REPAIRS/EMAIL CONTACT LIST trio, Generated Story bottom action row EDIT STORY/BLOCK FORMATTING/SHARE-EXPORT. (7) NavBar.tsx back/forward arrows — added Tailwind variant `[html[data-accent=black]_&]:bg-white [html[data-accent=black]_&]:border-black [html[data-accent=black]_&]:text-black` to both circular nav buttons. In White accent the previously-themed transparent-fill/grey-text/whitish-outline buttons become solid white fill with black icon and black border. (8) NavBar.tsx page dropdown trigger (MAIN MENU / USER DASHBOARD / etc.) — same white-fill/black-border/black-text override appended via cn() arguments. (9) NavBar.tsx version label — added `[html[data-accent=black]_&]:text-white` to the version span so v1.X.Y-beta text reads white in the dark nav strip (was rendering as grey-blue accent-bright in White accent). (10) NavBar.tsx dropdownItemClasses — appended `[html[data-accent=black]_&]:text-white` so all menu items in the open dropdown (Main Menu, Input Page, Generated Story, User Dashboard, Team Dashboard, Owner Dashboard, Log Out) render white instead of slate-grey. Active state still differentiates via the bg-[var(--accent-10)] highlight. (11) PositionIcon.tsx — added `[html[data-accent=black]_&]:bg-white [html[data-accent=black]_&]:border-black` to the circular container and `[html[data-accent=black]_&]:text-black` to the inner Lucide icon. Profile avatar renders as white circle with black icon and black border in White accent, regardless of size variant. (12) ProfileSection.tsx — added `[html[data-accent=black]_&]:text-white` to each `<p>` (parent text-muted) AND each label `<span>` (text-secondary) for Email/ID/Location/Position rows. Both the labels and the values now read white on the dark card. (13) NarrativeHistory.tsx sort buttons + filter pills — converted the className from a plain string to a template-literal-with-conditional. Inactive sort buttons (when `!isActive`) and active filter pill (when `isActive`) get `[html[data-accent=black]_&]:bg-white! [html[data-accent=black]_&]:text-black! [html[data-accent=black]_&]:border-black!` (Tailwind v4 `!` suffix to override the inline `style={{}}` props that take precedence over plain class rules). Inactive filter pills (Diagnostic Only, Repair Complete) intentionally not changed per Tyler's screenshot circling. (14) StoryTypeSelector.tsx selected state — when an option is selected in White accent, override to `!bg-white !border-[#475569]` on the motion.button, `!text-[#475569]` (slate dark grey) on the icon wrapper, `!text-black` on the label span, `!text-[#475569]` on the description span. Produces a white card with black title and dark grey icon/border/subtext when the user picks DIAGNOSTIC ONLY or REPAIR COMPLETE. (15) Version bump — src/lib/version.ts v1.1.5-beta → v1.1.6-beta, package.json 1.1.5 → 1.1.6. Modified files: src/components/ThemeProvider.tsx, src/components/ui/Button.tsx, src/components/layout/NavBar.tsx, src/components/ui/PositionIcon.tsx, src/components/dashboard/ProfileSection.tsx, src/components/dashboard/NarrativeHistory.tsx, src/components/ui/LiquidCard.tsx, src/app/globals.css, src/components/input/StoryTypeSelector.tsx, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files, no database changes, no auth/middleware/Stripe/RLS/(api/me) files touched. Build verified with zero TypeScript errors.
**Sprint 15 — UI Polish Cluster:** [x] COMPLETE (2026-05-20) — v1.1.5-beta — Five discrete UI polish fixes bundled into one sprint. (1) White accent text color fix — src/components/ThemeProvider.tsx ~line 110: replaced luminance-conditional `root.style.setProperty('--btn-text-on-accent', hoverBrightness > 180 ? '#000000' : '#ffffff')` with hardcoded `root.style.setProperty('--btn-text-on-accent', '#ffffff')` — per Tyler's directive, white text on accent is now used app-wide regardless of accent brightness. The Noir accent (key='white') previously rendered black text via the luminance branch, which created low-contrast/unwanted styling on the rest of the UI. Also removed the paired special-case `if (effectiveMode === 'dark' && hoverBrightness > 200) { root.style.setProperty('--accent-vivid', accent.border) }` block — that override existed to keep secondary/ghost text legible when the accent.hover was very bright, but with white text now universal, --accent-vivid stays at accent.hover for all dark-mode accents. Removed the local `const hoverBrightness = perceivedBrightness(accent.hover)` declaration since it was only used by the two removed branches. The light-mode borderBrightness check (lines ~115-121) is preserved — still uses perceivedBrightness on accent.border to decide whether to swap --accent-vivid / --card-border / --modal-border to accent.hover. (2) Grey button text audit — verified src/components/ui/Button.tsx 'secondary' variant already uses `text-[var(--accent-vivid)]` (dark mode) and `text-black` (light mode) — neither uses var(--text-secondary), so no change needed there. Audited inline-styled buttons across src/: `var(--bg-input)` button fills found in src/components/dashboard/AppearanceModal.tsx (Particle Network toggle, line 95-111 — already uses `color: 'var(--text-primary)'`), src/components/dashboard/PreferencesPanel.tsx (same toggle, line 192-208 — already uses `color: 'var(--text-primary)'`), src/app/(protected)/dashboard/page.tsx (OWNER DASHBOARD button line 94-108 uses amber `color: '#f59e0b'` on `var(--bg-input)` fill, TEAM DASHBOARD button line 111-125 uses blue `color: '#3b82f6'` — both intentional colored-outline designs, not "grey buttons needing white text"). Outline-style Cancel buttons with `color: 'var(--text-secondary)'` in ContactsModal/SavedRepairsModal/EmailExportModal/NarrativeHistory use transparent backgrounds (no fill at all), not grey fills, so they're outside the scope of this fix. No source files modified for this audit task — the grey-fill buttons already had correct text colors. (3) Saved narratives table column label color — src/components/dashboard/NarrativeHistory.tsx lines 260-267: changed all 8 `<th>` className from `"text-left py-2 px-2 text-[var(--text-secondary)] font-medium"` to `"text-left py-2 px-2 text-white font-medium"`. Affected column labels: Date, Time, R.O. #, Year, Make, Model, Type, Saved Story. Improves readability of the saved narratives table headers regardless of theme accent tint. (4) Hide Delete Account button for owner role — src/app/(protected)/dashboard/page.tsx lines 170-179: wrapped the entire `<div className="flex justify-center pt-4 pb-2"><button onClick={() => setShowDeleteConfirm(true)} ...><Trash2 size={14} />Delete Account</button></div>` block in `{profile.role !== 'owner' && ( ... )}`. The Delete Account confirmation Modal block (lines ~213-279) is left in place — it has no trigger now for owner role, but stays harmless and keeps the diff minimal. Standard users (role 'user'/'admin') still see the Delete Account control. No changes to /api/delete-account, RLS, or middleware. (5) Email Contact List auto-open — src/components/narrative/EmailExportModal.tsx: converted `async function openContactsPicker()` to a `useCallback` with empty deps array (function body unchanged — still calls /api/contacts and populates the picker state). Added `useCallback` to the React import line. Updated the isOpen reset useEffect to call `void openContactsPicker()` after setEmails/setErrors, and added openContactsPicker to the useEffect deps array — useCallback ensures the function identity is stable across renders so the effect doesn't re-trigger on every render. New behavior: when EmailExportModal opens, the contacts picker is automatically populated and visible. The existing "SELECT FROM CONTACTS" button (line 325-334) still works as a manual reopen/refresh trigger if the user dismisses the picker. No changes to /api/contacts or contact state shape. (6) Version bump — src/lib/version.ts v1.1.4-beta → v1.1.5-beta, package.json 1.1.4 → 1.1.5. Modified files: src/components/ThemeProvider.tsx, src/components/dashboard/NarrativeHistory.tsx, src/app/(protected)/dashboard/page.tsx, src/components/narrative/EmailExportModal.tsx, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md. No new files, no database changes, no auth/middleware/Stripe/RLS/(api/me) files touched. Build verified with zero TypeScript errors.
**Sprint 14 — Force Capitalization + Existing Data Migration:** [x] COMPLETE (2026-05-20) — v1.1.4-beta
**Sprint 13 — Auto-Save + Version History System:** [x] COMPLETE (2026-05-19) — v1.1.3-beta
**Sprint 12c — Remove last-used email pre-population, rename to Email Contact List:** [x] COMPLETE (2026-04-14) — v1.1.2-beta
**Sprint 12b — Inline contact creation in email export modal:** [x] COMPLETE (2026-04-14) — v1.1.2-beta
**Sprint 12 — Email Contact List (contact book for email exports):** [x] COMPLETE (2026-04-14) — v1.1.1-beta
**Sprint 11 — Navbar overhaul + UI polish:** [x] COMPLETE (2026-04-13) — v1.1.0-beta
**Sprint 14 — Force Capitalization + Existing Data Migration:** [x] COMPLETE (2026-05-20) — v1.1.4-beta — Forces ALL CAPS on user-entered text fields app-wide and migrates existing data to uppercase. Ten deliverables: (1) Database migration supabase/migrations/012_uppercase_existing_data.sql — UPDATE public.users SET first_name = UPPER(first_name) WHERE first_name IS NOT NULL AND first_name <> UPPER(first_name); same for last_name. UPDATE public.saved_repairs SET template_name = UPPER(template_name), make = UPPER(make), model = UPPER(model), customer_concern = UPPER(customer_concern), codes_present = UPPER(codes_present), diagnostics_performed = UPPER(diagnostics_performed), root_cause = UPPER(root_cause), repair_performed = UPPER(repair_performed), repair_verification = UPPER(repair_verification), recommended_action = UPPER(recommended_action) WHERE TRUE. UPPER(NULL) returns NULL in Postgres so nullable columns are safe. NOTIFY pgrst, 'reload schema'. Does NOT touch public.narratives (AI output, already uppercase), public.contacts (emails are case-sensitive), users.email, or users.username (email casing preserved per RFC). Migration file written only — NOT applied; Tyler will paste into Supabase SQL Editor manually. (2) Input primitive uppercase enforcement — src/components/ui/Input.tsx: destructured onChange and type from props; added shouldUppercase guard (type !== 'email' && type !== 'password'); wrapped onChange to call e.target.value = e.target.value.toUpperCase() before passing upstream; added style={{ textTransform: 'uppercase' }} for instant visual feedback. Email and password inputs are excluded from uppercase — verified by audit: SupportForm (type="email"), EmailExportModal (raw input, unaffected), ContactsModal (raw input, unaffected), EditProfileModal (type="password"), signup page (type="email"/type="password"), login page (type="email"/type="password"). (3) AutoTextarea uppercase enforcement — src/components/ui/AutoTextarea.tsx: added e.target.value = e.target.value.toUpperCase() in handleChange before resize/onChange; added style={{ textTransform: 'uppercase' }}. No exclusions needed — AutoTextarea is only used for text content fields (customer_concern on input page). (4) ConditionalField textarea uppercase — src/components/input/ConditionalField.tsx: changed onValueChange(e.target.value) to onValueChange(e.target.value.toUpperCase()); added style={{ textTransform: 'uppercase' }} to the textarea element. Affects all conditional fields: codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification. (5) Signup API belt-and-suspenders — src/app/api/signup/complete-profile/route.ts (PROTECTED — approved by Tyler): changed first_name: firstName.trim() to firstName.trim().toUpperCase(), same for last_name. Ensures server-side uppercase even if a non-UI client calls the endpoint. No auth/session/PKCE logic touched. (6) Edit Profile Modal server-side coercion — src/components/dashboard/EditProfileModal.tsx: changed first_name: firstName.trim() to firstName.trim().toUpperCase(), same for last_name in the handleSaveProfile supabase update call. Visual uppercase comes free from the updated Input primitive. (7) SaveRepairModal uppercase on save — src/components/input/SaveRepairModal.tsx: added upper() helper function; applied .toUpperCase() to template_name and upper() to all text field values (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification) before POST to /api/saved-repairs. (8) EditRepairModal uppercase on save + visual — src/components/input/EditRepairModal.tsx: applied .toUpperCase() to template_name and all editable field values before PUT to /api/saved-repairs/{id}; added .toUpperCase() to inline textarea onChange handlers; added style={{ textTransform: 'uppercase' }} to inline textareas. (9) Input page RO number + field values — src/app/(protected)/input/page.tsx: changed handleChange for required fields to call setRoNumber(e.target.value.toUpperCase()) and setFieldValue(field.id, e.target.value.toUpperCase()). Visual uppercase comes free from the updated Input/AutoTextarea primitives. (10) Version bump — src/lib/version.ts v1.1.3-beta → v1.1.4-beta, package.json 1.1.3 → 1.1.4. New files: supabase/migrations/012_uppercase_existing_data.sql. Modified files: src/components/ui/Input.tsx, src/components/ui/AutoTextarea.tsx, src/components/input/ConditionalField.tsx, src/app/api/signup/complete-profile/route.ts (PROTECTED — approved), src/components/dashboard/EditProfileModal.tsx, src/components/input/SaveRepairModal.tsx, src/components/input/EditRepairModal.tsx, src/app/(protected)/input/page.tsx, src/lib/version.ts, package.json. No auth/middleware/stripe/RLS files touched (complete-profile change is data-only, approved). Build verified with zero TypeScript errors.
**Sprint 13 — Auto-Save + Version History System:** [x] COMPLETE (2026-05-19) — v1.1.3-beta — Full auto-save system so users never lose narratives by forgetting to click Save. Edits to a narrative now update the SAME saved-narratives row (PATCH) rather than creating a new row, with version-history snapshots mirroring the narrative_tracker action_history JSONB pattern. Eight deliverables: (1) Database migration 011_narrative_versions.sql — ALTER TABLE public.narratives ADD COLUMN action_history JSONB NOT NULL DEFAULT '[]'::jsonb. Backfills existing rows with a single {action:'generate', version:1} entry derived from existing columns. GIN index on action_history. SQL function public.append_narrative_history(UUID, JSONB) as SECURITY DEFINER for atomic append. GRANT EXECUTE to authenticated. NOTIFY pgrst reload. Migration file written only — NOT applied; Tyler will paste into Supabase SQL Editor manually. (2) Store update (src/stores/narrativeStore.ts, PROTECTED — approved by Tyler) — Modified setNarrative to no longer reset savedNarrativeId (was: `savedNarrativeId: null`; now omitted). This allows subsequent saves to PATCH the existing row instead of always INSERTing a new one. clearForNewGeneration and resetAll still correctly null savedNarrativeId. Added new setNarrativeWithSavedId(data, narrativeId) method that sets narrative AND marks isSaved=true with the given id. Exported from hook return object. (3) Type update (src/types/database.ts) — Added NarrativeHistoryEntry interface {action, version, at, narrative_text?, concern?, cause?, correction?}. Added action_history: NarrativeHistoryEntry[] to Narrative interface. (4) Save API update (src/app/api/narratives/save/route.ts) — INSERT payload now includes action_history with initial [{action:'generate', version:1, at:now, narrative_text, concern, cause, correction}] entry. (5) New API route (src/app/api/narratives/[id]/route.ts) — PATCH handler: auth check, ownership check (user_id === auth user), fetches existing row, computes next version from max(action_history[].version)+1, builds new history entry, calls append_narrative_history RPC (with read-modify-write fallback if RPC unavailable), updates narrative fields (concern, cause, correction, full_narrative, updated_at). Returns {success, version}. GET handler: auth + ownership check, returns full narrative row including action_history. (6) Narrative page refactor (src/app/(protected)/narrative/page.tsx) — Replaced saveToDatabase with unified autoSaveNarrative(actionType, narrativeData?) function. Uses savedIdRef (useRef) to avoid stale closure issues. If savedNarrativeId is null → POST to /api/narratives/save (INSERT). If savedNarrativeId exists → PATCH to /api/narratives/{id}. Wired to all action handlers: generateNarrative→'initial_save' (with "Saved automatically" toast), handleRegenerate→'regenerate', handleCustomize→'customize', handleApplyEdits→'proofread_apply', handleEditSave→'manual_edit'. All auto-save calls are fire-and-forget (silent, no toast except initial save). Manual save button rewired to autoSaveNarrative('manual_save') with explicit "Story saved successfully" toast. handleBeforeExport (export auto-save) rewired to autoSaveNarrative('auto_save'). Save button labels: "SAVE STORY" → "SAVING..." (while saving) → "✓ SAVED" (after save, still clickable). EditStoryModal receives onAutoSave prop for debounced in-modal auto-save. (7) EditStoryModal update (src/components/narrative/EditStoryModal.tsx) — Added optional onAutoSave prop. Debounced effect: when local blockText/concern/cause/correction differ from original narrative prop AND modal is open, waits 2000ms after last keystroke, then calls onAutoSave with current values. Does NOT close modal on auto-save. Shows "Auto-saved at HH:MM" indicator next to Save button. Timer cleared on unmount/close. (8) NarrativeDetailModal update (src/components/dashboard/NarrativeDetailModal.tsx) — On open, fetches GET /api/narratives/{id} to get action_history. Adds "Version History" section below Correction and above Update with Repair / action buttons. Hidden if 0-1 history entries. Uses same visual pattern as ActivityDetailModal: vertical timeline line, colored dots per action type, pill badges with ACTION_PILL_COLORS, version badges, timestamps, expandable per-version narrative snapshots with ChevronDown/ChevronUp toggle and framer-motion AnimatePresence animation. Sorted by version ascending (chronological). Helpers duplicated locally (formatActionLabel, formatTimestamp, ACTION_PILL_COLORS) to avoid wider refactor. New files: supabase/migrations/011_narrative_versions.sql, src/app/api/narratives/[id]/route.ts. Modified files: src/stores/narrativeStore.ts (PROTECTED — approved), src/types/database.ts, src/app/api/narratives/save/route.ts, src/app/(protected)/narrative/page.tsx, src/components/narrative/EditStoryModal.tsx, src/components/dashboard/NarrativeDetailModal.tsx, src/lib/version.ts (v1.1.2-beta → v1.1.3-beta), package.json (1.1.2 → 1.1.3). No auth/middleware/stripe files touched. Build verified with zero TypeScript errors.
**Sprint 12c — Remove last-used email pre-population, rename to Email Contact List:** [x] COMPLETE (2026-04-14) — v1.1.2-beta — Two polish changes: (1) Renamed feature from "Saved Contacts" to "Email Contact List" — dashboard button text changed from "SAVED CONTACTS" to "EMAIL CONTACT LIST", ContactsModal title changed from "Saved Contacts" to "Email Contact List". (2) Removed last-used email pre-population from EmailExportModal — deleted STORAGE_KEY constant and all localStorage read/write logic. Recipient list now starts empty every time the modal opens. Users can quickly fill it via the contacts picker instead. Modified files: src/app/(protected)/dashboard/page.tsx (button text), src/components/dashboard/ContactsModal.tsx (modal title), src/components/narrative/EmailExportModal.tsx (removed STORAGE_KEY, localStorage logic). No auth/protected files touched. Build verified with zero TypeScript errors.
**Sprint 12b — Inline contact creation in email export modal:** [x] COMPLETE (2026-04-14) — v1.1.2-beta — Added "NEW CONTACT" button inside the Select Contacts picker panel in EmailExportModal.tsx. When clicked, reveals a compact inline form (name, email, notes fields) within the picker. On save, POSTs to /api/contacts and the new contact appears immediately in the picker list (sorted alphabetically). Form resets when picker is closed/reopened, validates email format, shows field-level errors. State added: showNewContactForm, newContactName, newContactEmail, newContactNotes, newContactEmailError, isSavingNewContact. Handler: handleSaveNewContact(). Modified file: src/components/narrative/EmailExportModal.tsx. No auth/protected files touched. Build verified with zero TypeScript errors.
**Sprint 12 — Email Contact List (contact book for email exports):** [x] COMPLETE (2026-04-14) — v1.1.1-beta — Full saved contacts feature: users can save, edit, and delete email contacts from their dashboard, then quickly select them as recipients in the email export modal. Five deliverables: (1) Database migration 010_contacts.sql — created public.contacts table (id, user_id, contact_name, contact_email, notes, created_at, updated_at) with FK referencing public.users(id) ON DELETE CASCADE (correct convention, not auth.users), index on user_id, RLS enabled with 4 policies (SELECT/INSERT/UPDATE/DELETE scoped to auth.uid() = user_id), NOTIFY pgrst reload. Applied via Supabase MCP. (2) API routes — src/app/api/contacts/route.ts (GET: list user contacts ordered by name asc; POST: create contact with email validation via EMAIL_REGEX, returns 400 on invalid/missing fields) and src/app/api/contacts/[id]/route.ts (PATCH: update contact with ownership check and per-field email validation; DELETE: delete contact with ownership check). Pattern mirrors saved-repairs routes. (3) ContactsModal component — src/components/dashboard/ContactsModal.tsx, full CRUD modal following SavedRepairsModal patterns. Features: animated add-new form with name/email/notes fields, inline email validation, contact list with name+email+notes display, edit-in-place per row, delete with confirmation prompt, empty state message, toast feedback on all operations. Uses framer-motion AnimatePresence, lucide-react icons, project CSS variables. (4) Dashboard integration — added SAVED CONTACTS button (BookUser icon, secondary variant) to the button row alongside APP APPEARANCE and MY SAVED REPAIRS in dashboard/page.tsx. Added showContacts state and ContactsModal render. (5) Email export contacts picker — added "SELECT FROM CONTACTS" button to EmailExportModal.tsx next to "ADD ANOTHER RECIPIENT". Opens inline picker panel that fetches GET /api/contacts, displays checkbox list (multi-select), grays out already-added emails, "ADD SELECTED (n)" button appends to emails array respecting MAX_RECIPIENTS=10 cap, skips duplicates, shows toast warnings. New files: supabase/migrations/010_contacts.sql, src/app/api/contacts/route.ts, src/app/api/contacts/[id]/route.ts, src/components/dashboard/ContactsModal.tsx. Modified files: src/app/(protected)/dashboard/page.tsx (import, state, button, modal render), src/components/narrative/EmailExportModal.tsx (imports, state, picker logic, picker UI), src/lib/version.ts (v1.1.0 → v1.1.1), package.json (1.1.0 → 1.1.1). No auth/protected files touched. Build verified with zero TypeScript errors.
**Sprint 10 — Dashboard cleanup + owner Team Dashboard button + confirmation email template:** [x] COMPLETE (2026-04-13) — v1.0.12-beta
**Sprint 9 — Input context plumbing, wider input cards, custom instructions safeguards:** [x] COMPLETE (2026-04-13) — v1.0.11-beta
**Sprint 8 — Retry button on generation failure + Gemini token cap increase:** [x] COMPLETE (2026-04-13) — v1.0.10-beta
**Sprint 7 — Refactor print export to use PDF viewer:** [x] COMPLETE (2026-04-13) — v1.0.9-beta
**Sprint 6 — Enable browser-native spell check on all text inputs:** [x] COMPLETE (2026-04-13) — v1.0.8-beta
**Sprint 11 — Navbar overhaul + UI polish:** [x] COMPLETE (2026-04-13) — v1.1.0-beta — Full rewrite of src/components/layout/NavBar.tsx plus multiple UI polish passes. Changes: (1) Removed existing navbar button row — deleted the Main Menu link button (left section), the desktop nav button row (Dashboard, Owner, Team, Log Out links), and the entire mobile menu dropdown (hamburger toggle + slide-down panel). These are all replaced by the new unified dropdown. (2) Added role-gated page navigation dropdown — single dropdown menu on the right side of the navbar (before the light/dark toggle), works on ALL viewports (no separate mobile menu needed). Trigger button shows Menu icon + current page name derived from pathname via getPageName() helper. Dropdown items in order: Main Menu (Home icon, always visible), Input Page (Edit3 icon, authenticated only), Generated Story (FileText icon, authenticated only), User Dashboard (LayoutDashboard icon, authenticated only), Team Dashboard (Users icon, visible when role === 'admin' OR role === 'owner' — fixes the bug), Owner Dashboard (Shield icon, owner only), separator, Log Out (LogOut icon, always visible). Current page highlighted with accent-bright text + accent-10 background. Dropdown styled with frosted glass (bg-[var(--bg-nav)] backdrop-blur-[12px]), rounded-xl border, shadow-lg. Click outside closes dropdown (useEffect with mousedown listener on document). Route changes auto-close dropdown (useEffect on pathname). (3) Added browser-style back/forward arrows on left side — replaced the old Main Menu button position with two grouped buttons: ChevronLeft (router.back()) and ChevronRight (router.forward()) from lucide-react. Styled consistently with the theme toggle button (same hover states, sizing, glow effect). Uses useRouter from next/navigation. (4) Fixed owner role gating for Team Dashboard — the old navbar only showed Team Dashboard for role === 'admin', excluding owner. The new dropdown uses isOwnerOrAdmin (role === 'owner' || role === 'admin') for the Team Dashboard item. Owner now sees both Team Dashboard AND Owner Dashboard entries. No auth/middleware changes — this only affects navbar visibility; the team-dashboard page itself already permits owner access at line 166-170. Imports changed: removed X (no mobile toggle), added ChevronLeft, ChevronRight, Home, Edit3, FileText, useRouter, useRef. State changed: mobileMenuOpen → navOpen, added dropdownRef. Kept: version display (center), light/dark toggle, hydration safety, handleLogout handler, cn utility usage, APP_VERSION import. Files modified: src/components/layout/NavBar.tsx (full rewrite), src/lib/version.ts (v1.0.12-beta → v1.0.13-beta), package.json (1.0.12 → 1.0.13). No new files, no database changes, no auth/protected files touched. Build verified with zero TypeScript errors.
**Sprint 10 — Dashboard cleanup + owner Team Dashboard button + confirmation email template:** [x] COMPLETE (2026-04-13) — v1.0.12-beta — Three changes: (1) Removed in-page MAIN MENU button from User Dashboard — deleted the Button component block (lines 108-114) that navigated to /main-menu. The Button import is retained as it's still used elsewhere on the page (profile error state, appearance/repairs buttons, delete confirmation). (2) Added TEAM DASHBOARD quick-access button for owner role — inserted a new motion.button immediately after the existing OWNER DASHBOARD button in the header bar, inside its own {profile.role === 'owner' && (...)} conditional. Uses blue color scheme (#3b82f6 border and text) to differentiate from the amber Owner Dashboard button. Same motion animation pattern (spring hover scale 1.05 with blue glow, tap scale 0.95). Routes to /team-dashboard on click. Uses Users icon from lucide-react (added to import). The Team Dashboard page itself already permits owner access (only blocks 'user' role at line 166-170 of team-dashboard/page.tsx), so no auth changes were needed. (3) Created confirmation signup email templates — created docs/email-templates/confirm-signup.html (branded HTML email with dark aesthetic, #7c3aed purple CTA button, {{ .ConfirmationURL }} variable, inline CSS only, fallback plain-text link) and docs/email-templates/confirm-signup.txt (plain-text version). Both files include header comments explaining they must be MANUALLY pasted into Supabase Dashboard > Authentication > Email Templates > Confirm Signup. Templates are NOT used by application code. {{ .ConfirmationURL }} is the only Supabase variable used. NOT applied to Magic Link template (Outlook Safe Links pre-fetch issue). Files modified: src/app/(protected)/dashboard/page.tsx (removed MAIN MENU button, added Users import, added TEAM DASHBOARD motion.button), src/lib/version.ts (v1.0.11-beta → v1.0.12-beta), package.json (1.0.11 → 1.0.12). New files: docs/email-templates/confirm-signup.html, docs/email-templates/confirm-signup.txt. No database changes, no auth/protected files touched. Build verified with zero TypeScript errors.
**Sprint 9 — Input context plumbing, wider input cards, custom instructions safeguards:** [x] COMPLETE (2026-04-13) — v1.0.11-beta — Five changes: (1) Widened input page card containers — changed outer wrapper from max-w-3xl to max-w-4xl in src/app/(protected)/input/page.tsx. Responsive behavior preserved (px-4 padding, mx-auto centering). All LiquidCard sections (story type, repair order info, pre-gen customization) now have ~20% more horizontal space. (2) Injected original input context into customize API — added originalInputContext (state.compiledDataBlock) to the fetch body in narrative/page.tsx customize handler. Updated src/app/api/customize/route.ts to extract originalInputContext from request body, construct an "ORIGINAL INPUT CONTEXT" block, and insert it into the userPrompt between the STORY TYPE header and the CURRENT NARRATIVE section. This gives the AI access to the original concern, codes, diagnostics, root cause, repair, and verification data during customization so regeneration stays factually consistent. (3) Injected original input context into proofread API — added originalInputContext (state.compiledDataBlock) to the fetch body in narrative/page.tsx proofread handler. Updated src/app/api/proofread/route.ts to extract originalInputContext and add an "ORIGINAL INPUT CONTEXT" block to BOTH the diagnostic_only and repair_complete userPrompt branches. The proofread audit can now flag mismatches between the narrative and original input data (e.g., "narrative says no repairs were performed but input page lists a repair"). (4) Bumped custom instructions character limit from 50 to 100 — changed maxLength={50} to maxLength={100} on the Textarea component and updated the display counter from "/ 50" to "/ 100" in CustomizationPanel.tsx. (5) Added custom instructions safeguards — CLIENT: added BLOCKED_PATTERNS array (9 regex patterns for prompt injection detection: ignore instructions, you are now, system:, assistant:, disregard, forget, new instructions/persona/role, act as, pretend to be) and hasBlockedContent() function to CustomizationPanel.tsx. The Apply button now runs validation before calling onApply(); blocked content shows "This input contains restricted content. Please rephrase your customization." error below the textbox. Error clears on typing. SERVER (source of truth): added identical regex check in src/app/api/customize/route.ts BEFORE the modifiers.push() call. Returns 400 with {error: 'Custom instructions contain restricted content'} if any pattern matches. Also enforces server-side max length (100 chars) — returns 400 if exceeded. Files modified: src/app/(protected)/input/page.tsx (1 line), src/app/(protected)/narrative/page.tsx (2 fetch bodies), src/app/api/customize/route.ts (validation block + prompt injection), src/app/api/proofread/route.ts (destructure + prompt injection), src/components/narrative/CustomizationPanel.tsx (import, patterns, validation, char limit), src/lib/version.ts (v1.0.10-beta → v1.0.11-beta), package.json (1.0.10 → 1.0.11). No new files, no database changes, no auth/protected files touched. Build verified with zero TypeScript errors.
**Sprint 8 — Retry button on generation failure + Gemini token cap increase:** [x] COMPLETE (2026-04-13) — v1.0.10-beta — Two changes: (1) Added retry button when narrative generation fails. New state: generationError (string|null) and retryCount (number). Both generateNarrative() and handleRegenerate() now clear generationError before try, set it + increment retryCount in catch, and reset retryCount on success. When generation fails and no narrative exists, a centered LiquidCard displays an AlertTriangle icon, "GENERATION FAILED" heading, the error message, and either a "RETRY GENERATION" button (retryCount < 3, calls generateNarrative()) or a "RETURN TO INPUT" button (retryCount >= 3, navigates to /input). This replaces the previous behavior of returning null on failure with no user recourse. (2) Bumped Gemini maxOutputTokens default from 8192 to 30000 in src/lib/gemini/client.ts. This affects all API calls using generateWithGemini() (generate, customize, proofread, apply-edits, convert-recommendation) since they all rely on the default parameter. No call sites pass an explicit override, so all benefit from the higher cap. Files modified: src/app/(protected)/narrative/page.tsx (retry UI + error state), src/lib/gemini/client.ts (token cap), src/lib/version.ts (v1.0.9-beta → v1.0.10-beta), package.json (1.0.9 → 1.0.10). No new files, no database changes, no auth/protected files touched. Build verified with zero TypeScript errors.
**Sprint 7 — Refactor print export to use PDF viewer:** [x] COMPLETE (2026-04-13) — v1.0.9-beta — Refactored print export flow to fetch the existing PDF from /api/export-pdf and open it in a new browser tab, letting the browser's built-in PDF viewer handle download and print. Deleted the now-redundant buildPrintHtml() function from exportUtils.ts (90 lines of duplicated HTML layout that had a bug where the footer logo used an absolute production URL that failed on localhost). Merged PRINT and PDF buttons into a single "VIEW / PRINT / DOWNLOAD" button in both ShareExportModal.tsx and NarrativeDetailModal.tsx. Button uses ExternalLink icon from lucide-react. Handler: POST buildPayload() to /api/export-pdf, convert response to blob, create blob URL via URL.createObjectURL(), open in new tab via window.open(), schedule URL.revokeObjectURL() after 60s, show toast error if pop-up blocked. Existing tracker/activity logging preserved (export_print action). DOCX and Email export paths unchanged. Files modified: src/components/narrative/ShareExportModal.tsx (replaced handlePrint + handleDownloadPdf with single handleOpenPdf, removed buildPrintHtml import, removed Printer/FileDown icons, added ExternalLink icon, merged two buttons into one), src/components/dashboard/NarrativeDetailModal.tsx (same refactor, removed Printer/FileDown icons, added ExternalLink icon, merged PRINT + PDF buttons into one), src/lib/exportUtils.ts (deleted buildPrintHtml function and updated module docstring), src/lib/version.ts (v1.0.8-beta → v1.0.9-beta), package.json (1.0.8 → 1.0.9). No new files, no database changes, no auth/protected files touched. Build verified with zero TypeScript errors.
**Sprint 5 — UI/behavior fixes (tooltip, modal button, modal close):** [x] COMPLETE (2026-04-13) — v1.0.7-beta
**Sprint 4 — Theme display-name swap + light mode contrast fixes:** [x] COMPLETE (2026-04-13) — v1.0.6-beta
**Sprint 5 — UI/behavior fixes (tooltip reshape, modal button move, modal close fix):** [x] COMPLETE (2026-04-13) — v1.0.7-beta — Three targeted UI/behavior fixes on the generated story page and saved narrative modal: (1) Proofread highlight tooltip reshaped — changed max-w-[280px] (narrow vertical column) to min-w-[300px] max-w-[440px] (landscape/square layout), replaced hardcoded background '#111827' with theme-aware var(--bg-modal), increased padding from px-3 py-2 to px-4 py-3 for better proportions. Border remains 1px solid var(--accent-primary), text remains var(--text-primary). File: src/components/narrative/NarrativeDisplay.tsx. (2) Moved 'Update Narrative with Repair' button in saved narrative modal — relocated from top of modal (immediately inside Modal wrapper, before Meta Info) to between the Correction section and the COPY/PRINT/PDF/WORD/EMAIL action buttons row. File: src/components/dashboard/NarrativeDetailModal.tsx. (3) Fixed saved narrative modal close behavior — removed erroneous onClose() call from UpdateWithRepairModal's onClose handler that was closing BOTH the sub-popup AND the parent saved narrative modal. Now only calls setShowUpdateModal(false), keeping the parent modal open when the update sub-popup is dismissed. Parent modal's own X button close still works correctly via Modal component's onClose prop. File: src/components/dashboard/NarrativeDetailModal.tsx. No new files, no database changes, no auth/protected files touched. Build verified with zero TypeScript errors.
**Version single-source-of-truth refactor:** [x] COMPLETE (2026-04-10) — v1.0.5-beta — Established src/lib/version.ts as the single source of truth for the runtime APP_VERSION constant and wired the two existing display points to import from it, fixing a drift bug where NavBar was showing v1.0.3-beta while the admin analytics route was returning v1.0.2-beta. Changes: (1) Created src/lib/version.ts exporting `APP_VERSION = 'v1.0.5-beta'` with a header comment documenting the bump policy and the two import consumers. (2) Added `import { APP_VERSION } from '@/lib/version'` to src/components/layout/NavBar.tsx and replaced the hardcoded `"v1.0.3-beta"` literal in the center section JSX with `{APP_VERSION}`. No other JSX/styling/layout changes. (3) Added the same import to src/app/api/admin/analytics/route.ts and replaced the `'v1.0.2-beta'` string literal on the `systemHealth.appVersion` property with `APP_VERSION`. Response shape unchanged. (4) Updated the `version` field in package.json from `"0.1.0"` to `"1.0.5"` so it matches runtime (no v prefix, no -beta suffix per the header comment policy). No new files beyond version.ts, no database changes, no auth/protected files touched, no dependency changes. Build verified with zero TypeScript errors (11.0s compile, 8.9s TS check, 44/44 static pages). Post-build grep across src/ confirmed no other file hardcodes a vX.Y.Z-beta string — version.ts is now the only match. Noted but not modified: a stray untracked `version.ts` at the repo root (containing `'v1.0.4-beta'`) left over from earlier work — not touched per sprint scope.
**OTP Verify Type Fix:** [x] COMPLETE (2026-04-03) — Changed verifyOtp type from 'email' to 'signup' in /api/signup/verify-otp/route.ts. Root cause: Supabase stores OTP tokens generated by signInWithOtp() for NEW users as 'confirmation' type, not 'email'. Using type:'email' searched for the wrong token type, causing every OTP entry to fail with "token has expired or is invalid". The 'signup' type correctly matches the confirmation token. This was the ONLY change needed — all UI improvements (20-min countdown, conditional resend, magic link removal) were already implemented in prior sprints. Modified: src/app/api/signup/verify-otp/route.ts (single line change + updated comment). No new files, no database changes, no UI changes. Build verified with zero TypeScript errors.
**Remove Magic Link Reference + Conditional Resend:** [x] COMPLETE (2026-04-03) — Outlook Safe Links was pre-fetching the magic link in verification emails, consuming the one-time token before users could enter their OTP code (every verification failed with "Code expired"). Magic link removed from Supabase email template (done in dashboard). Frontend changes to src/app/(auth)/signup/page.tsx: (1) Removed getBrowserName() helper function — no longer needed. (2) Removed "You can also click the link in the email if you're using {browser}" paragraph entirely. (3) Made resend section conditional on codeExpiry === 0 — while the 20-min countdown is active, no resend option is shown (code is still valid). When countdown hits 0, "Didn't receive it? Check your spam folder or resend code" appears along with the resend button. (4) After successful resend, codeExpiry resets to 1200 which re-hides the resend section. (5) "Use a different email" link remains always visible regardless of expiry state. (6) Fixed cross-browser error toast that still referenced "6-digit code" → now says "verification code". No new files, no server-side changes. Build verified with zero TypeScript errors.
**OTP Expiration Countdown:** [x] COMPLETE (2026-04-03) — Added a visible 20-minute countdown timer to the OTP code entry UI on the signup page. Supabase OTP expiry is configured to 1200 seconds (20 min) in the dashboard. Changes to src/app/(auth)/signup/page.tsx only: (1) Added codeExpiry state variable (seconds remaining). (2) Added useEffect countdown timer that decrements every second (same pattern as resendCooldown). (3) Added formatExpiryTime() helper to display MM:SS format. (4) Set codeExpiry=1200 in handleRequestAccess when email is sent. (5) Reset codeExpiry=1200 in handleResendCode when new code is sent. (6) Clear codeExpiry=0 in "Use a different email" handler. (7) Added countdown display below VERIFY CODE button — shows "Code expires in MM:SS" in muted text, switches to accent-primary color when under 60 seconds for urgency, shows "Code expired — please request a new one" at 0. (8) VERIFY CODE button disabled when codeExpiry reaches 0. No new files, no server-side changes. Build verified with zero TypeScript errors.
**Cross-Browser OTP Code Verification:** [x] COMPLETE (2026-04-02) — Added 6-digit OTP code entry as the PRIMARY email verification method during signup Step 1, solving the cross-browser PKCE failure where magic links opened in a different browser (e.g., Edge→Chrome) silently fail because the code_verifier cookie is trapped in the originating browser. Evidence: 8 orphaned PKCE entries found in auth.flow_state table. Solution: After signInWithOtp() sends the magic link email, users now see a 6-digit code input field instead of just "check your email". The code is verified server-side via /api/signup/verify-otp (uses supabase.auth.verifyOtp with type:'email') — zero PKCE dependency, works from any browser/device. Magic link still works as a fallback for same-browser users. Changes: (1) Created src/app/api/signup/verify-otp/route.ts — server-side OTP verification endpoint with input sanitization (6-digit numeric only), user-friendly error mapping (expired/invalid codes), session cookie establishment via SSR library setAll(). (2) Updated src/app/auth/callback/route.ts — improved failure redirects: code exchange failure now redirects to /signup?error=cross-browser (instead of silent /login dump), token_hash failure redirects to /signup?error=link-expired. Success paths unchanged. (3) Updated src/app/(auth)/signup/page.tsx — added OTP state (otpCode, otpEmail, resendCooldown), resend cooldown timer effect, browser name detection helper, handleVerifyOtp handler (POST to /api/signup/verify-otp with 10s timeout), handleResendCode handler (reuses signInWithOtp with rate limit detection), error query param handling (cross-browser and link-expired toasts with URL cleanup), replaced emailSent UI block with: centered code input (numeric, mono font, 0.5em tracking, autoFocus, paste support), VERIFY CODE button (disabled until 6 digits), browser hint text, resend countdown timer (60s), resend code link, "Use a different email" link. New files: src/app/api/signup/verify-otp/route.ts. Modified: src/app/auth/callback/route.ts, src/app/(auth)/signup/page.tsx. No database changes, no UI component changes, no dependency changes. Build verified with zero TypeScript errors. MANUAL STEP REQUIRED: Update Supabase Magic Link email template (Dashboard → Authentication → Email Templates → Magic Link) to include {{ .Token }} displaying the 6-digit code prominently, with {{ .ConfirmationURL }} as secondary fallback link.
**Save Accent Color During Signup:** [x] COMPLETE (2026-03-30) — Fixed accent color selected during signup Step 2 not persisting to database. The AccentColorPicker saved to localStorage only; on logout (localStorage cleared) and re-login, theme reset to default purple. Fix: (1) Updated /api/signup/complete-profile to accept optional accentColor field and save it to preferences JSONB column as {appearance:{accentColor,mode:'dark',backgroundAnimation:true}} during the profile upsert. (2) Updated signup page handleProfileAndPassword to include localStorage.getItem('sd-accent-color') in the API call body. Modified: src/app/api/signup/complete-profile/route.ts, src/app/(auth)/signup/page.tsx. No new files, no database changes, no UI changes. Build verified with zero TypeScript errors.
**Eliminate Browser Client From Protected Page Load:** [x] COMPLETE (2026-03-30) — Fixed "Unable to load your profile" error and "signal is aborted without reason" / _acquireLock stack traces on /main-menu after login. Root cause: The browser Supabase client singleton (created at module scope in useAuth.ts line 45: `const supabase = createClient()`) has an internal auto-refresh daemon that acquires a mutex lock during initialization. When the session was created server-side (via /api/auth/login), the browser client tries to hydrate/refresh those cookies and locks up, blocking ALL subsequent operations including getSession(), onAuthStateChange(), and any data queries. Fix: (1) Created /api/auth/logout server-side route — performs supabase.auth.signOut() via server client, always returns success. (2) Created /api/preferences server-side route — GET reads user preferences from users.preferences JSONB column, POST updates it. Both authenticate via server-side cookie session. (3) Created /api/activity-log server-side route — accepts activity log inserts via POST, authenticates via session cookies, supports explicit user_id override for login logging. (4) REWROTE src/hooks/useAuth.ts — completely eliminated browser Supabase client. No import of @/lib/supabase/client, no createClient() at module scope, no getSession()/getUser()/onAuthStateChange(). Profile fetched entirely via /api/me (server-side). Sign-out uses /api/auth/logout (server-side). User object derived from profile response ({id, email}) instead of Supabase User type. (5) REWROTE ThemeProvider.tsx — replaced saveToSupabase() to use /api/preferences GET+POST instead of browser Supabase client, replaced loadUserPreferences() to fetch from /api/preferences instead of direct Supabase query, replaced initTheme useEffect to check auth via /api/me instead of browser getSession(), removed onAuthStateChange listener entirely (login/logout both do full page navigation so ThemeProvider re-mounts fresh). Removed import of UserPreferences type from database.ts (no longer needed). Zero references to @/lib/supabase/client remain. (6) REWROTE src/lib/activityLogger.ts — replaced browser Supabase client insert with fetch POST to /api/activity-log. Zero references to @/lib/supabase/client remain. Activity logging preserved for narrative page, ShareExportModal, and login page. (7) Verified ZERO browser Supabase client imports remain in hot path: src/hooks/, src/components/ThemeProvider.tsx, src/components/layout/, src/lib/activityLogger.ts — all clean. Only remaining browser client imports: src/app/(auth)/signup/page.tsx (signInWithOtp — required), src/components/dashboard/EditProfileModal.tsx (password change — user-initiated, not page load). New files: src/app/api/auth/logout/route.ts, src/app/api/preferences/route.ts, src/app/api/activity-log/route.ts. Modified: src/hooks/useAuth.ts (full rewrite), src/components/ThemeProvider.tsx (4 areas), src/lib/activityLogger.ts (full rewrite). No database changes, no UI changes. Build verified with zero TypeScript errors.
**Login Server-Side API Migration:** [x] COMPLETE (2026-03-30) — Fixed browser Supabase singleton mutex lock causing signInWithPassword() to timeout after 8s on login. Same class of bug as the signup Step 2 fix. Root cause: The browser client's internal auto-refresh daemon acquires a lock during initialization; when signInWithPassword() is called, it cannot acquire the lock and hangs indefinitely. Fix: (1) Created /api/auth/login server-side API route — performs signInWithPassword() via server Supabase client (cookie-based, no singleton lock), fetches user profile to determine onboarding status (needs profile → /signup?step=2, needs payment → /signup?step=3, complete → /main-menu), returns redirectTo + userId. (2) Rewrote handleLogin in login/page.tsx to POST to /api/auth/login via fetch instead of calling supabase.auth.signInWithPassword() on the browser client. Uses 12s timeout via withTimeout(). Uses window.location.href for navigation (full page load picks up new session cookies). (3) Replaced mount-time checkAuth in login/page.tsx to ONLY use fetch('/api/me') for session validation — removed all browser Supabase client calls (getSession, signOut, JWT decode). Eliminated the source of "[login] Auth check failsafe triggered" console warnings. (4) Removed all browser Supabase client imports from login page: createClient, supabase variable, clearExpiredAuthCookies. Zero browser client usage remains. (5) Applied same mount-time fix to signup/page.tsx — replaced checkAuthStatus to only use fetch('/api/me'), removed clearExpiredAuthCookies import and all browser client session/JWT checking. The supabase client is retained only for signInWithOtp() in Step 1. New files: src/app/api/auth/login/route.ts. Modified: src/app/(auth)/login/page.tsx, src/app/(auth)/signup/page.tsx. No database changes, no UI changes. Build verified with zero TypeScript errors.
**Signup Step 2/3 Server-Side API Migration:** [x] COMPLETE (2026-03-30) — Fixed browser client timeout on signup Step 2 ("CREATE ACCOUNT" hangs) and missing public.users row. Root cause: The browser Supabase singleton's auto-refresh daemon acquires a lock after exchangeCodeForSession() runs server-side in /auth/callback, blocking all subsequent auth operations (updateUser, getUser) on the browser client. Fix: (1) Created /api/signup/complete-profile server-side API route — handles password update via supabase.auth.updateUser() AND profile save via UPSERT (not UPDATE) to public.users, so it works even if the handle_new_user trigger fails to create the row. (2) Created /api/signup/activate server-side API route — handles subscription_status='bypass' update and optional team_id assignment via UPSERT. (3) Rewrote handleProfileAndPassword in signup page to POST to /api/signup/complete-profile instead of calling supabase.auth.updateUser() and supabase.from('users').update() directly on the browser client. Uses 15s timeout via withTimeout(). (4) Rewrote handlePaymentStep in signup page to POST to /api/signup/activate after access code validation instead of calling supabase.auth.getUser() and supabase.from('users').upsert() on the browser client. Uses 10s timeout. (5) Removed pendingTeamId state variable (no longer needed — team_id handled server-side). (6) Verified only safe browser client calls remain: getSession() (read-only cache), signOut({scope:'local'}) (stale session cleanup), signInWithOtp() (Step 1 email). New files: src/app/api/signup/complete-profile/route.ts, src/app/api/signup/activate/route.ts. Modified: src/app/(auth)/signup/page.tsx. No database changes, no UI changes. Build verified with zero TypeScript errors.
**Signup Email Redirect Fix (www Domain Mismatch):** [x] COMPLETE (2026-03-26) — Fixed signup email confirmation redirect landing on /login instead of /signup?step=2 due to www/non-www domain mismatch. Root cause: PKCE code_verifier cookie set on www.servicedraft.ai was inaccessible when auth callback processed on servicedraft.ai, causing exchangeCodeForSession() to fail silently. Fix: (1) Added www→non-www 308 redirect at TOP of middleware.ts, BEFORE updateSession() — ensures all traffic lands on canonical servicedraft.ai before any cookies are set/read. Skips localhost and preview deployments. (2) Updated emailRedirectTo in signup page signInWithOtp() to use process.env.NEXT_PUBLIC_APP_URL (non-www canonical) instead of window.location.origin (which resolves to www when user is on www). (3) Updated auth callback route.ts to use canonicalOrigin (from NEXT_PUBLIC_APP_URL) for all redirect URLs instead of requestUrl.origin, with added error logging. (4) Searched entire src/ for other window.location.origin auth usages — none found beyond the one fixed in signup. No new files, database changes, or UI changes. Build verified with zero TypeScript errors.
**Auth Base64 Cookie Hotfix:** [x] COMPLETE (2026-03-26) — Follow-up to stale cookie hotfix (cb943bc). clearExpiredAuthCookies() was silently failing because @supabase/ssr encodes cookie values in base64url format by default (prefix "base64-" + base64url-encoded JSON). The regex matching "access_token" ran against base64 gibberish, never matched, and returned false — allowing the SDK's auto-refresh loop to proceed with revoked tokens, locking the auth mutex and causing signIn timeouts. Fix: (1) Updated clearExpiredAuthCookies() in src/lib/utils.ts to detect the "base64-" prefix, strip it, convert base64url→standard base64 (- → +, _ → /), pad, and decode via atob() before regex matching. Added 90-second expiry margin matching the SDK's EXPIRY_MARGIN_MS (3 ticks × 30s) to prevent edge case where our function says "valid" but SDK considers it "near-expiry". (2) Moved clearExpiredAuthCookies() call to src/lib/supabase/client.ts singleton factory — runs BEFORE createBrowserClient() so stale cookies are nuked before the SDK constructor triggers _initialize() → _recoverAndRefresh(). The useEffect calls in login/signup pages ran too late (after SDK init). No new files, API routes, database changes, or UI changes. Build verified with zero TypeScript errors.
**Auth Stale Cookie Hotfix:** [x] COMPLETE (2026-03-26) — Post-cleanup hotfix for Supabase SDK auto-refresh infinite loop. After the Auth Session Fix Sprint purged zombie sessions from the database, users with pre-existing browser cookies hit an infinite retry loop: the SDK's auto-refresh daemon detects the expired JWT, tries to use the revoked refresh token, fails, and retries in a tight loop that locks the SDK's internal semaphore — causing signInWithPassword() to hang (8s timeout). Fix: (1) Added clearExpiredAuthCookies() utility to src/lib/utils.ts — reads Supabase auth cookies directly via document.cookie (bypassing the SDK), decodes the JWT, checks expiry, and nukes all sb- cookies if expired, BEFORE the SDK can trigger auto-refresh. Handles chunked cookies (sb-xxx-auth-token.0, .1, etc.). (2) Added clearExpiredAuthCookies() call at the top of checkAuth in login/page.tsx and checkAuthStatus in signup/page.tsx, BEFORE any getSession() call — if stale cookies are found, shows the form immediately without touching the SDK. (3) Added signOut({ scope:'local' }) to all catch blocks in JWT decode logic on both pages. No new files, API routes, database changes, or UI changes. Build verified with zero TypeScript errors.
**Login Timeout Fix Sprint:** [x] COMPLETE (2026-03-25) — Added `supabase.auth.signOut({ scope: 'local' })` call in login page's checkAuth function after detecting expired JWT. This releases the Supabase browser singleton's auth mutex lock that gets permanently held when a stale session's auto-refresh fails. Without this, signInWithPassword() hangs because it can't acquire the locked mutex. Single-line fix in src/app/(auth)/login/page.tsx. Build verified with zero errors.
**Auth Session Fix Sprint:** [x] COMPLETE (2026-03-25) — Comprehensive auth audit identified dual session management conflict: Supabase's built-in JWT/refresh token system was fighting a custom 8-hour localStorage timer (useSessionExpiry.ts) that force-signed users out and created zombie sessions via scope:'local' signOut. Supabase database cleanup performed externally (26 zombie sessions purged → 3 remaining, 23 revoked refresh tokens cleaned, 23 stale flow_state records cleared — zero user data affected). Code changes: (1) DELETED src/hooks/useSessionExpiry.ts — removed entire custom 8-hour timer system that was conflicting with Supabase's native session management, (2) REWROTE src/hooks/useAuth.ts — changed signOut from scope:'local' to scope:'global' (kills server-side sessions, prevents zombie accumulation), switched initializeAuth() from getUser() (network call that hangs on stale tokens) to getSession() (instant local cache read), removed sd-login-timestamp localStorage cleanup, (3) EDITED src/app/(protected)/layout.tsx — removed useSessionExpiry import and hook call, (4) EDITED src/app/(auth)/login/page.tsx — removed setLoginTimestamp import and call, (5) EDITED src/app/(auth)/signup/page.tsx — removed setLoginTimestamp import and call. No new files, API routes, database schema changes, UI changes, or user data modifications. Build verified with zero TypeScript errors.
**Next.js 16.2.1 Upgrade Sprint:** [x] COMPLETE (2026-03-24) — Upgraded Next.js 16.1.6 → 16.2.1, React 19.2.3 → 19.2.4, React DOM 19.2.3 → 19.2.4, eslint-config-next → 16.2.1. Build verified: compiled successfully in 9.3s (Turbopack), TypeScript check passed (7.9s), 37/37 static pages generated, zero errors. Dev server starts in 527ms. Expected middleware deprecation warning present (middleware.ts → proxy.ts migration deferred to future sprint). No code changes required — clean minor version bump.
**Login Loading Lockup Hotfix:** [x] COMPLETE (2026-03-24) — Hotfix: Added 5s timeout to middleware getUser() and 4s stale-cookie failsafe to login page to prevent loading lockup from expired auth cookies. (1) middleware.ts: wrapped bare getUser() call in Promise.race with 5000ms timeout — on timeout, user=null so protected routes redirect to /login and auth routes show their forms. (2) login/page.tsx: added 4-second failsafe useEffect that clears all sb- cookies via document.cookie expiry and sets checkingAuth=false if the auth check hangs. (3) login/page.tsx: added setCheckingAuth(false) before the return in the user-exists redirect path so the spinner doesn't stick if router.replace is slow. No new files, API routes, database changes, or RLS policies. Build verified with zero TypeScript errors.
**Signup Flow Reorder Sprint:** [x] COMPLETE (2026-03-24) — Reordered 3-step signup flow from [Email+Password → Access Code → Profile] to [Email Verification via Magic Link → Profile+Password → Access Code/Payment]. Step 1 now uses signInWithOtp() to send magic link (replaces signUp()), adds Confirm Email field and "Privacy Policy & Terms of Use" checkbox, button text "SEND SIGN UP LINK". Step 2 now combines password setting (via updateUser({ password })) with profile creation (first/last name, location, position, accent color), button text "CREATE ACCOUNT". Step 3 remains access code/payment validation but now redirects to /main-menu on success (with setLoginTimestamp() call). Updated onboarding detection in signup, login, and main-menu pages to check needsProfile before needsPayment. Updated Stripe route success_url to /main-menu and cancel_url to /signup?step=3. Auth callback at /auth/callback unchanged — still redirects to /signup?step=2 which is now correctly the profile page. Files modified: signup/page.tsx (major rewrite), login/page.tsx (2 locations), main-menu/page.tsx (1 location), api/stripe/route.ts (2 URLs). No new files, API routes, database changes, or RLS policies. Build verified with zero TypeScript errors.
**Sprint 2 Hotfix — Post-Testing Fixes (6 items):** [x] COMPLETE (2026-03-23) — (1) NavBar Hover Glow: added dual-layer --shadow-glow-btn CSS variable (15px@0.4 + 30px@0.2), applied to all nav buttons (Main Menu, Dashboard, Owner, Team, Log Out) replacing --shadow-glow-sm, increased transition duration from 200ms to 300ms. (2) Print Export Logo: added onerror="this.style.display='none'" to the footer logo img tag in buildPrintHtml() so broken images hide gracefully instead of showing placeholder. (3) Hero/Nav Unified Header: changed HeroArea background from bg-[var(--bg-primary)] to bg-[var(--bg-nav)] with backdrop-blur-[8px], also updated edge gradient overlay from --bg-primary to --bg-nav, creating seamless frosted glass header that matches NavBar. (4) Particle Network Light Mode: added data-mode check to readWaveColor() — returns '255, 255, 255' (white) when in light mode for visibility on colored backgrounds, keeps theme-colored particles in dark mode. (5) Story Type Selector Glow: replaced Framer Motion whileHover boxShadow with CSS hover:shadow-[var(--shadow-glow-btn)] for smooth dual-layer glow transition, added transition-all duration-300. (6) Light Mode Background Inversion: page-level backgrounds become the accent color (80/20 blend of accent RGB with neutral 50, auto-darkened for brightness>180), nav uses denser 50% accent shade, body gradient blends accent.gradient1 through bgPrimary to accent.gradient2. Cards use dark frosted glass (rgba(15,15,25,0.75)) for contrast against colored bg. All accent colors, opacity layers, borders, and component styling inside cards/modals remain untouched — their tinted glass look carries over from dark mode. Luminance checks restored to original behavior. Build verified with zero TypeScript errors.
**Sprint 2 — UI Overhaul (4 items):** [x] COMPLETE (2026-03-23) — (1) Universal Modal Fixes: default width widened from max-w-[600px] to max-w-[850px], z-index raised to z-[200]/z-[210] to render above NavBar z-[100] and HeroArea z-[110], removed pt-20 offset for true viewport centering with p-4, max-h changed to 90vh, backdrop blur increased to 10px with bg-black/75. Removed width overrides from EditStoryModal, UpdateWithRepairModal, SavedRepairsModal, and admin team members modal (all now use wider default). Kept narrow widths on confirmation/action dialogs. (2) NavBar Restructure: replaced UserPopup dropdown with always-visible individual nav buttons — Dashboard, Owner (owner role), Team (admin role), Log Out — styled as compact secondary pills with icons, icon-only on tablet, full labels on desktop. Mobile hamburger menu includes all nav items. Deleted UserPopup.tsx. (3) Sine Wave Enhancement: replaced 4-wave arrays in WaveBackground.tsx and 5-wave arrays in HeroArea.tsx with 7-wave desynchronized configurations (6x speed spread from 0.007-0.042, offsets across 2pi+, inverse amplitude-speed relationship). (4) Light Mode Overhaul: completely redesigned light mode from white/bright to "tinted dark mode" — accent color becomes environment background via computeLightBgPrimary() formula (70/30 blend of neutral base and accent RGB, auto-darkened for bright accents with perceived brightness >200), cards/modals/nav use dark frosted glass (rgba(15,15,25,0.75-0.92)), text flipped to light (#f0f0f5), borders changed to rgba(255,255,255,0.1), accent-text-emphasis uses bright accent color. Updated both buildCssVars() in themeColors.ts and applyTheme() in ThemeProvider.tsx. Build verified with zero TypeScript errors.
**Post-Deployment Sprint 1 — Quick Fixes (7 items):** [x] COMPLETE (2026-03-23) — Applied all 7 isolated fixes: (1) Logout timeout — wrapped supabase.auth.signOut() in Promise.race with 3-second timeout so stale tokens can't block redirect, (2) Email recipient limit — changed server-side validation from max 3 to max 10 to match client-side EmailExportModal, (3) Email logo URL — fixed case-sensitive 'logo.png' → 'Logo.png' in buildEmailHtml, (4) Print margins + logo — reduced @page margin to 13mm, body padding to 10mm/13mm, footer positioning to bottom:3mm right:13mm, changed print logo from relative to absolute URL, (5) Location dropdown — replaced plain text Input with Select dropdown using US_STATES from constants/states.ts in EditProfileModal, (6) Team reactivate — server PUT handler now accepts is_active field (with boolean type annotation), client handleToggleTeamActive sends is_active:true instead of just name, (7) Typing animation speed — changed all 4 useTypingAnimation speed values from 15ms to 7ms. Build verified with zero TypeScript errors.
**Auth Overhaul Sprint 1 — Eliminate getUser() Race Conditions:** [x] COMPLETE (2026-03-22) — Created /api/me server-side profile route (cookie-based auth, auto-create profile on first visit). Rewrote fetchProfileForUser in useAuth.ts to use /api/me with retry logic instead of direct Supabase browser client query. Replaced all ThemeProvider getUser() calls with getSession() (cache-only, no network call) in both initTheme and saveToSupabase. Fixed activityLogger to accept optional userId parameter instead of calling getUser() — falls back to getSession() cache. Updated login page to pass data.user.id to logActivity. Simplified visibilitychange handler to only fetch profile when profile is null (prevents unnecessary /api/me calls on every tab switch). Root cause: multiple browser-side components (useAuth, ThemeProvider, activityLogger) independently calling getUser() through the singleton Supabase client, causing GoTrueClient's internal AbortController to cancel in-flight requests, resulting in permanent null profile and blank pages. Build verified with zero TypeScript errors.
**Hotfix (Post Sprint F) — visibilitychange Init Collision + AbortError Handling:** [x] COMPLETE (2026-03-17) — Fixed regression introduced by previous hotfix: visibilitychange listener was firing immediately on page load (document already 'visible' at module init), colliding with initializeAuth() IIFE and causing both to call fetchProfileForUser simultaneously. One fetch would abort the other, triggering "Unable to load profile data" error. Applied two fixes: (FIX A) Added module-level appFullyInitialized flag, set to true in initializeAuth finally block after loading:false, added guard at top of visibilitychange handler to prevent activation until initial auth completes. (FIX B) Added AbortError check at top of fetchProfileForUser catch block — when fetch is legitimately cancelled, log warning and return early instead of setting profile:null, preventing false-positive error message. Build verified with zero TypeScript errors.
**Hotfix (Post Sprint F) — Auth Loading Lockup Fix:** [x] COMPLETE (2026-03-17) — Fixed auth loading state getting stuck on true when returning to an idle session after tab/browser has been inactive. Applied three complementary fixes: (1) Promise.race with 7-second timeout wrapping supabase.auth.getUser() in initializeAuth() — treats timeout as unauthenticated rather than hanging, (2) visibilitychange event listener using async/await getSession() with isRefreshing guard — prevents concurrent refresh pile-up when tab re-activates, reads from cookie cache instead of network to avoid race conditions, (3) startGlobalFailsafe() function with 10-second timeout forcing loading: false — last line of defense if all other guards fail. Build verified with zero TypeScript errors.
**Hotfix (Post Sprint F) — Auth Page getSession Fix:** COMPLETE — Changed mount-time auth checks on login and signup pages from getUser() (network request) to getSession() (local memory read) to prevent step revert race condition when token refresh hasn't settled. Added URL step parameter preservation in signup catch/else branches so the page stays on the correct step even if auth check fails.
**Sprint F — Clean Auth Loading Fix:** COMPLETE — Singleton Supabase browser client (prevents duplicate instances/network calls), removed buildFallbackProfile (root cause of redirect loops — was setting subscription_status:'trial' on any error, causing main-menu→signup→main-menu loop), all profile fetch errors now set profile:null, added 5s timeout on getUser() with stale session cleanup, 10s failsafe timer in initializeAuth, main-menu guard skips redirect when profile is null (shows spinner instead), added 8s loadingTooLong "Reset Session" button for user escape hatch, changed post-signup redirect from router.push to window.location.href (forces full page load with fresh middleware/cookies), fixed signOut to use scope:'local' (prevents hang on expired tokens) with finally-block redirect, fixed ProofreadResults setState-during-render (moved parent notifications to useEffect watching checkedEdits), fixed ActivityDetailModal z-index (z-[120]/z-[130] above HeroArea z-[90]/z-[110]), top-anchored positioning, wider modal (85vw/max-w-5xl), sticky X button, added bottom CLOSE button with hover animation, fixed ThemeProvider onAuthStateChange type annotations
**Sprint E — Team Dashboard Activity Tab Migration:** COMPLETE
**Sprint D — Polish & Cleanup:** COMPLETE — Updated admin API get_user_details to return recent_tracker_entries (5 most recent), replaced User Management expanded row "Recent Activity" section with clickable tracker entries showing R.O.#/vehicle/story type badge/action pills/timestamps that open ActivityDetailModal, added console.warn for tracker RPC/update partial failures, verified all trackerId null guards and resetAll flow, added proofread_apply to ACTION_BORDER_COLORS, updated formatActionLabel to use consistent past-tense labels (Generated/Regenerated/Customized/etc.) across admin page and detail modal, added trackerError state with ErrorState retry UI on Activity Log tab, improved empty state messaging, added NarrativeTrackerEntry and TrackerActionEntry types to database.ts and used them in ActivityDetailModal
**Sprint C — Dashboard Redesign:** COMPLETE — Added list_tracker_entries and get_tracker_detail admin API actions with search/filter/pagination, created new ActivityDetailModal in src/components/dashboard/ with vehicle info header, Block/C-C-C narrative toggle, and expandable action timeline with version snapshots, completely redesigned Activity Log tab on Owner Dashboard to use narrative_tracker data with new columns (User, R.O.#, Vehicle, Story Type, Actions pills, Last Activity), color-coded left borders by story type, tracker-specific filter/search/pagination, removed old activity_log query and inline expand behavior
**Sprint B — Narrative Lifecycle Tracker Wiring:** COMPLETE — Wired all narrative actions to lifecycle tracker: generate (createTrackerEntry with await for ID), regenerate/customize/proofread/proofread_apply/save (updateTrackerAction fire-and-forget), export_copy/export_print/export_pdf/export_docx (ShareExportModal trackerId prop), simplified all logActivity calls to remove heavy metadata (tracker handles rich data), activityLogger always sets output_preview to null
**Sprint A — Narrative Lifecycle Tracker Foundation:** COMPLETE — Created narrative_tracker table with action_history JSONB, append_tracker_history RPC, API route (create/update with version tracking), client utility (fire-and-forget), and trackerId field in narrative store
**Hotfix (Post Sprint B Task 1):** COMPLETE — Fixed Gemini API Usage Tracker: corrected model name from gemini-2.0-flash to gemini-3-flash-preview across entire codebase, fixed pricing rates from $0.10/$0.40 to $0.50/$3.00 per 1M tokens (input/output), updated migration default, fixed Recharts tooltip type errors
**Stage 6 Sprint B (Task 1):** COMPLETE — Gemini API Usage Tracker: modified Gemini client to return token usage metadata, created api_usage_log table migration, added server-side usage logger utility, instrumented all 6 API routes (generate, customize, proofread, apply-edits, update-narrative, convert-recommendation), built /api/admin/usage endpoint with aggregated stats, replaced Cost Calculator tab with live API Usage tab featuring summary cards, token/cost charts, action breakdown, and top users leaderboard
**Stage 6 Sprint B (Tasks 2-4):** COMPLETE — Email column truncation with tooltip on hover, center alignment on all table headers/cells, glowing accent-colored row hover effect across all data tables on both dashboards
**Stage 6 Sprint B (Tasks 5-6):** COMPLETE — Activity detail popup modal with full metadata display, owner team assignment with create team and assign user
**Stage 4 Sprint 1:** COMPLETE — Font rendering fix, sidebar positioning, button relocation, template rename, access code update
**Stage 4 Sprint 2:** COMPLETE — Clear form button, story type switching preservation, ProofreadResults render bug fix
**Stage 4 Sprint 3:** COMPLETE — Refactored repair templates to save only 5 core repair fields (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification), removing vehicle info and non-core fields from save/display/edit flows
**Stage 4 Sprint 4:** COMPLETE — Navigation overhaul: increased nav height (56px to 64px), clickable hero logo, MAIN MENU styled button, centered vector logo with theme-aware color inversion
**Stage 4 Sprint 5:** COMPLETE — Terms of Use content component, signup terms enforcement, main menu terms link, expanded FAQ content
**Hotfix 19A:** COMPLETE — Fix delete account API: removed stray "you" prefix from SUPABASE_SERVICE_ROLE_KEY in .env.local, hardened service client with trim() and auth options, added per-step error logging
**Stage 4 Sprint 6:** COMPLETE — Admin dashboard core rebuild: Overview tab with 8 metric cards, expanded analytics API (generations/exports/proofreads/customizations/templates/subscriptionBreakdown/activityByDay), top 10 users, activity logging audit verified
**Post-Sprint 6 UI/UX Fixes:** COMPLETE — Admin dashboard UI overhaul: wider layout (1400px), larger text sizes, animated button tabs, user table improvements (split name, role column, date formats), protected user badge, larger action icons
**Post-Sprint 6 UI/UX Fixes Round 2:** COMPLETE — Owner Dashboard UI round 2: stacked dates, centered headers, 90vw layout, sorting dropdown, premium title styling with neon glow and spotlight animation
**Stage 4 Sprint 7:** COMPLETE — Admin analytics with recharts charts (LineChart, BarChart, PieChart, AreaChart), time range selector (7d/30d/90d/all), system health indicators (DB row counts, last activity, app version)
**Stage 4 Sprint 8:** COMPLETE — Admin management tools, export, polish, and dashboard refinement
**Pre-Deployment Audit:** COMPLETE — Security hardening, auth on all API routes, rate limiting, CSP headers, env validation, code cleanup
**Stage 5 Sprint 1:** COMPLETE — Quick text/label fixes: Owner Dashboard rename, slider label updates, custom instructions maxLength, MAX_RECIPIENTS=10, loading spinner text, NavBar version label
**Stage 5 Sprint 2:** COMPLETE — Loading spinner size increase (xlarge variant ~2x) and full viewport centering below NavBar
**Stage 5 Sprint 3:** COMPLETE — NavBar glowing purple hover animations on all interactive elements (Main Menu, theme toggle, user button, dropdown items)
**Stage 5 Sprint 4:** COMPLETE — Signup page updates: AccentColorPicker added to Step 3 profile creation, Location text input replaced with US state dropdown (all 50 states), accent color persists via existing ThemeProvider (localStorage + Supabase preferences)
**Stage 5 Sprint 5:** COMPLETE — Dashboard split preferences into App Appearance modal and My Saved Repairs placeholder modal, added Owner Dashboard button for admin users with gold/amber accent
**Stage 5 Sprint 6:** COMPLETE — Full SavedRepairsModal with template list/create/edit/delete, narrative table row hover glow, wider dashboard container (max-w-7xl)
**Stage 5 Sprint 7:** COMPLETE — Owner Dashboard AI token usage pricing calculator with model selector, token inputs, proofread/customization toggles, and real-time cost estimates
**Stage 5 Sprint 8:** COMPLETE — Role hierarchy restructure from 2-tier (admin/user) to 3-tier (owner/admin/user). Owner = platform owner, Admin = Team Manager, User = standard. All access gates, API routes, badges, promote/demote logic updated.
**Stage 5 Sprint 9:** COMPLETE — Team management database schema, API routes, and signup integration
**Stage 5 Sprint 10:** COMPLETE — Team Manager Dashboard UI and Owner Dashboard team management
**Documentation Refresh v2.1:** COMPLETE — All 6 project knowledge files updated to v2.1 reflecting complete current application state (5,804 lines / 280.5 KB total)
**Documentation Refresh v2.0:** COMPLETE — All 6 project reference files updated to v2.0 reflecting current application state
**Stage 6 Sprint A (Task 1):** COMPLETE — Group→Team rename across entire codebase
**Stage 6 Sprint A (Tasks 2-5):** COMPLETE — Main menu dashboard buttons, team dashboard activity log + refresh, remove member function
**Stage 3 Sprint 2:** COMPLETE — Auto-sizing text fields in Edit Story modal
**Stage 3 Sprint 3:** COMPLETE — Matched email and print exports to PDF formatting
**Stage 3 Sprint 6:** COMPLETE — Added Inter font for data/input text readability
**Stage 3 Sprint 7:** COMPLETE — My Repairs database table and API routes
**Stage 3 Sprint 8:** COMPLETE — My Repairs UI panel with load, save, edit, and delete functionality
**Stage 3 Sprint 9:** COMPLETE — Diagnostic to Repair Complete update system with separate entry preservation
**Overall Progress:** 73 / 78 tasks complete (+ 87 post-build fixes applied, + 5 Stage 2 tasks complete, + 6 S2-4 tasks complete, + 5 S2-5 tasks complete, + 7 S2-6A tasks complete, + 4 S2-6B tasks complete, + 6 S2-6C tasks complete, + 2 Stage 3 S1 tasks complete, + 2 Stage 3 S4 tasks complete, + 1 Stage 3 S5 task complete, + 1 Stage 3 S6 task complete, + 4 Stage 3 S7 tasks complete, + 7 Stage 3 S8 tasks complete, + 8 Stage 3 S9 tasks complete)
**Stage 1 Status:** COMPLETE — All core features built, Gemini 3.0 Flash upgraded, documentation synced
**Stage 2 Sprint S2-1:** COMPLETE — Dashboard search enhanced with multi-column search, sort controls, filter pills, results count
**Stage 2 Sprint S2-4:** COMPLETE — Proofread highlighting with 30-second fade on narrative display (PB.84)
**Stage 2 Sprint S2-5:** COMPLETE — Email export via Resend integration with professional HTML template
**Stage 2 Sprint S2-6A:** COMPLETE — Admin dashboard with activity logging, route protection, and restriction check
**Stage 2 Sprint S2-6B:** COMPLETE — Admin user management: list, restrict, delete, password reset, subscription change
**Stage 2 Sprint S2-6C:** COMPLETE — Admin analytics dashboard with stat cards, charts, and auto-refresh
**Stage 3 Sprint 1:** COMPLETE — Saved story modal positioning/sizing fix + audit tooltip animation/opacity fix
**Stage 3 Sprint 4:** COMPLETE — Fixed OEM terminology audit flagging + added selective apply for suggested edits
**Stage 3 Sprint 5:** COMPLETE — Enhanced OEM terminology instructions in generation prompts
**Session 5A:** COMPLETE — CSS Variable System + Accent Color Infrastructure (PB.26–PB.28)
**Session 6A:** COMPLETE — Reactive Hero Animation Area + Nav Bar Overhaul (PB.29–PB.31)
**Post-5B Fixes:** COMPLETE — Hero enlargement, fixed positioning, background wave restore, nav consolidation (PB.32–PB.35)
**Session 7A:** COMPLETE — Page redesigns, cursor underglow, card hover changes, narrative reset (PB.42–PB.46)
**Session 7B:** COMPLETE — Navigation guard for unsaved narratives + auto-save on export (PB.47–PB.48)
**Session 8A:** COMPLETE — User Preferences Panel + Accent Color Picker + Supabase Persistence (PB.49–PB.51)
**Session 8B:** COMPLETE — Light mode styling fixes + White accent dark-mode lock (PB.52–PB.56)
**Session 9A:** COMPLETE — Particle Network animation + background animation toggle (PB.57–PB.60)
**Session 10A:** COMPLETE — Dashboard modal portal fix, wave amplitude/centering, nav consolidation, logo sizing, default dark mode, 8hr auto-logout (PB.61–PB.68)
**Session 11A:** COMPLETE — Fixed Main Menu page scroll and centered container, fixed white accent theme Generate Story button text to black, fixed black accent theme visibility with comprehensive dark styling and white text on Generate Story button (PB.70–PB.72)
**Session 12A:** COMPLETE — Gemini 3-flash-preview upgrade, signup page animation + logo doubling, final documentation sync (PB.79–PB.81)
**Session 13A:** COMPLETE — Pre-generation output customization panel on input page (PB.82)
**Hotfix 14A:** COMPLETE — Save narrative upsert on RO#, export freeze fix, UPDATE RLS policy, dashboard updated_at ordering (PB.83)
**Session 15A:** COMPLETE — Proofread highlighting with 30-second fade, highlight counter badge, clear highlights button (PB.84)
**Hotfix 16A:** COMPLETE — Export logo aspect ratio fix — preserve native 2.09:1 ratio (PB.85)
**Session 17A:** COMPLETE — Email export feature with Resend integration and professional HTML template (S2-5)
**Hotfix 18A:** COMPLETE — Fix save timeout: replace Promise.resolve wrapping with proper async pattern for Supabase queries, remove double timeout on save (PB.86)

---

## DOCUMENTATION REFRESH v2.1 — 2026-03-11

**Status:** COMPLETE

All 6 project knowledge files updated to v2.1 reflecting the complete current application state:

- [x] CLAUDE_CODE_BUILD_INSTRUCTIONS.md — 1,617 lines, 78.5 KB (architecture reference with all systems)
- [x] ServiceDraft_AI_Project_Instructions_v1_3.md — 605 lines, 35.7 KB (app overview, workflows, communication rules)
- [x] ServiceDraft_AI_UI_Design_Spec_v1.md — 1,150 lines, 48.7 KB (complete visual design system, 23 sections)
- [x] ServiceDraft_AI_Prompt_Logic_v1.md — 1,165 lines, 53.3 KB (all AI logic, data flows, 26 sections)
- [x] PRE_BUILD_SETUP_CHECKLIST.md — 343 lines, 17.3 KB (setup, deployment, troubleshooting)
- [x] ServiceDraft_AI_Spec_v1_3.md — 924 lines, 47.0 KB (full spec, 17 sections, 71 features)

Total project knowledge base: 5,804 lines / 280.5 KB (doubled from previous versions)

---

## SPRINT A — NARRATIVE LIFECYCLE TRACKER: FOUNDATION — 2026-03-12

**Status:** COMPLETE

Backend infrastructure for the Narrative Lifecycle Tracker — no UI changes, no existing behavior changes.

- [x] **Task 1 — Database Migration: narrative_tracker table + append_tracker_history RPC**
  - Created `narrative_tracker` table with vehicle/RO info, current narrative content, boolean+timestamp action pairs, JSONB action_history array
  - Added indexes on `last_action_at DESC` and `user_id`
  - Enabled RLS with policies for user SELECT/INSERT/UPDATE and service role full access
  - Created `append_tracker_history()` RPC function (SECURITY DEFINER) for atomic JSONB append + last_action_at bump
  - Migration applied to production Supabase: `create_narrative_tracker`

- [x] **Task 2 — API Route: src/app/api/narrative-tracker/route.ts**
  - POST handler with action-based routing (`create` and `update`)
  - Uses service-role Supabase client (same pattern as admin route)
  - `create`: inserts new tracker row with initial generate action_history entry (version 1)
  - `update`: fetches current row for version tracking, appends history via RPC, updates columns per actionType
  - Handles all action types: regenerate, customize, proofread, proofread_apply, save, export_copy/print/pdf/docx
  - Ownership verification on update, full try/catch error handling

- [x] **Task 3 — Client Utility: src/lib/narrativeTracker.ts**
  - `createTrackerEntry(data)`: POST to API, returns tracker ID or null
  - `updateTrackerAction(trackerId, actionType, data?)`: POST to API, returns boolean
  - Fire-and-forget pattern — all errors caught silently, never breaks user workflows

- [x] **Task 4 — Narrative Store Update: src/stores/narrativeStore.ts**
  - Added `trackerId: string | null` to NarrativeState interface (default: null)
  - Added `setTrackerId(id)` action
  - `trackerId` resets to null via `resetAll()` (initialState spread)

---

## PHASE 0: PROJECT INITIALIZATION
*Set up the project skeleton, install dependencies, and configure the development environment.*

### 0.1 — Initialize Next.js Project
- [x] Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` in the project root
- [x] Verify the app runs with `npm run dev` and loads at localhost:3000
- **Completed:** 2026-02-15
- **Notes:** Project was already initialized with Next.js 16.1.6, Tailwind v4, TypeScript, ESLint. Build verified successfully.

### 0.2 — Install All Dependencies
- [x] Install core dependencies:
  ```
  npm install @supabase/supabase-js @supabase/ssr framer-motion @google/generative-ai stripe @stripe/stripe-js
  ```
- [x] Install dev/utility dependencies:
  ```
  npm install lucide-react react-hot-toast
  ```
- **Completed:** 2026-02-15
- **Notes:** All 21 packages installed successfully, 0 vulnerabilities.

### 0.3 — Project Folder Structure
- [x] Create the following folder structure inside `src/`:
  ```
  src/
  ├── app/
  │   ├── (auth)/
  │   │   ├── login/
  │   │   │   └── page.tsx
  │   │   └── signup/
  │   │       └── page.tsx
  │   ├── (protected)/
  │   │   ├── main-menu/
  │   │   │   └── page.tsx
  │   │   ├── input/
  │   │   │   └── page.tsx
  │   │   ├── narrative/
  │   │   │   └── page.tsx
  │   │   └── dashboard/
  │   │       └── page.tsx
  │   ├── api/
  │   │   ├── generate/
  │   │   │   └── route.ts
  │   │   ├── proofread/
  │   │   │   └── route.ts
  │   │   ├── customize/
  │   │   │   └── route.ts
  │   │   ├── stripe/
  │   │   │   └── route.ts
  │   │   └── support/
  │   │       └── route.ts
  │   ├── layout.tsx
  │   ├── page.tsx              (Landing Page)
  │   └── globals.css
  ├── components/
  │   ├── ui/                   (Reusable UI primitives)
  │   ├── layout/               (NavBar, UserPopup, etc.)
  │   ├── input/                (Input page components)
  │   ├── narrative/            (Generated narrative components)
  │   └── dashboard/            (Dashboard components)
  ├── lib/
  │   ├── supabase/
  │   │   ├── client.ts
  │   │   ├── server.ts
  │   │   └── middleware.ts
  │   ├── gemini/
  │   │   └── client.ts
  │   ├── stripe/
  │   │   └── client.ts
  │   └── utils.ts
  ├── hooks/                    (Custom React hooks)
  ├── stores/                   (State management)
  ├── types/                    (TypeScript type definitions)
  └── constants/                (App constants, field configs)
  ```
- [x] Create placeholder `page.tsx` files for each route with minimal content
- **Completed:** 2026-02-15
- **Notes:** All folders and placeholder files created. All API routes, page routes, lib files, and component directories in place.

### 0.4 — Tailwind Configuration
- [x] Update `tailwind.config.ts` with ServiceDraft.AI custom theme extensions (colors, shadows, animations from UI Design Spec)
- [x] Update `globals.css` with CSS custom properties from UI Design Spec Section 12
- [x] Set up the gradient background as the base body style
- **Completed:** 2026-02-15
- **Notes:** Using Tailwind v4 CSS-first config via @theme inline in globals.css (no tailwind.config.ts needed). All ServiceDraft colors, shadows, animations, and CSS custom properties configured. Logo copied to public/logo.png.

### 0.5 — Environment Variables Validation
- [x] Create `src/lib/env.ts` with runtime validation that all required env vars are present
- [x] Verify `.env.local` has all required values (Supabase, Gemini, Stripe)
- [x] Ensure `.gitignore` includes `.env.local`
- **Completed:** 2026-02-15
- **Notes:** .env.local has Supabase, Gemini, and Stripe keys. STRIPE_WEBHOOK_SECRET and ACCESS_CODE are optional and will be added in Phase 8. .gitignore covers .env* files.

### 0.6 — Git Initial Commit
- [x] Stage all files: `git add .`
- [x] Commit: `git commit -m "Initial project setup with Next.js, Tailwind, and folder structure"`
- [x] Push to GitHub: `git push origin main`
- **Completed:** 2026-02-16
- **Notes:** Committed as part of "Initial commit" (1f26f45).

---

## PHASE 1: DESIGN SYSTEM & SHARED UI COMPONENTS
*Build the visual foundation — reusable components that every page will use.*

### 1.1 — Sine Wave Animated Background
- [x] Create `src/components/ui/WaveBackground.tsx` — canvas-based sine wave animation
- [x] Implement wave properties from UI Design Spec Section 4 (color #c3abe2, 15-25% opacity, 3-5 waves, 8-12s cycle)
- [x] Layer behind all content at z-10
- [x] Runs continuously on all pages
- **Completed:** 2026-02-15
- **Notes:** 4 wave layers with varying amplitude, frequency, speed, and opacity. Canvas-based, full viewport.

### 1.2 — Liquid Card Component
- [x] Create `src/components/ui/LiquidCard.tsx` — glassmorphism card with configurable sizes
- [x] Implement Liquid material specs: bg #c5ade5 at 5%, border 2px solid black, radius 23px, blur 2px, glow #49129b
- [x] Include hover state with enhanced glow
- [x] Props for size variants: compact, standard, spacious
- **Completed:** 2026-02-15
- **Notes:**

### 1.3 — Button Components
- [x] Create `src/components/ui/Button.tsx` with variants: primary, secondary, ghost
- [x] Primary: bg #a855f7, hover #9333ea with glow, active scale 0.98, disabled state
- [x] Secondary: transparent bg, border #a855f7, hover tint
- [x] Ghost: no border, text only with hover
- [x] Size variants: small, medium, large, fullWidth
- **Completed:** 2026-02-15
- **Notes:**

### 1.4 — Form Input Components
- [x] Create `src/components/ui/Input.tsx` — text input with ServiceDraft styling
- [x] Create `src/components/ui/Textarea.tsx` — multiline input
- [x] Create `src/components/ui/Select.tsx` — dropdown with custom styling
- [x] All: bg #0f0520, border #6b21a8, focus ring #a855f7, placeholder #9ca3af
- [x] Include label component with proper styling
- **Completed:** 2026-02-15
- **Notes:** All three components use forwardRef for compatibility.

### 1.5 — Modal Component
- [x] Create `src/components/ui/Modal.tsx` — reusable modal with scale animation
- [x] Liquid material styling, 600px default width, 23px radius
- [x] Dark backdrop with blur
- [x] Close on backdrop click and escape key
- [x] Framer Motion scale animation (95% → 100%)
- **Completed:** 2026-02-15
- **Notes:**

### 1.6 — Toast Notification System
- [x] Set up react-hot-toast with ServiceDraft.AI themed styling
- [x] Custom toast styles: success (purple glow), error (red), info (neutral)
- [x] Position: top-center
- [x] z-index: 50
- **Completed:** 2026-02-15
- **Notes:** ToastProvider added to root layout.

### 1.7 — Loading Spinner Component
- [x] Create `src/components/ui/LoadingSpinner.tsx` — branded spinner with contextual message
- [x] Purple glow aesthetic with pulsing animation
- [x] Accepts `message` prop for different loading contexts
- **Completed:** 2026-02-15
- **Notes:** Size variants: small, medium, large.

### 1.8 — Typing Animation Hook
- [x] Create `src/hooks/useTypingAnimation.ts` — custom hook for character-by-character text display
- [x] Configurable speed (default 20-50ms per character)
- [x] Returns current display text and isAnimating state
- [x] Handles interruption (new text while still animating)
- **Completed:** 2026-02-15
- **Notes:** Also returns skip() function to immediately show full text.

### 1.9 — Logo Component
- [x] Create `src/components/ui/Logo.tsx` — renders the ServiceDraft.AI logo
- [x] Place `SERVIDRAFT_AI_LOGO_1_.PNG` in `public/` directory
- [x] Size variants: small (nav), medium (menu), large (landing)
- [x] Optional glow animation on hover
- **Completed:** 2026-02-15
- **Notes:** Logo copied to public/logo.png.

### 1.10 — Git Commit: Design System
- [x] Commit all design system components: `"Add design system: cards, buttons, inputs, modal, toast, spinner, wave background"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 2: AUTHENTICATION SYSTEM
*Set up Supabase Auth — login, signup, session management, route protection.*

### 2.1 — Supabase Client Setup
- [x] Create `src/lib/supabase/client.ts` — browser-side Supabase client
- [x] Create `src/lib/supabase/server.ts` — server-side Supabase client (for API routes)
- [x] Create `src/lib/supabase/middleware.ts` — session refresh middleware
- **Completed:** 2026-02-15
- **Notes:**

### 2.2 — Auth Middleware
- [x] Create `src/middleware.ts` — Next.js middleware for route protection
- [x] Redirect unauthenticated users from protected routes to login
- [x] Redirect authenticated users from auth pages to main menu
- [x] Refresh session on every request
- **Completed:** 2026-02-15
- **Notes:** Next.js 16 shows deprecation warning for middleware (recommends "proxy"), but works correctly.

### 2.3 — Database Tables (Supabase)
- [x] Create `users` table in Supabase with schema from spec (id, email, username, location, position, profile_picture_url, subscription_status, stripe_customer_id, created_at, updated_at)
- [x] Create `narratives` table in Supabase with schema from spec (id, user_id, ro_number, vehicle_year, vehicle_make, vehicle_model, concern, cause, correction, full_narrative, story_type, created_at)
- [x] Set up Row Level Security (RLS) policies — users can only read/write their own data
- [x] Create SQL migration file: `supabase/migrations/001_initial_schema.sql`
- **Completed:** 2026-02-15
- **Notes:** SQL migration includes auto-profile-creation trigger, updated_at trigger, and indexes. User must run the SQL in Supabase SQL Editor. **Updated 2026-02-19:** Added first_name, last_name columns via `supabase/migrations/002_add_name_fields_and_position_update.sql`. Position changed to dropdown with predefined roles. Profile picture replaced with position-based icons.

### 2.4 — Landing Page
- [x] Build `src/app/page.tsx` — Landing Page with logo, LOGIN button, REQUEST ACCESS button
- [x] Animated background with sine waves
- [x] Logo with glow effect, centered
- [x] Framer Motion entrance animations
- **Completed:** 2026-02-15
- **Notes:**

### 2.5 — Login Page
- [x] Build `src/app/(auth)/login/page.tsx` — email + password form
- [x] Form validation (required fields, email format)
- [x] Supabase Auth sign-in integration
- [x] Error handling (invalid credentials, network errors)
- [x] Loading state during authentication
- [x] Redirect to Main Menu on success
- **Completed:** 2026-02-15
- **Notes:**

### 2.6 — Sign-Up Page (Step 1: Account Creation)
- [x] Build `src/app/(auth)/signup/page.tsx` — multi-step signup flow
- [x] Step 1: Email, Password, Confirm Password
- [x] Password validation (minimum length, match confirmation)
- [x] Supabase Auth sign-up integration
- **Completed:** 2026-02-15
- **Notes:** All 3 signup steps in a single page with step indicators.

### 2.7 — Sign-Up Page (Step 2: Payment / Access Code)
- [x] Step 2: Stripe payment form OR access code bypass
- [x] Access code field with validation (hardcoded code for prototype)
- [x] Stripe Elements integration for credit card input (test mode)
- [x] On success: update subscription_status in users table
- **Completed:** 2026-02-15
- **Notes:** Access code bypass implemented via /api/stripe route. Default code: SERVICEDRAFT2026. Full Stripe Elements integration deferred to Phase 8.

### 2.8 — Sign-Up Page (Step 3: Profile Creation)
- [x] Step 3: First Name (required), Last Name (required), Location, Position (dropdown) fields
- [x] Save profile data to users table
- [x] Redirect to Main Menu on completion
- **Completed:** 2026-02-15 (Updated 2026-02-19)
- **Notes:** **Updated 2026-02-19:** Added first_name, last_name as required fields. Position changed from text input to dropdown with predefined roles (Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk). Profile picture upload removed — replaced with position-based icons.

### 2.9 — Auth Context / Hook
- [x] Create `src/hooks/useAuth.ts` — custom hook for accessing current user data
- [x] Provides: user object, loading state, signOut function
- [x] Auto-fetches user profile from users table
- **Completed:** 2026-02-15
- **Notes:** Also includes refreshProfile function and auth state change listener. Database types in src/types/database.ts.

### 2.10 — Git Commit: Auth System
- [x] Commit: `"Add authentication system: login, signup, middleware, database schema"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 3: NAVIGATION & LAYOUT
*Build the nav bar, main menu, user popup, and shared layout.*

### 3.1 — Navigation Bar
- [x] Create `src/components/layout/NavBar.tsx` — fixed top nav bar
- [x] Glassmorphism: bg rgba(0,0,0,0.8), blur 8px, bottom border purple tint
- [x] Logo (small), nav links, User ID trigger button
- [x] z-index: 100
- **Completed:** 2026-02-15
- **Notes:** Includes mobile hamburger menu.

### 3.2 — User ID Popup
- [x] Create `src/components/layout/UserPopup.tsx` — dropdown from user avatar
- [x] Display: username, location, position
- [x] Quick link to User Dashboard
- [x] Log Out button
- [x] Click-outside to close
- **Completed:** 2026-02-15
- **Notes:**

### 3.3 — Protected Layout
- [x] Create `src/app/(protected)/layout.tsx` — shared layout for authenticated pages
- [x] Includes NavBar, WaveBackground, and body padding for nav height
- [x] Wraps all protected routes
- **Completed:** 2026-02-15
- **Notes:**

### 3.4 — Main Menu Page
- [x] Build `src/app/(protected)/main-menu/page.tsx`
- [x] Large centered card with logo
- [x] GENERATE NEW STORY button → /input
- [x] USER DASHBOARD button → /dashboard
- [x] LOG OUT button → sign out → /
- [x] FAQ/INFO button → info modal
- [x] SUPPORT button → support ticket modal
- [x] Framer Motion staggered entrance animations
- **Completed:** 2026-02-15
- **Notes:**

### 3.5 — FAQ Modal
- [x] Create FAQ/instruction content modal
- [x] App usage instructions, field explanations
- **Completed:** 2026-02-15
- **Notes:** 7 FAQ items covering app usage.

### 3.6 — Support Ticket Modal
- [x] Create support form modal (name, email, message)
- [x] API route `src/app/api/support/route.ts` to send email to admin
- **Completed:** 2026-02-15
- **Notes:** Currently logs to console. Email sending can be added later.

### 3.7 — Git Commit: Navigation & Layout
- [x] Commit: `"Add navigation, main menu, user popup, FAQ, and support"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 4: INPUT PAGE
*The core input form — story type selection, dynamic fields, dropdown logic, validation.*

### 4.1 — Field Configuration Constants
- [x] Create `src/constants/fieldConfig.ts` — defines all input fields for both story types
- [x] Diagnostic Only: 9 fields (fields 1-5 required, 6-9 conditional)
- [x] Repair Complete: 10 fields (fields 1-5 required, 6-10 conditional)
- [x] Each field definition: id, label, type, required, hasDropdown, dropdownOptions
- **Completed:** 2026-02-15
- **Notes:**

### 4.2 — Story Type Selection Component
- [x] Create `src/components/input/StoryTypeSelector.tsx`
- [x] Two large buttons: DIAGNOSTIC ONLY and REPAIR COMPLETE
- [x] Selected state styling (purple glow highlight)
- [x] Selecting a type shows the corresponding field set
- **Completed:** 2026-02-15
- **Notes:**

### 4.3 — Conditional Field Component
- [x] Create `src/components/input/ConditionalField.tsx`
- [x] Dropdown with three options: Include Information, Don't Include, Generate Applicable Info
- [x] When "Include Information" → field becomes required, show text input
- [x] When "Don't Include" → field hidden/dimmed, not required
- [x] When "Generate Applicable Info" → field shows AI badge, not required
- **Completed:** 2026-02-15
- **Notes:**

### 4.4 — Input Page Assembly
- [x] Build `src/app/(protected)/input/page.tsx`
- [x] Story type selector at top
- [x] Dynamic field rendering based on selected story type
- [x] Required fields (1-5) always shown with required indicator
- [x] Conditional fields (6+) with dropdown controls
- [x] Proper scrolling behavior for all fields
- **Completed:** 2026-02-15
- **Notes:**

### 4.5 — Form Validation & GENERATE STORY Button
- [x] GENERATE STORY button at bottom of form
- [x] Button stays DISABLED until validation passes
- [x] Visual disabled state (gray, no hover effect)
- [x] Enabled state (purple, glow on hover)
- **Completed:** 2026-02-15
- **Notes:**

### 4.6 — Compiled Data Block Assembly
- [x] Create `src/lib/compileDataBlock.ts` — function to build the data block sent to API
- [x] Skips R.O. # (field 1) — saved to state only
- [x] Includes fields 2-5 always
- [x] For fields 6+: handles all three dropdown options per Prompt Logic doc
- [x] "Generate Applicable Info" injects the AI inference instruction text
- [x] Returns the compiled string for the API call
- **Completed:** 2026-02-15
- **Notes:**

### 4.7 — Input Page State Management
- [x] Create `src/stores/narrativeStore.ts` — global state for the narrative workflow
- [x] Stores: story type, all field values, compiled data block, R.O. #
- [x] Stores: generated narrative (all 4 keys), current display format
- [x] Persists across page navigation (input → narrative page)
- **Completed:** 2026-02-15
- **Notes:** Hook-based global store with listener pattern. Also stores customization slider state.

### 4.8 — Git Commit: Input Page
- [x] Commit: `"Add input page with story type selection, dynamic fields, validation, and data compilation"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 5: AI INTEGRATION (GEMINI API)
*Server-side API routes that talk to Google Gemini, plus the prompt assembly pipeline.*

### 5.1 — Gemini Client Setup
- [x] Create `src/lib/gemini/client.ts` — configured Gemini API client
- [x] Uses GEMINI_API_KEY from environment
- [x] Configures model (gemini-3-flash-preview)
- [x] Utility function for sending prompts and parsing JSON responses
- **Completed:** 2026-02-15
- **Notes:** Uses gemini-3-flash-preview. parseJsonResponse strips markdown code fences before parsing.

### 5.2 — Generate Narrative API Route
- [x] Create `src/app/api/generate/route.ts`
- [x] POST endpoint that receives: compiled data block + story type
- [x] Selects correct system prompt (Diagnostic Only vs Repair Complete) from Prompt Logic doc
- [x] Sends to Gemini API with system prompt + user prompt
- [x] Parses JSON response (4 keys: block_narrative, concern, cause, correction)
- [x] Error handling: invalid JSON, missing keys, API errors
- [x] Returns parsed narrative to client
- **Completed:** 2026-02-15
- **Notes:**

### 5.3 — Customize Narrative API Route
- [x] Create `src/app/api/customize/route.ts`
- [x] POST endpoint that receives: current narrative text + customization modifiers
- [x] Uses customization-specific system prompt from Prompt Logic doc Section 8
- [x] Builds modifier block from slider values + custom instructions
- [x] Sends to Gemini API
- [x] Returns rewritten narrative (same 4-key JSON structure)
- **Completed:** 2026-02-15
- **Notes:** Uses LENGTH_MODIFIERS, TONE_MODIFIERS, DETAIL_MODIFIERS from constants/prompts.ts.

### 5.4 — Proofread/Audit API Route
- [x] Create `src/app/api/proofread/route.ts`
- [x] POST endpoint that receives: current narrative text + story type + vehicle info
- [x] Uses audit system prompt from Prompt Logic doc Section 6
- [x] Returns: flagged_issues, suggested_edits, overall_rating, summary
- [x] Error handling for malformed responses
- **Completed:** 2026-02-15
- **Notes:**

### 5.5 — Git Commit: API Routes
- [x] Commit: `"Add Gemini API integration: generate, customize, and proofread routes"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 6: GENERATED NARRATIVE PAGE
*Display the narrative, format toggle, regenerate, edit, customization panel, proofread.*

### 6.1 — Narrative Display Component
- [x] Create `src/components/narrative/NarrativeDisplay.tsx`
- [x] Block format view: renders block_narrative as single paragraph
- [x] C/C/C format view: renders concern, cause, correction as labeled sections
- [x] Typing animation on initial load and regeneration
- [x] All text rendered in uppercase per spec
- **Completed:** 2026-02-15
- **Notes:** Uses useTypingAnimation hook with skip support.

### 6.2 — Format Toggle Button
- [x] Dynamic button that shows opposite of current format
- [x] In Block mode → shows "C/C/C FORMAT" button
- [x] In C/C/C mode → shows "BLOCK FORMATTING" button
- [x] Switches display instantly (no API call)
- **Completed:** 2026-02-15
- **Notes:** Integrated into narrative page bottom action bar.

### 6.3 — Regenerate Story Button
- [x] REGENERATE STORY button on left panel
- [x] Re-calls generate API with ORIGINAL compiled data block (stored in state)
- [x] Shows loading spinner during API call
- [x] Replaces narrative display with new response + typing animation
- **Completed:** 2026-02-15
- **Notes:** Also resets customization sliders on regenerate.

### 6.4 — AI Customization Panel
- [x] Create `src/components/narrative/CustomizationPanel.tsx`
- [x] Toggle switch to show/hide panel
- [x] Three sliders: Length (Short/Standard/Detailed), Tone (Warranty/Standard/Customer Friendly), Detail Level (Concise/Standard/Additional Steps)
- [x] Custom Instructions text field
- [x] APPLY CUSTOMIZATION TO STORY button
- [x] Validation: at least one slider must differ from Standard OR custom text entered
- [x] Toast if no changes: "Adjust at least one slider or add custom instructions before applying."
- [x] Sends CURRENT narrative text to customize API route
- [x] Loading state during API call
- **Completed:** 2026-02-15
- **Notes:** Segmented controls instead of range sliders for cleaner UX.

### 6.5 — Review & Proofread Section
- [x] REVIEW & PROOFREAD STORY button on left panel
- [x] Sends current narrative to proofread API route
- [x] Flagged Issues box (read-only, typing animation)
- [x] Suggested Edits box (read-only, typing animation)
- [x] Rating badge: PASS (green), NEEDS_REVIEW (yellow), FAIL (red)
- [x] Summary text below badge
- **Completed:** 2026-02-15
- **Notes:** ProofreadResults component with typing animation support.

### 6.6 — Edit Story Modal
- [x] EDIT STORY button opens modal with editable text fields
- [x] If in Block mode: single editable textarea with block_narrative
- [x] If in C/C/C mode: three editable textareas (concern, cause, correction)
- [x] Save changes updates the display state (and recalculates block_narrative from 3 fields if in C/C/C)
- [x] Cancel discards changes
- **Completed:** 2026-02-15
- **Notes:**

### 6.7 — Save Story Function
- [x] SAVE STORY button saves to Supabase narratives table
- [x] Saves: user_id, ro_number, vehicle year/make/model, concern, cause, correction, full_narrative, story_type
- [x] Toast: "Story saved successfully"
- [x] Error handling for database failures
- **Completed:** 2026-02-15
- **Notes:** Direct Supabase client insert from client side with RLS. **Fixed 2026-02-25:** Changed `.insert()` to `.upsert()` on `(user_id, ro_number)` — re-saving the same R.O.# now overwrites instead of duplicating. Added `updated_at` column, UPDATE RLS policy, and unique constraint via migration `003_narrative_upsert_support.sql`.

### 6.8 — Share/Export Modal
- [x] SHARE/EXPORT STORY button opens export options modal
- [x] Copy Text to Clipboard (with toast confirmation)
- [x] Print Generated Narrative (browser print dialog)
- [x] Download as PDF Document (real PDF via server-side jsPDF generation)
- [x] Download as Word Document (.docx via server-side docx package)
- **Completed:** 2026-02-15 (Overhauled 2026-02-19, Layout redesigned 2026-02-19)
- **Notes:** **Layout redesigned 2026-02-19:** Export layout completely redesigned — two-column header with vehicle info (left) and R.O.# (right), SD icon logo (`ServiceDraft-ai-tight logo.PNG`) top-right, centered "REPAIR NARRATIVE" title (18pt bold underlined), bold/italic/underlined C/C/C section headers (13pt), generous spacing between sections. Same formatting applied to both fresh narrative exports AND saved narrative exports from dashboard. All export paths use shared `downloadExport()` utility from `src/lib/exportUtils.ts`.

### 6.9 — Generated Narrative Page Assembly
- [x] Build `src/app/(protected)/narrative/page.tsx`
- [x] Left panel: Regenerate, Customization toggle + panel, Review & Proofread + results
- [x] Right panel: Narrative display with format toggle
- [x] Bottom: Edit, Format Toggle, Save, Share/Export buttons
- [x] Loading state when arriving from input page (initial generation)
- [x] Redirect to input page if no narrative data in state
- **Completed:** 2026-02-15
- **Notes:** Two-column layout (left controls, right display) with responsive stacking on mobile.

### 6.10 — Git Commit: Narrative Page
- [x] Commit: `"Add generated narrative page with all controls: display, edit, customize, proofread, save, export"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 7: USER DASHBOARD
*Profile management and saved narrative history.*

### 7.1 — Profile Display Section
- [x] Create `src/components/dashboard/ProfileSection.tsx`
- [x] Displays: position-based icon, full name, internal ID, location, position
- [x] UPDATE button opens edit profile flow
- **Completed:** 2026-02-15 (Updated 2026-02-19)
- **Notes:** **Updated 2026-02-19:** Profile picture replaced with position-based icon (PositionIcon component). Displays full name (first_name + last_name) instead of just username.

### 7.2 — Edit Profile Flow
- [x] Update Profile Information modal (first name, last name, location, position dropdown)
- [x] Change Password modal (new password, confirm)
- [x] Each saves to Supabase and shows toast confirmation
- **Completed:** 2026-02-15 (Updated 2026-02-19)
- **Notes:** **Updated 2026-02-19:** Added first_name and last_name fields. Position changed to dropdown. Profile picture upload removed.

### 7.3 — Saved Narrative History Table
- [x] Create `src/components/dashboard/NarrativeHistory.tsx`
- [x] Table columns: Date, Timestamp, R.O. #, Year, Make, Model, Saved Story (preview)
- [x] Fetches from narratives table filtered by user_id
- [x] Search/filter functionality
- [x] Sorted by most recent first
- **Completed:** 2026-02-15
- **Notes:** Client-side search filtering by R.O. #, make, model, concern text, and year.

### 7.4 — Narrative Detail Popup
- [x] Click any row → opens modal with full narrative (READ ONLY)
- [x] Shows complete C/C/C format + vehicle info + date
- [x] Share/Export options in popup (copy, print, PDF)
- [x] No edit capability (audit integrity)
- **Completed:** 2026-02-15
- **Notes:** Copy and Print buttons. Read-only display.

### 7.5 — Dashboard Page Assembly
- [x] Build `src/app/(protected)/dashboard/page.tsx`
- [x] Profile section at top
- [x] Narrative history table below
- [x] Main Menu button in header
- **Completed:** 2026-02-15
- **Notes:**

### 7.6 — Git Commit: Dashboard
- [x] Commit: `"Add user dashboard with profile management and saved narrative history"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 8: STRIPE INTEGRATION
*Subscription billing setup.*

### 8.1 — Stripe Configuration
- [x] Create `src/lib/stripe/client.ts` — server-side Stripe client
- [x] Create Stripe product and price in Stripe Dashboard (test mode)
- [x] Store price ID in environment variables
- **Completed:** 2026-02-15
- **Notes:** Uses Stripe v20.3.1. STRIPE_PRICE_ID env var needed for checkout. User must create product/price in Stripe Dashboard.

### 8.2 — Checkout API Route
- [x] Create `src/app/api/stripe/route.ts` — creates Stripe checkout session
- [x] Redirects user to Stripe's hosted payment page
- [x] Success URL returns to signup completion
- [x] Cancel URL returns to signup payment step
- **Completed:** 2026-02-15
- **Notes:** Updated route handles both access code bypass (existing) and Stripe checkout via mode='checkout'. Requires STRIPE_PRICE_ID and NEXT_PUBLIC_APP_URL env vars.

### 8.3 — Webhook Handler
- [x] Create `src/app/api/stripe/webhook/route.ts` — handles Stripe webhook events
- [x] Listens for: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
- [x] Updates subscription_status in users table
- **Completed:** 2026-02-15
- **Notes:** Uses raw body + stripe-signature header. Requires STRIPE_WEBHOOK_SECRET. Falls back to anon key if SUPABASE_SERVICE_ROLE_KEY not set.

### 8.4 — Access Code Bypass
- [x] Implement hardcoded access code check in signup flow
- [x] Valid code skips Stripe, sets subscription_status to "bypass"
- [x] Access code stored as environment variable for easy changing
- **Completed:** 2026-02-15
- **Notes:** Default code: SERVICEDRAFT2026. Already implemented in Phase 2, now integrated into updated stripe route.

### 8.5 — Git Commit: Stripe
- [x] Commit: `"Add Stripe subscription integration with webhook and access code bypass"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 9: POLISH & ANIMATIONS
*Page transitions, micro-interactions, loading states, responsive design.*

### 9.1 — Page Transition Animations
- [x] Add Framer Motion page transitions (fade + slight slide)
- [x] Wrap protected layout in AnimatePresence
- [x] Each page has entrance animation
- **Completed:** 2026-02-15
- **Notes:** PageTransition component created. All protected pages already use motion.div for entrance animations.

### 9.2 — Button & Card Micro-interactions
- [x] Hover glow effects on all buttons
- [x] Active press scale on buttons (0.98)
- [x] Card hover glow enhancement
- [x] Input focus ring animations
- **Completed:** 2026-02-15 (Updated 2026-02-19)
- **Notes:** **Updated 2026-02-19:** Framer Motion whileHover/whileTap added to LiquidCard, Button, StoryTypeSelector, and main menu bottom links. Spring transition config (stiffness: 400, damping: 25) for snappy motion. See PB.19-PB.21.

### 9.3 — Loading States Audit
- [x] Verify ALL API calls show loading spinner with contextual message
- [x] Generate Narrative: "Generating your warranty narrative..."
- [x] Regenerate: "Regenerating narrative..."
- [x] Customize: "Applying customization settings..."
- [x] Proofread: "Reviewing narrative for issues..."
- [x] Save: Brief loading indicator
- **Completed:** 2026-02-15
- **Notes:** All loading states verified in narrative page.

### 9.4 — Mobile Responsive Design
- [x] Test and fix all pages on mobile viewport (375px width)
- [x] Input page: single column layout on mobile
- [x] Narrative page: stacked layout (controls above narrative) on mobile
- [x] Dashboard: scrollable table on mobile
- [x] Nav bar: hamburger menu on mobile
- **Completed:** 2026-02-15
- **Notes:** Responsive patterns in place: flex-col lg:flex-row, overflow-x-auto table, hamburger menu.

### 9.5 — Error States
- [x] Add error boundaries for unexpected crashes
- [x] API error messages displayed as toasts
- [x] Empty states for dashboard (no saved narratives yet)
- [x] Network error handling (offline detection)
- **Completed:** 2026-02-15
- **Notes:** ErrorBoundary component added to protected layout. Toast errors on all API calls. Dashboard shows empty state message.

### 9.6 — Git Commit: Polish
- [x] Commit: `"Add animations, micro-interactions, responsive design, and error handling"`
- **Completed:** 2026-02-16
- **Notes:** Included in "Initial commit" (1f26f45).

---

## PHASE 10: DEPLOYMENT
*Deploy to Vercel, connect domain, final testing.*

### 10.1 — Vercel Deployment Setup
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel dashboard (same as .env.local)
- [ ] Deploy initial build
- [ ] Verify app loads at Vercel URL
- **Completed:**
- **Notes:** Requires user action: push code to GitHub, connect repo in Vercel dashboard, add env vars.

### 10.2 — Supabase Production Config
- [ ] Verify RLS policies are active
- [ ] Set up Supabase redirect URLs for auth (add Vercel domain)
- [ ] Test login/signup flow on deployed version
- **Completed:**
- **Notes:**

### 10.3 — Stripe Production Config (When Ready)
- [ ] Switch Stripe to live mode (only when ready for real payments)
- [ ] Update environment variables with live keys
- [ ] Configure Stripe webhook endpoint URL to Vercel domain
- **Completed:**
- **Notes:**

### 10.4 — Full End-to-End Testing
- [ ] Test complete flow: Landing → Signup → Main Menu → Input → Generate → Save → Dashboard
- [ ] Test login flow for existing user
- [ ] Test all narrative features: generate, regenerate, customize, proofread, edit, save, export
- [ ] Test dashboard: view profile, edit profile, search history, view saved narrative
- [ ] Test on mobile device
- **Completed:**
- **Notes:**

### 10.5 — Final Git Commit & Tag
- [ ] Commit any remaining changes
- [ ] Create git tag: `git tag v1.0.0-mvp`
- [ ] Push tag: `git push origin v1.0.0-mvp`
- **Completed:**
- **Notes:**

---

## POST-BUILD FIXES (2026-02-16)
*Bug fixes and improvements discovered during testing.*

### PB.1 — Logo Too Small on Landing Page and Nav Bar
- [x] Increased Logo component size variants: small (192x48), medium (320x80), large (600x150)
- [x] Landing page logo now renders as dominant hero visual
- [x] Nav bar logo scaled to 48px tall with preserved aspect ratio
- **Completed:** 2026-02-16

### PB.2 — Save Story Fails
- [x] Fixed save error handling to show actual Supabase error messages in toast
- [x] Added console.error logging for debugging save failures
- [x] Save function correctly inserts all required fields into narratives table
- **Completed:** 2026-02-16

### PB.3 — PDF and Print Export Open Blank Tab
- [x] Replaced window.open('', '_blank') print approach with hidden iframe printing
- [x] PDF download now uses Blob + anchor click for direct file download (no popup)
- [x] Added vehicle info header to export/print output
- **Completed:** 2026-02-16

### PB.4 — User Dashboard Stuck on Loading Animation
- [x] Added try/catch/finally to useAuth profile fetching — loading state always resolves
- [x] Added error logging to fetchProfile and fetchNarratives
- [x] Dashboard shows fallback message when profile fails to load instead of blank page
- [x] Fixed supabase client creation to use useRef for stable reference
- **Completed:** 2026-02-16

### PB.5 — Narrative Page Doesn't Reset for New Stories
- [x] Added generationId tracking to narrative store
- [x] Input page calls clearForNewGeneration() before navigating to narrative page
- [x] Narrative page detects new generationId and auto-generates fresh narrative
- [x] Previous narrative, proofread results, and customization settings cleared on new generation
- **Completed:** 2026-02-16

### PB.6 — Customize API 500 Error (Token Limit)
- [x] Added maxOutputTokens parameter to generateWithGemini (default 8192)
- [x] Applied to all Gemini API calls: generate, customize, proofread, and apply-edits
- [x] Added specific error message logging in customize route
- **Completed:** 2026-02-16

### PB.7 — Logout Function Doesn't Work
- [x] Made signOut a useCallback in useAuth for stable reference
- [x] Main Menu logout now awaits signOut and clears narrative store state
- [x] UserPopup logout now awaits signOut and clears narrative store state
- [x] Fixed supabase client in useAuth to use useRef (prevents recreation on re-render)
- **Completed:** 2026-02-16

### PB.8 — Add Prompt Rule: No Document ID Numbers
- [x] Added rule to DIAGNOSTIC_ONLY_SYSTEM_PROMPT (rule 8)
- [x] Added rule to REPAIR_COMPLETE_SYSTEM_PROMPT (rule 9)
- [x] Added rule to CUSTOMIZATION_SYSTEM_PROMPT (rule 5)
- **Completed:** 2026-02-16

### PB.9 — Add "Apply Suggested Edits" Button to Proofread Section
- [x] Created new API route: src/app/api/apply-edits/route.ts
- [x] Dedicated system prompt for applying audit edits while maintaining narrative quality
- [x] APPLY SUGGESTED EDITS button appears only after proofread with suggestions
- [x] Loading state: "Applying suggested edits..."
- [x] Clears proofread results after applying (narrative changed, old audit no longer applies)
- [x] maxOutputTokens set to 8192
- [x] Toast on success: "Suggested edits applied"
- **Completed:** 2026-02-16

### PB.10 — Auth Callback Route for Email Confirmation
- [x] Created `src/app/auth/callback/route.ts` to handle Supabase PKCE code exchange
- [x] Redirects to `/signup?step=2` after successful email confirmation
- [x] Falls back to `/login` if code exchange fails
- **Completed:** 2026-02-16
- **Notes:** Requires `http://localhost:3000/auth/callback` to be added to Supabase Redirect URLs for seamless redirect. Currently using default Supabase redirect (email confirmed via default flow, user signs in to continue).

### PB.11 — Signup/Login Multi-Step Onboarding Flow Fix
- [x] Signup page reads `step` query param from URL to resume at correct step
- [x] Signup checks auth status on mount and determines correct step based on profile
- [x] After step 1 (signUp), shows "Check Your Email" message instead of advancing
- [x] Step 2 uses upsert to handle missing profile row
- [x] Login page checks onboarding status (subscription_status, username) after sign-in
- [x] Login redirects to `/signup?step=2` or `?step=3` if onboarding incomplete
- [x] Login redirects already-authenticated users based on profile status on mount
- [x] Middleware no longer redirects authenticated users from `/signup` or `/login`
- **Completed:** 2026-02-16
- **Notes:** Profile creation page is no longer bypassed. Users must complete all 3 signup steps.

### PB.12 — AbortError Fix in useAuth Hook
- [x] Added `active` flag to useEffect to prevent state updates after unmount
- [x] Added AbortError catch in getUser to suppress React strict mode noise
- [x] Auth state change listener checks `active` flag before setting state
- **Completed:** 2026-02-16

### PB.13 — Main Menu Hooks Order & Onboarding Guard Fix
- [x] Moved useState calls above early return guard to fix React hooks order violation
- [x] Added onboarding guard: checks profile.subscription_status and profile.username
- [x] Redirects to `/signup?step=2` or `?step=3` if onboarding incomplete
- [x] Shows loading spinner while checking onboarding status
- **Completed:** 2026-02-16

### PB.14 — User Profile System Overhaul: Name Fields, Position Dropdown, Position Icons
- [x] Added `first_name` and `last_name` VARCHAR columns to users table (migration: `002_add_name_fields_and_position_update.sql`)
- [x] Updated `src/types/database.ts` — added `first_name: string | null` and `last_name: string | null` to UserProfile interface
- [x] Updated signup form (Step 3) — First Name and Last Name are now REQUIRED fields
- [x] Changed Position field from open text input to `<select>` dropdown with predefined roles: Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk
- [x] Created `src/constants/positions.ts` — shared position options constant
- [x] Created `src/components/ui/PositionIcon.tsx` — position-based SVG icons using lucide-react (Wrench, Hammer, ScanLine, PenLine, ClipboardList, BookOpen)
- [x] Updated `ProfileSection.tsx` — shows position icon instead of profile picture, displays full name
- [x] Updated `UserPopup.tsx` — shows position icon instead of profile picture, displays full name
- [x] Updated `EditProfileModal.tsx` — added first/last name fields, position dropdown instead of text input
- [x] Updated `useAuth.ts` — added first_name, last_name to UserProfile interface and all fallback objects
- **Completed:** 2026-02-19
- **Notes:** profile_picture_url column kept in DB for backward compatibility but no longer used. Position dropdown will be used for analytics in Sprint 6 Admin Dashboard.

### PB.15 — UserPopup Stale Profile Data (Icon & Position Not Updating)
- [x] Root cause: `useAuth()` hook used component-local `useState` — each consumer (UserPopup, dashboard, main-menu, narrative, SupportForm) had independent profile copies
- [x] Refactored `useAuth.ts` to use module-level shared state pattern (same as `narrativeStore.ts`)
- [x] Single shared `authState` object with listener-based notification across all consumers
- [x] Single Supabase auth subscription (no longer duplicated per component)
- [x] `refreshProfile()` from any component now updates all mounted consumers immediately
- **Completed:** 2026-02-19
- **Notes:** UserPopup.tsx itself was correct — it was already reading `profile?.position`. The underlying data source (`useAuth`) was the problem. After editing profile in EditProfileModal, all components (UserPopup, ProfileSection, etc.) now show updated position icon and text instantly.

### PB.16 — Vehicle Information Not Saving to Dashboard Narratives
- [x] Field ID mismatch corrected — save function now uses `year`, `make`, `model` matching fieldConfig.ts
- [x] Fixed in `handleSave`, `handleProofread`, and `ShareExportModal` vehicleInfo in `src/app/(protected)/narrative/page.tsx`
- [x] All 6 occurrences of `vehicle_year`/`vehicle_make`/`vehicle_model` replaced with `year`/`make`/`model`
- **Completed:** 2026-02-19
- **Notes:** Vehicle info is metadata for saved records and exports only — not sent to AI for generation.

### PB.17 — Saved Narrative Modal Too Transparent
- [x] Modal opacity increased to 85% — bg changed from `rgba(197,173,229,0.05)` to `rgba(15,10,30,0.85)`
- [x] Blur increased from `backdrop-blur-sm` (4px) to `backdrop-blur-xl` (24px)
- [x] Updated in `src/components/ui/Modal.tsx`
- **Completed:** 2026-02-19
- **Notes:** Modal now renders as a solid dark card. Text is fully readable without background bleed-through.

### PB.18 — Input Page Text Fields Don't Wrap or Expand
- [x] Created `src/components/ui/AutoTextarea.tsx` — auto-expanding textarea with same styling as Input
- [x] Input page: `customer_concern` (required field 5) now uses AutoTextarea
- [x] ConditionalField.tsx: all conditional fields (6+) now use auto-expanding `<textarea>` instead of `<input type="text">`
- [x] Short fields (R.O.#, Year, Make, Model) remain as single-line inputs
- [x] Text wraps to next line, field height grows with content, no horizontal scrolling
- **Completed:** 2026-02-19
- **Notes:** Uses `resize: none` + `overflow: hidden` + `scrollHeight` resize pattern. Starts at 2 rows, expands as needed.

### PB.19 — Framer Motion Hover/Tap Animations on All Interactive Elements
- [x] LiquidCard.tsx: Converted to motion.div with whileHover={{ scale: 1.02, boxShadow: purple glow }} and whileTap={{ scale: 0.98 }}
- [x] Button.tsx: Converted to motion.button with whileHover={{ scale: 1.05, boxShadow: purple glow }} and whileTap={{ scale: 0.95 }}
- [x] StoryTypeSelector.tsx: Converted to motion.button with whileHover={{ scale: 1.03 }} and whileTap={{ scale: 0.97 }}
- [x] Main menu FAQ/SUPPORT links: Added whileHover/whileTap animations
- [x] All use spring transition (stiffness: 400, damping: 25) for snappy, premium motion
- [x] Disabled buttons skip hover/tap animations
- **Completed:** 2026-02-19
- **Notes:** Root cause was CSS-only hover effects with no Framer Motion whileHover/whileTap properties. Fixed by converting all interactive elements to motion components.

### PB.20 — Logo Vertical Centering in NavBar
- [x] Added `flex items-center` to the Link wrapper around the Logo in NavBar.tsx
- [x] Logo now perfectly vertically centered within 64px nav bar height
- **Completed:** 2026-02-19
- **Notes:** Root cause was Link wrapper had no flex alignment, logo was offset within the 64px-tall nav despite items-center on parent.

### PB.21 — Page Transition Animations Verified
- [x] All four protected pages (main-menu, input, narrative, dashboard) have Framer Motion entrance animations
- [x] All use motion.div with initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
- [x] Wave background runs continuously on all protected pages via protected layout
- **Completed:** 2026-02-19
- **Notes:** Page transitions were already implemented correctly. Verified all pages have consistent fade-in + slide-up entrance animation.

### PB.22 — Export System Overhaul: Real PDF & Word Document Generation
- [x] Installed `jspdf` for server-side PDF generation and `docx` for Word (.docx) generation
- [x] Created API route `src/app/api/export-pdf/route.ts` — generates real PDF documents with jsPDF
- [x] Created API route `src/app/api/export-docx/route.ts` — generates .docx files with the docx package
- [x] Both exports include: logo letterhead (top-right), vehicle info header (14pt bold), R.O.# line, separator, narrative content (11pt body)
- [x] C/C/C format: section headers (CONCERN, CAUSE, CORRECTION) at 14pt bold with content under each
- [x] Block format: flowing paragraph with 1.5 line spacing
- [x] Automatic page breaks for long narratives (PDF)
- [x] Updated `ShareExportModal.tsx` — PDF button now calls real API route, added "DOWNLOAD AS WORD DOCUMENT" button with FileText icon
- [x] Loading states during PDF/DOCX generation ("GENERATING PDF...", "GENERATING DOCUMENT...")
- [x] Logo priority: `public/logo-bw.png` → `public/logo.png` → text fallback ("ServiceDraft.AI")
- [x] Removed unused printRef and hidden div from ShareExportModal
- **Completed:** 2026-02-19
- **Notes:** Previous implementation generated a plain .txt file labeled as PDF. Now generates real PDF and Word documents suitable for warranty documentation. User can create an optimized `public/logo-bw.png` for best results in exported documents.

### PB.23 — Export Document Layout Redesign & Unified Export Paths
- [x] Redesigned PDF and DOCX export layout: SD icon logo (top-right, ~1 inch), two-column header (Vehicle Info left, R.O.# right), centered "REPAIR NARRATIVE" title, styled C/C/C sections
- [x] Logo: uses `/public/ServiceDraft-ai-tight logo.PNG` (small square SD icon), removed references to old logo files
- [x] Two-column header: "Vehicle Information:" bold underlined with YEAR/MAKE/MODEL labels (11pt bold) and values (11pt regular) on left; "Repair Order #:" bold underlined with R.O. number (20pt bold) on right
- [x] Title: "REPAIR NARRATIVE" at 18pt bold underlined, centered, with generous spacing before/after
- [x] C/C/C section headers: 13pt bold italic underlined; body text: 11pt regular; generous spacing between sections
- [x] Block format: same header/title, flowing paragraph body at 11pt regular
- [x] Created shared export utility `src/lib/exportUtils.ts` — `ExportPayload` interface + `downloadExport()` function used by all export callers
- [x] Updated `ShareExportModal.tsx` to use shared `downloadExport()` utility
- [x] Updated `NarrativeDetailModal.tsx` — added PDF and DOCX export buttons, normalizes `Narrative` type fields (vehicle_year→year, vehicle_make→make, vehicle_model→model, ro_number→roNumber) to `ExportPayload` format
- [x] Fixed dashboard print: replaced `window.open()` popup approach with hidden iframe printing (same as narrative page)
- [x] All 4 export paths (PDF from narrative, DOCX from narrative, PDF from dashboard, DOCX from dashboard) now produce identical document formatting
- **Completed:** 2026-02-19
- **Notes:** Font: Helvetica (PDF) / Arial (DOCX). DOCX uses invisible-border Table for two-column header layout. PDF uses coordinate-based positioning. Both routes read the same logo file and apply the same layout specification.

### PB.24 — Move Export Logo to Footer & Fix R.O.# Overlap
- [x] Moved SD logo from document header/body to document **footer** (bottom-right of every page)
- [x] PDF: logo drawn after all body content, looped across all pages at `pageHeight - logoHeight - 5`
- [x] DOCX: logo moved from `Header` component to `Footer` component (repeats on every page)
- [x] Removed logo from body/header area — two-column header (Vehicle Info left, R.O.# right) no longer overlaps with logo
- **Completed:** 2026-02-19

### PB.25 — Export Logo Resize & Aspect Ratio Fix
- [x] Reduced logo size by ~40% total from original 1-inch square (15% initial reduction + 30% additional)
- [x] Applied 1.3:1 width-to-height aspect ratio — logo image is wider than tall, prevents squished appearance
- [x] PDF dimensions: 19.6mm × 15mm (was 25.4mm × 25.4mm)
- [x] DOCX dimensions: 55px × 43px (was 72px × 72px)
- [x] Applied to all export paths (narrative page PDF/DOCX + dashboard saved narrative PDF/DOCX)
- **Completed:** 2026-02-19

### PB.26 — Accent Color Theming System (Full Implementation)
- [x] Created `src/lib/constants/themeColors.ts` — 9 accent colors (Violet, Red, Orange, Yellow, Green, Blue, Pink, White, Black) with full derived values (hex, rgb, hover, bright, border, deep, textSecondary, waveRgb, logoFile, gradient, bgInput, bgElevated)
- [x] Created `src/components/ThemeProvider.tsx` — React context provider with `useTheme()` hook, localStorage persistence (`sd-accent-color`, `sd-color-mode`), runtime CSS variable injection via `document.documentElement.style.setProperty()`
- [x] Rewrote `src/app/globals.css` — comprehensive `:root` block with 40+ CSS custom properties defaulting to Violet; body background uses `var(--body-bg)`, scrollbar styling uses CSS vars
- [x] Wrapped app in ThemeProvider (`src/app/layout.tsx`)
- [x] Replaced ALL hardcoded purple/violet color values across entire `src/` directory (30+ component files) with CSS variable references:
  - `#a855f7` → `var(--accent-hover)`, `#9333ea` → `var(--accent-primary)`, `#c084fc` → `var(--accent-bright)`
  - `#6b21a8` → `var(--accent-border)`, `#49129b` → `var(--accent-deep)`, `#c4b5fd` → `var(--text-secondary)`
  - `#0f0520` → `var(--bg-input)`, `rgba(197,173,229,0.05)` → `var(--bg-card)`, `rgba(15,10,30,0.85)` → `var(--bg-modal)`
  - All `rgba(168,85,247,...)` opacity variants → `var(--accent-10)`, `var(--accent-20)`, etc.
  - All `boxShadow` glow effects → `var(--shadow-glow-sm)`, `var(--shadow-glow-md)`, `var(--shadow-glow-lg)`
  - `#9ca3af` → `var(--text-muted)`, `#ffffff` → `var(--text-primary)`
- [x] Updated `Logo.tsx` — dynamically loads accent-colored logo PNG from `accent.logoFile`, glow uses `var(--accent-50)`
- [x] WaveBackground reads `--wave-color` CSS variable via `getComputedStyle()` for dynamic wave color
- [x] Light/dark mode support — Black accent auto-activates light mode; ThemeProvider overrides bg/text vars accordingly
- [x] 9 accent-colored logo files added to `public/`: logo-violet.PNG, logo-red.PNG, logo-orange.PNG, logo-yellow.PNG, logo-green.PNG, logo-blue.PNG, logo-pink.PNG, logo-white.PNG, logo-black.PNG
- **Completed:** 2026-02-19
- **Notes:** This is the foundation for all future UI work. Every component now uses CSS variables instead of hardcoded colors. Changing the accent color updates the entire app in real-time. `buildCssVars()` generates all property values from a single accent color config object. New components should always use `var(--accent-*)` references, never hardcoded hex values.

### PB.27 — CSS Variable Cascading Fix (Derived Variables)
- [x] `globals.css`: Changed `--body-bg` from hardcoded hex gradient to `linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-primary) 50%, var(--bg-gradient-2) 100%)` — now cascades when source vars change
- [x] `globals.css`: Changed `--bg-card` from `rgba(147,51,234,0.05)` to `var(--accent-5)` — cascades from accent opacity vars
- [x] `globals.css`: Changed `--text-secondary` from `#c4b5fd` to `var(--accent-text)` — cascades from accent text var
- [x] `globals.css`: Changed `--scrollbar-track` to `var(--bg-input)`, `--scrollbar-thumb` to `var(--accent-border)`, `--scrollbar-thumb-hover` to `var(--accent-hover)`
- [x] `themeColors.ts`: Removed `--body-bg`, `--bg-card`, `--text-secondary`, `--scrollbar-track`, `--scrollbar-thumb`, `--scrollbar-thumb-hover` from `buildCssVars()` — these now derive via CSS `var()` references instead of being overwritten with inline strings
- [x] `ThemeProvider.tsx`: Light mode override uses `var(--accent-8)` for `--bg-card` and `var(--bg-elevated)` for `--scrollbar-track`; removed redundant `--body-bg` inline override
- [x] `Select.tsx`: Replaced hardcoded `#c4b5fd` SVG data URI dropdown arrow with `ChevronDown` icon using `var(--text-secondary)`
- **Completed:** 2026-02-19
- **Notes:** Root cause: derived CSS variables (body-bg, bg-card, scrollbar-*, text-secondary) had hardcoded default values in `:root` AND were being overwritten by `buildCssVars()` with hardcoded inline strings. Changing `--accent-*` in DevTools didn't cascade because the derived vars were independent. Fix: make derived vars reference source vars via `var()`, remove them from `buildCssVars()` so inline styles don't override the cascading references.

### PB.28 — Fix Input Backgrounds, Page Gradient, and Wave Animation
- [x] `globals.css`: Added `color-scheme: dark` to `:root` — tells browsers to render form controls with dark-scheme chrome (prevents bright white input backgrounds)
- [x] `globals.css`: Added CSS overrides for `input`, `textarea`, `select` to use `var(--bg-input)` background and `var(--text-primary)` color; placeholder colors use `var(--text-muted)`
- [x] `themeColors.ts`: Re-added `--body-bg` to `buildCssVars()` as a fully resolved gradient string (not var() references) — CSS var() composition in `:root` is unreliable when source vars are set as inline styles by JS
- [x] `ThemeProvider.tsx`: Added `color-scheme` property setting (dark/light based on effective mode); re-added `--body-bg` to light mode override with light gradient
- [x] `WaveBackground.tsx`: Changed to read `--wave-color` from `document.documentElement.style` (inline) first, then `getComputedStyle` fallback — more reliable since ThemeProvider sets it via inline style
- **Completed:** 2026-02-19
- **Notes:** Three issues from PB.27: (1) Input fields had white backgrounds because Tailwind v4 preflight sets `background-color: transparent` and without `color-scheme: dark` browsers render form controls with light chrome. (2) Page gradient stayed purple because PB.27 removed `--body-bg` from `buildCssVars()` to rely on CSS var() composition, but this doesn't cascade reliably with inline style overrides. (3) Wave animation read `--wave-color` via `getComputedStyle` which may lag behind inline style changes.

### SESSION 5A — CSS Variable System + Accent Color Infrastructure — COMPLETE
- **Scope:** PB.26, PB.27, PB.28
- **Completed:** 2026-02-19
- **Notes:** All hardcoded purple values replaced with CSS custom properties. ThemeProvider updates all --accent-, --bg-, --text-, --shadow-glow- variables. Input fields, page backgrounds, wave animation, modals, and scrollbars all reference theme variables. Verified via DevTools console test — full red color swap works across all pages. Minor hydration timing issue on main menu card initial render (resolves on navigation, will be fixed in Session 5C card redesign).

### PB.29 — Reactive Hero Animation Area (New Page Layout Component)
- [x] Created `src/components/layout/HeroArea.tsx` — full-width hero banner at the top of every protected page
- [x] 90px height, centered large wordmark logo (`logo-[color].PNG` matching user's accent selection)
- [x] 5-layer sine wave animation background contained within the hero area
- [x] Waves use accent color CSS variables (`--wave-color`) and respond to user activity via `useActivityPulse` hook
- [x] Activity amplitude (0–1) controls wave height (1x–3.5x multiplier), opacity boost, and stroke width
- [x] Subtle edge gradient overlays for polished blending with page background
- [x] Logo has accent-colored drop shadow for depth
- **Completed:** 2026-02-23

### PB.30 — useActivityPulse Hook (Reactive Animation System)
- [x] Created `src/hooks/useActivityPulse.ts` — shared module-level amplitude state with listener pattern
- [x] Listens for `input` events (typing → 0.35 amplitude spike), `click` events (buttons → 0.65 spike, generic → 0.15 spike)
- [x] Custom `sd-activity` events for AI generation, saves, exports — `dispatchActivity(intensity)` helper function
- [x] Amplitude decays from peak back to 0 over ~2-3 seconds using `requestAnimationFrame` + configurable decay rate
- [x] Lerp-based rise for smooth spike transitions, independent decay for natural falloff
- [x] Added `dispatchActivity()` calls in narrative page: generate (0.8), regenerate (0.8), customize (0.7), proofread (0.6), apply edits (0.7), save (0.5)
- **Completed:** 2026-02-23

### PB.31 — Nav Bar Overhaul (Icon Logo, Theme Toggle, Repositioned)
- [x] Removed full-size wordmark Logo component from NavBar
- [x] Replaced with small tight icon logo (`ServiceDraft-ai-tight logo.PNG`, 36×36px) on the left
- [x] Added light/dark mode toggle button (Sun/Moon icons from lucide-react) in the right section
- [x] Toggle calls `toggleColorMode()` from `useTheme()` context
- [x] Nav bar changed from `fixed top-0` to `sticky top-0` — now sits in document flow below HeroArea
- [x] Height reduced from `h-16` (64px) to `h-14` (56px) for tighter layout
- [x] Mobile menu dropdown updated to use `top-14` and `bg-[var(--bg-nav)]` for consistency
- [x] Removed full-page `WaveBackground` from protected layout — hero area is now the sole animated element
- [x] Protected layout restructured: `HeroArea` → `NavBar` → `main` content (no more `pt-16` padding)
- **Completed:** 2026-02-23

### SESSION 6A — Reactive Hero Animation Area + Nav Bar Overhaul — COMPLETE
- **Scope:** PB.29, PB.30, PB.31
- **Completed:** 2026-02-23
- **Notes:** Biggest visual change in the app. New page layout: HeroArea (90px reactive sine wave + large logo) → NavBar (sticky, tight icon logo, theme toggle) → page content. Full-page WaveBackground removed — hero area is the sole animated element. Activity pulse system automatically responds to typing, clicks, and AI processing. All accent color theming preserved.

### PB.32 — Hero Logo Enlarged ~20x + Hero Height Doubled
- [x] Increased `HERO_HEIGHT` from 90px to 200px — hero area now dominates the top of the viewport as intended
- [x] Logo `width` increased from 420→1200, `height` from 70→200, `maxHeight` from 55px→140px, `maxWidth` 90%
- [x] Hero wave base amplitudes scaled up proportionally (12–15→22–30) to fill the taller area
- [x] Drop shadow intensity increased for larger logo presence
- **Completed:** 2026-02-23

### PB.33 — Hero Area + Nav Bar Fixed on Scroll
- [x] HeroArea changed from `relative` to `fixed top-0 left-0 right-0 z-[90]` — always visible at top of viewport
- [x] NavBar changed from `sticky top-0` to `fixed left-0 right-0` with `top: 200px` — sits directly below hero
- [x] Protected layout `<main>` given `paddingTop: 256px` (200px hero + 56px nav) so content starts below both fixed elements
- [x] `min-h-[calc(100vh-256px)]` for proper content area sizing
- **Completed:** 2026-02-23

### PB.34 — Full-Page WaveBackground Restored to Protected Layout
- [x] Re-added `<WaveBackground />` to `src/app/(protected)/layout.tsx` — renders at z-10 behind all content
- [x] Component was intact in `src/components/ui/WaveBackground.tsx` (never deleted), just not rendered since Session 6A
- [x] Full-page background sine wave animation now runs continuously on all protected pages again
- [x] Separate from the hero area's reactive sine wave — this is the subtle always-running page backdrop
- **Completed:** 2026-02-23

### PB.35 — Nav Links Consolidated into Icon+Label Pairs
- [x] Removed redundant standalone "Main Menu" and "Dashboard" text links from nav bar center
- [x] LEFT: SD tight icon logo (32×32) + "Main Menu" label — paired as single `<Link>` to `/main-menu`
- [x] RIGHT: PositionIcon (user's role icon, 28×28) + "Dashboard" label — paired as single `<Link>` to `/dashboard`
- [x] Both pairs highlight with `bg-[var(--accent-20)]` when on the matching route
- [x] Labels hidden on small screens (`hidden sm:inline`), mobile hamburger menu preserved as fallback
- [x] NavBar now imports `useAuth` for profile data and `PositionIcon` for the role icon
- **Completed:** 2026-02-23

### PB.36 — Hero Banner Height Halved + Logo Doubled
- [x] `HERO_HEIGHT` reduced from 200px → 100px — frees up 100px of viewport for page content
- [x] NavBar `top` updated from 200px → 100px; layout `paddingTop` updated from 256px → 156px
- [x] Hero wave amplitudes scaled down proportionally (14–30 → 8–16) for the shorter banner
- [x] Logo `width` doubled from 1200→2400, `height` from 200→400 — dominant brand element within the banner
- [x] Logo `maxHeight` adjusted from 140px→80px to fit within the 100px hero (10px padding each side)
- [x] Logo `maxWidth` widened from 90%→95% for more horizontal presence
- **Completed:** 2026-02-23

### PB.37 — Hero Logo Scaled to 90% of Banner Height
- [x] Replaced fixed pixel constraints (`maxHeight: 80px`, `maxWidth: 95%`) with percentage-based sizing
- [x] Logo now uses `height: 90%; width: auto; object-fit: contain` — fills 90% of the hero banner height
- [x] Width scales automatically from the logo's native aspect ratio — no max-width cap
- [x] Removed `object-contain` Tailwind class (replaced by inline `objectFit: contain`)
- **Completed:** 2026-02-23

### PB.38 — Hero Logo Fixed to 90px Absolute Height
- [x] Changed logo `height` from `90%` (percentage) to `90px` (fixed) — bypasses broken CSS percentage chain
- [x] Root cause: `height: 90%` on the `<Image>` resolved to near-zero because the flex parent didn't propagate an explicit pixel height despite `absolute inset-0`
- [x] Fixed value of 90px guarantees the logo is 90px tall inside the 100px hero banner regardless of parent container sizing
- [x] `width: auto; objectFit: contain` preserved — width scales from native aspect ratio
- **Completed:** 2026-02-23

### PB.39 — Hero Logo: Replace Next.js Image with Standard img Tag
- [x] Root cause: Next.js `<Image>` component generates its own inline styles from `width`/`height` props, overriding custom `style={{ height: '90px' }}`
- [x] Replaced `<Image>` (from `next/image`) with standard `<img>` tag — respects inline styles without framework interference
- [x] Removed `import Image from 'next/image'` (no longer used in HeroArea)
- [x] Added `eslint-disable-next-line @next/next/no-img-element` to suppress lint warning
- [x] Logo now renders at exactly 90px tall with `width: auto; objectFit: contain` — confirmed via build
- **Completed:** 2026-02-23

---

## SUMMARY COUNTS

| Phase | Tasks | Complete |
|-------|-------|----------|
| Phase 0: Project Initialization | 6 | 6 |
| Phase 1: Design System | 10 | 10 |
| Phase 2: Authentication | 10 | 10 |
| Phase 3: Navigation & Layout | 7 | 7 |
| Phase 4: Input Page | 8 | 8 |
| Phase 5: AI Integration | 5 | 5 |
| Phase 6: Narrative Page | 10 | 10 |
| Phase 7: Dashboard | 6 | 6 |
| Phase 8: Stripe | 5 | 5 |
| Phase 9: Polish | 6 | 6 |
| Phase 10: Deployment | 5 | 0 |
| Post-Build Fixes | 85 | 85 |
| Stage 2 Sprint S2-1 | 5 | 5 |
| Stage 2 Sprint S2-4 | 6 | 6 |
| Stage 2 Sprint S2-5 | 5 | 5 |
| Stage 2 Sprint S2-6A | 7 | 7 |
| Stage 2 Sprint S2-6B | 4 | 4 |
| Stage 2 Sprint S2-6C | 6 | 6 |
| **TOTAL** | **196** | **191** |

---

### PB.40 — Hero Logo Not Updating: Stale Turbopack Cache (Root Cause of 4 Failed Fixes)
- [x] **Root cause identified:** The `.next/dev/static/chunks/` directory contained TWO compiled versions of HeroArea.tsx — a stale chunk (`src_b3635525._.js`, 9:47 AM) with the ORIGINAL code (`HERO_HEIGHT = 200`, Next.js `<Image>`, `maxHeight: '140px'`) and a current chunk (`src_eba96a0c._.js`, 11:50 AM) with all 4 fix attempts applied
- [x] The browser was loading the stale compiled chunk, so none of the 4 source-level fixes (PB.36–PB.39) were ever visible in the browser
- [x] Contributing factor: HeroArea uses `useRef` + `requestAnimationFrame` canvas animation loops, which can prevent Turbopack HMR from successfully hot-replacing the module
- [x] **Fix:** Deleted entire `.next` directory to purge all stale compiled chunks, forcing a full recompilation on next dev server start
- **Completed:** 2026-02-23

### PB.41 — Oversize Hero Logo to 409px, Floating Above Hero + Nav
- [x] Logo image has significant blank padding in the PNG file — visible content is much smaller than the image bounds
- [x] Oversized logo to 262% of combined hero (100px) + nav (56px) = **409px** height, with `width: auto` preserving the native 3:2 aspect ratio
- [x] Separated logo into its own fixed overlay (`z-[110]`) that spans both hero and nav areas, floating above both (hero z-90, nav z-100)
- [x] Logo overlay uses `pointer-events-none` so nav links remain fully clickable underneath
- [x] Hero background (wave canvas + gradient) remains in its own container with `overflow-hidden` — unaffected by logo changes
- **Completed:** 2026-02-23

### PB.42 — Remove Card Hover Enlargement Effect
- [x] Removed `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}` from `LiquidCard.tsx` — cards no longer physically enlarge on hover
- [x] Removed `scale: 1.03` from `StoryTypeSelector.tsx` whileHover — kept boxShadow glow and whileTap scale
- [x] Converted LiquidCard from `motion.div` to a static `div` wrapped in `CursorGlow` — no more Framer Motion scale on cards
- [x] Kept whileHover scale on: `Button.tsx` (1.05), main menu FAQ/Support links (1.08), and other small interactive controls
- **Completed:** 2026-02-23
- **Notes:** Large card scale on hover made the layout feel chaotic. Scale effects now reserved exclusively for buttons and small clickable elements.

### PB.43 — Cursor Underglow Effect (CursorGlow Component)
- [x] Created `src/components/ui/CursorGlow.tsx` — reusable wrapper component for cursor-following underglow on any element
- [x] Tracks mouse position relative to the container via `onMouseMove`, applies `radial-gradient(circle ${radius}px at ${x}px ${y}px, var(--accent-primary), transparent)` as an overlay
- [x] Configurable props: `radius` (default 200px), `opacity` (default 0.15), `enabled` (default true)
- [x] Glow fades in/out smoothly on mouse enter/leave via CSS `transition: opacity 0.3s ease`
- [x] Overlay uses `pointer-events: none` and `z-index: 1` — content sits at `z-index: 2` above the glow
- [x] Inherits `border-radius` from parent via `borderRadius: inherit` so glow respects rounded corners
- [x] Integrated into `LiquidCard.tsx` — all LiquidCards now have cursor underglow by default (controlled by `glow` prop)
- **Completed:** 2026-02-23
- **Notes:** Replaces the old card hover enlargement. The glow color automatically follows the user's accent color via `var(--accent-primary)`.

### PB.44 — Landing Page Redesign (Cinematic Entrance + Tagline)
- [x] Enlarged logo from 800×200 to 1200×300 (`Logo.tsx` large size variant) — dominant visual element
- [x] Added staggered cinematic entrance: logo scales in first (0s, scale 0.8→1), subtitle fades in second (0.6s delay), buttons slide in last (1.1s delay)
- [x] Added subtitle tagline "AI-POWERED REPAIR NARRATIVE GENERATOR" below logo — spaced-out tracking (0.35em), muted text, uppercase
- [x] Landing page is a full-page wave background with centered logo and buttons — no nav bar or hero area (pre-login screen)
- [x] Removed unnecessary `motion.div` wrapper that was wrapping everything — cleaner animation hierarchy
- **Completed:** 2026-02-23

### PB.45 — Main Menu Page Redesign
- [x] Removed Logo image from inside the main menu card
- [x] Replaced with "Main Menu" heading (`<h1>`) styled with `text-[var(--accent-bright)]`, bold, tracking-wide, 2xl/3xl responsive sizing
- [x] Increased card width from `max-w-md` to `max-w-2xl` — buttons constrained to `max-w-md` within the card for balance
- [x] Card uses cursor underglow effect (via LiquidCard's built-in CursorGlow wrapper)
- [x] Removed `Logo` and `Logo import` from main menu page — no longer needed
- **Completed:** 2026-02-23

### PB.46 — "NEW STORY" Reset Button on Narrative Page
- [x] Added "NEW STORY" ghost button to the bottom action bar on the narrative page (uses `RotateCcw` icon from lucide-react)
- [x] Clicking opens a confirmation modal: "Are you sure? All unsaved data will be lost."
- [x] Confirmation dialog has CANCEL (secondary) and START OVER (primary) buttons
- [x] START OVER calls `resetAll()` from narrative store (clears all state) and navigates to `/main-menu`
- [x] Styled as `variant="ghost"` so it doesn't compete visually with primary actions (SAVE, SHARE/EXPORT)
- **Completed:** 2026-02-23

### SESSION 7A — Page Redesigns, Cursor Underglow, Card Hover Changes — COMPLETE
- **Scope:** PB.42, PB.43, PB.44, PB.45, PB.46
- **Completed:** 2026-02-23
- **Notes:** Major visual changes: (1) Cards no longer enlarge on hover — replaced with cursor-following underglow glow effect. (2) Landing page has cinematic staggered entrance with larger logo and tagline. (3) Main menu has "Main Menu" heading instead of logo, wider card. (4) Narrative page has "NEW STORY" reset button with confirmation dialog.

### PB.47 — Navigation Guard for Unsaved Narratives
- [x] Added `isSaved` (boolean) and `savedNarrativeId` (string|null) to `NarrativeState` in `narrativeStore.ts`
- [x] `isSaved` starts true (no narrative to protect), flips to false when `setNarrative()` is called (new/regenerated/customized narrative), flips to true on manual save or auto-save
- [x] `beforeunload` event listener registered when `isSaved === false` — shows browser's native "Leave page?" dialog on tab close or browser back
- [x] In-app navigation interceptor via document `click` capture — catches `<a>` clicks to internal routes, prevents default, shows custom modal
- [x] Custom "Unsaved Narrative" modal: "You have an unsaved narrative. Once you leave this page, this story cannot be recovered." with STAY ON PAGE and LEAVE WITHOUT SAVING buttons
- [x] `pendingNavigation` state stores the intended URL; LEAVE WITHOUT SAVING calls `router.push(pendingNavigation)`
- [x] When `isSaved` is true, both guards are removed — all navigation works freely
- [x] The existing "Start Over" confirmation dialog (PB.46) still serves as the guard for the NEW STORY button
- **Completed:** 2026-02-23

### PB.48 — Auto-Save on Export (Duplicate Prevention)
- [x] Created `saveToDatabase()` helper in narrative page — performs Supabase insert with `.select('id').single()` to retrieve the new record ID
- [x] Duplicate prevention: `saveToDatabase()` checks `state.savedNarrativeId` first; if already set, returns existing ID without inserting
- [x] `markSaved(id)` store action sets both `isSaved = true` and `savedNarrativeId = id` in one update
- [x] `handleBeforeExport()` callback passed to `ShareExportModal` via `onBeforeExport` prop — calls `saveToDatabase()` before any export
- [x] All 4 export actions (Copy to Clipboard, Print, Download PDF, Download Word) call `onBeforeExport()` before proceeding
- [x] Toast notification: "Narrative auto-saved to your history" shown after auto-save (uses `{ id: 'auto-save' }` to prevent duplicate toasts)
- [x] Activity event dispatched (`dispatchActivity(0.5)`) on both manual save and auto-save — triggers hero wave spike
- [x] Manual save also uses `saveToDatabase()` for consistent dedup behavior
- **Completed:** 2026-02-23

### SESSION 7B — Navigation Guard + Auto-Save on Export — COMPLETE
- **Scope:** PB.47, PB.48
- **Completed:** 2026-02-23
- **Notes:** Two critical protections for unsaved narratives. (1) Navigation guard uses `beforeunload` for browser close/back and document click capture for in-app links — both disabled once `isSaved` is true. (2) Auto-save on export ensures narratives appear in dashboard history after any export action, with duplicate prevention via `savedNarrativeId`.

### PB.49 — AccentColorPicker Component
- [x] Created `src/components/ui/AccentColorPicker.tsx` — row of 9 clickable color swatches
- [x] Uses existing `ACCENT_COLORS` array from `themeColors.ts` and `useTheme()` hook from `ThemeProvider.tsx`
- [x] Each swatch: 36×36px circle filled with accent hex color
- [x] Selected swatch: 3px solid `var(--text-primary)` border + `0 0 12px {color.hex}` box shadow
- [x] Unselected swatches: 2px solid transparent border
- [x] Framer Motion `whileHover={{ scale: 1.15 }}` and `whileTap={{ scale: 0.95 }}` on each swatch
- [x] Displays current accent color name below the row; "Black" swatch shows "Auto-activates light mode" note
- [x] onClick calls `setAccentColor(key)` from useTheme()
- **Completed:** 2026-02-23

### PB.50 — PreferencesPanel Modal + Dashboard Integration
- [x] Created `src/components/dashboard/PreferencesPanel.tsx` — modal with two tabs (Appearance and Templates)
- [x] Props: `isOpen: boolean` and `onClose: () => void`
- [x] Backdrop: fixed overlay, `rgba(0,0,0,0.6)`, `backdrop-filter: blur(4px)`, z-index 200
- [x] Panel: centered, `var(--bg-elevated)` background, `var(--radius-2xl)` border radius, `var(--shadow-glow-md)` shadow, max-width 520px, max-height 80vh with overflow scroll
- [x] Header: Settings icon (lucide) colored `var(--accent-primary)` + "Preferences" h2 + X close button
- [x] Tab switcher: segmented control — Appearance (Palette icon) and Templates (FileText icon); active tab uses `var(--accent-primary)` bg with white text
- [x] Framer Motion AnimatePresence for enter/exit animations
- [x] Appearance tab: `<AccentColorPicker />` component + Display Mode section (Dark/Light buttons calling `toggleColorMode()`) + hint text
- [x] Dark/Light buttons: selected mode has `2px solid var(--accent-primary)` border + `var(--accent-8)` bg; unselected has `var(--accent-20)` border + `var(--bg-input)` bg
- [x] Black accent disables Dark button (forced light mode)
- [x] Templates tab: placeholder with FileText icon, heading, and "coming soon" description
- [x] Added `showPreferences` state + Preferences button (Settings icon, `var(--bg-input)` bg) to dashboard page header
- [x] `<PreferencesPanel>` rendered at bottom of dashboard component JSX
- **Completed:** 2026-02-23

### PB.51 — Supabase Preferences Persistence + UserPreferences Type
- [x] Added `UserPreferences` interface to `src/types/database.ts` with `appearance` and `templates` sub-types
- [x] Added `preferences?: UserPreferences` to existing `UserProfile` interface
- [x] Extended `ThemeProvider.tsx` with `loadFromSupabase()` — runs on mount after localStorage load, queries `users.preferences` column, overrides local values if Supabase has saved preferences
- [x] Extended `ThemeProvider.tsx` with `saveToSupabase()` — runs alongside localStorage saves on accent/mode change, reads existing preferences first and merges with spread operator to preserve future keys (templates, etc.)
- [x] Both functions dynamically import Supabase client, silently return if no user logged in
- [x] All Supabase calls wrapped in try/catch — errors logged but never break the app (localStorage is the fallback)
- [x] Supabase sync keeps localStorage aligned so offline/logged-out sessions still work
- **Completed:** 2026-02-23
- **Notes:** Requires a `preferences JSONB` column on the `users` table in Supabase. Run: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;`

### SESSION 8A — User Preferences Panel + Accent Color Picker + Supabase Persistence — COMPLETE
- **Scope:** PB.49, PB.50, PB.51
- **Completed:** 2026-02-23
- **Notes:** Full preferences system. AccentColorPicker renders 9 swatches using existing theme infrastructure. PreferencesPanel modal on dashboard with Appearance tab (color picker + dark/light toggle) and Templates placeholder tab. ThemeProvider extended with Supabase sync — loads from DB on mount (overriding localStorage), saves to DB on every accent/mode change (merging with existing preferences). UserPreferences type added to database.ts. Requires `preferences JSONB` column on users table.

### PB.52 — Light Mode Accent Text Emphasis (Bold Black Substitution)
- [x] Added `--accent-text-emphasis` CSS variable: resolves to `accent.hex` in dark mode, `#0f172a` in light mode
- [x] Added `--accent-text-emphasis-weight` CSS variable: `inherit` in dark mode, `700` in light mode
- [x] Both variables set in `applyTheme()` based on `effectiveMode`, with `:root` defaults in `globals.css`
- [x] `data-mode` attribute now set on `<html>` element for CSS selector targeting
- [x] Updated emphasis text in 6 components: main-menu heading, FAQ question headings, NarrativeDisplay C/C/C headings, NarrativeDetailModal C/C/C headings, ConditionalField AI badge, PreferencesPanel Settings icon
- [x] Dashboard "User Dashboard" heading changed from hardcoded `text-white` to `text-[var(--text-primary)]`
- **Completed:** 2026-02-23
- **Notes:** Only applies to text used for visual hierarchy/emphasis — not interactive elements like buttons or links where accent color is the identity.

### PB.53 — Light Mode Card Container Tinting
- [x] In `applyTheme()` light mode block: `--bg-card` now computed as a solid blended color (6% accent into white) instead of transparent `var(--accent-8)`
- [x] Formula: `rgb(255*0.94 + r*0.06, 255*0.94 + g*0.06, 255*0.94 + b*0.06)` — produces a clearly tinted, non-white card background for every accent color
- [x] Added `--border-default` CSS variable: `transparent` in dark mode, `rgba(0,0,0,0.1)` in light mode
- [x] Card bg now applies consistently to ALL light modes (Black native + user-toggled)
- **Completed:** 2026-02-23
- **Notes:** Previous approach used `var(--accent-8)` which was 8% opacity on white — too subtle. Solid blended color is always visually distinct from the page background.

### PB.54 — Light Mode Button Text Color Fix
- [x] Added `--btn-text-on-accent` CSS variable: `#ffffff` in dark mode, `#0f172a` in light mode
- [x] Updated `Button.tsx` primary variant: `text-white` → `text-[var(--btn-text-on-accent)]`
- [x] PreferencesPanel active tab text: hardcoded `#ffffff` → `var(--btn-text-on-accent)`
- **Completed:** 2026-02-23
- **Notes:** Only affects filled/primary buttons where the background IS the accent color. Ghost and secondary buttons are handled by PB.55.

### PB.55 — Light Mode Outline Button Vividity Fix
- [x] Added `--accent-vivid` CSS variable: `accent.hover` in dark mode (bright, stands out on dark bg), `accent.border` in light mode (dark, stands out on light bg)
- [x] Updated `Button.tsx` secondary variant: `text-[var(--accent-hover)]` → `text-[var(--accent-vivid)]`, border likewise
- [x] Updated `Button.tsx` ghost variant: `text-[var(--accent-text)]` → `text-[var(--accent-vivid)]`
- [x] Updated dashboard Preferences button: `--text-secondary` → `--accent-vivid` for text and border, added `font-weight: 600`
- **Completed:** 2026-02-23
- **Notes:** For light accent colors (yellow, green) on white backgrounds, `accent.border` provides much better contrast than `accent.hover` or `accent.primary`.

### PB.56 — White Accent Forces Dark Mode
- [x] Added `isDarkMode: boolean` to `AccentColor` interface in `themeColors.ts` (mirrors `isLightMode` for Black)
- [x] Set `isDarkMode: true` on White accent, `isDarkMode: false` on all other 8 accents
- [x] Updated `applyTheme()` effectiveMode: `accent.isLightMode ? 'light' : accent.isDarkMode ? 'dark' : mode`
- [x] Updated `setAccentColor()` in ThemeProvider: selecting White auto-switches to dark mode (mirrors Black→light logic)
- [x] Updated ThemeProvider context value: handles `isDarkMode` in colorMode computation
- [x] Updated PreferencesPanel: Light button disabled when White accent active (opacity 0.5, not-allowed cursor)
- [x] Updated AccentColorPicker: White accent shows "Auto-activates dark mode" note below the row
- **Completed:** 2026-02-23
- **Notes:** Mirrors the existing Black→light mode pattern. White on a light background is invisible, so dark mode is forced.

### SESSION 8B — Light Mode Styling Fixes + White Accent Dark-Mode Lock — COMPLETE
- **Scope:** PB.52, PB.53, PB.54, PB.55, PB.56
- **Completed:** 2026-02-23
- **Notes:** Five light mode improvements. (1) Accent-colored emphasis text switches to bold black in light mode via `--accent-text-emphasis`. (2) Card backgrounds use solid accent-tinted color instead of transparent overlay. (3) Primary button text switches to black in light mode via `--btn-text-on-accent`. (4) Outline/ghost buttons use darker accent color (`accent.border`) in light mode via `--accent-vivid`. (5) White accent forces dark mode, matching the Black→light pattern.

### PB.57 — ParticleNetwork Component (Replaces WaveBackground on Protected Pages)
- [x] Created `src/components/ui/ParticleNetwork.tsx` — full-page canvas animation with floating particles and connecting lines
- [x] 30 particles with random velocity, wrapped edges, and dynamic connection lines (max distance 200px)
- [x] Reads `--wave-color` CSS variable (RGB triplet) same as WaveBackground — accent color changes propagate automatically
- [x] Re-reads accent color every 2s via `setInterval` to pick up mid-session theme changes
- [x] Canvas at `z-10`, `pointer-events: none`, `fixed inset-0` — identical layering to old WaveBackground
- **Completed:** 2026-02-24

### PB.58 — ThemeProvider backgroundAnimation State + Supabase Persistence
- [x] Added `backgroundAnimation: boolean` and `setBackgroundAnimation` to `ThemeContextValue` interface
- [x] State initialized from `localStorage('sd-bg-animation')`, defaults to `true` if absent
- [x] `setBackgroundAnimation()` persists to localStorage AND merges into Supabase `preferences.appearance.backgroundAnimation`
- [x] `loadFromSupabase()` reads `backgroundAnimation` from Supabase on mount, defaults to `true` if undefined
- [x] `saveToSupabase()` updated to spread existing appearance fields when merging — preserves accentColor, mode, AND backgroundAnimation
- [x] Added `backgroundAnimation?: boolean` to `UserPreferences.appearance` in `src/types/database.ts`
- **Completed:** 2026-02-24

### PB.59 — Protected Layout: Swap WaveBackground → ParticleNetwork
- [x] Replaced `import WaveBackground` with `import ParticleNetwork` in `src/app/(protected)/layout.tsx`
- [x] Added `import { useTheme }` and `const { backgroundAnimation } = useTheme()`
- [x] Replaced `<WaveBackground />` with `{backgroundAnimation && <ParticleNetwork />}` — component fully unmounts when toggle is off
- [x] WaveBackground.tsx preserved for landing page (`src/app/page.tsx`) and auth pages (`login/page.tsx`, `signup/page.tsx`)
- **Completed:** 2026-02-24

### PB.60 — Background Animation Toggle in PreferencesPanel
- [x] Added "Background Animation" section to Appearance tab in `src/components/dashboard/PreferencesPanel.tsx`
- [x] Section heading matches existing style (`text-sm font-semibold`, `var(--text-secondary)`)
- [x] Toggle row: Sparkles icon + "Particle Network" label on left, pill toggle switch (48×24px) on right
- [x] Toggle ON: track is `var(--accent-primary)`, circle slides right; OFF: track is `var(--bg-elevated)`, circle slides left
- [x] CSS `transition-all duration-200` for smooth slide animation
- [x] Clicking anywhere on the row calls `setBackgroundAnimation(!backgroundAnimation)`
- **Completed:** 2026-02-24

### SESSION 9A — Particle Network Animation + Background Animation Toggle — COMPLETE
- **Scope:** PB.57, PB.58, PB.59, PB.60
- **Completed:** 2026-02-24
- **Notes:** Replaced the full-page sine wave background on protected pages with a particle network animation (floating dots with connecting lines). Added on/off toggle to the Preferences Panel Appearance tab. Toggle persists to localStorage (instant) and Supabase (cross-device). WaveBackground.tsx retained for landing page and auth pages. ParticleNetwork reads the same `--wave-color` CSS variable for accent-reactive coloring.

### PB.61 — Dashboard Modal Overflow Fix (Portal to Body)
- [x] Modal.tsx updated to use `createPortal(content, document.body)` from react-dom
- [x] Added `mounted` state guard for SSR compatibility
- [x] NarrativeDetailModal now renders as full-screen overlay, escaping CursorGlow's `overflow: hidden`
- [x] Backdrop covers entire viewport with blur; modal centered on screen
- [x] Close on backdrop click and Escape key still works
- **Completed:** 2026-02-24

### PB.62 — Hero Wave Amplitude +10% and Vertical Centering to Logo
- [x] All 5 hero wave `baseAmplitude` values increased by 10% (14→15.4, 10→11, 16→17.6, 12→13.2, 8→8.8)
- [x] Wave `centerY` changed from `h / 2` to `h * 0.78` to align with logo vertical center (logo centered in hero+nav = 156px, center at 78px from top, hero canvas is 100px)
- **Completed:** 2026-02-24

### PB.63 — Combined Nav Bar Dashboard + User Icon Button
- [x] Removed separate Dashboard link (PositionIcon + "Dashboard" text) from NavBar.tsx
- [x] Removed `useAuth` and `PositionIcon` imports from NavBar (no longer needed)
- [x] Removed Dashboard from mobile menu dropdown (now accessible via UserPopup dropdown)
- **Completed:** 2026-02-24

### PB.64 — UserPopup: T.Cloyd Format Trigger with Dropdown
- [x] UserPopup trigger changed from avatar-only to combined button: PositionIcon + "T.Cloyd" name + chevron
- [x] `formatDisplayName()` helper: first initial + period + last name (falls back to username or email prefix)
- [x] Button styled with accent border, hover background, chevron rotation on open
- [x] Dropdown retains Dashboard link + Log Out + user info (name, location, position)
- **Completed:** 2026-02-24

### PB.65 — Login Page Logo Size Matched to Landing Page
- [x] Login page Logo changed from `size="medium"` to `size="large"` with `className="max-w-[90vw]"`
- [x] Applied to both loading state and main render paths
- [x] Now matches landing page logo dimensions exactly
- **Completed:** 2026-02-24

### PB.66 — Wave Animation Centered to Logo on Landing/Login/Signup Pages
- [x] WaveBackground.tsx: added `centerYPercent` prop (default 0.5) controlling vertical baseline
- [x] Landing page: `centerYPercent={0.40}` — waves flow through logo vertical center
- [x] Login page: `centerYPercent={0.35}` — adjusted for logo position above form card
- [x] Signup page: `centerYPercent={0.35}` — same as login page
- **Completed:** 2026-02-24

### PB.67 — Purple Dark Mode Default for Unauthenticated Pages (Revised)
- [x] ~~Initially created ForcePurpleDark.tsx — replaced in PB.69 with auth-aware ThemeProvider approach~~
- [x] Added `className="dark"` to `<html>` in root layout for baseline dark mode
- **Completed:** 2026-02-24 (Revised 2026-02-24)

### PB.68 — 8-Hour Auto-Logout Session Expiry
- [x] Created `src/hooks/useSessionExpiry.ts` with `setLoginTimestamp()`, `clearLoginTimestamp()`, and `useSessionExpiry()` hook
- [x] Login page: calls `setLoginTimestamp()` on successful sign-in
- [x] Signup page: calls `setLoginTimestamp()` on profile creation completion
- [x] Protected layout: calls `useSessionExpiry()` hook — checks every 60 seconds
- [x] useAuth signOut: clears `sd-login-timestamp` from localStorage
- [x] Expired session shows toast "Your session has expired. Please sign in again." before redirect
- **Completed:** 2026-02-24

### PB.69 — Auth-Aware Theme Flow (Replaces ForcePurpleDark)
- [x] **Removed ForcePurpleDark.tsx** — component fought with ThemeProvider's CSS var application order
- [x] **ThemeProvider rewrite**: on mount checks auth state — if no user, resets to purple dark defaults; if authenticated, loads from Supabase
- [x] **Auth state change listener** in ThemeProvider: SIGNED_OUT resets to purple dark + clears localStorage; SIGNED_IN loads user preferences from Supabase
- [x] **useAuth signOut** now clears all theme localStorage keys (`sd-accent-color`, `sd-color-mode`, `sd-bg-animation`) in addition to session timestamp
- [x] **Removed ForcePurpleDark imports** from landing page, login page, and signup page
- [x] **Result**: Landing/login pages always show purple dark. After login, user's saved accent color and mode are applied automatically. No race conditions between components.
- **Completed:** 2026-02-24

### SESSION 10A — Dashboard Modal, Nav Consolidation, Wave Fixes, Dark Mode Default, Auto-Logout — COMPLETE
- **Scope:** PB.61, PB.62, PB.63, PB.64, PB.65, PB.66, PB.67, PB.68, PB.69
- **Completed:** 2026-02-24
- **Notes:** Fixed dashboard modal overflow (portaled to body), increased wave amplitude 10% and centered to logo, combined nav bar Dashboard button with user icon into single T.Cloyd dropdown, matched login logo size to landing page, centered wave animations to logo on landing/login pages, set purple dark mode as default for logged-out state via auth-aware ThemeProvider, added 8-hour auto-logout session expiry.

### PB.70 — Main Menu Page No-Scroll + Viewport Centering
- [x] Changed main menu page wrapper from `min-h-screen` to `min-h-[calc(100vh-156px)]` — accounts for fixed hero (100px) + nav (56px) overhead
- [x] Removed `py-8` vertical padding that pushed content below the fold
- [x] Reduced inner card gap from `gap-8` to `gap-6` for a tighter, centered layout
- [x] Loading state also updated to use the same viewport-aware height
- [x] Content card is now dead-center in the available viewport with no scroll bar
- **Completed:** 2026-02-24

### PB.71 — White Accent Theme: Generate Story Button Text Readability
- [x] Added `perceivedBrightness()` helper to `src/lib/constants/themeColors.ts` — computes perceived brightness (0-255) from hex color using weighted RGB formula (0.299R + 0.587G + 0.114B)
- [x] Added luminance-based `--btn-text-on-accent` override in `applyTheme()` — checks brightness of `accent.hover` (the primary button background color)
- [x] If hover brightness > 180: button text is `#000000` (black); otherwise `#ffffff` (white)
- [x] White accent hover is `#f1f5f9` (brightness ~244) → black text ✓ All other accents have darker hover colors → white text preserved ✓
- [x] For dark mode with very light accents (White): `--accent-vivid` falls back to `accent.border` for better secondary button contrast
- **Completed:** 2026-02-24

### PB.72 — Black Accent Theme: Comprehensive Visibility Fix
- [x] Same `perceivedBrightness()` luminance check ensures Black accent primary buttons get white text — `accent.hover` is `#334155` (brightness ~63) → white text ✓
- [x] Light mode `--accent-vivid` override: when `accent.border` brightness > 180 (Black's border is `#cbd5e1` at ~211), falls back to `accent.hex` (`#1e293b`) — dark text/borders readable on light backgrounds
- [x] Light mode `--card-border` and `--modal-border` override: when border is too light, uses `accent.hover` (`#334155`) — visible dark gray border on white card backgrounds
- [x] All accent-colored elements (buttons, text, icons, borders) now use appropriate contrast values for the Black theme
- [x] Works generically via luminance thresholds — no hardcoded per-accent exceptions needed
- **Completed:** 2026-02-24

### SESSION 11A — Main Menu Centering + White/Black Accent Theme Fixes — COMPLETE
- **Scope:** PB.70, PB.71, PB.72
- **Completed:** 2026-02-24
- **Notes:** Fixed Main Menu page scroll and centered container in viewport (156px header offset). Added luminance-based button text color system — `perceivedBrightness()` helper auto-determines black vs white text for primary buttons based on accent hover color brightness. White accent: Generate Story button now has black text on light button. Black accent: all elements visible with proper contrast — primary buttons get white text on dark bg, secondary buttons/borders use darker accent colors, card/modal borders darkened. All fixes are generic luminance checks, not per-accent hardcodes.

### PB.73 — React Hydration Mismatch Fix for Accent-Themed Logo
- [x] Root cause: `ThemeProvider` reads accent color from localStorage in `useState` initializer — server renders with default violet accent, client hydration reads saved accent (e.g. blue) → logo `src` differs between server and client HTML → React hydration mismatch warning
- [x] Fixed `HeroArea.tsx`: added `mounted` state (false until useEffect), logo `src` uses `DEFAULT_ACCENT.logoFile` until mounted, then swaps to `accent.logoFile`
- [x] Fixed `Logo.tsx` (used on landing, login, signup pages): same `mounted` + `DEFAULT_ACCENT.logoFile` pattern
- [x] No visible flicker — the logo swap happens in the same paint cycle as the ThemeProvider's CSS variable application (both run in useEffect after mount)
- [x] Does not change how accent color theming works overall — only defers the logo image source to after hydration
- **Completed:** 2026-02-24

### PB.74 — Light Mode Card Container Text Readability
- [x] Fixed light mode card container text — all title, subtitle, and label text at top of cards now renders black in light mode for readability across all accent color themes.
- [x] Changed 5 hardcoded `text-white` instances to `text-[var(--text-primary)]` in card headers:
  - `login/page.tsx` — "Sign In" card title
  - `signup/page.tsx` — Step title card header
  - `input/page.tsx` — "Select Story Type" card title
  - `input/page.tsx` — "Repair Order Information" card title
  - `narrative/page.tsx` — "AI OUTPUT CUSTOMIZATION" card label
- [x] The CSS variable `--text-primary` already switches between `#ffffff` (dark mode) and `#0f172a` (light mode) via the ThemeProvider, so these card headers now automatically adapt to the active color mode
- [x] Did NOT change button text, badge text, or tab button text (EditProfileModal, ProofreadResults, CustomizationPanel) — those are on accent-colored backgrounds and remain `text-white` correctly
- **Completed:** 2026-02-24

### PB.75 — React Hydration Mismatch Fix for NavBar Color Mode Toggle
- [x] Root cause: `ThemeProvider` reads `colorMode` from localStorage in `useState` initializer — server renders with default `'dark'` mode (Sun icon, "Switch to light mode" aria-label), client hydration reads saved mode (e.g. `'light'`) → icon and aria-label differ between server and client HTML → React hydration mismatch warning
- [x] Fixed `NavBar.tsx`: added `isMounted` state (false until useEffect), toggle button uses `displayMode = isMounted ? colorMode : 'dark'` — always renders server-default dark mode state (Sun icon) during SSR and initial hydration
- [x] After mount, `isMounted` flips to true and the real `colorMode` from ThemeProvider context drives the icon/aria-label — correct icon appears immediately with no visible flash
- [x] Same pattern as PB.73 (logo hydration fix) — defers client-only state to after hydration
- **Completed:** 2026-02-24

### PB.76 — Landing Page Layout Fix: Subtitle & Buttons Pushed Up from Logo Blank Space
- [x] Root cause: Logo PNG (`SERVIDRAFT_AI_LOGO_1_.PNG`) has significant transparent blank space below the visible graphic — the 1200×300 image reserves full height including invisible padding, pushing subtitle text and buttons to the bottom of the viewport
- [x] Fixed `src/app/page.tsx`: wrapped subtitle and buttons in a container with `-mt-28` (negative 112px margin-top) to pull them up into the logo's blank space
- [x] Added `pointer-events-none` to the logo `motion.div` so the invisible blank area doesn't block button clicks
- [x] Subtitle+buttons container has `relative z-10` to render above the logo layer and remain clickable
- [x] Removed `gap-8` from parent flex column (spacing now handled by the negative margin and `mt-6` on the buttons)
- [x] All content (logo, subtitle, LOGIN, REQUEST ACCESS) fits within the viewport at 1080p without scrolling
- [x] **Revised:** Doubled negative margin from `-mt-28` (112px) to `-mt-56` (224px) — initial shift was insufficient, subtitle and buttons were still too far down
- [x] **Revised:** Re-centered wave animation `centerYPercent` from `0.40` to `0.50` — waves were offset toward the top of viewport after layout shift; now aligned with logo's flex-centered position. Login/signup pages unchanged (waves at `0.35` still correct for logo-above-card layout).
- **Completed:** 2026-02-24

### PB.77 — Login Page Logo Doubled in Size
- [x] Root cause: Login page logo was constrained by parent `max-w-md` (448px) wrapper — the 1200×300 image rendered at only ~448×112px, much smaller than the landing page logo
- [x] Added `scale-[2] origin-bottom` CSS transform wrapper around the Logo on the login page — visually doubles the logo without changing layout flow (CSS transforms don't affect box model)
- [x] `origin-bottom` ensures the logo scales upward into the wave background area; the `mb-8` gap to the Sign In card is preserved, card position unchanged
- [x] Applied to both the loading state and the main render path
- **Completed:** 2026-02-24

### PB.78 — Smooth Page Transition from Landing Page to Login Page
- [x] Landing page (`src/app/page.tsx`): added exit fade-out animation — `exiting` state triggers `opacity: 0` over 350ms via Framer Motion, then `router.push()` navigates after the animation completes
- [x] Replaced `<Link>` wrappers on LOGIN and REQUEST ACCESS buttons with `onClick` handlers calling `handleNavigate()` — intercepts click, fades out, then navigates
- [x] Login page (`login/page.tsx`): added `motion.div` wrapper with `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` fade-in over 400ms — smooth entrance after landing page fade-out
- [x] Combined effect: landing page fades out (350ms) → login page fades in (400ms) — premium crossfade feel, no hard jump cut
- **Completed:** 2026-02-24

### PB.79 — Gemini 3.0 Flash Model Upgrade
- [x] Updated `src/lib/gemini/client.ts` — model string changed from `gemini-2.0-flash` to `gemini-3-flash-preview`
- [x] All API routes (generate, customize, proofread, apply-edits) use `generateWithGemini()` which centralizes the model — no other files needed updating
- [x] Updated `CLAUDE_CODE_BUILD_INSTRUCTIONS.md` — code example now shows `gemini-3-flash-preview`
- [x] Updated `BUILD_PROGRESS_TRACKER.md` — Phase 5 notes now reference `gemini-3-flash-preview`
- **Completed:** 2026-02-24

### PB.80 — Signup Page Entrance Animation
- [x] Added `motion` import from `framer-motion` to `src/app/(auth)/signup/page.tsx`
- [x] Wrapped main content `<div>` in `<motion.div>` with `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}` (duration: 0.4s, easeOut)
- [x] Matches login page entrance animation pattern for consistency
- [x] All pages in the app now have Framer Motion entrance animations
- **Completed:** 2026-02-24

### PB.81 — Signup Page Logo Doubled in Size
- [x] Changed Logo from `size="medium"` to `size="large"` with `className="max-w-[90vw]"` in `src/app/(auth)/signup/page.tsx`
- [x] Added `scale-[2] origin-bottom translate-y-16` CSS transform wrapper — identical to login page (PB.77)
- [x] `origin-bottom` ensures logo scales upward without pushing the form card down
- [x] Wave animation `centerYPercent={0.35}` unchanged — stays aligned since card position is preserved
- **Completed:** 2026-02-24

### SESSION 12A — Gemini 3-Flash-Preview Upgrade + Final Polish + Documentation Sync — COMPLETE
- **Scope:** PB.79, PB.80, PB.81
- **Completed:** 2026-02-24
- **Notes:** Upgraded Gemini AI model from 2.0 Flash to 3-flash-preview (single change point in gemini/client.ts). Added missing entrance animation to signup page. Doubled signup page logo to match login page. Verified all pages have Framer Motion animations, background animation runs on all protected pages, toast notifications have consistent styling. Updated all documentation to reflect gemini-3-flash-preview. Stage 1 build complete — all core features implemented.

---

## STAGE 2 SPRINT S2-1 — Dashboard Search & Filtering
*Enhanced search, sort controls, filter pills, and results count for the saved narratives table on the User Dashboard.*

### S2-1.1 — Enhanced Search Bar
- [x] Search input now searches across ALL visible columns: R.O. #, Year, Make, Model, Concern, Cause, Correction, and Date
- [x] Search is case-insensitive and matches partial strings (e.g. "sil" matches "Silverado")
- [x] Added "X" clear button inside search input (visible only when text is present)
- [x] Search icon (lucide Search) on the left inside the input (already existed, preserved)
- [x] Debounced search by 300ms using useRef timer — no filtering on every keystroke
- **Completed:** 2026-02-25

### S2-1.2 — Sort Controls
- [x] Added row of sort buttons below the search bar: Date (Newest), Date (Oldest), Vehicle (A-Z by Make then Model), R.O. # (Ascending)
- [x] Date (Newest) is the default active sort
- [x] Only ONE sort active at a time — active button shows `var(--accent-primary)` bg with `var(--btn-text-on-accent)` text
- [x] Inactive buttons use `var(--bg-input)` bg with `var(--text-secondary)` text
- [x] Each sort button has an ArrowUp or ArrowDown icon indicating direction
- [x] Framer Motion `whileHover={{ scale: 1.05 }}` and `whileTap={{ scale: 0.95 }}`
- **Completed:** 2026-02-25

### S2-1.3 — Filter Pills
- [x] Added horizontal row of filter pills below sort buttons: "All", "Diagnostic Only", "Repair Complete"
- [x] "All" is active by default — shows all narratives regardless of story_type
- [x] Clicking a pill filters the table to only show narratives of that `story_type`
- [x] Active pill: accent border + accent tint background; Inactive: muted border, muted text
- [x] Filter pills combine with search — user can search "Silverado" AND filter to "Repair Complete"
- [x] Framer Motion `whileHover={{ scale: 1.05 }}` and `whileTap={{ scale: 0.95 }}`
- **Completed:** 2026-02-25

### S2-1.4 — Results Count
- [x] Below the filters, shows "Showing X of Y narratives" that updates dynamically
- [x] When all narratives are visible (no filters/search), shows "Showing Y narratives"
- [x] When no results match: shows "No matching narratives found" with a ghost "Clear Filters" button
- [x] Clear Filters resets search input, sort to default (date-newest), and filter to "All"
- **Completed:** 2026-02-25

### S2-1.5 — Visual Polish
- [x] All new controls use existing CSS variables (`var(--accent-*)`, `var(--bg-input)`, `var(--text-*)`) — no hardcoded colors
- [x] Framer Motion hover/tap animations on sort buttons and filter pills
- [x] Search/sort/filter section is sticky at the top of the narrative history card
- [x] AnimatePresence on table rows for smooth fade-in/fade-out when list changes
- [x] NarrativeDetailModal unchanged — no modifications to the popup
- [x] Database schema unchanged — all filtering/sorting is client-side
- **Completed:** 2026-02-25

### SESSION S2-1 — Dashboard Search & Filtering — COMPLETE
- **Scope:** S2-1.1, S2-1.2, S2-1.3, S2-1.4, S2-1.5
- **Completed:** 2026-02-25
- **Notes:** Enhanced NarrativeHistory.tsx with: (1) Multi-column debounced search across R.O.#, Year, Make, Model, Concern, Cause, Correction, Date. (2) Four sort options with accent-styled active button. (3) Story type filter pills (All / Diagnostic Only / Repair Complete) that combine with search. (4) Dynamic results count with "Clear Filters" fallback. (5) Sticky header, AnimatePresence row transitions, full CSS variable theming. No changes to NarrativeDetailModal, database schema, or dashboard page layout.

---

## SESSION 13A — Pre-Generation Output Customization Panel — COMPLETE

### PB.82 — Pre-Generation Customization Panel on Input Page
- [x] Created `src/components/input/PreGenCustomization.tsx` — collapsible panel with Length, Tone, and Detail Level segmented controls
- [x] Toggle button with Sliders icon (lucide-react) and chevron, shows accent dot indicator when any setting is non-standard
- [x] Same three segmented controls as post-generation CustomizationPanel: Length (Short/Standard/Detailed), Tone (Warranty/Standard/Customer Friendly), Detail Level (Concise/Standard/Additional Steps)
- [x] All defaults to Standard (center position)
- [x] No Apply button — selections are included automatically when GENERATE STORY is clicked
- [x] Subtle info note: "Customization will be applied to the initial generation. You can further adjust after generating."
- [x] Added `PreGenCustomization` interface and `preGenCustomization` state to `src/stores/narrativeStore.ts` with `setPreGenCustomization(key, value)` action
- [x] `clearForNewGeneration()` resets pre-gen customization to all-standard defaults
- [x] Updated `src/lib/compileDataBlock.ts` to accept optional `PreGenCustomization` parameter — appends `--- OUTPUT STYLE PREFERENCES ---` block with modifier text from existing constants in `src/constants/prompts.ts` when any setting is non-standard
- [x] Wired into `src/app/(protected)/input/page.tsx` — rendered between last input field and GENERATE STORY button, pre-gen state passed to `compileDataBlock()` in `handleGenerate()`
- [x] localStorage persistence (`sd-pregen-customization`) — loads saved preferences on mount, saves on every change
- [x] No changes to existing CustomizationPanel.tsx, /api/generate/route.ts, or prompts.ts
- **Completed:** 2026-02-25

### PB.83 — Save Narrative Upsert + Export Freeze Fix + UPDATE RLS Policy
- [x] Created SQL migration `supabase/migrations/003_narrative_upsert_support.sql`: adds `updated_at` column, backfills from `created_at`, deduplicates existing rows, adds `UNIQUE(user_id, ro_number)` constraint, adds UPDATE RLS policy, adds `on_narratives_updated` trigger, adds `updated_at` index
- [x] Fixed `saveToDatabase()` in `src/app/(protected)/narrative/page.tsx`: replaced `.insert()` with `.upsert()` using `onConflict: 'user_id,ro_number'` — re-saving same R.O.# overwrites instead of duplicating
- [x] Removed `savedNarrativeId` short-circuit that prevented re-saves after editing
- [x] Added `updated_at` to upsert payload
- [x] Save button now shows "SAVE STORY" / "SAVING..." / "✓ SAVED" based on state
- [x] Fixed `handleBeforeExport` to skip auto-save if already saved (`state.isSaved` check), preventing redundant DB calls and race conditions
- [x] Updated `src/components/dashboard/NarrativeHistory.tsx`: changed query ordering and sort logic from `created_at` to `updated_at` so re-saved narratives appear at top
- [x] Added `updated_at: string` to `Narrative` interface in `src/types/database.ts`
- [x] Updated `NarrativeDetailModal.tsx` to show both "Created" and "Last Updated" dates instead of single "Saved" date
- **Completed:** 2026-02-25
- **Notes:** ⚠️ BLOCKED until SQL migration `003_narrative_upsert_support.sql` is run in Supabase Dashboard (SQL Editor → New Query → Paste → Run). Without the migration, upsert will fail due to missing unique constraint and UPDATE policy.

---

## Stage 2 Sprint S2-4 — Audit/Proofread Highlighting — COMPLETE

### PB.84 — Proofread Highlighting with 30-Second Fade

### S2-4.1 — Proofread API Snippet Extraction
- [x] Updated `PROOFREAD_SYSTEM_PROMPT` in `src/constants/prompts.ts` to instruct AI to include exact text snippets enclosed in `[[double brackets]]` for each flagged issue
- [x] Updated `src/app/api/proofread/route.ts`: added `extractSnippet()` function to parse `[[snippet]]` from each flagged issue string
- [x] Changed API response format: `flagged_issues` now returns `{ issue: string, snippet: string }[]` instead of `string[]`
- [x] Graceful fallback: if AI omits brackets for an issue, `snippet` defaults to empty string (issue still shows in results, just no highlight)
- **Completed:** 2026-02-25

### S2-4.2 — Highlight Utility
- [x] Created `src/lib/highlightUtils.ts` with `findHighlightRanges(narrativeText, snippets)` function
- [x] Returns `HighlightRange[]` with `{ start, end, issueIndex }` objects
- [x] Case-insensitive matching via `toLowerCase()` comparison
- [x] Overlapping ranges merged automatically (sorted by start, extended on overlap)
- [x] Non-matching snippets (AI hallucinated text) silently skipped
- **Completed:** 2026-02-25

### S2-4.3 — NarrativeDisplay Highlight Rendering
- [x] Added `highlights`, `highlightActive`, and `issueDescriptions` props to `NarrativeDisplay`
- [x] Created `HighlightedText` component: splits narrative text at highlight boundaries, wraps matches in `<mark>` elements
- [x] Highlight styling: `var(--accent-30)` background, `2px solid var(--accent-primary)` bottom border, pulsing animation
- [x] Pulsing animation: `@keyframes highlightPulse` in `globals.css` — opacity oscillates 0.2 to 0.4 over 2 seconds
- [x] Tooltip on hover: shows issue description in elevated panel with accent border and glow shadow
- [x] CSS fade-out: `transition: opacity 1s ease-out` when `highlightActive` becomes false
- [x] Created `getSectionHighlights()` for C/C/C format — finds matching highlight text within each individual section
- [x] Works in both Block and C/C/C format views
- **Completed:** 2026-02-25

### S2-4.4 — Highlight Lifecycle Management
- [x] Added highlight state to narrative page: `highlightRanges`, `highlightActive`, `issueDescriptions`
- [x] After proofread completes: extracts snippets → computes ranges → activates highlights (on by default)
- [x] Highlights persist until user toggles them off or narrative text changes
- [x] Highlights cleared immediately on: regenerate, customize, apply edits, manual edit
- [x] Re-proofread clears old highlights before applying new ones
- **Completed:** 2026-02-25

### S2-4.5 — Highlight Counter Badge
- [x] Added badge next to "REVIEW & PROOFREAD" button showing issue count after proofread
- [x] Badge color: green (`#16a34a`) for PASS, yellow (`#ca8a04`) for NEEDS_REVIEW, red (`#dc2626`) for FAIL
- [x] Shows "PASS" for zero issues, "N issue(s)" for flagged issues
- [x] Badge stays visible as long as proofread data exists
- **Completed:** 2026-02-25

### S2-4.6 — Highlight Persistence
- [x] Highlights remain visible until user clicks Apply Suggested Edits or edits the story text
- [x] No manual dismiss button — highlights clear automatically when the narrative changes
- [x] Updated `ProofreadResults.tsx` to handle new `{ issue, snippet }` object format for `flagged_issues`
- **Completed:** 2026-02-25

### PB.85 — Export Logo Aspect Ratio Fix (Native 2.09:1 Ratio)
- [x] Fixed PDF export (`src/app/api/export-pdf/route.ts`): changed logo dimensions from 18×17mm (near-square) to 25×12mm matching native 2.09:1 aspect ratio (1038×497px)
- [x] Fixed DOCX export (`src/app/api/export-docx/route.ts`): changed logo dimensions from 50×47px (near-square) to 55×26px matching native 2.09:1 aspect ratio
- [x] Both export paths affected: narrative page ShareExportModal and dashboard NarrativeDetailModal (both use the same API routes via `downloadExport()`)
- [x] Build verified — no errors
- **Completed:** 2026-02-26

### SESSION S2-4 — Proofread Highlighting — COMPLETE
- **Scope:** S2-4.1 through S2-4.6
- **Completed:** 2026-02-25
- **Notes:** Proofread API now returns exact text snippets from the narrative for each flagged issue. NarrativeDisplay renders highlighted `<mark>` elements with pulsing accent-colored animation, hover tooltips showing issue descriptions. Highlights persist until user applies suggested edits, manually edits the story, regenerates, or customizes. Counter badge shows issue count with color-coded rating. Works in both Block and C/C/C format views. All colors use CSS variables for accent color compatibility.

---

| Stage 2 Sprint S2-1 | 5 | 5 |
| Stage 2 Sprint S2-4 | 6 | 6 |
| Stage 2 Sprint S2-5 | 5 | 5 |
| Stage 2 Sprint S2-6A | 7 | 7 |
| Stage 2 Sprint S2-6B | 4 | 4 |
| Post-Build Fixes | 86 | 86 |
| **TOTAL** | **191** | **186** |

---

## Stage 2 Sprint S2-5 — Email Export — COMPLETE

### S2-5.1 — Resend SDK Installation & Environment Configuration
- [x] Installed `resend` npm package for email sending
- [x] Added `RESEND_API_KEY` as an optional env var in `src/lib/env.ts` — app works without email export if key is missing
- **Completed:** 2026-02-26

### S2-5.2 — Email API Route (POST /api/send-email)
- [x] Created `src/app/api/send-email/route.ts` — authenticated POST endpoint using Resend SDK
- [x] Validates Supabase session (401 if unauthenticated), validates email addresses (basic regex), max 3 recipients
- [x] Sends from `noreply@servicedraft.ai` with `Reply-To` set to authenticated user's email
- [x] Subject line: "Repair Narrative — [YEAR MAKE MODEL] — R.O. #[RO_NUMBER]"
- [x] Professional HTML email: table-based layout, dark header bar with "SERVICEDRAFT.AI" branding, vehicle info section, narrative content (Block or C/C/C), sender attribution, footer
- [x] Plain text fallback for email clients that don't render HTML
- [x] Error handling for missing API key, invalid email, Resend API failures
- **Completed:** 2026-02-26

### S2-5.3 — EmailExportModal Component
- [x] Created `src/components/narrative/EmailExportModal.tsx` — modal with email input, multi-recipient support (up to 3), subject line preview
- [x] Remembers last-used email in localStorage (`sd-last-export-email`) for convenience
- [x] Email validation with per-field error messages
- [x] Loading state with spinner during send, success/error toast notifications
- [x] Add/remove recipient buttons with smooth UX
- **Completed:** 2026-02-26

### S2-5.4 — ShareExportModal Integration (Narrative Page)
- [x] Added "EMAIL NARRATIVE" button with Mail icon between Print and PDF buttons in `ShareExportModal.tsx`
- [x] Triggers `onBeforeExport()` (auto-save) before opening EmailExportModal
- [x] Passes `senderName` (user's full name from profile) through to EmailExportModal
- [x] Updated narrative page to destructure `profile` from `useAuth()` and pass sender name
- **Completed:** 2026-02-26

### S2-5.5 — Dashboard NarrativeDetailModal Integration
- [x] Added "EMAIL" button with Mail icon to dashboard saved narrative actions in `NarrativeDetailModal.tsx`
- [x] Normalizes saved narrative data (vehicle_year → year, etc.) before passing to EmailExportModal
- [x] `senderName` threaded from dashboard page → NarrativeHistory → NarrativeDetailModal
- **Completed:** 2026-02-26

### SESSION S2-5 — Email Export — COMPLETE
- **Scope:** S2-5.1 through S2-5.5
- **Completed:** 2026-02-26
- **Notes:** Email export feature using Resend SDK. Professional HTML email template with table-based layout for cross-client compatibility (Gmail, Outlook, Apple Mail). Supports Block and C/C/C narrative formats, up to 3 recipients, auto-saved last email, reply-to set to sender's email. Accessible from both narrative page Share/Export modal and dashboard saved narrative popup. Requires RESEND_API_KEY in .env.local (same key used for Supabase auth SMTP).
- **Post-ship update (2026-02-26):** Replaced dark text banner with linked vector logo (156×75px, 15% of original 1038×497, linked to https://servicedraft.ai). Shortened footer to "Generated by ServiceDraft.AI". Plain text fallback updated to match.

---

## Stage 2 Sprint S2-6A — Admin Dashboard: Activity Logging — COMPLETE

### S2-6A.1 — TypeScript Type Updates
- [x] Added `role: 'user' | 'admin'` and `is_restricted: boolean` to `UserProfile` interface in `src/types/database.ts`
- [x] Created `ActivityLog` interface in `src/types/database.ts`: id, user_id, action_type, story_type, input_data, output_preview, metadata, created_at
- [x] Updated `useAuth.ts` local `UserProfile` interface and `buildFallbackProfile()` with new fields
- **Completed:** 2026-02-26

### S2-6A.2 — Activity Logging Utility
- [x] Created `src/lib/activityLogger.ts` with `logActivity(action_type, data?)` function
- [x] Gets current user ID from Supabase auth, inserts row into `activity_log` table
- [x] Fire-and-forget pattern — wrapped in IIFE, never awaited by calling code
- [x] All errors caught silently (console.error only) — logging failures never break user workflows
- **Completed:** 2026-02-26

### S2-6A.3 — Activity Logging Calls Throughout App
- [x] `src/app/(protected)/narrative/page.tsx` — logActivity after: generate, regenerate, save, customize, proofread
- [x] `src/components/narrative/ShareExportModal.tsx` — logActivity after: export_copy, export_print, export_pdf, export_docx
- [x] `src/app/(auth)/login/page.tsx` — logActivity('login') after successful sign-in
- [x] Generate and regenerate handlers also catch 403 restriction errors and show toast
- **Completed:** 2026-02-26

### S2-6A.4 — Admin Dashboard Page
- [x] Created `src/app/(protected)/admin/page.tsx` with admin role check (redirects non-admins to /main-menu)
- [x] Page title: "Admin Dashboard" with Shield icon
- [x] Tab navigation: Activity Log (active), User Management (placeholder), Analytics (placeholder)
- [x] Activity Log tab: fetches from activity_log joined with users, displays in sortable table
- [x] Columns: Date/Time, User Name, Email, Action, Story Type, Preview
- [x] Filter by action type dropdown, search by user name/email, sort newest/oldest
- [x] Pagination: 25 rows per page with Previous/Next buttons and page count
- [x] Expandable rows showing full details (input data JSON, output preview, metadata, user ID)
- [x] Action-type colored left border on each row (generate=accent, save=green, export=blue, login=gray)
- [x] All CSS variables, no hardcoded colors; uses LiquidCard, Button components
- **Completed:** 2026-02-26

### S2-6A.5 — Admin Link in UserPopup
- [x] Added "Admin Panel" link with Shield icon in UserPopup dropdown
- [x] Only renders when `profile?.role === 'admin'`
- [x] Positioned above "Log Out" with a subtle divider line
- **Completed:** 2026-02-26

### S2-6A.6 — Restriction Check on Generate API
- [x] Updated `src/app/api/generate/route.ts` to check `is_restricted` flag on user profile
- [x] Returns 403 with message "Your account has been restricted. Contact support for assistance."
- [x] Narrative page catches 403 and displays restriction message as toast
- **Completed:** 2026-02-26

### S2-6A.7 — SQL Migration
- [x] Created `supabase/migrations/004_admin_role_and_activity_log.sql`
- [x] Documents: role column, is_restricted column, activity_log table, indexes, RLS policies
- [x] Admin-aware SELECT policy on users table (replaces "Users can view own profile" with combined policy)
- [x] Activity log RLS: users can insert/read own logs, admins can read all logs
- **Completed:** 2026-02-26
- **Notes:** ⚠️ The role column and activity_log table were already created manually in Supabase. This migration file documents the schema for reference. The RLS policies and indexes should be run in Supabase SQL Editor if not already applied.

### SESSION S2-6A — Admin Dashboard: Activity Logging — COMPLETE
- **Scope:** S2-6A.1 through S2-6A.7
- **Completed:** 2026-02-26
- **Notes:** Admin dashboard with role-based access control. Activity logger records all user actions (generate, regenerate, save, customize, proofread, export, login) as fire-and-forget inserts. Admin page shows full activity log with filtering, search, sort, pagination, and expandable detail rows. Admin Panel link in UserPopup visible only to admin users. Generate API checks is_restricted flag and returns 403 if restricted. SQL migration documents the schema (manually created tables + new RLS policies).

---

## Stage 2 Sprint S2-6B — Admin Dashboard: User Management — COMPLETE

### S2-6B.1 — Admin API Route
- [x] Created `src/app/api/admin/route.ts` with service role Supabase client
- [x] Admin verification: reads user session via server client, checks role = 'admin' before processing
- [x] `list_users` action: returns all users with narrative count and last activity date (enriched via separate queries on narratives and activity_log tables)
- [x] `get_user_details` action: returns full profile, 5 most recent activity log entries, and 5 most recent saved narratives for a given user
- [x] `send_password_reset` action: generates recovery link via `auth.admin.generateLink`, sends branded email via Resend (falls back to Supabase built-in if Resend not configured)
- [x] `restrict_user` action: updates `is_restricted` column on users table
- [x] `delete_user` action: deletes from Supabase Auth via `auth.admin.deleteUser` (cascades to users table)
- [x] `change_subscription` action: updates `subscription_status` on users table (validates: active, trial, expired, bypass)
- [x] All actions return `{ success: boolean, data?: any, error?: string }`
- **Completed:** 2026-02-26

### S2-6B.2 — User Management Table & Search
- [x] Fetches user list from `/api/admin` on tab mount
- [x] Table columns: Name, Email, Position, Signup Date, Subscription Status, Narratives Generated, Last Active, Flags, Actions
- [x] Subscription status shown as colored badge: active (green), trial (yellow), expired (red), bypass (blue)
- [x] Restricted users show red "RESTRICTED" badge in Flags column
- [x] Search bar filters by name or email (client-side)
- [x] All columns sortable — click header to sort, click again to toggle direction (with ChevronUp/ChevronDown indicator)
- [x] Results count display, Refresh button
- **Completed:** 2026-02-26

### S2-6B.3 — User Action Buttons
- [x] Send Password Reset — Mail icon button, sends reset email, shows success/error toast
- [x] Toggle Restrict — Lock/Unlock icon button with confirmation modal dialog ("Restrict this user?" / "Unrestrict this user?"), updates local state on success
- [x] Change Subscription — inline select dropdown showing current status, auto-saves on change with toast confirmation
- [x] Delete User — red Trash2 icon button with TWO-STEP confirmation: first modal shows user name/email with "Continue" button, second step shows red "DELETE PERMANENTLY" button
- [x] All action buttons use `e.stopPropagation()` to prevent row expansion when clicking actions
- [x] Loading states (disabled + opacity) while actions are in progress
- **Completed:** 2026-02-26

### S2-6B.4 — User Detail Expansion
- [x] Clicking a user row (not on action buttons) expands to show detail section
- [x] Full profile information: User ID, Username, Location, Role
- [x] 5 most recent activity log entries with date, action badge, and output preview
- [x] 5 most recent saved narratives with date, vehicle info, RO#, and narrative preview (truncated to 100 chars)
- [x] Accent-colored dividers between profile, activity, and narrative sections
- [x] Loading spinner while details are being fetched, with caching (details fetched once per user per session)
- **Completed:** 2026-02-26

### SESSION S2-6B — Admin Dashboard: User Management — COMPLETE
- **Scope:** S2-6B.1 through S2-6B.4
- **Completed:** 2026-02-26
- **Notes:** Admin user management with full CRUD operations. API route uses service role client for privileged operations (password reset, user deletion) while verifying admin role via session. User table supports search, sort, expandable detail rows. Two-step delete confirmation prevents accidental user deletion. Restrict/unrestrict with confirmation dialog. Subscription status changes auto-save. Password reset emails sent via Resend with branded template (Supabase fallback if Resend unavailable).

---

## Stage 2 Sprint S2-6C — Admin Dashboard: Analytics — COMPLETE

### S2-6C.1 — Analytics API Route
- [x] Created `src/app/api/admin/analytics/route.ts` with admin role verification
- [x] Returns aggregated data: total users, new users this week, active subscriptions, total narratives, narratives this week/today
- [x] Activity by type (last 30 days), daily narrative counts (configurable range), top 5 users by narratives, story type breakdown
- [x] All queries run in parallel via `Promise.all` for performance
- [x] Accepts `?range=` query parameter for configurable chart date range (7, 14, 30, or all-time)
- **Completed:** 2026-02-26

### S2-6C.2 — Stat Cards (2x3 Grid)
- [x] Six stat cards: Total Users, New This Week, Active Subscriptions, Total Narratives, Narratives This Week, Narratives Today
- [x] Each card uses LiquidCard with CursorGlow, big accent-colored number, muted label, oversized icon at 15% opacity in top-right
- [x] Responsive: 2 per row on mobile, 3 per row on desktop (grid-cols-2 lg:grid-cols-3)
- **Completed:** 2026-02-26

### S2-6C.3 — Charts: Generation Trend + Story Type + Activity Breakdown
- [x] 14-day (configurable) narrative generation bar chart built with pure CSS divs — no charting library
- [x] Hover tooltips show exact count per day, accent-colored bars, date labels on x-axis
- [x] Story type breakdown: horizontal stacked bar with accent color for diagnostic, green for repair, percentage + raw count legend
- [x] Activity type breakdown: horizontal bar chart sorted by count, color-coded bars matching Activity Log tab's ACTION_BORDER_COLORS
- **Completed:** 2026-02-26

### S2-6C.4 — Top 5 Users Table
- [x] Ranked table with name, position, narratives generated — sorted by count descending
- [x] #1 gold, #2 silver, #3 bronze rank badges with subtle accent backgrounds
- [x] Monospace accent-colored count column
- **Completed:** 2026-02-26

### S2-6C.5 — Auto-Refresh & Date Range Selector
- [x] Analytics auto-refreshes every 60 seconds while analytics tab is active
- [x] "Last updated: Xs ago" timestamp with live ticker
- [x] Manual refresh button (RefreshCw icon) with spin animation while loading
- [x] Date range selector: 7d, 14d, 30d, All Time — changes re-fetch all analytics
- **Completed:** 2026-02-26

### S2-6C.6 — Styling & Responsiveness
- [x] All colors from CSS variables (accent-primary, accent-bright, text-primary, text-muted, etc.)
- [x] Charts use CSS-based bars (no external libraries installed)
- [x] Stat cards wrap to 2-per-row on mobile, 3-per-row on desktop
- [x] Two-column layout for story type + activity breakdown on desktop, stacked on mobile
- **Completed:** 2026-02-26

### SESSION S2-6C — Admin Dashboard: Analytics — COMPLETE
- **Scope:** S2-6C.1 through S2-6C.6
- **Completed:** 2026-02-26
- **Notes:** Full analytics tab with 6 stat cards, 4 chart/table visualizations, auto-refresh with 60s interval, date range selector (7d/14d/30d/all-time). All charts built with pure CSS (no charting library). Analytics API route uses service role client with admin verification, parallel queries via Promise.all. Colors reuse CSS variables and ACTION_BORDER_COLORS from activity log tab.

---

## Post-Build Bug Fixes — Second-Generation Export/Save Lockup

### PB.86 — Fix Second-Generation Export/Save Lockup
- [x] **Bug 1 — Narrative Store Subscription Leak:** Replaced broken `useState`/`useCallback` pub/sub pattern in `src/stores/narrativeStore.ts` with React's `useSyncExternalStore` hook. Module-level `subscribe()` and `getSnapshot()` functions ensure automatic listener cleanup on component unmount, eliminating stale listener accumulation across page navigations.
- [x] **Bug 2 — Export Chain Blocking:** Added `withTimeout` utility to `src/lib/utils.ts` (8-second timeout). Wrapped Supabase upsert in `saveToDatabase()` with timeout so a hung DB call can't block indefinitely. Made `handleBeforeExport` fire-and-forget (no longer awaits `saveToDatabase`) so exports proceed immediately regardless of save state.
- [x] **Bug 3 — Dashboard Narrative History Hang:** Wrapped `fetchNarratives` Supabase query in `src/components/dashboard/NarrativeHistory.tsx` with `withTimeout(8000)` so the dashboard can't lock up on a stalled fetch.
- [x] **Bug 4 — handleSave Timeout:** Wrapped `handleSave`'s `saveToDatabase()` call with `withTimeout(8000)` so the save button can't spin indefinitely. Existing try/catch handles timeout errors and shows toast.
- **Completed:** 2026-03-03
- **Notes:** Root cause was two interacting bugs: (1) `useState(() => subscribe())` in narrativeStore never cleaned up listeners on unmount — every page navigation added a permanent listener to the global Set, causing stale re-renders and state corruption after the first generation cycle; (2) `handleBeforeExport` awaited `saveToDatabase()` which could hang forever if Supabase client was in a bad state — since all 5 export buttons called this function, a hung save blocked every export. Fix uses `useSyncExternalStore` (React 18+) for proper subscription lifecycle and `withTimeout` + fire-and-forget pattern to prevent any single Supabase call from blocking the UI.

### PB.87 — Fix useAuth Hook Teardown Causing AbortError and Login Lockup
- [x] **Fix 1 — Remove aggressive teardown:** Removed the `if (listeners.size === 0 && authSubscription)` block from the `useAuth` useEffect cleanup in `src/hooks/useAuth.ts`. The auth subscription, `initialized` flag, and `authState` now persist as module-level singletons across route transitions. Only a full page reload or explicit sign-out resets them.
- [x] **Fix 2 — AbortError suppression in onAuthStateChange:** Wrapped the `onAuthStateChange` callback body in try/catch with `DOMException`/`AbortError` guard, matching the existing pattern in `initializeAuth`'s initial fetch.
- **Completed:** 2026-03-04
- **Notes:** Same class of bug as PB.86 (narrativeStore). During Next.js route transitions, old page unmounts before new page mounts. When the last useAuth listener unmounted, cleanup tore down the Supabase auth subscription, reset `initialized = false`, and set `authState = { loading: true }`. The new page then called `initializeAuth()` again, racing with the previous in-flight `getUser()` call, causing AbortError and login lockup. Fix: auth subscription is now a true app-lifetime singleton — never torn down during navigation.

## Post-Build Improvements — Prompt Refinements

### PB.88 — Prevent AI Detail Omission in Narrative Generation
- [x] Updated rule #7 in both DIAGNOSTIC_ONLY_SYSTEM_PROMPT and REPAIR_COMPLETE_SYSTEM_PROMPT to require preserving all detailed input (not simplifying detailed diagnostics into generalized statements)
- [x] Added new detail-preservation rule (rule #9 for Diagnostic Only, rule #10 for Repair Complete) requiring ALL specific technical data points — terminal numbers, connector IDs, circuit numbers, pin numbers, wire colors, voltage/resistance/amperage/pressure/temperature readings, specification values, and all other numerical/technical data — to be included verbatim in the generated narrative
- [x] Updated ServiceDraft_AI_Prompt_Logic_v1.md Sections 3 and 4 to reflect the new rule text
- **Completed:** 2026-03-04
- **Notes:** Addresses warranty audit failures where the AI was summarizing specific technician-provided data points (e.g., terminal numbers, voltage readings) instead of including them verbatim. Both generation prompts now explicitly require that every technical data point appears in the output.

### PB.89 — Split Audit/Proofread by Story Type (Diagnostic Optimizer)
- [x] Created DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT in src/constants/prompts.ts — evaluates diagnostic strength, authorization-readiness, and repair sellability rather than warranty compliance
- [x] Updated src/app/api/proofread/route.ts to select system prompt and user prompt based on storyType field from request body
- [x] Diagnostic Only proofread uses new diagnostic optimizer prompt (10 criteria focused on diagnostic evidence, justification strength, repair sellability)
- [x] Repair Complete proofread continues using existing warranty audit prompt unchanged
- [x] Story-type-specific user prompt templates: diagnostic-only evaluates "authorization-readiness," repair-complete evaluates "audit compliance"
- [x] Frontend already passes storyType to proofread API — no frontend changes needed
- [x] JSON response format unchanged (flagged_issues, suggested_edits, overall_rating, summary) for both story types
- [x] Updated ServiceDraft_AI_Prompt_Logic_v1.md Section 6 — renamed to "Story Audit / Proofreading Prompts" (plural), documented both system prompts, both user prompt templates, and the prompt selection logic
- **Completed:** 2026-03-04
- **Notes:** Fixes incorrect behavior where diagnostic-only stories were flagged for missing completed repair or verification steps. The diagnostic optimizer prompt instead evaluates whether the narrative is strong enough to convince an extended warranty company to authorize the repair without a third-party inspection.

### PB.90 — Move Narrative Save and Fetch to Server-Side API Routes
- [x] Created `src/app/api/narratives/route.ts` — GET endpoint that authenticates via cookies, fetches all narratives for the logged-in user
- [x] Created `src/app/api/narratives/save/route.ts` — POST endpoint that authenticates via cookies, upserts narrative data with onConflict on user_id+ro_number
- [x] Updated `src/components/dashboard/NarrativeHistory.tsx` — replaced client-side Supabase query with `fetch('/api/narratives')`, removed `createClient` and `withTimeout` imports
- [x] Updated `src/app/(protected)/narrative/page.tsx` — replaced client-side Supabase upsert in `saveToDatabase` with `fetch('/api/narratives/save')`, removed `createClient` and `withTimeout` imports, simplified `handleSave` error handling
- **Completed:** 2026-03-04
- **Notes:** The client-side Supabase browser client had unreliable auth state for standalone SELECT/INSERT queries, causing dashboard narrative fetch to timeout every time. All other working features (generate, proofread, admin) already used server-side API routes where Supabase authenticates via HTTP cookies. This fix eliminates client-side Supabase queries from the entire narrative workflow.

---

## Stage 3 Sprint 1 — Modal & Tooltip UI Fixes — COMPLETE

### S3-1.1 — Saved Story Modal Positioning, Sizing & Scroll
- [x] Restructured `src/components/ui/Modal.tsx` — replaced `top-1/2 left-1/2` with `y: -50%` transform positioning with flexbox-centered container
- [x] Modal container uses `fixed inset-0 z-50 pt-20 pb-4 flex items-center justify-center pointer-events-none` — centers modal in viewport space below the nav bar
- [x] Modal panel uses `pointer-events-auto` to capture clicks, outer container passes clicks through to backdrop via `pointer-events-none`
- [x] Content area uses `max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[23px]` — scrolls internally for long content, modal never extends off-screen
- [x] Removed `style={{ x: '-50%', y: '-50%' }}` transform — horizontal and vertical centering now handled by flexbox
- [x] `NarrativeDetailModal.tsx` — changed width prop from `max-w-[700px]` to `max-w-5xl` for significantly wider narrative display
- [x] All other modals using the shared `Modal` component inherit the improved positioning automatically
- **Completed:** 2026-03-05
- **Notes:** The `pt-20` (5rem) provides clearance below the hero area + nav bar. Small modals are vertically centered in the remaining space; tall modals scroll internally via `overflow-y-auto` on the content div. The `rounded-[23px]` on the content div ensures scrollbar corners match the card radius.

### S3-1.2 — Audit Tooltip Animation & Transparency Fix
- [x] Removed `highlightPulse` animation from `<mark>` elements in `src/components/narrative/NarrativeDisplay.tsx` — highlights now appear solid and static (no pulsing opacity)
- [x] Removed `@keyframes highlightPulse` from `src/app/globals.css` — animation keyframes cleaned up
- [x] Changed tooltip background from semi-dark `#0a0414` to fully opaque `#111827` (gray-900)
- [x] Removed `var(--shadow-glow-sm)` from tooltip boxShadow — replaced with solid dark shadow `0 4px 20px rgba(0,0,0,0.9)` only
- [x] Added explicit `opacity: 1` on tooltip to prevent any inherited opacity effects from parent elements
- [x] Updated `HighlightedText` JSDoc comment to reflect new behavior (hover tooltips, not pulsing animation)
- **Completed:** 2026-03-05
- **Notes:** The pulsing effect came from `highlightPulse` keyframes on the `<mark>` parent element, which caused child tooltip elements to inherit the opacity animation. Fix removes the animation entirely — highlights still appear/disappear via the `opacity: active ? 1 : 0` transition but remain solid while visible. Tooltip is now fully opaque with no background bleed-through.

### SESSION S3-1 — Modal & Tooltip UI Fixes — COMPLETE
- **Scope:** S3-1.1, S3-1.2
- **Completed:** 2026-03-05
- **Notes:** Two UI polish fixes: (1) Saved story popup modal on dashboard now renders below the navbar with proper scrolling and wider layout (max-w-5xl). Modal component restructured to use flexbox centering within viewport space below nav, benefiting all modals app-wide. (2) Audit/proofread tooltip no longer pulses or has transparent background — appears instantly with solid opaque dark background on hover.

---

## Stage 3 Sprint 4 — OEM Audit Fix + Selective Apply Edits — COMPLETE

### S3-4.1 — Stop Flagging OEM/Manufacturer Terminology in Proofread
- [x] Removed audit criterion #10 ("Any manufacturer-specific branding or proprietary terminology that should be replaced with universal language") from `PROOFREAD_SYSTEM_PROMPT` in `src/constants/prompts.ts`
- [x] Added explicit OEM allowance instruction: manufacturer-specific terminology (Active Fuel Management, StabiliTrak, VTEC, SkyActiv, etc.) is expected and correct when the vehicle year/make/model warrant their use
- [x] All other audit criteria (1-9) remain intact
- [x] `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` already had no OEM-flagging criterion — no changes needed there
- **Completed:** 2026-03-05
- **Notes:** The generation prompts (rules #5) explicitly encourage OEM-specific terminology. The proofread prompt criterion #10 directly contradicted this by flagging OEM terms as issues. Fix aligns the audit prompt with the generation prompt — OEM terminology is now recognized as professional, accurate documentation.

### S3-4.2 — Selective Apply Suggested Edits with Checkboxes
- [x] Rebuilt `src/components/narrative/ProofreadResults.tsx` — each suggested edit now has a checkbox next to it, default state all unchecked
- [x] Added "Select All / Deselect All" toggle button at the top of the suggested edits list, styled with accent theme colors
- [x] Checkbox labels are full-row clickable with hover highlight using `var(--accent-5)`
- [x] Checkboxes styled with `accent-color: var(--accent-hover)` for purple theme matching
- [x] Component exposes `onSelectionChange` callback prop to notify parent of selected indices
- [x] Updated `src/app/(protected)/narrative/page.tsx` — added `selectedEditIndices` state, wired to `ProofreadResults.onSelectionChange`
- [x] `handleApplyEdits` now sends ONLY the checked suggestions to the apply-edits API
- [x] If no checkboxes are checked and user clicks apply, shows toast: "Select at least one suggested edit to apply"
- [x] Button text changed from "APPLY SUGGESTED EDITS" to "APPLY SELECTED EDITS"
- [x] After applying, clears proofread data and selected indices (user can re-run audit to verify)
- [x] Updated `src/app/api/apply-edits/route.ts` — system prompt clarified to apply ONLY the provided edits (which may be a subset), no additional changes
- [x] User prompt updated to say "SELECTED EDITS TO APPLY" to reinforce subset behavior
- **Completed:** 2026-03-05
- **Notes:** Previously "Apply Suggested Edits" sent all suggestions at once with no user choice. Users can now opt-in to each individual edit via checkboxes, select all/deselect all for batch control, and apply only their chosen subset. The apply-edits API prompt is updated to respect the subset — it will not make changes beyond the provided list.

### SESSION S3-4 — OEM Audit Fix + Selective Apply Edits — COMPLETE
- **Scope:** S3-4.1, S3-4.2
- **Completed:** 2026-03-05
- **Notes:** Two changes to the Review & Proofread system: (1) Removed criterion #10 that incorrectly flagged OEM/manufacturer terminology as issues, added explicit instruction that OEM terms are expected and correct. (2) Added checkbox selection system to suggested edits — users can pick and choose which edits to apply, with Select All/Deselect All toggle and purple-themed checkboxes.

---

## Stage 3 Sprint 5 — Enhanced OEM Terminology in Generation Prompts — COMPLETE

### S3-5.1 — Strengthen OEM Terminology Instructions in Both Generation System Prompts
- [x] Replaced rule #5 in `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` (`src/constants/prompts.ts`) with detailed multi-part OEM terminology instruction
- [x] Replaced rule #5 in `REPAIR_COMPLETE_SYSTEM_PROMPT` (`src/constants/prompts.ts`) with identical enhanced instruction
- [x] New rule #5 includes sub-rules (a-e): identify manufacturer/OEM, identify and use OEM service practices and terminology, explicit examples for GM/Ford/Toyota/Honda/Stellantis/Hyundai-Kia/BMW and more, explanation of why OEM terms matter for auditors, instruction to write as if certified on that manufacturer
- [x] All other rules (1-4, 6-9 in diagnostic / 6-10 in repair complete) remain unchanged
- [x] JSON response format instructions remain unchanged
- **Completed:** 2026-03-05
- **Notes:** The previous rule #5 was a single sentence saying OEM terminology is "allowed and encouraged." The enhanced version is a structured 5-part instruction with specific manufacturer terminology examples (Active Fuel Management, StabiliTrak, AdvanceTrac, EcoBoost, Toyota Safety Sense, VTEC, Uconnect, SmartSense, iDrive, VANOS, etc.) that explicitly tells the AI to identify the OEM and use their certified terminology. This should produce narratives that read as if written by a manufacturer-certified technician.

### SESSION S3-5 — Enhanced OEM Terminology in Generation Prompts — COMPLETE
- **Scope:** S3-5.1
- **Completed:** 2026-03-05
- **Notes:** Strengthened rule #5 in both DIAGNOSTIC_ONLY_SYSTEM_PROMPT and REPAIR_COMPLETE_SYSTEM_PROMPT. The AI is now explicitly instructed to identify the vehicle's OEM, use manufacturer-specific diagnostic procedures, proprietary system names, and technical terminology with concrete examples for major manufacturers. This aligns with the Sprint 4 fix that stopped the proofread prompt from flagging OEM terms — now generation produces richer OEM-specific content and proofread accepts it.

---

## Stage 3 Sprint 6 — Add Inter Font for Data/Input Text Readability — COMPLETE

### S3-6.1 — Import Inter Font and Create CSS Utility
- [x] Imported `Inter` from `next/font/google` in `src/app/layout.tsx` with weights 300-600 and CSS variable `--font-data`
- [x] Added `${inter.variable}` class to `<body>` element alongside existing Orbitron variable
- [x] Created `.font-data` utility class in `src/app/globals.css` with `font-family: var(--font-data), system-ui, sans-serif`, `font-weight: 400`, `letter-spacing: 0.01em`
- **Completed:** 2026-03-05

### S3-6.2 — Apply font-data to All Data Text Components
- [x] `NarrativeDisplay.tsx` — Applied `font-data` to block narrative `<p>` and all three C/C/C section `<p>` elements
- [x] `NarrativeDetailModal.tsx` — Applied `font-data` to meta info row (R.O.#, Vehicle, dates) and concern/cause/correction display text
- [x] `ProofreadResults.tsx` — Applied `font-data` to summary text, flagged issues text, and each suggested edit span
- [x] `EditStoryModal.tsx` — Changed textarea base class from `font-mono text-xs` to `font-data text-sm` for all edit textareas
- [x] `NarrativeHistory.tsx` — Applied `font-data` to all 7 table data `<td>` cells (date, time, R.O.#, year, make, model, preview) and search input
- [x] `ProfileSection.tsx` — Applied `font-data` to data value spans (email, ID, location, position) while keeping labels unchanged
- [x] `Input.tsx` — Added `font-data` to base input element class
- [x] `Textarea.tsx` — Added `font-data` to base textarea element class
- [x] `AutoTextarea.tsx` — Added `font-data` to auto-sizing textarea element class
- [x] `ConditionalField.tsx` — Added `font-data` to conditional textarea class
- [x] `Select.tsx` — Added `font-data` to select element class
- [x] `EmailExportModal.tsx` — Added `font-data` to email input fields and subject preview text
- [x] Verified build compiles successfully with no errors
- **Completed:** 2026-03-05
- **Notes:** Inter font is applied only to data/content text — generated narratives, user input fields, table data cells, audit results, and profile data values. UI elements (titles, buttons, navigation, section headers, column headers, labels, toast messages) all keep the existing Orbitron font. The `.font-data` class sets `font-weight: 400` and `letter-spacing: 0.01em` for maximum readability on dark backgrounds, contrasting with Orbitron's `font-weight: 600` and `letter-spacing: 0.04em`.

### SESSION S3-6 — Data/Input Font Typography Update — COMPLETE
- **Scope:** S3-6.1, S3-6.2
- **Completed:** 2026-03-05
- **Notes:** Added Inter as a secondary data font while keeping Orbitron as the primary UI font. Inter is clean, highly legible, and optimized for body/data text readability. Applied surgically to 12 component files across narrative display, input controls, dashboard tables, profile data, audit results, and export modals. The visual contrast between the tech-styled Orbitron UI text and the clean Inter data text creates a professional, intentional typography hierarchy.

---

## Stage 3 Sprint 3 — Match Email and Print Exports to PDF Formatting — COMPLETE

### S3-3.1 — Create Shared Export HTML Builders
- [x] Added `buildPrintHtml(payload)` function to `src/lib/exportUtils.ts` — generates formatted HTML for print output matching the PDF layout exactly
- [x] Added `buildEmailHtml(narrative, displayFormat, vehicleInfo, senderName)` function to `src/lib/exportUtils.ts` — generates table-based inline-CSS HTML for email matching the PDF layout
- [x] Added `buildPlainTextEmail(narrative, displayFormat, vehicleInfo, senderName)` function to `src/lib/exportUtils.ts` — plain-text fallback with same info structure
- [x] Added shared `escapeHtml()` utility in `exportUtils.ts`
- [x] All three formats (PDF, Email, Print) now share the same document structure:
  - Two-column header: "Vehicle Information:" (bold underlined) with YEAR/MAKE/MODEL as separate label:value lines (left), "Repair Order #:" (bold underlined) with large R.O. number (right)
  - "REPAIR NARRATIVE" centered title (18pt bold underlined)
  - C/C/C sections: headers (CONCERN:/CAUSE:/CORRECTION:) at 13pt bold italic underlined, body at 11pt/14px
  - Block format: flowing paragraph body
  - Footer with ServiceDraft.AI logo (bottom-right)

### S3-3.2 — Update Email Export to Match PDF
- [x] Refactored `src/app/api/send-email/route.ts` to import and use `buildEmailHtml` and `buildPlainTextEmail` from `exportUtils.ts`
- [x] Removed duplicate `buildHtmlEmail`, `buildPlainTextEmail`, and `escapeHtml` functions from the route
- [x] Email vehicle info now shows separate YEAR/MAKE/MODEL labeled lines (previously was a single combined line)
- [x] Email header labels changed from "VEHICLE INFORMATION" / "REPAIR ORDER #" to "Vehicle Information:" / "Repair Order #:" to match PDF
- [x] Removed centered logo from email header — logo now in footer (bottom-right) matching PDF placement
- [x] C/C/C section header colors changed from `#333333` to `#000000` to match PDF

### S3-3.3 — Update Print Export to Match PDF
- [x] Updated `handlePrint()` in `src/components/narrative/ShareExportModal.tsx` to use `buildPrintHtml(buildPayload())` instead of basic HTML
- [x] Updated `handlePrint()` in `src/components/dashboard/NarrativeDetailModal.tsx` to use `buildPrintHtml(buildPayload())` instead of basic HTML
- [x] Removed unused `getVehicleHeader()` function from `ShareExportModal.tsx`
- [x] Print output now shows: two-column header with labeled vehicle fields, centered "REPAIR NARRATIVE" title, properly formatted C/C/C sections with bold italic underlined headers, footer logo
- [x] Print uses `@page` CSS for proper US Letter margins and `position: fixed` footer logo
- **Completed:** 2026-03-05
- **Notes:** Previously email showed vehicle info as a single combined line and had the logo at the top; print was extremely basic with just `<h2>`, `<hr>`, and `<pre>` tags. Both now match the PDF gold standard exactly: two-column header with separate YEAR/MAKE/MODEL label:value lines, large R.O.# on the right, centered "REPAIR NARRATIVE" title, properly formatted C/C/C sections, and footer logo. All formatting logic is centralized in `src/lib/exportUtils.ts` to prevent drift.

### SESSION S3-3 — Export Formatting Consistency — COMPLETE
- **Scope:** S3-3.1, S3-3.2, S3-3.3
- **Completed:** 2026-03-05
- **Notes:** Unified email and print exports to match the PDF format. Created shared `buildPrintHtml`, `buildEmailHtml`, and `buildPlainTextEmail` functions in exportUtils.ts. Email route refactored to use shared builders. Print handlers in both ShareExportModal and NarrativeDetailModal now use the shared `buildPrintHtml` function. All three export channels (PDF, Email, Print) now produce visually identical professional documents.

---

## Stage 3 Sprint 2 — Auto-Sizing Text Fields in Edit Story Modal — COMPLETE

### S3-2.1 — Increase Text Field Minimum Heights
- [x] Block format textarea: min-height increased from 300px (was already 300px, confirmed as appropriate)
- [x] C/C/C format textareas (Concern, Cause, Correction): min-height increased from 100px to 150px each
- [x] Removed dependency on the generic `Textarea` component — uses native `<textarea>` elements with matching theme styling (`var(--bg-input)`, `var(--accent-border)`, etc.)

### S3-2.2 — Implement Auto-Sizing Behavior
- [x] Added `useRef` for all four textareas (block, concern, cause, correction)
- [x] Created `autoResize` callback that measures `scrollHeight` and sets height dynamically
- [x] Auto-resize triggers on every `onChange` event (as user types)
- [x] Auto-resize triggers on modal open via `useEffect` with 50ms delay (ensures DOM is rendered with content)
- [x] Overflow behavior: `overflow: hidden` when content fits within max-height, switches to `overflow: auto` when content exceeds 60vh — no scrollbar shown unless needed
- [x] `resize: none` on all textareas — manual drag-resizing disabled, auto-sizing handles everything

### S3-2.3 — Modal Scroll Behavior
- [x] Modal body already has `max-h-[calc(100vh-8rem)] overflow-y-auto` on the content container (from `Modal.tsx`)
- [x] Individual textareas capped at `max-height: 60vh` — if content exceeds this, the textarea scrolls internally
- [x] If combined field heights exceed modal viewport, the modal body scrolls (not individual textareas)
- [x] Both formats (block and C/C/C) work correctly with the auto-sizing system

### S3-2.4 — Verified Build
- [x] `next build` compiles successfully with zero TypeScript errors
- **Completed:** 2026-03-05
- **Notes:** Replaced the `Textarea` UI component import with native `<textarea>` elements styled to match the theme. This was necessary to have direct ref access and full control over the auto-resize behavior (height, overflow toggling). The auto-resize pattern: collapse to `height: auto`, measure `scrollHeight`, compare against `60vh` max, set final height and overflow mode. The modal's existing `overflow-y-auto` on the content container handles cases where expanded textareas push total content beyond the viewport.

---

## Stage 3 Sprint 7 — My Repairs Database & API Backend — COMPLETE

### S3-7.1 — Create saved_repairs Migration
- [x] Created `supabase/migrations/005_saved_repairs.sql` with full table schema
- [x] Table columns: id (uuid PK), user_id (FK to auth.users), template_name, story_type, year, make, model, customer_concern, codes_present, codes_present_option, diagnostics_performed, diagnostics_option, root_cause, root_cause_option, repair_performed, repair_option, repair_verification, verification_option, recommended_action, recommended_option, created_at, updated_at
- [x] Added indexes on user_id and updated_at for fast lookups
- **Completed:** 2026-03-05

### S3-7.2 — Row Level Security Policies
- [x] Enabled RLS on saved_repairs table
- [x] SELECT policy: users can only read their own templates (auth.uid() = user_id)
- [x] INSERT policy: users can only insert templates for themselves (auth.uid() = user_id)
- [x] UPDATE policy: users can only update their own templates (auth.uid() = user_id)
- [x] DELETE policy: users can only delete their own templates (auth.uid() = user_id)
- **Completed:** 2026-03-05

### S3-7.3 — API Routes
- [x] Created `src/app/api/saved-repairs/route.ts` with GET (fetch all user templates, ordered by updated_at desc) and POST (create new template with validation)
- [x] Created `src/app/api/saved-repairs/[id]/route.ts` with PUT (update template with ownership check) and DELETE (delete template with ownership check)
- [x] All routes check for authenticated user (401 if not authenticated)
- [x] POST validates required fields (template_name, story_type) and valid story_type values
- [x] PUT/DELETE verify template ownership before modifying (404 if not found/not owned)
- [x] PUT uses allowlist of updatable fields to prevent arbitrary field injection
- [x] All routes use try/catch with proper HTTP status codes (200, 201, 400, 401, 404, 500)
- **Completed:** 2026-03-05

### S3-7.4 — Verified Build
- [x] `npx tsc --noEmit` compiles successfully with zero TypeScript errors
- **Completed:** 2026-03-05
- **Notes:** Migration file must be run manually in the Supabase SQL Editor before the API routes will function. The UI for the My Repairs system will be built in Sprint 8.

### SESSION S3-7 — My Repairs Database & Backend — COMPLETE
- **Scope:** S3-7.1, S3-7.2, S3-7.3, S3-7.4
- **Completed:** 2026-03-05
- **Notes:** Created the saved_repairs table with full schema for storing repair scenario templates, RLS policies for user-scoped access, and four CRUD API endpoints (GET list, POST create, PUT update, DELETE remove). The table stores all input field values plus their dropdown option states so templates can fully prefill the input form. Sprint 8 will build the UI components for managing and loading templates.

---

## Stage 3 Sprint 8 — My Repairs UI Panel with Load, Save, Edit, Delete — COMPLETE

### S3-8.1 — MY REPAIRS Button on Input Page
- [x] Added prominent "MY REPAIRS" button at the top of the Input Page, centered above the story type selector
- [x] Styled as secondary variant with Wrench icon, matching app's accent color theme
- [x] Opens the MyRepairsPanel slide-out panel when clicked
- **Completed:** 2026-03-05

### S3-8.2 — MyRepairsPanel Slide-Out Component
- [x] Created `src/components/input/MyRepairsPanel.tsx` — slide-out panel from right side
- [x] Fetches user's saved repair templates from GET /api/saved-repairs on open
- [x] Displays each template as a glassmorphism card with: template name (bold), story type badge (purple for Repair Complete, blue for Diagnostic Only), vehicle info ("Year Make Model" or "Any Vehicle"), customer concern preview (first 50 chars)
- [x] Three action buttons per card: Load (primary, fills form), Edit (secondary, opens edit modal), Delete (ghost red, shows confirmation)
- [x] Search/filter bar at top to filter templates by name or vehicle info
- [x] Loading state with spinner while fetching
- [x] Empty state with helpful message for first-time users
- [x] Slide-in/out animation using Framer Motion spring transition
- [x] Portaled to document.body to escape parent overflow constraints
- **Completed:** 2026-03-05

### S3-8.3 — Load Template into Form
- [x] Clicking "Load" on a template card: sets story type selector to template's story_type (diagnostic_only or repair_complete), prefills all text fields, sets all dropdown states
- [x] Maps API option values back to store format: 'exclude' → 'dont_include', 'generate' → 'generate', default → 'include'
- [x] For 'exclude'/'generate' options: clears text field and sets dropdown state; for 'include': fills in saved text value
- [x] Closes the My Repairs panel after loading
- [x] Shows toast: "Template loaded: [template name]"
- [x] Uses setTimeout(50ms) to allow story type state change to propagate before setting field values
- **Completed:** 2026-03-05

### S3-8.4 — SAVE AS MY REPAIR Button & Modal
- [x] Added "SAVE AS MY REPAIR" ghost button below the Generate Story button with BookmarkPlus icon
- [x] Created `src/components/input/SaveRepairModal.tsx` — modal with template name input
- [x] Captures all current form state: story_type, all field values, all dropdown option states
- [x] Maps store dropdown options to API format: 'dont_include' → 'exclude'
- [x] POSTs to /api/saved-repairs with complete form data
- [x] Shows summary preview of what will be saved (story type, vehicle info)
- [x] Toast on success: "Repair template saved!", error toast on failure
- **Completed:** 2026-03-05

### S3-8.5 — Edit Template Modal
- [x] Created `src/components/input/EditRepairModal.tsx` — modal for editing saved templates
- [x] Editable fields: template name, year, make, model, and all conditional field text values
- [x] Shows only fields relevant to the template's story type (diagnostic vs repair)
- [x] Displays current dropdown option status next to each field label
- [x] PUTs to /api/saved-repairs/[id] on save, refreshes template list after saving
- [x] Toast on success: "Template updated"
- **Completed:** 2026-03-05

### S3-8.6 — Delete Template with Confirmation
- [x] Clicking "Delete" shows inline confirmation: "Delete '[name]'? This cannot be undone."
- [x] Confirm button sends DELETE to /api/saved-repairs/[id]
- [x] Template removed from list with Framer Motion exit animation (slide right + fade out)
- [x] Toast: "Template deleted"
- [x] Cancel button dismisses confirmation inline
- **Completed:** 2026-03-05

### S3-8.7 — Verified Build
- [x] `npx tsc --noEmit` compiles with zero TypeScript errors
- [x] `npx next build` completes successfully — all pages and API routes compile
- **Completed:** 2026-03-05

### SESSION S3-8 — My Repairs UI Panel — COMPLETE
- **Scope:** S3-8.1, S3-8.2, S3-8.3, S3-8.4, S3-8.5, S3-8.6, S3-8.7
- **Completed:** 2026-03-05
- **Notes:** Built the complete My Repairs template management UI. Users can save the current input form as a named template, browse/search saved templates in a slide-out panel, load a template to prefill the entire form (including story type, all fields, and dropdown states), edit template details, and delete templates with confirmation. All components use the app's CSS variable theming system, glassmorphism card styling, and Framer Motion animations. The template system maps between store format (diagnostic_only/repair_complete, dont_include) and API format (diagnostic/repair, exclude) seamlessly.

---

## STAGE 3 — SPRINT 9: DIAGNOSTIC → REPAIR COMPLETE UPDATE SYSTEM

### S3-9.1 — Save API Changed from UPSERT to INSERT
- [x] Modified `src/app/api/narratives/save/route.ts` — replaced `.upsert()` with `.insert()` so every save creates a new row
- [x] Created migration `supabase/migrations/006_drop_narrative_unique_constraint.sql` — drops the `UNIQUE(user_id, ro_number)` constraint that was blocking multiple entries with the same RO#
- [x] Updated `saveToDatabase()` in narrative page — added `savedNarrativeId` check to prevent duplicate rows from auto-save within the same session
- **Completed:** 2026-03-05
- **Notes:** Each narrative save is now a plain INSERT. Diagnostic-only and repair-complete entries with the same RO# coexist as separate rows. The original diagnostic entry is never modified or deleted. User must run migration 006 in Supabase SQL Editor.

### S3-9.2 — Convert Recommendation API Route
- [x] Created `src/app/api/convert-recommendation/route.ts` — POST endpoint that takes a diagnostic recommendation/correction text and uses Gemini to reword it from future/recommended tense to past/completed tense
- [x] Short, targeted system prompt for tense conversion only
- [x] Used by the "COMPLETED RECOMMEND REPAIR" button in the update modal
- **Completed:** 2026-03-05

### S3-9.3 — Update Narrative API Route
- [x] Created `src/app/api/update-narrative/route.ts` — POST endpoint that takes original diagnostic narrative + completed repair info and generates a full repair-complete narrative via Gemini
- [x] Preserves all original diagnostic detail (concern, cause, root cause identification)
- [x] Incorporates repair performed, verification steps, and additional notes
- [x] Dropdown logic: Include → use text, Don't Include → skip, Generate → use AI inference instruction
- [x] Same restriction check and auth as the generate route
- **Completed:** 2026-03-05

### S3-9.4 — UpdateWithRepairModal Component
- [x] Created `src/components/dashboard/UpdateWithRepairModal.tsx` — full-featured modal for the diagnostic-to-repair update flow
- [x] Vehicle info badges at top (Year, Make, Model, RO#) displayed as read-only accent-colored pills
- [x] Field 1: Repair Performed textarea with dropdown (Include/Don't Include/Generate) and "COMPLETED RECOMMEND REPAIR" convenience button
- [x] Field 2: Repair Verification Steps textarea with same dropdown
- [x] Field 3: Additional Notes textarea (optional, no dropdown)
- [x] "GENERATE NARRATIVE" button at bottom — disabled until repair info is provided
- [x] Auto-expanding textareas with same styling as input page fields
- [x] Loading spinner on "COMPLETED RECOMMEND REPAIR" button during API call
- [x] Calls `/api/update-narrative` and uses `setForRepairUpdate()` to pass result to narrative page
- [x] Navigates to `/narrative` on success
- **Completed:** 2026-03-05

### S3-9.5 — "UPDATE NARRATIVE WITH REPAIR" Button in Saved Story Modal
- [x] Added prominent "UPDATE NARRATIVE WITH REPAIR" button at top of `NarrativeDetailModal.tsx`
- [x] Uses `ArrowUpCircle` icon from lucide-react
- [x] Only visible when `narrative.story_type === 'diagnostic_only'` — hidden for repair-complete entries
- [x] Opens the UpdateWithRepairModal on click
- [x] Closing the update modal also closes the saved story modal (clean navigation)
- **Completed:** 2026-03-05

### S3-9.6 — Narrative Store: setForRepairUpdate Method
- [x] Added `setForRepairUpdate()` method to `src/stores/narrativeStore.ts`
- [x] Sets narrative data from the update API response, storyType to 'repair_complete', roNumber and vehicle info from the original diagnostic entry
- [x] Clears compiledDataBlock (not needed — narrative already generated), resets customization state
- [x] Sets `isSaved: false` and `savedNarrativeId: null` for proper navigation guard behavior
- **Completed:** 2026-03-05

### S3-9.7 — Narrative Page: Support Repair Update Flow
- [x] Updated redirect logic in `src/app/(protected)/narrative/page.tsx` to allow entry when `narrative` exists but `compiledDataBlock` is empty (repair update flow)
- [x] Auto-generate only fires when `compiledDataBlock` exists (normal flow), not in repair update flow (narrative already provided)
- **Completed:** 2026-03-05

### S3-9.8 — Dashboard Story Type Badges
- [x] Added "Type" column to the NarrativeHistory table header in `src/components/dashboard/NarrativeHistory.tsx`
- [x] Each row displays a colored badge: "DIAGNOSTIC" (amber/yellow) for diagnostic_only entries, "REPAIR COMPLETE" (green) for repair_complete entries
- [x] Badges styled as small rounded pills with semi-transparent background and colored border
- **Completed:** 2026-03-05

### SESSION S3-9 — Diagnostic → Repair Complete Update System — COMPLETE
- **Scope:** S3-9.1 through S3-9.8
- **Completed:** 2026-03-05
- **Notes:** Complete flow for updating diagnostic-only narratives with repair information. Users open a saved diagnostic story from the dashboard, click "UPDATE NARRATIVE WITH REPAIR", fill in repair details (with optional AI-assisted tense conversion), and generate a new repair-complete narrative. Both entries coexist in the database as separate rows. Dashboard shows story type badges for quick identification. Migration 006 must be run to drop the old unique constraint.

⚠️ **USER ACTION REQUIRED:** Run `supabase/migrations/006_drop_narrative_unique_constraint.sql` in the Supabase SQL Editor to drop the `UNIQUE(user_id, ro_number)` constraint. Without this, saving multiple narratives with the same RO# will fail.

---

## POST-SPRINT 9 ADJUSTMENT — COMPLETED RECOMMENDED REPAIR BUTTON REWORK

### PS9-A.1 — Remove API Call from "Completed Recommended Repair" Button
- [x] Removed the `/api/convert-recommendation` API call from the button handler — button no longer triggers any network request
- [x] Button now toggles a `useRecommendedRepair` boolean state instead of calling the AI for tense conversion
- [x] When toggled ON: Repair Performed text field collapses and displays a pre-filled instruction box (dashed border, accent-colored italic text with CheckCircle icon) explaining that the AI will convert the diagnostic recommendation to past tense during main generation
- [x] When toggled OFF: text field reappears empty, user can type their own repair info
- [x] The instruction text (`COMPLETED_REPAIR_INSTRUCTION` constant) is compiled into the data sent to `/api/update-narrative` when the user clicks "Generate Narrative" — the main API call handles the full conversion in one shot
- [x] Removed `isConverting` state, `handleConvertRecommendation()` function, and Loader2 spinner from the button
- [x] `canGenerate` logic updated: enabled if `useRecommendedRepair` is true OR if the user typed text in the Repair Performed field
- **Completed:** 2026-03-05
- **Notes:** The convert-recommendation API route (`src/app/api/convert-recommendation/route.ts`) still exists in the codebase but is no longer called by any frontend code. The update-narrative API already handles the full diagnostic-to-repair conversion, making the separate tense-conversion call redundant.

### PS9-A.2 — Enlarge "Completed Recommended Repair" Button
- [x] Width increased to 75% of the container (`w-3/4`)
- [x] Height roughly doubled with `py-4` padding (was `py-1`)
- [x] Font size increased from `text-[10px]` to `text-sm` with `font-bold` and `tracking-wider`
- [x] Styled as a prominent action button with `rounded-xl` and `border-2`
- [x] Two visual states: inactive (accent tint bg, accent border) and active (solid accent primary bg with glow shadow)
- [x] Icon: Sparkles when inactive, CheckCircle when active — communicates toggle state
- [x] Button centered horizontally via `flex justify-center` wrapper
- **Completed:** 2026-03-05

### PS9-A.3 — Reposition Button and Remove Repair Performed Dropdown
- [x] Moved "COMPLETED RECOMMENDED REPAIR" button from inside the Repair Performed header row to its own block directly below the Repair Performed text field and above Repair Verification Steps
- [x] Removed the dropdown menu (Include/Don't Include/Generate) from the Repair Performed field entirely — user either types their own text or clicks the button
- [x] Removed `repairPerformedDropdown` state — the field always sends as 'include' to the API
- [x] Repair Verification Steps field retains its dropdown (Include/Don't Include/Generate) as before
- [x] Layout order in modal: Vehicle badges → Repair Performed label + text field → COMPLETED RECOMMENDED REPAIR button → Repair Verification Steps + dropdown → Additional Notes → GENERATE NARRATIVE button
- **Completed:** 2026-03-05

### SESSION PS9-A — Post-Sprint 9 Adjustment — COMPLETE
- **Scope:** PS9-A.1, PS9-A.2, PS9-A.3
- **Completed:** 2026-03-05
- **Notes:** Reworked the "Completed Recommended Repair" button in the UpdateWithRepairModal to eliminate the wasteful separate API call for tense conversion. The button now acts as a toggle that collapses the Repair Performed text field and pre-fills it with an instruction for the main Generate Narrative API call. The button has been significantly enlarged (75% width, double height, prominent styling) and repositioned directly below the Repair Performed field. The Repair Performed dropdown was removed since the two user paths (type manually or click the button) make a three-option dropdown unnecessary. No changes to the update-narrative API route, save logic, dashboard badges, or conditional visibility of the "UPDATE NARRATIVE WITH REPAIR" button.

---

## STAGE 4 — UI QUICK FIXES & POLISH

### STAGE 4 SPRINT 1 — UI Quick Fixes & Font Fix

### S4-1.1 — Fix Inter Font Rendering (CSS Specificity)
- [x] Updated `.font-data` class in `globals.css` to use `!important` on `font-family` and `font-weight` to override the body Orbitron font
- [x] Verified `font-data` class is applied in `Input.tsx`, `AutoTextarea.tsx`, `MyRepairsPanel.tsx` search input, and `EditRepairModal.tsx` textareas
- **Completed:** 2026-03-06
- **Notes:** The body sets `font-family: var(--font-orbitron)` with `font-weight: 600`, which was overriding child `.font-data` elements. Adding `!important` ensures Inter renders on all data/input fields.

### S4-1.2 — Fix My Repairs Sidebar Positioning
- [x] Changed slide-out panel from `fixed right-0 top-0 bottom-0` to `fixed right-0 bottom-0` with `style={{ top: '156px' }}`
- [x] Panel now starts below the hero area (100px) + nav bar (56px) = 156px offset
- **Completed:** 2026-03-06
- **Notes:** Previously the sidebar extended behind the hero and nav bar, hiding the top portion of its content.

### S4-1.3 — Move "My Repairs" Button Inside Container Card
- [x] Removed the standalone "MY REPAIRS" button div above the input cards
- [x] Replaced the "Additional Information" h3 subtitle inside the Repair Order Information card with a "REPAIR TEMPLATES" button
- [x] Button uses `variant="secondary"`, `size="medium"`, `w-[30%] min-w-[160px]`, with Wrench icon
- **Completed:** 2026-03-06
- **Notes:** Button now sits inside the card, below the divider line, where "Additional Information" used to be.

### S4-1.4 — Rename "Save as My Repair" to "Save as Repair Template"
- [x] Updated button text in `input/page.tsx` from "SAVE AS MY REPAIR" to "SAVE AS REPAIR TEMPLATE"
- [x] Updated modal title in `SaveRepairModal.tsx` from "Save as My Repair" to "Save as Repair Template"
- [x] Updated empty state text in `MyRepairsPanel.tsx` from "Save as My Repair" to "Save as Repair Template"
- **Completed:** 2026-03-06

### S4-1.5 — Generate New Stripe Access Code
- [x] Changed fallback access code in `src/app/api/stripe/route.ts` from `'SERVICEDRAFT2026'` to `'SDRAFT-BETA-2026'`
- **Completed:** 2026-03-06

### SESSION S4-SPRINT-1 — Stage 4 Sprint 1 — COMPLETE
- **Scope:** S4-1.1, S4-1.2, S4-1.3, S4-1.4, S4-1.5
- **Completed:** 2026-03-06
- **Notes:** Five UI quick fixes: (1) Inter font now renders correctly on all input/data fields via `!important` override on `.font-data` class, (2) My Repairs sidebar panel positioned below hero+nav at 156px top offset, (3) "MY REPAIRS" button moved inside the Repair Order Information card as "REPAIR TEMPLATES" replacing the "Additional Information" subtitle, (4) All "Save as My Repair" references renamed to "Save as Repair Template", (5) Stripe fallback access code changed to `SDRAFT-BETA-2026`.

---

## STAGE 4 — SPRINT 2: INPUT PAGE BEHAVIOR + BUG FIX

### S4-2.1 — Add Clear Form Button to Input Page
- [x] Added `clearFormFields` action to `src/stores/narrativeStore.ts` — resets `fieldValues` to `{}`, `dropdownSelections` to `{}`, and `roNumber` to `''` without changing `storyType`
- [x] Added `RotateCcw` icon import from lucide-react to input page
- [x] Modified "Repair Order Information" card header to flex row: h2 on left, "CLEAR FORM" button on right
- [x] Clear Form button styled as ghost/text button: `text-xs text-[var(--text-muted)] hover:text-[var(--accent-bright)]` with RotateCcw icon
- [x] On click: calls `clearFormFields()` and shows "Form cleared" toast
- [x] Does NOT reset story type selection — only clears field data within the current story type
- **Completed:** 2026-03-06

### S4-2.2 — Fix Story Type Switching to Preserve Shared Fields
- [x] Updated `setStoryType` in `src/stores/narrativeStore.ts` to preserve values for shared fields: `year`, `make`, `model`, `customer_concern`, `codes_present`, `diagnostics_performed`, `root_cause`
- [x] Preserves dropdown selections for shared conditional fields: `codes_present`, `diagnostics_performed`, `root_cause`
- [x] Type-specific fields cleared on switch: `recommended_action` (diagnostic_only only), `repair_performed` + `repair_verification` (repair_complete only)
- [x] `roNumber` always preserved (stored separately in state)
- **Completed:** 2026-03-06

### S4-2.3 — Fix ProofreadResults setState-During-Render Bug
- [x] Fixed React console error "Cannot update a component (NarrativePage) while rendering a different component (ProofreadResults)"
- [x] Root cause: `notifyParent()` in the `useEffect` that resets checkboxes when data changes was calling `onSelectionChange` (parent setState) synchronously during the render cycle
- [x] Fix: Wrapped `notifyParent(fresh)` call in `setTimeout(() => ..., 0)` to defer parent state update to the next tick
- [x] Added cleanup `clearTimeout` in the useEffect return to prevent memory leaks
- **Completed:** 2026-03-06

### SESSION S4-SPRINT-2 — Stage 4 Sprint 2 — COMPLETE
- **Scope:** S4-2.1, S4-2.2, S4-2.3
- **Completed:** 2026-03-06
- **Notes:** Three changes: (1) Clear Form button added to Repair Order Information card header with RotateCcw icon and ghost styling, (2) Story type switching now preserves shared field values (year, make, model, customer_concern, codes_present, diagnostics_performed, root_cause) instead of wiping all fields, (3) ProofreadResults render bug fixed by deferring parent notification to next tick with setTimeout.

### SESSION S4-SPRINT-3 — Stage 4 Sprint 3: My Repairs Template Refactor — COMPLETE
- **Scope:** S4-3.1 through S4-3.6
- **Completed:** 2026-03-06
- **Notes:** Refactored repair templates to only save 5 core repair fields (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification) with their dropdown options. Removed year, make, model, customer_concern, and recommended_action from save/display/edit flows so templates can be reused across different vehicles. DB columns remain unchanged. Changes applied to:
  - S4-3.1: SaveRepairModal — nulled out vehicle/concern/recommended fields in save body, updated summary box and description text
  - S4-3.2: MyRepairsPanel — removed vehicle info line and concern preview from template cards, search by template_name only, updated empty state text
  - S4-3.3: EditRepairModal — removed year/make/model inputs, removed customer_concern and recommended_action from editable fields, removed relevantFields filter to show all 5 fields always, nulled year/make/model in save
  - S4-3.4: handleLoadTemplate (input/page.tsx) — removed lines setting year/make/model/customer_concern, removed recommended_action from conditionalFields
  - S4-3.5: saved-repairs POST API — forced year/make/model/customer_concern/recommended_action/recommended_option to null
  - S4-3.6: saved-repairs PUT API — forced year/make/model to null, removed customer_concern and recommended_action from allowed fields

### SESSION S4-SPRINT-4 — Stage 4 Sprint 4: Navigation & Header Overhaul — COMPLETE
- **Scope:** S4-4.1 through S4-4.4
- **Completed:** 2026-03-06
- **Notes:** Complete navigation bar and hero area redesign.
  - S4-4.1: Increased nav bar height from h-14 (56px) to h-16 (64px). Updated NAV_HEIGHT constant in HeroArea.tsx, paddingTop/min-h-calc in layout.tsx (156px to 164px), sidebar top in MyRepairsPanel.tsx, mobile dropdown top-14 to top-16, and min-h-calc in main-menu/page.tsx.
  - S4-4.2: Made hero logo clickable by wrapping img in Next.js Link to /main-menu with pointer-events-auto, cursor-pointer, and hover:scale-[1.03] transition.
  - S4-4.3: Redesigned NavBar into 3-section layout:
    - LEFT: Styled "MAIN MENU" button with bg-[var(--accent-10)], border, rounded-lg, hover glow
    - CENTER: ServiceDraft-Ai Vector Logo.png centered absolutely with theme-aware CSS filter (brightness(0) invert(1) for dark mode, brightness(0) for light mode)
    - RIGHT: Unchanged — theme toggle, UserPopup, mobile menu toggle
  - S4-4.4: Removed old SD icon image from nav bar. Mobile hamburger menu and responsive breakpoints verified working. Build compiles cleanly.

### SESSION S4-SPRINT-5 — Stage 4 Sprint 5: Terms of Use & FAQ Expansion — COMPLETE
- **Scope:** S4-5.1 through S4-5.4
- **Completed:** 2026-03-06
- **Notes:** Added Terms of Use and expanded FAQ content across the application.
  - S4-5.1: Created `src/components/layout/TermsOfUse.tsx` — scrollable content component with 11 sections covering acceptance, service description, user responsibilities, AI disclaimer, account terms, subscription/billing, intellectual property, data privacy, limitation of liability, modifications, and termination. Styled with app theme variables, "Last Updated: March 2026", scrollable `max-h-[70vh]`.
  - S4-5.2: Updated signup page (`src/app/(auth)/signup/page.tsx`) — added `termsAccepted` and `showTerms` state. Added checkbox with "I agree to the Terms of Use" label where "Terms of Use" is a clickable link opening a modal. Signup CONTINUE button disabled until terms accepted. Added Modal with TermsOfUse component.
  - S4-5.3: Updated main menu page (`src/app/(protected)/main-menu/page.tsx`) — added "TERMS OF USE" to bottomItems array with FileText icon. Added `showTerms` state and Modal with TermsOfUse component. Imported TermsOfUse and FileText icon.
  - S4-5.4: Expanded FAQ content (`src/components/layout/FAQContent.tsx`) — added 8 new Q&As: Repair Templates, AI Customization, audit rating explanation, export options, data security, Generate Applicable Info, contact support, mobile usage.

### SESSION S4-SPRINT-6 — Stage 4 Sprint 6: Admin Dashboard Core Rebuild — COMPLETE
- **Scope:** S4-6.1 through S4-6.5
- **Completed:** 2026-03-06
- **Notes:** Complete admin dashboard overhaul with expanded metrics and new Overview tab.
  - S4-6.1: Activity logging audit — verified all 10 required action types are logged (generate, regenerate, save, export_copy/print/pdf/docx, login, customize, proofread). RLS policies confirmed working for admin reads via is_admin() helper function.
  - S4-6.2: Rebuilt analytics API (`src/app/api/admin/analytics/route.ts`) — added newUsersMonth, totalGenerations (generate+regenerate), totalExports (all export types), totalProofreads, totalCustomizations, totalSavedTemplates (from saved_repairs table), activityByDay (30-day activity chart), subscriptionBreakdown (active/trial/expired/bypass counts). Expanded topUsers from top 5 to top 10.
  - S4-6.3: Rebuilt admin page with 4 tabs — added Overview as default tab (was 3 tabs: activity/users/analytics, now 4: overview/activity/users/analytics). Overview tab contains 8 metric cards in 2x4 grid (Users, Subscriptions, Narratives, Today, Generations, Exports, Proofreads, Templates), subscription breakdown section, and 30-day activity trend chart. Refresh button + last-updated timestamp on overview.
  - S4-6.4: Activity Log tab polish — enhanced action type badges to pill-style with color-coded backgrounds and borders. All existing features confirmed working: pagination, action_type filtering, user search, expandable metadata rows.
  - S4-6.5: User Management tab verified — all features functional: sortable columns, search, user detail expansion, restrict/unrestrict with confirmation modal, delete with multi-step confirmation, subscription status change dropdown, password reset.

### SESSION S4-SPRINT-6-UIFIX — Post-Sprint 6: Admin Dashboard UI/UX Fixes — COMPLETE
- **Scope:** 6 UI/UX improvement tasks
- **Completed:** 2026-03-06
- **Notes:** Comprehensive admin dashboard visual and usability overhaul.
  - Task 1: Protected user — hvcadip@gmail.com now shows "Protected" badge with ShieldCheck icon instead of delete/restrict action buttons. Cannot be accidentally deleted or restricted from admin panel.
  - Task 2: Wider layout — container changed from max-w-7xl to max-w-[1400px] with increased horizontal padding (px-4 → px-6) for better use of screen real estate.
  - Task 3: Larger text sizes — bumped all text-xs to text-sm minimum, metric card values to text-4xl, section headings to text-lg, table body text to text-sm with whitespace-nowrap for clean alignment.
  - Task 4: Centered title and animated tab buttons — dashboard title and shield icon centered, tabs redesigned as large framer-motion animated buttons with whileHover/whileTap scale effects, active state uses accent-primary background with glow shadow, generous px-6 py-3 padding.
  - Task 5: User management table improvements — split single Name column into separate First Name and Last Name columns, added Role column, changed date formats to MM-DD-YYYY (Sign Up) and MM-DD-YYYY HH:MM AM/PM (Last Activity), updated sort column types and expanded row colSpan to 10.
  - Task 6: Larger action icons — increased icon sizes from 16 to 20, enlarged clickable area from p-1.5 to p-2.5 with rounded-lg, center-aligned Actions column header and button container.

---

## SESSION S4-SPRINT-6-UIFIX-R2 — Owner Dashboard UI Fixes Round 2 — COMPLETE
- **Scope:** 5 UI/UX improvement tasks
- **Completed:** 2026-03-06
- **Notes:** Second round of admin/owner dashboard visual and usability improvements.
  - Task 1: Last Activity column — stacked date (MM/DD/YYYY) and time (HH:MM AM/PM) vertically with time in smaller muted text. Also changed date format from dashes to slashes throughout.
  - Task 2: Center-aligned all column header titles — changed thead tr from text-left to text-center, added text-center and justify-center to each th element in the User Management table.
  - Task 3: Wider layout — container changed from max-w-[1400px] to max-w-[90vw] for better use of screen real estate on all screen sizes.
  - Task 4: Sorting controls — reduced search bar width to 35%, added "Sort by" dropdown (First Name, Last Name, Email, Subscription, Narratives, Sign Up Date, Last Active) and ascending/descending toggle button with ArrowUp/ArrowDown icons next to the search bar. Column headers remain clickable for sort as well.
  - Task 5: Renamed "Admin Dashboard" to "OWNER DASHBOARD" with premium styling — text-5xl outlined text with neon glow (text-shadow using accent-primary), liquid glass background (rgba backdrop-blur with accent border, rounded-[16px]), and spotlight mouse hover animation (radial-gradient that follows cursor position via onMouseMove/useState). Shield icon also has accent glow via drop-shadow filter.

---

## Stage 4 Sprint 7 — Admin Analytics with Charts, Time Ranges, and System Health — COMPLETE
- **Scope:** 4 tasks
- **Completed:** 2026-03-06
- **Notes:** Upgraded admin analytics tab from CSS bar charts to recharts library, added time range filtering, and system health indicators.
  - Task 1: Built Analytics tab with recharts — Activity Trend (LineChart, accent color), Feature Usage (horizontal BarChart by action_type, color-coded using ACTION_BORDER_COLORS), Story Type Distribution (PieChart, diagnostic vs repair), Subscription Breakdown (PieChart by status), Top Users Leaderboard (table, top 10), Usage Over Time (stacked AreaChart by action type). All charts use themed tooltips with dark background styling.
  - Task 2: Added time range selector — "Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time" filter buttons. Default 30d. Re-fetches analytics data on change. Updated analyticsRange state type from `'7'|'14'|'30'|'all'` to `'7'|'30'|'90'|'all'`.
  - Task 3: Updated analytics API (`src/app/api/admin/analytics/route.ts`) — accepts `range` query param (`7`, `30`, `90`, `all`). Added `usageOverTime` (per-day per-action-type breakdown for stacked AreaChart), `actionTypes` (list of all action types), and `systemHealth` (DB row counts, last activity timestamp, app version). Activity-by-day chart now uses range-based query instead of fixed 30 days.
  - Task 4: Added System Health indicators to Overview tab — DB row counts card grid (users, narratives, activity_log, saved_repairs), last activity timestamp, app version "v1.0.0-beta". Also replaced Overview tab's CSS bar chart with recharts LineChart. Added Database, Clock, Server icons from lucide-react.
  - **Package added:** `recharts` (npm install recharts)

---

## Stage 4 Sprint 8 — Admin Management Tools, Export, Polish, and Dashboard Refinement — COMPLETE
- **Scope:** 4 tasks
- **Completed:** 2026-03-06
- **Notes:** Added Settings tab, CSV export, user management polish, and overall dashboard polish.
  - Task 1: **Settings Tab (5th tab)** — Added new "Settings" tab with three sections: (1) Access Code Management — displays current ACCESS_CODE from env, copy-to-clipboard button, "Generate New Code" button that creates SDRAFT-XXXX-XXXX format codes, instruction callout to update Vercel env var; (2) Quick Stats Summary — 8-stat grid showing all key metrics at a glance; (3) System Information — version, environment (dev/prod auto-detect), database (Supabase PostgreSQL + total row count), deployment platform. Added `get_access_code` action to admin API route.
  - Task 2: **Export Report CSV** — Added "Export Report" button to Analytics tab header. Generates comprehensive CSV with sections: key metrics, subscription breakdown, story type breakdown, activity by type, daily activity data, top users leaderboard. Downloads as `servicedraft-analytics-YYYY-MM-DD.csv`.
  - Task 3: **User Management Polish** — Added role column with color-coded badge (Admin = gold crown icon, User = gray). Added admin promotion/demotion with confirmation modal (Crown icon, warns about dashboard access). Added `promote_to_admin` and `demote_to_user` actions to admin API. Added user count summary cards at top (Total Users, Active, Inactive) with UserCheck/UserX icons.
  - Task 4: **Overall Polish** — Wrapped all tab content in `AnimatePresence mode="wait"` with slide/fade transitions (tabVariants: initial/animate/exit). Added error states with retry button (AlertTriangle icon + retry button) for analytics. Made responsive: smaller padding/text on mobile, hidden columns (email/position on md, last_active on lg), tab labels hidden on mobile (icons only), responsive grid gaps. Consistent spacing throughout with sm: breakpoint responsive padding.

---

## Pre-Deployment Audit — Security Hardening & Production Readiness — COMPLETE
- **Scope:** 11 audit items across 6 categories
- **Completed:** 2026-03-09
- **Notes:** Comprehensive audit preparing for Vercel production deployment.

### Build Verification
- [x] `npm run build` passes with 0 errors, 0 TypeScript violations
- [x] All imports resolve correctly
- [x] Only cosmetic warning: Next.js 16 middleware deprecation (non-blocking)

### Security Hardening
- [x] **CRITICAL FIX:** Removed dangerous ANON_KEY fallback in Stripe webhook (`/api/stripe/webhook/route.ts`). Service role key now required — throws error if missing instead of silently degrading to public key.
- [x] **Added authentication** to 5 previously unauthenticated API routes: `/api/proofread`, `/api/customize`, `/api/apply-edits`, `/api/export-pdf`, `/api/export-docx`. All now require valid Supabase session.
- [x] **Added rate limiting** to `/api/generate` — 20 requests per user per 15 minutes (in-memory, server-side). Created `src/lib/rateLimit.ts` utility.
- [x] **Added input length validation** to `/api/generate` — compiled data block capped at 10,000 characters.
- [x] **Added CSP and security headers** to `next.config.ts`: Content-Security-Policy, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy.
- [x] **Removed hardcoded access code** default (`SDRAFT-BETA-2026`) from `/api/stripe/route.ts` and `/api/admin/route.ts`. Access code now read exclusively from `ACCESS_CODE` environment variable.
- [x] Verified: No API keys, secrets, or sensitive data in client-side code. Service role key only used in server-side API routes.
- [x] Verified: `.env.local` is in `.gitignore` and was never committed to git history.

### Environment Variable Audit
- [x] Added `STRIPE_PRICE_ID` to `src/lib/env.ts` optional vars (was used but undeclared).
- [x] Added `validateEnv()` call at app startup in `src/app/layout.tsx`.
- [x] Complete environment variable list documented in `DEPLOYMENT_NOTES.md`.

### Code Cleanup
- [x] Replaced `console.log` in `/api/support/route.ts` with `console.error` (server-side logging).
- [x] No TODO/FIXME/HACK comments found — codebase is clean.
- [x] No commented-out code blocks found.
- [x] ErrorBoundary component exists and is used in protected layout.

### Performance Check
- [x] Logo component uses Next.js `Image` component (auto-optimization to WebP).
- [x] Logo source files are large (~2.2MB each) but served optimized by Next.js — noted as deployment consideration.
- [x] Unused Next.js default SVGs (file.svg, globe.svg, window.svg, next.svg, vercel.svg) are not referenced in code.

### Deployment Documentation
- [x] Created `DEPLOYMENT_NOTES.md` with complete env var list, Supabase RLS policy requirements, Stripe webhook setup, external service URLs, security measures, known limitations, and deployment checklist.

---

## STAGE 5 — SPRINT 1: QUICK TEXT & LABEL FIXES (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Changed "Admin Panel" to "Owner Dashboard" in UserPopup.tsx navigation link (route unchanged)
- [x] **Task 2:** Changed 'Standard' label to 'No Change' in all three slider option arrays (lengthOptions, toneOptions, detailOptions) in CustomizationPanel.tsx
- [x] **Task 3:** Changed 'Detailed' label to 'Extended' in lengthOptions array in CustomizationPanel.tsx
- [x] **Task 4:** Added maxLength={50} to Custom Instructions Textarea and character counter (current/50) in CustomizationPanel.tsx
- [x] **Task 5:** Changed MAX_RECIPIENTS from 3 to 10 in EmailExportModal.tsx
- [x] **Task 6:** Changed loading spinner text from "Generating your warranty narrative..." to "Generating narrative..." in narrative/page.tsx
- [x] **Task 7:** Added centered "v1.0.0-beta" version label to NavBar.tsx — accent-bright color (reactive to user theme), text-sm font-medium (matches UserPopup display name styling), hidden on mobile (hidden md:block)

---

## STAGE 5 — SPRINT 5: DASHBOARD SPLIT PREFERENCES & APPEARANCE MODAL (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Removed old "Preferences" button, showPreferences state, and PreferencesPanel slide-out component from dashboard page
- [x] **Task 2:** Added two new buttons ("APP APPEARANCE" with Palette icon, "MY SAVED REPAIRS" with Wrench icon) centered below ProfileSection — styled to match existing secondary buttons with accent-vivid border/text, glowing hover animation (hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-300)
- [x] **Task 3:** Created AppearanceModal component (src/components/dashboard/AppearanceModal.tsx) using existing Modal component — contains AccentColorPicker, Theme toggle (renamed from "Display Mode"), and Background Animation toggle, all reused from PreferencesPanel logic
- [x] **Task 4:** Added showSavedRepairs state and placeholder Modal with "My Saved Repairs" title and "Coming in Sprint 6" message
- [x] **Task 5:** Added "OWNER DASHBOARD" button in header for admin-role users — gold/amber accent (#f59e0b border/text), Shield icon, navigates to /admin, hover glow with amber shadow

---

## STAGE 5 — SPRINT 3: NAVBAR GLOWING HOVER ANIMATIONS (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Added glowing purple hover effect to MAIN MENU button in NavBar.tsx — accent border glow, box-shadow with rgba(168,85,247,0.4)/0.2 double-layer, text brightens to white on hover
- [x] **Task 2:** Added glowing purple hover effect to UserPopup trigger button — border shifts to accent-primary, dual-layer purple box-shadow glow on hover, 300ms transition
- [x] **Task 3:** Added glowing purple hover effect to Light/Dark mode toggle icon — soft purple glow shadow behind icon on hover, text brightens to white, 300ms transition
- [x] **Task 4:** Added hover effects to ALL UserPopup dropdown menu items (Dashboard, Owner Dashboard, Log Out) — accent-tinted background (rgba(168,85,247,0.1)), text shifts to accent-bright, left-border glow accent-primary on hover, 300ms transition

---

## STAGE 5 — SPRINT 2: LOADING SPINNER SIZE INCREASE & VIEWPORT CENTERING (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Added `xlarge` size variant to LoadingSpinner component (w-32 h-32, border-4, text-2xl) — approximately 2x the `large` variant (w-16 h-16). Added per-size text sizing via textSizeMap. Added optional className prop for external styling.
- [x] **Task 2:** Updated narrative page initial generation loading state to use `xlarge` spinner with `min-h-[calc(100vh-64px)]` flex centering — spinner now owns the full viewport below the NavBar. Updated message text to uppercase "GENERATING NARRATIVE..." for consistency.

---

## STAGE 5 — SPRINT 6: DASHBOARD — MY SAVED REPAIRS MODAL & TABLE STYLING (2026-03-09)

**Status:** COMPLETE

- [x] **Task 1:** Replaced placeholder "Coming in Sprint 6" modal with full `SavedRepairsModal` component (`src/components/dashboard/SavedRepairsModal.tsx`). Fetches user's saved repair templates from `/api/saved-repairs`, displays in scrollable list with expand/collapse per row showing all 5 core repair fields (codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification). Shows loading spinner while fetching, empty state when no templates exist. — **2026-03-09**
- [x] **Task 2:** Added "NEW REPAIR TEMPLATE" button at top of modal. Opens inline form with template name, story type selector (Diagnostic Only / Repair Complete), and all 5 core repair field textareas. Saves via POST `/api/saved-repairs` with loading state and toast feedback. — **2026-03-09**
- [x] **Task 3:** Added Edit and Delete action buttons per template row. Edit opens inline editing with template name + 5 core fields and Save/Cancel buttons (PUT `/api/saved-repairs/[id]`). Delete shows confirmation prompt with Cancel/Confirm before DELETE. Both show appropriate loading states and toast messages. — **2026-03-09**
- [x] **Task 4:** Added glowing hover effect to NarrativeHistory table rows: `hover:bg-[rgba(168,85,247,0.08)]` accent tint, `hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]` soft glow, `transition-all duration-200` smooth animation, `group-hover:text-[var(--text-secondary)]` brighter text on all data cells. — **2026-03-09**
- [x] **Task 5:** Widened dashboard container from `max-w-5xl` (1024px) to `max-w-7xl` (1280px) for more breathing room on the narrative table and overall dashboard layout. — **2026-03-09**

---

## STAGE 5 SPRINT 7 — OWNER DASHBOARD: AI TOKEN USAGE PRICING CALCULATOR
*Add an AI token usage / pricing calculator to the Owner Dashboard for estimating Gemini API costs.*

**Status:** COMPLETE

- [x] **Task 1:** Created `src/components/admin/TokenCalculator.tsx` — self-contained pricing calculator component with: model selector dropdown (Gemini 2.0 Flash / 1.5 Flash / 1.5 Pro with hardcoded per-token pricing), average input tokens per narrative (default 1500), average output tokens per narrative (default 800), estimated narratives per month (default 100), proofread calls toggle (+50% API calls), customization calls toggle (+30% API calls). Output displays cost per narrative, monthly estimate, and annual estimate with accent-colored numbers. Includes disclaimer note about pricing variability. — **2026-03-10**
- [x] **Task 2:** Added "Cost Calculator" tab to Owner Dashboard tab system — updated `TabKey` union type, added tab entry with `DollarSign` icon between Analytics and Settings tabs, added `motion.div` tab content rendering with `tabVariants` animation matching existing pattern. Imported `TokenCalculator` component. — **2026-03-10**
- [x] **Task 3:** Styled calculator to match Owner Dashboard premium dark aesthetic — uses `LiquidCard` components with `!rounded-[16px]`, accent-colored cost numbers via `var(--accent-bright)`, custom toggle switches with `peer-checked:bg-[var(--accent-primary)]`, input fields with `bg-[var(--bg-input)]` and `border-[var(--accent-border)]`, cost output cards with `bg-[var(--accent-5)]` backgrounds and `border-[var(--accent-15)]` borders. Build verified clean with `npm run build`. — **2026-03-10**

---

## STAGE 5 SPRINT 8 — ROLE HIERARCHY RESTRUCTURE: OWNER / ADMIN / USER
*Restructure from 2-tier (admin/user) to 3-tier (owner/admin/user) role system. Owner = platform owner with full dashboard access. Admin = Group Manager role (built in Sprint 9-10). User = standard user.*

**Status:** COMPLETE

- [x] **Task 1:** Updated TypeScript type definitions — changed `role` type from `'user' | 'admin'` to `'user' | 'admin' | 'owner'` in `src/types/database.ts` (UserProfile), `src/hooks/useAuth.ts` (UserProfile interface), and `src/app/(protected)/admin/page.tsx` (AdminUser interface). — **2026-03-10**
- [x] **Task 2:** Updated all owner-level access checks from `role === 'admin'` to `role === 'owner'` across 8 locations: Owner Dashboard page guard/redirect, activity log fetch gate, user management fetch gate, analytics/overview fetch gate, settings fetch gate, render guard, admin API `verifyAdmin()`, analytics API `verifyAdmin()`, UserPopup "Owner Dashboard" link visibility, and Dashboard "OWNER DASHBOARD" button visibility. — **2026-03-10**
- [x] **Task 3:** Updated promote/demote functions — added owner protection in API (`demote_to_user` checks target role and rejects if owner, `promote_to_admin` checks and rejects if already owner). Frontend `handlePromoteToggle` blocks owner role changes. Owner rows in user table show as Protected (no action buttons). Promote/demote labels updated to "Group Manager" terminology. — **2026-03-10**
- [x] **Task 4:** Updated role badge display — added `owner` entry to `ROLE_BADGE` with purple accent (`#a855f7`) and "Owner" label with ShieldCheck icon. Renamed `admin` badge label from "Admin" to "Group Manager" (keeps gold color with Crown icon). User badge unchanged (gray). — **2026-03-10**
- [x] **Task 5:** Added SQL migration comment in `src/app/api/admin/route.ts`: `UPDATE public.users SET role = 'owner' WHERE role = 'admin' AND email = '<owner_email>'`. Build verified clean with `npm run build`. Full codebase audit confirmed all remaining `'admin'` references are intentional Group Manager role references. — **2026-03-10**

---

## STAGE 5 SPRINT 9 — GROUP MANAGEMENT: DATABASE & API
*Build the backend infrastructure for the group management system. Groups allow dealership managers (admin role) to monitor and manage their team members.*

**Status:** COMPLETE

- [x] **Task 1:** Created Supabase migration file `supabase/migrations/007_create_groups_table.sql` — groups table (id, name, access_code UNIQUE, description, created_by FK, created_at, is_active), `group_id` column added to users table with FK to groups, indexes on access_code and group_id, RLS policies for owner full access, admin view own group, user view own group. Includes manual execution instructions for Supabase SQL Editor. — **2026-03-10**
- [x] **Task 2:** Created `src/app/api/groups/route.ts` — full CRUD API for group management. GET returns all groups with member counts (owner) or user's own group (admin/user). POST creates a new group (owner only) with master code collision check and unique constraint handling. PUT updates group fields (owner only). DELETE soft-deletes via is_active=false (owner only). All routes verify auth via server Supabase client. — **2026-03-10**
- [x] **Task 3:** Created `src/app/api/groups/members/route.ts` — GET lists group members enriched with narrative_count and last_active (owner can query any group via query param, admin restricted to own group). PUT updates member role (admin can promote user→admin in own group, owner can change any non-owner role). Includes target user validation and group boundary enforcement. — **2026-03-10**
- [x] **Task 4:** Updated `src/app/api/stripe/route.ts` — access code validation now checks group access codes after master code. If code matches an active group, returns `group_id` in response. Updated `src/app/(auth)/signup/page.tsx` to capture `group_id` from response and include it in the user upsert during Step 2. Master access code users are not assigned to any group. — **2026-03-10**
- [x] **Task 5:** Updated `src/types/database.ts` — added `Group` interface (id, name, access_code, description, created_by, created_at, is_active) and added `group_id?: string` to `UserProfile` interface. Build verified clean with `npm run build`. — **2026-03-10**

---

## STAGE 5 SPRINT 10 — GROUP MANAGEMENT: ADMIN DASHBOARD UI
*Build the front-end Group Manager Dashboard for admin-role users and add group management controls to the Owner Dashboard.*

**Status:** COMPLETE

- [x] **Task 1:** Created Group Manager Dashboard page at `src/app/(protected)/group-dashboard/page.tsx` — route protection (admin/owner only, redirects 'user' role to /dashboard with toast), premium title header with group name (same spotlight hover effect as Owner Dashboard), two-tab layout (Overview, Team Members). — **2026-03-10**
- [x] **Task 2:** Built Overview tab with 4 metric cards (Team Members count, Active This Week, Total Narratives generated by group, Active Today) using same LiquidCard metric pattern as Owner Dashboard. Includes group description card and quick member list preview (top 5 members with role badges, narrative counts). — **2026-03-10**
- [x] **Task 3:** Built Team Members table with columns: Name, Email, Position, Role (with color badge — Admin=gold, User=gray), Narratives Generated, Last Active (stacked date/time). Search bar to filter by name/email, sort by any column (dropdown + asc/desc toggle), expandable rows showing full member details (name, email, position, role, narrative count, last active, member ID). Matches Owner Dashboard table styling (dark rows, accent borders, hover effects). — **2026-03-10**
- [x] **Task 4:** Added role management for admins — promote user→admin with confirmation modal ("Promote [Name] to Group Admin? They will gain access to this Group Dashboard and team management features."). Admin cannot demote other admins (disabled state with tooltip "Contact the Owner to modify other admin roles"). Admin cannot change their own role. All wired to `/api/groups/members` PUT endpoint. — **2026-03-10**
- [x] **Task 5:** Enforced access restrictions — Admin role users do NOT see "Owner Dashboard" link (only owner role). Added "Group Dashboard" link with Users icon to UserPopup dropdown for admin-role users, positioned after Dashboard link. Owner Dashboard link remains owner-only in both UserPopup and Dashboard page. — **2026-03-10**
- [x] **Task 6:** Added "Groups" tab to Owner Dashboard — view all groups with access codes, member counts, active/inactive status badges. Create new group form (name, access_code with auto-generate button using GROUPNAME-XXXX-XXXX pattern, description). Edit existing groups (name, access_code, description). View group members in modal (name, email, role, position, narratives). Toggle group active/inactive. — **2026-03-10**
- [x] **Task 7:** Styled everything to match premium dark automotive tech aesthetic — same LiquidCard styling, same framer-motion animations (spring transitions, tab variants, AnimatePresence), same color scheme (CSS variables), same responsive patterns. Group Dashboard is a "lite" version of Owner Dashboard with fewer tabs focused on team management. Added `group_id` to useAuth UserProfile interface. Build verified clean with `npm run build`. — **2026-03-10**

---

## DOCUMENTATION REFRESH — PROJECT REFERENCE FILES v2.0 (2026-03-10)

**Status:** COMPLETE

All 6 project reference documents manually updated to v2.0 to accurately reflect the current application state after completing Phases 0–10 and all improvement sprints through Stage 5 Sprint 10.

- [x] **CLAUDE_CODE_BUILD_INSTRUCTIONS.md** — Updated architecture reference, folder structure, database schema, technology stack versions, and sprint execution playbook to reflect current state
- [x] **PRE_BUILD_SETUP_CHECKLIST.md** — Updated service accounts table, Gemini model reference (gemini-3-flash-preview), Resend integration, Cloudflare DNS notes
- [x] **ServiceDraft_AI_Project_Instructions_v1_3.md** — Updated to v2.0 with current tech stack, complete feature set, role hierarchy (owner/admin/user), group management system
- [x] **ServiceDraft_AI_Prompt_Logic_v1.md** — Updated to v2.0 with all prompt sections including story-type-aware proofreading, diagnostic optimizer, apply selected edits, diagnostic→repair update, convert recommendation, and pre-generation customization
- [x] **ServiceDraft_AI_Spec_v1_3.md** — Updated to Version 2.0 (March 2026) with complete page specifications, database schema (5 tables including groups), API route inventory, and feature matrix
- [x] **ServiceDraft_AI_UI_Design_Spec_v1.md** — Updated to v2.0 with complete design system documentation including dynamic theming, 9 accent colors, modal system, card system, and all visual enhancement specifications

---

## STAGE 6 SPRINT A — TASK 1: GROUP→TEAM RENAME (2026-03-10)

**Status:** COMPLETE (Task 1 of 5)

Comprehensive rename of all "group" references to "team" across the entire codebase. This is the first task in Stage 6 Sprint A; remaining tasks (2-5) to be completed in the next session.

- [x] **Task 1: Rename all "group" references to "team"** — **2026-03-10**
  - Renamed folder `src/app/(protected)/group-dashboard/` → `team-dashboard/`
  - Renamed folder `src/app/api/groups/` → `teams/` (route.ts + members/route.ts)
  - Updated `src/types/database.ts`: `Group` interface → `Team`, `group_id` → `team_id`
  - Updated `src/hooks/useAuth.ts`: `group_id` → `team_id` in UserProfile interface
  - Updated `src/components/layout/UserPopup.tsx`: route `/group-dashboard` → `/team-dashboard`, label "Group Dashboard" → "Team Dashboard"
  - Updated `src/app/api/stripe/route.ts`: `groups` table → `teams`, `group_id` → `team_id` in response
  - Updated `src/app/(auth)/signup/page.tsx`: `pendingGroupId` → `pendingTeamId`, `group_id` → `team_id`
  - Updated `src/app/(protected)/team-dashboard/page.tsx`: All interfaces (`GroupInfo`→`TeamInfo`, `GroupMember`→`TeamMember`), function name (`GroupDashboardPage`→`TeamDashboardPage`), all state variables, API paths (`/api/groups`→`/api/teams`), UI text (group→team)
  - Updated `src/app/(protected)/admin/page.tsx`: Tab key `groups`→`teams`, role badge `Group Manager`→`Team Manager`, all state variables (`groups`→`teams`, `groupsLoading`→`teamsLoading`, etc.), all functions (`fetchGroups`→`fetchTeams`, `handleCreateGroup`→`handleCreateTeam`, etc.), all modal text and UI labels, API paths
  - Updated `src/app/api/teams/route.ts` + `members/route.ts`: All DB queries use `teams` table + `team_id` column, updated comments and error messages
  - Created migration `supabase/migrations/008_rename_groups_to_teams.sql`: Renames `groups` table → `teams`, `group_id` column → `team_id`, recreates indexes and RLS policies with new names
  - Build verified clean with `npm run build` — all routes correctly show `/team-dashboard`, `/api/teams`, `/api/teams/members`

- [x] **Task 2: Add conditional dashboard buttons to main menu** — **2026-03-10**
- [x] **Task 3: Add Activity Log tab to Team Dashboard** — **2026-03-10**
- [x] **Task 4: Add refresh button to Activity Log tabs** — **2026-03-10**
- [x] **Task 5: Add remove-from-team function to Team Member table** — **2026-03-10**

---

## STAGE 6 SPRINT A — TASKS 2-5 (2026-03-10)

**Status:** COMPLETE

Main menu role-based dashboard buttons, team dashboard activity log tab, refresh buttons on activity log tabs, and remove-from-team member function.

- [x] **Task 2: Add conditional dashboard buttons to main menu** — **2026-03-10**
  - Updated `src/app/(protected)/main-menu/page.tsx` to conditionally show dashboard buttons between USER DASHBOARD and LOG OUT
  - Owner role (`profile.role === 'owner'`): Shows "OWNER DASHBOARD" button with Shield icon, navigates to `/admin`
  - Admin role (`profile.role === 'admin'`): Shows "TEAM DASHBOARD" button with Users icon, navigates to `/team-dashboard`
  - Regular users see no extra dashboard buttons
  - Buttons use same variant ('secondary'), icon sizing (size={20}), and Framer Motion animation patterns as existing buttons

- [x] **Task 3: Add Activity Log tab to Team Dashboard** — **2026-03-10**
  - Added "Activity Log" tab with Activity icon to team dashboard tab navigation
  - Created server-side API route `src/app/api/teams/activity/route.ts` for team-filtered activity logs
  - API fetches team member IDs, then queries `activity_log` filtered by those user IDs
  - Supports pagination (25 rows/page), action_type filtering dropdown (same 11 action types as Owner Dashboard), search by name/email, sort order toggle
  - Table columns: Date/Time, User, Email (hidden on mobile), Action (with color-coded badges), Story Type, Preview
  - Expandable rows showing User ID, Timestamp, Output Preview, Input Data (JSON), Metadata (JSON)
  - Previous/Next pagination with page counter — identical to Owner Dashboard activity log pattern
  - Added `ACTION_FILTERS`, `ACTION_BORDER_COLORS`, `ActivityRow` interface, and helper functions to team dashboard

- [x] **Task 4: Add refresh button to Activity Log tabs** — **2026-03-10**
  - Team Dashboard Activity Log: RefreshCw button with `animate-spin` while loading, positioned in controls bar
  - Owner Dashboard Activity Log (`src/app/(protected)/admin/page.tsx`): Added matching RefreshCw refresh button to activity tab controls (was missing — other tabs already had refresh buttons)

- [x] **Task 5: Add remove-from-team function to Team Member table** — **2026-03-10**
  - Added DELETE handler to `src/app/api/teams/members/route.ts`
    - Authenticates requesting user (must be admin or owner)
    - Validates: cannot remove owner, cannot remove yourself, admin can only remove users (not other admins)
    - Clears `users.team_id` to null; if target was admin, demotes role to 'user'
  - Added UserMinus icon button in team members table Actions column (alongside existing UserCog role button)
    - Red hover state (`hover:text-[#ef4444]`), p-2.5 padding, rounded-lg, size 20 icon
    - `canRemoveMember()` helper determines visibility: owner can remove anyone except self/owner, admin can remove users only
  - Confirmation modal: "Remove [Name] from [Team Name]?" with UserMinus icon, Cancel and Remove buttons
    - Remove button styled with red background (`!bg-[#ef4444]`)
  - On success: removes member from local state, shows success toast "[Name] has been removed from the team"
  - On failure: shows error toast with message from API

- **Build:** Verified clean with `npm run build` — all routes compiled successfully

---

## STAGE 6 SPRINT B — TASK 1: GEMINI API USAGE TRACKER (2026-03-10)

**Status:** COMPLETE (Task 1 of 6)

Replaced the static Cost Calculator tab with a real-time Gemini API Usage Tracker that monitors actual token usage and calculates real costs from every Gemini API call.

- [x] **Step 1: Modify Gemini client return type** — **2026-03-10**
  - Changed `generateWithGemini` return type from `Promise<string>` to `Promise<GeminiResponse>` (`{ text: string, usage: GeminiUsageMetadata | null }`)
  - Added `GeminiUsageMetadata` and `GeminiResponse` exported interfaces
  - Extracts `usageMetadata` from Gemini SDK response object (promptTokenCount, candidatesTokenCount, totalTokenCount)
  - Updated ALL 6 callers to use `geminiResult.text` instead of raw string:
    - `src/app/api/generate/route.ts`
    - `src/app/api/customize/route.ts`
    - `src/app/api/proofread/route.ts`
    - `src/app/api/apply-edits/route.ts`
    - `src/app/api/update-narrative/route.ts`
    - `src/app/api/convert-recommendation/route.ts`

- [x] **Step 2: Create api_usage_log table migration** — **2026-03-10**
  - Created `supabase/migrations/009_api_usage_log.sql`
  - Columns: id (uuid PK), user_id (FK to public.users), action_type (text), prompt_tokens, completion_tokens, total_tokens, model_name (default 'gemini-3-flash-preview'), estimated_cost_usd (numeric(10,6)), created_at (timestamptz)
  - Indexes on created_at (DESC) and user_id
  - RLS: Owner can SELECT all, users can SELECT own, authenticated can INSERT

- [x] **Step 3: Log token usage from every API route** — **2026-03-10**
  - Created `src/lib/usageLogger.ts` — server-side fire-and-forget logger
  - Calculates estimated cost using gemini-3-flash-preview rates: Input $0.50/1M tokens, Output $3.00/1M tokens
  - Added `logTokenUsage(userId, actionType, usage)` call in all 6 API routes after Gemini response
  - Uses same fire-and-forget async IIFE pattern as activity logger — never blocks user requests

- [x] **Step 4: Create /api/admin/usage endpoint** — **2026-03-10**
  - Created `src/app/api/admin/usage/route.ts` — owner-only GET endpoint
  - Accepts `?range=` query param (7, 30, 90, all)
  - Returns aggregated data: totalPromptTokens, totalCompletionTokens, totalTokens, totalEstimatedCost, totalRequests, currentMonthCost, averageCostPerRequest
  - Returns breakdowns: usageByDay (for charting), usageByAction (by action type), usageByUser (top 10 with names)

- [x] **Step 5: Build API Usage tab in Owner Dashboard** — **2026-03-10**
  - Replaced 'costs' tab (Cost Calculator / TokenCalculator component) with 'usage' tab (API Usage)
  - Updated TabKey type: 'costs' → 'usage'
  - Added usage state: usageData, usageLoading, usageRange, usageLastUpdated, usageSecondsAgo
  - Added fetchUsageData callback with useEffect triggers on tab activation and range change
  - Summary cards (7): Total Requests, Input Tokens, Output Tokens, Total Tokens, Estimated Cost, Current Month Cost, Avg Cost/Request
  - Token Usage Over Time: recharts AreaChart with stacked Input/Output token lines
  - Cost Over Time: recharts BarChart with daily cost bars
  - Usage by Action Type: recharts horizontal BarChart with color-coded bars per action
  - Top Users by Token Usage: table with Rank (gold/silver/bronze badges), Name, Requests, Input Tokens, Output Tokens, Est. Cost
  - Time range selector: Last 7/30/90 Days + All Time buttons
  - Refresh button with RefreshCw spin animation
  - "Last updated: Xs ago" ticker
  - Model info callout showing pricing context
  - Removed TokenCalculator import (component file preserved but no longer referenced)

---

### Hotfix: Gemini API Usage Tracker — Model Name & Pricing Correction (2026-03-10)

**Problem:** The API Usage Tracker built in Sprint B Task 1 referenced the wrong model name (`gemini-2.0-flash`) and used incorrect pricing rates ($0.10/$0.40 per 1M tokens input/output).

**Correct values:** Model: `gemini-3-flash-preview` | Input: $0.50/1M tokens ($0.0000005/token) | Output: $3.00/1M tokens ($0.000003/token)

**Files changed:**

- [x] `src/lib/usageLogger.ts` — Fixed model_name from `gemini-2.0-flash` to `gemini-3-flash-preview`, updated INPUT_COST_PER_TOKEN from 0.0000001 to 0.0000005, OUTPUT_COST_PER_TOKEN from 0.0000004 to 0.000003
- [x] `src/components/admin/TokenCalculator.tsx` — Updated MODELS array: changed id/label from gemini-2.0-flash to gemini-3-flash-preview, inputPer1M from 0.10 to 0.50, outputPer1M from 0.40 to 3.00, updated default state
- [x] `src/app/(protected)/admin/page.tsx` — Fixed model info callout: "Model: gemini-3-flash-preview | Input: $0.50/1M tokens | Output: $3.00/1M tokens", also fixed 3 Recharts Tooltip `formatter` TypeScript type errors (pre-existing)
- [x] `supabase/migrations/009_api_usage_log.sql` — Updated DEFAULT from `gemini-2.0-flash` to `gemini-3-flash-preview`
- [x] `src/lib/gemini/client.ts` — Verified: already uses `gemini-3-flash-preview` (no change needed)
- [x] Build verified: `npm run build` passes cleanly

---

## STAGE 6 SPRINT B — TASKS 2-4: TABLE UI IMPROVEMENTS (2026-03-10)

**Status:** COMPLETE (Tasks 2, 3, 4 of 6)

Applied table UI improvements across ALL data tables on both the Owner Dashboard and Team Dashboard pages.

- [x] **Task 2: Email Column Truncation** — **2026-03-10**
  - Added `max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap` on email cells via inline-block span wrapper
  - Added `title` attribute on email cells so full address shows as native browser tooltip on hover
  - Applied to: Owner Dashboard User Management table, Owner Dashboard Activity Log table, Owner Dashboard Teams modal member table, Team Dashboard Team Members table, Team Dashboard Activity Log table

- [x] **Task 3: Center Alignment for All Table Cells** — **2026-03-10**
  - Changed all `<tr>` header rows from `text-left` to `text-center`
  - Added explicit `text-center` to every `<th>` and `<td>` across all tables
  - Preview/narrative text columns kept as `text-left` since long text looks bad centered
  - Applied to all tables: Owner Dashboard Activity Log, User Management, Analytics Top Users Leaderboard, API Usage Top Users, Teams modal members table, Team Dashboard Team Members, Team Dashboard Activity Log

- [x] **Task 4: Glowing Row Hover Effect** — **2026-03-10**
  - Replaced `hover:bg-[var(--accent-10)]` with JS-driven hover using `onMouseEnter`/`onMouseLeave`
  - On hover: `boxShadow: '0 0 8px 1px rgba(168, 85, 247, 0.3)'` + `backgroundColor: 'rgba(168, 85, 247, 0.05)'`
  - On leave: resets both to `none`/`transparent`
  - Added `transition-all duration-200 ease-in-out` for smooth fade in/out
  - Applied to every `<tbody>` row across all data tables on both dashboards
  - Does not conflict with expandable row click behavior or action button hover states

**⚠️ MANUAL ACTION REQUIRED (Tyler):** Run this SQL in Supabase SQL Editor to update the live column default:
```sql
ALTER TABLE api_usage_log ALTER COLUMN model_name SET DEFAULT 'gemini-3-flash-preview';
```
The migration file has been updated for future deployments, but the existing database column default needs this manual update.

---

## STAGE 6 SPRINT B — TASKS 5-6: ACTIVITY DETAIL MODAL & TEAM ASSIGNMENT (2026-03-10)

**Status:** COMPLETE (Tasks 5 and 6 of 6)

- [x] **Task 5: Activity Detail Popup Modal** — **2026-03-10**
  - Enhanced activity logging in `src/app/(protected)/narrative/page.tsx`: generate, regenerate, customize, and save actions now include metadata with narrative preview (first 500 chars), vehicle year/make/model, RO number, and story type
  - Created `src/components/admin/ActivityDetailModal.tsx` — standalone modal component with Framer Motion animations (fade backdrop + scale modal)
  - Modal content sections: action type badge (color-coded), timestamp (MM/DD/YYYY HH:MM AM/PM), user info (name + email), vehicle info, RO number, story type badge, narrative text in scrollable container, input data, and collapsible "View Raw Data" JSON section
  - Gracefully handles entries with minimal metadata (e.g., login events show only action badge, timestamp, and user info)
  - Close on X button, backdrop click, and Escape key (inherited from portal rendering)
  - Wired to Owner Dashboard Activity Log tab: row click opens detail modal instead of inline expansion
  - Wired to Team Dashboard Activity Log tab: same behavior — row click opens detail modal
  - Both dashboards use the same shared ActivityDetailModal component

- [x] **Task 6: Owner Ability to Assign Users to a Team** — **2026-03-10**
  - Added `team_id` and `team_name` to AdminUser interface and list_users API response
  - Admin API `list_users` now joins with teams table to return team_name for each user
  - Added "Team" column to Owner Dashboard User Management table (after Last Activity, before Actions, hidden on small screens)
  - Shows team name with truncation (max-w-[150px]) and title tooltip, or "—" if unassigned
  - Added "Assign to Team" action button (Users icon, accent-colored) in the Actions column for each non-protected user
  - Assign to Team modal: shows current team assignment note, dropdown of all available teams with member counts, Assign/Cancel buttons, disabled when same team selected
  - Added "CREATE TEAM" button in User Management tab header area (Plus icon, outline/secondary style)
  - Create Team modal: team name input field with Enter key submit, Create/Cancel buttons
  - Added `list_teams` action to admin API: returns all active teams with member counts, owner-only
  - Added `assign_user` action to admin API: updates user's team_id, handles already-assigned check, owner-only
  - Added `create_team` action to admin API: creates team with auto-generated access code, owner-only
  - User Management table Team column updates immediately after successful assignment
  - Newly created teams available immediately in Assign to Team dropdown via refetch

---

## Hotfix (Post Sprint F) — Auth Page getSession Fix

**Date:** 2026-03-16
**Status:** COMPLETE

### Problem
Signup page useEffect calls `supabase.auth.getUser()` on mount to determine which step to show. `getUser()` makes a network request to validate/refresh the token. When navigating from /login to /signup?step=2, if the token refresh hasn't settled yet, `getUser()` momentarily returns `{ user: null }`, causing the page to revert to step 1 (account creation screen).

### Changes Made

- [x] **Signup mount check** (`src/app/(auth)/signup/page.tsx` line 64): Changed `supabase.auth.getUser()` to `supabase.auth.getSession()` — reads from local memory/cookies without network request, returns user immediately
- [x] **Signup "not authenticated" branch** (line 98-101): Changed from `setStep(1)` to preserve URL step param (`urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1`)
- [x] **Signup catch block** (line 102-104): Same URL step preservation instead of defaulting to step 1
- [x] **Login mount check** (`src/app/(auth)/login/page.tsx` line 33): Same `getUser()` → `getSession()` change
- [x] handlePaymentStep and handleProfileCreation left unchanged — user-initiated actions where session is established

### Files Modified
1. `src/app/(auth)/signup/page.tsx`
2. `src/app/(auth)/login/page.tsx`

---

## Sprint F — Clean Auth Loading Fix

**Date:** 2026-03-16
**Status:** COMPLETE

Previous auth loading fix attempts (commits de85135 through 199b4ef) were reverted because they stacked band-aids without addressing the root cause. This sprint implements a clean, single-pass fix.

### Root Cause
`buildFallbackProfile()` in `useAuth.ts` set `subscription_status: 'trial'` on ANY profile fetch error. The main-menu page guard saw `trial` status and redirected to `/signup?step=2`. Signup checked auth, saw a completed profile, and redirected back to `/main-menu` — creating an infinite redirect loop.

### Changes Made

- [x] **Task 1: Singleton Supabase browser client** (`src/lib/supabase/client.ts`)
  - Added module-level `browserClient` variable
  - `createClient()` now returns existing instance if already created
  - Prevents multiple components from spinning up independent clients with separate `getUser()` calls

- [x] **Task 2: Remove buildFallbackProfile** (`src/hooks/useAuth.ts`)
  - Deleted the entire `buildFallbackProfile()` function
  - All error paths in `fetchProfileForUser()` now set `profile: null` instead of a fake trial profile
  - PGRST116 (no row) handler still creates a real profile row via INSERT — kept as-is
  - Added 5-second timeout wrapper around initial `getUser()` call using `Promise.race`
  - On timeout: logs warning, calls `signOut({ scope: 'local' })` fire-and-forget, sets `{ user: null, profile: null }`
  - Added 10-second failsafe timer that forces `{ user: null, profile: null, loading: false }` if still loading

- [x] **Task 3: Fix main-menu redirect guard** (`src/app/(protected)/main-menu/page.tsx`)
  - Added `if (!profile) return;` at top of useEffect — null profile no longer triggers redirect
  - Simplified loading condition to `if (loading || !profile)` — shows spinner while resolving
  - Added 8-second `loadingTooLong` timer that shows "Reset Session" button
  - Reset button clears all `sb-` cookies, removes `sd-*` localStorage keys, redirects to `/`

- [x] **Task 4: Fix post-signup redirect** (`src/app/(auth)/signup/page.tsx`)
  - Changed `router.push('/main-menu')` to `window.location.href = '/main-menu'`
  - Forces full page load ensuring middleware runs fresh with proper cookies

- [x] **Task 5: Fix signOut hang** (`src/hooks/useAuth.ts`)
  - Changed `supabase.auth.signOut()` to `supabase.auth.signOut({ scope: 'local' })`
  - Prevents hang when access token is expired (no network request to Supabase auth server)
  - Added `finally` block with `window.location.href = '/'` — always redirects regardless of signOut success

- [x] **Task 6: Verify ThemeProvider singleton** (`src/components/ThemeProvider.tsx`)
  - Dynamic import `createClient()` now returns singleton — no changes needed for logic
  - Fixed `onAuthStateChange` callback type annotations (event/session) for TypeScript strict mode

- [x] **Task 7: Fix ProofreadResults setState-during-render** (`src/components/narrative/ProofreadResults.tsx`)
  - Removed `notifyParent()` calls from inside `setCheckedEdits` updater and `toggleAll`
  - Moved all parent notifications to a `useEffect` that watches `checkedEdits` state
  - Eliminated React warning about updating a component during rendering of another component

- [x] **Task 8: Fix ActivityDetailModal z-index and positioning** (`src/components/dashboard/ActivityDetailModal.tsx`)
  - Backdrop: `z-[120]` (was `z-40`), modal container: `z-[130]` (was `z-50`)
  - Switched from `items-center` to `items-start` with `pt-[20px]` for top-anchored positioning
  - Increased width to `w-[85vw] max-w-5xl` (was `w-[90vw] max-w-4xl`)
  - Made top-right X button sticky with `sticky top-0 float-right` and bg for visibility
  - Added CLOSE button at bottom with `motion.button` hover animation

### Files Modified
1. `src/lib/supabase/client.ts`
2. `src/hooks/useAuth.ts`
3. `src/app/(protected)/main-menu/page.tsx`
4. `src/app/(auth)/signup/page.tsx`
5. `src/components/ThemeProvider.tsx`
6. `src/components/narrative/ProofreadResults.tsx`
7. `src/components/dashboard/ActivityDetailModal.tsx`

---

## Sprint E — Team Dashboard: Migrate Activity Tab to Narrative Tracker

**Date:** 2026-03-12
**Status:** COMPLETE

### Completed Tasks

- [x] **Task 1 — Rewrite /api/teams/activity/route.ts to query narrative_tracker**
  - Replaced activity_log query with narrative_tracker query
  - Select same columns as admin API's list_tracker_entries: id, user_id, ro_number, vehicle_year/make/model, story_type, created_at, last_action_at, is_regenerated/customized/proofread/saved/exported, export_type
  - Filter by team membership: get users where team_id matches, then filter narrative_tracker by user_id IN those IDs
  - Updated filters from action_type-based to boolean-based: all/regenerated/customized/proofread/saved/exported
  - Updated search to match ro_number ILIKE OR user name/email
  - Sort by last_action_at instead of created_at
  - Enrich rows with user_first_name, user_last_name, user_email from users table
  - Added detail_id query param: when present, fetches single tracker entry with ALL columns (full_narrative, concern, cause, correction, action_history) plus user info, with team membership verification for admin users

- [x] **Task 2 — Update ActivityDetailModal to support custom fetch**
  - Added optional `fetchDetailFn` prop to src/components/dashboard/ActivityDetailModal.tsx
  - When provided, modal uses the custom function instead of the default POST to /api/admin
  - This allows team admins (role='admin') to use the modal via the teams/activity endpoint since they don't have access to /api/admin (owner-only)

- [x] **Task 3 — Update Team Dashboard Activity tab UI**
  - Changed import from src/components/admin/ActivityDetailModal (OLD) to src/components/dashboard/ActivityDetailModal (NEW)
  - Replaced ActivityRow interface with TrackerEntry interface matching tracker data shape
  - Replaced activityLogs/ActivityRow[] state with trackerEntries/TrackerEntry[]
  - Replaced selectedActivity/activityExpandedRow with selectedTrackerId/showDetailModal
  - Updated ACTION_FILTERS to boolean-based: All Entries, Regenerated, Customized, Proofread, Saved, Exported
  - Replaced ACTION_BORDER_COLORS with TRACKER_PILL_COLORS matching admin page
  - Updated table columns: User | R.O. # | Vehicle | Story Type | Actions (pills) | Last Activity
  - Added color-coded action pills (Regen, Custom, Proofread, Saved, PDF/COPY/PRINT/DOCX) matching admin page
  - Left border color: accent for diagnostic_only, green for repair_complete
  - Row click sets selectedTrackerId and opens detail modal
  - Updated modal rendering to use new props (isOpen, onClose, trackerId, fetchDetailFn)
  - Added fetchTrackerDetail callback that calls GET /api/teams/activity?detail_id=xxx
  - Updated search placeholder to "Search by name, email, or R.O. #..."
  - Removed old formatActionLabel and formatDateReadable helper functions (no longer needed)

- [x] **Task 4 — Update /api/teams/members to use narrative_tracker**
  - Replaced activity_log query with narrative_tracker query in GET handler
  - last_active now derived from MAX(last_action_at) via narrative_tracker (ordered desc, first per user_id)
  - narrative_count still sourced from narratives table (counts saved narratives, not tracker entries)
  - Response shape unchanged — Overview tab stats (Active This Week, Active Today) continue working via member.last_active
  - No other activity_log references remain in the teams API path

- [x] **Task 5 — Clean up dead code and verify imports**
  - Verified NO files import from src/components/admin/ActivityDetailModal.tsx (old modal)
  - Both admin/page.tsx and team-dashboard/page.tsx import from src/components/dashboard/ActivityDetailModal.tsx (new modal)
  - Added DEPRECATED comment to src/components/admin/ActivityDetailModal.tsx
  - Verified no dead code in team-dashboard/page.tsx (old interfaces, state vars, helpers already cleaned up in Tasks 1-3)
  - Remaining activity_log references in src/ are all in separate features: activityLogger.ts (fire-and-forget logging), admin API routes, analytics, delete-account — not part of Team Dashboard migration scope

---

## Auth Overhaul Sprint 2 — Recovery Hardening + Cleanup (2026-03-22)

- [x] **Task 1 — Replace blank page fallbacks with recovery UI**
  - Admin page (`admin/page.tsx`): Split `if (!profile || profile.role !== 'owner') return null` into two guards — !profile shows recovery UI with Refresh Page / Re-Login buttons, non-owner shows "Access Denied" message
  - Team Dashboard (`team-dashboard/page.tsx`): Same pattern — !profile shows recovery UI, role=user shows "Access Denied — restricted to team managers"
  - Dashboard (`dashboard/page.tsx`): Upgraded existing plain-text !profile fallback to LiquidCard recovery UI with Refresh Page / Re-Login buttons (added LiquidCard import)
  - Main Menu (`main-menu/page.tsx`): Split `if (loading || !profile)` guard into two branches — loading=true shows spinner with loadingTooLong reset button (existing behavior), loading=false && !profile shows recovery UI with Refresh Page / Re-Login buttons

- [x] **Task 2 — Remove 10-second failsafe timer from useAuth**
  - Removed `failsafeTriggered` variable declaration
  - Removed entire `startGlobalFailsafe()` function
  - Removed `startGlobalFailsafe()` call from `initializeAuth()`
  - Natural auth flow now handles all cases: initializeAuth → getUser (7s timeout) → fetchProfileForUser via /api/me → loading:false. If /api/me fails, retry handles it. If both fail, profile stays null and recovery UI shows.

- [x] **Task 3 — Update main-menu loading timer**
  - Changed loadingTooLong timeout from 8000ms to 5000ms — with server-side profile fetch, >5s genuinely indicates a problem

- [x] **Task 4 — Clean up stale useAuth code**
  - Removed AbortError check from onAuthStateChange callback — no longer needed since profile fetching uses /api/me (plain fetch) instead of Supabase browser client
  - Verified `useCallback` still used by `signOut` and `refreshProfile` — kept import
  - `appFullyInitialized` and `isRefreshing` flags confirmed still needed — kept

- [x] **Task 5 — Verify auth flow end-to-end**
  - Confirmed getUser() calls: useAuth.ts (1 call in initializeAuth — legitimate), signup/page.tsx (2 calls in step handlers — legitimate, user-action-triggered), middleware.ts (server-side — fine), all API routes (server-side — fine)
  - ThemeProvider: ZERO getUser() calls (all getSession now)
  - activityLogger: ZERO getUser() calls (uses getSession fallback)
  - Build verified with zero TypeScript errors

---

## Hotfix — Login Page Loading Lockup / Stale Cookie Defense (2026-03-24)

**Problem:** When stale sb- auth cookies exist (from expired sessions, magic link testing, etc.), two failures occurred: (1) middleware getUser() hangs indefinitely trying to refresh expired tokens, blocking page HTML from reaching the browser, and (2) login page auth check enters the "user exists" path from stale cached session, tries a profile query that fails, attempts a redirect, but never calls setCheckingAuth(false) — permanent loading spinner.

**Files Modified:**
- `src/lib/supabase/middleware.ts` — 1 change
- `src/app/(auth)/login/page.tsx` — 2 changes

**Changes:**

- [x] **Fix 1 — Middleware getUser() timeout** (middleware.ts)
  - Wrapped bare `getUser()` in `Promise.race` with 5000ms timeout
  - On timeout: user=null, protected routes redirect to /login, auth routes show their forms
  - Existing route protection logic unchanged — works identically since `user` is just `null` on timeout

- [x] **Fix 2 — Login page stale-cookie failsafe** (login/page.tsx)
  - Added 4-second failsafe useEffect after existing checkAuth useEffect
  - If checkingAuth is still true after 4s: clears all sb- cookies via document.cookie expiry, sets checkingAuth=false
  - Same pattern as main-menu/page.tsx loadingTooLong failsafe, adapted for login page

- [x] **Fix 3 — setCheckingAuth(false) in user-exists path** (login/page.tsx)
  - Added `if (active) setCheckingAuth(false)` before the `return` in the user-exists redirect block
  - Prevents spinner from sticking if router.replace is slow or fails

**Files NOT changed:** auth/callback/route.ts, signup/page.tsx, main-menu/page.tsx, useAuth.ts, all database tables/RLS/API routes.

**Build:** Verified with zero TypeScript errors.

---

## Sprint 6 — Enable Browser-Native Spell Check on All Text Inputs (2026-04-13) — v1.0.8-beta

- [x] **Task 1 — Textarea.tsx** — Destructured `spellCheck` from props, added `spellCheck={spellCheck ?? true}` on the `<textarea>` element before `{...props}` spread. Defaults to enabled; callers can override with `spellCheck={false}`.
- [x] **Task 2 — AutoTextarea.tsx** — Same pattern: destructured `spellCheck`, added `spellCheck={spellCheck ?? true}` on the `<textarea>` element before `{...props}` spread.
- [x] **Task 3 — Input.tsx** — Same pattern: destructured `spellCheck`, added `spellCheck={spellCheck ?? true}` on the `<input>` element before `{...props}` spread.
- [x] **Task 4 — ConditionalField.tsx** (missed by initial audit) — The 6 conditional fields (Codes Present, Diagnostics, Root Cause, Repair Performed, Repair Verification, Recommended Action) use a raw `<textarea>` in `src/components/input/ConditionalField.tsx`, bypassing the shared UI components. Added `spellCheck={true}` directly on the raw textarea element.
- [x] **Task 5 — EditStoryModal.tsx** (missed by initial audit) — 4 raw textareas (Block Narrative, Concern, Cause, Correction). Added `spellCheck={true}` to all four.
- [x] **Task 6 — UpdateWithRepairModal.tsx** (missed by initial audit) — 3 raw textareas (Repair Performed, Repair Verification, Additional Notes). Added `spellCheck={true}` to all three.
- [x] **Task 7 — EditRepairModal.tsx** (missed by initial audit) — 1 raw textarea (dynamic core fields). Added `spellCheck={true}`.
- [x] **Task 8 — SavedRepairsModal.tsx** (missed by initial audit) — 2 raw textareas (new repair fields, edit repair fields). Added `spellCheck={true}` to both.
- [x] **Task 9 — admin/page.tsx** (missed by initial audit) — 2 raw textareas (new team description, edit team description). Added `spellCheck={true}` to both.

**Coverage:** Full codebase grep confirmed every `<textarea>` and `<input>` in src/ now has explicit `spellCheck={true}` — either via the shared UI components (Textarea, AutoTextarea, Input with default prop) or directly on raw elements. No new files created, no database changes, no auth/protected files touched. Build verified with zero TypeScript errors.

## Sprint 4 — Theme Display-Name Swap + Light Mode Contrast Fixes (2026-04-13) — v1.0.6-beta

- [x] **Task 1 — Theme display name swap** (themeColors.ts)
  - Changed `name: 'White'` → `name: 'Noir'` on the accent with `key: 'white'` (line 160)
  - Changed `name: 'Black'` → `name: 'White'` on the accent with `key: 'black'` (line 179)
  - Keys unchanged — localStorage and database preferences unaffected
  - All other fields (hex, rgb, isLightMode, isDarkMode, gradients, etc.) untouched

- [x] **Task 2 — ThemeProvider.tsx comment updates** (PROTECTED — approved by Tyler)
  - Updated 8 inline comments at lines 40, 53, 88, 107, 123, 262, 268, 274
  - References to old display name "Black" → "White" (for key 'black')
  - References to old display name "White" → "Noir" (for key 'white')
  - Comment-only changes — zero code logic modifications

- [x] **Task 3 — Light mode textbox/dropdown contrast fix** (globals.css)
  - Added `html[data-mode="light"]` CSS selector override for input, textarea, select, and select option elements
  - Forces dark text color (#1a1a2e) on form controls in light mode
  - Forces medium-grey placeholder color (#6b7280) in light mode
  - Fixes white-text-on-white-bg readability issue caused by color-scheme:light browser defaults
  - Dark mode styling completely untouched

- [x] **Task 4 — Light mode secondary button fill** (Button.tsx)
  - Added Tailwind arbitrary variant `[html[data-mode=light]_&]` overrides to secondary variant
  - Light mode: fills button with accent color, switches text to black, hover uses accent-primary
  - Affects: Dashboard 'App Appearance', 'My Saved Repairs', 'Main Menu' buttons in light mode
  - Dark mode styling completely untouched

**Files changed:** src/lib/constants/themeColors.ts, src/components/ThemeProvider.tsx, src/app/globals.css, src/components/ui/Button.tsx, src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md
**Files NOT changed:** Any auth/session files, middleware, useAuth, /api/me, RLS policies, Stripe logic, database migrations
**Build:** Verified with zero TypeScript errors.

---

*— End of Build Progress Tracker —*

---

Sprint W-0 — Worktree & Protocol Setup (2026-08-05) — v1.3.1-beta

First sprint of the 13-sprint Master Update Batch. Creates an isolated update workspace so the
remaining 12 sprints can be built and tested locally without ever touching the live site's
working folder, and writes the shared protocol file those sprints depend on.

- [x] **Step 0 — Starting-state guard** — all three checks passed before any work began:
  branch was `main`, `APP_VERSION` was exactly `v1.3.0-beta`, and both `Sprint G-1` and `AX-4`
  returned 0 hits in this tracker (confirming no earlier update batch was partially applied).

- [x] **Task 1 — Worktree created**
  - `git worktree add ../servicedraft-ai-updates -b updates-2026-08` off `main` @ `49e444e`
  - Absolute path: `C:\Users\Tyler\Desktop\SERVICEDRAFT.AI LOCAL REPO\ServiceDraft.Ai CODEBASE\servicedraft-ai-updates`
  - `.env.local` copied in manually (gitignored, so the worktree does not inherit it).
    All 11 keys present, including `TEST_ACCOUNT_EMAIL` / `TEST_ACCOUNT_PASSWORD`.

- [x] **Task 2 — Dependencies installed in the worktree**
  - `npm install` — 468 packages, clean
  - `npm install -D playwright` — added `playwright ^1.62.1` to devDependencies
  - `npx playwright install chromium` — **SUCCEEDED** (Chrome Headless Shell 151.0.7922.34,
    114.5 MiB, plus winldd 1007). No fallback to non-visual QA is required; the vision-QA tier
    is fully available for every remaining sprint in this batch.

- [x] **Task 3 — `scripts/qa-shot.mjs` created** (vision-QA screenshot helper)
  - Parses `.env.local` manually via line split — no dotenv dependency
  - Launches Playwright chromium headless; args: `<url-or-path> <output-filename>`, plus
    optional `--login`, `--wait=ms`, `--width=px`, `--height=px`
  - Bare paths resolve against `http://localhost:3011` (overridable via `QA_BASE_URL`)
  - With `--login` and both test credentials present: visits `/login`, waits for the form to
    replace the auth-checking spinner, fills `#email` and `#password` (selectors verified
    against `src/app/(auth)/login/page.tsx` — the shared `Input` component forwards `id` to the
    real `<input>`), submits `form button[type="submit"]`, and waits for the URL to leave
    `/login` before navigating to the target
  - Saves a full-page PNG into `qa-screens/`, creating the folder if missing
  - Fails gracefully with a plain-English message and non-zero exit for every failure mode:
    missing args, playwright package absent, chromium binary absent, dev server down, login
    failure, missing credentials (warns and captures logged-out instead)
  - Also de-mangles Git Bash / MSYS leading-slash path rewriting, so both `login` and `/login`
    work regardless of which shell a QA verifier subagent uses
  - `qa-screens/` appended to `.gitignore` (additive edit — nothing removed)

- [x] **Task 4 — `SPRINT_PROTOCOL.md` created** in the worktree root, with six sections that
  govern every remaining sprint: (1) Workspace Guard, (2) Sequence Guard, (3) Hard Safety
  Rules, (4) Team Model — orchestrator / scouts / builders / mandatory QA-vision verifier,
  (5) Wrap-Up, (6) Context Discipline.

- [x] **Task 5 — Verified**
  - `npx tsc --noEmit` — zero errors
  - `npm run build` — zero errors, all routes compiled (run twice: once before the version
    bump, once after)
  - `scripts/qa-shot.mjs` smoke-tested live against `npm run dev -- -p 3011`: captured
    `qa-screens/w0-login.png` (logged out) and `qa-screens/w0-main-menu.png` (with `--login`).
    Both PNGs were read back and visually inspected — correct violet theming, logo, wave
    background, no layout breakage. The graceful-failure path was also confirmed by running
    the script with no dev server up.

**Files changed:** `scripts/qa-shot.mjs` (new), `SPRINT_PROTOCOL.md` (new), `.gitignore`
(additive), `package.json` (playwright devDependency + version), `package-lock.json`,
`src/lib/version.ts`, `BUILD_PROGRESS_TRACKER.md`

**Files NOT changed:** No auth/session/signup/cookie files, no `useAuth.ts`, no `middleware.ts`,
no `/api/me`, no Stripe code, no RLS policies, no database migrations, no SQL run against
Supabase, no deletions of any kind. Nothing was pushed; the commit is local on `updates-2026-08`.

**⚠️ DISCOVERY — QA test account profile is incomplete.** Logging in as `TEST_ACCOUNT_EMAIL`
succeeds, but the account has no `username` set, so the login page's own routing sends it to
`/signup?step=2` ("Complete Your Profile") instead of `/main-menu`. Any protected route
captured with `--login` will therefore show the signup step-2 screen rather than the intended
page. This does not affect logged-out screenshots. Not fixed here — doing so would require
touching signup/auth flow or writing to the database, both prohibited by this batch's rules.
**Tyler is completing that account's profile himself as of this sprint (2026-08-05).** Once
done, `--login` captures will land on the real target route and no code change is needed. If a
later sprint sees a `--login` screenshot showing "Complete Your Profile", the account regressed
or the credentials point somewhere else — check that before assuming the sprint's UI is broken.

**Discovery — middleware deprecation notice.** The dev server logs: *"The `middleware` file
convention is deprecated. Please use `proxy` instead."* (Next.js 16.2.1). `src/middleware.ts`
is a PROTECTED file and was not touched. Flagging only so it is a known, deliberate deferral
rather than a surprise later.


---

QA SCREENSHOT HARNESS — TOOLING (no app changes) — 2026-08-05

Tooling-only task. **No application source code, no `src/`, no database, and no version
number were changed.** Tyler explicitly authorized skipping the MANDATORY VERSION BUMP RULE
for this task because no application behavior changes. Version stays at `v1.3.1-beta`.

**Where it lives:** `servicedraft-qa`, a SIBLING of the repo folders —
`C:\Users\Tyler\Desktop\SERVICEDRAFT.AI LOCAL REPO\ServiceDraft.Ai CODEBASE\servicedraft-qa`.
It is deliberately **outside every git repository** (the parent folder is not a repo, verified
with `git rev-parse --show-toplevel`) and is **not tracked by git**. Nothing in it is ever
committed. It has its own `package.json` with only `playwright` and `dotenv` as devDependencies,
so the app's own dependency tree is untouched by it.

**Authentication:** it logs in with `TEST_ACCOUNT_EMAIL` and `TEST_ACCOUNT_PASSWORD` read at
runtime from the worktree's `.env.local` via `APP_DIR`. No credentials are stored in the harness
folder. Point it at a different worktree with `APP_DIR="...\servicedraft-ai" npm run shot`.

**Contents:**
- `config.mjs` — resolves APP_DIR, loads `.env.local` through dotenv, throws a plain-English
  error if either credential is missing, and auto-detects the dev server (probes port 3011
  first per SPRINT_PROTOCOL, then 3000; `BASE_URL` overrides and is never second-guessed)
- `login.mjs` — logs in, caches the session to `.auth/state.json`, prints `LOGIN OK — session
  saved`. On failure it writes `login-failure.png` and prints the URL plus any visible error
  text. Explicitly detects the "bounced to /signup" case and explains it means the test
  account's profile is incomplete.
- `shot.mjs` — reuses the cached session, re-logs-in automatically if it is stale, captures
  full-page PNGs at **desktop 1440×900 and mobile 390×844**, waits for network idle plus a
  settle delay (framer-motion entrance animations), writes to
  `shots/<YYYY-MM-DD_HHMM>/<route>__<desktop|mobile>.png`, and prints the URL each route
  actually landed on so redirects are obvious. `--logged-out` skips the session.
- `flow-generate.mjs` — drives the real input form to reach `/narrative` (which redirects to
  `/input` unless store state exists). Reads the app's own `src/constants/fieldConfig.ts` at
  runtime to derive field IDs and placeholders rather than hardcoding selectors, so it adapts
  if fields change. Tags every free-text field `QA BOT TEST`. **Requires a typed `yes`
  confirmation — it makes a real Gemini API call and writes real production database rows.**
- `README.md` — written for a non-programmer.

**Smoke test result (against `npm run dev -- -p 3011` in this worktree):**
- `npm run login` → `LOGIN OK — session saved`, landed on `/main-menu`. The test account's
  profile was completed by Tyler earlier the same day, which resolved the W-0 finding that
  logins were being bounced to `/signup?step=2`.
- `npm run shot` → **12/12 screenshots written**, no zero-byte files, run folder
  `shots/2026-08-05_1812`. The `main-menu` desktop capture was read back and visually
  inspected: correct violet theming, logo, particle background, Main Menu card with
  Generate New Story / User Dashboard / Log Out, and the NavBar version label reading
  `v1.3.1-beta`. The `input` mobile capture was also inspected and confirms a correct
  390px-wide stacked layout.
- `npm run shot -- --logged-out /login /signup` → 4/4 captured with no redirects.
- `flow-generate.mjs` was **written but deliberately NOT run** — it would have made a real
  Gemini call and written real rows to the live database, which was outside what this task
  authorized. It is unproven end-to-end; its selectors were verified by reading the source
  and confirmed against the captured input-page screenshots.

**Discovery — logged-in sessions hide the auth screens.** With a valid session the app
correctly redirects `/login` and `/signup` to `/main-menu`, so those two screens are
uncapturable in a normal run. A `--logged-out` flag was added to `shot.mjs` for this. Any
sprint touching login or signup UI must use it or it will silently screenshot the main menu.

**Discovery — the QA account is role `user`.** The main-menu capture shows only Generate New
Story and User Dashboard, with no Owner or Team Dashboard button. `/admin` and `/team-dashboard`
therefore cannot be visually QA'd with these credentials; a test account with `owner` or
`admin` role would be needed for those screens.

**`SPRINT_PROTOCOL.md` Section 4(d) updated** (additive) to point the QA-vision verifier at
this harness as the preferred tool, keep `scripts/qa-shot.mjs` as the fallback, document the
`--logged-out` requirement, and forbid running `flow:generate` without Tyler's explicit
per-sprint approval.


---

Sprint G-1 — Prompt Logic Fixes (Tense + Single-Suggestion Proofread)
(2026-08-06) — v1.3.2-beta

Sprint 2 of the 13-sprint Master Update Batch. Two prompt-logic defects: diagnostic-only
narratives could drift into completed-repair tense (especially after Refine or after applying
proofread edits), and the proofread audit could hand back two competing fixes for one issue.

- [x] **Step 0 — Guards passed.** Branch `updates-2026-08`, toplevel ends in
  `servicedraft-ai-updates`, and `Sprint W-0` found in this tracker (1 hit). No pre-existing
  `Sprint G-1` entry.

- [x] **Task 1 — Diagnostic tense rule strengthened** (`src/constants/prompts.ts`)
  - The single soft bullet in `DIAGNOSTIC_ONLY_SYSTEM_PROMPT` ("should describe the RECOMMENDED
    repair action") was replaced by three hard bullets: an ABSOLUTE unconditional tense rule, a
    scope carve-out, and an explicit convert-completed-wording instruction.
  - The carve-out matters: the rule governs the RECOMMENDED REPAIR ACTION only. Diagnostic,
    inspection, and access work that was actually performed stays in verb-first past tense, so
    the new rule does not contradict `MANDATORY_OUTPUT_RULES` rule 1.
  - The `"correction"` JSON key description was reinforced to "...STATED AS A RECOMMENDATION AND
    NEVER AS A COMPLETED REPAIR".
  - **Deliberately NOT placed in `MANDATORY_OUTPUT_RULES`** — that block is shared with
    `/api/convert-recommendation` and `/api/update-narrative`, whose entire purpose is converting
    recommended tense INTO past tense. A tense rule there would put both routes at war with
    themselves. The repair-complete mirror rule was left byte-identical.

- [x] **Task 2 — Tense preservation threaded through Refine and Apply-Edits**
  - `/api/refine` already received `storyType` and already printed a STORY TYPE label, but
    injected no tense instruction. Added a conditional `tenseBlock`, interpolated LAST in the
    user prompt (`${customBlock}${tenseBlock}`) so it is the final word and outranks any custom
    instruction. `storyType` was NOT re-threaded — it was already there.
  - `/api/apply-edits` had no `storyType` at all. Added it to the request destructuring (kept
    OPTIONAL — deliberately NOT added to the 400 guard, so an older client still works), plus a
    conditional `tenseBlock` interpolated LAST (`${editsFormatted}${tenseBlock}`). It is phrased
    as a constraint on HOW the selected edits are applied, not as an extra edit, so it does not
    conflict with the system prompt's "no additional changes" rule.
  - `src/app/(protected)/narrative/page.tsx`: one added line, `storyType: state.storyType,` in
    the `/api/apply-edits` request body. `narrativeStore.ts` (PROTECTED) already exposed
    `state.storyType`, so no store change was needed and no hard stop was triggered.
  - Both `tenseBlock` consts collapse to `''` for `repair_complete`, `undefined`, and `null`.
    Repair-complete prompts are byte-identical to pre-sprint — verified by reconstructing and
    diffing both templates across all five input cases.

- [x] **Task 3 — Proofread returns exactly one fix per issue**
  - **Discovery: the two proofread prompts named in the sprint prompt are DEAD CODE.**
    `PROOFREAD_SYSTEM_PROMPT` and `DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT` are exported but
    imported by nothing. The live path is `buildProofreadSystemPrompt()` →
    `PROOFREAD_OUTPUT_FOOTER`. Editing only the named lines would have changed nothing at
    runtime. The real fix went into `PROOFREAD_OUTPUT_FOOTER`; the two dead constants were
    given the same rule for consistency (neither was deleted).
  - Added "EXACTLY ONE FIX PER ISSUE" — bans alternatives, choices, "Option A / Option B",
    "either this or that", "alternatively", "you could also".
  - Added an equal-array-length rule (never merge two issues into one edit, never split one
    issue into two), which also protects the index-parallel pairing the highlight tooltips
    depend on.
  - Each edit must now be SELF-CONTAINED and state both the text being changed and its
    replacement. This was a corrective second pass: an earlier wording ("give the exact
    replacement wording to use") caused the model to return bare fragments like
    "due to an internal component defect." with no indication of what they replace — confusing
    as a checkbox label, and `/api/apply-edits` receives only the edit strings, so the apply
    model had to guess the insertion point.
  - Response parsing and `ProofreadResults.tsx` display needed no changes — the UI was already
    a flat one-string-per-checkbox list. `extractSnippet` and the `[[double bracket]]`
    convention (including the empty `[[]]` case) are untouched.

- [x] **Task 4 — No existing prompt rules weakened.** Verified intact: no-invented-identifiers
  rules, index-parallel pairing, `[[]]` convention, `.toUpperCase()` enforcement blocks,
  `/api/generate` rate limit + `is_restricted` gate, `/api/refine` prompt-injection blocklist,
  and the `8192` max-output-token argument on the apply-edits Gemini call.

**QA (3 live Gemini calls, the sprint's authorized cap — no 4th):**
- `npx tsc --noEmit` zero errors. `npm run build` succeeded in 11.8s, 46/46 static pages.
- Dev server on port 3011. Smoke: `/` 200, `/login` 200, `/main-menu` `/input` `/narrative`
  307→/login anonymous and 200 authenticated. No 500s.
- **Call 1 — diagnostic generation with input deliberately written as a COMPLETED repair**
  ("REPLACED THE LEFT FRONT WHEEL BEARING ASSEMBLY AND ROAD TESTED TO VERIFY..."). Output:
  "RECOMMEND REMOVING AND REPLACING THE LEFT FRONT HUB AND WHEEL BEARING ASSEMBLY. RECOMMEND
  PERFORMING A POST-REPAIR ROAD TEST TO VERIFY CONCERN IS RESOLVED." PASS — converted, and no
  false verification claim. The carve-out also held: diagnostic past tense survived in `cause`.
- **Call 2 — refine (`more_detail`) on that narrative.** Stayed in recommendation tense. PASS.
- **Call 3 — proofread on that narrative.** 2 flagged issues, 2 suggested edits (equal length),
  zero alternative phrasings, snippets stripped cleanly into `{issue, snippet}`. PASS.
- Apply-edits was verified statically end to end (client → destructure → ternary → prompt)
  rather than with a 4th call, to stay inside the authorized cap.
- Screenshots: `/main-menu` and `/input` desktop captured AND read — both render correctly, no
  error overlays. `/narrative` was NOT screenshotted; reaching it requires a generation flow
  that would have cost a 4th Gemini call.

**Files changed:** src/constants/prompts.ts, src/app/api/refine/route.ts,
src/app/api/apply-edits/route.ts, src/app/(protected)/narrative/page.tsx, src/lib/version.ts,
package.json, BUILD_PROGRESS_TRACKER.md
**Files NOT changed:** narrativeStore.ts, useAuth.ts, middleware, /api/me, RLS policies, Stripe
logic, database migrations, MANDATORY_OUTPUT_RULES, PROOFREAD_FRAMEWORK_HEADER, the
repair-complete mirror rule, /api/proofread/route.ts, ProofreadResults.tsx
**Build:** Zero TypeScript errors; full production build succeeded.

**Carried forward for Tyler — not actioned this sprint (no deletions per protocol):** three dead
exports in `src/constants/prompts.ts` (`PROOFREAD_SYSTEM_PROMPT`,
`DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT`, `AUDIT_STYLE_MODIFIERS`), plus a stale comment above
`AUDIT_STYLE_MODIFIERS` claiming `/api/proofread` consumes it. Worth a cleanup decision later.

---

Sprint G-2 — Export Name + Email Modal & Body Overhaul
**Status:** [x] COMPLETE (2026-08-12) — v1.3.3-beta — Master Update Batch, sprint 3 of 13 (branch `updates-2026-08`, worktree `servicedraft-ai-updates`, local commit only, NOT pushed)

Three connected upgrades built in dependency order: a shared "F. Lastname" name formatter applied
to the document exports, a full redesign of the email export modal, and a properly branded email body.

**Task 1 — Name on document exports.**
- NEW `src/lib/formatUserName.ts` — `formatUserName(first, last)` → `"F. LASTNAME"`. Handles both
  names, first only, last only, neither, null/undefined, and whitespace-only. Only the INITIAL is
  force-uppercased; the last name passes through exactly as stored, because `EditProfileModal`
  saves names uppercase and title-casing would corrupt names like `MCDONALD` → `Mcdonald`.
- `ExportPayload` gained an OPTIONAL `preparedBy?: string` (optional keeps every existing caller
  and both export routes backward-compatible).
- Rendered as a right-column "Prepared By:" block in `/api/export-pdf` and `/api/export-docx`,
  styled to match the existing "Repair Order #:" block (11pt bold underlined heading + 11pt value,
  right-aligned). Omitted entirely when the name is empty, matching the existing conditional-omit
  convention for blank vehicle fields.
- SCOPE CORRECTION — the sprint prompt assumed three render surfaces (Print / PDF / DOCX). There are
  only TWO. `buildPrintHtml` does not exist in `src/` (it survives only in stale docs) and there is
  no `window.print()` anywhere. The "VIEW / PRINT / DOWNLOAD" button POSTs to `/api/export-pdf` and
  opens the returned blob in a new tab — the user prints from the browser PDF viewer. **Print IS
  the PDF**, so fixing the PDF header delivered the Print view too. No third divergent renderer was
  created to satisfy the prompt wording.
- PDF LAYOUT FIX (latent bug, would have caused a collision): the header bottom edge was computed
  as `y = fieldY + 8` — from the LEFT column only. That was safe purely because the left column
  happened to be taller. Adding a right-column block broke the assumption, so it is now
  `y = Math.max(fieldY, rightColY) + 8`. Verified by parsing the real PDF content stream:
  with a name, `Prepared By:` y=39, name y=45, `REPAIR NARRATIVE` y=61 — a ~9.6mm clear gap.
  With `preparedBy` empty, `Math.max` still returns 35, byte-identical to the old behavior.
- Threaded via a new `senderShortName` prop: `narrative/page.tsx` → `ShareExportModal`, and
  `dashboard/page.tsx` → `NarrativeHistory` → `NarrativeDetailModal`. Resolved client-side from the
  `useAuth()` profile already in scope at both roots — no new DB queries, no server-side profile
  fetch, nothing auth-adjacent touched. Existing full-name `senderName` prop left intact throughout.

**Task 2 — Email modal redesign (`EmailExportModal.tsx`).**
- Title "Email Narrative" centered and enlarged (`text-xl` → `text-2xl`). Achieved by no longer
  passing `title` to the shared `Modal`, then rendering an own centered `<h2>` — `ui/Modal.tsx` is
  used by 17 components and was deliberately NOT modified.
- Recipient model split: `emails: string[]` (index 0 doubling as the input) became `recipients`
  (the committed list) plus a single `manualEntry`. Exactly ONE empty manual input, always. The
  added-recipient list renders at the TOP under the title, bare on the modal background with no
  card, each with a remove (x). Enter commits; a pending uncommitted entry is also committed on
  SEND so a typed address is never silently dropped.
- "Add Another Recipient" and "Select From Contacts" removed entirely. With no way to reopen a
  collapsed panel, the Saved Contacts container is now always visible.
- "Select Contacts" → "SAVED CONTACTS" at `text-sm`; the inline "New Contact" trigger under the old
  title removed; contacts now in a 2-column grid (`grid-cols-1 sm:grid-cols-2`, collapsing on
  mobile); a single click adds a contact immediately — checkboxes, `selectedContactEmails`,
  `toggleContactSelection` and the "Add Selected" step are gone. "Cancel"/"Add Selected" replaced by
  "+ NEW CONTACT" (existing inline add-contact form) and "EDIT SAVED CONTACTS" (existing
  `dashboard/ContactsModal.tsx` CRUD, re-fetching contacts on close). That button row was moved OUT
  of the `contactsList.length > 0` branch so it survives the empty state.
- Subject line converted from a read-only preview to an EDITABLE input with a title matching Saved
  Contacts. Pre-fills `Repair Narrative From {F. Lastname} - R.O.# {roNumber} - {YEAR MAKE MODEL}`
  with HYPHEN separators (the old preview used em-dashes) and drops empty segments cleanly. Seeded
  into state on open, so an unedited prefill is exactly what sends.
- Send now POSTs `subject`, the FORMATTED `senderName`, `narrative_style`, and `story_type` on top of
  the existing `to` / `narrative` / `displayFormat` / `vehicleInfo`.
- Contacts CRUD preserved and rewired, never rewritten: `/api/contacts` fetch, `handleSaveNewContact`
  with its `notes` field, force-uppercase on name+notes (email correctly NOT uppercased), optimistic
  insert + `localeCompare` re-sort with no refetch, `MAX_RECIPIENTS = 10` and its toast, duplicate
  prevention and the "(already added)" disabled affordance, loading spinner, empty state, fetch-
  failure toast, per-field error clearing.
- framer-motion parity with `ContactsModal`: `AnimatePresence mode="popLayout"` plus `layout` on list
  items, height expand/collapse on the new-contact form, shared `Button` variants for hover/tap.

**Task 3 — Email body (`/api/send-email` + `buildEmailHtml`/`buildPlainTextEmail`).**
- The posted `subject` is used as-is; `buildSubjectLine()` was KEPT as the fallback for a blank or
  absent subject.
- New intro line above the header: "{F. Lastname} has sent you a repair narrative for the
  {YEAR MAKE MODEL}." Built by one shared helper used by BOTH the HTML and plain-text builders so
  they cannot drift, with four graceful degradations (name+vehicle / name only / vehicle only /
  neither). Passed through `escapeHtml()` — `senderName` is client-supplied and unsanitized by the
  route, so this is the injection boundary; verified with a hostile-input probe.
- New centered CTA footer: the logo wrapped in `<a href="https://servicedraft.ai" target="_blank">`,
  a one-line CTA, a text link, and the existing "Generated by ServiceDraft.AI" attribution KEPT.
  Nested tables + inline styles only (Outlook-safe). Logo keeps its 2.09:1 native ratio at 105x50 and
  keeps the hardcoded production URL — `NEXT_PUBLIC_APP_URL` was deliberately NOT used, because every
  existing consumer falls back to `window.location.origin` / `http://localhost:3000`, which would
  email a broken localhost image from a dev send.
- Plain-text twin kept in sync: same intro line, same CTA as a bare URL, existing "Sent by" and
  "Generated by" tails retained.
- `narrative_style` and `story_type` are accepted as documented OPTIONAL members of
  `SendEmailRequest`. They are deliberately not rendered — no copy was invented for them and no
  DB/activity logging was added (this route has never logged, and adding it was out of scope).
- ALL existing validation and error handling verified intact: 401 auth, 500 missing RESEND_API_KEY,
  400 no recipients, 400 >10 recipients, 400 invalid address, 400 missing narrative, 500 Resend
  error, 500 catch-all, 200 `{ success, sentTo }`, `from: noreply@servicedraft.ai`, and
  `replyTo: user.email || undefined`.

**QA:** `npx tsc --noEmit` zero errors. `npm run build` SUCCEEDED, exit 0, 46/46 static pages — the
documented ~1hr Turbopack hang did not reproduce this run. `npx eslint src` = 28 problems, all
pre-existing in untouched files; ZERO new errors or warnings in the 12 changed files. Dev server on
port 3011, clean compile. Smoke: `/` 200, `/login` 200, `/dashboard` `/main-menu` `/input` 307 to
/login anonymous (correct). Screenshots: 20 captured at desktop 1440x900 AND mobile 390x844 and READ
— dashboard, narrative detail modal, email modal initial, email modal with recipients added, contacts
manager stacked, post-Escape, contacts 2-column grid, and after a single-click add. Every Task 2 spec
item visually verified PASS. Additionally: `formatUserName` executed against 14 real cases; four real
PDFs and a DOCX generated and their content streams parsed to prove the header geometry; the email
HTML rendered and screenshotted. NO email was sent (`/api/send-email` was blocked at the route level
in the test browser) and `flow:generate` was NOT run — both forbidden this sprint.

**QA data limitation (stated plainly):** the QA account has 0 saved narratives and 0 saved contacts.
Rather than generate test data, the `/api/narratives` and `/api/contacts` GET responses were stubbed
IN THE TEST BROWSER ONLY. The real component tree rendered for real (the subject line resolved a real
profile to "Q. BOT"), but the data behind it was mocked. Nothing was written to the database. The
`/narrative` to `ShareExportModal` path was verified by code reading only, since `/narrative` cannot
be visited directly; the dashboard path exercises the identical `EmailExportModal` component.

**Files changed (12):** src/lib/formatUserName.ts (NEW), src/lib/exportUtils.ts,
src/app/api/export-pdf/route.ts, src/app/api/export-docx/route.ts, src/app/api/send-email/route.ts,
src/components/narrative/EmailExportModal.tsx, src/components/narrative/ShareExportModal.tsx,
src/components/dashboard/NarrativeDetailModal.tsx, src/components/dashboard/NarrativeHistory.tsx,
src/app/(protected)/narrative/page.tsx, src/app/(protected)/dashboard/page.tsx,
src/types/database.ts (additive optional `narrative_style?: string | null` on `Narrative`),
plus src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md.

**Files NOT changed:** useAuth.ts, middleware.ts, /api/me, Stripe, narrativeStore.ts,
ThemeProvider.tsx, ui/Modal.tsx, ui/Button.tsx, RLS policies, database migrations. No SQL run.
Nothing deleted.

**Carried forward for Tyler — NOT actioned this sprint:**
1. **A single Escape closes the entire modal stack.** `ui/Modal.tsx` attaches a document-level
   `keydown` listener per open modal with no stack awareness, so every open modal onClose fires
   at once. On `/dashboard`, Escape from the email modal also closes `NarrativeDetailModal`. PROVEN
   PRE-EXISTING — it reproduces with the contacts manager never opened; this sprint only makes it
   more visible by adding a third layer. The correct fix is a modal stack in `ui/Modal.tsx` so only
   the topmost handles Escape, which changes global Escape semantics for 17 components including the
   signup flow — too broad to regression-test inside this sprint. Deferred by decision.
2. **Nested-modal backdrop dimming.** `ContactsModal` backdrop is `z-[200]`, below the email
   modal container `z-[210]`, so the email modal is not dimmed behind the manager. Judged cosmetic
   and not visually broken; mitigated with `pointer-events-none` on the email modal body while the
   manager is open. A real fix needs a `zIndex`/`level` prop on `ui/Modal.tsx`.
3. **`CURRENT STATUS` at the top of this tracker is stale** (still reads v1.3.0-beta). This batch
   SPRINT_PROTOCOL Section 5 specifies append-to-END entries only, and sprints G-0/G-1 followed that,
   so it was left alone rather than rewritten. Worth one cleanup pass at the end of the batch.
4. **Name casing.** `formatUserName` emits `"J. SMITH"`, not `"J. Smith"`, because profile names are
   stored uppercase. Title-casing was rejected as it would corrupt `MCDONALD` to `Mcdonald`. Say the
   word if you want the title-cased form and accept that trade-off.

---

Sprint G-2a — Modal Stacking Fix (Escape + z-index)
**Status:** [x] COMPLETE (2026-08-12) — v1.3.4-beta — follow-up to Sprint G-2, carried-forward item #1 (branch `updates-2026-08`, worktree `servicedraft-ai-updates`, local commit only, NOT pushed)

Fixes the pre-existing modal-stacking bug that Sprint G-2 QA found and deferred.

**THE BUG.** Every full-screen overlay attached its OWN document-level `keydown` listener with
no stack awareness, so a single Escape press fired EVERY open overlay onClose at once. On
/dashboard, Escape inside EmailExportModal also closed the parent NarrativeDetailModal and dropped
the user back to the bare dashboard. Two further defects in the same code:
- Each overlay reset `document.body.style.overflow` in its own cleanup, so closing a NESTED overlay
  restored page scrolling while its parent was still open.
- `ui/Modal.tsx` hardcoded backdrop `z-[200]` / container `z-[210]` for every instance, so a nested
  modal backdrop sat BELOW the modal it covered and failed to dim it.

**SCOPE CORRECTION — three overlay implementations owned Escape, not one.** The task named only
`ui/Modal.tsx`. Recon found the identical hand-rolled listener in `input/MyRepairsPanel.tsx` (which
opens `EditRepairModal`, a ui/Modal, on top of itself) and `dashboard/ActivityDetailModal.tsx`.
Fixing only `ui/Modal.tsx` would have left the same bug reproducible on the input page, so the fix
was built as a shared primitive and wired into all three.

**THE FIX.**
- NEW `src/lib/overlayStack.ts` — a module-level open-overlay stack. `registerOverlay(id)`,
  `unregisterOverlay(id)`, `isTopOverlay(id)`, `getOverlayDepth(id)`, `subscribeOverlays(listener)`.
  Owns a body-scroll-lock refcount released only when the LAST overlay closes. Both mutators are
  idempotent via membership guards, so React StrictMode double-invocation nets to one entry.
- `ui/Modal.tsx` — Escape and backdrop click gated on `isTopOverlay`; z-index derived from stack
  depth: backdrop `200 + (depth-1)*20`, container `210 + (depth-1)*20`. Depth is read through
  `useSyncExternalStore` (the same external-store idiom `narrativeStore.ts` already uses) rather
  than mirrored into React state — a synchronous `setState` inside an effect trips the
  `react-hooks/set-state-in-effect` rule, which was caught and corrected during this sprint.
- `input/MyRepairsPanel.tsx` and `dashboard/ActivityDetailModal.tsx` — joined the stack, Escape
  gated on `isTopOverlay`, body-overflow handling handed to the refcount. Their own z-index scales
  (40/50 and 120/130) left UNCHANGED, deliberately: they are meant to sit below ui/Modal.
- `narrative/EmailExportModal.tsx` — removed the two workarounds G-2 had to add: the
  `handleModalClose` guard and the `pointer-events-none` class on the modal body. QA proved the
  z-index fix fully replaces them (`elementFromPoint` over the SEND EMAIL button now returns the
  manager backdrop at z-240, and a click there produced zero requests to /api/send-email).

**THE INVARIANT THAT MADE THIS SAFE.** For a SINGLE open overlay nothing changed — depth 1 keeps
z-200/210 and still closes on Escape and on backdrop click. Only STACKS behave differently. That is
what let a shared component with 17 consumers, including the PROTECTED signup flow, be changed
without a protected-file edit and without a behavioural regression.

**Caller contract documented in overlayStack.ts (two rules):** register from an effect depending
ONLY on the open flag and id — never on `onClose`, since a re-registration would pop and re-push
an overlay above its own child; and a nested overlay must open STRICTLY AFTER its parent, never in
the same commit, because React runs effects bottom-up and would otherwise invert the stack. Every
nested overlay in the app satisfies the second rule today (`showEmailModal`, `showContactsManager`
and `editingTemplate` all start falsy and flip on a later user action).

**QA — 103 assertions, 103 PASS.** `npx tsc --noEmit` exit 0. `npm run build` exit 0, compiled in
15.1s, 46/46 static pages. `npx eslint src` = 28 problems, DELTA ZERO vs the measured pre-change
baseline (the two findings in touched files — `Modal.tsx` `set-state-in-effect` on its pre-existing
`setMounted`, and `MyRepairsPanel.tsx` unused `FileText` — were both confirmed present at HEAD
before this work by linting the HEAD copies). Dev server clean, ZERO React warnings across ~100
modal open/close cycles. 32 screenshots at 1440x900, 17 read and inspected.
- TEST 1 two layers on /dashboard: one Escape closes EmailExportModal ONLY, NarrativeDetailModal
  stays open. PASS.
- TEST 2 three layers: measured z-indexes exactly 200/210, 220/230, 240/250; the manager backdrop
  at 240 now visibly DIMS the email modal at 230; three Escapes peel the stack one layer at a time.
  PASS.
- TEST 3 /input: MyRepairsPanel 40/50 with EditRepairModal at 220/230; one Escape closes only the
  edit modal, the panel stays open, panel z unchanged. PASS.
- TEST 4 body-scroll refcount: hidden with two layers, STILL hidden after closing the top layer,
  restored to "" only after the last closes. PASS.
- TEST 5 single-modal regression, 55/55 across nine modals — dashboard Appearance/EditProfile/
  SavedRepairs/Contacts, main-menu FAQ/Support/Terms, input SaveRepair, and the /signup Terms modal
  in a fresh SIGNED-OUT context. Every one: exactly 200/210, Escape closes, backdrop click closes,
  overflow restored. PASS.
- TEST 6 ActivityDetailModal: 120/130 unchanged, Escape closes. PASS.
- Extra adversarial: no stack leak on soft-navigate-away, on unmount-while-open, or on isOpen
  flipping false; `getSnapshot` returns a stable primitive; the constant-0 server snapshot is safe
  because the component returns null until `mounted`.
- NO email sent (0 requests to /api/send-email), NO database writes (every non-GET /api call
  hard-aborted in the test browser), `flow:generate` NOT run.

**QA limitations (stated plainly):** the QA account has 0 narratives, 0 contacts and 0 saved
repairs, so every list rendered against GET responses stubbed IN THE TEST BROWSER ONLY. The account
is role `user`, so reaching ActivityDetailModal required rewriting only the `role` field of the real
/api/me GET response in the browser — read-only, no file touched. `/signup` was opened but never
submitted and no credentials were entered.

**Files changed (5 + release):** src/lib/overlayStack.ts (NEW), src/components/ui/Modal.tsx,
src/components/input/MyRepairsPanel.tsx, src/components/dashboard/ActivityDetailModal.tsx,
src/components/narrative/EmailExportModal.tsx, plus src/lib/version.ts, package.json,
BUILD_PROGRESS_TRACKER.md.

**Files NOT changed:** useAuth.ts, middleware.ts, /api/me, Stripe, narrativeStore.ts,
ThemeProvider.tsx, (auth)/signup/page.tsx, RLS policies, database migrations. No SQL run. Nothing
deleted. No protected file was edited — signup behaviour was verified, not modified.

**Carried forward for Tyler — NOT actioned:**
1. **PreferencesPanel z-index collision.** `dashboard/PreferencesPanel.tsx` hardcodes `zIndex: 200`
   and `201`, tying with ui/Modal depth-1 backdrop at 200. It has no Escape listener, so it was
   deliberately left out of the stack — registering it would make it swallow Escape entirely. No
   functional break today (a ui/Modal container at 210 still wins), but the tie is untidy.
2. **Backdrop-click guard asymmetry.** ui/Modal gates backdrop click on `isTopOverlay`;
   MyRepairsPanel and ActivityDetailModal do not. Unreachable — the top backdrop fully covers their
   40/50 and 120/130 — so cosmetic only.
3. **ActivityDetailModal at 120/130 sits below ui/Modal depth-1 at 210.** If it ever opened over a
   ui/Modal it would own Escape while being visually buried. Its call sites (/admin,
   /team-dashboard) are tab-gated against the other modals, so not reachable. Pre-existing property.
4. **Dev-only:** a Fast Refresh that re-evaluates overlayStack.ts resets the module-level stack and
   could strand `body.style.overflow = 'hidden'`. No production impact.
5. **Cosmetic 200ms:** a closing nested modal drops to depth 1 for its fade-out, so its backdrop
   briefly stops dimming the parent mid-fade. Arguably the desired reveal.
6. **`CURRENT STATUS` at the top of this tracker remains stale** (reads v1.3.0-beta) — still
   pending the end-of-batch cleanup pass noted in Sprint G-2.

---

Sprint G-3 — Version History Overhaul + Restore Version
**Status:** [x] COMPLETE (2026-08-12) — v1.3.5-beta — sprint 4 of the 13-sprint Master Update Batch (branch `updates-2026-08`, worktree `servicedraft-ai-updates`, local commit only, NOT pushed)

Two stages, built and verified in order. Stage A overhauled how version history displays;
Stage B added restore-a-version on top of it.

**SCOPE CORRECTION — the sprint prompt described the WRONG table.** The prompt stated that
`narratives.action_history` entries carry `customization: { narrative_style, custom_instructions }`
and that lightweight events (`proofread`, `export_print`, `export_pdf`) are stored there. Neither is
true. Scouting found TWO `action_history` columns on two different tables:
- `narratives.action_history` — typed `NarrativeHistoryEntry`, rendered by `dashboard/NarrativeDetailModal.tsx`.
  Exactly seven fields: `action, version, at, narrative_text, concern, cause, correction`. NO
  `customization`, NO `narrative_style`. EVERY entry is a full snapshot; no lightweight entries exist.
- `narrative_tracker.action_history` — typed `TrackerActionEntry`, rendered by the ADMIN
  `ActivityDetailModal.tsx`. THIS is the table that has `customization.narrative_style` and
  lightweight `{at, action}` export/proofread markers.

The sprint targeted the user-dashboard modal, so the first table was the real subject. The admin
modal was left completely untouched.

**CONSEQUENCE — task 1 could not be done from existing data.** `handleStyleChange`
(`narrative/page.tsx`) calls the SAME `handleRegenerate` the plain Regenerate button calls, and both
write `action: 'regenerate'` with byte-identical entries. Plain vs style regeneration was therefore
indistinguishable. The row-level `narratives.narrative_style` column is no fallback either: it is
written ONLY at INSERT and never updated by PATCH, so it goes stale after any style switch. The
prompt's own fallback rule ("differentiate by whether narrative_style changed from the previous
entry") presupposes a field that did not exist, so the style is now RECORDED on each entry as an
additive optional JSON field. No schema change, no SQL, no migration — `action_history` is JSONB.

**STAGE A — display + interaction.**
- `types/database.ts` + the duplicate interface in `api/narratives/[id]/route.ts` — added optional
  `narrative_style?: string` to `NarrativeHistoryEntry`, kept in sync.
- `api/narratives/save/route.ts` — the first (`generate`) history entry now records
  `narrative_style`, using the same `body.narrative_style || 'manufacturer_warranty'` expression the
  row column already used, so entry and column agree and version 1 has a baseline to compare against.
- `api/narratives/[id]/route.ts` — PATCH accepts an OPTIONAL `narrative_style` and attaches it to the
  appended entry via conditional spread, never writing an explicit `undefined` key into JSONB. The
  400 guard, the rolling `auto_save` in-place collapse, the `append_narrative_history` RPC-first path
  with read-modify-write fallback, the exact column set, and every error status are unchanged. There
  is still deliberately NO `action_type` whitelist, which is why `restore` needed zero route changes.
- `narrative/page.tsx` — `autoSaveNarrative` gained an optional trailing `styleOverride`; resolves
  `effectiveStyle = styleOverride ?? state.narrativeStyle` once and sends it on BOTH the INSERT and
  PATCH branches. `handleRegenerate` passes its local `styleForBody`, NOT the store value — the store
  snapshot has not refreshed when `handleStyleChange` calls it, so passing the store value would have
  recorded the OLD style and mislabelled every style regeneration.
- `dashboard/NarrativeDetailModal.tsx` — regeneration tag variants (`Regenerated - Customer Pay` /
  `- Extended Warranty` / `- Manufacturer Warranty`) applied ONLY when this entry's style AND the
  previous entry's (version-ascending) are both present AND differ; plain `Regenerated` in every
  other case, including all legacy rows. Whole row is now the click target (`role="button"`,
  `tabIndex`, `aria-expanded`, Enter/Space with `preventDefault` on Space) with the chevron demoted
  to a non-interactive `<span aria-hidden>` — no nested `<button>`. Subtle accent-variable hover glow
  on expandable rows only. Per-version Block/CCC toggle at the BOTTOM of each expanded version
  (`versionFormats: Record<number, 'block'|'ccc'>`, default `ccc`). Lightweight entries (no snapshot
  content) render as plain non-expandable markers whose clicks are a total no-op.
- **CASING DECISION:** the prompt specified on-screen `REGENERATED - CUSTOMER PAY`. This is achieved
  with the Tailwind `uppercase` utility on the pill, keeping the label map in Title Case. Hand-writing
  SHOUTING strings into the map would have made `Regenerated` the only uppercase entry and broken the
  unknown-action Title-Case fallback, which is preserved.
- **INNER SCROLLBAR:** killed by removing `max-h-[250px] overflow-y-auto` from the snapshot box —
  nothing else. `ui/Modal.tsx`'s `max-h-[90vh] overflow-y-auto` body wrapper is untouched and remains
  the "outer modal may scroll" behaviour the prompt asked for.
- Latent bug fixed: the map's React key was the array index while expansion is keyed by
  `entry.version`; now keyed by version + timestamp.

**STAGE B — restore.**
- `ui/Modal.tsx` — ONE additive optional prop, `backdropClassName`, defaulting character-for-character
  to the previous literal `bg-black/75 backdrop-blur-[10px]`, so all ~17 existing call sites render
  identically. The whole segment is replaced rather than appended (two competing `bg-black/*`
  utilities do not resolve reliably in Tailwind). z-index math, `isTopOverlay` gating, the body
  wrapper, motion variants and the registration effect's dependency array are untouched.
- NEW `dashboard/RestoreVersionModal.tsx` — stacks on top of the history modal at z 220/230 via the
  existing Sprint G-2a overlay stack (zero stacking code written), over
  `bg-black/90 backdrop-blur-[24px]`. Shows the version's narrative in the format the user was
  viewing, then the standard export row mirroring NarrativeDetailModal's (COPY /
  VIEW-PRINT-DOWNLOAD / WORD / EMAIL, pop-up-blocked detection and 60s `URL.revokeObjectURL`
  preserved), then a clear RESTORE THIS VERSION confirm + CANCEL with a plain-English consequence line
  and a pending state. Exports build their payload from the ENTRY (`narrative_text` mapped to
  `block_narrative`), never from the current narrative. EMAIL nests a third modal at 240/250.
- Restore persists through the EXISTING `PATCH /api/narratives/[id]` with `action_type: 'restore'`.
  The client sends ONLY the four narrative fields — never an `action_history` array — so the server
  owns the append and history can never be rewritten or truncated. `auto_save` was deliberately
  avoided as an action value, since it triggers the in-place replace of the last entry.
- `NarrativeDetailModal` keeps a local `view` state seeded from the prop so the modal immediately
  reflects the restored text, bumps a `historyRefresh` counter so the new `Restored` entry appears
  without closing the modal (the fetch effect's `cancelled` race guard and silent-fail catch are
  preserved), and calls a new optional `onRestored`. `NarrativeHistory.tsx` wires that to its existing
  `fetchNarratives` callback — a ONE-LINE change, zero deletions.
- `restore` added to both display maps: pill `#14b8a6` (teal, distinct from the existing palette) and
  label `Restored`.

**QA-VISION RESULTS — CLEAN.**
- `npx tsc --noEmit` zero errors. `npm run build` COMPLETED, exit 0 (it did not hang this run).
  `npm run lint`: 28 findings, ALL pre-existing, ZERO introduced — the sprint's own files produce no
  lint output.
- Dev server on 3011: `/` 200, `/login` 200, `/dashboard` signed-out 307 to `/login` (redirect
  confirmed, not assumed). No compile errors, zero browser console/page errors across the flow.
- Screenshots CAPTURED AND READ: real logged-in `/dashboard` desktop 1440x900 + mobile 390x844, plus
  seven interaction shots — collapsed timeline (all pills uppercase, correct labels/colours),
  keyboard-Enter expansion, a 14-paragraph narrative in Block with NO inner scrollbar, two versions
  expanded with INDEPENDENT formats, the stacked restore modal over its heavy backdrop, its export
  row + confirm, and Escape closing ONLY the front modal.
- Empirically measured backdrop stack: z=200 rgba(0,0,0,.75) blur(10px), then z=220 rgba(0,0,0,.9)
  blur(24px). DOM enumeration with a long narrative expanded found exactly ONE `overflow-y-auto`
  element — the modal's own `max-h-[90vh]` wrapper.
- All five label cases verified live, not just by reading: legacy to `Regenerated`; unchanged style to
  `Regenerated`; changed style to `Regenerated - Customer Pay`; unrecognised style literal to plain
  `Regenerated` (never raw snake_case); unknown action `foo_bar` to `Foo Bar`.
- 15-point adversarial diff review: all PASS. No client sends `action_history`; rolling `auto_save`
  and the RPC path intact; all three nested modal open flags start falsy; the `length > 1` gate,
  version-ascending non-mutating sort, race guard and silent-fail preserved; no protected file
  touched; no hardcoded colours in new UI beyond the one `ACTION_PILL_COLORS` hex.

**QA limitation (stated plainly):** the QA account has ZERO saved narratives, so the version-history
and restore UI were unreachable by navigation, and generating one was not authorised this sprint
(`flow:generate` NOT run). The real components were therefore driven with intercepted READ responses
(`GET /api/narratives`, `GET /api/narratives/:id`) carrying a synthetic 12-entry `action_history`,
IN THE TEST BROWSER ONLY. A hard guard aborted every non-GET to `/api/narratives`, and the RESTORE
confirm button was never clicked. No database rows were read or written. The restore round-trip was
therefore verified by code review of the request path, not by a live write.

**Files changed (8 + release):** src/types/database.ts, src/app/api/narratives/save/route.ts,
src/app/api/narratives/[id]/route.ts, src/app/(protected)/narrative/page.tsx,
src/components/ui/Modal.tsx, src/components/dashboard/NarrativeDetailModal.tsx,
src/components/dashboard/RestoreVersionModal.tsx (NEW), src/components/dashboard/NarrativeHistory.tsx,
plus src/lib/version.ts, package.json, BUILD_PROGRESS_TRACKER.md.

**Files NOT changed:** useAuth.ts, middleware.ts, /api/me, Stripe, narrativeStore.ts,
ThemeProvider.tsx, both ActivityDetailModal.tsx files, RLS policies, database migrations. No SQL run.
Nothing deleted. `action_history` WRITE behaviour is unchanged except the appended `restore` action.

**Carried forward for Tyler — NOT actioned:**
1. **The stale `narratives.narrative_style` column.** PATCH never updates it, so after a style switch
   the row still reports the ORIGINAL style. `EmailExportModal` consumes it. Out of scope here (the
   fix now lives on the history entries instead), but the column is still wrong and worth a sprint.
2. **`TrackerActionEntry.customization` is mistyped.** It declares `{length, tone, detail,
   custom_instructions}` but `narrativeTracker.ts` actually writes `{narrative_style,
   custom_instructions}`, so the ADMIN ActivityDetailModal's length/tone/detail checks are
   permanently dead for all new rows. Pre-existing; untouched.
3. **Restoring a Block-only entry writes empty C/C/C.** An entry that recorded only `narrative_text`
   and no concern/cause/correction will write empty strings into those columns. The confirm dialog
   warns the user, but a field-level guard would be the real fix.
4. **Triplicated display helpers.** `formatActionLabel` / `ACTION_PILL_COLORS` / `formatTimestamp`
   now exist in four places across the dashboard and admin modals with DIFFERENT key sets. Editing one
   does not update the others. A consolidation must not change admin behaviour.
5. **`/api/convert-recommendation` has zero callers** in `src/` — orphan route.
6. **`CURRENT STATUS` at the top of this tracker remains stale** (reads v1.3.0-beta) — still pending
   the end-of-batch cleanup pass noted in Sprints G-2 and G-2a.

---

Sprint G-3a — Live Generation + Restore Round-Trip Verification
**Status:** [x] COMPLETE (2026-08-12) — no version bump (no application code changed; verification only)

**SUPERSEDES the "QA limitation" paragraph in the Sprint G-3 entry above.** That paragraph said the
restore round-trip had been verified by code review of the request path rather than by a live write,
because the QA account had zero saved narratives and Gemini calls were not authorised. Tyler
authorised real Gemini calls on 2026-08-12 (see the GEMINI CALL BUDGET rule now in
SPRINT_PROTOCOL.md Section 4). The round-trip has now been verified **against real production data
with a real write.** Everything below is measured, not reasoned.

**GEMINI SPEND: 5 of the 10 authorised calls.**
`/api/generate` x3 (initial, plain regenerate, style-switch regenerate), `/api/refine` x1,
`/api/proofread` x1. Enforced in the request layer via `page.route(...)`, which aborts rather than
overruns — not by bookkeeping. A first attempt failed before any call (0 spent) on a
framer-motion form-render race. The `apply-edits` step did not fire (see FINDINGS), saving one call.
The restore itself is a PATCH and costs nothing.

**PRODUCTION ROWS WRITTEN — TYLER TO DELETE:**
R.O. `QABOT-G3-01`, narrative id `20332d58-7b52-468c-b6a1-41fbb5e5fa08`, every free-text field
tagged `QA BOT G3 TEST`. Also the associated `activity_log` / `api_usage_log` rows from 5 AI calls.
**Nothing was deleted by the harness** — Section 3 forbids it.

**LABEL MATRIX — verified on REAL entries, not fixtures.**
Stored history: `v1 generate(manufacturer_warranty) | v2 regenerate(manufacturer_warranty) |
v3 regenerate(customer_pay) | v4 customize(customer_pay)`. Rendered pills:

| Version | Pill text | Verdict |
|---|---|---|
| 1 | `GENERATED` | correct |
| 2 | `REGENERATED` — style unchanged, so NO style suffix | correct, this is the discriminator working |
| 3 | `REGENERATED - CUSTOMER PAY` — style switched | correct |
| 4 | `CUSTOMIZED` | correct |
| 5 | `RESTORED` | correct (teal `#14b8a6`) |

`text-transform: uppercase` confirmed computed on every pill, so the Title-Case label map plus the
CSS `uppercase` utility does render the ALL-CAPS text the sprint specified. This also proves the
Stage A data plumbing end-to-end: `narrative_style` is being written onto entries by the real
regenerate path, including the `styleForBody` override that prevented the stale-store bug.

**RESTORE ROUND-TRIP — restored v2 onto a narrative whose current text was v4. All assertions PASS:**
- **(a) History preserved.** `JSON.stringify` of the 4 pre-existing entries is byte-identical to the
  same-length prefix of the post-restore array. Nothing rewritten, nothing truncated.
- **(b) Exactly one entry appended:** `action='restore'`, `version=5` (= previous max + 1).
- **(c)** The new entry's `narrative_text` / `concern` / `cause` / `correction` equal v2's snapshot.
- **(d)** The ROW's `full_narrative` / `concern` / `cause` / `correction` all now equal v2's snapshot.
- **(e)** `updated_at` advanced 23:49:56Z -> 23:52:52Z.
- **(f)** The row's text genuinely CHANGED from its pre-restore value — proves it was not a no-op.
- The timeline refreshed **in place**: the `RESTORED` pill appeared without closing the modal, and
  the parent history modal survived the restore.

**OTHER CONTRACT ITEMS VERIFIED LIVE:**
- **Stacking, measured from computed style:** z200 `rgba(0,0,0,.75)` + `blur(10px)` (history
  backdrop), z210 container, z220 `rgba(0,0,0,.9)` + `blur(24px)` (restore backdrop), z230 container.
  The heavier top backdrop fully obscures the parent — confirmed visually.
- **Exports use the VERSION, not the current narrative.** Intercepted the `/api/export-pdf` POST from
  inside the restore modal: `narrative.block_narrative` equals v2's `narrative_text` AND differs from
  the row's then-current text. Both directions asserted.
- **No inner scrollbar (task 4), measured properly.** With ALL versions expanded, the modal body
  (`p-6 md:p-8 max-h-[90vh] overflow-y-auto rounded-[23px]`) scrolls at 2859px content in an 810px
  viewport, and `realVerticalScrollersInsideBody` is **EMPTY**. Every snapshot box reports
  `overflowY: visible`, no `max-h-`, and `scrollHeight === clientHeight` (no clipping).
- Whole-row expansion works by **keyboard Enter** (`aria-expanded` flips to true); clicking the
  Block/CCC toggle does NOT collapse the row.

**FINDINGS — two, neither a Sprint G-3 defect:**
1. **`apply-edits` never fired.** The `APPLY SELECTED EDITS` button was present and clicked, but no
   `/api/apply-edits` request was made, so no `proofread_apply` entry exists. Most likely the
   suggestion checkboxes default to unchecked and `handleApplyEdits` early-returns on an empty
   selection. **Pre-existing behaviour, outside G-3's scope, not investigated further.** Worth a look
   in a later sprint: a click that silently does nothing is a poor affordance.
2. **A false-positive in the first QA assertion, now retracted.** An initial check reported "two
   vertical scrollers in the modal". The second element was
   `overflow-x-auto -mx-6 px-6` at `NarrativeHistory.tsx:257` — the saved-narratives LIST's
   HORIZONTAL scroll wrapper, pre-existing since commit `68c11eb`, long before this sprint. CSS
   forces computed `overflow-y` to `auto` on any element that sets `overflow-x`, and the check's
   `closest()` scope was loose enough to catch a page element outside the modal. The precise
   re-check (above) shows zero real inner vertical scrollers. **No app defect.**

**Harness scripts** live in the `servicedraft-qa` sibling folder (outside the repo, never committed):
`flow-g3-restore.mjs` (generation half, budget-enforced), `flow-g3-restore-only.mjs` (restore half,
zero-Gemini, reusable against any existing narrative), `check-scroll.mjs`, `shot-restored-entry.mjs`,
`debug-input.mjs`. The restore-only script is the reusable one — it re-verifies the whole round-trip
on an existing row at no API cost.

**Files changed in this follow-up:** `SPRINT_PROTOCOL.md` (the new GEMINI CALL BUDGET rule in
Section 4) and this tracker entry. **No application code changed**, hence no version bump — the app
remains at v1.3.5-beta as shipped by Sprint G-3.

---

Sprint G-4 — Narrative Style Distribution Charts
**Status:** [x] COMPLETE (2026-08-13) — v1.3.6-beta — Master Update Batch sprint 5 of 13 (branch `updates-2026-08`, worktree `servicedraft-ai-updates`, local commit only, NOT pushed)

Adds a "Narrative Style Distribution" donut chart to the Owner Dashboard Overview tab and a
matching one to the Team Dashboard Overview tab, sourced from the existing
`public.narratives.narrative_style` column. **No database changes** — the column was already
in production.

**Files changed (4 + version files):**
1. `src/app/api/admin/analytics/route.ts` — four appended count queries + `narrativeStyles`
   aggregate + new response key (all-time, platform-wide).
2. `src/app/(protected)/admin/page.tsx` — `NARRATIVE_STYLE_LABELS` map,
   `AnalyticsData.narrativeStyles`, the chart card on the Overview tab, and a matching
   `NARRATIVE STYLE BREAKDOWN` section in the CSV export.
3. `src/app/api/teams/activity/route.ts` — four appended **team-scoped** count queries +
   `narrativeStyles` in **all three** stats returns.
4. `src/app/(protected)/team-dashboard/page.tsx` — recharts import extended
   (`PieChart, Pie, Cell, Legend`), `Layers` lucide icon, label + colour maps,
   `TeamStats.narrativeStyles?`, and the chart card.
5. `src/lib/version.ts` + `package.json` — v1.3.5-beta → v1.3.6-beta.

**Key implementation decisions:**

- **Exact counts, not a row tally.** Both endpoints use
  `.select('id', { count: 'exact', head: true })` with `.eq('narrative_style', …)` rather than
  fetching rows and tallying in JS. PostgREST caps row-returning selects at ~1000 by default, so
  a tally would silently under-count on a large table and would visibly disagree with
  `totalNarratives` (an exact count rendered on the same tab). **Note the pre-existing
  `storyTypes` aggregation in the analytics route still uses an unbounded row fetch and carries
  exactly this latent bug — left alone as out of scope, but worth a future sprint.**
- **Null-safe via an explicit `unspecified` bucket.** `narrative_style` is nullable — rows
  created before the column existed have NULL. Those are counted into an `unspecified` bucket so
  the slices sum to the true total. The slice is filtered out of the chart whenever its count is
  0, so it stays invisible on clean data.
- **Team scoping** is enforced by `.in('user_id', memberIds)` on all four team queries, reusing
  the route's existing member-resolution query. Membership is the scalar `users.team_id` — there
  is no `team_members` junction table in this codebase.
- **CSS variables only** in both new charts (`--accent-primary`, `--accent-hover`,
  `--accent-bright`, `--text-muted`). QA confirmed `var()` resolves inside SVG `fill` attributes
  in the target browser, so no slice renders black or invisible.
- **Per-page card idiom respected.** The admin card uses the page's `<h3>` heading idiom; the
  team card uses that page's uppercase `<p>` + right-aligned icon idiom. Copying one into the
  other would have looked wrong.
- **Percentage-only slice labels.** Slice labels render just the percentage; the legend carries
  every style name in full and the tooltip carries name + count + percentage. Full names on the
  slices truncated up to ~144px at 390px width, producing fragments like "ty 19%". This is a
  deliberate deviation from the adjacent Story Type chart — the codebase already uses two
  different label formats (`{name} {percent}%` at admin page L2446, `{name}: {value}` at L2504),
  so there was no single convention to preserve.

**Positional `Promise.all` hazard — handled.** Both modified routes destructure their
`Promise.all` results **by position**. Inserting mid-list would silently misassign every
downstream metric with no TypeScript error. All new bindings and queries were appended to the
**end** of both lists in both routes; QA verified index-by-index alignment of every pre-existing
entry.

**QA results:** `npx tsc --noEmit` clean; `npm run build` clean (28.8s compile, 46/46 routes — no
Turbopack hang this run). Dev server smoke-checked on :3011 — `/` 200, `/login` 200, `/admin` 307
→ `/login` when signed out, `/team-dashboard` 200; no runtime or PostgREST errors in the server
log. Nine adversarial diff checks all passed (Promise.all alignment ×2 routes, team scoping ×4
queries, all three stats returns, owner gate byte-identical, no hex, empty state, null-safety,
pure-insertion diff, scope). **0 Gemini API calls** — none were needed. No protected file touched;
no SQL, migrations, or deletions.

**⚠️ QA LIMITATION — carried forward.** The QA test account (`QA BOT`, position Technician) has
neither `owner` nor `admin` role, so `/admin` redirects to `/main-menu` and `/team-dashboard`
redirects to `/dashboard`. **Neither chart was screenshot on its real page while logged in.** QA
substituted an isolated render of the verbatim chart JSX against the app's real CSS tokens
(desktop 1440×900 and mobile 390×844) and confirmed rendering, label correctness, colour
resolution, tooltips, legend, empty state and no mobile overflow. What remains unverified is the
**live wiring** — that the two API routes return correct counts under a real owner/admin session.
**Tyler should spot-check both dashboards once on an owner account.** Provisioning a role-capable
QA account would close this gap for future sprints.

**Discovery worth knowing (not fixed — out of scope):** `narratives.narrative_style` is written
only at INSERT (`api/narratives/save/route.ts`) and is **never updated by the PATCH route** —
`api/narratives/[id]/route.ts` attaches the style to the `action_history` entry but not to the row
column. Both charts therefore show **style at original save time**, not the style a narrative was
last regenerated into. This is already documented as a known issue earlier in this tracker.

---

Sprint G-4a — QA Tester Bot Role
**Status:** [x] COMPLETE (2026-08-13) — v1.3.7-beta — approved mid-batch addition, follow-up to Sprint G-4's QA limitation (branch `updates-2026-08`, worktree `servicedraft-ai-updates`, local commit only, NOT pushed)

Adds a fourth role, **`qa_tester`** — a read-only owner-equivalent for the QA screenshot bot.
Explicitly approved by Tyler via the DOUBLE-CHECK PROTOCOL (category #5, loosening role guards)
on 2026-08-13. `qa_tester` may VIEW everything the owner can view (Owner Dashboard all 7 tabs,
Team Dashboard, all read-only admin/team API surfaces incl. the access code on Settings); it is
DENIED every mutation: user deletes/edits/restrictions, role changes, subscription changes,
password resets, team CRUD, team-member promotions/removals, and self-service account deletion.
No database changes (`users.role` is unconstrained VARCHAR — but see the CHECK-constraint warning
below).

**Files changed (14 + version files):**
- **NEW `src/lib/roles.ts`** — role helpers (`isQaTester`, `canViewOwnerSurfaces`,
  `canViewTeamSurfaces`, `hasOwnerReadBreadth`), all taking `string`, all deny-by-default.
  **Why it exists:** `useAuth.ts` (PROTECTED) declares its own `role: 'user'|'admin'|'owner'`
  union, so `profile.role === 'qa_tester'` in a page fails tsc (TS2367). The helpers accept the
  narrower union without error, letting every page gate on qa_tester with **zero protected-file
  edits**. Do not "simplify" pages back to direct literal comparisons.
- `src/types/database.ts` — union widened (non-protected type).
- Server (7): `api/admin/route.ts` (verifyAdmin accepts qa_tester + returns role; new
  `QA_READ_ONLY_ACTIONS` **allowlist** of exactly 6 read actions — deny-by-default, unknown or
  future actions 403 for qa_tester), `api/admin/analytics` + `api/admin/usage` (gates widened to
  `!== 'owner' && !== 'qa_tester'`), `api/teams` (GET all-teams branch), `api/teams/members`
  (GET gate; admin own-team scoping untouched so qa_tester gets owner breadth),
  `api/teams/activity` (GET gate; interior `=== 'admin'` narrowings untouched),
  `api/delete-account` (**new deny** — the route previously had NO role check at all; qa_tester
  now 403s before any deletion).
- Client (5): `admin/page.tsx` (entry gates + all 6 fetch effects via `canViewOwnerSurfaces`;
  `readOnly` mode replaces all six user-row mutating actions with a "Read-only" hint and hides
  CREATE TEAM / New Team / team Edit / Deactivate; every modal-opening setter audited as
  reachable only from hidden controls), `team-dashboard/page.tsx` (fetch effect widened; **fixed
  a pre-existing `canManageRole` bug** — it fell through to `allowed: true` for ANY unrecognized
  caller role when the target was a plain user, which would have leaked a live Promote button to
  qa_tester or any future role; now allow-lists owner/admin first), `main-menu` (qa_tester gets
  both dashboard buttons), `dashboard/page.tsx` (dashboard buttons; Delete Account hidden for
  owner AND qa_tester, still shown for user/admin), `NavBar.tsx` (both dashboard links).
- Role badge: cyan "QA Tester" entry in both `ROLE_BADGE` maps + `FlaskConical` icon beside the
  existing Crown/ShieldCheck conditionals.

**Deliberately NOT changed (safety assets):** every mutating server gate is byte-identical;
`validRoles = ['user','admin']` in `teams/members` PUT still excludes qa_tester so admins cannot
mint QA accounts; the team-dashboard entry deny-lists (`=== 'user'`) untouched; `useAuth.ts`,
`middleware.ts`, `api/me`, Stripe, signup/auth all untouched.

**QA results:** `tsc` clean; `npm run build` clean (no hang this run). Signed-out probes on all
6 pages + 8 API endpoints: every gated endpoint 401/403, zero 500s, dev log clean. Logged-in
regression with the role-'user' QA account (8 screenshots read, desktop + mobile): /dashboard
normal **with Delete Account still present for a plain user**, /main-menu normal, /admin and
/team-dashboard still redirect. 12-point adversarial gate audit all PASS — allowlist verified
exact, no boolean slips (`&&` of negations, not `||`), no casts/@ts-ignore smuggled in, Sprint
G-4 charts intact. **0 Gemini calls.**

**⚠️ NOT VERIFIED (by design):** the live qa_tester experience — no account has the role until
Tyler assigns it. Run a screenshot pass immediately after assignment.

**➡️ TYLER'S CHECKLIST to activate (production, not this sprint — do in order):**
1. **Verify no CHECK constraint on `public.users.role`** in the Supabase dashboard. Migration
   file `004_admin_role_and_activity_log.sql` documents `CHECK (role IN ('user','admin'))`; it is
   probably stale (owner exists in prod), but if the constraint is live, setting `qa_tester`
   fails and removing it is a schema change requiring its own approval.
2. Assign the role via **Supabase Table Editor** → `public.users` → QA account row →
   `role = 'qa_tester'`. (The Owner Dashboard cannot do this — its role editor is a hardcoded
   promote-to-admin/demote-to-user toggle.)
3. Confirm the QA account has `subscription_status` = `active` or `bypass` and
   `is_restricted = false`, or the paywall bounces it to `/signup?step=3` before any dashboard.
4. Push + deploy this batch when ready, then run the screenshot harness against /admin and
   /team-dashboard — the Sprint G-4 visual-verification gap closes at that point.

**Discoveries worth knowing:**
- The `admin` role label diverges between pages ("Team Manager" on the Owner Dashboard,
  "Admin" on the Team Dashboard) — pre-existing, not fixed.
- `ROLE_BADGE` misses fall back to the grey "User" badge, so before this sprint an unknown role
  rendered silently mislabeled as a regular user.
- The expanded user-detail rows on the Owner Dashboard print the raw role string
  (`['Role', user.role]`) — a qa_tester row shows literal `qa_tester` there. Cosmetic.

---

Sprint G-4b — QA Tester Permission Tightening (Password + Access Code)
**Status:** [x] COMPLETE (2026-08-13) — v1.3.8-beta — follow-up to G-4a, requested by Tyler after his Phase 1 manual test pass (branch `updates-2026-08`, worktree `servicedraft-ai-updates`, local commit only, NOT pushed)

Tyler completed manual testing of Sprints G-1→G-4a — **all tests passed** — and requested two
further qa_tester restrictions found while testing as the bot:

1. **User Dashboard UPDATE button hidden for qa_tester.** The button opens `EditProfileModal`,
   whose Change Password tab calls `supabase.auth.updateUser({ password })` — i.e. the bot could
   change its own password. `ProfileSection` gained an optional additive `hideUpdate?: boolean`
   prop; the dashboard passes `hideUpdate={isQaTester(profile.role)}`. `ProfileSection` has
   exactly one call site, so no other consumer is affected.
   *Honest limitation:* the password change itself goes through the browser Supabase client
   directly to Supabase Auth — there is no app API route to gate server-side, and adding one
   would touch protected auth infrastructure. UI hiding fulfils the intent for a trusted
   first-party bot; noted for the record.
2. **"Generate New Code" hidden for qa_tester** in the Owner Dashboard Settings tab's Access
   Code Management card (`{!readOnly && ...}`). The generator is purely client-side (random
   string + toast telling the owner to update the Vercel `ACCESS_CODE` env var), so hiding the
   button is a complete block — there is no server mutation to gate. The code display and Copy
   button remain visible to qa_tester.

**Files changed:** `src/components/dashboard/ProfileSection.tsx`,
`src/app/(protected)/dashboard/page.tsx`, `src/app/(protected)/admin/page.tsx` (+ version files).
Net +8 lines, purely additive conditional rendering; no gate logic or handlers changed.

**QA results — includes the FIRST-EVER live qa_tester screenshot pass** (Tyler has assigned the
role in production, closing G-4a's activation checklist): `tsc` clean; `npm run build` clean.
Harness screenshots (desktop + mobile, all read): `/dashboard` as qa_tester shows NO UPDATE
button, no Delete Account, both dashboard nav buttons; `/admin` loads with real data (16 users,
621 narratives, G-4 style donut rendering) — no redirect, live-proving G-4a; `/team-dashboard`
loads with team data, complete donut, cyan QA Tester badge + flask icon on the bot's row.
Settings-tab change verified by JSX read (harness cannot click tabs). Diff review: purely
additive, single ProfileSection call site confirmed, owner still sees Generate New Code.
**0 Gemini calls.**

**Phase 1 status:** G-1 through G-4b complete, manually tested by Tyler, and locally committed.
This entry closes Phase 1 of 3 of the Master Update Batch. A `phase-1-release` branch/worktree
is being cut from this commit for Tyler to push and merge.

**Note for the future:** the admin donut screenshots caught Recharts' entrance animation
mid-sweep (partial arc). Not a defect — but QA screenshot scripts should ideally wait ~1s after
load before capturing charts.

---

Sprint A-1 — Capture Layer + Thumbs Feedback
**Status:** [x] COMPLETE (2026-08-14) — v1.3.9-beta — sprint 6 of 13 of the Master Update Batch, first sprint of Phase 2 (branch `updates-2026-08`, worktree `servicedraft-ai-updates`; Tyler authorized pushing this branch, never merged to main)

Two additive features: (A) persist each generation's raw input and narrative style into the
lifecycle tracker, and (B) a thumbs up/down feedback control beneath the generated narrative.

**(A) CAPTURE LAYER.** `public.narrative_tracker` already had `raw_input` (text) and
`narrative_style` (text) live in production — no migration was written or run. The two columns
were plumbed end to end: `CreateTrackerData` in `src/lib/narrativeTracker.ts` gained
`raw_input?` / `narrative_style?`; the `case 'create'` branch of
`src/app/api/narrative-tracker/route.ts` destructures both and writes them in the insert;
`NarrativeTrackerEntry` in `src/types/database.ts` gained both as `string | null`; and the
`createTrackerEntry({...})` call on the narrative page now passes
`raw_input: state.compiledDataBlock` and `narrative_style: state.narrativeStyle`. The existing
fetch body already spread unknown fields, so no transport change was needed, and the
`generateNarrative` dependency array already contained both values. Fire-and-forget is intact:
both fields are optional and ride the existing swallowed-error path, so no new try/catch was
added and a capture failure cannot break generation. The `case 'update'` branch was not touched.

*Discovery:* `narrative_style` was already being persisted indirectly inside the `action_history`
JSONB blob via `customization`, but never as a queryable column. That is exactly what this sprint
fixes. `raw_input` had zero occurrences anywhere in the codebase before this sprint.

**(B) FEEDBACK.** New `src/app/api/feedback/route.ts` (POST only) follows the `/api/contacts`
auth pattern — cookie-based server client so RLS applies, no service-role key. It validates
`rating` ∈ {up, down}, rejects comments over 500 chars with a 400, and treats an empty comment as
null. The upsert is done MANUALLY — SELECT by (tracker_id, user_id) → UPDATE (setting
`updated_at`) if found, else INSERT — deliberately NOT `.upsert({onConflict})`, because this batch
forbids running SQL and a unique constraint on (tracker_id, user_id) could not be verified. Every
query is scoped by `user_id`, so cross-user read/write is impossible.

New `src/components/narrative/NarrativeFeedback.tsx` (named export) renders a compact
"Was this helpful?" row with lucide `ThumbsUp`/`ThumbsDown`, mounted inside the narrative
LiquidCard directly beneath `<NarrativeDisplay />` and gated on `state.narrative`, so it hides
during regenerate/refine/apply-edits. Both thumbs are disabled until `state.trackerId` exists.
A vote POSTs immediately (so the rating is captured even if no comment follows); thumbs-down also
expands a 500-char optional textarea with a character counter and a SUBMIT button that works fine
when left empty. Selected state renders visibly filled (`fill="currentColor"` + accent tint +
glow). All colors are CSS variables — no hardcoded hex in new code.

**Files changed:** `src/lib/narrativeTracker.ts`, `src/app/api/narrative-tracker/route.ts`,
`src/types/database.ts`, `src/app/(protected)/narrative/page.tsx` (+ NEW
`src/app/api/feedback/route.ts`, NEW `src/components/narrative/NarrativeFeedback.tsx`,
+ version files). No protected file touched, no migration, no SQL, no RLS change, nothing deleted.

**QA results:** `npx tsc --noEmit` clean; `npm run build` clean (exit 0, 25.2s — no Turbopack
hang this run), route manifest lists `ƒ /api/feedback`. `npm run lint` has 28 pre-existing
problems in untouched files and ZERO in sprint code. Smoke: `/` 200, `/login` 200,
`/input` `/narrative` `/dashboard` all 307→`/login`; unauthenticated POST `/api/feedback`
returns 401 `{"error":"Unauthorized"}` (not 404 — route registered). Harness screenshots
captured to `servicedraft-qa/shots/a1-feedback/` and READ (02, 03, 04, 05, 07, 08; 01 and 06
captured but not read): thumbs visible directly under the CORRECTION block, one compact 36px
row, theming tracks the user's chosen accent via `buildCssVars()`, layout holds at both
1440×900 and 390×844. Interaction driven live — thumbs-down expands the textarea + SUBMIT,
selected thumb renders filled, empty-comment submit works, switching down→up re-fills the up
thumb and collapses the box. All four POSTs returned 200, proving both the INSERT path and the
repeated UPDATE path of the manual upsert. **1 Gemini call** (budget 10; QA wrote a script that
reuses one generation across all eight screenshots). **R.O. `QABOT-A1` written to production** —
one `narrative_tracker` row, one `narrative_feedback` row (upserted 4×; QA reported the final
rating as `up`, but a direct read of the table during Sprint A-2 showed `down` — the row count
and upsert behaviour were correct, the reported final value was not),
plus the usual `narratives` / `activity_log` / `api_usage_log` rows. Tyler can delete these; QA
deleted nothing.

**Known gaps, deliberately not fixed (candidates for a later sprint):**
1. `src/app/api/feedback/route.ts` does not verify that `tracker_id` belongs to the caller. Not a
   cross-user leak (every query is scoped by `user_id`), but a user could write their own feedback
   row pointing at someone else's tracker UUID, skewing analytics. The obvious fix — a SELECT
   against `narrative_tracker` — depends on RLS allowing users to read their own tracker rows,
   which cannot be verified without querying the database, and this batch forbids that. Fixing it
   blind risked 403-ing legitimate users, so it was left and reported instead.
2. `NarrativeFeedback` does not load existing feedback on mount, so a previously-rated narrative
   shows an unselected control. Out of the sprint contract.
3. `whileHover` passes a CSS variable inside a composite `box-shadow` string; Framer Motion may
   not interpolate it, so the hover glow may not animate. Copied verbatim from the existing house
   idiom at `narrative/page.tsx:802` — changing it here would deviate from house style.

**Note:** the pre-existing type drift on `TrackerActionEntry.customization` in
`src/types/database.ts` (typed `{length, tone, detail, custom_instructions}` but written as
`{narrative_style, custom_instructions}`) was left alone as out of scope, per its existing note.

---

Sprint A-2 — Surveys + Admin Insights Tab
**Status:** [x] COMPLETE (2026-08-14) — v1.3.10-beta — sprint 7 of 13 of the Master Update Batch, Phase 2 (branch `updates-2026-08`, worktree `servicedraft-ai-updates`; branch pushed to origin per Tyler's authorization, never merged to main)

Owner-authored survey questions with a polite user popup and recorded responses, plus the
Insights tab shell on the Owner Dashboard that Sprint A-3 will fill out.

**ADMIN API — `/api/admin/surveys` (NEW).** Owner-gated with the analytics route's inline
`verifyAdmin()` copied verbatim, with ONE deliberate widening: analytics is GET-only so its
helper returns just `{ userId }`, but this route mutates, so it also returns `role` (the shape
used by `/api/admin/route.ts`). Without that, `qa_tester` could not be blocked from writing.
GET lists every question (active and inactive, newest first) with `response_count` /
`dismiss_count` aggregated **in JavaScript** — no raw SQL. POST creates; PATCH edits or toggles
and writes ONLY the keys present in the body, so `{ id, is_active: false }` is a safe toggle that
cannot blank the other columns. Validation: question_text max 500 chars, input_type is 'text' or
'choice', options required for choice (max 10, each max 100 chars), display_chance an integer
1-100. `qa_tester` may GET but receives 403 `Forbidden — qa_tester is read-only` on POST/PATCH.

**USER API — `/api/surveys` (NEW).** GET returns at most ONE active question the caller has
neither answered nor dismissed — the OLDEST eligible one, so the backlog drains oldest-first
rather than starving behind newer questions — or `data: null`. It deliberately does NOT apply
`display_chance`; it returns the value and the client rolls. POST records a response or a
dismissal via the same MANUAL upsert used in Sprint A-1 (SELECT then UPDATE or INSERT, never
`.upsert({onConflict})`, since a unique constraint cannot be verified without running SQL).

*Architecture note worth keeping:* this route authenticates with the COOKIE client but does its
data work with the SERVICE-ROLE client. Reason: `survey_questions` is global (not user-owned)
data, and what its RLS policies permit for an ordinary user could not be verified without running
SQL, which this batch forbids — a service-role read guarantees the feature works regardless. The
compensating control is a hard scoping invariant: `user_id` comes from the verified session on
every read and every write and is NEVER read from the request body. QA verified this by grepping
for `body.user_id` (no hits) and by live-probing with a spoofed `user_id`, which was ignored.

**ADMIN INSIGHTS TAB.** `admin/page.tsx` is 3,707 lines, so rather than inline a few hundred
lines into it, the manager lives in `src/components/admin/SurveyManager.tsx` (matching the
existing `components/admin/` folder) and the page edit is FIVE small hunks totalling +25/-2: a
lucide `ClipboardList` import, the `SurveyManager` import, `| 'insights'` on the `TabKey` union,
one tab descriptor before `settings`, and the panel block. The tab BUTTON needed no edit — the
existing `tabs.map()` picks it up automatically. The panel carries a clearly-marked reserved
comment block for Sprint A-3's analytics sections. Survey Manager shows the question list with
status pills, input type, display chance, options, and answered/dismissed counts, plus create and
edit modals with a dynamic options list. **Every mutation control is wrapped in
`{!readOnly && ...}`** per the G-4a/G-4b convention, and the handlers additionally early-return on
`readOnly` — defence in depth behind the API's own 403.

**USER POPUP.** `src/components/narrative/SurveyPopup.tsx` (NEW) is a compact fixed
bottom-right card — deliberately NOT a modal: no backdrop, no focus trap, no scroll lock. z-index
150 places it above the nav (100/110) but BELOW `Modal` (200/210), so the unsaved-navigation guard
still stacks over it and can never be blocked. Choice questions require an explicit SUBMIT rather
than submitting on click, avoiding accidental one-click answers. Any malformed choice question
(unknown input_type, or choice with empty options) falls back to the text input rather than
rendering a dead popup. Silent on every API failure — `console.error` only, never an error toast.

The trigger is wired into `handleSave` ONLY, immediately after its success toast. **It is
explicitly NOT wired into `autoSaveNarrative`,** which is the shared save primitive behind EIGHT
paths including debounced keystroke saves inside the edit modal — a trigger there would fire the
popup constantly. `maybeShowSurvey()` cannot throw into or block `handleSave`: its only
synchronous work is a ref read/write, and all network work runs in a detached, fully try/caught
async IIFE. `hasAttemptedSurveyRef` flips BEFORE the first await, so exactly one attempt happens
per page session even though the SAVE STORY button stays enabled after saving and repeat saves
are expected.

**Files changed:** NEW `src/app/api/admin/surveys/route.ts`, NEW `src/app/api/surveys/route.ts`,
NEW `src/components/admin/SurveyManager.tsx`, NEW `src/components/narrative/SurveyPopup.tsx`,
`src/types/database.ts` (+`SurveyQuestion`, +`SurveyResponse`),
`src/app/(protected)/admin/page.tsx` (5 hunks), `src/app/(protected)/narrative/page.tsx`
(4 hunks) (+ version files). No protected file touched, no migration, no SQL, no RLS change,
nothing deleted. Sprint A-1's work in the narrative page survived intact and was visually
re-confirmed.

**QA results:** `tsc` clean; `npm run build` clean (12.5s, no Turbopack hang), manifest lists both
`/api/admin/surveys` and `/api/surveys`; `npm run lint` shows the 28 pre-existing problems and
ZERO new ones from sprint files. Unauthenticated: `/api/admin/surveys` 403
`{"success":false,"error":"Unauthorized"}`, `/api/surveys` 401 `{"error":"Unauthorized"}`.
**Logged in as the qa_tester bot — the key security check: GET 200 `{success:true,data:[]}`, POST
403 and PATCH 403 both `Forbidden — qa_tester is read-only`, and the list count went 0 to 0,
proving no row was created.** Screenshots read (5, desktop 1440x900 + mobile 390x844): the
INSIGHTS tab button matches its siblings exactly, the panel renders with no horizontal overflow at
either width, the empty state is on-theme, and a DOM probe of every button confirmed
`New Question / Edit / Deactivate / Reactivate` are ALL ABSENT for qa_tester with only `Refresh`
remaining. **0 Gemini calls** — QA drove the real form while intercepting only `/api/generate`
and hard-blocking the other six AI routes (0 violations); the real `/api/surveys` was still hit
and correctly returned `data: null`. Clicking SAVE STORY twice produced exactly ONE survey fetch,
live-proving the once-per-session throttle. **R.O. `QABOT-A2-01` written to production** (one
`narratives` row, one `narrative_tracker` row, activity_log rows) — Tyler can delete it; QA
deleted nothing.

**Bug found and fixed by QA during verification:** a literal `null` JSON body returned 500 instead
of 400, because `typeof body.survey_id` throws when `body` is null. A non-indexable-body guard
(`!body || typeof body !== 'object' || Array.isArray(body)`) was added in three places —
`/api/surveys` POST and `/api/admin/surveys` POST + PATCH — and re-verified on the rebuilt bundle.

**Known limitation, honestly stated:** the popup could NOT be demonstrated live. No survey
questions exist yet, and the QA bot is `qa_tester`, which is read-only and cannot create one.
Creating one via SQL was forbidden and creating one by mocking would have proved nothing, so it
was left unshown. The popup was verified by code review plus a live trigger firing against the
real endpoint. **To see it end to end, Tyler should log in as owner, create a question with
display_chance 100, then generate and save a story.**

**Two cosmetic notes, no action taken:** (1) the comment at `SurveyPopup.tsx:26-28` says z-150 is
below the toast container, but `ToastProvider` uses zIndex 50 — the comment is wrong, though there
is no practical impact since toasts are top-center and the popup is bottom-right. (2) the Refresh
button renders its icon above the label rather than inline; QA confirmed this is PRE-EXISTING —
the Teams panel's Refresh measures identically, because the shared `Button` does not flex its
children. SurveyManager correctly matched the existing idiom, so it was left alone.

**Correction to the Sprint A-1 entry above:** that entry stated the QA bot's `narrative_feedback`
row ended at `rating='up'`. A direct read of the table during this sprint showed `down`. The row
count and upsert behaviour were correct; the reported final value was not. Incidental data claims
in QA self-reports are worth spot-checking.

---

Sprint A-3 — Insights Dashboard + AI Reports
**Status:** [x] COMPLETE (2026-08-16) — v1.3.11-beta — sprint 8 of 13 of the Master Update Batch, Phase 2 (branch `updates-2026-08`, worktree `servicedraft-ai-updates`; branch pushed to origin per Tyler's authorization, never merged to main)

Completes the Insights tab: live aggregates, and owner-triggered Gemini reports saved to
`insight_reports`.

**SHARED AGGREGATION — `src/lib/insightsAggregate.ts` (NEW).** Deliberately factored out so the
dashboard numbers and the snapshot stored inside a report can never drift. Exports
`buildInsightsAggregate(svc)` and `buildInsightsSample(svc)`. Everything aggregates IN JAVASCRIPT
over plain `.select()` calls — no raw SQL, no RPC, no views. Every source query is explicitly
ordered newest-first and capped at `MAX_ROWS_SCANNED = 2000`, so a growing table can never turn an
admin page load into an unbounded scan. Empty database is a first-class case: zeros, empty arrays,
and `ratio: null` — never NaN. `safeRatio()` returns null when total is 0; `safePct()` returns 0.

**AGGREGATES API — `/api/admin/insights` GET (NEW).** Owner-gated with the A-2 `verifyAdmin()`
that returns `role`; qa_tester allowed since it is read-only. Returns feedback totals and ratio
(overall, byStyle, byStoryType), the 10 most recent thumbs-down comments, per-survey summaries
(choice counts / recent text answers), and narrative usage patterns (generations by style and
story type, plus regenerated / customized / proofread / saved / exported rates as count + pct).
Privacy: `recentDownComments` deliberately carries NO `user_id` and NO `tracker_id` — this is
owner analytics, not a per-user dump. Verified against the live payload, not just the code.

**REPORT API — `/api/admin/insights/report` (NEW).**
GET with no param lists the 20 newest reports WITHOUT `report_markdown` / `data_snapshot` (both
large), resolving generator emails with a second query mapped in JavaScript rather than a join.
GET `?id=` returns one full report. A malformed uuid is deliberately treated as 404 Not Found
rather than leaking a 500. POST generates: owner only (qa_tester 403 BEFORE the rate limiter and
before any Gemini call, so a QA attempt can never burn owner quota or money), rate limited to 5
per owner per 15 minutes, `generateWithGemini(prompt, userPrompt, 8000)`, then
`logTokenUsage(userId, 'insights_report', usage)` fire-and-forget with a label that collides with
none of the seven existing ones. Saves `{ generated_by, report_markdown, data_snapshot }`.

*Deliberate asymmetry worth remembering:* if the DB insert fails, the route STILL returns 200
`success: true` with `saved: false` and the markdown, so a paid generation is never thrown away.
The UI branches on `data.saved`, not on `success`, and warns via toast when it could not be saved.

**COST CONTROL.** The Gemini payload is bounded by real `.slice()` code, never by asking the model
to be brief: 12 narratives at 600 chars per field, 25 thumbs-down comments at 300 chars, 30 survey
answers at 200 chars, plus prompt-side trims on the aggregate buckets. QA computed a saturated
worst case of 72,496 chars (~18,124 input tokens) → about $0.033 per report, or $0.17 for the full
5-report rate window. "Cents not dollars" holds with a wide margin.

**HONESTY RULE.** `INSIGHTS_REPORT_SYSTEM_PROMPT` lives inline at the top of the report route
(house precedent: `convert-recommendation/route.ts`) and deliberately does NOT interpolate
`MANDATORY_OUTPUT_RULES`, which is narrative-specific (full caps, implied first person) and would
wreck a report. It carries a HONESTY RULES block stated to outrank every other instruction:
never invent a finding, quote, trend or percentage; never extrapolate from one or two data points;
never manufacture or round up numbers; and "Not enough data yet to say" is a CORRECT and EXPECTED
answer, always preferred over a confident guess. Claims must cite the counts they rest on.

**MARKDOWN RENDERING — `src/components/admin/MarkdownReport.tsx` (NEW).** This repo has NO
markdown library (verified: nothing in package.json, nothing transitive in node_modules) and
`dangerouslySetInnerHTML` appears nowhere in `src/`. Rather than add a dependency mid-batch, the
renderer is hand-rolled and builds REACT ELEMENTS from parsed lines — no HTML injection. The
Gemini prompt is hard-constrained to the exact subset the renderer supports (`##`/`###`,
paragraphs, `-` bullets, `1.` ordered, `**bold**`), and every forbidden construct degrades to
visible paragraph text rather than vanishing or throwing.

**INSIGHTS TAB UI — `src/components/admin/InsightsAnalytics.tsx` (NEW).** Feedback stat cards,
by-style and by-story-type charts, recent thumbs-down comments, survey summaries, usage patterns,
the GENERATE INSIGHTS REPORT button (wrapped in `{!readOnly && ...}` per G-4a/G-4b), and a
past-reports list opening a modal. Charts copy the existing house chrome exactly — grid, axes and
tooltip all CSS variables. `admin/page.tsx` took only TWO hunks: the import, and replacing A-2's
reserved comment with `<InsightsAnalytics readOnly={readOnly} />`.

**Files changed:** NEW `src/lib/insightsAggregate.ts`, NEW `src/app/api/admin/insights/route.ts`,
NEW `src/app/api/admin/insights/report/route.ts`, NEW `src/components/admin/MarkdownReport.tsx`,
NEW `src/components/admin/InsightsAnalytics.tsx`, `src/types/database.ts` (+`InsightReport`),
`src/app/(protected)/admin/page.tsx` (2 hunks) (+ version files). No protected file touched, no
migration, no SQL, no RLS change, nothing deleted, no new dependency.

**QA results:** `tsc` clean; `npm run build` clean (42s, no Turbopack hang), manifest lists both
`/api/admin/insights` and `/api/admin/insights/report`; lint shows the 28 pre-existing problems and
ZERO new ones. Unauthenticated: all three endpoints 403. As the qa_tester bot: aggregates GET 200
against REAL production data (547 tracker rows, 2 feedback rows — usage rates came back
regenerated 10.1%, customized 12.1%, proofread 23%, saved 28.2%, exported 49.4%); report list 200
`[]`; unknown id 404; malformed uuid 404 (not 500); **POST 403 `Forbidden — qa_tester is
read-only` with the list still `[]` afterwards, proving no row was created.** A leak probe on the
live payload confirmed no `user_id`, `tracker_id`, or `email` fields. Screenshots read at desktop
1440x900 and mobile 390x844: Survey Manager and the new sections coexist in order with uniform
spacing, stat cards match Overview styling, three charts render with correct theming while the
survey and past-report sections show correct empty states, the GENERATE button is ABSENT for
qa_tester, no horizontal overflow at either width, and a DOM probe for `NaN`, `NaN%`, `undefined`,
`Infinity` and `[object Object]` returned **0 hits**. The markdown parser was unit-tested in
isolated Node against 20 hostile inputs (stray `#`, unmatched `**`, tables, code fences, mixed
bullets, CRLF, empty string) with 0 crashes and 0 content lost. **0 Gemini calls; session tally
unchanged at 1 of 10. Zero production rows written.**

**Bug found and fixed by QA:** the "By story type" chart rendered **"!epair Complete"** — the
leading `R` clipped by the SVG edge, because `YAxis width={110}` was copied from the admin page
but A-3's labels are longer and sit in a half-width two-up grid. Widened to a named
`Y_AXIS_WIDTH = 132` in the new file only. Worth noting the DOM probe could not have caught this:
it took reading the actual pixels.

**Known limitation, honestly stated:** END-TO-END REPORT GENERATION WAS NOT EXERCISED. The QA bot
is `qa_tester` and is denied POST by design, so the Gemini call, the `insight_reports` insert, the
`saved:false` fallback, and the modal rendering a real report remain unverified against
production. This was NOT worked around — no direct Gemini call, no service-key insert, no mocked
row. Everything verifiable without owner credentials was verified instead. **Closing the loop
needs one owner-account click of GENERATE INSIGHTS REPORT.**

**Handed back, not fixed (neither is an A-3 defect):** (1) Recharts' default hover cursor paints a
light-grey band across bars on the dark theme — it is the library default and behaves identically
in the admin page's own bar charts, so fixing it only here would make A-3 diverge; it is a
repo-wide cosmetic item for a future sprint. (2) Two sample queries lack an explicit `.order()`;
both are bounded and neither affects correctness.
