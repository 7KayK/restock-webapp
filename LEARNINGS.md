# LEARNINGS.md — Restock Web App
# Accumulated project wisdom. Read this every session alongside CLAUDE.md.
# Format: [YYYY-MM-DD] [CATEGORY] Lesson learned

---

## How to Use This File

This file is a living record of every hard-won lesson from building Restock.
When something breaks, gets corrected, or a better pattern is discovered:
1. Add a dated entry below in the correct category
2. Be specific — vague lessons are useless
3. Include the wrong approach AND the correct approach where possible

---

## Infrastructure Lessons

### Railway
[2026-05-07] [RAILWAY] Railway services bind to `process.env.PORT` — never hardcode
port 8080 or any other port. Always use `const port = process.env.PORT || 3000`.

[2026-05-07] [RAILWAY] Railway free-tier services can go to sleep after inactivity.
If webhook events stop arriving, check the deployment status shows Active before
assuming a code problem. The HTTP logs tab shows incoming requests separately from
the Deploy tab application logs.

[2026-05-07] [RAILWAY] The HTTP logs tab and the Deploy logs tab are different things.
HTTP logs show incoming requests and status codes. Deploy logs show application
stdout (console.log output). Always check Deploy logs for application errors,
not HTTP logs.

[2026-05-07] [RAILWAY] When Railway logs show only Postgres service entries and no
app service entries, you are viewing the wrong service's logs. Each service
(restock-whatsapp, Postgres) has its own log stream. Switch services in the
left sidebar.

### PostgreSQL / Prisma
[2026-05-07] [PRISMA] Never instantiate PrismaClient directly in Next.js — it causes
connection pool exhaustion in development due to hot reloading. Always use the
singleton pattern in /src/lib/prisma.ts:
  WRONG: const prisma = new PrismaClient()
  CORRECT: import { prisma } from '@/lib/prisma'

[2026-05-07] [PRISMA] Always run `npx prisma generate` after any schema change,
not just `npx prisma migrate dev`. The generate step creates TypeScript types.
Without it, TypeScript will not recognise new model fields.

[2026-05-07] [PRISMA] The DATABASE_URL for the web app is the SAME Railway PostgreSQL
URL used by the Telegram and WhatsApp bots. All three services share one database.
Do not create a separate database for the web app.

---

## WhatsApp Bot Lessons

### Meta Webhooks
[2026-05-07] [META] Meta test webhooks only fire if webhook verification (GET challenge)
has already succeeded. If "Test → Send to server" produces no Railway logs,
re-verify the webhook first by clicking Edit in Meta Configuration and re-saving.

[2026-05-07] [META] Meta webhook verification is a GET request. Meta sends:
?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
Your server must return the hub.challenge value exactly. Any other response
fails verification silently.

[2026-05-07] [META] Unpublished Meta apps can still receive test webhooks from the
dashboard. App being unpublished does not block webhook testing. If test events
are not arriving, the issue is verification state, not publish state.

[2026-05-07] [META] Three POST /webhook 200 responses in Railway HTTP logs on Apr 26
confirmed the webhook pipeline was healthy end-to-end before business registration
was completed. The pipeline is proven working — no need to re-diagnose networking.

[2026-05-07] [META] Meta webhook subscriptions can silently expire for unpublished apps.
If events stop arriving after a period of inactivity, re-verify the webhook in
Meta Configuration even if it was verified before.

### WhatsApp Business Registration
[2026-05-07] [META-BIZ] Meta Business Verification requires a registered legal business
entity. A Saskatchewan Business Name Registration (ISC) certificate satisfies
Meta's verification document requirement. The legal name does not need to exactly
match the WhatsApp display name.

[2026-05-07] [META-BIZ] WhatsApp display name approval is separate from Meta Business
Verification. Both are required before the bot can message non-test numbers.

[2026-05-07] [META-BIZ] Proactive outbound messages (like restock reminders) require
approved Message Templates. Free-form replies to user-initiated messages do not.
Submit reminder templates to Meta as soon as Business Verification is approved.

---

## JSON / API Lessons

[2026-05-07] [API] Claude API can return responses wrapped in markdown code fences
(```json ... ```) even when instructed to return JSON only. Always strip code
fences before JSON.parse():
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

[2026-05-07] [API] Always wrap JSON.parse() in try/catch. Silent parse failures
cause downstream bugs that are hard to trace.

---

## Authentication Lessons

### Clerk
[2026-05-07] [CLERK] Clerk's `auth()` must be called from `@clerk/nextjs/server` in
API routes and Server Components. The client-side `useAuth()` hook is for
Client Components only. Using the wrong import causes runtime errors.

[2026-05-07] [CLERK] Always map the Clerk userId to the internal User record via
clerkId field before any database query. Never use Clerk's userId directly
as a database foreign key.

[2026-05-07] [CLERK] For Google OAuth in Clerk development: Clerk provides its own
Google OAuth credentials. No Google Cloud setup needed for dev. For production:
add your own Google Client ID and Secret in Clerk dashboard → Social Connections.

[2026-05-07] [CLERK] Clerk redirect URLs must be configured in the Clerk dashboard
for both development (localhost:3000) and production (restock.chat) domains.
Missing redirect URL configuration causes silent auth failures.

---

## Next.js Lessons

[2026-05-07] [NEXTJS] Always use `Response.json()` in App Router API routes, not
`NextResponse.json()`, unless you need streaming. NextResponse is only needed
for middleware or streaming responses.

[2026-05-07] [NEXTJS] Never use `\n` inside JSX text — use separate Paragraph or
div elements. Line breaks in JSX string literals do not render as expected.

[2026-05-07] [NEXTJS] Environment variables prefixed NEXT_PUBLIC_ are exposed to
the browser. Never prefix secret keys, database URLs, or API secrets with
NEXT_PUBLIC_. Only public keys (Google Maps, Clerk publishable key) should
be NEXT_PUBLIC_.

---

## Google Cloud Lessons

[2026-05-07] [GOOGLE] Google Maps API key was created with website restrictions
set to localhost:3000 for development. When the web app deploys to restock.chat,
add the production domain in Google Cloud Console → Credentials → Restock Maps Key
→ Website restrictions. REMINDER: This must be done at WEB-8 deployment step.

[2026-05-07] [GOOGLE] Google Maps Platform requires both Maps JavaScript API AND
Places API to be enabled in the Google Cloud project for the Nearest Store
feature to work. Enabling only one causes silent failures.

---

## Kroger API Lessons

[2026-05-07] [KROGER] Kroger issues Client ID and Client Secret immediately on
registration. Sandbox/development access works right away. Production approval
for higher rate limits takes additional review.

[2026-05-07] [KROGER] Kroger API uses OAuth2 client credentials flow for product
and location searches (no user login required). The Products API and Locations
API are the only ones needed for Phase 1. Cart and Profile APIs are not needed
until Phase 3+.

[2026-05-07] [KROGER] Redirect URI for Kroger OAuth:
  Development: http://localhost:3000/api/auth/callback/kroger
  Production: https://restock.chat/api/auth/callback/kroger

---

## Business Registration Lessons

[2026-05-07] [BUSINESS] Registered business name: RESTOCK SOLUTIONS
Registered in: Saskatchewan, Canada via ISC (Information Services Corporation)
Submission reference: SR2009282
NAICS code: 51121 (Software Publishers)
Status as of 2026-05-07: Name reservation submitted, awaiting approval.
Next step: Complete full Business Name Registration after ISC approves the name,
then download the certificate for Meta Business Verification.

---

## Strategic Decisions Log

[2026-05-07] [STRATEGY] Decided to build web app while waiting for ISC business
name approval and Meta Business Verification. Web app build is independent of
WhatsApp registration status.

[2026-05-07] [STRATEGY] Web app domain is restock.chat (already purchased).
All production URLs, OAuth redirects, and API configurations should use
restock.chat not any Railway or Vercel subdomain.

[2026-05-07] [STRATEGY] Restock for Teams (B2B tier with Google Calendar integration)
identified as a Phase 2 feature. Core consumer loop must be proven first.
Google Calendar integration is an OAuth connection + calendar event creation —
not complex to add once web app exists.

[2026-05-07] [STRATEGY] Web app is the intelligence layer, not a replacement channel.
Bots handle daily interaction. Web app handles visualisation, analytics, and
AI-powered insights. Mobile app is Phase 3+ only if user behaviour demands it.

---

## Template for New Entries

Copy this format when adding new lessons:

[YYYY-MM-DD] [CATEGORY] One-line summary of what was learned.
Details of what went wrong, what the correct approach is, and any code examples.

Categories: RAILWAY | PRISMA | META | META-BIZ | API | CLERK | NEXTJS | 
            GOOGLE | KROGER | BUSINESS | STRATEGY | SHADCN | RECHARTS | VERCEL

---

*Every lesson here represents real time saved on future sessions.*
*The more specific the entry, the more useful it is.*
*Update this file whenever something breaks or a better pattern is found.*
