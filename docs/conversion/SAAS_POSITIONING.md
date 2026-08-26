# SaaS Positioning & Conversion Context

This document explains what this repository is **becoming** and the
boundaries of the conversion in progress. It is the plain-language
companion to the [audit](WACRM_CONVERSION_AUDIT.md), the
[roadmap](ROADMAP.md), and the [decisions log](../decisions/README.md).

> **Status: conversion in progress, not launched.** Nothing in this repo
> should be read as a claim that the SaaS is live or generally available.

---

## 1. What this fork is becoming

Upstream [`ArnasDon/wacrm`](https://github.com/ArnasDon/wacrm) is an
open-source, **self-hostable** WhatsApp CRM *template* — you fork it,
brand it, and host it yourself.

**This fork is being converted into a hosted, commercial SaaS**: a
managed, multi-tenant product that customers sign up for and pay for,
without running any infrastructure themselves. The upstream code is our
**base**, not merely inspiration (see
[ADR-0001](../decisions/README.md#adr-0001--use-wacrm-as-the-basefork-not-just-inspiration)).

The product direction: an **India-first WhatsApp campaign + shared-inbox
SaaS**, inspired by OdoReach, with a cleaner premium CRM experience, an AI
campaign writer, a campaign cost calculator, a campaign quality score,
Hindi/Hinglish AI writing, and transparent Meta message-cost positioning.

## 2. Positioning: India-first

Primary market is **India**, targeting businesses that already live inside
WhatsApp:

- Indian **sellers** (including Instagram/WhatsApp-native sellers)
- **Agencies** running messaging for multiple clients
- **Coaching institutes** and educators
- **Real estate teams**
- **Local retailers**
- **Clinics** and other **service businesses**

**Secondary market:** international users later. The product should not be
architected in a way that blocks a global audience — but India-first
choices (Hindi/Hinglish, INR, IST, WhatsApp-familiar UX, Meta India
pricing in the cost calculator) take priority in the roadmap.

### Transparent Meta message cost — a positioning asset, not a gap
Each tenant connects **their own** Meta WhatsApp Cloud API credentials, so
their messages bill directly against **their own** Meta account at Meta's
rates. We do not resell messages or mark them up. This "transparent Meta
cost, no hidden markup" model (OdoReach-style) is a deliberate strength of
the base architecture and should be preserved.

## 3. Deployment direction

- **Target production: Vercel + Supabase.** Native Next.js 16 support,
  Vercel Cron, and preview deploys.
- **Hostinger / self-host docs from upstream are context only** — retained
  as reference and for attribution, but **not** our production path. Do not
  treat the README's Hostinger sections as our deployment instructions.
- **Cloudflare is optional future infrastructure, not an MVP requirement.**
- Serverless hardening (distributed rate limiting, cron migration, cache
  header review, monitoring) is scheduled for **M01** — see
  [MILESTONES.md](MILESTONES.md).

See [ADR-0005](../decisions/README.md#adr-0005--target-deployment-is-vercel-hostingerself-host-is-upstream-context-only).

## 4. Architectural boundaries we are keeping

- **Supabase migrations + RLS + PostgREST are the source of truth.** No
  manual schema edits in the Supabase dashboard; schema changes are
  versioned migration files only.
- **No Drizzle during the conversion**
  ([ADR-0002](../decisions/README.md#adr-0002--do-not-introduce-drizzle-during-the-conversion)).
- **AI changes stay behind the `src/lib/ai` abstraction**; DeepSeek arrives
  as a platform provider adapter in M03.
- **MIT license + upstream attribution are preserved.**

## 5. What NOT to do yet (current milestone: M00B)

M00B is **documentation and hygiene only**. Until the relevant milestone
explicitly opens the work, do **not**:

- ❌ Connect a live production Supabase project (unless explicitly instructed).
- ❌ Implement Dodo Payments (that's M02).
- ❌ Implement DeepSeek / platform AI (that's M03).
- ❌ Build the cost calculator, quality score, or AI campaign writer (M04).
- ❌ Redesign the UI (M05).
- ❌ Change WhatsApp send/webhook behavior, or core DB/RLS logic.
- ❌ Add Drizzle.
- ❌ Add database migrations in M00B (none are needed for this milestone).
- ❌ Remove the MIT license or upstream attribution.
- ❌ Hardcode secrets, or wire the future env placeholders to live services.

These are guardrails, not permanent bans — each unlocks at its milestone.
The authoritative contributor rules live in
[`AGENTS.md`](../../AGENTS.md).

## 6. Environment variables (future placeholders)

`.env.local.example` documents **future** env requirements as commented
placeholders so contributors know what's coming. In M00B they are
**documentation only — not wired to any service**:

| Variable | For | Milestone |
|---|---|---|
| `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` | Platform AI (DeepSeek V4 Flash) | M03 |
| `DODO_API_KEY`, `DODO_WEBHOOK_SECRET` | Dodo Payments billing | M02 |
| `RESEND_API_KEY` | Transactional email (invites, receipts, dunning) | M01/M02 |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics | M01 |
| `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | Error monitoring / release upload | M01 |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting | M01 |

Existing **required** env vars (Supabase, `ENCRYPTION_KEY`,
`META_APP_SECRET`, etc.) are unchanged.
