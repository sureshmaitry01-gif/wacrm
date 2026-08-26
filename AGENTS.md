<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SaaS conversion guardrails

This repository is a **fork of `ArnasDon/wacrm` (MIT)** being converted from
a self-host template into a **hosted, India-first commercial SaaS**. Read
these before making changes. Context:
[docs/conversion/WACRM_CONVERSION_AUDIT.md](docs/conversion/WACRM_CONVERSION_AUDIT.md)
(source-of-truth audit) ·
[docs/conversion/ROADMAP.md](docs/conversion/ROADMAP.md) ·
[docs/decisions/README.md](docs/decisions/README.md) ·
[BUILD_STATE.md](BUILD_STATE.md).

## Source of truth

- Treat **`docs/conversion/WACRM_CONVERSION_AUDIT.md`** as the current
  authoritative audit of this codebase.
- Check **`BUILD_STATE.md`** for the active milestone and what is in/out of
  scope right now.

## Data & schema

- **Do NOT manually create or alter tables in the Supabase dashboard.** All
  schema changes are **versioned migration files** under
  `supabase/migrations/`, following the existing idempotent, commented
  convention.
- **Keep customer-facing tenant data access aligned with the existing
  Supabase RLS patterns** — account-scoped policies via
  `is_account_member(account_id, min_role)`. New tables that hold tenant
  data must carry `account_id` and membership-checked RLS.
- **Do NOT introduce Drizzle** during the fork conversion unless a future
  ADR explicitly approves it
  ([ADR-0002](docs/decisions/README.md)). Supabase migrations + RLS +
  PostgREST (`supabase-js`) remain the single data-access source of truth.

## WhatsApp & core behavior

- **Do NOT replace or change core WhatsApp send/webhook logic without
  tests.** The `src/lib/whatsapp/*` layer is covered by unit tests — keep
  them green and add tests for any change.
- Do not change core DB/RLS or inbox/broadcast behavior outside the
  milestone that owns that work (see `MILESTONES.md`).

## AI

- **Keep AI provider changes behind the existing `src/lib/ai` abstraction**
  (`generate.ts` + `providers/*`). DeepSeek and platform-metered AI arrive
  in M03; do not wire them earlier.

## Deployment & licensing

- Deployment target is **Vercel** (not Hostinger). Hostinger/self-host docs
  are upstream context only. **Cloudflare is optional future infra, not an
  MVP requirement.**
- **Preserve the MIT license and upstream attribution.**

## Always

- Do not hardcode secrets. Env placeholders in `.env.local.example` are
  documentation only until their milestone wires them.
- Keep all four baseline checks green: `typecheck`, `lint`, `test`,
  `build`.
