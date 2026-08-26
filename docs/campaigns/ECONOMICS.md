# Campaign economics — cost calculator, quality score, AI writer

Implemented in milestone **M04**. The first customer-visible SaaS
differentiation: transparent WhatsApp cost estimates, a deterministic
campaign quality score, and an AI campaign writer with Hindi/Hinglish
support. All additive — no changes to send/webhook behavior, and **no
database migration**.

## 1. Cost calculator

- `src/lib/campaigns/cost.ts` — pure, deterministic `estimateCampaignCost`.
- `src/lib/campaigns/meta-rate-card.ts` — **editable/versioned** rate card.
- API: `POST /api/campaigns/estimate` (auth; never sends, never calls Meta).

**Inputs:** category (marketing/utility/authentication, or an app template
category), recipients, and optional country, deliveryRate,
platformMarkupPct, taxPct.

**Outputs:** `meta_cost`, `platform_markup`, `tax`, `estimated_total`,
`cost_per_recipient`, `billable_messages`, `rate_per_message`, `currency`,
plus `effective_from`, `source`, `verified`, and a `warning`.

**No-markup positioning.** `platformMarkupPct` defaults to **0**: the
customer's messages bill against their own WhatsApp account at Meta's
rates, and we show that number honestly. The markup field exists for
flexibility but is off by default — the transparent-pricing promise.

### ⚠️ Meta pricing is NOT hardcoded truth

Meta's WhatsApp pricing changes over time and by country. The rate card
carries `source`, `effective_from`, and `verified: false`, and every
estimate returns a **verification warning**. The India defaults shipped in
M04 are:

| Category | INR / message |
|---|---|
| marketing | 0.8631 |
| utility | 0.1150 |
| authentication | 0.1150 |
| service | 0 (not estimated in MVP) |

`country: IN`, `currency: INR`, `effective_from: 2026-07-01`,
`verified: false`.

**These MUST be confirmed against Meta's current official India rate card
before production.** To update: add/replace a card in `meta-rate-card.ts`,
bump `effective_from`, cite the `source`, and flip `verified: true` only
after checking. **Tests validate the calculator math and behavior, never
that these specific rates are permanently correct** (the rate card is
injectable in tests).

## 2. Quality score (deterministic)

- `src/lib/campaigns/quality.ts` — pure `scoreCampaign`, 0–100 + grade
  (A–F) + `risk_level` + issues + improvements + metrics.
- API: `POST /api/campaigns/quality` (auth, no AI, no spend).

**Factors:** length (min / Meta 1024 limit / long), clear CTA (button or
text), variable sanity (adjacent `{{1}}{{2}}` and variable-only bodies —
both Meta-rejected), personalization, emoji overload, ALL-CAPS ratio,
URL/phone overload, spam trigger words, and marketing opt-out language.

Deterministic by design: same input → same output, instant, unit-tested
across strong / spammy / too-long / variable-heavy / empty cases.

**AI-augmented suggestions are a documented follow-up, not in M04.** If
added, they would run through the M03 platform runtime and consume
`ai_monthly_credits_limit` (402 on exceed) — the deterministic score is
sufficient and free, so AI is never called by default.

## 3. AI campaign writer (+ Hindi/Hinglish)

- `src/lib/ai/campaign.ts` — pure prompt builder + defensive output parser.
- API: `POST /api/ai/campaign` (agent+).

Runs entirely on the **M03 AI path**: `resolveAiRuntime` (platform DeepSeek
or BYO), and **platform calls consume 1 AI credit before the provider
call** (402 upgrade-required on exceed), exactly like `/api/ai/draft`. BYO
callers pay their own provider and aren't metered.

**Inputs:** business_type, audience, offer, campaign_goal, tone, `language`
(`en` | `hi` | `hinglish`), optional existing_draft, optional
template_category. **Outputs:** `message`, `short_version`,
`cta_suggestions[]`, `variable_suggestions[]`, `compliance_notes[]`.

**Hindi/Hinglish is a MODE, not a separate feature** — the `language`
field: `hi` → Devanagari, `hinglish` → Roman-script conversational
Hindi/English mix (how Indian sellers actually message).

## 4. Privacy & human-review rule

- **Never auto-sends.** The writer returns a draft the user must review
  before using; the quality/cost endpoints are read-only.
- **Prompt-injection hardened:** the business brief is treated as untrusted
  data, never as instructions (mirrors the reply assistant).
- **No new content persistence.** Usage is logged via the existing
  `logAiUsage` (provider/model/tokens under the `draft` mode) — no prompts
  or generated copy are stored. Credits are metered in `usage_counters`
  (M02).

## 5. UI (minimal)

A read-only **cost + quality card** (`CampaignInsights`) is shown on the
broadcast review step (step 4), reusing the template + recipient count
already in scope. It calls the two deterministic endpoints; it never sends
or mutates wizard state. The AI writer's UI (a "Write/improve with AI"
composer) and a fuller campaign-economics surface are **deferred to M05**
(premium UI); the API is ready.

## 6. Known limitations / follow-ups

- **Meta India rates unverified** (see §1) — the top pre-production item.
- **Coarse AI metering** (1 request = 1 credit) — inherited from M03.
- **Deterministic quality only** — AI-augmented review deferred.
- **AI writer UI deferred to M05** — endpoint exists and is metered.
- Service-window replies aren't priced (MVP).
- The spam-word / CTA lists are heuristics, not Meta's actual classifier —
  guidance, not a guarantee of approval.
