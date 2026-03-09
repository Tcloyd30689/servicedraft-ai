# SERVICEDRAFT.AI — DEPLOYMENT NOTES

**Last Updated:** 2026-03-09
**Deployment Target:** Vercel
**Framework:** Next.js 16.1.6 (App Router, Turbopack)

---

## REQUIRED ENVIRONMENT VARIABLES

Configure ALL of the following in Vercel > Project Settings > Environment Variables:

### Required (app will not function without these)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key (safe for client) | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, admin operations) | `eyJhbG...` |
| `GEMINI_API_KEY` | Google Generative AI API key (Gemini 2.0 Flash) | `AIzaSy...` |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) | `sk_live_...` or `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe for client) | `pk_live_...` or `pk_test_...` |

### Required for full functionality

| Variable | Description | Example |
|----------|-------------|---------|
| `ACCESS_CODE` | Beta access code for signup bypass | Any string (e.g., `SERVICEDRAFT2026`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL for Stripe redirects | `https://your-domain.vercel.app` |
| `RESEND_API_KEY` | Resend email service API key (for email exports) | `re_xxxx...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRICE_ID` | Stripe subscription price ID | `price_...` |

---

## SUPABASE CONFIGURATION

### Required Tables

The app uses the following Supabase tables. Verify RLS is enabled on ALL:

1. **`users`** — User profiles (id, email, full_name, role, subscription_status, stripe_customer_id, is_restricted, accent_color, created_at)
2. **`narratives`** — Saved narratives (id, user_id, ro_number, concern, cause, correction, block_narrative, story_type, vehicle info, created_at, updated_at)
3. **`activity_log`** — User activity tracking (id, user_id, action, metadata, created_at)
4. **`saved_repairs`** — Saved repair templates (id, user_id, story_type, codes_present, diagnostics_performed, root_cause, repair_performed, repair_verification, created_at, updated_at)

### RLS Policies Required

All tables must have RLS enabled. Verify these policies exist:

**`users` table:**
- SELECT: Users can read own profile (`auth.uid() = id`)
- UPDATE: Users can update own profile (`auth.uid() = id`)
- INSERT: Users can create own profile (`auth.uid() = id`)

**`narratives` table:**
- SELECT: Users can read own narratives (`auth.uid() = user_id`)
- INSERT: Users can create narratives (`auth.uid() = user_id`)
- UPDATE: Users can update own narratives (`auth.uid() = user_id`)
- DELETE: Users can delete own narratives (`auth.uid() = user_id`)

**`activity_log` table:**
- INSERT: Users can insert own activity (`auth.uid() = user_id`)
- SELECT: Users can read own activity (`auth.uid() = user_id`)

**`saved_repairs` table:**
- SELECT: Users can read own repairs (`auth.uid() = user_id`)
- INSERT: Users can create repairs (`auth.uid() = user_id`)
- UPDATE: Users can update own repairs (`auth.uid() = user_id`)
- DELETE: Users can delete own repairs (`auth.uid() = user_id`)

### Supabase Auth Configuration

- **Site URL:** Set to your production URL (e.g., `https://your-domain.vercel.app`)
- **Redirect URLs:** Add:
  - `https://your-domain.vercel.app/auth/callback`
  - `https://your-domain.vercel.app/login`
  - `https://your-domain.vercel.app/signup`

---

## STRIPE CONFIGURATION

### Webhook Setup

1. In Stripe Dashboard > Developers > Webhooks, add endpoint:
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
2. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Product/Price Setup

1. Create a subscription product in Stripe Dashboard
2. Copy the Price ID to `STRIPE_PRICE_ID`

---

## EXTERNAL SERVICE URLS

| Service | Configuration Needed |
|---------|---------------------|
| **Supabase Auth** | Set Site URL and Redirect URLs in Authentication > URL Configuration |
| **Stripe Webhooks** | Add webhook endpoint URL pointing to `/api/stripe/webhook` |
| **Resend Email** | Verify sending domain in Resend dashboard; app sends from `noreply@servicedraft.ai` |
| **Google Gemini** | Ensure Gemini API is enabled in Google Cloud Console for the API key project |

---

## SECURITY MEASURES IN PLACE

- All API routes require authentication (Supabase session)
- Stripe webhook uses signature verification
- Service role key never exposed to client-side code
- Rate limiting on /api/generate (20 requests per 15 minutes per user)
- Input length limits on generation endpoint (10,000 chars max)
- CSP headers configured (script-src, connect-src, frame-src locked down)
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff
- Middleware redirects unauthenticated users from protected pages
- Access code read from environment variable, not hardcoded

---

## KNOWN LIMITATIONS (BETA)

1. **Rate limiting is in-memory** — resets on server restart. For production scale, consider Redis-backed rate limiting (e.g., Upstash).
2. **Support form** logs to console.error — does not send email. Consider integrating with Resend or a ticketing system.
3. **Logo images are large** (~2.2MB each, 10 color variants). Next.js Image component optimizes on-the-fly, but consider pre-optimizing source files to reduce build size.
4. **No email confirmation for account deletion** — account is deleted immediately upon request.
5. **Stripe is in test mode** — switch to live keys for production billing.
6. **Middleware deprecation warning** — Next.js 16 shows deprecation notice for `middleware.ts` (recommending `proxy`). This is cosmetic and does not affect functionality.

---

## DEPLOYMENT CHECKLIST

- [ ] All environment variables added to Vercel
- [ ] Supabase RLS policies verified on all tables
- [ ] Supabase Auth redirect URLs configured for production domain
- [ ] Stripe webhook endpoint added for production domain
- [ ] Stripe switched from test to live keys (when ready)
- [ ] DNS configured for custom domain (if applicable)
- [ ] Resend sending domain verified
- [ ] Test: signup flow works end-to-end
- [ ] Test: narrative generation works
- [ ] Test: export (PDF, DOCX, email) works
- [ ] Test: save/load narratives works
- [ ] Test: admin dashboard accessible for admin users only
