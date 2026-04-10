/**
 * Single source of truth for the app version number.
 *
 * IMPORTANT: This file is the ONLY place to update the version at runtime.
 * When bumping, also update the "version" field in package.json to match
 * (without the "v" prefix and without the "-beta" suffix).
 *
 * Bump policy: every sprint performs a PATCH bump by default
 * (e.g. 1.0.4 → 1.0.5). Minor/major bumps only when explicitly requested
 * in the sprint prompt. See the "MANDATORY VERSION BUMP RULE" section of
 * CLAUDE_CODE_BUILD_INSTRUCTIONS.md for full rules.
 *
 * This constant is imported by:
 *   - src/components/layout/NavBar.tsx (center version label)
 *   - src/app/api/admin/analytics/route.ts (systemHealth.appVersion)
 *
 * Both display points must always reflect the same value. If either drifts,
 * something is wrong with the import — investigate immediately.
 */
export const APP_VERSION = 'v1.0.5-beta';
