# WACRM → Hosted SaaS — Conversion Audit

**Document:** `docs/conversion/WACRM_CONVERSION_AUDIT.md`
**Date:** 2026-08-26
**Auditor:** Claude (Opus) — inspection only, no product changes made
**Base commit:** `main` @ `6ed9191` (merge of PR #496 mirror-inbound-media)
**Fork of:** `ArnasDon/wacrm` v0.8.1
**Target product:** India-first WhatsApp campaign + inbox SaaS ("OdoReach-class"), hosted on Vercel

---

## 1. Executive Verdict

> **USE AS BASE — with high confidence.** This is not a toy template. It is a
> mature, well-tested, genuinely multi-tenant WhatsApp CRM whose hardest SaaS
> problem (account/team model + account-scoped RLS + encrypted per-tenant
> WhatsApp tokens) is **already solved and battle-tested**. Forking this saves
> an estimated 3–5 months versus greenfield.

The three things that usually sink a "template → SaaS" conversion are already done well here:

1. **Multi-tenancy is real**, not bolted on. Migration `017_account_sharing.sql` converts every table from `user_id`-scoped to `account_id`-scoped, with a `is_account_member(account_id, min_role)` SECURITY DEFINER helper enforced in RLS on every table, and a 4-level role hierarchy (`owner > admin > agent > viewer`).
2. **Secrets are encrypted at rest** — WhatsApp tokens and BYO AI keys are AES-256-GCM encrypted (authenticated encryption, legacy CBC decrypt-only path for migration).
3. **The codebase is healthy** — 825 passing tests, clean typecheck, clean build, modern stack (Next 16, React 19, Tailwind v4).

**What is genuinely missing** is the commercial SaaS layer: billing (Dodo Payments), platform-provided AI (replacing BYO keys with DeepSeek), plan/entitlement/quota enforcement, the campaign-economics features (cost calculator, quality score, AI campaign writer), and a Vercel-first deployment posture. None of these fight the existing architecture — they are **additive**.

**The one thing to NOT do right now:** do not introduce Drizzle ORM. See §14. It would put a second, RLS-bypassing data path next to a carefully RLS-scoped one, for near-zero benefit at this stage.

---

## 2. Current Repo Health Summary

| Signal | Status | Notes |
|---|---|---|
| `npm run typecheck` | ✅ **Pass** (exit 0) | `tsc --noEmit`, strict TS 6 |
| `npm run lint` | ✅ **Pass** (0 errors) | 37 warnings — all `react-hooks/exhaustive-deps` + unused vars, cosmetic |
| `npm run test` | ✅ **Pass** | **825 tests / 79 files**, ~7s (vitest 4) |
| `npm run build` | ✅ **Pass** (exit 0) | Next 16 build, `output: standalone`, all routes compile |
| Version | `0.8.0` (pkg) / `0.8.1` (CHANGELOG) | Pre-1.0, active |
| Migrations | 39 sequential SQL files (`001`→`039`) | Idempotent, well-commented, `IF NOT EXISTS` discipline |
| License | MIT | Fork-friendly, no relicensing blocker |

**Stack (actual, from `package.json`):**

- Next.js **16.2.12** (App Router, Server Actions, RSC), React **19.2.4**, TypeScript **6**
- Tailwind **v4** (`@tailwindcss/postcss`), shadcn/ui (`components.json`), Base UI, Lucide, Recharts, Sonner
- Supabase: `@supabase/ssr` **0.12**, `@supabase/supabase-js` **2.107** — **no ORM**
- `next-intl` **4.13** (i18n; `en` + `ko` message bundles present)
- `@xyflow/react` + `@dagrejs/dagre` + `@dnd-kit` (visual flow/automation builder, Kanban)
- Vitest **4** for tests

**Assessment:** This is a **healthy, actively-maintained, production-grade** codebase. No red flags in build health. The warning count is trivial and non-blocking.

---

## 3. Existing Feature Inventory

Derived from `src/app`, `src/lib`, `supabase/migrations`, and `README.md`.

| Module | Where | Maturity | Notes |
|---|---|---|---|
| **Auth** | `src/middleware.ts`, `src/lib/supabase/*`, `(auth)/*` | ✅ Solid | Supabase Auth (email/password), SSR cookie refresh handled correctly (issue #288 fix), protected-route middleware |
| **Accounts / Teams** | migration `017`–`020`, `src/lib/auth/account.ts`, `src/lib/account/members.ts` | ✅ Strong | One-account-per-user, role hierarchy, ownership transfer, presence |
| **Invitations** | migration `019`, `src/lib/auth/invitations.ts`, `/api/invitations/*`, `/join/[token]` | ✅ Strong | Token-hashed (SHA-256) invite links, expiry, one-time redeem |
| **Contacts** | migration `001`,`022`,`025`, `/contacts`, `src/lib/contacts` | ✅ Solid | Tags, custom fields, notes, CSV import, phone dedup |
| **Shared Inbox** | migration `023`,`035`,`039`, `/inbox`, `src/lib/inbox` | ✅ Strong | Realtime, assignment, status, voice notes, media, interactive messages, inbound media mirroring |
| **Pipelines (Kanban)** | migration `002`, `/pipelines`, `src/components/pipelines` | ✅ Solid | Deals linked to conversations, dnd-kit |
| **Broadcasts / Campaigns** | migration `003`,`005`,`037`,`038`, `/broadcasts`, `src/lib/whatsapp/broadcast-*` | ✅ Strong | Template-based, per-recipient variable substitution, delivery/read tracking, incremental counts, resume-on-failure |
| **Message Templates** | migration `014`, `/api/whatsapp/templates/*`, `src/lib/whatsapp/template-*` | ✅ Strong | Full Meta template lifecycle: submit, sync, status normalize, image-header resumable upload |
| **Automations (no-code)** | migration `006`,`007`, `/automations`, `src/lib/automations` | ✅ Solid | Trigger→condition→action, cron drain for waits |
| **Flows (visual builder)** | migration `010`,`012`,`016`, `/flows`, `src/lib/flows`, xyflow | ✅ Solid | Node graph, media nodes, runs log — overlaps conceptually with Automations |
| **AI Reply Assistant** | migration `029`–`034`, `src/lib/ai/*`, `/api/ai/*` | ⚠️ BYO-key | Draft + auto-reply + handoff, provider abstraction (OpenAI/Anthropic), knowledge base (FTS + optional pgvector), `ai_usage_log` metering |
| **Notifications** | migration `027`, `/notifications` | ✅ Solid | In-app notification feed |
| **Public REST API** | migration `026`, `/api/v1/*`, `src/lib/api/v1` | ✅ Strong | Scoped, revocable, hashed API keys |
| **Outbound Webhooks** | migration `028`, `/api/v1/webhooks`, `src/lib/webhooks` | ✅ Solid | HMAC-signed event delivery |
| **MCP Server** | `mcp-server/`, `docs/mcp.md` | ✅ Present | Drive CRM from Claude/Cursor, read-only default |
| **Dashboard/Analytics** | `/dashboard`, `src/lib/dashboard`, Recharts/Tremor | ✅ Solid | Response times, volume, pipeline value, activity feed |
| **i18n** | `next-intl`, `messages/en.json`, `ko.json` | ✅ Present | English + Korean. **No Hindi/regional Indian yet** |
| **Billing / Subscriptions** | — | ❌ **Absent** | No plans, no payments, no entitlements, no quota gating |

---

## 4. Mapping Table — WACRM Feature vs Our SaaS Need

| Our SaaS Need | Exists in WACRM? | Fit | Action |
|---|---|---|---|
| Shared WhatsApp inbox | ✅ Yes, strong | Excellent | **Reuse**, restyle |
| WhatsApp campaigns/broadcasts | ✅ Yes, strong | Excellent | **Reuse**, restyle + extend |
| Meta template management | ✅ Yes, strong | Excellent | **Reuse** |
| Contacts/CRM | ✅ Yes | Excellent | **Reuse**, restyle |
| Sales pipelines | ✅ Yes | Good (CRM-premium feel) | **Reuse**, restyle |
| Multi-tenant accounts + teams | ✅ Yes, strong | Excellent | **Reuse** (crown jewel) |
| Role-based access | ✅ Yes (owner/admin/agent/viewer) | Good | **Reuse**, maybe extend for billing-owner |
| Transparent Meta message cost / no markup | ✅ Architecture aligns (BYO WABA token) | **Perfect fit for OdoReach positioning** | **Reuse** — this is your moat, not a gap |
| **AI campaign writing** | ⚠️ Partial (AI infra exists, reply-focused) | Reusable engine, new use case | **Refactor + extend** |
| **Platform-provided AI (DeepSeek)** | ❌ Currently BYO-key | Abstraction exists | **Refactor** (add provider + platform-key mode + metering→quota) |
| **Campaign cost calculator** | ❌ No | — | **Build new** (can reuse Meta pricing + `default_currency`) |
| **Campaign quality score** | ❌ No | — | **Build new** (reuse template + AI infra) |
| **Billing (Dodo Payments)** | ❌ No | — | **Build new** |
| **Plans / entitlements / quotas** | ❌ No | — | **Build new** |
| Premium CRM dashboard UI | ⚠️ Functional, not premium | shadcn base is good | **Redesign** (frontend-design pass) |
| India-first (Hindi, INR, IST) | ⚠️ Partial (currency field exists, no Hindi) | — | **Extend** (locales + INR default) |
| Public API / webhooks / MCP | ✅ Yes | Good | **Keep**, possibly gate by plan |
| Vercel deployment | ⚠️ Hostinger-first | Runs on Node anywhere | **Refactor** deployment posture |
| Analytics (PostHog) | ❌ No | — | **Build new** (add SDK) |
| Error monitoring (Sentry) | ❌ No | — | **Build new** (add SDK) |
| Transactional email (Resend) | ❌ No (invites derive links, no email send yet) | — | **Build new** |

---

## 5. Reuse / Refactor / Remove / Postpone

### ✅ Reuse as-is (do not touch beyond restyling)

- Account/team model + RLS (`017`–`020`), invitations (`019`), members RPCs (`018`)
- WhatsApp token encryption (`src/lib/whatsapp/encryption.ts`) — GCM, authenticated
- Meta Cloud API integration (`src/lib/whatsapp/meta-api.ts`, `send-message`, `template-*`)
- Webhook signature verification (`webhook-signature.ts`, HMAC-SHA256)
- Broadcast core + resume (`broadcast-core.ts`, `broadcast-resume.ts`)
- Shared inbox, conversations resolver, media mirroring
- Contacts, tags, custom fields, pipelines, deals
- Public API v1 + API keys + outbound webhooks
- Auth middleware + SSR cookie handling

### 🔧 Refactor (keep the bones, change behavior)

- **AI system → platform-provided.** Add DeepSeek provider adapter (OpenAI-compatible = trivial), add a "platform key" mode alongside BYO, wire `ai_usage_log` → billing/quota enforcement. (§8)
- **Deployment posture → Vercel.** Rate limiter (§10), README/positioning, cache headers, `output: standalone`. (§12)
- **Signup → billing-aware.** `handle_new_user` trigger should also seed a default free-plan subscription row (once billing schema exists). (§9)
- **AI campaign writing** — reuse `generateReply`/provider layer for a new "compose campaign" surface. (§8)

### 🗑️ Remove or hide (for hosted SaaS)

- **Hostinger marketing** in `README.md` and referral links (replace with your SaaS README).
- **BYO-AI-key settings UI** — hide once platform AI ships (keep the code path behind a flag for enterprise "bring your own key" tier later; don't delete).
- **Self-host framing** throughout docs.
- **Consider:** consolidating **Flows** and **Automations** — they overlap (both are trigger→action engines). Not urgent; postpone the decision, but flag it so you don't invest UI polish in both.

### ⏸️ Postpone (valuable later, not MVP)

- MCP server (`mcp-server/`) — keep, don't invest now; possibly a paid-tier feature.
- Korean locale — keep, deprioritize; add Hindi + regional Indian instead.
- pgvector semantic KB — works, but platform-embedding cost/metering is a later concern; lexical FTS is fine for MVP.
- Flows/Automations consolidation.

---

## 6. Database & RLS Assessment

**Model:** `profiles.account_id` + `profiles.account_role` are the tenancy anchor. Every domain table carries `account_id`; RLS policies call `is_account_member(account_id, min_role)` (SECURITY DEFINER, reads `profiles` without recursive RLS). Role tiers: viewers read, agents+ write operational data, admins+ write settings-class tables.

**Strengths:**

- RLS is enabled on **every** table with membership-checked policies (not the naive `auth.uid() = user_id`).
- One-account-per-user enforced by `idx_accounts_one_per_owner` unique index — simple, correct, cheap reads.
- `whatsapp_config` is `UNIQUE(account_id)` — one WABA number per tenant.
- Migrations are idempotent and heavily commented with *why*, not just *what*. This is unusually disciplined.
- The service-role key is used only server-side (webhook, automation engine, public-API key auth) — the boundary is respected.

**Risks / gaps for hosted multi-tenant SaaS:**

1. **Legacy `user_id` columns remain** on domain tables (kept for "which agent owns this row"). They are *no longer* the tenancy key. Risk: a future query or new table author mistakenly scopes by `user_id` instead of `account_id`. **Mitigation:** code-review rule + a lint/test that asserts new tables have `account_id` + membership RLS.
2. **`profiles.role TEXT`** (legacy, unused) still exists — flagged for removal in `017`'s own comments. Cosmetic tech debt.
3. **No billing tables** → §9. When added, they MUST follow the same `account_id` + `is_account_member` RLS pattern, and quota/entitlement reads should be a SECURITY DEFINER helper (like `is_account_member`) to avoid recursive RLS.
4. **`messages` INSERT policy is `WITH CHECK (true)`** — deliberately open so the service-role webhook can insert. Correct given service-role usage, but worth documenting as intentional so a security review doesn't flag it as a hole.
5. **Realtime publication** includes `messages` + `conversations`. Fine, but at SaaS scale confirm RLS is enforced on the realtime channel (Supabase applies RLS to realtime — verify with a cross-tenant test as part of M-billing hardening).

**Verdict:** The DB/RLS foundation is **production-grade and SaaS-ready**. Billing is the only structural addition needed, and it slots into the existing pattern cleanly.

---

## 7. WhatsApp Integration Assessment

**Model:** Each account stores its **own** Meta Cloud API credentials (`phone_number_id`, `waba_id`, `access_token` [GCM-encrypted], `verify_token`) in `whatsapp_config`. All Meta API calls are server-side. Inbound webhook is HMAC-verified against `META_APP_SECRET`.

**Why this is a strategic asset, not a gap:** Your positioning is "transparent Meta cost, no hidden markup" (OdoReach-style). The **BYO-WABA-token model is exactly right** for that — each seller's messages bill directly against *their own* Meta account at Meta's rates. You are not reselling messages, so you carry no WhatsApp-cost float, no per-message reconciliation liability, and no markup to defend. **Keep this model.**

**Strengths:**

- Encrypted tokens (GCM + legacy CBC migration path).
- Full template lifecycle (submit/sync/status), resumable image-header upload, dry-run mode for CI (`WHATSAPP_TEMPLATES_DRY_RUN`).
- Broadcast fan-out with phone-variant retry, per-recipient status, resume-on-failure (`038`).
- Inbound media mirrored to Supabase Storage (`039`).

**Risks / work:**

1. **Onboarding friction.** BYO-WABA means each customer must connect Meta (get `phone_number_id`, permanent token). For non-technical Indian SMBs this is the #1 activation blocker. **Consider (post-MVP):** Meta Embedded Signup / Tech Provider onboarding to reduce this to a few clicks. Big product lever; not required to launch.
2. **Token lifecycle.** System-user permanent tokens are ideal; if any customer uses a short-lived token, you need refresh handling. Verify what the config flow captures.
3. **Cost calculator** (a target feature) needs Meta's per-conversation/per-message pricing table (category × country, India rates). That pricing data lives *outside* the repo — you'll maintain a pricing config. The `accounts.default_currency` (migration `021`) + INR support is a useful hook.
4. **Rate/throughput** — Meta messaging tiers (1K/10K/100K/day) aren't modeled. Broadcasts should respect tier limits; today's fan-out is best-effort. Flag for campaign-hardening milestone.

**Verdict:** **Reuse the entire WhatsApp layer.** It is the most valuable and hardest-to-rebuild part after multi-tenancy, and it aligns perfectly with your no-markup positioning.

---

## 8. AI System Assessment

**Current:** Bring-your-own-key. Each account pastes its own OpenAI/Anthropic key (GCM-encrypted). `src/lib/ai/` has a clean provider abstraction:

- `generate.ts` → `generateReply()` dispatches by `config.provider` to `providers/openai.ts` or `providers/anthropic.ts`.
- `providers/shared.ts` holds `ProviderArgs`, usage normalization, HTTP/network error mapping.
- `types.ts` defines `AiProvider = 'openai' | 'anthropic'`, `AiConfig`, `AiUsage`, `AiError`.
- `usage.ts` logs every call to `ai_usage_log` (account, tokens, mode, provider, model).
- Knowledge base with hybrid retrieval (Postgres FTS + optional pgvector).
- Strong prompt-injection defenses already in `buildSystemPrompt` (customer text treated as untrusted).

**What DeepSeek V4 Flash needs (LOW effort):** DeepSeek exposes an **OpenAI-compatible** Chat Completions API. Adding it is essentially:

1. `providers/deepseek.ts` — near-copy of `openai.ts` with `base_url = https://api.deepseek.com` and DeepSeek model id.
2. Extend `AiProvider` union + `generate.ts` switch + `AI_PROVIDER_DEFAULT_MODEL`.
3. Validation path (`validate.ts`) accepts the new provider.

> ⚠️ **Confirm the exact DeepSeek model id and API contract against current DeepSeek docs before coding** — "V4 Flash" naming should be verified against their live model list; do not hardcode from memory.

**What "platform-provided AI" needs (MEDIUM effort — this is the real work):**

The current design assumes the *tenant* owns the key and the cost. Your SaaS owns the key and meters cost. That flips several assumptions:

1. **Platform key source.** Add a server-side `DEEPSEEK_API_KEY` env (never per-account). Introduce a "platform" mode in `loadAiConfig`/`generate` so the provider call uses the platform key when the account is on a platform AI plan, and the BYO path only for an enterprise "bring your own key" tier.
2. **Quota/entitlement enforcement.** `ai_usage_log` already records spend. Add pre-call quota checks (per plan: N AI actions/month or token budget) via a SECURITY DEFINER helper, and 402/429 responses when exceeded. This is the billing↔AI seam.
3. **Abuse & cost control.** Platform key means *your* money — enforce per-account rate limits (the current in-memory limiter is inadequate on Vercel, §10), max tokens, and per-plan model tiers.
4. **AI campaign writer** — new surface reusing the provider layer: given product/offer/audience → draft campaign copy + template body, score it (§ quality score), estimate cost (§ calculator). This is a *new route + prompt*, not new infrastructure.
5. **Prompt-injection posture** already exists for replies; reuse it for campaign generation.

**Verdict:** The AI **engine is reusable and clean**; DeepSeek is a small adapter. The **business-model flip (BYO → platform-metered)** is the actual effort and is inseparable from billing.

---

## 9. Billing Gap Assessment

**Current state: nothing.** No `subscriptions`, `plans`, `invoices`, `entitlements`, `usage_counters`, or any payment provider. Grep for `stripe|billing|subscription|dodo|razorpay|payment` returns only WhatsApp payment-*permission* policy strings and unrelated "plan" words — **zero billing code**.

**What must be built (net-new, follows existing RLS pattern):**

| Piece | Description |
|---|---|
| **Plan catalog** | Free/Starter/Growth/Agency tiers; monthly platform fee (INR-first). Static config or `plans` table. |
| **`subscriptions` table** | `account_id` FK, plan, status, current-period, Dodo subscription id. RLS: members read, owner/admin manage. |
| **Entitlements** | Per-plan limits: seats, contacts, monthly campaigns, AI actions/tokens, API access, webhooks. SECURITY DEFINER `account_entitlement(account_id, key)` helper. |
| **Usage counters** | Monthly rollups for metered items (campaigns sent, AI tokens). Reuse `ai_usage_log`; add campaign/message counters. |
| **Dodo Payments integration** | Checkout/subscription creation, **webhook** (signature-verified, like the Meta webhook pattern) for `subscription.active/renewed/cancelled/payment_failed` → update `subscriptions`. |
| **Quota gating middleware** | Pre-action checks on campaigns, AI, seats → 402/upgrade prompts. |
| **Billing-owner concept** | The `owner` role already exists; designate it (or `admin`) as the billing manager. |
| **Dunning/grace** | Handle failed payments → grace period → downgrade to read-only, not hard-lock (retention). |

**Risks:**

- **Dodo Payments maturity/geography** — confirm Dodo supports INR subscriptions + the webhook events you need for your regions before committing; keep the provider behind a thin `billing/provider` abstraction (mirror the AI provider abstraction) so Razorpay/Stripe remains a fallback.
- **Webhook idempotency & signature** — reuse the discipline already in `webhook-signature.ts`.
- **Entitlement caching** — read entitlements cheaply (they gate every metered action). Put them behind a SECURITY DEFINER function + short cache, not an N+1 per request.
- **Tax/GST (India)** — invoicing may need GST fields; Dodo (as merchant of record) may handle this — verify.

**Verdict:** Greenfield but **unblocked** — the schema/RLS/webhook patterns to copy already exist in-repo. This is the single biggest net-new build.

---

## 10. Rate Limiting / Serverless State (Deployment-Critical)

`src/lib/rate-limit.ts` is an **in-memory `Map` fixed-window limiter**. Its own header comment states the trade-off explicitly: *"horizontal scale (multiple regions, multiple nodes, **Vercel serverless fan-out**) silently defeats the limit."*

On Vercel, each serverless invocation may be a fresh instance → the limiter is effectively **absent** in production. This matters more once AI runs on the **platform key** (your money) and once billing quotas exist.

**Action:** Replace the `check` implementation with a distributed store (Upstash Redis is the standard Vercel pairing) keeping the same `RateLimitResult` shape — call sites don't change. Do this as part of the deployment milestone, **before** platform AI ships.

---

## 11. UI/UX Redesign Assessment

**Current:** Functional shadcn/ui + Tailwind v4 + Base UI + Lucide + Recharts/Tremor. Clean, but "developer template" tier — not the premium CRM feel you're targeting.

**Reusable:** The component primitives (`src/components/ui`), the layout shell, dnd-kit Kanban, xyflow builder, Recharts. Good bones.

**Redesign targets (premium CRM direction):**

- Shared inbox (the daily-driver screen — invest most here)
- Campaign dashboard + campaign builder
- **New:** cost calculator UI, quality-score UI, AI campaign editor
- Onboarding/WhatsApp-connect flow (activation-critical for SMBs)
- Billing/upgrade screens
- Dashboard/analytics polish

**Approach:** This is a design-system pass, not a rebuild. Establish tokens/theme first (there are `design`, `frontend-design`, `ui-ux-pro-max`, `design-system` skills available), then restyle screen-by-screen. Keep the working data/logic layer untouched underneath.

**India-first UI:** Hindi locale (add to `next-intl`), INR formatting, IST, WhatsApp-familiar visual language (SMBs live in WhatsApp — lean into it).

---

## 12. Deployment Gap Assessment

**Current posture: Hostinger self-host.** README is Hostinger-centric (referral links, hPanel env instructions), `next.config.ts` has Hostinger-CDN-specific `Cache-Control` tuning and `output: standalone` (for Docker).

**Moving to Vercel:**

| Item | Current | Action for Vercel |
|---|---|---|
| Hosting | Hostinger Node / Docker | Vercel (native Next 16 support) |
| `output: standalone` | Set (for Docker) | Harmless on Vercel; can keep or drop |
| Cache-Control headers | Tuned for Hostinger LiteSpeed CDN | Re-validate; Vercel edge caching differs. The `s-maxage`/`swr` logic is defensive and should be reviewed, not blindly kept |
| Rate limiter | In-memory | **Must** move to Upstash/Redis (§10) |
| Env management | hPanel | Vercel env vars + preview/prod separation |
| Cron (`/api/automations/cron`, `/api/flows/cron`) | External pinger + `AUTOMATION_CRON_SECRET` | **Vercel Cron** (native) — wire to the existing secret-protected endpoints |
| Webhook HTTPS | Hostinger free SSL | Vercel provides HTTPS; point Meta webhook at the Vercel domain |
| Background work | `after()` used in broadcast core | Vercel function duration limits — verify long broadcasts fit or move to a queue/cron drain |
| CSP | `Report-Only` | Fine to keep report-only initially; tighten later |
| Monitoring | None | Add **Sentry** (errors) + **PostHog** (product analytics) |
| Email | None | Add **Resend** (invites, billing receipts, dunning) |

**Vercel-specific risks:**

- **Function timeouts on broadcast fan-out** — `deliverBroadcast()` runs after ack; large campaigns may exceed serverless limits. Prefer a **cron-drained queue** (the pattern already exists for automation waits) over a single long `after()` on Vercel.
- **Realtime** is Supabase-hosted, not Vercel — unaffected, good.
- **Cold starts** — acceptable for a dashboard SaaS.

---

## 13. Recommended Milestone Plan (M00B onward)

> Sequenced so revenue-enabling and safety work lands before you spend the platform's own AI money at scale. Each milestone should keep all 4 baseline checks green.

- **M00B — Fork hygiene & foundation** *(no product change)*
  Rebrand (README, package name, remove Hostinger refs), set up Vercel project + envs, add Sentry + PostHog + Resend SDKs (wired but minimal), CI on Vercel previews. Add Hindi locale scaffold + INR default. *Deliverable: deploys clean on Vercel, monitored.*

- **M01 — Deployment hardening**
  Replace in-memory rate limiter with Upstash Redis. Move crons to Vercel Cron. Re-validate cache headers + broadcast fan-out against serverless limits (introduce cron-drained broadcast queue if needed). *Deliverable: production-safe on Vercel.*

- **M02 — Billing core (Dodo Payments)**
  Plans/entitlements/subscriptions/usage schema (migrations, RLS pattern reused). `billing/provider` abstraction + Dodo adapter. Signature-verified Dodo webhook. Signup seeds free plan. Quota-gating helper (SECURITY DEFINER). Billing/upgrade UI. *Deliverable: users can subscribe; entitlements enforced.*

- **M03 — Platform AI (DeepSeek) + metering**
  DeepSeek provider adapter. Platform-key mode alongside BYO. Wire `ai_usage_log` → quota enforcement. Per-plan model/token tiers. *Deliverable: AI works without user keys, metered to plan.*

- **M04 — Campaign economics suite**
  AI campaign writer (new surface on provider layer), campaign cost calculator (Meta pricing config, India rates), campaign quality score. *Deliverable: the differentiated features vs generic tools.*

- **M05 — Premium UI redesign**
  Design tokens/theme, then restyle inbox → campaigns → calculator/AI editor → onboarding → billing. *Deliverable: premium CRM feel.*

- **M06 — Onboarding & activation**
  Streamline WhatsApp connect (evaluate Meta Embedded Signup), guided first-campaign, India-localized copy. *Deliverable: non-technical SMB can self-onboard.*

- **M07 — Scale & polish**
  Meta throughput tiers in broadcasts, dunning/grace flows, Flows/Automations consolidation decision, cross-tenant security review (realtime RLS, entitlement helpers). *Deliverable: launch-ready.*

---

## 14. Drizzle Recommendation — **AVOID NOW, revisit narrowly later**

**Recommendation: Do NOT introduce Drizzle in this fork right now. Keep raw SQL migrations + `supabase-js` (PostgREST) + RLS.**

**Why (this is a fork-specific judgment, not a general anti-Drizzle stance):**

1. **The security model is RLS-via-PostgREST.** Every read/write goes through `supabase-js` carrying the user's JWT, and RLS (`is_account_member`) enforces tenancy in the database. This is the app's primary tenant-isolation guarantee.
2. **Drizzle talks to Postgres over a direct connection**, typically as a privileged role, **bypassing PostgREST and therefore bypassing RLS** unless you very carefully set `request.jwt.claims` / `SET ROLE` per request. Introducing Drizzle for tenant-facing queries would create a **second data path that does not inherit the RLS protections** the whole app depends on — a serious multi-tenant leak risk for marginal benefit.
3. **You'd run two schema sources of truth** — 39 disciplined, idempotent SQL migrations *and* Drizzle schema/kit — inviting drift. The existing migrations are a strength; don't dilute them.
4. **Cost/benefit is poor at this stage.** Drizzle's main win is typed queries + migration authoring. You already have generated types available from Supabase and a working migration convention. The conversion's hard problems (billing, platform AI, UI) are **not** ORM problems.

**When Drizzle *could* earn its place (narrow, later):**

- For **service-role backend jobs where RLS bypass is intentional** — e.g. the billing engine, usage rollups, Dodo webhook processing — running as a trusted server with a dedicated connection. There, a typed query builder is genuinely nice and the RLS-bypass is by-design (not a leak). If you adopt it, **scope it to `src/lib/billing` / background workers only**, never for tenant-facing dashboard reads, and keep SQL migrations as the single schema source (use `drizzle-kit introspect`, don't let Drizzle own DDL).
- Decision point: **M02+ (billing)**, and even then optional. Default to `supabase-js` with the service-role client, which already works.

**Bottom line:** The migration risk Drizzle would introduce (RLS-bypassing second data path + dual schema truth) **outweighs its benefit** for this codebase. Revisit only for isolated service-role/billing internals, later.

---

## 15. Top Risks — Consolidated

| # | Risk | Severity | Where | Mitigation |
|---|---|---|---|---|
| 1 | In-memory rate limiter defeated on Vercel serverless | **High** | `src/lib/rate-limit.ts` | Move to Upstash Redis before platform AI (M01) |
| 2 | No billing = no revenue + no quota enforcement | **High** | (absent) | M02, reuse RLS/webhook patterns |
| 3 | Platform AI spends *your* money without quota gating | **High** | AI + billing seam | Quota checks + rate limits before M03 ships |
| 4 | Broadcast fan-out may exceed Vercel function limits | **Med-High** | `broadcast-core.ts` `after()` | Cron-drained queue (M01) |
| 5 | Drizzle would create an RLS-bypassing second data path | **High (if adopted)** | data layer | **Don't adopt now** (§14) |
| 6 | Legacy `user_id` columns invite mis-scoped new queries | **Medium** | domain tables | Review rule + test asserting `account_id`+RLS on new tables |
| 7 | WhatsApp onboarding friction for non-technical SMBs | **Medium** | config flow | Evaluate Meta Embedded Signup (M06) |
| 8 | Dodo Payments geo/feature/GST fit unverified | **Medium** | (new) | Verify INR + webhook events; keep provider abstraction |
| 9 | DeepSeek "V4 Flash" model id/API unverified vs live docs | **Low-Med** | AI adapter | Confirm against DeepSeek docs before coding |
| 10 | Cache-Control tuned for Hostinger CDN, not Vercel | **Low** | `next.config.ts` | Re-validate on Vercel (M01) |

---

## 16. Next Milestone Prompt (after this audit)

> **When you approve, the next milestone is M00B — Fork hygiene & foundation.** Suggested kickoff prompt:
>
> *"Proceed with M00B. Rebrand the fork off WACRM/Hostinger: update `package.json` name/description/author/homepage, rewrite `README.md` for the hosted SaaS (remove Hostinger referral content), and strip Hostinger-specific framing from docs. Set up the Vercel deployment posture: add `vercel.json` if needed, document required env vars, and add Sentry, PostHog, and Resend as installed-but-minimal integrations behind env flags (no product behavior yet). Scaffold a Hindi (`hi`) locale in `next-intl` and make INR the default currency for new accounts. Keep all four baseline checks (typecheck, lint, test, build) green, and add no billing or AI changes yet — those are M02/M03. Produce a short M00B completion report."*

---

## Appendix A — Baseline Command Results (captured this audit)

```
npm run typecheck   → exit 0 (tsc --noEmit, clean)
npm run lint        → exit 0 (0 errors, 37 warnings: react-hooks/exhaustive-deps + unused vars)
npm run test        → exit 0 (Test Files 79 passed / Tests 825 passed, ~7.1s, vitest 4.1.10)
npm run build       → exit 0 (Next 16 build, all routes compiled, output: standalone)
```

## Appendix B — Migration Ledger (39 files)

`001` initial schema · `002` pipelines · `003` broadcast wamid · `004` contact delete set-null · `005` broadcast counts · `006`–`007` automations · `008` avatars storage · `009` message actions · `010` flows · `011` beta features · `012` flows counter · `013` wa phone unique · `014` template Meta integration · `015` wa registration · `016` flow media · **`017` account sharing (multi-tenancy)** · `018` member RPCs · `019` invitation RPCs · `020` sharing follow-ups · `021` account default currency · `022` contact phone dedup · `023` chat media · `024` member presence · `025` filter contacts by tags · `026` API keys · `027` notifications · `028` webhook endpoints · `029`–`034` AI reply + knowledge · `035` interactive messages · `036` conversation/contact dedup · `037` webhook/broadcast reliability · `038` broadcast resume · `039` inbound media mirror.

*End of audit. No product code was modified. Awaiting approval to proceed to M00B.*
