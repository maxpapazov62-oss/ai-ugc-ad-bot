# LeadPilot — Full Build Plan

> A multi-user lead response tool that monitors email notifications from freelancing platforms, drafts AI-powered responses instantly, and helps freelancers respond faster than their competition.

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Framework | Next.js 14 (App Router) | Full-stack React, API routes built in |
| Language | TypeScript | Catches bugs early, better dev experience |
| Styling | Tailwind CSS + shadcn/ui | Fast, professional, built-in dark mode |
| Database | Supabase (PostgreSQL) | Free tier, built-in auth, real-time |
| Auth | Supabase Auth | Multi-user, Google OAuth for Gmail access |
| Email Monitoring | Gmail API (Google Cloud) | Read inbox for platform notifications |
| AI Responses | Claude API (Anthropic) | Human-like response drafting |
| Email Sending | Resend (free tier) | Send notification emails to users |
| Deployment | Vercel | Free tier, one-click deploy from GitHub |
| Domain | Custom domain | Connected via Vercel |

**Estimated monthly cost to run:** ~$5-20 (Claude API usage), everything else free tier.

---

## Phase 0 — Dev Environment Setup

### Step 0.1 — Install Required Tools
1. Install Node.js (version 20+): https://nodejs.org
2. Install VS Code: https://code.visualstudio.com (or use any editor)
3. You already have Git and GitHub configured

### Step 0.2 — Create the Next.js Project
```bash
npx create-next-app@latest leadpilot --typescript --tailwind --eslint --app --src-dir
cd leadpilot
```

### Step 0.3 — Install Core Dependencies
```bash
# UI components
npx shadcn@latest init

# Database
npm install @supabase/supabase-js @supabase/ssr

# AI
npm install @anthropic-ai/sdk

# Email
npm install resend

# Gmail API
npm install googleapis

# Utilities
npm install zod date-fns
```

### Step 0.4 — Set Up Accounts (Free Tiers)
1. **Supabase** — create project at https://supabase.com
2. **Anthropic** — get API key at https://console.anthropic.com
3. **Google Cloud** — create project, enable Gmail API, set up OAuth consent screen
4. **Resend** — sign up at https://resend.com
5. **Vercel** — sign up at https://vercel.com

### Step 0.5 — Environment Variables
Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RESEND_API_KEY=your_resend_key
```

---

## Phase 1 — Database Schema (Supabase)

### Tables to Create

**users** (handled by Supabase Auth automatically)

**profiles**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (FK → auth.users) | Primary key |
| full_name | text | Display name |
| created_at | timestamptz | Account creation |

**configurations**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid (FK → profiles) | Owner |
| niche | text | Industry/service area |
| price_min | integer | Minimum price willing to work for |
| price_max | integer | Maximum price willing to work for |
| location_state | text | State |
| location_city | text | City |
| location_zip | text | Zip code |
| landing_page_url | text | User's website/landing page |
| auto_approve | boolean | Auto-send or manual approval |
| is_active | boolean | Whether monitoring is on/off |
| created_at | timestamptz | Created |
| updated_at | timestamptz | Last modified |

**gmail_connections**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid (FK → profiles) | Owner |
| gmail_address | text | Connected Gmail address |
| access_token | text (encrypted) | OAuth access token |
| refresh_token | text (encrypted) | OAuth refresh token |
| token_expiry | timestamptz | When token expires |
| last_synced_at | timestamptz | Last inbox check |

**leads**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid (FK → profiles) | Owner |
| source_platform | text | Where lead came from (upwork, fiverr, etc.) |
| source_email_subject | text | Original email notification subject |
| source_email_body | text | Original email notification body |
| lead_title | text | Extracted job/request title |
| lead_description | text | Extracted job/request details |
| lead_budget | text | Extracted budget if available |
| lead_location | text | Extracted location if available |
| lead_url | text | Link back to the original posting |
| status | text | new / responded / skipped / expired |
| created_at | timestamptz | When lead was found |

**responses**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| lead_id | uuid (FK → leads) | Which lead this responds to |
| user_id | uuid (FK → profiles) | Owner |
| draft_message | text | AI-generated response |
| final_message | text | User-edited version (if changed) |
| status | text | pending / approved / rejected / sent |
| approved_at | timestamptz | When user approved |
| created_at | timestamptz | When draft was generated |

---

## Phase 2 — Authentication & User Accounts

### Step 2.1 — Supabase Auth with Google OAuth
- Configure Google OAuth in Supabase dashboard
- This serves double duty: user login AND Gmail access permission
- Request Gmail read scope during OAuth so we can monitor their inbox

### Step 2.2 — Auth Pages to Build
- `/login` — Google sign-in button, clean centered layout
- `/signup` — Same as login (Google handles both)
- Middleware to protect all routes except login

### Step 2.3 — Profile Setup
- After first login, redirect to `/setup` to create their configuration
- This is the homepage form you described

---

## Phase 3 — Frontend (UI)

### Design System
- **Font:** Inter (clean, professional, free)
- **Accent color:** Indigo (`#6366F1`) — used for buttons, links, active states
- **Light mode:** White background, black text, light gray cards
- **Dark mode:** Near-black background (`#0F0F0F`), white text, dark gray cards
- **Components:** shadcn/ui (pre-built, accessible, customizable)

### Page Structure

#### Layout
- **Top navbar** with: Logo (left), theme toggle (right), user avatar/menu (right)
- **No sidebar** — keep it minimal

#### Pages

**`/` — Homepage / Dashboard** (authenticated)
- If no configuration exists → show setup form
- If configured → show lead monitoring dashboard
  - Stats bar: total leads found, pending responses, sent responses
  - Lead feed: card-style list of recent leads with status badges
  - Each card shows: platform icon, job title, budget, location, time found
  - Click a card → expand to see full details + AI-drafted response
  - Approve / Edit / Reject buttons on each response
  - "Copy Response" button for pasting into the platform manually

**`/setup` — Configuration Form**
This is the core form you described:
1. **Niche/Industry** — text input with suggestions dropdown (tiling, painting, roofing, video editing, etc.)
2. **Price Range** — dual slider or two number inputs (min-max)
3. **Location** — three fields: State (dropdown), City (text), Zip Code (text)
4. **Landing Page URL** — text input with URL validation and preview
5. **Auto-Approve** — toggle switch with clear label: "Automatically send responses without my approval?"
6. **Save & Start Monitoring** button

**`/leads` — Lead History**
- Filterable table/list of all leads
- Filter by: status, platform, date range
- Bulk actions: approve all, reject all

**`/settings` — Account Settings**
- Edit configuration
- Manage Gmail connection
- Theme preference (light/dark)
- Notification email preferences

**`/login` — Auth Page**
- Centered card with Google sign-in button
- App logo and one-line description above

### Step 3.1 — Build order
1. Layout component (navbar, theme toggle)
2. Login page
3. Setup/configuration form
4. Dashboard page (with mock data first)
5. Lead detail view
6. Settings page
7. Dark mode implementation

---

## Phase 4 — Gmail Monitoring Engine

### How It Works
1. User connects Gmail via Google OAuth (done during signup)
2. App stores OAuth tokens in `gmail_connections` table
3. A background job (Vercel Cron) runs every 2 minutes
4. For each active user, it:
   - Uses Gmail API to check inbox for new emails since `last_synced_at`
   - Filters for emails from known platforms (Upwork notifications, Fiverr alerts, Thumbtack matches, etc.)
   - Extracts the lead details from the email body
   - Saves new leads to the `leads` table
   - Triggers AI response drafting

### Platform Email Patterns to Detect
| Platform | Sender Email Pattern | What to Extract |
|----------|---------------------|-----------------|
| Upwork | `@upwork.com` | Job title, budget, description, link |
| Fiverr | `@fiverr.com` | Buyer request details, budget, link |
| Thumbtack | `@thumbtack.com` | Service request, location, link |
| Freelancer | `@freelancer.com` | Project title, budget, link |
| PeoplePerHour | `@peopleperhour.com` | Job details, budget, link |

### Step 4.1 — Build order
1. Google OAuth flow with Gmail scope
2. Token storage and refresh logic
3. Gmail API integration (list/read messages)
4. Email parser for each platform
5. Lead extraction and deduplication
6. Cron job setup (Vercel Cron or Supabase Edge Function)

---

## Phase 5 — AI Response Drafting

### How It Works
1. When a new lead is saved, trigger response generation
2. Send the lead details + user's configuration to Claude API
3. Claude generates a brief, natural, human-sounding message
4. Save the draft to `responses` table

### Prompt Engineering
The system prompt will instruct Claude to:
- Keep responses short (2-4 sentences)
- Sound human and conversational, not salesy or robotic
- Mention the specific service the lead is asking about
- Naturally include the user's landing page URL
- Match the tone of the platform (casual for Reddit, professional for Upwork)
- Never use generic filler phrases

### Example Output
> "Hey! I saw you're looking for someone to handle your roof repair. I specialize in residential roofing in the Dallas area and would love to help. Here's my site with some past work and booking info: [user's URL]. Let me know if you have any questions!"

### Step 5.1 — Build order
1. Claude API integration utility
2. Prompt template system
3. Response generation endpoint
4. Auto-generate on new lead (if auto-approve is off, save as pending)
5. Auto-approve flow (if enabled, mark as approved immediately)

---

## Phase 6 — Notification System

### How It Works
- When a response is drafted (and auto-approve is OFF), send the user an email
- Email contains: lead summary, drafted response preview, link to dashboard to approve
- Use Resend to send these notification emails

### Step 6.1 — Build order
1. Resend integration
2. Email template (HTML email, matches app branding)
3. Trigger on new pending response
4. Link to dashboard with the specific lead highlighted

---

## Phase 7 — Polish & Edge Cases

1. **Loading states** — skeleton loaders on dashboard, button spinners
2. **Empty states** — friendly message when no leads found yet
3. **Error handling** — toast notifications for API failures
4. **Rate limiting** — prevent Gmail API quota exhaustion
5. **Token refresh** — handle expired Google OAuth tokens gracefully
6. **Mobile responsive** — dashboard works on phone
7. **Lead deduplication** — don't process the same email twice
8. **Stale lead detection** — mark leads as expired after X days

---

## Phase 8 — Deployment

### Step 8.1 — Deploy to Vercel
1. Connect GitHub repo to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy

### Step 8.2 — Custom Domain
1. Buy domain (Namecheap, Google Domains, etc.)
2. Connect to Vercel project
3. SSL is automatic

### Step 8.3 — Cron Jobs
- Set up Vercel Cron to run Gmail check every 2 minutes
- `vercel.json` cron configuration

---

## Build Order (What We Code First)

| Order | What | Why |
|-------|------|-----|
| 1 | Project setup + shadcn/ui + Tailwind config | Foundation |
| 2 | Supabase tables + auth | Need data layer and login before anything |
| 3 | Login page | Entry point |
| 4 | Layout + theme toggle (light/dark) | Wraps everything |
| 5 | Setup/configuration form | Core user flow |
| 6 | Dashboard with mock data | Visual progress, validate design |
| 7 | Gmail OAuth + monitoring | Core feature |
| 8 | Email parsing per platform | Makes leads real |
| 9 | Claude API response drafting | Core feature |
| 10 | Response approve/reject/edit flow | User interaction |
| 11 | Notification emails | Keeps users informed |
| 12 | Cron job for automated checking | Makes it hands-off |
| 13 | Polish, error handling, mobile | Production quality |
| 14 | Deploy to Vercel + domain | Go live |

---

## File Structure (What the Project Will Look Like)

```
leadpilot/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, navbar, theme provider
│   │   ├── page.tsx                # Dashboard (authenticated home)
│   │   ├── login/page.tsx          # Login page
│   │   ├── setup/page.tsx          # Configuration form
│   │   ├── leads/page.tsx          # Lead history
│   │   ├── settings/page.tsx       # Account settings
│   │   └── api/
│   │       ├── auth/callback/route.ts    # Google OAuth callback
│   │       ├── gmail/sync/route.ts       # Gmail inbox check endpoint
│   │       ├── leads/route.ts            # Lead CRUD
│   │       ├── responses/route.ts        # Response CRUD
│   │       ├── responses/generate/route.ts # AI draft generation
│   │       └── cron/check-emails/route.ts  # Cron endpoint
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── navbar.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── lead-card.tsx
│   │   ├── response-draft.tsx
│   │   ├── configuration-form.tsx
│   │   └── stats-bar.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server Supabase client
│   │   │   └── middleware.ts       # Auth middleware
│   │   ├── gmail/
│   │   │   ├── client.ts           # Gmail API wrapper
│   │   │   └── parsers/
│   │   │       ├── upwork.ts       # Parse Upwork notification emails
│   │   │       ├── fiverr.ts       # Parse Fiverr notification emails
│   │   │       ├── thumbtack.ts    # Parse Thumbtack notification emails
│   │   │       └── index.ts        # Router to correct parser
│   │   ├── claude/
│   │   │   ├── client.ts           # Claude API wrapper
│   │   │   └── prompts.ts          # Response prompt templates
│   │   └── resend/
│   │       └── client.ts           # Email sending
│   └── types/
│       └── index.ts                # TypeScript types
├── public/
│   └── logo.svg
├── .env.local
├── tailwind.config.ts
├── vercel.json                     # Cron job config
└── package.json
```
