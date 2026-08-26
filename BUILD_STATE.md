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
| M01 | Vercel/serverless hardening, rate limiting, monitoring foundation | ⏳ Not started |
| M02 | Dodo Payments + plan entitlements | ⏳ Not started |
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
