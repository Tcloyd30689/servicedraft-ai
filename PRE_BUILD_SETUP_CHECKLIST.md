# SERVICEDRAFT.AI — PRE-BUILD SETUP CHECKLIST

## What This Document Is

Before Claude Code can build ServiceDraft.AI, YOU (Tyler) need to set up several accounts, tools, and connections. Think of this like gathering all your tools and parts before starting a repair — Claude Code is the technician, but it needs the bay ready.

This checklist walks you through every single thing that needs to be done BEFORE you tell Claude Code to start building. Once every box is checked, you're ready to go.

---

## PHASE 1: ACCOUNTS TO CREATE

These are online services that ServiceDraft.AI depends on. You need an account on each one.

### 1.1 — GitHub Account

**What it is:** GitHub is where your app's code lives. Think of it as a cloud backup for every file in your project, plus it tracks every change ever made so you can always go back.

**What to do:**

1. Go to https://github.com
2. Click "Sign up" and create a free account
3. Choose a username (this will be public — something professional like `tyler-servicedraft` works)
4. Verify your email address
5. Once logged in, click the "+" icon in the top right corner and select "New repository"
6. Name the repository: `servicedraft-ai`
7. Set it to **Private** (your code stays hidden from the public)
8. Check the box for "Add a README file"
9. Click "Create repository"
10. On the repository page, copy the URL — it will look like: `https://github.com/YOUR-USERNAME/servicedraft-ai`

**Save this info somewhere:**
- GitHub username: _______________
- Repository URL: _______________

---

### 1.2 — Vercel Account

**What it is:** Vercel is where your app will be hosted (live on the internet). It automatically deploys your app whenever you push code to GitHub.

**What to do:**

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub" — this links your GitHub account automatically
4. Authorize Vercel to access your GitHub
5. Once logged in, you don't need to create a project yet — Claude Code will handle that through the command line

**Save this info:**
- Vercel account created: YES / NO

---

### 1.3 — Supabase Account & Project

**What it is:** Supabase is your database (where user accounts and saved narratives are stored) plus your authentication system (login/signup).

**What to do:**

1. Go to https://supabase.com
2. Click "Start your project" and sign up (you can use your GitHub account)
3. Once logged in, click "New Project"
4. Choose your organization (it creates one for you automatically)
5. Set the project name: `servicedraft-ai`
6. Set a strong database password — **WRITE THIS DOWN, you'll need it**
7. Select the region closest to you (pick "West US" since you're in Wyoming)
8. Click "Create new project" and wait for it to finish setting up (takes about 2 minutes)
9. Once ready, go to **Settings** (gear icon in the left sidebar) → **API**
10. You'll see two important values:
    - **Project URL** — looks like: `https://xxxxxxxxxxxx.supabase.co`
    - **anon (public) key** — a long string starting with `eyJ...`
    - **service_role key** — another long string (keep this SECRET — it has full database access)

**Save this info:**
- Supabase Project URL: _______________
- Supabase Anon Key: _______________
- Supabase Service Role Key: _______________
- Database Password: _______________

---

### 1.4 — Google AI Studio (Gemini API Key)

**What it is:** This is the AI that generates the warranty narratives. You need an API key to let your app talk to Gemini.

**What to do:**

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. If it asks you to select a project, click "Create API key in new project"
5. Copy the API key that appears

**Save this info:**
- Gemini API Key: _______________

---

### 1.5 — Stripe Account (Payment Processing)

**What it is:** Stripe handles credit card payments for subscriptions. You can set this up in test mode first (no real charges) and switch to live when you're ready.

**What to do:**

1. Go to https://stripe.com
2. Click "Start now" and create an account
3. You'll start in **Test Mode** by default (you'll see "TEST" in the top bar) — this is perfect for development
4. In the dashboard, go to **Developers** → **API keys**
5. You'll see:
    - **Publishable key** — starts with `pk_test_...`
    - **Secret key** — starts with `sk_test_...` (click "Reveal test key" to see it)

**Save this info:**
- Stripe Publishable Key: _______________
- Stripe Secret Key: _______________

---

## PHASE 2: INSTALL SOFTWARE ON YOUR COMPUTER

### 2.1 — Node.js

**What it is:** The engine that runs your Next.js app on your computer during development. Required.

**What to do:**

1. Go to https://nodejs.org
2. Download the **LTS version** (the big green button on the left)
3. Run the installer — click "Next" through everything, accept the defaults
4. To verify it installed, open your terminal (or Command Prompt on Windows) and type:
   ```
   node --version
   ```
   You should see something like `v20.x.x` or higher

---

### 2.2 — Git

**What it is:** The tool that connects your local code to GitHub. Cursor uses it behind the scenes.

**What to do:**

1. Go to https://git-scm.com/downloads
2. Download for your operating system (Windows/Mac)
3. Run the installer — accept all defaults
4. Open terminal and verify:
   ```
   git --version
   ```
5. Configure your identity (type these commands one at a time):
   ```
   git config --global user.name "Your Name"
   git config --global user.email "your-email@example.com"
   ```
   Use the same email you used for GitHub.

---

### 2.3 — Cursor IDE

**What it is:** Your code editor. It's like VS Code but with AI built in. This is where you'll see all the files and where Claude Code will make changes.

**What to do:**

1. Go to https://www.cursor.com
2. Download and install Cursor
3. Open Cursor
4. Sign in or create an account when prompted
5. Cursor will ask about settings — accept the defaults for now

---

### 2.4 — Claude Code (Command Line Tool)

**What it is:** Claude Code is the tool that lets Claude write and modify files directly on your computer from the command line. This is what will actually build ServiceDraft.AI.

**What to do:**

1. Open your terminal (not Cursor — your regular Terminal app or Command Prompt)
2. Run this command:
   ```
   npm install -g @anthropic-ai/claude-code
   ```
3. Once installed, verify by typing:
   ```
   claude --version
   ```
4. Authenticate by running:
   ```
   claude
   ```
   It will open a browser window to sign in with your Anthropic account. Follow the prompts.

---

## PHASE 3: CONNECT EVERYTHING TOGETHER

### 3.1 — Clone Your GitHub Repository Into Cursor

This downloads your repository to your computer so you can work on it.

**What to do:**

1. Open Cursor
2. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac) to open the command palette
3. Type "Git: Clone" and select it
4. Paste your repository URL: `https://github.com/YOUR-USERNAME/servicedraft-ai`
5. Choose a folder on your computer where you want the project to live (like your Desktop or a "Projects" folder)
6. When it asks "Would you like to open the cloned repository?" — click **Open**
7. You should now see the project folder in Cursor's file explorer on the left

---

### 3.2 — Create the Environment Variables File

Your app needs to know your API keys and secret values, but you don't want those saved in GitHub (where someone could steal them). An "environment file" stores them locally on your machine only.

**What to do:**

1. In Cursor, right-click in the file explorer (left panel) and click "New File"
2. Name it exactly: `.env.local`
3. Paste the following into the file, filling in YOUR values from Phase 1:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Save the file (`Ctrl+S` or `Cmd+S`)

**IMPORTANT:** This file should NEVER be uploaded to GitHub. Claude Code will set up a `.gitignore` file that prevents this automatically.

---

### 3.3 — Add Build Plan Files to Your Repository

Once Claude Code starts building, it needs the instruction documents in the project folder.

**What to do:**

1. Download the three files I'm providing you from this conversation:
   - `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`
   - `BUILD_PROGRESS_TRACKER.md`
   - `PRE_BUILD_SETUP_CHECKLIST.md` (this file)
2. Copy all three files into the ROOT of your project folder (the main `servicedraft-ai` folder, not inside any subfolder)
3. Also copy ALL of your project knowledge files into the root:
   - `ServiceDraft_AI_Spec_v1_3.md`
   - `ServiceDraft_AI_Project_Instructions_v1_3.md`
   - `ServiceDraft_AI_Prompt_Logic_v1.md`
   - `ServiceDraft_AI_UI_Design_Spec_v1.md`
   - `SERVIDRAFT_AI_LOGO_1_.PNG`

---

## PHASE 4: VERIFY EVERYTHING IS READY

Run through this final checklist. Every item must be YES before you start the build.

| # | Item | Status |
|---|------|--------|
| 1 | GitHub account created | YES / NO |
| 2 | GitHub repository `servicedraft-ai` created (Private) | YES / NO |
| 3 | Vercel account created (connected to GitHub) | YES / NO |
| 4 | Supabase project created, API keys saved | YES / NO |
| 5 | Gemini API key obtained and saved | YES / NO |
| 6 | Stripe account created, API keys saved | YES / NO |
| 7 | Node.js installed (`node --version` works) | YES / NO |
| 8 | Git installed (`git --version` works) | YES / NO |
| 9 | Cursor IDE installed and opened | YES / NO |
| 10 | Claude Code installed (`claude --version` works) | YES / NO |
| 11 | Repository cloned into Cursor | YES / NO |
| 12 | `.env.local` file created with all keys filled in | YES / NO |
| 13 | Build plan files copied into project root | YES / NO |
| 14 | Project knowledge files copied into project root | YES / NO |

---

## PHASE 5: START THE BUILD

Once everything above is checked off, here's how you kick off the build:

1. In Cursor, open the built-in terminal: `Ctrl+`` ` (backtick key, top-left of keyboard)
2. Make sure you're in your project folder (the terminal should show something like `~/servicedraft-ai`)
3. Type:
   ```
   claude
   ```
4. Claude Code will start up. Paste this as your first message:

```
Read the file CLAUDE_CODE_BUILD_INSTRUCTIONS.md in this project root. This is your master instruction document for building ServiceDraft.AI. Also read BUILD_PROGRESS_TRACKER.md to see what has been completed and what needs to be done next. Begin working on the next incomplete task. After completing each task, update BUILD_PROGRESS_TRACKER.md to mark it as done.
```

5. Claude Code will read the instructions and start building. It will ask for your confirmation before doing anything major (creating files, running commands, etc.) — just review what it's doing and approve.

---

*— End of Pre-Build Setup Checklist —*
