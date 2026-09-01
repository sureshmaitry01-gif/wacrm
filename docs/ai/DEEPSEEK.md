# Platform AI — DeepSeek + metering

Implemented in milestone **M03**. Converts the AI system from primarily
bring-your-own-key (BYO) into a hosted platform-AI foundation on **DeepSeek
V4 Flash**, metered against the M02 plan entitlements. BYO
(OpenAI/Anthropic) still works, unchanged.

> Scope note: this milestone wires **platform AI + quota metering only**.
> The AI campaign writer, campaign quality score, cost calculator, and
> Hindi/Hinglish rewrite are **M04**, not M03.

## 1. Provider abstraction

DeepSeek is a new adapter behind the existing `src/lib/ai` abstraction —
nothing outside the adapter and the runtime resolver changed shape.

- `providers/deepseek.ts` — OpenAI-compatible Chat Completions adapter.
  Kept separate from the OpenAI adapter (it uses `max_tokens` and a
  configurable base URL) so it can't perturb the BYO OpenAI path or tests.
- `generate.ts` — dispatches `provider: 'deepseek'` to it.
- `types.ts` — `AiProvider` now includes `'deepseek'`.
- `defaults.ts` — catalog default `deepseek-v4-flash`.

## 2. Platform vs BYO selection

One resolver decides per account/request — `src/lib/ai/runtime.ts`:

```
resolveAiRuntime(db, accountId):
  1. active BYO ai_configs row      → { mode: 'byok',     config }
  2. else DEEPSEEK_API_KEY present   → { mode: 'platform', config }  (DeepSeek)
  3. else                           → null  (AI unavailable)
```

- **Platform-first for normal users:** an account that never configures a
  BYO key automatically gets platform DeepSeek.
- **BYO is the escape hatch:** an account that pastes and activates its own
  OpenAI/Anthropic key keeps using it (enterprise / self-host / advanced).
- **Only `platform` mode is metered.** BYO callers pay their own provider
  directly, so they are not charged AI credits.

`platform.ts` builds the platform `AiConfig` from env (server-side key,
never client-exposed). Auto-reply defaults **off** for platform configs
(there is no per-account platform auto-reply settings surface yet — see §7).

## 3. Quota / metering

Platform AI consumes **1 AI credit per request** from the plan's
`ai_monthly_credits_limit`, via the M02 `consumeQuota` helper (atomic
`consume_quota` RPC + `usage_counters`). **No new metering table** was
needed.

- **Draft path** (`POST /api/ai/draft`, user-triggered): consume before the
  provider call. On exceed → **402** `upgrade_required` (drives the UI to
  the billing page). BYO mode → no metering.
- **Auto-reply path** (background): consume before the provider call. On
  exceed → **skip safely** and leave the inbound for a human — never a
  customer-facing error.

`consumeQuota` **fails open** (a DB/RPC error allows the call) — a metering
outage must not break the product; the M01 Upstash rate limits plus the
plan quota are the two independent caps on platform spend.

> **Metering granularity is intentionally coarse for now: 1 request = 1
> credit.** Token-based metering (weighting by `ai_usage_log` token counts)
> is a documented follow-up; the plumbing (`usage_counters`, `ai_usage_log`)
> already records what's needed to switch later.

## 4. Usage logging

Platform (and BYO) calls are logged to `ai_usage_log` via the existing
`logAiUsage` — `account_id`, `conversation_id`, `mode` (`draft` /
`auto_reply`), `provider` (`deepseek`), `model`, and token counts. Logging
is best-effort and never blocks the reply.

Migration **`041_ai_usage_deepseek_provider.sql`** relaxes the
`ai_usage_log.provider` CHECK to allow `'deepseek'` — **the only schema
change M03 needs.** The credit ledger itself is `usage_counters` (M02).

**Limitation (documented, no migration):** `ai_usage_log` has no `status` /
`error_code` / `feature` / `credits` columns. M03 records provider + model
+ tokens + mode there, and credits in `usage_counters`. Adding richer
per-call status columns is a future enhancement, deferred to avoid an
unnecessary migration.

## 5. Environment

All optional — unset means platform AI is unavailable and accounts fall
back to BYO exactly as before. **Local dev and tests need none of these.**

| Var | Notes |
|---|---|
| `DEEPSEEK_API_KEY` | Server-side platform key. Never client-exposed, never per-account. |
| `DEEPSEEK_MODEL` | Model id; defaults to `deepseek-v4-flash`. |
| `DEEPSEEK_BASE_URL` | OpenAI-compatible host; defaults to `https://api.deepseek.com`. Adapter appends `/chat/completions`. |

## 6. Privacy & cost-control guardrails

- The platform key is **server-side only** — never sent to the client,
  never stored per-account, never logged.
- **No new logging of message content.** The AI paths already send recent
  conversation turns to the model (unchanged); M03 adds no new persistence
  of prompts/responses. `ai_usage_log` stores counts + ids, not content.
- **Two independent spend caps** on the platform key: the per-account /
  per-user **Upstash rate limits** (M01) and the **plan credit quota**
  (this milestone). Neither alone is trusted — a quota bug can't be
  exploited past the rate limit, and vice versa.
- When `DEEPSEEK_API_KEY` is unset, platform AI is a clean no-op (accounts
  use BYO or get "not configured").

## 7. Known limitations / follow-ups

- **No per-account mode toggle.** An account with an active BYO key always
  uses BYO; you can't yet force platform when a BYO key also exists. Needs
  a settings surface + schema (UX follow-up).
- **Platform auto-reply is inert by default** (platform config sets
  `autoReplyEnabled=false`) because there's no per-account platform
  auto-reply configuration (system prompt, cap, handoff target) — those
  live in `ai_configs`, which platform-only accounts don't have. The quota
  path for platform auto-reply is implemented and tested, but only fires
  once such a surface exists.
- **Playground / test-key** routes remain BYO-only (they're advanced
  BYO tools).
- **Coarse metering** (1 request = 1 credit) — token-weighted later.
## Contract verification (M07A)

**Documentation VERIFIED — 2026-08-28.** Against the official DeepSeek API
docs: base URL `https://api.deepseek.com`, `Authorization: Bearer`,
`/chat/completions`, OpenAI-compatible transport, `deepseek-v4-flash` listed
as a current model, `max_tokens` accepted (not deprecated),
`choices[0].message.content` + `usage.{prompt,completion,total}_tokens`, and
401/429 error semantics matching the adapter's mapping. **Zero mismatches —
no code change was required.**

**Runtime VERIFIED — 2026-08-31.** One minimal live request through the
existing adapter (`platformDeepSeekConfig()` → `generateReply()` →
`generateDeepSeek()`):

| | |
|---|---|
| Model | `deepseek-v4-flash` |
| Base URL | `https://api.deepseek.com` |
| Response parsing | **VERIFIED** — returned the exact sentinel `DEEPSEEK_RUNTIME_OK` |
| Usage parsing | **VERIFIED** — 107 prompt / 36 completion / 143 total tokens |
| Env detection | **VERIFIED** — `DEEPSEEK_API_KEY` resolved by the normal Next.js env loader (`@next/env`), no manual sourcing |
| Credentials recorded | **None** — no key value printed, logged, or committed |

The probe test was temporary and deleted after the run. The committed test
suite does not load `.env.local` by design (`vitest.config.ts` pins dummy
secrets so tests match CI), so DeepSeek runtime status is evidenced in
`docs/beta/READINESS.md` §7a rather than by a credential-dependent test.
