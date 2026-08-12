/**
 * Formats a user's name as "F. Lastname" — first initial, period, last name.
 * Shared by the PDF / DOCX / Print document headers and the email export so
 * every surface renders the sender's name identically.
 *
 * Names are stored uppercase by the profile editor, so only the initial is
 * force-uppercased — the last name is passed through exactly as stored.
 */
export function formatUserName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const first = (firstName ?? '').trim();
  const last = (lastName ?? '').trim();

  if (first && last) return `${first.charAt(0).toUpperCase()}. ${last}`;
  if (last) return last;
  if (first) return first;
  return '';
}
