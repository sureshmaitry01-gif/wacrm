# Billing — Dodo Payments + plan entitlements

Implemented in milestone **M02**. This documents the billing architecture,
the Dodo integration, and the **external assumptions that must be verified
before going live**.

> Status: **documentation-verified, NOT runtime-verified.** The contract
> was audited against Dodo's official docs on **2026-08-28** (M07A) and two
> real defects were found and fixed — but no live/test Dodo account has
> been connected, so no real checkout or signed webhook has been exercised.
> See §6.

## 1. Architecture

```
route ──► entitlements.ts ──► subscriptions + entitlements (plan limits)
                └──► consume_quota() RPC ──► usage_counters   (metering)

Dodo ──► /api/billing/webhook ──► dodo_webhook_events (idempotency)
                                     └──► subscriptions (state)
```

- **Plan catalog lives in code** — [`src/lib/billing/plans.ts`](../../src/lib/billing/plans.ts).
  Limits are plain numbers, so changing pricing/limits is a one-line edit
  and a deploy, with no migration.
- **`subscriptions.plan_id`** maps into that catalog.
- **`entitlements`** holds *optional per-account overrides*. A `NULL`
  column inherits the plan value — so a bespoke Enterprise deal needs no
  code change.
- **Provider abstraction** — business logic depends on the
  `BillingProvider` interface ([`types.ts`](../../src/lib/billing/types.ts)),
  never on Dodo directly. Swapping in Razorpay/Stripe = a new adapter +
  a branch in [`provider.ts`](../../src/lib/billing/provider.ts).

## 2. Entitlements & quota gating

`getAccountEntitlements(db, accountId)` resolves, in order:

1. an `entitlements` override row (non-NULL columns), else
2. the plan catalog value for the account's current plan.

**Lapsed subscriptions degrade, they don't lock out.** Statuses outside
`trialing`/`active` fall back to **Free-plan limits** rather than blocking
the account — retention over punishment. The UI still reports the purchased
plan plus the inactive status.

`consumeQuota(db, accountId, metric, amount)` delegates to the
`consume_quota` SQL function so the check and increment happen under one
row lock — concurrent requests can't overshoot a limit the way an
app-side read-then-write would.

**Both helpers fail OPEN.** A DB/RPC error allows the action and logs.
Over-usage is recoverable; falsely blocking a paying customer is not.

Exceeded quota → `upgradeRequiredResponse()` returns **402** with
`{ code: 'upgrade_required', metric, limit, used, plan, upgrade_url }`.

### Proof-of-gating surface (M02 scope)

Only **one** surface is gated so far: `POST /api/whatsapp/broadcast`.

It meters **`monthly_messages_limit` by `recipients.length`**, *not* a
per-call broadcast counter — the campaign wizard fans one campaign out over
this endpoint in batches of ~10 recipients, so counting calls would count
batches, not campaigns. Metering messages is honest under both the wizard
and a direct single API call. The quota is consumed **before** the Meta
fan-out so we never send past the plan.

Gating is deliberately **not** scattered across the app yet — contacts,
team seats, automations, and AI credits reuse the same two helpers when
their milestones arrive.

## 3. Database (migration `040_billing_dodo.sql`)

| Table | Purpose | RLS |
|---|---|---|
| `billing_customers` | account ↔ Dodo customer id | members SELECT; writes service-role |
| `subscriptions` | one row per account: plan, status, period | members SELECT, admin+ UPDATE |
| `entitlements` | optional per-account limit overrides | members SELECT, admin+ UPDATE |
| `dodo_webhook_events` | idempotency + audit (`id` = Dodo event id) | **RLS on, no policies** (service-role only) |
| `usage_counters` | per account/metric/month counters | members SELECT; writes via RPC |

All tenant tables are `account_id`-scoped and use the existing
`is_account_member(account_id, min_role)` helper — identical shape to
`ai_configs` (migration 029). `updated_at` triggers reuse the existing
`update_updated_at_column()`.

**Free-plan seeding** uses a dedicated `AFTER INSERT ON accounts` trigger
(`seed_account_billing`) rather than editing the sensitive
`handle_new_user` signup path — the least invasive route. It is
`EXCEPTION`-guarded so a billing hiccup can never block account creation,
and the migration backfills a free subscription for pre-existing accounts.

## 4. Webhook (`POST /api/billing/webhook`)

Order of operations mirrors the Meta webhook:

1. Read the **raw** body (signature is over raw bytes).
2. **Verify HMAC — fails closed.** No `DODO_WEBHOOK_SECRET` ⇒ every
   request rejected with 401.
3. **Record the event by provider id before mutating anything.** The PK on
   `dodo_webhook_events.id` makes redelivery a no-op (idempotency).
4. Apply the subscription change, if the event implies one.

Handled: `subscription.active`, `.renewed`, `.on_hold`, `.cancelled`,
`.expired`, `.failed`, `.plan_changed`, `.updated`, `payment.succeeded`,
`payment.failed`. **Unknown events are stored and acked**, never crash.

Signature failures return **401** (never ack a forgery). Processing
failures after a *valid* signature return **200** with the error persisted
on the event row — Dodo retries non-2xx, so a poison event would otherwise
loop forever.

**Attribution** prefers `metadata.account_id` (we set it at checkout,
server-side — never trusted from the client), falling back to a lookup by
`dodo_subscription_id` for renewals. Payloads are **scrubbed of PII**
(customer, email, name, phone, address, card) before being stored; secrets
are never logged.

## 5. Configuration

See `.env.local.example`. All Dodo vars are optional — with none set, the
provider reports "not configured", checkout returns a clear 503, plan
limits fall back to Free, and **local dev/tests work normally**.

| Var | Notes |
|---|---|
| `DODO_API_KEY` | Server-side API key |
| `DODO_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |
| `DODO_ENVIRONMENT` | `test` (default) or `live` |
| `DODO_API_BASE_URL` | Optional explicit base-URL override |
| `DODO_STARTER_PRODUCT_ID` / `DODO_GROWTH_PRODUCT_ID` / `DODO_AGENCY_PRODUCT_ID` | Per-plan product ids — never hardcoded in code |

**No SDK dependency.** Dodo publishes an SDK, but everything needed here is
one HMAC verification plus two REST calls. Using `fetch` + `node:crypto`
keeps a payments path free of a transitive dependency tree and off someone
else's release cadence — the same choice the repo already makes for Meta
webhooks.

## 6. Contract verification (M07A — 2026-08-28)

Audited against the **official Dodo documentation** on **2026-08-28**
([webhooks](https://docs.dodopayments.com/developer-resources/webhooks),
[subscription events](https://docs.dodopayments.com/developer-resources/webhooks/intents/subscription),
[POST /subscriptions](https://docs.dodopayments.com/api-reference/subscriptions/post-subscriptions),
[Checkout Sessions](https://docs.dodopayments.com/api-reference/checkout-sessions/create)).
No credentials were available, so **nothing below is runtime-verified**.

### ✅ Documentation-VERIFIED (no code change needed)

- **Base URLs** — `https://test.dodopayments.com` / `https://live.dodopayments.com`.
- **Auth** — `Authorization: Bearer <API key>`.
- **Webhook signature** — Dodo follows the **Standard Webhooks** spec:
  headers `webhook-id` / `webhook-timestamp` / `webhook-signature`, signed
  message `id.timestamp.body`, **base64** HMAC-SHA256. Matches the adapter
  exactly (including the `svix-*` aliases).
- **Idempotency** — `webhook-id` is the documented dedupe key; we use it as
  the `dodo_webhook_events` primary key. Retries: up to **8** attempts with
  exponential backoff.
- **Event names** — `subscription.active` / `.renewed` / `.on_hold` /
  `.cancelled` (British spelling confirmed) / `.expired` / `.failed` /
  `.plan_changed` / `.updated`. Our map handles these, plus the
  `canceled` spelling defensively.
- **INR + Indian recurring** — supported, including an INR e-mandate floor
  (`mandate_min_amount_inr_paise`, default ₹15,000 when unset).
- **`payment_link: true` → `payment_link`** in the response.

### ❌ Two defects FOUND and FIXED in M07A

1. **`billing` was missing.** `POST /subscriptions` **requires** a billing
   address object with a `country`. The adapter never sent one — a real
   checkout would have failed with a 400 on the very first attempt.
2. **`customer` was conditional.** The docs mark `customer` **required**
   (either `customer_id`, or new-customer details where **`email` is
   required** and `name` is optional). The adapter only sent it when an
   email happened to be passed — and the checkout route never passed one,
   so in practice it was **always omitted**.

**Repair (deliberately minimal, legacy endpoint retained):**

- The checkout route now resolves the billing contact **server-side** from
  the authenticated caller's own `profiles` row (email + full name) — never
  from client input — and returns a clear 400 if the profile has no email.
- The adapter now **always** sends `customer: { email, name? }` and
  `billing: { country }`, and **refuses before the network call**
  (`missing_billing_email`) if the contract would be incomplete.
- Pinned by outbound-contract tests in `dodo.test.ts` (no network, no
  credentials).

### ⚠️ Billing country is an explicit BETA LIMITATION

`billing.country` comes from **`DODO_BILLING_COUNTRY`** (default `IN`),
because **the data model stores no billing country**: `accounts` has no
country column, and `accounts.default_currency` is a deals-display setting
defaulting to `USD` — inferring a country from it (or from a phone number)
would be wrong. This is documented as an **India-first beta constraint,
not the long-term solution**.

**Long-term fix:** either collect a per-account billing country, or move to
**Checkout Sessions** (below), which collects the billing address during
checkout.

### 🔭 Why we did NOT migrate to Checkout Sessions yet

`POST /subscriptions` is **deprecated**; Dodo recommends
**`POST /checkouts`** (Checkout Sessions), which needs only `product_cart`
and makes `customer`/`billing_address` optional — collecting them during
checkout, which would remove the country problem entirely.

**Blocker:** our tenant attribution depends on `metadata.account_id` being
echoed back on `subscription.*` lifecycle webhooks. The documentation does
**not state** that metadata attached to a *checkout session* propagates to
the resulting *subscription* or its webhooks. Migrating on that unverified
assumption risks **payments that cannot be attributed to an account**
(customer charged, plan never provisioned). With no test credentials to
prove propagation, the safe choice is to keep the working legacy endpoint
and revisit once a test account exists.

### 🚫 Still BLOCKED — requires test credentials

- **Signed-webhook runtime verification** — no real signed delivery has
  been received or validated end-to-end.
- **Checkout runtime verification** — no test-mode checkout has been
  created; the corrected request shape is documentation-verified only.
- **Checkout Sessions metadata propagation** — must be proven before any
  migration.
- **Merchant capability** (UPI/RuPay availability) and **GST/invoicing**
  obligations depend on account approval.

**Go-live sequence:** connect a Dodo **test** account → create one checkout
→ capture a real signed webhook → diff it against `mapWebhookEvent` →
replay it to prove idempotency → then switch to live.

## 6b. ⚠️ Residual external risks

These remain **assumptions in code**, defensively written but unconfirmed
against a live Dodo account:

1. **Webhook signature scheme.** The adapter implements Standard Webhooks
   (svix-style): headers `webhook-id` / `webhook-timestamp` /
   `webhook-signature` (plus `svix-*` aliases), signing
   `<id>.<timestamp>.<body>` with base64 HMAC-SHA256, secret optionally
   `whsec_`-prefixed base64. **Confirm against a real delivery** in the
   Dodo dashboard before go-live.
2. **Payload field names.** `mapWebhookEvent` accepts several plausible
   spellings (`subscription_id`/`subscriptionId`, `next_billing_date`/
   `current_period_end`, …) and never throws — but the real shapes must be
   verified.
3. **Merchant capability varies by account approval.** Available payment
   methods (UPI, RuPay, cards) depend on your Dodo merchant approval and
   region. Don't assume UPI is live until the dashboard confirms it.
4. **Indian UPI/RuPay subscription mandates have RBI-specific behavior** —
   e-mandate registration, pre-debit notification timing (typically 24h
   before charge), and per-mandate caps. Renewals may settle on a delay
   that differs from card behavior; treat `subscription.renewed` timing as
   provider-driven, not instantaneous.
5. **Checkout request shape** — now documentation-verified and corrected
   (see §6), but still **must be validated in test mode** before go-live.
6. **Currency/tax.** INR pricing and any GST handling (Dodo acts as
   merchant of record in many setups) must be confirmed — this affects
   invoicing obligations.

**Recommended go-live sequence:** connect a Dodo **test** account → run one
real checkout → capture a real webhook delivery → diff it against
`mapWebhookEvent` → adjust field names if needed → then switch to live.

## 7. Not in scope yet

- Dunning / grace-period flows on `payment.failed` (planned M07).
- Proration and mid-cycle plan changes.
- Gating beyond the one broadcast surface.
- Billing UI polish (M05 owns the visual pass).
- A customer billing portal / invoice history.
