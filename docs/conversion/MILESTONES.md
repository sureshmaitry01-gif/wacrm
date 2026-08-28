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

## M04 — Campaign economics ✅ Complete
- **Scope:** First customer-visible differentiation. Additive libs + APIs + minimal read-only UI; no migration, no send/webhook changes.
- **Delivered:** pure cost calculator (`cost.ts`) over an editable/versioned `meta-rate-card.ts` (India defaults, unverified, no-markup default) + `/api/campaigns/estimate`; deterministic quality scorer (`quality.ts`) + `/api/campaigns/quality`; AI campaign writer (`ai/campaign.ts`) on the M03 runtime, quota-metered, with Hindi/Hinglish as a `language` mode + `/api/ai/campaign`; read-only `CampaignInsights` card on the broadcast review step; `docs/campaigns/ECONOMICS.md`.
- **Design notes:** Meta rates are config, not hardcoded truth — every estimate carries a verification warning and tests validate math, not the rate values. Quality is deterministic-first (AI augmentation deferred). AI-writer UI deferred to M05 (endpoint ready).
- **Exit:** ✅ All checks green (typecheck, lint, test 936/92, build). Committed `feat(m04): campaign economics writer quality and cost`.
- **Deferred:** Meta rate verification (pre-production), AI-augmented quality, AI-writer composer UI (M05), service-window pricing, token-based AI metering.

## M05 — Premium CRM UI redesign ⏳
- **Scope:** Design-system pass over the working screens (logic untouched).
- **Planned work:** tokens/theme, then restyle inbox → campaigns → calculator/AI editor → onboarding → billing.
- **Exit:** Premium CRM feel; all checks green.

## M06 — India-first onboarding ⏳
- **Scope:** Activation for non-technical Indian SMBs.
- **Planned work:** streamlined WhatsApp connect (evaluate Meta Embedded Signup); guided first campaign; Hindi locale + INR/IST; India-localized copy.
- **Exit:** A non-technical SMB can self-onboard; all checks green.

## M07 — Beta readiness ⏳ (split into A/B/C/D)

Launch hardening, sequenced so provider-contract verification and data/infra
validation precede monitoring and the security/launch sign-off.

### M07A — Provider-contract / external-service verification ⏳ Blocked
- **Scope:** Verify, against live sources, the external contracts earlier
  milestones assumed: DeepSeek model id / base URL / `max_tokens` (M03),
  Dodo webhook signature scheme + header/field names + INR subscriptions
  (M02), and the Meta India rate card (M04). Update adapters/config **only**
  where a discrepancy is confirmed, behind the existing abstractions.
- **Status:** **Blocked** pending real DeepSeek / Dodo / Meta evidence — not
  started, not to be marked complete until that evidence exists.

### M07B — Data & infrastructure validation ✅ Complete
- **Delivered:** migrations 040–041 validated against a real local Postgres
  from a clean `supabase db reset`; `verify-schema.sql` strengthened
  (billing tables, RLS-enabled, `consume_quota`, seed trigger, 041 CHECK);
  a cross-tenant RLS smoke test (`supabase/ci/rls-smoke.sql`) proving tenant
  isolation, wired into `migrations.yml`. Committed `test(m07b): …`
  (`68fcf28`), pushed.

### M07C — Monitoring + operational hardening ✅ Complete
- **Delivered:** real **Sentry** (`@sentry/nextjs`, server-side via
  `src/instrumentation.ts`, errors-only, `sendDefaultPii:false`) forwarded
  from the M01 seam; real **PostHog** (`posthog-node`, server-side,
  non-blocking) from the analytics seam with a shared `sanitizeProps`
  denylist (`redact.ts`) in-path; presentation-only **dunning** banner
  (`PaymentStatusNotice`) for `on_hold`/`failed`/`expired`, with the
  `expired` copy's free-plan-fallback claim backed by `entitlements.ts`
  (lines 32/92/95); **broadcast durability** decision — retain resume, no
  cron yet ([docs/deployment/BROADCAST_DURABILITY.md](../deployment/BROADCAST_DURABILITY.md));
  this A/B/C/D structure persisted.
- **Guardrails held:** no billing/Dodo/DeepSeek/WhatsApp/RLS/migration
  changes; no M07D security-grant work; both integrations no-op when env
  unset.
- **Exit:** ✅ typecheck, lint (37 warnings), test 955/94, build all green.

### M07D — Security review + beta launch checklist ✅ Complete
- **Scope:** `REVOKE EXECUTE … FROM PUBLIC, anon` on SECURITY-DEFINER RPCs;
  make `migrations.yml` a required check; `supabase/.branches` `.temp`
  gitignore hygiene; CSP `Report-Only` → enforce; cross-tenant security
  sign-off; Hindi-localization go/no-go; QA + a beta-readiness assessment.
- **Delivered:**
  - **Migration `042_secdef_execute_hardening.sql`** — fixes a **MEDIUM**
    finding: `consume_quota` was SECURITY DEFINER, granted to
    `authenticated`, and trusted caller-supplied `p_account_id`/`p_limit`,
    so a signed-in user could meter/tamper **another tenant's** counters via
    PostgREST. Proven exploitable on a live DB (negative control: victim
    counter 42 → 47), fixed with an `is_account_member` check (mirroring
    017), re-proven blocked while own-account metering still works. Also
    revokes default PUBLIC/anon EXECUTE on `consume_quota`,
    `claim_ai_reply_slot`, `is_account_member`, `seed_account_billing`.
  - **Assertions + regression test** — `verify-schema.sql` asserts the
    grants via `has_function_privilege`; `rls-smoke.sql` gained a
    cross-tenant `consume_quota` regression. Both run in CI.
  - **`.gitignore`** — narrow `/supabase/.branches/` + `/supabase/.temp/`
    (verified all 44 tracked `supabase/` files stay tracked).
  - **[docs/beta/READINESS.md](../beta/READINESS.md)** — the authoritative
    beta checklist (PASS / BLOCKED / MANUAL ACTION / DEFERRED).
- **Decisions:** CSP stays **Report-Only** (repo's own gate — two clean
  deploys — unmet; no prod deploy yet). **English-only UI** for beta;
  Hindi/Hinglish **AI writing** ships and no copy promises a Hindi UI.
  Required-check + backup posture are **console-side manual actions**
  (`gh` unauthenticated here — not claimed as done).
- **Audited, no defect:** 22 SECDEF functions; `search_path` pinned
  everywhere; **no client-supplied `account_id`** in any API route;
  service-role routes authorize then scope by server-derived `accountId`;
  webhook/cron auth fail closed; no server secret in `NEXT_PUBLIC_*` or any
  client component; webhook payloads scrubbed before persistence.
- **Verification:** full `db reset` from nothing ×2 (42 migrations),
  `verify-schema.sql` ✅, `rls-smoke.sql` ✅ (also re-runnable without a
  reset), typecheck ✅, lint ✅ (37 warnings), test ✅ 955/94, build ✅.

- **Exit (whole milestone):** Beta-ready; all checks green.
