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

## M02 — Dodo Payments + plan entitlements ⏳
- **Scope:** Billing + entitlement enforcement (net-new, reusing existing RLS + signature-verified-webhook patterns).
- **Planned work:** plan catalog; `subscriptions` / entitlements / usage-counter migrations (versioned, account-scoped RLS); `billing/provider` abstraction + Dodo adapter; signature-verified Dodo webhook; signup seeds a free plan; quota-gating helper (SECURITY DEFINER); billing/upgrade UI.
- **Exit:** Users can subscribe; entitlements enforced; INR verified; all checks green.

## M03 — DeepSeek platform AI + metering ⏳
- **Scope:** Platform-provided AI, metered to plan quotas from M02.
- **Planned work:** `providers/deepseek.ts` adapter (OpenAI-compatible); extend `AiProvider` + dispatch; platform-key mode alongside BYO; wire `ai_usage_log` → quota enforcement; per-plan model/token tiers.
- **Note:** Confirm the exact DeepSeek model id/API against live DeepSeek docs before coding.
- **Exit:** AI works without user keys, capped by plan; all checks green.

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
