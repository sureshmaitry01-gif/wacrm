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
| **M03** | DeepSeek platform AI + metering | ✅ **Complete** |
| **M04** | Campaign economics: cost calculator, quality score, AI campaign writer | ✅ **Complete** |
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

## M03 — DeepSeek platform AI + metering ✅

Converts AI from primarily BYO into a platform-AI foundation on DeepSeek
V4 Flash, metered against the M02 plan credits. BYO (OpenAI/Anthropic)
unchanged. Campaign writer / quality score / cost calculator are **M04**.

**Delivered:**

- **DeepSeek adapter** (`providers/deepseek.ts`) behind the existing
  `src/lib/ai` abstraction (OpenAI-compatible, `max_tokens`, configurable
  base URL); `AiProvider` union + `generate.ts` dispatch + default model
  extended.
- **Platform config** (`platform.ts`) — server-side key from env, never
  client-exposed; `DEEPSEEK_MODEL` / `DEEPSEEK_BASE_URL` overridable.
- **Runtime resolver** (`runtime.ts`) — one place decides platform vs BYO:
  active BYO key wins (enterprise/self-host), else platform DeepSeek, else
  none. Only platform mode is metered.
- **Quota enforcement** — 1 request = 1 credit against
  `ai_monthly_credits_limit` via M02 `consumeQuota`, consumed before the
  provider call. Draft → 402 upgrade-required on exceed; auto-reply →
  safe skip (left for a human). Fails open.
- **Migration `041`** — the only schema change: relax `ai_usage_log`
  provider CHECK to allow `deepseek`. Credit ledger reuses M02
  `usage_counters`.
- **UI fix** — BYO settings typed to `ByoProvider` (openai/anthropic);
  DeepSeek is platform-only, not pasteable.
- **Docs** — `docs/ai/DEEPSEEK.md`.

**Verification (this milestone, captured 2026-08-26):**

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ pass (exit 0) — clean (one union-driven error found + fixed) |
| `npm run lint` | ✅ pass (exit 0) — 0 errors, 37 warnings (pre-existing, unchanged) |
| `npm run test` | ✅ pass (exit 0) — **897 passed / 88 files** (+19) |
| `npm run build` | ✅ pass (exit 0) |

⚠️ Migrations 040–041 not yet applied to a live DB; DeepSeek model id /
API contract unverified against live docs — see `docs/ai/DEEPSEEK.md` §7.

Committed as `feat(m03): deepseek platform ai and metering`.

## M04 — Campaign economics: writer, quality, cost ✅

First customer-visible differentiation. Additive libraries + APIs +
minimal read-only UI. **No database migration.** No send/webhook changes.

**Delivered:**

- **Cost calculator** — pure `src/lib/campaigns/cost.ts` over an
  editable/versioned `meta-rate-card.ts` (India defaults, `verified:false`,
  no-markup default). `POST /api/campaigns/estimate` (auth; never sends /
  calls Meta).
- **Quality score** — deterministic `src/lib/campaigns/quality.ts`
  (0–100 + grade + risk + issues/improvements). `POST /api/campaigns/quality`
  (no AI, no spend).
- **AI campaign writer** — `src/lib/ai/campaign.ts` (prompt builder +
  defensive parser) on the M03 runtime. `POST /api/ai/campaign` (agent+),
  platform calls metered via `consumeQuota` → 402 on exceed. Hindi/Hinglish
  is a `language` mode (en | hi | hinglish).
- **Minimal UI** — read-only `CampaignInsights` cost+quality card on the
  broadcast review step (step 4); AI-writer UI deferred to M05.
- **Docs** — `docs/campaigns/ECONOMICS.md` (incl. Meta-pricing verification
  warning + no-markup positioning).

**Verification (this milestone, captured 2026-08-26):**

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ pass (exit 0) — clean |
| `npm run lint` | ✅ pass (exit 0) — 0 errors, 37 warnings (pre-existing, unchanged) |
| `npm run test` | ✅ pass (exit 0) — **936 passed / 92 files** (+39) |
| `npm run build` | ✅ pass (exit 0) — campaign routes registered (`/api/ai/campaign`, `/api/campaigns/estimate`, `/api/campaigns/quality`) |

⚠️ Meta India rates are UNVERIFIED (`verified:false`) — confirm against
Meta's live rate card before production. See `docs/campaigns/ECONOMICS.md`.

Committed as `feat(m04): campaign economics writer quality and cost`.

## M05 — Premium CRM UI redesign (checkpoint-based) 🔄 In progress

Design-system + composition pass; no DB/RLS/WhatsApp/billing/AI logic or
route-contract changes. See [docs/ui/M05_UI_DIRECTION.md](docs/ui/M05_UI_DIRECTION.md).

- **M05A — design foundation ✅** (`b66c1cf`): light-first + emerald default,
  AI indigo accent token, calm card shadows, softer canvas, sticky top bar.
- **M05B — shared inbox ✅**: premium three-pane inbox — list header +
  segmented emerald filter pills + inset rounded rows; clean soft-gray
  thread canvas (dropped the WhatsApp doodle) with white inbound cards +
  emerald outbound + circular send; tinted/ringed customer-panel avatar;
  AI thread banner on the reserved indigo accent. Restyle only — inbox
  data flow / realtime / send / assignment preserved. Checks: typecheck ✅,
  lint ✅ (37 warnings), test ✅ 936/92, build ✅. Commit
  `feat(m05b): premium shared inbox redesign`.
- **M05C — campaign wizard + AI writer UI ✅**: broadcast wizard step
  content in a white "cockpit" panel; `CampaignInsights` restructured
  (section header, gray tiles, no-markup chip, colour-coded risk badge);
  new **AI campaign writer panel** (indigo accent) in the template
  composer beside the body field — en/hi/hinglish toggle, Write/Improve,
  result preview with Use-this, and loading/402/not-configured/error
  states. Consumes only the existing `/api/ai/campaign` (no endpoint /
  provider / quota / billing changes; never auto-sends). Checks:
  typecheck ✅, lint ✅ (37 warnings), test ✅ 936/92, build ✅. Commit
  `feat(m05c): campaign wizard and ai writer ui`. Docs:
  `docs/campaigns/AI_WRITER_UI.md`.
- **M05D — dashboard / analytics polish ✅**: KPI cards elevated with
  semantic green/red trend pills (decoupled from brand accent); the three
  chart cards elevated; conversations chart recoloured to emerald +
  muted-slate, response-time bars to emerald; activity feed + quick-action
  badge contrast fixed for light. Restyle only — all dashboard queries /
  calculations / chart geometry preserved. Checks: typecheck ✅, lint ✅
  (37 warnings), test ✅ 936/92, build ✅. Commit
  `feat(m05d): dashboard analytics polish`.
- **M05E — billing / settings polish ✅**: overview status tiles elevated;
  the M02 billing panel got its premium pass — hero current-plan card
  (status pill + price), usage progress bars (emerald→amber→red), and
  emerald-highlighted plan rows with upgrade CTAs; light-contrast fixes to
  `whatsapp-config` / `members-tab` status colours. Presentation only —
  billing/entitlement/Dodo logic, form behavior, and `?tab=` routing
  preserved. Checks: typecheck ✅, lint ✅ (37 warnings), test ✅ 936/92,
  build ✅. Commit `feat(m05e): billing and settings polish`.
- M05F (contacts/templates light polish) — pending.

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
