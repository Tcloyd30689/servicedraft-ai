/**
 * Role helpers — single source of truth for the qa_tester role's permissions.
 *
 * The app has a 4-role hierarchy: 'owner' | 'admin' | 'user' | 'qa_tester'.
 *
 * 'qa_tester' is a READ-ONLY owner-equivalent used by the QA screenshot bot:
 * it may VIEW everything the owner can view (Owner Dashboard, Team Dashboard,
 * all read-only admin/team endpoints) but is DENIED every mutation — deletes,
 * user edits, role changes, restrictions, subscription changes, team CRUD and
 * team-member actions. Approved by Tyler 2026-08-13 (Sprint G-4a).
 *
 * WHY THESE HELPERS EXIST (do not "simplify" them away):
 * `useAuth.ts` (a PROTECTED file) declares its own `role: 'user'|'admin'|'owner'`
 * union, so comparing `profile.role === 'qa_tester'` in a component fails
 * TypeScript with TS2367. These helpers take `string`, which the narrower
 * union assigns to without error — letting every page gate on qa_tester
 * without touching the protected auth hook.
 *
 * DENY-BY-DEFAULT: helpers answer "is this role explicitly allowed?" —
 * an unknown/future role always falls through to false.
 */

export type AppRole = 'user' | 'admin' | 'owner' | 'qa_tester';

/** True only for the QA bot role. */
export function isQaTester(role: string | null | undefined): boolean {
  return role === 'qa_tester';
}

/** Roles allowed to VIEW owner-level surfaces (Owner Dashboard + owner APIs). */
export function canViewOwnerSurfaces(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'qa_tester';
}

/** Roles allowed to VIEW team-level surfaces (Team Dashboard + team read APIs). */
export function canViewTeamSurfaces(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'qa_tester';
}

/**
 * Roles treated with OWNER-LIKE BREADTH on team read endpoints
 * (may pass an arbitrary ?team_id= instead of being scoped to their own team).
 * qa_tester is included so the QA bot can inspect any team read-only.
 */
export function hasOwnerReadBreadth(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'qa_tester';
}
