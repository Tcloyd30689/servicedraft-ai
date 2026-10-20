# Owner Sign-Up Notification Email

**Status:** Reference copy only. Unlike `confirm-signup.html`, this email is NOT
pasted into the Supabase dashboard. It is rendered by application code in
`src/lib/signupNotify.ts` and sent through Resend. Edit the code, then update
this file so the record stays in sync.

## When it fires

| Kind      | Trigger                                                                                  | Caller                                           |
|-----------|------------------------------------------------------------------------------------------|--------------------------------------------------|
| `attempt` | Signup page successfully requests a verification code (`signInWithOtp`)                  | `POST /api/signup/notify-attempt` (no auth)      |
| `created` | `POST /api/signup/complete-profile` saves the profile and is about to return `success`   | `src/app/api/signup/complete-profile/route.ts`   |

Both calls are fire-and-forget (`void promise.catch(() => {})`). A delivery
failure, a missing `RESEND_API_KEY`, or a Supabase error is logged on the server
and never changes a signup response, status code, redirect, or UX step.

## Recipients

`NOTIFY_ROLES` in `src/lib/signupNotify.ts` is `['owner']`. Every row in
`public.users` whose `role` is in that list and whose `email` is non-null
receives one email (all recipients in a single `to`, deduped and lowercased).
Adding `'admin'` to that array is the intended one-line expansion.

No approval flow exists. The footer says so.

## Envelope

- **From:** `ServiceDraft.AI <noreply@servicedraft.ai>`
- **Subject (attempt):** `[ServiceDraft.AI] New sign-up attempt - {email}`
- **Subject (created):** `[ServiceDraft.AI] New account created - {email}`

## Body fields

Rendered as label/value rows inside the standard dark card (same palette and
layout as `confirm-signup.html`: `#0a0a0f` page, `#12121a` card, 12px radius,
`rgba(255,255,255,0.08)` dividers). Rows with no value are omitted.

1. Event — "Sign-up attempt (verification code requested)" or "Account created (profile completed)"
2. Email
3. Name — first + last, when known (`created` only in practice)
4. Position — when known
5. User ID — when known
6. Time (US Eastern) — e.g. `Oct 20, 2026, 02:14:09 PM EDT`
7. IP address — from `x-forwarded-for` (first hop) or `x-real-ip`, when present
8. User agent — when present

Footer: "No action is required. You are receiving this because your account
holds a notification role for ServiceDraft.AI sign-up activity."

## Plain-text alternative

```
SERVICEDRAFT.AI — New account created

A new user finished setting up their ServiceDraft.AI account.

Event: Account created (profile completed)
Email: tech@example.com
Name: JANE DOE
Position: Technician
User ID: 00000000-0000-0000-0000-000000000000
Time (US Eastern): Oct 20, 2026, 02:14:09 PM EDT
IP address: 203.0.113.7
User agent: Mozilla/5.0 ...

No action is required. You are receiving this because your account holds a notification role for ServiceDraft.AI sign-up activity.
```

## Abuse controls on the public route

`POST /api/signup/notify-attempt` validates the email format (400 otherwise)
and rate-limits to 5 requests per 15 minutes per IP via `src/lib/rateLimit.ts`
(429 when exceeded). It otherwise always answers `200 {"ok":true}` immediately,
so nothing about recipients or delivery leaks to the caller.
