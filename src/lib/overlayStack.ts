/**
 * Shared open-overlay stack for every full-screen overlay in the app:
 * `ui/Modal`, `input/MyRepairsPanel`, and `dashboard/ActivityDetailModal`.
 *
 * WHY THIS EXISTS
 * Each overlay used to attach its own document-level `keydown` listener, so one
 * Escape press fired EVERY open overlay's `onClose` at once. Escape inside
 * EmailExportModal on /dashboard also closed the parent NarrativeDetailModal and
 * dropped the user back to the dashboard; the same happened on /input, where
 * EditRepairModal sits on top of MyRepairsPanel. Each overlay also reset
 * `document.body.style.overflow` in its own cleanup, so closing a nested overlay
 * restored page scrolling while its parent was still open.
 *
 * Registering here gives an overlay two things:
 *   - `isTopOverlay(id)`, so only the frontmost overlay reacts to Escape
 *   - a body-scroll-lock refcount, released only when the LAST overlay closes
 *
 * `ui/Modal` additionally uses the depth returned by `registerOverlay` to stack
 * its z-indexes, so a nested modal's backdrop dims the modal beneath it.
 *
 * CALLER CONTRACT — two rules, both about keeping stack order honest:
 *
 * 1. Register from an effect that depends ONLY on the open flag (and the id) —
 *    never one that also depends on `onClose` or another changing callback. A
 *    re-registration pops and re-pushes the overlay, which would move a parent
 *    above its own child and invert the stack.
 *
 * 2. A nested overlay must open STRICTLY AFTER its parent, never in the same
 *    commit. React runs effects bottom-up, so if a parent and its child both
 *    mounted with the open flag already true, the child would register first
 *    and the parent would land on top. Every nested overlay in the app today
 *    satisfies this — `showEmailModal`, `showContactsManager` and
 *    `editingTemplate` all start falsy and are flipped by a later user action.
 *
 * Single-overlay behaviour is unchanged: depth 1 keeps the original z-indexes
 * and still closes on Escape and on a backdrop click.
 */

let stack: string[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Subscribe to stack changes. Paired with `getOverlayDepth` via
 * `useSyncExternalStore` — the same external-store pattern `narrativeStore.ts`
 * uses, and the reason depth is read rather than pushed into React state (a
 * synchronous `setState` inside an effect trips `react-hooks/set-state-in-effect`).
 */
export function subscribeOverlays(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 1-based depth of `id` in the stack, or 0 when it is not registered. */
export function getOverlayDepth(id: string): number {
  return stack.indexOf(id) + 1;
}

/**
 * Push an overlay onto the stack and lock body scroll.
 * Safe to call twice for the same id — React StrictMode double-invokes effects.
 */
export function registerOverlay(id: string): void {
  if (stack.includes(id)) return;

  stack.push(id);
  document.body.style.overflow = 'hidden';
  emit();
}

/**
 * Remove an overlay from the stack, restoring body scroll only once the last
 * overlay has closed. No-op if the id was never registered.
 */
export function unregisterOverlay(id: string): void {
  if (!stack.includes(id)) return;

  stack = stack.filter((entry) => entry !== id);
  if (stack.length === 0) document.body.style.overflow = '';
  emit();
}

/**
 * True when `id` is the frontmost overlay — the only one that should respond to
 * Escape or to a backdrop click.
 */
export function isTopOverlay(id: string): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id;
}
