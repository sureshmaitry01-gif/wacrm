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
