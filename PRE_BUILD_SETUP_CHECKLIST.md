# SERVICEDRAFT.AI — PRE-BUILD SETUP CHECKLIST

## ✅ STATUS: COMPLETED

> **This checklist was completed in February 2026.** All accounts, tools, and connections are established. This document is preserved as a historical reference and onboarding guide for anyone who needs to set up a new development environment.

---

## PHASE 1: ACCOUNTS & SERVICES

All required accounts are active and configured.

| # | Service | Purpose | Status |
|---|---------|---------|--------|
| 1 | **GitHub** | Code repository (Tcloyd30689/servicedraft-ai — Public) | ✅ Active |
| 2 | **Vercel** | Hosting & CI/CD (connected to GitHub) | ✅ Active |
| 3 | **Supabase** | PostgreSQL database + Auth (project: servicedraft-ai, region: West US) | ✅ Active |
| 4 | **Google AI Studio** | Gemini API key (model: gemini-3-flash-preview) | ✅ Active |
| 5 | **Stripe** | Payment processing (currently in test mode for beta) | ✅ Active |
| 6 | **Resend** | Transactional email (verified domain: servicedraft.ai) | ✅ Active |
| 7 | **Cloudflare** | Domain registrar & DNS for servicedraft.ai | ✅ Active |

### Account Setup Instructions (For New Environment)

**GitHub:** https://github.com — Repository: `servicedraft-ai` (public)

**Vercel:** https://vercel.com — Sign up with GitHub, connect the servicedraft-ai repository

**Supabase:** https://supabase.com — Create project, note the Project URL, Anon Key, and Service Role Key from Settings → API

**Google AI Studio:** https://aistudio.google.com/apikey — Create API key for Gemini access

**Stripe:** https://stripe.com — Note the Publishable Key and Secret Key from Developers → API Keys. Create a subscription product and note the Price ID.

**Resend:** https://resend.com — Sign up, verify the sending domain (servicedraft.ai), note the API key

**Cloudflare:** https://cloudflare.com — Domain registrar for servicedraft.ai. **IMPORTANT:** When pointing to Vercel, the DNS proxy must be set to grey cloud (DNS-only), NOT orange cloud (proxied). Orange cloud breaks Vercel's domain verification and SSL.

---

## PHASE 2: LOCAL SOFTWARE

| # | Software | Purpose | Install |
|---|----------|---------|---------|
| 1 | **Node.js** (LTS v20+) | JavaScript runtime | https://nodejs.org |
| 2 | **Git** | Version control | https://git-scm.com |
| 3 | **Cursor IDE** | Code editor with AI | https://cursor.com |
| 4 | **Claude Code** | AI coding assistant (CLI) | `npm install -g @anthropic-ai/claude-code` |

Verify installations:
```
node --version    # Should show v20.x.x or higher
git --version     # Should show git version 2.x.x
claude --version  # Should show claude-code version
```

Configure Git identity:
```
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## PHASE 3: PROJECT SETUP

### 3.1 — Clone Repository

```bash
git clone https://github.com/Tcloyd30689/servicedraft-ai.git
cd servicedraft-ai
npm install
```

### 3.2 — Create Environment Variables File

Create `.env.local` in the project root with all required values:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret
STRIPE_PRICE_ID=your_stripe_price_id

# Resend Email
RESEND_API_KEY=your_resend_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
ACCESS_CODE=WHISLER-BETA-2026
```

**IMPORTANT:** This file should NEVER be committed to Git. It's already in `.gitignore`.

### 3.3 — Run Database Migrations

Run all SQL migration files in order in the Supabase SQL Editor (Dashboard → SQL Editor → New Query):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_add_name_fields_and_position_update.sql`
3. `supabase/migrations/003_narrative_upsert_support.sql`
4. `supabase/migrations/004_admin_role_and_activity_log.sql`
5. `supabase/migrations/005_saved_repairs.sql`
6. `supabase/migrations/006_drop_narrative_unique_constraint.sql`

Also run manually:
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
```

### 3.4 — Verify Setup

```bash
npm run dev     # Should start at localhost:3000
npm run build   # Should compile with 0 errors
```

---

## PHASE 4: START WORKING

Open the Cursor terminal in the project folder and start Claude Code:

```
claude
```

Paste as your first message:

```
Read the file CLAUDE_CODE_BUILD_INSTRUCTIONS.md in this project root. This is your master instruction document for working on ServiceDraft.AI. Also read BUILD_PROGRESS_TRACKER.md to see what has been completed and what needs to be done next. Begin working on the next incomplete task. After completing each task, update BUILD_PROGRESS_TRACKER.md to mark it as done and commit the changes.
```

---

*— End of Pre-Build Setup Checklist —*
