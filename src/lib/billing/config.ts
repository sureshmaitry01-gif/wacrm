import type { PlanId } from './plans'

// ============================================================
// Billing environment/config resolution.
//
// Product ids live in env (never hardcoded in business logic) so the same
// build works against Dodo test and live mode, and so rotating a product
// doesn't need a code change.
// ============================================================

export type DodoEnvironment = 'test' | 'live'

/** Dodo API base URL per environment. Overridable with `DODO_API_BASE_URL`
 *  so a sandbox/proxy host can be pointed at without a code change. */
export function dodoApiBaseUrl(): string {
  const override = process.env.DODO_API_BASE_URL
  if (override) return override.replace(/\/$/, '')
  return dodoEnvironment() === 'live'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com'
}

export function dodoEnvironment(): DodoEnvironment {
  return process.env.DODO_ENVIRONMENT === 'live' ? 'live' : 'test'
}

export function dodoApiKey(): string | null {
  return process.env.DODO_API_KEY || null
}

/**
 * Billing country (ISO 3166-1 alpha-2) sent as `billing.country` on
 * checkout. Dodo's `POST /subscriptions` requires a billing address with a
 * country (verified against the official API reference, 2026-08-28).
 *
 * ⚠️ EXPLICIT BETA LIMITATION — this is NOT a real customer-country
 * solution. The data model stores no billing country anywhere: `accounts`
 * has no country column, and `accounts.default_currency` is a
 * deals-display setting that defaults to 'USD', so inferring a country
 * from it would be wrong. Guessing from a phone number would also be
 * wrong.
 *
 * So the country is an explicit, operator-set deployment value —
 * `DODO_BILLING_COUNTRY`, defaulting to `IN` for the India-first beta.
 * A deployment selling outside its configured country MUST either set
 * this var or (properly) collect a per-account billing country first.
 *
 * Long-term fix (tracked, not in M07A): collect the billing country from
 * the customer — either by storing it on the account, or by moving to
 * Dodo's Checkout Sessions API, which collects the billing address during
 * checkout. See docs/billing/DODO.md.
 */
export function dodoBillingCountry(): string {
  const raw = process.env.DODO_BILLING_COUNTRY?.trim().toUpperCase()
  return raw && /^[A-Z]{2}$/.test(raw) ? raw : 'IN'
}

export function dodoWebhookSecret(): string | null {
  return process.env.DODO_WEBHOOK_SECRET || null
}

/**
 * Paid plan → Dodo product id, from env. Unset entries simply mean that
 * plan isn't purchasable yet (checkout returns a clear error), which keeps
 * local dev and partial rollouts working.
 *
 * `free` has no product (nothing to buy); `enterprise` is sales-led.
 */
export function dodoProductIdFor(planId: PlanId): string | null {
  switch (planId) {
    case 'starter':
      return process.env.DODO_STARTER_PRODUCT_ID || null
    case 'growth':
      return process.env.DODO_GROWTH_PRODUCT_ID || null
    case 'agency':
      return process.env.DODO_AGENCY_PRODUCT_ID || null
    default:
      return null
  }
}

/** Reverse lookup: Dodo product id → our plan id. Used to derive the plan
 *  from a webhook that only carries the product. */
export function planIdForDodoProduct(productId: string | null): PlanId | null {
  if (!productId) return null
  if (productId === process.env.DODO_STARTER_PRODUCT_ID) return 'starter'
  if (productId === process.env.DODO_GROWTH_PRODUCT_ID) return 'growth'
  if (productId === process.env.DODO_AGENCY_PRODUCT_ID) return 'agency'
  return null
}

/** True when the Dodo adapter has enough to make API calls. Checkout and
 *  subscription reads no-op (clear error) when false; the rest of the app
 *  keeps working, so local dev needs no Dodo account. */
export function isDodoConfigured(): boolean {
  return Boolean(dodoApiKey())
}
