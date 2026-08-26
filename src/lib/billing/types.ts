import type { PlanId } from './plans'

// ============================================================
// Shared billing types + the provider abstraction.
//
// One small provider-agnostic surface (mirrors src/lib/ai) so routes talk
// to `getBillingProvider()` without caring that the backend is Dodo. A
// second provider (Razorpay/Stripe) would be another adapter behind the
// same interface.
// ============================================================

/** Local subscription status. Superset of Dodo's, plus our 'trialing'.
 *  Mirrors the CHECK on `subscriptions.status` in migration 040. */
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'on_hold'
  | 'canceled'
  | 'expired'
  | 'failed'
  | 'incomplete'

/** A checkout/subscription session the UI redirects the customer to. */
export interface CheckoutSession {
  /** Hosted URL to send the customer to. */
  url: string
  /** Provider's id for the session, when it returns one. */
  id?: string
}

export interface CreateCheckoutArgs {
  accountId: string
  planId: PlanId
  /** Provider product/price id for the plan (resolved from config). */
  productId: string
  /** Where the customer returns after success/cancel. */
  successUrl: string
  cancelUrl: string
  /** Optional customer email to prefill / attach. */
  email?: string | null
}

/** Normalized shape of a subscription read back from the provider. */
export interface ProviderSubscription {
  providerSubscriptionId: string
  providerCustomerId: string | null
  status: SubscriptionStatus
  planId: PlanId | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

/** A provider webhook mapped onto our domain. `null` planId/status means
 *  "not derivable from this event" — the handler leaves those fields
 *  unchanged. */
export interface NormalizedWebhookEvent {
  /** Provider's unique event id — used for idempotency. */
  id: string
  /** Raw provider event type (e.g. 'subscription.active'). */
  type: string
  /** The subscription status this event implies, if any. */
  status: SubscriptionStatus | null
  /** account_id carried in event metadata, if the provider echoes it. */
  accountId: string | null
  providerSubscriptionId: string | null
  providerCustomerId: string | null
  planId: PlanId | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean | null
  /** True when we don't recognize the type — store + ack, don't act. */
  unknown: boolean
}

/** Result of verifying a webhook signature. */
export interface WebhookVerification {
  valid: boolean
  reason?: string
}

/** The provider-agnostic billing interface. */
export interface BillingProvider {
  readonly name: string
  /** True when the provider has the credentials it needs to make calls. */
  isConfigured(): boolean
  createCheckoutSession(args: CreateCheckoutArgs): Promise<CheckoutSession>
  getSubscription(providerSubscriptionId: string): Promise<ProviderSubscription>
  verifyWebhookSignature(
    rawBody: string,
    headers: Headers,
  ): WebhookVerification
  mapWebhookEvent(rawBody: string): NormalizedWebhookEvent
}

/** Thrown by adapters on a caller-visible failure; routes map it. */
export class BillingError extends Error {
  readonly code: string
  readonly status: number
  constructor(message: string, opts: { code?: string; status?: number } = {}) {
    super(message)
    this.name = 'BillingError'
    this.code = opts.code ?? 'billing_error'
    this.status = opts.status ?? 502
  }
}
