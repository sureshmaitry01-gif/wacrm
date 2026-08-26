# Architecture Decision Records (ADRs)

Durable decisions for the WACRM → hosted SaaS conversion. Each entry
records **what** was decided, **why**, and **when it can be revisited**.
Newest first. Keep entries short; link to the audit
([../conversion/WACRM_CONVERSION_AUDIT.md](../conversion/WACRM_CONVERSION_AUDIT.md))
for detail.

Status legend: **Accepted** · **Superseded** · **Revisit-later**.

---

## ADR-0001 — Use WACRM as the base/fork, not just inspiration
- **Status:** Accepted (M00A)
- **Decision:** Fork `ArnasDon/wacrm` and build the SaaS on top of it, rather than starting greenfield or treating it as reference only.
- **Why:** The audit found a mature multi-tenant model (account-scoped RLS), encrypted per-tenant WhatsApp tokens, and 825 passing tests. Forking saves an estimated 3–5 months.
- **Revisit:** Only if a structural blocker emerges that the base actively fights (none identified).

## ADR-0002 — Do NOT introduce Drizzle during the conversion
- **Status:** Accepted / Revisit-later (M00A, reaffirmed M00B)
- **Decision:** Keep Supabase SQL migrations + RLS + PostgREST (`supabase-js`) as the single data-access and schema source of truth. No Drizzle now.
- **Why:** Tenant isolation *is* RLS-via-PostgREST. Drizzle's direct Postgres connection typically bypasses RLS, which would create a second, RLS-bypassing data path plus dual schema truth — high multi-tenant leak risk for near-zero benefit at this stage.
- **Revisit:** Possibly at M02+ (billing), and only scoped to service-role/background internals where RLS-bypass is intentional. Requires a new ADR to approve.

## ADR-0003 — Schema changes only via versioned migrations
- **Status:** Accepted (M00B)
- **Decision:** All schema changes are versioned SQL files under `supabase/migrations/`, following the existing idempotent, well-commented convention. **No manual table/column creation in the Supabase dashboard.**
- **Why:** Reproducibility across environments, reviewable history, and safe multi-tenant RLS discipline. The 39-file migration ledger is a strength to preserve.
- **Revisit:** Not planned.

## ADR-0004 — AI stays behind a provider abstraction; DeepSeek is the platform provider (later)
- **Status:** Accepted (target); implementation deferred to M03
- **Decision:** All AI provider changes go through the existing `src/lib/ai` abstraction (`generate.ts` + `providers/*`). DeepSeek V4 Flash will be added as a platform provider adapter in M03, alongside a platform-key metering path. No AI provider code changes in M00B.
- **Why:** The abstraction is clean and already isolates provider specifics; DeepSeek is OpenAI-compatible so it slots in as an adapter. Keeping changes behind the abstraction protects the inbox/auto-reply call sites.
- **Revisit:** Provider set and platform-vs-BYO policy revisited at M03.

## ADR-0005 — Target deployment is Vercel; Hostinger/self-host is upstream context only
- **Status:** Accepted (direction); implementation deferred to M01
- **Decision:** Production target is Vercel + Supabase. Hostinger and self-host docs from upstream are retained as reference but are **not** our production path. Cloudflare is optional future infra, **not** an MVP requirement.
- **Why:** Native Next 16 support, Vercel Cron, preview deploys. The audit flagged the in-memory rate limiter and Hostinger-tuned cache headers as items to harden for serverless (M01).
- **Revisit:** Cloudflare/edge posture may be reconsidered post-MVP.

## ADR-0006 — Preserve MIT license and upstream attribution
- **Status:** Accepted (M00B)
- **Decision:** Keep the MIT license and acknowledge `ArnasDon/wacrm` as the upstream base in README and docs, even as the fork becomes a commercial SaaS.
- **Why:** License compliance and good-faith open-source attribution. MIT permits commercial use provided the license/attribution is retained.
- **Revisit:** Not planned.

---

### How to add an ADR
Append a new `## ADR-NNNN — <title>` block (increment the number), fill in
Status / Decision / Why / Revisit, and update anything it supersedes.
