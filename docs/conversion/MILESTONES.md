# Milestones (detailed)

Per-milestone scope, deliverables, and exit criteria. Status is tracked in
[../../BUILD_STATE.md](../../BUILD_STATE.md). Narrative in
[ROADMAP.md](ROADMAP.md). Rationale in
[WACRM_CONVERSION_AUDIT.md](WACRM_CONVERSION_AUDIT.md).

**Every milestone must keep all four baseline checks green:** `typecheck`,
`lint`, `test`, `build`.

---

## M00A — WACRM fork audit & conversion plan ✅ Complete
- **Scope:** Inspect the repo, assess reuse vs rebuild, decide base-vs-reference.
- **Deliverable:** [WACRM_CONVERSION_AUDIT.md](WACRM_CONVERSION_AUDIT.md).
- **Exit:** Verdict recorded (USE AS BASE), baseline captured.

## M00B — Fork hygiene + SaaS conversion foundation ✅ Complete
- **Scope:** Documentation + guardrails only. No behavior, no schema, no service wiring.
- **Deliverables:** `BUILD_STATE.md`, `docs/decisions/README.md`, `ROADMAP.md`, this file, `SAAS_POSITIONING.md`; `AGENTS.md` guardrails; commented future env placeholders; README conversion banner.
- **Exit:** All four checks green; committed as `chore(m00b): establish SaaS fork conversion foundation`.

## M01 — Vercel/serverless hardening + monitoring foundation ✅ Complete
- **Scope:** Make the app production-safe on Vercel. Documentation + hardening; no product behavior or schema change.
- **Delivered:**
  - Rate limiter (`src/lib/rate-limit.ts`) now has an **Upstash Redis backend** (fixed-window via REST `fetch`, no SDK dependency) selected when the Upstash env vars are set, with **in-memory fallback** (local dev + fail-open). `checkRateLimit` is now `async`; 23 call sites await it; same `RateLimitResult` shape.
  - **Vercel Cron** wired via `vercel.json`; new tested `src/lib/cron/auth.ts` accepts both the existing `x-cron-secret` and Vercel's `Authorization: Bearer <CRON_SECRET>` (backward-compatible). Both cron routes refactored onto it.
  - **Monitoring foundations** (`src/lib/observability/`): env-flagged, no-op-when-unset Sentry + PostHog seams with a PII denylist. Dependency-free; not yet wired into product code.
  - **Docs:** `docs/deployment/VERCEL.md`, `docs/observability/README.md`; `.env.local.example` gains `CRON_SECRET`.
- **Findings (documented, no code change):** broadcast fan-out already uses `after()` + `maxDuration` + a resume path (migration 038). **Durable queue postponed to M07.** `next.config.ts` cache headers reviewed — left as-is (defensive; revisit at production cutover). Sentry/PostHog **SDKs deferred** (Next 16 compat) — seams are the wiring point.
- **Exit:** ✅ All checks green (typecheck, lint, test 842/81, build). Committed `feat(m01): vercel serverless hardening and monitoring foundation`.
- **Deferred to production cutover / later:** actual SDK installs, custom domain + Meta webhook repoint, load testing.

## M02 — Dodo Payments + plan entitlements ✅ Complete
- **Scope:** Billing + entitlement foundation, reusing the existing RLS + signature-verified-webhook patterns.
- **Delivered:** migration `040_billing_dodo.sql` (5 account-scoped tables, `consume_quota` RPC, `seed_account_billing` trigger + backfill); INR-first plan catalog in code; entitlement resolver + atomic quota gate (both fail-open); dependency-free Dodo adapter behind a `BillingProvider` abstraction; idempotent, fail-closed webhook; `/api/billing/{webhook,status,checkout}`; one proof-of-gating surface (broadcast, metered on messages); minimal `Settings → Plan & billing` panel; `docs/billing/DODO.md`.
- **Design notes:** free-plan seeding is a **separate** `accounts` trigger, not an edit to `handle_new_user`. Lapsed subscriptions degrade to Free limits rather than locking the account. Plan limits live in code so pricing changes need no migration.
- **Exit:** ✅ All checks green (typecheck, lint, test 878/84, build). Committed `feat(m02): dodo payments and plan entitlements`.
- **Deferred:** dunning/grace (M07), proration, gating beyond the one surface, billing UI polish (M05), customer portal. **Migration not yet applied to a live DB; Dodo assumptions unverified — see `docs/billing/DODO.md` §6.**

## M03 — DeepSeek platform AI + metering ✅ Complete
- **Scope:** Platform-provided AI on DeepSeek V4 Flash, metered to M02 plan quotas. BYO preserved.
- **Delivered:** `providers/deepseek.ts` adapter (OpenAI-compatible, configurable base URL); `AiProvider` union + dispatch + default model extended; `platform.ts` (server-side key config) + `runtime.ts` (platform-vs-BYO resolver); 1-credit-per-request quota via M02 `consumeQuota` on the draft (402) and auto-reply (safe skip) paths; migration `041` (relax `ai_usage_log` provider CHECK — the only schema change); BYO settings UI typed to `ByoProvider`; `docs/ai/DEEPSEEK.md`.
- **Design notes:** platform-first for normal accounts, active BYO key wins as the enterprise/self-host escape hatch. Both metering helpers fail open. Coarse metering (1 request = 1 credit); token-weighting deferred. Platform auto-reply defaults off (no per-account platform auto-reply settings surface yet).
- **Exit:** ✅ All checks green (typecheck, lint, test 897/88, build). Committed `feat(m03): deepseek platform ai and metering`.
- **Deferred:** per-account mode toggle + platform auto-reply settings (UX + schema), token-based metering, playground on platform, richer `ai_usage_log` status columns. **DeepSeek model id/API unverified against live docs — see `docs/ai/DEEPSEEK.md` §7.**

## M04 — Campaign economics ⏳
- **Scope:** The differentiated features.
- **Planned work:** AI campaign writer (new surface on the AI abstraction, Hindi/Hinglish support); campaign cost calculator (Meta pricing config, India rates, INR); campaign quality score.
- **Exit:** Features usable end-to-end; all checks green.

## M05 — Premium CRM UI redesign ⏳
- **Scope:** Design-system pass over the working screens (logic untouched).
- **Planned work:** tokens/theme, then restyle inbox → campaigns → calculator/AI editor → onboarding → billing.
- **Exit:** Premium CRM feel; all checks green.

## M06 — India-first onboarding ⏳
- **Scope:** Activation for non-technical Indian SMBs.
- **Planned work:** streamlined WhatsApp connect (evaluate Meta Embedded Signup); guided first campaign; Hindi locale + INR/IST; India-localized copy.
- **Exit:** A non-technical SMB can self-onboard; all checks green.

## M07 — Beta readiness ⏳
- **Scope:** Launch hardening.
- **Planned work:** Meta throughput tiers in broadcasts; dunning/grace flows; Flows/Automations consolidation decision; cross-tenant security review (realtime RLS, entitlement helpers); docs.
- **Exit:** Beta-ready; all checks green.
