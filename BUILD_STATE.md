# BUILD_STATE

Living status file for the WACRM → hosted SaaS conversion. One source of
truth for "where are we, what's green, what's next." Update it at the end
of every milestone.

- **Fork of:** `ArnasDon/wacrm` (MIT) — upstream is a self-host template.
- **This repo:** conversion workspace for a hosted, India-first WhatsApp
  campaign + shared-inbox SaaS (see
  [docs/conversion/SAAS_POSITIONING.md](docs/conversion/SAAS_POSITIONING.md)).
- **Audit (source of truth):**
  [docs/conversion/WACRM_CONVERSION_AUDIT.md](docs/conversion/WACRM_CONVERSION_AUDIT.md)
- **Roadmap:** [docs/conversion/ROADMAP.md](docs/conversion/ROADMAP.md) ·
  **Milestones:** [docs/conversion/MILESTONES.md](docs/conversion/MILESTONES.md) ·
  **Decisions:** [docs/decisions/README.md](docs/decisions/README.md)

> This is a **conversion workspace**, not a launched product. Nothing here
> claims the SaaS is live. Core product behavior (WhatsApp send/webhook,
> DB/RLS, inbox, broadcasts) is unchanged from the upstream base except
> where a milestone explicitly says so.

---

## Milestone status

| Milestone | Title | Status |
|---|---|---|
| **M00A** | WACRM fork audit & conversion plan | ✅ **Complete** |
| **M00B** | Fork hygiene + SaaS conversion foundation | ✅ **Complete** |
| **M01** | Vercel/serverless hardening, rate limiting, monitoring foundation | ✅ **Complete** |
| **M02** | Dodo Payments + plan entitlements | ✅ **Complete** |
| M03 | DeepSeek platform AI + metering | ⏳ Not started |
| M04 | Campaign economics: cost calculator, quality score, AI campaign writer | ⏳ Not started |
| M05 | Premium CRM UI redesign | ⏳ Not started |
| M06 | India-first onboarding | ⏳ Not started |
| M07 | Beta readiness | ⏳ Not started |

Full detail: [docs/conversion/MILESTONES.md](docs/conversion/MILESTONES.md).

---

## M00A — WACRM fork audit & conversion plan ✅

- **Delivered:** [docs/conversion/WACRM_CONVERSION_AUDIT.md](docs/conversion/WACRM_CONVERSION_AUDIT.md)
- **Verdict:** USE WACRM AS BASE — high confidence.
- **Baseline captured:** typecheck ✅ · lint ✅ (37 warnings) · test ✅ 825 passed · build ✅.

## M00B — Fork hygiene + SaaS conversion foundation ✅

Documentation and hygiene only. **No core product behavior changed. No
schema migrations added. No services wired.**

**Delivered:**

- State files: `BUILD_STATE.md` (this file),
  [docs/decisions/README.md](docs/decisions/README.md),
  [docs/conversion/ROADMAP.md](docs/conversion/ROADMAP.md),
  [docs/conversion/MILESTONES.md](docs/conversion/MILESTONES.md),
  [docs/conversion/SAAS_POSITIONING.md](docs/conversion/SAAS_POSITIONING.md).
- `AGENTS.md` — added conversion guardrails for contributors/agents.
- `.env.local.example` — added **commented, future-only** placeholders
  (DeepSeek, Dodo, Resend, PostHog, Sentry, Upstash). Existing required
  vars untouched; nothing wired.
- `README.md` — added a top "commercial SaaS fork conversion" banner +
  links to the audit and conversion docs; upstream info and MIT
  attribution preserved.

**Verification (this milestone, captured 2026-08-26):**

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ pass (exit 0) — `tsc --noEmit`, clean |
| `npm run lint` | ✅ pass (exit 0) — 0 errors, 37 warnings (pre-existing, unchanged) |
| `npm run test` | ✅ pass (exit 0) — **825 passed / 79 files**, vitest 4.1.10 |
| `npm run build` | ✅ pass (exit 0) — Next 16, all routes compiled |

Committed as `chore(m00b): establish SaaS fork conversion foundation`.

## M01 — Vercel/serverless hardening + monitoring foundation ✅

First milestone with runtime code changes. **No product behavior changed**
(no WhatsApp send/webhook logic, no DB/RLS, no schema migrations). New
external services are env-flagged and no-op when unset; local dev needs no
new keys.

**Delivered:**

- **Distributed rate limiting.** `src/lib/rate-limit.ts` now selects a
  backend per call: **Upstash Redis** (fixed-window via REST `fetch`, **no
  SDK dependency**) when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  are set; **in-memory** otherwise, and as a fail-open fallback on any
  Upstash error. `checkRateLimit` became `async` (same `RateLimitResult`
  shape); all 23 call sites now `await`. New tests cover both backends
  and the fail-open path.
- **Vercel Cron.** `vercel.json` schedules `/api/automations/cron` and
  `/api/flows/cron`. New shared, tested helper `src/lib/cron/auth.ts`
  accepts **either** the existing `x-cron-secret` (`AUTOMATION_CRON_SECRET`)
  **or** Vercel Cron's `Authorization: Bearer` (`CRON_SECRET`) —
  backward-compatible; both cron routes refactored onto it.
- **Monitoring foundations (no-op when unset).** `src/lib/observability/`
  — Sentry seam (`captureException`/`captureMessage`, gated on `SENTRY_DSN`)
  and PostHog seam (`captureEvent`/`sanitizeProps`, gated on
  `NEXT_PUBLIC_POSTHOG_KEY`) with a PII denylist guard. Dependency-free;
  not yet wired into product code (foundation only).
- **Docs.** `docs/deployment/VERCEL.md` (env vars, cron, serverless review),
  `docs/observability/README.md` (privacy note + how to complete SDK
  wiring). `.env.local.example` gains `CRON_SECRET`.
- **Serverless risk review (documented, no code change):** broadcast
  fan-out already uses `after()` + explicit `maxDuration` and has a resume
  path (migration 038). A cron-drained durable queue is **postponed to
  M07**; do not rewrite the campaign system now.

**Verification (this milestone, captured 2026-08-26):**

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ pass (exit 0) — clean |
| `npm run lint` | ✅ pass (exit 0) — 0 errors, 37 warnings (pre-existing, unchanged) |
| `npm run test` | ✅ pass (exit 0) — **842 passed / 81 files** (+17 new) |
| `npm run build` | ✅ pass (exit 0) — Next 16, all routes compiled |

Committed as `feat(m01): vercel serverless hardening and monitoring foundation`.

## M02 — Dodo Payments + plan entitlements ✅

First milestone with **schema changes**. Adds the billing + entitlement
foundation. No AI, campaign-economics, UI-redesign, or WhatsApp behavior
changes. All Dodo env vars are optional — unset means "not configured", and
local dev/tests run normally.

**Delivered:**

- **Migration `040_billing_dodo.sql`** — `billing_customers`,
  `subscriptions`, `entitlements`, `dodo_webhook_events`, `usage_counters`;
  `consume_quota()` RPC; `seed_account_billing` trigger + backfill. All
  account-scoped with `is_account_member` RLS, matching migration 029's
  idiom. CI schema assertions extended.
- **Plan catalog** (`src/lib/billing/plans.ts`) — INR-first Free / Starter /
  Growth / Agency / Enterprise with all eight limit keys; numbers are
  plain code, easy to edit.
- **Entitlements + quota** (`entitlements.ts`) — override-then-plan
  resolution, lapsed plans degrade to Free limits (not lockout), atomic
  `consumeQuota`, 402 `upgradeRequiredResponse`. **Both fail open.**
- **Provider abstraction** (`types.ts`, `provider.ts`) + **Dodo adapter**
  (`providers/dodo.ts`) — **dependency-free** (fetch + node:crypto),
  Standard-Webhooks HMAC that **fails closed**, defensive event mapping.
- **Routes** — `POST /api/billing/webhook` (verify → store idempotently →
  apply; PII-scrubbed payloads), `GET /api/billing/status`,
  `POST /api/billing/checkout` (admin+).
- **Proof-of-gating** — `POST /api/whatsapp/broadcast` meters
  `monthly_messages_limit` by recipient count (not per-call broadcasts —
  the wizard batches), consumed before the Meta fan-out.
- **UI** — minimal `Settings → Plan & billing` panel (plan, status, usage,
  upgrade CTAs). Visual polish deferred to M05.
- **Docs** — `docs/billing/DODO.md`, incl. the unverified-external-
  assumptions list.

**Verification (this milestone, captured 2026-08-26):**

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ pass (exit 0) — clean |
| `npm run lint` | ✅ pass (exit 0) — 0 errors, 37 warnings (pre-existing, unchanged) |
| `npm run test` | ✅ pass (exit 0) — **878 passed / 84 files** (+36) |
| `npm run build` | ✅ pass (exit 0) — billing routes registered |

⚠️ **Migration 040 has NOT been applied to any live database**, and no live
Dodo account is connected. See `docs/billing/DODO.md` §6 before go-live.

Committed as `feat(m02): dodo payments and plan entitlements`.

---

## Guardrails in force (see AGENTS.md for the authoritative list)

- No Drizzle during the fork conversion. Supabase migrations + RLS +
  PostgREST remain the source of truth.
- No manual table creation in the Supabase dashboard — schema changes go
  through versioned migration files only.
- No billing / DeepSeek / cost calculator / campaign scoring / UI
  redesign / WhatsApp behavior changes until their milestone.
- Keep AI provider changes behind the existing `src/lib/ai` abstraction.
- Do not remove the MIT license or upstream attribution.
- No hardcoded secrets.
