# SERVICEDRAFT.AI — PRE-BUILD SETUP CHECKLIST v2.1

## ✅ STATUS: COMPLETED

> **This checklist was originally completed in February 2026.** All accounts, tools, and connections are established. The app is deployed and live at `servicedraft.ai`. This document is preserved as a **historical reference, onboarding guide, and disaster recovery resource** — if the project ever needs to be set up from scratch on a new machine or by a new contributor, this document has everything needed.

---

## PHASE 1: ACCOUNTS & SERVICES

All required accounts are active and configured.

| # | Service | Purpose | URL | Status |
|---|---------|---------|-----|--------|
| 1 | **GitHub** | Code repository | https://github.com/Tcloyd30689/servicedraft-ai | ✅ Active (Public repo) |
| 2 | **Vercel** | Hosting & CI/CD | https://vercel.com | ✅ Active (connected to GitHub, auto-deploys from `main`) |
| 3 | **Supabase** | PostgreSQL + Auth + RLS | https://supabase.com | ✅ Active (project ID: `ejhcirejshqpctfqeawi`, region: West US) |
| 4 | **Google AI Studio** | Gemini API key | https://aistudio.google.com/apikey | ✅ Active (model: `gemini-3-flash-preview`) |
| 5 | **Stripe** | Payment processing | https://stripe.com | ✅ Active (currently in **test mode** for beta) |
| 6 | **Resend** | Transactional email | https://resend.com | ✅ Active (verified domain: `servicedraft.ai`) |
| 7 | **Cloudflare** | Domain registrar & DNS | https://cloudflare.com | ✅ Active (domain: `servicedraft.ai`) |

---

## PHASE 2: ACCOUNT SETUP INSTRUCTIONS (For New Environment)

If setting up from scratch, follow these in order:

### 2.1 — GitHub
1. Go to https://github.com and create an account (or sign in)
2. The repository already exists at `Tcloyd30689/servicedraft-ai` (Public)
3. If recreating: click "New Repository", name it `servicedraft-ai`, set to Public, no template

### 2.2 — Vercel
1. Go to https://vercel.com and sign up **with your GitHub account** (this connects them)
2. Click "Add New Project" → Import the `servicedraft-ai` repository
3. Framework preset: **Next.js** (auto-detected)
4. Add all environment variables from Phase 5 below before deploying
5. Deploy → Vercel builds from the `main` branch automatically on every push

### 2.3 — Supabase
1. Go to https://supabase.com and create an account
2. Click "New Project" → name it `servicedraft-ai` → select **West US (North California)** region → set a database password
3. Once created, go to **Settings → API** and note these three values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (the short one — safe to expose in frontend)
   - **service_role** key (the long one — **NEVER expose in frontend**, server-side only)
4. **CRITICAL: When copying the service_role key**, be extremely careful not to accidentally include surrounding UI text (e.g., "you" from the "Do you..." text nearby). This is a known failure mode — always verify the raw key value.

### 2.4 — Supabase Auth Configuration
1. Go to **Authentication → Providers → Email**
2. For beta testing: set "Confirm email" to **OFF** (allows instant signup without email verification)
3. **FOR PRODUCTION LAUNCH**: This MUST be turned back **ON**
4. Go to **Authentication → URL Configuration**:
   - **Site URL**: `https://servicedraft.ai`
   - **Redirect URLs**: Add `https://servicedraft.ai/auth/callback` and `http://localhost:3000/auth/callback` (for local dev)

### 2.5 — Google AI Studio (Gemini)
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key" → select or create a Google Cloud project
3. Copy the key — this is your `GEMINI_API_KEY`
4. Current model in use: `gemini-3-flash-preview`
5. Pricing: Input $0.50/1M tokens, Output $3.00/1M tokens

### 2.6 — Stripe
1. Go to https://stripe.com and create an account
2. Go to **Developers → API Keys**:
   - Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy **Secret key** → `STRIPE_SECRET_KEY`
3. Create a subscription product: **Products → Add Product** → set up monthly pricing → note the **Price ID** (starts with `price_`) → `STRIPE_PRICE_ID`
4. Set up webhook: **Developers → Webhooks → Add Endpoint**:
   - URL: `https://servicedraft.ai/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing Secret** (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET`
5. **Beta mode**: Stripe is in test mode. Switch to live mode when ready for real payments.

### 2.7 — Resend
1. Go to https://resend.com and create an account
2. **Domains → Add Domain** → enter `servicedraft.ai` → follow DNS verification instructions (add TXT/MX records in Cloudflare)
3. Once verified, go to **API Keys → Create API Key** → copy → `RESEND_API_KEY`
4. Used for: email narrative exports (up to 10 recipients) and branded password reset emails

### 2.8 — Cloudflare
1. Go to https://cloudflare.com and sign in (domain `servicedraft.ai` was purchased here)
2. Go to **DNS → Records** and configure:
   - `A` record: name `@`, value = Vercel's IP (from Vercel dashboard → Domains)
   - `CNAME` record: name `www`, value = `cname.vercel-dns.com`
3. **⚠️ CRITICAL: Set the proxy status to DNS-only (grey cloud)** for BOTH records
   - Orange cloud (proxied) = **BREAKS** Vercel's domain verification and SSL
   - Grey cloud (DNS-only) = **CORRECT** — lets Vercel handle SSL directly
4. Also add Resend DNS records (TXT/MX) for email domain verification

---

## PHASE 3: LOCAL SOFTWARE

| # | Software | Purpose | Install | Verify |
|---|----------|---------|---------|--------|
| 1 | **Node.js** (LTS v20+) | JavaScript runtime | https://nodejs.org | `node --version` → v20.x.x+ |
| 2 | **Git** | Version control | https://git-scm.com | `git --version` → 2.x.x+ |
| 3 | **Cursor IDE** | Code editor with AI | https://cursor.com | Open Cursor → verify it launches |
| 4 | **Claude Code** | AI coding assistant (CLI) | `npm install -g @anthropic-ai/claude-code` | `claude --version` → version number |

### Post-Install Configuration

**Configure Git identity:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

**Verify Node.js package manager:**
```bash
npm --version    # Should show 10.x.x or higher (comes with Node.js)
```

---

## PHASE 4: PROJECT SETUP

### 4.1 — Clone Repository

```bash
git clone https://github.com/Tcloyd30689/servicedraft-ai.git
cd servicedraft-ai
npm install
```

This installs all dependencies listed in `package.json` (~21 packages including Next.js, Supabase, Gemini, Stripe, Framer Motion, Recharts, jsPDF, docx, Resend, etc.)

### 4.2 — Create Environment Variables File

Create `.env.local` in the project root (this file is in `.gitignore` and should NEVER be committed):

```bash
# ===========================================
# SUPABASE
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://ejhcirejshqpctfqeawi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ===========================================
# GOOGLE GEMINI AI
# ===========================================
GEMINI_API_KEY=your_gemini_api_key_here

# ===========================================
# STRIPE (Test Mode for Beta)
# ===========================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_your_price_id_here

# ===========================================
# RESEND EMAIL
# ===========================================
RESEND_API_KEY=re_your_resend_key_here

# ===========================================
# APP CONFIGURATION
# ===========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
ACCESS_CODE=WHISLER-BETA-2026
```

**For production (Vercel)**, `NEXT_PUBLIC_APP_URL` should be `https://servicedraft.ai`.

**All of these same variables must also be set in Vercel**: Dashboard → Project → Settings → Environment Variables. Copy each key-value pair.

### 4.3 — Run Database Migrations

Run all SQL migration files in order in the **Supabase SQL Editor** (Dashboard → SQL Editor → New Query). Copy-paste each file's contents and execute:

| Order | Migration File | What It Creates/Modifies |
|-------|---------------|--------------------------|
| 1 | `supabase/migrations/001_initial_schema.sql` | users table, narratives table, auto-profile trigger, RLS policies |
| 2 | `supabase/migrations/002_add_name_fields_and_position_update.sql` | first_name, last_name columns on users |
| 3 | `supabase/migrations/003_narrative_upsert_support.sql` | updated_at column, dedup function, unique constraint, UPDATE policy |
| 4 | `supabase/migrations/004_admin_role_and_activity_log.sql` | role + is_restricted columns on users, activity_log table, admin RLS, is_admin() helper |
| 5 | `supabase/migrations/005_saved_repairs.sql` | saved_repairs table + RLS policies |
| 6 | `supabase/migrations/006_drop_narrative_unique_constraint.sql` | Drops unique(user_id, ro_number) for multi-entry support |
| 7 | `fix_activity_log_user_fk_to_public_users` | Redirects activity_log FK from auth.users to public.users (required for PostgREST joins) |
| 8 | `create_token_usage_table` | Legacy token tracking table (superseded by api_usage_log) |
| 9 | `create_groups_table` | Creates initial group management tables |
| 10 | `rename_groups_to_teams` | Renames groups → teams across all tables/columns |
| 11 | `009_api_usage_log.sql` | api_usage_log table with token tracking and cost estimation |

**Also run these manual SQL statements:**
```sql
-- Add preferences JSONB column (if not already present)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add team_id column (if not already present)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- Verify api_usage_log default model name is correct
ALTER TABLE api_usage_log ALTER COLUMN model_name SET DEFAULT 'gemini-3-flash-preview';
```

### 4.4 — Set Owner Role

After creating your account through the app's signup flow, set your user role to `owner` in the Supabase SQL Editor:

```sql
UPDATE public.users SET role = 'owner' WHERE email = 'your-email@example.com';
```

This gives you access to the Owner Dashboard with all admin capabilities.

### 4.5 — Verify Local Setup

```bash
npm run dev     # Should start at localhost:3000 with no errors
npm run build   # Should compile successfully (0 errors, warnings OK)
```

**Test the full flow:**
1. Open `http://localhost:3000` — landing page should load with sine wave animation
2. Click "REQUEST ACCESS" → Sign up with your email
3. Enter the access code (`WHISLER-BETA-2026`) → should bypass Stripe
4. Complete profile → should reach Main Menu
5. Click "GENERATE NEW STORY" → fill in sample data → click GENERATE STORY
6. Narrative should appear with typing animation
7. Click "SAVE STORY" → should save to database
8. Go to User Dashboard → saved narrative should appear in history table

---

## PHASE 5: ENVIRONMENT VARIABLE REFERENCE

### Required (app will not function without these)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Supabase → Settings → API → service_role |
| `GEMINI_API_KEY` | Google Generative AI API key | Google AI Studio → API Keys |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-only) | Stripe → Developers → API Keys → Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe → Developers → API Keys → Publishable key |

### Required for Full Functionality

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `ACCESS_CODE` | Beta access code for signup bypass | You define this (e.g., `WHISLER-BETA-2026`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL for Stripe redirects | `http://localhost:3000` (dev) or `https://servicedraft.ai` (prod) |
| `RESEND_API_KEY` | Resend email service API key | Resend → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe → Developers → Webhooks → Signing secret |
| `STRIPE_PRICE_ID` | Stripe subscription price ID | Stripe → Products → your product → Price ID |

### Variable Naming Rules
- `NEXT_PUBLIC_` prefix = exposed to the browser (safe for public keys only)
- No prefix = server-side only (NEVER exposed to browser — used in API routes)
- All variables must be set in BOTH `.env.local` (local dev) and Vercel (production)

---

## PHASE 6: START WORKING

Open the Cursor terminal in the project folder and start Claude Code:

```bash
claude
```

Paste as your first message:

```
Read the file CLAUDE_CODE_BUILD_INSTRUCTIONS.md in this project root. This is your master instruction document for working on ServiceDraft.AI. Also read BUILD_PROGRESS_TRACKER.md to see what has been completed and what needs to be done next. Begin working on the next incomplete task. After completing each task, update BUILD_PROGRESS_TRACKER.md to mark it as done and commit the changes.
```

Claude Code will read the instructions, check the tracker, and start working on whatever's next.

---

## PHASE 7: DEPLOYMENT CHECKLIST (Vercel Production)

If redeploying from scratch or setting up on a new Vercel project:

1. **Import GitHub repo** into Vercel → Framework: Next.js
2. **Add ALL environment variables** from Phase 5 (use production values, not localhost)
3. **Set `NEXT_PUBLIC_APP_URL`** to `https://servicedraft.ai`
4. **Deploy** → verify build succeeds
5. **Add custom domain** in Vercel: `servicedraft.ai`
6. **Configure Cloudflare DNS**: A record → Vercel IP, CNAME `www` → `cname.vercel-dns.com`, **both set to grey cloud (DNS-only)**
7. **Update Supabase redirect URLs**: Add `https://servicedraft.ai/auth/callback` to Authentication → URL Configuration
8. **Set Supabase Site URL**: `https://servicedraft.ai`
9. **Update Stripe webhook URL**: `https://servicedraft.ai/api/stripe/webhook`
10. **Test all major flows**: signup, login, generate, save, export, admin dashboard

---

## PHASE 8: KNOWN GOTCHAS & TROUBLESHOOTING

These are issues that have actually been encountered during development. Reference these when debugging:

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid API key" on admin operations | Extra text accidentally prepended to `SUPABASE_SERVICE_ROLE_KEY` when copying | Re-copy the key carefully. Use `.trim()` in service client init. |
| Custom domain not working on Vercel | Cloudflare proxy is enabled (orange cloud) | Switch to DNS-only (grey cloud) for both A and CNAME records |
| Activity log join queries fail | `activity_log.user_id` FK points to `auth.users` instead of `public.users` | Drop FK, recreate pointing to `public.users`, run `NOTIFY pgrst, 'reload schema'` |
| Stale UI after code changes | `.next` cache serving old builds | Delete `.next` folder: `rmdir /s /q .next` (Windows) or `rm -rf .next` (Mac/Linux) |
| Login redirect loop | Stale browser cookies/session after schema changes | Chrome DevTools → Application → Clear Site Data |
| "column users.team_id does not exist" | Migration for team_id column hasn't been run on the live database | Run: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);` |
| Save narrative timeout | Browser Supabase client used instead of server API route | All data operations MUST go through `/api/*` routes, not browser client |
| Proofread not finding snippets | Gemini didn't include `[[snippet]]` markers | Check the proofread system prompt — snippet extraction requires double-bracket markers |
| Email confirmation blocking signup | "Confirm email" is enabled in Supabase auth | For beta: disable in Supabase → Auth → Providers → Email → "Confirm email" OFF |

---

## COMPLETE VERIFICATION CHECKLIST

For new setups, every item must be ✅ before the app is fully operational:

| # | Item | Status |
|---|------|--------|
| 1 | GitHub account active, repo accessible | ✅ |
| 2 | Vercel connected to GitHub, auto-deploys working | ✅ |
| 3 | Supabase project created, API keys saved | ✅ |
| 4 | Supabase auth configured (email provider, redirect URLs) | ✅ |
| 5 | All 11 migrations + manual SQL applied | ✅ |
| 6 | Owner role set on primary account | ✅ |
| 7 | Gemini API key obtained and working | ✅ |
| 8 | Stripe account active, product/price created, webhook configured | ✅ |
| 9 | Resend account active, domain verified, API key obtained | ✅ |
| 10 | Cloudflare DNS pointing to Vercel (grey cloud — DNS-only) | ✅ |
| 11 | Node.js v20+ installed locally | ✅ |
| 12 | Git installed and configured | ✅ |
| 13 | Cursor IDE installed | ✅ |
| 14 | Claude Code installed (`claude --version` works) | ✅ |
| 15 | Repository cloned, `npm install` completed | ✅ |
| 16 | `.env.local` created with all variables | ✅ |
| 17 | Vercel environment variables set (all from Phase 5) | ✅ |
| 18 | `npm run dev` starts without errors | ✅ |
| 19 | `npm run build` compiles without errors | ✅ |
| 20 | Full signup → generate → save → export flow tested | ✅ |

---

*— End of Pre-Build Setup Checklist v2.1 —*
