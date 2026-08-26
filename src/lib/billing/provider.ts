import { DodoProvider } from './providers/dodo'
import type { BillingProvider } from './types'

// ============================================================
// Billing provider factory.
//
// Mirrors the AI provider abstraction: business logic depends on the
// `BillingProvider` interface, never on Dodo directly, so swapping in
// Razorpay/Stripe later is a new adapter + a branch here.
// ============================================================

let _provider: BillingProvider | null = null

/** The active billing provider. Dodo is the only adapter today. */
export function getBillingProvider(): BillingProvider {
  if (!_provider) _provider = new DodoProvider()
  return _provider
}

/** Test seam — override/reset the cached provider. */
export function __setBillingProviderForTests(p: BillingProvider | null) {
  _provider = p
}
