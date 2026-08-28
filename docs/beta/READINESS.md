# Beta readiness — security review & launch checklist (M07D)

Authoritative pre-beta status. Every item is **PASS**, **BLOCKED**,
**MANUAL ACTION REQUIRED**, or **DEFERRED / NON-BLOCKING**.

Reviewed at commit `66318f6` (M07C). Database claims below were validated
against a **real local Postgres** (`supabase db reset` from nothing +
`verify-schema.sql` + `rls-smoke.sql`), not by reading SQL.

> **Overall verdict: READY FOR PRIVATE BETA WITH MANUAL BLOCKERS.**
> The code and data layers are in good shape. What stands between here and
> a public beta is **M07A external-contract verification** (DeepSeek, Dodo,
> Meta pricing) plus a handful of console-side actions no repo change can
> perform.

---

## 1. Security

| Item | Status | Evidence / action |
|---|---|---|
| Cross-tenant RLS isolation | **PASS** | `rls-smoke.sql` seeds two accounts via the real signup trigger and proves Tenant B reads 0 of Tenant A's `subscriptions` / `usage_counters` / `dodo_webhook_events`, and exactly 1 of its own. Runs in CI. |
| **`consume_quota` cross-tenant abuse** | **PASS (fixed in 042)** | Was **MEDIUM**: SECURITY DEFINER + granted to `authenticated` + trusted caller-supplied `p_account_id`/`p_limit`. Proven exploitable on the live DB (negative control: victim counter tampered 42 → 47). Migration `042` adds an `is_account_member` check; re-proven blocked (`allowed=false`, counter stays 42) while own-account metering still works. Regression test added to `rls-smoke.sql`. |
| SECURITY DEFINER EXECUTE grants | **PASS** | 22 SECDEF functions audited. Most already had explicit `REVOKE … FROM PUBLIC` (007/012/018/019/022/025/028/030/032/036/037). `042` closes the four that did not: `consume_quota`, `claim_ai_reply_slot`, `is_account_member`, `seed_account_billing`. Asserted in `verify-schema.sql` via `has_function_privilege`. |
| SECURITY DEFINER `search_path` | **PASS** | Every SECDEF function pins `SET search_path = public`. Verified per-definition (initial grep flagged comment lines; each was checked individually). |
| Client-supplied `account_id` (IDOR) | **PASS** | No API route reads `account_id` from body/query/params. Every route derives it server-side from the session via `requireRole` / `getCurrentAccount`. |
| Service-role route scoping | **PASS** | Routes using `supabaseAdmin()` authorize first (`requireRole`) and scope writes with the server-derived `accountId` (spot-checked broadcast resume, quick-replies). |
| Role checks (`owner/admin/agent/viewer`) | **PASS** | `is_account_member(account_id, min_role)` resolves `auth.uid()` internally — membership cannot be spoofed by argument. |
| Meta webhook auth | **PASS** | HMAC-SHA256 over the raw body, `timingSafeEqual`, **fails closed** when `META_APP_SECRET` is unset. |
| Dodo webhook auth | **PASS (code)** / see M07A | Standard-Webhooks HMAC + `svix-*` aliases, idempotency via `dodo_webhook_events` PK. *Signature scheme itself is an M07A contract item.* |
| Cron auth | **PASS** | Shared secret, constant-time compare, accepts `x-cron-secret` or Vercel's `Authorization: Bearer`; returns 503 when no secret is provisioned (fails closed). |
| Secret handling | **PASS** | `NEXT_PUBLIC_*` contains only genuinely public values (Supabase URL/anon key, PostHog project key, locale, site URL). No server secret referenced in any client component (the one `ENCRYPTION_KEY` hit is a code comment). Tokens stored AES-256-GCM. |
| Secret / payload logging | **PASS** | Webhooks log metadata only. Dodo events persist `safePayload()` — customer/billing/email/name/phone/card/address stripped. No raw bodies logged. |
| Observability PII | **PASS** | `sendDefaultPii: false`; shared denylist (`redact.ts`) applied to **both** PostHog props and Sentry `extra`; server-side only, no browser SDK. Covered by tests. |
| CSP | **DEFERRED / NON-BLOCKING** | Stays `Report-Only` — see §4. |

**Findings by severity:** Critical 0 · High 0 · **Medium 1** (`consume_quota`,
fixed + proven) · **Low 1** (default PUBLIC EXECUTE, fixed) · Informational 2
(trigger-only functions left as-is; `entitlements` override table can
supersede free-plan limits for comped accounts — by design).

## 2. Data & infrastructure

| Item | Status | Evidence / action |
|---|---|---|
| Migration replay from nothing | **PASS** | All 42 migrations applied in order against a clean Postgres 17, twice. |
| Schema verification | **PASS** | `verify-schema.sql` asserts billing tables + RLS-enabled + `consume_quota` + seed trigger + 041 CHECK + the new 042 grants. |
| Cross-tenant RLS smoke test | **PASS** | Passes; re-runnable without a reset (self-cleaning). |
| Migration idempotency | **PASS** | Second full reset + both CI files pass identically; `042` re-applies cleanly. |
| CI migration check | **PASS (workflow)** | `migrations.yml` runs replay + both SQL checks on PR and push for `supabase/**`; failures fail the job. |
| CI as a **required** check | **MANUAL ACTION REQUIRED** | Cannot be verified or set from inside the repo (`gh` unauthenticated here). **Action:** GitHub → Settings → Branches/Rulesets → require the `Migrations / Apply to a clean database` check on `main`. **Note:** the workflow's `paths:` filters must be dropped first, or a required check that never runs will block every non-SQL PR (documented in the workflow header). |
| Backup / recovery posture | **MANUAL ACTION REQUIRED** | Not documented in-repo. Confirm Supabase PITR/backup tier on the production project before beta. |

## 3. Product

| Area | Status |
|---|---|
| Auth / signup / onboarding checklist | **PASS** (M06) |
| WhatsApp connect | **PASS (code)** — activation friction is a known UX risk; Embedded Signup deferred |
| Contacts / templates / broadcasts / inbox | **PASS** |
| AI campaign writer (en / हिंदी / Hinglish) | **PASS (code)** — model contract is M07A |
| Billing + dunning UI | **PASS (code)** — provider contract is M07A |
| Analytics / monitoring | **PASS** (M07C, server-side, no-op unless configured) |

## 4. CSP decision — keep `Report-Only`

**Status: DEFERRED / NON-BLOCKING (deliberate).**

The current directives already match real browser behavior: `style-src
'unsafe-inline'` (27 files use inline `style={{}}`), `img-src https: data:
blob:`, `media-src blob: + supabase`, `connect-src 'self' + supabase
https/wss`. M07C kept Sentry and PostHog **server-side**, so no new browser
origin is required. External URLs (`wa.me`, `developers.facebook.com`,
`github.com`) and the Dodo checkout are **top-level navigations**, which CSP
`connect-src`/`form-action` do not govern.

Enforcement is nonetheless **not flipped**, because the repo's own gate has
not been met: the header comment requires "*two deploys and a pass on every
route*" with a clean violation report. No production deployment has happened
yet, so flipping now would be speculative — exactly what M07D forbids.
**Action before/at public beta:** deploy, collect Report-Only violations
across all routes, then flip the key to `Content-Security-Policy`.

## 5. Hindi localization — go/no-go

**Decision: English-only UI for beta. Hindi/Hinglish AI *writing* ships.**

- The AI campaign writer generates in **English, हिंदी (Devanagari), and
  Hinglish** — the India-first value is real and shipping.
- The **interface** is English. Locale is a single deploy-wide
  `NEXT_PUBLIC_APP_LOCALE`; there is no per-user switcher and no `hi.json`.
- Verified that **no user-facing copy promises a Hindi UI** — every
  Hindi/Hinglish string is scoped to AI message generation (e.g. onboarding
  says "Write a message with AI in English, हिंदी, or Hinglish").
- Full UI localization (translate `en.json`, add a per-user switcher +
  persistence, add `hi` to the parity test) is a **separate milestone** —
  too large and too low-value for beta.

## 6. Operations — pre-launch actions

| Item | Status |
|---|---|
| Vercel project + env vars (prod/preview split) | **MANUAL ACTION REQUIRED** |
| Supabase production project + apply migrations 001–042 | **MANUAL ACTION REQUIRED** |
| `CRON_SECRET` set so Vercel Cron authorizes | **MANUAL ACTION REQUIRED** |
| Upstash Redis (distributed rate limiting) | **MANUAL ACTION REQUIRED** — in-memory fallback is ineffective across serverless instances |
| Sentry DSN / PostHog key | **MANUAL ACTION REQUIRED** (no-op until set) |
| Dodo product ids + webhook endpoint (test → live) | **BLOCKED on M07A** |
| DeepSeek API key + model id | **BLOCKED on M07A** |
| Meta WhatsApp production number + webhook URL | **MANUAL ACTION REQUIRED** |
| Alerting (Sentry rules / uptime) | **DEFERRED / NON-BLOCKING** |

## 7. External-contract blockers (M07A — NOT verified)

**None of these may be marked PASS without real evidence.**

| Contract | Status |
|---|---|
| **DeepSeek** — model id (`deepseek-v4-flash`), base URL, `max_tokens` shape | **BLOCKED** — unverified against live docs/key |
| **Dodo** — webhook header/scheme + field names, INR subscription support, event names | **BLOCKED** — adapter is defensive but unverified against a real delivery |
| **Meta India rate card** — marketing 0.8631 / utility 0.115 / auth 0.115 INR | **BLOCKED** — `verified: false` in `meta-rate-card.ts`; every estimate carries a warning |

## 8. Remaining blockers before **public** beta

1. **M07A contract verification** (all three above).
2. **Upstash + monitoring configured** in production.
3. **Migrations applied** to the production Supabase project.
4. **CSP enforcement** after a clean Report-Only pass.
5. **Required-check + backup posture** confirmed in the GitHub/Supabase consoles.

A **private/invite beta** can proceed before 1–5 provided billing stays in
Dodo test mode and AI is either disabled or run on a verified key.
