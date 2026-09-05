# CLAUDE.md — Restock Web App
# Last updated: 2026-05-07
# Read this file at the start of every session before writing any code.

---

## Project Identity

**Product:** Restock — household purchase tracking, consumption prediction, and restocking intelligence
**Domain:** restock.chat
**Registered business:** Restock Solutions (Saskatchewan, Canada)
**Developer:** Kay (Product Developer, Saskatchewan)

**What Restock is:**
A multi-channel household intelligence platform. Users log purchases via WhatsApp and Telegram bots.
The web app is the intelligence layer — it visualises spend, predicts depletion, surfaces deals,
and lets users chat with their household data via AI.

**The three channels and their roles:**
- Telegram bot (restock-telegram) — live, daily purchase logging and reminders
- WhatsApp bot (restock-whatsapp) — live, same as Telegram, wider reach
- Web app (restock-webapp) — THIS PROJECT — dashboard, analytics, AI assistant, deals, store finder

**All three channels share one PostgreSQL database on Railway.**

---

## Tech Stack — Never Deviate From This

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16 |
| Language | TypeScript | Latest |
| Styling | Tailwind CSS + Shadcn/UI | Latest |
| Auth | Clerk | Latest |
| Database | PostgreSQL on Railway | Existing instance |
| ORM | Prisma | Latest |
| AI | Anthropic Claude API + Vercel AI SDK | claude-sonnet-4-6 |
| Charts | Recharts | Latest |
| Maps | Google Maps Platform (@react-google-maps/api) | Latest |
| Deals API | Kroger Developer API | v1 |
| Item data | Open Food Facts API | Free |
| Deployment | Vercel | Free tier |
| Payments | Stripe | When monetising |
| Email | Resend | When needed |

**Never suggest alternative libraries unless the specified one is broken or deprecated.**
**Never use class components — always functional components with hooks.**
**Never use pages/ router — always use app/ router.**

---

## Colour System — Always Use These
**Updated 2026-09-05 — rebrand from teal/navy/orange to forest/gold/cream. Do not reintroduce #0F7B6C, #1B3A5C, #FF6B35, or #F8FAFC/#FAFAF8 anywhere in the app.**

| Name | Hex | Usage |
|---|---|---|
| Forest (primary) | #132B22 | Headings, body text, primary actions, nav/footer surfaces |
| Forest-2 | #1F3F31 | Secondary dark surfaces |
| Forest-3 | #2E5744 | Kickers, secondary interactive text |
| Gold (accent) | #C9A15A | CTA buttons, links, active/ring states |
| Gold-2 | #E4C07D | Button fills, tags/badges, highlights |
| Cream | #F7F2E7 | Page background |
| Cream-2 | #EFE7D6 | Secondary/muted surfaces, alternate section backgrounds |
| Paper | #FBF7EE | Receipt/paper-texture surfaces |
| Ink | #16211B | Body copy on light backgrounds |
| Success green | #22C55E | Positive states, linked accounts |
| Warning yellow | #EAB308 | Due soon reminders |
| Error red | #EF4444 | Overdue, destructive actions |
| Card white | #FFFFFF | Card backgrounds |

**Typography:** Fraunces (serif, headings/display — via `--font-playfair` CSS var, kept for minimal diff) + Inter (body/UI — via `--font-geist-sans` CSS var) + JetBrains Mono (receipts/mono UI — via `--font-geist-mono` CSS var). Variable names were kept as-is when the fonts were swapped so existing references didn't need touching.

---

## Folder Structure — Never Change This

```
/src
  /app
    /dashboard
    /spend
    /history
    /reminders
    /deals
    /stores
    /assistant
    /settings
    /api
      /purchases
      /reminders
      /spend
      /ai
      /deals
      /stores
      /settings
    layout.tsx
    page.tsx
  /components
    /ui          — Shadcn auto-generated, never manually edit
    /dashboard   — Dashboard-specific components
    /charts      — Recharts chart components
    /layout      — Sidebar, navbar, header
    /shared      — Reusable components across pages
  /lib
    prisma.ts    — Prisma singleton ONLY, never instantiate elsewhere
    claude.ts    — Anthropic client
    utils.ts     — cn(), formatCurrency(), formatDate(), formatRelativeDate()
  /types
    index.ts     — All TypeScript interfaces
/prisma
  schema.prisma  — Single source of truth for database schema
```

---

## Database Schema — Core Models

```prisma
model User {
  id             String     @id @default(cuid())
  clerkId        String     @unique
  email          String     @unique
  telegramId     String?    @unique
  whatsappNumber String?    @unique
  createdAt      DateTime   @default(now())
  purchases      Purchase[]
  reminders      Reminder[]
}

model Purchase {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  item      String
  quantity  Float
  unit      String?
  category  String?
  price     Float?
  source    String   @default('manual') // telegram | whatsapp | manual | receipt
  createdAt DateTime @default(now())
}

model Reminder {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  item          String
  predictedDate DateTime
  confidence    Float
  active        Boolean   @default(true)
  snoozedUntil  DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

**Never modify the schema without running `npx prisma migrate dev` afterwards.**
**Always run `npx prisma generate` after any schema change.**

---

## Critical Coding Rules

### Prisma
- ALWAYS use the singleton in `/src/lib/prisma.ts` — never `new PrismaClient()` elsewhere
- ALWAYS filter by authenticated user's clerkId — never return data across users
- ALWAYS use `try/catch` around every database call
- NEVER expose raw database errors to the client

```typescript
// CORRECT — singleton pattern
import { prisma } from '@/lib/prisma'

// WRONG — never do this
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

### Clerk Authentication
- ALWAYS use `auth()` from `@clerk/nextjs/server` in API routes
- ALWAYS check `userId` is not null before any database operation
- ALWAYS map clerkId to internal User record before queries

```typescript
// CORRECT pattern for every API route
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })
  
  // proceed with user.id for all database queries
}
```

### API Routes
- ALWAYS return `Response.json()` — never `NextResponse.json()` unless streaming
- ALWAYS include proper HTTP status codes
- ALWAYS validate request body before database operations
- NEVER expose stack traces or internal errors to the client

### TypeScript
- ALWAYS define interfaces in `/src/types/index.ts`
- NEVER use `any` — use `unknown` and narrow with type guards
- ALWAYS type API response shapes explicitly

### Tailwind + Shadcn
- ALWAYS use the `cn()` utility from `/src/lib/utils.ts` for conditional classes
- NEVER override Shadcn component internals — extend via className prop
- ALWAYS use Shadcn components before reaching for custom HTML elements

### Environment Variables
- Client-side variables MUST be prefixed `NEXT_PUBLIC_`
- Server-side secrets MUST NOT be prefixed `NEXT_PUBLIC_`
- NEVER hardcode API keys, URLs, or secrets
- ALWAYS access via `process.env.VARIABLE_NAME`

---

## AI Integration Rules

### Claude API
- ALWAYS use model `claude-sonnet-4-6`
- ALWAYS use `max_tokens: 1000` for chat responses
- ALWAYS use prompt caching (`cache_control: ephemeral`) on system prompts
- NEVER include raw user data in prompts without sanitisation
- ALWAYS include the user's actual purchase data as context — never generic responses
- ALWAYS instruct Claude to stay on topic (household purchases, spending, reminders)

### Vercel AI SDK
- ALWAYS use `streamText` for chat responses — never buffer full responses
- ALWAYS use `useChat` hook on the client side
- NEVER block the UI while waiting for AI responses

---

## Phase 1 Features — Build Order

| # | Ref | Feature | Status |
|---|---|---|---|
| 1 | WEB-1 | Scaffold | In progress |
| 2 | WEB-2 | Auth and Layout | Pending |
| 3 | WEB-3 | Dashboard and Spend Analysis | Pending |
| 4 | WEB-4 | Purchase History and Reminders | Pending |
| 5 | WEB-5 | AI Assistant | Pending |
| 6 | WEB-6 | Deals and Nearest Store | Pending |
| 7 | WEB-7 | Bot Linking and Settings | Pending |
| 8 | WEB-8 | Deploy to Vercel | Pending |

**Always build in this order. Never skip ahead.**

---

## The Restock Data Flow

```
User types in Telegram/WhatsApp
        ↓
Bot parses natural language → extracts item, quantity, unit
        ↓
Saved to Purchase table in PostgreSQL (Railway)
        ↓
Web app reads from same PostgreSQL
        ↓
Dashboard visualises → Spend Analysis → AI Assistant queries
        ↓
Reminder engine predicts depletion → sends reminder via bot
        ↓
User sees deal on Deals page → visits Nearest Store
```

**Every feature should serve this loop. If a feature doesn't serve this loop, question it.**

---

## What Restock Is NOT

- Not a grocery delivery service
- Not locked to one retailer
- Not a recipe or meal planning app
- Not a banking or full budgeting tool
- Not a social app

If a feature request falls outside the household restocking intelligence loop, defer it to Phase 3+.

---

## Deployment Targets

| Environment | URL | Database |
|---|---|---|
| Development | http://localhost:3000 | Railway PostgreSQL |
| Production | https://restock.chat | Railway PostgreSQL |

**Never use a local SQLite database — always connect to Railway PostgreSQL even in development.**

---

## Session Start Checklist

Before writing any code in a new session:
1. Read this CLAUDE.md fully
2. Read LEARNINGS.md fully
3. Check which WEB prompt is next in the build order
4. Confirm .env.local has all required variables
5. Confirm PostgreSQL connection is live: `npx prisma db pull`

---

*This file is the single source of truth for how Restock is built.*
*Update it when patterns change. Never let the codebase drift from it.*