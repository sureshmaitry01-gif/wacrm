# Conversion Roadmap

High-level plan for turning the WACRM fork into a hosted, India-first
WhatsApp campaign + shared-inbox SaaS. This is the *narrative* roadmap;
the per-milestone checklist lives in
[MILESTONES.md](MILESTONES.md), status lives in
[../../BUILD_STATE.md](../../BUILD_STATE.md), and the rationale lives in
[WACRM_CONVERSION_AUDIT.md](WACRM_CONVERSION_AUDIT.md).

> Not launched. This roadmap describes intended work, not shipped
> features.

## Where we are

The base (upstream WACRM) already gives us the hard parts: a real
multi-tenant account/team model with account-scoped RLS, AES-256-GCM
encrypted per-tenant WhatsApp tokens, a full Meta template + broadcast
system, a shared inbox, contacts/pipelines, a public API, and a clean AI
provider abstraction. All four baseline checks are green.

What's missing is the **commercial SaaS layer**: billing, platform-metered
AI, campaign-economics features, premium UI, India-first onboarding, and a
Vercel-first deployment posture. None of these fight the architecture —
they are additive.

## Target stack

Next.js 16 · Vercel · Supabase (Postgres + Auth + Storage + Realtime) ·
Meta WhatsApp Cloud API · DeepSeek V4 Flash (platform AI) · Dodo Payments ·
Resend · PostHog · Sentry. Existing Supabase migrations + RLS pattern
retained. **No Cloudflare in MVP. No Drizzle for now.**

## Sequencing logic

Revenue-enabling and safety work land **before** we spend the platform's
own AI budget at scale:

1. **Foundation & safety first** (M00B–M01): document the conversion, then
   harden for serverless (distributed rate limiting, monitoring, crons).
2. **Money in** (M02): billing + entitlements, so plans can gate usage.
3. **Metered AI** (M03): DeepSeek on a platform key, gated by the M02
   quotas — never uncapped spend.
4. **Differentiation** (M04): the campaign-economics features that set us
   apart (cost calculator, quality score, AI campaign writer).
5. **Experience** (M05–M06): premium CRM UI, then India-first onboarding.
6. **Launch readiness** (M07): beta hardening, security review, docs.

## Milestone ladder

| # | Milestone | Theme | Status |
|---|---|---|---|
| M00A | Fork audit & conversion plan | Decide | ✅ Complete |
| M00B | Fork hygiene + SaaS conversion foundation | Document & guardrail | ✅ Complete |
| M01 | Vercel/serverless hardening + monitoring | Safety | ✅ Complete |
| M02 | Dodo Payments + plan entitlements | Money in | ✅ Complete |
| M03 | DeepSeek platform AI + metering | Metered AI | ✅ Complete |
| M04 | Campaign economics (calculator, score, writer) | Differentiation | ⏳ Next |
| M05 | Premium CRM UI redesign | Experience | ⏳ |
| M06 | India-first onboarding | Activation | ⏳ |
| M07 | Beta readiness | Launch | ⏳ |

## Guiding constraints (see [../decisions/README.md](../decisions/README.md))

- WACRM is the base/fork.
- Supabase migrations + RLS + PostgREST are the source of truth. No manual
  dashboard schema edits. No Drizzle now.
- AI changes stay behind the `src/lib/ai` abstraction.
- Vercel is the deployment target; Hostinger/self-host is upstream context.
- MIT license + upstream attribution preserved.
